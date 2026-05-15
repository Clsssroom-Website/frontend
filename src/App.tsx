import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import DashboardPage from './pages/dashboard/Dashboard';
import ClassroomsPage from './pages/classes/Classes';
import ClassroomDetail from './pages/classes/ClassDetail';
import UsersPage from './pages/users/Users';
import SettingsPage from './pages/settings/Settings';
import ReportsPage from './pages/reports/Reports';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/classes" element={<ClassroomsPage />} />
          <Route path="/classes/:classId" element={<ClassroomDetail />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          {/* fallback routes */}
          <Route path="/courses" element={<ClassroomsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
