import { useState } from 'react';
import { Send, Camera, Image } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string) => void;
  onQuickAction: (action: string) => void;
}

const quickActions = [
  { id: 1, label: 'Log parameters', icon: '📊' },
  { id: 2, label: 'Check compatibility', icon: '🐠' },
  { id: 3, label: 'Show schedule', icon: '📅' },
];

export function ChatInput({ value, onChange, onSend, onQuickAction }: ChatInputProps) {
  const [showQuickActions, setShowQuickActions] = useState(true);

  const handleSend = () => {
    if (value.trim()) {
      onSend(value);
      setShowQuickActions(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 shadow-lg">
      {/* Quick Actions */}
      {showQuickActions && (
        <div className="px-4 pt-3 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  onQuickAction(action.label);
                  setShowQuickActions(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#F0F4F8] rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors whitespace-nowrap flex-shrink-0"
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-3 flex items-end gap-2">
        {/* Photo Upload Button */}
        <button className="p-2 hover:bg-[#F0F4F8] rounded-xl transition-colors flex-shrink-0 mb-1">
          <Camera className="w-5 h-5 text-gray-600" />
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your aquarium..."
            rows={1}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#1B998B] transition-colors resize-none max-h-32"
            style={{ minHeight: '44px' }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!value.trim()}
          className={`p-3 rounded-xl flex-shrink-0 transition-all mb-1 ${
            value.trim()
              ? 'bg-gradient-to-br from-[#1B998B] to-[#0A2463] text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
