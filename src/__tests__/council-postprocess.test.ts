/**
 * Unit tests for Council post-processing: review, accept, reject.
 *
 * These tests use a real temporary git repo to exercise the actual git
 * operations in the Council class. No mocking of git — the point is to
 * verify worktree cleanup, branch deletion, and file operations work.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';
import { Council, getDefaultCouncilConfig } from '../council.js';
import type { CouncilConfig, CouncilSession } from '../types.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Create a temporary git repo with an initial commit */
function createTempRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'council-test-'));
  execSync('git init', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.email "test@test.com"', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.name "Test"', { cwd: dir, stdio: 'pipe' });
  fs.writeFileSync(path.join(dir, 'README.md'), '# Test\n');
  execSync('git add -A && git commit -m "initial"', { cwd: dir, stdio: 'pipe' });
  return dir;
}

/** Create council branches and artifacts to simulate a completed council */
function simulateCouncilOutput(dir: string): void {
  // Create plan.md
  fs.writeFileSync(
    path.join(dir, 'plan.md'),
    '# Plan\n- [x] Task 1 [Done: council/Architect]\n- [ ] Task 2\n',
  );

  // Create reviews/
  const reviewsDir = path.join(dir, 'reviews');
  fs.mkdirSync(reviewsDir, { recursive: true });
  fs.writeFileSync(path.join(reviewsDir, 'Architect-on-Engineer.md'), '# Review\n[APPROVE]\n');

  // Create a council branch
  execSync('git checkout -b council/Architect', { cwd: dir, stdio: 'pipe' });
  fs.writeFileSync(path.join(dir, 'feature.ts'), 'export const x = 1;\n');
  execSync('git add -A && git commit -m "council(draft): Architect - add feature"', {
    cwd: dir,
    stdio: 'pipe',
  });
  execSync('git checkout main', { cwd: dir, stdio: 'pipe' });

  // Merge council branch
  execSync('git merge council/Architect --no-edit', { cwd: dir, stdio: 'pipe' });

  // Create another council branch
  execSync('git checkout -b council/Engineer', { cwd: dir, stdio: 'pipe' });
  execSync('git checkout main', { cwd: dir, stdio: 'pipe' });
}

function cleanupDir(dir: string): void {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Best effort
  }
}

// ─── Mock SessionManager ───────────────────────────────────────────────────

