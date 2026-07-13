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

/**
 * Ready-made sidebar entry for host apps that customize their nav: the
 * Massdriver logo linking to the projects list, with a submenu mirroring the
 * Massdriver web app's sidebar (Projects / Resources / Repositories).
 *
 * Apps on the default nav don't need this — the plugin's page already
 * contributes a flat "Massdriver" nav item automatically. Apps overriding the
 * nav with `NavContentBlueprint` can render this in place of that item.
 *
 * Boot-graph constraint: this component is reachable from the package root,
 * which Backstage `require()`s eagerly at app boot — it must never import
 * `@massdriver/ui` (whose components pull the `@mui/material` barrel); see
 * `src/index.test.ts`.
 *
 * @public
 */
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
