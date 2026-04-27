export const FALLBACK_IMAGE = "/img/default-fallback-image.png";

// Resolves the renderable URL for a record's image. Backend resources expose
// `image_url` (a fully-qualified URL derived from the stored path); legacy
// seeded rows store a full URL directly in `image`. Prefer the resolved URL,
// fall back to the raw value.
export function resolveImage(
  record: { image_url?: string | null; image?: string | null } | null | undefined,
): string | null {
  if (!record) return null;
  return record.image_url ?? record.image ?? null;
}

export function resolveImages(
  record:
    | { image_urls?: string[] | null; images?: string[] | null }
    | null
    | undefined,
): string[] {
  if (!record) return [];
  return record.image_urls ?? record.images ?? [];
}
