/* eslint-disable no-restricted-imports */
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

  it('never declares apiToken in the frontend config schema', () => {
    const schemaSource = readFileSync(
      resolve(packageRoot, packageJson.configSchema),
      'utf8',
    );
    expect(schemaSource).not.toContain('apiToken');
  });
});
