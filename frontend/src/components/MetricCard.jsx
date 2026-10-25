import Icon from "./Icon.jsx";

const tones = {
  teal: "bg-[var(--color-gold-wash)] text-[var(--color-champagne-soft)] ring-[#d8c99f]",
  blue: "bg-[var(--color-gold-wash)] text-[var(--color-champagne-soft)] ring-[#d8c99f]",
  amber: "bg-[var(--color-gold-wash)] text-[var(--color-champagne-soft)] ring-[#d8c99f]",
  violet: "bg-[var(--color-gold-wash)] text-[var(--color-champagne-soft)] ring-[#d8c99f]",
};

export default function MetricCard({ label, value, detail, icon, tone }) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-[#737a73]">{label}</p>
          <p className="mt-3 text-[27px] leading-none font-semibold tracking-[-0.04em] text-[var(--color-text)] sm:text-[30px]">
            {value}
          </p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${tones[tone]}`}>
          <Icon name={icon} className="h-[19px] w-[19px]" />
        </div>
      </div>
      <p className="mt-4 text-[11px] leading-5 text-[#737a73]">{detail}</p>
    </article>
  );
}
