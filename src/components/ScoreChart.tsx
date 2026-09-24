import { useEffect, useRef, useState } from 'react';
import { formatDate } from '../lib/dates';
import type { PracticeExam } from '../lib/types';
import { sortExams } from '../lib/weakness';

/**
 * Practice exam scores in the order they were taken.
 * Two series: first attempts (blue) and retakes (orange). Hover a point for details.
 * The exam table on the same page is the table view of this chart.
 */
export function ScoreChart({ exams, height = 200 }: { exams: PracticeExam[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [exams.length === 0]);

  const list = sortExams(exams);
  if (list.length === 0) return <div className="empty">No practice exams yet.</div>;

  const H = height;
  const pad = { l: 36, r: 16, t: 16, b: 28 };
  const scores = list.map((e) => e.scorePct);
  const yMin = Math.max(0, Math.floor((Math.min(...scores) - 10) / 10) * 10);
  const yMax = 100;
  const x = (i: number) => pad.l + (list.length === 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (list.length - 1));
  const y = (v: number) => pad.t + ((yMax - v) * (H - pad.t - pad.b)) / (yMax - yMin);
  const step = yMax - yMin > 50 ? 20 : 10;
  const ticks = Array.from({ length: Math.floor((yMax - yMin) / step) + 1 }, (_, i) => yMax - i * step);

  const series = (['first', 'retake'] as const).map((kind) => ({
    kind,
    pts: list.map((e, i) => ({ e, i })).filter(({ e }) => e.kind === kind),
  }));
  const hasRetakes = series[1].pts.length > 0;

  return (
    <div className="chart" ref={ref}>
      <div className="legend" style={{ marginTop: 0, marginBottom: 8 }}>
        <span>
          <i className="swatch" style={{ background: '#2a78d6' }} />
          First attempt
        </span>
        {hasRetakes && (
          <span>
            <i className="swatch" style={{ background: '#eb6834' }} />
            Retake
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Practice exam scores over time">
        <g className="grid">
          {ticks.map((t) => (
            <line key={t} x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} />
          ))}
        </g>
        <g className="axis">
          {ticks.map((t) => (
            <text key={t} x={pad.l - 8} y={y(t) + 4} textAnchor="end">
              {t}
            </text>
          ))}
          {list.map((e, i) => (
            <text key={e.id} x={x(i)} y={H - 8} textAnchor="middle">
              #{e.examNo}
            </text>
          ))}
        </g>
        {series.map(({ kind, pts }) =>
          pts.length ? (
            <g key={kind} className={kind}>
              <polyline
                fill="none"
                strokeWidth="2"
                strokeLinejoin="round"
                points={pts.map(({ e, i }) => `${x(i)},${y(e.scorePct)}`).join(' ')}
                style={{ fill: 'none' }}
              />
              {pts.map(({ e, i }) => (
                <g key={e.id}>
                  <circle cx={x(i)} cy={y(e.scorePct)} r="5" />
                  <circle className="hit" cx={x(i)} cy={y(e.scorePct)} r="14">
                    <title>{`Exam #${e.examNo} (${kind === 'first' ? 'first attempt' : 'retake'}) · ${formatDate(e.date)} · ${e.scorePct}%`}</title>
                  </circle>
                </g>
              ))}
              {(() => {
                const last = pts[pts.length - 1];
                return (
                  <text className="dlabel" x={x(last.i)} y={y(last.e.scorePct) - 10} textAnchor="middle">
                    {last.e.scorePct}%
                  </text>
                );
              })()}
            </g>
          ) : null,
        )}
      </svg>
    </div>
  );
}
