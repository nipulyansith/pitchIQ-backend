import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Badge, Button, Container, Logo } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

const PUBLIC_LINKS = [
  { to: ROUTES.howItWorks, label: 'How it works' },
  { to: ROUTES.pricing, label: 'Pricing' },
];

const APP_TABS = [
  { to: ROUTES.dashboard, label: 'Dashboard' },
  { to: ROUTES.analyses, label: 'My analyses' },
  { to: ROUTES.team, label: 'Team & athletes' },
  { to: ROUTES.profile, label: 'My profile' },
  { to: ROUTES.billing, label: 'Billing & subscription' },
];

export default function Navbar({ variant = 'public' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const initials = (user?.name || 'Anura Kumara')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const publicLinkClass = ({ isActive }) =>
    `${styles.link} ${isActive ? styles.active : ''}`;

  const tabClass = ({ isActive }) =>
    `${styles.tabLink} ${isActive ? styles.activeTab : ''}`;

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      navigate(ROUTES.home, { replace: true });
      setLoggingOut(false);
    }
  };

  if (variant === 'public') {
    return (
      <header className={styles.header}>
        <Container className={styles.inner}>
          <Logo />
          <nav className={styles.nav} aria-label="Main">
            {PUBLIC_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={publicLinkClass}>
                {l.label}
              </NavLink>
            ))}
            <NavLink to={ROUTES.login} className={publicLinkClass}>
              Log in
            </NavLink>
            <Button to={ROUTES.signup}>Sign up</Button>
          </nav>
        </Container>
      </header>
    );
  }

  return (
    <header className={styles.appHeader}>
      <div className={styles.topRow}>
        <Container className={styles.topInner}>
          <Logo />
          <div className={styles.userSection}>
            <Badge variant="success">Academy active</Badge>
            <span className={styles.workspaceName}>Colombo Pace Academy</span>
            <span className={styles.avatar} title={user?.name || 'Anura Kumara'}>
              {initials}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              loading={loggingOut}
              aria-label="Log out of PitchIQ"
            >
              Log out
            </Button>
          </div>
        </Container>
      </div>
      <div className={styles.tabsRow}>
        <Container className={styles.tabsInner}>
          <nav className={styles.tabNav} aria-label="Workspace Navigation">
            {APP_TABS.map((tab) => (
              <NavLink key={tab.to} to={tab.to} className={tabClass}>
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </Container>
      </div>
    </header>
  );
}