const mockManager = {
  startSession: async () => ({ name: 'test', created: new Date().toISOString(), cwd: '/tmp', paused: false, stats: {} }),
  sendMessage: async () => ({ output: '[CONSENSUS: YES]', events: [] }),
  stopSession: async () => {},
};

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('Council post-processing', () => {
  let dir: string;
  let council: Council;

  beforeEach(() => {
    dir = createTempRepo();
    simulateCouncilOutput(dir);

    const config: CouncilConfig = {
      ...getDefaultCouncilConfig(dir),
      maxRounds: 3,
    };
    council = new Council(config, mockManager as Parameters<typeof Council['prototype']['constructor']>[1]);
    // Initialize the council with a fake session
    council.init('Test task: build a feature');
    // Manually set session status to simulate completed council
    const session = council.getSession() as CouncilSession;
    session.status = 'awaiting_user';
    session.responses = [
      {
        agent: 'Architect',
        round: 1,
        content: 'Created plan.md with task breakdown\n[CONSENSUS: NO]',
        consensus: false,
        sessionKey: 'test-1',
        timestamp: new Date().toISOString(),
      },
      {
        agent: 'Engineer',
        round: 1,
        content: 'Reviewed plan, looks good\n[CONSENSUS: NO]',
        consensus: false,
        sessionKey: 'test-2',
        timestamp: new Date().toISOString(),
      },
      {
        agent: 'Architect',
        round: 2,
        content: 'Implemented feature.ts\n[CONSENSUS: YES]',
        consensus: true,
        sessionKey: 'test-3',
        timestamp: new Date().toISOString(),
      },
      {
        agent: 'Engineer',
        round: 2,
        content: 'Approved Architect work\n[CONSENSUS: YES]',
        consensus: true,
        sessionKey: 'test-4',
        timestamp: new Date().toISOString(),
      },
    ];
  });

  afterEach(() => {
    cleanupDir(dir);
  });

  // ─── review() ──────────────────────────────────────────────────────────

  describe('review()', () => {
    it('returns council ID and project dir', async () => {
      const result = await council.review();
      expect(result.councilId).toBe(council.getSession()!.id);
      expect(result.projectDir).toBe(dir);
    });

    it('detects plan.md exists and returns content', async () => {
      const result = await council.review();
      expect(result.planExists).toBe(true);
      expect(result.planContent).toContain('Task 1');
      expect(result.planContent).toContain('[Done: council/Architect]');
    });

    it('detects council branches', async () => {
      const result = await council.review();
      expect(result.branches).toContain('council/Architect');
      expect(result.branches).toContain('council/Engineer');
    });

    it('detects review files', async () => {
      const result = await council.review();
      expect(result.reviews).toContain('Architect-on-Engineer.md');
    });

    it('returns agent summaries from the final round', async () => {
      const result = await council.review();
      expect(result.agentSummaries.length).toBe(2); // Round 2 has 2 agents
      expect(result.agentSummaries[0].agent).toBe('Architect');
      expect(result.agentSummaries[0].consensus).toBe(true);
      expect(result.agentSummaries[1].agent).toBe('Engineer');
    });

    it('returns correct round count', async () => {
      const result = await council.review();
      expect(result.rounds).toBe(2);
    });

    it('handles missing plan.md gracefully', async () => {
      fs.unlinkSync(path.join(dir, 'plan.md'));
      const result = await council.review();
      expect(result.planExists).toBe(false);
      expect(result.planContent).toBeUndefined();
    });

    it('handles missing reviews/ gracefully', async () => {
      fs.rmSync(path.join(dir, 'reviews'), { recursive: true });
      const result = await council.review();
      expect(result.reviews).toEqual([]);
    });
  });

  // ─── accept() ──────────────────────────────────────────────────────────

  describe('accept()', () => {
    it('deletes council branches', async () => {
      const result = await council.accept();
      expect(result.branchesDeleted).toContain('council/Architect');
      expect(result.branchesDeleted).toContain('council/Engineer');

      // Verify branches are actually gone
      const branches = execSync('git branch', { cwd: dir, encoding: 'utf-8' });
      expect(branches).not.toContain('council/');
    });

    it('removes plan.md', async () => {
      const result = await council.accept();
      expect(result.planDeleted).toBe(true);
      expect(fs.existsSync(path.join(dir, 'plan.md'))).toBe(false);
    });

    it('removes reviews/ directory', async () => {
      const result = await council.accept();
      expect(result.reviewsDeleted).toBe(true);
      expect(fs.existsSync(path.join(dir, 'reviews'))).toBe(false);
    });

    it('sets council status to accepted', async () => {
      await council.accept();
      expect(council.getSession()!.status).toBe('accepted');
    });

    it('returns council ID', async () => {
      const result = await council.accept();
      expect(result.councilId).toBe(council.getSession()!.id);
    });

    it('handles already-clean state gracefully', async () => {
      // Remove artifacts manually first
      fs.unlinkSync(path.join(dir, 'plan.md'));
      fs.rmSync(path.join(dir, 'reviews'), { recursive: true });

      const result = await council.accept();
      expect(result.planDeleted).toBe(false);
      expect(result.reviewsDeleted).toBe(false);
    });
  });

  // ─── reject() ──────────────────────────────────────────────────────────

  describe('reject()', () => {
    it('rewrites plan.md with feedback', async () => {
      const feedback = 'Feature.ts has broken imports. Task 2 was never implemented.';
      const result = await council.reject(feedback);

      expect(result.planRewritten).toBe(true);
      expect(result.feedback).toBe(feedback);

      const planContent = fs.readFileSync(path.join(dir, 'plan.md'), 'utf-8');
      expect(planContent).toContain('REJECTED');
      expect(planContent).toContain(feedback);
    });

    it('preserves council branches', async () => {
      await council.reject('Needs rework');

      const branches = execSync('git branch', { cwd: dir, encoding: 'utf-8' });
      expect(branches).toContain('council/Architect');
      expect(branches).toContain('council/Engineer');
    });

    it('preserves reviews/ directory', async () => {
      await council.reject('Needs rework');
      expect(fs.existsSync(path.join(dir, 'reviews'))).toBe(true);
    });

    it('sets council status to rejected', async () => {
      await council.reject('Bad work');
      expect(council.getSession()!.status).toBe('rejected');
    });

    it('includes council ID and round count in rejection plan', async () => {
      await council.reject('Missing tests');
      const planContent = fs.readFileSync(path.join(dir, 'plan.md'), 'utf-8');
      expect(planContent).toContain(council.getSession()!.id);
      expect(planContent).toContain('2'); // rounds completed
    });

    it('commits the rejection plan', async () => {
      await council.reject('Needs fixes');
      const log = execSync('git log --oneline -1', { cwd: dir, encoding: 'utf-8' });
      expect(log).toContain('council(reject)');
    });
  });
});
