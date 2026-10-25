const adminNavigation = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "vehicles", label: "Vehicles", icon: "vehicles" },
  { id: "purchases", label: "Purchases", icon: "purchases" },
  { id: "settings", label: "Settings", icon: "settings" },
];

const customerNavigation = [
  { id: "customer-home", label: "Home", icon: "dashboard" },
  { id: "customer-purchases", label: "Purchase History", icon: "purchases" },
];

export function getRoleAccess(role) {
  if (role === "ADMIN") {
    return { experience: "admin", accountLabel: "Administrator", homeSection: "dashboard", navigation: adminNavigation };
  }
  if (role === "USER") {
    return { experience: "customer", accountLabel: "Customer", homeSection: "customer-home", navigation: customerNavigation };
  }
  return null;
}
