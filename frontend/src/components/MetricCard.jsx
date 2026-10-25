import Icon from "./Icon.jsx";

const tones = {
  teal: "bg-teal-50 text-teal-700 ring-teal-100",
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
};

export default function MetricCard({ label, value, detail, icon, tone }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-[27px] leading-none font-semibold tracking-[-0.04em] text-slate-900 sm:text-[30px]">
            {value}
          </p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${tones[tone]}`}>
          <Icon name={icon} className="h-[19px] w-[19px]" />
        </div>
      </div>
      <p className="mt-4 text-[11px] leading-5 text-slate-500">{detail}</p>
    </article>
  );
}
