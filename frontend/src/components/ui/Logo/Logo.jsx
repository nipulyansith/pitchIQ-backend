import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import styles from './Logo.module.css';

export function LogoMark({ size = 32 }) {
  return <img src="/images/logo.png" width={size} height={size} alt="" aria-hidden="true" />;
}

export default function Logo({ to = ROUTES.home }) {
  return (
    <Link to={to} className={styles.logo} aria-label="PitchIQ home">
      <LogoMark />
      <span className={styles.word}>PitchIQ</span>
    </Link>
  );
}
