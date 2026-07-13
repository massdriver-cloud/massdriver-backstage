import { useMemo, useState } from 'react';
import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import ChevronRightIcon from '@massdriver/ui/icons/ChevronRightIcon';
import ExpandMoreIcon from '@massdriver/ui/icons/ExpandMoreIcon';
import FolderOutlinedIcon from '@massdriver/ui/icons/FolderOutlinedIcon';
import InsertDriveFileOutlinedIcon from '@massdriver/ui/icons/InsertDriveFileOutlinedIcon';
import stylin from '@massdriver/ui/stylin';
import { ancestorPaths, buildFileTree, TreeNode } from './fileTreeHelpers';
import type { RepoFile } from './types';

// Ported from apps/web/features/repos/components/FileTree/FileTree.js.
export const FileTree = ({
  files,
  selectedPath,
  onSelectPath,
}: {
  files: RepoFile[];
  selectedPath: string;
  onSelectPath: (path: string) => void;
}) => {
  const tree = useMemo(() => buildFileTree(files), [files]);
  const initialExpanded = useMemo(
    () => ancestorPaths(selectedPath),
    [selectedPath],
  );
  const [expanded, setExpanded] = useState(initialExpanded);

  const toggleFolder = (path: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const isEmpty = tree.folders.length === 0 && tree.files.length === 0;

  return (
    <Root>
      {isEmpty ? (
        <EmptyMessage variant="caption">No files</EmptyMessage>
      ) : (
        <TreeList>
          <FolderChildren
            node={tree}
            depth={0}
            expanded={expanded}
            onToggle={toggleFolder}
            selectedPath={selectedPath}
            onSelectPath={onSelectPath}
          />
        </TreeList>
      )}
    </Root>
  );
};

const FolderChildren = ({
  node,
  depth,
  expanded,
  onToggle,
  selectedPath,
  onSelectPath,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  selectedPath: string;
  onSelectPath: (path: string) => void;
}) => (
  <>
    {node.folders.map(folder => {
      const isOpen = expanded.has(folder.path);
      return (
        <Box key={`folder:${folder.path}`}>
          <Row
            type="button"
            depth={depth}
            onClick={() => onToggle(folder.path)}
            aria-expanded={isOpen}
          >
            {isOpen ? <OpenCaret /> : <ClosedCaret />}
            <FolderIcon />
            <Label>{folder.name}</Label>
          </Row>
          {isOpen ? (
            <FolderChildren
              node={folder}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              selectedPath={selectedPath}
              onSelectPath={onSelectPath}
            />
          ) : null}
        </Box>
      );
    })}
    {node.files.map(file => {
      const isSelected = file.path === selectedPath;
      return (
        <Row
          key={`file:${file.path}`}
          type="button"
          depth={depth}
          selected={isSelected}
          onClick={() => onSelectPath(file.path)}
          aria-current={isSelected ? 'page' : undefined}
        >
          <CaretSpacer />
          <FileIcon />
          <Label>{file.name}</Label>
        </Row>
      );
    })}
  </>
);

export default FileTree;

const Root = stylin(Box)(({ theme }: { theme: any }) => ({
  height: '100%',
  overflowY: 'auto',
  padding: theme.spacing(1, 0),
}));

const TreeList = stylin(Box)({
  display: 'flex',
  flexDirection: 'column',
});

const Row = stylin('button', ['depth', 'selected'])(
  ({
    theme,
    depth = 0,
    selected,
  }: {
    theme: any;
    depth?: number;
    selected?: boolean;
  }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    paddingLeft: `calc(${theme.spacing(1.5)} + ${depth} * ${theme.spacing(2)})`,
    paddingRight: theme.spacing(1.5),
    paddingTop: '6px',
    paddingBottom: '6px',
    width: '100%',
    border: 'none',
    background: selected ? theme.palette.action.selected : 'transparent',
    color: theme.palette.text.primary,
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    fontSize: theme.typography.pxToRem(13),
    '&:hover': {
      backgroundColor: selected
        ? theme.palette.action.selected
        : theme.palette.action.hover,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: '-2px',
    },
  }),
);

const caretStyles = ({ theme }: { theme: any }) => ({
  width: 16,
  height: 16,
  color: theme.palette.text.secondary,
  flex: '0 0 auto',
});

const OpenCaret = stylin(ExpandMoreIcon)(caretStyles);
const ClosedCaret = stylin(ChevronRightIcon)(caretStyles);

const CaretSpacer = stylin(Box)({
  width: 16,
  height: 16,
  flex: '0 0 auto',
});

const FolderIcon = stylin(FolderOutlinedIcon)(({ theme }: { theme: any }) => ({
  width: 16,
  height: 16,
  color: theme.palette.text.secondary,
  flex: '0 0 auto',
}));

const FileIcon = stylin(InsertDriveFileOutlinedIcon)(
  ({ theme }: { theme: any }) => ({
    width: 16,
    height: 16,
    color: theme.palette.text.secondary,
    flex: '0 0 auto',
  }),
);

const Label = stylin('span')({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: '1 1 auto',
});

const EmptyMessage = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
  padding: theme.spacing(1.5),
  fontStyle: 'italic',
}));
