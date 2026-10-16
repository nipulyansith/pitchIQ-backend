import { Navigate } from 'react-router-dom';
import { Card, Container, VideoPlayer } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { useAnalysis } from '@/context/AnalysisContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { computeScale } from '@/utils/calibration';
import { useState } from 'react';

/** Placeholder: wire to analysisService.createAnalysis() and render real metrics here. */
export default function InsightsPage() {
  useDocumentTitle('Insights');
  const { file, videoUrl, bowlingArm, calibration } = useAnalysis();
  const [size, setSize] = useState(null);
  if (!file || calibration.points.length < 2) return <Navigate to={ROUTES.upload} replace />;

  const scale = computeScale(calibration.points, size, calibration.stumpHeightM);

  return (
    <Container style={{ paddingBlock: 'var(--space-7)', display: 'grid', gap: 'var(--space-5)' }}>
      <h1>Insights</h1>
      <VideoPlayer
        src={videoUrl}
        badge="Delivery • Side view"
        onLoadedMetadata={(e) => setSize({ width: e.currentTarget.videoWidth, height: e.currentTarget.videoHeight })}
      />
      <Card>
        <p>Bowling arm: <strong>{bowlingArm}</strong></p>
        <p>Stump height: <strong>{calibration.stumpHeightM} m</strong></p>
        {scale && <p>Scale: <strong>{scale.pixelsPerMetre.toFixed(1)} px / m</strong></p>}
        <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>Step timing, stride length, joint angles and wrist velocity will appear here.</p>
      </Card>
    </Container>
  );
}
