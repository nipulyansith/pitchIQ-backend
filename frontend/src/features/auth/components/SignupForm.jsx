import { Link, useNavigate } from 'react-router-dom';
import { Button, Checkbox, Input, PasswordInput, Select } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/context/AuthContext';
import { useForm } from '@/hooks/useForm';
import { isEmail, minLength } from '@/utils/validators';
import styles from './AuthForm.module.css';

export default function SignupForm() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const { values, errors, submitError, submitting, handleChange, handleSubmit } = useForm({
    initialValues: { name: '', email: '', password: '', role: 'coach', agree: false },
    validate: (v) => ({
      ...(!v.name.trim() && { name: 'Enter your name.' }),
      ...(!isEmail(v.email) && { email: 'Enter a valid email address.' }),
      ...(!minLength(v.password, 8) && { password: 'Use at least 8 characters.' }),
      ...(!['coach', 'player'].includes(v.role) && { role: 'Select an account type.' }),
      ...(!v.agree && { agree: 'Agree to the terms to continue.' }),
    }),
    // TODO: route to your plan/payment step once it exists.
    onSubmit: async (v) => {
      const result = await signup(v);
      navigate(result.user.role === 'coach' ? ROUTES.upload : ROUTES.playerDevelopment, { replace: true });
    },
  });

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <p className={styles.eyebrow}>Get started</p>
      <h1 className={styles.title}>Create your account.</h1>
      <p className={styles.lead}>Create your account, then choose a plan and complete payment to unlock analysis access.</p>

      <Input label="Full name" name="name" autoComplete="name" placeholder="Your name"
        value={values.name} onChange={handleChange} error={errors.name} />
      <Input label="Email address" name="email" type="email" autoComplete="email" placeholder="you@example.com"
        value={values.email} onChange={handleChange} error={errors.email} />
      <PasswordInput label="Password" name="password" autoComplete="new-password" placeholder="Create a password"
        hint="Use at least 8 characters." value={values.password} onChange={handleChange} error={errors.password} />
      <Select
        label="I am signing up as"
        name="role"
        value={values.role}
        onChange={handleChange}
        error={errors.role}
        options={[
          { value: 'coach', label: 'Coach — analyse bowlers' },
          { value: 'player', label: 'Player — coming soon' },
        ]}
      />

      <div>
        <Checkbox
          label={<>I agree to the Terms of service and Privacy policy.</>}
          name="agree" checked={values.agree} onChange={handleChange}
        />
        {errors.agree && <p className={styles.fieldError} role="alert">{errors.agree}</p>}
      </div>

      {submitError && <p className={styles.submitError} role="alert">{submitError}</p>}
      <Button type="submit" fullWidth loading={submitting}>Create account &amp; continue</Button>
      <p className={styles.switch}>Already have an account? <Link to={ROUTES.login}>Log in</Link></p>
      <p className={styles.next}>Next: choose a plan, confirm your quote, and pay to start your analyses.</p>
    </form>
  );
}
