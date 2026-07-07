import { useRef, useState } from 'react';
import { useApi } from '@backstage/frontend-plugin-api';
import useAsync from 'react-use/esm/useAsync';
import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import Tooltip from '@massdriver/ui/Tooltip';
import AvatarGroup from '@massdriver/ui/AvatarGroup';
import IconTile from '@massdriver/ui/IconTile';
import Menu, { MenuItem } from '@massdriver/ui/Menu';
import stylin from '@massdriver/ui/stylin';
import ExtensionIcon from '@massdriver/ui/icons/ExtensionIcon';
import ArrowDropDownIcon from '@massdriver/ui/icons/ArrowDropDownIcon';
import { massdriverApiRef } from '../../../api';
import {
  ENVIRONMENT_DEFAULTS_QUERY,
  type EnvironmentDefaultItem,
  type EnvironmentDefaultsResult,
} from './queries';

const MAX_COLLAPSED = 3;
const TOOLTIP_SLOT_PROPS = {
  tooltip: { sx: { maxWidth: 280, px: 1.25, py: 1 } },
};

const ResourceTooltipRow = ({ item }: { item: EnvironmentDefaultItem }) => (
  <TooltipRow>
    <IconTile
      src={item.resource.resourceType.icon}
      alt={item.resource.resourceType.name}
      size="small"
      variant="circular"
      fallback={<FallbackIcon />}
    />
    <TooltipRowInfo>
      <TooltipRowName title={item.resource.name}>
        {item.resource.name}
      </TooltipRowName>
      <TooltipRowType title={item.resource.resourceType.name}>
        {item.resource.resourceType.name}
      </TooltipRowType>
    </TooltipRowInfo>
  </TooltipRow>
);

/**
 * Read-only environment defaults: an avatar group of resource-type icons that
 * opens a menu listing each default. All edit/remove/select actions from the
 * web app are dropped — this is display-only.
 */
export const EnvironmentDefaults = ({
  environmentId,
}: {
  environmentId: string;
}) => {
  const api = useApi(massdriverApiRef);
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const { value } = useAsync(async () => {
    if (!environmentId) return [] as EnvironmentDefaultItem[];
    const data = (await api.query(ENVIRONMENT_DEFAULTS_QUERY, {
      environmentId,
    })) as EnvironmentDefaultsResult;
    return (data.environment?.defaults?.items ?? []).filter(
      Boolean,
    ) as EnvironmentDefaultItem[];
  }, [api, environmentId]);

  const defaults = value ?? [];

  if (defaults.length === 0) return null;

  const closeMenu = () => setMenuOpen(false);

  return (
    <Root ref={rootRef}>
      <AvatarGroup
        max={MAX_COLLAPSED}
        onClick={() => setMenuOpen(true)}
        size={26}
        endAdornment={<DropdownIcon />}
        renderSurplus={(count: number) => (
          <Tooltip
            arrow
            enterDelay={300}
            slotProps={TOOLTIP_SLOT_PROPS}
            title={
              <SurplusTooltipList>
                {defaults.slice(MAX_COLLAPSED).map(item => (
                  <ResourceTooltipRow key={item.id} item={item} />
                ))}
              </SurplusTooltipList>
            }
          >
            <SurplusAvatar>+{count}</SurplusAvatar>
          </Tooltip>
        )}
      >
        {defaults.map(item => (
          <Tooltip
            key={item.id}
            arrow
            enterDelay={300}
            slotProps={TOOLTIP_SLOT_PROPS}
            title={<ResourceTooltipRow item={item} />}
          >
            <TooltipChild>
              <IconTile
                src={item.resource.resourceType.icon}
                alt={item.resource.resourceType.name}
                size={26}
                variant="circular"
                fallback={<FallbackIcon />}
              />
            </TooltipChild>
          </Tooltip>
        ))}
      </AvatarGroup>

      <Menu
        anchorEl={rootRef.current}
        open={menuOpen && !!rootRef.current}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        MenuListProps={{ sx: { py: 0.5 } }}
        slotProps={{ paper: { sx: { maxWidth: 320 } } }}
      >
        <ListHeader>
          <HeaderLabel>Environment Defaults</HeaderLabel>
        </ListHeader>
        {defaults.map(item => (
          <DefaultItem key={item.id} disableRipple>
            <IconTile
              src={item.resource.resourceType.icon}
              alt={item.resource.resourceType.name}
              size="medium"
              fallback={<FallbackIcon />}
            />
            <ItemInfo>
              <ItemName title={item.resource.name}>
                {item.resource.name}
              </ItemName>
              <ItemType title={item.resource.resourceType.name}>
                {item.resource.resourceType.name}
              </ItemType>
            </ItemInfo>
          </DefaultItem>
        ))}
      </Menu>
    </Root>
  );
};

export default EnvironmentDefaults;

const Root = stylin(Box)({
  display: 'flex',
  alignItems: 'center',
  minWidth: 0,
  maxWidth: '100%',
});

const DropdownIcon = stylin(ArrowDropDownIcon)(({ theme }: { theme: any }) => ({
  fontSize: 16,
  color: theme.palette.text.disabled,
  marginLeft: theme.spacing(0.25),
  flexShrink: 0,
}));

const FallbackIcon = stylin(ExtensionIcon)({ fontSize: 16 });

const ListHeader = stylin('div')(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: `${theme.spacing(0.75)} ${theme.spacing(2)}`,
}));

const HeaderLabel = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  fontWeight: 600,
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

const DefaultItem = stylin(MenuItem)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  cursor: 'default',
}));

const ItemInfo = stylin('div')({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  flex: 1,
});

const ItemName = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(13),
  fontWeight: 500,
  color: theme.palette.text.primary,
  lineHeight: 1.4,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const ItemType = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  color: theme.palette.text.secondary,
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const TooltipChild = stylin('span')({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const SurplusAvatar = stylin('span')(({ theme }: { theme: any }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 26,
  height: 26,
  borderRadius: '50%',
  fontSize: 10,
  fontWeight: 600,
  color: theme.palette.text.secondary,
  backgroundColor: theme.palette.grey[100],
  border: `2px solid ${theme.palette.background.paper}`,
  boxShadow: `0 0 0 1px ${theme.palette.divider}`,
  position: 'relative',
  flexShrink: 0,
  zIndex: 0,
}));

const TooltipRow = stylin('span')(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  minWidth: 0,
  width: '100%',
}));

const TooltipRowInfo = stylin('span')({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  flex: 1,
});

const TooltipRowName = stylin('span')(({ theme }: { theme: any }) => ({
  display: 'block',
  fontSize: theme.typography.pxToRem(12),
  fontWeight: 600,
  lineHeight: 1.35,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const TooltipRowType = stylin('span')(({ theme }: { theme: any }) => ({
  display: 'block',
  fontSize: theme.typography.pxToRem(11),
  opacity: 0.7,
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const SurplusTooltipList = stylin('span')(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.25),
}));
