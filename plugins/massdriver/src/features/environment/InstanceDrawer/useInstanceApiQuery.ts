import { useLiveRelayQuery } from '../realtime/useLiveRelayQuery';

// Thin relay-query wrapper shared by every drawer tab. Skips when there is no
// instance id yet (drawer closed / unresolved). Stays live through the
// environment's realtime revision: revision refetches keep the previous result
// rendered (no loading flash), while switching instances resets to a fresh
// loading state — see useLiveRelayQuery.
export const useInstanceApiQuery = <T>(query: string, id: string | null) =>
  useLiveRelayQuery<T>(query, id ? { id } : null);
