import { useRef, useState } from 'react';
import { parseCardPack, type PackCard } from '../state/storage';

/** Imports a study-guide card pack (.json) into your account. Re-importing updates cards and keeps their stacks. */
export function PackImport({ onImport, compact }: { onImport: (cards: PackCard[]) => void; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const cards = parseCardPack(await file.text());
      onImport(cards);
      const days = [...new Set(cards.map((c) => c.day))].sort((a, b) => a - b);
      setMsg({ ok: true, text: `Imported ${cards.length} cards (Day ${days[0]}–${days[days.length - 1]}).` });
    } catch (e) {
      setMsg({ ok: false, text: `Couldn't import "${file.name}": ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      if (input.current) input.current.value = '';
    }
  };

  return (
    <>
      <button type="button" className={`btn small ${compact ? 'ghost' : ''}`} onClick={() => input.current?.click()}>
        {compact ? 'Import more' : 'Import card pack'}
      </button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {msg && (
        <p className={msg.ok ? 'faint' : 'alert error'} role="status" style={{ flexBasis: '100%' }}>
          {msg.text}
        </p>
      )}
    </>
  );
}
