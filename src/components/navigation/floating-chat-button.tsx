"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FloatingChatButtonProps {
  hasUnread?: boolean;
  className?: string;
}

export function FloatingChatButton({ hasUnread = false, className }: FloatingChatButtonProps) {
  return (
    <Link href="/chat" className={cn("fixed bottom-24 right-6 z-30 mb-safe md:hidden", className)}>
      <motion.div
        className="w-14 h-14 bg-gradient-to-br from-brand-cyan to-brand-navy rounded-full shadow-lg flex items-center justify-center cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={hasUnread ? { scale: [1, 1.05, 1] } : {}}
        transition={hasUnread ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : {}}
      >
        <MessageSquare className="w-6 h-6 text-white" />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-alert rounded-full border-2 border-white" />
        )}
      </motion.div>
    </Link>
  );
}
