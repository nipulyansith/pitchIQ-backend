import { Container } from '@/components/ui';
import styles from './Footer.module.css';

export default function Footer({
  tagline = 'A clearer view of your bowling.',
  sampleNote = 'Illustrative sample account · All people, quotes, payments, dates and metrics shown are examples.',
}) {
  return (
    <footer className={styles.footer}>
      <Container className={styles.inner}>
        <div className={styles.left}>
          <p className={styles.copyright}>© 2026 PitchIQ. {tagline}</p>
          {sampleNote && <p className={styles.note}>{sampleNote}</p>}
        </div>
        <nav className={styles.links} aria-label="Footer links">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/help">Help</a>
        </nav>
      </Container>
    </footer>
  );
}
