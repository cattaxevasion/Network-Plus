// Demo data for the Phase 4 prototype only. Deterministic (seeded) so screenshots are stable.
// Scenario: started 41 days ago, now on Day 40 (2 days behind the calendar), 6 practice exams taken.

import { OBJECTIVES } from './objectives';
import { GUIDES } from './steps';
import { addDays, todayISO } from '../lib/dates';
import { TRACK_BY } from '../lib/tracking';
import type { AppData, ObjectiveResult, PracticeExam, StudyDay, StudySession } from '../lib/types';

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

// Per-objective "true" skill for the demo.
const SKILL: Record<string, number> = { '1.7': 0.5, '2.3': 0.58, '5.5': 0.6, '3.4': 0.68, '1.4': 0.74, '4.3': 0.78 };
const DOMAIN_QUESTIONS: Record<number, number> = { 1: 21, 2: 18, 3: 17, 4: 13, 5: 21 }; // ~90 per exam

export function buildSample(today: string = todayISO()): AppData {
  const rand = rng(42);
  const startDate = addDays(today, -41);
  const days: Record<number, StudyDay> = {};
  const sessions: StudySession[] = [];

  const special: Record<number, Partial<StudyDay>> = {
    12: { status: 'partial', reason: 'lost_focus', note: 'Only got through half, will rewatch the subnetting videos.' },
    15: { status: 'skipped', reason: 'unexpected_event' },
    27: { status: 'partial', reason: 'difficult_topic', note: 'Section 22 was dense.' },
  };

  let lag = 0;
  for (let d = 1; d <= 39; d++) {
    const s = special[d];
    const phase = d <= 33 ? 'video' : 'exam';
    const allSteps = GUIDES[phase].steps.map((x) => x.key);
    if (s?.status === 'skipped') lag++;
    const date = addDays(startDate, d - 1 + lag);
    days[d] = {
      day: d,
      status: s?.status ?? 'completed',
      stepsDone: s?.status === 'skipped' ? [] : s?.status === 'partial' ? allSteps.slice(0, 2) : allSteps,
      reason: s?.reason,
      note: s?.note,
      updatedAt: `${date}T21:00:00.000Z`,
    };
    if (s?.status !== 'skipped') sessions.push({ id: `s${d}`, date, day: d });
    if (d === 20) lag++; // a rest day
  }
  days[40] = { day: 40, status: 'in_progress', stepsDone: ['brain-dump', 'take'], updatedAt: `${today}T10:00:00.000Z` };

  const exams: PracticeExam[] = [];
  const objectiveResults: ObjectiveResult[] = [];
  for (let n = 1; n <= 6; n++) {
    const planDay = 33 + n;
    const date = sessions.find((s) => s.day === planDay)?.date ?? today;
    const id = `e${n}`;
    let c = 0;
    let t = 0;
    for (const o of OBJECTIVES) {
      const perObj = DOMAIN_QUESTIONS[o.domain] / OBJECTIVES.filter((x) => x.domain === o.domain).length;
      const q = Math.max(1, Math.round(perObj + (rand() - 0.5) * 3));
      const p = Math.min(0.97, (SKILL[o.id] ?? 0.86) + n * 0.012);
      let correct = 0;
      for (let i = 0; i < q; i++) if (rand() < p) correct++;
      objectiveResults.push({ examId: id, objectiveId: o.id, correct, incorrect: q - correct });
      c += correct;
      t += q;
    }
    exams.push({
      id,
      examNo: n,
      kind: 'first',
      planDay,
      date,
      scorePct: Math.round((c / t) * 100),
      reviewed: n < 6,
      notes: n === 3 ? 'Ran out of time on the last 10 questions.' : undefined,
      createdAt: `${date}T20:00:00.000Z`,
    });
  }

  // Domain mode: roll objective counts up to 1.0 … 5.0.
  const results =
    TRACK_BY === 'domain'
      ? Object.values(
          objectiveResults.reduce<Record<string, ObjectiveResult>>((acc, r) => {
            const key = `${r.examId}|${r.objectiveId.split('.')[0]}.0`;
            const cur = acc[key] ?? {
              examId: r.examId,
              objectiveId: `${r.objectiveId.split('.')[0]}.0`,
              correct: 0,
              incorrect: 0,
            };
            acc[key] = { ...cur, correct: cur.correct + r.correct, incorrect: cur.incorrect + r.incorrect };
            return acc;
          }, {}),
        )
      : objectiveResults;

  return {
    version: 1,
    settings: { startDate, flashcardUrl: 'https://ankiweb.net/decks', flashcardLabel: 'Anki' },
    days,
    sessions,
    exams,
    objectiveResults: results,
  };
}

export function emptyData(today: string = todayISO()): AppData {
  return {
    version: 1,
    settings: { startDate: today, flashcardUrl: '', flashcardLabel: 'Flashcards' },
    days: {},
    sessions: [],
    exams: [],
    objectiveResults: [],
  };
}
