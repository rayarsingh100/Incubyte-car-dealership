const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatCurrency(value) {
  return currencyFormatter.format(value);
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}
