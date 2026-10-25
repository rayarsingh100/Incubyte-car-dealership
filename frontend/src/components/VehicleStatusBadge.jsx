import { getAvailability } from "../utils/vehicleInventory.js";

const statusStyles = {
  "in-stock": "bg-[var(--color-positive-wash)] text-[#164e41] ring-[#394c3e]",
  "low-stock": "bg-[var(--color-gold-wash)] text-[var(--color-champagne-soft)] ring-[#d8c99f]",
  "out-of-stock": "bg-[var(--color-panel-soft)] text-[var(--color-text-muted)] ring-[#d3d0c6]",
};

const dotStyles = {
  "in-stock": "bg-[#7fa48a]",
  "low-stock": "bg-[var(--color-sage)]",
  "out-of-stock": "bg-[#777267]",
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
