import { Lock } from 'lucide-react';
import { AuthLayout } from '@/components/layout';
import SignupForm from '@/features/auth/components/SignupForm';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function SignupPage() {
  useDocumentTitle('Sign up');
  return (
    <AuthLayout
      image="/images/signup.png"
      imageAlt="A bowler walking back to his mark"
      caption={
        <>
          <h2 style={{ color: '#fff', fontWeight: 400, fontSize: '2rem', lineHeight: 1.2 }}>Progress begins with perspective.</h2>
          <p style={{ color: '#d4e2da', fontSize: '0.85rem', margin: '1rem 0' }}>Upload a delivery. Explore your movement. Build a clearer picture, one session at a time.</p>
          <p style={{ color: '#d4e2da', fontSize: '0.8rem', display: 'flex', gap: 8, alignItems: 'center' }}>
            <Lock size={14} aria-hidden="true" /> Your videos stay in your workspace.
          </p>
        </>
      }
    >
      <SignupForm />
    </AuthLayout>
  );
}
