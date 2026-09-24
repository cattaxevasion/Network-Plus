// App state + actions, and saving through a Backend (src/state/backend.ts).
//
// Modes
//   loading : checking sign-in / loading data
//   signin  : cloud sync is on and nobody is signed in -> sign-in screen
//   error   : data couldn't be loaded (e.g. offline) -> retry screen
//   setup   : no plan yet (or after reset) -> setup screen
//   live    : your real plan; every change is saved (cloud: ~0.6 s after the last change)
//   demo    : sample data to look around; never saved
//
// Sync (cloud)
//   Each save sends the version this device last saw. If another device saved in between, the save is
//   refused ("conflict") and you choose: load the other device's version, or keep this one.
//   When the tab regains focus with nothing unsaved, newer data from another device is loaded silently.

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { buildSample, emptyData } from '../data/sample';
import { newId, todayISO } from '../lib/dates';
import type { AppData, DayStatus, ObjectiveResult, PracticeExam, Reason, Settings } from '../lib/types';
import { auth, type AppUser } from './auth';
import { localBackend, type Backend } from './backend';
import { archiveLocalData, localStorageBackend } from './storage';

export type Mode = 'loading' | 'signin' | 'error' | 'setup' | 'live' | 'demo';
export type SyncStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'conflict' | 'error';

type Action =
  | { type: 'toggleStep'; day: number; key: string }
  | {
      type: 'finishDay';
      day: number;
      status: Extract<DayStatus, 'completed' | 'partial' | 'skipped'>;
      reason?: Reason;
      note?: string;
    }
  | { type: 'reopenDay'; day: number }
  | { type: 'saveExam'; exam: PracticeExam; results: ObjectiveResult[] }
  | { type: 'deleteExam'; id: string }
  | { type: 'setReviewed'; id: string; reviewed: boolean }
  | { type: 'updateSettings'; settings: Partial<Settings> }
  | { type: 'replaceAll'; data: AppData };

const now = () => new Date().toISOString();

function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'toggleStep': {
      const prev = state.days[action.day];
      const done = new Set(prev?.stepsDone ?? []);
      if (done.has(action.key)) done.delete(action.key);
      else done.add(action.key);
      const status: DayStatus =
        prev && prev.status !== 'not_started' && prev.status !== 'in_progress'
          ? prev.status
          : done.size > 0
            ? 'in_progress'
            : 'not_started';
      return {
        ...state,
        days: { ...state.days, [action.day]: { ...prev, day: action.day, status, stepsDone: [...done], updatedAt: now() } },
      };
    }
    case 'finishDay': {
      const prev = state.days[action.day];
      const today = todayISO();
      const worked = action.status !== 'skipped';
      const hasSession = state.sessions.some((s) => s.day === action.day && s.date === today);
      return {
        ...state,
        days: {
          ...state.days,
          [action.day]: {
            day: action.day,
            stepsDone: prev?.stepsDone ?? [],
            status: action.status,
            reason: action.status === 'completed' ? undefined : action.reason,
            note: action.note?.trim() || undefined,
            updatedAt: now(),
          },
        },
        sessions: worked && !hasSession ? [...state.sessions, { id: newId(), date: today, day: action.day }] : state.sessions,
      };
    }
    case 'reopenDay': {
      const prev = state.days[action.day];
      if (!prev) return state;
      return {
        ...state,
        days: {
          ...state.days,
          [action.day]: {
            ...prev,
            status: prev.stepsDone.length ? 'in_progress' : 'not_started',
            reason: undefined,
            updatedAt: now(),
          },
        },
      };
    }
    case 'saveExam': {
      const exists = state.exams.some((e) => e.id === action.exam.id);
      return {
        ...state,
        exams: exists ? state.exams.map((e) => (e.id === action.exam.id ? action.exam : e)) : [...state.exams, action.exam],
        objectiveResults: [
          ...state.objectiveResults.filter((r) => r.examId !== action.exam.id),
          ...action.results.filter((r) => r.correct + r.incorrect > 0),
        ],
      };
    }
    case 'deleteExam':
      return {
        ...state,
        exams: state.exams.filter((e) => e.id !== action.id),
        objectiveResults: state.objectiveResults.filter((r) => r.examId !== action.id),
      };
    case 'setReviewed':
      return { ...state, exams: state.exams.map((e) => (e.id === action.id ? { ...e, reviewed: action.reviewed } : e)) };
    case 'updateSettings':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'replaceAll':
      return action.data;
  }
}

