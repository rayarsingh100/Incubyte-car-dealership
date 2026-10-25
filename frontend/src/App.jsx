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
import { useVehicleInventory } from "./hooks/useVehicleInventory.js";

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
  const roleAccess = getRoleAccess(user?.role);
  const isAdmin = roleAccess?.experience === "admin";
  const inventory = useVehicleInventory(token, isAdmin);
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
      ) : inventory.vehicles === null ? (
        <section className="mx-auto flex min-h-[45vh] max-w-xl flex-col items-center justify-center px-5 text-center">
          {inventory.isLoading ? (
            <>
              <span className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" aria-hidden="true" />
              <p role="status" className="mt-4 text-sm font-medium text-slate-700">Loading vehicle inventory…</p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-slate-900">Inventory could not be loaded</h1>
              <p role="alert" className="mt-2 text-sm text-slate-600">{inventory.error?.status === 401 ? "Your session could not be verified. Sign out and sign in again." : inventory.error?.status === 403 ? "Your account does not have permission to view this inventory." : inventory.error?.message || "Please check the API connection and try again."}</p>
              <button type="button" onClick={() => inventory.refresh().catch(() => {})} className="mt-5 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-teal-600/20">Try again</button>
            </>
          )}
        </section>
      ) : activeSection === "dashboard" ? (
        <DashboardPage vehicles={inventory.vehicles} inventoryError={inventory.error} isRefreshing={inventory.isRefreshing} onRefresh={() => inventory.refresh().catch(() => {})} />
      ) : activeSection === "vehicles" ? (
        <VehiclesPage
          vehicles={inventory.vehicles}
          inventoryError={inventory.error}
          isRefreshing={inventory.isRefreshing}
          onRefresh={() => inventory.refresh().catch(() => {})}
          onCreateVehicle={inventory.createVehicle}
          onUpdateVehicle={inventory.updateVehicle}
          onDeleteVehicle={inventory.deleteVehicle}
          onRestockVehicle={inventory.restockVehicle}
        />
      ) : (
        <SectionPlaceholder {...sectionDetails[activeSection]} />
      )}
    </AppLayout>
  );
}
