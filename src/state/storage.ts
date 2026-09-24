// This browser's localStorage, plus backup validation shared by every backend.
// Used directly when cloud sync is not configured (src/config/supabase.ts), and as the source for the
// one-time move of existing browser data into the cloud on first sign-in.

import type { AppData, DayStatus, ExamKind, Reason } from '../lib/types';

export interface DataStorage {
  /** Saved data, or null when nothing has been saved yet (first run). Throws if saved data is unreadable. */
  load(): AppData | null;
  save(data: AppData): void;
  clear(): void;
}

const KEY = 'netplus-tracker:data:v1';

export const localStorageBackend: DataStorage = {
  load() {
    let raw: string | null;
    try {
      raw = window.localStorage.getItem(KEY);
    } catch {
      return null; // storage blocked (e.g. private mode): behave like a first run
    }
    if (!raw) return null;
    try {
      return parseAppData(raw);
    } catch (e) {
      // Keep the unreadable copy so starting over never destroys it.
      try {
        window.localStorage.setItem(`${KEY}:unreadable`, raw);
      } catch {
        /* ignore */
      }
      throw e;
    }
  },
  save(data) {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  },
  clear() {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* nothing to clear */
    }
  },
};

/** After moving browser data to the cloud: keep it under another key instead of deleting it. */
export function archiveLocalData() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      window.localStorage.setItem(`${KEY}:moved-to-cloud`, raw);
      window.localStorage.removeItem(KEY);
    }
  } catch {
    /* ignore */
  }
}

// ---------- Validation (used for loading and for importing backups) ----------

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES: DayStatus[] = ['not_started', 'in_progress', 'completed', 'partial', 'skipped'];
const REASONS: Reason[] = ['no_time', 'lost_focus', 'difficult_topic', 'unexpected_event', 'other'];
const KINDS: ExamKind[] = ['first', 'retake'];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const optStr = (v: unknown) => (typeof v === 'string' && v.trim() ? v : undefined);

/** Parses JSON text into AppData. Throws an Error with a readable message if it isn't a valid backup. */
export function parseAppData(text: string): AppData {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('The file is not valid JSON.');
  }
  return validateAppData(json);
}

/** Validates already-parsed JSON (e.g. a jsonb column) into AppData. Throws with a readable message. */
export function validateAppData(json: unknown): AppData {
  if (!isObj(json)) throw new Error('The file does not contain tracker data.');
  if (json.version !== 1) throw new Error(`Unsupported data version: ${String(json.version)}.`);
  if (!isObj(json.settings) || !DATE.test(str(json.settings.startDate))) throw new Error('Settings or start date are missing.');
  if (!isObj(json.days) || !Array.isArray(json.sessions) || !Array.isArray(json.exams) || !Array.isArray(json.objectiveResults)) {
    throw new Error('Some data sections are missing.');
  }

  const days: AppData['days'] = {};
  for (const v of Object.values(json.days)) {
    if (!isObj(v)) continue;
    const day = num(v.day);
    const status = str(v.status) as DayStatus;
    if (day < 1 || day > 60 || !STATUSES.includes(status)) continue;
    const reason = str(v.reason) as Reason;
    days[day] = {
      day,
      status,
      stepsDone: Array.isArray(v.stepsDone) ? v.stepsDone.filter((x): x is string => typeof x === 'string') : [],
      reason: REASONS.includes(reason) ? reason : undefined,
      note: optStr(v.note),
      updatedAt: str(v.updatedAt, new Date().toISOString()),
    };
  }

  const exams = json.exams.filter(isObj).flatMap((e) => {
    const kind = str(e.kind) as ExamKind;
    if (!str(e.id) || !DATE.test(str(e.date)) || !KINDS.includes(kind)) return [];
    return [
      {
        id: str(e.id),
        examNo: num(e.examNo, 1),
        kind,
        planDay: typeof e.planDay === 'number' ? e.planDay : undefined,
        date: str(e.date),
        scorePct: Math.min(100, Math.max(0, num(e.scorePct))),
        notes: optStr(e.notes),
        reviewed: e.reviewed === true,
        createdAt: str(e.createdAt, `${str(e.date)}T00:00:00.000Z`),
      },
    ];
  });
  const examIds = new Set(exams.map((e) => e.id));

  return {
    version: 1,
    settings: {
      startDate: str(json.settings.startDate),
      flashcardUrl: str(json.settings.flashcardUrl),
      flashcardLabel: str(json.settings.flashcardLabel, 'Flashcards'),
    },
    days,
    sessions: json.sessions.filter(isObj).flatMap((s) =>
      str(s.id) && DATE.test(str(s.date)) && num(s.day) >= 1
        ? [
            {
              id: str(s.id),
              date: str(s.date),
              day: num(s.day),
              minutes: typeof s.minutes === 'number' ? s.minutes : undefined,
              note: optStr(s.note),
            },
          ]
        : [],
    ),
    exams,
    objectiveResults: json.objectiveResults.filter(isObj).flatMap((r) =>
      examIds.has(str(r.examId)) && str(r.objectiveId)
        ? [
            {
              examId: str(r.examId),
              objectiveId: str(r.objectiveId),
              correct: Math.max(0, num(r.correct)),
              incorrect: Math.max(0, num(r.incorrect)),
            },
          ]
        : [],
    ),
  };
}

/** Triggers a download of the data as a JSON file. */
export function downloadBackup(data: AppData, today: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `netplus-backup-${today}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
