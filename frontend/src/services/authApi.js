import { ApiError, requestJson } from "./apiClient.js";

const isUser = (user) =>
  user && typeof user === "object" &&
  typeof user.id === "string" &&
  typeof user.name === "string" &&
  typeof user.email === "string" &&
  ["ADMIN", "USER"].includes(user.role);

export async function loginRequest(credentials) {
  const payload = await requestJson("/auth/login", { method: "POST", body: credentials });
  if (typeof payload.token !== "string" || !payload.token || !isUser(payload.user)) {
    throw new ApiError("The API returned an unexpected login response. Please try again.");
  }
  return { token: payload.token, user: payload.user };
}

export async function registerRequest(details) {
  const payload = await requestJson("/auth/register", { method: "POST", body: details });
  if (!isUser(payload.user)) {
    throw new ApiError("The API returned an unexpected registration response. Please try again.");
  }
  return payload.user;
}
