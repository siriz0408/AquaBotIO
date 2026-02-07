import { Sparkles } from 'lucide-react';

interface AITextMessageProps {
  content: string;
  timestamp: Date;
}

export function AITextMessage({ content, timestamp }: AITextMessageProps) {
  // Simple markdown parsing for bullets
  const formatContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (line.trim().startsWith('•')) {
        return (
          <li key={index} className="ml-4">
            {line.trim().substring(1).trim()}
          </li>
        );
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index}>{line}</p>;
    });
  };

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="flex items-start gap-2 mb-1">
          <div className="w-6 h-6 bg-gradient-to-br from-[#1B998B] to-[#0A2463] rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-semibold text-[#1B998B]">Aquatic AI</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm ml-8">
          <div className="text-sm leading-relaxed text-gray-800 space-y-2">
            {formatContent(content)}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1 ml-8">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
