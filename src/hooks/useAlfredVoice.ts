"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getConnectGreetingText } from "@/lib/voice/alfred-system-prompt";
import { hydrateWellnessFromServer } from "@/lib/wellness/clientSync";

export type AlfredVoiceState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

const MUTATION_TOOLS = new Set([
  "add_todo",
  "complete_todo",
  "log_peptide_taken",
  "log_meal_eaten",
  "log_workout_complete",
  "log_cardio_complete",
  "update_day_note",
  "update_section_note",
]);

function waitForIceGathering(pc: RTCPeerConnection) {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise<void>((resolve) => {
    const check = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", check);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", check);
    setTimeout(resolve, 2000);
  });
}

function waitForVoiceLink(
  pc: RTCPeerConnection,
  dc: RTCDataChannel,
  timeoutMs = 20000
) {
  if (dc.readyState === "open") return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    let settled = false;

    const finish = (ok: boolean, message?: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (ok) resolve();
      else reject(new Error(message || "Voice connection failed."));
    };

    const timer = window.setTimeout(() => {
      if (dc.readyState === "open") finish(true);
      else if (
        pc.iceConnectionState === "connected" ||
        pc.iceConnectionState === "completed"
      ) {
        finish(true);
      } else {
        finish(false, `Voice connection timed out (${pc.iceConnectionState}).`);
      }
    }, timeoutMs);

    const onDcOpen = () => finish(true);

    const onIceChange = () => {
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        finish(true);
      } else if (pc.iceConnectionState === "failed") {
        finish(false, "Voice connection failed. Check your network and try again.");
      }
    };

    const onConnectionChange = () => {
      if (pc.connectionState === "connected") finish(true);
      if (pc.connectionState === "failed") {
        finish(false, "Voice connection failed. Check your network and try again.");
      }
    };

    const cleanup = () => {
      window.clearTimeout(timer);
      dc.removeEventListener("open", onDcOpen);
      pc.removeEventListener("iceconnectionstatechange", onIceChange);
      pc.removeEventListener("connectionstatechange", onConnectionChange);
    };

    dc.addEventListener("open", onDcOpen);
    pc.addEventListener("iceconnectionstatechange", onIceChange);
    pc.addEventListener("connectionstatechange", onConnectionChange);
  });
}

function extractAssistantText(message: Record<string, unknown>) {
  if (typeof message.text === "string" && message.text.trim()) {
    return message.text.trim();
  }

  const response = message.response as {
    output?: Array<{
      type?: string;
      content?: Array<{ type?: string; text?: string }>;
      text?: string;
    }>;
  };

  const parts: string[] = [];
  for (const item of response?.output || []) {
    if (typeof item.text === "string" && item.text.trim()) {
      parts.push(item.text.trim());
    }
    if (item.type === "message") {
      for (const block of item.content || []) {
        if (
          (block.type === "output_text" || block.type === "text") &&
          block.text?.trim()
        ) {
          parts.push(block.text.trim());
        }
      }
    }
  }

  if (parts.length) return parts.join("\n");
  if (message.type === "response.done") return "";
  return "";
}

function responseHasFunctionCall(message: Record<string, unknown>) {
  const response = message.response as { output?: Array<{ type?: string }> } | undefined;
  return (response?.output || []).some((item) => item.type === "function_call");
}

function appendTextDelta(
  message: Record<string, unknown>,
  bufferRef: { current: string }
) {
  const part = message.part as { text?: string; transcript?: string } | undefined;
  if (part?.text) {
    bufferRef.current += part.text;
    return;
  }
  if (part?.transcript) {
    bufferRef.current += part.transcript;
    return;
  }

  const delta =
    (typeof message.delta === "string" && message.delta) ||
    (typeof message.text === "string" && message.text) ||
    "";
  if (delta) bufferRef.current += delta;
}

function configurePlaybackAudio(audio: HTMLAudioElement) {
  audio.setAttribute("playsinline", "true");
  audio.setAttribute("webkit-playsinline", "true");
  audio.preload = "auto";
}

function unlockAudioPlayback() {
  const audio = new Audio();
  audio.src =
    "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
  configurePlaybackAudio(audio);
  audio.play().catch(() => {});
}

