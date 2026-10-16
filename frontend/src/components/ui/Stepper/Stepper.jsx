import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import styles from './Stepper.module.css';

/** steps: [{id,label}], currentIndex: 0-based. Completed steps show a tick. */
export default function Stepper({ steps, currentIndex }) {
  return (
    <ol className={styles.stepper} aria-label="Progress">
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <li key={step.id} className={cn(styles.step, i === steps.length - 1 && styles.last)} aria-current={current ? 'step' : undefined}>
            <span className={cn(styles.dot, (done || current) && styles.active)}>
              {done ? <Check size={14} /> : String(i + 1).padStart(2, '0')}
            </span>
            <span className={cn(styles.label, current && styles.currentLabel)}>{step.label}</span>
            {i < steps.length - 1 && <span className={styles.line} />}
          </li>
        );
      })}
    </ol>
  );
}
