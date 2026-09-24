// Derived views of the official glossary data (src/data/glossary.ts):
//   - which objectives mention each acronym
//   - objective topic outlines as trees
//   - Anki / Quizlet import files

import { ACRONYMS, OBJECTIVE_TOPICS, PORTS, type Acronym } from '../data/glossary';
import { OBJECTIVE_BY_ID } from '../data/objectives';

export interface TopicNode {
  text: string;
  children: TopicNode[];
}

/** Parses the indented topic text (2 spaces per level) into a tree. */
export function topicTree(objectiveId: string): TopicNode[] {
  const roots: TopicNode[] = [];
  const stack: Array<{ depth: number; node: TopicNode }> = [];
  for (const line of (OBJECTIVE_TOPICS[objectiveId] ?? '').split('\n')) {
    if (!line.trim()) continue;
    const depth = (line.length - line.trimStart().length) / 2;
    const node: TopicNode = { text: line.trim(), children: [] };
    while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
    if (stack.length) stack[stack.length - 1].node.children.push(node);
    else roots.push(node);
    stack.push({ depth, node });
  }
  return roots;
}

export function topicLines(objectiveId: string): string[] {
  return (OBJECTIVE_TOPICS[objectiveId] ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Where the objectives text (title + topics) mentions an acronym: the acronym as a whole token (plural "s" allowed, e.g. "ACLs"),
 * or, if the acronym itself never appears, its spelled-out form.
 * Overrides fix the few cases where plain text matching gives the wrong answer.
 */
const OVERRIDES: Record<string, string[]> = {
  A: ['3.4'], // "Address (A)" record type; plain "A" also matches "Class A"
  STP: ['5.2'], // the acronym list defines STP as Shielded Twisted Pair (5.2)
  LAN: [], // only appears inside "Virtual Local Area Network" / "Virtual Extensible LAN"
};

function computeObjectives(a: Acronym): string[] {
  if (OVERRIDES[a.acronym]) return OVERRIDES[a.acronym];
  const token = new RegExp(`(?<![A-Za-z0-9])${escape(a.acronym)}s?(?![A-Za-z0-9])`);
  const phrase = new RegExp(`(?<![A-Za-z])${escape(a.spelledOut)}(?![A-Za-z])`, 'i');
  const ids = Object.keys(OBJECTIVE_TOPICS);
  const text = (id: string) =>
    [OBJECTIVE_BY_ID[id].title, OBJECTIVE_TOPICS[id], id === '1.4' ? PORTS.map((p) => p.protocol).join('\n') : ''].join('\n');
  const byToken = ids.filter((id) => token.test(text(id)));
  return byToken.length ? byToken : ids.filter((id) => phrase.test(text(id)));
}

export interface GlossaryEntry extends Acronym {
  objectives: string[];
}

export const GLOSSARY: GlossaryEntry[] = ACRONYMS.map((a) => ({ ...a, objectives: computeObjectives(a) }));

// ---------- Flashcard files ----------
// Study Plan p.8–9: keep answers short and consistently on one side; lists are typed as "answer <tab> question".
// So the short side (acronym / port) is the first column.

const clean = (s: string) => s.replace(/[\t\n]/g, ' ');

export type Deck = 'acronyms' | 'ports';
export type CardApp = 'anki' | 'quizlet';

export function flashcardFile(deck: Deck, app: CardApp): { filename: string; text: string } {
  const rows =
    deck === 'acronyms'
      ? GLOSSARY.map((g) => ({
          front: g.acronym,
          back: g.spelledOut,
          tags: ['N10-009', 'acronym', ...g.objectives.map((o) => `obj-${o}`)],
        }))
      : PORTS.map((p) => ({ front: p.ports, back: p.protocol, tags: ['N10-009', 'port', 'obj-1.4'] }));

  const text =
    app === 'anki'
      ? [
          '#separator:tab',
          '#html:false',
          '#tags column:3',
          ...rows.map((r) => `${clean(r.front)}\t${clean(r.back)}\t${r.tags.join(' ')}`),
        ].join('\n')
      : rows.map((r) => `${clean(r.front)}\t${clean(r.back)}`).join('\n');

  return { filename: `netplus-${deck}-${app}.txt`, text: text + '\n' };
}

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
