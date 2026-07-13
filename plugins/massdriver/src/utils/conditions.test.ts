import { denormalizeConditionsFromWire } from './conditions';

describe('denormalizeConditionsFromWire', () => {
  it('treats null and the wildcard literal as empty', () => {
    expect(denormalizeConditionsFromWire(null)).toEqual({});
    expect(denormalizeConditionsFromWire(undefined)).toEqual({});
    expect(denormalizeConditionsFromWire('*')).toEqual({});
  });

  it('parses a JSON-encoded object string', () => {
    expect(denormalizeConditionsFromWire('{"md-env":"prod"}')).toEqual({
      'md-env': 'prod',
    });
  });

  it('falls back to empty on malformed or non-object JSON', () => {
    expect(denormalizeConditionsFromWire('not json')).toEqual({});
    expect(denormalizeConditionsFromWire('["a"]')).toEqual({});
    expect(denormalizeConditionsFromWire('"str"')).toEqual({});
  });

  it('passes plain objects through and rejects arrays', () => {
    expect(denormalizeConditionsFromWire({ team: 'core' })).toEqual({
      team: 'core',
    });
    expect(denormalizeConditionsFromWire(['team'])).toEqual({});
  });
});
