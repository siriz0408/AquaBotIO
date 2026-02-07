import { useState } from 'react';
import { TopBar } from './dashboard/TopBar';
import { TankHeader } from './dashboard/TankHeader';
import { ParameterCards } from './dashboard/ParameterCards';
import { QuickActions } from './dashboard/QuickActions';
import { AIInsights } from './dashboard/AIInsights';
import { UpcomingMaintenance } from './dashboard/UpcomingMaintenance';
import { LivestockSummary } from './dashboard/LivestockSummary';
import { BottomTabBar } from './dashboard/BottomTabBar';
import { FloatingChatButton } from './dashboard/FloatingChatButton';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [hasUnreadChat, setHasUnreadChat] = useState(true);

  return (
    <div className="min-h-screen bg-[#F0F4F8] pb-20">
      <TopBar />
      
      <div className="overflow-y-auto">
        {activeTab === 'home' && (
          <div className="space-y-4 pb-4">
            <TankHeader />
            <ParameterCards />
            <QuickActions />
            <AIInsights />
            <UpcomingMaintenance />
            <LivestockSummary />
          </div>
        )}
        
        {activeTab === 'parameters' && (
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold text-[#0A2463]">Parameters View</h2>
            <p className="text-gray-600 mt-2">Full parameter history coming soon</p>
          </div>
        )}
        
        {activeTab === 'species' && (
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold text-[#0A2463]">Species View</h2>
            <p className="text-gray-600 mt-2">Detailed livestock info coming soon</p>
          </div>
        )}
        
        {activeTab === 'maintenance' && (
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold text-[#0A2463]">Maintenance View</h2>
            <p className="text-gray-600 mt-2">Full maintenance schedule coming soon</p>
          </div>
        )}
        
        {activeTab === 'chat' && (
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold text-[#0A2463]">Chat View</h2>
            <p className="text-gray-600 mt-2">AI chat interface coming soon</p>
          </div>
        )}
      </div>

      <FloatingChatButton hasUnread={hasUnreadChat} onClick={() => setActiveTab('chat')} />
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} hasUnreadChat={hasUnreadChat} />
    </div>
  );
}
