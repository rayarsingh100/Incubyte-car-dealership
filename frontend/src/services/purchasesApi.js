import { ApiError, requestJson } from "./apiClient.js";

function normalizePurchase(purchase) {
  if (
    !purchase ||
    typeof purchase !== "object" ||
    typeof purchase.id !== "string" ||
    typeof purchase.vehicleId !== "string" ||
    !Number.isInteger(purchase.quantity) ||
    purchase.quantity < 1 ||
    !Number.isFinite(Number(purchase.unitPrice)) ||
    !Number.isFinite(Number(purchase.totalAmount)) ||
    typeof purchase.createdAt !== "string" ||
    Number.isNaN(Date.parse(purchase.createdAt)) ||
    !purchase.vehicle ||
    typeof purchase.vehicle.id !== "string" ||
    typeof purchase.vehicle.make !== "string" ||
    typeof purchase.vehicle.model !== "string" ||
    typeof purchase.vehicle.category !== "string"
  ) {
    throw new ApiError("The API returned purchase history in an unexpected format.");
  }

  return purchase;
}

export async function listPurchaseHistory(token, page = 1, limit = 10, signal) {
  const payload = await requestJson(`/purchases?page=${page}&limit=${limit}`, { token, signal });
  if (
    !Array.isArray(payload.purchases) ||
    !payload.pagination ||
    !["page", "limit", "total", "pages"].every((field) => Number.isInteger(payload.pagination[field]))
  ) {
    throw new ApiError("The API returned purchase history in an unexpected format.");
  }

  return {
    purchases: payload.purchases.map(normalizePurchase),
    pagination: payload.pagination,
  };
}
