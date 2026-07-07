import { forwardRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';

/**
 * Adapts `@massdriver/ui` link cells (which pass an `href`) to react-router's
 * `Link` (which navigates via `to`), so DataList link columns keep the app's
 * styling while doing client-side SPA navigation instead of full reloads.
 */
export const RouterLinkAdapter = forwardRef<
  HTMLAnchorElement,
  { href?: string; shallow?: boolean }
>(({ href, shallow: _shallow, ...rest }, ref) => (
  // `shallow` is a Next-ism forwarded by PageTabs; drop it so it doesn't land
  // on the DOM anchor.
  <RouterLink ref={ref} to={href ?? ''} {...rest} />
));
