import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ResultCountsInput, emptyCounts, type Counts } from '../components/ResultCountsInput';
import { getPlanDay } from '../data/plan';
import { newId, todayISO } from '../lib/dates';
import { nextExamNo, resultsFor, retakeCandidates } from '../lib/exams';
import { UNIT_BY_ID } from '../lib/tracking';
import type { ExamKind, PracticeExam } from '../lib/types';
import { useStore } from '../state/store';

export function ExamFormPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { data, actions } = useStore();

  const existing = id ? data.exams.find((e) => e.id === id) : undefined;
  const dayParam = Number(params.get('day')) || undefined;
  const planDay = existing?.planDay ?? dayParam;
  const phase = planDay ? getPlanDay(planDay)?.phase : undefined;
  const candidates = useMemo(() => retakeCandidates(data), [data]);

  const [kind, setKind] = useState<ExamKind>(existing?.kind ?? (phase === 'retake' ? 'retake' : 'first'));
  const [examNo, setExamNo] = useState<number>(
    existing?.examNo ?? (phase === 'retake' && candidates[0] ? candidates[0].examNo : nextExamNo(data)),
  );
  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [score, setScore] = useState(existing ? String(existing.scorePct) : '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [reviewed, setReviewed] = useState(existing?.reviewed ?? false);
  const [counts, setCounts] = useState<Counts>(() => {
    const init = emptyCounts();
    if (existing)
      for (const r of resultsFor(data, existing.id))
        if (UNIT_BY_ID[r.objectiveId]) init[r.objectiveId] = { correct: r.correct, incorrect: r.incorrect };
    return init;
  });

  const totals = Object.values(counts).reduce(
    (a, c) => ({ correct: a.correct + c.correct, incorrect: a.incorrect + c.incorrect }),
    { correct: 0, incorrect: 0 },
  );
  const answered = totals.correct + totals.incorrect;
  const derived = answered ? Math.round((totals.correct / answered) * 100) : null;
  const scoreNum = Number(score);
  const valid = score !== '' && scoreNum >= 0 && scoreNum <= 100 && examNo > 0 && !!date;

  const save = () => {
    if (!valid) return;
    const exam: PracticeExam = {
      id: existing?.id ?? newId(),
      examNo,
      kind,
      planDay,
      date,
      scorePct: Math.round(scoreNum),
      notes: notes.trim() || undefined,
      reviewed,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    actions.saveExam(
      exam,
      Object.entries(counts).map(([objectiveId, c]) => ({ examId: exam.id, objectiveId, ...c })),
    );
    // Recording results is itself a PDF step ("Make a list of the objectives…"): tick it.
    if (planDay && !data.days[planDay]?.stepsDone.includes('record')) actions.toggleStep(planDay, 'record');
    nav(planDay && !existing ? `/day/${planDay}` : '/exams');
  };

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <div>
          <div className="faint">{planDay ? `Day ${planDay}` : 'Practice exam'}</div>
          <h1>{existing ? `Exam #${existing.examNo}` : 'Record exam result'}</h1>
        </div>
        <Link className="btn small ghost" to={planDay && !existing ? `/day/${planDay}` : '/exams'}>
          Cancel
        </Link>
      </div>

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="seg" role="radiogroup" aria-label="Attempt type">
          {(['first', 'retake'] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              className={kind === k ? 'sel' : ''}
              onClick={() => setKind(k)}
            >
              {k === 'first' ? 'First attempt' : 'Retake'}
            </button>
          ))}
        </div>

        {kind === 'retake' && candidates.length > 0 && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Which exam are you retaking?</div>
            <div className="reasons">
              {candidates.map((c) => (
                <button
                  key={c.examNo}
                  type="button"
                  className={`reason ${examNo === c.examNo ? 'sel' : ''}`}
                  onClick={() => setExamNo(c.examNo)}
                >
                  #{c.examNo} · {c.firstScore}%{c.retakes ? ` · retaken ${c.retakes}×` : ''}
                </button>
              ))}
            </div>
            <p className="app-note" style={{ marginTop: 8 }}>
              Suggested order (app rule): exams retaken fewer times first, then lowest first-attempt score.
            </p>
          </div>
        )}

        <div className="form-grid">
          <label className="field">
            Exam #
            <input type="number" min={1} value={examNo} onChange={(e) => setExamNo(Number(e.target.value))} />
          </label>
          <label className="field">
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field">
            Score (%)
            <input
              type="number"
              min={0}
              max={100}
              inputMode="numeric"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="e.g. 78"
            />
          </label>
        </div>
        {derived !== null && String(derived) !== score && (
          <p className="faint">
            From objective counts: {totals.correct}/{answered} = {derived}%.{' '}
            <button className="btn small ghost" style={{ minHeight: 0, padding: 0 }} onClick={() => setScore(String(derived))}>
              Use this
            </button>
          </p>
        )}
      </section>

      <ResultCountsInput counts={counts} onChange={setCounts} />

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label className="field">
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Brain dump changes, timing, patterns in mistakes…"
          />
        </label>
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: 600, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={reviewed}
            onChange={(e) => setReviewed(e.target.checked)}
            style={{ width: 20, height: 20 }}
          />
          Incorrect questions reviewed (explanations read, added to flashcards / study guide)
        </label>
      </section>

      <div className="sticky-save">
        {existing && (
          <button
            className="btn danger"
            onClick={() => {
              if (window.confirm(`Delete exam #${existing.examNo}?`)) {
                actions.deleteExam(existing.id);
                nav('/exams');
              }
            }}
          >
            Delete
          </button>
        )}
        <button className="btn primary" disabled={!valid} onClick={save}>
          Save exam
        </button>
      </div>
    </div>
  );
}
