/**
 * Format date to Indonesian localized format
 * Example: 2026-09-10 -> "10 September 2026"
 */
export function formatIndonesianDate(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Format date and time to Indonesian localized format
 * Example: "10 September 2026, 14:30 WIB"
 */
export function formatIndonesianDateTime(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '-';

  const dateStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  return `${dateStr} WIB`;
}
