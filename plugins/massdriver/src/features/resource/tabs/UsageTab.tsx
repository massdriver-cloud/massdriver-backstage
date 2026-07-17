import Box from '@massdriver/ui/Box';
import ToggleButton from '@massdriver/ui/ToggleButton';
import ToggleButtonGroup from '@massdriver/ui/ToggleButtonGroup';
import Tooltip from '@massdriver/ui/Tooltip';
import InfoOutlinedIcon from '@massdriver/ui/icons/InfoOutlinedIcon';
import stylin from '@massdriver/ui/stylin';
import { useState } from 'react';
import { SettingsTabLayout } from './SettingsTabLayout';
import { TabHeader } from './TabHeader';
import { UsagePanel } from './UsagePanel';
import {
  USAGE_TYPE_CONFIG,
  USAGE_TYPE_ORDER,
  UsageType,
} from './UsageTab.helpers';

const TOOLTIP_SLOT_PROPS = {
  tooltip: { sx: { maxWidth: 320, px: 1.25, py: 1 } },
};

export const UsageTab = ({
  resourceId,
  resourceOrigin,
}: {
  resourceId: string;
  resourceOrigin?: string | null;
}) => {
  const isImported = resourceOrigin === 'IMPORTED';
  const types = isImported
    ? USAGE_TYPE_ORDER.filter(type => type !== 'connection')
    : USAGE_TYPE_ORDER;

  const [activeType, setActiveType] = useState<UsageType>(USAGE_TYPE_ORDER[0]);
  const effectiveType = types.includes(activeType) ? activeType : types[0];
  const activeInfo = USAGE_TYPE_CONFIG[effectiveType].info;

  const handleTypeChange = (value: UsageType | null) => {
    if (value && value !== effectiveType) setActiveType(value);
  };

  return (
    <SettingsTabLayout>
      <TabHeader
        title="Usage"
        description="Places where this resource is currently being consumed."
      />
      <FilterBar>
        <ToggleButtonGroup
          value={effectiveType}
          onChange={(_event: unknown, value: UsageType | null) =>
            handleTypeChange(value)
          }
          exclusive
          size="small"
          aria-label="Usage type"
        >
          {types.map(type => (
            <ToggleButton key={type} value={type}>
              {USAGE_TYPE_CONFIG[type].label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Tooltip
          arrow
          enterDelay={200}
          slotProps={TOOLTIP_SLOT_PROPS}
          title={<TooltipText>{activeInfo}</TooltipText>}
        >
          <InfoIconWrapper aria-label="About this usage type">
            <InfoOutlinedIcon fontSize="inherit" />
          </InfoIconWrapper>
        </Tooltip>
      </FilterBar>
      <UsagePanel
        key={effectiveType}
        type={effectiveType}
        resourceId={resourceId}
      />
    </SettingsTabLayout>
  );
};

const FilterBar = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const InfoIconWrapper = stylin('span')(({ theme }: { theme: any }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  color: theme.palette.text.disabled,
  fontSize: theme.typography.pxToRem(18),
  '&:hover': {
    color: theme.palette.text.secondary,
  },
}));

const TooltipText = stylin('span')(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  lineHeight: 1.4,
}));
