// fg-entitlements.js — Feature flag system for Free / Member / Pro tiers.
// No payment logic here. Just the permission map and a can() checker.
// Add soft locks and upgrade prompts by calling can('featureName') before gating code.

const FG_PLAN = {
  FREE:   'free',
  MEMBER: 'member',
  PRO:    'pro',
};

// Which plans can access each feature.
// Order matters for display: features appear in upgrade prompts in this order.
const FG_FEATURES = {
  // ── Always available ──────────────────────────────────────────────────────
  play:              ['free', 'member', 'pro'],
  liveMode:          ['free', 'member', 'pro'],
  touchInteraction:  ['free', 'member', 'pro'],
  randomize:         ['free', 'member', 'pro'],
  generate:          ['free', 'member', 'pro'],
  genreSelect:       ['free', 'member', 'pro'],
  soundLibPreview:   ['free', 'member', 'pro'],

  // ── Member + Pro ──────────────────────────────────────────────────────────
  saveField:         ['member', 'pro'],   // Save / load named fields
  loadField:         ['member', 'pro'],   // Load saved fields
  soundEditing:      ['member', 'pro'],   // XY pads, faders, inspector detail
  scheduleView:      ['member', 'pro'],   // Live set schedule panel
  shortExport:       ['member', 'pro'],   // Image snapshot (canvas download)

  // ── Pro only ──────────────────────────────────────────────────────────────
  studioMode:        ['pro'],             // Full studio layout, all panels visible
  timeline:          ['pro'],             // Scene/timeline editor
  longRecording:     ['pro'],             // Audio recording > 30 seconds
  highResExport:     ['pro'],             // 2x/4x DPR canvas export
  noWatermark:       ['pro'],             // Export without FG watermark
  djSets:            ['pro'],             // Programmed live set runner
  multiScene:        ['pro'],             // More than 4 saved scenes
};

// ── Current session plan ────────────────────────────────────────────────────
// In production this will come from your auth/session layer.
// For now it reads from localStorage so you can test tiers manually:
//   localStorage.setItem('fg_plan', 'pro') then reload.
const FG_CURRENT_PLAN = (function() {
  try {
    const stored = localStorage.getItem('fg_plan');
    if (stored && Object.values(FG_PLAN).includes(stored)) return stored;
  } catch(e) {}
  return FG_PLAN.FREE;
})();

// ── Permission checker ──────────────────────────────────────────────────────
// Usage:  if (!FG.can('saveField')) { FG.prompt('saveField'); return; }
const FG = {
  plan: FG_CURRENT_PLAN,

  can(feature) {
    const allowed = FG_FEATURES[feature];
    if (!allowed) return true; // unknown features default open
    return allowed.includes(this.plan);
  },

  // Which plan is the minimum required for a feature
  requires(feature) {
    const allowed = FG_FEATURES[feature];
    if (!allowed || allowed.includes(FG_PLAN.FREE)) return null;
    if (allowed.includes(FG_PLAN.MEMBER)) return FG_PLAN.MEMBER;
    return FG_PLAN.PRO;
  },

  // Show a soft upgrade prompt (toast for now, modal later)
  prompt(feature) {
    const needed = this.requires(feature);
    if (!needed) return;
    const label = needed === FG_PLAN.MEMBER ? 'Member' : 'Pro';
    const messages = {
      saveField:     `Save Fields requires a ${label} account.`,
      soundEditing:  `Sound editing requires a ${label} account.`,
      studioMode:    `Studio mode is a ${label} feature.`,
      timeline:      `The timeline editor is a ${label} feature.`,
      longRecording: `Long recordings require ${label}.`,
      highResExport: `High-res export requires ${label}.`,
      noWatermark:   `Watermark-free export requires ${label}.`,
      djSets:        `Programmed DJ sets require ${label}.`,
      multiScene:    `More than 4 scenes requires ${label}.`,
    };
    const msg = messages[feature] || `This feature requires ${label}.`;
    // Use the app's toast if available, otherwise console
    if (typeof showToast === 'function') {
      showToast(msg);
    } else {
      console.log('[FG Entitlements]', msg);
    }
  },
};
