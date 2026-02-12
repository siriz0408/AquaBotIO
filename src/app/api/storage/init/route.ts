import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";

/**
 * POST /api/storage/init
 *
 * Ensures storage buckets exist. Uses service role key to create buckets if needed.
 * Should be called during app initialization or when bucket-not-found errors occur.
 *
 * Requires authentication to prevent abuse.
 */
export async function POST(_request: NextRequest) {
  try {
    // Check authentication using server client
    const serverSupabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("AUTH_REQUIRED", "You must be logged in");
    }

    // Get service role key - required for bucket creation
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not configured");
      return errorResponse("INTERNAL_SERVER_ERROR", "Storage initialization not available");
    }

    // Create admin client with service role
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { persistSession: false } }
    );

    // Bucket configurations
    const buckets = [
      {
        id: "tank-photos",
        name: "tank-photos",
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      },
      {
        id: "photo-diagnosis",
        name: "photo-diagnosis",
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      },
      {
        id: "feedback-images",
        name: "feedback-images",
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      },
    ];

    const results: { bucket: string; status: "created" | "exists" | "error"; error?: string }[] = [];

    for (const bucketConfig of buckets) {
      // Check if bucket exists
      const { data: existingBucket } = await adminSupabase.storage.getBucket(
        bucketConfig.id
      );

      if (existingBucket) {
        results.push({ bucket: bucketConfig.id, status: "exists" });
        continue;
      }

      // Create bucket if it doesn't exist
      const { error } = await adminSupabase.storage.createBucket(bucketConfig.id, {
        public: bucketConfig.public,
        fileSizeLimit: bucketConfig.fileSizeLimit,
        allowedMimeTypes: bucketConfig.allowedMimeTypes,
      });

      if (error) {
        // Bucket might already exist (race condition) - check error message
        if (error.message?.includes("already exists")) {
          results.push({ bucket: bucketConfig.id, status: "exists" });
        } else {
          console.error(`Failed to create bucket ${bucketConfig.id}:`, error);
          results.push({ bucket: bucketConfig.id, status: "error", error: error.message });
        }
      } else {
        console.log(`Created bucket: ${bucketConfig.id}`);
        results.push({ bucket: bucketConfig.id, status: "created" });
      }
    }

    // Check if any buckets failed
    const failed = results.filter((r) => r.status === "error");
    if (failed.length > 0) {
      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        `Failed to initialize some buckets: ${failed.map((f) => f.bucket).join(", ")}`
      );
    }

    return successResponse({
      message: "Storage buckets initialized",
      buckets: results,
    });
  } catch (error) {
    console.error("Storage init error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * GET /api/storage/init
 *
 * Check the status of storage buckets.
 */
export async function GET() {
  try {
    // Check if service role key is configured
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return successResponse({
        configured: false,
        message: "Service role key not configured - bucket initialization disabled",
      });
    }

    // Create admin client
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { persistSession: false } }
    );

    // List all buckets
    const { data: buckets, error } = await adminSupabase.storage.listBuckets();

    if (error) {
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to list buckets");
    }

    const requiredBuckets = ["tank-photos", "photo-diagnosis", "feedback-images"];
    const bucketStatus = requiredBuckets.map((id) => ({
      id,
      exists: buckets?.some((b) => b.id === id) ?? false,
    }));

    const allExist = bucketStatus.every((b) => b.exists);

    return successResponse({
      configured: true,
      ready: allExist,
      buckets: bucketStatus,
    });
  } catch (error) {
    console.error("Storage status error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
