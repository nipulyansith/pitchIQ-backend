import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Container,
  FilterPills,
  Input,
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
import styles from './AnalysesPage.module.css';

const SAMPLE_ANALYSES = [
  {
    id: '1',
    filename: 'delivery-side-view.mp4',
    athlete: 'Nuwan Perera',
    arm: 'Right',
    uploaded: '26 Oct 2026',
    status: 'ready',
    actionText: 'Open Insights / Export',
    actionTo: ROUTES.insights,
  },
  {
    id: '2',
    filename: 'pace-session-02.mp4',
    athlete: 'Nuwan Perera',
    arm: 'Right',
    uploaded: '25 Oct 2026',
    status: 'ready',
    actionText: 'Open Insights / Export',
    actionTo: ROUTES.insights,
  },
  {
    id: '3',
    filename: 'left-arm-01.mp4',
    athlete: 'Kavindi Silva',
    arm: 'Left',
    uploaded: '26 Oct 2026',
    status: 'processing',
    actionText: 'Refresh status',
    actionTo: '#',
  },
  {
    id: '4',
    filename: 'net-session-03.mov',
    athlete: 'Dilan Fernando',
    arm: 'Right',
    uploaded: '26 Oct 2026',
    status: 'failed',
    actionText: 'Retry upload',
    actionTo: ROUTES.upload,
  },
  {
    id: '5',
    filename: 'run-up-04.mp4',
    athlete: 'Amal Jayasinghe',
    arm: 'Right',
    uploaded: '22 Oct 2026',
    status: 'ready',
    actionText: 'Open Insights / Export',
    actionTo: ROUTES.insights,
  },
  {
    id: '6',
    filename: 'delivery-05.mp4',
    athlete: 'Nuwan Perera',
    arm: 'Right',
    uploaded: '19 Oct 2026',
    status: 'ready',
    actionText: 'Open Insights / Export',
    actionTo: ROUTES.insights,
  },
];

export default function AnalysesPage() {
  useDocumentTitle('My analyses');
  const [activePill, setActivePill] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('current');

  const filterOptions = [
    { id: 'all', label: 'All', count: 32 },
    { id: 'ready', label: 'Ready', count: 30 },
    { id: 'processing', label: 'Processing', count: 1 },
    { id: 'failed', label: 'Failed', count: 1 },
  ];

  // Client filtering
  const filteredData = SAMPLE_ANALYSES.filter((item) => {
    if (activePill !== 'all' && item.status !== activePill) return false;
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!item.filename.toLowerCase().includes(q) && !item.athlete.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <Container className={styles.container}>
      <SectionHeader
        eyebrow="WORKSPACE / MY ANALYSES"
        title="Every session, in one place."
        description="32 saved analyses · 30 ready, 1 processing, 1 failed · Illustrative records"
        action={<Button to={ROUTES.upload}>Upload new video</Button>}
      />

      {/* Main Filter & Table Card */}
      <Card className={styles.mainCard} padded={false}>
        {/* Filter controls row */}
        <div className={styles.filterBar}>
          <div className={styles.filterInputsRow}>
            <Input
              label="Search analyses"
              placeholder="Search filename or athlete"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.filterInput}
            />
            <Select
              label="Athlete"
              value={selectedAthlete}
              onChange={(e) => setSelectedAthlete(e.target.value)}
              options={[
                { value: 'all', label: 'All athletes' },
                { value: 'nuwan', label: 'Nuwan Perera' },
                { value: 'kavindi', label: 'Kavindi Silva' },
                { value: 'dilan', label: 'Dilan Fernando' },
                { value: 'amal', label: 'Amal Jayasinghe' },
              ]}
              className={styles.filterInput}
            />
            <Select
              label="Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'ready', label: 'Ready' },
                { value: 'processing', label: 'Processing' },
                { value: 'failed', label: 'Failed' },
              ]}
              className={styles.filterInput}
            />
            <Select
              label="Date range"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              options={[
                { value: 'current', label: '12–26 Oct 2026' },
                { value: 'month', label: 'Last 30 days' },
                { value: 'all', label: 'All time' },
              ]}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.pillsRow}>
            <FilterPills
              options={filterOptions}
              value={activePill}
              onChange={setActivePill}
            />
          </div>
        </div>

        {/* Sessions Table */}
        <Table>
          <Thead>
            <Tr>
              <Th>Video</Th>
              <Th>Athlete / arm</Th>
              <Th>Uploaded</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredData.map((row) => (
              <Tr key={row.id}>
                <Td>
                  <strong>{row.filename}</strong>
                </Td>
                <Td>
                  {row.athlete} · {row.arm}
                </Td>
                <Td>{row.uploaded}</Td>
                <Td>
                  {row.status === 'ready' && <Badge variant="success">Ready</Badge>}
                  {row.status === 'processing' && <Badge variant="warning">Processing</Badge>}
                  {row.status === 'failed' && <Badge variant="danger">Failed</Badge>}
                </Td>
                <Td>
                  <Link to={row.actionTo} className={styles.actionLink}>
                    {row.actionText}
                  </Link>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        {/* Pagination bar */}
        <div className={styles.paginationRow}>
          <span className={styles.paginationCount}>
            Showing 1–{filteredData.length} of 32 analyses
          </span>
          <div className={styles.paginationControls}>
            <Button variant="secondary" size="sm">
              Previous
            </Button>
            <Badge variant="neutral" className={styles.pageBadge}>
              Page 1 of 6
            </Badge>
            <Button variant="secondary" size="sm">
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Status Cards (Processing & Failed) */}
      <div className={styles.statusCardsGrid}>
        <Card className={styles.statusCard}>
          <div className={styles.statusCardHeader}>
            <h3 className={styles.statusCardTitle}>Processing: left-arm-01.mp4</h3>
            <Badge variant="warning">Processing</Badge>
          </div>
          <p className={styles.statusCardDesc}>
            The video is being analysed. Check the status before opening Insights; no report is available yet.
          </p>
          <Button variant="secondary" size="sm" className={styles.statusCardBtn}>
            Refresh analysis status
          </Button>
        </Card>

        <Card className={styles.statusCard}>
          <div className={styles.statusCardHeader}>
            <h3 className={styles.statusCardTitle}>Failed: net-session-03.mov</h3>
            <Badge variant="danger">Upload interrupted</Badge>
          </div>
          <p className={styles.statusCardDesc}>
            Try the original video again. Retry returns to Upload video, then Bowling arm selection and Stump calibration before Insights.
          </p>
          <Button to={ROUTES.upload} variant="secondary" size="sm" className={styles.statusCardBtn}>
            Retry upload
          </Button>
        </Card>
      </div>

      <PageDisclaimer>
        Ready analyses reopen the existing Insights screen. Export report downloads the saved analysis; Analyse another video starts the existing four-step analysis flow.
      </PageDisclaimer>
    </Container>
  );
}

