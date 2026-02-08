import { createClient } from "@/lib/supabase/client";

const BUCKET_NAME = "tank-photos";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload a JPEG, PNG, or WebP image.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "File is too large. Maximum size is 5MB.",
    };
  }

  return { valid: true };
}

/**
 * Upload a tank photo to Supabase Storage
 */
export async function uploadTankPhoto(
  userId: string,
  tankId: string,
  file: File
): Promise<UploadResult> {
  const supabase = createClient();

  // Validate the file
  const validation = validateFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${tankId}_${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    return { success: false, error: error.message };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    success: true,
    url: urlData.publicUrl,
    path: data.path,
  };
}

/**
 * Delete a tank photo from Supabase Storage
 */
export async function deleteTankPhoto(path: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

  if (error) {
    console.error("Delete error:", error);
    return false;
  }

  return true;
}

/**
 * Get public URL for a tank photo
 */
export function getTankPhotoUrl(path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Update tank record with new photo URL
 */
export async function updateTankPhoto(
  tankId: string,
  photoUrl: string | null,
  photoPath: string | null
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("tanks")
    .update({
      photo_url: photoUrl,
      photo_path: photoPath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tankId);

  if (error) {
    console.error("Update tank photo error:", error);
    return false;
  }

  return true;
}
