import SvgIcon, { SvgIconProps } from '@material-ui/core/SvgIcon';

// Local copy of @mui/icons-material FolderOutlined (what
// @massdriver/ui/icons/FolderOutlinedIcon re-exports), rendered with MUI v4
// SvgIcon so the eagerly-required package root never evaluates @mui/material.
// See BundleIcon.tsx for the full rationale.
export const FolderOutlinedIcon = (props: SvgIconProps) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="m9.17 6 2 2H20v10H4V6zM10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8z" />
  </SvgIcon>
);
