import { cn } from '@/utils/cn';
import styles from './FilterPills.module.css';

/**
 * Filter pills for quick state filtering (e.g., All · 32, Ready · 30, Processing · 1, Failed · 1).
 */
export default function FilterPills({
  options = [],
  value,
  onChange,
  className,
}) {
  return (
    <div className={cn(styles.container, className)} role="radiogroup">
      {options.map((opt) => {
        const isSelected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange?.(opt.id)}
            className={cn(styles.pill, isSelected && styles.active)}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span className={styles.count}>· {opt.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

