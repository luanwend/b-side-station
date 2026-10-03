export const COVER_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%232c3440'/%3E%3Ccircle cx='50' cy='50' r='30' fill='%2314181c'/%3E%3Ccircle cx='50' cy='50' r='6' fill='%23678'/%3E%3C/svg%3E"

export const ARTIST_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%232c3440'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23678'/%3E%3Cellipse cx='50' cy='90' rx='32' ry='26' fill='%23678'/%3E%3C/svg%3E"

export function yearOf(date) {
  return date ? date.slice(0, 4) : ''
}

export function formatDuration(seconds) {
  if (!seconds) return ''
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function plural(count, word, pluralWord = `${word}s`) {
  return `${count} ${count === 1 ? word : pluralWord}`
}
