export function formatRupiah(price: number | string): string {
  const numberPrice = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(numberPrice)) {
    return "Rp 0";
  }
  const formattedPrice = numberPrice
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Rp ${formattedPrice}`;
}
