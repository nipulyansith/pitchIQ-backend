import { Button, Container } from '@/components/ui';
import { ROUTES } from '@/config/routes';

export default function NotFoundPage() {
  return (
    <Container style={{ paddingBlock: 'var(--space-8)', display: 'grid', gap: 16, justifyItems: 'start' }}>
      <h1>Page not found</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>The page you’re looking for doesn’t exist.</p>
      <Button to={ROUTES.home}>Back to home</Button>
    </Container>
  );
}
