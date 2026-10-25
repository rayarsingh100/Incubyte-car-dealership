import { useRef, useState } from "react";
import { getApiErrorMessage } from "../utils/apiErrorMessages.js";
import { MAX_VEHICLE_QUANTITY } from "../utils/vehicleFormValidation.js";

export default function RestockVehicleModal({ vehicle, onSave, onClose }) {
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;
    const amount = Number(quantity);
    if (!/^\d+$/.test(quantity) || !Number.isSafeInteger(amount) || amount < 1 || amount > MAX_VEHICLE_QUANTITY) {
      setError("Enter a whole number from 1 to 2,147,483,647.");
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setError("");
    try {
      await onSave(vehicle.id, amount);
      onClose();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-5">
      <section role="dialog" aria-modal="true" aria-labelledby="restock-title" className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
        <h2 id="restock-title" className="text-lg font-semibold text-slate-900">Restock {vehicle.make} {vehicle.model}</h2>
        <p className="mt-1 text-sm text-slate-500">Current stock: {vehicle.quantity}. Enter the number of units to add.</p>
        <form noValidate onSubmit={handleSubmit} className="mt-5">
          <label htmlFor="restock-quantity" className="mb-1.5 block text-xs font-semibold text-slate-700">Units to add</label>
          <input
            id="restock-quantity"
            type="number"
            min="1"
            max={MAX_VEHICLE_QUANTITY}
            step="1"
            inputMode="numeric"
            autoFocus
            value={quantity}
            onChange={(event) => { setQuantity(event.target.value); setError(""); }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "restock-error" : undefined}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
          />
          {error && <p id="restock-error" role="alert" className="mt-2 text-xs text-rose-700">{error}</p>}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" disabled={isSubmitting} onClick={onClose} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-700 disabled:opacity-60">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="h-10 rounded-xl bg-teal-700 px-4 text-xs font-semibold text-white disabled:cursor-wait disabled:opacity-70">{isSubmitting ? "Restocking…" : "Add stock"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
