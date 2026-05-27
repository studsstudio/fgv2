// fg-state.js — Pure app model. No audio, no DOM, no side effects.
// Other modules READ these variables directly.
// To mutate: assign directly or use the helpers below.
// Side effects (stopping drones, rebuilding UI) live in applyLoadedState() in fg-main.js.

// ── Core session state ────────────────────────────────────────────────────────
let elements    = [];
let nextId      = 1;
let activeId    = null;
let currentTool = 'blob';
let currentStyle = 'deephouse';
let bpm         = 126;
let generateActive = false;
let showMarkers = true;
let bgColor     = '#000000';

// ── Palette ───────────────────────────────────────────────────────────────────
let paletteHue = Math.random() * 360;
let paletteIdx = 0;

// ── Drum state ────────────────────────────────────────────────────────────────
let drumPattern = {
  kick:   [...DRUM_PRESETS[0].kick],
  clap:   [...DRUM_PRESETS[0].clap],
  hihat:  [...DRUM_PRESETS[0].hihat],
  openhh: [...DRUM_PRESETS[0].openhh],
  perc:   [...DRUM_PRESETS[0].perc],
  snap:   [...(DRUM_PRESETS[0].snap || Array(16).fill(0))],
};
let activeDrumPreset = 0;
let activeDrumStyle  = 'house';

// ── Saved fields (vibes) ──────────────────────────────────────────────────────
let activeVibeName = null;

// ── Scenes / timeline ─────────────────────────────────────────────────────────
const TL_TOTAL_BARS = 32;
let scenes        = [];
let activeSceneId = null;
let xfadeBars     = 4;

// ── Undo / redo ───────────────────────────────────────────────────────────────
const undoStack = [];
const redoStack = [];

