import { useStore } from '../state/store';
import { STATUS_LABELS, type DayStatus } from '../lib/types';
import { LEVEL_LABELS, type Level } from '../lib/weakness';

export function StatusChip({ status }: { status: DayStatus }) {
  return (
    <span className={`chip ${status}`}>
      <span className="dot" />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function LevelChip({ level }: { level: Level }) {
  return (
    <span className={`chip ${level}`}>
      <span className="dot" />
      {LEVEL_LABELS[level]}
    </span>
  );
}

export function ObjChip({ id, tone }: { id: string; tone?: 'weak' | 'strong' }) {
  return <span className={`chip obj ${tone ?? ''}`}>{id}</span>;
}

/** External flashcard app link (Anki, Quizlet, ...). The app does not manage flashcards itself. */
export function FlashcardLink({ className = 'btn', label }: { className?: string; label?: string }) {
  const { data } = useStore();
  const { flashcardUrl, flashcardLabel } = data.settings;
  if (!flashcardUrl) return null;
  return (
    <a className={className} href={flashcardUrl} target="_blank" rel="noreferrer">
      {label ?? `Open ${flashcardLabel || 'flashcards'}`}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" />
      </svg>
    </a>
  );
}

export function Check() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5 10 17l9-10" />
    </svg>
  );
}

export const pct = (x: number | null) => (x === null ? '—' : `${Math.round(x * 100)}%`);
