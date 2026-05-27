// fg-auth.js — Sign in / Sign up / Subscription UI
// Ports the auth flow from v1's inline implementation to a standalone module.
// Talks to: /api/auth/login, /api/auth/register, /api/logout, /api/auth/user,
//           /api/subscription, /api/subscription/checkout, /api/subscription/portal,
//           /api/session/start, /api/session/end, /api/admin/stats
// Depends on: fg-entitlements.js (updates FG.plan based on subscription)
// Loads BEFORE fg-ui.js so showToast and other globals can call into it.

const appState = {
  user: null,
  isPro: false,
  isAdmin: false,
  sessionId: null,
  sessionStart: null,
};

// Make available globally so other modules can read auth state.
window.appState = appState;

let _authMode = 'login'; // 'login' | 'register'

// ── Boot — fetch user + subscription, start session, handle ?checkout=success ──
async function initAuth() {
  try {
    const [userRes, subRes] = await Promise.all([
      fetch('/api/auth/user', { credentials: 'include' }),
      fetch('/api/subscription', { credentials: 'include' }),
    ]);

    if (userRes.ok) {
      appState.user = await userRes.json();
      if (subRes.ok) {
        const subData = await subRes.json();
        appState.isPro = !!subData.isActive;
        appState.isAdmin = !!subData.isAdmin;
      }
      // Start analytics session
      appState.sessionStart = Date.now();
      fetch('/api/session/start', { method: 'POST', credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d && d.sessionId) appState.sessionId = d.sessionId; })
        .catch(() => {});
    }
  } catch (e) {
    // Not logged in or server not ready — silent fallback
  }

  // Sync entitlements plan based on server truth
  syncPlanFromSession();

  renderHeader();

  // Handle Stripe checkout return
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      showCheckoutSuccess();
      window.history.replaceState({}, '', window.location.pathname);
    }
  } catch (e) {}
}

// Map server subscription state → FG.plan ('free' | 'member' | 'pro')
function syncPlanFromSession() {
  if (typeof FG === 'undefined') return;
  if (appState.isAdmin || appState.isPro) {
    FG.plan = 'pro';
  } else if (appState.user) {
    // Logged-in non-pro = member-tier (saved fields, sound editing, etc)
    FG.plan = 'member';
  } else {
    FG.plan = 'free';
  }
}

// ── Send session-end beacon on tab close ──
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && appState.sessionId && appState.sessionStart) {
    const duration = Math.round((Date.now() - appState.sessionStart) / 1000);
    try {
      const blob = new Blob(
        [JSON.stringify({ sessionId: appState.sessionId, durationSeconds: duration })],
        { type: 'application/json' }
      );
      navigator.sendBeacon('/api/session/end', blob);
    } catch (e) {}
  }
});

// ── Header right — sign in/up buttons OR user chip ──
function renderHeader() {
  const el = document.getElementById('headerRight');
  if (!el) return;

  if (!appState.user) {
    el.innerHTML =
      '<button class="auth-btn" onclick="openAuthModal(false)" data-testid="button-sign-in">Sign In</button>' +
      '<button class="auth-btn primary-btn" onclick="openAuthModal(true)" data-testid="button-sign-up">Sign Up</button>';
    return;
  }

  const u = appState.user;
  const initials = [u.firstName, u.lastName]
    .filter(Boolean)
    .map(s => s[0])
    .join('') || (u.email ? u.email[0].toUpperCase() : '?');
  const avatarHtml = u.profileImageUrl
    ? '<img class="user-avatar" src="' + u.profileImageUrl + '" alt="">'
    : '<div class="user-avatar-placeholder">' + initials + '</div>';

  let badge;
  if (appState.isAdmin) {
    badge = '<button class="admin-badge" onclick="openAdminPanel()" data-testid="button-admin">Admin</button>';
  } else if (appState.isPro) {
    badge = '<span class="pro-badge">Pro</span>';
  } else {
    badge = '<button class="pro-badge inactive" onclick="openUpgradeModal()" style="cursor:pointer;border:none;font-family:inherit">Upgrade</button>';
  }

  el.innerHTML =
    '<div class="user-chip">' +
      avatarHtml +
      '<span>' + (u.firstName || u.email || 'User') + '</span>' +
      badge +
    '</div>' +
    '<button class="auth-btn" onclick="doLogout()" data-testid="button-sign-out">Sign Out</button>';
}

// ── AUTH MODAL ──
function openAuthModal(isRegister) {
  _authMode = isRegister ? 'register' : 'login';
  const overlay = document.getElementById('authOverlay');
  if (!overlay) return;
  document.getElementById('authModalTitle').textContent = isRegister ? 'Create Account' : 'Sign In';
  document.getElementById('authSubmitBtn').textContent  = isRegister ? 'Create Account' : 'Sign In';
  document.getElementById('authSwitchText').textContent = isRegister ? 'Have an account?' : 'No account?';
  document.getElementById('authSwitchBtn').textContent  = isRegister ? 'Sign In' : 'Sign Up';
  document.getElementById('authNameRow').style.display = isRegister ? 'block' : 'none';
  document.getElementById('authErr').textContent = '';
  document.getElementById('authEmail').value = '';
  document.getElementById('authPassword').value = '';
  const firstName = document.getElementById('authFirstName');
  if (firstName) firstName.value = '';
  overlay.classList.add('open');
  setTimeout(() => {
    const focusEl = isRegister && firstName ? firstName : document.getElementById('authEmail');
    if (focusEl) focusEl.focus();
  }, 50);
}

