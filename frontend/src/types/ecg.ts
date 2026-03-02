export const ECG_LEADS = [
  "I",
  "II",
  "III",
  "aVR",
  "aVL",
  "aVF",
  "V1",
  "V2",
  "V3",
  "V4",
  "V5",
  "V6",
] as const;

export type ECGLeadName = (typeof ECG_LEADS)[number];
export type ECGMatrix = number[][];
