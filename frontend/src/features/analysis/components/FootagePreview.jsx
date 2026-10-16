import { VideoPlayer } from '@/components/ui';

export default function FootagePreview({ src, onDuration }) {
  return (
    <VideoPlayer
      src={src}
      badge="Delivery • Side view"
      onLoadedMetadata={(e) => onDuration?.(e.currentTarget.duration)}
    />
  );
}
