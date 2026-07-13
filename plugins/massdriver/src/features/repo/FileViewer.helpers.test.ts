import { isMarkdownFile, languageFromExtension } from './FileViewer.helpers';

describe('isMarkdownFile', () => {
  it('matches .md and .markdown case-insensitively', () => {
    expect(isMarkdownFile('README.md')).toBe(true);
    expect(isMarkdownFile('docs/GUIDE.MARKDOWN')).toBe(true);
  });

  it('rejects non-markdown names', () => {
    expect(isMarkdownFile('main.tf')).toBe(false);
    expect(isMarkdownFile(null)).toBe(false);
  });
});

describe('languageFromExtension', () => {
  it('maps known extensions to their language', () => {
    expect(languageFromExtension('main.tf')).toBe('hcl');
    expect(languageFromExtension('config.yaml')).toBe('yaml');
    expect(languageFromExtension('index.ts')).toBe('typescript');
    expect(languageFromExtension('README.md')).toBe('markdown');
  });

  it('treats a bare Dockerfile as docker', () => {
    expect(languageFromExtension('build/Dockerfile')).toBe('docker');
  });

  it('falls back to text for unknown or extension-less names', () => {
    expect(languageFromExtension('LICENSE')).toBe('text');
    expect(languageFromExtension('data.unknownext')).toBe('text');
    expect(languageFromExtension(null)).toBe('text');
  });
});
