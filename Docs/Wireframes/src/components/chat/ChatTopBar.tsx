import { ArrowLeft, ChevronDown } from 'lucide-react';

export function ChatTopBar() {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-[#F0F4F8] rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          
          <div>
            <h1 className="font-semibold text-[#0A2463]">Nemo's Reef</h1>
            <span className="text-xs text-gray-500">Saltwater Reef • 75 gal</span>
          </div>
        </div>

        <button className="p-2 hover:bg-[#F0F4F8] rounded-xl transition-colors">
          <ChevronDown className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    </div>
  );
}
