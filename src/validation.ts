/**
 * Shared validation utilities for input sanitization.
 *
 * Used by both the plugin tool handlers (index.ts) and the embedded HTTP
 * server (embedded-server.ts) to ensure consistent protection regardless
 * of entry point.
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';

// ─── Blocked Path Prefixes ─────────────────────────────────────────────────

/** System-critical directories that must never be used as a working directory */
const BLOCKED_PREFIXES = ['/etc', '/proc', '/sys', '/var/run', '/var/log', '/boot', '/sbin'];

/** Sensitive directories under the user's home that must never be used as cwd */
const BLOCKED_HOME_SUBDIRS = ['.ssh', '.gnupg', '.aws', '.config/gcloud'];

// ─── sanitizeCwd ────────────────────────────────────────────────────────────

/**
 * Resolve and validate a working directory path.
 *
 * Prevents path traversal and blocks access to system-critical and
 * sensitive directories. Resolves symlinks where possible to defeat
 * symlink-based bypasses.
 */
export function sanitizeCwd(cwd: string | undefined): string | undefined {
  if (!cwd) return undefined;

  // Resolve symlinks when the path exists; fall back to path.resolve for
  // paths that don't exist yet (e.g. a new project directory).
  let resolved: string;
  try {
    resolved = fs.realpathSync(cwd);
  } catch {
    resolved = path.resolve(cwd);
  }

  // Block filesystem root
  if (resolved === '/') {
    throw new Error(`Unsafe working directory: ${resolved}`);
  }

  // Check both the resolved path and the logical path (without /private/ prefix
  // on macOS where /etc → /private/etc, /var → /private/var, etc.)
  const pathsToCheck = [resolved];
  if (resolved.startsWith('/private/')) {
    pathsToCheck.push(resolved.slice('/private'.length));
  }

  // Block system-critical prefixes
  for (const check of pathsToCheck) {
    for (const prefix of BLOCKED_PREFIXES) {
      if (check === prefix || check.startsWith(prefix + '/')) {
        throw new Error(`Unsafe working directory: ${resolved}`);
      }
    }
  }

  // Block sensitive home subdirectories
  const home = os.homedir();
  for (const subdir of BLOCKED_HOME_SUBDIRS) {
    const sensitive = path.join(home, subdir);
    if (resolved === sensitive || resolved.startsWith(sensitive + '/')) {
      throw new Error(`Unsafe working directory: ${resolved}`);
    }
  }

  return resolved;
}

// ─── validateRegex ──────────────────────────────────────────────────────────

/**
 * Validate that a string is a syntactically valid regular expression.
 *
 * Returns the compiled RegExp if valid, throws on invalid syntax.
 * Note: this validates syntax only — it does not detect catastrophic
 * backtracking (ReDoS) patterns.
 */
export function validateRegex(pattern: string): RegExp {
  try {
    return new RegExp(pattern, 'i');
  } catch (err) {
    throw new Error(`Invalid regex pattern: ${(err as Error).message}`);
  }
}

// ─── validateName ───────────────────────────────────────────────────────────

const VALID_NAME = /^[a-zA-Z0-9_-]+$/;

/**
 * Validate a resource name (agent, skill, rule) to prevent path injection.
 *
 * Only allows alphanumeric characters, hyphens, and underscores.
 * Rejects empty strings, dots, slashes, spaces, and any other characters
 * that could be used for path traversal.
 */
export function validateName(name: string): string {
  if (!name || !VALID_NAME.test(name)) {
    throw new Error(`Invalid name '${name}': must be non-empty and match /^[a-zA-Z0-9_-]+$/`);
  }
  return name;
}
