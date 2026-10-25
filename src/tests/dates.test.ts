import { describe, it, expect } from 'vitest';
import {
  calculateChallengeDates,
  getChallengeDayInfo,
  calculateSleepDuration,
  isTaskPastDeadline,
} from '../lib/dates';

describe('3-Month Challenge Date Calculations', () => {
  it('calculates 3 calendar months correctly from standard start date', () => {
    const res = calculateChallengeDates('2026-10-25');
    // October + 3 months = January 2027
    expect(res.endDate).toBe('2027-01-25');
    expect(res.totalDays).toBeGreaterThan(90);
  });

  it('handles month-end date cases accurately (e.g. Jan 31 -> Apr 30)', () => {
    // January 31 + 3 months -> April only has 30 days
    const res = calculateChallengeDates('2026-01-31');
    expect(res.endDate).toBe('2026-04-30');
  });

  it('handles February leap-year cases accurately', () => {
    // 2024 is a leap year (Feb 29)
    // Nov 30, 2023 + 3 months -> Feb 29, 2024
    const res = calculateChallengeDates('2023-11-30');
    expect(res.endDate).toBe('2024-02-29');

    // 2025 is not a leap year (Feb 28)
    const resNonLeap = calculateChallengeDates('2024-11-30');
    expect(resNonLeap.endDate).toBe('2025-02-28');
  });

  it('calculates day number and progress percentages accurately', () => {
    const startDate = '2026-10-01';
    const endDate = '2027-01-01';

    // Same day as start -> Day 1
    const day1 = getChallengeDayInfo(startDate, endDate, '2026-10-01');
    expect(day1.dayNumber).toBe(1);
    expect(day1.isUpcoming).toBe(false);
    expect(day1.isCompleted).toBe(false);

    // 10 days in
    const day11 = getChallengeDayInfo(startDate, endDate, '2026-10-11');
    expect(day11.dayNumber).toBe(11);
    expect(day11.daysCompleted).toBe(10);

    // Before start date -> Upcoming
    const before = getChallengeDayInfo(startDate, endDate, '2026-09-30');
    expect(before.isUpcoming).toBe(true);
    expect(before.dayNumber).toBe(0);

    // After end date -> Completed
    const after = getChallengeDayInfo(startDate, endDate, '2027-01-05');
    expect(after.isCompleted).toBe(true);
    expect(after.progressPercent).toBe(100);
  });
});

describe('Sleep Duration Across Midnight', () => {
  it('calculates sleep duration crossing midnight (23:00 to 07:00)', () => {
    const res = calculateSleepDuration('23:00', '07:00');
    // 1 hour before midnight + 7 hours = 8 hours = 480 mins
    expect(res.durationMinutes).toBe(480);
    expect(res.hours).toBe(8);
    expect(res.minutes).toBe(0);
  });

  it('calculates sleep duration with minutes (23:45 to 07:15)', () => {
    const res = calculateSleepDuration('23:45', '07:15');
    // 15 mins before midnight + 435 mins = 450 mins = 7 hours 30 mins
    expect(res.durationMinutes).toBe(450);
    expect(res.hours).toBe(7);
    expect(res.minutes).toBe(30);
  });

  it('calculates daytime/same-day sleep without midnight crossing', () => {
    const res = calculateSleepDuration('14:00', '15:30');
    expect(res.durationMinutes).toBe(90);
    expect(res.hours).toBe(1);
    expect(res.minutes).toBe(30);
  });

  it('handles invalid sleep records without crashing', () => {
    const res = calculateSleepDuration('', '');
    expect(res.durationMinutes).toBe(0);
  });
});

describe('Task Deadlines & Locking', () => {
  it('identifies past tasks as past deadline', () => {
    const today = '2026-10-25';
    expect(isTaskPastDeadline('2026-10-24', today)).toBe(true);
    expect(isTaskPastDeadline('2026-10-25', today)).toBe(false);
    expect(isTaskPastDeadline('2026-10-26', today)).toBe(false);
  });
});
