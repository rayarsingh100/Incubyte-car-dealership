export function getApiErrorMessage(error) {
  if (error?.status === 401) return "Your session is invalid or has expired. Sign in again to continue.";
  if (error?.status === 403) return "Your account does not have permission to manage vehicle inventory.";
  return error instanceof Error ? error.message : "The request could not be completed. Please try again.";
}
