/** Parse a Massdriver `Map` scalar (object or JSON string) into an object. */
export const parseMap = (
  value: unknown,
): Record<string, unknown> | null => {
  if (value == null) {
    return null;
  }
  if (typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return null;
};

/** Format an attribute value for display (mirrors the web app). */
export const formatAttributeValue = (value: unknown): string => {
  if (value === '*') {
    return 'any';
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? 'any' : value.join(', ');
  }
  return String(value);
};
