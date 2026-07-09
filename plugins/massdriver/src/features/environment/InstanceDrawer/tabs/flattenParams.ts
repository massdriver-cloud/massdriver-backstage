// Walks a JSON object/array recursively and yields one row per leaf value.
// Leaf rows have jq-style paths (e.g. `.database.port`, `.containers[0].image`)
// — the same convention `compareDeployments` uses for `ParamComparison.path`,
// keeping the detail panel's display consistent with the diff dialog. Ported
// verbatim from the web app's ViewDeploymentDetailsDialog/flattenParams.js.
export interface ParamRow {
  id: string;
  path: string;
  value: unknown;
}

const flattenParams = (params: unknown, basePath = ''): ParamRow[] => {
  if (basePath === '' && params == null) return [];
  if (params === null || typeof params !== 'object') {
    return [{ id: basePath || '$', path: basePath || '$', value: params }];
  }
  if (Array.isArray(params)) {
    if (params.length === 0) {
      return [{ id: basePath || '$', path: basePath || '$', value: [] }];
    }
    return params.flatMap((item, index) =>
      flattenParams(item, `${basePath}[${index}]`),
    );
  }
  const record = params as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length === 0) {
    return [{ id: basePath || '$', path: basePath || '$', value: {} }];
  }
  return keys.flatMap(key => flattenParams(record[key], `${basePath}.${key}`));
};

export default flattenParams;
