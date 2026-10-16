import { cn } from '@/utils/cn';
import styles from './DetailList.module.css';

/**
 * DetailList container for key-value pairs and checklist rows.
 */
export function DetailList({ children, className }) {
  return <div className={cn(styles.list, className)}>{children}</div>;
}

/**
 * DetailItem row: displays an optional icon/checkbox indicator, a label, and a value.
 */
export function DetailItem({
  label,
  value,
  icon,
  action,
  className,
}) {
  return (
    <div className={cn(styles.item, className)}>
      <div className={styles.left}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <span className={styles.label}>{label}</span>
      </div>
      <div className={styles.right}>
        {value && <span className={styles.value}>{value}</span>}
        {action}
      </div>
    </div>
  );
}

export default DetailList;

