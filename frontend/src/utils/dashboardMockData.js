export function summarizeInventory(inventory) {
  return inventory.reduce(
    (summary, vehicle) => {
      summary.totalModels += 1;
      summary.availableModels += vehicle.quantity > 0 ? 1 : 0;
      summary.totalUnits += vehicle.quantity;
      summary.lowStockModels += vehicle.quantity > 0 && vehicle.quantity <= 4 ? 1 : 0;
      summary.inventoryValue += vehicle.quantity * vehicle.price;
      return summary;
    },
    { totalModels: 0, availableModels: 0, totalUnits: 0, lowStockModels: 0, inventoryValue: 0 },
  );
}
