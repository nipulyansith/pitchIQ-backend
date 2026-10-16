import { useState } from 'react';
import { CheckCircle2, FileVideo } from 'lucide-react';
import { FileDropzone, Notice } from '@/components/ui';
import { ACCEPTED_VIDEO_TYPES, MAX_VIDEO_MB } from '@/config/constants';
import { useAnalysis } from '@/context/AnalysisContext';
import { formatBytes } from '@/utils/format';
import FootagePreview from './FootagePreview';
import styles from './UploadStep.module.css';

/** Content of step 1 (dropzone + preview). Navigation lives in the page. */
export default function UploadStep() {
  const { file, videoUrl, setVideo } = useAnalysis();
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(null);

  const handleFile = (f) => {
    if (!ACCEPTED_VIDEO_TYPES.includes(f.type)) return setError('Upload an MP4 or MOV video.');
    if (f.size > MAX_VIDEO_MB * 1024 * 1024) return setError(`Video must be under ${MAX_VIDEO_MB} MB.`);
    setError('');
    setDuration(null);
    setVideo(f);
  };

  return (
    <div className={styles.grid}>
      <div className={styles.left}>
        <FileDropzone
          accept=".mp4,.mov,video/mp4,video/quicktime"
          title="Drop your bowling video here"
          hint="MP4 or MOV · One delivery per video"
          buttonLabel="Choose video"
          onFile={handleFile}
          error={error}
        />
        {file && (
          <div className={styles.file}>
            <FileVideo size={20} aria-hidden="true" />
            <div className={styles.fileInfo}>
              <p className={styles.fileName}>{file.name}</p>
              <p className={styles.fileMeta}>{duration ? `${Math.round(duration)} seconds · ` : ''}{formatBytes(file.size)} · Ready to continue</p>
            </div>
            <CheckCircle2 size={20} className={styles.tick} aria-label="Ready" />
          </div>
        )}
      </div>

      <div className={styles.right}>
        {videoUrl && <FootagePreview src={videoUrl} onDuration={setDuration} />}
        <h3 className={styles.checkTitle}>Check your footage</h3>
        <p className={styles.checkText}>Keep the bowler and stumps visible. Include the final five steps, the delivery stride and ball release.</p>
        <Notice icon="lock" variant="inline">Only upload footage you have permission to use.</Notice>
      </div>
    </div>
  );
}
