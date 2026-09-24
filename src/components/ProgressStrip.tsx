import { Link } from 'react-router-dom';
import { PHASES, PLAN, type Phase } from '../data/plan';
import { dayStatus } from '../lib/progress';
import { STATUS_LABELS, type AppData } from '../lib/types';

/** 60 cells grouped by the PDF's three phases. Tapping a cell opens that day. */
export function ProgressStrip({ data, current, calendar }: { data: AppData; current: number | null; calendar: number }) {
  const phases: Phase[] = ['video', 'exam', 'retake'];
  return (
    <div>
      <div className="strip">
        {phases.map((ph) => {
          const days = PLAN.filter((p) => p.phase === ph);
          return (
            <div key={ph} className="strip-phase" style={{ flex: days.length }}>
              <div className="label">
                {PHASES[ph].label} · Day {PHASES[ph].range[0]}–{PHASES[ph].range[1]}
              </div>
              <div className="strip-cells" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
                {days.map((p) => {
                  const s = dayStatus(data, p.day);
                  const cls = ['cell', s, p.day === current ? 'current' : '', p.day === calendar ? 'calendar' : ''].join(' ');
                  return (
                    <Link
                      key={p.day}
                      to={`/day/${p.day}`}
                      className={cls}
                      title={`Day ${p.day}: ${p.sourceText.join(', ')} — ${STATUS_LABELS[s]}`}
                      aria-label={`Day ${p.day}, ${STATUS_LABELS[s]}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="legend">
        <span>
          <i style={{ background: 'var(--good)' }} />
          Completed
        </span>
        <span>
          <i style={{ background: 'var(--warn)' }} />
          Partial
        </span>
        <span>
          <i style={{ background: 'repeating-linear-gradient(135deg, var(--neutral) 0 2px, var(--empty) 2px 5px)' }} />
          Skipped
        </span>
        <span>
          <i style={{ background: 'var(--accent)' }} />
          In progress
        </span>
        <span>
          <i style={{ background: 'var(--empty)' }} />
          Not started
        </span>
        <span>
          <i style={{ outline: '2px solid var(--text)', background: 'transparent' }} />
          You are here
        </span>
        <span>▲ Calendar day</span>
      </div>
    </div>
  );
}
