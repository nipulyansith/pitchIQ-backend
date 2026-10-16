import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Maximize, Pause, Play } from 'lucide-react';
import { PLAYBACK_RATES } from '@/config/constants';
import { formatTime } from '@/utils/format';
import styles from './VideoPlayer.module.css';

/**
 * Custom-controlled video. `badge` = label top-left, `children` = overlay (e.g. calibration markers).
 * Exposes the underlying <video> via ref.
 */
const VideoPlayer = forwardRef(function VideoPlayer(
  { src, badge, defaultRate = 0.5, onLoadedMetadata, onTimeUpdate, children },
  ref,
) {
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(defaultRate);

  useImperativeHandle(ref, () => videoRef.current);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = rate;
  }, [rate, src]);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  }, []);

  const cycleRate = () => setRate((r) => PLAYBACK_RATES[(PLAYBACK_RATES.indexOf(r) + 1) % PLAYBACK_RATES.length]);
  const fullscreen = () => wrapRef.current?.requestFullscreen?.();
  const seek = (e) => {
    const t = Number(e.target.value);
    videoRef.current.currentTime = t;
    setTime(t);
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.stage}>
        <video
          ref={videoRef}
          src={src}
          className={styles.video}
          playsInline
          muted
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration);
            e.currentTarget.playbackRate = rate;
            onLoadedMetadata?.(e);
          }}
          onTimeUpdate={(e) => {
            setTime(e.currentTarget.currentTime);
            onTimeUpdate?.(e);
          }}
        />
        {badge && <span className={styles.badge}>{badge}</span>}
        {children}
      </div>
      <div className={styles.controls}>
        <button type="button" onClick={toggle} className={styles.icon} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <span className={styles.time}>{formatTime(time)} / {formatTime(duration)}</span>
        <input
          type="range" className={styles.progress} min={0} max={duration || 0} step={0.01}
          value={time} onChange={seek} aria-label="Seek"
        />
        <button type="button" onClick={cycleRate} className={styles.rate} aria-label="Playback speed">{rate}×</button>
        <button type="button" onClick={fullscreen} className={styles.icon} aria-label="Fullscreen"><Maximize size={16} /></button>
      </div>
    </div>
  );
});

export default VideoPlayer;
