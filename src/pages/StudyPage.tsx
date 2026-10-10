import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DECK_LABELS, buildSession, deckCards, type Card, type DeckId } from '../lib/cards';
import { todayISO } from '../lib/dates';
import { STACK_LABELS, type Stack } from '../lib/types';
import { useStore } from '../state/store';

const DECKS: DeckId[] = ['all', 'acronyms', 'ports', 'guide', 'mine', 'previous'];
// Best to worst, numbered 1–4 for the keyboard.
const RATINGS: Stack[] = ['knew', 'moment', 'while', 'looked'];

export function StudyPage() {
  const { data, actions } = useStore();
  const [params] = useSearchParams();
  const deck = (DECKS.find((d) => d === params.get('deck')) ?? 'all') as DeckId;
  const size = Number(params.get('size') ?? 20);
  const includeKnown = params.get('known') === '1';
  const objective = params.get('obj') ?? undefined;
  const planDay = Number(params.get('day')) || undefined;
  const pick = (cards: Card[]) => (planDay ? cards.filter((c) => c.day === planDay) : cards);

  // Always build a round from the latest stacks (ratings from the previous round included).
  const dataRef = useRef(data);
  dataRef.current = data;
  const makeRound = (known: boolean) => {
    const d = dataRef.current;
    const cards = pick(deckCards(d, deck, todayISO(), objective));
    return buildSession(cards, d.cardStates, size > 0 ? size : cards.length, known);
  };

  const [known, setKnown] = useState(includeKnown);
  const [round, setRound] = useState<Card[]>(() => makeRound(includeKnown));
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [tally, setTally] = useState<Record<Stack, number>>({ knew: 0, moment: 0, while: 0, looked: 0 });

  const card = round[i];
  const done = i >= round.length;

  const rate = useCallback(
    (s: Stack) => {
      if (!card || !shown) return;
      actions.rateCard(card.id, s);
      setTally((t) => ({ ...t, [s]: t[s] + 1 }));
      setShown(false);
      setI((n) => n + 1);
    },
    [card, shown, actions],
  );

  const restart = (k: boolean) => {
    setKnown(k);
    setRound(makeRound(k));
    setI(0);
    setShown(false);
    setTally({ knew: 0, moment: 0, while: 0, looked: 0 });
  };

  // Keyboard: Space/Enter flips, 1–4 rate.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || (e.target as HTMLElement)?.tagName === 'SELECT') return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setShown(true);
      }
      const n = Number(e.key);
      if (n >= 1 && n <= 4) rate(RATINGS[n - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rate, done]);

  const title = DECK_LABELS[deck] + (planDay ? ` · Day ${planDay}` : '') + (objective ? ` · ${objective}` : '');

  if (round.length === 0) {
    const anyCards = pick(deckCards(data, deck, todayISO(), objective)).length > 0;
    return (
      <div className="page study">
        <StudyHead title={title} />
        <section className="card empty">
          {anyCards ? (
            <>
              <p>Every card here is in "Knew it right away".</p>
              <div className="btn-row" style={{ justifyContent: 'center', marginTop: 12 }}>
                <button className="btn primary" onClick={() => restart(true)}>
                  Review them anyway
                </button>
                <Link className="btn" to="/cards">
                  Back to cards
                </Link>
              </div>
            </>
          ) : (
            <>
              <p>No cards in this deck yet.</p>
              <Link className="btn" to="/cards?add=1" style={{ marginTop: 12 }}>
                Make a card
              </Link>
            </>
          )}
        </section>
      </div>
    );
  }

  if (done) {
    return (
      <div className="page study">
        <StudyHead title={title} />
        <section className="card">
          <h2>Round done: {round.length} cards</h2>
          <div className="tally">
            {RATINGS.map((s) => (
              <div key={s} className={`tally-row ${s}`}>
                <i className={`sw ${s}`} />
                <span className="grow">{STACK_LABELS[s]}</span>
                <b className="num">{tally[s]}</b>
              </div>
            ))}
          </div>
          <div className="btn-row" style={{ marginTop: 16 }}>
            <button className="btn primary" onClick={() => restart(known)}>
              Another round
            </button>
            <Link className="btn" to="/cards">
              Back to cards
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page study">
      <StudyHead title={title} progress={`${i + 1} / ${round.length}`} />
      <div className="study-progress" aria-hidden="true">
        <i style={{ width: `${(i / round.length) * 100}%` }} />
      </div>

      <button
        type="button"
        className={`flashcard ${shown ? 'shown' : ''}`}
        onClick={() => setShown(true)}
        aria-label={shown ? 'Answer shown' : 'Show answer'}
      >
        <span className="fc-meta">
          {DECK_LABELS[card.deck]}
          {card.objectives.length > 0 && ` · ${card.objectives.join(', ')}`}
        </span>
        {card.prompt && <span className="fc-prompt">{card.prompt}</span>}
        <span className="fc-front">{card.front}</span>
        {shown ? (
          <span className="fc-back">{card.back}</span>
        ) : (
          <span className="fc-hint">Tap or press Space to show the answer</span>
        )}
      </button>

      <div
        className={`ratings ${shown ? '' : 'disabled'}`}
        role="group"
        aria-label="How long did it take to think of the answer?"
      >
        {RATINGS.map((s, n) => (
          <button key={s} className={`rating ${s}`} disabled={!shown} onClick={() => rate(s)}>
            <span className="key">{n + 1}</span>
            {STACK_LABELS[s]}
          </button>
        ))}
      </div>
      <p className="app-note" style={{ textAlign: 'center' }}>
        Be honest about the stack. It only helps if it matches how long the answer took (Study Plan p.9).
      </p>
    </div>
  );
}

function StudyHead({ title, progress }: { title: string; progress?: string }) {
  return (
    <div className="page-head">
      <div>
        <div className="faint">Flashcards</div>
        <h1>{title}</h1>
      </div>
      <div className="day-nav">
        {progress && <span className="faint num">{progress}</span>}
        <Link className="btn small" to="/cards">
          End
        </Link>
      </div>
    </div>
  );
}