function closeAuthModal() {
  const overlay = document.getElementById('authOverlay');
  if (overlay) overlay.classList.remove('open');
}

function toggleAuthMode() {
  openAuthModal(_authMode === 'login');
}

async function submitAuth() {
  const btn   = document.getElementById('authSubmitBtn');
  const errEl = document.getElementById('authErr');
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  errEl.textContent = '';

  if (!email || !password) {
    errEl.textContent = 'Email and password are required.';
    return;
  }
  if (_authMode === 'register' && password.length < 8) {
    errEl.textContent = 'Password must be at least 8 characters.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Please wait…';

  try {
    const url = _authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const firstName = document.getElementById('authFirstName')
      ? document.getElementById('authFirstName').value.trim() || undefined
      : undefined;
    const body = _authMode === 'register'
      ? { email, password, firstName }
      : { email, password };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Something went wrong');

    appState.user = data;

    // Re-fetch subscription
    const subRes = await fetch('/api/subscription', { credentials: 'include' });
    if (subRes.ok) {
      const sub = await subRes.json();
      appState.isPro = !!sub.isActive;
      appState.isAdmin = !!sub.isAdmin;
    }
    syncPlanFromSession();

    // Start a session row
    appState.sessionStart = Date.now();
    fetch('/api/session/start', { method: 'POST', credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && d.sessionId) appState.sessionId = d.sessionId; })
      .catch(() => {});

    closeAuthModal();
    renderHeader();
    if (typeof showToast === 'function') {
      showToast(_authMode === 'register' ? 'Account created ✓' : 'Signed in ✓');
    }
  } catch (e) {
    errEl.textContent = e.message || 'Sign in failed';
    btn.disabled = false;
    btn.textContent = _authMode === 'register' ? 'Create Account' : 'Sign In';
  }
}

async function doLogout() {
  try {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
  } catch (e) {}
  appState.user = null;
  appState.isPro = false;
  appState.isAdmin = false;
  appState.sessionId = null;
  syncPlanFromSession();
  renderHeader();
  if (typeof showToast === 'function') showToast('Signed out');
}

// ── UPGRADE MODAL / STRIPE CHECKOUT ──
function openUpgradeModal() {
  const overlay = document.getElementById('upgradeOverlay');
  if (!overlay) return;
  if (!appState.user) {
    // Not signed in — show auth modal instead, in register mode
    openAuthModal(true);
    return;
  }
  const upgradeBtn = document.getElementById('upgradeBtn');
  const manageBtn  = document.getElementById('manageBtn');
  if (appState.isPro) {
    upgradeBtn.style.display = 'none';
    manageBtn.style.display = '';
    manageBtn.disabled = false;
    manageBtn.textContent = 'Manage Subscription';
  } else {
    upgradeBtn.style.display = '';
    upgradeBtn.disabled = false;
    upgradeBtn.textContent = 'Upgrade to Pro';
    manageBtn.style.display = 'none';
  }
  document.getElementById('upgradeErr').textContent = '';
  overlay.classList.add('open');
}

function closeUpgradeModal() {
  const overlay = document.getElementById('upgradeOverlay');
  if (overlay) overlay.classList.remove('open');
}

async function startCheckout() {
  if (!appState.user) { openAuthModal(true); return; }
  const btn = document.getElementById('upgradeBtn');
  const errEl = document.getElementById('upgradeErr');
  btn.disabled = true;
  btn.textContent = 'Loading…';
  errEl.textContent = '';
  try {
    const res = await fetch('/api/subscription/checkout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed');
    window.location.href = data.url;
  } catch (e) {
    errEl.textContent = e.message || 'Something went wrong. Please try again.';
    btn.disabled = false;
    btn.textContent = 'Upgrade to Pro';
  }
}

async function openPortal() {
  const btn = document.getElementById('manageBtn');
  btn.disabled = true;
  btn.textContent = 'Loading…';
  try {
    const res = await fetch('/api/subscription/portal', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed');
    window.location.href = data.url;
  } catch (e) {
    document.getElementById('upgradeErr').textContent = e.message || 'Something went wrong.';
    btn.disabled = false;
    btn.textContent = 'Manage Subscription';
  }
}

function showCheckoutSuccess() {
  const banner = document.createElement('div');
  banner.style.cssText = 'position:fixed;top:14px;left:50%;transform:translateX(-50%);background:#aaff3e;color:#000;padding:10px 22px;border-radius:20px;font-size:.7rem;font-weight:500;z-index:300;box-shadow:0 4px 20px rgba(0,0,0,.5);font-family:monospace;cursor:pointer';
  banner.textContent = '✦ Pro unlocked — high-resolution exports & all features are now available!';
  banner.addEventListener('click', () => banner.remove());
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 6000);
  appState.isPro = true;
  syncPlanFromSession();
  renderHeader();
}

