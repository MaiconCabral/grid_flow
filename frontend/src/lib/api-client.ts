import { readCookie, tenantIdCookie, tokenCookie } from "@/lib/session";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

type ApiOptions = RequestInit & { auth?: boolean };

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { auth = true, headers, body, ...rest } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");
  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = readCookie(tokenCookie);
    const tenantId = readCookie(tenantIdCookie);
    if (token) requestHeaders.set("Authorization", `Bearer ${token}`);
    if (tenantId) requestHeaders.set("X-Tenant-ID", tenantId);
  }

  const response = await fetch(`${apiUrl}/api/v1${path}`, {
    ...rest,
    body,
    headers: requestHeaders,
  });

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => null)) as {
    message?: string;
    errors?: Record<string, string[]>;
  } | null;

  if (!response.ok) {
    const message = payload?.errors ? Object.values(payload.errors)[0]?.[0] : payload?.message;
    throw new ApiError(response.status, message || "Request failed.", payload?.errors ?? {});
  }

  return payload as T;
}

/** Fetches a binary response, such as a Word file. */
export async function apiBuffer(path: string): Promise<ArrayBuffer> {
  const headers = new Headers();
  const token = readCookie(tokenCookie);
  const tenantId = readCookie(tenantIdCookie);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (tenantId) headers.set("X-Tenant-ID", tenantId);

  const response = await fetch(`${apiUrl}/api/v1${path}`, { headers });
  if (!response.ok) {
    throw new ApiError(response.status, "Could not read the document.");
  }

  return response.arrayBuffer();
}