// ─────────────────────────────────────────────────────────────────────────────
// createElement — returns a fresh element object (no side effects)
// ─────────────────────────────────────────────────────────────────────────────
function createElement(vtype, x, y, color) {
  return {
    id: nextId++,
    visualType: vtype,
    soundType: 'Drone',
    variation: 0,
    shape: { x: 0.7, y: 0.7 },
    tone:  { x: 0.4, y: 0.2 },
    space: { x: 0.35, y: 0.4 },
    volume: 0.75,
    pan: 0,
    note: 'A3',
    muted: false,
    soloed: false,
    syncMode: 'free',
    x, y, color: color || '#7b2fff',
    opacity: 0.85, radius: 0.35,
    x1: x - 0.15, y1: y, x2: x + 0.15, y2: y,
    angle: 0, coneWidth: 0.3, intensity: 0.8,
    pos: x, width: 0.25, beamAngle: 0,
    _pulse: 0, _flashPulse: 0,
    _animPhase: Math.random() * Math.PI * 2,
    _cloudOffsets: null,
    _droneNode: null,
    _depth: Math.random() < 0.3 ? 0.35 + Math.random() * 0.2
           : Math.random() < 0.4 ? 0.85 + Math.random() * 0.15
           :                        0.55 + Math.random() * 0.3,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// serializeState — pure snapshot, safe to call anytime
// ─────────────────────────────────────────────────────────────────────────────
function serializeState() {
  return {
    elements: elements.map(el => {
      const { _droneNode, _pulse, _flashPulse, _cloudOffsets, ...clean } = el;
      return clean;
    }),
    drumPattern:      JSON.parse(JSON.stringify(drumPattern)),
    activeDrumPreset,
    bgColor,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// hydrateState — updates app model ONLY. No audio, no DOM.
// Call this from applyLoadedState (in fg-main.js) after stopping audio.
// ─────────────────────────────────────────────────────────────────────────────
function hydrateState(state) {
  bgColor          = state.bgColor || '#000000';
  activeDrumPreset = state.activeDrumPreset ?? 0;
  activeDrumStyle  = (DRUM_PRESETS[activeDrumPreset]?.drumStyle) || state.drumStyle || 'house';

  if (state.drumPattern) {
    drumPattern = JSON.parse(JSON.stringify(state.drumPattern));
  }

  elements = (state.elements || []).map(e => {
    const el = {
      ...e,
      _droneNode:    null,
      _pulse:        0,
      _flashPulse:   0,
      _cloudOffsets: null,
      _animPhase:    Math.random() * Math.PI * 2,
    };
    if (!el.shape)     el.shape     = { x: 0.7, y: 0.7 };
    if (!el.tone)      el.tone      = { x: 0.4, y: 0.2 };
    if (!el.space)     el.space     = { x: 0.35, y: 0.4 };
    if (!el.soundType) el.soundType = 'Drone';
    if (!el.note)      el.note      = 'A3';
    if (!el.syncMode || !el.triggerMode) applyRoleAndTriggerMode(el);
    return el;
  });

  nextId   = elements.reduce((max, e) => Math.max(max, e.id + 1), 1);
  activeId = null;
}

// ─────────────────────────────────────────────────────────────────────────────
// pushUndo — snapshot current state onto the undo stack
// ─────────────────────────────────────────────────────────────────────────────
function pushUndo() {
  undoStack.push(JSON.stringify(serializeState()));
  if (undoStack.length > 30) undoStack.shift();
  redoStack.length = 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene helpers
// ─────────────────────────────────────────────────────────────────────────────
function addScene(name, state, color, startBar = 0, durationBars = 8) {
  const id = Date.now();
  scenes.push({ id, name, state, color, startBar, durationBars });
  activeSceneId = id;
}

// ─────────────────────────────────────────────────────────────────────────────
// localStorage helpers — saved fields (vibes)
// ─────────────────────────────────────────────────────────────────────────────
function loadUserVibes() {
  try { return JSON.parse(localStorage.getItem('fg_v15_vibes') || '[]'); }
  catch { return []; }
}
function saveUserVibes(v) {
  try { localStorage.setItem('fg_v15_vibes', JSON.stringify(v)); }
  catch(e) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// API SNAPSHOT SHARING
// POSTs field state to /api/snapshots → gets short ID → shareable URL
// Falls back to URL param encoding if API unavailable
// ─────────────────────────────────────────────────────────────────────────────

async function createSnapshot() {
  const state = {
    ...serializeState(),
    currentStyle,
    bpm: Math.round(bpm),
    v: 1,
  };
  // Strip runtime fields
  state.elements = state.elements.map(el => {
    const { _animPhase, _depth, _lastPulse, _holdFlickerHz, _holdStartT,
            _tx, _ty, _momentumRaf, _fading, _touchHeld, ...clean } = el;
    return clean;
  });
  try {
    const res = await fetch('/api/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: state }),
    });
    if (!res.ok) throw new Error('API error');
    const { id } = await res.json();
    return `${window.location.origin}/s/${id}`;
  } catch(e) {
    // Fallback to URL param
    return stateToURL();
  }
}

async function loadFromSnapshot(id) {
  try {
    const res = await fetch(`/api/snapshots/${id}`);
    if (!res.ok) return false;
    const state = await res.json();
    if (!state || !state.elements) return false;
    if (state.currentStyle && STYLES[state.currentStyle]) currentStyle = state.currentStyle;
    if (state.bpm && state.bpm > 60 && state.bpm < 200) bpm = state.bpm;
    hydrateState(state);
    return true;
  } catch(e) {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// URL STATE SHARING
// Encodes full app state into a URL-safe Base64 string and back.
// Usage:
//   const url = stateToURL();        // → full URL with ?fg=<encoded>
//   const ok  = loadFromURL();       // call on boot — returns true if loaded
// ─────────────────────────────────────────────────────────────────────────────

function stateToURL() {
  const state = {
    ...serializeState(),
    currentStyle,
    bpm: Math.round(bpm),
    v: 1,
  };

  // Strip runtime-only fields that bloat the URL
  state.elements = state.elements.map(el => {
    const {
      _animPhase, _depth, _lastPulse, _holdFlickerHz, _holdStartT,
      _tx, _ty, _momentumRaf, _fading, _touchHeld,
      ...clean
    } = el;
    return clean;
  });

  try {
    const json = JSON.stringify(state);
    // Encode: JSON → UTF-8 bytes → base64 → URL-safe base64
    const bytes = new TextEncoder().encode(json);
    const b64   = btoa(String.fromCharCode(...bytes));
    const safe  = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const url   = new URL(window.location.href);
    url.searchParams.set('fg', safe);
    return url.toString();
  } catch(e) {
    console.error('stateToURL failed:', e);
    return window.location.href;
  }
}

function urlToState(urlString) {
  try {
    const url   = new URL(urlString || window.location.href);
    const param = url.searchParams.get('fg');
    if (!param) return null;

    // Restore URL-safe base64 → base64 → bytes → UTF-8 string
    const b64   = param.replace(/-/g, '+').replace(/_/g, '/');
    const pad   = b64 + '=='.slice(0, (4 - b64.length % 4) % 4);
    const bytes = Uint8Array.from(atob(pad), c => c.charCodeAt(0));
    const json  = new TextDecoder().decode(bytes);
    const state = JSON.parse(json);
    if (!state || !state.elements) return null;
    return state;
  } catch(e) {
    console.error('urlToState failed:', e);
    return null;
  }
}

function loadFromURL() {
  const state = urlToState();
  if (!state) return false;
  try {
    // Apply style + bpm from URL state before hydrateState
    if (state.currentStyle && STYLES[state.currentStyle]) {
      currentStyle = state.currentStyle;
    }
    if (state.bpm && state.bpm > 60 && state.bpm < 200) {
      bpm = state.bpm;
    }
    hydrateState(state);
    return true;
  } catch(e) {
    console.error('loadFromURL failed:', e);
    return false;
  }
}

function copyFieldLink() {
  // Show loading state immediately
  if (typeof showToast === 'function') showToast('Creating link…');

  createSnapshot().then(url => {
    const _showLink = (success) => {
      if (typeof showToast === 'function') {
        showToast(success ? '🔗 Link copied!' : '🔗 Link ready');
      }
      _showLinkOverlay(url);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => _showLink(true))
        .catch(() => {
          _execCommandCopy(url);
          _showLink(false);
        });
    } else {
      _execCommandCopy(url);
      _showLink(false);
    }
  }).catch(() => {
    if (typeof showToast === 'function') showToast('Failed to create link');
  });
}

function _execCommandCopy(url) {
  try {
    const ta = document.createElement('textarea');
    ta.value = url;
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch(e) { return false; }
}

function _showLinkOverlay(url) {
  // Remove any existing overlay
  const existing = document.getElementById('_fgLinkOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = '_fgLinkOverlay';
  overlay.style.cssText = [
    'position:fixed;bottom:80px;left:50%;transform:translateX(-50%)',
    'background:rgba(10,10,20,0.97);border:1px solid rgba(126,232,162,0.4)',
    'border-radius:8px;padding:12px 16px;z-index:9999;max-width:90vw',
    'display:flex;align-items:center;gap:10px;font-family:monospace',
    'box-shadow:0 4px 24px rgba(0,0,0,0.6)'
  ].join(';');

  const urlText = document.createElement('input');
  urlText.type = 'text';
  urlText.value = url;
  urlText.readOnly = true;
  urlText.style.cssText = [
    'background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12)',
    'color:rgba(255,255,255,0.85);font-size:10px;padding:6px 10px',
    'border-radius:4px;width:280px;max-width:60vw;font-family:monospace',
    'cursor:text;outline:none'
  ].join(';');

  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy';
  copyBtn.style.cssText = [
    'background:rgba(126,232,162,0.15);border:1px solid rgba(126,232,162,0.4)',
    'color:rgba(126,232,162,0.9);font-size:10px;padding:6px 14px',
    'border-radius:4px;cursor:pointer;white-space:nowrap;font-family:inherit'
  ].join(';');
  copyBtn.onclick = () => {
    urlText.select();
    navigator.clipboard?.writeText(url).catch(() => document.execCommand('copy'));
    copyBtn.textContent = '✓ Copied';
    copyBtn.style.color = 'rgba(126,232,162,1)';
    setTimeout(() => overlay.remove(), 1500);
  };

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = [
    'background:none;border:none;color:rgba(255,255,255,0.4)',
    'font-size:14px;cursor:pointer;padding:4px;flex-shrink:0'
  ].join(';');
  closeBtn.onclick = () => overlay.remove();

  overlay.appendChild(urlText);
  overlay.appendChild(copyBtn);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);

  // Auto-select the URL so user can immediately Ctrl+C
  setTimeout(() => { urlText.focus(); urlText.select(); }, 50);

  // Auto-dismiss after 12 seconds
  setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 12000);
}
