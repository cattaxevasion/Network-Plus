// Full-screen states shown before the app itself: loading, sign-in, load error.

import { useStore } from '../state/store';

export function LoadingPage() {
  return (
    <div className="setup">
      <div className="setup-inner center" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <p className="muted">Loading your plan…</p>
      </div>
    </div>
  );
}

export function SignInPage() {
  const { actions, signInError } = useStore();
  return (
    <div className="setup">
      <div className="setup-inner">
        <div>
          <div className="eyebrow">CompTIA Network+ N10-009</div>
          <h1 className="setup-title">60-Day Study Tracker</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            Sign in to see your plan. Your data is private to your account.
          </p>
        </div>
        {signInError && (
          <p className="alert error" role="alert">
            Sign-in failed: {signInError}
          </p>
        )}
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="btn primary big github" onClick={actions.signIn}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            Sign in with GitHub
          </button>
          <p className="app-note">You stay signed in on this device until you sign out.</p>
        </section>
      </div>
    </div>
  );
}

export function LoadErrorPage() {
  const { actions, bootError } = useStore();
  return (
    <div className="setup">
      <div className="setup-inner">
        <h1 className="setup-title">Couldn't load your plan</h1>
        <p className="alert error" role="alert">
          {bootError}
        </p>
        <p className="muted">Check your connection and try again. Nothing was changed.</p>
        <div className="btn-row">
          <button className="btn primary" onClick={actions.retry}>
            Try again
          </button>
          <button className="btn ghost" onClick={actions.signOut}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
