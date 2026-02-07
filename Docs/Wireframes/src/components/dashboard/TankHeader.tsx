import { motion } from 'motion/react';

export function TankHeader() {
  const healthScore = 85; // Out of 100
  const healthStatus = healthScore >= 80 ? 'Good' : healthScore >= 60 ? 'Caution' : 'Alert';
  const healthColor = healthScore >= 80 ? '#1B998B' : healthScore >= 60 ? '#F59E0B' : '#FF6B6B';

  return (
    <div className="bg-gradient-to-br from-[#0A2463] to-[#1B998B] p-6 text-white">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">Nemo's Reef</h1>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
              Saltwater Reef
            </span>
            <span className="text-white/90 text-sm">75 gallons</span>
          </div>
        </div>

        {/* Health Score Gauge */}
        <div className="flex flex-col items-center">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="6"
                fill="none"
              />
              <motion.circle
                cx="40"
                cy="40"
                r="32"
                stroke={healthColor}
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - healthScore / 100)}`}
                strokeLinecap="round"
                initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - healthScore / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold">{healthScore}</span>
            </div>
          </div>
          <span className="text-xs mt-1 font-semibold" style={{ color: healthColor }}>
            {healthStatus}
          </span>
        </div>
      </div>
    </div>
  );
}
