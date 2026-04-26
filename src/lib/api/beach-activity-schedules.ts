import { apiRequest } from "@/lib/api-client";
import type {
  BeachActivitySchedule,
  BeachActivityScheduleStatus,
} from "@/types/booking";

type DataEnvelope<T> = { data: T };

// DESD-97: end_time is required + non-null. Past dates rejected on create
// (and on update if the date itself is being moved into the past).
export type BeachActivityScheduleInput = {
  activity_date: string;
  start_time: string;
  end_time: string;
  status?: BeachActivityScheduleStatus;
};

export async function getBeachActivitySchedule(
  activityId: number,
  scheduleId: number,
) {
  return apiRequest<DataEnvelope<BeachActivitySchedule>>(
    `/beach-activities/${activityId}/schedules/${scheduleId}`,
    { skipAuth: true },
  );
}

export async function createBeachActivitySchedule(
  activityId: number,
  input: BeachActivityScheduleInput,
) {
  return apiRequest<DataEnvelope<BeachActivitySchedule>>(
    `/beach-activities/${activityId}/schedules`,
    { method: "POST", body: input },
  );
}

export async function updateBeachActivitySchedule(
  activityId: number,
  scheduleId: number,
  input: Partial<BeachActivityScheduleInput>,
) {
  return apiRequest<DataEnvelope<BeachActivitySchedule>>(
    `/beach-activities/${activityId}/schedules/${scheduleId}`,
    { method: "PATCH", body: input },
  );
}

export async function deleteBeachActivitySchedule(
  activityId: number,
  scheduleId: number,
) {
  return apiRequest<null>(
    `/beach-activities/${activityId}/schedules/${scheduleId}`,
    { method: "DELETE" },
  );
}
