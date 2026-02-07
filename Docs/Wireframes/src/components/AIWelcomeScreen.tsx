import { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Sparkles, FlaskConical, Fish, Calendar } from 'lucide-react';

interface AIWelcomeScreenProps {
  tankData: any;
}

const quickActions = [
  { id: 'water', label: 'Check my water quality', icon: FlaskConical },
  { id: 'fish', label: 'Suggest fish', icon: Fish },
  { id: 'schedule', label: 'Set up maintenance schedule', icon: Calendar },
];

export function AIWelcomeScreen({ tankData }: AIWelcomeScreenProps) {
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'ai',
      text: `Hi there! 👋 I'm your Aquatic AI assistant. I see you've set up ${
        tankData.name || 'your tank'
      }. I'm here to help you maintain a healthy aquarium. What would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: inputValue,
      timestamp: new Date(),
    };
    
    setMessages([...messages, newMessage]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: "I'd be happy to help with that! Let me analyze your tank conditions and provide some recommendations.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const handleQuickAction = (action: string) => {
    setInputValue(action);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A2463] to-[#1B998B] p-6 shadow-lg">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Aquatic AI</h2>
            <p className="text-sm text-white/80">Your aquarium expert</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="max-w-md mx-auto space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.type === 'user'
                    ? 'bg-[#1B998B] text-white'
                    : 'bg-white text-gray-800 shadow-sm'
                }`}
              >
                {message.type === 'ai' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-[#1B998B]" />
                    <span className="text-xs font-semibold text-[#1B998B]">AI Assistant</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed">{message.text}</p>
              </div>
            </motion.div>
          ))}

          {/* Quick Actions */}
          {messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3 pt-4"
            >
              <p className="text-sm text-gray-600 text-center font-medium">Quick actions</p>
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  onClick={() => handleQuickAction(action.label)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border-2 border-transparent hover:border-[#1B998B] transition-all flex items-center gap-3 text-left"
                >
                  <div className="w-10 h-10 bg-[#1B998B]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <action.icon className="w-5 h-5 text-[#1B998B]" />
                  </div>
                  <span className="font-medium text-gray-800">{action.label}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="max-w-md mx-auto flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything about your aquarium..."
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#1B998B] transition-colors"
          />
          <button
            onClick={handleSend}
            className="w-12 h-12 bg-[#1B998B] rounded-full flex items-center justify-center text-white hover:bg-[#158f7e] transition-colors shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
