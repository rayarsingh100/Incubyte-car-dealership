import { getAvailability } from "../utils/vehicleInventory.js";

const statusStyles = {
  "in-stock": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "low-stock": "bg-amber-50 text-amber-800 ring-amber-200",
  "out-of-stock": "bg-slate-100 text-slate-600 ring-slate-200",
};

const dotStyles = {
  "in-stock": "bg-emerald-500",
  "low-stock": "bg-amber-500",
  "out-of-stock": "bg-slate-400",
};

export default function VehicleStatusBadge({ quantity }) {
  const status = getAvailability(quantity);

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[10px] font-semibold ring-1 ring-inset ${statusStyles[status.id]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[status.id]}`} />
      {status.label}
    </span>
  );
}
