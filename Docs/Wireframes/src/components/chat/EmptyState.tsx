import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface EmptyStateProps {
  onSuggestedPrompt: (prompt: string) => void;
}

const suggestedPrompts = [
  {
    id: 1,
    icon: '🐠',
    title: 'Check Compatibility',
    prompt: 'Can I add a yellow tang to my reef tank?',
  },
  {
    id: 2,
    icon: '💧',
    title: 'Water Quality',
    prompt: 'Analyze my current water parameters',
  },
  {
    id: 3,
    icon: '📅',
    title: 'Maintenance',
    prompt: 'What maintenance should I do this week?',
  },
];

export function EmptyState({ onSuggestedPrompt }: EmptyStateProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-[#1B998B] to-[#0A2463] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[#0A2463] mb-2">
          Hi! I'm your AI aquarium expert
        </h2>
        <p className="text-gray-600">
          Ask me anything about your tank, water quality, or livestock
        </p>
      </motion.div>

      <div className="w-full max-w-md space-y-3">
        <p className="text-sm font-medium text-gray-500 mb-3">Try asking:</p>
        {suggestedPrompts.map((prompt, index) => (
          <motion.button
            key={prompt.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSuggestedPrompt(prompt.prompt)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-[#1B998B] hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1B998B]/10 to-[#0A2463]/10 rounded-xl flex items-center justify-center text-2xl">
                {prompt.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#0A2463] text-sm mb-1">
                  {prompt.title}
                </h3>
                <p className="text-sm text-gray-600">{prompt.prompt}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
