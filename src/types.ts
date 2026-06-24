export interface Recording {
  id: string;
  title: string;
  date: number;
  durationMs: number;
  blob: Blob;
  tags: string[];
  isBookmarked: boolean;
}

export type SettingsConfig = {
  bluetoothEarbuds: boolean;
  minDecibelThreshold: number;
};

export const defaultSettingsConfig: SettingsConfig = {
  bluetoothEarbuds: false,
  minDecibelThreshold: -50,
};
