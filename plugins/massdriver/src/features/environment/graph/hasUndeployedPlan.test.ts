import hasUndeployedPlan from './hasUndeployedPlan';

describe('hasUndeployedPlan', () => {
  it('returns false when called with no arguments', () => {
    expect(hasUndeployedPlan()).toBe(false);
  });

  it('returns false when either side is missing', () => {
    expect(
      hasUndeployedPlan({
        instanceParams: { a: 1 },
        latestProvisionParams: null,
      }),
    ).toBe(false);
    expect(
      hasUndeployedPlan({
        instanceParams: null,
        latestProvisionParams: { a: 1 },
      }),
    ).toBe(false);
  });

  it('returns false when params are deeply equal', () => {
    expect(
      hasUndeployedPlan({
        instanceParams: { a: 1, nested: { b: [1, 2] } },
        latestProvisionParams: { a: 1, nested: { b: [1, 2] } },
      }),
    ).toBe(false);
  });

  it('returns true when a value differs', () => {
    expect(
      hasUndeployedPlan({
        instanceParams: { a: 2 },
        latestProvisionParams: { a: 1 },
      }),
    ).toBe(true);
  });

  it('returns true when key counts differ', () => {
    expect(
      hasUndeployedPlan({
        instanceParams: { a: 1, b: 2 },
        latestProvisionParams: { a: 1 },
      }),
    ).toBe(true);
  });

  it('ignores md_metadata differences on both sides', () => {
    expect(
      hasUndeployedPlan({
        instanceParams: { a: 1, md_metadata: { deployedBy: 'ci' } },
        latestProvisionParams: { a: 1, md_metadata: { deployedBy: 'human' } },
      }),
    ).toBe(false);
  });

  it('parses JSON string params before comparing', () => {
    expect(
      hasUndeployedPlan({
        instanceParams: '{"a":1}',
        latestProvisionParams: '{"a":2}',
      }),
    ).toBe(true);
    expect(
      hasUndeployedPlan({
        instanceParams: '{"a":1}',
        latestProvisionParams: '{"a":1}',
      }),
    ).toBe(false);
  });

  it('treats arrays of differing length or order as unequal', () => {
    expect(
      hasUndeployedPlan({
        instanceParams: { list: [1, 2, 3] },
        latestProvisionParams: { list: [1, 2] },
      }),
    ).toBe(true);
    expect(
      hasUndeployedPlan({
        instanceParams: { list: [2, 1] },
        latestProvisionParams: { list: [1, 2] },
      }),
    ).toBe(true);
  });
});
