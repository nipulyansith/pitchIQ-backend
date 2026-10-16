/**
 * Convert the two clicked stump points (normalised 0–1) into a real-world scale.
 * `video` is the intrinsic { width, height } of the video in pixels.
 */
export function computeScale(points, video, stumpHeightM) {
  if (points.length < 2 || !video?.width || !stumpHeightM) return null;
  const [top, bottom] = points;
  const dx = (top.x - bottom.x) * video.width;
  const dy = (top.y - bottom.y) * video.height;
  const stumpPx = Math.hypot(dx, dy);
  if (!stumpPx) return null;
  return { stumpPx, pixelsPerMetre: stumpPx / stumpHeightM };
}
