import { useState } from 'react';
import { motion } from 'motion/react';
import { Droplets, Thermometer, MessageSquare } from 'lucide-react';

interface ParameterEntryScreenProps {
  onNext: () => void;
  onAIEntry: () => void;
}

const parameters = [
  { id: 'ph', label: 'pH', unit: '', icon: Droplets, color: '#1B998B' },
  { id: 'ammonia', label: 'Ammonia', unit: 'ppm', icon: Droplets, color: '#FF6B6B' },
  { id: 'nitrite', label: 'Nitrite', unit: 'ppm', icon: Droplets, color: '#FF6B6B' },
  { id: 'nitrate', label: 'Nitrate', unit: 'ppm', icon: Droplets, color: '#1B998B' },
  { id: 'temperature', label: 'Temperature', unit: '°F', icon: Thermometer, color: '#0A2463' },
];

export function ParameterEntryScreen({ onNext, onAIEntry }: ParameterEntryScreenProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    onNext();
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-6">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-[#0A2463] mb-2">First Water Test</h2>
          <p className="text-gray-600">Log your current water parameters</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto space-y-4"
        >
          {parameters.map((param, index) => (
            <motion.div
              key={param.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${param.color}15` }}
                >
                  <param.icon className="w-6 h-6" style={{ color: param.color }} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {param.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={values[param.id] || ''}
                      onChange={(e) =>
                        setValues({ ...values, [param.id]: e.target.value })
                      }
                      placeholder="0.0"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1B998B] transition-colors text-xl font-semibold"
                    />
                    {param.unit && (
                      <span className="text-gray-500 font-medium min-w-[3rem]">
                        {param.unit}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={onAIEntry}
            className="w-full bg-white border-2 border-[#0A2463]/20 text-[#0A2463] py-4 rounded-2xl font-medium flex items-center justify-center gap-2 hover:border-[#0A2463] transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Or tell the AI your results
          </motion.button>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t p-6">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSubmit}
            className="w-full bg-[#1B998B] text-white py-4 rounded-full font-semibold text-lg shadow-lg hover:bg-[#158f7e] transition-colors"
          >
            Log Results
          </button>
        </div>
      </div>
    </div>
  );
}
