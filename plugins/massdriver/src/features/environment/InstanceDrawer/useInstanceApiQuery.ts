import { useLiveRelayQuery } from '../realtime/useLiveRelayQuery';

export const useInstanceApiQuery = <T>(query: string, id: string | null) =>
  useLiveRelayQuery<T>(query, id ? { id } : null);
