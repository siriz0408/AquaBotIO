import { MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface FloatingChatButtonProps {
  hasUnread: boolean;
  onClick: () => void;
}

export function FloatingChatButton({ hasUnread, onClick }: FloatingChatButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-[#1B998B] to-[#0A2463] rounded-full shadow-lg flex items-center justify-center z-30"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={hasUnread ? { scale: [1, 1.05, 1] } : {}}
      transition={hasUnread ? { repeat: Infinity, duration: 2 } : {}}
    >
      <MessageSquare className="w-6 h-6 text-white" />
      {hasUnread && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF6B6B] rounded-full border-2 border-white"></span>
      )}
    </motion.button>
  );
}
