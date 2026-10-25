import Icon from "./Icon.jsx";

const sectionLabels = { dashboard: "Dashboard", vehicles: "Vehicles", purchases: "Purchases", settings: "Settings", "customer-home": "Home", "customer-purchases": "Purchases" };

export default function Topbar({ activeSection, user, accountLabel, onLogout, onMenuClick, showSearch, searchValue = "", onSearchChange }) {
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-panel)]/95 px-4 sm:px-7 lg:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" aria-label="Open navigation menu" className="rounded-xl border border-[var(--color-border)] p-2.5 text-[var(--color-text-muted)] hover:bg-[var(--color-panel-soft)] lg:hidden" onClick={onMenuClick}><Icon name="menu" /></button>
        <div className="hidden items-center gap-2 text-xs text-[var(--color-text-subtle)] sm:flex"><span>Motorline</span><span>/</span><span className="font-medium text-[var(--color-text)]">{sectionLabels[activeSection] || "Collection"}</span></div>
      </div>
      <div className="flex min-w-0 items-center justify-end gap-3 sm:gap-4">
        {showSearch && <label className="relative hidden w-48 md:block lg:w-64"><span className="sr-only">Search vehicles</span><Icon name="search" className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-text-subtle)]" /><input value={searchValue} onChange={(event) => onSearchChange?.(event.target.value)} type="search" placeholder="Search the collection" className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-ink)] pr-3 pl-9 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)]" /></label>}
        <span className="hidden rounded-full border border-[var(--color-border)] bg-[var(--color-panel-raised)] px-3 py-1.5 text-[10px] font-semibold tracking-[0.08em] text-[var(--color-bronze)] uppercase sm:inline-flex">{accountLabel}</span>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-bronze)] text-[11px] font-semibold text-white">{initials}</div>
        <div className="hidden max-w-[180px] sm:block"><p className="truncate text-xs font-semibold text-[var(--color-text)]">{user.name}</p><p className="truncate text-[10px] text-[var(--color-text-subtle)]">{user.email}</p></div>
        <button type="button" onClick={onLogout} className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-[11px] font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-panel-soft)] sm:text-xs">Sign out</button>
      </div>
    </header>
  );
}
