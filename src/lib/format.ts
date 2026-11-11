export const usd = (n: number, digits = 2) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });

export const signedUsd = (n: number) => (n < 0 ? "-" : "+") + usd(Math.abs(n));

export const signedPct = (n: number) => `${n < 0 ? "-" : "+"}${Math.abs(n).toFixed(2)}%`;
