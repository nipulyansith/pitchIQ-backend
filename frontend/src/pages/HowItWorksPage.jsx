import { Check } from 'lucide-react';
import { Button, Card, Container, VideoPlayer } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { HOW_PAGE_STEPS, VIDEO_TIPS } from '@/features/home/content';
import ProcessCard from '@/features/how-it-works/components/ProcessCard';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './HowItWorksPage.module.css';

export default function HowItWorksPage() {
  useDocumentTitle('How it works');
  return (
    <Container className={styles.page}>
      <header>
        <p className={styles.eyebrow}>How it works</p>
        <h1 className={styles.title}>From footage to understanding.</h1>
        <p className={styles.lead}>Four steps to a clearer view of your bowling action.</p>
      </header>

      <section className={styles.demo}>
        {/* Put a sample clip at public/images/sample-delivery.mp4 */}
        <VideoPlayer src="/images/sample-delivery.png" badge="Delivery • Side view" />
        <div>
          <h2 className={styles.tipsTitle}>A good video makes a difference.</h2>
          <ul className={styles.tips}>
            {VIDEO_TIPS.map((t) => (
              <li key={t}><Check size={16} aria-hidden="true" /> {t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.grid} aria-label="Steps">
        {HOW_PAGE_STEPS.map((s) => <ProcessCard key={s.n} {...s} />)}
      </section>

      <Card tone="tint" className={styles.cta}>
        <div>
          <h2 className={styles.ctaTitle}>Have a delivery in mind?</h2>
          <p className={styles.ctaText}>Upload your video and let’s take a closer look.</p>
        </div>
        <Button to={ROUTES.upload} arrow>Upload video</Button>
      </Card>
    </Container>
  );
}
