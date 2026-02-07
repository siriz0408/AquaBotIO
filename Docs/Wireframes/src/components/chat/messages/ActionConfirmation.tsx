import { Sparkles, CheckCircle } from 'lucide-react';

interface ActionConfirmationProps {
  data: {
    message: string;
    showEdit?: boolean;
    showUndo?: boolean;
  };
  timestamp: Date;
}

export function ActionConfirmation({ data, timestamp }: ActionConfirmationProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="flex items-start gap-2 mb-1">
          <div className="w-6 h-6 bg-gradient-to-br from-[#1B998B] to-[#0A2463] rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-semibold text-[#1B998B]">Aquatic AI</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md shadow-sm ml-8 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#1B998B]/10 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-[#1B998B]" />
            </div>
            <p className="text-sm font-medium text-[#0A2463] flex-1">{data.message}</p>
          </div>

          {(data.showEdit || data.showUndo) && (
            <div className="flex items-center gap-4 text-sm">
              {data.showEdit && (
                <button className="text-[#1B998B] font-medium hover:underline">
                  Edit
                </button>
              )}
              {data.showUndo && (
                <button className="text-gray-600 font-medium hover:underline">
                  Undo
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-1 ml-8">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
