import { apiRequest } from "@/lib/api-client";
import type {
  ParkActivitySchedule,
  ParkActivityScheduleStatus,
} from "@/types/booking";

type DataEnvelope<T> = { data: T };

// DESD-95: `end_time` is now required + non-null. Past dates rejected on
// create. Manual creation forbidden when the parent activity is_all_day=true.
export type ParkActivityScheduleInput = {
  date: string;
  start_time: string;
  end_time: string;
  status?: ParkActivityScheduleStatus;
  notes?: string | null;
};

export async function createParkActivitySchedule(
  parkId: number,
  activityId: number,
  input: ParkActivityScheduleInput,
) {
  return apiRequest<DataEnvelope<ParkActivitySchedule>>(
    `/theme-parks/${parkId}/activities/${activityId}/schedules`,
    { method: "POST", body: input },
  );
}

export async function updateParkActivitySchedule(
  parkId: number,
  activityId: number,
  scheduleId: number,
  input: Partial<ParkActivityScheduleInput>,
) {
  return apiRequest<DataEnvelope<ParkActivitySchedule>>(
    `/theme-parks/${parkId}/activities/${activityId}/schedules/${scheduleId}`,
    { method: "PATCH", body: input },
  );
}

export async function deleteParkActivitySchedule(
  parkId: number,
  activityId: number,
  scheduleId: number,
) {
  return apiRequest<null>(
    `/theme-parks/${parkId}/activities/${activityId}/schedules/${scheduleId}`,
    { method: "DELETE" },
  );
}

// DESD-95: schedules are soft-deleted. 409 if parent park or activity is
// still archived.
export async function restoreParkActivitySchedule(
  parkId: number,
  activityId: number,
  scheduleId: number,
) {
  return apiRequest<DataEnvelope<ParkActivitySchedule>>(
    `/theme-parks/${parkId}/activities/${activityId}/schedules/${scheduleId}/restore`,
    { method: "POST" },
  );
}
