import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Select,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './AthleteDetailPage.module.css';

export default function AthleteDetailPage() {
  useDocumentTitle('Nuwan Perera · Athlete Detail');

  const [baselineSession, setBaselineSession] = useState('session-1');
  const [comparisonSession, setComparisonSession] = useState('session-4');

  const strideData = [
    { label: '12 Oct', value: 0.20, displayValue: '0.20 s' },
    { label: '19 Oct', value: 0.19, displayValue: '0.19 s' },
    { label: '25 Oct', value: 0.19, displayValue: '0.19 s' },
    { label: '26 Oct', value: 0.18, displayValue: '0.18 s', active: true },
  ];

  const sessionHistory = [
    {
      id: 'session-1',
      sessionDate: '12 Oct 2026',
      duration: '0.20 s',
      length: '1.56 m',
      status: 'Ready',
    },
    {
      id: 'session-2',
      sessionDate: '19 Oct 2026',
      duration: '0.19 s',
      length: '1.59 m',
      status: 'Ready',
    },
    {
      id: 'session-3',
      sessionDate: '25 Oct 2026',
      duration: '0.19 s',
      length: '1.60 m',
      status: 'Ready',
    },
    {
      id: 'session-4',
      sessionDate: '26 Oct 2026',
      duration: '0.18 s',
      length: '1.62 m',
      status: 'Ready',
    },
  ];

  return (
    <Container className={styles.container}>
      <SectionHeader
        eyebrow="TEAM & ATHLETES / ATHLETE DETAIL"
        title="Nuwan Perera"
        description="Pace group · Right-arm bowler · 4 ready sessions · Illustrative athlete"
        action={<Button to={ROUTES.upload}>Upload athlete video</Button>}
      />

      <div className={styles.topGrid}>
        {/* Left card: Athlete details */}
        <Card className={styles.athleteDetailsCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Athlete details</h3>
            <Badge variant="neutral">Active roster entry</Badge>
          </div>

          <DetailList className={styles.detailsList}>
            <DetailItem label="Squad" value="Pace group" />
            <DetailItem label="Coach" value="Anura Kumara" />
            <DetailItem label="Latest session" value="26 Oct 2026" />
            <DetailItem label="Ready analyses" value="4" />
          </DetailList>

          <div className={styles.athleteActions}>
            <Button variant="secondary" size="sm">
              Edit athlete details
            </Button>
            <Button to={ROUTES.team} variant="secondary" size="sm">
              Back to team & athletes
            </Button>
          </div>
        </Card>

        {/* Right card: Delivery stride duration */}
        <Card className={styles.chartCard}>
          <div>
            <h3 className={styles.cardTitle}>Delivery stride duration · seconds</h3>
            <p className={styles.cardSub}>
              Four comparable side-on sessions · illustrative measurements
            </p>
          </div>

          <BarChart data={strideData} maxHeight={110} />

          <div className={styles.statSummaryRow}>
            <span className={styles.statLabel}>Stride length · first &rarr; latest</span>
            <span className={styles.statValue}>1.56 &rarr; 1.62 m</span>
          </div>

          <p className={styles.statNote}>
            Duration changed from 0.20 to 0.18 s and stride length from 1.56 to 1.62 m.
            These are descriptive changes, not evidence of improvement or injury.
          </p>
        </Card>
      </div>

      {/* Bottom card: Session history & comparison */}
      <Card className={styles.historyCard} padded={false}>
        <div className={styles.historyHeader}>
          <h3 className={styles.cardTitle}>Session history & comparison</h3>

          <div className={styles.comparisonControls}>
            <Select
              label="Baseline session"
              value={baselineSession}
              onChange={(e) => setBaselineSession(e.target.value)}
              options={[
                { value: 'session-1', label: '12 Oct 2026 · delivery-01.mp4' },
                { value: 'session-2', label: '19 Oct 2026 · delivery-02.mp4' },
                { value: 'session-3', label: '25 Oct 2026 · pace-session-02.mp4' },
              ]}
              className={styles.sessionSelect}
            />
            <Select
              label="Comparison session"
              value={comparisonSession}
              onChange={(e) => setComparisonSession(e.target.value)}
              options={[
                { value: 'session-4', label: '26 Oct 2026 · delivery-side-view.mp4' },
                { value: 'session-3', label: '25 Oct 2026 · pace-session-02.mp4' },
              ]}
              className={styles.sessionSelect}
            />
            <Button className={styles.compareBtn}>
              Compare selected sessions
            </Button>
          </div>
        </div>

        <Table>
          <Thead>
            <Tr>
              <Th>Session</Th>
              <Th>Stride duration</Th>
              <Th>Stride length</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sessionHistory.map((s) => (
              <Tr key={s.id}>
                <Td><strong>{s.sessionDate}</strong></Td>
                <Td>{s.duration}</Td>
                <Td>{s.length}</Td>
                <Td>
                  <Badge variant="success">{s.status}</Badge>
                </Td>
                <Td>
                  <Link to={ROUTES.insights} className={styles.actionLink}>
                    Open Insights / Export
                  </Link>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        <div className={styles.historyFooter}>
          <p className={styles.historyFooterNote}>
            Compare recordings with similar camera views and calibration. Open the existing Insights screen for each complete report.
          </p>
        </div>
      </Card>

      <PageDisclaimer>
        Movement metrics and injury-risk flags are descriptive, not a medical diagnosis or a judgement of bowling legality. Camera position and calibration affect estimates.
      </PageDisclaimer>
    </Container>
  );
}

