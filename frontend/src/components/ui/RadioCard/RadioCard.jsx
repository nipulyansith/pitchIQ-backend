import { cn } from '@/utils/cn';
import styles from './RadioCard.module.css';

/** Big selectable card (used for left/right arm). Keyboard + screen-reader friendly via native radio. */
export default function RadioCard({ name, value, checked, onChange, title, badge, caption }) {
  return (
    <label className={cn(styles.card, checked && styles.checked)}>
      <input type="radio" className="sr-only" name={name} value={value} checked={checked} onChange={() => onChange(value)} />
      <span className={styles.top}>
        <span className={styles.title}>{title}</span>
        <span className={styles.radio} aria-hidden="true" />
      </span>
      <span className={styles.badge} aria-hidden="true">{badge}</span>
      <span className={styles.caption}>{caption}</span>
    </label>
  );
}
