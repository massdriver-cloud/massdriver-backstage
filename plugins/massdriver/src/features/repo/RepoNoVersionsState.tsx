import Button from '@massdriver/ui/Button';
import RocketLaunchOutlinedIcon from '@massdriver/ui/icons/RocketLaunchOutlinedIcon';
import { RepoEmptyState } from './RepoEmptyState';

// Ported from the Massdriver web app — the same
// empty state (via the shared RepoEmptyState), copy, and publishing-docs link.
const PUBLISH_DOCS_URL =
  'https://docs.massdriver.cloud/bundle-development/publishing/versioning';

export const RepoNoVersionsState = ({
  tabLabel = 'content',
}: {
  tabLabel?: string;
}) => (
  <RepoEmptyState
    icon={<RocketLaunchOutlinedIcon />}
    title="No versions yet"
    description={`Publish your first version to see ${tabLabel} here.`}
    action={
      <Button
        href={PUBLISH_DOCS_URL}
        target="_blank"
        rel="noopener noreferrer"
        variant="outlined"
      >
        View publishing docs
      </Button>
    }
  />
);

export default RepoNoVersionsState;
