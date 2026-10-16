import { cn } from '@/utils/cn';
import styles from './SectionHeader.module.css';

/** Eyebrow + title (+ optional description / action). Use `light` on dark backgrounds. */
export default function SectionHeader({ eyebrow, title, description, action, light = false, as: Tag = 'h2', className }) {
  return (
    <header className={cn(styles.header, light && styles.light, className)}>
      <div>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <Tag className={styles.title}>{title}</Tag>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action}
    </header>
  );
}
