import { BUCKET_LABELS, BUCKET_ORDER, type Bucket } from '../lib/cards';

/** Horizontal bar of how many cards sit in each stack, with a labelled legend (never color alone). */
export function StackBar({ counts, legend = true }: { counts: Record<Bucket, number>; legend?: boolean }) {
  const total = BUCKET_ORDER.reduce((a, b) => a + counts[b], 0);
  return (
    <div className="stackbar-wrap">
      <div className="stackbar" role="img" aria-label={BUCKET_ORDER.map((b) => `${BUCKET_LABELS[b]} ${counts[b]}`).join(', ')}>
        {total === 0 ? (
          <i className="seg new" style={{ flex: 1 }} />
        ) : (
          BUCKET_ORDER.filter((b) => counts[b] > 0).map((b) => (
            <i key={b} className={`seg ${b}`} style={{ flex: counts[b] }} title={`${BUCKET_LABELS[b]}: ${counts[b]}`} />
          ))
        )}
      </div>
      {legend && (
        <div className="stack-legend">
          {BUCKET_ORDER.map((b) => (
            <span key={b}>
              <i className={`sw ${b}`} />
              {BUCKET_LABELS[b]} <b className="num">{counts[b]}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
