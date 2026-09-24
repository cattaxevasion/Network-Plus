import { Link } from 'react-router-dom';
import { PHASES, PLAN, type Phase } from '../data/plan';
import { StatusChip } from '../components/ui';
import { formatDate } from '../lib/dates';
import { examForDay } from '../lib/exams';
import { dayStatus, isFinal, summarize } from '../lib/progress';
import { REASON_LABELS } from '../lib/types';
import { useStore } from '../state/store';

export function PlanPage() {
  const { data } = useStore();
  const sum = summarize(data);
  const phases: Phase[] = ['video', 'exam', 'retake'];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>60-Day Plan</h1>
          <p className="muted">
            From the Dion Training N10-009 Study Plan. Started{' '}
            {formatDate(data.settings.startDate, { month: 'short', day: 'numeric', year: 'numeric' })}.
          </p>
        </div>
        {sum.current && (
          <button
            className="btn small"
            onClick={() => document.getElementById(`day-${sum.current}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          >
            Jump to Day {sum.current}
          </button>
        )}
      </div>

      {phases.map((ph) => {
        const days = PLAN.filter((p) => p.phase === ph);
        const finished = days.filter((p) => isFinal(dayStatus(data, p.day))).length;
        return (
          <section key={ph} className="card" aria-labelledby={`ph-${ph}`}>
            <div className="phase-head">
              <h2 id={`ph-${ph}`}>
                {PHASES[ph].label}{' '}
                <span className="faint">
                  Day {PHASES[ph].range[0]}–{PHASES[ph].range[1]}
                </span>
              </h2>
              <span className="faint num">
                {finished}/{days.length}
              </span>
            </div>
            <div className="phase-bar">
              <i style={{ width: `${(finished / days.length) * 100}%` }} />
            </div>
            <div className="list">
              {days.map((p) => {
                const s = dayStatus(data, p.day);
                const rec = data.days[p.day];
                const exam = ph !== 'video' ? examForDay(data, p.day) : undefined;
                const isCur = p.day === sum.current;
                return (
                  <Link
                    key={p.day}
                    id={`day-${p.day}`}
                    to={`/day/${p.day}`}
                    className={`list-row day-row ${isCur ? 'is-current' : ''}`}
                  >
                    <div className="day-num">
                      Day {p.day}
                      {isCur && <small>Today</small>}
                    </div>
                    <div className="grow">
                      <div className="title" style={{ fontWeight: 550 }}>
                        {p.sourceText.join(' · ')}
                      </div>
                      {(exam || rec?.reason) && (
                        <div className="sub">
                          {exam && (
                            <>
                              Exam #{exam.examNo}
                              {exam.kind === 'retake' ? ' (retake)' : ''} · {exam.scorePct}%
                            </>
                          )}
                          {exam && rec?.reason && ' · '}
                          {rec?.reason && REASON_LABELS[rec.reason]}
                        </div>
                      )}
                    </div>
                    {s !== 'not_started' && <StatusChip status={s} />}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
