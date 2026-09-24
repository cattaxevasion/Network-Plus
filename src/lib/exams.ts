import type { AppData, ObjectiveResult, PracticeExam } from './types';
import { sortExams } from './weakness';

export function resultsFor(data: AppData, examId: string): ObjectiveResult[] {
  return data.objectiveResults.filter((r) => r.examId === examId);
}

/** PDF tracking chart columns: objectives with correct answers / with incorrect answers. */
export function objectiveLists(data: AppData, examId: string) {
  const rows = resultsFor(data, examId);
  return {
    correct: rows.filter((r) => r.correct > 0).map((r) => r.objectiveId),
    incorrect: rows.filter((r) => r.incorrect > 0).map((r) => r.objectiveId),
  };
}

export function nextExamNo(data: AppData): number {
  const used = data.exams.filter((e) => e.kind === 'first').map((e) => e.examNo);
  return used.length ? Math.max(...used) + 1 : 1;
}

export interface RetakeCandidate {
  examNo: number;
  firstScore: number;
  retakes: number;
  lastRetakeScore?: number;
}

/**
 * Decision 2-A: you pick which exam to retake; the app only suggests an order.
 * Suggestion (app rule, not from the PDF): exams retaken fewer times first,
 * and among those the lowest first-attempt score first.
 */
export function retakeCandidates(data: AppData): RetakeCandidate[] {
  const exams = sortExams(data.exams);
  const firsts = exams.filter((e) => e.kind === 'first');
  return firsts
    .map((f) => {
      const rs = exams.filter((e) => e.kind === 'retake' && e.examNo === f.examNo);
      return {
        examNo: f.examNo,
        firstScore: f.scorePct,
        retakes: rs.length,
        lastRetakeScore: rs.length ? rs[rs.length - 1].scorePct : undefined,
      };
    })
    .sort((a, b) => a.retakes - b.retakes || a.firstScore - b.firstScore);
}

export function examForDay(data: AppData, day: number): PracticeExam | undefined {
  return data.exams.find((e) => e.planDay === day);
}
