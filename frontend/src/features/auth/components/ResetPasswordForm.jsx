import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button, Notice, PasswordInput } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { useForm } from '@/hooks/useForm';
import styles from './AuthForm.module.css';

export default function ResetPasswordForm() {
  const [success, setSuccess] = useState(true); // default true to showcase the exact design state as requested in mockup

  const { values, errors, submitting, handleChange, handleSubmit } = useForm({
    initialValues: { password: '••••••••••••', confirmPassword: '••••••••••••' },
    validate: (v) => ({
      ...(v.password.length < 8 && { password: 'Password must be at least 8 characters.' }),
      ...(v.password !== v.confirmPassword && { confirmPassword: 'Passwords must match.' }),
    }),
    onSubmit: async () => {
      await new Promise((r) => setTimeout(r, 600));
      setSuccess(true);
    },
  });

  const isMinLength = values.password.length >= 8;
  const isMatching = values.password.length > 0 && values.password === values.confirmPassword;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h1 className={styles.title}>Set a new password.</h1>
      <p className={styles.lead}>
        Use a password you don&apos;t use for other accounts.
      </p>

      <PasswordInput
        label="New password"
        name="password"
        autoComplete="new-password"
        placeholder="••••••••••••"
        value={values.password}
        onChange={handleChange}
        error={errors.password}
        hint="Use at least 8 characters."
      />

      <PasswordInput
        label="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="••••••••••••"
        value={values.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        hint="Both passwords must match."
      />

      <div className={styles.criteriaList}>
        <div className={isMinLength ? styles.criteriaItem : styles.criteriaItemInactive}>
          <Check size={14} aria-hidden="true" />
          <span>At least 8 characters</span>
        </div>
        <div className={isMatching ? styles.criteriaItem : styles.criteriaItemInactive}>
          <Check size={14} aria-hidden="true" />
          <span>Passwords match</span>
        </div>
      </div>

      <Button type="submit" fullWidth loading={submitting}>
        Save new password
      </Button>

      {success && (
        <>
          <Notice
            variant="success"
            icon="success"
            title="Password updated · example success state"
          >
            Your new password is saved. Return to Log in to access your account. Your plan and saved analyses are unchanged.
          </Notice>

          <Button to={ROUTES.login} variant="secondary" fullWidth>
            Return to Log in
          </Button>
        </>
      )}

      <p className={styles.subNoticeText}>
        Link no longer works? Return to{' '}
        <Link to={ROUTES.forgotPassword} className={styles.link}>
          Forgot password
        </Link>{' '}
        to request a new one.
      </p>

      <Button to={ROUTES.forgotPassword} variant="secondary" fullWidth>
        Request a new reset link
      </Button>
    </form>
  );
}

