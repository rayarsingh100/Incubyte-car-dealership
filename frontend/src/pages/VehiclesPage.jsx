import { useMemo, useState } from "react";
import Icon from "../components/Icon.jsx";
import VehicleFormModal from "../components/VehicleFormModal.jsx";
import VehicleStatusBadge from "../components/VehicleStatusBadge.jsx";
import { formatCurrency, formatNumber } from "../utils/formatters.js";
import { filterInventory, getAvailability } from "../utils/vehicleInventory.js";

const availabilityOptions = [
  { value: "all", label: "All availability" },
  { value: "in-stock", label: "In stock" },
  { value: "low-stock", label: "Low stock" },
  { value: "out-of-stock", label: "Out of stock" },
];

function VehicleTable({ vehicles, totalInventoryCount, hasFilters, onClearFilters, onEdit }) {
  if (vehicles.length === 0) {
    const noSampleVehicles = totalInventoryCount === 0;

    return (
      <div className="flex min-h-[310px] flex-col items-center justify-center px-5 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Icon name={noSampleVehicles ? "vehicles" : "search"} className="h-5 w-5" />
        </span>
        <h3 className="mt-4 text-sm font-semibold text-slate-800">
          {noSampleVehicles ? "No sample vehicles yet" : "No vehicles match these filters"}
        </h3>
        <p className="mt-1.5 max-w-sm text-xs leading-5 text-slate-500">
          {noSampleVehicles
            ? "Sample inventory records will appear here when they are added to the preview data."
            : "Try another name, brand, category, or availability filter."}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-4 rounded-lg px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" tabIndex="0" aria-label="Vehicle inventory table; scroll horizontally to see all columns">
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead>
          <tr className="border-y border-slate-100 bg-slate-50/70">
            <th scope="col" className="px-5 py-3.5 text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase">Vehicle / model</th>
            <th scope="col" className="px-4 py-3.5 text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase">Brand</th>
            <th scope="col" className="px-4 py-3.5 text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase">Category</th>
            <th scope="col" className="px-4 py-3.5 text-right text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase">Price</th>
            <th scope="col" className="px-4 py-3.5 text-right text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase">Stock</th>
            <th scope="col" className="px-5 py-3.5 text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase">Availability</th>
            <th scope="col" className="px-5 py-3.5 text-right text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {vehicles.map((vehicle) => {
            const status = getAvailability(vehicle.quantity);
            return (
              <tr key={vehicle.id} className="transition-colors hover:bg-slate-50/70">
                <th scope="row" className="px-5 py-4 font-normal">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <Icon name="vehicles" className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block whitespace-nowrap text-xs font-semibold text-slate-800">{vehicle.model}</span>
                      <span className="mt-1 block text-[10px] text-slate-500">{vehicle.make} {vehicle.model}</span>
                    </span>
                  </div>
                </th>
                <td className="px-4 py-4 text-xs font-medium text-slate-600">{vehicle.make}</td>
                <td className="px-4 py-4">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-medium text-slate-600">{vehicle.category}</span>
                </td>
                <td className="px-4 py-4 text-right text-xs font-semibold tabular-nums text-slate-800">{formatCurrency(vehicle.price)}</td>
                <td className="px-4 py-4 text-right">
                  <span className={`text-xs font-semibold tabular-nums ${status.id === "out-of-stock" ? "text-slate-400" : status.id === "low-stock" ? "text-amber-700" : "text-slate-800"}`}>
                    {formatNumber(vehicle.quantity)}
                  </span>
                  <span className="ml-1 text-[10px] text-slate-400">units</span>
                </td>
                <td className="px-5 py-4"><VehicleStatusBadge quantity={vehicle.quantity} /></td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit(vehicle)}
                    aria-label={`Edit ${vehicle.make} ${vehicle.model}`}
                    className="rounded-lg px-3 py-2 text-[11px] font-semibold text-teal-700 transition hover:bg-teal-50 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function VehiclesPage({ vehicles, onSaveVehicle }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState(null);
  const [feedback, setFeedback] = useState("");

  const categories = useMemo(
    () => [...new Set(vehicles.map((vehicle) => vehicle.category))].sort(),
    [vehicles],
  );
  const filteredVehicles = useMemo(
    () => filterInventory(vehicles, { search, category, availability }),
    [vehicles, search, category, availability],
  );
  const hasFilters = Boolean(search.trim()) || category !== "all" || availability !== "all";
  const totalUnits = vehicles.reduce((total, vehicle) => total + vehicle.quantity, 0);

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setAvailability("all");
  };

  const openAddForm = () => {
    setVehicleToEdit(null);
    setIsFormOpen(true);
  };

  const openEditForm = (vehicle) => {
    setVehicleToEdit(vehicle);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setVehicleToEdit(null);
  };

  return (
    <div className="mx-auto max-w-[1240px]">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-teal-800 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            Sample data · not live
          </div>
          <h1 className="text-[27px] font-semibold tracking-[-0.035em] text-slate-950 sm:text-[32px]">Vehicles</h1>
          <p className="mt-1.5 text-[13px] text-slate-500">Browse the sample dealership inventory and stock status.</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3 lg:justify-end">
          <p id="add-vehicle-note" className="max-w-[230px] text-[10px] leading-4 text-slate-500 sm:text-right">
            Adds a local sample record for this session only; nothing is sent to the backend.
          </p>
          <button
            type="button"
            onClick={openAddForm}
            aria-describedby="add-vehicle-note"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add vehicle
          </button>
        </div>
      </div>

      {feedback && (
        <div role="status" className="mt-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
          <p>{feedback}</p>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setFeedback("")}
            className="-mt-1 -mr-1 rounded-lg p-1.5 text-emerald-800 transition hover:bg-emerald-100 focus:outline-none focus:ring-4 focus:ring-emerald-600/15"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      )}

      <section aria-label="Vehicle inventory filters" className="mt-7 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(240px,1fr)_minmax(170px,0.45fr)_minmax(180px,0.5fr)_auto] md:items-end">
          <div>
            <label htmlFor="vehicle-search" className="mb-1.5 block text-[10px] font-semibold tracking-[0.1em] text-slate-500 uppercase">Search inventory</label>
            <div className="relative">
              <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="vehicle-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search vehicle, brand, or model"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              />
            </div>
          </div>
          <div>
            <label htmlFor="vehicle-category" className="mb-1.5 block text-[10px] font-semibold tracking-[0.1em] text-slate-500 uppercase">Category</label>
            <select
              id="vehicle-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            >
              <option value="all">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="vehicle-availability" className="mb-1.5 block text-[10px] font-semibold tracking-[0.1em] text-slate-500 uppercase">Availability</label>
            <select
              id="vehicle-availability"
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            >
              {availabilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-10 rounded-xl px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.025)]">
        <div className="flex flex-col justify-between gap-2 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Inventory list</h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Showing {formatNumber(filteredVehicles.length)} of {formatNumber(vehicles.length)} sample models · {formatNumber(totalUnits)} units
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1.5 text-[10px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            Local preview
          </span>
        </div>
        <p className="border-t border-slate-100 bg-slate-50/60 px-5 py-2 text-[10px] text-slate-500 sm:hidden">
          Swipe horizontally to view every column.
        </p>
        <VehicleTable
          vehicles={filteredVehicles}
          totalInventoryCount={vehicles.length}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          onEdit={openEditForm}
        />
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[10px] text-slate-400 sm:px-6">
          <span>Availability is based on sample stock quantity.</span>
          <span>Updated for this preview</span>
        </div>
      </section>

      {isFormOpen && (
        <VehicleFormModal
          vehicle={vehicleToEdit}
          onSave={onSaveVehicle}
          onClose={closeForm}
          onSaved={(message) => setFeedback(message)}
        />
      )}
    </div>
  );
}
