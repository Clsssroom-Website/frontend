import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Đăng ký thất bại! Vui lòng thử lại.");
      } else {
        setSuccess("Đăng ký thành công! Đang chuyển hướng đến đăng nhập...");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message ?? "Lỗi kết nối. Vui lòng kiểm tra lại mạng!");
      } else {
        setError("Lỗi lạ xảy ra!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Tạo tài khoản <span className="text-indigo-600">SmartClass</span>
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Đăng nhập ngay
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
          
          {/* Thông báo lỗi */}
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Thông báo thành công */}
          {success && (
            <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole("teacher")}
                className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${
                  role === "teacher"
                    ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 shadow-sm"
                }`}
              >
                <span className="text-3xl mb-2">👨‍🏫</span>
                <span className={`text-sm font-semibold ${role === "teacher" ? "text-indigo-700" : "text-gray-700"}`}>
                  Teacher
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRole("student")}
                className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${
                  role === "student"
                    ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 shadow-sm"
                }`}
              >
                <span className="text-3xl mb-2">🧑‍🎓</span>
                <span className={`text-sm font-semibold ${role === "student" ? "text-indigo-700" : "text-gray-700"}`}>
                  Student
                </span>
              </button>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Họ và Tên
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Địa chỉ Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Xác nhận mật khẩu
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Đang xử lý..." : "Đăng ký tài khoản"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
