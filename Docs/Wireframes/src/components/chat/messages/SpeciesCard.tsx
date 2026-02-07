import { Sparkles, Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import { ImageWithFallback } from '../../figma/ImageWithFallback';

interface SpeciesCardProps {
  data: {
    name: string;
    scientificName: string;
    imageUrl: string;
    stats: {
      minTankSize: string;
      temperament: string;
      careLevel: string;
      temperature: string;
      pH: string;
      maxSize: string;
    };
    compatibility: 'good' | 'warning' | 'alert';
    compatibilityMessage: string;
    userTankSize: number;
  };
  timestamp: Date;
}

export function SpeciesCard({ data, timestamp }: SpeciesCardProps) {
  const compatibilityColors = {
    good: { bg: '#1B998B', text: 'text-[#1B998B]', icon: CheckCircle },
    warning: { bg: '#F59E0B', text: 'text-[#F59E0B]', icon: AlertTriangle },
    alert: { bg: '#FF6B6B', text: 'text-[#FF6B6B]', icon: AlertTriangle },
  };

  const compat = compatibilityColors[data.compatibility];
  const CompatIcon = compat.icon;

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%]">
        <div className="flex items-start gap-2 mb-1">
          <div className="w-6 h-6 bg-gradient-to-br from-[#1B998B] to-[#0A2463] rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-semibold text-[#1B998B]">Aquatic AI</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md shadow-sm ml-8 overflow-hidden">
          {/* Image */}
          <div className="h-40 bg-gradient-to-br from-[#1B998B]/20 to-[#0A2463]/20 relative overflow-hidden">
            <ImageWithFallback
              src={data.imageUrl}
              alt={data.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="mb-3">
              <h3 className="font-bold text-lg text-[#0A2463]">{data.name}</h3>
              <p className="text-sm text-gray-500 italic">{data.scientificName}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-xs text-gray-500">Min Tank Size</p>
                <p className="text-sm font-semibold text-gray-800">{data.stats.minTankSize}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Temperament</p>
                <p className="text-sm font-semibold text-gray-800">{data.stats.temperament}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Temperature</p>
                <p className="text-sm font-semibold text-gray-800">{data.stats.temperature}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">pH Range</p>
                <p className="text-sm font-semibold text-gray-800">{data.stats.pH}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Max Size</p>
                <p className="text-sm font-semibold text-gray-800">{data.stats.maxSize}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Care Level</p>
                <p className="text-sm font-semibold text-gray-800">{data.stats.careLevel}</p>
              </div>
            </div>

            {/* Compatibility Badge */}
            <div
              className={`${compat.text} bg-opacity-10 rounded-xl p-3 mb-4 flex items-start gap-2`}
              style={{ backgroundColor: `${compat.bg}15` }}
            >
              <CompatIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{data.compatibilityMessage}</p>
            </div>

            {/* Action Button */}
            <button className="w-full bg-[#1B998B] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#158f7e] transition-colors">
              <Plus className="w-5 h-5" />
              Add to Tank
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-1 ml-8">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
