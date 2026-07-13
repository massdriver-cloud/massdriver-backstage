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
import type { HeaderEnvironment } from '../GraphHeader/queries';
import SelectStep from './SelectStep';
import ResultsStep from './ResultsStep';
import flattenComparison from './flattenComparison';
import {
  COMPARE_ENVIRONMENTS_QUERY,
  type CompareEnvironmentsResult,
} from './queries';

/**
 * Read-only environment comparison dialog. Two steps: pick source + target
 * (SelectStep), then view the flattened field-by-field diff (ResultsStep). No
 * mutations — the web app's URL-param state is replaced with local `useState`.
 */
export const CompareEnvironmentsDialog = ({
  open,
  onClose,
  projectName,
  environments,
  defaultSourceEnvironment,
}: {
  open: boolean;
  onClose: () => void;
  projectName?: string;
  environments: HeaderEnvironment[];
  defaultSourceEnvironment?: HeaderEnvironment | null;
}) => {
  const api = useApi(massdriverApiRef);
  const [step, setStep] = useState<'select' | 'results'>('select');
  const [source, setSource] = useState<HeaderEnvironment | null>(null);
  const [target, setTarget] = useState<HeaderEnvironment | null>(null);

  useEffect(() => {
    if (open) {
      setSource(defaultSourceEnvironment ?? null);
      setTarget(null);
      setStep('select');
    }
  }, [open, defaultSourceEnvironment]);

  const runCompare = step === 'results' && source && target;

  const { value, loading, error } = useAsync(async () => {
    if (!runCompare) return null;
    const data = (await api.query(COMPARE_ENVIRONMENTS_QUERY, {
      sourceId: source!.id,
      targetId: target!.id,
    })) as CompareEnvironmentsResult;
    return data.compareEnvironments;
  }, [api, runCompare, source?.id, target?.id]);

  const rows = useMemo(() => flattenComparison(value), [value]);

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
      <DialogTitle>Compare Environments</DialogTitle>
      <Body>
        {runCompare ? (
          loading ? (
            <Centered>
              <LoadingIndicator />
            </Centered>
          ) : error ? (
            <Centered>
              <Alert severity="error">{String(error.message ?? error)}</Alert>
            </Centered>
          ) : (
            <ResultsStep
              rows={rows}
              sourceName={value?.source?.name || source?.name}
              targetName={value?.target?.name || target?.name}
              loading={loading}
              onChangeSelection={() => setStep('select')}
            />
          )
        ) : (
          <SelectStep
            source={source}
            target={target}
            environments={environments}
            projectName={projectName}
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

export default CompareEnvironmentsDialog;

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
