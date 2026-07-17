// Ported from the Massdriver web app (read path only — the
// normalize-for-wire half backs mutation forms the read-only plugin doesn't
// have).

/**
 * Grant conditions come back from the API as either the literal `"*"` or a
 * JSON-encoded object string. Coerce both forms (and any defensive edge cases)
 * into the plain-object shape the cell components expect.
 */
export const denormalizeConditionsFromWire = (
  conditions: unknown,
): Record<string, unknown> => {
  if (!conditions || conditions === '*') return {};
  if (typeof conditions === 'string') {
    try {
      const parsed = JSON.parse(conditions);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // fall through to {}
    }
    return {};
  }
  if (typeof conditions === 'object' && !Array.isArray(conditions)) {
    return conditions as Record<string, unknown>;
  }
  return {};
};
