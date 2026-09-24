import { NavLink, Outlet } from 'react-router-dom';
import { useStore } from '../state/store';

const icon = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

const NAV = [
  { to: '/', label: 'Today', icon: icon('M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5'), end: true },
  { to: '/plan', label: 'Plan', icon: icon('M4 5h16M4 12h16M4 19h16M8 3v4M16 3v4') },
  { to: '/exams', label: 'Exams', icon: icon('M7 3h10v18H7zM10 8h4M10 12h4M10 16h2') },
  { to: '/weak', label: 'Weak Areas', short: 'Weak', icon: icon('M4 20V10M10 20V4M16 20v-7M22 20H2') },
  { to: '/glossary', label: 'Glossary', icon: icon('M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4ZM5 17a3 3 0 0 1 3-3h10M9 8h5') },
  {
    to: '/settings',
    label: 'Settings',
    icon: icon(
      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12l2-1-1-3-2 .2-1.3-1.3.2-2-3-1-1 2h-1.8l-1-2-3 1 .2 2L6 7.2 4 7 3 10l2 1v2l-2 1 1 3 2-.2 1.3 1.3-.2 2 3 1 1-2h1.8l1 2 3-1-.2-2 1.3-1.3 2 .2 1-3-2-1Z',
    ),
  },
];

export function Layout() {
  const { mode, sync, cloud, notice, actions } = useStore();
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          Network+ 60-Day
          <small>N10-009 study tracker</small>
          {cloud && mode === 'live' && <SyncBadge status={sync.status} />}
        </div>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {n.icon}
              <span className="long">{n.label}</span>
              <span className="short">{'short' in n ? n.short : n.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main">
        {mode === 'demo' && (
          <div className="banner demo" role="status">
            <span>Sample data. Nothing you do here is saved.</span>
            <button className="btn small" onClick={actions.leaveDemo}>
              Start my plan
            </button>
          </div>
        )}
        {notice && (
          <div className="banner info" role="status">
            <span>{notice}</span>
            <button className="btn small" onClick={actions.dismissNotice}>
              OK
            </button>
          </div>
        )}
        {mode === 'live' && sync.status === 'conflict' && (
          <div className="banner error" role="alert">
            <span>Your plan was changed on another device, so this change wasn't saved.</span>
            <div className="btn-row">
              <button className="btn small" onClick={actions.reloadFromServer}>
                Load the other device's version
              </button>
              <button className="btn small ghost" onClick={actions.keepThisDevice}>
                Keep this device's version
              </button>
            </div>
          </div>
        )}
        {mode === 'live' && sync.status === 'offline' && (
          <div className="banner warn" role="status">
            <span>Offline. Your changes are kept on this screen and will be saved when the connection is back.</span>
          </div>
        )}
        {mode === 'live' && sync.status === 'error' && (
          <div className="banner error" role="alert">
            <span>Couldn't save your last change ({sync.error}). Export a backup from Settings to keep your data safe.</span>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}

function SyncBadge({ status }: { status: string }) {
  const label =
    status === 'saving' ? 'Saving…' : status === 'offline' ? 'Offline' : status === 'conflict' ? 'Not saved' : 'Synced';
  return (
    <span className={`sync-badge ${status}`} role="status" aria-live="polite">
      <i aria-hidden="true" />
      {label}
    </span>
  );
}
