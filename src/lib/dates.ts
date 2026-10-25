/**
 * Date and Time utilities for IRONMAN.
 * Strict handling for Asia/Tashkent (UTC+5) timezone.
 */

export const TASHKENT_TIMEZONE = 'Asia/Tashkent';

export const UZBEK_MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
];

export const UZBEK_WEEKDAYS = [
  'Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'
];

export const UZBEK_WEEKDAYS_SHORT = [
  'Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'
];

// Weekday ordering starting from Monday (standard work/study week)
export const UZBEK_WEEKDAYS_FROM_MONDAY = [
  { index: 1, name: 'Dushanba', short: 'Dush' },
  { index: 2, name: 'Seshanba', short: 'Sesh' },
  { index: 3, name: 'Chorshanba', short: 'Chor' },
  { index: 4, name: 'Payshanba', short: 'Pay' },
  { index: 5, name: 'Juma', short: 'Jum' },
  { index: 6, name: 'Shanba', short: 'Shan' },
  { index: 0, name: 'Yakshanba', short: 'Yak' },
];

/**
 * Returns current YYYY-MM-DD string in Asia/Tashkent timezone.
 */
export function getTashkentTodayString(baseDate: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TASHKENT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // 'en-CA' outputs YYYY-MM-DD
  return formatter.format(baseDate);
}

/**
 * Returns current time HH:mm:ss in Asia/Tashkent timezone.
 */
export function getTashkentTimeString(baseDate: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TASHKENT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return formatter.format(baseDate);
}

/**
 * Calculates end date for 3 calendar months from start date.
 * Handles month-end differences (e.g. Jan 31 -> Apr 30, Feb 29 leap year, etc.)
 */
export function calculateChallengeDates(startDateStr: string): {
  startDate: string;
  endDate: string;
  totalDays: number;
} {
  const [yearStr, monthStr, dayStr] = startDateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error('Noto‘g‘ri sana formati (kutilgan: YYYY-MM-DD)');
  }

  let endYear = year;
  let endMonth = month + 3;
  if (endMonth > 12) {
    endYear += Math.floor((endMonth - 1) / 12);
    endMonth = ((endMonth - 1) % 12) + 1;
  }

  // Find max days in target endMonth (using day 0 of next month)
  const daysInTargetMonth = new Date(Date.UTC(endYear, endMonth, 0)).getUTCDate();
  const endDay = Math.min(day, daysInTargetMonth);

  const pad = (n: number) => String(n).padStart(2, '0');
  const endDateStr = `${endYear}-${pad(endMonth)}-${pad(endDay)}`;

  // Calculate inclusive total days
  const startUtc = Date.UTC(year, month - 1, day);
  const endUtc = Date.UTC(endYear, endMonth - 1, endDay);
  const totalDays = Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24)) + 1;

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    totalDays,
  };
}

/**
 * Calculates current progress within the 3-month challenge.
 */
export function getChallengeDayInfo(
  startDateStr: string,
  endDateStr: string,
  referenceDateStr?: string
): {
  dayNumber: number;
  totalDays: number;
  daysCompleted: number;
  daysRemaining: number;
  progressPercent: number;
  isCompleted: boolean;
  isUpcoming: boolean;
} {
  const refDateStr = referenceDateStr || getTashkentTodayString();

  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const [ey, em, ed] = endDateStr.split('-').map(Number);
  const [ry, rm, rd] = refDateStr.split('-').map(Number);

  const startUtc = Date.UTC(sy, sm - 1, sd);
  const endUtc = Date.UTC(ey, em - 1, ed);
  const refUtc = Date.UTC(ry, rm - 1, rd);

  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.round((endUtc - startUtc) / msPerDay) + 1;

  if (refUtc < startUtc) {
    return {
      dayNumber: 0,
      totalDays,
      daysCompleted: 0,
      daysRemaining: totalDays,
      progressPercent: 0,
      isCompleted: false,
      isUpcoming: true,
    };
  }

  const daysPassed = Math.round((refUtc - startUtc) / msPerDay);
  const dayNumber = Math.min(daysPassed + 1, totalDays);
  const isCompleted = refUtc >= endUtc;
  const daysCompleted = isCompleted ? totalDays : daysPassed;
  const daysRemaining = Math.max(0, totalDays - daysCompleted);
  const progressPercent = Math.min(100, Math.round((daysCompleted / totalDays) * 100));

  return {
    dayNumber,
    totalDays,
    daysCompleted,
    daysRemaining,
    progressPercent,
    isCompleted,
    isUpcoming: false,
  };
}

