// Exam form section for per-item question counts.
// Kept separate so the input method can be replaced in one place once the real
// practice exams are known. What the items are comes from src/config/practiceExam.ts.

import { DOMAINS } from '../data/objectives';
import { TRACK_BY, UNITS, UNIT_NOUN, UNIT_NOUN_PLURAL, unitsByDomain, type TrackingUnit } from '../lib/tracking';

export type Counts = Record<string, { correct: number; incorrect: number }>;

export function emptyCounts(): Counts {
  return Object.fromEntries(UNITS.map((u) => [u.id, { correct: 0, incorrect: 0 }]));
}

export function ResultCountsInput({ counts, onChange }: { counts: Counts; onChange: (c: Counts) => void }) {
  const set = (id: string, field: 'correct' | 'incorrect', v: number) =>
    onChange({ ...counts, [id]: { ...counts[id], [field]: Math.max(0, Math.min(99, Math.floor(v) || 0)) } });

  const totals = Object.values(counts).reduce(
    (a, c) => ({ correct: a.correct + c.correct, incorrect: a.incorrect + c.incorrect }),
    { correct: 0, incorrect: 0 },
  );
  const heading = UNIT_NOUN_PLURAL.charAt(0).toUpperCase() + UNIT_NOUN_PLURAL.slice(1);

  const row = (u: TrackingUnit) => (
    <div key={u.id} className="obj-row">
      <div className="name">
        <b>{u.id}</b>
        <span>{u.short}</span>
      </div>
      <Counter
        label="✓"
        tone="ok"
        value={counts[u.id].correct}
        onChange={(v) => set(u.id, 'correct', v)}
        name={`${u.id} correct`}
      />
      <Counter
        label="✗"
        tone="ng"
        value={counts[u.id].incorrect}
        onChange={(v) => set(u.id, 'incorrect', v)}
        name={`${u.id} incorrect`}
      />
    </div>
  );

  return (
    <section className="card" aria-labelledby="obj-title">
      <div className="card-head">
        <h2 id="obj-title">{heading}</h2>
        <span className="faint num">
          {totals.correct} correct · {totals.incorrect} incorrect
        </span>
      </div>
      <p className="faint" style={{ marginBottom: 12 }}>
        Count questions per {UNIT_NOUN} as correct (✓) or incorrect (✗). Tap +/− or type the number. {heading} left at 0 are not
        counted.
      </p>
      {TRACK_BY === 'domain' ? (
        <div className="domain-block">{UNITS.map(row)}</div>
      ) : (
        unitsByDomain().map(({ domain, units }) => {
          const dc = units.reduce((a, u) => a + counts[u.id].correct, 0);
          const di = units.reduce((a, u) => a + counts[u.id].incorrect, 0);
          return (
            <details key={domain} className="domain-block" open>
              <summary>
                <span>
                  {domain}.0 {DOMAINS[domain].name}
                </span>
                <span className="faint num">
                  ✓ {dc} · ✗ {di}
                </span>
              </summary>
              {units.map(row)}
            </details>
          );
        })
      )}
    </section>
  );
}

function Counter({
  label,
  tone,
  value,
  onChange,
  name,
}: {
  label: string;
  tone: 'ok' | 'ng';
  value: number;
  onChange: (v: number) => void;
  name: string;
}) {
  return (
    <div className="counter" role="group" aria-label={name}>
      <span className={`lab ${tone}`} aria-hidden="true">
        {label}
      </span>
      <button type="button" onClick={() => onChange(value - 1)} aria-label={`${name} minus one`} disabled={value === 0}>
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={99}
        value={value}
        aria-label={name}
        onFocus={(e) => e.target.select()}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <button type="button" onClick={() => onChange(value + 1)} aria-label={`${name} plus one`}>
        +
      </button>
    </div>
  );
}
