import { forwardRef, useId } from 'react';
import { cn } from '@/utils/cn';
import styles from './Input.module.css';

/** Labelled text input. `rightSlot` is for icons/buttons (e.g. show-password). */
const Input = forwardRef(function Input(
  { label, hint, error, rightSlot, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cn(styles.field, className)}>
      {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
      <div className={cn(styles.control, error && styles.invalid)}>
        <input
          ref={ref}
          id={inputId}
          className={styles.input}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          {...rest}
        />
        {rightSlot && <div className={styles.slot}>{rightSlot}</div>}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className={styles.error} role="alert">{error}</p>
      ) : (
        hint && <p id={`${inputId}-hint`} className={styles.hint}>{hint}</p>
      )}
    </div>
  );
});

export default Input;
