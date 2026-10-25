import { useMemo, useState } from "react";
import Icon from "../components/Icon.jsx";
import VehicleFormModal from "../components/VehicleFormModal.jsx";
import RestockVehicleModal from "../components/RestockVehicleModal.jsx";
import VehicleStatusBadge from "../components/VehicleStatusBadge.jsx";
import VehicleImage from "../components/VehicleImage.jsx";
import { formatCurrency, formatNumber } from "../utils/formatters.js";
import { filterInventory, getAvailability } from "../utils/vehicleInventory.js";
import { getApiErrorMessage } from "../utils/apiErrorMessages.js";

const availabilityOptions = [
  { value: "all", label: "All availability" },
  { value: "in-stock", label: "In stock" },
  { value: "low-stock", label: "Low stock" },
  { value: "out-of-stock", label: "Out of stock" },
];

function VehicleTable({ vehicles, totalInventoryCount, hasFilters, onClearFilters, onEdit, onRestock, onDelete, pendingVehicleId }) {
  if (vehicles.length === 0) {
    const noVehicles = totalInventoryCount === 0;

    return (
      <div className="flex min-h-[310px] flex-col items-center justify-center px-5 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-panel-soft)] text-[#737a73]">
          <Icon name={noVehicles ? "vehicles" : "search"} className="h-5 w-5" />
        </span>
        <h3 className="mt-4 text-sm font-semibold text-[#202520]">
          {noVehicles ? "No vehicles in the inventory yet" : "No vehicles match these filters"}
        </h3>
        <p className="mt-1.5 max-w-sm text-xs leading-5 text-[#737a73]">
          {noVehicles
            ? "Add a vehicle to start building the dealership inventory."
            : "Try another name, brand, category, or availability filter."}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-4 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--color-champagne)] transition hover:bg-[var(--color-gold-wash)]"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" tabIndex="0" aria-label="Vehicle inventory table; scroll horizontally to see all columns">
      <table className="w-full min-w-[1040px] border-collapse text-left">
        <thead>
          <tr className="border-y border-[#e5e2d9] bg-[var(--color-panel-raised)]">
            <th scope="col" className="px-5 py-3.5 text-[10px] font-semibold tracking-[0.12em] text-[#737a73] uppercase">Vehicle / model</th>
            <th scope="col" className="px-4 py-3.5 text-[10px] font-semibold tracking-[0.12em] text-[#737a73] uppercase">Brand</th>
            <th scope="col" className="px-4 py-3.5 text-[10px] font-semibold tracking-[0.12em] text-[#737a73] uppercase">Category</th>
            <th scope="col" className="px-4 py-3.5 text-right text-[10px] font-semibold tracking-[0.12em] text-[#737a73] uppercase">Price</th>
            <th scope="col" className="px-4 py-3.5 text-right text-[10px] font-semibold tracking-[0.12em] text-[#737a73] uppercase">Stock</th>
            <th scope="col" className="px-5 py-3.5 text-[10px] font-semibold tracking-[0.12em] text-[#737a73] uppercase">Availability</th>
            <th scope="col" className="px-5 py-3.5 text-right text-[10px] font-semibold tracking-[0.12em] text-[#737a73] uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e2d9]">
          {vehicles.map((vehicle) => {
            const status = getAvailability(vehicle.quantity);
            return (
              <tr key={vehicle.id} className="transition-colors hover:bg-[var(--color-panel-raised)]">
                <th scope="row" className="px-5 py-4 font-normal">
                  <div className="flex items-center gap-3">
                    <VehicleImage imageUrl={vehicle.imageUrl} alt={`${vehicle.make} ${vehicle.model}`} className="h-10 w-10 shrink-0 rounded-xl" />
                    <span className="min-w-0">
                      <span className="block whitespace-nowrap text-xs font-semibold text-[#202520]">{vehicle.model}</span>
                      <span className="mt-1 block text-[10px] text-[#737a73]">{vehicle.make} {vehicle.model}</span>
                    </span>
                  </div>
                </th>
                <td className="px-4 py-4 text-xs font-medium text-[var(--color-text-muted)]">{vehicle.make}</td>
                <td className="px-4 py-4">
                  <span className="rounded-lg bg-[var(--color-panel-soft)] px-2.5 py-1.5 text-[10px] font-medium text-[var(--color-text-muted)]">{vehicle.category}</span>
                </td>
                <td className="px-4 py-4 text-right text-xs font-semibold tabular-nums text-[#202520]">{formatCurrency(vehicle.price)}</td>
                <td className="px-4 py-4 text-right">
                  <span className={`text-xs font-semibold tabular-nums ${status.id === "out-of-stock" ? "text-[var(--color-text-subtle)]" : status.id === "low-stock" ? "text-[var(--color-champagne-soft)]" : "text-[#202520]"}`}>
                    {formatNumber(vehicle.quantity)}
                  </span>
                  <span className="ml-1 text-[10px] text-[var(--color-text-subtle)]">units</span>
                </td>
                <td className="px-5 py-4"><VehicleStatusBadge quantity={vehicle.quantity} /></td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit(vehicle)}
                    disabled={Boolean(pendingVehicleId)}
                    aria-label={`Edit ${vehicle.make} ${vehicle.model}`}
                    className="rounded-lg px-3 py-2 text-[11px] font-semibold text-[var(--color-champagne)] transition hover:bg-[var(--color-gold-wash)] focus:outline-none focus:ring-4 focus:ring-[#d0b477]/20"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onRestock(vehicle)}
                    disabled={Boolean(pendingVehicleId)}
                    aria-label={`Restock ${vehicle.make} ${vehicle.model}`}
                    className="rounded-lg px-3 py-2 text-[11px] font-semibold text-[var(--color-champagne)] transition hover:bg-[var(--color-gold-wash)] focus:outline-none focus:ring-4 focus:ring-blue-500/15 disabled:cursor-wait disabled:opacity-50"
                  >Restock</button>
                  <button
                    type="button"
                    onClick={() => onDelete(vehicle)}
                    disabled={Boolean(pendingVehicleId)}
                    aria-label={`Delete ${vehicle.make} ${vehicle.model}`}
                    className="rounded-lg px-3 py-2 text-[11px] font-semibold text-[#9f3e36] transition hover:bg-[var(--color-danger-wash)] focus:outline-none focus:ring-4 focus:ring-rose-500/15 disabled:cursor-wait disabled:opacity-50"
                  >Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function VehiclesPage({ vehicles, inventoryError, isRefreshing, onRefresh, onCreateVehicle, onUpdateVehicle, onDeleteVehicle, onRestockVehicle }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [actionError, setActionError] = useState("");
  const [vehicleToRestock, setVehicleToRestock] = useState(null);
  const [pendingVehicleId, setPendingVehicleId] = useState(null);

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

  const saveVehicle = async (fields, existingId) => {
    setActionError("");
    if (existingId) await onUpdateVehicle(existingId, fields);
    else await onCreateVehicle(fields);
  };

  const handleDelete = async (vehicle) => {
    if (pendingVehicleId || !globalThis.confirm(`Delete ${vehicle.make} ${vehicle.model} from inventory? Vehicles with purchase history cannot be deleted.`)) return;
    setPendingVehicleId(vehicle.id);
    setActionError("");
    setFeedback("");
    try {
      await onDeleteVehicle(vehicle.id);
      setFeedback(`${vehicle.make} ${vehicle.model} was deleted from inventory.`);
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setPendingVehicleId(null);
    }
  };

  const handleRestock = async (vehicleId, quantity) => {
    setPendingVehicleId(vehicleId);
    setActionError("");
    setFeedback("");
    try {
      await onRestockVehicle(vehicleId, quantity);
      setFeedback("Vehicle stock was updated.");
    } finally {
      setPendingVehicleId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1240px]">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d8c99f] bg-[var(--color-gold-wash)] px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-[var(--color-champagne-soft)] uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-sage)]" />
            Connected inventory
          </div>
          <h1 className="font-display text-[34px] tracking-[-0.025em] text-[var(--color-text)] sm:text-[42px]">Vehicles</h1>
          <p className="mt-1.5 text-[13px] text-[#737a73]">Browse and manage vehicle inventory from the dealership API.</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3 lg:justify-end">
          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--color-bronze)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--color-bronze-hover)] focus:outline-none focus:ring-4 focus:ring-[#d0b477]/20"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add vehicle
          </button>
        </div>
      </div>

      {inventoryError && (
        <div role="alert" className="mt-5 flex flex-col gap-2 rounded-xl border border-[#d8c99f] bg-[var(--color-gold-wash)] px-4 py-3 text-xs text-[var(--color-champagne-soft)] sm:flex-row sm:items-center sm:justify-between">
          <p>{inventoryError.status === 401 ? "Your session could not be verified. Sign out and sign in again." : inventoryError.status === 403 ? "Your account does not have permission to manage inventory." : "The latest inventory refresh failed. The rows shown may be out of date."}</p>
          <button type="button" onClick={onRefresh} disabled={isRefreshing} className="shrink-0 rounded-lg px-3 py-2 font-semibold text-[var(--color-champagne-soft)] hover:bg-[var(--color-panel-raised)] disabled:cursor-wait disabled:opacity-60">{isRefreshing ? "Refreshing…" : "Retry refresh"}</button>
        </div>
      )}

      {(feedback || actionError) && (
        <div role={actionError ? "alert" : "status"} className={`mt-5 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-xs ${actionError ? "border-[#e6c4bf] bg-[var(--color-danger-wash)] text-[#9f3e36]" : "border-[#c8d8cc] bg-[var(--color-positive-wash)] text-[#164e41]"}`}>
          <p>{actionError || feedback}</p>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => { setFeedback(""); setActionError(""); }}
            className={actionError
              ? "-mt-1 -mr-1 rounded-lg p-1.5 text-[#9f3e36] transition hover:bg-[#3a2828] focus:outline-none focus:ring-4 focus:ring-rose-600/15"
              : "-mt-1 -mr-1 rounded-lg p-1.5 text-[#164e41] transition hover:bg-[#29352c] focus:outline-none focus:ring-4 focus:ring-[#7fa48a]/20"}
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      )}

      <section aria-label="Vehicle inventory filters" className="mt-7 rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(240px,1fr)_minmax(170px,0.45fr)_minmax(180px,0.5fr)_auto] md:items-end">
          <div>
            <label htmlFor="vehicle-search" className="mb-1.5 block text-[10px] font-semibold tracking-[0.1em] text-[#737a73] uppercase">Search inventory</label>
            <div className="relative">
              <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-text-subtle)]" />
              <input
                id="vehicle-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search vehicle, brand, or model"
                className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] pr-3 pl-9 text-xs text-[#202520] outline-none transition placeholder:text-[var(--color-text-subtle)] focus:border-[#d0b477] focus:ring-4 focus:ring-[#d0b477]/15"
              />
            </div>
          </div>
          <div>
            <label htmlFor="vehicle-category" className="mb-1.5 block text-[10px] font-semibold tracking-[0.1em] text-[#737a73] uppercase">Category</label>
            <select
              id="vehicle-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 text-xs text-[#202520] outline-none transition focus:border-[#d0b477] focus:ring-4 focus:ring-[#d0b477]/15"
            >
              <option value="all">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="vehicle-availability" className="mb-1.5 block text-[10px] font-semibold tracking-[0.1em] text-[#737a73] uppercase">Availability</label>
            <select
              id="vehicle-availability"
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-3 text-xs text-[#202520] outline-none transition focus:border-[#d0b477] focus:ring-4 focus:ring-[#d0b477]/15"
            >
              {availabilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-10 rounded-xl px-3 text-xs font-semibold text-[#737a73] transition hover:bg-[var(--color-panel-soft)] hover:text-[#202520]"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] shadow-[0_4px_18px_rgba(32,37,32,0.06)]">
        <div className="flex flex-col justify-between gap-2 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Inventory list</h2>
            <p className="mt-1 text-[11px] text-[#737a73]">
              Showing {formatNumber(filteredVehicles.length)} of {formatNumber(vehicles.length)} vehicles · {formatNumber(totalUnits)} units
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-panel-raised)] px-2.5 py-1.5 text-[10px] font-medium text-[#737a73] ring-1 ring-inset ring-[#e5e2d9]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-sage)]" />
            API inventory
          </span>
        </div>
        {pendingVehicleId && <p role="status" className="border-t border-[#e5e2d9] px-5 py-2 text-xs text-[#737a73]">Updating vehicle inventory…</p>}
        <p className="border-t border-[#e5e2d9] bg-[var(--color-panel-raised)]/60 px-5 py-2 text-[10px] text-[#737a73] sm:hidden">
          Swipe horizontally to view every column.
        </p>
        <VehicleTable
          vehicles={filteredVehicles}
          totalInventoryCount={vehicles.length}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          onEdit={openEditForm}
          onRestock={setVehicleToRestock}
          onDelete={handleDelete}
          pendingVehicleId={pendingVehicleId}
        />
        <div className="flex items-center justify-between border-t border-[#e5e2d9] px-5 py-3 text-[10px] text-[var(--color-text-subtle)] sm:px-6">
          <span>Availability is based on current stock quantity.</span>
          <span>Changes are saved through the inventory API</span>
        </div>
      </section>

      {isFormOpen && (
        <VehicleFormModal
          vehicle={vehicleToEdit}
          onSave={saveVehicle}
          onClose={closeForm}
          onSaved={(message) => setFeedback(message)}
        />
      )}
      {vehicleToRestock && (
        <RestockVehicleModal vehicle={vehicleToRestock} onSave={handleRestock} onClose={() => setVehicleToRestock(null)} />
      )}
    </div>
  );
}
