// Ported from the Massdriver web app
const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  md: 'markdown',
  markdown: 'markdown',
  tf: 'hcl',
  tfvars: 'hcl',
  hcl: 'hcl',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  js: 'javascript',
  jsx: 'jsx',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'tsx',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  kt: 'kotlin',
  c: 'c',
  cpp: 'cpp',
  cs: 'csharp',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  ps1: 'powershell',
  sql: 'sql',
  html: 'html',
  css: 'css',
  scss: 'scss',
  xml: 'xml',
  graphql: 'graphql',
  gql: 'graphql',
  proto: 'protobuf',
  dockerfile: 'docker',
  ex: 'elixir',
  exs: 'elixir',
};

export const isMarkdownFile = (name?: string | null): boolean =>
  /\.(md|markdown)$/i.test(name ?? '');

export const languageFromExtension = (name?: string | null): string => {
  if (!name) return 'text';
  const baseName = name.split('/').pop() ?? '';
  if (baseName.toLowerCase() === 'dockerfile') return 'docker';
  const dotIndex = baseName.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === baseName.length - 1) return 'text';
  const ext = baseName.slice(dotIndex + 1).toLowerCase();
  return EXTENSION_LANGUAGE_MAP[ext] ?? 'text';
};
