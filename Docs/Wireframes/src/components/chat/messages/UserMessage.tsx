interface UserMessageProps {
  content: string;
  timestamp: Date;
}

export function UserMessage({ content, timestamp }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%]">
        <div className="bg-gradient-to-br from-[#1B998B] to-[#0A2463] text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed">{content}</p>
        </div>
        <p className="text-xs text-gray-500 mt-1 text-right">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
