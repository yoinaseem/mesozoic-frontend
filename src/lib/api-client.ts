import { toast } from "sonner";

import { FieldErrors } from "@/types/auth";

type ApiClientConfig = {
  getToken: () => string | null;
  onUnauthorized: () => void;
};

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
  skipAuth?: boolean;
  tokenOverride?: string | null;
};

type LaravelErrorResponse = {
  message?: string;
  errors?: FieldErrors;
};

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_BASE_URL = `${RAW_API_URL.replace(/\/+$/, "")}/api`;

const apiClientConfig: ApiClientConfig = {
  getToken: () => null,
  onUnauthorized: () => undefined,
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    const fallbackMessage = status >= 500 ? "Server error" : "Request failed";
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as LaravelErrorResponse).message === "string"
        ? ((data as LaravelErrorResponse).message ?? fallbackMessage)
        : fallbackMessage;

    super(message);
    this.status = status;
    this.data = data;
  }
}

export function configureApiClient(config: Partial<ApiClientConfig>) {
  Object.assign(apiClientConfig, config);
}

export function getValidationErrors(error: unknown): FieldErrors {
  if (!(error instanceof ApiError)) {
    return {};
  }

  const data = error.data as LaravelErrorResponse;
  return data?.errors ?? {};
}

// Surfaces a non-crashing toast for API failures. Forms still call
// `getValidationErrors` directly for 422 field-level errors; this helper
// handles everything else. Safe to call from client components only.
//
// Copy precedence: backend message first (err.message from ApiError), then
// a status-specific fallback, then a generic catch-all. Lets the backend
// override any message with a more specific one when relevant.
export function toastApiError(error: unknown): void {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 422) {
      return; // 401 redirects globally; 422 renders inline on the form
    }
    const backendMessage = hasOwnMessage(error) ? error.message : "";
    const fallback = fallbackForStatus(error.status);
    toast.error(backendMessage || fallback);
    return;
  }

  if (error instanceof Error && error.message) {
    toast.error(error.message);
    return;
  }

  toast.error("Something went wrong.");
}

// ApiError sets `message` from the Laravel payload; when the backend doesn't
// return one we fall through to a canned default like "Request failed". We
// only want to prefer `error.message` when it came from the backend, not the
// constructor's default — checking the data envelope distinguishes the two.
function hasOwnMessage(error: ApiError): boolean {
  const data = error.data as LaravelErrorResponse | null;
  return typeof data?.message === "string" && data.message.trim().length > 0;
}

function fallbackForStatus(status: number): string {
  switch (status) {
    case 403:
      return "You don't have access to that action.";
    case 429:
      return "Too many requests — try again in a minute.";
    default:
      return status >= 500
        ? "Something went wrong on the server."
        : "Something went wrong.";
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const urlPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${urlPath}`;

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  const method = options.method ?? "GET";
  const hasJsonBody = options.body !== undefined;
  if (hasJsonBody) {
    headers.set("Content-Type", "application/json");
  }

  const token = options.tokenOverride ?? apiClientConfig.getToken();
  if (!options.skipAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    method,
    headers,
    body: hasJsonBody ? JSON.stringify(options.body) : undefined,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const responseData = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    if (response.status === 401) {
      apiClientConfig.onUnauthorized();
    }

    throw new ApiError(response.status, responseData);
  }

  return responseData as T;
}
