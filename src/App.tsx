import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import MainLayout from "./layout/MainLayout";
import LoginPage from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";
import DashboardPage from "./pages/student/dashboard/Dashboard";
import TeacherDashboardPage from "./pages/teacher/dashboard/Dashboard";
import TeacherSettingsPage from "./pages/teacher/settings/Settings";
import ClassroomsPage from "./pages/classes/Classes";
import ClassroomDetail from "./pages/classes/ClassDetail";
import SettingsPage from "./pages/student/settings/Settings";
import ReportsPage from "./pages/teacher/reports/Reports";

// Guard: chưa login thì về /login, đã login thì cho vào
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = Cookies.get("token");
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Smart redirect khi vào root /
function RootRedirect() {
  const token = Cookies.get("token");
  if (!token) return <Navigate to="/login" replace />;
  try {
    const decoded = jwtDecode<{ role?: string }>(token);
    return <Navigate to={decoded.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard"} replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/teacher/dashboard" element={<TeacherDashboardPage />} />
          <Route path="/teacher/classes" element={<ClassroomsPage />} />
          <Route path="/teacher/classes/:classId" element={<ClassroomDetail />} />
          <Route path="/teacher/reports" element={<ReportsPage />} />
          <Route path="/teacher/settings" element={<TeacherSettingsPage />} />
          <Route path="/student/dashboard" element={<DashboardPage />} />
          <Route path="/student/classes" element={<ClassroomsPage />} />
          <Route path="/student/classes/:classId" element={<ClassroomDetail />} />
          <Route path="/student/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
