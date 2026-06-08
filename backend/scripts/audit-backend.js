/**
 * Backend Audit Script
 * Detects legacy database remnants and unsafe boundaries.
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = path.join(root, 'src');
const apiDocs = path.join(root, 'docs', 'api');
const migrations = path.join(source, 'database', 'migrations');
const forbidden = [/\bmongoose\b/i, /\bMONGODB_/i, /\bmysql2\b/i, /database\/mysql/, /findByIdAndDelete/, /deleteOne\(/, /deleteMany\(/, /\bDELETE\s+FROM\b/i, /\.then\(/, /\.catch\(/, /console\.(log|warn|error)/];
const routeBoundaryViolations = [/require\(['"].*\.service['"]\)/, /require\(['"].*\.repository['"]\)/, /require\(['"].*database\//, /async\s*\(req,\s*res/];
const controllerBoundaryViolations = [/require\(['"].*\.repository['"]\)/, /require\(['"].*database\//, /\bquery\(/];
const serviceBoundaryViolations = [/require\(['"].*database\//, /\bquery\(/];
const namedFunctionPattern = /^\s*const\s+\w+\s*=\s*(?:async\s*)?\(/;
const lineLimits = new Map([
  ['.controller.js', 300],
  ['.service.js', 400],
  ['.routes.js', 150],
  ['.router.js', 150],
]);

// Collect source files.
const collect = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const target = path.join(directory, entry.name);
  if (entry.isDirectory()) return collect(target);
  return entry.isFile() ? [target] : [];
});

// Resolve configured file line limit.
const getLineLimit = (file) => {
  for (const [suffix, limit] of lineLimits.entries()) {
    if (file.endsWith(suffix)) return limit;
  }
  return null;
};

// Find undocumented named functions.
const findUndocumentedFunctions = (content) => {
  const lines = content.split(/\r?\n/);
  return lines.flatMap((line, index) => {
    if (!namedFunctionPattern.test(line)) return [];
    let previous = index - 1;
    while (previous >= 0 && !lines[previous].trim()) previous -= 1;
    return previous < 0 || !/^(\/\/|\*)/.test(lines[previous].trim()) ? [index + 1] : [];
  });
};

// Audit MySQL tenant schema.
const auditSchema = () => {
  const violations = [];
  const sql = collect(migrations).filter((file) => file.endsWith('.sql')).map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  const requiredFields = ['clinic_id', 'created_by', 'updated_by', 'is_deleted', 'created_at', 'updated_at'];
  const globalTables = new Set(['schema_migrations', 'subscription_plans']);
  for (const match of sql.matchAll(/CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\(([\s\S]*?)\);/gi)) {
    const [, table, definition] = match;
    if (table === 'schema_migrations') continue;
    requiredFields.forEach((field) => {
      if (!new RegExp(`\\b${field}\\b`, 'i').test(definition)) violations.push(`table ${table} lacks ${field}`);
    });
    if (!globalTables.has(table) && !/\b(?:KEY|UNIQUE KEY)\s+\w+\s*\(\s*clinic_id\b/i.test(definition)) violations.push(`table ${table} lacks tenant-first index`);
  }
  return violations;
};

// Audit module API documentation.
const auditApiDocs = () => {
  const requiredLabels = ['Method:', 'Route:', 'Description:', 'Request:', 'Response:', 'Permissions:'];
  return collect(apiDocs).filter((file) => file.endsWith('.md')).flatMap((file) => {
    const content = fs.readFileSync(file, 'utf8');
    return requiredLabels.filter((label) => !content.includes(label)).map((label) => `${path.relative(root, file)} lacks ${label}`);
  });
};

// Run backend audit.
const run = () => {
  const violations = [...auditSchema(), ...auditApiDocs()];
  collect(source).forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const relativeFile = path.relative(root, file);
    const lineLimit = getLineLimit(file);
    const lineCount = content.split(/\r?\n/).length;
    if (file.endsWith('.js') && !content.trimStart().startsWith('/**')) violations.push(`${relativeFile} lacks purpose header`);
    if (file.endsWith('.js')) findUndocumentedFunctions(content).forEach((line) => violations.push(`${relativeFile}:${line} lacks function comment`));
    if (lineLimit && lineCount > lineLimit) violations.push(`${relativeFile} exceeds ${lineLimit} lines`);
    forbidden.forEach((pattern) => {
      if (pattern.test(content)) violations.push(`${relativeFile} matches ${pattern}`);
    });
    if (file.endsWith('.routes.js') || file.endsWith('.router.js')) {
      routeBoundaryViolations.forEach((pattern) => {
        if (pattern.test(content)) violations.push(`${relativeFile} violates route boundary ${pattern}`);
      });
    }
    if (file.endsWith('.controller.js')) {
      controllerBoundaryViolations.forEach((pattern) => {
        if (pattern.test(content)) violations.push(`${relativeFile} violates controller boundary ${pattern}`);
      });
    }
    if (file.endsWith('.service.js')) {
      serviceBoundaryViolations.forEach((pattern) => {
        if (pattern.test(content)) violations.push(`${relativeFile} violates service boundary ${pattern}`);
      });
    }
  });
  process.stdout.write(`Prisma modular source files: ${collect(source).length}; violations: ${violations.length}\n`);
  violations.forEach((violation) => process.stderr.write(`${violation}\n`));
  if (violations.length) process.exitCode = 1;
};

run();
