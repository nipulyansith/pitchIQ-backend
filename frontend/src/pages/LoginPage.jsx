import { AuthLayout } from '@/components/layout';
import LoginForm from '@/features/auth/components/LoginForm';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function LoginPage() {
  useDocumentTitle('Log in');
  return (
    <AuthLayout
      image="/images/login.png"
      imageAlt="Two bowlers discussing a delivery"
      caption={
        <>
          <h2 style={{ color: '#fff', fontWeight: 400, fontSize: '2rem', lineHeight: 1.2 }}>
            A <strong>clearer view.</strong><br />A more <strong>considered delivery.</strong>
          </h2>
          <p style={{ color: '#b6c9bf', fontSize: '0.8rem', marginTop: '1rem' }}>Bowling insights, grounded in your movement.</p>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
