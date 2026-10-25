export default function Footer({ navigation = [], onNavigate, compact = false }) {
  const year = new Date().getFullYear();

  if (compact) {
    return (
      <footer className="w-full border-t border-[var(--color-border)] pt-5 text-center">
        <p className="font-display text-sm text-[var(--color-text)]">Motorline</p>
        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">Thoughtfully selected automobiles for the road ahead.</p>
        <p className="mt-3 text-[10px] text-[var(--color-text-subtle)]">© {year} Motorline Automotive</p>
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-panel)]/70 px-4 py-8 sm:px-7 lg:px-12 lg:py-10">
      <div className="mx-auto grid max-w-[1480px] gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr]">
        <div className="max-w-md">
          <a href="#page-top" className="font-display text-xl font-medium tracking-[0.03em] text-[var(--color-bronze)]">Motorline</a>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">Thoughtfully selected automobiles for the road ahead.</p>
        </div>
        {navigation.length > 0 && (
          <nav aria-label="Footer navigation">
            <h2 className="text-[10px] font-semibold tracking-[0.14em] text-[var(--color-text-subtle)] uppercase">Quick links</h2>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {navigation.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => onNavigate(item.id)} className="text-sm text-[var(--color-text-muted)] transition hover:text-[var(--color-bronze)] focus-visible:underline">
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
      <div className="mx-auto mt-7 flex max-w-[1480px] flex-col gap-2 border-t border-[var(--color-border)] pt-4 text-[10px] text-[var(--color-text-subtle)] sm:flex-row sm:items-center sm:justify-between">
        <p>© {year} Motorline Automotive</p>
        <a href="#page-top" className="w-fit font-medium text-[var(--color-bronze)] hover:underline">Back to top ↑</a>
      </div>
    </footer>
  );
}
