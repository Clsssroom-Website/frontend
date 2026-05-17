export default function TeacherDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">Tổng quan hoạt động giảng dạy của bạn.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Lớp đang dạy</p>
          <p className="text-3xl font-bold text-indigo-600">—</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Tổng học sinh</p>
          <p className="text-3xl font-bold text-green-600">—</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Bài tập đã giao</p>
          <p className="text-3xl font-bold text-orange-500">—</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex flex-col items-center justify-center min-h-[200px] text-center">
        <p className="text-gray-400">Tính năng đang được phát triển...</p>
      </div>
    </div>
  );
}
