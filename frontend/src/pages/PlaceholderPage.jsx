import { Container } from '@/components/ui';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function PlaceholderPage({ title }) {
  useDocumentTitle(title);
  return (
    <Container style={{ paddingBlock: 'var(--space-8)' }}>
      <h1>{title}</h1>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 12 }}>Coming soon.</p>
    </Container>
  );
}
