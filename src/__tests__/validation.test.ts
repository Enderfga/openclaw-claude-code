/**
 * Unit tests for src/validation.ts — shared input validation utilities.
 */

import { describe, it, expect } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';

import { sanitizeCwd, validateRegex, validateName } from '../validation.js';

// ─── sanitizeCwd ────────────────────────────────────────────────────────────

describe('sanitizeCwd', () => {
  it('returns undefined for undefined input', () => {
    expect(sanitizeCwd(undefined)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(sanitizeCwd('')).toBeUndefined();
  });

  it('returns resolved absolute path for valid input', () => {
    const home = os.homedir();
    const result = sanitizeCwd(home);
    expect(result).toBe(home);
  });

  it('resolves relative paths', () => {
    const result = sanitizeCwd('./some-project');
    expect(path.isAbsolute(result!)).toBe(true);
  });

  it('throws for filesystem root /', () => {
    expect(() => sanitizeCwd('/')).toThrow('Unsafe working directory');
  });

  it('throws for /etc', () => {
    expect(() => sanitizeCwd('/etc')).toThrow('Unsafe working directory');
  });

  it('throws for /etc/passwd parent', () => {
    expect(() => sanitizeCwd('/etc/nginx')).toThrow('Unsafe working directory');
  });

  it('throws for /proc', () => {
    expect(() => sanitizeCwd('/proc')).toThrow('Unsafe working directory');
  });

  it('throws for /sys', () => {
    expect(() => sanitizeCwd('/sys/class')).toThrow('Unsafe working directory');
  });

  it('throws for /var/run', () => {
    expect(() => sanitizeCwd('/var/run')).toThrow('Unsafe working directory');
  });

  it('throws for /var/log', () => {
    expect(() => sanitizeCwd('/var/log')).toThrow('Unsafe working directory');
  });

  it('throws for /boot', () => {
    expect(() => sanitizeCwd('/boot')).toThrow('Unsafe working directory');
  });

  it('throws for /sbin', () => {
    expect(() => sanitizeCwd('/sbin')).toThrow('Unsafe working directory');
  });

  it('throws for ~/.ssh', () => {
    expect(() => sanitizeCwd(path.join(os.homedir(), '.ssh'))).toThrow('Unsafe working directory');
  });

  it('throws for ~/.ssh/keys subdir', () => {
    expect(() => sanitizeCwd(path.join(os.homedir(), '.ssh', 'keys'))).toThrow('Unsafe working directory');
  });

  it('throws for ~/.gnupg', () => {
    expect(() => sanitizeCwd(path.join(os.homedir(), '.gnupg'))).toThrow('Unsafe working directory');
  });

  it('throws for ~/.aws', () => {
    expect(() => sanitizeCwd(path.join(os.homedir(), '.aws'))).toThrow('Unsafe working directory');
  });

  it('throws for ~/.config/gcloud', () => {
    expect(() => sanitizeCwd(path.join(os.homedir(), '.config', 'gcloud'))).toThrow('Unsafe working directory');
  });

  it('resolves path traversal before checking', () => {
    // ../../../etc should resolve to /etc and be blocked
    expect(() => sanitizeCwd('/tmp/../etc')).toThrow('Unsafe working directory');
  });

  it('allows valid project directories', () => {
    const result = sanitizeCwd(path.join(os.homedir(), 'projects', 'my-app'));
    expect(result).toBe(path.join(os.homedir(), 'projects', 'my-app'));
  });

  it('allows /tmp as working directory', () => {
    const result = sanitizeCwd('/tmp');
    // /tmp may be a symlink on macOS to /private/tmp — both are acceptable
    expect(result).toBeTruthy();
  });
});

// ─── validateRegex ──────────────────────────────────────────────────────────

describe('validateRegex', () => {
  it('returns RegExp for valid pattern', () => {
    const result = validateRegex('hello');
    expect(result).toBeInstanceOf(RegExp);
    expect(result.test('HELLO')).toBe(true); // case insensitive
  });

  it('returns case-insensitive regex', () => {
    const result = validateRegex('test');
    expect(result.flags).toContain('i');
  });

  it('supports regex special characters', () => {
    const result = validateRegex('foo.*bar');
    expect(result.test('foo123bar')).toBe(true);
  });

  it('throws for invalid regex syntax', () => {
    expect(() => validateRegex('[unclosed')).toThrow('Invalid regex pattern');
  });

  it('throws for unbalanced parentheses', () => {
    expect(() => validateRegex('(abc')).toThrow('Invalid regex pattern');
  });
});

// ─── validateName ───────────────────────────────────────────────────────────

describe('validateName', () => {
  it('accepts simple alphanumeric name', () => {
    expect(validateName('myagent')).toBe('myagent');
  });

  it('accepts name with hyphens', () => {
    expect(validateName('my-agent')).toBe('my-agent');
  });

  it('accepts name with underscores', () => {
    expect(validateName('agent_1')).toBe('agent_1');
  });

  it('accepts mixed case', () => {
    expect(validateName('ABCdef123')).toBe('ABCdef123');
  });

  it('rejects path traversal attempt', () => {
    expect(() => validateName('../../etc/evil')).toThrow('Invalid name');
  });

  it('rejects name with spaces', () => {
    expect(() => validateName('name with spaces')).toThrow('Invalid name');
  });

  it('rejects name with dots', () => {
    expect(() => validateName('name.md')).toThrow('Invalid name');
  });

  it('rejects name with slashes', () => {
    expect(() => validateName('path/name')).toThrow('Invalid name');
  });

  it('rejects empty string', () => {
    expect(() => validateName('')).toThrow('Invalid name');
  });
});
