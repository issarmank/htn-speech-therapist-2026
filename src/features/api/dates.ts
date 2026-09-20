/**
 * `GET /reviews` returns raw Mongo documents, and FastAPI serializes their
 * `created_at` with no timezone designator:
 *
 *     "2026-09-20T01:37:03.541000"
 *
 * The value *is* UTC (`datetime.now(timezone.utc)` in database/models.py), but
 * ECMAScript parses a date-time string without an offset as local time, so
 * `new Date(raw)` lands hours away from the truth.
 */
export function parseServerDate(raw: string): Date {
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(raw);
  return new Date(hasZone ? raw : `${raw}Z`);
}

export function formatReviewDate(raw: string): string {
  const date = parseServerDate(raw);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
