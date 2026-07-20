import { forwardRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';

export const RouterLinkAdapter = forwardRef<
  HTMLAnchorElement,
  { href?: string; shallow?: boolean }
>(({ href, shallow: _shallow, ...rest }, ref) => (
  <RouterLink ref={ref} to={href ?? ''} {...rest} />
));
