// User data model. Static plan/objective data lives in src/data.
// Kept flat (one array/map per entity) so it maps 1:1 to database tables later (Phase 6).

export type DayStatus = 'not_started' | 'in_progress' | 'completed' | 'partial' | 'skipped';

/** App suggestion (not from the Study Plan PDF): why a day was partial/skipped. */
export type Reason = 'no_time' | 'lost_focus' | 'difficult_topic' | 'unexpected_event' | 'other';

export const REASON_LABELS: Record<Reason, string> = {
  no_time: 'No time',
  lost_focus: 'Lost focus',
  difficult_topic: 'Difficult topic',
  unexpected_event: 'Unexpected event',
  other: 'Other',
};

export const STATUS_LABELS: Record<DayStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
  partial: 'Partial',
  skipped: 'Skipped',
};

/** One row per plan day that has been touched (PlanDay 1:1 StudyDay). */
export interface StudyDay {
  day: number;
  status: DayStatus;
  stepsDone: string[];
  reason?: Reason;
  note?: string;
  /** Calendar date the day was marked Completed / Partial / Skipped (YYYY-MM-DD, local). Editable. */
  finishedOn?: string;
  updatedAt: string; // ISO
}

/** A calendar date on which a plan day was worked on (StudyDay 1:N StudySession). */
export interface StudySession {
  id: string;
  date: string; // YYYY-MM-DD (local)
  day: number;
  minutes?: number;
  note?: string;
}

export type ExamKind = 'first' | 'retake';

export interface PracticeExam {
  id: string;
  examNo: number;
  kind: ExamKind;
  planDay?: number;
  date: string; // YYYY-MM-DD
  scorePct: number;
  notes?: string;
  reviewed: boolean;
  createdAt: string; // ISO, tie-breaker for ordering
}

/** Per-item question counts for one exam (PracticeExam 1:N ObjectiveResult). */
export interface ObjectiveResult {
  examId: string;
  /** Objective id ('1.4') or domain id ('1.0'), depending on PRACTICE_EXAM_CONFIG.trackBy. */
  objectiveId: string;
  correct: number;
  incorrect: number;
}

export interface Settings {
  startDate: string; // YYYY-MM-DD, calendar date of Day 1
  flashcardUrl: string;
  flashcardLabel: string;
  /** Study days per week you plan for. Used to estimate the finish date until there is enough history. */
  studyDaysPerWeek?: number;
}

/** The four stacks from the Study Plan PDF (p.8), by how long it took to think of the answer. */
export type Stack = 'knew' | 'moment' | 'while' | 'looked';

export const STACK_LABELS: Record<Stack, string> = {
  knew: 'Knew it right away',
  moment: 'Had to think for a moment',
  while: 'Had to think for a while',
  looked: 'Had to look at the answer',
};

/** A card you made yourself. Official cards (acronyms, ports) come from src/data/glossary.ts and are not stored. */
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  objectiveId?: string;
  createdOn: string; // YYYY-MM-DD (local)
  /** 'guide' = imported from a study-guide card pack (private to your account). Absent = made by you. */
  source?: 'guide';
  /** Plan day the card belongs to (guide cards). It shows up once you reach that day. */
  day?: number;
}

/** Where a card currently sits. Key: card id (custom id, "acr:DNS", "port:Secure Shell (SSH)"). */
export interface CardState {
  stack: Stack;
  lastReviewed: string; // YYYY-MM-DD
  reviews: number;
}

export interface AppData {
  version: 1;
  settings: Settings;
  days: Record<number, StudyDay>;
  sessions: StudySession[];
  exams: PracticeExam[];
  objectiveResults: ObjectiveResult[];
  cards: Flashcard[];
  cardStates: Record<string, CardState>;
}

export const FINAL_STATUSES: DayStatus[] = ['completed', 'partial', 'skipped'];
