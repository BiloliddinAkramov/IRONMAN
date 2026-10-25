/**
 * Input and entity validation utilities for IRONMAN.
 */

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { valid: false, error: 'Email kiritilishi shart' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'Email manzili noto‘g‘ri formatda' };
  }
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Parol kamida 8 ta belgidan iborat bo‘lishi kerak' };
  }
  return { valid: true };
}

export function validateSatScore(score: number | null | undefined): { valid: boolean; error?: string } {
  if (score === null || score === undefined) return { valid: true };
  if (isNaN(score)) return { valid: false, error: 'Ball raqam bo‘lishi kerak' };
  if (score < 400 || score > 1600) {
    return { valid: false, error: 'SAT umumiy bali 400 dan 1600 gacha bo‘lishi lozim' };
  }
  return { valid: true };
}

export function validateSatSectionScore(score: number | null | undefined, sectionName: string): { valid: boolean; error?: string } {
  if (score === null || score === undefined) return { valid: true };
  if (isNaN(score)) return { valid: false, error: 'Ball raqam bo‘lishi kerak' };
  if (score < 200 || score > 800) {
    return { valid: false, error: `${sectionName} bali 200 dan 800 gacha bo‘lishi lozim` };
  }
  return { valid: true };
}

export function validateExpenseAmount(amount: number): { valid: boolean; error?: string } {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: 'Xarajat summasi 0 dan katta bo‘lishi kerak' };
  }
  return { valid: true };
}

export function validateSleepTarget(hours: number): { valid: boolean; error?: string } {
  if (isNaN(hours) || hours < 4 || hours > 14) {
    return { valid: false, error: 'Uyqu maqsadi 4 dan 14 soatgacha bo‘lishi kerak' };
  }
  return { valid: true };
}
