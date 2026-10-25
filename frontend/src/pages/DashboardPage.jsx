import Icon from "../components/Icon.jsx";
import MetricCard from "../components/MetricCard.jsx";
import { summarizeInventory } from "../utils/dashboardMockData.js";
import { formatCurrency, formatNumber } from "../utils/formatters.js";

const metrics = (summary) => [
  {
    label: "Total vehicles",
    value: formatNumber(summary.totalModels),
    detail: `${formatNumber(summary.totalUnits)} units across the inventory`,
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
    detail: "Estimated from quantity × unit price",
    icon: "chart",
    tone: "violet",
  },
];

function InventorySummary({ inventory }) {
  const categories = inventory.reduce((groups, vehicle) => {
    groups[vehicle.category] = (groups[vehicle.category] || 0) + vehicle.quantity;
    return groups;
  }, {});
  const categoryRows = Object.entries(categories).sort((first, second) => second[1] - first[1]);
  const totalUnits = categoryRows.reduce((total, [, units]) => total + units, 0);
  const colors = ["bg-[var(--color-sage)]", "bg-[#6f8f83]", "bg-[var(--color-gold-wash)]", "bg-[var(--color-panel-soft)]"];

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Inventory overview</h2>
          <p className="mt-1 text-xs text-[#737a73]">Current stock by vehicle type</p>
        </div>
        <span className="rounded-lg bg-[var(--color-panel-raised)] px-2.5 py-1.5 text-[10px] font-medium text-[#737a73] ring-1 ring-inset ring-[#e5e2d9]">
          {formatNumber(totalUnits)} units
        </span>
      </div>

      {categoryRows.length === 0 || totalUnits === 0 ? (
        <div className="mt-7 rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[#737a73]">
          {categoryRows.length === 0 ? "No vehicles are in the inventory yet." : "Vehicles are listed, but there are no units in stock."}
        </div>
      ) : (
        <>
          <div className="mt-7 flex h-2 overflow-hidden rounded-full bg-[var(--color-panel-soft)]" aria-label="Current inventory by vehicle type">
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
                <span className="flex-1 text-xs font-medium text-[var(--color-text-muted)]">{category}</span>
                <span className="text-xs font-semibold tabular-nums text-[#202520]">{formatNumber(units)}</span>
                <span className="w-10 text-right text-[11px] tabular-nums text-[var(--color-text-subtle)]">
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
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Recent activity</h2>
          <p className="mt-1 text-xs text-[#737a73]">Dealership activity</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-panel-raised)] text-[#737a73] ring-1 ring-inset ring-[#e5e2d9]">
          <Icon name="clock" className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-4 py-8 text-center text-sm text-[#737a73]">No activity data is available.</div>
    </section>
  );
}

function LowStockList({ inventory }) {
  const lowStockVehicles = inventory
    .filter((vehicle) => vehicle.quantity > 0 && vehicle.quantity <= 4)
    .sort((first, second) => first.quantity - second.quantity);

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Needs attention</h2>
          <p className="mt-1 text-xs text-[#737a73]">Vehicles with 4 or fewer units in stock</p>
        </div>
        <span className="rounded-full bg-[var(--color-gold-wash)] px-2.5 py-1 text-[10px] font-semibold text-[var(--color-champagne-soft)] ring-1 ring-inset ring-[#d8c99f]">
          {lowStockVehicles.length} low
        </span>
      </div>

      {lowStockVehicles.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center">
          <p className="text-sm font-medium text-[#202520]">All clear</p>
          <p className="mt-1 text-xs text-[#737a73]">There are no low-stock vehicles.</p>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-[#e5e2d9]">
          {lowStockVehicles.map((vehicle) => (
            <div key={vehicle.id} className="flex items-center justify-between gap-3 py-3.5 first:pt-2 last:pb-1">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-panel-soft)] text-[var(--color-text-muted)]">
                  <Icon name="vehicles" className="h-[17px] w-[17px]" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#202520]">{vehicle.make} {vehicle.model}</p>
                  <p className="mt-1 text-[10px] text-[#737a73]">{vehicle.category}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-lg bg-[var(--color-gold-wash)] px-2.5 py-1.5 text-[11px] font-semibold tabular-nums text-[var(--color-champagne-soft)]">
                {vehicle.quantity} left
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function DashboardPage({ vehicles, inventoryError, isRefreshing, onRefresh }) {
  const summary = summarizeInventory(vehicles);

  return (
    <div className="mx-auto max-w-[1240px]">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d8c99f] bg-[var(--color-gold-wash)] px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-[var(--color-champagne-soft)] uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-sage)]" />
            Live inventory
          </div>
          <h1 className="font-display text-[34px] tracking-[-0.025em] text-[var(--color-text)] sm:text-[42px]">Dashboard</h1>
          <p className="mt-1.5 text-[13px] text-[#737a73]">A considered view of the current collection.</p>
        </div>
      </div>

      {inventoryError && (
        <div role="alert" className="mt-5 flex flex-col gap-3 rounded-xl border border-[#d8c99f] bg-[var(--color-gold-wash)] px-4 py-3 text-xs text-[var(--color-champagne-soft)] sm:flex-row sm:items-center sm:justify-between">
          <p>{inventoryError.status === 401 ? "Your session could not be verified. Sign out and sign in again." : inventoryError.status === 403 ? "Your account does not have permission to access inventory." : "Inventory was updated, but the latest refresh failed. Displayed figures may be stale."}</p>
          <button type="button" onClick={onRefresh} disabled={isRefreshing} className="shrink-0 rounded-lg px-3 py-2 font-semibold text-[var(--color-champagne-soft)] hover:bg-[var(--color-panel-raised)] focus:outline-none focus:ring-2 focus:ring-amber-600/20 disabled:cursor-wait disabled:opacity-60">{isRefreshing ? "Refreshing…" : "Retry refresh"}</button>
        </div>
      )}

      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics(summary).map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <InventorySummary inventory={vehicles} />
        <RecentActivity />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.68fr]">
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text)]">Stock levels</h2>
              <p className="mt-1 text-xs text-[#737a73]">Current quantity by vehicle model</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-lg bg-[var(--color-panel-raised)] px-2.5 py-1.5 text-[10px] font-medium text-[#737a73] ring-1 ring-inset ring-[#e5e2d9]">
              <Icon name="box" className="h-3.5 w-3.5" />
              {formatNumber(summary.totalUnits)} units
            </span>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {vehicles.map((vehicle) => {
              const width = Math.min(100, (vehicle.quantity / 12) * 100);
              return (
                <div key={vehicle.id}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] font-medium text-[var(--color-text-muted)]">{vehicle.make} {vehicle.model}</span>
                    <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[#202520]">{vehicle.quantity}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-panel-soft)]">
                    <div
                      className={`h-full rounded-full ${vehicle.quantity <= 4 ? "bg-[#d0b477]" : "bg-[var(--color-sage)]"}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <LowStockList inventory={vehicles} />
      </div>

      <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-[var(--color-border)] pt-5 text-[10px] text-[var(--color-text-subtle)] sm:flex-row sm:items-center">
        <p>Current inventory at a glance.</p>
        <p>Motorline inventory workspace</p>
      </footer>
    </div>
  );
}
