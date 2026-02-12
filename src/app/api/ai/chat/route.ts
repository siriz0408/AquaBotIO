import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { validateChatRequest } from "@/lib/validation/chat";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api/response";
import { buildTankContext } from "@/lib/ai/context-builder";
import { generateSystemPrompt } from "@/lib/ai/system-prompt";
import { estimateTokens } from "@/lib/ai/token-counter";
import { getUserPreferencesForAI } from "@/lib/ai/user-context";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Model configuration
const AI_MODEL = process.env.ANTHROPIC_MODEL_SONNET || "claude-sonnet-4-5-20250929";
const MAX_TOKENS = 2000;
const MAX_RETRIES = 3;

/**
 * POST /api/ai/chat
 *
 * Send a message to the AI and receive a response.
 * Handles auth, rate limiting, context injection, and usage tracking.
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("AUTH_REQUIRED", "You must be logged in to use the chat");
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_INPUT", "Invalid JSON in request body");
    }

    const validation = validateChatRequest(body);
    if (!validation.success || !validation.data) {
      return validationErrorResponse(validation.errors || {});
    }

    const { tank_id, message } = validation.data;

    // Verify tank ownership (only if tank_id provided)
    let resolvedTankId: string | null = null;

    if (tank_id) {
      const { data: tank, error: tankError } = await supabase
        .from("tanks")
        .select("id, name")
        .eq("id", tank_id)
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .single();

      if (tankError || !tank) {
        return errorResponse("NOT_FOUND", "Tank not found or you don't have access");
      }
      resolvedTankId = tank.id;
    }

    // Check and increment AI usage (rate limiting)
    const { data: canUse, error: usageError } = await supabase.rpc(
      "check_and_increment_ai_usage",
      {
        user_uuid: user.id,
        feature_name: "chat",
      }
    );

    if (usageError) {
      console.error("Error checking AI usage:", usageError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to check usage limits");
    }

    if (!canUse) {
      // Get user's tier to provide helpful message
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("tier")
        .eq("user_id", user.id)
        .single();

      const tier = subscription?.tier || "free";
      return errorResponse(
        "DAILY_LIMIT_REACHED",
        `You've reached your daily AI message limit. ${tier !== "pro" ? "Upgrade your plan for more messages." : ""}`
      );
    }

    // Build tank context for system prompt (null if no tank selected)
    // Tank context includes user preferences if tank is selected
    const context = resolvedTankId
      ? await buildTankContext(supabase, resolvedTankId, user.id)
      : null;

    // If no tank context, still fetch user preferences for personalization
    // This allows the AI to personalize responses even in general chat
    const userPreferences = context?.userPreferences ?? (
      !resolvedTankId ? await getUserPreferencesForAI(supabase, user.id) : null
    );

    // Get conversation history (last 50 messages)
    // If no tank, get general chat history (tank_id is null)
    let historyQuery = supabase
      .from("ai_messages")
      .select("role, content, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (resolvedTankId) {
      historyQuery = historyQuery.eq("tank_id", resolvedTankId);
    } else {
      historyQuery = historyQuery.is("tank_id", null);
    }

    const { data: messageHistory } = await historyQuery;

    // Build messages array for API call (oldest first)
    const conversationHistory = (messageHistory || [])
      .reverse()
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }))
      .filter((msg) => msg.role === "user" || msg.role === "assistant");

    // Add the new user message
    const messages = [
      ...conversationHistory,
      { role: "user" as const, content: message },
    ];

    // Generate system prompt with tank context and user preferences
    // User preferences are passed separately for general chat (no tank selected)
    const systemPrompt = generateSystemPrompt(context, userPreferences);

    // Store user message in database (before AI call)
    const { error: userMsgError } = await supabase.from("ai_messages").insert({
      tank_id: resolvedTankId,
      user_id: user.id,
      role: "user",
      content: message,
      model: AI_MODEL,
    });

    if (userMsgError) {
      console.error("Failed to store user message:", userMsgError);
    }

    // Check if client wants streaming
    const wantsStream = new URL(request.url).searchParams.get("stream") === "true";

    if (wantsStream) {
      // ── STREAMING MODE ──
      try {
        const stream = anthropic.messages.stream({
          model: AI_MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          messages: messages,
        });

        let fullContent = "";
        let inputTokens = 0;
        let outputTokens = 0;

        const encoder = new TextEncoder();

        const readable = new ReadableStream({
          async start(controller) {
            try {
              // Listen for text chunks
              stream.on("text", (text) => {
                fullContent += text;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "text_delta", text })}\n\n`)
                );
              });

              // Wait for the stream to complete
              const finalMessage = await stream.finalMessage();
              inputTokens = finalMessage.usage?.input_tokens || 0;
              outputTokens = finalMessage.usage?.output_tokens || 0;

              // Store assistant message
              const { data: assistantMsg } = await supabase
                .from("ai_messages")
                .insert({
                  tank_id: resolvedTankId,
                  user_id: user.id,
                  role: "assistant",
                  content: fullContent,
                  input_tokens: inputTokens,
                  output_tokens: outputTokens,
                  model: AI_MODEL,
                })
                .select("id")
                .single();

              // Update token usage
              await supabase.rpc("update_ai_token_usage", {
                user_uuid: user.id,
                input_count: inputTokens,
                output_count: outputTokens,
              });

              // Send done event
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "done",
                    id: assistantMsg?.id || `msg_${Date.now()}`,
                    usage: { input_tokens: inputTokens, output_tokens: outputTokens },
                  })}\n\n`
                )
              );
              controller.close();
            } catch (err) {
              console.error("Stream error:", err);
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Stream interrupted" })}\n\n`)
              );
              controller.close();
            }
          },
        });

        return new NextResponse(readable, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      } catch (error) {
        console.error("Failed to create stream:", error);
        return errorResponse(
          "AI_UNAVAILABLE",
          "The AI service is temporarily unavailable. Please try again."
        );
      }
    }

    // ── NON-STREAMING MODE (fallback) ──
    let response: Anthropic.Message | null = null;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        response = await anthropic.messages.create({
          model: AI_MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          messages: messages,
        });
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Anthropic API attempt ${attempt + 1} failed:`, lastError);

        if (attempt < MAX_RETRIES - 1) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    if (!response) {
      console.error("All Anthropic API attempts failed:", lastError);
      return errorResponse(
        "AI_UNAVAILABLE",
        "The AI service is temporarily unavailable. Please try again in a moment."
      );
    }

    // Extract response content
    const assistantContent = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as Anthropic.TextBlock).text)
      .join("\n");

    const inputTokens = response.usage?.input_tokens || estimateTokens(systemPrompt + message);
    const outputTokens = response.usage?.output_tokens || estimateTokens(assistantContent);

    // Store assistant message in database
    const { data: assistantMsg, error: assistantMsgError } = await supabase
      .from("ai_messages")
      .insert({
        tank_id: resolvedTankId,
        user_id: user.id,
        role: "assistant",
        content: assistantContent,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        model: AI_MODEL,
      })
      .select("id")
      .single();

    if (assistantMsgError) {
      console.error("Failed to store assistant message:", assistantMsgError);
    }

    // Update token counts
    const { error: tokenUsageError } = await supabase.rpc("update_ai_token_usage", {
      user_uuid: user.id,
      input_count: inputTokens,
      output_count: outputTokens,
    });
    if (tokenUsageError) {
      console.error("Failed to update token usage:", tokenUsageError);
    }

    return successResponse({
      id: assistantMsg?.id || `msg_${Date.now()}`,
      role: "assistant",
      content: assistantContent,
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred. Please try again."
    );
  }
}

/**
 * GET /api/ai/chat
 *
 * Get chat history for a tank.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("AUTH_REQUIRED", "You must be logged in");
    }

    // Get tank_id from query params (optional — null means general chat)
    const { searchParams } = new URL(request.url);
    const tankId = searchParams.get("tank_id");

    // Verify tank ownership if tank_id is provided
    if (tankId) {
      const { data: tank, error: tankError } = await supabase
        .from("tanks")
        .select("id")
        .eq("id", tankId)
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .single();

      if (tankError || !tank) {
        return errorResponse("NOT_FOUND", "Tank not found or you don't have access");
      }
    }

    // Get pagination params
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch messages — if no tankId, get general (no-tank) messages
    let msgQuery = supabase
      .from("ai_messages")
      .select("id, role, content, created_at, action_type, action_executed")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (tankId) {
      msgQuery = msgQuery.eq("tank_id", tankId);
    } else {
      msgQuery = msgQuery.is("tank_id", null);
    }

    const { data: messages, error: messagesError } = await msgQuery;

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch messages");
    }

    // Reverse to get chronological order
    const chronologicalMessages = (messages || []).reverse();

    return successResponse({
      messages: chronologicalMessages,
      has_more: (messages?.length || 0) === limit,
    });
  } catch (error) {
    console.error("Chat history API error:", error);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred"
    );
  }
}
