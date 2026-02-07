import { ChevronDown, Bell, Settings } from 'lucide-react';

export function TopBar() {
  return (
    <div className="bg-white shadow-sm sticky top-0 z-10">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Tank Selector */}
        <button className="flex items-center gap-2 bg-[#F0F4F8] px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors">
          <span className="font-semibold text-[#0A2463]">Nemo's Reef</span>
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="relative p-2 hover:bg-[#F0F4F8] rounded-xl transition-colors">
            <Bell className="w-5 h-5 text-gray-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6B6B] rounded-full"></span>
          </button>
          <button className="p-2 hover:bg-[#F0F4F8] rounded-xl transition-colors">
            <Settings className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>
    </div>
  );
}
