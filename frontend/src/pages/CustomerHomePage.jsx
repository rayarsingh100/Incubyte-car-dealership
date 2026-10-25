import { useMemo, useState } from "react";
import Icon from "../components/Icon.jsx";
import PurchaseVehicleModal from "../components/PurchaseVehicleModal.jsx";
import VehicleStatusBadge from "../components/VehicleStatusBadge.jsx";
import { formatNumber, formatPreciseCurrency } from "../utils/formatters.js";
import { filterInventory } from "../utils/vehicleInventory.js";

const availabilityOptions = [
  { value: "all", label: "All availability" },
  { value: "in-stock", label: "In stock" },
  { value: "low-stock", label: "Low stock" },
  { value: "out-of-stock", label: "Out of stock" },
];

export default function CustomerHomePage({ user, vehicles, isLoading, inventoryError, isRefreshing, onRefresh, onPurchase }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [purchaseNotice, setPurchaseNotice] = useState("");
  const inventory = vehicles || [];
  const categories = useMemo(
    () => [...new Set(inventory.map((vehicle) => vehicle.category))].sort(),
    [inventory],
  );
  const filteredVehicles = useMemo(
    () => filterInventory(inventory, { search, category, availability }),
    [inventory, search, category, availability],
  );
  const vehicleToPurchase = selectedVehicle
    ? inventory.find((vehicle) => vehicle.id === selectedVehicle.id) || selectedVehicle
    : null;
  const hasFilters = Boolean(search.trim()) || category !== "all" || availability !== "all";

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setAvailability("all");
  };

  return (
    <div className="mx-auto max-w-[1240px]">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-blue-800 uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        Customer account
      </div>
      <h1 className="text-[27px] font-semibold tracking-[-0.035em] text-slate-950 sm:text-[32px]">Welcome, {user.name}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Browse the dealership inventory and purchase available vehicles.</p>

      {purchaseNotice && (
        <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{purchaseNotice}</p>
      )}

      {inventoryError && (
        <div role="alert" className="mt-5 flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950 sm:flex-row sm:items-center sm:justify-between">
          <p>{inventoryError.status === 401 ? "Your session is invalid or has expired. Sign in again to continue." : inventoryError.status === 403 ? "Your account is not permitted to view this inventory." : "The latest inventory refresh failed. Displayed stock may be out of date."}</p>
          <button type="button" onClick={onRefresh} disabled={isRefreshing} className="shrink-0 rounded-lg px-3 py-2 font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60">{isRefreshing ? "Refreshing…" : "Retry refresh"}</button>
        </div>
      )}

      {isLoading || (vehicles === null && !inventoryError) ? (
        <section role="status" className="mt-8 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-600">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" aria-hidden="true" />
          <p className="mt-4">Loading dealership inventory…</p>
        </section>
      ) : vehicles === null && inventoryError ? (
        <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <p className="text-sm font-medium text-slate-800">Inventory is unavailable right now.</p>
          <p className="mt-2 text-xs text-slate-500">Check your connection and try refreshing.</p>
          <button type="button" onClick={onRefresh} disabled={isRefreshing} className="mt-4 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60">Try again</button>
        </section>
      ) : (
        <>
          <section aria-label="Vehicle inventory filters" className="mt-7 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(240px,1fr)_minmax(170px,0.45fr)_minmax(180px,0.5fr)_auto] md:items-end">
              <div>
                <label htmlFor="customer-vehicle-search" className="mb-1.5 block text-[10px] font-semibold tracking-[0.1em] text-slate-500 uppercase">Search vehicles</label>
                <div className="relative">
                  <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input id="customer-vehicle-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by brand or model" className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" />
                </div>
              </div>
              <div>
                <label htmlFor="customer-vehicle-category" className="mb-1.5 block text-[10px] font-semibold tracking-[0.1em] text-slate-500 uppercase">Category</label>
                <select id="customer-vehicle-category" value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10">
                  <option value="all">All categories</option>
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="customer-vehicle-availability" className="mb-1.5 block text-[10px] font-semibold tracking-[0.1em] text-slate-500 uppercase">Availability</label>
                <select id="customer-vehicle-availability" value={availability} onChange={(event) => setAvailability(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10">
                  {availabilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              {hasFilters && <button type="button" onClick={clearFilters} className="h-10 rounded-xl px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">Clear filters</button>}
            </div>
          </section>

          <div className="mt-5 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Available vehicles <span className="ml-1 font-normal text-slate-500">({formatNumber(filteredVehicles.length)})</span></h2>
            {isRefreshing && <span role="status" className="text-xs text-slate-500">Updating inventory…</span>}
          </div>

          {filteredVehicles.length === 0 ? (
            <section className="mt-4 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 text-center">
              <Icon name={inventory.length === 0 ? "vehicles" : "search"} className="h-6 w-6 text-slate-500" />
              <h3 className="mt-4 text-sm font-semibold text-slate-800">{inventory.length === 0 ? "No vehicles are listed yet" : "No vehicles match these filters"}</h3>
              <p className="mt-1.5 text-xs text-slate-500">{inventory.length === 0 ? "Please check back later for dealership inventory." : "Try a different search or clear your filters."}</p>
              {hasFilters && <button type="button" onClick={clearFilters} className="mt-4 rounded-lg px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50">Clear filters</button>}
            </section>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredVehicles.map((vehicle) => (
                <article key={vehicle.id} className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase">{vehicle.make}</p>
                      <h3 className="mt-1 truncate text-base font-semibold text-slate-900">{vehicle.model}</h3>
                    </div>
                    <VehicleStatusBadge quantity={vehicle.quantity} />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">{vehicle.category}</p>
                  <p className="mt-5 text-xl font-semibold tracking-tight text-slate-900">{formatPreciseCurrency(vehicle.price)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatNumber(vehicle.quantity)} {vehicle.quantity === 1 ? "unit" : "units"} available</p>
                  <button type="button" onClick={() => { setPurchaseNotice(""); setSelectedVehicle(vehicle); }} disabled={vehicle.quantity === 0} className="mt-5 h-11 w-full rounded-xl bg-teal-700 px-4 text-xs font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">
                    {vehicle.quantity === 0 ? "Out of stock" : "Purchase"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {vehicleToPurchase && (
        <PurchaseVehicleModal
          vehicle={vehicleToPurchase}
          onPurchase={onPurchase}
          onPurchased={(vehicle, quantity, inventoryRefreshed) => setPurchaseNotice(`Purchase confirmed: ${quantity} × ${vehicle.make} ${vehicle.model}.${inventoryRefreshed ? " Inventory has been updated." : " Inventory refresh failed; displayed stock may be out of date."}`)}
          onClose={() => setSelectedVehicle(null)}
        />
      )}
    </div>
  );
}