/**
 * Calculates sleep duration in minutes, handling midnight rollover accurately.
 * E.g. bedtime '23:30', wakeTime '07:15' -> 465 minutes.
 */
export function calculateSleepDuration(bedtime: string, wakeTime: string): {
  durationMinutes: number;
  hours: number;
  minutes: number;
  formatted: string;
} {
  if (!bedtime || !wakeTime) {
    return { durationMinutes: 0, hours: 0, minutes: 0, formatted: '0 s 0 daq' };
  }

  const [bH, bM] = bedtime.split(':').map(Number);
  const [wH, wM] = wakeTime.split(':').map(Number);

  if (isNaN(bH) || isNaN(bM) || isNaN(wH) || isNaN(wM)) {
    return { durationMinutes: 0, hours: 0, minutes: 0, formatted: '0 s 0 daq' };
  }

  const bedMinutes = bH * 60 + bM;
  const wakeMinutes = wH * 60 + wM;

  let durationMinutes = 0;
  if (wakeMinutes >= bedMinutes) {
    durationMinutes = wakeMinutes - bedMinutes;
  } else {
    // Crosses midnight
    durationMinutes = (24 * 60 - bedMinutes) + wakeMinutes;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const formatted = `${hours} s ${minutes} daq`;

  return { durationMinutes, hours, minutes, formatted };
}

/**
 * Checks if a task is locked based on scheduled_date and Tashkent time.
 * If scheduled_date < today in Tashkent, it cannot be completed now.
 */
export function isTaskPastDeadline(scheduledDateStr: string, referenceDateStr?: string): boolean {
  const todayStr = referenceDateStr || getTashkentTodayString();
  return scheduledDateStr < todayStr;
}

/**
 * Format date string (YYYY-MM-DD) to readable Uzbek Latin format.
 * E.g. "2026-10-25" -> "25-oktabr, 2026"
 */
export function formatUzbekDate(dateStr: string, includeWeekday: boolean = false): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;

  const monthName = UZBEK_MONTHS[m - 1] || '';
  const dateFormatted = `${d}-${monthName}, ${y}`;

  if (includeWeekday) {
    const utcDate = new Date(Date.UTC(y, m - 1, d));
    const weekdayName = UZBEK_WEEKDAYS[utcDate.getUTCDay()];
    return `${weekdayName}, ${dateFormatted}`;
  }

  return dateFormatted;
}

/**
 * Format minutes into "X s Y daq"
 */
export function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 daq';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} daq`;
  if (m === 0) return `${h} soat`;
  return `${h} s ${m} daq`;
}

/**
 * Get weekday index (0=Sunday ... 6=Saturday) for a given YYYY-MM-DD
 */
export function getWeekdayIndex(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * Generate an array of dates between two YYYY-MM-DD dates inclusive.
 */
export function getDateRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const [ey, em, ed] = endDateStr.split('-').map(Number);

  let cur = new Date(Date.UTC(sy, sm - 1, sd));
  const end = new Date(Date.UTC(ey, em - 1, ed));

  while (cur <= end) {
    const y = cur.getUTCFullYear();
    const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
    const d = String(cur.getUTCDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    cur = new Date(cur.getTime() + 1000 * 60 * 60 * 24);
  }

  return dates;
}
