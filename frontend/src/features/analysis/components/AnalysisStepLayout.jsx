import { Button, Card, Container, Stepper } from '@/components/ui';
import { ANALYSIS_STEPS } from '@/config/constants';
import styles from './AnalysisStepLayout.module.css';

/**
 * Shared frame for every step: stepper bar, intro card, content, and back/next footer.
 * footer = { back: {label, onClick}, status, next: {label, onClick, disabled, loading} }
 */
export default function AnalysisStepLayout({ stepIndex, eyebrow, title, description, tone = 'default', footer, children }) {
  return (
    <>
      <div className={styles.stepperBar}>
        <Container><Stepper steps={ANALYSIS_STEPS} currentIndex={stepIndex} /></Container>
      </div>
      <Container className={styles.page}>
        <Card tone={tone} className={styles.intro}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </Card>

        <div className={styles.content}>{children}</div>

        <div className={styles.footer}>
          {footer.back && <Button variant="secondary" onClick={footer.back.onClick}>{footer.back.label}</Button>}
          <div className={styles.right}>
            {footer.status && <span className={styles.status}>{footer.status}</span>}
            <Button arrow onClick={footer.next.onClick} disabled={footer.next.disabled} loading={footer.next.loading}>
              {footer.next.label}
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
}
