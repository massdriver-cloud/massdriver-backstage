import { useApi } from '@backstage/frontend-plugin-api';
import useAsync from 'react-use/esm/useAsync';
import { massdriverApiRef } from '../../../api';

// Thin `useAsync` + relay-query wrapper shared by every drawer tab. Returns
// null when there is no instance id yet (drawer closed / unresolved). Uses the
// `(await api.query(q, v)) as T` cast form — never `api.query<T>()` (TS7022).
export const useInstanceApiQuery = <T,>(query: string, id: string | null) => {
  const api = useApi(massdriverApiRef);
  return useAsync(async () => {
    if (!id) return null;
    return (await api.query(query, { id })) as T;
  }, [api, id, query]);
};
