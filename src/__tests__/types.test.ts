/**
 * Unit tests for shared types and constants
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MODEL_PRICING, MODEL_ALIASES, overrideModelPricing } from '../types.js';

describe('MODEL_PRICING', () => {
  it('contains expected models', () => {
    const expected = [
      'claude-opus-4-6',
      'claude-sonnet-4-6',
      'claude-haiku-4-5',
      'gemini-2.5-pro',
      'gpt-4o',
      'o4-mini',
    ];
    for (const model of expected) {
      expect(MODEL_PRICING[model], `missing pricing for ${model}`).toBeDefined();
    }
  });

  it('has positive input and output prices', () => {
    for (const [model, pricing] of Object.entries(MODEL_PRICING)) {
      expect(pricing.input, `${model} input should be positive`).toBeGreaterThan(0);
      expect(pricing.output, `${model} output should be positive`).toBeGreaterThan(0);
    }
  });

  it('cached is optional but positive when defined', () => {
    for (const [model, pricing] of Object.entries(MODEL_PRICING)) {
      if (pricing.cached !== undefined) {
        expect(pricing.cached, `${model} cached should be positive`).toBeGreaterThan(0);
      }
    }
  });
});

describe('overrideModelPricing', () => {
  // Save originals so we can restore after each test
  const originalOpus = { ...MODEL_PRICING['claude-opus-4-6'] };

  beforeEach(() => {
    // Restore original pricing after each test
    MODEL_PRICING['claude-opus-4-6'] = { ...originalOpus };
    delete MODEL_PRICING['custom-model-xyz'];
  });

  it('overrides existing model pricing fully', () => {
    overrideModelPricing({ 'claude-opus-4-6': { input: 20, output: 80, cached: 2.0 } });
    expect(MODEL_PRICING['claude-opus-4-6']).toEqual({ input: 20, output: 80, cached: 2.0 });
  });

  it('partial merge keeps existing fields', () => {
    overrideModelPricing({ 'claude-opus-4-6': { input: 99 } });
    expect(MODEL_PRICING['claude-opus-4-6'].input).toBe(99);
    expect(MODEL_PRICING['claude-opus-4-6'].output).toBe(originalOpus.output);
    expect(MODEL_PRICING['claude-opus-4-6'].cached).toBe(originalOpus.cached);
  });

  it('adds a new model', () => {
    overrideModelPricing({ 'custom-model-xyz': { input: 5, output: 25 } });
    expect(MODEL_PRICING['custom-model-xyz']).toEqual({ input: 5, output: 25, cached: undefined });
  });

  it('values are visible to consumers reading MODEL_PRICING', () => {
    overrideModelPricing({ 'claude-opus-4-6': { input: 42 } });
    const pricing = MODEL_PRICING['claude-opus-4-6'];
    expect(pricing.input).toBe(42);
  });
});

describe('MODEL_ALIASES', () => {
  it('all aliases resolve to a model in MODEL_PRICING', () => {
    for (const [alias, model] of Object.entries(MODEL_ALIASES)) {
      expect(MODEL_PRICING[model], `alias '${alias}' -> '${model}' not in MODEL_PRICING`).toBeDefined();
    }
  });

  it('contains expected aliases', () => {
    expect(MODEL_ALIASES['opus']).toBeDefined();
    expect(MODEL_ALIASES['sonnet']).toBeDefined();
    expect(MODEL_ALIASES['haiku']).toBeDefined();
  });
});
