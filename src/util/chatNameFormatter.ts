export function formatChatName(text: string | undefined): string {
  if (!text) return "";
  if (text.length <= 25) return text;
  return text.substring(0, 22) + "...";
}
