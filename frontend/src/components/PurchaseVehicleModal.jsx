import { useEffect, useRef, useState } from "react";
import { getPurchaseErrorMessage } from "../utils/apiErrorMessages.js";
import { formatPreciseCurrency } from "../utils/formatters.js";

export default function PurchaseVehicleModal({ vehicle, onPurchase, onPurchased, onClose }) {
  const [quantity, setQuantity] = useState("1");
  const [demoPaymentOutcome, setDemoPaymentOutcome] = useState("success");
  const [quantityError, setQuantityError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [inventoryRefreshed, setInventoryRefreshed] = useState(true);
  const [completedPurchase, setCompletedPurchase] = useState(null);
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
      const focusable = dialogRef.current?.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled])");
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
      const result = await onPurchase(vehicle.id, quantityNumber, demoPaymentOutcome);
      onPurchased(vehicle, quantityNumber, result.inventoryRefreshed);
      setInventoryRefreshed(result.inventoryRefreshed);
      setCompletedPurchase(result.purchase);
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
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[#202520]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="purchase-title" className="max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[var(--color-panel)] p-5 shadow-2xl sm:rounded-3xl sm:p-7">
        {isComplete ? (
          <div className="py-2 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-positive-wash)] text-[#164e41]" aria-hidden="true">✓</span>
            <h2 id="purchase-title" className="mt-4 text-lg font-semibold text-[var(--color-text)]">Demo payment complete</h2>
            <p role="status" className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              {quantityNumber} × {vehicle.make} {vehicle.model} has been purchased. {inventoryRefreshed ? "Inventory has been refreshed." : "Inventory refresh failed; displayed stock may be out of date."}
            </p>
            {completedPurchase?.id && <p className="mt-2 break-all text-xs text-[var(--color-text-subtle)]">Order ID: {completedPurchase.id}</p>}
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Total: {formatPreciseCurrency(Number(completedPurchase?.totalAmount ?? vehicle.price * quantityNumber))} · Demo Card Payment</p>
            <button type="button" onClick={onClose} className="mt-6 h-11 rounded-xl bg-[var(--color-bronze)] px-5 text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-[#d0b477]/20">Done</button>
          </div>
        ) : (
          <>
            <span className="inline-flex rounded-full border border-[#d8c99f] bg-[var(--color-gold-wash)] px-2.5 py-1 text-[9px] font-semibold tracking-[0.12em] text-[var(--color-champagne-soft)] uppercase">Demo payment · no real charge</span>
            <h2 id="purchase-title" className="mt-3 text-lg font-semibold text-[var(--color-text)]">Checkout · {vehicle.make} {vehicle.model}</h2>
            <p className="mt-1 text-sm text-[#737a73]">{vehicle.category} · {formatPreciseCurrency(vehicle.price)} per vehicle · {vehicle.quantity} currently available</p>

            {requestError && <p role="alert" className="mt-4 rounded-xl border border-[#e6c4bf] bg-[var(--color-danger-wash)] px-3.5 py-3 text-sm leading-5 text-[#9f3e36]">{requestError}</p>}

            <form noValidate onSubmit={submitPurchase} className="mt-5">
              <label htmlFor="purchase-quantity" className="mb-1.5 block text-xs font-semibold text-[#202520]">Quantity</label>
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
                className="h-11 w-full rounded-xl border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[#d0b477] focus:ring-4 focus:ring-[#d0b477]/15 disabled:bg-[var(--color-panel-raised)]"
              />
              {quantityError && <p id="purchase-quantity-error" role="alert" className="mt-2 text-xs text-[#9f3e36]">{quantityError}</p>}

              <div id="purchase-summary" className="mt-4 rounded-xl bg-[var(--color-panel-raised)] p-4 text-sm">
                <div className="flex justify-between gap-3 text-[var(--color-text-muted)]"><span>Selected vehicle</span><span className="text-right font-medium text-[#202520]">{vehicle.make} {vehicle.model}</span></div>
                <div className="mt-2 flex justify-between gap-3 text-[var(--color-text-muted)]"><span>Quantity</span><span className="font-medium text-[#202520]">{isQuantityValid ? quantityNumber : "—"}</span></div>
                <div className="mt-3 flex justify-between gap-3 border-t border-[var(--color-border)] pt-3 font-semibold text-[var(--color-text)]"><span>Estimated total</span><span>{isQuantityValid ? formatPreciseCurrency(vehicle.price * quantityNumber) : "—"}</span></div>
              </div>

              <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3">
                <p className="text-xs font-semibold text-[var(--color-text)]">Payment method</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">Demo Card Payment · simulation only. Never enter card details.</p>
                <label htmlFor="demo-payment-outcome" className="mt-3 block text-xs font-medium text-[var(--color-text-muted)]">Test result</label>
                <select id="demo-payment-outcome" value={demoPaymentOutcome} onChange={(event) => { setDemoPaymentOutcome(event.target.value); setRequestError(""); }} disabled={isSubmitting} className="mt-1.5 h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 text-xs text-[var(--color-text)]">
                  <option value="success">Simulate successful payment</option>
                  <option value="failure">Simulate declined payment</option>
                </select>
              </div>

              <p className="mt-3 text-[11px] leading-5 text-[#737a73]">Only a successful demo payment records an order and reduces stock. The server uses the stored vehicle price.</p>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" disabled={isSubmitting} onClick={onClose} className="h-11 rounded-xl border border-[var(--color-border)] px-5 text-xs font-semibold text-[#202520] disabled:opacity-60">Cancel</button>
                <button type="submit" disabled={isSubmitting || vehicle.quantity === 0} className="h-11 rounded-xl bg-[var(--color-bronze)] px-5 text-xs font-semibold text-white transition hover:bg-[var(--color-bronze-hover)] focus:outline-none focus:ring-4 focus:ring-[#d0b477]/20 disabled:cursor-wait disabled:opacity-60">{isSubmitting ? "Processing demo payment…" : "Confirm payment"}</button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
