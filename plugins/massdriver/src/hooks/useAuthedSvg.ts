import { useApi } from '@backstage/frontend-plugin-api';
import { useEffect, useState } from 'react';
import { massdriverApiRef } from '../api';

// Ported from apps/web/shared/hooks/useAuthedSvg.js. The web app fetches the
// SVG directly with the browser's bearer token; here the fetch goes through
// the backend content proxy (api.fetchText) since the browser holds no token.
export const useAuthedSvg = (url?: string | null) => {
  const api = useApi(massdriverApiRef);
  const [svg, setSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) {
      setSvg(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    api
      .fetchText(url)
      .then(text => {
        if (cancelled) return;
        setSvg(text);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setSvg(null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [api, url]);

  return { svg, loading };
};

export default useAuthedSvg;
