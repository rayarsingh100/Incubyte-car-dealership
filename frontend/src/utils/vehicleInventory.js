export const LOW_STOCK_THRESHOLD = 4;

export function getAvailability(quantity) {
  if (quantity <= 0) {
    return { id: "out-of-stock", label: "Out of stock" };
  }

  if (quantity <= LOW_STOCK_THRESHOLD) {
    return { id: "low-stock", label: "Low stock" };
  }

  return { id: "in-stock", label: "In stock" };
}

export function filterInventory(inventory, { search, category, availability }) {
  const normalizedSearch = search.trim().toLocaleLowerCase();

  return inventory.filter((vehicle) => {
    const matchesSearch = !normalizedSearch ||
      `${vehicle.make} ${vehicle.model}`.toLocaleLowerCase().includes(normalizedSearch) ||
      vehicle.make.toLocaleLowerCase().includes(normalizedSearch) ||
      vehicle.model.toLocaleLowerCase().includes(normalizedSearch);
    const matchesCategory = category === "all" || vehicle.category === category;
    const matchesAvailability = availability === "all" || getAvailability(vehicle.quantity).id === availability;

    return matchesSearch && matchesCategory && matchesAvailability;
  });
}
