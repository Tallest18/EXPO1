export const formatDateLabel = (date: Date): string =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/**
 * Format a number with thousands separators (e.g. 7000000 -> "7,000,000",
 * 1234.5 -> "1,234.5"). Done manually rather than via toLocaleString so
 * grouping is reliable across JS engines (Hermes does not always apply locale
 * grouping).
 *
 * Decimals are preserved as-is by default — whole numbers stay whole
 * (50000 -> "50,000") and fractional values keep their decimals
 * (250.5 -> "250.5"). Pass `decimals` to force a fixed number of decimal
 * places (e.g. formatNumber(1234, 2) -> "1,234.00").
 *
 * @param value    number or numeric string
 * @param decimals optional fixed number of decimal places
 */
export const formatNumber = (
  value: number | string | undefined | null,
  decimals?: number,
): string => {
  const num = typeof value === "string" ? Number(value) : value;
  const safe = typeof num === "number" && isFinite(num) ? num : 0;
  const str = decimals === undefined ? String(safe) : safe.toFixed(decimals);
  const [intPart, decPart] = str.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart ? `${grouped}.${decPart}` : grouped;
};

/**
 * Format a money value with the ₦ symbol and thousands separators.
 * Defaults to 2 decimal places (e.g. "₦50,000.00"); pass a different
 * `decimals` to override.
 */
export const formatCurrency = (
  amount: number | string | undefined | null,
  decimals = 2,
): string => `₦${formatNumber(amount, decimals)}`;
