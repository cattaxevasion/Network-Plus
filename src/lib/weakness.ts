// Weak-area calculation. Thresholds and options live in src/config/practiceExam.ts.
// "Missed in N of last 3 exams" is shown as context only: with a few questions per item per exam,
// one miss in two exams is common even at 90%+, so it does not decide the level on its own.

import { PRACTICE_EXAM_CONFIG } from '../config/practiceExam';
import { TRACK_BY, UNITS } from './tracking';
import type { AppData, PracticeExam } from './types';

export const RULES = PRACTICE_EXAM_CONFIG.weakAreaRules;

export type Level = 'weak' | 'moderate' | 'strong' | 'insufficient';

export const LEVEL_LABELS: Record<Level, string> = {
  weak: 'Weak',
  moderate: 'Moderate',
  strong: 'Strong',
  insufficient: 'Not enough data',
};

export interface Appearance {
  examId: string;
  examNo: number;
  date: string;
  correct: number;
  incorrect: number;
}

export interface ObjectiveStat {
  objectiveId: string;
  correct: number;
  incorrect: number;
  questions: number;
  accuracy: number | null;
  /** Last `recentWindow` first-attempt exams where this objective appeared, oldest -> newest. */
  recent: Appearance[];
  recentAccuracy: number | null;
  recentMisses: number;
  level: Level;
  reasons: string[];
  retake: { correct: number; incorrect: number; exams: number };
}

export function sortExams(exams: PracticeExam[]): PracticeExam[] {
  return [...exams].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}

// Floor so a value just under a threshold never displays as the threshold (84.6% -> 84%, not 85%).
const pct = (x: number) => `${Math.floor(x * 100 + 1e-9)}%`;

export function objectiveStats(data: AppData): ObjectiveStat[] {
  const exams = sortExams(data.exams);
  const firstIds = new Set(
    exams.filter((e) => PRACTICE_EXAM_CONFIG.retakesCountForWeakAreas || e.kind === 'first').map((e) => e.id),
  );
  const byExam = new Map(exams.map((e) => [e.id, e]));

  return UNITS.map((o) => {
    const rows = data.objectiveResults
      .filter((r) => r.objectiveId === o.id && r.correct + r.incorrect > 0)
      .map((r) => ({ r, e: byExam.get(r.examId) }))
      .filter((x): x is { r: typeof x.r; e: PracticeExam } => !!x.e)
      .sort((a, b) => exams.indexOf(a.e) - exams.indexOf(b.e));

    const first = rows.filter((x) => firstIds.has(x.e.id));
    const retakes = rows.filter((x) => !firstIds.has(x.e.id));

    const correct = first.reduce((s, x) => s + x.r.correct, 0);
    const incorrect = first.reduce((s, x) => s + x.r.incorrect, 0);
    const questions = correct + incorrect;
    const accuracy = questions > 0 ? correct / questions : null;

    const recent: Appearance[] = first.slice(-RULES.recentWindow).map(({ r, e }) => ({
      examId: e.id,
      examNo: e.examNo,
      date: e.date,
      correct: r.correct,
      incorrect: r.incorrect,
    }));
    const recentMisses = recent.filter((a) => a.incorrect > 0).length;
    const rc = recent.reduce((s, a) => s + a.correct, 0);
    const rq = recent.reduce((s, a) => s + a.correct + a.incorrect, 0);
    const recentAccuracy = rq > 0 ? rc / rq : null;

    let level: Level;
    const reasons: string[] = [];
    if (questions < RULES.minQuestions || accuracy === null || recentAccuracy === null) {
      level = 'insufficient';
      reasons.push(`${questions} question${questions === 1 ? '' : 's'} so far (needs ${RULES.minQuestions})`);
    } else {
      const worst = Math.min(accuracy, recentAccuracy);
      level = worst < RULES.weakAccuracy ? 'weak' : worst < RULES.moderateAccuracy ? 'moderate' : 'strong';
      const limit = level === 'weak' ? RULES.weakAccuracy : RULES.moderateAccuracy;
      if (level === 'strong') {
        reasons.push(`${pct(accuracy)} overall, ${pct(recentAccuracy)} in last ${recent.length}`);
      } else {
        if (accuracy < limit) reasons.push(`${pct(accuracy)} overall (below ${pct(limit)})`);
        if (recentAccuracy < limit) reasons.push(`${pct(recentAccuracy)} in last ${recent.length} exams (below ${pct(limit)})`);
      }
      // Domains have many questions per exam, so a miss count there is always high and not informative.
      if (TRACK_BY === 'objective' && recentMisses > 0) reasons.push(`missed in ${recentMisses} of last ${recent.length}`);
    }

    return {
      objectiveId: o.id,
      correct,
      incorrect,
      questions,
      accuracy,
      recent,
      recentAccuracy,
      recentMisses,
      level,
      reasons,
      retake: {
        correct: retakes.reduce((s, x) => s + x.r.correct, 0),
        incorrect: retakes.reduce((s, x) => s + x.r.incorrect, 0),
        exams: new Set(retakes.map((x) => x.e.id)).size,
      },
    };
  });
}

const LEVEL_ORDER: Record<Level, number> = { weak: 0, moderate: 1, insufficient: 2, strong: 3 };

/** Weakest first: level, then accuracy ascending. */
export function rankByWeakness(stats: ObjectiveStat[]): ObjectiveStat[] {
  return [...stats].sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || (a.accuracy ?? 1) - (b.accuracy ?? 1));
}
