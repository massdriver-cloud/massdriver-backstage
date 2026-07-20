import {
  SidebarItem,
  SidebarSubmenu,
  SidebarSubmenuItem,
} from '@backstage/core-components';
import { internalRoutes } from '../internalRoutes';
import { MassdriverIcon } from './MassdriverIcon';
import { BundleIcon } from './icons/BundleIcon';
import { FolderOutlinedIcon } from './icons/FolderOutlinedIcon';
import { TokenIcon } from './icons/TokenIcon';

/** @public */
export const MassdriverSidebarItem = () => (
  <SidebarItem
    icon={MassdriverIcon}
    to={internalRoutes.projects()}
    text="Massdriver"
  >
    <SidebarSubmenu title="Massdriver">
      <SidebarSubmenuItem
        title="Projects"
        to={internalRoutes.projects()}
        icon={FolderOutlinedIcon}
      />
      <SidebarSubmenuItem
        title="Resources"
        to={internalRoutes.resources()}
        icon={TokenIcon}
      />
      <SidebarSubmenuItem
        title="Repositories"
        to={internalRoutes.repositories()}
        icon={BundleIcon}
      />
    </SidebarSubmenu>
  </SidebarItem>
);
