import { useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";

export default function AppLayout({ activeSection, navigation, user, accountLabel, onLogout, onNavigate, children }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-900">
      <Sidebar
        activeSection={activeSection}
        navigation={navigation}
        onNavigate={onNavigate}
        isMobileOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
      <div className="min-h-screen lg:ml-[272px]">
        <Topbar
          activeSection={activeSection}
          user={user}
          accountLabel={accountLabel}
          onLogout={onLogout}
          onMenuClick={() => setIsMobileNavOpen(true)}
        />
        <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
