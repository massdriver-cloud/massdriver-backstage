import { useApi } from '@backstage/frontend-plugin-api';
import { useEffect, useState } from 'react';
import { massdriverApiRef } from '../api';

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
