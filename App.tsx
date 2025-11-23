
import React, { ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { AcceptInvitationPage } from './pages/auth/AcceptInvitationPage';
import { GuestApprovalPage } from './pages/public/GuestApprovalPage';
import { DashboardHome } from './pages/dashboard/DashboardHome';
import { OrganizationSettingsPage } from './pages/dashboard/OrganizationSettingsPage';
import { ProjectsPage } from './pages/dashboard/ProjectsPage';
import { ProjectDetailsPage } from './pages/dashboard/ProjectDetailsPage';
import { ProjectIdeasPage } from './pages/dashboard/ProjectIdeasPage'; // Keeping for backward compatibility or alternative view if needed
import { ManageContentPage } from './pages/dashboard/ManageContentPage'; // New Page
import { IdeaDetailsPage } from './pages/dashboard/IdeaDetailsPage';
import { ProjectBudgetPage } from './pages/dashboard/ProjectBudgetPage';
import { ChatPage } from './pages/dashboard/ChatPage';
import { AnalyticsPage } from './pages/dashboard/AnalyticsPage';
import { MyTasksPage } from './pages/dashboard/MyTasksPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { Loader2 } from 'lucide-react';

// Guard to redirect unauthenticated users to login
const ProtectedRoute = ({ children }: { children?: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Check if there is a return URL query param (e.g. from invitation redirect)
    const searchParams = new URLSearchParams(location.search);
    const returnUrl = searchParams.get('returnUrl');
    const stateFromQuery = returnUrl ? { from: { pathname: returnUrl } } : { from: location };
    
    return <Navigate to="/login" state={stateFromQuery} replace />;
  }

  return <>{children}</>;
};

// Guard to redirect authenticated users away from auth pages
const PublicRoute = ({ children }: { children?: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    // Handle return URL if present in query params (e.g. /login?returnUrl=/invite/...)
    const searchParams = new URLSearchParams(location.search);
    const returnUrl = searchParams.get('returnUrl');
    
    if (returnUrl) {
        return <Navigate to={returnUrl} replace />;
    }
    
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <AuthLayout>
                    <LoginPage />
                  </AuthLayout>
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <AuthLayout>
                    <RegisterPage />
                  </AuthLayout>
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <AuthLayout>
                    <ForgotPasswordPage />
                  </AuthLayout>
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <AuthLayout>
                  <ResetPasswordPage />
                </AuthLayout>
              }
            />
            
            {/* Invitation Route (Semi-Public) */}
            <Route
              path="/invite/:token"
              element={
                <AcceptInvitationPage />
              }
            />

            {/* Guest Approval Route (Public) */}
            <Route
              path="/approve/:token"
              element={
                <GuestApprovalPage />
              }
            />

            {/* Protected Dashboard Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="/" element={<DashboardHome />} />
                      <Route path="/my-tasks" element={<MyTasksPage />} />
                      <Route path="/projects" element={<ProjectsPage />} />
                      <Route path="/projects/:id" element={<ProjectDetailsPage />} />
                      
                      {/* NEW: Manage Content Route (replaces /ideas for main flow) */}
                      <Route path="/projects/:id/ideas" element={<ManageContentPage />} />
                      
                      <Route path="/projects/:id/ideas/:ideaId" element={<IdeaDetailsPage />} />
                      <Route path="/projects/:id/budget" element={<ProjectBudgetPage />} />
                      <Route path="/chat" element={<ChatPage />} />
                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route path="/org-settings" element={<OrganizationSettingsPage />} />
                      <Route path="/team" element={<Navigate to="/org-settings" replace />} />
                      <Route path="/settings" element={<SettingsPage />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
