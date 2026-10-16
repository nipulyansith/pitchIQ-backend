import { Navigate, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useAnalysis } from '@/context/AnalysisContext';
import { AnalysisStepLayout, StumpCalibrator } from '@/features/analysis/components';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function CalibratePage() {
  useDocumentTitle('Calibrate');
  const navigate = useNavigate();
  const { file, bowlingArm, calibration } = useAnalysis();
  if (!file || !bowlingArm) return <Navigate to={ROUTES.upload} replace />;

  const ready = calibration.points.length === 2 && calibration.stumpHeightM > 0;

  return (
    <AnalysisStepLayout
      stepIndex={2}
      tone="muted"
      eyebrow="Step 03 / Calibration"
      title="Give the video a real-world scale."
      description="Click the top, then the bottom of the same stump in the video."
      footer={{
        back: { label: 'Back to bowling arm', onClick: () => navigate(ROUTES.arm) },
        status: ready ? 'Calibration ready' : 'Mark both points to continue',
        next: { label: 'Generate insights', disabled: !ready, onClick: () => navigate(ROUTES.insights) },
      }}
    >
      <StumpCalibrator />
    </AnalysisStepLayout>
  );
}
