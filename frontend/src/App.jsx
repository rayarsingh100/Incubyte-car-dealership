import { useEffect, useState } from "react";
import AppLayout from "./layouts/AppLayout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import VehiclesPage from "./pages/VehiclesPage.jsx";
import SectionPlaceholder from "./components/SectionPlaceholder.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegistrationPage from "./pages/RegistrationPage.jsx";
import CustomerHomePage from "./pages/CustomerHomePage.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { getRoleAccess } from "./utils/roleAccess.js";
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
  const { user, token, login, logout } = useAuth();
  const [activeAdminSection, setActiveAdminSection] = useState("dashboard");
  const [authPage, setAuthPage] = useState(() => window.location.hash === "#register" ? "register" : "login");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registrationNotice, setRegistrationNotice] = useState("");

  useEffect(() => {
    const syncAuthPage = () => setAuthPage(window.location.hash === "#register" ? "register" : "login");
    window.addEventListener("popstate", syncAuthPage);
    return () => window.removeEventListener("popstate", syncAuthPage);
  }, []);

  const navigateAuthPage = (page) => {
    const hash = page === "register" ? "#register" : "#login";
    if (window.location.hash !== hash) window.history.pushState({ authPage: page }, "", hash);
    setAuthPage(page);
  };
  const [vehicles, setVehicles] = useState(sampleInventory);

  if (!user || !token) {
    if (authPage === "register") {
      return (
        <RegistrationPage
          onRegistered={(email, name) => {
            setRegisteredEmail(email);
            setRegistrationNotice(`Account created for ${name}. Sign in to continue.`);
            navigateAuthPage("login");
          }}
          onLogin={() => navigateAuthPage("login")}
        />
      );
    }

    return (
      <LoginPage
        onLogin={async (credentials) => {
          const authenticatedUser = await login(credentials);
          setActiveAdminSection("dashboard");
          setRegistrationNotice("");
          setRegisteredEmail("");
          return authenticatedUser;
        }}
        onRegister={() => {
          setRegistrationNotice("");
          navigateAuthPage("register");
        }}
        notice={registrationNotice}
        initialEmail={registeredEmail}
      />
    );
  }

  const roleAccess = getRoleAccess(user.role);
  if (!roleAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <section role="alert" className="max-w-md rounded-2xl border border-rose-200 bg-white p-7 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Account access unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">The account role could not be verified. Sign out and contact your administrator.</p>
          <button type="button" onClick={logout} className="mt-5 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white">Sign out</button>
        </section>
      </main>
    );
  }
  const activeSection = roleAccess.experience === "admin" ? activeAdminSection : roleAccess.homeSection;

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
    <AppLayout
      activeSection={activeSection}
      navigation={roleAccess.navigation}
      user={user}
      accountLabel={roleAccess.accountLabel}
      onLogout={logout}
      onNavigate={setActiveAdminSection}
    >
      {roleAccess.experience === "customer" ? (
        <CustomerHomePage user={user} />
      ) : activeSection === "dashboard" ? (
        <DashboardPage vehicles={vehicles} />
      ) : activeSection === "vehicles" ? (
        <VehiclesPage vehicles={vehicles} onSaveVehicle={saveVehicle} />
      ) : (
        <SectionPlaceholder {...sectionDetails[activeSection]} />
      )}
    </AppLayout>
  );
}
