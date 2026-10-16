import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import styles from './Select.module.css';

/**
 * Standard select dropdown matching the design system's Input component.
 */
const Select = forwardRef(function Select(
  { label, hint, error, options, children, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const describedBy = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined;

  return (
    <div className={cn(styles.field, className)}>
      {label && <label htmlFor={selectId} className={styles.label}>{label}</label>}
      <div className={cn(styles.control, error && styles.invalid)}>
        <select
          ref={ref}
          id={selectId}
          className={styles.select}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          {...rest}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <span className={styles.arrow} aria-hidden="true">
          <ChevronDown size={16} />
        </span>
      </div>
      {error ? (
        <p id={`${selectId}-error`} className={styles.error} role="alert">{error}</p>
      ) : (
        hint && <p id={`${selectId}-hint`} className={styles.hint}>{hint}</p>
      )}
    </div>
  );
});

export default Select;

