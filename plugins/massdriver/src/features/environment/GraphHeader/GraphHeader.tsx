import { useApi } from '@backstage/frontend-plugin-api';
import { useNavigate } from 'react-router-dom';
import {
  projectUrl,
} from '@massdriver-cloud/backstage-plugin-massdriver-common';
import useAsync from 'react-use/esm/useAsync';
import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import IconButton from '@massdriver/ui/IconButton';
import Tooltip from '@massdriver/ui/Tooltip';
import Divider from '@massdriver/ui/Divider';
import { MenuItem } from '@massdriver/ui/Menu';
import stylin from '@massdriver/ui/stylin';
import ChevronLeftIcon from '@massdriver/ui/icons/ChevronLeftIcon';
import AddIcon from '@massdriver/ui/icons/AddIcon';
import { massdriverApiRef } from '../../../api';
import { ForkPill } from '../../../components/ForkPill';
import { RouterLinkAdapter } from '../../../components/RouterLinkAdapter';
import { internalRoutes } from '../../../internalRoutes';
import Switcher from './Switcher';
import EnvironmentDefaults from './EnvironmentDefaults';
import HeaderActions from './HeaderActions';
import {
  HEADER_ENVIRONMENTS_QUERY,
  HEADER_PROJECTS_QUERY,
  type HeaderEnvironment,
  type HeaderEnvironmentsResult,
  type HeaderProject,
  type HeaderProjectsResult,
} from './queries';

/**
 * Read-only environment graph header: back-to-project link, project + env
 * switchers, centered environment defaults, and right-hand actions. Ports the
 * web app's `GraphHeader` layout without any mutation surface.
 */
export const GraphHeader = ({
  projectId,
  environmentId,
}: {
  projectId: string;
  environmentId: string;
}) => {
  const api = useApi(massdriverApiRef);
  const navigate = useNavigate();

  const { value } = useAsync(async () => {
    const [projectsData, environmentsData] = await Promise.all([
      api.query(HEADER_PROJECTS_QUERY) as Promise<HeaderProjectsResult>,
      api.query(HEADER_ENVIRONMENTS_QUERY, {
        filter: { projectId: { eq: projectId } },
      }) as Promise<HeaderEnvironmentsResult>,
    ]);
    return {
      projects: (projectsData.projects?.items ?? []).filter(
        Boolean,
      ) as HeaderProject[],
      environments: (environmentsData.environments?.items ?? []).filter(
        Boolean,
      ) as HeaderEnvironment[],
    };
  }, [api, projectId]);

  const projects = value?.projects ?? [];
  const environments = value?.environments ?? [];
  const project = projects.find(item => item.id === projectId) ?? null;
  const environment =
    environments.find(item => item.id === environmentId) ?? null;

  const projectName = project?.name ?? '—';
  const createEnvironmentUrl = `${projectUrl(
    api.appUrl,
    api.organizationId,
    projectId,
  )}/environments?createEnvironment=true`;

  // Switching project navigates to that project's first environment graph, or
  // its overview if it has no environments (mirrors the web app).
  const handleProjectChange = async (selectedProjectId: string) => {
    if (selectedProjectId === projectId) return;
    try {
      const data = (await api.query(HEADER_ENVIRONMENTS_QUERY, {
        filter: { projectId: { eq: selectedProjectId } },
      })) as HeaderEnvironmentsResult;
      const envs = (data.environments?.items ?? []).filter(
        Boolean,
      ) as HeaderEnvironment[];
      navigate(
        envs.length > 0
          ? internalRoutes.environment(selectedProjectId, envs[0].id)
          : internalRoutes.projectTab(selectedProjectId, 'overview'),
      );
    } catch {
      navigate(internalRoutes.projectTab(selectedProjectId, 'overview'));
    }
  };

  return (
    <HeaderRoot>
      <LeftZone>
        <Tooltip title="Back to project" arrow enterDelay={600}>
          <BackButton
            size="small"
            component={RouterLinkAdapter}
            href={internalRoutes.project(projectId)}
            aria-label="Back to project"
          >
            <ChevronLeftIcon fontSize="small" />
          </BackButton>
        </Tooltip>

        <Switcher
          ariaLabel="Switch project"
          trigger={
            <TriggerLabel variant="body2" color="text.secondary">
              {projectName}
            </TriggerLabel>
          }
        >
          {close =>
            projects.map(item => (
              <MenuItem
                key={item.id}
                selected={item.id === projectId}
                onClick={() => {
                  close();
                  handleProjectChange(item.id);
                }}
              >
                {item.name}
              </MenuItem>
            ))
          }
        </Switcher>

        <Separator>/</Separator>

        <Switcher
          ariaLabel="Switch environment"
          trigger={
            <>
              <TriggerLabel variant="body2">
                {environment ? environment.name : '—'}
              </TriggerLabel>
              {environment ? (
                <ForkPill
                  parent={environment.parent}
                  createdAt={environment.createdAt}
                />
              ) : null}
            </>
          }
        >
          {close => [
            <CreateMenuItem
              key="__create__"
              onClick={() => {
                close();
                window.open(createEnvironmentUrl, '_blank', 'noopener');
              }}
            >
              <AddIcon fontSize="small" />
              <span>Create new environment</span>
            </CreateMenuItem>,
            <Divider key="__divider__" />,
            ...environments.map(item => (
              <EnvironmentMenuItem
                key={item.id}
                selected={item.id === environmentId}
                title={item.name}
                onClick={() => {
                  close();
                  navigate(internalRoutes.environment(projectId, item.id));
                }}
              >
                <EnvironmentMenuLabel>{item.name}</EnvironmentMenuLabel>
                <ForkPill parent={item.parent} createdAt={item.createdAt} />
              </EnvironmentMenuItem>
            )),
          ]}
        </Switcher>
      </LeftZone>

      <CenterZone>
        {environment ? (
          <EnvironmentDefaults environmentId={environment.id} />
        ) : null}
      </CenterZone>

      <RightZone>
        <HeaderActions
          appUrl={api.appUrl}
          organizationId={api.organizationId}
          environment={environment}
          environments={environments}
          projectName={project?.name}
        />
      </RightZone>
    </HeaderRoot>
  );
};

export default GraphHeader;

const HeaderRoot = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: theme.spacing(6),
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(1.5),
  gap: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  flexShrink: 0,
  [theme.breakpoints.down('sm')]: {
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': { display: 'none' },
  },
}));

const LeftZone = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  minWidth: 0,
  flexShrink: 1,
  [theme.breakpoints.down('sm')]: {
    flexShrink: 0,
  },
}));

const CenterZone = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  minWidth: 0,
  [theme.breakpoints.down('sm')]: {
    flex: 'none',
  },
}));

const RightZone = stylin(Box)({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
});

const BackButton = stylin(IconButton)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
}));

const TriggerLabel = stylin(Typography)(({ theme }: { theme: any }) => ({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: theme.spacing(25),
  lineHeight: 1.4,
  [theme.breakpoints.down('md')]: {
    maxWidth: theme.spacing(15),
  },
}));

const Separator = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.disabled,
  fontSize: theme.typography.body2.fontSize,
  lineHeight: 1,
  userSelect: 'none',
}));

const CreateMenuItem = stylin(MenuItem)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  color: theme.palette.primary.main,
  fontWeight: theme.typography.fontWeightMedium,
  '& > svg': { fontSize: 18 },
}));

const EnvironmentMenuItem = stylin(MenuItem)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const EnvironmentMenuLabel = stylin('span')({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
