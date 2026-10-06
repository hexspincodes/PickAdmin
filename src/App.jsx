import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleGuard from './components/auth/RoleGuard';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MaidsListPage from './pages/maids/MaidsListPage';
import MaidFormPage from './pages/maids/MaidFormPage';
import JobsPage from './pages/JobsPage';
import BlogPage from './pages/BlogPage';
import ContactPage from './pages/ContactPage';
import CustomersPage from './pages/CustomersPage';
import PaymentsPage from './pages/PaymentsPage';
import TeamPage from './pages/TeamPage';
import AnalyticsPage from './pages/AnalyticsPage';
import { ROLES } from './utils/roles';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />

            <Route
              path="maids"
              element={
                <RoleGuard allowed={[ROLES.SA, ROLES.A]}>
                  <MaidsListPage />
                </RoleGuard>
              }
            />
            <Route
              path="maids/new"
              element={
                <RoleGuard allowed={[ROLES.SA, ROLES.A]}>
                  <MaidFormPage />
                </RoleGuard>
              }
            />
            <Route
              path="maids/:id/edit"
              element={
                <RoleGuard allowed={[ROLES.SA, ROLES.A]}>
                  <MaidFormPage />
                </RoleGuard>
              }
            />

            <Route
              path="jobs"
              element={
                <RoleGuard allowed={[ROLES.SA, ROLES.A]}>
                  <JobsPage />
                </RoleGuard>
              }
            />

            <Route
              path="blog"
              element={
                <RoleGuard allowed={[ROLES.SA, ROLES.MARKETING]}>
                  <BlogPage />
                </RoleGuard>
              }
            />

            <Route
              path="contact"
              element={
                <RoleGuard allowed={[ROLES.SA, ROLES.A]}>
                  <ContactPage />
                </RoleGuard>
              }
            />

            <Route
              path="customers"
              element={
                <RoleGuard allowed={[ROLES.SA]}>
                  <CustomersPage />
                </RoleGuard>
              }
            />

            <Route
              path="payments"
              element={
                <RoleGuard allowed={[ROLES.SA]}>
                  <PaymentsPage />
                </RoleGuard>
              }
            />

            <Route
              path="team"
              element={
                <RoleGuard allowed={[ROLES.SA]}>
                  <TeamPage />
                </RoleGuard>
              }
            />

            <Route
              path="analytics"
              element={
                <RoleGuard allowed={[ROLES.SA]}>
                  <AnalyticsPage />
                </RoleGuard>
              }
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
