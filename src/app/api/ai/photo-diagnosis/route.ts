import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import {
  validatePhotoDiagnosisRequest,
  validateImage,
  validateUserFeedback,
} from "@/lib/validation/ai";
import { buildTankContext } from "@/lib/ai/context-builder";
import {
  analyzePhoto,
  fileToBase64,
  getMimeType,
} from "@/lib/ai/photo-diagnosis";
import { TIER_LIMITS, resolveUserTier } from "@/lib/hooks/use-tier-limits";

/**
 * POST /api/ai/photo-diagnosis
 *
 * Analyze a photo for species identification and/or disease diagnosis.
 * Requires Plus or Pro tier.
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
      return errorResponse("AUTH_REQUIRED", "You must be logged in to use photo diagnosis");
    }

    // Parse multipart form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return errorResponse("INVALID_INPUT", "Invalid form data. Expected multipart/form-data.");
    }

    // Extract fields from form data
    const image = formData.get("image") as File | null;
    const tankId = formData.get("tank_id") as string | null;
    const diagnosisType = formData.get("diagnosis_type") as string | null;

    // Validate image
    const imageValidation = validateImage(image);
    if (!imageValidation.valid) {
      return errorResponse("INVALID_INPUT", imageValidation.error || "Invalid image");
    }

    // Validate other fields
    const fieldValidation = validatePhotoDiagnosisRequest({
      tank_id: tankId,
      diagnosis_type: diagnosisType,
    });
    if (!fieldValidation.success || !fieldValidation.data) {
      return validationErrorResponse(fieldValidation.errors || {});
    }

    const { tank_id, diagnosis_type } = fieldValidation.data;

    // Verify tank ownership
    const { data: tank, error: tankError } = await supabase
      .from("tanks")
      .select("id, name, volume_gallons")
      .eq("id", tank_id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (tankError || !tank) {
      return errorResponse("NOT_FOUND", "Tank not found or you don't have access");
    }

    // Check tier access - Photo diagnosis requires Plus or Pro
    const userTier = await resolveUserTier(supabase, user.id);
    const tierLimit = TIER_LIMITS[userTier].photo_diagnosis_daily;

    if (tierLimit === 0) {
      return errorResponse(
        "TIER_REQUIRED",
        "Photo diagnosis requires Plus or Pro plan. Upgrade to unlock AI-powered species identification and disease diagnosis."
      );
    }

    // Check and increment usage via RPC
    const { data: canUse, error: usageError } = await supabase.rpc(
      "check_and_increment_photo_diagnosis_usage",
      { user_uuid: user.id }
    );

    if (usageError) {
      console.error("Error checking photo diagnosis usage:", usageError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to check usage limits");
    }

    if (!canUse) {
      const limitMessage =
        userTier === "plus"
          ? `You've reached your daily limit of 10 photo diagnoses. Upgrade to Pro for 30 diagnoses per day.`
          : `You've reached your daily limit of 30 photo diagnoses. Your limit resets at midnight UTC.`;

      return errorResponse("DAILY_LIMIT_REACHED", limitMessage);
    }

    // Build tank context for personalized treatment recommendations
    const tankContext = await buildTankContext(supabase, tank_id, user.id);

    // Convert image to base64
    const imageBase64 = await fileToBase64(image!);
    const mimeType = getMimeType(image!);

    // Upload image to Supabase Storage
    const diagnosisId = crypto.randomUUID();
    const timestamp = Date.now();
    const extension = mimeType === "image/png" ? "png" : "jpg";
    const storagePath = `${user.id}/${diagnosisId}_${timestamp}.${extension}`;

    // Use service role for storage upload to bypass RLS for server-side uploads
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: uploadError } = await serviceSupabase.storage
      .from("photo-diagnosis")
      .upload(storagePath, image!, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      // Continue anyway - we can still do the diagnosis, just won't have stored photo
    }

    // Get signed URL for the photo (valid for 7 days)
    let photoUrl = "";
    if (!uploadError) {
      const { data: signedUrlData } = await serviceSupabase.storage
        .from("photo-diagnosis")
        .createSignedUrl(storagePath, 7 * 24 * 60 * 60); // 7 days

      photoUrl = signedUrlData?.signedUrl || "";
    }

    // Analyze the photo with Claude Vision
    let analysisResult;
    try {
      analysisResult = await analyzePhoto(
        imageBase64,
        mimeType,
        diagnosis_type,
        tankContext
      );
    } catch (analysisError) {
      console.error("Photo analysis error:", analysisError);
      return errorResponse(
        "AI_UNAVAILABLE",
        "The AI service is temporarily unavailable. Please try again in a moment."
      );
    }

    // Get remaining usage for today
    const { data: usageInfo } = await supabase.rpc("get_photo_diagnosis_usage_info", {
      user_uuid: user.id,
    });

    const remainingToday = usageInfo?.[0]?.remaining ?? 0;

    // Store diagnosis result in database
    const { data: diagnosisRecord, error: insertError } = await supabase
      .from("photo_diagnoses")
      .insert({
        id: diagnosisId,
        user_id: user.id,
        tank_id: tank_id,
        diagnosis_type: diagnosis_type,
        photo_url: photoUrl || storagePath, // Use signed URL or path as fallback
        species_result: analysisResult.speciesResult || null,
        disease_result: analysisResult.diseaseResult || null,
        confidence: analysisResult.confidence,
        ai_response: analysisResult.rawResponse,
        input_tokens: analysisResult.usage.input_tokens,
        output_tokens: analysisResult.usage.output_tokens,
        model: process.env.ANTHROPIC_MODEL_SONNET || "claude-sonnet-4-5-20250929",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to store diagnosis:", insertError);
      // Don't fail the request - return the result anyway
    }

    // Update token usage in ai_usage table
    await supabase.rpc("update_ai_token_usage", {
      user_uuid: user.id,
      input_count: analysisResult.usage.input_tokens,
      output_count: analysisResult.usage.output_tokens,
    });

    // Return success response
    return successResponse({
      id: diagnosisRecord?.id || diagnosisId,
      diagnosisType: diagnosis_type,
      photoUrl: photoUrl || undefined,
      speciesResult: analysisResult.speciesResult,
      diseaseResult: analysisResult.diseaseResult,
      confidence: analysisResult.confidence,
      disclaimer:
        "AI analysis is for informational purposes only. For serious health concerns, consult a veterinary professional or experienced aquarist.",
      usage: {
        input_tokens: analysisResult.usage.input_tokens,
        output_tokens: analysisResult.usage.output_tokens,
        remaining_today: remainingToday,
      },
    });
  } catch (error) {
    console.error("Photo diagnosis API error:", error);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred. Please try again."
    );
  }
}

/**
 * GET /api/ai/photo-diagnosis
 *
 * Get diagnosis history for a tank.
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const tankId = searchParams.get("tank_id");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from("photo_diagnoses")
      .select(
        "id, tank_id, diagnosis_type, photo_url, species_result, disease_result, confidence, user_feedback, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by tank if specified
    if (tankId) {
      // Verify tank ownership
      const { data: tank, error: tankError } = await supabase
        .from("tanks")
        .select("id")
        .eq("id", tankId)
        .eq("user_id", user.id)
        .single();

      if (tankError || !tank) {
        return errorResponse("NOT_FOUND", "Tank not found or you don't have access");
      }

      query = query.eq("tank_id", tankId);
    }

    const { data: diagnoses, error: queryError } = await query;

    if (queryError) {
      console.error("Error fetching diagnoses:", queryError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch diagnosis history");
    }

    // Get usage info
    const { data: usageInfo } = await supabase.rpc("get_photo_diagnosis_usage_info", {
      user_uuid: user.id,
    });

    return successResponse({
      diagnoses: diagnoses || [],
      has_more: (diagnoses?.length || 0) === limit,
      usage: usageInfo?.[0] || null,
    });
  } catch (error) {
    console.error("Photo diagnosis history API error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * PATCH /api/ai/photo-diagnosis
 *
 * Submit feedback for a diagnosis (helpful/not_helpful).
 */
export async function PATCH(request: NextRequest) {
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

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_INPUT", "Invalid JSON in request body");
    }

    // Validate feedback
    const validation = validateUserFeedback(body);
    if (!validation.success || !validation.data) {
      return validationErrorResponse(validation.errors || {});
    }

    const { diagnosis_id, feedback } = validation.data;

    // Update feedback (RLS ensures user can only update their own)
    const { data: updated, error: updateError } = await supabase
      .from("photo_diagnoses")
      .update({ user_feedback: feedback })
      .eq("id", diagnosis_id)
      .eq("user_id", user.id)
      .select("id, user_feedback")
      .single();

    if (updateError) {
      if (updateError.code === "PGRST116") {
        return errorResponse("NOT_FOUND", "Diagnosis not found");
      }
      console.error("Error updating feedback:", updateError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to submit feedback");
    }

    return successResponse({
      id: updated.id,
      feedback: updated.user_feedback,
      message: "Thank you for your feedback!",
    });
  } catch (error) {
    console.error("Photo diagnosis feedback API error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

// Note: In Next.js App Router, multipart/form-data is handled automatically
// via request.formData(). No config export needed.
