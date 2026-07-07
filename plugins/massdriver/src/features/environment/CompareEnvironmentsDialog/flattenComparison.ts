export const VERSION_PATH = '__version__';

export type ComparisonStatus =
  | 'equal'
  | 'different'
  | 'sourceOnly'
  | 'targetOnly';

export interface ComparisonSide {
  present: boolean;
  value?: unknown;
}

export interface ComparisonRow {
  id: string;
  kind: 'version' | 'param';
  component: { id: string; name: string };
  componentName: string;
  path: string;
  source: ComparisonSide;
  target: ComparisonSide;
  sourceValue: string | null;
  targetValue: string | null;
  equal: boolean;
  status: ComparisonStatus;
}

interface CompareParam {
  path: string;
  equal?: boolean | null;
  source?: ComparisonSide | null;
  target?: ComparisonSide | null;
}

export interface CompareInstance {
  component: { id: string; name: string };
  version?: {
    source?: string | null;
    target?: string | null;
    equal?: boolean | null;
  } | null;
  params?: (CompareParam | null)[] | null;
  equal?: boolean | null;
}

export interface Comparison {
  source?: { id: string; name?: string } | null;
  target?: { id: string; name?: string } | null;
  instances?: (CompareInstance | null)[] | null;
}

export const computeStatus = ({
  equal,
  source,
  target,
}: {
  equal?: boolean | null;
  source: ComparisonSide;
  target: ComparisonSide;
}): ComparisonStatus => {
  if (equal === true) return 'equal';
  if (!source?.present) return 'targetOnly';
  if (!target?.present) return 'sourceOnly';
  return 'different';
};

const sideToString = (side: ComparisonSide): string | null => {
  if (!side?.present) return null;
  const value = side.value;
  if (value == null) return 'null';
  return typeof value === 'string' ? value : JSON.stringify(value);
};

export const flattenComparison = (
  comparison?: Comparison | null,
): ComparisonRow[] => {
  if (!comparison?.instances) return [];

  return comparison.instances.filter(Boolean).flatMap(instance => {
    const { component, version, params } = instance as CompareInstance;

    const versionSource: ComparisonSide = {
      present: version?.source != null,
      value: version?.source ?? null,
    };
    const versionTarget: ComparisonSide = {
      present: version?.target != null,
      value: version?.target ?? null,
    };
    const versionRow: ComparisonRow = {
      id: `${component.id}::version`,
      kind: 'version',
      component,
      componentName: component.name,
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

    const paramRows: ComparisonRow[] = (params ?? [])
      .filter(Boolean)
      .map(rawParam => {
        const param = rawParam as CompareParam;
        const source: ComparisonSide = param.source ?? { present: false };
        const target: ComparisonSide = param.target ?? { present: false };
        return {
          id: `${component.id}::${param.path}`,
          kind: 'param' as const,
          component,
          componentName: component.name,
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
  });
};

export default flattenComparison;
