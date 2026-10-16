import { Navigate, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useAnalysis } from '@/context/AnalysisContext';
import { AnalysisStepLayout, BowlingArmStep } from '@/features/analysis/components';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function BowlingArmPage() {
  useDocumentTitle('Bowling arm');
  const navigate = useNavigate();
  const { file, bowlingArm } = useAnalysis();
  if (!file) return <Navigate to={ROUTES.upload} replace />;

  return (
    <AnalysisStepLayout
      stepIndex={1}
      eyebrow="Step 02 / Bowling arm"
      title="Which arm do you bowl with?"
      description="Choose the bowling arm used in this video."
      footer={{
        back: { label: 'Back to upload', onClick: () => navigate(ROUTES.upload) },
        status: bowlingArm ? `${bowlingArm === 'left' ? 'Left' : 'Right'} arm selected` : 'Select an arm to continue',
        next: { label: 'Calibrate video', disabled: !bowlingArm, onClick: () => navigate(ROUTES.calibrate) },
      }}
    >
      <BowlingArmStep />
    </AnalysisStepLayout>
  );
}
