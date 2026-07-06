export type ElevenLabsVoiceProfile = {
  voiceId: string;
  modelId: string;
  voiceSettings: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
};

/** British RP butler — override with ELEVENLABS_VOICE_ID_ALFRED */
const DEFAULT_ALFRED_VOICE = "lUTamkMw7gOzZbFIwmq4"; // James — Professional British Male

export function getAlfredElevenLabsProfile(): ElevenLabsVoiceProfile {
  return {
    voiceId:
      process.env.ELEVENLABS_VOICE_ID_ALFRED ||
      process.env.ELEVENLABS_VOICE_ID ||
      DEFAULT_ALFRED_VOICE,
    modelId: process.env.ELEVENLABS_MODEL_ALFRED || "eleven_turbo_v2_5",
    voiceSettings: {
      stability: 0.72,
      similarity_boost: 0.78,
      style: 0.08,
      use_speaker_boost: true,
    },
  };
}
