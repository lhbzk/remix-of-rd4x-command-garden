// Transport layer. When VITE_RD4X_API_URL is set, requests go to the external API;
// otherwise they resolve against the local mock dataset with realistic latency.

const BASE_URL = (import.meta.env["VITE_RD4X_API_URL"] as string | undefined)?.replace(
  /\/$/,
  "",
);

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let simulateFailures = false;

export const mockControls = {
  get simulateFailures() {
    return simulateFailures;
  },

  setSimulateFailures(v: boolean) {
    simulateFailures = v;
  },
};

export const apiInfo = {
  baseUrl: BASE_URL ?? null,
  mode: BASE_URL ? ("live" as const) : ("mock" as const),
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function request<T>(
  path: string,
  mock: () => T,
  init?: RequestInit & { latency?: number },
): Promise<T> {
  const isInternalApi = path.startsWith("/api/");

  if (BASE_URL || isInternalApi) {
    const url = BASE_URL ? `${BASE_URL}${path}` : path;

    const res = await fetch(url, {
      ...init,
      credentials: "include",
      headers: {
        "content-type": "application/json",
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!res.ok) {
      let message = `Request failed: ${res.statusText}`;

      try {
        const data = (await res.json()) as { error?: string };
        if (data?.error) {
          message = data.error;
        }
      } catch {
        // Keep the HTTP status message when the response is not JSON.
      }

      throw new ApiError(message, res.status);
    }

    return (await res.json()) as T;
  }

  await delay(init?.latency ?? 320 + Math.random() * 380);

  if (simulateFailures) {
    throw new ApiError(
      "The RD4X API is not responding (simulated).",
      503,
    );
  }

  return structuredClone(mock());
                         }
