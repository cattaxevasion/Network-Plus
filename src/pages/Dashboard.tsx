import { Link } from 'react-router-dom';
import { PHASES, TOTAL_DAYS, getPlanDay } from '../data/plan';
import { FlashcardLink, LevelChip, StatusChip } from '../components/ui';
import { ProgressStrip } from '../components/ProgressStrip';
import { ScoreChart } from '../components/ScoreChart';
import { formatDate } from '../lib/dates';
import { stepsFor } from '../lib/daySteps';
import { examForDay } from '../lib/exams';
import { dayStatus, summarize, unfinishedDays } from '../lib/progress';
import { UNIT_BY_ID, UNIT_NOUN_PLURAL } from '../lib/tracking';
import { REASON_LABELS } from '../lib/types';
import { objectiveStats, rankByWeakness } from '../lib/weakness';
import { useStore } from '../state/store';

export function Dashboard() {
  const { data } = useStore();
  const sum = summarize(data);
  const cur = sum.current;
  const plan = cur ? getPlanDay(cur)! : null;
  const steps = cur ? stepsFor(cur) : [];
  const done = cur ? new Set(data.days[cur]?.stepsDone ?? []) : new Set<string>();
  const isExamDay = plan && plan.phase !== 'video';
  const recorded = cur ? examForDay(data, cur) : undefined;

  const focus = rankByWeakness(objectiveStats(data))
    .filter((s) => s.level === 'weak' || s.level === 'moderate')
    .slice(0, 3);
  const unfinished = unfinishedDays(data).slice(0, 3);
  const recent = [...data.sessions].sort((a, b) => b.date.localeCompare(a.date) || b.day - a.day).slice(0, 4);

  return (
    <div className="page">
      {/* 1. What do I do now? */}
      {cur && plan ? (
        <section className="card today" aria-labelledby="today-title">
          <div className="eyebrow">
            Today · Day {cur} of {TOTAL_DAYS} · {PHASES[plan.phase].label}
          </div>
          <h1 id="today-title" className="task">
            {plan.sourceText.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </h1>
          <div className="meta">
            <StatusChip status={dayStatus(data, cur)} />
            <span className="num">
              {done.size} of {steps.length} steps done
            </span>
            {recorded && <span>Score recorded: {recorded.scorePct}%</span>}
          </div>
          <div className="step-meter" aria-hidden="true">
            {steps.map((s) => (
              <i key={s.key} className={done.has(s.key) ? 'on' : ''} />
            ))}
          </div>
          <div className="btn-row">
            <Link className="btn primary" to={`/day/${cur}`}>
              {done.size ? 'Continue' : 'Start'} Day {cur}
            </Link>
            {isExamDay && !recorded && (
              <Link className="btn" to={`/exams/new?day=${cur}`}>
                Record exam result
              </Link>
            )}
            <FlashcardLink />
          </div>
        </section>
      ) : (
        <section className="card today">
          <div className="eyebrow">All 60 days finished</div>
          <h1 className="task">You worked through the whole plan.</h1>
          <Link className="btn" to="/weak">
            Review weak areas
          </Link>
        </section>
      )}

      {/* 2. Where am I in the plan? */}
      <section className="card" aria-labelledby="progress-title">
        <div className="card-head">
          <h2 id="progress-title">60-day plan</h2>
          <Link to="/plan">Full plan</Link>
        </div>
        <p className="muted" style={{ marginBottom: 14 }}>
          <b className="num">{sum.finished}</b> of {TOTAL_DAYS} days done
          {sum.partial + sum.skipped > 0 && (
            <span className="faint">
              {' '}
              ({sum.completed} completed, {sum.partial} partial, {sum.skipped} skipped)
            </span>
          )}
          {cur && sum.offset > 0 && (
            <>
              {' '}
              · Calendar day {sum.calendar}. The plan moves with you — at one day per day you finish around{' '}
              {formatDate(sum.projectedFinish)}.
            </>
          )}
        </p>
        <ProgressStrip data={data} current={cur} calendar={sum.calendar} />
      </section>

      {/* 3. How am I doing? */}
      {data.exams.length === 0 ? (
        <section className="card" aria-labelledby="exams-title">
          <h2 id="exams-title">Practice exams &amp; weak areas</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            Practice exams start on Day 34. After each one, record the score and the {UNIT_NOUN_PLURAL} you got right and wrong;
            your scores and weak areas will show up here.
          </p>
        </section>
      ) : (
        <div className="grid-2">
          <section className="card" aria-labelledby="exams-title">
            <div className="card-head">
              <h2 id="exams-title">Practice exams</h2>
              <Link to="/exams">All exams</Link>
            </div>
            <ScoreChart exams={data.exams} height={170} />
          </section>
          <section className="card" aria-labelledby="focus-title">
            <div className="card-head">
              <h2 id="focus-title">Focus areas</h2>
              <Link to="/weak">All {UNIT_NOUN_PLURAL}</Link>
            </div>
            {focus.length === 0 ? (
              <div className="empty">Weak areas appear after your first practice exam.</div>
            ) : (
              <div className="list">
                {focus.map((s) => (
                  <Link key={s.objectiveId} to="/weak" className="list-row">
                    <b className="num" style={{ width: 32 }}>
                      {s.objectiveId}
                    </b>
                    <div className="grow">
                      <div className="title" style={{ fontWeight: 550 }}>
                        {UNIT_BY_ID[s.objectiveId].short}
                      </div>
                      <div className="sub">{s.reasons.join(' · ')}</div>
                    </div>
                    <LevelChip level={s.level} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* 4. Loose ends + recent log (low priority). Hidden while empty. */}
      {(unfinished.length > 0 || recent.length > 0) && (
        <div className={unfinished.length > 0 && recent.length > 0 ? 'grid-2' : ''}>
          {unfinished.length > 0 && (
            <section className="card" aria-labelledby="open-title">
              <div className="card-head">
                <h2 id="open-title">Unfinished days</h2>
              </div>
              {unfinished.length === 0 ? (
                <div className="empty">Nothing left behind.</div>
              ) : (
                <div className="list">
                  {unfinished.map((d) => (
                    <Link key={d.day} to={`/day/${d.day}`} className="list-row">
                      <div className="grow">
                        <div className="title">
                          Day {d.day} · {getPlanDay(d.day)!.sourceText.join(', ')}
                        </div>
                        <div className="sub">{d.reason ? REASON_LABELS[d.reason] : 'No reason noted'}</div>
                      </div>
                      <StatusChip status={d.status} />
                    </Link>
                  ))}
                </div>
              )}
              <p className="app-note" style={{ marginTop: 10 }}>
                Revisit these whenever it suits you. They never block the plan.
              </p>
            </section>
          )}
          {recent.length > 0 && (
            <section className="card" aria-labelledby="recent-title">
              <div className="card-head">
                <h2 id="recent-title">Recent study</h2>
              </div>
              {recent.length === 0 ? (
                <div className="empty">No study logged yet.</div>
              ) : (
                <div className="list">
                  {recent.map((s) => (
                    <Link key={s.id} to={`/day/${s.day}`} className="list-row">
                      <span className="faint num" style={{ width: 56 }}>
                        {formatDate(s.date)}
                      </span>
                      <div className="grow">
                        Day {s.day} · {getPlanDay(s.day)!.sourceText.join(', ')}
                      </div>
                      <StatusChip status={dayStatus(data, s.day)} />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
