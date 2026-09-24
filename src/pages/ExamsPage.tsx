import { Link, useNavigate } from 'react-router-dom';
import { ScoreChart } from '../components/ScoreChart';
import { ObjChip } from '../components/ui';
import { formatDate } from '../lib/dates';
import { UNIT_NOUN, UNIT_NOUN_PLURAL } from '../lib/tracking';
import { objectiveLists } from '../lib/exams';
import { sortExams } from '../lib/weakness';
import { useStore } from '../state/store';

export function ExamsPage() {
  const { data, actions } = useStore();
  const nav = useNavigate();
  const exams = sortExams(data.exams).reverse();
  const firsts = data.exams.filter((e) => e.kind === 'first');
  const retakes = data.exams.filter((e) => e.kind === 'retake');
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
  const toReview = data.exams.filter((e) => !e.reviewed).length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Practice Exams</h1>
          <p className="muted">
            {firsts.length} taken · {retakes.length} retakes
            {avg(firsts.map((e) => e.scorePct)) !== null && <> · first-attempt average {avg(firsts.map((e) => e.scorePct))}%</>}
            {toReview > 0 && (
              <>
                {' '}
                · <b>{toReview} to review</b>
              </>
            )}
          </p>
        </div>
        <Link className="btn primary" to="/exams/new">
          Record exam
        </Link>
      </div>

      <section className="card" aria-labelledby="trend-title">
        <div className="card-head">
          <h2 id="trend-title">Scores</h2>
        </div>
        <ScoreChart exams={data.exams} />
      </section>

      <section className="card" aria-labelledby="chart-title">
        <div className="card-head">
          <h2 id="chart-title">Tracking chart</h2>
          <span className="faint">Correct / incorrect answers per item, as in the study plan</span>
        </div>
        {exams.length === 0 ? (
          <div className="empty">Record your first practice exam to start the chart.</div>
        ) : (
          <>
            <table className="table exams">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Incorrect {UNIT_NOUN_PLURAL}</th>
                  <th>Reviewed</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((e) => {
                  const lists = objectiveLists(data, e.id);
                  return (
                    <tr key={e.id} className="link-row" onClick={() => nav(`/exams/${e.id}`)}>
                      <td className="nw">
                        <b>#{e.examNo}</b>
                        <div className="faint">
                          {e.kind === 'retake' ? 'Retake' : 'First attempt'}
                          {e.planDay ? ` · Day ${e.planDay}` : ''}
                        </div>
                      </td>
                      <td className="num nw">{formatDate(e.date)}</td>
                      <td>
                        <span className="score">{e.scorePct}%</span>
                      </td>
                      <td>
                        <div className="chips">
                          {lists.incorrect.length ? (
                            lists.incorrect.map((id) => <ObjChip key={id} id={id} tone="weak" />)
                          ) : (
                            <span className="faint">None</span>
                          )}
                        </div>
                        <div className="faint" style={{ marginTop: 4 }}>
                          {lists.correct.length} {lists.correct.length === 1 ? UNIT_NOUN : UNIT_NOUN_PLURAL} with correct answers
                        </div>
                      </td>
                      <td onClick={(ev) => ev.stopPropagation()}>
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={e.reviewed}
                            onChange={(ev) => actions.setReviewed(e.id, ev.target.checked)}
                            style={{ width: 20, height: 20 }}
                          />
                          {e.reviewed ? 'Done' : 'To do'}
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile: cards instead of a wide table */}
            <div className="exam-cards list">
              {exams.map((e) => {
                const lists = objectiveLists(data, e.id);
                return (
                  <Link key={e.id} to={`/exams/${e.id}`} className="list-row" style={{ alignItems: 'flex-start' }}>
                    <div className="grow">
                      <div className="title">
                        #{e.examNo} {e.kind === 'retake' && <span className="faint">retake</span>}{' '}
                        <span className="faint">· {formatDate(e.date)}</span>
                      </div>
                      <div className="chips" style={{ marginTop: 6 }}>
                        {lists.incorrect.map((id) => (
                          <ObjChip key={id} id={id} tone="weak" />
                        ))}
                      </div>
                      {!e.reviewed && (
                        <div className="sub" style={{ marginTop: 6 }}>
                          Review not done yet
                        </div>
                      )}
                    </div>
                    <span className="score">{e.scorePct}%</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
