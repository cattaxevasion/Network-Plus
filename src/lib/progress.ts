// Where am I in the plan? (Decision 1-A: progress-based "today".)
// "Today" = the first plan day that is not yet Completed / Partial / Skipped.
// The calendar day is shown only as a reference; falling behind never blocks anything.

import { PLAN, TOTAL_DAYS } from '../data/plan';
import { addDays, diffDays, todayISO } from './dates';
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
