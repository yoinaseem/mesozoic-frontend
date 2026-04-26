import { apiRequest } from "@/lib/api-client";
import type { Permission } from "@/types/auth";

// The catalogue is bounded (~30) and not paginated. Cache it as long as you
// like — it only changes on a backend release that adds new code paths.
export async function listPermissions() {
  return apiRequest<{ data: Permission[] }>("/permissions");
}
