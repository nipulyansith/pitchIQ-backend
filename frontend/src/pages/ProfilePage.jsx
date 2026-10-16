import {
  Badge,
  Button,
  Card,
  Container,
  DetailItem,
  DetailList,
  PageDisclaimer,
  SectionHeader,
} from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/context/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  useDocumentTitle('My Profile');
  const { user } = useAuth();

  const profileData = {
    name: user?.name || 'Anura Kumara',
    email: user?.email || 'anura@example.com',
    role: 'Head coach / owner',
    workspace: 'Colombo Pace Academy',
    bowlingPref: 'Right arm',
    timezone: 'Asia / Colombo',
    initials: 'AK',
  };

  return (
    <Container className={styles.container}>
      <SectionHeader
        eyebrow="ACCOUNT / MY PROFILE"
        title="Your profile. Your perspective."
        description="Manage your personal details, workspace and preferences."
        action={<Button>Edit profile</Button>}
      />

      <div className={styles.profileGrid}>
        {/* Top-Left Card: Profile Card */}
        <Card className={styles.summaryCard}>
          <div className={styles.avatarLarge}>{profileData.initials}</div>
          <h2 className={styles.userName}>{profileData.name}</h2>
          <p className={styles.userEmail}>{profileData.email}</p>
          <div className={styles.badgeWrap}>
            <Badge variant="neutral">Workspace owner</Badge>
          </div>
          <p className={styles.userBio}>
            Head coach at Colombo Pace Academy. Illustrative sample profile.
          </p>
          <Button variant="secondary" size="sm" className={styles.settingsBtn}>
            Account settings
          </Button>
        </Card>

        {/* Top-Right Card: Personal & workspace details */}
        <Card className={styles.detailsCard}>
          <h2 className={styles.cardTitle}>Personal & workspace details</h2>

          <DetailList className={styles.detailsList}>
            <DetailItem label="Full name" value={profileData.name} />
            <DetailItem label="Email address" value={profileData.email} />
            <DetailItem label="Role" value={profileData.role} />
            <DetailItem label="Workspace" value={profileData.workspace} />
            <DetailItem label="Bowling preference" value={profileData.bowlingPref} />
            <DetailItem label="Time zone" value={profileData.timezone} />
          </DetailList>

          <p className={styles.hintNote}>
            Your bowling preference is optional and personal. Each uploaded video still requires its own bowling arm selection.
          </p>

          <Button variant="secondary" size="sm" className={styles.editPersonalBtn}>
            Edit personal details
          </Button>
        </Card>

        {/* Bottom-Left Card: Current plan */}
        <Card tone="tint" className={styles.planCard}>
          <div className={styles.planHeader}>
            <h2 className={styles.cardTitle}>Current plan</h2>
            <Badge variant="success">Academy active</Badge>
          </div>

          <p className={styles.planAthleteRate}>
            20 athletes · LKR 1,350 per athlete / month
          </p>

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Monthly total</span>
            <span className={styles.totalAmount}>LKR 27,000</span>
          </div>

          <p className={styles.renewalText}>
            Sample current period: 12 Oct–11 Nov 2026. Renews 12 Nov 2026.
          </p>

          <div className={styles.planActions}>
            <Button variant="secondary" size="sm">
              Manage billing
            </Button>
            <Button variant="secondary" size="sm">
              Upgrade / change plan
            </Button>
          </div>
        </Card>

        {/* Bottom-Right Card: Account access */}
        <Card className={styles.accessCard}>
          <h2 className={styles.cardTitle}>Account access</h2>
          <p className={styles.accessDesc}>
            Your profile is separate from your subscription. It stays available before payment and after cancellation or expiry, along with past records.
          </p>

          <div className={styles.accessActions}>
            <Button variant="secondary" size="sm">
              Password & security
            </Button>
            <Button to={ROUTES.dashboard} variant="secondary" size="sm">
              Back to dashboard
            </Button>
          </div>
        </Card>
      </div>

      <PageDisclaimer>
        Illustrative sample account · All people, quotes, payments, dates and metrics shown are examples.
      </PageDisclaimer>
    </Container>
  );
}

