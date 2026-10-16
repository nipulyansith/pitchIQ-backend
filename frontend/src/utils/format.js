export const formatBytes = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export const formatTime = (seconds = 0) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
