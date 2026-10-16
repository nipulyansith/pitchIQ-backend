import { BarChart3, Crosshair, Hand, Upload } from 'lucide-react';
import { Card } from '@/components/ui';
import styles from './ProcessCard.module.css';

const ICONS = { upload: Upload, hand: Hand, crosshair: Crosshair, chart: BarChart3 };

export default function ProcessCard({ n, label, icon, title, text, note }) {
  const Icon = ICONS[icon];
  return (
    <Card className={styles.card}>
      <div className={styles.top}>
        <p className={styles.label}>{n} / {label}</p>
        <Icon size={22} className={styles.icon} aria-hidden="true" />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.text}>{text}</p>
      <p className={styles.note}>{note}</p>
    </Card>
  );
}
