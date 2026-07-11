export function formatCurrency(value: string | number, currency = "USD"): string {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(num) ? num : 0);
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatNumber(value: string | number, fractionDigits = 2): string {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number.isFinite(num) ? num : 0);
}
