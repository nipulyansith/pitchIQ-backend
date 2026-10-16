export const APP_NAME = 'PitchIQ';
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
export const MAX_VIDEO_MB = 200;
export const DEFAULT_STUMP_HEIGHT_M = 0.711;
export const VIDEO_FPS = 30;
export const PLAYBACK_RATES = [0.25, 0.5, 1];

export const BOWLING_ARMS = { LEFT: 'left', RIGHT: 'right' };

export const ANALYSIS_STEPS = [
  { id: 'upload', label: 'Upload video' },
  { id: 'arm', label: 'Bowling arm' },
  { id: 'calibrate', label: 'Calibrate' },
  { id: 'insights', label: 'Insights' },
];
