import { useState } from 'react';
import { ImportButton } from '../components/ImportButton';
import { TOTAL_DAYS } from '../data/plan';
import { addDays, formatDate, todayISO } from '../lib/dates';
import { useStore } from '../state/store';

/** First run (or after a reset): pick a start date and flashcard link, or look around with sample data. */
export function SetupPage() {
  const { actions, loadError, cloud } = useStore();
  const [startDate, setStartDate] = useState(todayISO());
  const [flashcardLabel, setFlashcardLabel] = useState('');
  const [flashcardUrl, setFlashcardUrl] = useState('');

  const urlOk = !flashcardUrl || /^https?:\/\//i.test(flashcardUrl.trim());
  const canStart = !!startDate && urlOk;
  const finish = startDate ? addDays(startDate, TOTAL_DAYS - 1) : null;

  // Always land on Today after leaving the setup screen.
  const home = () => {
    window.location.hash = '#/';
  };

  const start = () => {
    if (!canStart) return;
    home();
    actions.startPlan({
      startDate,
      flashcardLabel: flashcardLabel.trim() || 'Flashcards',
      flashcardUrl: flashcardUrl.trim(),
    });
  };

  return (
    <div className="setup">
      <div className="setup-inner">
        <div>
          <div className="eyebrow">CompTIA Network+ N10-009</div>
          <h1 className="setup-title">Your 60-day study plan</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            Follows the Dion Training 60-Day Study Plan: videos on Day 1–33, practice exams on Day 34–46, retakes on Day 47–60.
          </p>
        </div>

        {loadError && (
          <p className="alert error" role="alert">
            Saved data in this browser couldn't be read ({loadError}). A copy was kept aside. Restore a backup below, or start a
            new plan.
          </p>
        )}

        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label className="field">
            When do you start Day 1?
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            {finish && (
              <span className="hint">
                At one plan day per calendar day, you'd finish on {formatDate(finish, { month: 'long', day: 'numeric' })}. Falling
                behind is fine; the plan moves with you.
              </span>
            )}
          </label>

          <fieldset className="fieldset">
            <legend>
              Flashcard app <span className="faint">(optional)</span>
            </legend>
            <div className="form-grid two">
              <label className="field">
                Name
                <input
                  type="text"
                  value={flashcardLabel}
                  onChange={(e) => setFlashcardLabel(e.target.value)}
                  placeholder="Anki, Quizlet…"
                />
              </label>
              <label className="field">
                Link
                <input type="url" value={flashcardUrl} onChange={(e) => setFlashcardUrl(e.target.value)} placeholder="https://" />
              </label>
            </div>
            {!urlOk && <span className="field-error">Links start with https://</span>}
          </fieldset>

          <button className="btn primary big" disabled={!canStart} onClick={start}>
            Start my plan
          </button>
          <p className="app-note">
            {cloud
              ? 'Your progress is saved to your account and syncs across your devices.'
              : 'Your progress is saved in this browser. Use Settings → Export backup to keep a copy or move it to another device.'}
          </p>
        </section>

        <div className="setup-alt">
          <button
            className="btn ghost"
            onClick={() => {
              home();
              actions.startDemo();
            }}
          >
            Look around with sample data
          </button>
          <ImportButton
            className="btn ghost"
            onData={(d) => {
              home();
              actions.importData(d);
            }}
          />
        </div>
      </div>
    </div>
  );
}
