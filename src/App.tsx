import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import LoginPage from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";
import DashboardPage from "./pages/student/dashboard/Dashboard";
import ClassroomsPage from "./pages/teacher/classes/Classes";
import ClassroomDetail from "./pages/teacher/classes/ClassDetail";
import SettingsPage from "./pages/student/settings/Settings";
import ReportsPage from "./pages/teacher/reports/Reports";

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
          <Route path="/student/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
