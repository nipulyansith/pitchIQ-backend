import { cn } from '@/utils/cn';
import styles from './PageDisclaimer.module.css';

/**
 * Bottom page disclaimer text shown across analysis and dashboard views.
 */
export default function PageDisclaimer({ children, className }) {
  return (
    <p className={cn(styles.disclaimer, className)}>
      {children}
    </p>
  );
}

