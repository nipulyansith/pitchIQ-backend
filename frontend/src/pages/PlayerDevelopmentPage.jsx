import { Button, Card, Container } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/context/AuthContext';

export default function PlayerDevelopmentPage() {
  const { user, logout } = useAuth();

  return (
    <main>
      <Container>
        <Card padded>
          <p style={{ color: 'var(--color-primary)', fontSize: 'var(--fs-sm)', fontWeight: 600 }}>
            Player workspace
          </p>
          <h1 style={{ marginTop: 'var(--space-3)' }}>Player features are under development.</h1>
          <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-muted)', maxWidth: 620 }}>
            Hi {user?.name || 'there'} — PitchIQ’s player experience is coming soon. Coach analysis tools are currently available for coach accounts.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)', flexWrap: 'wrap' }}>
            <Button to={ROUTES.home} variant="secondary">Go to homepage</Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await logout();
                window.location.assign(ROUTES.home);
              }}
            >
              Log out
            </Button>
          </div>
        </Card>
      </Container>
    </main>
  );
}