async function requestMicrophoneStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone is not available in this browser.");
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  }
}

async function assertVoiceReady() {
  const response = await fetch("/api/voice/ready", {
    method: "GET",
    credentials: "same-origin",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Voice is not configured on the server."
    );
  }
}

function describeVoiceStartError(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "Microphone access was blocked. Allow the microphone in your browser settings.";
    }
    if (error.name === "NotFoundError") {
      return "No microphone was found. Connect a microphone and try again.";
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return "Could not start Alfred voice.";
}

export function useAlfredVoice() {
  const [state, setState] = useState<AlfredVoiceState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [caption, setCaption] = useState("");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackDoneRef = useRef<(() => void) | null>(null);
  const activeRef = useRef(false);
  const textBufferRef = useRef("");

  const teardown = useCallback(() => {
    activeRef.current = false;
    dcRef.current?.close();
    pcRef.current?.close();
    dcRef.current = null;
    pcRef.current = null;

    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    playbackDoneRef.current?.();
    playbackDoneRef.current = null;
    textBufferRef.current = "";
  }, []);

  const stop = useCallback(() => {
    teardown();
    setState("idle");
    setErrorMessage("");
  }, [teardown]);

  const interruptPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playbackDoneRef.current) {
      playbackDoneRef.current();
      playbackDoneRef.current = null;
    }
  }, []);

  const cancelAssistantResponse = useCallback(() => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open" || !activeRef.current) return;
    dc.send(JSON.stringify({ type: "response.cancel" }));
  }, []);

  const playElevenLabs = useCallback(async (text: string) => {
    if (!text.trim() || !activeRef.current) return;

    setState("speaking");
    const response = await fetch("/api/voice/speak", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok || !activeRef.current) {
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string" ? data.error : "Could not play Alfred's voice."
        );
      }
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
    }

    const audio = new Audio(url);
    configurePlaybackAudio(audio);
    audioRef.current = audio;

    try {
      await new Promise<void>((resolve, reject) => {
        playbackDoneRef.current = resolve;
        audio.onended = () => {
          playbackDoneRef.current = null;
          resolve();
        };
        audio.onerror = () => {
          playbackDoneRef.current = null;
          reject(new Error("Audio playback failed"));
        };
        audio.play().catch((err) => {
          playbackDoneRef.current = null;
          reject(err);
        });
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }, []);

  const speakAssistantText = useCallback(
    (text: string) => {
      if (!text.trim() || !activeRef.current) return;
      setCaption(text.trim());
      void (async () => {
        try {
          await playElevenLabs(text);
          if (activeRef.current) setState("listening");
        } catch (error) {
          if (!activeRef.current) return;
          setErrorMessage(error instanceof Error ? error.message : "Playback failed.");
          setState("error");
          teardown();
        }
      })();
    },
    [playElevenLabs, teardown]
  );

  const handleFunctionCall = useCallback(
    async (name: string, argsJson: string, callId: string) => {
      const dc = dcRef.current;
      if (!dc || !activeRef.current || !callId) return;

      let output: Record<string, unknown> = { error: "Unknown function" };

      try {
        const response = await fetch("/api/voice/tools", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, arguments: argsJson }),
        });
        output = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        if (!response.ok) {
          output = {
            error: typeof output.error === "string" ? output.error : "Tool call failed.",
          };
        } else if (MUTATION_TOOLS.has(name)) {
          void hydrateWellnessFromServer();
        }
      } catch (error) {
        output = {
          error: error instanceof Error ? error.message : "Tool call failed.",
        };
      }

      if (!activeRef.current || dc.readyState !== "open") return;

      dc.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: callId,
            output: JSON.stringify(output),
          },
        })
      );
      dc.send(JSON.stringify({ type: "response.create" }));
    },
    []
  );

  const connect = useCallback(async () => {
    if (activeRef.current) return;

    unlockAudioPlayback();
    activeRef.current = true;
    textBufferRef.current = "";
    setErrorMessage("");
    setState("connecting");

    try {
      await assertVoiceReady();

      const stream = await requestMicrophoneStream();
      if (!activeRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      micStreamRef.current = stream;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const remoteAudio = document.createElement("audio");
      configurePlaybackAudio(remoteAudio);
      remoteAudio.autoplay = true;
      remoteAudio.volume = 0;
      remoteAudioRef.current = remoteAudio;

      pc.ontrack = (event) => {
        const trackStream = event.streams[0] ?? new MediaStream([event.track]);
        remoteAudio.srcObject = trackStream;
        remoteAudio.play().catch(() => {});
      };

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onclose = () => {
        if (activeRef.current) stop();
      };

      dc.onmessage = (event) => {
        if (!activeRef.current) return;

        let message: Record<string, unknown>;
        try {
          message = JSON.parse(event.data) as Record<string, unknown>;
        } catch {
          return;
        }

        const type = String(message.type || "");

        if (type === "session.created" || type === "session.updated") return;

        if (type === "input_audio_buffer.speech_started") {
          interruptPlayback();
          cancelAssistantResponse();
          setState("listening");
          return;
        }

        if (type === "input_audio_buffer.speech_stopped" || type === "response.created") {
          setState("thinking");
          return;
        }

        if (
          type === "response.output_text.delta" ||
          type === "response.text.delta" ||
          type === "response.output_audio_transcript.delta" ||
          type === "response.content_part.added" ||
          type === "response.content_part.done"
        ) {
          appendTextDelta(message, textBufferRef);
          return;
        }

        if (
          type === "response.text.done" ||
          type === "response.output_text.done" ||
          type === "response.output_audio_transcript.done"
        ) {
          appendTextDelta(message, textBufferRef);
          return;
        }

        if (type === "response.output_item.done") {
          const item = message.item as {
            type?: string;
            call_id?: string;
            name?: string;
            arguments?: string;
          };
          if (item?.type === "function_call" && item.call_id) {
            setState("thinking");
            void handleFunctionCall(
              String(item.name || ""),
              String(item.arguments || ""),
              String(item.call_id)
            );
            return;
          }
          appendTextDelta(message, textBufferRef);
          return;
        }

        if (type === "response.done") {
          if (responseHasFunctionCall(message)) {
            textBufferRef.current = "";
            return;
          }

          const text = extractAssistantText(message) || textBufferRef.current.trim();
          textBufferRef.current = "";
          if (text) {
            setState("thinking");
            speakAssistantText(text);
          } else if (activeRef.current) {
            speakAssistantText("I beg your pardon, sir — might you repeat that?");
          }
          return;
        }

        if (type === "response.function_call_arguments.done") {
          setState("thinking");
          void handleFunctionCall(
            String(message.name || ""),
            String(message.arguments || ""),
            String(message.call_id || "")
          );
          return;
        }

        if (type === "error") {
          const err = message.error as { message?: string } | undefined;
          setErrorMessage(err?.message || "Voice session error.");
          teardown();
          setState("error");
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForIceGathering(pc);

      if (!activeRef.current) return;

      const sdpResponse = await fetch("/api/voice/connect", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/sdp" },
        body: pc.localDescription?.sdp || offer.sdp || "",
      });

      if (!sdpResponse.ok) {
        const data = await sdpResponse.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string" ? data.error : "Could not connect to OpenAI Realtime."
        );
      }

      const answerSdp = await sdpResponse.text();
      if (!answerSdp.trim().startsWith("v=")) {
        throw new Error("OpenAI returned an invalid voice session answer.");
      }

      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
      await waitForVoiceLink(pc, dc);

      if (!activeRef.current) return;

      setState("listening");
      speakAssistantText(getConnectGreetingText());
    } catch (error) {
      teardown();
      setErrorMessage(describeVoiceStartError(error));
      setState("error");
    }
  }, [
    cancelAssistantResponse,
    handleFunctionCall,
    interruptPlayback,
    speakAssistantText,
    stop,
    teardown,
  ]);

  const toggle = useCallback(() => {
    if (activeRef.current || state === "connecting") {
      stop();
      return;
    }
    void connect();
  }, [connect, state, stop]);

  useEffect(() => () => teardown(), [teardown]);

  return {
    state,
    errorMessage,
    caption,
    connect,
    toggle,
    stop,
  };
}
