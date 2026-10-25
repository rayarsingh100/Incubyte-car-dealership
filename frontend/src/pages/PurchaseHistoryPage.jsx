import { useEffect, useState } from "react";
import Icon from "../components/Icon.jsx";
import { listPurchaseHistory } from "../services/purchasesApi.js";
import { formatNumber, formatPreciseCurrency } from "../utils/formatters.js";

const PAGE_SIZE = 10;

export default function PurchaseHistoryPage({ token }) {
  const [page, setPage] = useState(1);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    listPurchaseHistory(token, page, PAGE_SIZE, controller.signal)
      .then(setHistory)
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(requestError);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [token, page, reloadVersion]);

  const retry = () => setReloadVersion((version) => version + 1);
  const purchases = history?.purchases || [];
  const pagination = history?.pagination;

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d8c99f] bg-[var(--color-gold-wash)] px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-[var(--color-champagne-soft)] uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-sage)]" />
        Customer account
      </div>
      <h1 className="font-display text-[34px] tracking-[-0.025em] text-[var(--color-text)] sm:text-[42px]">Purchase history</h1>
      <p className="mt-2 text-sm leading-6 text-[#737a73]">Review purchases made with your account.</p>

      {isLoading ? (
        <section role="status" className="mt-8 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] text-sm text-[var(--color-text-muted)]">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-teal-700" aria-hidden="true" />
          <p className="mt-4">Loading purchase history…</p>
        </section>
      ) : error ? (
        <section role="alert" className="mt-8 rounded-2xl border border-[#e6c4bf] bg-[var(--color-panel)] px-5 py-12 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-danger-wash)] text-[#9f3e36]" aria-hidden="true">!</span>
          <h2 className="mt-4 text-sm font-semibold text-[var(--color-text)]">Purchase history is unavailable</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--color-text-muted)]">
            {error.status === 401
              ? "Your session is invalid or has expired. Sign out and sign in again to continue."
              : error.message || "We could not load your purchase history. Please try again."}
          </p>
          <button type="button" onClick={retry} className="mt-5 rounded-xl bg-[var(--color-bronze)] px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:ring-4 focus:ring-[#d0b477]/20">Try again</button>
        </section>
      ) : purchases.length === 0 ? (
        <section className="mt-8 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#d3d0c6] bg-[var(--color-panel)] px-5 text-center">
          <Icon name="purchases" className="h-7 w-7 text-[#737a73]" />
          <h2 className="mt-4 text-sm font-semibold text-[#202520]">No purchases yet</h2>
          <p className="mt-1.5 max-w-md text-xs leading-5 text-[#737a73]">Purchases made with your account will appear here.</p>
        </section>
      ) : (
        <>
          <div className="mt-7 space-y-3">
            {purchases.map((purchase) => (
              <article key={purchase.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold tracking-[0.12em] text-[#737a73] uppercase">{purchase.vehicle.category}</p>
                    <h2 className="mt-1 text-base font-semibold text-[var(--color-text)]">{purchase.vehicle.make} {purchase.vehicle.model}</h2>
                    <p className="mt-1 text-xs text-[#737a73]">Purchased {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(purchase.createdAt))}</p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{formatPreciseCurrency(Number(purchase.totalAmount))}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#e5e2d9] pt-3 text-xs text-[var(--color-text-muted)]">
                  <span>{formatNumber(purchase.quantity)} {purchase.quantity === 1 ? "vehicle" : "vehicles"}</span>
                  <span>{formatPreciseCurrency(Number(purchase.unitPrice))} per vehicle</span>
                </div>
              </article>
            ))}
          </div>
          {pagination && pagination.pages > 1 && (
            <nav aria-label="Purchase history pages" className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3">
              <p className="text-xs text-[var(--color-text-muted)]">Page {formatNumber(pagination.page)} of {formatNumber(pagination.pages)} · {formatNumber(pagination.total)} purchases</p>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[#202520] disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                <button type="button" disabled={page >= pagination.pages || isLoading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[#202520] disabled:cursor-not-allowed disabled:opacity-50">Next</button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
