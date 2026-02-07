import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Droplets, Waves, Shell, FlaskConical, Calendar, Layers, X } from 'lucide-react';

interface TankSetupScreenProps {
  onNext: (data: any) => void;
  onSkip: () => void;
}

const tankTypes = [
  { id: 'freshwater', label: 'Freshwater', icon: Droplets, color: '#1B998B' },
  { id: 'saltwater', label: 'Saltwater', icon: Waves, color: '#0A2463' },
  { id: 'reef', label: 'Reef', icon: Shell, color: '#FF6B6B' },
  { id: 'brackish', label: 'Brackish', icon: FlaskConical, color: '#1B998B' },
];

export function TankSetupScreen({ onNext, onSkip }: TankSetupScreenProps) {
  const [step, setStep] = useState(1);
  const [tankData, setTankData] = useState({
    name: '',
    type: '',
    volume: '',
    dimensions: { length: '', width: '', height: '' },
    setupDate: '',
    substrate: '',
  });

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onNext(tankData);
    }
  };

  const canProceed = () => {
    if (step === 1) return tankData.name && tankData.type;
    if (step === 2) return tankData.volume;
    if (step === 3) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#0A2463]">Tank Setup</h2>
            <button onClick={onSkip} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress indicator */}
          <div className="flex gap-2">
            {[...Array(totalSteps)].map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < step ? 'bg-[#1B998B]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">Step {step} of {totalSteps}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tank Name
                  </label>
                  <input
                    type="text"
                    value={tankData.name}
                    onChange={(e) => setTankData({ ...tankData, name: e.target.value })}
                    placeholder="e.g., Living Room Display"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1B998B] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tank Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {tankTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setTankData({ ...tankData, type: type.id })}
                        className={`bg-white rounded-2xl p-6 shadow-sm border-2 transition-all ${
                          tankData.type === type.id
                            ? 'border-[#1B998B] shadow-md'
                            : 'border-transparent'
                        }`}
                      >
                        <type.icon
                          className="w-8 h-8 mx-auto mb-3"
                          style={{ color: tankData.type === type.id ? type.color : '#6B7280' }}
                        />
                        <p className="font-semibold text-gray-800 text-sm">{type.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volume (gallons)
                  </label>
                  <input
                    type="number"
                    value={tankData.volume}
                    onChange={(e) => setTankData({ ...tankData, volume: e.target.value })}
                    placeholder="e.g., 55"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1B998B] transition-colors text-2xl font-semibold"
                  />
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Dimensions (optional)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Length</label>
                      <input
                        type="number"
                        value={tankData.dimensions.length}
                        onChange={(e) =>
                          setTankData({
                            ...tankData,
                            dimensions: { ...tankData.dimensions, length: e.target.value },
                          })
                        }
                        placeholder="48"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#1B998B]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Width</label>
                      <input
                        type="number"
                        value={tankData.dimensions.width}
                        onChange={(e) =>
                          setTankData({
                            ...tankData,
                            dimensions: { ...tankData.dimensions, width: e.target.value },
                          })
                        }
                        placeholder="18"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#1B998B]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Height</label>
                      <input
                        type="number"
                        value={tankData.dimensions.height}
                        onChange={(e) =>
                          setTankData({
                            ...tankData,
                            dimensions: { ...tankData.dimensions, height: e.target.value },
                          })
                        }
                        placeholder="21"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#1B998B]"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">inches</p>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Setup Date
                  </label>
                  <input
                    type="date"
                    value={tankData.setupDate}
                    onChange={(e) => setTankData({ ...tankData, setupDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1B998B] transition-colors"
                  />
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Substrate
                  </label>
                  <input
                    type="text"
                    value={tankData.substrate}
                    onChange={(e) => setTankData({ ...tankData, substrate: e.target.value })}
                    placeholder="e.g., Sand, Gravel, Bare bottom"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1B998B] transition-colors"
                  />
                </div>

                <div className="bg-[#1B998B]/10 border-2 border-dashed border-[#1B998B] rounded-2xl p-6 text-center">
                  <Layers className="w-12 h-12 text-[#1B998B] mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700 mb-1">Add Tank Photo</p>
                  <p className="text-xs text-gray-500">Optional - coming soon</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t p-6">
        <div className="max-w-md mx-auto space-y-3">
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`w-full py-4 rounded-full font-semibold text-lg flex items-center justify-center gap-2 transition-colors ${
              canProceed()
                ? 'bg-[#1B998B] text-white shadow-lg hover:bg-[#158f7e]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {step === totalSteps ? 'Complete Setup' : 'Continue'}
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={onSkip}
            className="w-full py-3 text-gray-600 font-medium hover:text-gray-800"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}