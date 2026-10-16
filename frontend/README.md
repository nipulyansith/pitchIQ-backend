# PitchIQ — Frontend

React 18 + Vite + React Router. Plain CSS Modules driven by design tokens.

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
```
Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` when your backend is ready.
Drop photos in `public/images/` (see the README there) — gradients show until you do.

## Folder structure
```
src/
  styles/        tokens.css (colours, fonts, spacing, radii) + global.css
  config/        constants.js, routes.js
  components/
    ui/          Reusable atoms — Button, Input, PasswordInput, Checkbox, Card, Tag,
                 Notice, Stepper, RadioCard, FileDropzone, VideoPlayer, Logo, ...
                 (each in its own folder; import from '@/components/ui')
    layout/      Navbar, Footer, PublicLayout, AppLayout, AuthLayout
  features/      Page-specific building blocks, grouped by domain
    auth/        LoginForm, SignupForm
    analysis/    AnalysisStepLayout, UploadStep, BowlingArmStep, StumpCalibrator
    home/        Hero, sections, content.js (all marketing copy)
    how-it-works/
  pages/         Thin route components that compose features
  routes/        AppRoutes (lazy-loaded), ProtectedRoute
  context/       AuthContext, AnalysisContext (upload→arm→calibrate state)
  hooks/         useForm, useDocumentTitle
  services/      apiClient + authService / analysisService (currently MOCKS)
  utils/         cn, validators, format, calibration
```

## Changing things
- **Brand colours / fonts / radii:** `src/styles/tokens.css`
- **Every button:** `components/ui/Button` (variants: primary, secondary, ghost, gradient)
- **Copy on the landing page:** `features/home/content.js`
- **Routes:** `config/routes.js`

## To wire up the backend
- `services/authService.js` and `services/analysisService.js` are mocks — replace with `apiRequest(...)` calls.
- `InsightsPage` is a placeholder; render real metrics once the API returns them.
- `Pricing` and `My analyses` are placeholder pages.
- Calibration points are stored as normalised (0–1) coordinates + `frameTime`; `utils/calibration.js` converts to pixels/metre.
