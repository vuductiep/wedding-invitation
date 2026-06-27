'use client';
import { useEffect, useRef, useState } from 'react';
import { getPendingMessages, approveMessage, deleteMessage, getStats } from './actions';

type Msg = { id: string; name: string; message: string; createdAt: Date };

/* ─── helpers ─────────────────────────────────────────────── */
function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}
function formatDate(d: Date) {
  return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#a87148,#6f3f1d)',
  'linear-gradient(135deg,#c89472,#8a5a3b)',
  'linear-gradient(135deg,#b56a52,#7a3a26)',
  'linear-gradient(135deg,#a3a06b,#6b6a3a)',
  'linear-gradient(135deg,#8b6f4a,#5a4327)',
  'linear-gradient(135deg,#9c5d5d,#5e3434)',
];
function avatarGrad(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

/* ─── page ────────────────────────────────────────────────── */
export default function AdminGuestbook() {
  const [token, setToken] = useState<string | null>(null);
  const [pending, setPending] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ pending: number; today: number; totalApproved: number } | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Msg | null>(null);

  useEffect(() => {
    if (typeof globalThis.window !== 'undefined') {
      const t = sessionStorage.getItem('adminToken');
      if (t) setToken(t);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([getPendingMessages(token), getStats(token)])
      .then(([msgs, s]) => { setError(null); setPending(msgs); setStats(s); })
      .catch((err) => err.message === 'Unauthorized' ? (logout(), setError('Invalid token')) : setError(err?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [token]);

  const login = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const t = String(new FormData(e.currentTarget).get('token') || '');
    if (!t.trim()) return;
    setToken(t); sessionStorage.setItem('adminToken', t);
  };
  const logout = () => { setToken(null); sessionStorage.removeItem('adminToken'); setPending([]); setStats(null); setDeleteCandidate(null); setError(null); };

  async function approve(id: string) {
    try { await approveMessage(token!, id); setPending((p) => p.filter((m) => m.id !== id)); getStats(token!).then(setStats).catch(() => {}); }
    catch (e: any) { setError(e?.message || 'Failed to approve'); }
  }
  const discard = async () => {
    if (!deleteCandidate) return;
    const target = deleteCandidate; setDeleteCandidate(null);
    try { await deleteMessage(token!, target.id); setPending((p) => p.filter((m) => m.id !== target.id)); getStats(token!).then(setStats).catch(() => {}); }
    catch (e: any) { setError(e?.message || 'Failed to delete'); }
  };
  const refresh = () => {
    if (!token) return; setLoading(true);
    Promise.all([getPendingMessages(token), getStats(token)])
      .then(([d, s]) => { setPending(d); setStats(s); setError(null); })
      .catch((err) => err.message === 'Unauthorized' ? logout() : setError(err?.message || 'Refresh failed'))
      .finally(() => setLoading(false));
  };

  /* ── Login ── */
  if (!token) return (
    <main className="admin-shell">
      <section className="admin-login" aria-label="Login">
        <div className="admin-card admin-login-card">
          <div className="admin-login-header">
            <div className="admin-brand-mark" aria-hidden>
              <svg viewBox="0 0 24 24" width="38" height="38" fill="white">
                <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
              </svg>
            </div>
            <h1 className="admin-script-heading">Guestbook Admin</h1>
            <p className="admin-login-subtitle">Manage your wedding messages</p>
          </div>
          {error && (
            <div role="alert" className="admin-alert">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={login} className="admin-form">
            <label htmlFor="token" className="admin-label">Admin Token</label>
            <input id="token" name="token" type="password" required placeholder="Enter your secret token…" className="admin-input" />
            <button type="submit" className="admin-button-primary">
              <span>Sign In</span>
              <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </form>
          <p className="admin-hint">
            Password is <code>your love</code>
          </p>
        </div>
      </section>
    </main>
  );

  /* ── Dashboard ── */
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand">
            <div className="admin-brand-mark" aria-hidden>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
                <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
              </svg>
            </div>
            <div>
              <h1 className="admin-brand-title">Guestbook</h1>
              <p className="admin-brand-subtitle">Admin Dashboard</p>
            </div>
          </div>

          <span className={`admin-status-pill ${loading ? 'admin-status-pill--loading' : pending.length ? 'admin-status-pill--pending' : 'admin-status-pill--ok'}`}>
            {loading ? '↻ Loading…' : pending.length ? `${pending.length} pending` : '✓ All clear'}
          </span>

          <div className="admin-header-actions">
            <button onClick={refresh} disabled={loading} aria-label="Refresh" title="Refresh" className="admin-icon-button">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" className={loading ? 'admin-icon-spin' : ''} aria-hidden>
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
            <button onClick={logout} aria-label="Logout" className="admin-button-ghost">
              <svg viewBox="0 0 20 20" width="15" height="15" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        {error && (
          <div role="alert" aria-live="polite" className="admin-alert admin-alert--inline">
            <div className="admin-alert-row">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span><strong>Error: </strong>{error}</span>
            </div>
            <button onClick={() => setError(null)} aria-label="Dismiss" className="admin-dismiss">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Stats */}
        <section aria-labelledby="stats-title" className="admin-stats">
          <h2 id="stats-title" className="visually-hidden">Statistics</h2>
          <div className="admin-stats-grid">
            <StatCard label="Pending" value={stats?.pending ?? '—'} loading={loading && !stats}
              bar="linear-gradient(90deg,#c89472,#8a5a3b)" iconBg="rgba(141,95,37,0.12)" iconColor="var(--primary)"
              iconPath="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
            <StatCard label="Today" value={stats?.today ?? '—'} loading={loading && !stats}
              bar="linear-gradient(90deg,#d4a373,#a87148)" iconBg="rgba(141,95,37,0.08)" iconColor="var(--primary-dark)"
              iconPath="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
            <StatCard label="Total Approved" value={stats?.totalApproved ?? '—'} loading={loading && !stats}
              bar="linear-gradient(90deg,#9caf88,#6b8e4e)" iconBg="rgba(107,142,78,0.12)" iconColor="#6b8e4e"
              iconPath="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
          </div>
        </section>

        {/* Messages */}
        <section aria-labelledby="pending-title" className="admin-messages">
          <div className="admin-section-header">
            <h2 id="pending-title" className="admin-section-label">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
              </svg>
              Pending Messages
            </h2>
            {pending.length > 0 && (
              <span className="admin-count-pill">{pending.length}</span>
            )}
          </div>

          {/* Skeleton */}
          {loading && pending.length === 0 && (
            <div className="admin-skeleton-list">
              {[0, 1, 2].map((i) => (
                <div key={i} className="admin-skeleton-row">
                  <div className="admin-skeleton-avatar" />
                  <div className="admin-skeleton-lines">
                    <div className="admin-skeleton-line admin-skeleton-line--short" />
                    <div className="admin-skeleton-line" />
                    <div className="admin-skeleton-line admin-skeleton-line--medium" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && pending.length === 0 && (
            <div className="admin-empty">
              <div className="admin-empty-mark" aria-hidden>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="var(--primary)">
                  <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
                </svg>
              </div>
              <p className="admin-script-heading admin-empty-title">All caught up!</p>
              <p className="admin-empty-subtitle">No pending messages right now. New submissions will appear here.</p>
            </div>
          )}

          {/* List */}
          {pending.length > 0 && (
            <div className="admin-message-list">
              {pending.map((m) => (
                <div key={m.id} className="admin-message-row">
                  <div className="admin-avatar" style={{ background: avatarGrad(m.name) }}>
                    {initials(m.name)}
                  </div>
                  <div className="admin-message-body">
                    <div className="admin-message-meta">
                      <span className="admin-message-name">{m.name}</span>
                      <time dateTime={new Date(m.createdAt).toISOString()} className="admin-message-date">
                        {formatDate(m.createdAt)}
                      </time>
                    </div>
                    <p className="admin-message-text">{m.message}</p>
                  </div>
                  <div className="admin-message-actions">
                    <button onClick={() => approve(m.id)} aria-label={`Approve ${m.name}`} className="admin-button-approve">
                      <svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor" aria-hidden>
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Approve
                    </button>
                    <button onClick={() => setDeleteCandidate(m)} aria-label={`Delete ${m.name}`} className="admin-button-delete">
                      <svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor" aria-hidden>
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {deleteCandidate && (
        <DeleteDialog candidate={deleteCandidate} onCancel={() => setDeleteCandidate(null)} onConfirm={discard} />
      )}
    </div>
  );
}

/* ─── StatCard ── */
function StatCard({ label, value, loading, bar, iconBg, iconColor, iconPath }: {
  label: string; value: number | string; loading?: boolean;
  bar: string; iconBg: string; iconColor: string; iconPath: string;
}) {
  return (
    <div className="admin-card admin-stat-card">
      <div className="admin-stat-bar" style={{ background: bar }} aria-hidden />
      <div className="admin-stat-row">
        <div>
          <p className="admin-stat-label">{label}</p>
          <p className="admin-stat-value">
            {loading ? <span className="admin-stat-skeleton" /> : value}
          </p>
        </div>
        <div className="admin-stat-icon" style={{ background: iconBg }}>
          <svg viewBox="0 0 20 20" width="20" height="20" fill={iconColor} aria-hidden>
            <path fillRule="evenodd" d={iconPath} clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ─── DeleteDialog ── */
function DeleteDialog({ candidate, onCancel, onConfirm }: { candidate: Msg; onCancel: () => void; onConfirm: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    btnRef.current?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  return (
    <div className="admin-dialog-backdrop" role="presentation" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="del-title"
        aria-describedby="del-desc"
        className="admin-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-dialog-inner">
          <div className="admin-dialog-mark" aria-hidden>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 id="del-title" className="admin-dialog-title">Delete this message?</h2>
          <p id="del-desc" className="admin-dialog-desc">
            Permanently removes the message from <strong>{candidate.name}</strong>. This cannot be undone.
          </p>
          <div className="admin-dialog-quote">
            &ldquo;{candidate.message}&rdquo;
          </div>
          <div className="admin-dialog-actions">
            <button type="button" onClick={onCancel} className="admin-button-ghost">Cancel</button>
            <button type="button" ref={btnRef} onClick={onConfirm} className="admin-button-danger">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}