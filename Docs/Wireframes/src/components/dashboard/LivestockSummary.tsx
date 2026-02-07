import { Fish, Plus } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

const livestock = [
  { id: 1, name: 'Clownfish', quantity: 2, emoji: '🐠' },
  { id: 2, name: 'Blue Tang', quantity: 1, emoji: '🐟' },
  { id: 3, name: 'Yellow Tang', quantity: 1, emoji: '🐠' },
  { id: 4, name: 'Cleaner Shrimp', quantity: 3, emoji: '🦐' },
  { id: 5, name: 'Hermit Crab', quantity: 5, emoji: '🦀' },
];

export function LivestockSummary() {
  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-[#0A2463]">Livestock</h2>
        <button className="text-sm text-[#1B998B] font-medium">View All</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {livestock.slice(0, 5).map((species) => (
          <div
            key={species.id}
            className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-[#1B998B]/20 to-[#0A2463]/20 rounded-xl flex items-center justify-center mb-2 text-2xl">
              {species.emoji}
            </div>
            <span className="text-xs font-medium text-gray-700 text-center leading-tight mb-1">
              {species.name}
            </span>
            <span className="text-xs text-gray-500">×{species.quantity}</span>
          </div>
        ))}
        <button className="bg-[#1B998B]/10 border-2 border-dashed border-[#1B998B] rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-[#1B998B]/20 transition-colors">
          <Plus className="w-8 h-8 text-[#1B998B] mb-2" />
          <span className="text-xs font-medium text-[#1B998B]">Add More</span>
        </button>
      </div>
    </div>
  );
}
