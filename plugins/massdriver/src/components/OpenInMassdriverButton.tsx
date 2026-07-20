import Button from '@massdriver/ui/Button';
import OpenInNewIcon from '@massdriver/ui/icons/OpenInNewIcon';
import { ReactNode } from 'react';

export const OpenInMassdriverButton = ({
  url,
  children = 'Open in Massdriver',
  variant = 'contained',
  size,
}: {
  url: string;
  children?: ReactNode;
  variant?: string;
  size?: string;
}) => (
  <Button
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    variant={variant}
    size={size}
    endIcon={<OpenInNewIcon fontSize="small" />}
  >
    {children}
  </Button>
);
