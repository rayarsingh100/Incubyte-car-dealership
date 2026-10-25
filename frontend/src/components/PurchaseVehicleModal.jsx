import { useEffect, useRef, useState } from "react";
import { getPurchaseErrorMessage } from "../utils/apiErrorMessages.js";
import { formatPreciseCurrency } from "../utils/formatters.js";

export default function PurchaseVehicleModal({ vehicle, onPurchase, onPurchased, onClose }) {
  const [quantity, setQuantity] = useState("1");
  const [quantityError, setQuantityError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [inventoryRefreshed, setInventoryRefreshed] = useState(true);
  const submittingRef = useRef(false);
  const closeRef = useRef(onClose);
  const dialogRef = useRef(null);
  const quantityNumber = Number(quantity);
  const isQuantityValid = /^\d+$/.test(quantity) && Number.isSafeInteger(quantityNumber) && quantityNumber > 0 && quantityNumber <= vehicle.quantity;

  closeRef.current = () => {
    if (!submittingRef.current) onClose();
  };

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.getElementById("purchase-quantity")?.focus();
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll("button:not([disabled]), input:not([disabled])");
      if (!focusable?.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  const submitPurchase = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;
    if (!/^\d+$/.test(quantity) || !Number.isSafeInteger(quantityNumber) || quantityNumber < 1) {
      setQuantityError("Enter a positive whole number.");
      return;
    }
    if (quantityNumber > vehicle.quantity) {
      setQuantityError(`Only ${vehicle.quantity} ${vehicle.quantity === 1 ? "unit is" : "units are"} currently available.`);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setQuantityError("");
    setRequestError("");
    try {
      const result = await onPurchase(vehicle.id, quantityNumber);
      onPurchased(vehicle, quantityNumber, result.inventoryRefreshed);
      setInventoryRefreshed(result.inventoryRefreshed);
      submittingRef.current = false;
      setIsSubmitting(false);
      setIsComplete(true);
    } catch (error) {
      setRequestError(getPurchaseErrorMessage(error));
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="purchase-title" className="max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
        {isComplete ? (
          <div className="py-2 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700" aria-hidden="true">✓</span>
            <h2 id="purchase-title" className="mt-4 text-lg font-semibold text-slate-900">Purchase confirmed</h2>
            <p role="status" className="mt-2 text-sm leading-6 text-slate-600">
              {quantityNumber} × {vehicle.make} {vehicle.model} has been purchased. {inventoryRefreshed ? "Inventory has been refreshed." : "Inventory refresh failed; displayed stock may be out of date."}
            </p>
            <button type="button" onClick={onClose} className="mt-6 h-11 rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-teal-600/20">Done</button>
          </div>
        ) : (
          <>
            <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[9px] font-semibold tracking-[0.12em] text-teal-800 uppercase">Purchase confirmation</span>
            <h2 id="purchase-title" className="mt-3 text-lg font-semibold text-slate-900">Purchase {vehicle.make} {vehicle.model}</h2>
            <p className="mt-1 text-sm text-slate-500">{vehicle.category} · {formatPreciseCurrency(vehicle.price)} per vehicle · {vehicle.quantity} currently available</p>

            {requestError && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm leading-5 text-rose-800">{requestError}</p>}

            <form noValidate onSubmit={submitPurchase} className="mt-5">
              <label htmlFor="purchase-quantity" className="mb-1.5 block text-xs font-semibold text-slate-700">Quantity</label>
              <input
                id="purchase-quantity"
                type="number"
                min="1"
                max={vehicle.quantity}
                step="1"
                inputMode="numeric"
                autoFocus
                value={quantity}
                onChange={(event) => { setQuantity(event.target.value); setQuantityError(""); setRequestError(""); }}
                aria-invalid={Boolean(quantityError)}
                aria-describedby={quantityError ? "purchase-quantity-error" : "purchase-summary"}
                disabled={isSubmitting || vehicle.quantity === 0}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:bg-slate-50"
              />
              {quantityError && <p id="purchase-quantity-error" role="alert" className="mt-2 text-xs text-rose-700">{quantityError}</p>}

              <div id="purchase-summary" className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
                <div className="flex justify-between gap-3 text-slate-600"><span>Selected vehicle</span><span className="text-right font-medium text-slate-800">{vehicle.make} {vehicle.model}</span></div>
                <div className="mt-2 flex justify-between gap-3 text-slate-600"><span>Quantity</span><span className="font-medium text-slate-800">{isQuantityValid ? quantityNumber : "—"}</span></div>
                <div className="mt-3 flex justify-between gap-3 border-t border-slate-200 pt-3 font-semibold text-slate-900"><span>Estimated total</span><span>{isQuantityValid ? formatPreciseCurrency(vehicle.price * quantityNumber) : "—"}</span></div>
              </div>

              <p className="mt-3 text-[11px] leading-5 text-slate-500">Confirming records this purchase and reduces available stock. The server verifies the final availability.</p>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" disabled={isSubmitting} onClick={onClose} className="h-11 rounded-xl border border-slate-200 px-5 text-xs font-semibold text-slate-700 disabled:opacity-60">Cancel</button>
                <button type="submit" disabled={isSubmitting || vehicle.quantity === 0} className="h-11 rounded-xl bg-teal-700 px-5 text-xs font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-wait disabled:opacity-60">{isSubmitting ? "Processing purchase…" : "Confirm purchase"}</button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
