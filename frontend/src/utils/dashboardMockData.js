export const sampleActivity = [
  { id: "activity-1", title: "Stock level updated", detail: "Toyota Camry · 12 units available", time: "Today · 10:42 AM", tone: "teal" },
  { id: "activity-2", title: "Low-stock reminder", detail: "Jeep Wrangler · 2 units remaining", time: "Today · 9:18 AM", tone: "amber" },
  { id: "activity-3", title: "Vehicle added to inventory", detail: "Nissan Rogue · SUV", time: "Yesterday · 4:36 PM", tone: "blue" },
  { id: "activity-4", title: "Purchase recorded", detail: "Honda Civic · 1 unit", time: "Yesterday · 1:05 PM", tone: "violet" },
];

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
