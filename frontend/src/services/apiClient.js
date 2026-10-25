const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, { code, status } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export async function requestJson(path, { body, token, ...options } = {}) {
  if (!apiBaseUrl) {
    throw new ApiError("The API URL is not configured. Set VITE_API_BASE_URL and restart the frontend.");
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Could not reach the API. Check that the backend is running and the API URL is correct.");
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError("The API returned an unexpected response. Please try again.", { status: response.status });
  }

  if (!response.ok) {
    const apiError = payload?.error;
    throw new ApiError(
      typeof apiError?.message === "string" ? apiError.message : `The request failed (${response.status}). Please try again.`,
      { code: typeof apiError?.code === "string" ? apiError.code : undefined, status: response.status },
    );
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ApiError("The API returned an unexpected response. Please try again.", { status: response.status });
  }

  return payload;
}
