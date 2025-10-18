import { memo } from 'react';
import { Folder, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

function StatsCards({ summary }) {
  if (!summary) return null;

  const cards = [
    {
      title: 'Total de Casos',
      value: summary.total_cases,
      icon: Folder,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Casos Activos',
      value: summary.active_cases,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Total de Autos',
      value: summary.total_acts,
      icon: FileText,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Autos Críticos',
      value: summary.critical_acts,
      icon: AlertTriangle,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {card.title}
                </p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {card.value}
                </h3>
              </div>
              <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(StatsCards, (prevProps, nextProps) => {
  // Only re-render if summary values actually changed
  return (
    prevProps.summary?.total_cases === nextProps.summary?.total_cases &&
    prevProps.summary?.active_cases === nextProps.summary?.active_cases &&
    prevProps.summary?.total_acts === nextProps.summary?.total_acts &&
    prevProps.summary?.critical_acts === nextProps.summary?.critical_acts
  );
});
