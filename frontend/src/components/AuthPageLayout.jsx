import Footer from "./Footer.jsx";

export default function AuthPageLayout({ eyebrow, title, description, children, footer }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[var(--color-ink)] px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[#d0b477]/[0.055] blur-3xl" />
      <div className="relative flex w-full max-w-md flex-1 flex-col justify-center py-6">
        <div className="mb-7 flex items-center justify-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-ink)] p-0.5">
            <img src="/favicon.svg" alt="" aria-hidden="true" className="h-full w-full object-contain" />
          </span>
          <div>
            <p className="font-display text-lg font-medium tracking-[0.04em] text-[var(--color-text)]">Motorline</p>
            <p className="mt-0.5 text-[9px] font-semibold tracking-[0.2em] text-[var(--color-text-subtle)] uppercase">Automotive</p>
          </div>
        </div>

        <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-panel)]/95 p-6 shadow-[0_20px_60px_rgba(32,37,32,0.12)] sm:p-9">
          <div className="mb-6">
            <span className="inline-flex rounded-full border border-[#d8c99f] bg-[var(--color-gold-wash)] px-2.5 py-1 text-[9px] font-semibold tracking-[0.12em] text-[var(--color-champagne-soft)] uppercase">
              {eyebrow}
            </span>
            <h1 className="mt-4 text-3xl tracking-tight text-[var(--color-text)]">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-[#737a73]">{description}</p>
          </div>
          {children}
        </section>

        <div className="mt-5 text-center text-xs text-[#737a73]">{footer}</div>
      </div>
      <div className="relative w-full max-w-md"><Footer compact /></div>
    </main>
  );
}
