import Icon from "./Icon.jsx";

export default function Sidebar({ activeSection, navigation, onNavigate, isMobileOpen, onClose }) {
  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-[#202520]/35 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-[var(--color-border)] bg-[var(--color-panel)] text-[#202520] transition-transform duration-200 lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[76px] items-center gap-3 border-b border-[var(--color-border)] px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-bronze)] text-white shadow-sm">
            <Icon name="vehicles" className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-[17px] font-medium tracking-[0.04em] text-[#202520]">Motorline</p>
            <p className="mt-0.5 text-[10px] font-medium tracking-[0.2em] text-[var(--color-text-subtle)] uppercase">Automotive</p>
          </div>
          <button
            type="button"
            aria-label="Close navigation menu"
            className="ml-auto rounded-lg p-2 text-[var(--color-text-subtle)] hover:bg-[var(--color-panel-soft)] hover:text-[#202520] lg:hidden"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="px-5 pt-8 pb-3 text-[9px] font-semibold tracking-[0.18em] text-[var(--color-text-subtle)] uppercase">
          Menu
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
                    ? "bg-[var(--color-bronze)] text-white shadow-sm"
                    : "text-[#59645d] hover:bg-[var(--color-panel-raised)] hover:text-[#164e41]"
                }`}
              >
                <Icon name={item.icon} className="h-[18px] w-[18px]" />
                <span>{item.label}</span>
                {selected && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c5a15a]" />}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[var(--color-border)] px-5 py-5">
          <p className="text-[9px] tracking-[0.15em] text-[var(--color-text-subtle)] uppercase">Private collection</p>
        </div>
      </aside>
    </>
  );
}
