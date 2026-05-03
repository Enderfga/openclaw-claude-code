/**
 * Circuit breaker for engine failure tracking.
 *
 * Opens after CIRCUIT_BREAKER_THRESHOLD consecutive failures per engine,
 * with exponential backoff capped at CIRCUIT_BREAKER_MAX_BACKOFF_MS.
 * Resets on a successful engine start.
 */

import {
  CIRCUIT_BREAKER_THRESHOLD,
  CIRCUIT_BREAKER_BACKOFF_BASE_MS,
  CIRCUIT_BREAKER_MAX_BACKOFF_MS,
  CIRCUIT_BREAKER_MAX_COUNT,
} from './constants.js';

interface BreakerState {
  count: number;
  lastFailure: number;
  backoffUntil: number;
}

export class CircuitBreaker {
  private breakers = new Map<string, BreakerState>();

  /** Throws if the engine circuit is open and backoff has not yet expired. */
  check(engine: string): void {
    const breaker = this.breakers.get(engine);
    if (!breaker) return;
    if (breaker.count >= CIRCUIT_BREAKER_THRESHOLD && Date.now() < breaker.backoffUntil) {
      const remaining = Math.ceil((breaker.backoffUntil - Date.now()) / 1000);
      throw new Error(
        `Engine '${engine}' circuit breaker open after ${breaker.count} consecutive failures. ` +
          `Retry in ${remaining}s.`,
      );
    }
    // If backoff has expired, allow the attempt (will reset on success)
  }

  /** Record a failure — increments count and sets exponential backoff. */
  recordFailure(engine: string): void {
    const existing = this.breakers.get(engine) || { count: 0, lastFailure: 0, backoffUntil: 0 };
    existing.count++;
    existing.lastFailure = Date.now();
    // Cap count at MAX_COUNT to prevent unbounded backoff growth
    if (existing.count > CIRCUIT_BREAKER_MAX_COUNT) {
      existing.count = CIRCUIT_BREAKER_MAX_COUNT;
    }
    const backoff = Math.min(
      CIRCUIT_BREAKER_BACKOFF_BASE_MS * Math.pow(2, existing.count - 1),
      CIRCUIT_BREAKER_MAX_BACKOFF_MS,
    );
    existing.backoffUntil = Date.now() + backoff;
    this.breakers.set(engine, existing);
  }

  /** Reset (clear) the breaker for an engine after a successful start. */
  reset(engine: string): void {
    this.breakers.delete(engine);
  }

  /** Get status snapshot for health() reporting. */
  getStatus(): Record<string, { failures: number; backoffUntil: string | null }> {
    return Object.fromEntries(
      [...this.breakers].map(([engine, state]) => [
        engine,
        {
          failures: state.count,
          backoffUntil: state.backoffUntil > Date.now() ? new Date(state.backoffUntil).toISOString() : null,
        },
      ]),
    );
  }
}
