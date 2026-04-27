import { ApiError, apiUpload, getValidationErrors } from "@/lib/api-client";

export type UploadFolder =
  | "hotels"
  | "room-types"
  | "park-activities"
  | "beach-activities"
  | "ferry-types"
  | "theme-parks"
  | "misc";

export type UploadResponse = { path: string; url: string };

// Mirrors the backend cap (UploadController validates `max:10240` KB).
// Update both sides if it changes; backend remains the source of truth.
export const MAX_UPLOAD_MB = 10;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
export const ACCEPTED_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

export async function uploadImage(
  file: File,
  folder: UploadFolder,
): Promise<UploadResponse> {
  if (!ACCEPTED_IMAGE_MIME.includes(file.type)) {
    throw new UploadValidationError(
      "Unsupported file type. Use JPEG, PNG, WEBP, or GIF.",
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadValidationError(`File is larger than ${MAX_UPLOAD_MB} MB.`);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  return apiUpload<UploadResponse>("/uploads", formData);
}

// Resolves a human-readable message from any error thrown by uploadImage.
// Walks every field in a 422 payload, not just `file` — backend validation
// can fail on `folder` or surface a top-level `message`.
export function describeUploadError(err: unknown): string {
  if (err instanceof UploadValidationError) {
    return err.message;
  }
  if (err instanceof ApiError) {
    const fieldErrors = getValidationErrors(err);
    for (const messages of Object.values(fieldErrors)) {
      const first = messages?.[0];
      if (first) return first;
    }
    if (err.message) return err.message;
    return `Upload failed (HTTP ${err.status}).`;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return "Upload failed. Please try again.";
}
