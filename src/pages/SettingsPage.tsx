import { useEffect, useState } from 'react';
import { ImportButton } from '../components/ImportButton';
import { todayISO } from '../lib/dates';
import { downloadBackup } from '../state/storage';
import { useStore } from '../state/store';

export function SettingsPage() {
  const { data, mode, actions, cloud, user } = useStore();
  const s = data.settings;
  const [url, setUrl] = useState(s.flashcardUrl);
  // Follow changes that arrive from another device.
  useEffect(() => setUrl(s.flashcardUrl), [s.flashcardUrl]);
  const urlOk = !url || /^https?:\/\//i.test(url.trim());
  const demo = mode === 'demo';

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <div className="page-head">
        <h1>Settings</h1>
      </div>

      {cloud && user && (
        <section className="card account">
          {user.avatarUrl && <img src={user.avatarUrl} alt="" width={40} height={40} />}
          <div className="grow">
            <b>{user.name}</b>
            <div className="faint">Signed in with GitHub</div>
          </div>
          <button className="btn small" onClick={actions.signOut}>
            Sign out
          </button>
        </section>
      )}

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2>Plan</h2>
        <label className="field">
          Start date (Day 1)
          <span className="hint">Only used to show the calendar day for reference. Your plan day follows your progress.</span>
          <input
            type="date"
            value={s.startDate}
            onChange={(e) => e.target.value && actions.updateSettings({ startDate: e.target.value })}
          />
        </label>
      </section>

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2>Flashcards</h2>
        <p className="muted">Flashcards live in your own app. This link appears on flashcard steps and on the Today card.</p>
        <label className="field">
          App name
          <input
            type="text"
            value={s.flashcardLabel}
            onChange={(e) => actions.updateSettings({ flashcardLabel: e.target.value })}
            placeholder="Anki, Quizlet…"
          />
        </label>
        <label className="field">
          Link
          <input
            type="url"
            value={url}
            placeholder="https://"
            onChange={(e) => {
              setUrl(e.target.value);
              const v = e.target.value.trim();
              if (!v || /^https?:\/\//i.test(v)) actions.updateSettings({ flashcardUrl: v });
            }}
          />
          {!urlOk && <span className="field-error">Links start with https://</span>}
        </label>
      </section>

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2>Data</h2>
        {demo ? (
          <>
            <p className="muted">You're looking at sample data. Nothing here is saved.</p>
            <div className="btn-row">
              <button className="btn primary" onClick={actions.leaveDemo}>
                Leave sample data and start my plan
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="muted">
              {cloud
                ? 'Saved to your account and synced across your devices. A backup file is still handy to keep a copy of your own.'
                : 'Saved in this browser only. Export a backup now and then, and use it to move your data to another device or browser.'}
            </p>
            <div className="btn-row">
              <button className="btn" onClick={() => downloadBackup(data, todayISO())}>
                Export backup
              </button>
              <ImportButton
                label="Import backup"
                confirmMessage="Replace all current data with this backup?"
                onData={actions.importData}
              />
            </div>
            <div className="danger-zone">
              <div>
                <b>Reset everything</b>
                <p className="faint">
                  Deletes all days, exams and settings {cloud ? 'from your account' : 'from this browser'} and returns to the
                  setup screen.
                </p>
              </div>
              <button
                className="btn danger"
                onClick={() => {
                  if (window.confirm('Delete all your data? Export a backup first if you might need it.')) actions.resetAll();
                }}
              >
                Reset
              </button>
            </div>
          </>
        )}
      </section>

      <section className="card faint">
        Study plan: Dion Training, "CompTIA Network+ (N10-009) Study Plan". Objectives: CompTIA Network+ N10-009 Exam Objectives
        v4.0. Practice exam settings: src/config/practiceExam.ts.
      </section>
    </div>
  );
}
