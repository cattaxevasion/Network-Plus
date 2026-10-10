// Flashcards: decks, stacks and session order.
// Method from the Study Plan PDF (p.7–8): sort cards into stacks by how long it took to think of the answer,
// and keep going until every card is in the "Knew it right away" stack. No dates or intervals.
// Order within a session (app design): weakest stack first, new cards after the two weakest stacks,
// "Knew it right away" cards only when you ask for them.

import { PORTS } from '../data/glossary';
import { PLAN, TOTAL_DAYS } from '../data/plan';
import { currentDay, finishedDate } from './progress';
import { GLOSSARY } from './glossary';
import type { AppData, CardState, Stack } from './types';

export type DeckKind = 'acronyms' | 'ports' | 'guide' | 'mine';
export type DeckId = 'all' | DeckKind | 'previous';

export interface Card {
  id: string;
  deck: DeckKind;
  front: string;
  back: string;
  /** Short prompt shown above the front, e.g. "Stands for?". */
  prompt?: string;
  objectives: string[];
  createdOn?: string;
  /** Plan day (study-guide cards). */
  day?: number;
}

export const DECK_LABELS: Record<DeckId, string> = {
  all: 'All cards',
  acronyms: 'Acronyms',
  ports: 'Ports',
  guide: 'Study guide',
  mine: 'My cards',
  previous: "Previous day's cards",
};

const OFFICIAL: Card[] = [
  ...GLOSSARY.map((g) => ({
    id: `acr:${g.acronym}`,
    deck: 'acronyms' as const,
    front: g.acronym,
    back: g.spelledOut,
    prompt: 'Stands for?',
    objectives: g.objectives,
  })),
  ...PORTS.map((p) => ({
    id: `port:${p.protocol}`,
    deck: 'ports' as const,
    front: p.protocol,
    back: p.ports,
    prompt: 'Port?',
    objectives: ['1.4'],
  })),
];

/** Study-guide cards appear once you reach their plan day (the first unfinished day, or all when done). */
export function unlockedDay(data: AppData): number {
  return currentDay(data) ?? TOTAL_DAYS;
}

export function allCards(data: AppData): Card[] {
  const upTo = unlockedDay(data);
  return [
    ...OFFICIAL,
    ...data.cards
      .filter((c) => c.source !== 'guide' || (c.day ?? 1) <= upTo)
      .map((c) => ({
        id: c.id,
        deck: c.source === 'guide' ? ('guide' as const) : ('mine' as const),
        front: c.front,
        back: c.back,
        objectives: c.objectiveId ? [c.objectiveId] : [],
        createdOn: c.createdOn,
        day: c.day,
      })),
  ];
}

/** The last day before today on which you made cards yourself. */
export function previousCardDay(data: AppData, today: string): string | null {
  const days = data.cards
    .filter((c) => c.source !== 'guide')
    .map((c) => c.createdOn)
    .filter((d) => d < today);
  return days.length ? days.sort().pop()! : null;
}

/** The plan day you finished most recently before today (its study-guide cards are "the previous day's"). */
export function previousPlanDay(data: AppData, today: string): number | null {
  let best: { day: number; date: string } | null = null;
  for (const p of PLAN) {
    const d = finishedDate(data, p.day);
    if (d && d < today && (!best || d > best.date || (d === best.date && p.day > best.day))) best = { day: p.day, date: d };
  }
  return best?.day ?? null;
}

/**
 * "Previous day's cards" (Study Plan p.4: review the previous day's flashcards):
 * cards you made on your last card-making day + study-guide cards of the plan day you finished last.
 */
export function deckCards(data: AppData, deck: DeckId, today: string, objective?: string): Card[] {
  const prevMade = deck === 'previous' ? previousCardDay(data, today) : null;
  const prevDay = deck === 'previous' ? previousPlanDay(data, today) : null;
  return allCards(data).filter(
    (c) =>
      (deck === 'all' ||
        (deck === 'previous'
          ? (c.deck === 'mine' && c.createdOn === prevMade) || (c.deck === 'guide' && c.day === prevDay)
          : c.deck === deck)) &&
      (!objective || c.objectives.includes(objective)),
  );
}

export type Bucket = Stack | 'new';
export const BUCKET_ORDER: Bucket[] = ['looked', 'while', 'new', 'moment', 'knew'];
export const BUCKET_LABELS: Record<Bucket, string> = {
  looked: 'Had to look',
  while: 'Thought a while',
  new: 'New',
  moment: 'Thought a moment',
  knew: 'Knew it',
};

export const bucketOf = (states: Record<string, CardState>, id: string): Bucket => states[id]?.stack ?? 'new';

export function bucketCounts(cards: Card[], states: Record<string, CardState>): Record<Bucket, number> {
  const out: Record<Bucket, number> = { looked: 0, while: 0, new: 0, moment: 0, knew: 0 };
  for (const c of cards) out[bucketOf(states, c.id)]++;
  return out;
}

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Cards for one session: weakest stack first, shuffled within each stack. */
export function buildSession(cards: Card[], states: Record<string, CardState>, size: number, includeKnown: boolean): Card[] {
  const order = includeKnown ? BUCKET_ORDER : BUCKET_ORDER.filter((b) => b !== 'knew');
  const picked: Card[] = [];
  for (const b of order) {
    picked.push(...shuffle(cards.filter((c) => bucketOf(states, c.id) === b)));
    if (picked.length >= size) break;
  }
  return picked.slice(0, size);
}
