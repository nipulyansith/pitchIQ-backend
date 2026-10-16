import { Scan } from 'lucide-react';
import { Button, Container } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <Container as="section" className={styles.hero}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Cricket. Seen clearer.</p>
        <h1 className={styles.title}>
          Every delivery,<br />A <span className={styles.accent}>Deeper view</span>
        </h1>
        <p className={styles.lead}>Turn your bowling video into a clearer picture of your movement. From run-up rhythm to the moment of release.</p>
        <Button to={ROUTES.upload} variant="gradient" arrow>Start your analysis</Button>
        <p className={styles.small}>Your video. Your movement. Clearer insights.</p>
      </div>
      <div className={styles.image} style={{ backgroundImage: 'url(/images/hero.png), linear-gradient(160deg,#6a9a5b,#27472f)' }} role="img" aria-label="A bowler in delivery stride">
        <span className={styles.chip}><Scan size={16} aria-hidden="true" /> A clearer view of your action</span>
      </div>
    </Container>
  );
}
