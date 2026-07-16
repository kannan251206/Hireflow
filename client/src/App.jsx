import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import Navbar from './components/shared/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import ResumeBuilder from './components/candidate/ResumeBuilder';
import './index.css';

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'recruiter' ? '/recruiter' : '/candidate'} replace />;
  }
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"          element={<LandingPage />} />
        <Route path="/login"     element={user ? <Navigate to={user.role === 'recruiter' ? '/recruiter' : '/candidate'} /> : <LoginPage />} />
        <Route path="/register"  element={user ? <Navigate to={user.role === 'recruiter' ? '/recruiter' : '/candidate'} /> : <RegisterPage />} />

        <Route path="/builder"   element={<div className="page-content-wide"><ResumeBuilder /></div>} />
        <Route
          path="/candidate"
          element={
            <ProtectedRoute role="candidate">
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter"
          element={
            <ProtectedRoute role="recruiter">
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
