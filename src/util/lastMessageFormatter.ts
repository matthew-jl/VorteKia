export function formatLastMessage(text: string | undefined): string {
  if (!text) return ""; // Handle undefined or empty text
  if (text.length <= 30) return text; // Return as-is if 25 or fewer characters
  return text.substring(0, 27) + "..."; // Truncate to 22 chars + "..." (total 25)
}
