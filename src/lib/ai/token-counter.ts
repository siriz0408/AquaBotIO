/**
 * Token counting utilities for AI context management
 *
 * Uses estimation based on character count since tiktoken adds complexity.
 * Rule of thumb: ~4 characters = 1 token for English text.
 * This is sufficient for context window management.
 */

/**
 * Estimate token count for a string
 * Uses ~4 characters per token approximation
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // ~4 characters per token for English text
  return Math.ceil(text.length / 4);
}

/**
 * Estimate token count for an array of messages
 */
export function estimateMessageTokens(
  messages: Array<{ role: string; content: string }>
): number {
  return messages.reduce((total, msg) => {
    // Add overhead for message structure (~4 tokens per message)
    return total + estimateTokens(msg.content) + 4;
  }, 0);
}

/**
 * Token limits per context type
 */
export const TOKEN_LIMITS = {
  // Maximum tokens for the entire conversation context
  MAX_CONTEXT: 100000, // Claude Sonnet 4.5 context window

  // Target for conversation history before summarization
  SUMMARIZATION_THRESHOLD: 8000,

  // Maximum tokens for system prompt (tank context + instructions)
  MAX_SYSTEM_PROMPT: 4000,

  // Maximum tokens for user message
  MAX_USER_MESSAGE: 2000,

  // Target tokens for AI response
  MAX_RESPONSE: 2000,

  // Maximum tokens for summary
  MAX_SUMMARY: 300,
} as const;

/**
 * Check if conversation needs summarization
 */
export function needsSummarization(totalTokens: number): boolean {
  return totalTokens > TOKEN_LIMITS.SUMMARIZATION_THRESHOLD;
}

/**
 * Calculate how many messages to keep in full
 * and how many to summarize
 */
export function calculateSummarizationSplit(
  messages: Array<{ role: string; content: string }>,
  targetTokens: number = TOKEN_LIMITS.SUMMARIZATION_THRESHOLD
): {
  keepMessages: number;
  summarizeMessages: number;
} {
  const totalMessages = messages.length;
  let tokensFromEnd = 0;
  let keepMessages = 0;

  // Count tokens from the end (most recent messages)
  for (let i = totalMessages - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(messages[i].content) + 4;
    if (tokensFromEnd + msgTokens > targetTokens / 2) {
      break;
    }
    tokensFromEnd += msgTokens;
    keepMessages++;
  }

  // Keep at least the last 10 messages
  keepMessages = Math.max(keepMessages, Math.min(10, totalMessages));

  return {
    keepMessages,
    summarizeMessages: totalMessages - keepMessages,
  };
}
