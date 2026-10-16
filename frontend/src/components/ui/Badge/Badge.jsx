import { cn } from '@/utils/cn';
import styles from './Badge.module.css';

/**
 * Common Badge component.
 * variant: 'neutral' | 'success' | 'warning' | 'danger' | 'outline' | 'pill'
 */
export default function Badge({
  children,
  variant = 'neutral',
  className,
  ...rest
}) {
  return (
    <span className={cn(styles.badge, styles[variant], className)} {...rest}>
      {children}
    </span>
  );
}

