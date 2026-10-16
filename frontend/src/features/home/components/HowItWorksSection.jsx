import { Button, Container, SectionHeader } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { HOW_STEPS } from '../content';
import styles from './HowItWorksSection.module.css';

export default function HowItWorksSection() {
  return (
    <section className={styles.section}>
      <Container>
        <SectionHeader eyebrow="01 / How it works" title="One video. Four simple steps."
          action={<Button to={ROUTES.howItWorks} variant="secondary" arrow>Explore the process</Button>} />
        <ol className={styles.steps}>
          {HOW_STEPS.map((s, i) => (
            <li key={s.title} className={styles.step}>
              <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
              <h3 className={styles.title}>{s.title}</h3>
              <p className={styles.text}>{s.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
