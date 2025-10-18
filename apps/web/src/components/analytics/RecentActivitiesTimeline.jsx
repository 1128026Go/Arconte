import { memo } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, AlertCircle } from 'lucide-react';

function RecentActivitiesTimeline({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-500">
        <FileText className="w-12 h-12 mb-2 text-gray-300" />
        <p>No hay actividades recientes</p>
      </div>
    );
  }

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-blue-500 bg-blue-50';
      case 'low':
        return 'border-gray-500 bg-gray-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getUrgencyIcon = (urgency) => {
    if (urgency === 'critical' || urgency === 'high') {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
    return <Clock className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {activities.map((activity, index) => (
        <div key={activity.id} className="relative">
          {/* Timeline line */}
          {index !== activities.length - 1 && (
            <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>
          )}

          {/* Activity card */}
          <div className="flex gap-4">
            {/* Timeline dot */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 ${getUrgencyColor(activity.urgency_level)} flex items-center justify-center z-10`}>
              {getUrgencyIcon(activity.urgency_level)}
            </div>

            {/* Content */}
            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <Link
                  to={`/cases/${activity.case_id}`}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {activity.case_number}
                </Link>
                <span className="text-xs text-gray-500">
                  {activity.relative_date}
                </span>
              </div>

              <p className="text-sm text-gray-900 font-medium mb-1">
                {activity.act_type}
              </p>

              {activity.annotation && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {activity.annotation}
                </p>
              )}

              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {activity.case_type}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {activity.formatted_date}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when activities haven't changed
export default memo(RecentActivitiesTimeline);
