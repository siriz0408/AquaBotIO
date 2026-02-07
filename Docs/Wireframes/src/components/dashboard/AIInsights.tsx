import { AlertTriangle, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';

const insights = [
  {
    id: 1,
    type: 'warning',
    icon: AlertTriangle,
    title: 'Nitrate Levels Rising',
    message: 'Nitrates have risen from 8→15 ppm over 10 days. Recommend a 20% water change this weekend.',
    color: '#F59E0B',
  },
  {
    id: 2,
    type: 'tip',
    icon: Lightbulb,
    title: 'Optimal Feeding Time',
    message: 'Your fish are most active between 8-9 AM. Consider adjusting feeding schedule for better consumption.',
    color: '#1B998B',
  },
];

export function AIInsights() {
  return (
    <div className="px-4">
      <h2 className="text-lg font-semibold text-[#0A2463] mb-3">AI Insights</h2>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-sm border-l-4"
            style={{ borderColor: insight.color }}
          >
            <div className="flex gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${insight.color}15` }}
              >
                <insight.icon className="w-5 h-5" style={{ color: insight.color }} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#0A2463] mb-1">{insight.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{insight.message}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
