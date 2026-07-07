import { forwardRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';

/**
 * Adapts `@massdriver/ui` link cells (which pass an `href`) to react-router's
 * `Link` (which navigates via `to`), so DataList link columns keep the app's
 * styling while doing client-side SPA navigation instead of full reloads.
 */
export const RouterLinkAdapter = forwardRef<HTMLAnchorElement, { href?: string }>(
  ({ href, ...rest }, ref) => <RouterLink ref={ref} to={href ?? ''} {...rest} />,
);
