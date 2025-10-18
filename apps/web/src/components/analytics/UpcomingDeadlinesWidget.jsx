import { memo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Calendar, Clock } from 'lucide-react';

function UpcomingDeadlinesWidget({ deadlines }) {
  if (!deadlines || deadlines.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Calendar className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">
              ¡Todo al día!
            </h3>
            <p className="text-sm text-green-700">
              No tienes plazos críticos próximos a vencer
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getDeadlineStyle = (deadline) => {
    if (deadline.is_overdue) {
      return {
        bg: 'bg-red-50',
        border: 'border-red-300',
        icon: 'text-red-600',
        text: 'text-red-900',
        badge: 'bg-red-100 text-red-800',
      };
    }
    if (deadline.is_urgent) {
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-300',
        icon: 'text-orange-600',
        text: 'text-orange-900',
        badge: 'bg-orange-100 text-orange-800',
      };
    }
    return {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      icon: 'text-yellow-600',
      text: 'text-yellow-900',
      badge: 'bg-yellow-100 text-yellow-800',
    };
  };

  const getDeadlineLabel = (deadline) => {
    if (deadline.is_overdue) {
      return `Vencido hace ${Math.abs(deadline.days_until)} días`;
    }
    if (deadline.days_until === 0) {
      return 'Vence hoy';
    }
    if (deadline.days_until === 1) {
      return 'Vence mañana';
    }
    return `Vence en ${deadline.days_until} días`;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Plazos Próximos a Vencer
            </h3>
            <p className="text-sm text-gray-600">
              {deadlines.length} {deadlines.length === 1 ? 'plazo crítico' : 'plazos críticos'}
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {deadlines.map((deadline) => {
          const style = getDeadlineStyle(deadline);

          return (
            <div
              key={deadline.id}
              className={`p-4 ${style.bg} hover:bg-opacity-80 transition-colors`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Link
                    to={`/cases/${deadline.case_id}`}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline mb-1 block"
                  >
                    {deadline.case_number}
                  </Link>

                  <p className={`text-sm font-medium ${style.text} mb-1`}>
                    {deadline.act_type}
                  </p>

                  {deadline.annotation && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {deadline.annotation}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {deadline.formatted_date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className={`w-3 h-3 ${style.icon}`} />
                      {deadline.case_type}
                    </span>
                  </div>
                </div>

                <div className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${style.badge}`}>
                  {getDeadlineLabel(deadline)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {deadlines.length > 5 && (
        <div className="p-4 text-center border-t border-gray-200">
          <Link
            to="/cases?filter=upcoming_deadlines"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Ver todos los plazos →
          </Link>
        </div>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when deadlines haven't changed
export default memo(UpcomingDeadlinesWidget);
