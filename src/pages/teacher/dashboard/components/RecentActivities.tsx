import type { RecentActivity } from './types';

interface RecentActivitiesProps {
  activities: RecentActivity[];
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h2>
      </div>
      <div className="p-6 flex-1">
        <div className="relative border-l border-gray-200 ml-3 space-y-6">
          {activities.map((activity) => (
            <div key={activity.id} className="relative pl-6">
              <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-gray-200 border-2 border-white rounded-full"></div>
              <div>
                <p className="text-sm text-gray-800">{activity.description}</p>
                <span className="text-xs text-gray-400 mt-1 block">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
