import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Checkbox, Input, PasswordInput } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/context/AuthContext';
import { useForm } from '@/hooks/useForm';
import { isEmail } from '@/utils/validators';
import styles from './AuthForm.module.css';

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from ?? ROUTES.upload;

  const { values, errors, submitError, submitting, handleChange, handleSubmit } = useForm({
    initialValues: { email: '', password: '', remember: false },
    validate: (v) => ({
      ...(!isEmail(v.email) && { email: 'Enter a valid email address.' }),
      ...(!v.password && { password: 'Enter your password.' }),
    }),
    onSubmit: async (v) => {
      const result = await login(v);
      navigate(result.user.role === 'coach' ? from : ROUTES.playerDevelopment, { replace: true });
    },
  });

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <p className={styles.eyebrow}>Welcome back</p>
      <h1 className={styles.title}>Back to your bowling.</h1>
      <p className={styles.lead}>Log in to explore your analyses.</p>

      <Input label="Email address" name="email" type="email" autoComplete="email" placeholder="you@example.com"
        value={values.email} onChange={handleChange} error={errors.email} />
      <PasswordInput label="Password" name="password" autoComplete="current-password" placeholder="Enter your password"
        value={values.password} onChange={handleChange} error={errors.password} />

      <div className={styles.row}>
        <Checkbox label="Remember me" name="remember" checked={values.remember} onChange={handleChange} />
        <Link to={ROUTES.forgotPassword} className={styles.link}>Forgot password?</Link>
      </div>

      {submitError && <p className={styles.submitError} role="alert">{submitError}</p>}
      <Button type="submit" fullWidth loading={submitting}>Log in</Button>
      <p className={styles.switch}>New to PitchIQ? <Link to={ROUTES.signup}>Sign up →</Link></p>
    </form>
  );
}
