import { useRef, useState } from 'react';
import { CheckCircle2, SkipBack, SkipForward } from 'lucide-react';
import { Button, Card, Input, VideoPlayer } from '@/components/ui';
import { VIDEO_FPS } from '@/config/constants';
import { useAnalysis } from '@/context/AnalysisContext';
import { cn } from '@/utils/cn';
import { formatTime } from '@/utils/format';
import styles from './StumpCalibrator.module.css';

const POINT_STEPS = [
  { label: 'Top of stump', help: 'Click the top edge, below the bail.' },
  { label: 'Bottom of stump', help: 'Click where the stump meets the ground.' },
];

/** Click twice on a paused frame to place top + bottom stump markers (stored as 0–1 coordinates). */
export default function StumpCalibrator() {
  const { videoUrl, calibration, setCalibration } = useAnalysis();
  const { points, stumpHeightM } = calibration;
  const videoRef = useRef(null);
  const [time, setTime] = useState(0);

  const frame = Math.round(time * VIDEO_FPS);

  const placePoint = (e) => {
    if (points.length >= 2) return;
    videoRef.current?.pause();
    const r = e.currentTarget.getBoundingClientRect();
    const point = {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
    setCalibration({ points: [...points, point], frameTime: videoRef.current?.currentTime ?? 0 });
  };

  const stepFrame = (dir) => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = Math.max(0, v.currentTime + dir / VIDEO_FPS);
  };

  const pct = (n) => `${n * 100}%`;

  return (
    <div className={styles.grid}>
      <div>
        <VideoPlayer ref={videoRef} src={videoUrl} badge="Calibration frame" onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}>
          <div className={styles.overlay} onClick={placePoint} role="presentation">
            {points.length === 2 && (
              <svg className={styles.line} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <line x1={points[0].x * 100} y1={points[0].y * 100} x2={points[1].x * 100} y2={points[1].y * 100} vectorEffect="non-scaling-stroke" />
              </svg>
            )}
            {points.map((p, i) => (
              <div key={i} className={styles.marker} style={{ left: pct(p.x), top: pct(p.y) }}>
                <span className={styles.pin}>{i + 1}</span>
                <span className={styles.pinLabel}>{POINT_STEPS[i].label}</span>
              </div>
            ))}
          </div>
        </VideoPlayer>
        <div className={styles.frameBar}>
          <div className={styles.frameNav}>
            <button type="button" onClick={() => stepFrame(-1)} aria-label="Previous frame"><SkipBack size={16} /></button>
            <span>Frame {frame} · {formatTime(time)}.{String(Math.round((time % 1) * 100)).padStart(2, '0')}</span>
            <button type="button" onClick={() => stepFrame(1)} aria-label="Next frame"><SkipForward size={16} /></button>
          </div>
          <Button variant="ghost" onClick={() => setCalibration({ points: [] })}>Reset points</Button>
        </div>
      </div>

      <Card className={styles.panel}>
        <h2 className={styles.panelTitle}>Set the two reference points</h2>
        <ol className={styles.steps}>
          {POINT_STEPS.map((s, i) => (
            <li key={s.label}>
              <div className={styles.stepRow}>
                <span className={cn(styles.num, points.length === i && styles.numCurrent)}>{i + 1}</span>
                <span className={styles.stepLabel}>{s.label}</span>
                {points.length > i && <CheckCircle2 size={18} className={styles.tick} aria-label="Marked" />}
              </div>
              <p className={styles.help}>{s.help}</p>
            </li>
          ))}
        </ol>
        <hr className={styles.rule} />
        <Input
          label="Stump height" type="number" step="0.001" min="0.1"
          value={stumpHeightM}
          onChange={(e) => setCalibration({ stumpHeightM: Number(e.target.value) })}
          rightSlot="m"
          hint="Standard adult stump height. Adjust if your reference is different."
        />
        {points.length === 2 && (
          <p className={styles.ready}><CheckCircle2 size={16} aria-hidden="true" /> Both points marked</p>
        )}
      </Card>
    </div>
  );
}
