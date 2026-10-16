import { useId } from 'react';
import styles from './Checkbox.module.css';

export default function Checkbox({ label, id, className, ...rest }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className={`${styles.wrap} ${className ?? ''}`}>
      <input id={inputId} type="checkbox" className={styles.box} {...rest} />
      <span className={styles.label}>{label}</span>
    </label>
  );
}
