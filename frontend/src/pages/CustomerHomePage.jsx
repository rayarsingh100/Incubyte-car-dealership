import { useMemo, useState } from "react";
import Icon from "../components/Icon.jsx";
import PurchaseVehicleModal from "../components/PurchaseVehicleModal.jsx";
import VehicleImage from "../components/VehicleImage.jsx";
import VehicleStatusBadge from "../components/VehicleStatusBadge.jsx";
import { formatNumber, formatPreciseCurrency } from "../utils/formatters.js";
import { filterInventory } from "../utils/vehicleInventory.js";

const availabilityOptions = [
  { value: "all", label: "All availability" },
  { value: "in-stock", label: "In stock" },
  { value: "low-stock", label: "Low stock" },
  { value: "out-of-stock", label: "Out of stock" },
];

const heroImageUrl = "https://images.unsplash.com/photo-1724449871658-d5e5caee181e?auto=format&fit=crop&fm=jpg&q=85&w=2200";

export default function CustomerHomePage({ user, vehicles, isLoading, inventoryError, isRefreshing, onRefresh, onPurchase, search: externalSearch, onSearchChange }) {
  const [localSearch, setLocalSearch] = useState("");
  const search = externalSearch ?? localSearch;
  const changeSearch = onSearchChange ?? setLocalSearch;
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
    changeSearch("");
    setCategory("all");
    setAvailability("all");
  };

  return (
    <div className="mx-auto max-w-[1240px]">
      <section className="relative isolate overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[#eeeae0] p-6 sm:p-10 lg:min-h-[370px] lg:p-12">
        <VehicleImage
          imageUrl={heroImageUrl}
          alt="Silver luxury car in a sunlit architectural setting"
          loading="eager"
          fetchPriority="high"
          className="absolute inset-x-0 bottom-0 -z-10 h-40 w-full object-cover object-[center_58%] sm:h-52 lg:inset-y-0 lg:right-0 lg:left-auto lg:h-full lg:w-[58%] lg:object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#f1eee6] via-[#f1eee6]/95 to-[#f1eee6]/0 lg:bg-gradient-to-r lg:from-[#f1eee6] lg:via-[#f1eee6]/65 lg:to-[#f1eee6]/0" />
        <div className="relative z-10 max-w-[560px] pb-36 py-3 sm:pb-48 lg:pb-0">
          <p className="mb-4 text-[10px] font-semibold tracking-[0.2em] text-[var(--color-bronze)] uppercase">The Motorline collection</p>
          <h1 className="font-display text-4xl leading-[1.08] tracking-[-0.035em] text-[var(--color-text)] sm:text-5xl lg:text-[58px]">Luxury cars for a better tomorrow.</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">Discover considered craftsmanship, confident performance, and a collection selected for the way you want to move.</p>
          <a href="#inventory" className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-[var(--color-bronze)] px-6 text-xs font-semibold tracking-wide text-white transition hover:bg-[var(--color-bronze-hover)]">Explore the collection</a>
        </div>
      </section>

      {purchaseNotice && (
        <p role="status" className="mt-5 rounded-xl border border-[#c8d8cc] bg-[var(--color-positive-wash)] px-4 py-3 text-sm text-[#164e41]">{purchaseNotice}</p>
      )}

      {inventoryError && (
        <div role="alert" className="mt-5 flex flex-col gap-2 rounded-xl border border-[#d8c99f] bg-[var(--color-gold-wash)] px-4 py-3 text-xs text-[var(--color-champagne-soft)] sm:flex-row sm:items-center sm:justify-between">
          <p>{inventoryError.status === 401 ? "Your session is invalid or has expired. Sign in again to continue." : inventoryError.status === 403 ? "Your account is not permitted to view this inventory." : "The latest inventory refresh failed. Displayed stock may be out of date."}</p>
          <button type="button" onClick={onRefresh} disabled={isRefreshing} className="shrink-0 rounded-lg px-3 py-2 font-semibold text-[var(--color-champagne-soft)] hover:bg-[var(--color-panel-raised)] disabled:cursor-wait disabled:opacity-60">{isRefreshing ? "Refreshing…" : "Retry refresh"}</button>
        </div>
      )}

      {isLoading || (vehicles === null && !inventoryError) ? (
        <section role="status" className="mt-8 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] text-sm text-[var(--color-text-muted)]">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-teal-700" aria-hidden="true" />
          <p className="mt-4">Loading dealership inventory…</p>
        </section>
      ) : vehicles === null && inventoryError ? (
        <section className="mt-8 rounded-2xl border border-dashed border-[#d3d0c6] bg-[var(--color-panel)] px-5 py-12 text-center">
          <p className="text-sm font-medium text-[#202520]">Inventory is unavailable right now.</p>
          <p className="mt-2 text-xs text-[#737a73]">Check your connection and try refreshing.</p>
          <button type="button" onClick={onRefresh} disabled={isRefreshing} className="mt-4 rounded-xl bg-[var(--color-bronze)] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60">Try again</button>
        </section>
      ) : (
        <>
          {categories.length > 0 && <nav aria-label="Vehicle categories" className="mt-8 flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(category === item ? "all" : item)} aria-pressed={category === item} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition ${category === item ? "border-[var(--color-bronze)] bg-[var(--color-bronze)] text-white" : "border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-text-muted)] hover:border-[var(--color-sage)]"}`}>{item}</button>)}</nav>}
          <section id="inventory" aria-label="Vehicle inventory filters" className="mt-7 rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(240px,1fr)_minmax(170px,0.45fr)_minmax(180px,0.5fr)_auto] md:items-end">
              <div>
                <label htmlFor="customer-vehicle-search" className="mb-1.5 block text-[10px] font-semibold tracking-[0.1em] text-[#737a73] uppercase">Search vehicles</label>
                <div className="relative">
                  <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-text-subtle)]" />
                  <input id="customer-vehicle-search" type="search" value={search} onChange={(event) => changeSearch(event.target.value)} placeholder="Search by brand or model" className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] pr-3 pl-9 text-xs text-[#202520] outline-none transition placeholder:text-[var(--color-text-subtle)] focus:border-[#d0b477] focus:ring-4 focus:ring-[#d0b477]/15" />
                </div>
              </div>
              <div>
                <label htmlFor="customer-vehicle-category" className="mb-1.5 block text-[10px] font-semibold tracking-[0.1em] text-[#737a73] uppercase">Category</label>
                <select id="customer-vehicle-category" value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 text-xs text-[#202520] outline-none focus:border-[#d0b477] focus:ring-4 focus:ring-[#d0b477]/15">
                  <option value="all">All categories</option>
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="customer-vehicle-availability" className="mb-1.5 block text-[10px] font-semibold tracking-[0.1em] text-[#737a73] uppercase">Availability</label>
                <select id="customer-vehicle-availability" value={availability} onChange={(event) => setAvailability(event.target.value)} className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 text-xs text-[#202520] outline-none focus:border-[#d0b477] focus:ring-4 focus:ring-[#d0b477]/15">
                  {availabilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              {hasFilters && <button type="button" onClick={clearFilters} className="h-10 rounded-xl px-3 text-xs font-semibold text-[#737a73] transition hover:bg-[var(--color-panel-soft)] hover:text-[#202520]">Clear filters</button>}
            </div>
          </section>

          <div className="mt-5 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Available vehicles <span className="ml-1 font-normal text-[#737a73]">({formatNumber(filteredVehicles.length)})</span></h2>
            {isRefreshing && <span role="status" className="text-xs text-[#737a73]">Updating inventory…</span>}
          </div>

          {filteredVehicles.length === 0 ? (
            <section className="mt-4 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#d3d0c6] bg-[var(--color-panel)] px-5 text-center">
              <Icon name={inventory.length === 0 ? "vehicles" : "search"} className="h-6 w-6 text-[#737a73]" />
              <h3 className="mt-4 text-sm font-semibold text-[#202520]">{inventory.length === 0 ? "No vehicles are listed yet" : "No vehicles match these filters"}</h3>
              <p className="mt-1.5 text-xs text-[#737a73]">{inventory.length === 0 ? "Please check back later for dealership inventory." : "Try a different search or clear your filters."}</p>
              {hasFilters && <button type="button" onClick={clearFilters} className="mt-4 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--color-champagne)] hover:bg-[var(--color-gold-wash)]">Clear filters</button>}
            </section>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredVehicles.map((vehicle) => (
        <article key={vehicle.id} className="group flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4 shadow-[0_4px_18px_rgba(32,37,32,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#d8c99f] hover:shadow-[0_12px_28px_rgba(32,37,32,0.1)] motion-reduce:transform-none motion-reduce:transition-none sm:p-5">
                  <VehicleImage imageUrl={vehicle.imageUrl} alt={`${vehicle.make} ${vehicle.model}`} className="h-44 w-full rounded-xl" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold tracking-[0.12em] text-[#737a73] uppercase">{vehicle.make}</p>
                      <h3 className="mt-1 truncate text-base font-semibold text-[var(--color-text)]">{vehicle.model}</h3>
                    </div>
                    <VehicleStatusBadge quantity={vehicle.quantity} />
                  </div>
                  <p className="mt-3 text-xs text-[#737a73]">{vehicle.category}</p>
                  <p className="mt-5 text-xl font-semibold tracking-tight text-[var(--color-text)]">{formatPreciseCurrency(vehicle.price)}</p>
                  <p className="mt-1 text-xs text-[#737a73]">{formatNumber(vehicle.quantity)} {vehicle.quantity === 1 ? "unit" : "units"} available</p>
                  <button type="button" onClick={() => { setPurchaseNotice(""); setSelectedVehicle(vehicle); }} disabled={vehicle.quantity === 0} className="mt-5 h-11 w-full rounded-xl bg-[var(--color-bronze)] px-4 text-xs font-semibold text-white transition hover:bg-[var(--color-bronze-hover)] focus:outline-none focus:ring-4 focus:ring-[#d0b477]/20 disabled:cursor-not-allowed disabled:bg-[#e5e2d9] disabled:text-[#737a73]">
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
