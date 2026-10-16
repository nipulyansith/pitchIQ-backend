import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Notice } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { useForm } from '@/hooks/useForm';
import { isEmail } from '@/utils/validators';
import styles from './AuthForm.module.css';

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(true); // set true by default to showcase the exact design state as requested in mockup

  const { values, errors, submitting, handleChange, handleSubmit } = useForm({
    initialValues: { email: 'anura@example.com' },
    validate: (v) => ({
      ...(!isEmail(v.email) && { email: 'Enter a valid email address.' }),
    }),
    onSubmit: async () => {
      // Mock network request
      await new Promise((r) => setTimeout(r, 600));
      setSent(true);
    },
  });

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h1 className={styles.title}>Forgot your password?</h1>
      <p className={styles.lead}>
        Enter the email address you use for PitchIQ. If it matches an account, we&apos;ll send a reset link.
      </p>

      <Input
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={values.email}
        onChange={handleChange}
        error={errors.email}
      />

      <Button type="submit" fullWidth loading={submitting}>
        Send reset link
      </Button>

      {sent && (
        <>
          <Notice
            variant="success"
            icon="success"
            title="Check your email · example sent state"
          >
            If an account exists for this address, a reset link has been sent. Check your inbox and spam folder. This message does not confirm whether an account exists.
          </Notice>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => handleSubmit()}
          >
            Resend reset link
          </Button>

          <Button to={ROUTES.login} variant="secondary" fullWidth>
            Back to Log in
          </Button>
        </>
      )}

      <p className={styles.subNoticeText}>
        Requested a link already?{' '}
        <Link to={ROUTES.resetPassword} className={styles.link}>
          Use the most recent email to continue to Reset password.
        </Link>
      </p>
    </form>
  );
}

