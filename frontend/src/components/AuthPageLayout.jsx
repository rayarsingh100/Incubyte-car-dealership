import Icon from "./Icon.jsx";

export default function AuthPageLayout({ eyebrow, title, description, children, footer }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top_left,_#d9f5f1,_transparent_42%),linear-gradient(135deg,_#f6f8fb,_#eef2f7)] px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-7 flex items-center justify-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111c2d] text-teal-300 shadow-lg shadow-slate-900/10">
            <Icon name="vehicles" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-semibold tracking-tight text-slate-900">Motorline</p>
            <p className="mt-0.5 text-[10px] font-semibold tracking-[0.15em] text-slate-500 uppercase">Dealership workspace</p>
          </div>
        </div>

        <section className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:p-9">
          <div className="mb-6">
            <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[9px] font-semibold tracking-[0.12em] text-teal-800 uppercase">
              {eyebrow}
            </span>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          </div>
          {children}
        </section>

        <div className="mt-5 text-center text-xs text-slate-500">{footer}</div>
      </div>
    </main>
  );
}
