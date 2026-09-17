import Constants from "expo-constants";

// In dev, derive the API host from the Expo packager's own host IP so a
// physical device on the same network can reach a laptop running the API
// locally — "localhost" only works in a simulator. Override with
// EXPO_PUBLIC_API_URL for staging/prod builds.
function inferDevApiUrl(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  const host = hostUri.split(":")[0];
  return `http://${host}:3000`;
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? inferDevApiUrl() ?? "http://localhost:3000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
