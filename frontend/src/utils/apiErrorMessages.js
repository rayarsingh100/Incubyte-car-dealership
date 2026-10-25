export function getApiErrorMessage(error) {
  if (error?.status === 401) return "Your session is invalid or has expired. Sign in again to continue.";
  if (error?.status === 403) return "Your account does not have permission to manage vehicle inventory.";
  return error instanceof Error ? error.message : "The request could not be completed. Please try again.";
}

export function getPurchaseErrorMessage(error) {
  if (error?.status === 401) return "Your session is invalid or has expired. Sign in again to continue.";
  if (error?.status === 403) return "Your account is not permitted to make this purchase.";
  if (error?.status === 409 && error?.code === "INSUFFICIENT_STOCK") {
    return error.inventoryRefreshed
      ? "There is no longer enough stock for that quantity. The latest inventory is shown; review the available amount and try again."
      : "There is no longer enough stock for that quantity, and the inventory could not be refreshed. Close this dialog and try again later.";
  }
  if (error?.status === 404) return "This vehicle is no longer available in the inventory.";
  if (error?.status === 400) return error.message || "Enter a valid positive whole-number quantity.";
  return error instanceof Error ? error.message : "The purchase could not be completed. Please try again.";
}
