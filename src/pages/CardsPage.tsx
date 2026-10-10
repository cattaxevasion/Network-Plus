import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StackBar } from '../components/StackBar';
import { FlashcardLink } from '../components/ui';
import { OBJECTIVES, shortTitle } from '../data/objectives';
import {
  BUCKET_LABELS,
  DECK_LABELS,
  bucketCounts,
  bucketOf,
  deckCards,
  previousCardDay,
  previousPlanDay,
  unlockedDay,
  type DeckId,
} from '../lib/cards';
import { PackImport } from '../components/PackImport';
import { formatDate, newId, todayISO } from '../lib/dates';
import type { Flashcard } from '../lib/types';
import { useStore } from '../state/store';

const SIZES = [10, 20, 50, 0] as const; // 0 = all

export function CardsPage() {
  const { data, actions } = useStore();
  const [params, setParams] = useSearchParams();
  const today = todayISO();
  const [size, setSize] = useState<number>(20);

  const all = deckCards(data, 'all', today);
  const allCounts = bucketCounts(all, data.cardStates);
  const toGo = all.length - allCounts.knew;
  const prevDay = previousCardDay(data, today);
  const prevCards = deckCards(data, 'previous', today);
  const prevPlanDay = previousPlanDay(data, today);
  const guideTotal = data.cards.filter((c) => c.source === 'guide').length;
  const upTo = unlockedDay(data);

  const studyLink = (deck: DeckId, extra = '') => `/cards/study?deck=${deck}&size=${size}${extra}`;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Flashcards</h1>
          <p className="muted">
            Sort each card by how quickly you knew the answer, until every card is in "Knew it right away" (Study Plan p.7–8).
          </p>
        </div>
        <FlashcardLink className="btn small ghost" />
      </div>

      <section className="card study-now" aria-labelledby="study-title">
        <div className="card-head">
          <h2 id="study-title">Study</h2>
          <span className="faint num">
            {toGo} of {all.length} not yet in "Knew it"
          </span>
        </div>
        <StackBar counts={allCounts} />
        <div className="study-actions">
          <label className="inline-field">
            Cards per round
            <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
              {SIZES.map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? 'All' : n}
                </option>
              ))}
            </select>
          </label>
          <div className="btn-row">
            {toGo > 0 ? (
              <Link className="btn primary" to={studyLink('all')}>
                Study weakest first
              </Link>
            ) : (
              <Link className="btn primary" to={studyLink('all', '&known=1')}>
                Review known cards
              </Link>
            )}
            {prevCards.length > 0 && (
              <Link className="btn" to={studyLink('previous', '&known=1')}>
                Previous day's cards ({prevCards.length})
              </Link>
            )}
          </div>
        </div>
        {(prevDay || prevPlanDay) && (
          <p className="app-note">
            "Previous day's cards" (Study Plan p.4):
            {prevPlanDay && ` study-guide cards for Day ${prevPlanDay}, the plan day you finished last`}
            {prevPlanDay && prevDay && ', and'}
            {prevDay && ` the cards you made on ${formatDate(prevDay)}`}.
          </p>
        )}
      </section>

      <div className="deck-grid">
        {(['guide', 'acronyms', 'ports', 'mine'] as const).map((d) => {
          const cards = deckCards(data, d, today);
          const counts = bucketCounts(cards, data.cardStates);
          return (
            <section key={d} className="card deck" aria-labelledby={`deck-${d}`}>
              <div className="card-head">
                <h2 id={`deck-${d}`}>{DECK_LABELS[d]}</h2>
                <span className="faint num">{cards.length}</span>
              </div>
              <StackBar counts={counts} legend={false} />
              <div className="faint" style={{ margin: '8px 0 12px' }}>
                {counts.knew} known · {cards.length - counts.knew} to go
                {(d === 'acronyms' || d === 'ports') && ' · official N10-009 list'}
                {d === 'guide' && guideTotal > 0 && ` · up to Day ${upTo} (${guideTotal - cards.length} still locked)`}
              </div>
              <div className="btn-row">
                {cards.length > 0 ? (
                  <Link className="btn small" to={studyLink(d, counts.knew === cards.length ? '&known=1' : '')}>
                    Study
                  </Link>
                ) : d === 'guide' ? null : (
                  <button className="btn small" onClick={() => setParams({ add: '1' })}>
                    Add your first card
                  </button>
                )}
                {d === 'guide' && <PackImport onImport={actions.importPack} compact={guideTotal > 0} />}
                {(d === 'acronyms' || d === 'ports') && (
                  <Link className="btn small ghost" to={`/glossary?tab=${d}`}>
                    Browse
                  </Link>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <MyCards
        cards={data.cards.filter((c) => c.source !== 'guide')}
        states={data.cardStates}
        focusAdd={params.get('add') === '1'}
        onSave={actions.saveCard}
        onDelete={actions.deleteCard}
      />
    </div>
  );
}

function MyCards({
  cards,
  states,
  focusAdd,
  onSave,
  onDelete,
}: {
  cards: Flashcard[];
  states: Record<string, import('../lib/types').CardState>;
  focusAdd: boolean;
  onSave: (c: Flashcard) => void;
  onDelete: (id: string) => void;
}) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [objectiveId, setObjectiveId] = useState('');
  const [editing, setEditing] = useState<Flashcard | null>(null);
  const [filter, setFilter] = useState('');
  const frontRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (focusAdd) {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      frontRef.current?.focus();
    }
  }, [focusAdd]);

  const canSave = front.trim() && back.trim();
  const reset = () => {
    setFront('');
    setBack('');
    setEditing(null);
    frontRef.current?.focus();
  };
  const submit = () => {
    if (!canSave) return;
    onSave({
      id: editing?.id ?? newId(),
      front: front.trim(),
      back: back.trim(),
      objectiveId: objectiveId || undefined,
      createdOn: editing?.createdOn ?? todayISO(),
    });
    reset(); // keep the objective selected for the next card
  };
  const startEdit = (c: Flashcard) => {
    setEditing(c);
    setFront(c.front);
    setBack(c.back);
    setObjectiveId(c.objectiveId ?? '');
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    frontRef.current?.focus();
  };

  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = cards
      .filter((c) => !q || c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q) || c.objectiveId === q)
      .sort((a, b) => b.createdOn.localeCompare(a.createdOn));
    const m = new Map<string, Flashcard[]>();
    for (const c of list) m.set(c.createdOn, [...(m.get(c.createdOn) ?? []), c]);
    return [...m.entries()];
  }, [cards, filter]);

  // Ctrl/Cmd+Enter saves from either field.
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <section className="card" aria-labelledby="mine-title" ref={formRef}>
      <div className="card-head">
        <h2 id="mine-title">{editing ? 'Edit card' : 'Make a card'}</h2>
      </div>
      <p className="faint" style={{ marginBottom: 12 }}>
        Study Plan p.8: keep the answer short and always on the same side. Ctrl+Enter saves.
      </p>
      <div className="card-form">
        <label className="field">
          Front (question)
          <textarea
            ref={frontRef}
            rows={2}
            value={front}
            onChange={(e) => setFront(e.target.value)}
            onKeyDown={onKey}
            placeholder="e.g. Default administrative distance of OSPF"
          />
        </label>
        <label className="field">
          Back (short answer)
          <textarea rows={2} value={back} onChange={(e) => setBack(e.target.value)} onKeyDown={onKey} placeholder="e.g. 110" />
        </label>
        <label className="field">
          Objective <span className="hint">optional</span>
          <select value={objectiveId} onChange={(e) => setObjectiveId(e.target.value)}>
            <option value="">None</option>
            {OBJECTIVES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id} {shortTitle(o)}
              </option>
            ))}
          </select>
        </label>
        <div className="btn-row">
          <button className="btn primary" disabled={!canSave} onClick={submit}>
            {editing ? 'Save changes' : 'Add card'}
          </button>
          {editing && (
            <button className="btn ghost" onClick={reset}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="card-head" style={{ marginTop: 24 }}>
        <h2>My cards</h2>
        <span className="faint num">{cards.length}</span>
      </div>
      {cards.length === 0 ? (
        <div className="empty">No cards yet. Make one while you watch today's videos.</div>
      ) : (
        <>
          <input
            type="search"
            className="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search my cards…"
            aria-label="Search my cards"
            style={{ marginBottom: 8 }}
          />
          {groups.map(([date, list]) => (
            <div key={date} className="letter-group">
              <div className="letter-head">Made {formatDate(date, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
              {list.map((c) => {
                const b = bucketOf(states, c.id);
                return (
                  <div key={c.id} className="mycard-row">
                    <div className="grow">
                      <div className="mc-front">{c.front}</div>
                      <div className="mc-back">{c.back}</div>
                    </div>
                    <div className="mc-meta">
                      {c.objectiveId && <span className="chip obj">{c.objectiveId}</span>}
                      <span className={`chip bucket ${b}`}>{BUCKET_LABELS[b]}</span>
                      <button className="btn small ghost" onClick={() => startEdit(c)}>
                        Edit
                      </button>
                      <button
                        className="btn small ghost danger"
                        onClick={() => window.confirm('Delete this card?') && onDelete(c.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </>
      )}
    </section>
  );
}
