import { PRACTICE_EXAM_CONFIG } from '../config/practiceExam';
import { Link } from 'react-router-dom';
import { DOMAINS, type Domain } from '../data/objectives';
import { LevelChip, pct } from '../components/ui';
import { formatDate } from '../lib/dates';
import { TRACK_BY, UNITS, UNIT_BY_ID, UNIT_NOUN_PLURAL } from '../lib/tracking';
import { LEVEL_LABELS, RULES, objectiveStats, rankByWeakness, type Level, type ObjectiveStat } from '../lib/weakness';
import { useStore } from '../state/store';

const LEVEL_COLOR: Record<Level, string> = {
  weak: 'var(--bad)',
  moderate: 'var(--warn)',
  strong: 'var(--good)',
  insufficient: 'var(--neutral)',
};

export function WeakAreasPage() {
  const { data } = useStore();
  const stats = objectiveStats(data);
  const counted = PRACTICE_EXAM_CONFIG.retakesCountForWeakAreas;
  const examCount = data.exams.filter((e) => counted || e.kind === 'first').length;
  const counts = (['weak', 'moderate', 'strong', 'insufficient'] as Level[]).map((l) => ({
    l,
    n: stats.filter((s) => s.level === l).length,
  }));
  const focus = rankByWeakness(stats).filter((s) => s.level === 'weak');

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Weak Areas</h1>
          <p className="muted">
            Based on {examCount} {counted ? '' : 'first-attempt '}practice exam{examCount === 1 ? '' : 's'} across the{' '}
            {UNITS.length} N10-009 {UNIT_NOUN_PLURAL}.
          </p>
        </div>
      </div>

      <div className="level-summary">
        {counts.map(({ l, n }) => (
          <div key={l} className="level-tile">
            <div className="n">{n}</div>
            <div className="l">
              <i style={{ background: LEVEL_COLOR[l] }} />
              {LEVEL_LABELS[l]}
            </div>
          </div>
        ))}
      </div>

      <details className="card rules">
        <summary>How the status is calculated</summary>
        <p style={{ marginTop: 8 }}>
          {counted
            ? 'First attempts and retakes both count. '
            : 'Only first attempts count, because retake scores are inflated by remembered answers (retake results are shown on each row for reference). '}
          "Last {RULES.recentWindow}" means the last {RULES.recentWindow} exams where the item appeared, so improvement or
          slipping shows up quickly. Rules are checked top to bottom:
        </p>
        <table>
          <tbody>
            <tr>
              <td>
                <LevelChip level="insufficient" />
              </td>
              <td>fewer than {RULES.minQuestions} questions so far</td>
            </tr>
            <tr>
              <td>
                <LevelChip level="weak" />
              </td>
              <td>
                overall accuracy or accuracy in the last {RULES.recentWindow} exams below {pct(RULES.weakAccuracy)}
              </td>
            </tr>
            <tr>
              <td>
                <LevelChip level="moderate" />
              </td>
              <td>
                overall accuracy or accuracy in the last {RULES.recentWindow} exams below {pct(RULES.moderateAccuracy)}
              </td>
            </tr>
            <tr>
              <td>
                <LevelChip level="strong" />
              </td>
              <td>everything else</td>
            </tr>
          </tbody>
        </table>
        <p className="app-note" style={{ marginTop: 8 }}>
          These thresholds are an app design choice, not part of the study plan. They are set in src/config/practiceExam.ts.
        </p>
      </details>

      {examCount === 0 && (
        <section className="card empty">
          No practice exam results yet. Levels appear after your first practice exam (Day 34).
        </section>
      )}

      {focus.length > 0 && (
        <section className="card" aria-labelledby="focus-title">
          <div className="card-head">
            <h2 id="focus-title">Focus now</h2>
            <span className="faint">Weakest first</span>
          </div>
          <div className="list">
            {focus.map((s) => (
              <StatRow key={s.objectiveId} s={s} />
            ))}
          </div>
        </section>
      )}

      {examCount === 0 ? null : TRACK_BY === 'domain' ? (
        <section className="card" aria-labelledby="dom-all">
          <div className="card-head">
            <h2 id="dom-all">By domain</h2>
          </div>
          <div className="list">
            {stats.map((s) => (
              <StatRow key={s.objectiveId} s={s} />
            ))}
          </div>
        </section>
      ) : (
        ([1, 2, 3, 4, 5] as Domain[]).map((d) => {
          const rows = stats.filter((s) => UNIT_BY_ID[s.objectiveId].domain === d);
          const c = rows.reduce((a, s) => a + s.correct, 0);
          const q = rows.reduce((a, s) => a + s.questions, 0);
          return (
            <section key={d} className="card" aria-labelledby={`dom-${d}`}>
              <div className="card-head">
                <h2 id={`dom-${d}`}>
                  {d}.0 {DOMAINS[d].name} <span className="faint">{DOMAINS[d].weight}% of exam</span>
                </h2>
                <span className="faint num">{q ? pct(c / q) : '—'}</span>
              </div>
              <div className="list">
                {rows.map((s) => (
                  <StatRow key={s.objectiveId} s={s} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

function StatRow({ s }: { s: ObjectiveStat }) {
  const o = UNIT_BY_ID[s.objectiveId];
  const slots = Array.from({ length: RULES.recentWindow }, (_, i) => s.recent[i - (RULES.recentWindow - s.recent.length)]);
  return (
    <div className="obj-stat">
      <div className="id">{o.id}</div>
      <div style={{ minWidth: 0 }}>
        <div className="t">
          {o.short}
          {TRACK_BY === 'objective' && (
            <Link className="topics-link" to={`/glossary?tab=objectives&obj=${o.id}`}>
              Topics
            </Link>
          )}
        </div>
        <div className="why">{s.reasons.join(' · ')}</div>
        {s.questions > 0 && (
          <div className="faint num" style={{ marginTop: 2 }}>
            {s.correct}/{s.questions} correct
            {s.retake.exams > 0 && (
              <>
                {' '}
                · retakes {s.retake.correct}/{s.retake.correct + s.retake.incorrect}
              </>
            )}
          </div>
        )}
      </div>
      <div className="right">
        <LevelChip level={s.level} />
        <div className="recent" aria-label={`Last ${RULES.recentWindow} exams, oldest to newest`}>
          {slots.map((a, i) =>
            a ? (
              <i
                key={i}
                className={a.incorrect > 0 ? 'miss' : 'hit'}
                title={`Exam #${a.examNo} (${formatDate(a.date)}): ${a.correct} correct, ${a.incorrect} incorrect`}
              />
            ) : (
              <i key={i} className="none" title="No data" />
            ),
          )}
          <span className="faint" style={{ marginLeft: 4, fontSize: '0.75rem' }}>
            last {RULES.recentWindow}
          </span>
        </div>
      </div>
    </div>
  );
}
