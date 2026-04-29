export const formatDateLabel = (date: Date): string =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const formatCurrency = (amount: number | undefined | null): string => {
  const safeAmount =
    typeof amount === "number" && isFinite(amount) ? amount : 0;
  return `₦${safeAmount.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};
