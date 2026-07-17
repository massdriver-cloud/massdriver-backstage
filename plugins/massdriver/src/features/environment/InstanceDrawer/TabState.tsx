import { ReactNode } from 'react';
import Box from '@massdriver/ui/Box';
import Alert from '@massdriver/ui/Alert';
import LoadingIndicator from '@massdriver/ui/LoadingIndicator';
import stylin from '@massdriver/ui/stylin';

export const TabState = ({
  loading,
  error,
  children,
}: {
  loading: boolean;
  error?: Error | null;
  children: ReactNode;
}) => {
  if (loading) {
    return (
      <Centered>
        <LoadingIndicator />
      </Centered>
    );
  }
  if (error) {
    return (
      <Padded>
        <Alert severity="error">{String(error.message ?? error)}</Alert>
      </Padded>
    );
  }
  return <>{children}</>;
};

const Centered = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  justifyContent: 'center',
  padding: theme.spacing(6),
}));

const Padded = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(2),
}));
