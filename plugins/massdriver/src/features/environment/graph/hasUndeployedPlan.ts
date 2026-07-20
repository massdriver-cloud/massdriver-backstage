const parseMap = (value: unknown): Record<string, unknown> | null => {
  if (value == null) return null;
  if (typeof value === 'object') return value as Record<string, unknown>;
  try {
    return JSON.parse(value as string);
  } catch {
    return null;
  }
};

const stripMdMetadata = (
  params: Record<string, unknown>,
): Record<string, unknown> => {
  const { md_metadata: _mdMetadata, ...rest } = params;
  return rest;
};

const deepEqual = (left: unknown, right: unknown): boolean => {
  if (left === right) return true;
  if (
    typeof left !== 'object' ||
    typeof right !== 'object' ||
    left === null ||
    right === null
  ) {
    return false;
  }
  const leftIsArray = Array.isArray(left);
  const rightIsArray = Array.isArray(right);
  if (leftIsArray !== rightIsArray) return false;
  const leftKeys = Object.keys(left as Record<string, unknown>);
  const rightKeys = Object.keys(right as Record<string, unknown>);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every(
    key =>
      Object.prototype.hasOwnProperty.call(right, key) &&
      deepEqual(
        (left as Record<string, unknown>)[key],
        (right as Record<string, unknown>)[key],
      ),
  );
};

const hasUndeployedPlan = ({
  instanceParams,
  latestProvisionParams,
}: {
  instanceParams?: unknown;
  latestProvisionParams?: unknown;
} = {}): boolean => {
  const current = parseMap(instanceParams);
  const lastProvisioned = parseMap(latestProvisionParams);
  if (!current || !lastProvisioned) return false;
  return !deepEqual(stripMdMetadata(lastProvisioned), stripMdMetadata(current));
};

export default hasUndeployedPlan;
