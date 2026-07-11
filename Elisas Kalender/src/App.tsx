import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminRoute } from './components/AdminRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { PublicCalendarPage } from './pages/PublicCalendarPage';
import { RequestPage } from './pages/RequestPage';
import { RequestSuccessPage } from './pages/RequestSuccessPage';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminRequestsPage } from './pages/admin/AdminRequestsPage';
import { AdminCalendarPage } from './pages/admin/AdminCalendarPage';
import { AdminAppointmentsPage } from './pages/admin/AdminAppointmentsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/calendar" element={<PublicCalendarPage />} />
          <Route path="/request" element={<RequestPage />} />
          <Route path="/request/success" element={<RequestSuccessPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="requests" element={<AdminRequestsPage />} />
              <Route path="calendar" element={<AdminCalendarPage />} />
              <Route path="appointments" element={<AdminAppointmentsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
