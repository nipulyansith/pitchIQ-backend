import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { DEFAULT_STUMP_HEIGHT_M } from '@/config/constants';

const AnalysisContext = createContext(null);

const initialState = {
  file: null,
  videoUrl: null,
  bowlingArm: null,
  calibration: { points: [], stumpHeightM: DEFAULT_STUMP_HEIGHT_M, frameTime: 0 },
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_VIDEO':
      return { ...initialState, file: action.file, videoUrl: action.url };
    case 'SET_ARM':
      return { ...state, bowlingArm: action.arm };
    case 'SET_CALIBRATION':
      return { ...state, calibration: { ...state.calibration, ...action.patch } };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

/** Holds the in-progress upload → arm → calibrate flow so steps can be separate routes. */
export function AnalysisProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Free the blob URL when it changes/unmounts.
  useEffect(() => () => state.videoUrl && URL.revokeObjectURL(state.videoUrl), [state.videoUrl]);

  const actions = useMemo(
    () => ({
      setVideo: (file) => dispatch({ type: 'SET_VIDEO', file, url: URL.createObjectURL(file) }),
      setBowlingArm: (arm) => dispatch({ type: 'SET_ARM', arm }),
      setCalibration: (patch) => dispatch({ type: 'SET_CALIBRATION', patch }),
      reset: () => dispatch({ type: 'RESET' }),
    }),
    [],
  );

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);
  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export const useAnalysis = () => {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysis must be used inside <AnalysisProvider>');
  return ctx;
};
