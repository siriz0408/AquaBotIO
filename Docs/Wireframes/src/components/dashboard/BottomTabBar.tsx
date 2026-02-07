import { Home, FlaskConical, Fish, Calendar, MessageSquare } from 'lucide-react';

interface BottomTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasUnreadChat: boolean;
}

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'parameters', label: 'Parameters', icon: FlaskConical },
  { id: 'species', label: 'Species', icon: Fish },
  { id: 'maintenance', label: 'Maintenance', icon: Calendar },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
];

export function BottomTabBar({ activeTab, onTabChange, hasUnreadChat }: BottomTabBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all relative ${
                isActive
                  ? 'text-[#1B998B]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.id === 'chat' && hasUnreadChat && (
                <span className="absolute top-1 right-2 w-2 h-2 bg-[#FF6B6B] rounded-full"></span>
              )}
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1B998B] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
