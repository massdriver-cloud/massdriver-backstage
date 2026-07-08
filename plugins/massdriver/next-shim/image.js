// Stub for `next/image`. The published @massdriver/forms bundles a
// `import Image from 'next/image'` inside CredentialsDropdown/ImageWithFallback,
// which cannot resolve outside a Next.js app. This renders a plain <img> so the
// forms engine bundles and runs in Backstage. Remove once @massdriver/forms
// drops the next/image dependency (it should use a plain img / IconTile).
import React from 'react';

const Image = ({ src, alt = '', width, height, onError, style, ...rest }) =>
  React.createElement('img', { src, alt, width, height, onError, style, ...rest });

export default Image;
