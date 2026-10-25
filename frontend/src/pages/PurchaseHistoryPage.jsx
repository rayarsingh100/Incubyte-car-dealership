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
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-blue-800 uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        Customer account
      </div>
      <h1 className="text-[27px] font-semibold tracking-[-0.035em] text-slate-950 sm:text-[32px]">Purchase history</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Review purchases made with your account.</p>

      {isLoading ? (
        <section role="status" className="mt-8 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-600">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" aria-hidden="true" />
          <p className="mt-4">Loading purchase history…</p>
        </section>
      ) : error ? (
        <section role="alert" className="mt-8 rounded-2xl border border-rose-200 bg-white px-5 py-12 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-700" aria-hidden="true">!</span>
          <h2 className="mt-4 text-sm font-semibold text-slate-900">Purchase history is unavailable</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
            {error.status === 401
              ? "Your session is invalid or has expired. Sign out and sign in again to continue."
              : error.message || "We could not load your purchase history. Please try again."}
          </p>
          <button type="button" onClick={retry} className="mt-5 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:ring-4 focus:ring-teal-600/20">Try again</button>
        </section>
      ) : purchases.length === 0 ? (
        <section className="mt-8 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 text-center">
          <Icon name="purchases" className="h-7 w-7 text-slate-500" />
          <h2 className="mt-4 text-sm font-semibold text-slate-800">No purchases yet</h2>
          <p className="mt-1.5 max-w-md text-xs leading-5 text-slate-500">Purchases made with your account will appear here.</p>
        </section>
      ) : (
        <>
          <div className="mt-7 space-y-3">
            {purchases.map((purchase) => (
              <article key={purchase.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase">{purchase.vehicle.category}</p>
                    <h2 className="mt-1 text-base font-semibold text-slate-900">{purchase.vehicle.make} {purchase.vehicle.model}</h2>
                    <p className="mt-1 text-xs text-slate-500">Purchased {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(purchase.createdAt))}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formatPreciseCurrency(Number(purchase.totalAmount))}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <span>{formatNumber(purchase.quantity)} {purchase.quantity === 1 ? "vehicle" : "vehicles"}</span>
                  <span>{formatPreciseCurrency(Number(purchase.unitPrice))} per vehicle</span>
                </div>
              </article>
            ))}
          </div>
          {pagination && pagination.pages > 1 && (
            <nav aria-label="Purchase history pages" className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-600">Page {formatNumber(pagination.page)} of {formatNumber(pagination.pages)} · {formatNumber(pagination.total)} purchases</p>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                <button type="button" disabled={page >= pagination.pages || isLoading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
