import { Activity } from 'lucide-react';
import type { RecentActivity } from './types';

interface RecentActivitiesProps {
  activities: RecentActivity[];
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h2>
      </div>
      <div className="p-6 flex-1 max-h-[360px] overflow-y-auto custom-scrollbar">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 h-full">
            <Activity className="w-10 h-10 mb-2 stroke-[1.5]" />
            <p className="text-sm font-medium">Chưa có hoạt động nào gần đây.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-gray-150 ml-3 space-y-6">
            {activities.map((activity) => (
              <div key={activity.submissionId} className="relative pl-6">
                <div className={`absolute -left-[7px] top-1.5 w-3 h-3 border-2 border-white rounded-full ${
                  activity.score !== null 
                    ? 'bg-emerald-500 ring-4 ring-emerald-50' 
                    : 'bg-indigo-500 ring-4 ring-indigo-50'
                }`}></div>
                <div>
                  <p className="text-sm text-gray-800 font-medium">
                    {activity.score !== null ? (
                      <>
                        Bài làm <span className="font-semibold text-gray-900">"{activity.assignmentTitle}"</span> đã được chấm <span className="text-emerald-600 font-bold">{activity.score}đ</span>
                      </>
                    ) : (
                      <>
                        Bạn đã nộp bài tập <span className="font-semibold text-gray-900">"{activity.assignmentTitle}"</span>
                      </>
                    )}
                  </p>
                  <span className="text-xs text-gray-400 mt-1 block font-medium">
                    Lớp: {activity.className} • {activity.submittedAt ? new Date(activity.submittedAt).toLocaleString('vi-VN') : 'Không rõ'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
