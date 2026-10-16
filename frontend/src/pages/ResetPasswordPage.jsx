import { AuthLayout } from '@/components/layout';
import ResetPasswordForm from '@/features/auth/components/ResetPasswordForm';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function ResetPasswordPage() {
  useDocumentTitle('Reset password');

  return (
    <AuthLayout
      eyebrow="ACCOUNT RECOVERY / RESET PASSWORD"
      title="A fresh start for your account."
      description="Create a new password from your recovery link, then return to Log in."
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
      <ResetPasswordForm />
    </AuthLayout>
  );
}

