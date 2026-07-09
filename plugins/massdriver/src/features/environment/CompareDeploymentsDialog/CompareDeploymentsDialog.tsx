import { useEffect, useMemo, useState } from 'react';
import { useApi } from '@backstage/frontend-plugin-api';
import useAsync from 'react-use/esm/useAsync';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@massdriver/ui/Dialog';
import Box from '@massdriver/ui/Box';
import Button from '@massdriver/ui/Button';
import Alert from '@massdriver/ui/Alert';
import LoadingIndicator from '@massdriver/ui/LoadingIndicator';
import stylin from '@massdriver/ui/stylin';
import { massdriverApiRef } from '../../../api';
import SelectStep from './SelectStep';
import ResultsStep from './ResultsStep';
import flattenDeploymentComparison from './flattenDeploymentComparison';
import {
  COMPARE_DEPLOYMENTS_QUERY,
  DEPLOYMENTS_BY_INSTANCE_QUERY,
  type CompareDeploymentsResult,
} from './queries';
import type { Deployment } from '../InstanceDrawer/types';

/**
 * Read-only deployment comparison dialog. Two steps: pick source + target
 * (SelectStep), then view the flattened param/version diff (ResultsStep). No
 * mutations — the web app's URL-param + infinite-scroll pickers are replaced
 * with local `useState` and a capped, in-memory deployment list.
 */
export const CompareDeploymentsDialog = ({
  open,
  onClose,
  instanceId,
}: {
  open: boolean;
  onClose: () => void;
  instanceId: string | null;
}) => {
  const api = useApi(massdriverApiRef);
  const [step, setStep] = useState<'select' | 'results'>('select');
  const [source, setSource] = useState<Deployment | null>(null);
  const [target, setTarget] = useState<Deployment | null>(null);

  useEffect(() => {
    if (open) {
      setSource(null);
      setTarget(null);
      setStep('select');
    }
  }, [open]);

  const deploymentsAsync = useAsync(async () => {
    if (!open || !instanceId) return [] as Deployment[];
    const data = (await api.query(DEPLOYMENTS_BY_INSTANCE_QUERY, {
      filter: { instanceId: { eq: instanceId } },
    })) as { deployments: { items?: (Deployment | null)[] | null } | null };
    return (data.deployments?.items ?? []).filter(Boolean) as Deployment[];
  }, [api, open, instanceId]);

  const deployments = useMemo(
    () => deploymentsAsync.value ?? [],
    [deploymentsAsync.value],
  );

  // Position numbers run oldest → newest (oldest = 1), independent of the list's
  // display order, so "#N" stays stable regardless of sort.
  const positionMap = useMemo(() => {
    const ascending = [...deployments].sort((left, right) =>
      String(left.createdAt ?? '').localeCompare(String(right.createdAt ?? '')),
    );
    const map = new Map<string, number>();
    ascending.forEach((deployment, index) => map.set(deployment.id, index + 1));
    return map;
  }, [deployments]);

  const runCompare = step === 'results' && Boolean(source) && Boolean(target);

  const compareAsync = useAsync(async () => {
    if (!runCompare) return null;
    const data = (await api.query(COMPARE_DEPLOYMENTS_QUERY, {
      sourceId: source!.id,
      targetId: target!.id,
    })) as CompareDeploymentsResult;
    return data.compareDeployments;
  }, [api, runCompare, source?.id, target?.id]);

  const rows = useMemo(
    () => flattenDeploymentComparison(compareAsync.value),
    [compareAsync.value],
  );

  const handleCompare = () => {
    if (!source || !target || source.id === target.id) return;
    setStep('results');
  };

  const handleSwap = () => {
    setSource(target);
    setTarget(source);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Compare Deployments</DialogTitle>
      <Body>
        {runCompare ? (
          compareAsync.loading ? (
            <Centered>
              <LoadingIndicator />
            </Centered>
          ) : compareAsync.error ? (
            <Centered>
              <Alert severity="error">
                {String(compareAsync.error.message ?? compareAsync.error)}
              </Alert>
            </Centered>
          ) : (
            <ResultsStep
              rows={rows}
              source={source}
              target={target}
              sourcePosition={positionMap.get(source!.id)}
              targetPosition={positionMap.get(target!.id)}
              loading={compareAsync.loading}
              onChangeSelection={() => setStep('select')}
            />
          )
        ) : deploymentsAsync.loading ? (
          <Centered>
            <LoadingIndicator />
          </Centered>
        ) : deploymentsAsync.error ? (
          <Centered>
            <Alert severity="error">
              {String(deploymentsAsync.error.message ?? deploymentsAsync.error)}
            </Alert>
          </Centered>
        ) : (
          <SelectStep
            source={source}
            target={target}
            deployments={deployments}
            positionMap={positionMap}
            onSourceChange={setSource}
            onTargetChange={setTarget}
            onSwap={handleSwap}
            onCompare={handleCompare}
          />
        )}
      </Body>
      <DialogActions>
        <Button variant="text" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompareDeploymentsDialog;

const Body = stylin(DialogContent)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: theme.spacing(60),
}));

const Centered = stylin(Box)(({ theme }: { theme: any }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(6),
}));
