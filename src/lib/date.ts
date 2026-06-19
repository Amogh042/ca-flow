// Small helpers to normalize timestamp-like strings before sending to the DB.
// Avoids sending human-friendly placeholders ("Just now", "No deadline linked yet", "-", etc.)
// to TIMESTAMP/TIMESTAMPTZ columns. Returns an ISO timestamp string or null.
export function toISOTimestampOrNull(value?: string | null): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (!s) return null;

  const lower = s.toLowerCase();
  // Common UI placeholders that should NOT be stored in DB timestamp fields.
  const PLACEHOLDERS = new Set([
    "no deadline linked yet",
    "n/a",
    "-",
    "",
    "no activity yet",
    "—",
  ]);

  if (lower === "just now") {
    return new Date().toISOString();
  }

  if (PLACEHOLDERS.has(lower)) return null;

  const parsed = Date.parse(s);
  if (!isNaN(parsed)) return new Date(parsed).toISOString();

  // Unparseable values should not be stored — return null so DB defaults or NULL is used.
  return null;
}

export default toISOTimestampOrNull;
