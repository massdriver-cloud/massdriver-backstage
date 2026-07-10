import {
  Sidebar,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarScrollWrapper,
  SidebarSpace,
  SidebarSubmenu,
  SidebarSubmenuItem,
} from '@backstage/core-components';
import { NavContentBlueprint } from '@backstage/plugin-app-react';
import { SidebarLogo } from './SidebarLogo';
// Same icons the Massdriver web app's sidebar uses for these entries.
import BundleIcon from '@massdriver/ui/icons/BundleIcon';
import FolderOutlinedIcon from '@massdriver/ui/icons/FolderOutlinedIcon';
import TokenIcon from '@massdriver/ui/icons/TokenIcon';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import { SidebarSearchModal } from '@backstage/plugin-search';
import { UserSettingsSignInAvatar } from '@backstage/plugin-user-settings';
import { NotificationsSidebarItem } from '@backstage/plugin-notifications';

export const SidebarContent = NavContentBlueprint.make({
  params: {
    component: ({ navItems }) => {
      const nav = navItems.withComponent(item =>
        item.href?.startsWith('/massdriver') ? (
          <SidebarItem
            icon={() => item.icon}
            to="/massdriver/projects"
            text={item.title}
          >
            <SidebarSubmenu title={item.title}>
              <SidebarSubmenuItem
                title="Projects"
                to="/massdriver/projects"
                icon={FolderOutlinedIcon}
              />
              <SidebarSubmenuItem
                title="Resources"
                to="/massdriver/resources"
                icon={TokenIcon}
              />
              <SidebarSubmenuItem
                title="Repositories"
                to="/massdriver/repositories"
                icon={BundleIcon}
              />
            </SidebarSubmenu>
          </SidebarItem>
        ) : (
          <SidebarItem icon={() => item.icon} to={item.href} text={item.title} />
        ),
      );

      // Skipped items
      nav.take('page:search'); // Using search modal instead

      return (
        <Sidebar>
          <SidebarLogo />
          <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
            <SidebarSearchModal />
          </SidebarGroup>
          <SidebarDivider />
          <SidebarGroup label="Menu" icon={<MenuIcon />}>
            {nav.take('page:catalog')}
            {nav.take('page:scaffolder')}
            <SidebarDivider />
            <SidebarScrollWrapper>
              {nav.rest({ sortBy: 'title' })}
            </SidebarScrollWrapper>
          </SidebarGroup>
          <SidebarSpace />
          <SidebarDivider />
          <NotificationsSidebarItem />
          <SidebarDivider />
          <SidebarGroup
            label="Settings"
            icon={<UserSettingsSignInAvatar />}
            to="/settings"
          >
            {nav.take('page:app-visualizer')}
            {nav.take('page:user-settings')}
          </SidebarGroup>
        </Sidebar>
      );
    },
  },
});
