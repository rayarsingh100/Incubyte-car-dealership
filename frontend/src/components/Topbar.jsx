import Icon from "./Icon.jsx";

const sectionLabels = {
  dashboard: "Dashboard",
  vehicles: "Vehicles",
  purchases: "Purchases",
  settings: "Settings",
  "customer-home": "Home",
};

export default function Topbar({ activeSection, user, accountLabel, onLogout, onMenuClick }) {
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation menu"
          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden"
          onClick={onMenuClick}
        >
          <Icon name="menu" />
        </button>
        <div className="lg:hidden">
          <p className="text-sm font-semibold text-slate-900">Motorline</p>
          <p className="text-[10px] text-slate-500">Dealership workspace</p>
        </div>
        <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
          <span>Workspace</span>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-800">{sectionLabels[activeSection]}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <span className="hidden rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-teal-800 uppercase sm:inline-flex">
          {accountLabel}
        </span>
        <div className="h-8 w-px bg-slate-200" />
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white ring-4 ring-slate-100">
            {initials}
          </div>
          <div className="hidden max-w-[180px] sm:block">
            <p className="truncate text-xs font-semibold text-slate-800">{user.name}</p>
            <p className="truncate text-[10px] text-slate-500">{user.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-teal-500/15 sm:px-3.5 sm:text-xs"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
