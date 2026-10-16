import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, CheckCircle2, Circle } from 'lucide-react';
import {
  Badge,
  BarChart,
  Button,
  Card,
  Container,
  DetailItem,
  DetailList,
  PageDisclaimer,
  SectionHeader,
  StatCard,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './DashboardPage.module.css';

export default function DashboardPage({ initialView = 'squad' }) {
  const [viewMode, setViewMode] = useState(initialView);
  useDocumentTitle(viewMode === 'onboarding' ? 'Get Started' : 'Dashboard');

  const sessionChartData = [
    { label: '12–18 Oct', value: 14, displayValue: '14' },
    { label: '19–25 Oct', value: 10, displayValue: '10' },
    { label: '26 Oct', value: 8, displayValue: '8', active: true },
  ];

  return (
    <Container className={styles.container}>
      {/* View Switcher for easy inspection between Onboarding & Squad views */}
      <div className={styles.stateSwitcher}>
        <span className={styles.switchLabel}>Preview state:</span>
        <button
          type="button"
          className={`${styles.switchBtn} ${viewMode === 'squad' ? styles.activeSwitch : ''}`}
          onClick={() => setViewMode('squad')}
        >
          Active Squad
        </button>
        <button
          type="button"
          className={`${styles.switchBtn} ${viewMode === 'onboarding' ? styles.activeSwitch : ''}`}
          onClick={() => setViewMode('onboarding')}
        >
          Get Started (Empty)
        </button>
      </div>

      {viewMode === 'onboarding' ? (
        /* Image 1: Onboarding / Get Started state */
        <div className={styles.pageContent}>
          <SectionHeader
            eyebrow="DASHBOARD / GET STARTED"
            title="Welcome to your academy, Anura."
            description="Your Academy plan is active. Start building a clearer picture, one delivery at a time."
          />

          <div className={styles.statsGrid3}>
            <StatCard
              label="Saved analyses"
              value="0"
              description="Your first delivery starts here"
            />
            <StatCard
              label="Athletes added"
              value="0 / 20"
              description="20 athletes in your approved plan"
            />
            <StatCard
              label="Coaches"
              value="1"
              description="You · workspace owner"
            />
          </div>

          <div className={styles.mainGrid}>
            <Card tone="dashed" className={styles.firstDeliveryCard}>
              <div className={styles.uploadIconWrap}>
                <Upload size={32} className={styles.uploadIcon} />
              </div>
              <h2 className={styles.cardTitle}>Your first delivery, in detail.</h2>
              <p className={styles.cardSubtitle}>
                Upload one clear delivery to explore timing, stride and movement.
                Your saved sessions will appear here.
              </p>
              <Button to={ROUTES.upload} className={styles.uploadBtn}>
                Upload first video
              </Button>
              <p className={styles.flowBreadcrumb}>
                Upload video &rarr; Bowling arm selection &rarr; Stump calibration &rarr; Insights
              </p>
              <Button to={ROUTES.howItWorks} variant="secondary" className={styles.guidanceBtn}>
                Recording guidance · How it works
              </Button>
            </Card>

            <Card className={styles.checklistCard}>
              <h2 className={styles.cardTitle}>Set up for better organisation</h2>
              <DetailList className={styles.checklist}>
                <DetailItem
                  icon={<CheckCircle2 size={16} className={styles.checkDone} />}
                  label="Account & plan"
                  value="Complete"
                />
                <DetailItem
                  icon={<Circle size={16} className={styles.circlePending} />}
                  label="Add your athletes"
                  value="0 of 20"
                />
                <DetailItem
                  icon={<Circle size={16} className={styles.circlePending} />}
                  label="Invite your coaches"
                  value="Optional"
                />
                <DetailItem
                  icon={<Circle size={16} className={styles.circlePending} />}
                  label="Complete My profile"
                  value="Review details"
                />
              </DetailList>
              <div className={styles.checklistActions}>
                <Button to={ROUTES.team} className={styles.actionBtn}>
                  Add athletes
                </Button>
                <Button to={ROUTES.profile} variant="secondary" className={styles.actionBtn}>
                  Complete My profile
                </Button>
              </div>
            </Card>
          </div>

          <Card tone="tint" className={styles.subscriptionBanner}>
            <div className={styles.bannerInfo}>
              <h3 className={styles.bannerTitle}>Your Academy subscription</h3>
              <p className={styles.bannerText}>
                20 athletes · LKR 1,350 each / month · LKR 27,000 monthly. Sample renewal: 12 Nov 2026.
              </p>
            </div>
            <Button to={ROUTES.billing} variant="secondary" className={styles.bannerBtn}>
              Manage plan
            </Button>
          </Card>
        </div>
      ) : (
        /* Image 3: Active Squad state */
        <div className={styles.pageContent}>
          <SectionHeader
            eyebrow="WORKSPACE / DASHBOARD"
            title="A clearer view of your squad."
            description="Colombo Pace Academy · 26 Oct 2026 · Illustrative session data"
            action={<Button to={ROUTES.upload}>Upload new video</Button>}
          />

          <div className={styles.statsGrid4}>
            <StatCard
              label="Saved analyses"
              value="32"
              description="30 ready · 1 processing · 1 failed"
            />
            <StatCard
              label="Active athletes"
              value="20"
              description="20 athletes in your Academy plan"
            />
            <StatCard
              label="Coaches"
              value="2"
              description="Anura · Minoli"
            />
            <StatCard
              label="Latest session"
              value="26 Oct"
              description="8 deliveries uploaded today"
            />
          </div>

          <div className={styles.twoColumnGrid}>
            {/* Session activity chart card */}
            <Card className={styles.chartCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardSectionTitle}>Session activity</h3>
                  <p className={styles.cardHeaderSub}>Uploads by session week · sample</p>
                </div>
                <Badge variant="neutral">32 total</Badge>
              </div>

              <BarChart data={sessionChartData} maxHeight={110} />

              <p className={styles.chartNote}>
                Periods are not equal in length. Counts describe activity, not performance improvement.
              </p>

              <div className={styles.highlightStatRow}>
                <span className={styles.highlightName}>Nuwan · delivery stride duration</span>
                <span className={styles.highlightValue}>
                  0.20 &rarr; 0.18 s
                </span>
              </div>

              <p className={styles.chartNote}>
                12 Oct vs 26 Oct · 4 comparable side-on sessions. A shorter duration is a change, not a quality judgement.
              </p>
            </Card>

            {/* Team overview card */}
            <Card className={styles.teamOverviewCard}>
              <div className={styles.teamHeader}>
                <h3 className={styles.cardSectionTitle}>Team overview</h3>
                <Badge variant="neutral">Academy · 20 athletes</Badge>
              </div>

              <DetailList className={styles.teamDetails}>
                <DetailItem label="Athletes with ready analyses" value="12 / 20" />
                <DetailItem label="Coaches" value="2" />
                <DetailItem label="Invitation pending" value="1" />
              </DetailList>

              <p className={styles.teamDescription}>
                Review athlete histories, assign videos and invite teammates.
              </p>

              <div className={styles.teamActions}>
                <Button to={ROUTES.team} variant="secondary" fullWidth>
                  Manage team & athletes
                </Button>
                <Button to={ROUTES.billing} variant="secondary" fullWidth>
                  Manage / upgrade plan
                </Button>
              </div>
            </Card>
          </div>

          {/* Recent analyses card */}
          <Card className={styles.recentAnalysesCard} padded={false}>
            <div className={styles.recentHeader}>
              <h3 className={styles.cardSectionTitle}>Recent analyses</h3>
            </div>

            {/* Highlighted video row */}
            <div className={styles.highlightDeliveryRow}>
              <div className={styles.videoMeta}>
                <img
                  src="/images/sample-delivery-poster.png"
                  alt="delivery-side-view"
                  className={styles.videoThumb}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className={styles.videoInfo}>
                  <p className={styles.videoFilename}>delivery-side-view.mp4</p>
                  <p className={styles.videoAthlete}>
                    Nuwan Perera · Right arm · 26 Oct 2026 · Ready
                  </p>
                </div>
              </div>
              <Button to={ROUTES.insights} variant="secondary" size="sm">
                Open Insights
              </Button>
            </div>

            {/* Mini Table */}
            <Table>
              <Thead>
                <Tr>
                  <Th>Athlete / session</Th>
                  <Th>Recorded</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td><strong>Nuwan</strong> · pace-session-02.mp4</Td>
                  <Td>25 Oct 2026</Td>
                  <Td>
                    <Badge variant="success">Ready</Badge>
                  </Td>
                  <Td>
                    <Link to={ROUTES.insights} className={styles.tableActionLink}>
                      Open Insights / Export
                    </Link>
                  </Td>
                </Tr>
                <Tr>
                  <Td><strong>Kavindi</strong> · left-arm-01.mp4</Td>
                  <Td>26 Oct 2026</Td>
                  <Td>
                    <Badge variant="warning">Processing</Badge>
                  </Td>
                  <Td>
                    <Link to={ROUTES.analyses} className={styles.tableActionLink}>
                      View status
                    </Link>
                  </Td>
                </Tr>
                <Tr>
                  <Td><strong>Dilan</strong> · net-session-03.mov</Td>
                  <Td>26 Oct 2026</Td>
                  <Td>
                    <Badge variant="danger">Failed · upload interrupted</Badge>
                  </Td>
                  <Td>
                    <Link to={ROUTES.upload} className={styles.tableActionLink}>
                      Retry upload
                    </Link>
                  </Td>
                </Tr>
              </Tbody>
            </Table>

            <div className={styles.recentFooter}>
              <Button to={ROUTES.analyses} variant="secondary" size="sm">
                View all My analyses
              </Button>
            </div>
          </Card>

          <PageDisclaimer>
            Movement metrics and injury-risk flags are descriptive, not a medical diagnosis or a judgement of bowling legality. Camera position and calibration affect estimates.
          </PageDisclaimer>
        </div>
      )}
    </Container>
  );
}
