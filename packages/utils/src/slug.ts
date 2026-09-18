/**
 * Generate a clean URL slug from a title/string
 * Example: "Aplikasi Kasir Pro 2024!" -> "aplikasi-kasir-pro-2024"
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // separate accent from letter
    .replace(/[\u0300-\u036f]/g, '') // remove accent
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes
}
