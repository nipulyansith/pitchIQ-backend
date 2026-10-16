import { Notice, RadioCard, VideoPlayer } from '@/components/ui';
import { BOWLING_ARMS } from '@/config/constants';
import { useAnalysis } from '@/context/AnalysisContext';
import styles from './BowlingArmStep.module.css';

export default function BowlingArmStep() {
  const { file, videoUrl, bowlingArm, setBowlingArm } = useAnalysis();

  return (
    <div className={styles.grid}>
      <div>
        <VideoPlayer src={videoUrl} badge="Delivery • Side view" />
        <div className={styles.meta}><span>{file?.name}</span><span>Side view</span></div>
      </div>

      <fieldset className={styles.choices}>
        <legend className={styles.legend}>Bowling arm</legend>
        <div className={styles.cards}>
          <RadioCard name="arm" value={BOWLING_ARMS.LEFT} checked={bowlingArm === BOWLING_ARMS.LEFT}
            onChange={setBowlingArm} title="Left arm" badge="L"
            caption={bowlingArm === BOWLING_ARMS.LEFT ? 'Selected bowling arm' : 'Choose left-arm delivery'} />
          <RadioCard name="arm" value={BOWLING_ARMS.RIGHT} checked={bowlingArm === BOWLING_ARMS.RIGHT}
            onChange={setBowlingArm} title="Right arm" badge="R"
            caption={bowlingArm === BOWLING_ARMS.RIGHT ? 'Selected bowling arm' : 'Choose right-arm delivery'} />
        </div>
        <Notice>This helps us identify the bowling side. Choose your bowling arm, even if you bat with the other hand.</Notice>
      </fieldset>
    </div>
  );
}
