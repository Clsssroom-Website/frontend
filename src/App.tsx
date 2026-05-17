import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import MainLayout from "./layout/MainLayout";
import LoginPage from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";
import DashboardPage from "./pages/student/dashboard/Dashboard";
import TeacherClasses from "./pages/teacher/classes/TeacherClasses";
import StudentClasses from "./pages/student/classes/StudentClasses";
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
        
        {/* Guest Routes */}
        <Route element={<GuestGuard />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<AuthGuard />}>
          <Route element={<MainLayout />}>
            {/* Teacher Routes */}
            <Route element={<RoleGuard allowedRoles={["teacher"]} />}>
              <Route path="/teacher/dashboard" element={<Navigate to="/teacher/classes" replace />} />
              <Route path="/teacher/classes" element={<TeacherClasses />} />
              <Route path="/teacher/classes/:classId" element={<ClassroomDetail />} />
              <Route path="/teacher/reports" element={<ReportsPage />} />
            </Route>

            {/* Student Routes */}
            <Route element={<RoleGuard allowedRoles={["student"]} />}>
              <Route path="/dashboard" element={<Navigate to="/student/dashboard" replace />} />
              <Route path="/student/dashboard" element={<DashboardPage />} />
              <Route path="/student/classes" element={<StudentClasses />} />
              <Route path="/student/classes/:classId" element={<ClassroomDetail />} />
              <Route path="/student/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/403" element={<div className="flex h-screen items-center justify-center text-2xl font-bold">403 - Forbidden</div>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
