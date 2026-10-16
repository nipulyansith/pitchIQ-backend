import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/utils/cn';
import Button from '../Button/Button';
import styles from './FileDropzone.module.css';

export default function FileDropzone({ accept, title, hint, buttonLabel = 'Choose file', onFile, error }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handle = (file) => file && onFile(file);

  return (
    <div
      className={cn(styles.zone, dragging && styles.dragging, error && styles.error)}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files?.[0]); }}
    >
      <span className={styles.iconWrap}><Upload size={20} aria-hidden="true" /></span>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.hint}>{hint}</p>
      <Button variant="secondary" onClick={() => inputRef.current?.click()}>{buttonLabel}</Button>
      <input
        ref={inputRef} type="file" accept={accept} className="sr-only" tabIndex={-1}
        onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ''; }}
      />
      {error && <p className={styles.errorText} role="alert">{error}</p>}
    </div>
  );
}
