import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Compass,
  Download,
  Film,
  Flame,
  Info,
  Loader2,
  RotateCcw,
  Ruler,
  Sparkles,
  Target,
} from 'lucide-react';
import { Badge, Button, Card, Container, Notice, VideoPlayer } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { useAnalysis } from '@/context/AnalysisContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/utils/cn';
import { computeScale } from '@/utils/calibration';
import styles from './InsightsPage.module.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5001/api';
const SERVER_BASE = API_BASE_URL.replace(/\/api\/?$/, '');

const TAB_KEYS = ['cadence', 'stride', 'elbow', 'knee', 'head', 'wrist'];

function getTabIcon(id) {
  switch (id) {
    case 'cadence':
      return <Activity size={16} />;
    case 'stride':
      return <Ruler size={16} />;
    case 'elbow':
      return <RotateCcw size={16} />;
    case 'knee':
      return <Target size={16} />;
    case 'head':
      return <Compass size={16} />;
    case 'wrist':
      return <Flame size={16} />;
    default:
      return <Film size={16} />;
  }
}

export default function InsightsPage() {
  useDocumentTitle('Insights • PitchIQ');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    sessionId: contextSessionId,
    file,
    videoUrl,
    bowlingArm: contextArm,
    calibration: contextCalib,
  } = useAnalysis();

  // Prefer session from URL query, then AnalysisContext, then fallback to 'latest'
  const requestedSession =
    searchParams.get('session') ||
    searchParams.get('sessionId') ||
    contextSessionId ||
    'latest';

  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('cadence');
  const [showPlot, setShowPlot] = useState(false);
  const [size, setSize] = useState(null);

  // Fetch real calculated insights from backend API
  useEffect(() => {
    let isMounted = true;
    async function fetchInsights() {
      try {
        setLoading(true);
        setError('');
        const url = `${API_BASE_URL}/results/${requestedSession}/insights`;
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to load insights (HTTP ${res.status})`);
        }
        const json = await res.json();
        if (json.success && json.data) {
          if (isMounted) setSessionData(json.data);
        } else {
          throw new Error(json.error || 'No insights data returned from server');
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching real insights:', err);
          setError(err.message || 'Could not load analysis results from backend.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchInsights();
    return () => {
      isMounted = false;
    };
  }, [requestedSession]);

  // Calibration scale computation if points exist in context
  const contextScale = useMemo(() => {
    if (contextCalib?.points?.length === 2 && contextCalib?.stumpHeightM) {
      return computeScale(contextCalib.points, size, contextCalib.stumpHeightM);
    }
    return null;
  }, [contextCalib, size]);

  // Display metadata (purely from real data)
  const displayArm = contextArm
    ? contextArm.toUpperCase() === 'L' || contextArm.toLowerCase() === 'left' ? 'Left' : 'Right'
    : sessionData?.bowling_arm || 'Right';

  const displayStumpHeight = contextCalib?.stumpHeightM || sessionData?.stump_height_m || 0.711;

  const displayScale = contextScale
    ? contextScale.pixelsPerMetre.toFixed(1)
    : sessionData?.scale_pixels_per_m
      ? Number(sessionData.scale_pixels_per_m).toFixed(1)
      : null;

  // Real parameters dictionary from backend calculations
  const parameters = sessionData?.parameters || null;
  const currentParam = parameters ? (parameters[activeTab] || parameters.cadence) : null;

  // Resolve video source with server base
  const annotatedVideoSrc = useMemo(() => {
    if (!currentParam?.video) return '';
    if (currentParam.video.startsWith('http')) return currentParam.video;
    return `${SERVER_BASE}${currentParam.video}`;
  }, [currentParam]);

  const plotSrc = useMemo(() => {
    if (!currentParam?.plot) return null;
    if (currentParam.plot.startsWith('http')) return currentParam.plot;
    return `${SERVER_BASE}${currentParam.plot}`;
  }, [currentParam]);

  if (loading) {
    return (
      <Container className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <span className={styles.eyebrow}>Biomechanics Lab · Delivery Analysis</span>
            <h1 className={styles.title}>Bowling Insights</h1>
            <p className={styles.subtitle}>
              Retrieving real movement metrics and skeletal tracking calculations...
            </p>
          </div>
        </div>
        <Card className={styles.loadingBox}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto var(--space-3)', display: 'block', color: 'var(--color-primary)' }} />
          <p style={{ fontWeight: 600, color: 'var(--color-ink)' }}>Loading real analysis results...</p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--fs-sm)', margin: '4px 0 0' }}>
            Reading parameters for session {requestedSession} from PitchIQ analysis database.
          </p>
        </Card>
      </Container>
    );
  }

  if (error || !sessionData) {
    return (
      <Container className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <span className={styles.eyebrow}>Biomechanics Lab · Delivery Analysis</span>
            <h1 className={styles.title}>Bowling Insights</h1>
          </div>
        </div>
        <Notice variant="danger">
          <AlertCircle size={18} style={{ marginRight: 6 }} />
          {error || 'No analysis data found for this session.'}
        </Notice>
        <Card style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <p style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text)' }}>
            Start a new delivery analysis or return to your dashboard to select an analysis session.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Button variant="primary" onClick={() => navigate(ROUTES.upload)}>Upload New Video</Button>
            <Button variant="secondary" onClick={() => navigate(ROUTES.analyses)}>View All Analyses</Button>
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <span className={styles.eyebrow}>Biomechanics Lab · Delivery Analysis</span>
          <h1 className={styles.title}>Bowling Insights</h1>
          <p className={styles.subtitle}>
            Multi-point skeletal tracking, kinematic measurements and automated delivery verification.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Badge variant="accent">
            <Sparkles size={13} style={{ marginRight: 4 }} />
            Session {sessionData.session_id}
          </Badge>
          <Badge variant="neutral">Calculations Verified</Badge>
        </div>
      </div>

      {/* Main Delivery Video (if uploaded locally) */}
      {videoUrl && (
        <VideoPlayer
          src={videoUrl}
          badge="Raw Delivery • Full View"
          onLoadedMetadata={(e) => setSize({ width: e.currentTarget.videoWidth, height: e.currentTarget.videoHeight })}
        />
      )}

      {/* Overview Card with Bowling Arm and Stump Height */}
      <Card className={styles.overviewCard}>
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Bowling Arm</span>
            <p className={styles.metaValue}>{displayArm} Arm</p>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Stump Height</span>
            <p className={styles.metaValue}>{displayStumpHeight} m</p>
          </div>
          {displayScale && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Calibrated Scale</span>
              <p className={styles.metaValue}>{displayScale} px / m</p>
            </div>
          )}
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Video Capture</span>
            <p className={styles.metaValue}>
              {sessionData.fps} fps · {sessionData.total_frames} frames
            </p>
          </div>
        </div>

        <hr className={styles.divider} />

        {/* 6 TABS BELOW THE BOWLING ARM AND STUMP HEIGHT */}
        <div className={styles.tabsSection}>
          <div className={styles.tabsHeader}>
            <h2 className={styles.tabsTitle}>6 Key Parameters</h2>
            <span className={styles.tabsSubtitle}>
              Click any parameter tab below to inspect its detailed metrics and annotated motion video.
            </span>
          </div>

          <div className={styles.tabsList} role="tablist" aria-label="Bowling Biomechanical Parameters">
            {TAB_KEYS.map((key, idx) => {
              const param = parameters[key];
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`tab-${key}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${key}`}
                  className={cn(styles.tabButton, isActive && styles.tabButtonActive)}
                  onClick={() => {
                    setActiveTab(key);
                    setShowPlot(false);
                  }}
                >
                  {getTabIcon(key)}
                  <span>{param?.name || key}</span>
                  <span className={styles.tabBadge}>0{idx + 1}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ACTIVE TAB CONTENT: ANNOTATED VIDEO + DETAILS */}
        {currentParam && (
          <div
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className={styles.tabPanel}
          >
            {/* Left Column: Annotated Video Player */}
            <div className={styles.videoColumn}>
              <div className={styles.videoCard}>
                <div className={styles.videoHeader}>
                  <div className={styles.videoTitle}>
                    <Film size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
                    {currentParam.name} · Annotated Tracking Video
                  </div>
                  <div className={styles.videoActions}>
                    <a
                      href={annotatedVideoSrc}
                      download={currentParam.videoName || 'annotated_video.mp4'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.downloadLink}
                    >
                      <Download size={13} />
                      Export MP4
                    </a>
                  </div>
                </div>

                {/* Key ensures video element refreshes properly when switching tabs */}
                <VideoPlayer
                  key={activeTab}
                  src={annotatedVideoSrc}
                  badge={`${currentParam.shortName || currentParam.name} • Annotated`}
                  defaultRate={0.5}
                />
              </div>

              {/* Coaching Tip */}
              {currentParam.coachingTip && (
                <div className={styles.coachingTip}>
                  <Info size={18} className={styles.tipIcon} />
                  <div>
                    <strong>Biomechanical Assessment: </strong>
                    <p className={styles.tipText}>{currentParam.coachingTip}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Parameter Details & Measurements */}
            <div className={styles.detailsColumn}>
              <div className={styles.detailsCard}>
                <div className={styles.paramHeading}>
                  <div>
                    <h3 className={styles.paramName}>{currentParam.name}</h3>
                    <p className={styles.paramSummary}>{currentParam.summary}</p>
                  </div>
                  <Badge variant="accent">Measured</Badge>
                </div>

                {/* KPI Metrics Grid */}
                <div className={styles.metricsGrid}>
                  {currentParam.metrics?.map((m, idx) => (
                    <div
                      key={idx}
                      className={cn(styles.metricBox, m.highlight && styles.metricBoxHighlight)}
                    >
                      <span className={styles.metricBoxLabel}>{m.label}</span>
                      <span className={styles.metricBoxValue}>{m.value}</span>
                    </div>
                  ))}
                </div>

                {/* Detailed Breakdown Rows */}
                <div className={styles.detailsTable}>
                  {currentParam.details?.map((d, idx) => (
                    <div key={idx} className={styles.detailRow}>
                      <span className={styles.detailLabel}>{d.label}</span>
                      <span className={styles.detailValue}>{d.value}</span>
                    </div>
                  ))}
                </div>

                {/* Diagnostic Plot Toggle (if available) */}
                {plotSrc && (
                  <div>
                    <div className={styles.plotToggle}>
                      <span className={styles.detailLabel} style={{ fontWeight: 500 }}>
                        Diagnostic Time-Series Plot
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowPlot((v) => !v)}
                      >
                        {showPlot ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {showPlot ? 'Hide Plot' : 'View Plot'}
                      </Button>
                    </div>

                    {showPlot && (
                      <div className={styles.plotContainer}>
                        <img
                          src={plotSrc}
                          alt={`${currentParam.name} Analysis Plot`}
                          className={styles.plotImage}
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
    </Container>
  );
}
