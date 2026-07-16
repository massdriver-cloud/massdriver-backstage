import type { RepoFile } from './types';

// Ported from the Massdriver web app

export interface FileNode {
  name: string;
  path: string;
  file: RepoFile;
}

export interface TreeNode {
  name: string;
  path: string;
  folders: TreeNode[];
  files: FileNode[];
}

interface MutableNode {
  name: string;
  path: string;
  children: Record<string, MutableNode>;
  files: FileNode[];
}

const materialize = (node: MutableNode): TreeNode => {
  const folders = Object.values(node.children)
    .map(materialize)
    .sort((left, right) => left.name.localeCompare(right.name));
  const files = [...node.files].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  return { name: node.name, path: node.path, folders, files };
};

/**
 * Build a nested tree from a flat list of files keyed by their path. Folders
 * sort before files; alpha within each group.
 */
export const buildFileTree = (
  files: RepoFile[] | null | undefined,
): TreeNode => {
  const root: MutableNode = { name: '', path: '', children: {}, files: [] };

  (files ?? []).forEach(file => {
    if (!file?.name) return;
    const segments = file.name.split('/').filter(Boolean);
    if (segments.length === 0) return;

    const fileName = segments[segments.length - 1];
    const dirSegments = segments.slice(0, -1);

    const dirNode = dirSegments.reduce((node, segment) => {
      const path = node.path ? `${node.path}/${segment}` : segment;
      if (!node.children[segment]) {
        node.children[segment] = {
          name: segment,
          path,
          children: {},
          files: [],
        };
      }
      return node.children[segment];
    }, root);

    dirNode.files.push({ name: fileName, path: file.name, file });
  });

  return materialize(root);
};

/**
 * Returns the set of folder paths that contain `selectedPath`, so the tree can
 * auto-expand to reveal the selection.
 */
export const ancestorPaths = (
  selectedPath: string | null | undefined,
): Set<string> => {
  if (!selectedPath) return new Set();
  const segments = selectedPath.split('/').filter(Boolean);
  const ancestors = new Set<string>();
  segments.slice(0, -1).reduce((prefix, segment) => {
    const path = prefix ? `${prefix}/${segment}` : segment;
    ancestors.add(path);
    return path;
  }, '');
  return ancestors;
};
