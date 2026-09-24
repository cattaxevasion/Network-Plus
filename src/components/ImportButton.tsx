import { useRef, useState } from 'react';
import type { AppData } from '../lib/types';
import { parseAppData } from '../state/storage';

/** Picks a backup .json file, validates it, then calls onData. Shows a readable error if the file is invalid. */
export function ImportButton({
  label = 'Restore from backup',
  className = 'btn',
  confirmMessage,
  onData,
}: {
  label?: string;
  className?: string;
  /** If set, asks before replacing current data. */
  confirmMessage?: string;
  onData: (data: AppData) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const data = parseAppData(await file.text());
      if (confirmMessage && !window.confirm(confirmMessage)) return;
      onData(data);
    } catch (e) {
      setError(`Couldn't restore "${file.name}": ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      if (input.current) input.current.value = '';
    }
  };

  return (
    <>
      <button type="button" className={className} onClick={() => input.current?.click()}>
        {label}
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
      {error && (
        <p className="alert error" role="alert" style={{ flexBasis: '100%' }}>
          {error}
        </p>
      )}
    </>
  );
}
