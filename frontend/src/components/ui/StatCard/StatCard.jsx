import Card from '../Card/Card';
import { cn } from '@/utils/cn';
import styles from './StatCard.module.css';

/**
 * Metric/KPI StatCard used across Dashboards and analytics views.
 */
export default function StatCard({
  label,
  value,
  description,
  className,
  ...rest
}) {
  return (
    <Card className={cn(styles.card, className)} {...rest}>
      <p className={styles.label}>{label}</p>
      <div className={styles.value}>{value}</div>
      {description && <p className={styles.description}>{description}</p>}
    </Card>
  );
}

