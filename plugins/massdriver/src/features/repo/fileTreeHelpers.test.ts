import { ancestorPaths, buildFileTree } from './fileTreeHelpers';
import type { RepoFile } from './types';

const file = (name: string): RepoFile => ({
  name,
  mediaType: 'text/plain',
  size: 1,
  url: '',
});

describe('buildFileTree', () => {
  it('returns an empty tree for missing input', () => {
    expect(buildFileTree(null)).toEqual({
      name: '',
      path: '',
      folders: [],
      files: [],
    });
  });

  it('groups files into folders with alphabetic sorting', () => {
    const tree = buildFileTree([
      file('README.md'),
      file('src/main.tf'),
      file('src/variables.tf'),
      file('src/templates/deployment.yaml'),
    ]);

    expect(tree.folders).toHaveLength(1);
    expect(tree.folders[0].name).toBe('src');
    expect(tree.folders[0].files.map(entry => entry.name)).toEqual([
      'main.tf',
      'variables.tf',
    ]);
    expect(tree.folders[0].folders.map(entry => entry.name)).toEqual([
      'templates',
    ]);
    expect(tree.folders[0].folders[0].files[0].path).toBe(
      'src/templates/deployment.yaml',
    );
    expect(tree.files.map(entry => entry.name)).toEqual(['README.md']);
  });

  it('skips entries with no name', () => {
    const tree = buildFileTree([{ name: '' } as RepoFile, file('a.txt')]);
    expect(tree.files.map(entry => entry.name)).toEqual(['a.txt']);
  });
});

describe('ancestorPaths', () => {
  it('returns the chain of containing folders', () => {
    expect([...ancestorPaths('src/templates/deployment.yaml')]).toEqual([
      'src',
      'src/templates',
    ]);
  });

  it('returns an empty set when the path has no folders', () => {
    expect(ancestorPaths('README.md').size).toBe(0);
    expect(ancestorPaths(null).size).toBe(0);
  });
});
