import { describe, it, expect } from 'vitest';
import {
  validateSatScore,
  validateSatSectionScore,
  validateExpenseAmount,
  validateEmail,
  validatePassword,
} from '../lib/validation';

describe('Validation Unit Tests', () => {
  it('validates SAT total scores (400 to 1600)', () => {
    expect(validateSatScore(1450).valid).toBe(true);
    expect(validateSatScore(400).valid).toBe(true);
    expect(validateSatScore(1600).valid).toBe(true);
    expect(validateSatScore(390).valid).toBe(false);
    expect(validateSatScore(1650).valid).toBe(false);
    expect(validateSatScore(null).valid).toBe(true); // Optional
  });

  it('validates SAT section scores (200 to 800)', () => {
    expect(validateSatSectionScore(720, 'Math').valid).toBe(true);
    expect(validateSatSectionScore(200, 'Math').valid).toBe(true);
    expect(validateSatSectionScore(800, 'Math').valid).toBe(true);
    expect(validateSatSectionScore(150, 'Math').valid).toBe(false);
    expect(validateSatSectionScore(850, 'Math').valid).toBe(false);
  });

  it('validates expense amounts', () => {
    expect(validateExpenseAmount(25000).valid).toBe(true);
    expect(validateExpenseAmount(0).valid).toBe(false);
    expect(validateExpenseAmount(-500).valid).toBe(false);
    expect(validateExpenseAmount(NaN).valid).toBe(false);
  });

  it('validates emails', () => {
    expect(validateEmail('test@ironman.uz').valid).toBe(true);
    expect(validateEmail('invalid-email').valid).toBe(false);
    expect(validateEmail('').valid).toBe(false);
  });

  it('validates password minimum length (8 chars)', () => {
    expect(validatePassword('strongPass123').valid).toBe(true);
    expect(validatePassword('short').valid).toBe(false);
  });
});
