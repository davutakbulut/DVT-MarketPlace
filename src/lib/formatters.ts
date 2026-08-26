export const formatCurrency = (amount: number, currency: string = "TRY"): string => {
  const symbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€";
  const formattedNumber = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  return amount < 0 ? `-${symbol}${formattedNumber}` : `${symbol}${formattedNumber}`;
};

export const formatPercentage = (percent: number): string => {
  return `%${new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(percent)}`;
};

export const formatNumber = (val: number): string => {
  return new Intl.NumberFormat("tr-TR").format(val);
};

export const formatDateTime = (dateStr: string | Date): string => {
  if (!dateStr) return "-";
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(d);
};

export const formatDate = (dateStr: string | Date): string => {
  if (!dateStr) return "-";
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(d);
};
