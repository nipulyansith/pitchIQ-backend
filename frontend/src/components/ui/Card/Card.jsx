import { cn } from '@/utils/cn';
import styles from './Card.module.css';

/** tone: default | muted | tint | dark */
export default function Card({ as: Tag = 'div', tone = 'default', padded = true, className, children, ...rest }) {
  return (
    <Tag className={cn(styles.card, styles[tone], padded && styles.padded, className)} {...rest}>
      {children}
    </Tag>
  );
}
