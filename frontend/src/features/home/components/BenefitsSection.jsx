import { Activity, Crosshair, Timer } from 'lucide-react';
import { Card, Container, SectionHeader, Tag } from '@/components/ui';
import { BENEFITS } from '../content';
import styles from './BenefitsSection.module.css';

const ICONS = { timer: Timer, activity: Activity, crosshair: Crosshair };

export default function BenefitsSection() {
  return (
    <section className={styles.section}>
      <Container>
        <SectionHeader light eyebrow="02 / What you get" title="Beyond what the eye can see." />
        <div className={styles.grid}>
          {BENEFITS.map(({ icon, title, text, tags }) => {
            const Icon = ICONS[icon];
            const [first, ...rest] = title.split(' ');
            return (
              <Card key={title} className={styles.card}>
                <Icon size={24} className={styles.icon} aria-hidden="true" />
                <h3 className={styles.title}>{first} {rest.slice(0, -1).join(' ')} <strong>{rest.at(-1)}</strong></h3>
                <p className={styles.text}>{text}</p>
                <div className={styles.tags}><Tag>{tags}</Tag></div>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
