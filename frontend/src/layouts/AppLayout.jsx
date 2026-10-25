import { useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";
import Footer from "../components/Footer.jsx";

export default function AppLayout({ activeSection, navigation, user, accountLabel, onLogout, onNavigate, showSearch, searchValue, onSearchChange, children }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-ink)] text-[var(--color-text)]">
      <Sidebar
        activeSection={activeSection}
        navigation={navigation}
        onNavigate={onNavigate}
        isMobileOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
      <div id="page-top" className="flex min-h-screen flex-col lg:ml-[248px]">
        <Topbar
          activeSection={activeSection}
          user={user}
          accountLabel={accountLabel}
          onLogout={onLogout}
          onMenuClick={() => setIsMobileNavOpen(true)}
          showSearch={showSearch}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
        />
        <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-7 sm:px-7 sm:py-9 lg:px-12 lg:py-12">
          {children}
        </main>
        <Footer navigation={navigation} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
