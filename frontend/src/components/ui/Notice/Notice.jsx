import { CheckCircle2, Info, Lock } from 'lucide-react';
import { cn } from '@/utils/cn';
import styles from './Notice.module.css';

const ICONS = { info: Info, lock: Lock, success: CheckCircle2 };

/**
 * Notice component for contextual alerts, success notes, and inline tips.
 * variant: 'box' | 'inline' | 'success'
 */
export default function Notice({
  icon = 'info',
  variant = 'box',
  title,
  className,
  children,
}) {
  const Icon = ICONS[icon] || Info;
  return (
    <div className={cn(styles.notice, styles[variant], className)}>
      <Icon size={variant === 'inline' ? 14 : 18} className={styles.icon} aria-hidden="true" />
      <div className={styles.content}>
        {title && <p className={styles.title}>{title}</p>}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