const SAVE_DELAY_MS = 600;
const RETRY_MS = 10_000;
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

type Store = {
  data: AppData;
  mode: Mode;
  /** true when cloud sync (Supabase) is configured. */
  cloud: boolean;
  user: AppUser | null;
  sync: { status: SyncStatus; error: string | null };
  /** Local mode: saved data existed but could not be read at startup. */
  loadError: string | null;
  /** Mode 'error': why loading failed. */
  bootError: string | null;
  /** Sign-in screen: error returned by the sign-in redirect. */
  signInError: string | null;
  /** One-time message, e.g. after moving browser data to the cloud. */
  notice: string | null;
  actions: Actions;
};

type Actions = ReturnType<typeof makeActions>;

const StoreContext = createContext<Store | null>(null);

function makeActions(api: {
  dispatch: React.Dispatch<Action>;
  change: (a: Action) => void;
  setMode: (m: Mode) => void;
  replaceAndSave: (d: AppData, mode: Mode) => void;
  resetAll: () => Promise<void>;
  reloadFromServer: () => Promise<void>;
  keepThisDevice: () => Promise<void>;
  boot: () => void;
  setNotice: (n: string | null) => void;
  setSignInError: (e: string | null) => void;
}) {
  const { dispatch, change } = api;
  return {
    toggleStep: (day: number, key: string) => change({ type: 'toggleStep', day, key }),
    finishDay: (day: number, status: 'completed' | 'partial' | 'skipped', reason?: Reason, note?: string) =>
      change({ type: 'finishDay', day, status, reason, note }),
    reopenDay: (day: number) => change({ type: 'reopenDay', day }),
    saveExam: (exam: PracticeExam, results: ObjectiveResult[]) => change({ type: 'saveExam', exam, results }),
    deleteExam: (id: string) => change({ type: 'deleteExam', id }),
    setReviewed: (id: string, reviewed: boolean) => change({ type: 'setReviewed', id, reviewed }),
    updateSettings: (settings: Partial<Settings>) => change({ type: 'updateSettings', settings }),

    /** First run: create an empty plan with these settings and start saving. */
    startPlan: (settings: Settings) => api.replaceAndSave({ ...emptyData(), settings }, 'live'),
    /** Look around with sample data. Nothing is saved. */
    startDemo: () => {
      dispatch({ type: 'replaceAll', data: buildSample() });
      api.setMode('demo');
    },
    leaveDemo: () => {
      dispatch({ type: 'replaceAll', data: emptyData() });
      api.setMode('setup');
    },
    /** Replace everything with a validated backup and save it. */
    importData: (data: AppData) => api.replaceAndSave(data, 'live'),
    /** Delete all saved data and go back to the setup screen. */
    resetAll: api.resetAll,
    reloadFromServer: api.reloadFromServer,
    keepThisDevice: api.keepThisDevice,
    retry: api.boot,
    dismissNotice: () => api.setNotice(null),
    signIn: async () => {
      if (!auth) return;
      try {
        await auth.signIn();
      } catch (e) {
        api.setSignInError(msg(e));
      }
    },
    signOut: async () => {
      await auth?.signOut();
    },
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, () => emptyData());
  const [mode, setModeState] = useState<Mode>('loading');
  const [user, setUser] = useState<AppUser | null>(null);
  const [sync, setSync] = useState<Store['sync']>({ status: 'idle', error: null });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [signInError, setSignInError] = useState<string | null>(() => auth?.takeUrlError() ?? null);
  const [notice, setNotice] = useState<string | null>(null);

  // Refs used by the async save loop (always the latest values).
  const dataRef = useRef(data);
  dataRef.current = data;
  const modeRef = useRef(mode);
  const backendRef = useRef<Backend | null>(auth ? null : localBackend);
  const userRef = useRef<AppUser | null>(null);
  const versionRef = useRef<number | null>(null);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const againRef = useRef(false);
  const conflictRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);

  const setMode = useCallback((m: Mode) => {
    modeRef.current = m;
    setModeState(m);
  }, []);

  const replace = useCallback((d: AppData) => {
    dataRef.current = d;
    dispatch({ type: 'replaceAll', data: d });
  }, []);

  // ---------- saving ----------
  const save = useCallback(async () => {
    const backend = backendRef.current;
    if (!backend || modeRef.current !== 'live' || !dirtyRef.current || conflictRef.current) return;
    if (savingRef.current) {
      againRef.current = true;
      return;
    }
    savingRef.current = true;
    const sent = dataRef.current;
    if (backend.kind === 'cloud') setSync({ status: 'saving', error: null });
    try {
      const res = await backend.save(sent, versionRef.current);
      if (res.ok) {
        versionRef.current = res.version;
        if (dataRef.current === sent) dirtyRef.current = false;
        setSync({ status: 'saved', error: null });
      } else {
        conflictRef.current = true;
        setSync({ status: 'conflict', error: null });
      }
    } catch (e) {
      const offline = backend.kind === 'cloud';
      setSync({ status: offline ? 'offline' : 'error', error: msg(e) });
      if (offline) {
        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => void save(), RETRY_MS);
      }
    } finally {
      savingRef.current = false;
      if (againRef.current) {
        againRef.current = false;
        void save();
      } else if (dirtyRef.current && dataRef.current !== sent && !conflictRef.current) {
        void save();
      }
    }
  }, []);

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true;
    window.clearTimeout(timerRef.current);
    // Local storage is instant: write now. Cloud: wait for a pause in edits to batch them.
    if (backendRef.current?.kind !== 'cloud') void save();
    else timerRef.current = window.setTimeout(() => void save(), SAVE_DELAY_MS);
  }, [save]);

  /** A user edit: apply it, and save it if this is the real plan. */
  const change = useCallback(
    (a: Action) => {
      dataRef.current = reducer(dataRef.current, a);
      dispatch({ type: 'replaceAll', data: dataRef.current });
      if (modeRef.current === 'live') scheduleSave();
    },
    [scheduleSave],
  );

  const replaceAndSave = useCallback(
    (d: AppData, m: Mode) => {
      replace(d);
      setMode(m);
      scheduleSave();
    },
    [replace, setMode, scheduleSave],
  );

  // ---------- loading ----------
  const loadInto = useCallback(async () => {
    const backend = backendRef.current;
    if (!backend) return;
    setMode('loading');
    setBootError(null);
    try {
      let loaded = null;
      try {
        loaded = await backend.load();
      } catch (e) {
        if (backend.kind === 'local') {
          // Unreadable browser data: start fresh (a copy was kept aside).
          setLoadError(msg(e));
          replace(emptyData());
          setMode('setup');
          return;
        }
        throw e;
      }
      conflictRef.current = false;
      dirtyRef.current = false;
      if (loaded) {
        versionRef.current = loaded.version;
        replace(loaded.data);
        setSync({ status: 'saved', error: null });
        setMode('live');
        return;
      }
      versionRef.current = null;
      if (backend.kind === 'cloud') {
        // First sign-in: move progress saved in this browser (Phase 5) into the account.
        let local: AppData | null = null;
        try {
          local = localStorageBackend.load();
        } catch {
          local = null;
        }
        if (local) {
          const res = await backend.save(local, null);
          if (res.ok) {
            versionRef.current = res.version;
            archiveLocalData();
            replace(local);
            setNotice('Your progress from this browser was moved to your account.');
            setSync({ status: 'saved', error: null });
            setMode('live');
            return;
          }
          // Another device created the row meanwhile: load that instead.
          return void loadInto();
        }
      }
      replace(emptyData());
      setMode('setup');
    } catch (e) {
      setBootError(msg(e));
      setMode('error');
    }
  }, [replace, setMode]);

  const boot = useCallback(() => void loadInto(), [loadInto]);

  // Local mode: load once. Cloud mode: follow sign-in state.
  useEffect(() => {
    if (!auth) {
      void loadInto();
      return;
    }
    return auth.onChange((u) => {
      if (!u) {
        userRef.current = null;
        backendRef.current = null;
        setUser(null);
        versionRef.current = null;
        dirtyRef.current = false;
        replace(emptyData());
        setMode('signin');
        return;
      }
      if (userRef.current?.id === u.id) {
        setUser(u); // token refresh etc.
        return;
      }
      userRef.current = u;
      setUser(u);
      backendRef.current = auth!.backendFor(u);
      void loadInto();
    });
  }, [loadInto, replace, setMode]);

  // ---------- conflicts / other devices ----------
  const reloadFromServer = useCallback(async () => {
    conflictRef.current = false;
    dirtyRef.current = false;
    await loadInto();
  }, [loadInto]);

  const keepThisDevice = useCallback(async () => {
    const backend = backendRef.current;
    if (!backend) return;
    try {
      const remote = await backend.load();
      versionRef.current = remote?.version ?? null;
      conflictRef.current = false;
      dirtyRef.current = true;
      await save();
    } catch (e) {
      setSync({ status: 'offline', error: msg(e) });
    }
  }, [save]);

  // Back to the tab: pick up changes from other devices if nothing is waiting to be saved here.
  useEffect(() => {
    const refresh = async () => {
      const backend = backendRef.current;
      if (backend?.kind !== 'cloud' || modeRef.current !== 'live') return;
      // Leaving the tab / switching apps on the phone: save now instead of waiting.
      if (document.visibilityState === 'hidden') {
        if (dirtyRef.current && !conflictRef.current) void save();
        return;
      }
      if (dirtyRef.current) {
        if (!conflictRef.current) void save();
        return;
      }
      try {
        const remote = await backend.load();
        if (remote && remote.version !== versionRef.current && !dirtyRef.current) {
          versionRef.current = remote.version;
          replace(remote.data);
        }
      } catch {
        /* offline: keep what we have */
      }
    };
    const online = () => dirtyRef.current && void save();
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('online', online);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', online);
    };
  }, [replace, save]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current && modeRef.current === 'live' && backendRef.current?.kind === 'cloud') e.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []);

  const resetAll = useCallback(async () => {
    const backend = backendRef.current;
    try {
      await backend?.clear();
    } catch (e) {
      setSync({ status: 'offline', error: msg(e) });
      return;
    }
    versionRef.current = null;
    dirtyRef.current = false;
    conflictRef.current = false;
    replace(emptyData());
    setMode('setup');
  }, [replace, setMode]);

  const actions = useMemo(
    () =>
      makeActions({
        dispatch,
        change,
        setMode,
        replaceAndSave,
        resetAll,
        reloadFromServer,
        keepThisDevice,
        boot,
        setNotice,
        setSignInError,
      }),
    [change, setMode, replaceAndSave, resetAll, reloadFromServer, keepThisDevice, boot],
  );

  const value = useMemo<Store>(
    () => ({ data, mode, cloud: !!auth, user, sync, loadError, bootError, signInError, notice, actions }),
    [data, mode, user, sync, loadError, bootError, signInError, notice, actions],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore must be used inside <StoreProvider>');
  return s;
}