// ── ADMIN PANEL ──
function openAdminPanel() {
  const overlay = document.getElementById('adminOverlay');
  if (!overlay) return;
  overlay.classList.add('open');
  loadAdminStats();
}

function closeAdminPanel() {
  const overlay = document.getElementById('adminOverlay');
  if (overlay) overlay.classList.remove('open');
}

async function loadAdminStats() {
  const body = document.getElementById('adminBody');
  if (!body) return;
  body.innerHTML = '<div class="admin-loading">Loading statistics…</div>';
  try {
    const res = await fetch('/api/admin/stats', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load stats');
    const data = await res.json();
    renderAdminStats(data);
  } catch (e) {
    body.innerHTML = '<div class="admin-loading">Failed to load statistics.</div>';
  }
}

function renderAdminStats(data) {
  const totals    = data.totals    || { userCount: 0, sessionCount: 0, totalHours: 0 };
  const users     = data.users     || [];
  const countries = data.countries || [];
  const maxCountry = countries.length ? countries[0].count : 1;

  const fmtSec = s => {
    if (s < 60) return s + 's';
    if (s < 3600) return Math.floor(s / 60) + 'm ' + (s % 60) + 's';
    return Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm';
  };

  const countryRows = countries.length
    ? countries.map(c => '<tr>' +
        '<td>' + c.country + '</td>' +
        '<td><div class="country-bar-wrap">' +
          '<div class="country-bar-bg"><div class="country-bar-fill" style="width:' + Math.round(c.count / maxCountry * 100) + '%"></div></div>' +
          '<span style="min-width:28px;text-align:right;color:var(--muted)">' + c.count + '</span>' +
        '</div></td></tr>').join('')
    : '<tr><td colspan="2" class="admin-empty">No sessions recorded yet</td></tr>';

  const userRows = users.length
    ? users.map(u => {
        const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || u.id;
        const lastSeen = u.lastSeenAt ? new Date(u.lastSeenAt).toLocaleDateString() : '—';
        const role = u.role || 'user';
        const roleTag = '<span class="role-tag ' + role + '">' + role + '</span>';
        return '<tr>' +
          '<td style="max-width:200px"><div style="display:flex;align-items:center;gap:7px">' +
            '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + name + '</span>' +
            roleTag + '</div></td>' +
          '<td style="color:var(--muted);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (u.email || '—') + '</td>' +
          '<td>' + fmtSec(u.totalSeconds || 0) + '</td>' +
          '<td style="color:var(--muted)">' + (u.sessionCount || 0) + '</td>' +
          '<td style="color:var(--muted)">' + lastSeen + '</td>' +
        '</tr>';
      }).join('')
    : '<tr><td colspan="5" class="admin-empty">No users yet</td></tr>';

  document.getElementById('adminBody').innerHTML =
    '<div class="admin-stats-row">' +
      '<div class="admin-stat-card"><div class="admin-stat-value">' + totals.userCount + '</div><div class="admin-stat-label">Total Users</div></div>' +
      '<div class="admin-stat-card"><div class="admin-stat-value">' + totals.sessionCount + '</div><div class="admin-stat-label">Total Sessions</div></div>' +
      '<div class="admin-stat-card"><div class="admin-stat-value">' + (totals.totalHours || 0) + 'h</div><div class="admin-stat-label">Total Hours Spent</div></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 2fr;gap:24px">' +
      '<div class="admin-section">' +
        '<div class="admin-section-title">Sessions by Country</div>' +
        '<table class="admin-table">' +
          '<thead><tr><th>Country</th><th>Sessions</th></tr></thead>' +
          '<tbody>' + countryRows + '</tbody>' +
        '</table>' +
      '</div>' +
      '<div class="admin-section">' +
        '<div class="admin-section-title">Users</div>' +
        '<table class="admin-table">' +
          '<thead><tr><th>Name</th><th>Email</th><th>Time Spent</th><th>Sessions</th><th>Last Seen</th></tr></thead>' +
          '<tbody>' + userRows + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
}

// ── Modal-overlay click-outside-to-close ──
document.addEventListener('DOMContentLoaded', () => {
  const authOverlay = document.getElementById('authOverlay');
  if (authOverlay) {
    authOverlay.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeAuthModal();
    });
  }
  const upOverlay = document.getElementById('upgradeOverlay');
  if (upOverlay) {
    upOverlay.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeUpgradeModal();
    });
  }
  const adOverlay = document.getElementById('adminOverlay');
  if (adOverlay) {
    adOverlay.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeAdminPanel();
    });
  }
  // Enter key submits auth form
  const pwField = document.getElementById('authPassword');
  if (pwField) {
    pwField.addEventListener('keydown', e => {
      if (e.key === 'Enter') submitAuth();
    });
  }
});

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}
