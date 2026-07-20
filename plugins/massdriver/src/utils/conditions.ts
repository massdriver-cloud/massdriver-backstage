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
      // ignore
    }
    return {};
  }
  if (typeof conditions === 'object' && !Array.isArray(conditions)) {
    return conditions as Record<string, unknown>;
  }
  return {};
};
