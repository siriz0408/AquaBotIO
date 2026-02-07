import { useState } from 'react';
import { ChatTopBar } from './chat/ChatTopBar';
import { ChatMessages } from './chat/ChatMessages';
import { ChatInput } from './chat/ChatInput';
import { EmptyState } from './chat/EmptyState';

export function AIChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages([...messages, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = generateAIResponse(text);
      setMessages((prev) => [...prev, aiMessage]);
    }, 800);

    setInputValue('');
  };

  const generateAIResponse = (userText: string) => {
    const lowerText = userText.toLowerCase();

    // Sample: "Can I add a yellow tang?"
    if (lowerText.includes('yellow tang') || lowerText.includes('tang')) {
      return {
        id: Date.now() + 1,
        type: 'ai',
        contentType: 'species-card',
        content: {
          name: 'Yellow Tang',
          scientificName: 'Zebrasoma flavescens',
          imageUrl: 'fish-yellow-tang',
          stats: {
            minTankSize: '100 gallons',
            temperament: 'Semi-aggressive',
            careLevel: 'Moderate',
            temperature: '72-78°F',
            pH: '8.1-8.4',
            maxSize: '8 inches',
          },
          compatibility: 'warning',
          compatibilityMessage: '⚠️ Minimum 100 gallons recommended. Your tank is 75 gallons.',
          userTankSize: 75,
        },
        timestamp: new Date(),
      };
    }

    // Default text response with markdown
    return {
      id: Date.now() + 1,
      type: 'ai',
      contentType: 'text',
      content: `Based on your tank parameters, here are my recommendations:

• Your nitrate levels are slightly elevated at 15 ppm
• Consider a 20% water change this weekend
• Monitor feeding amounts to reduce waste
• Test again in 3-4 days to track improvement

Would you like me to schedule a water change reminder?`,
      timestamp: new Date(),
    };
  };

  const handleQuickAction = (action: string) => {
    setInputValue(action);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <div className="h-screen flex flex-col bg-[#F0F4F8]">
      <ChatTopBar />
      
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onSuggestedPrompt={handleSuggestedPrompt} />
        ) : (
          <ChatMessages messages={messages} />
        )}
      </div>

      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        onQuickAction={handleQuickAction}
      />
    </div>
  );
}
