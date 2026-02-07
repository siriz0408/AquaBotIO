import { FlaskConical, Plus, CalendarPlus } from 'lucide-react';

export function QuickActions() {
  const actions = [
    { icon: FlaskConical, label: 'Log Parameters', color: '#1B998B' },
    { icon: Plus, label: 'Add Livestock', color: '#0A2463' },
    { icon: CalendarPlus, label: 'Schedule Task', color: '#1B998B' },
  ];

  return (
    <div className="px-4">
      <div className="grid grid-cols-3 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-2"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${action.color}15` }}
            >
              <action.icon className="w-6 h-6" style={{ color: action.color }} />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center leading-tight">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
