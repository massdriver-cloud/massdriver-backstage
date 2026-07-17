import { useMemo } from 'react';
import { useApi } from '@backstage/frontend-plugin-api';
import useAsync from 'react-use/esm/useAsync';
import { print, type DocumentNode } from 'graphql';
import Alert from '@massdriver/ui/Alert';
import { massdriverApiRef } from '../../../api';

const useQuery = (
  document: DocumentNode,
  options: { variables?: Record<string, unknown>; skip?: boolean } = {},
) => {
  const api = useApi(massdriverApiRef);
  const query = useMemo(() => print(document), [document]);
  const variables = options.variables ?? {};
  const skip = Boolean(options.skip);
  const variablesKey = JSON.stringify(variables);

  const { value, loading, error } = useAsync(async () => {
    if (skip) return undefined;
    return (await api.query(query, variables)) as unknown;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, query, variablesKey, skip]);

  return { data: value, loading, error };
};

const ErrorDisplay = ({ error }: { error?: { message?: string } | null }) => (
  <Alert severity="error">
    {String(error?.message ?? error ?? 'Failed to load field options.')}
  </Alert>
);

export const formsDataSource = { useQuery, ErrorDisplay };

export default formsDataSource;
