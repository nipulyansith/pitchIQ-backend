import { Container, SectionHeader } from '@/components/ui';
import { TESTIMONIALS } from '../content';
import styles from './TestimonialsSection.module.css';

export default function TestimonialsSection() {
  return (
    <section className={styles.section}>
      <Container>
        <SectionHeader eyebrow="03 / Testimonials" title="A clearer conversation about bowling." />
        <div className={styles.grid}>
          {TESTIMONIALS.map((t) => (
            <figure key={t.quote} className={styles.figure}>
              <blockquote className={styles.quote}>“{t.quote}”</blockquote>
              <figcaption className={styles.by}>{t.by}</figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
