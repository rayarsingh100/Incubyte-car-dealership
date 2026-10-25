import Icon from "./Icon.jsx";

export default function SectionPlaceholder({ title, description }) {
  return (
    <section className="mx-auto flex min-h-[58vh] max-w-5xl flex-col items-center justify-center px-4 py-16 text-center sm:px-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm">
        <Icon name="box" className="h-7 w-7" />
      </div>
      <span className="mt-6 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-slate-600 uppercase">
        Coming next
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </section>
  );
}
