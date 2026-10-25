import { useState } from "react";
import AppLayout from "./layouts/AppLayout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import VehiclesPage from "./pages/VehiclesPage.jsx";
import SectionPlaceholder from "./components/SectionPlaceholder.jsx";

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

  return (
    <AppLayout activeSection={activeSection} onNavigate={setActiveSection}>
      {activeSection === "dashboard" ? (
        <DashboardPage />
      ) : activeSection === "vehicles" ? (
        <VehiclesPage />
      ) : (
        <SectionPlaceholder {...sectionDetails[activeSection]} />
      )}
    </AppLayout>
  );
}
