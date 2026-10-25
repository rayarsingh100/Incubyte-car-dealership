import { useState } from "react";
import AppLayout from "./layouts/AppLayout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import VehiclesPage from "./pages/VehiclesPage.jsx";
import SectionPlaceholder from "./components/SectionPlaceholder.jsx";
import { sampleInventory } from "./utils/dashboardMockData.js";

const sectionDetails = {
  vehicles: {
    title: "Vehicles",
    description: "Vehicle inventory management will be available in the next milestone.",
  },
  purchases: {
    title: "Purchases",
    description: "Purchase history and order details have not been implemented yet.",
  },
  settings: {
    title: "Settings",
    description: "Workspace settings have not been implemented yet.",
  },
};

export default function App() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [vehicles, setVehicles] = useState(sampleInventory);

  const saveVehicle = (vehicleFields, existingId) => {
    if (existingId) {
      setVehicles((currentVehicles) => currentVehicles.map((vehicle) => (
        vehicle.id === existingId ? { ...vehicle, ...vehicleFields, id: vehicle.id } : vehicle
      )));
      return;
    }

    const id = globalThis.crypto?.randomUUID?.() || `sample-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setVehicles((currentVehicles) => [{ id, ...vehicleFields }, ...currentVehicles]);
  };

  return (
    <AppLayout activeSection={activeSection} onNavigate={setActiveSection}>
      {activeSection === "dashboard" ? (
        <DashboardPage vehicles={vehicles} />
      ) : activeSection === "vehicles" ? (
        <VehiclesPage vehicles={vehicles} onSaveVehicle={saveVehicle} />
      ) : (
        <SectionPlaceholder {...sectionDetails[activeSection]} />
      )}
    </AppLayout>
  );
}
