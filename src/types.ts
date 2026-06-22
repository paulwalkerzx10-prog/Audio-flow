export interface Recording {
  id: string;
  title: string;
  date: number;
  durationMs: number;
  blob: Blob;
  tags: string[];
  isBookmarked: boolean;
}

export type DSPConfig = {
  noiseReduction: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  voiceBoost: boolean;
  compressor: boolean;
};

export const defaultDSPConfig: DSPConfig = {
  noiseReduction: true,
  echoCancellation: true,
  autoGainControl: true,
  voiceBoost: false,
  compressor: false,
};
