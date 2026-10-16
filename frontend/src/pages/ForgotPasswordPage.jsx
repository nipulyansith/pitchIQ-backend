import { AuthLayout } from '@/components/layout';
import ForgotPasswordForm from '@/features/auth/components/ForgotPasswordForm';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function ForgotPasswordPage() {
  useDocumentTitle('Forgot password');

  return (
    <AuthLayout
      eyebrow="ACCOUNT RECOVERY / FORGOT PASSWORD"
      title="Find your way back to your bowling."
      description="Request a password reset without changing your account or plan."
      image="/images/login.png"
      imageAlt="Two bowlers discussing a delivery"
      caption={
        <>
          <h2 style={{ color: '#fff', fontWeight: 400, fontSize: '2rem', lineHeight: 1.2 }}>
            A <strong>clearer view.</strong>
            <br />
            A more <strong>considered delivery.</strong>
          </h2>
          <p style={{ color: '#b6c9bf', fontSize: '0.8rem', marginTop: '1rem' }}>
            Bowling insights, grounded in your movement.
          </p>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}

