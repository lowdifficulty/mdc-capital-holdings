"use client";

import type { AlfredVoiceState } from "@/hooks/useAlfredVoice";
import { useAlfredVoice } from "@/hooks/useAlfredVoice";

function stateLabel(state: AlfredVoiceState): string {
  switch (state) {
    case "connecting":
      return "Connecting…";
    case "listening":
      return "Listening";
    case "thinking":
      return "Thinking…";
    case "speaking":
      return "Speaking";
    case "error":
      return "Unavailable";
    default:
      return "Alfred";
  }
}

function orbRingClass(state: AlfredVoiceState): string {
  switch (state) {
    case "listening":
      return "ring-emerald-400/60 shadow-emerald-500/20";
    case "thinking":
      return "ring-amber-400/50 shadow-amber-500/15 animate-pulse";
    case "speaking":
      return "ring-[#c9a227]/70 shadow-[#c9a227]/25";
    case "connecting":
      return "ring-white/30 animate-pulse";
    case "error":
      return "ring-red-400/50";
    default:
      return "ring-[#c9a227]/35 hover:ring-[#c9a227]/55";
  }
}

export function AlfredVoicePanel() {
  const { state, errorMessage, caption, toggle } = useAlfredVoice();
  const active = state !== "idle" && state !== "error";

  return (
    <div className="fixed bottom-4 right-4 z-[70] flex max-w-[min(100vw-2rem,22rem)] flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      {(caption || errorMessage) && (
        <div className="rounded-sm border border-[#c9a227]/25 bg-[#050505]/95 px-3 py-2 text-sm text-[#eae6dc]/90 shadow-xl backdrop-blur-md">
          {errorMessage ? (
            <p className="text-red-300/90">{errorMessage}</p>
          ) : (
            <p className="font-serif leading-snug">{caption}</p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-label={
          active ? "Stop Alfred voice assistant" : "Start Alfred voice assistant"
        }
        className={`group flex items-center gap-3 rounded-full border border-[#c9a227]/30 bg-[#0a0a0a]/95 py-2 pl-2 pr-4 shadow-2xl backdrop-blur-md transition hover:border-[#c9a227]/50 ${active ? "border-[#c9a227]/45" : ""}`}
      >
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] ring-2 shadow-lg transition ${orbRingClass(state)}`}
        >
          <span className="font-serif text-lg text-[#c9a227]">A</span>
        </span>
        <span className="text-left">
          <span className="block font-serif text-sm text-[#f8f4ec]">{stateLabel(state)}</span>
          <span className="block text-[10px] uppercase tracking-[0.18em] text-[#c9a227]/70">
            {active ? "Tap to dismiss" : "Tap to speak"}
          </span>
        </span>
      </button>
    </div>
  );
}
