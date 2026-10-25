import { ApiError, requestJson } from "./apiClient.js";

function normalizeVehicle(vehicle) {
  if (
    !vehicle ||
    typeof vehicle !== "object" ||
    typeof vehicle.id !== "string" ||
    typeof vehicle.make !== "string" ||
    typeof vehicle.model !== "string" ||
    typeof vehicle.category !== "string" ||
    !Number.isFinite(Number(vehicle.price)) ||
    !Number.isInteger(vehicle.quantity)
  ) {
    throw new ApiError("The API returned vehicle data in an unexpected format.");
  }

  return { ...vehicle, price: Number(vehicle.price) };
}

export async function listVehicles(token) {
  const limit = 100;
  const allVehicles = [];
  let page = 1;
  let pages = 1;

  do {
    const payload = await requestJson(`/vehicles?page=${page}&limit=${limit}`, { token });
    if (!Array.isArray(payload.vehicles) || !payload.pagination || !Number.isInteger(payload.pagination.pages)) {
      throw new ApiError("The API returned an unexpected inventory response.");
    }

    allVehicles.push(...payload.vehicles.map(normalizeVehicle));
    pages = payload.pagination.pages;
    page += 1;
  } while (page <= pages);

  return allVehicles;
}

export async function createVehicle(token, vehicle) {
  const payload = await requestJson("/vehicles", { method: "POST", token, body: vehicle });
  return normalizeVehicle(payload.vehicle);
}

export async function updateVehicle(token, id, vehicle) {
  const payload = await requestJson(`/vehicles/${encodeURIComponent(id)}`, {
    method: "PATCH",
    token,
    body: vehicle,
  });
  return normalizeVehicle(payload.vehicle);
}

export async function deleteVehicle(token, id) {
  return requestJson(`/vehicles/${encodeURIComponent(id)}`, { method: "DELETE", token });
}

export async function restockVehicle(token, id, quantity) {
  const payload = await requestJson(`/vehicles/${encodeURIComponent(id)}/restock`, {
    method: "POST",
    token,
    body: { quantity },
  });
  return normalizeVehicle(payload.vehicle);
}

export async function purchaseVehicle(token, id, quantity) {
  const payload = await requestJson(`/vehicles/${encodeURIComponent(id)}/purchases`, {
    method: "POST",
    token,
    body: { quantity },
  });
  if (!payload.purchase || typeof payload.purchase.id !== "string" || payload.purchase.quantity !== quantity) {
    throw new ApiError("The API returned an unexpected purchase response.");
  }
  return { purchase: payload.purchase, vehicle: normalizeVehicle(payload.vehicle) };
}
