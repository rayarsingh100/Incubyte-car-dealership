export const sampleInventory = [
  { id: "sample-1", make: "Toyota", model: "Camry", category: "Sedan", quantity: 12, price: 28200 },
  { id: "sample-2", make: "Honda", model: "Civic", category: "Sedan", quantity: 8, price: 26400 },
  { id: "sample-3", make: "Ford", model: "F-150", category: "Truck", quantity: 6, price: 48900 },
  { id: "sample-4", make: "Tesla", model: "Model 3", category: "Electric", quantity: 3, price: 41200 },
  { id: "sample-5", make: "Jeep", model: "Wrangler", category: "SUV", quantity: 2, price: 34900 },
  { id: "sample-6", make: "Toyota", model: "RAV4", category: "SUV", quantity: 9, price: 36700 },
  { id: "sample-7", make: "BMW", model: "3 Series", category: "Sedan", quantity: 4, price: 44500 },
  { id: "sample-8", make: "Nissan", model: "Rogue", category: "SUV", quantity: 7, price: 31900 },
  { id: "sample-9", make: "Chevrolet", model: "Bolt EV", category: "Electric", quantity: 0, price: 28995 },
];

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
