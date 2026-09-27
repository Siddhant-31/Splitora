const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const money = (n) => usd.format(n ?? 0);

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
