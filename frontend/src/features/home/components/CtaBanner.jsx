import { Button, Container } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import styles from './CtaBanner.module.css';

export default function CtaBanner() {
  return (
    <section className={styles.section}>
      <Container className={styles.inner}>
        <div>
          <h2 className={styles.title}>Your next delivery starts here.</h2>
          <p className={styles.text}>Create an account and take a closer look at your bowling action.</p>
        </div>
        <Button to={ROUTES.signup} arrow>Sign up to PitchIQ</Button>
      </Container>
    </section>
  );
}
