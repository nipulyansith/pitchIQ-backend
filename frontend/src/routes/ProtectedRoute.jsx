import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute() {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p style={{ padding: 32 }}>Checking your session…</p>;
  if (isAuthenticated && user?.role !== 'coach') {
    return <Navigate to={ROUTES.playerDevelopment} replace />;
  }
  return isAuthenticated ? <Outlet /> : <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
}
