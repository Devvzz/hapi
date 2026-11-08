// Approximate rates to euro (November 2026), only for comparing prices with a budget.
// Prices are always shown in their own currency.
const TO_EUR: Record<string, number> = {
  EUR: 1,
  USD: 0.92,
  GBP: 1.17,
  CHF: 1.06,
  ALL: 0.0105,
  PLN: 0.23,
  CZK: 0.04,
  HUF: 0.0025,
  SEK: 0.087,
  NOK: 0.085,
  DKK: 0.134,
  RON: 0.2,
  BGN: 0.51,
  RSD: 0.0085,
  MKD: 0.016,
  TRY: 0.026,
  JPY: 0.006,
  KRW: 0.00066,
  CNY: 0.13,
  INR: 0.011,
  CAD: 0.67,
  AUD: 0.6,
  SGD: 0.69,
  AED: 0.25,
  SAR: 0.245,
  ILS: 0.25,
};

export function toEur(amount: number, currency: string | null | undefined): number | null {
  const rate = TO_EUR[(currency ?? "EUR").toUpperCase()];
  return rate === undefined ? null : Math.round(amount * rate);
}
