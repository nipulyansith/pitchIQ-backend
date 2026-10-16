import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useAnalysis } from '@/context/AnalysisContext';
import { AnalysisStepLayout, UploadStep } from '@/features/analysis/components';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function UploadPage() {
  useDocumentTitle('Upload video');
  const navigate = useNavigate();
  const { file, reset } = useAnalysis();

  return (
    <AnalysisStepLayout
      stepIndex={0}
      eyebrow="Step 01 / Video"
      title="Start with a delivery."
      description="Upload a bowling video with a clear view of the full action."
      footer={{
        back: { label: 'Cancel', onClick: () => { reset(); navigate(ROUTES.home); } },
        status: file ? '1 video selected' : 'No video selected',
        next: { label: 'Choose bowling arm', disabled: !file, onClick: () => navigate(ROUTES.arm) },
      }}
    >
      <UploadStep />
    </AnalysisStepLayout>
  );
}
