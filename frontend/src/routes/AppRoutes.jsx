import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout, PublicLayout } from '@/components/layout';
import { ROUTES } from '@/config/routes';
import { AnalysisProvider } from '@/context/AnalysisContext';
import ProtectedRoute from './ProtectedRoute';

const HomePage = lazy(() => import('@/pages/HomePage'));
const HowItWorksPage = lazy(() => import('@/pages/HowItWorksPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const PlayerDevelopmentPage = lazy(() => import('@/pages/PlayerDevelopmentPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const AnalysesPage = lazy(() => import('@/pages/AnalysesPage'));
const AthleteDetailPage = lazy(() => import('@/pages/AthleteDetailPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const UploadPage = lazy(() => import('@/pages/UploadPage'));
const BowlingArmPage = lazy(() => import('@/pages/BowlingArmPage'));
const CalibratePage = lazy(() => import('@/pages/CalibratePage'));
const InsightsPage = lazy(() => import('@/pages/InsightsPage'));
const PlaceholderPage = lazy(() => import('@/pages/PlaceholderPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<p style={{ padding: 32 }}>Loading…</p>}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.howItWorks} element={<HowItWorksPage />} />
          <Route path={ROUTES.pricing} element={<PlaceholderPage title="Pricing" />} />
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.signup} element={<SignupPage />} />
          <Route path={ROUTES.playerDevelopment} element={<PlayerDevelopmentPage />} />
          <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AnalysisProvider><AppLayout /></AnalysisProvider>}>
            <Route path={ROUTES.dashboard} element={<DashboardPage />} />
            <Route path={ROUTES.analyses} element={<AnalysesPage />} />
            <Route path={ROUTES.team} element={<AthleteDetailPage />} />
            <Route path={ROUTES.athleteDetail} element={<AthleteDetailPage />} />
            <Route path={ROUTES.profile} element={<ProfilePage />} />
            <Route path={ROUTES.billing} element={<PlaceholderPage title="Billing & subscription" />} />
            <Route path={ROUTES.upload} element={<UploadPage />} />
            <Route path={ROUTES.arm} element={<BowlingArmPage />} />
            <Route path={ROUTES.calibrate} element={<CalibratePage />} />
            <Route path={ROUTES.insights} element={<InsightsPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
