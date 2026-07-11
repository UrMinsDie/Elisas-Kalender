import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function AdminRoute() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <main className="page narrow"><p>Lade geschützten Bereich...</p></main>;
  return isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
}
