// Where am I in the plan? (Decision 1-A: progress-based "today".)
// "Today" = the first plan day that is not yet Completed / Partial / Skipped.
// The calendar day is shown only as a reference; falling behind never blocks anything.

import { PLAN, TOTAL_DAYS } from '../data/plan';
import { addDays, diffDays, toISODate, todayISO } from './dates';
import { FINAL_STATUSES, type AppData, type DayStatus, type StudyDay } from './types';

export function dayStatus(data: AppData, day: number): DayStatus {
  return data.days[day]?.status ?? 'not_started';
}

export function isFinal(status: DayStatus): boolean {
  return FINAL_STATUSES.includes(status);
}

/** First day not yet finished, or null when all 60 are finished. */
export function currentDay(data: AppData): number | null {
  for (const p of PLAN) {
    if (!isFinal(dayStatus(data, p.day))) return p.day;
  }
  return null;
}

/** Calendar day number since the start date (1-based), clamped to >= 1. */
export function calendarDay(startDate: string, today: string = todayISO()): number {
  return Math.max(1, diffDays(startDate, today) + 1);
}

export interface ProgressSummary {
  completed: number;
  partial: number;
  skipped: number;
  finished: number; // completed + partial + skipped
  current: number | null;
  calendar: number;
  /** Positive = plan day is behind the calendar day. */
  offset: number;
  /** If one plan day is done per calendar day from today. */
  projectedFinish: string;
}

export function summarize(data: AppData, today: string = todayISO()): ProgressSummary {
  let completed = 0;
  let partial = 0;
  let skipped = 0;
  for (const p of PLAN) {
    const s = dayStatus(data, p.day);
    if (s === 'completed') completed++;
    else if (s === 'partial') partial++;
    else if (s === 'skipped') skipped++;
  }
  const finished = completed + partial + skipped;
  const current = currentDay(data);
  const calendar = calendarDay(data.settings.startDate, today);
  const remaining = TOTAL_DAYS - finished;
  return {
    completed,
    partial,
    skipped,
    finished,
    current,
    calendar,
    offset: current ? Math.min(calendar, TOTAL_DAYS) - current : 0,
    projectedFinish: addDays(today, Math.max(0, remaining - 1)),
  };
}

/** Partial / skipped days, most recent first. They stay open for revisiting. */
export function unfinishedDays(data: AppData): StudyDay[] {
  return Object.values(data.days)
    .filter((d) => d.status === 'partial' || d.status === 'skipped')
    .sort((a, b) => b.day - a.day);
}

// ---------- Finish dates & pace ----------

/** Date a day was finished: the recorded date, else its latest study session, else when it was last changed. */
export function finishedDate(data: AppData, day: number): string | null {
  const d = data.days[day];
  if (!d || !isFinal(d.status)) return null;
  if (d.finishedOn) return d.finishedOn;
  const s = data.sessions
    .filter((x) => x.day === day)
    .map((x) => x.date)
    .sort()
    .pop();
  return s ?? toISODate(new Date(d.updatedAt));
}

/**
 * Finish-date estimate (app design, not from the Study Plan PDF).
 *   actual  : plan days finished in the last 28 calendar days ÷ those days. Used once the plan has run for
 *             14+ days and at least 3 days were finished in that window.
 *   planned : Settings → study days per week (default 5) until then.
 * Skipped days count as progress, because the plan moves on after them.
 */
export const PACE = { windowDays: 28, minHistoryDays: 14, minFinished: 3, defaultDaysPerWeek: 5 } as const;

export interface FinishEstimate {
  finish: string;
  /** Plan days per week used for the estimate. */
  perWeek: number;
  source: 'actual' | 'planned';
  windowDays: number;
  remaining: number;
  /** Where the original 60-day plan (one day per calendar day) would end. */
  planEnd: string;
}

export function estimateFinish(data: AppData, today: string = todayISO()): FinishEstimate | null {
  const finished = PLAN.filter((p) => isFinal(dayStatus(data, p.day))).length;
  const remaining = TOTAL_DAYS - finished;
  if (remaining === 0) return null;
  const since = Math.max(1, diffDays(data.settings.startDate, today) + 1);
  const windowDays = Math.min(PACE.windowDays, since);
  const from = addDays(today, -(windowDays - 1));
  const inWindow = PLAN.filter((p) => {
    const d = finishedDate(data, p.day);
    return d !== null && d >= from && d <= today;
  }).length;

  const actual = since >= PACE.minHistoryDays && inWindow >= PACE.minFinished;
  const perDay = actual ? inWindow / windowDays : (data.settings.studyDaysPerWeek ?? PACE.defaultDaysPerWeek) / 7;
  // Not started yet (start date in the future): count from the start date.
  const base = today < data.settings.startDate ? data.settings.startDate : today;
  return {
    finish: addDays(base, Math.ceil(remaining / perDay) - 1),
    perWeek: Math.round(perDay * 7 * 10) / 10,
    source: actual ? 'actual' : 'planned',
    windowDays,
    remaining,
    planEnd: addDays(data.settings.startDate, TOTAL_DAYS - 1),
  };
}
