import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';

// Layout
import Layout from './components/Layout.jsx';

// Pages
import LoginPage       from './pages/LoginPage.jsx';
import RegisterPage    from './pages/RegisterPage.jsx';
import DashboardPage   from './pages/DashboardPage.jsx';
import NeedsPage       from './pages/NeedsPage.jsx';
import NeedDetailPage  from './pages/NeedDetailPage.jsx';
import CreateNeedPage  from './pages/CreateNeedPage.jsx';
import VolunteersPage  from './pages/VolunteersPage.jsx';
import VolunteerProfile from './pages/VolunteerProfile.jsx';
import TasksPage       from './pages/TasksPage.jsx';
import NeedsMap        from './pages/NeedsMap.jsx';
import ProfilePage     from './pages/ProfilePage.jsx';
import ImpactPage      from './pages/ImpactPage.jsx';

function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />

      {/* Protected */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="dashboard"  element={<DashboardPage />} />
        <Route path="needs-map"  element={<NeedsMap />} />
        <Route path="profile"    element={<ProfilePage />} />
        <Route path="impact"     element={<ImpactPage />} />

        <Route path="needs"      element={<NeedsPage />} />
        <Route path="needs/new"  element={
          <PrivateRoute roles={['COORDINATOR', 'FIELD_WORKER']}>
            <CreateNeedPage />
          </PrivateRoute>
        } />
        <Route path="needs/:id"  element={<NeedDetailPage />} />

        <Route path="volunteers"     element={<VolunteersPage />} />
        <Route path="volunteers/:id" element={<VolunteerProfile />} />

        <Route path="tasks"      element={<TasksPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
