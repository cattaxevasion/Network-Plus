import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { PHASES, TOTAL_DAYS, getPlanDay } from '../data/plan';
import { GUIDES } from '../data/steps';
import { Check, FlashcardLink, StatusChip } from '../components/ui';
import { formatDate } from '../lib/dates';
import { stepsFor } from '../lib/daySteps';
import { examForDay } from '../lib/exams';
import { currentDay, dayStatus, isFinal } from '../lib/progress';
import { REASON_LABELS, STATUS_LABELS, type Reason } from '../lib/types';
import { useStore } from '../state/store';

type Outcome = 'completed' | 'partial' | 'skipped';

const OUTCOMES: Array<{ value: Outcome; hint: string }> = [
  { value: 'completed', hint: 'Did the plan' },
  { value: 'partial', hint: 'Did some of it' },
  { value: 'skipped', hint: "Didn't get to it" },
];

export function DayPage() {
  const { day: param } = useParams();
  const day = Number(param);
  const plan = getPlanDay(day);
  const { data, actions } = useStore();

  const rec = data.days[day];
  const status = dayStatus(data, day);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [reason, setReason] = useState<Reason | undefined>();
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(false);

  // Reset the form when navigating between days.
  useEffect(() => {
    setOutcome(null);
    setReason(undefined);
    setNote('');
    setEditing(false);
  }, [day]);

  if (!plan) return <Navigate to="/plan" replace />;

  const steps = stepsFor(day);
  const guide = GUIDES[plan.phase];
  const done = new Set(rec?.stepsDone ?? []);
  const exam = plan.phase !== 'video' ? examForDay(data, day) : undefined;
  const cur = currentDay(data);
  const finished = isFinal(status) && !editing;

  const save = () => {
    if (!outcome) return;
    actions.finishDay(day, outcome, outcome === 'completed' ? undefined : reason, note);
    setEditing(false);
    setOutcome(null);
  };

  const startEdit = () => {
    setOutcome((rec?.status as Outcome) ?? null);
    setReason(rec?.reason);
    setNote(rec?.note ?? '');
    setEditing(true);
  };

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div className="page-head">
        <div>
          <div className="faint">
            {PHASES[plan.phase].label}
            {day === cur && ' · Today'}
          </div>
          <h1>Day {day}</h1>
        </div>
        <div className="day-nav">
          <StatusChip status={status} />
          <Link
            className={`btn small ${day <= 1 ? 'disabled' : ''}`}
            to={`/day/${Math.max(1, day - 1)}`}
            aria-label="Previous day"
          >
            ←
          </Link>
          <Link className="btn small" to={`/day/${Math.min(TOTAL_DAYS, day + 1)}`} aria-label="Next day">
            →
          </Link>
        </div>
      </div>

      <div className="source">
        <div className="label">Study plan</div>
        <div className="text">
          {plan.sourceText.map((t) => (
            <div key={t}>{t}</div>
          ))}
        </div>
      </div>

      {/* Steps from the PDF */}
      <section aria-labelledby="steps-title">
        <div className="card-head">
          <h2 id="steps-title">Steps</h2>
          <span className="faint num">
            {done.size}/{steps.length}
          </span>
        </div>
        <div className="steps">
          {steps.map((s) => {
            const isDone = done.has(s.key);
            return (
              <div key={s.key} className="step-wrap">
                <button
                  type="button"
                  className={`step ${isDone ? 'done' : ''}`}
                  aria-pressed={isDone}
                  onClick={() => actions.toggleStep(day, s.key)}
                >
                  <span className="box">{isDone && <Check />}</span>
                  <span className="label">{s.label}</span>
                </button>
                {s.flashcards && <FlashcardLink className="btn small" label="Open" />}
                {s.recordsExam && (
                  <Link className="btn small" to={exam ? `/exams/${exam.id}` : `/exams/new?day=${day}`}>
                    {exam ? `${exam.scorePct}%` : 'Record'}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {guide.tips.length > 0 && (
        <details className="tips">
          <summary>Tips from the study plan</summary>
          <ul>
            {guide.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </details>
      )}

      {/* Wrap-up: status + reason, never framed as failure */}
      <section className="card" aria-labelledby="wrap-title">
        {finished ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="card-head" style={{ marginBottom: 0 }}>
              <h2 id="wrap-title">Marked {STATUS_LABELS[status].toLowerCase()}</h2>
              <span className="faint">{rec && formatDate(rec.updatedAt.slice(0, 10))}</span>
            </div>
            {rec?.reason && (
              <p>
                Reason: <b>{REASON_LABELS[rec.reason]}</b>
              </p>
            )}
            {rec?.note && <p className="note-box">{rec.note}</p>}
            <div className="btn-row">
              <button className="btn small" onClick={startEdit}>
                Change
              </button>
              <button className="btn small ghost" onClick={() => actions.reopenDay(day)}>
                Reopen day
              </button>
              {cur && cur !== day && (
                <Link className="btn small primary" to={`/day/${cur}`}>
                  Go to Day {cur}
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 id="wrap-title">How did Day {day} go?</h2>
            <div className="outcomes" role="radiogroup" aria-label="Day outcome">
              {OUTCOMES.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={outcome === o.value}
                  className={`outcome ${o.value} ${outcome === o.value ? 'sel' : ''}`}
                  onClick={() => setOutcome(o.value)}
                >
                  {STATUS_LABELS[o.value]}
                  <small>{o.hint}</small>
                </button>
              ))}
            </div>

            {outcome && outcome !== 'completed' && (
              <>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    What got in the way? <span className="faint">(optional)</span>
                  </div>
                  <div className="reasons">
                    {(Object.keys(REASON_LABELS) as Reason[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        className={`reason ${reason === r ? 'sel' : ''}`}
                        onClick={() => setReason(reason === r ? undefined : r)}
                      >
                        {REASON_LABELS[r]}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="app-note">
                  From the study plan: if the cause is in your control, change it (e.g. shorter sessions, another time or place).
                  If it isn't, let it go.
                </p>
              </>
            )}

            {outcome && (
              <label className="field">
                Note <span className="hint">What to change next time, what to revisit…</span>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} />
              </label>
            )}

            <div className="btn-row">
              <button className="btn primary" disabled={!outcome} onClick={save}>
                Save
              </button>
              {editing && (
                <button className="btn ghost" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              )}
            </div>
            {outcome && outcome !== 'completed' && (
              <p className="app-note">
                The plan moves on to the next day. This day stays in "Unfinished days" so you can come back to it.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
