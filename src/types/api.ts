// Neutral import path for admin-feature code. Consolidates the subset of
// domain types the admin panel consumes. `price` on RoomType arrives from the
// Laravel decimal column as a string (e.g. "199.00") — parse with parseFloat
// in the UI.

export type { Hotel, Room, RoomType } from "@/types/booking";
export type { FieldErrors, Paginated } from "@/types/auth";
