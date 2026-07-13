#!/usr/bin/env node
/**
 * Prepare a lockstep release: set the same version on all three publishable
 * packages, refresh the lockfile, and create the release commit.
 *
 * It deliberately does NOT tag — `main` is protected, so the bump lands via a
 * PR, and the tag must point at the commit that's actually on main after the
 * merge. Tag that commit yourself (the tag push triggers the publish
 * workflow, which verifies tag == package versions):
 *
 *   yarn release 1.0.0            # on a branch; commit, push, open PR
 *   # ...merge the PR, then:
 *   git checkout main && git pull
 *   git tag v1.0.0 && git push origin v1.0.0
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const PACKAGES = [
  'plugins/massdriver-common/package.json',
  'plugins/massdriver-backend/package.json',
  'plugins/massdriver/package.json',
];

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error('Usage: yarn release <version>   (e.g. yarn release 1.0.0)');
  process.exit(1);
}

const run = command => execSync(command, { stdio: 'inherit' });
const capture = command => execSync(command, { encoding: 'utf8' }).trim();

if (capture('git status --porcelain') !== '') {
  console.error('Working tree is not clean — commit or stash first.');
  process.exit(1);
}

if (capture(`git tag --list v${version}`).includes(`v${version}`)) {
  console.error(`Tag v${version} already exists.`);
  process.exit(1);
}

for (const packagePath of PACKAGES) {
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  console.log(`${pkg.name}: ${pkg.version} -> ${version}`);
  writeFileSync(
    packagePath,
    `${JSON.stringify({ ...pkg, version }, null, 2)}\n`,
  );
}

run('yarn install --no-immutable');
run(`git add ${PACKAGES.join(' ')} yarn.lock`);
run(`git commit -m "Release v${version}"`);

console.log(`\nCreated the release commit for v${version}.`);
console.log('Push the branch and merge the PR, then tag the merged commit:');
console.log('\n  git checkout main && git pull');
console.log(`  git tag v${version} && git push origin v${version}\n`);
console.log('The tag push publishes all three packages to npm.');
