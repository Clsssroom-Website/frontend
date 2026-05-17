import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import LoginPage from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";
import DashboardPage from "./pages/student/dashboard/Dashboard";
import ClassroomsPage from "./pages/classes/Classes";
import ClassroomDetail from "./pages/classes/ClassDetail";
import SettingsPage from "./pages/student/settings/Settings";
import ReportsPage from "./pages/teacher/reports/Reports";

import GuestGuard from "./components/guards/GuestGuard";
import AuthGuard from "./components/guards/AuthGuard";
import RoleGuard from "./components/guards/RoleGuard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<MainLayout />}>
          <Route path="/teacher/classes" element={<ClassroomsPage />} />
          <Route
            path="/teacher/classes/:classId"
            element={<ClassroomDetail />}
          />
          <Route path="/teacher/reports" element={<ReportsPage />} />
          <Route path="/student/dashboard" element={<DashboardPage />} />
          <Route path="/student/classes" element={<ClassroomsPage />} />
          <Route
            path="/student/classes/:classId"
            element={<ClassroomDetail />}
          />
          <Route path="/student/settings" element={<SettingsPage />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<AuthGuard />}>
          <Route element={<MainLayout />}>
            {/* Teacher Routes */}
            <Route element={<RoleGuard allowedRoles={["teacher"]} />}>
              <Route path="/teacher/classes" element={<ClassroomsPage />} />
              <Route path="/teacher/classes/:classId" element={<ClassroomDetail />} />
              <Route path="/teacher/reports" element={<ReportsPage />} />
              <Route path="/teacher/dashboard" element={<Navigate to="/teacher/classes" replace />} />
            </Route>

            {/* Student Routes */}
            <Route element={<RoleGuard allowedRoles={["student"]} />}>
              <Route path="/student/dashboard" element={<DashboardPage />} />
              <Route path="/student/settings" element={<SettingsPage />} />
              <Route path="/dashboard" element={<Navigate to="/student/dashboard" replace />} />
            </Route>
          </Route>
        </Route>

        <Route path="/403" element={<div className="flex h-screen items-center justify-center text-2xl font-bold">403 - Forbidden</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
