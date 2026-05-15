import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-gray-50 font-sans">
      <main className="flex flex-col items-center justify-center p-8 bg-white shadow-xl rounded-2xl border border-gray-100 max-w-lg w-full text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          Chào mừng đến với <span className="text-indigo-600">SmartClass</span>
        </h1>
        <p className="text-gray-600 mb-8">
          Hệ thống quản lý lớp học thông minh và tiện lợi dành cho giảng viên và sinh viên.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Link
            href="/login"
            className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="flex-1 flex justify-center py-3 px-4 border border-indigo-600 rounded-lg shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
          >
            Đăng ký
          </Link>
        </div>
      </main>
    </div>
  );
}
