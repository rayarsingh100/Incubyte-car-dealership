import Icon from "../components/Icon.jsx";
import MetricCard from "../components/MetricCard.jsx";
import { sampleActivity, sampleInventory, summarizeInventory } from "../utils/dashboardMockData.js";
import { formatCurrency, formatNumber } from "../utils/formatters.js";

const metrics = (summary) => [
  {
    label: "Total vehicles",
    value: formatNumber(summary.totalModels),
    detail: `${formatNumber(summary.totalUnits)} units across the sample catalog`,
    icon: "vehicles",
    tone: "teal",
  },
  {
    label: "Available vehicles",
    value: formatNumber(summary.availableModels),
    detail: "Models with at least one unit in stock",
    icon: "check",
    tone: "blue",
  },
  {
    label: "Low-stock vehicles",
    value: formatNumber(summary.lowStockModels),
    detail: "Models with 4 or fewer units available",
    icon: "warning",
    tone: "amber",
  },
  {
    label: "Total inventory value",
    value: formatCurrency(summary.inventoryValue),
    detail: "Estimated from sample quantity × unit price",
    icon: "chart",
    tone: "violet",
  },
];

const activityTones = {
  teal: "bg-teal-50 text-teal-700",
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
  violet: "bg-violet-50 text-violet-700",
};

function InventorySummary({ inventory }) {
  const categories = inventory.reduce((groups, vehicle) => {
    groups[vehicle.category] = (groups[vehicle.category] || 0) + vehicle.quantity;
    return groups;
  }, {});
  const categoryRows = Object.entries(categories).sort((first, second) => second[1] - first[1]);
  const totalUnits = categoryRows.reduce((total, [, units]) => total + units, 0);
  const colors = ["bg-teal-500", "bg-blue-500", "bg-indigo-500", "bg-amber-400"];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Inventory overview</h2>
          <p className="mt-1 text-xs text-slate-500">Sample stock by vehicle type</p>
        </div>
        <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
          {formatNumber(totalUnits)} units
        </span>
      </div>

      {categoryRows.length === 0 ? (
        <div className="mt-7 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
          No sample inventory is available.
        </div>
      ) : (
        <>
          <div className="mt-7 flex h-2 overflow-hidden rounded-full bg-slate-100" aria-label="Sample inventory by vehicle type">
            {categoryRows.map(([category, units], index) => (
              <div
                key={category}
                className={colors[index % colors.length]}
                style={{ width: `${(units / totalUnits) * 100}%` }}
                title={`${category}: ${units} units`}
              />
            ))}
          </div>
          <div className="mt-6 space-y-4">
            {categoryRows.map(([category, units], index) => (
              <div key={category} className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${colors[index % colors.length]}`} />
                <span className="flex-1 text-xs font-medium text-slate-600">{category}</span>
                <span className="text-xs font-semibold tabular-nums text-slate-800">{formatNumber(units)}</span>
                <span className="w-10 text-right text-[11px] tabular-nums text-slate-400">
                  {Math.round((units / totalUnits) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function RecentActivity() {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>
          <p className="mt-1 text-xs text-slate-500">Illustrative sample events</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200">
          <Icon name="clock" className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-4 divide-y divide-slate-100">
        {sampleActivity.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">No activity to show yet.</div>
        ) : (
          sampleActivity.map((activity) => (
            <div key={activity.id} className="flex gap-3 py-4 first:pt-2 last:pb-1">
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activityTones[activity.tone]}`}>
                <Icon name={activity.tone === "amber" ? "warning" : activity.tone === "teal" ? "check" : "box"} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800">{activity.title}</p>
                <p className="mt-1 truncate text-[11px] text-slate-500">{activity.detail}</p>
                <p className="mt-1.5 text-[10px] text-slate-400">{activity.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function LowStockList({ inventory }) {
  const lowStockVehicles = inventory
    .filter((vehicle) => vehicle.quantity > 0 && vehicle.quantity <= 4)
    .sort((first, second) => first.quantity - second.quantity);

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Needs attention</h2>
          <p className="mt-1 text-xs text-slate-500">Low-stock sample vehicles</p>
        </div>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
          {lowStockVehicles.length} low
        </span>
      </div>

      {lowStockVehicles.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
          <p className="text-sm font-medium text-slate-700">All clear</p>
          <p className="mt-1 text-xs text-slate-500">There are no low-stock sample vehicles.</p>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-100">
          {lowStockVehicles.map((vehicle) => (
            <div key={vehicle.id} className="flex items-center justify-between gap-3 py-3.5 first:pt-2 last:pb-1">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Icon name="vehicles" className="h-[17px] w-[17px]" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-800">{vehicle.make} {vehicle.model}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{vehicle.category}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold tabular-nums text-amber-800">
                {vehicle.quantity} left
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const summary = summarizeInventory(sampleInventory);

  return (
    <div className="mx-auto max-w-[1240px]">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-teal-800 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            Sample data · not live
          </div>
          <h1 className="text-[27px] font-semibold tracking-[-0.035em] text-slate-950 sm:text-[32px]">Dashboard</h1>
          <p className="mt-1.5 text-[13px] text-slate-500">A snapshot of the dealership inventory workspace.</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Icon name="clock" className="h-4 w-4" />
          Preview figures only
        </div>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics(summary).map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <InventorySummary inventory={sampleInventory} />
        <RecentActivity />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.68fr]">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Stock levels</h2>
              <p className="mt-1 text-xs text-slate-500">Sample quantity by vehicle model</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
              <Icon name="box" className="h-3.5 w-3.5" />
              {formatNumber(summary.totalUnits)} units
            </span>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {sampleInventory.map((vehicle) => {
              const width = Math.max(8, (vehicle.quantity / 12) * 100);
              return (
                <div key={vehicle.id}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] font-medium text-slate-600">{vehicle.make} {vehicle.model}</span>
                    <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-800">{vehicle.quantity}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${vehicle.quantity <= 4 ? "bg-amber-400" : "bg-teal-500"}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <LowStockList inventory={sampleInventory} />
      </div>

      <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-200/80 pt-5 text-[10px] text-slate-400 sm:flex-row sm:items-center">
        <p>Dashboard preview · numbers are illustrative and are not connected to the backend.</p>
        <p>Motorline inventory workspace</p>
      </footer>
    </div>
  );
}
