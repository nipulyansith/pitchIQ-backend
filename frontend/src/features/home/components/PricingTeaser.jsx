import { Button, Container, SectionHeader } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import styles from './PricingTeaser.module.css';

export default function PricingTeaser() {
  return (
    <section className={styles.section}>
      <Container>
        <SectionHeader eyebrow="04 / Pricing" title="Built for the way you play."
          description="Season plans for clubs, monthly access for academies, and licences for larger programs."
          action={<Button to={ROUTES.pricing} variant="secondary" arrow>View pricing</Button>} />
      </Container>
    </section>
  );
}
