import IconTile from '@massdriver/ui/IconTile';
import { ReactNode } from 'react';
import useAuthedSvg from '../hooks/useAuthedSvg';

// Ported from apps/web/shared/components/AuthedIcon.js — renders an
// auth-guarded SVG (e.g. an OCI repo's brand icon) in an IconTile, falling
// back while loading or when the fetch fails.
export const AuthedIcon = ({
  url,
  alt,
  size = 'small',
  variant,
  fallback,
}: {
  url?: string | null;
  alt?: string;
  size?: string;
  variant?: string;
  fallback?: ReactNode;
}) => {
  const { svg } = useAuthedSvg(url);

  return (
    <IconTile
      svg={svg}
      alt={alt}
      size={size}
      variant={variant}
      fallback={fallback}
    />
  );
};

export default AuthedIcon;
