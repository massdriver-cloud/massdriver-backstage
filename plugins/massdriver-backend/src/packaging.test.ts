import { readFileSync } from 'fs';
import { resolve } from 'path';

const packageRoot = resolve(__dirname, '..');
const packageJson = JSON.parse(
  readFileSync(resolve(packageRoot, 'package.json'), 'utf8'),
);

describe('package publishing', () => {
  it('declares a config schema', () => {
    expect(packageJson.configSchema).toBe('config.d.ts');
  });

  it('ships the config schema in the published files', () => {
    expect(packageJson.files).toContain(packageJson.configSchema);
  });

  it('marks apiToken as secret in the config schema', () => {
    const schemaSource = readFileSync(
      resolve(packageRoot, packageJson.configSchema),
      'utf8',
    );
    const apiTokenBlock = schemaSource.slice(
      0,
      schemaSource.indexOf('apiToken'),
    );
    const lastVisibility = apiTokenBlock.lastIndexOf('@visibility');
    expect(apiTokenBlock.slice(lastVisibility)).toContain('@visibility secret');
  });
});
