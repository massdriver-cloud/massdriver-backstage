import IconTile from '@massdriver/ui/IconTile';
import { ReactNode } from 'react';
import useAuthedSvg from '../hooks/useAuthedSvg';

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
