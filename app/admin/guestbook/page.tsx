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
  'linear-gradient(135deg,#f472b6,#fb7185)',
  'linear-gradient(135deg,#a78bfa,#818cf8)',
  'linear-gradient(135deg,#fb923c,#f59e0b)',
  'linear-gradient(135deg,#34d399,#059669)',
  'linear-gradient(135deg,#38bdf8,#6366f1)',
  'linear-gradient(135deg,#e879f9,#ec4899)',
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
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'linear-gradient(135deg,#fdf2f8 0%,#fce7f3 40%,#ede9fe 100%)', position: 'relative' }}>
      {/* blobs */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', top: -200, right: -100, background: 'radial-gradient(circle,rgba(236,72,153,.18) 0%,transparent 70%)' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', bottom: -150, left: -100, background: 'radial-gradient(circle,rgba(139,92,246,.14) 0%,transparent 70%)' }} />
      </div>
      <section aria-label="Login" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>
        <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,.6)', background: 'rgba(255,255,255,.85)', padding: '40px 36px', boxShadow: '0 24px 64px rgba(139,92,246,.18)', backdropFilter: 'blur(20px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg,#ec4899,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(236,72,153,.35)' }}>
              <svg viewBox="0 0 24 24" width="38" height="38" fill="white"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg>
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>Guestbook Admin</h1>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6b7280' }}>Manage your wedding messages</p>
          </div>
          {error && (
            <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '10px 14px', marginBottom: 20, fontSize: 14, color: '#dc2626' }}>
              <svg viewBox="0 0 20 20" width="16" height="16" fill="#dc2626" style={{ flexShrink: 0 }}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              {error}
            </div>
          )}
          <form onSubmit={login}>
            <label htmlFor="token" style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: 8 }}>Admin Token</label>
            <input id="token" name="token" type="password" required placeholder="Enter your secret token…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', background: 'rgba(255,255,255,.8)', color: '#111827', marginBottom: 16 }}
              onFocus={e => e.currentTarget.style.borderColor = '#ec4899'}
              onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
            <button type="submit" style={{ width: '100%', padding: '13px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#ec4899,#8b5cf6)', color: 'white', fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(236,72,153,.35)' }}>
              Sign In
              <svg viewBox="0 0 20 20" width="16" height="16" fill="rgba(255,255,255,.9)"><path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
            </button>
          </form>
          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
            Use the <code style={{ background: '#f3f4f6', borderRadius: 6, padding: '2px 6px', fontFamily: 'monospace', color: '#6b7280' }}>ADMIN_TOKEN</code> from your environment
          </p>
        </div>
      </section>
    </main>
  );

  /* ── Dashboard ── */
  return (
    <>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#fdf2f8 0%,#fce7f3 35%,#ede9fe 70%,#f0fdf4 100%)', paddingBottom: 64 }}>
        {/* blobs */}
        <div aria-hidden style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', top: -200, right: -150, background: 'radial-gradient(circle,rgba(236,72,153,.08) 0%,transparent 60%)' }} />
          <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', bottom: -200, left: -100, background: 'radial-gradient(circle,rgba(139,92,246,.07) 0%,transparent 60%)' }} />
        </div>

        {/* Header */}
        <header style={{ position: 'sticky', top: 0, zIndex: 20, borderBottom: '1px solid rgba(255,255,255,.4)', background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(16px)', boxShadow: '0 1px 12px rgba(0,0,0,.06)' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#ec4899,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(236,72,153,.3)', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#111827', lineHeight: 1 }}>Guestbook</h1>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: '#9ca3af', lineHeight: 1 }}>Admin Dashboard</p>
              </div>
            </div>

            {/* Status badge */}
            <span style={{
              padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', border: '1px solid',
              ...(loading ? { background: '#f3f4f6', color: '#6b7280', borderColor: '#e5e7eb' } : pending.length ? { background: '#fdf2f8', color: '#db2777', borderColor: '#fbcfe8' } : { background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' })
            }}>
              {loading ? '↻ Loading…' : pending.length ? `${pending.length} pending` : '✓ All clear'}
            </span>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={refresh} disabled={loading} aria-label="Refresh" title="Refresh"
                style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #e5e7eb', background: 'rgba(255,255,255,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, transition: 'box-shadow .15s', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                <svg viewBox="0 0 20 20" width="16" height="16" fill="#6b7280" style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/></svg>
              </button>
              <button onClick={logout} aria-label="Logout"
                style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #e5e7eb', background: 'rgba(255,255,255,.8)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#6b7280', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                <svg viewBox="0 0 20 20" width="15" height="15" fill="#6b7280"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/></svg>
                Logout
              </button>
            </div>
          </div>
        </header>

        <main style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>

          {/* Error */}
          {error && (
            <div role="alert" aria-live="polite" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, padding: '14px 18px', marginBottom: 24, fontSize: 14, color: '#dc2626', boxShadow: '0 2px 8px rgba(220,38,38,.08)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <svg viewBox="0 0 20 20" width="16" height="16" fill="#dc2626" style={{ marginTop: 2, flexShrink: 0 }}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                <span><strong>Error: </strong>{error}</span>
              </div>
              <button onClick={() => setError(null)} aria-label="Dismiss" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', opacity: 0.6, padding: 2, lineHeight: 1 }}>
                <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
              </button>
            </div>
          )}

          {/* Stats */}
          <section aria-labelledby="stats-title" style={{ marginBottom: 36 }}>
            <h2 id="stats-title" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>Statistics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              <StatCard label="Pending" value={stats?.pending ?? '—'} loading={loading && !stats}
                bar="linear-gradient(90deg,#ec4899,#f43f5e)" iconBg="#fdf2f8" iconColor="#ec4899"
                iconPath="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
              <StatCard label="Today" value={stats?.today ?? '—'} loading={loading && !stats}
                bar="linear-gradient(90deg,#f59e0b,#f97316)" iconBg="#fffbeb" iconColor="#f59e0b"
                iconPath="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
              <StatCard label="Total Approved" value={stats?.totalApproved ?? '—'} loading={loading && !stats}
                bar="linear-gradient(90deg,#10b981,#22c55e)" iconBg="#f0fdf4" iconColor="#10b981"
                iconPath="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
            </div>
          </section>

          {/* Messages */}
          <section aria-labelledby="pending-title">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 id="pending-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>
                <svg viewBox="0 0 20 20" width="14" height="14" fill="#9ca3af"><path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd"/></svg>
                Pending Messages
              </h2>
              {pending.length > 0 && (
                <span style={{ padding: '2px 10px', borderRadius: 999, background: '#fdf2f8', color: '#db2777', fontSize: 12, fontWeight: 700 }}>{pending.length}</span>
              )}
            </div>

            {/* Skeleton */}
            {loading && pending.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,.5)', background: 'rgba(255,255,255,.7)', padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e5e7eb', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ width: '30%', height: 12, borderRadius: 8, background: '#e5e7eb' }} />
                      <div style={{ width: '100%', height: 12, borderRadius: 8, background: '#e5e7eb' }} />
                      <div style={{ width: '70%', height: 12, borderRadius: 8, background: '#f3f4f6' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && pending.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 20, border: '2px dashed #fbcfe8', background: 'rgba(255,255,255,.5)', padding: '64px 20px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="#f9a8d4"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg>
                </div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#374151' }}>All caught up! 🎉</p>
                <p style={{ margin: '6px 0 0', fontSize: 14, color: '#9ca3af', maxWidth: 280 }}>No pending messages right now. New submissions will appear here.</p>
              </div>
            )}

            {/* List */}
            {pending.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pending.map((m) => (
                  <div key={m.id} style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,.6)', background: 'rgba(255,255,255,.85)', padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16, boxShadow: '0 2px 12px rgba(0,0,0,.06)', backdropFilter: 'blur(8px)' }}>
                    {/* Avatar */}
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: avatarGrad(m.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'white', flexShrink: 0, boxShadow: '0 3px 8px rgba(0,0,0,.15)' }}>
                      {initials(m.name)}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>{m.name}</span>
                        <time dateTime={new Date(m.createdAt).toISOString()} style={{ fontSize: 12, color: '#9ca3af' }}>{formatDate(m.createdAt)}</time>
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.6, color: '#4b5563', whiteSpace: 'pre-line' }}>{m.message}</p>
                    </div>
                    {/* Buttons */}
                    <div style={{ display: 'flex', flexShrink: 0, gap: 8, alignItems: 'center' }}>
                      <button onClick={() => approve(m.id)} aria-label={`Approve ${m.name}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', boxShadow: '0 3px 10px rgba(16,185,129,.3)' }}>
                        <svg viewBox="0 0 20 20" width="13" height="13" fill="white"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        Approve
                      </button>
                      <button onClick={() => setDeleteCandidate(m)} aria-label={`Delete ${m.name}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1.5px solid #fecaca', background: 'white', color: '#ef4444', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer' }}>
                        <svg viewBox="0 0 20 20" width="13" height="13" fill="#ef4444"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {deleteCandidate && <DeleteDialog candidate={deleteCandidate} onCancel={() => setDeleteCandidate(null)} onConfirm={discard} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:scale(.97); } to { opacity:1; transform:scale(1); } }
      `}</style>
    </>
  );
}

/* ─── StatCard ── */
function StatCard({ label, value, loading, bar, iconBg, iconColor, iconPath }: {
  label: string; value: number | string; loading?: boolean;
  bar: string; iconBg: string; iconColor: string; iconPath: string;
}) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 18, border: '1px solid rgba(255,255,255,.6)', background: 'rgba(255,255,255,.85)', padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,.07)', backdropFilter: 'blur(8px)' }}>
      <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 3, background: bar, borderRadius: '18px 18px 0 0' }} aria-hidden />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>{label}</p>
          <p style={{ margin: '8px 0 0', fontSize: 36, fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {loading ? <span style={{ display: 'inline-block', width: 60, height: 36, borderRadius: 8, background: '#e5e7eb' }} /> : value}
          </p>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg viewBox="0 0 20 20" width="20" height="20" fill={iconColor}><path fillRule="evenodd" d={iconPath} clipRule="evenodd"/></svg>
        </div>
      </div>
    </div>
  );
}

/* ─── DeleteDialog ── */
function DeleteDialog({ candidate, onCancel, onConfirm }: { candidate: Msg; onCancel: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) d.showModal();
    btnRef.current?.focus();
    return () => { if (d.open) d.close(); };
  }, []);

  return (
    <dialog ref={ref} role="alertdialog" aria-modal="true" aria-labelledby="del-title" aria-describedby="del-desc"
      onClose={onCancel} onCancel={e => { e.preventDefault(); onCancel(); }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
      style={{ padding: 0, border: 'none', borderRadius: 20, boxShadow: '0 32px 80px rgba(0,0,0,.22)', maxWidth: 380, width: '90vw', background: 'white', animation: 'fadeIn .18s ease' }}>
      <div style={{ padding: 28 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#ef4444" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
        </div>
        <h2 id="del-title" style={{ margin: 0, textAlign: 'center', fontSize: 18, fontWeight: 800, color: '#111827' }}>Delete this message?</h2>
        <p id="del-desc" style={{ margin: '10px 0 0', textAlign: 'center', fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
          Permanently removes the message from <strong style={{ color: '#374151' }}>{candidate.name}</strong>. This cannot be undone.
        </p>
        <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 12, background: '#f9fafb', border: '1px solid #f3f4f6', fontSize: 13, color: '#6b7280', fontStyle: 'italic', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
          &ldquo;{candidate.message}&rdquo;
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Cancel</button>
          <button ref={btnRef} onClick={onConfirm} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#ef4444,#e11d48)', fontSize: 14, fontWeight: 700, color: 'white', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', boxShadow: '0 4px 14px rgba(239,68,68,.35)' }}>Delete</button>
        </div>
      </div>
    </dialog>
  );
}
