import { useMemo } from 'react';
import { cn } from '@/utils/cn';
import styles from './BarChart.module.css';

/**
 * BarChart component for displaying activity and metric trends over time.
 * @param {Array<{ label: string, value: number, displayValue?: string, active?: boolean }>} data
 * @param {number} maxHeight - Max bar height in pixels (default 120)
 */
export default function BarChart({
  data = [],
  maxHeight = 110,
  className,
}) {
  const { max, min } = useMemo(() => {
    if (!data.length) return { max: 1, min: 0 };
    const values = data.map((d) => d.value);
    return {
      max: Math.max(...values),
      min: Math.min(...values),
    };
  }, [data]);

  return (
    <div className={cn(styles.chartContainer, className)}>
      <div className={styles.barsArea} style={{ height: maxHeight + 36 }}>
        {data.map((item, idx) => {
          // If range is narrow (like 0.18 to 0.20), scale dynamically to keep bars readable
          let ratio;
          if (max === min) {
            ratio = 0.8;
          } else if (min > 0 && (max - min) / max < 0.2) {
            // Normalized scale between 65% and 100%
            ratio = 0.65 + 0.35 * ((item.value - min) / (max - min));
          } else {
            ratio = max > 0 ? item.value / max : 0;
          }

          const barHeight = Math.max(Math.round(ratio * maxHeight), 16);
          const isLatest = item.active ?? (idx === data.length - 1);

          return (
            <div key={item.label || idx} className={styles.barColumn}>
              <span className={styles.valueLabel}>
                {item.displayValue ?? item.value}
              </span>
              <div
                className={cn(styles.bar, isLatest ? styles.activeBar : styles.normalBar)}
                style={{ height: `${barHeight}px` }}
              />
              <span className={styles.bottomLabel}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

