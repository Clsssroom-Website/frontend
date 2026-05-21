import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import LoginPage from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";
import StudentDashboard from "./pages/student/dashboard/Dashboard";
import TeacherDashboard from "./pages/teacher/dashboard/Dashboard";
import TeacherClasses from "./pages/teacher/classes/TeacherClasses";
import StudentClasses from "./pages/student/classes/StudentClasses";
import TeacherClassDetail from "./pages/teacher/classes/ClassDetail";
import StudentClassDetail from "./pages/student/classes/ClassDetail";
import SettingsPage from "./pages/student/settings/Settings";
import ReportsPage from "./pages/teacher/reports/Reports";

import GuestGuard from "./components/guards/GuestGuard";
import AuthGuard from "./components/guards/AuthGuard";
import RoleGuard from "./components/guards/RoleGuard";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <ThemeProvider>
      <Toaster position="top-right" reverseOrder={false} />
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
              <Route path="/teacher/dashboard" element={<TeacherDashboard/>} />
              <Route path="/teacher/classes" element={<TeacherClasses />} />
              <Route path="/teacher/classes/:classId" element={<TeacherClassDetail />} />
              <Route path="/teacher/reports" element={<ReportsPage />} />
            </Route>

            {/* Student Routes */}
            <Route element={<RoleGuard allowedRoles={["student"]} />}>
              <Route path="/student/dashboard" element={<StudentDashboard/>} />
              <Route path="/student/classes" element={<StudentClasses />} />
              <Route path="/student/classes/:classId" element={<StudentClassDetail />} />
              <Route path="/student/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/403" element={<div className="flex h-screen items-center justify-center text-2xl font-bold">403 - Forbidden</div>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
