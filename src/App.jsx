import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleGuard from './components/auth/RoleGuard';
import DashboardLayout from './components/layout/DashboardLayout';
import Loader from './components/common/Loader';
import { ROLES } from './utils/roles';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const MaidsListPage = lazy(() => import('./pages/maids/MaidsListPage'));
const MaidFormPage = lazy(() => import('./pages/maids/MaidFormPage'));
const MaidDetailPage = lazy(() => import('./pages/maids/MaidDetailPage'));
const JobsPage = lazy(() => import('./pages/JobsPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const SkillsPage = lazy(() => import('./pages/SkillsPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const CouponsPage = lazy(() => import('./pages/CouponsPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Routes>
        <Route
          path="/login"
          element={
            <Suspense fallback={<Loader fullPage />}>
              <LoginPage />
            </Suspense>
          }
        />

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
              path="maids/:id"
              element={
                <RoleGuard allowed={[ROLES.SA, ROLES.A]}>
                  <MaidDetailPage />
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
              path="skills"
              element={
                <RoleGuard allowed={[ROLES.SA, ROLES.A]}>
                  <SkillsPage />
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
              path="coupons"
              element={
                <RoleGuard allowed={[ROLES.SA]}>
                  <CouponsPage />
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
