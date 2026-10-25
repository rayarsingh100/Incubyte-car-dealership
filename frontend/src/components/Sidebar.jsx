import Icon from "./Icon.jsx";

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "vehicles", label: "Vehicles", icon: "vehicles" },
  { id: "purchases", label: "Purchases", icon: "purchases" },
  { id: "settings", label: "Settings", icon: "settings" },
];

export default function Sidebar({ activeSection, onNavigate, isMobileOpen, onClose }) {
  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col bg-[#111c2d] text-slate-300 transition-transform duration-200 lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[76px] items-center gap-3 border-b border-white/[0.08] px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400 text-[#10212b] shadow-lg shadow-teal-950/20">
            <Icon name="vehicles" className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-white">Motorline</p>
            <p className="mt-0.5 text-[11px] font-medium tracking-[0.14em] text-slate-400 uppercase">Dealership</p>
          </div>
          <button
            type="button"
            aria-label="Close navigation menu"
            className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="px-4 pt-7 pb-2 text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
          Workspace
        </div>
        <nav aria-label="Main navigation" className="space-y-1 px-3">
          {navigation.map((item) => {
            const selected = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={selected ? "page" : undefined}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[13px] font-medium transition ${
                  selected
                    ? "bg-teal-400/[0.13] text-teal-300 shadow-sm shadow-black/5"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
                }`}
              >
                <Icon name={item.icon} className="h-[18px] w-[18px]" />
                <span>{item.label}</span>
                {selected && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-300" />}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/[0.08] p-4">
          <div className="rounded-2xl bg-white/[0.055] p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-white">
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              Preview workspace
            </div>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">
              Dashboard figures are illustrative sample data.
            </p>
          </div>
          <p className="px-1 pt-4 text-[10px] text-slate-500">Inventory workspace · UI preview</p>
        </div>
      </aside>
    </>
  );
}
