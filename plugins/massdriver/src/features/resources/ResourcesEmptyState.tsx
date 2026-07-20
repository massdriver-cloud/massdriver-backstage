import Box from '@massdriver/ui/Box';
import Button from '@massdriver/ui/Button';
import Typography from '@massdriver/ui/Typography';
import GitHubIcon from '@massdriver/ui/icons/GitHubIcon';
import stylin from '@massdriver/ui/stylin';
import { ReactNode } from 'react';
import { OpenInMassdriverButton } from '../../components/OpenInMassdriverButton';

const CATALOG_REPO_URL =
  'https://github.com/massdriver-cloud/massdriver-catalog';

interface StepItem {
  title: string;
  description: ReactNode;
}

const STEPS: StepItem[] = [
  {
    title: 'Clone the catalog repository',
    description:
      'This repository contains example resource type definitions and bundle schemas that you will customize for your organization.',
  },
  {
    title: 'Publish the catalog to Massdriver',
    description: (
      <>
        Use the included <code>make</code> targets or GitHub Actions to publish
        resource types and bundles to your Massdriver instance.
      </>
    ),
  },
  {
    title: 'Model your architecture in the UI',
    description:
      'Add bundles to a canvas, configure parameters, and connect resources. Changes made in the repository are reflected in the Massdriver UI as you iterate.',
  },
  {
    title: 'Implement infrastructure when ready',
    description:
      'Replace the placeholder OpenTofu/Terraform code in bundles after the model and developer experience are defined.',
  },
];

export const ResourcesEmptyState = ({ importUrl }: { importUrl?: string }) => (
  <Card>
    <Heading variant="h5">Set Up Your Massdriver Catalog</Heading>
    <Body>
      The Massdriver Catalog is where you define resource types, infrastructure
      bundles, and cloud support for your developer platform. Resources flow
      into Massdriver automatically as instances deploy, or you can import
      existing resources by hand.
    </Body>

    <Subtitle>Next Steps</Subtitle>

    <Steps>
      {STEPS.map((step, index) => (
        <Step key={step.title}>
          <StepNumber>{index + 1}</StepNumber>
          <StepBody>
            <StepTitle>{step.title}</StepTitle>
            <StepDescription>{step.description}</StepDescription>
          </StepBody>
        </Step>
      ))}
    </Steps>

    <Footnote>
      For details on structure, workflow, and customization, see the repository
      README.
    </Footnote>

    <Actions>
      <Button
        variant="contained"
        component="a"
        href={CATALOG_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        startIcon={<GitHubIcon />}
      >
        Clone the Catalog
      </Button>
      {importUrl ? (
        <OpenInMassdriverButton url={importUrl} variant="outlined">
          Import a Resource
        </OpenInMassdriverButton>
      ) : null}
    </Actions>
  </Card>
);

export default ResourcesEmptyState;

const Card = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(4),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 1,
  backgroundColor: theme.palette.background.paper,
  maxWidth: theme.spacing(96),
  marginLeft: 'auto',
  marginRight: 'auto',
  marginTop: theme.spacing(4),
}));

const Heading = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontWeight: 700,
  marginBottom: theme.spacing(1.5),
  color: theme.palette.text.primary,
}));

const Body = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: '1rem',
  marginBottom: theme.spacing(3),
  color: theme.palette.text.secondary,
  lineHeight: 1.6,
}));

const Subtitle = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: '1.125rem',
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  color: theme.palette.text.primary,
}));

const Steps = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const Step = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  alignItems: 'flex-start',
}));

const StepNumber = stylin(Box)(({ theme }: { theme: any }) => ({
  width: 24,
  height: 24,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: 600,
  flexShrink: 0,
  marginTop: '1px',
}));

const StepBody = stylin(Box)({
  flex: 1,
});

const StepTitle = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: '1rem',
  fontWeight: 600,
  marginBottom: theme.spacing(0.25),
  color: theme.palette.text.primary,
}));

const StepDescription = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: '0.875rem',
  color: theme.palette.text.secondary,
  lineHeight: 1.6,
  '& code': {
    backgroundColor: theme.palette.action.hover,
    padding: '1px 4px',
    borderRadius: '3px',
    fontSize: '0.8125rem',
    fontFamily: 'monospace',
  },
}));

const Footnote = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: '0.875rem',
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(2),
}));

const Actions = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: theme.spacing(1.5),
  flexWrap: 'wrap',
}));
