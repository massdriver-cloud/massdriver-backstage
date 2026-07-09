import { useState } from 'react';
import Box from '@massdriver/ui/Box';
import Tabs from '@massdriver/ui/Tabs';
import Tab from '@massdriver/ui/Tab';
import IconButton from '@massdriver/ui/IconButton';
import Menu, { MenuItem } from '@massdriver/ui/Menu';
import MoreHorizIcon from '@massdriver/ui/icons/MoreHorizIcon';
import stylin from '@massdriver/ui/stylin';
import { useOverflowMeasure } from './useOverflowMeasure';

const MORE_BUTTON_WIDTH = 48;
const MIN_VISIBLE = 5;

interface TabDef {
  id: string;
  label: string;
}

/**
 * Instance drawer tab bar. Ported from the web app's `InstanceTabs`: the
 * `@massdriver/ui` `Tabs`/`Tab` are custom (selection flows via context, the
 * change handler is an `onClick` per tab — not MUI's `onChange`). Overflowing
 * tabs collapse into a "more" menu.
 */
export const InstanceTabs = ({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: TabDef[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { containerRef, visibleCount, measured } = useOverflowMeasure({
    itemCount: tabs.length,
    minVisible: MIN_VISIBLE,
    moreButtonWidth: MORE_BUTTON_WIDTH,
  });

  const visibleTabs = tabs.slice(0, visibleCount);
  const overflowTabs = tabs.slice(visibleCount);
  const hasOverflow = overflowTabs.length > 0;
  const overflowSelected = overflowTabs.some(tab => tab.id === activeTab);

  return (
    <TabContainer ref={containerRef}>
      <TabsWrapper>
        <StyledTabs value={overflowSelected ? false : activeTab}>
          {visibleTabs.map(tab => (
            <StyledTab
              key={tab.id}
              label={tab.label}
              value={tab.id}
              onClick={() => onTabChange(tab.id)}
              measured={measured}
            />
          ))}
        </StyledTabs>
      </TabsWrapper>
      {hasOverflow ? (
        <>
          <MoreButton
            size="small"
            onClick={(event: any) => setAnchorEl(event.currentTarget)}
            aria-label="more tabs"
            selected={overflowSelected}
          >
            <MoreHorizIcon fontSize="small" />
          </MoreButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            {overflowTabs.map(tab => (
              <MenuItem
                key={tab.id}
                selected={tab.id === activeTab}
                onClick={() => {
                  onTabChange(tab.id);
                  setAnchorEl(null);
                }}
              >
                {tab.label}
              </MenuItem>
            ))}
          </Menu>
        </>
      ) : null}
    </TabContainer>
  );
};

export default InstanceTabs;

const TabContainer = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const TabsWrapper = stylin(Box)({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
});

const StyledTabs = stylin(Tabs)({
  width: '100%',
});

const StyledTab = stylin(Tab, ['measured'])(
  ({ measured }: { measured: boolean }) => ({
    ...(measured && { flex: 1 }),
  }),
);

const MoreButton = stylin(IconButton, ['selected'])(
  ({ theme, selected }: { theme: any; selected: boolean }) => ({
    flexShrink: 0,
    borderRadius: 0,
    height: '100%',
    width: MORE_BUTTON_WIDTH,
    position: 'relative',
    color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    ...(selected && {
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: theme.palette.primary.main,
      },
    }),
  }),
);
