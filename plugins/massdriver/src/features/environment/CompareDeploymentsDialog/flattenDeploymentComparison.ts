import {
  computeStatus,
  VERSION_PATH,
  type ComparisonSide,
  type ComparisonStatus,
} from '../CompareEnvironmentsDialog/flattenComparison';

// Deployment comparison rows are un-grouped (no component dimension): a single
// version row plus one row per param. Ported from the web app's
// flattenDeploymentComparison.js. `computeStatus` / `VERSION_PATH` are reused
// unchanged from the environment-compare flatten module.
export interface DeploymentComparisonRow {
  id: string;
  kind: 'version' | 'param';
  path: string;
  source: ComparisonSide;
  target: ComparisonSide;
  sourceValue: string | null;
  targetValue: string | null;
  equal: boolean;
  status: ComparisonStatus;
}

interface DeploymentCompareParam {
  path: string;
  equal?: boolean | null;
  source?: ComparisonSide | null;
  target?: ComparisonSide | null;
}

export interface DeploymentComparison {
  source?: Record<string, unknown> | null;
  target?: Record<string, unknown> | null;
  version?: {
    source?: string | null;
    target?: string | null;
    equal?: boolean | null;
  } | null;
  params?: (DeploymentCompareParam | null)[] | null;
}

const sideToString = (side: ComparisonSide): string | null => {
  if (!side?.present) return null;
  const value = side.value;
  if (value == null) return 'null';
  return typeof value === 'string' ? value : JSON.stringify(value);
};

const flattenDeploymentComparison = (
  comparison?: DeploymentComparison | null,
): DeploymentComparisonRow[] => {
  if (!comparison) return [];

  const version = comparison.version;
  const params = (comparison.params ?? []).filter(
    Boolean,
  ) as DeploymentCompareParam[];

  const versionSource: ComparisonSide = {
    present: version?.source != null,
    value: version?.source ?? null,
  };
  const versionTarget: ComparisonSide = {
    present: version?.target != null,
    value: version?.target ?? null,
  };

  const versionRow: DeploymentComparisonRow = {
    id: '__version__',
    kind: 'version',
    path: VERSION_PATH,
    source: versionSource,
    target: versionTarget,
    sourceValue: sideToString(versionSource),
    targetValue: sideToString(versionTarget),
    equal: version?.equal ?? false,
    status: computeStatus({
      equal: version?.equal,
      source: versionSource,
      target: versionTarget,
    }),
  };

  const paramRows: DeploymentComparisonRow[] = params.map(param => {
    const source: ComparisonSide = param.source ?? { present: false };
    const target: ComparisonSide = param.target ?? { present: false };
    return {
      id: param.path,
      kind: 'param' as const,
      path: param.path,
      source,
      target,
      sourceValue: sideToString(source),
      targetValue: sideToString(target),
      equal: param.equal ?? false,
      status: computeStatus({ equal: param.equal, source, target }),
    };
  });

  return [versionRow, ...paramRows];
};

export default flattenDeploymentComparison;
