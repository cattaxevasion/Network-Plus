import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PORTS } from '../data/glossary';
import { DOMAINS, OBJECTIVES, OBJECTIVE_BY_ID, shortTitle, type Domain } from '../data/objectives';
import { GLOSSARY, downloadText, flashcardFile, topicLines, topicTree, type TopicNode } from '../lib/glossary';

type Tab = 'acronyms' | 'ports' | 'objectives';
const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'acronyms', label: 'Acronyms' },
  { id: 'ports', label: 'Ports' },
  { id: 'objectives', label: 'Objectives' },
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Wraps matches of `q` in <mark>. */
function Hl({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRe(q)})`, 'ig'));
  return <>{parts.map((p, i) => (p.toLowerCase() === q.toLowerCase() ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>))}</>;
}

export function GlossaryPage() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'acronyms') as Tab;
  const obj = OBJECTIVE_BY_ID[params.get('obj') ?? ''] ? (params.get('obj') as string) : '';
  const [query, setQuery] = useState('');
  const q = query.trim();
  const ql = q.toLowerCase();

  const set = (next: { tab?: Tab; obj?: string }) => {
    const p = new URLSearchParams(params);
    if (next.tab) p.set('tab', next.tab);
    if (next.obj !== undefined) {
      if (next.obj) p.set('obj', next.obj);
      else p.delete('obj');
    }
    setParams(p, { replace: true });
  };

  const acronyms = useMemo(
    () =>
      GLOSSARY.filter(
        (g) =>
          (!obj || g.objectives.includes(obj)) &&
          (!ql || g.acronym.toLowerCase().includes(ql) || g.spelledOut.toLowerCase().includes(ql)),
      ).sort((a, b) => a.acronym.localeCompare(b.acronym, 'en', { sensitivity: 'base' })),
    [obj, ql],
  );
  const ports = useMemo(
    () => (obj && obj !== '1.4' ? [] : PORTS.filter((p) => !ql || p.protocol.toLowerCase().includes(ql) || p.ports.includes(ql))),
    [obj, ql],
  );
  const objectives = useMemo(
    () =>
      OBJECTIVES.filter(
        (o) =>
          (!obj || o.id === obj) &&
          (!ql ||
            o.title.toLowerCase().includes(ql) ||
            o.id === ql ||
            topicLines(o.id).some((l) => l.toLowerCase().includes(ql))),
      ),
    [obj, ql],
  );
  const counts: Record<Tab, number> = { acronyms: acronyms.length, ports: ports.length, objectives: objectives.length };

  // Acronyms grouped by first letter.
  const groups = useMemo(() => {
    const m = new Map<string, typeof acronyms>();
    for (const a of acronyms) {
      const k = a.acronym[0].toUpperCase();
      m.set(k, [...(m.get(k) ?? []), a]);
    }
    return [...m.entries()];
  }, [acronyms]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Glossary</h1>
          <p className="muted">
            From the official CompTIA N10-009 Exam Objectives: {GLOSSARY.length} acronyms, {PORTS.length} ports, and the topics
            under all {OBJECTIVES.length} objectives.
          </p>
        </div>
      </div>

      <div className="glossary-controls">
        <input
          type="search"
          className="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search acronyms, terms, ports…"
          aria-label="Search the glossary"
        />
        <select value={obj} onChange={(e) => set({ obj: e.target.value })} aria-label="Filter by objective">
          <option value="">All objectives</option>
          {OBJECTIVES.map((o) => (
            <option key={o.id} value={o.id}>
              {o.id} {shortTitle(o)}
            </option>
          ))}
        </select>
      </div>

      <div className="seg tabs" role="tablist" aria-label="Glossary sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'sel' : ''}
            onClick={() => set({ tab: t.id })}
          >
            {t.label} <span className="count">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      {tab === 'acronyms' && (
        <section className="card" aria-label="Acronyms">
          {acronyms.length === 0 ? (
            <Empty />
          ) : (
            groups.map(([letter, items]) => (
              <div key={letter} className="letter-group">
                <div className="letter-head">{letter}</div>
                {items.map((g) => (
                  <div key={g.acronym} className="acr-row">
                    <div className="acr">
                      <Hl text={g.acronym} q={q} />
                    </div>
                    <div className="spelled">
                      <Hl text={g.spelledOut} q={q} />
                    </div>
                    <div className="chips">
                      {g.objectives.length ? (
                        g.objectives.map((o) => (
                          <button
                            key={o}
                            className="chip obj link"
                            title={OBJECTIVE_BY_ID[o].title}
                            onClick={() => set({ tab: 'objectives', obj: o })}
                          >
                            {o}
                          </button>
                        ))
                      ) : (
                        <span className="faint" title="Listed in the acronym list but not named in any objective's topics">
                          list only
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </section>
      )}

      {tab === 'ports' && (
        <section className="card" aria-label="Ports">
          {ports.length === 0 ? (
            <Empty />
          ) : (
            <table className="table ports">
              <thead>
                <tr>
                  <th>Port</th>
                  <th>Protocol</th>
                </tr>
              </thead>
              <tbody>
                {ports.map((p) => (
                  <tr key={p.protocol}>
                    <td className="port">
                      <Hl text={p.ports} q={q} />
                    </td>
                    <td>
                      <Hl text={p.protocol} q={q} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="app-note" style={{ marginTop: 10 }}>
            Objective 1.4 table, in document order.
          </p>
        </section>
      )}

      {tab === 'objectives' &&
        (objectives.length === 0 ? (
          <section className="card">
            <Empty />
          </section>
        ) : (
          ([1, 2, 3, 4, 5] as Domain[]).map((d) => {
            const list = objectives.filter((o) => o.domain === d);
            if (!list.length) return null;
            return (
              <section key={d} className="card" aria-labelledby={`gd-${d}`}>
                <div className="card-head">
                  <h2 id={`gd-${d}`}>
                    {d}.0 {DOMAINS[d].name} <span className="faint">{DOMAINS[d].weight}% of exam</span>
                  </h2>
                </div>
                {list.map((o) => (
                  <div key={o.id} className="topic-block">
                    <h3>
                      <span className="num">{o.id}</span> <Hl text={o.title} q={q} />
                    </h3>
                    <Tree nodes={topicTree(o.id)} q={q} onPorts={() => set({ tab: 'ports', obj: '' })} />
                  </div>
                ))}
              </section>
            );
          })
        ))}

      <section className="card" aria-labelledby="files-title">
        <div className="card-head">
          <h2 id="files-title">Flashcard files</h2>
        </div>
        <p className="muted" style={{ marginBottom: 12 }}>
          The same official lists as text files for your flashcard app. The short answer (acronym or port) is in the first column,
          as the study plan suggests.
        </p>
        <div className="file-grid">
          {(['acronyms', 'ports'] as const).map((deck) => (
            <div key={deck} className="file-row">
              <b>{deck === 'acronyms' ? `Acronyms (${GLOSSARY.length})` : `Ports (${PORTS.length})`}</b>
              <div className="btn-row">
                {(['anki', 'quizlet'] as const).map((app) => (
                  <button
                    key={app}
                    className="btn small"
                    onClick={() => {
                      const f = flashcardFile(deck, app);
                      downloadText(f.filename, f.text);
                    }}
                  >
                    {app === 'anki' ? 'Anki' : 'Quizlet'} .txt
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <details className="tips" style={{ marginTop: 12 }}>
          <summary>How to import</summary>
          <ul>
            <li>
              <b>Anki</b> (desktop): File → Import, pick the file. Choose the note type "Basic (and reversed card)" to study both
              directions. Tags include the objective, e.g. obj-1.4.
            </li>
            <li>
              <b>Quizlet</b>: create a set → Import, paste the file contents. Between term and definition: Tab. Between cards: New
              line.
            </li>
          </ul>
        </details>
      </section>
    </div>
  );
}

function Tree({ nodes, q, onPorts }: { nodes: TopicNode[]; q: string; onPorts: () => void }): ReactNode {
  return (
    <ul className="topic-tree">
      {nodes.map((n, i) => (
        <li key={i}>
          {n.text === 'Protocols and ports (see Ports)' ? (
            <button className="btn ghost small inline" onClick={onPorts}>
              Protocols and ports → Ports
            </button>
          ) : (
            <Hl text={n.text} q={q} />
          )}
          {n.children.length > 0 && <Tree nodes={n.children} q={q} onPorts={onPorts} />}
        </li>
      ))}
    </ul>
  );
}

function Empty() {
  return <div className="empty">Nothing matches. Try another word or clear the objective filter.</div>;
}
