import { parseMap, formatAttributeValue } from './attributes';

describe('parseMap', () => {
  it('returns null for null and undefined', () => {
    expect(parseMap(null)).toBeNull();
    expect(parseMap(undefined)).toBeNull();
  });

  it('returns an object value as-is', () => {
    const value = { a: 1, b: { c: 2 } };
    expect(parseMap(value)).toBe(value);
  });

  it('parses a JSON string into an object', () => {
    expect(parseMap('{"a":1}')).toEqual({ a: 1 });
  });

  it('returns null for an unparseable string', () => {
    expect(parseMap('{not json')).toBeNull();
  });

  it('returns null for non-string, non-object scalars', () => {
    expect(parseMap(42)).toBeNull();
    expect(parseMap(true)).toBeNull();
  });
});

describe('formatAttributeValue', () => {
  it('renders the wildcard as "any"', () => {
    expect(formatAttributeValue('*')).toBe('any');
  });

  it('renders an empty array as "any"', () => {
    expect(formatAttributeValue([])).toBe('any');
  });

  it('joins array members with commas', () => {
    expect(formatAttributeValue(['a', 'b', 'c'])).toBe('a, b, c');
  });

  it('stringifies scalar values', () => {
    expect(formatAttributeValue(42)).toBe('42');
    expect(formatAttributeValue(false)).toBe('false');
    expect(formatAttributeValue('plain')).toBe('plain');
  });
});
