/**
 * Syntax Check Script
 * Checks backend JavaScript files.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');

// Collect JavaScript files.
const collect = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const target = path.join(directory, entry.name);
  if (entry.isDirectory() && entry.name !== 'node_modules') return collect(target);
  return entry.isFile() && entry.name.endsWith('.js') ? [target] : [];
});

// Check all JavaScript files.
const run = () => {
  const directories = ['src', 'scripts', 'tests'].map((directory) => path.join(root, directory)).filter(fs.existsSync);
  const files = directories.flatMap(collect);
  for (const file of files) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr);
  }
  process.stdout.write(`Checked ${files.length} backend files.\n`);
};

run();
