// fg-conductor.js — Generative music brain, arc transitions, DJ logic, genre morph.
// evolveOnBar, DJBrain, build/drop/break arcs, chord progression, motif,
// live sets, genre graph, softDrift, morphToGenre, contextFill.
// Depends on: fg-data.js, fg-state.js, fg-audio.js, fg-instruments.js

function getGroove(){ return GROOVE_PROFILES[currentStyle]||GROOVE_PROFILES.deephouse; }
// ─── GENRE GRAMMAR ────────────────────────────────────────────────────────────

function getGrammar(){ return GENRE_GRAMMAR[currentStyle]||GENRE_GRAMMAR.deephouse; }


let _currentProgression = null;
let _currentChordIdx    = 0;
let _chordCycleBars     = 4;

// Per-scale remapping of progression degrees. The raw progressions in
// CHORD_PROGRESSIONS are written assuming a minor-mode harmonic context
// (0=i, 5=VI, 2=III, 4=v, 3=iv). For other modes, the leading function lives
// at a different degree (e.g. Phrygian has no V), so we map per scale.
// `null` keys = use raw degree unchanged (Minor, Major behave well as-is).
const SCALE_DEGREE_REMAP = {
  Phrygian: {
    // No V. Use bII (1) as the dark leading move, bVII (6) as alt-dominant.
    4: 1,   // v → bII (Neapolitan-flavored push)
    6: 6,   // VII stays
    3: 3, 5: 5, 2: 2, 0: 0,
  },
  Lydian: {
    // #IV is bright. Use II (1, raised in Lydian context) as predominant.
    3: 1,   // iv → II  (Lydian doesn't have a strong iv)
    5: 5, 4: 4, 2: 2, 0: 0,
  },
  Pentatonic: {
    // Only 5 notes. Map any degree out-of-set to nearest in-set: 0,1,2,3,4.
    0:0, 2:1, 5:3, 4:4, 3:2, 6:4, 1:0,
  },
  Chromatic: {
    // 12-tone — keep degrees as-is; user gets whatever they ask for.
  },
  // Minor, Major, Dorian work cleanly with raw indices (Dorian's natural-6
  // and minor-7 produce mildly different colours but the function map holds).
};

function _remapProgressionForScale(progression, scaleName){
  const map = SCALE_DEGREE_REMAP[scaleName];
  if(!map) return progression;
  return progression.map(deg => (map[deg] !== undefined ? map[deg] : deg));
}

function pickProgressionForStyle(style){
  const cfg = CHORD_PROGRESSIONS[style] || CHORD_PROGRESSIONS.deephouse;
  const raw = cfg.progressions[Math.floor(Math.random()*cfg.progressions.length)];
  // Apply mode-aware remap based on current scale selection.
  const scaleName = (typeof document !== 'undefined')
    ? (document.getElementById('scaleSelect')?.value || 'Minor')
    : 'Minor';
  _currentProgression = _remapProgressionForScale(raw, scaleName);
  _currentChordIdx    = 0;
  _chordCycleBars     = cfg.cycleBars;
}

function getChordRootDeg(){
  // Lazy-init: if no progression has been picked (cold start before evolveOnBar
  // runs its first chord-cycle modulo), pick one now so harmonic state is sane.
  if(!_currentProgression){
    pickProgressionForStyle(currentStyle);
  }
  if(!_currentProgression || !_currentProgression.length) return 0;
  const deg = _currentProgression[_currentChordIdx % _currentProgression.length];
  return (typeof deg === 'number') ? deg : 0;
}

function advanceChord(){
  if(!_currentProgression) return;
  _currentChordIdx = (_currentChordIdx + 1) % _currentProgression.length;
}

function ensureRoleTag(el){
  if(el._roleDeg != null && el._roleOct != null) return;
  const arr = (STYLES[currentStyle]||STYLES.deephouse||{}).arrangement || [];
  const r = arr.find(rr => rr.soundType === el.soundType);
  if(r){ el._roleDeg = r.deg; el._roleOct = r.oct; }
  else  { el._roleDeg = 0; el._roleOct = (el.note && parseInt(el.note.slice(-1))) || 3; }
}

function applyChordToElement(el, root, scale){
  if(!HARMONIC_TYPES.has(el.soundType)) return;
  // Bass elements (Sub, Acid) stay on root in modal genres
  const isBass = el.soundType === 'Sub' || el.soundType === 'Acid';
  if(isBass && !(BASS_FOLLOWS_CHORD[currentStyle] ?? true)) return;
  ensureRoleTag(el);
  const chordRoot = getChordRootDeg();
  const newNote   = getHarmonicNote(root, scale, el._roleDeg + chordRoot, el._roleOct);
  if(newNote === el.note) return;
  el.note = newNote;
  // Advance inversion index for chord-tone elements — smoother voice leading.
  // Includes atmosphere (pads/drones that sustain chords) and harmonic mid-voices
  // (Pulse, EP, FM3, FMStab — they realize chord tones via getChordVoicing).
  const INVERSION_TYPES = new Set(['WTPad','Pad','Chord','Drone','Shimmer','Pulse','EP','FM3','FMStab']);
  if(INVERSION_TYPES.has(el.soundType)){
    el._inversionIdx = ((el._inversionIdx || 0) + 1) % 3;
  }
  // Glide drones smoothly to the new pitch
  if(el._droneNode && audioCtx){
    const newFreq = midiToFreq(noteToMidi(newNote));
    const now     = audioCtx.currentTime;
    el._droneNode.oscs?.forEach(o => {
      try{
        if(o.frequency && o.frequency.value > 10){
          const ratio = o.frequency.value / (el._lastBaseFreq || newFreq);
          // Clamp ratio to [0.5, 4]: a voice can be at most 2 octaves above the
          // base. Wider clamp ([0.25, 16]) compounded drift over many chord
          // changes — voices wandered out of their intended register.
          o.frequency.setTargetAtTime(newFreq * Math.max(0.5,Math.min(4,ratio)), now, 0.18);
        }
      }catch(e){}
    });
    el._lastBaseFreq = newFreq;
  }
  // Arp pattern needs to be rebuilt against the new root
  if(el.soundType === 'Arp') el._arpPendingPattern = true;
}

function applyChordChangeToAll(){
  const root  = document.getElementById('keySelect').value || 'A';
  const scale = document.getElementById('scaleSelect').value || 'Minor';
  elements.forEach(el => applyChordToElement(el, root, scale));
  // Drift to a fresh Suprematist layout with the chord change.
  // Delay is tempo-aware (~half a beat at current BPM) so it feels musical
  // at all tempos — fixed 180ms felt rushed at 90 BPM, late at 170 BPM.
  const halfBeatMs = (typeof bpm === 'number' && bpm > 30) ? (30000 / bpm) : 180;
  setTimeout(reshuffleComposition, halfBeatMs);
}

let _densityMutedIds = new Set();

function densityMute(count){
  if(!soundEnabled) return;
  const activeCount = elements.filter(e => !e.muted).length;
  // Keep at least 3 elements playing (Sub + 2 others minimum)
  const maxMuteable = Math.max(0, activeCount - 3);
  const n = Math.min(count, maxMuteable);
  if(n <= 0) return;
  const candidates = elements.filter(e =>
    DENSITY_COLOR_TYPES.has(e.soundType) && !e.muted && !_densityMutedIds.has(e.id)
  );
  if(!candidates.length) return;
  const shuffled = candidates.slice().sort(() => Math.random() - 0.5).slice(0, n);
  shuffled.forEach(el => {
    el.muted = true;
    _densityMutedIds.add(el.id);
    stopDrone(el, 0.5); // gentle 500ms fade
  });
}

function densityUnmute(){
  if(_densityMutedIds.size === 0) return;
  _densityMutedIds.forEach(id => {
    const el = elements.find(e => e.id === id);
    if(!el) return;
    el.muted = false;
    if(soundEnabled) setTimeout(() => maybeStartDrone(el), 100);
  });
  _densityMutedIds.clear();
}

let _formOpenness   = 1.0;  // 0=closed/dark, 1=open/bright — multiplies pad filter
let _formReverbMult = 1.0;  // multiplies reverb wet via conductor
let _lastReverbThrowBar = -99; // track when last throw happened to avoid overuse

function pickReverbThrowEl(){
  // Don't pick if any throw is currently active anywhere — prevents the rare
  // overlap when formCycle breakdown + phrase-boundary throw both fire close
  // together (they'd land on different elements but the wash would double-up).
  // Read from window so this works regardless of which module sets the flag.
  if(typeof window !== 'undefined' && window._anyReverbThrowActive) return null;
  const PREFERRED=['Vocal','Chord','WTPad','Drone','Pad'];
  const candidates=elements.filter(el=>
    !el.muted && el._droneNode && PREFERRED.includes(el.soundType) && !el._reverbThrowActive
  );
  if(!candidates.length) return null;
  // Weight toward preferred types
  const sorted=candidates.sort((a,b)=>PREFERRED.indexOf(a.soundType)-PREFERRED.indexOf(b.soundType));
  return sorted[0];
}

function applyFormPosition(phraseBar, formCycle){
  const pct = phraseBar / formCycle;
  let openness, reverbMult;
  if(pct < 0.25){
    // Intro: closed → opening, slightly more reverb
    const t = pct / 0.25;
    openness   = 0.55 + t * 0.40;   // 0.55 → 0.95
    reverbMult = 1.10 - t * 0.10;   // 1.10 → 1.00
  } else if(pct < 0.75){
    // Peak: full body, drier
    openness   = 1.00;
    reverbMult = 0.95;
  } else if(pct < 0.875){
    // Breakdown: darken filter, open reverb wash
    const t = (pct - 0.75) / 0.125;
    openness   = 1.00 - t * 0.55;   // 1.00 → 0.45
    reverbMult = 0.95 + t * 0.50;   // 0.95 → 1.45
  } else {
    // Build-back: filter sweep up, reverb settles
    const t = (pct - 0.875) / 0.125;
    openness   = 0.45 + t * 0.55;   // 0.45 → 1.00
    reverbMult = 1.45 - t * 0.45;   // 1.45 → 1.00
  }
  _formOpenness   = openness;
  _formReverbMult = reverbMult;

  // Reverb modulation goes through the intent system at formCycle priority.
  // Arc (100) and liveSet (80) automatically override; ambient drift (10) cannot.
  // In Live mode applySetEnergy owns reverb at liveSet priority — its intent will
  // naturally beat ours; we still submit so the cycle is observable in telemetry.
  if(generateActive && !_liveMode){
    submitConductorIntent('formCycle.reverb', 'reverbAmt', _formReverbMult,
      CONDUCTOR_PRIORITY.formCycle, 8000);
  }

  // Filter sweep on harmonic-bed elements (Pad/WTPad/Chord/Drone)
  if(!audioCtx) return;
  const now = audioCtx.currentTime;
  elements.forEach(el => {
    if(el.muted) return;
    if(!['Pad','WTPad','Chord','Drone'].includes(el.soundType)) return;
    if(!el._droneNode || !el._droneNode.filterNode) return;
    const tx = (el.tone&&el.tone.x!=null?el.tone.x:0.4);
    let cutoff = 80 + Math.pow(tx, 1.4) * 9000;
    cutoff *= 0.45 + _formOpenness * 0.55;
    el._droneNode.filterNode.frequency.setTargetAtTime(
      Math.max(20, Math.min(18000, cutoff)),
      now,
      1.5 // slow form sweep — ~3-4 second time constant feel
    );
  });
}

function resetFormPosition(){
  _formOpenness = 1.0;
  _formReverbMult = 1.0;
  // Release the form-cycle reverb claim; resolver falls back to base 1.0
  clearConductorIntents('formCycle.');
}

let _currentCompositionTemplate = null;
let _compositionIdxCounter = 0;

function pickCompositionTemplate(){
  _currentCompositionTemplate = COMPOSITION_TEMPLATES[
    Math.floor(Math.random()*COMPOSITION_TEMPLATES.length)
  ];
  _compositionIdxCounter = 0;
  // Surface the chosen template name for telemetry and live debugging.
  // window.fgCompositionTemplate exposes the current name to the console.
  if(typeof window !== 'undefined'){
    window.fgCompositionTemplate = _currentCompositionTemplate.name;
  }
  fgTelemetry('compositionTemplate', {name: _currentCompositionTemplate.name});
}

function reshuffleComposition(){
  if(!_currentCompositionTemplate) pickCompositionTemplate();
  else pickCompositionTemplate(); // always a fresh template on reshuffle
  const active = elements.filter(e => !e.muted);
  const total  = active.length;
  if(total === 0) return;
  active.forEach((el, idx) => {
    if(el._touchHeld || el._momentumRaf) return; // user is holding — don't steal it
    const pos = _currentCompositionTemplate.layout(idx, total);
    el._tx = Math.max(0.05, Math.min(0.95, pos.x));
    el._ty = Math.max(0.08, Math.min(0.92, pos.y));
    const newRadius = (el.radius||0.25) * pos.radiusScale;
    el._tradius = Math.max(0.05, Math.min(0.55, newRadius));
    // For line elements (neon/fold/beam): keep angle + length, just drift the midpoint.
    // Use cached _twidth if available (set by applyCompositionToElement) — this is
    // the *intended* half-width, immune to mid-drift staleness in current x1/x2.
    if(el.visualType==='neon'||el.visualType==='fold'||el.visualType==='beam'){
      const ang = el.angle || Math.atan2((el.y2||0)-(el.y1||0),(el.x2||1)-(el.x1||0));
      let hw = el._twidth;
      if(hw == null){
        // Legacy fallback: derive from current geometry, then cache for future reshuffles
        hw = Math.hypot((el.x2||1)-(el.x1||0),(el.y2||0)-(el.y1||0)) * 0.5;
        el._twidth = hw;
      }
      el._tx1 = el._tx - Math.cos(ang)*hw;
      el._ty1 = el._ty - Math.sin(ang)*hw;
      el._tx2 = el._tx + Math.cos(ang)*hw;
      el._ty2 = el._ty + Math.sin(ang)*hw;
    }
  });
}

// Blend factor: how much the Suprematist template overrides the curated
// per-genre xPos/yPos. 1.0 = pure template (old behavior), 0.0 = curated only.
// 0.7 keeps the compositional logic dominant while letting genre identity
// (sub at the bottom, leads center, atmosphere at edges) still show through.
const COMPOSITION_BLEND = 0.7;

function applyCompositionToElement(el, total){
  if(!_currentCompositionTemplate) return;
  const tpl = _currentCompositionTemplate;
  const pos = tpl.layout(_compositionIdxCounter, total);
  _compositionIdxCounter++;
  // Curated position (set by createElement from role.xPos/yPos) acts as the
  // anchor; template position pulls toward Suprematist layout by BLEND amount.
  const cx = (el.x != null) ? el.x : 0.5;
  const cy = (el.y != null) ? el.y : 0.5;
  const tx = Math.max(0.05, Math.min(0.95, cx*(1-COMPOSITION_BLEND) + pos.x*COMPOSITION_BLEND));
  const ty = Math.max(0.08, Math.min(0.92, cy*(1-COMPOSITION_BLEND) + pos.y*COMPOSITION_BLEND));
  // Set drift target — element starts near canvas centre and floats outward
  el._tx = tx; el._ty = ty;
  el._tradius = Math.max(0.05, (el.radius||0.25) * pos.radiusScale);
  el.x = 0.38 + Math.random()*0.24;  // start near centre
  el.y = 0.38 + Math.random()*0.24;
  const rot = tpl.rotation + (Math.random()-0.5)*0.15;
  if(el.visualType==='neon'||el.visualType==='fold'||el.visualType==='beam'){
    el.angle = rot;
    el.coneWidth = 0.18 + Math.random()*0.30;
    const hw = 0.14 + Math.random()*0.06;
    el._twidth = hw; // cache intended half-width for stable reshuffles (fix #2)
    el.x1 = el.x - hw*Math.cos(rot); el.y1 = el.y - hw*Math.sin(rot);
    el.x2 = el.x + hw*Math.cos(rot); el.y2 = el.y + hw*Math.sin(rot);
    el.pos = el.x; el.width = hw*2;
    el._tx1 = tx - hw*Math.cos(rot); el._ty1 = ty - hw*Math.sin(rot);
    el._tx2 = tx + hw*Math.cos(rot); el._ty2 = ty + hw*Math.sin(rot);
  }
}

function getOctZone(oct){
  if(oct<=1) return 'sub';
  if(oct===2) return 'low';
  if(oct===3) return 'mid';
  if(oct===4) return 'high';
  return 'air';
}

// Find an octave for a role that fits within zone caps. Tries the role's
// preferred octave first; if its zone is full, walks outward (preferred ±1, ±2)
// looking for an open slot. Returns {oct, zone} or null if no zone has room.
// `zones` is a counter object (mutated by caller after a successful placement).
function findZoneFor(preferredOct, zones){
  const candidates = [];
  for(let d=0; d<=4; d++){
    if(d===0){ candidates.push(preferredOct); }
    else {
      // Prefer shifting UP first (most voices play better lighter than darker),
      // then DOWN as a fallback.
      candidates.push(preferredOct + d);
      candidates.push(preferredOct - d);
    }
  }
  for(const oct of candidates){
    if(oct < 0 || oct > 6) continue;
    const z = getOctZone(oct);
    if((zones[z]||0) < (ZONE_CAPS[z]||0)) return {oct, zone:z};
  }
  return null;
}

function countZones(){
  const c = { sub:0, low:0, mid:0, high:0, air:0 };
  elements.forEach(el => {
    const oct = el._roleOct ?? 3;
    c[getOctZone(oct)]++;
  });
  return c;
}

function getChordVoicing(soundType, el){
  const genreVoicings = CHORD_VOICINGS[currentStyle];
  let voicings = genreVoicings?.[soundType];
  // Chord falls back to the genre's Pulse voicing — gets real harmonic
  // character (min7, sus2, maj9 etc) instead of bare root+fifth.
  if(!voicings && soundType === 'Chord') voicings = genreVoicings?.Pulse;
  if(!voicings) voicings = [[0,7]];
  const base = voicings[Math.floor(Math.random()*voicings.length)];

  // Inversion for chord-tone elements — smoother voice leading across chord changes.
  // Must match INVERSION_TYPES in applyChordToElement so the inversion index that
  // gets advanced there actually gets read here.
  const INVERSION_TYPES = new Set(['WTPad','Pad','Chord','Drone','Shimmer','Pulse','EP','FM3','FMStab']);
  if(el && INVERSION_TYPES.has(soundType) && base.length >= 3){
    const inv = (el._inversionIdx || 0) % 3; // 0=root, 1=first, 2=second
    if(inv > 0){
      // Rotate: move bottom N notes up an octave
      const sorted = [...base].sort((a,b)=>a-b);
      for(let i = 0; i < inv && i < sorted.length - 1; i++){
        sorted[i] += 12;
      }
      sorted.sort((a,b)=>a-b);
      // Normalize so lowest note is 0
      const lowest = sorted[0];
      return sorted.map(s => s - lowest);
    }
  }
  return base;
}

function voicingToFreqs(rootFreq, semitones){
  return semitones.map(st => rootFreq * Math.pow(2, st/12));
}

function getBassPhrase(){
  if(!_bassPhrase){
    _bassPhrase = [...(BASS_PHRASES[currentStyle]||BASS_PHRASES.deephouse)];
    _bassPhraseMutCount = 0;
  }
  return _bassPhrase;
}

function resetBassPhrase(){
  _bassPhrase = [...(BASS_PHRASES[currentStyle]||BASS_PHRASES.deephouse)];
  _bassPhraseMutCount = 0;
  resetAcidPhrase(); // reset together — both anchored to genre on style change
  _lastKickBodyStart = null; // reset DFAM coupling on genre change
  _kickHitCount = 0;
}

// Classify a chord's harmonic function for bass-pattern variation purposes.
// Combines absolute scale degree (in a minor-key context: i=tonic, iv/vi=predom,
// v/VII=dominant, III=mediant/mid) with progression context (is this the LAST
// chord before returning to tonic? → behave as dominant regardless of degree).
function _classifyChordFunction(chordDeg, chordIdx, progression){
  // Position-aware override: the last chord of the progression that leads back
  // to the tonic acts as a dominant (anticipation/pickup), regardless of degree.
  if(progression && progression.length > 1){
    const last = progression.length - 1;
    const nextDeg = progression[(chordIdx + 1) % progression.length];
    if(chordIdx === last && nextDeg === 0) return 'dominant';
  }
  // Scale-degree mapping (minor-key flavored — the progressions in CHORD_PROGRESSIONS
  // are written with this in mind).
  if(chordDeg === 0) return 'tonic';
  if(chordDeg === 4 || chordDeg === 6) return 'dominant';   // v, VII
  if(chordDeg === 3 || chordDeg === 5) return 'predominant';// iv, VI
  if(chordDeg === 2) return 'mediant';                       // III
  return 'mid';
}

function applyChordBassVariation(base, chordIdx, progression){
  if(!progression || progression.length === 0) return base;
  const chordRoot = progression[chordIdx % progression.length];
  const fn = _classifyChordFunction(chordRoot, chordIdx, progression);
  const p = [...base];
  switch(fn){
    case 'tonic':
      // Tonic — full pattern, no change. Anchor.
      return p;
    case 'dominant':
      // Leading function — add a pickup on step 15 to push back to tonic.
      p[15] = 1;
      // If there was a hit on the previous step, double up for stronger anticipation
      if(p[14]) p[14] = 1;
      return p;
    case 'predominant':
      // Softer, prep function — drop a mid-bar hit for breathing room.
      if(p[10]) p[10] = 0;
      else if(p[14]) p[14] = 0;
      return p;
    case 'mediant':
      // Syncopation — shift one hit by a step for a different gravity.
      if(p[6] && !p[7]){ p[6] = 0; p[7] = 1; }
      else if(p[14] && !p[13]){ p[14] = 0; p[13] = 1; }
      return p;
    case 'mid':
    default:
      // Neutral non-tonic — drop the last hit for breathing room.
      if(p[15]) p[15] = 0;
      else if(p[12]) p[12] = 0;
      return p;
  }
}

function getBassPhraseForChord(){
  const base = getBassPhrase();
  if(!_currentProgression) return base;
  return applyChordBassVariation(base, _currentChordIdx, _currentProgression);
}

function mutateBassPhrase(rate){
  const base = BASS_PHRASES[currentStyle]||BASS_PHRASES.deephouse;
  const phrase = getBassPhrase();
  if(_bassPhraseMutCount >= 3 || Math.random() > rate) return;
  // Candidates: avoid beat-1 downbeats (steps 0,4,8,12) which define genre identity
  const candidates = [];
  for(let i=1;i<16;i++){ if(i%4!==0) candidates.push(i); }
  const idx = candidates[Math.floor(Math.random()*candidates.length)];
  phrase[idx] = phrase[idx] ? 0 : 1;
  _bassPhraseMutCount += (phrase[idx]!==base[idx]) ? 1 : -1;
  _bassPhraseMutCount = Math.max(0, _bassPhraseMutCount);
}

function getAcidPhrase(){
  if(!_acidPhrase){
    _acidPhrase = [...(ACID_PHRASES[currentStyle]||ACID_PHRASES.deephouse)];
    _acidPhraseMutCount = 0;
  }
  return _acidPhrase;
}

function resetAcidPhrase(){
  _acidPhrase = [...(ACID_PHRASES[currentStyle]||ACID_PHRASES.deephouse)];
  _acidPhraseMutCount = 0;
}

function mutateAcidPhrase(rate){
  const base = ACID_PHRASES[currentStyle]||ACID_PHRASES.deephouse;
  const phrase = getAcidPhrase();
  if(_acidPhraseMutCount >= 4 || Math.random() > rate * 1.2) return;
  const candidates = [];
  for(let i=0;i<16;i++){ if(i%4!==0) candidates.push(i); } // keep downbeats stable
  const idx = candidates[Math.floor(Math.random()*candidates.length)];
  phrase[idx] = phrase[idx] ? 0 : 1;
  _acidPhraseMutCount += (phrase[idx]!==base[idx]) ? 1 : -1;
  _acidPhraseMutCount = Math.max(0, _acidPhraseMutCount);
}

let currentMotif = null;

function captureMotif(){
  resetBassPhrase(); // anchor the phrase to current genre at capture time
  initSessionSignature(); // set the melodic anchor for this session
  _currentChordIdx = 0; // anchor chord progression to motif start
  currentMotif = {
    drums: {
      kick:  [...drumPattern.kick],
      clap:  [...drumPattern.clap],
      hihat: [...drumPattern.hihat],
    },
    harmony: {
      root:  document.getElementById('keySelect')?.value  || 'A',
      scale: document.getElementById('scaleSelect')?.value || 'Minor',
      elementNotes: elements.map(e=>({ id:e.id, note:e.note, soundType:e.soundType })),
    },
    texture: elements.map(e=>e.soundType),
    bar: barCount,
  };
}

function returnToMainMotif(){
  if(!currentMotif||!soundEnabled) return;
  // Don't fire during an active arc — it will conflict with arc's volume management
  if(arcState!=='idle') return;
  // Restore drums
  Object.assign(drumPattern, {
    kick:  [...currentMotif.drums.kick],
    clap:  [...currentMotif.drums.clap],
    hihat: [...currentMotif.drums.hihat],
  });
  buildDrumGrid();
  // Return bass phrase to genre base
  resetBassPhrase();
  // Return chord progression to its start so motif notes match harmony
  _currentChordIdx = 0;
  // Glide notes back to motif values
  currentMotif.harmony.elementNotes.forEach(saved=>{
    const el=elements.find(e=>e.id===saved.id);
    if(!el||el.note===saved.note) return;
    el.note=saved.note;
    if(el._droneNode&&audioCtx){
      const newFreq=midiToFreq(noteToMidi(saved.note));
      const now=audioCtx.currentTime;
      el._droneNode.oscs.forEach(o=>{
        try{
          if(o.frequency&&o.frequency.value>10){
            const ratio=o.frequency.value/(el._lastBaseFreq||newFreq);
            o.frequency.setTargetAtTime(newFreq*Math.max(0.25,Math.min(4,ratio)),now,1.2);
          }
        }catch(e){}
      });
      el._lastBaseFreq=newFreq;
    } else if(el.soundType==='Arp'){
      el._arpPendingPattern=true; // queue rebuild at loop boundary
    }
  });
}

function getSoundModel(soundType){ return (GENRE_SOUND_MODELS[currentStyle]||{})[soundType]||{}; }
// ─── PARTICLE ATMOSPHERE ─────────────────────────────────────────────────────

let barCount = 0;                    // total bars elapsed since beat start
let conductorQueue = [];             // [{bar, fn}] sorted by bar
let arcState = 'idle';               // 'idle'|'intro'|'build'|'drop'|'break'
let arcBar = 0;                      // bar within current arc
let arcCancelFn = null;              // call to cancel current arc early
let conductorHPF = 0;               // 0–1: master high-pass amount
let conductorTension = 0;           // 0–1: element clustering pull
let conductorBloom = 0;             // 0–1: extra glow/bloom on all elements
let conductorCool = 0;              // 0–1: hue shift toward blue
let conductorDrift = 0;             // 0–1: element float/drift speed
let conductorShimmer = 0;           // 0–1: position oscillation on elements
let conductorParams = {
  hpf:0, tension:0, bloom:0, cool:0, drift:0, shimmer:0,
  drumVol:1, reverbAmt:1
};
let conductorTargets = {
  hpf:0, tension:0, bloom:0, cool:0, drift:0, shimmer:0,
  drumVol:1, reverbAmt:1
};
const CONDUCTOR_LERP = 0.04; // per-frame lerp speed

// ── CONDUCTOR INTENT RESOLVER ─────────────────────────────────────────────────
// True priority-based target resolution. Every system that wants to influence
// a conductor target submits an *intent* (source, value, priority, duration).
// On each lerp tick, resolveConductorTargets() picks the highest-priority
// active intent per key, or falls back to the base value if no claims exist.
//
// This is the single source of truth for conductorTargets. The resolver runs
// every frame and re-derives every value from claims (or base if no claims).
// Direct writes to conductorTargets.X = Y get clobbered on the next frame —
// the ONLY way to influence conductor state is submitConductorIntent.

const CONDUCTOR_PRIORITY = {
  userGesture: 120,
  arc:         100,
  liveSet:      80,
  djBrain:      50,
  formCycle:    30,
  microTexture: 20,
  ambient:      10,
};

const conductorBaseTargets = {
  hpf:0, tension:0, bloom:0, cool:0, drift:0, shimmer:0,
  drumVol:1, reverbAmt:1
};

const conductorClaims = {
  hpf:[], tension:[], bloom:[], cool:[], drift:[], shimmer:[],
  drumVol:[], reverbAmt:[]
};

// Submit an intent. `source` is a string label for debugging/telemetry, e.g.
// 'arc.build.bar4', 'liveSet.cue.energy', 'djBrain.microTexture.reverbSwell'.
// `priority` should come from CONDUCTOR_PRIORITY. `durationMs` is how long
// the claim is valid for; after expiry it falls off and the next-highest
// claim wins (or the base value if no claims remain).
function submitConductorIntent(source, key, value, priority, durationMs, meta){
  if(!conductorClaims[key]) return false;
  const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  conductorClaims[key].push({
    source: source || 'unknown',
    value,
    priority,
    expiresAt: now + (durationMs || 4000),
    meta: meta || null,
  });
  return true;
}

// Resolve all claims into conductorTargets. Called every frame from the lerp.
// Expires stale claims, picks the highest-priority remaining claim (ties broken
// by latest expiry — fresher wins), or falls back to the base value.
function resolveConductorTargets(){
  const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  for(const key in conductorClaims){
    // Drop expired
    conductorClaims[key] = conductorClaims[key].filter(c => c.expiresAt > now);
    if(!conductorClaims[key].length){
      conductorTargets[key] = conductorBaseTargets[key];
      continue;
    }
    // Highest priority wins; on tie, latest expiry (most recently submitted) wins
    let winner = conductorClaims[key][0];
    for(let i=1; i<conductorClaims[key].length; i++){
      const c = conductorClaims[key][i];
      if(c.priority > winner.priority ||
         (c.priority === winner.priority && c.expiresAt > winner.expiresAt)){
        winner = c;
      }
    }
    conductorTargets[key] = winner.value;
  }
}

// Clear all claims from one source — used when an arc ends or a system shuts
// down and wants to immediately release its grip.
function clearConductorIntents(sourcePrefix){
  for(const key in conductorClaims){
    conductorClaims[key] = conductorClaims[key].filter(c => !c.source.startsWith(sourcePrefix));
  }
}

// Backward-compat shim: setConductorTarget delegates to submitConductorIntent.
// Existing callers (djBrainApplyMicroTexture etc.) keep working.
function setConductorTarget(key, value, priority, durationMs){
  return submitConductorIntent('legacy.setConductorTarget', key, value, priority, durationMs);
}

// ── CONDUCTOR LOCKS ───────────────────────────────────────────────────────────
// Coarse-grained gates that prevent decisions during sensitive moments.
// Arc active → DJBrain can't ADD/REMOVE/BREAK/DROP/mutate drums.
// Genre transition → macro drift can't queue another softDriftToGenre.
// Dissolve active → density can't toggle elements.
const conductorLocks = {
  arc:    false,   // any arc state ('build'|'drop'|'break')
  genre:  false,   // genre transition in progress (softDrift, morphToGenre)
  drums:  false,   // drum pattern mutation locked
  density:false,   // element mute/unmute locked
};

// Single-slot queue for genre drift requests that arrive while a transition
// is already in progress. Latest request wins (older cues are stale by the
// time the previous transition finishes re-orchestrating).
let _pendingGenreDrift = null;

// Convenience: returns true if the lock is held AND we're checking from a
// system that should respect it. Direct callers can also read conductorLocks
// directly.
function isLocked(name){ return !!conductorLocks[name]; }

// Call from every site that releases conductorLocks.genre. If a drift request
// arrived during the transition, this drains the slot and starts that drift
// on the next tick (small setTimeout 0 so the current transition's cleanup
// finishes before the next one begins).
function _releaseGenreLock(){
  conductorLocks.genre = false;
  if(_pendingGenreDrift && _pendingGenreDrift !== currentStyle){
    const next = _pendingGenreDrift;
    _pendingGenreDrift = null;
    fgTelemetry('genreDriftDrained', {to: next});
    setTimeout(() => softDriftToGenre(next), 0);
  } else {
    _pendingGenreDrift = null;
  }
}

// ── DECISION MEMORY ───────────────────────────────────────────────────────────
// Tracks recent structural decisions so taste rules can enforce spacing
// (e.g. don't ADD and REMOVE within the same 16-bar window).
const conductorMemory = {
  recentDecisions: [],     // rolling buffer of {bar, type, ...}
  lastDropBar:          -999,
  lastBreakBar:         -999,
  lastGenreChangeBar:   -999,
  lastAddedElementId:    null,
  lastRemovedElementId:  null,
  lastStructuralChangeBar: -999,
};

function recordConductorDecision(type, payload){
  const bar = (typeof barCount === 'number') ? barCount : -1;
  conductorMemory.recentDecisions.push(Object.assign({bar, type}, payload || {}));
  if(conductorMemory.recentDecisions.length > 32) conductorMemory.recentDecisions.shift();
  if(type === 'DROP')          conductorMemory.lastDropBar = bar;
  if(type === 'BREAK')         conductorMemory.lastBreakBar = bar;
  if(type === 'GENRE_CHANGE')  conductorMemory.lastGenreChangeBar = bar;
  if(type === 'ADD'){
    conductorMemory.lastAddedElementId = payload && payload.elementId;
    conductorMemory.lastStructuralChangeBar = bar;
  }
  if(type === 'REMOVE'){
    conductorMemory.lastRemovedElementId = payload && payload.elementId;
    conductorMemory.lastStructuralChangeBar = bar;
  }
}

// Taste rule helpers — used by DJBrain to gate decisions.
function barsSinceLastDecision(type){
  const bar = (typeof barCount === 'number') ? barCount : 0;
  if(type === 'DROP')         return bar - conductorMemory.lastDropBar;
  if(type === 'BREAK')        return bar - conductorMemory.lastBreakBar;
  if(type === 'GENRE_CHANGE') return bar - conductorMemory.lastGenreChangeBar;
  if(type === 'STRUCTURAL')   return bar - conductorMemory.lastStructuralChangeBar;
  // Generic lookup over the rolling buffer
  for(let i = conductorMemory.recentDecisions.length - 1; i >= 0; i--){
    if(conductorMemory.recentDecisions[i].type === type){
      return bar - conductorMemory.recentDecisions[i].bar;
    }
  }
  return 9999;
}

function conductorLerpTick(){
  // Resolve all submitted intents into conductorTargets, then lerp.
  resolveConductorTargets();
  let changed=false;
  for(const k in conductorParams){
    const diff=conductorTargets[k]-conductorParams[k];
    if(Math.abs(diff)>0.001){conductorParams[k]+=diff*CONDUCTOR_LERP;changed=true;}
    else conductorParams[k]=conductorTargets[k];
  }
  const _styleGain = DRUM_STYLE_GAIN[activeDrumStyle] ?? 0.88;
  if(drumGain) drumGain.gain.setTargetAtTime(conductorParams.drumVol*_styleGain,audioCtx?.currentTime||0,0.1);
  if(masterHPFNode){
    const freq=20+Math.pow(conductorParams.hpf,1.6)*3980; // extended range: 20Hz→4kHz for dramatic pre-drop sweep
    masterHPFNode.frequency.setTargetAtTime(freq,audioCtx?.currentTime||0,0.08);
  }
  if(reverbGain){
    reverbGain.gain.setTargetAtTime(Math.min(1.0, 0.62*conductorParams.reverbAmt),audioCtx?.currentTime||0,0.2);
  }
  requestAnimationFrame(conductorLerpTick);
}

function ensureMasterHPF(){
  if(masterHPFNode||!audioCtx||!masterShelf||!masterLimiter) return;
  masterHPFNode=audioCtx.createBiquadFilter();
  masterHPFNode.type='highpass';
  masterHPFNode.frequency.value=20;
  masterHPFNode.Q.value=0.7;
  // Insert HPF between masterShelf and limiter — do NOT connect to destination directly
  masterShelf.disconnect();
  masterShelf.connect(masterHPFNode);
  masterHPFNode.connect(masterLimiter);
}

// ── TELEMETRY ─────────────────────────────────────────────────────────────────
// Enable with ?debug=1 in URL. Logs DJ Brain decisions, arc transitions, and
// per-bar state so tuning over a long session is observable. Off by default
// (zero perf impact when off).
const FG_DEBUG = (typeof window !== 'undefined' && window.location)
  ? /[?&]debug=1\b/.test(window.location.search)
  : false;

let _telemetryLastDecision = null;
let _telemetryEvents = []; // rolling buffer of {bar, type, ...payload}

function fgTelemetry(type, payload){
  if(!FG_DEBUG) return;
  const evt = Object.assign({
    bar: typeof barCount !== 'undefined' ? barCount : -1,
    arc: typeof arcState !== 'undefined' ? arcState : '?',
    journey: (DJBrain && DJBrain.journeyState) || '-',
    chapter: (DJBrain && DJBrain.chapterIdentity) || '-',
    type,
    t: Date.now(),
  }, payload || {});
  _telemetryEvents.push(evt);
  if(_telemetryEvents.length > 200) _telemetryEvents.shift();
  // Lightweight stdout — `[FG]` prefix for filtering in devtools
  console.log('[FG]', type, evt);
}

// Console helper: window.fgDump() prints the rolling event buffer as a table.
if(typeof window !== 'undefined'){
  window.fgDump = () => {
    if(!_telemetryEvents.length){ console.log('[FG] No events yet'); return; }
    console.table(_telemetryEvents.map(e => ({
      bar: e.bar, arc: e.arc, journey: e.journey,
      chapter: e.chapter, type: e.type,
      detail: e.decision || e.action || e.from || ''
    })));
  };
  // Console helper: window.fgClaims() prints active conductor intents per key.
  // Shows who currently owns each conductor target — useful for tuning priority
  // conflicts. Group by key, sort by priority descending.
  window.fgClaims = () => {
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const rows = [];
    for(const key in conductorClaims){
      const active = conductorClaims[key].filter(c => c.expiresAt > now);
      if(!active.length){
        rows.push({key, status:'BASE', value: conductorBaseTargets[key], source:'-', priority:'-', remaining:'-'});
      } else {
        const winner = active.reduce((a,b) => b.priority > a.priority || (b.priority===a.priority && b.expiresAt > a.expiresAt) ? b : a);
        rows.push({key, status:'CLAIMED', value: winner.value, source: winner.source, priority: winner.priority,
                   remaining: Math.round(winner.expiresAt - now) + 'ms'});
        active.filter(c => c !== winner).forEach(c => {
          rows.push({key:'  ↳', status:'shadowed', value: c.value, source: c.source, priority: c.priority,
                     remaining: Math.round(c.expiresAt - now) + 'ms'});
        });
      }
    }
    console.table(rows);
    console.log('[FG] Locks:', JSON.parse(JSON.stringify(conductorLocks)));
  };
  // Console helper: window.fgElements() prints every element + whether it has a label.
  // Useful for diagnosing missing labels.
  window.fgElements = () => {
    const labels = document.querySelectorAll('.live-touch-label');
    const labelTexts = Array.from(labels).map(l => l.querySelector('.ltl-main')?.textContent || '');
    const rows = elements.map(el => {
      const hp = (typeof elHandlePos === 'function') ? elHandlePos(el) : {x: el.x, y: el.y};
      return {
        id: el.id,
        type: el.soundType || '?',
        muted: !!el.muted,
        x: typeof el.x === 'number' ? el.x.toFixed(2) : el.x,
        y: typeof el.y === 'number' ? el.y.toFixed(2) : el.y,
        visual: el.visualType,
        hp_x: typeof hp.x === 'number' ? Math.round(hp.x) : hp.x,
        hp_y: typeof hp.y === 'number' ? Math.round(hp.y) : hp.y,
        valid: isFinite(hp.x) && isFinite(hp.y),
      };
    });
    console.table(rows);
    console.log('[FG] Visible labels:', labelTexts);
    console.log('[FG] Label count:', labels.length, 'Active (non-muted) elements:', elements.filter(e=>!e.muted).length);
  };
}

function onBarBoundary(){
  barCount++;
  arcBar++;
  conductorQueue=conductorQueue.filter(ev=>{
    if(ev.bar<=barCount){ev.fn();return false;}
    return true;
  });
  if(arcState==='idle') evolveOnBar(barCount);
  if(arcState==='build') tickBuildArc();
  else if(arcState==='drop') tickDropArc();
  else if(arcState==='break') tickBreakArc();
  updateArcUI();
  if(FG_DEBUG && barCount % 4 === 0){
    fgTelemetry('barTick', {phraseBar: typeof getLiveGrammar==='function' ? (barCount % getLiveGrammar().formCycle) : -1});
  }
}

function showArcBar(){document.getElementById('arcBarEl').classList.add('visible');}
function hideArcBar(){document.getElementById('arcBarEl').classList.remove('visible');}

function updateArcUI(){
  const buildBtn=document.getElementById('btnBuild');
  const dropBtn=document.getElementById('btnDrop');
  const brkBtn=document.getElementById('btnBreak');
  const prog=document.getElementById('arcProgress');
  const fill=document.getElementById('arcProgressFill');
  const lbl=document.getElementById('arcProgressLabel');
  [buildBtn,dropBtn,brkBtn].forEach(b=>b.classList.remove('active'));
  const arcLengths={build:16,drop:8,break:8,intro:10};
  const total=arcLengths[arcState]||0;
  if(arcState==='idle'||arcState==='intro'){
    prog.style.display='none'; lbl.textContent='';
    const hint=document.getElementById('arcHint');
    if(hint) hint.style.opacity='1';
    buildBtn.disabled=false; dropBtn.disabled=false; brkBtn.disabled=false;
    return;
  }
  const hint=document.getElementById('arcHint');
  if(hint) hint.style.opacity='0';
  prog.style.display='block';
  const pct=Math.min(100,(arcBar/total)*100);
  if(arcState==='build'){
    buildBtn.classList.add('active');
    fill.style.background='rgba(251,191,36,0.8)';
    lbl.textContent=`${arcBar} / ${total}`;
  } else if(arcState==='drop'){
    dropBtn.classList.add('active');
    fill.style.background='rgba(255,255,255,0.9)';
    lbl.textContent=`${arcBar} / ${total}`;
  } else if(arcState==='break'){
    brkBtn.classList.add('active');
    fill.style.background='rgba(96,165,250,0.8)';
    lbl.textContent=`${arcBar} / ${total}`;
  }
  fill.style.width=pct+'%';
}

// ── ARC SNAPSHOT / RESTORE ────────────────────────────────────────────────────
// Centralized cleanup for all arc-related saved state. Six different save
// mechanisms (_savedMutes, _arcSavedVol on elements, _breakSavedPattern,
// _breakSavedHihat, _introSavedPattern, drumPattern._buildHatSaved/PreDrop)
// got out of sync historically. _clearAllArcSnapshots is the single point
// of truth: cancelArc, end-of-arc bars, and crash-recovery all call this.
//
// Each "restore" function is local — it knows how to safely revert its
// own state without depending on order. Calling _clearAllArcSnapshots
// twice in a row is a no-op.

function _restoreArcVolumes(){
  elements.forEach(el => {
    if(el._arcSavedVol != null){
      el.volume = el.soundType==='Acid'
        ? Math.min(0.45, el._arcSavedVol)
        : el._arcSavedVol;
      el._arcSavedVol = null;
      if(typeof updateDroneParams === 'function') updateDroneParams(el);
    }
  });
}

function _restoreBuildHats(){
  if(drumPattern._buildHatSaved){
    drumPattern.hihat = [...drumPattern._buildHatSaved];
    drumPattern._buildHatSaved = null;
  }
  if(drumPattern._buildHatPreDrop){
    drumPattern.openhh = [...drumPattern._buildHatPreDrop];
    drumPattern._buildHatPreDrop = null;
  }
}

function _restoreBreakPatterns(){
  if(_breakSavedPattern){
    drumPattern.kick = [..._breakSavedPattern.kick];
    _breakSavedPattern = null;
  }
  if(_breakSavedHihat){
    drumPattern.hihat = [..._breakSavedHihat];
    _breakSavedHihat = null;
  }
}

function _restoreIntroPattern(){
  if(_introSavedPattern){
    drumPattern.clap   = [..._introSavedPattern.clap];
    drumPattern.hihat  = [..._introSavedPattern.hihat];
    drumPattern.openhh = [..._introSavedPattern.openhh];
    drumPattern.perc   = [..._introSavedPattern.perc];
    _introSavedPattern = null;
  }
}

function _clearAllArcSnapshots(){
  _restoreArcVolumes();
  _restoreBuildHats();
  _restoreBreakPatterns();
  _restoreIntroPattern();
}

let _savedMutes={};

function arcMuteAllExcept(keepTypes){
  _savedMutes={};
  elements.forEach(el=>{
    _savedMutes[el.id]=!!el.muted;
    if(!keepTypes.includes(el.soundType)&&!el.muted){
      el.muted=true; stopDrone(el);
    }
  });
}

function arcRestoreAll(){
  elements.forEach(el=>{
    if(_savedMutes[el.id]===false&&el.muted){
      el.muted=false;
      if(soundEnabled) maybeStartDrone(el);
    }
  });
  _savedMutes={};
}

function arcUnmuteAll(){
  elements.forEach(el=>{
    if(el.muted){el.muted=false;if(soundEnabled) maybeStartDrone(el);}
  });
}

// ── ARC INTENTS ───────────────────────────────────────────────────────────────
// All arc functions submit conductor intents through these helpers. Arcs have
// priority 100 (CONDUCTOR_PRIORITY.arc) and tag their source with the arc
// type + bar so cancelArc can clear them by prefix.

// Long-lived arc intent: lasts the full arc + small safety buffer.
// Used for state that should persist across arc bars (e.g. building HPF curve).
function _arcIntent(arcType, key, value, longMs){
  const dur = longMs || 6000;
  submitConductorIntent(`arc.${arcType}`, key, value, CONDUCTOR_PRIORITY.arc, dur);
}

// Short-lived arc intent: short enough to be naturally replaced by the next
// arc bar. Used for tight per-bar curve steps.
function _arcStepIntent(arcType, key, value){
  submitConductorIntent(`arc.${arcType}.step`, key, value, CONDUCTOR_PRIORITY.arc, 1200);
}

// Convenience: apply a {targets:{...}} step from BUILD_ARC_CURVE etc.
function _arcApplyTargets(arcType, targetsObj){
  if(!targetsObj) return;
  for(const k in targetsObj){
    _arcStepIntent(arcType, k, targetsObj[k]);
  }
}

// Release every claim from any arc — called from cancelArc.
function _arcReleaseAllIntents(){
  clearConductorIntents('arc.');
}

function startIntroArc(){
  // Skip slow intro — unmute everything immediately and go straight to idle
  arcState='idle'; arcBar=0; barCount=0;
  ensureMasterHPF();
  elements.forEach(el=>{ el.muted=false; if(soundEnabled) maybeStartDrone(el); });
  if(drumGain) drumGain.gain.setTargetAtTime(0.85, audioCtx.currentTime, 0.1);
  // Reset to base via intent system (long duration; cleared when idle settles)
  _arcIntent('intro', 'drumVol', 1, 2000);
  _arcIntent('intro', 'bloom',   0, 2000);
  _arcIntent('intro', 'cool',    0, 2000);
  _arcIntent('intro', 'tension', 0, 2000);
  showToast('');
}

function tickIntroArc(){
  switch(arcBar){
    case 0:
      if(elements.length>0){
        const sub=elements.find(e=>e.soundType==='Sub')||elements[0];
        sub.muted=false; if(soundEnabled) maybeStartDrone(sub);
      }
      break;
    case 2:
      const others=elements.filter(e=>e.muted);
      if(others.length>0){others[0].muted=false;if(soundEnabled) maybeStartDrone(others[0]);}
      break;
    case 4:
      _arcStepIntent('intro', 'drumVol', 0.4);
      _introSavedPattern={...drumPattern,
        clap:[...drumPattern.clap],hihat:[...drumPattern.hihat],
        openhh:[...drumPattern.openhh],perc:[...drumPattern.perc]};
      drumPattern.clap=Array(16).fill(0);
      drumPattern.hihat=Array(16).fill(0);
      drumPattern.openhh=Array(16).fill(0);
      drumPattern.perc=Array(16).fill(0);
      break;
    case 6:
      _arcStepIntent('intro', 'drumVol', 0.65);
      if(_introSavedPattern){
        drumPattern.hihat=[..._introSavedPattern.hihat];
        drumPattern.openhh=[..._introSavedPattern.openhh];
      }
      _arcStepIntent('intro', 'bloom', 0.2);
      break;
    case 8:
      arcUnmuteAll();
      _arcStepIntent('intro', 'drumVol', 1);
      if(_introSavedPattern){
        drumPattern.clap=[..._introSavedPattern.clap];
        drumPattern.perc=[..._introSavedPattern.perc];
        _introSavedPattern=null;
      }
      _arcStepIntent('intro', 'bloom', 0.5);
      break;
    case 10:
      arcState='idle'; arcBar=0;
      // Drop all intro intents — base values resume taking effect
      clearConductorIntents('arc.intro');
      showArcBar();
      updateArcUI();
      showToast('');
      break;
  }
}

let _introSavedPattern=null;

function startBuildArc(){
  if(arcState==='build'){cancelArc();return;}
  if(arcState!=='idle') cancelArc(false);
  // Release any active silence event so arc owns the stage
  _silenceEngineActive = false;
  arcState='build'; arcBar=-1;
  conductorLocks.arc = true;   // lock structural decisions during arc
  conductorLocks.drums = true; // no drum pattern mutation during build
  ensureMasterHPF();
  // Initial HPF intent — long enough to outlast the build (~16 bars * 0.5s/bar at 120bpm = 8s)
  _arcIntent('build', 'hpf', 0, 20000);
  // Save element volumes for restore — don't mute, just fade
  elements.forEach(el=>{ el._arcSavedVol = el.soundType==='Acid'?Math.min(0.45,el.volume??0.45):el.volume??0.75; });
  fgTelemetry('arcStart', {arc: 'build'});
  showToast('Build ▲');
}

// Build-arc layer categories — used by _thinBuildLayer to fade specific layers
// progressively across the build. Sparkle = brightest/decorative, harmonic =
// mid-range harmonic bed, lead = rhythmic/driving lead lines.
const BUILD_LAYER_SOUND_TYPES = {
  sparkle:  new Set(['Pluck','Ring','Shimmer','Echo','FMStab']),
  harmonic: new Set(['EP','FM3','Chord','Pad','WTPad']),
  lead:     new Set(['Pulse','Arp','Acid','Vocal','Phys']),
};

// Pick voices for a given build-layer slot. Tries soundType match first;
// falls back to instrument-role inference + tone brightness so scenes without
// hardcoded types still see something thin on the way up.
function _pickBuildLayerVoices(layer){
  const setTypes = BUILD_LAYER_SOUND_TYPES[layer] || new Set();
  const byType = elements.filter(el => !el.muted && setTypes.has(el.soundType));
  if(byType.length) return byType;

  // Fallback by role + brightness (tone.x ≈ filter cutoff): sparkle = brightest
  // non-rhythm/sub voices; harmonic = mid-bright atmosphere; lead = remaining voices.
  const candidates = elements.filter(el => {
    if(el.muted) return false;
    if(el.soundType === 'Sub') return false;
    const role = (typeof getInstrumentRole === 'function') ? getInstrumentRole(el) : 'atmosphere';
    return role !== 'rhythm';
  });
  if(!candidates.length) return [];
  const withBrightness = candidates.map(el => ({el, b:(el.tone&&el.tone.x!=null?el.tone.x:0.4)}));
  withBrightness.sort((a,b) => b.b - a.b); // brightest first
  const n = withBrightness.length;
  if(layer === 'sparkle')  return withBrightness.slice(0, Math.max(1, Math.ceil(n/3))).map(o=>o.el);
  if(layer === 'harmonic') return withBrightness.slice(Math.ceil(n/3), Math.ceil(2*n/3)).map(o=>o.el);
  if(layer === 'lead')     return withBrightness.slice(Math.ceil(2*n/3)).map(o=>o.el);
  return [];
}

function _thinBuildLayer(layer, volScale){
  const voices = _pickBuildLayerVoices(layer);
  voices.forEach(el => {
    el.volume = ((el._arcSavedVol ?? el.volume)) * volScale;
    updateDroneParams(el);
  });
}

// Build-arc curve — per-bar conductor targets, thin-layer triggers, and
// formOpenness adjustments. Each entry is the state to set when arcBar matches.
// Editing tuning numbers is now a data change, not a code change.
const BUILD_ARC_CURVE = [
  { bar: 0,  comment: 'tension starts — HPF begins, drum vol nudges up',
    targets: {tension:0.18, cool:0.05, drumVol:0.95, hpf:0.0},
    intensifyHats: true,
  },
  { bar: 2,  comment: 'HPF cuts, reverb opens, sparkle layer thins',
    targets: {hpf:0.20, tension:0.32, cool:0.18, reverbAmt:1.25, drumVol:0.92},
    thin: ['sparkle', 0.55],
  },
  { bar: 4,  comment: 'mid-build — atmosphere closes, harmonic mid-voices thin',
    targets: {hpf:0.45, tension:0.50, cool:0.36, reverbAmt:1.50, drumVol:0.88},
    formOpennessMin: 0.35, formOpennessDelta: -0.20,
    thin: ['harmonic', 0.40],
  },
  { bar: 6,  comment: 'pressurised — lead voices thin',
    targets: {hpf:0.65, tension:0.68, cool:0.52, reverbAmt:1.75, drumVol:0.82},
    formOpennessMin: 0.20, formOpennessDelta: -0.15,
    thin: ['lead', 0.45],
  },
  { bar: 8,  comment: 'top of build — reverb flooding, shimmer starts; restore vols',
    targets: {hpf:0.82, tension:0.84, cool:0.68, reverbAmt:2.0, drumVol:0.75, shimmer:0.25},
    formOpennessMin: 0.12, formOpennessDelta: -0.08,
    restoreVolumes: true,
  },
  { bar: 10, targets: {tension:0.90, shimmer:0.55, bloom:0.25, cool:0.78, reverbAmt:2.2} },
  { bar: 12, targets: {tension:0.95, shimmer:0.80, bloom:0.45, cool:0.88, reverbAmt:2.4} },
  { bar: 14, comment: 'one bar before drop — everything cuts except kick + reverb tail',
    targets: {drumVol:1.15, cool:0.98, bloom:0.65, reverbAmt:2.8, shimmer:0.90, hpf:0.92},
    nearSilenceExceptSub: 0.04,
    killHats: true,
  },
  { bar: 16, terminal: true /* hand off to startDropArc */ },
];

function _applyBuildArcStep(step){
  if(step.targets){
    // Submit all targets through the intent system at arc priority. Long enough
    // duration (4s) so they hold across the 2-bar gap to the next step but
    // short enough that a cancel clears them quickly.
    _arcApplyTargets('build', step.targets);
  }
  if(step.intensifyHats && !drumPattern._buildHatSaved){
    drumPattern._buildHatSaved = [...drumPattern.hihat];
    drumPattern.hihat = drumPattern.hihat.map((v,i) => v || (i%2===1?1:0));
  }
  if(step.thin){
    _thinBuildLayer(step.thin[0], step.thin[1]);
  }
  if(step.formOpennessMin != null && step.formOpennessDelta != null){
    _formOpenness = Math.max(step.formOpennessMin, _formOpenness + step.formOpennessDelta);
  }
  if(step.restoreVolumes){
    elements.forEach(el => {
      if(el._arcSavedVol != null){
        el.volume = el.soundType==='Acid' ? Math.min(0.45, el._arcSavedVol) : el._arcSavedVol;
        updateDroneParams(el);
      }
    });
  }
  if(step.nearSilenceExceptSub != null){
    elements.forEach(el => {
      if(!el.muted && el.soundType !== 'Sub'){
        el.volume = ((el._arcSavedVol ?? el.volume)) * step.nearSilenceExceptSub;
        updateDroneParams(el);
      }
    });
  }
  if(step.killHats){
    drumPattern._buildHatPreDrop = [...drumPattern.hihat];
    drumPattern.hihat = Array(16).fill(0);
    drumPattern.openhh = Array(16).fill(0);
  }
}

function tickBuildArc(){
  const step = BUILD_ARC_CURVE.find(s => s.bar === arcBar);
  if(!step) return;
  if(step.terminal){
    // Restore hat patterns before drop fires — use unified helper
    _restoreBuildHats();
    cancelArc(false); startDropArc();
    return;
  }
  _applyBuildArcStep(step);
}

function startDropArc(){
  if(arcState==='drop') return;
  if(arcState!=='idle'&&arcState!=='build') cancelArc(false);
  arcState='drop'; arcBar=-1;
  _lastDropBar = barCount;
  conductorLocks.arc = true;
  conductorLocks.drums = true;
  // Drop the build's lingering intents so drop's intents win cleanly
  clearConductorIntents('arc.build');
  recordConductorDecision('DROP', {bar: barCount});

  // SLAM: submit drop-baseline intents at arc priority, lasting through the
  // 8-bar drop arc with margin (~10s at 120bpm).
  _arcIntent('drop', 'hpf',       0,    12000);
  _arcIntent('drop', 'tension',   0,    12000);
  _arcIntent('drop', 'cool',      0,    12000);
  _arcIntent('drop', 'shimmer',   0,    12000);
  _arcIntent('drop', 'reverbAmt', 0.85, 12000); // slightly drier than normal on first hit — punch
  _arcIntent('drop', 'drumVol',   1.22, 4000);  // drums louder than normal for first 2 bars (~4s @120bpm)
  _arcIntent('drop', 'bloom',     1.0,  12000);
  _dropFlash=1;
  _dropBurst=1;
  _formOpenness = 1.0; // blast atmosphere filters open

  // Restore all element volumes instantly — everything returns at full force
  elements.forEach(el=>{
    if(el._arcSavedVol!=null){
      el.volume=el.soundType==='Acid'?Math.min(0.45,el._arcSavedVol):el._arcSavedVol;
      el._arcSavedVol=null;
      updateDroneParams(el);
    }
  });

  // Slam drone filters open — pads/drones felt compressed during build
  elements.forEach(el=>{
    if((el.soundType==='Drone'||el.soundType==='Pad'||el.soundType==='WTPad'||el.soundType==='Chord')&&!el.muted&&el._droneNode){
      const fn=el._droneNode.filterNode;
      if(fn&&audioCtx){
        fn.frequency.setTargetAtTime(8000, audioCtx.currentTime, 0.01); // instant open
        setTimeout(()=>{ if(fn) fn.frequency.setTargetAtTime(1200+Math.random()*800, audioCtx.currentTime, 0.8); }, 800);
      }
    }
  });

  // Clean up any build hat modifications
  if(drumPattern._buildHatSaved){ drumPattern.hihat=[...drumPattern._buildHatSaved]; drumPattern._buildHatSaved=null; }
  if(drumPattern._buildHatPreDrop){ drumPattern._buildHatPreDrop=null; }

  fgTelemetry('arcStart', {arc: 'drop'});
  showToast('Drop ↓');
}

let _dropFlash=0;
let _dropBurst=0; // decays in draw() — drives element explosion offset
// Energy cycle state — tracks when we last peaked so we don't rebuild too soon
let _lastDropBar = -999;
let _recoveryBars = 24;
let _autoBreakChance = 0.35;

function updateEnergyCycleForGenre(style){
  _recoveryBars   = RECOVERY_BARS[style]   ?? 24;
  _autoBreakChance= AUTO_BREAK_CHANCE[style]?? 0.35;
}

function tickDropArc(){
  switch(arcBar){
    case 0:
      _arcStepIntent('drop', 'bloom',   0.85);
      _arcStepIntent('drop', 'shimmer', 0.4);
      // Slam atmosphere filters open on drop — full release
      _formOpenness = 1.0;
      elements.forEach(el=>{
        if((el.soundType==='Drone'||el.soundType==='Pulse')&&!el.muted&&el._droneNode){
          const fn=el._droneNode.filterNode;
          if(fn&&audioCtx){
            fn.Q.setTargetAtTime(0.1,audioCtx.currentTime,0.04);
            setTimeout(()=>{ if(fn) fn.Q.setTargetAtTime(1.5+Math.random()*3,audioCtx.currentTime,0.25); },400);
          }
        }
      });
      break;
    case 2:
      _arcStepIntent('drop', 'bloom',   0.55);
      _arcStepIntent('drop', 'shimmer', 0.2);
      break;
    case 4:
      _arcStepIntent('drop', 'bloom',   0.25);
      _arcStepIntent('drop', 'shimmer', 0.05);
      break;
    case 6:
      _arcStepIntent('drop', 'bloom',   0.08);
      break;
    case 8:
      _arcStepIntent('drop', 'bloom',   0);
      _lastDropBar = barCount; // record when we dropped
      // Occasionally fire a break after the drop settles — more variety
      if(generateActive && Math.random()<_autoBreakChance){
        setTimeout(()=>{ if(arcState==='idle') startBreakArc(); }, (60000/bpm)*4);
      }
      // Release drop intents — back to base/whatever's next
      clearConductorIntents('arc.drop');
      conductorLocks.arc = false;
      conductorLocks.drums = false;
      arcState='idle'; arcBar=0;
      updateArcUI();
      break;
  }
}

function startBreakArc(){
  if(arcState==='break'){cancelArc();return;}
  if(arcState!=='idle') cancelArc(false);
  arcState='break'; arcBar=-1;
  conductorLocks.arc = true;
  conductorLocks.drums = true;
  recordConductorDecision('BREAK', {bar: barCount});
  _breakSavedPattern={...drumPattern,kick:[...drumPattern.kick]};
  drumPattern.kick=Array(16).fill(0);
  _breakSavedHihat=[...drumPattern.hihat];
  drumPattern.hihat=drumPattern.hihat.map((v,i)=>i%2===0?v:0);
  // 8-bar break ≈ 16s at 120bpm — give intents a 20s lifetime with margin
  _arcIntent('break', 'drift',     0.8,  20000);
  _arcIntent('break', 'cool',      0.55, 20000);
  _arcIntent('break', 'reverbAmt', 1.5,  20000); // 0.62*1.5=0.93 — spacious but no clip
  _arcIntent('break', 'drumVol',   0.65, 20000);
  // Soften atmosphere — spacious, open reverb but darker filters
  _formOpenness = 0.55;
  fgTelemetry('arcStart', {arc: 'break'});
  showToast('Break ~');
}

let _breakSavedPattern=null, _breakSavedHihat=null;

function tickBreakArc(){
  switch(arcBar){
    case 0:
      _arcStepIntent('break', 'drift', 1);
      break;
    case 2:
      _arcStepIntent('break', 'drift', 0.85);
      break;
    case 4:
      _arcStepIntent('break', 'cool', 0.4);
      break;
    case 6:
      if(_breakSavedPattern) drumPattern.kick=[..._breakSavedPattern.kick];
      if(_breakSavedHihat) drumPattern.hihat=[..._breakSavedHihat];
      _arcStepIntent('break', 'drumVol', 0.85);
      _arcStepIntent('break', 'cool',    0.2);
      _arcStepIntent('break', 'drift',   0.3);
      break;
    case 8:
      _restoreBreakPatterns();
      // Release break intents — base values resume
      clearConductorIntents('arc.break');
      conductorLocks.arc = false;
      conductorLocks.drums = false;
      _formOpenness = 1.0; // restore atmosphere
      arcState='idle'; arcBar=0;
      updateArcUI();
      break;
  }
}

function cancelArc(restore=true){
  // Single point of truth for cleanup — restores all arc-saved state regardless
  // of which arc (build/break/intro) set it. Safe to call multiple times.
  _clearAllArcSnapshots();
  if(restore) arcRestoreAll();
  // Release all arc-tagged intents — the resolver falls back to base values
  // (which match the previous "Object.assign to base" behavior).
  _arcReleaseAllIntents();
  conductorLocks.arc = false;
  conductorLocks.drums = false;
  _formOpenness = 1.0; // restore atmosphere filters
  arcState='idle'; arcBar=0;
  updateArcUI();
  buildDrumGrid();
}

let _silenceEngineActive = false; // prevent overlapping silence events
let _silencedVoiceIds = new Set();

// ── EVOLUTION TICK LAYERS ─────────────────────────────────────────────────────
// evolveOnBar dispatches to small focused helpers. Each handles one concern
// and can be tested or modified in isolation. Order matters: chord advance
// runs first (notes need to be correct before motifs rebuild), then drum/voice
// evolution, then form position, then arc/density automation, then DJ brain.

function _tickChord(bar){
  // Layer 0: Chord progression advance — every _chordCycleBars.
  if(!(_currentProgression && bar>0 && bar%_chordCycleBars===0)) return;
  advanceChord();
  applyChordChangeToAll();
  // Re-harmonize voice motifs to new chord
  elements.forEach(el=>{
    if(typeof getInstrumentRole === 'function' && getInstrumentRole(el)==='voice'){
      if(typeof transposeVoiceMotif === 'function') transposeVoiceMotif(el);
    }
  });
}

function _tickDrumsAndPhrases(bar, rules, grammar){
  const drumsLocked = (typeof conductorLocks !== 'undefined') && conductorLocks.drums;
  const arcLocked   = (typeof conductorLocks !== 'undefined') && conductorLocks.arc;

  // Layer 1: Micro (every 4 bars) — ghost density, hat variation, voice fillers.
  // Drums lock blocks pattern mutation; conversation filler still fires (it's
  // ambient texture, not structural).
  if(bar%4===0 && bar>0){
    if(!drumsLocked) evolveDrumMicro(rules, grammar.mutationRate*0.5);
    if(typeof tickConversation === 'function') tickConversation(bar);
  }

  // Layer 2: Phrase (every 8 bars) — bass/acid phrase mutation, element filter.
  // During an arc, hold all melodic/harmonic mutation — arc controls the tension curve.
  if(bar%8===0 && bar>0){
    if(!drumsLocked) evolveDrumMicro(rules, grammar.mutationRate);
    if(!arcLocked){
      evolveElementFilter(rules);
      mutateBassPhrase(grammar.mutationRate);
      mutateAcidPhrase(grammar.mutationRate);
    }
  }

  // Layer 3: Section (every 16 bars) — pattern rotation, harmony mutation, motif rebuild.
  // Pattern rotation is the biggest disruption — strictly gated by drums lock.
  // Harmony and motif rebuilds are arc-gated.
  if(bar%16===0 && bar>0){
    if(!drumsLocked && DRUM_BANK[currentStyle]) rotateDrumPattern();

    if(!arcLocked){
      evolveHarmony(rules);
      elements.forEach(el => {
        if(typeof getInstrumentRole === 'function' && getInstrumentRole(el)==='voice' && !el.muted){
          if(typeof mutateVoiceMotif === 'function') mutateVoiceMotif(el);
        }
      });
    }

    // Arp + Chord refresh: only when no arc is holding the tension
    elements.forEach(el=>{
      if(el.soundType==='Arp' && !el.muted && !arcLocked) el._arpPendingPattern=true;
      if(el.soundType==='Chord' && !el.muted && el._droneNode && soundEnabled && !arcLocked){
        stopDrone(el, 1.5);
        setTimeout(() => startDrone(el), 1600);
      }
    });
  }

  // Layer 3b: Full refresh (every 64 bars) — major disruption, never during an arc.
  if(bar%64===0 && bar>0 && !arcLocked) evolveFullRefresh();
}

function _tickFormAndMotif(bar, phraseBar, grammar){
  // Return to motif at top of each form cycle.
  if(phraseBar===0 && bar>0 && currentMotif) returnToMainMotif();
  // Pad filter sweep + reverb wash across the cycle.
  if((generateActive || _liveMode) && audioCtx){
    applyFormPosition(phraseBar, grammar.formCycle);
  }
}

function _tickDensityEnvelope(bar, phraseBar, grammar){
  // Generate mode only — Live mode has its own arc via applySetEnergy/cues.
  if(!(generateActive && !_liveMode && elements.length >= 5)) return;
  // Locks: don't thin the scene during a manual build/drop/break, and don't
  // touch density during a dissolve-style lock (which owns mute state).
  if(conductorLocks.arc || conductorLocks.density) return;
  const fc = grammar.formCycle;
  const introEnd   = Math.floor(fc * 0.25);
  const breakStart = Math.floor(fc * 0.75);
  const breakEnd   = Math.floor(fc * 0.875);
  if(phraseBar === 0){
    densityUnmute();
    densityMute(2);   // thin intro — 2 color elements ducked
  }
  if(phraseBar === introEnd)   densityUnmute();
  if(phraseBar === breakStart) densityMute(1);
  if(phraseBar === breakEnd)   densityUnmute();

  // Reverb throw at breakdown — one element blooms into the space.
  if(phraseBar === breakStart && (barCount - _lastReverbThrowBar) >= 16){
    const el = pickReverbThrowEl();
    if(el){
      setTimeout(() => fireReverbThrow(el, 0.68, 5.0), (60000/bpm)*0.5);
      _lastReverbThrowBar = barCount;
    }
  }
  // Occasional phrase-boundary throw — seasoning.
  if(phraseBar === 0 && bar > 0 && (barCount - _lastReverbThrowBar) >= 24 && Math.random()<0.35){
    const el = pickReverbThrowEl();
    if(el){ fireReverbThrow(el, 0.42, 3.5); _lastReverbThrowBar = barCount; }
  }
}

function _tickAutoArc(bar, phraseBar, grammar){
  // Auto-build at 50% of cycle, only when arc is idle, recovery window has
  // passed, AND the cycle has reset since the last drop (so a drop late in
  // a cycle doesn't trigger a build at the next buildPoint in the same cycle).
  const buildPoint = Math.floor(grammar.formCycle * 0.5);
  const barsSinceDrop = barCount - _lastDropBar;
  const recoveryDone = barsSinceDrop >= _recoveryBars;
  const cycleResetSinceDrop = Math.floor(barCount / grammar.formCycle) > Math.floor(_lastDropBar / grammar.formCycle);
  if(phraseBar===buildPoint && generateActive && arcState==='idle' && recoveryDone && cycleResetSinceDrop){
    startBuildArc();
  }
}

function _tickMacroDrift(bar){
  // Skip if DJ Brain is enabled — it owns genre choice via chapter changes.
  if(!(generateActive && !_liveMode && !(DJBrain && DJBrain.enabled) && bar>0 && bar%2===0)) return;
  // Skip if a genre transition is already in progress.
  if(conductorLocks.genre) return;
  const driftBar = 96 + Math.floor(Math.sin(bar*0.07)*16); // varies 80–112
  if(bar % driftBar !== 0) return;
  const neighbors = GENRE_GRAPH[currentStyle] || [];
  if(!neighbors.length) return;
  const next = neighbors[Math.floor(Math.random()*neighbors.length)];
  softDriftToGenre(next);
}

function evolveOnBar(bar){
  const rules = EVOLUTION_RULES[currentStyle];
  const grammar = getLiveGrammar();
  if(!rules || !soundEnabled) return;

  _tickChord(bar);
  _tickDrumsAndPhrases(bar, rules, grammar);

  const phraseBar = bar % grammar.formCycle;
  _tickFormAndMotif(bar, phraseBar, grammar);
  _tickDensityEnvelope(bar, phraseBar, grammar);
  _tickAutoArc(bar, phraseBar, grammar);

  // Silence engine — intentional moments of space, return, and tension
  if(typeof tickSilenceEngine === 'function') tickSilenceEngine(bar, phraseBar, grammar);

  _tickMacroDrift(bar);

  // DJ Brain — long-term set intelligence, runs above evolution logic
  if(DJBrain && DJBrain.enabled) djBrainTick(bar);
}

const DJ_PHRASE_DECISIONS = ['KEEP','ADD','REMOVE','MUTATE','FILTER','TEASE','CALLBACK','BREAK','DROP'];


const DJBrain = {
  // Journey
  journeyState: 'ARRIVAL',
  journeyIdx:   0,
  journeyBarsInState: 0,
  journeyMinBars: 48,   // min bars before considering journey advance
  journeyMaxBars: 192,  // max bars before forcing advance
  journeyBpmBase: 0,    // bpm at journey start — used for mod offsets

  // Chapters
  chapterIdentity: 'warm',
  chapterBar: 0,
  chapterMinBars: 96,   // 8 min @ ~125bpm
  chapterMaxBars: 192,  // 16 min
  chapterHistory: [],   // avoid immediate repeat

  // Phrase
  phraseDecision: 'KEEP',
  phraseBar: 0,
  phraseLength: 32,     // next decision point in bars (16, 32, or 64)
  phrasesSinceCallback: 0,
  phrasesSinceDrop: 0,

  // Memory bank — stores snapshots for callback
  memory: {
    motifs: [],       // {bar, drums, harmony, genre, chapter} — max 6
    textures: [],     // {bar, types, notes} — element configs
    grooves: [],      // {bar, style, feel, bpm}
    harmonics: [],    // {bar, root, scale, progression}
  },

  // Restraint — 70/85% continuity
  continuityScore: 0.75,   // current continuity target (drifts between 0.70–0.85)
  lastMutationBar: 0,
  consecutiveKeeps: 0,

  // Active modifiers being applied
  active: {
    densityBoost: 0,
    melodicBoost: 0,
    bassFilter: 0,    // 0=open, 1=filtered
    textureFreeze: false,
  },

  enabled: false,
};

function djBrainStart(){
  DJBrain.enabled = true;
  DJBrain.journeyState = 'ARRIVAL';
  DJBrain.journeyIdx   = 0;
  DJBrain.journeyBarsInState = 0;
  DJBrain.journeyBpmBase = bpm;
  DJBrain.chapterBar   = 0;
  DJBrain.phraseBar    = 0;
  DJBrain.phraseLength = 32;
  DJBrain.memory.motifs    = [];
  DJBrain.memory.textures  = [];
  DJBrain.memory.grooves   = [];
  DJBrain.memory.harmonics = [];
  DJBrain.consecutiveKeeps = 0;
  DJBrain.phrasesSinceCallback = 0;
  DJBrain.phrasesSinceDrop = 0;
  // Ensure a chord progression exists before the brain starts making decisions —
  // CALLBACK and harmonic snapshots otherwise see stale/empty state.
  if(!_currentProgression) pickProgressionForStyle(currentStyle);
  // Pick starting chapter from journey context
  djBrainSetChapter(djBrainPickChapter());
  djBrainApplyJourneyState();
}

function djBrainStop(){
  DJBrain.enabled = false;
}

function djBrainTick(bar){
  if(!DJBrain.enabled || !generateActive) return;

  DJBrain.journeyBarsInState++;
  DJBrain.chapterBar++;
  DJBrain.phraseBar++;

  // Always run journey logic first (macro)
  djBrainTickJourney(bar);

  // Chapter tick (meso — 8–16 min)
  djBrainTickChapter(bar);

  // Phrase decisions (micro — 16/32/64 bars)
  if(DJBrain.phraseBar >= DJBrain.phraseLength){
    DJBrain.phraseBar = 0;
    DJBrain.phrasesSinceCallback++;
    // Decay phrasesSinceDrop in low-energy states (RELEASE/AFTERGLOW/ENDING) instead
    // of incrementing — those states zero out the DROP weight anyway, so accumulating
    // pressure there just causes a forced drop the moment we leave the state.
    // PEAK also doesn't add pressure (drops are likely there regardless).
    const lowEnergy = ['RELEASE','AFTERGLOW','ENDING'].includes(DJBrain.journeyState);
    if(lowEnergy){
      DJBrain.phrasesSinceDrop = Math.max(0, DJBrain.phrasesSinceDrop - 1);
    } else {
      DJBrain.phrasesSinceDrop = Math.min(8, DJBrain.phrasesSinceDrop + 1);
    }
    DJBrain.phraseLength = djBrainPickPhraseLength();
    djBrainMakeDecision(bar);
  }
}

function djBrainTickJourney(bar){
  const state = DJ_JOURNEY_STATES[DJBrain.journeyState];
  const barsIn = DJBrain.journeyBarsInState;
  const changeProb = state.changeProb;

  // Force advance at max, probabilistic advance past min
  const shouldAdvance = barsIn >= DJBrain.journeyMaxBars
    || (barsIn >= DJBrain.journeyMinBars && Math.random() < changeProb / 4); // ÷4 because called every bar
  if(!shouldAdvance) return;

  const atEnd = DJBrain.journeyIdx >= DJ_JOURNEY_SEQUENCE.length - 1;

  // Second-wind branch: from AFTERGLOW or ENDING, with low probability (15%),
  // jump back to LOCK_IN instead of advancing/stalling. Long sessions need this
  // — without it, you're stuck in ENDING for hours with DROP=0 and ADD=0 weights.
  if(atEnd || DJBrain.journeyState === 'AFTERGLOW'){
    if(Math.random() < 0.15){
      const from = DJBrain.journeyState;
      const newState = 'LOCK_IN';
      DJBrain.journeyIdx = DJ_JOURNEY_SEQUENCE.indexOf(newState);
      DJBrain.journeyState = newState;
      DJBrain.journeyBarsInState = 0;
      djBrainApplyJourneyState();
      djBrainSaveMemorySnapshot(bar);
      fgTelemetry('journeySecondWind', {from, to: newState});
      return;
    }
    if(atEnd) return; // no advance available
  }

  const from = DJBrain.journeyState;
  DJBrain.journeyIdx++;
  DJBrain.journeyState = DJ_JOURNEY_SEQUENCE[DJBrain.journeyIdx];
  DJBrain.journeyBarsInState = 0;
  djBrainApplyJourneyState();
  djBrainSaveMemorySnapshot(bar); // snapshot before every transition
  fgTelemetry('journeyAdvance', {from, to: DJBrain.journeyState});
}

function djBrainApplyJourneyState(){
  const st = DJ_JOURNEY_STATES[DJBrain.journeyState];
  if(!st) return;
  const t = conductorTargets;

  // Energy range — pick midpoint, will be animated by applySetEnergy flow
  const energy = (st.energy[0] + st.energy[1]) / 2;
  t.drumVol   = lerp(st.drumVol[0],   st.drumVol[1],   0.5);
  t.reverbAmt = lerp(st.reverbAmt[0], st.reverbAmt[1], 0.5);

  // Bloom/cool driven by brightness
  t.bloom = Math.max(0, st.brightness - 0.6) * 2.5;
  t.cool  = Math.max(0, 0.6 - st.brightness) * 2.0;

  // BPM nudge
  const targetBpm = DJBrain.journeyBpmBase + st.bpmMod;
  if(Math.abs(bpm - targetBpm) > 1){
    bpm += (targetBpm - bpm) * 0.05; // very slow glide
    const el = document.getElementById('bpmVal');
    if(el) el.textContent = Math.round(bpm);
  }

  // Grain mutation and silence from journey energy
  _liveGrammarMods.mutationRate  = lerp(0.03, 0.22, energy);
  _liveGrammarMods.silenceChance = lerp(0.40, 0.03, energy);

  // Density — mute/unmute based on density target
  djBrainApplyDensity(st.density);
}

function djBrainApplyDensity(density){
  if(!elements.length || arcState !== 'idle') return;
  // Density lock (held during dissolve cues, etc.) explicitly blocks mute/unmute.
  // arcState check above already covers arc locks, but density lock is its own
  // gate — dissolve owns mute state and DJBrain must not toggle elements then.
  if(conductorLocks.density) return;
  // Sort elements by role priority: keep rhythm + sub, mute/unmute color elements
  const color = elements.filter(e =>
    !['Sub','Kick','Clap','Hihat'].includes(e.soundType) && !e.muted
  );
  const targetActive = Math.round(density * elements.length);
  const currentActive = elements.filter(e => !e.muted).length;
  const diff = targetActive - currentActive;

  if(diff < -1){
    // Mute some color elements
    const toMute = color.slice(0, Math.abs(diff));
    toMute.forEach(el => { el.muted = true; stopDrone(el, 1.5); });
  } else if(diff > 1){
    // Unmute some elements
    const muted = elements.filter(e => e.muted);
    muted.slice(0, diff).forEach(el => {
      el.muted = false;
      if(soundEnabled) maybeStartDrone(el);
    });
  }
}

function djBrainTickChapter(bar){
  const shouldChange = DJBrain.chapterBar >= DJBrain.chapterMaxBars
    || (DJBrain.chapterBar >= DJBrain.chapterMinBars && Math.random() < 0.004); // ~1/250 per bar

  if(shouldChange){
    DJBrain.chapterBar = 0;
    const newId = djBrainPickChapter();
    djBrainSetChapter(newId);
  }
}

function djBrainPickChapter(){
  const identities = Object.keys(DJ_CHAPTER_IDENTITIES);
  // Avoid immediate repeat
  const available = identities.filter(id => id !== DJBrain.chapterIdentity && !DJBrain.chapterHistory.includes(id));
  const pool = available.length ? available : identities.filter(id => id !== DJBrain.chapterIdentity);

  // Weight by current journey state
  const st = DJBrain.journeyState;
  const preferred = {
    ARRIVAL:   ['warm','ambient','dubby'],
    LOCK_IN:   ['dubby','warm','percussive'],
    PRESSURE:  ['percussive','driving','acid'],
    RELEASE:   ['warm','ambient','stripped'],
    PEAK:      ['euphoric','acid','industrial'],
    AFTERGLOW: ['ambient','warm','stripped'],
    ENDING:    ['ambient','stripped','dubby'],
  }[st] || [];

  const weighted = pool.sort((a, b) => {
    const aW = preferred.includes(a) ? 1 : 0;
    const bW = preferred.includes(b) ? 1 : 0;
    return bW - aW;
  });

  return weighted[0] || identities[0];
}

function djBrainSetChapter(identityId){
  const from = DJBrain.chapterIdentity;
  const id = DJ_CHAPTER_IDENTITIES[identityId] || DJ_CHAPTER_IDENTITIES.warm;
  DJBrain.chapterIdentity = identityId;
  DJBrain.chapterHistory.push(identityId);
  if(DJBrain.chapterHistory.length > 3) DJBrain.chapterHistory.shift();
  fgTelemetry('chapterChange', {from, to: identityId, feel: id.feel});

  // Apply chapter grammar mods
  _liveGrammarMods.mutationRate  = id.mutRate;
  _liveGrammarMods.silenceChance = id.silChance;

  // Gentle genre drift to one of this chapter's preferred genres
  if(!_liveMode && generateActive){
    const available = id.genres.filter(g => g !== currentStyle && GENRE_GRAPH[g]);
    if(available.length && Math.random() < 0.6){
      setTimeout(() => softDriftToGenre(available[0]), (60000/bpm) * 8);
    }
  }
}

function djBrainMakeDecision(bar){
  if(arcState !== 'idle') return; // never interfere with arc

  const st = DJ_JOURNEY_STATES[DJBrain.journeyState];
  const cont = DJBrain.continuityScore;

  // RESTRAINT GATE — 70–85% continuity
  // If roll lands in continuity zone → KEEP with possible micro-texture only
  const roll = Math.random();
  if(roll < cont){
    DJBrain.consecutiveKeeps++;
    DJBrain.phraseDecision = 'KEEP';

    // Even on KEEP: micro-texture variation every 3+ consecutive keeps
    if(DJBrain.consecutiveKeeps >= 3 && Math.random() < 0.35){
      djBrainApplyMicroTexture();
    }
    return;
  }

  // Build weighted decision table based on context
  const decisions = djBrainWeighDecisions(bar, st);
  const decision = djBrainPickWeighted(decisions);
  DJBrain.phraseDecision = decision;
  DJBrain.consecutiveKeeps = 0;
  DJBrain.lastMutationBar = bar;

  // Telemetry: record the decision and its weights for tuning analysis
  fgTelemetry('djDecision', {decision, weights: decisions, continuity: DJBrain.continuityScore});

  // Drift continuity score slightly — prevent too-predictable cycles
  DJBrain.continuityScore = Math.max(0.70, Math.min(0.85,
    DJBrain.continuityScore + (Math.random() - 0.5) * 0.04
  ));

  djBrainExecuteDecision(decision, bar);
}

function djBrainWeighDecisions(bar, journeyState){
  const state = DJBrain.journeyState;
  const barsIn = DJBrain.journeyBarsInState;
  const sinceCallback = DJBrain.phrasesSinceCallback;
  const sinceDrop = DJBrain.phrasesSinceDrop;
  const chapter = DJ_CHAPTER_IDENTITIES[DJBrain.chapterIdentity] || {};

  // Base weights — all decisions start equal
  const w = {
    MUTATE: 10,
    ADD:     8,
    REMOVE:  6,
    FILTER:  7,
    TEASE:   5,
    CALLBACK:3,
    BREAK:   3,
    DROP:    2,
  };

  // Journey state shaping
  if(state === 'ARRIVAL')   { w.ADD += 8; w.REMOVE -= 4; w.DROP = 0; w.BREAK = 0; }
  if(state === 'LOCK_IN')   { w.MUTATE += 4; w.FILTER += 3; }
  if(state === 'PRESSURE')  { w.ADD += 4; w.FILTER += 5; w.TEASE += 4; }
  if(state === 'RELEASE')   { w.REMOVE += 8; w.BREAK += 6; w.TEASE += 3; }
  if(state === 'PEAK')      { w.DROP += 10; w.ADD += 6; w.BREAK += 4; }
  if(state === 'AFTERGLOW') { w.REMOVE += 10; w.TEASE += 4; w.MUTATE += 2; w.DROP = 0; }
  if(state === 'ENDING')    { w.REMOVE += 12; w.FILTER += 4; w.ADD = 0; w.DROP = 0; }

  // Chapter shaping
  if(chapter.feel === 'stripped') { w.REMOVE += 4; w.FILTER += 4; w.ADD -= 3; }
  if(chapter.feel === 'drive')    { w.ADD += 3; w.MUTATE += 3; }
  if(chapter.feel === 'broken')   { w.MUTATE += 5; w.FILTER += 3; }

  // Memory pressure — callback if we have stored motifs and it's been a while
  if(sinceCallback >= 4 && DJBrain.memory.motifs.length > 0){
    w.CALLBACK += 8;
  }

  // Drop pressure — drop if we haven't had one in many phrases
  if(sinceDrop >= 6){ w.DROP += 6; }

  // Tension buildup — TEASE + FILTER before DROP/PEAK
  if(barsIn > 80 && state === 'PRESSURE'){ w.TEASE += 6; w.FILTER += 4; }

  // Floor at 0
  Object.keys(w).forEach(k => { if(w[k] < 0) w[k] = 0; });
  return w;
}

function djBrainPickWeighted(weights){
  const total = Object.values(weights).reduce((a,b)=>a+b,0);
  if(!total) return 'KEEP';
  let r = Math.random() * total;
  for(const [k,v] of Object.entries(weights)){
    r -= v;
    if(r <= 0) return k;
  }
  return 'MUTATE';
}

// Taste rules — applied before executing any decision. Returns the effective
// decision after gating (may downgrade structural decisions to KEEP).
// Reviewer requirements:
//   - During build/drop/break (arc lock), DJBrain cannot ADD, REMOVE, BREAK, DROP, mutate drums
//   - Never ADD and REMOVE within the same 16-bar window
//   - After a drop, hold 16-32 bars before another structural decision
//   - Keep 70-85% as KEEP/microtexture (handled by continuityScore upstream)
function djBrainGateDecision(decision){
  // Lock check: arc active blocks all structural changes
  if(conductorLocks.arc){
    if(['ADD','REMOVE','BREAK','DROP','MUTATE'].includes(decision)){
      fgTelemetry('djDecisionVeto', {decision, reason:'lock.arc'});
      return 'KEEP';
    }
  }
  if(conductorLocks.genre){
    if(['ADD','REMOVE','BREAK','DROP'].includes(decision)){
      fgTelemetry('djDecisionVeto', {decision, reason:'lock.genre'});
      return 'KEEP';
    }
  }
  if(conductorLocks.density){
    if(['ADD','REMOVE'].includes(decision)){
      fgTelemetry('djDecisionVeto', {decision, reason:'lock.density'});
      return 'KEEP';
    }
  }
  // Spacing: no ADD/REMOVE within 16 bars of the previous structural change
  if((decision === 'ADD' || decision === 'REMOVE') && barsSinceLastDecision('STRUCTURAL') < 16){
    fgTelemetry('djDecisionVeto', {decision, reason:'spacing.structural'});
    return 'KEEP';
  }
  // Drop recovery: hold 16 bars after a drop before another structural mutation
  if(['DROP','BREAK','ADD','REMOVE'].includes(decision) && barsSinceLastDecision('DROP') < 16){
    fgTelemetry('djDecisionVeto', {decision, reason:'recovery.drop'});
    return 'KEEP';
  }
  // Break recovery: hold 8 bars after a break before another break/drop
  if(['DROP','BREAK'].includes(decision) && barsSinceLastDecision('BREAK') < 8){
    fgTelemetry('djDecisionVeto', {decision, reason:'recovery.break'});
    return 'KEEP';
  }
  return decision;
}

function djBrainExecuteDecision(decision, bar){
  // Gate through taste rules first — may downgrade to KEEP
  const effective = djBrainGateDecision(decision);
  if(effective === 'KEEP'){
    DJBrain.phraseDecision = 'KEEP';
    return;
  }
  switch(effective){
    case 'ADD':
      djBrainDecisionAdd(); break;
    case 'REMOVE':
      djBrainDecisionRemove(); break;
    case 'MUTATE':
      djBrainDecisionMutate(bar); break;
    case 'FILTER':
      djBrainDecisionFilter(); break;
    case 'TEASE':
      djBrainDecisionTease(bar); break;
    case 'CALLBACK':
      djBrainDecisionCallback(bar); break;
    case 'BREAK':
      if(arcState==='idle') startBreakArc(); break;
    case 'DROP':
      if(arcState==='idle'){ DJBrain.phrasesSinceDrop=0; startBuildArc(); } break;
  }
}

function djBrainDecisionAdd(){
  const muted = elements.filter(e => e.muted && !['Sub'].includes(e.soundType));
  if(!muted.length) return;
  // Pick element most sonically appropriate for current chapter
  const el = muted[Math.floor(Math.random() * Math.min(2, muted.length))];
  el.muted = false;
  if(soundEnabled) maybeStartDrone(el);
  recordConductorDecision('ADD', {elementId: el.id, soundType: el.soundType});
}

function djBrainDecisionRemove(){
  const active = elements.filter(e => !e.muted && !['Sub','Kick'].includes(e.soundType));
  if(active.length <= 2) return;
  // Prefer removing bright/melodic elements — keep groove anchors
  const candidates = active.filter(e =>
    ['Shimmer','Ring','Echo','Arp'].includes(e.soundType)
  );
  const el = (candidates.length ? candidates : active)[Math.floor(Math.random()*(candidates.length||active.length))];
  el.muted = true;
  stopDrone(el, 2.0);
  recordConductorDecision('REMOVE', {elementId: el.id, soundType: el.soundType});
}

function djBrainDecisionMutate(bar){
  // Trigger drum mutation + bass phrase mutation
  const rules = EVOLUTION_RULES[currentStyle];
  const grammar = getLiveGrammar();
  if(rules) evolveDrumMicro(rules, (grammar.mutationRate || 0.1) * 1.8);
  mutateBassPhrase(0.6);
  // Mutate one voice motif
  const voice = elements.filter(e => getInstrumentRole(e)==='voice' && !e.muted);
  if(voice.length) mutateVoiceMotif(voice[Math.floor(Math.random()*voice.length)]);
}

function djBrainDecisionFilter(){
  // HPF sweep — tension builds, then releases. Submitted at djBrain priority
  // so arcs (100) cleanly override and we never fight build-arc HPF curves.
  const st = DJBrain.journeyState;
  const hpfTarget = st === 'PRESSURE' || st === 'PEAK' ? 0.35 + Math.random()*0.25 : 0.15;
  const releaseMs = (60000/bpm) * 8;
  submitConductorIntent('djBrain.filter', 'hpf', hpfTarget, CONDUCTOR_PRIORITY.djBrain, releaseMs);
  DJBrain.active.bassFilter = hpfTarget;
}

function djBrainDecisionTease(bar){
  // Brief glimpse of next journey state — tease a melodic element, then pull it back
  const voice = elements.filter(e =>
    ['Arp','EP','FMStab','Pluck'].includes(e.soundType) && e.muted
  );
  if(!voice.length) return;
  const el = voice[0];
  el.muted = false;
  if(soundEnabled) maybeStartDrone(el);
  // Re-mute after 4 bars — the tease
  const teaseMs = (60000/bpm) * 4 * 4; // 4 bars in ms
  setTimeout(() => {
    if(!arcState || arcState === 'idle'){
      el.muted = true;
      stopDrone(el, 1.0);
    }
  }, teaseMs);
}

function djBrainDecisionCallback(bar){
  if(!DJBrain.memory.motifs.length) return;
  DJBrain.phrasesSinceCallback = 0;
  // Pick a memory snapshot — prefer ones from a different chapter than current
  const candidates = DJBrain.memory.motifs.filter(m => m.chapter !== DJBrain.chapterIdentity);
  const snap = (candidates.length ? candidates : DJBrain.memory.motifs)[0];

  // Restore drum pattern from memory (altered — not identical)
  if(snap.drums){
    // Mutated callback: flip 1–2 random bits in the pattern
    const restored = {
      kick:  [...snap.drums.kick],
      clap:  [...snap.drums.clap],
      hihat: [...snap.drums.hihat],
    };
    // Single mutation — memory callback with character
    const track = ['kick','clap','hihat'][Math.floor(Math.random()*3)];
    const pos = Math.floor(Math.random() * 16);
    restored[track][pos] = 1 - restored[track][pos];
    Object.assign(drumPattern, restored);
    buildDrumGrid();
  }

  // Restore element mute + volume from snapshot — matches the sonic arrangement
  // that gave that drum pattern its character. Skip elements that no longer exist
  // (genre may have changed between snapshot and callback).
  if(snap.elements && snap.elements.length){
    const snapById = new Map(snap.elements.map(s => [s.id, s]));
    elements.forEach(el => {
      const s = snapById.get(el.id);
      if(!s) return;
      // Restore mute state — fade in/out smoothly
      if(s.muted && !el.muted){
        el.muted = true;
        stopDrone(el, 1.5);
      } else if(!s.muted && el.muted){
        el.muted = false;
        if(soundEnabled) maybeStartDrone(el);
      }
      // Restore volume (only for non-muted to avoid bumping silent voices)
      if(!el.muted && typeof s.volume === 'number'){
        el.volume = s.volume;
        if(typeof updateDroneParams === 'function') updateDroneParams(el);
      }
    });
  }

  // Restore harmony root if different
  if(snap.harmony && snap.harmony.root){
    const sel = document.getElementById('keySelect');
    if(sel && sel.value !== snap.harmony.root){
      // Only restore if not too jarring — same root class
      const compatible = ['C','F','G','D','A','E'].includes(snap.harmony.root);
      if(compatible) sel.value = snap.harmony.root;
    }
  }
}

function djBrainApplyMicroTexture(){
  // Tiny changes — single parameter nudge, no structural change.
  // Uses microTexture priority so arc/liveSet/djBrain top-level writers can stomp.
  const roll = Math.random();
  if(roll < 0.3){
    // Reverb swell — momentary bloom
    const swellTarget = Math.min(2.0, (conductorTargets.reverbAmt || 1) * 1.4);
    const swellMs = (60000/bpm) * 4;
    setConductorTarget('reverbAmt', swellTarget, CONDUCTOR_PRIORITY.microTexture, swellMs);
    // After the swell expires, naturally returns to whatever the next-highest writer wants.
    // For safety, also schedule an explicit reset to the journey-state baseline:
    setTimeout(() => {
      const st = DJ_JOURNEY_STATES[DJBrain.journeyState];
      const baseline = (st.reverbAmt[0] + st.reverbAmt[1]) / 2;
      setConductorTarget('reverbAmt', baseline, CONDUCTOR_PRIORITY.microTexture, 100);
    }, swellMs);
  } else if(roll < 0.6){
    // Bloom flash
    const bloomTarget = Math.min(0.8, (conductorTargets.bloom || 0) + 0.2);
    const bloomMs = (60000/bpm) * 2;
    setConductorTarget('bloom', bloomTarget, CONDUCTOR_PRIORITY.microTexture, bloomMs);
    setTimeout(() => {
      setConductorTarget('bloom', 0, CONDUCTOR_PRIORITY.microTexture, 100);
    }, bloomMs);
  } else {
    // Drum humanization nudge — change ghost density without pattern change
    const rules = EVOLUTION_RULES[currentStyle];
    if(rules) evolveDrumMicro(rules, 0.08);
  }
}

function djBrainSaveMemorySnapshot(bar){
  const snap = {
    bar,
    chapter: DJBrain.chapterIdentity,
    drums: {
      kick:  [...(drumPattern.kick  || [])],
      clap:  [...(drumPattern.clap  || [])],
      hihat: [...(drumPattern.hihat || [])],
    },
    harmony: {
      root:  document.getElementById('keySelect')?.value  || 'A',
      scale: document.getElementById('scaleSelect')?.value || 'Minor',
    },
    genre: currentStyle,
    // Full element state — id + mute + volume + sound config — so CALLBACK can
    // restore the sonic arrangement that gave the drum pattern its character,
    // not just the pattern itself.
    elements: elements.map(e => ({
      id: e.id,
      soundType: e.soundType,
      variation: e.variation ?? 0,
      muted: !!e.muted,
      volume: e.volume,
      tone:  e.tone  ? {x:e.tone.x,  y:e.tone.y}  : null,
      shape: e.shape ? {x:e.shape.x, y:e.shape.y} : null,
      space: e.space ? {x:e.space.x, y:e.space.y} : null,
    })),
    // Convenience: keep the texture summary for quick existence checks
    texture: elements.filter(e=>!e.muted).map(e=>e.soundType),
  };

  DJBrain.memory.motifs.push(snap);
  if(DJBrain.memory.motifs.length > 6) DJBrain.memory.motifs.shift(); // rolling window

  // Harmonic snapshot
  DJBrain.memory.harmonics.push({bar, root:snap.harmony.root, scale:snap.harmony.scale, genre:snap.genre});
  if(DJBrain.memory.harmonics.length > 8) DJBrain.memory.harmonics.shift();

  // Groove snapshot
  DJBrain.memory.grooves.push({bar, style:currentStyle, bpm});
  if(DJBrain.memory.grooves.length > 8) DJBrain.memory.grooves.shift();
}

function djBrainPickPhraseLength(){
  const st = DJBrain.journeyState;
  // Long phrases (64 bars) in hypnotic states — patience
  // Short phrases (16 bars) in peak/pressure — responsive
  const weights = {
    ARRIVAL:   {16:1, 32:3, 64:4},
    LOCK_IN:   {16:2, 32:4, 64:2},
    PRESSURE:  {16:3, 32:4, 64:1},
    RELEASE:   {16:2, 32:3, 64:3},
    PEAK:      {16:5, 32:3, 64:0},
    AFTERGLOW: {16:1, 32:3, 64:5},
    ENDING:    {16:1, 32:2, 64:6},
  }[st] || {16:2,32:4,64:2};

  const lengths = [16,32,64];
  const total = lengths.reduce((s,l)=>s+(weights[l]||0),0);
  let r = Math.random()*total;
  for(const l of lengths){ r-=(weights[l]||0); if(r<=0) return l; }
  return 32;
}

let driftActive = false;
let driftRafId = null;

function getScheduleForToday(){
  const now = new Date();
  const currentHour = now.getHours();
  // Map each set to its wall-clock slot (sets are 2hr blocks)
  return LIVE_SETS.map((set, i) => {
    const [startH] = set.timeSlot;
    return { ...set, wallStart: startH };
  }).sort((a,b) => {
    // Sort by proximity — sets from current hour wrap around midnight
    const da = (a.wallStart - currentHour + 24) % 24;
    const db = (b.wallStart - currentHour + 24) % 24;
    return da - db;
  });
}

function getCurrentSet(){
  const h = new Date().getHours();
  // Find set whose 2hr slot contains current hour
  return LIVE_SETS.find(s => {
    const [start] = s.timeSlot;
    const end = (start + 2) % 24;
    if(start < end) return h >= start && h < end;
    return h >= start || h < end; // wraps midnight
  }) || LIVE_SETS[0];
}

function getSetDuration(set){
  const [start, end] = set.timeSlot;
  return ((end - start + 24) % 24) * 60;
}

function getCurrentCue(set){
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const [slotStart] = set.timeSlot;
  const minuteInSet = ((h - slotStart + 24) % 24) * 60 + m;
  // Find the last cue that has started
  let cue = set.cues[0];
  for(const c of set.cues){
    if(c.at <= minuteInSet) cue = c;
    else break;
  }
  return cue;
}

function renderSchedule(){
  const date = new Date();
  const dateStr = date.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  const el = document.getElementById('schedulePanelDate');
  if(el) el.textContent = dateStr;

  const list = document.getElementById('scheduleList');
  if(!list) return;

  const allSets = getScheduleForToday();
  const currentSet = getCurrentSet();

  // Current first, then upcoming in order, past sets at the bottom grayed
  const currentIdx = allSets.findIndex(s => s.id === currentSet?.id);
  const sorted = currentIdx >= 0
    ? [...allSets.slice(currentIdx), ...allSets.slice(0, currentIdx)]
    : allSets;

  list.innerHTML = sorted.map(set => {
    const [startH] = set.timeSlot;
    const endH = (startH + 2) % 24;
    const fmt = h => {
      const ampm = h < 12 || h === 24 ? 'am' : 'pm';
      const h12 = h === 0 || h === 24 ? 12 : h > 12 ? h-12 : h;
      return `${h12}${ampm}`;
    };
    const timeStr = `${fmt(startH)}–${fmt(endH)}`;
    const isCurrent = set.id === currentSet.id;
    const isPast    = ((startH - date.getHours() + 24) % 24) > 12;

    // Progress within set (0–1) for current set
    let progressPct = 0, currentCueLabel = '';
    if(isCurrent){
      const min = getMinuteInSet(set);
      progressPct = Math.min(1, min / getSetDuration(set)) * 100;
      const cue = getCurrentCue(set);
      currentCueLabel = cue.label || cue.event || '';
    }

    // Genre dots
    const genreDots = set.genres.map(g =>
      `<span style="font-size:9px;color:rgba(255,255,255,${isCurrent?'0.38':'0.20'});letter-spacing:.06em">${g}</span>`
    ).join('<span style="color:rgba(255,255,255,0.1);margin:0 4px">/</span>');

    return `
      <div onclick="startSetById('${set.id}')"
        style="padding:18px 24px;border-top:1px solid rgba(255,255,255,${isCurrent?'0.10':'0.05'});cursor:pointer;opacity:${isPast?'0.3':'1'};transition:background .2s;background:${isCurrent?'rgba(255,255,255,0.03)':'transparent'}"
        onmouseenter="this.style.background='rgba(255,255,255,0.04)'"
        onmouseleave="this.style.background='${isCurrent?'rgba(255,255,255,0.03)':'transparent'}'">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div style="flex:1;min-width:0">
            <!-- Time -->
            <div style="font-size:9px;color:rgba(255,255,255,${isCurrent?'0.40':'0.22'});letter-spacing:.1em;margin-bottom:6px">${timeStr}</div>
            <!-- Set name -->
            <div style="font-size:18px;font-weight:600;color:rgba(255,255,255,${isCurrent?'0.95':'0.55'});letter-spacing:-.01em;line-height:1.1;margin-bottom:5px">${set.name}</div>
            <!-- Tagline -->
            <div style="font-size:10px;color:rgba(255,255,255,${isCurrent?'0.32':'0.18'});letter-spacing:.04em;margin-bottom:8px">${set.tagline}</div>
            <!-- Genre tags -->
            <div style="display:flex;flex-wrap:wrap;align-items:center;gap:2px;margin-bottom:${isCurrent?'10px':'0'}">${genreDots}</div>
            ${isCurrent ? `
            <!-- Progress bar + cue label -->
            <div style="margin-top:2px">
              <div style="height:1px;background:rgba(255,255,255,0.08);border-radius:1px;overflow:hidden;margin-bottom:5px">
                <div style="height:100%;width:${progressPct.toFixed(1)}%;background:rgba(255,255,255,0.35);border-radius:1px;transition:width 5s linear"></div>
              </div>
              <div style="font-size:8px;color:rgba(255,255,255,0.28);letter-spacing:.1em">${currentCueLabel.toUpperCase()}</div>
            </div>` : ''}
          </div>
          <!-- Right: live dot or energy shape -->
          <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:6px;padding-top:2px">
            ${isCurrent
              ? `<div style="display:flex;align-items:center;gap:5px">
                   <div style="width:6px;height:6px;border-radius:50%;background:#ff4040;animation:liveDotPulse 1.4s ease-in-out infinite"></div>
                   <span style="font-size:8px;color:rgba(255,80,80,0.8);letter-spacing:.1em">live</span>
                 </div>`
              : `<span style="font-size:9px;color:rgba(255,255,255,0.15);letter-spacing:.06em">2h</span>`
            }
          </div>
        </div>
      </div>`;
  }).join('');
}

function startSetById(id){
  const set = LIVE_SETS.find(s=>s.id===id);
  if(!set) return;
  closeSchedulePanel();
  _currentLiveSet = set;
  _lastCueIndex   = -1;
  // Use first cue directly — don't jump to wall-clock position when manually selecting
  // (wall-clock logic applies when the runner auto-advances via the live timer)
  const firstCue = set.cues[0];
  if(firstCue){
    if(firstCue.genre !== currentStyle) softDriftToGenre(firstCue.genre);
    showLiveCueLabel(set, firstCue);
  }
  startLiveSetRunner(); // restart runner from beginning of new set
}

let _currentLiveSet = null;
let _liveSetRunnerTimer = null;
let _lastCueIndex = -1; // track cue changes to fire transitions

function lerp(a, b, t){ return a + (b-a) * Math.max(0, Math.min(1, t)); }


function getMinuteInSet(set){
  const now  = new Date();
  const [slotStart] = set.timeSlot;
  return ((now.getHours() - slotStart + 24) % 24) * 60 + now.getMinutes()
       + now.getSeconds() / 60;
}

function getInterpolatedCue(set, minute){
  const cues = set.cues;
  let cueIdx = 0;
  for(let i=0; i<cues.length; i++){
    if(cues[i].at <= minute) cueIdx = i;
    else break;
  }
  const cue  = cues[cueIdx];
  const next = cues[cueIdx+1] || null;
  // Progress 0→1 from this cue to next
  const progress = next
    ? Math.max(0, Math.min(1, (minute - cue.at) / (next.at - cue.at)))
    : 1;
  return { cue, next, progress, cueIdx };
}

let _liveEnergy = 0.5; // current set energy, 0–1, used by background

const _liveGrammarMods = { mutationRate: null, silenceChance: null };

function getLiveGrammar(){
  const base = getGrammar();
  if(!_liveMode) return base;
  return Object.assign({}, base, {
    mutationRate:  _liveGrammarMods.mutationRate  !== null ? _liveGrammarMods.mutationRate  : base.mutationRate,
    silenceChance: _liveGrammarMods.silenceChance !== null ? _liveGrammarMods.silenceChance : base.silenceChance,
  });
}

function applySetEnergy(energy, cue){
  _liveEnergy = energy; // expose for background renderer

  // Store in overlay — never mutate GENRE_GRAMMAR base objects directly
  _liveGrammarMods.mutationRate  = lerp(0.04, 0.26, energy);
  _liveGrammarMods.silenceChance = lerp(0.35, 0.02, energy);

  // Energy drives drum volume and reverb at liveSet priority (80). Arc (100)
  // overrides during build/drop/break; ambient drift (10) cannot override.
  // Long duration (30s) keeps the claim alive across cue ticks.
  submitConductorIntent('liveSet.energy', 'drumVol',   lerp(0.50, 1.18, energy), CONDUCTOR_PRIORITY.liveSet, 30000);
  submitConductorIntent('liveSet.energy', 'reverbAmt', lerp(1.5,  0.9,  energy), CONDUCTOR_PRIORITY.liveSet, 30000);

  // HPF: keep it clear unless we're in a build event
  if(arcState === 'idle'){
    submitConductorIntent('liveSet.energy', 'hpf', lerp(0.05, 0, energy), CONDUCTOR_PRIORITY.liveSet, 30000);
  }

  // BPM target — ramp toward cue BPM
  if(cue.bpm && Math.abs(bpm - cue.bpm) > 2){
    bpm += (cue.bpm - bpm) * 0.002; // very gentle continuous ramp
    document.getElementById('bpmVal').textContent = Math.round(bpm);
  }
}

function fireCueEvent(cue, prevCue){
  if(!cue) return;

  // Genre transition
  if(prevCue && cue.genre !== prevCue.genre){
    const transition = prevCue.transition || 'soft';
    switch(transition){
      case 'breakdown':
        if(arcState === 'idle') startBreakArc();
        // Drift genre after break arc completes (~16 bars)
        setTimeout(()=>softDriftToGenre(cue.genre), (60000/bpm)*16*4);
        break;
      case 'drop':
        if(arcState === 'idle') startBuildArc();
        // Genre shifts when drop fires (build auto-drops after 16 bars)
        setTimeout(()=>softDriftToGenre(cue.genre), (60000/bpm)*16*4);
        break;
      default: // 'soft'
        softDriftToGenre(cue.genre);
        break;
    }
  }

  // Event-specific behaviours
  switch(cue.event){
    case 'intro':
      // Sparse entry — mute drums for first 4 bars then bring back
      submitConductorIntent('liveSet.cue.intro', 'drumVol', 0.3, CONDUCTOR_PRIORITY.liveSet, (60000/bpm)*16);
      // applySetEnergy will overwrite naturally after the intro window
      break;
    case 'peak':
      // Fire a drop on entry for maximum impact
      if(arcState === 'idle') setTimeout(()=>startDropArc(), 500);
      break;
    case 'breakdown':
      if(arcState === 'idle') startBreakArc();
      break;
    case 'resolution':
      // Gradually reduce elements — mute all but Sub and one Drone
      submitConductorIntent('liveSet.cue.resolution', 'cool',      0.6, CONDUCTOR_PRIORITY.liveSet, 30000);
      submitConductorIntent('liveSet.cue.resolution', 'reverbAmt', 1.8, CONDUCTOR_PRIORITY.liveSet, 30000);
      break;
    case 'dissolve':
      // Near-silence: pull almost everything back, let reverb tail dominate.
      // 12-bar window — claims auto-expire so applySetEnergy resumes after.
      conductorLocks.density = true; // freeze density toggles during dissolve
      const dissolveMs = (60000/bpm) * 4 * 12;
      submitConductorIntent('liveSet.cue.dissolve', 'drumVol',   0.12, CONDUCTOR_PRIORITY.liveSet, dissolveMs);
      submitConductorIntent('liveSet.cue.dissolve', 'reverbAmt', 2.2,  CONDUCTOR_PRIORITY.liveSet, dissolveMs);
      submitConductorIntent('liveSet.cue.dissolve', 'cool',      0.7,  CONDUCTOR_PRIORITY.liveSet, dissolveMs);
      submitConductorIntent('liveSet.cue.dissolve', 'tension',   0.0,  CONDUCTOR_PRIORITY.liveSet, dissolveMs);
      // Mute non-essential voices temporarily — keep only Sub + 1 pad
      elements.forEach(el => {
        if(el.muted) return;
        const role = getInstrumentRole(el);
        if(role === 'voice' && el.soundType !== 'Sub') {
          el._dissolveMuted = true;
          el.muted = true;
        }
      });
      // Restore after 12 bars
      setTimeout(() => {
        elements.forEach(el => {
          if(el._dissolveMuted) { el.muted = false; el._dissolveMuted = false; }
        });
        conductorLocks.density = false;
        // applySetEnergy on the next tick re-establishes drumVol from cue energy
      }, dissolveMs);
      break;
    case 'return':
      // Reveal: drums come back first with a small build, then voices enter
      submitConductorIntent('liveSet.cue.return', 'drumVol',   lerp(0.5, 1.18, cue.energy || 0.30), CONDUCTOR_PRIORITY.liveSet, 30000);
      submitConductorIntent('liveSet.cue.return', 'reverbAmt', 1.4, CONDUCTOR_PRIORITY.liveSet, 30000);
      submitConductorIntent('liveSet.cue.return', 'cool',      0.2, CONDUCTOR_PRIORITY.liveSet, 30000);
      // Delay voice entries slightly so drums land first
      elements.forEach(el => {
        if(el.muted || el._dissolveMuted) return;
        if(getInstrumentRole(el) === 'voice' && el.soundType !== 'Sub') {
          el.muted = true;
          setTimeout(() => { el.muted = false; }, (60000/bpm) * 4 * 4);
        }
      });
      break;
  }

  // Show cue label on screen
  if(_currentLiveSet) showLiveCueLabel(_currentLiveSet, cue);
}

function tickLiveSet(){
  if(!_liveMode || !_currentLiveSet) return;

  // Wall-clock check -- auto-transition when hour crosses into new set
  const wallSet = getCurrentSet();
  if(wallSet && wallSet.id !== _currentLiveSet.id){
    _currentLiveSet = wallSet;
    _lastCueIndex = -1;
    softDriftToGenre(wallSet.cues[0].genre);
    updateLiveSetLabel();
    renderSchedule();
    return;
  }

  updateLiveSetLabel();

  const minute = getMinuteInSet(_currentLiveSet);
  const { cue, next, progress, cueIdx } = getInterpolatedCue(_currentLiveSet, minute);

  if(cueIdx !== _lastCueIndex){
    const prevCue = _lastCueIndex >= 0 ? _currentLiveSet.cues[_lastCueIndex] : null;
    fireCueEvent(cue, prevCue);
    _lastCueIndex = cueIdx;
  }

  const energy = next ? lerp(cue.energy, next.energy, progress) : cue.energy;
  applySetEnergy(energy, cue);

  if(!next && minute >= getSetDuration(_currentLiveSet) - 1){
    handleSetEnd(_currentLiveSet);
  }
}

function handleSetEnd(set){
  if(set.endMode === 'high'){
    if(arcState === 'idle') startBuildArc(); // final build → drop
  } else {
    // Dissolve — fade everything out gently. 3 min lifetime so it holds until
    // the next set boots up and submits its own liveSet.energy intents.
    submitConductorIntent('liveSet.setEnd.dissolve', 'drumVol',   0.1, CONDUCTOR_PRIORITY.liveSet, 180000);
    submitConductorIntent('liveSet.setEnd.dissolve', 'reverbAmt', 2.0, CONDUCTOR_PRIORITY.liveSet, 180000);
    submitConductorIntent('liveSet.setEnd.dissolve', 'hpf',       0.3, CONDUCTOR_PRIORITY.liveSet, 180000);
  }
  // After 3 min, auto-advance to the next set
  setTimeout(()=>{
    if(!_liveMode) return;
    const sets = getScheduleForToday();
    const idx  = sets.findIndex(s=>s.id===set.id);
    const nextSet = sets[(idx+1) % sets.length];
    if(nextSet){
      _currentLiveSet = nextSet;
      _lastCueIndex   = -1;
      softDriftToGenre(nextSet.cues[0].genre);
      showLiveCueLabel(nextSet, nextSet.cues[0]);
      renderSchedule(); // refresh NOW indicator
    }
  }, 3 * 60 * 1000);
}

function startLiveSetRunner(){
  stopLiveSetRunner();
  _lastCueIndex = -1;
  initSessionSignature(); // set melodic anchor for this live session
  tickLiveSet(); // fire immediately
  _liveSetRunnerTimer = setInterval(tickLiveSet, 5000); // then every 5s
}

function stopLiveSetRunner(){
  if(_liveSetRunnerTimer){ clearInterval(_liveSetRunnerTimer); _liveSetRunnerTimer=null; }
}

function scrollToCanvas(){
  window.scrollTo({top:0,behavior:'smooth'});
}

function showLiveCueLabel(set, cue){
  const display = document.getElementById('liveGenreDisplay');
  const name    = document.getElementById('liveGenreName');
  const arrow   = document.getElementById('liveGenreArrow');
  if(!display||!name) return;
  name.textContent  = set.name.toUpperCase();
  arrow.textContent = cue.label ? cue.label.toUpperCase() : '';
  display.style.opacity='1';
  setTimeout(()=>{ display.style.opacity='0'; }, 3500);
}

function updateLiveSetLabel(){
  const btn = document.getElementById('btnLive');
  if(!btn) return;
  const set = _currentLiveSet || getCurrentSet();
  const setName = set ? set.name : '';

  if(_liveMode){
    // In live mode: button shows set name prominently
    btn.innerHTML = setName
      ? `◉ ${setName.toUpperCase()}`
      : '◉ LIVE';
    btn.style.letterSpacing = setName ? '.04em' : '.05em';
  } else {
    // Normal: "◉ LIVE · Set Name"
    btn.innerHTML = setName
      ? `◉ LIVE <span style="font-weight:400;opacity:0.55;font-size:7px;letter-spacing:.05em">· ${setName.toUpperCase()}</span>`
      : '◉ LIVE';
    btn.style.letterSpacing = '.05em';
  }

  // Update overlay indicator
  const ind = document.getElementById('liveSetNameDisplay');
  if(ind) ind.textContent = setName ? setName.toUpperCase() : 'LIVE';
  // D3: BPM in live overlay
  const bpmEl = document.getElementById('liveBpmDisplay');
  if(bpmEl) bpmEl.textContent = Math.round(bpm) + ' BPM';
}

function getTimeOfDayGenre(){
  const h=new Date().getHours();
  if(h>=6  && h<10) return 'downtempo';      // morning
  if(h>=10 && h<14) return 'deephouse';      // midday
  if(h>=14 && h<18) return 'techhouse';      // afternoon
  if(h>=18 && h<21) return 'italo';          // early evening
  if(h>=21 && h<24) return 'detroittechno';  // night
  return 'ambienttechno';                    // late night / early AM
}

function softDriftToGenre(newStyle, _retryCount){
  if(newStyle===currentStyle) return;
  _retryCount = _retryCount || 0;
  // Never rotate or replace drum patterns during build/drop/break — genre drift
  // would change the groove under an arc that's holding the tension curve.
  // Defer 4 bars and retry; give up after 8 retries (~32 bars) to prevent
  // spinning if a lock somehow never releases.
  if(conductorLocks.arc || conductorLocks.drums || arcState !== 'idle'){
    fgTelemetry('genreDriftDeferred', {
      to: newStyle,
      reason: 'arc-or-drums-locked',
      arcState,
      retry: _retryCount,
    });
    if(_retryCount >= 8){
      fgTelemetry('genreDriftAbandoned', {to: newStyle, retries: _retryCount});
      return;
    }
    const retryMs = (60000 / bpm) * 4 * 4; // retry in 4 bars
    setTimeout(() => softDriftToGenre(newStyle, _retryCount + 1), retryMs);
    return;
  }
  if(conductorLocks.genre){
    // Already mid-transition — queue the latest requested genre. Older queued
    // requests are stale (the most recent cue/chapter is what matters), so a
    // single-slot queue with "latest wins" is enough. Drained when the lock
    // releases (see _releaseGenreLock).
    _pendingGenreDrift = newStyle;
    fgTelemetry('genreDriftQueued', {to: newStyle, reason: 'lock.genre'});
    return;
  }
  conductorLocks.genre = true;
  _pendingGenreDrift = null; // we're now serving this one — clear the slot
  recordConductorDecision('GENRE_CHANGE', {from: currentStyle, to: newStyle});
  const oldStyle=currentStyle;
  currentStyle=newStyle;

  // Update style selector silently
  const ss=document.getElementById('styleSelect');
  if(ss) ss.value=newStyle;

  // Reset chord progression to new genre's harmonic logic
  pickProgressionForStyle(newStyle);

  // Reset bass phrase to new genre
  resetBassPhrase();

  // Apply drum preset for new genre
  const newStyleDef=STYLES[newStyle];
  if(newStyleDef?.drumPreset!=null){
    const dp=newStyleDef.drumPreset;
    activeDrumPreset=dp;
    activeDrumStyle=DRUM_PRESETS[dp]?.drumStyle||newStyleDef.drumStyle||'house'; updateDrumGain(); updateDrumSends(); clearVoiceMotifCache();
    const p=DRUM_PRESETS[dp];
    if(p){drumPattern.kick=[...p.kick];drumPattern.clap=[...p.clap];drumPattern.hihat=[...p.hihat];drumPattern.openhh=[...p.openhh];drumPattern.perc=[...p.perc];drumPattern.snap=[...(p.snap||Array(16).fill(0))];}
    _drumBankIdx=-1;
    if(DRUM_BANK[newStyle]) rotateDrumPattern();
  }

  // Refresh arp contours for new genre
  elements.forEach(el=>{ if(el.soundType==='Arp'&&!el.muted) el._arpPendingPattern=true; });

  // Ramp BPM gently
  if(newStyleDef){
    const targetBpm=pickBpm(newStyleDef);
    const steps=32; // ramp over 32 small steps
    let step=0;
    const startBpm=bpm;
    const rampTimer=setInterval(()=>{
      step++;
      bpm=startBpm+(targetBpm-startBpm)*(step/steps);
      document.getElementById('bpmVal').textContent=Math.round(bpm);
      if(step>=steps){
        clearInterval(rampTimer);
        bpm=targetBpm;
        startBpmDrift(bpm,newStyleDef.bpmRange);
        // Gradual re-orchestration after ramp settles
        setTimeout(()=>reOrchestrateTo(newStyle), 500);
        // Release genre lock after reorchestration's full window (Wave 2 fires
        // at ~16 bars; release just after, so DJBrain doesn't queue another
        // drift mid-transition). Drains any queued genre request.
        const releaseMs = (60000 / bpm) * 4 * 18; // 18 bars in ms
        setTimeout(_releaseGenreLock, releaseMs);
      }
    },120); // 32 steps × 120ms = ~4s ramp
  } else {
    // No new style def → release immediately
    _releaseGenreLock();
  }

  // Apply reverb profile for new genre
  applyReverbForGenre(newStyle);
  updateRumbleGain(); // enable/disable rumble bus based on genre

  showLiveGenreTransition(oldStyle, newStyle);
}

function showLiveGenreTransition(fromStyle, toStyle){
  const display=document.getElementById('liveGenreDisplay');
  const name=document.getElementById('liveGenreName');
  const arrow=document.getElementById('liveGenreArrow');
  if(!display||!name) return;
  const setName = _currentLiveSet ? _currentLiveSet.name.toUpperCase() : '';
  name.textContent  = GENRE_LABELS[toStyle]||toStyle;
  arrow.textContent = setName;
  display.style.opacity='1';
  setTimeout(()=>{ display.style.opacity='0'; }, 3500);
}

function reOrchestrateTo(newStyle) {
  const arr = STYLES[newStyle]?.arrangement || [];
  const required = arr.filter(r => r._required);
  if (!required.length) return;

  // Find missing required soundType+variation pairs (variant-aware)
  const currentKeys = new Set(elements.map(e => `${e.soundType}_${e.variation??0}`));
  const missing = required.filter(r => !currentKeys.has(`${r.soundType}_${r.variation??0}`));

  // Find orphan elements (not in new genre, not rhythm/Sub)
  const newKeys = new Set(arr.map(r => `${r.soundType}_${r.variation??0}`));
  newKeys.add('Sub_0');
  const orphans = elements.filter(e =>
    !newKeys.has(`${e.soundType}_${e.variation??0}`) &&
    getInstrumentRole(e) !== 'rhythm' &&
    e.soundType !== 'Sub' && !e.muted
  );

  // Wave 1: fade 1 orphan + add 1 missing anchor (immediate after ramp)
  const victim1 = orphans[0];
  const recipe1 = missing[0];
  if (victim1) fadeOutAndRemove(victim1, 2.5);
  if (recipe1) setTimeout(() => spawnFromRecipe(recipe1, newStyle), victim1 ? 3000 : 500);

  // Wave 2: 16 bars later — fade 1 more orphan + add 1 more anchor if still needed
  const barsMs = (60000 / bpm) * 4 * 16; // 16 bars in ms
  setTimeout(() => {
    if (!elements.some(e => e.soundType === newStyle || currentStyle === newStyle)) return;
    const currentKeys2 = new Set(elements.map(e => `${e.soundType}_${e.variation??0}`));
    const stillMissing = required.filter(r => !currentKeys2.has(`${r.soundType}_${r.variation??0}`));
    const newKeys2 = new Set(arr.map(r => `${r.soundType}_${r.variation??0}`));
    newKeys2.add('Sub_0');
    const orphans2 = elements.filter(e =>
      !newKeys2.has(`${e.soundType}_${e.variation??0}`) &&
      getInstrumentRole(e) !== 'rhythm' &&
      e.soundType !== 'Sub' && !e.muted && !e._fading
    );
    if (orphans2.length > 0) fadeOutAndRemove(orphans2[0], 2.5);
    if (stillMissing.length > 0) {
      setTimeout(() => spawnFromRecipe(stillMissing[0], newStyle), orphans2.length > 0 ? 3000 : 500);
    }
  }, barsMs);
}

function fadeOutAndRemove(el, fadeSecs) {
  if (!el || el._fading) return;
  el._fading = true;
  const startVol = el.volume ?? 0.5;
  const steps = Math.round(fadeSecs * 20);
  let step = 0;
  const fadeOut = setInterval(() => {
    el.volume = startVol * (1 - (++step / steps));
    if (step >= steps) {
      clearInterval(fadeOut);
      stopDrone(el);
      elements = elements.filter(e => e.id !== el.id);
      renderElList();
    }
  }, 50);
}

function spawnFromRecipe(recipe, style) {
  // Check by soundType+variation — don't skip if same type but different variation
  if (!recipe || elements.some(e => e.soundType === recipe.soundType && (e.variation??0) === (recipe.variation??0))) return;
  const root  = document.getElementById('keySelect')?.value  || 'A';
  const scale = document.getElementById('scaleSelect')?.value || 'Minor';
  const chordRoot = getChordRootDeg();
  const newId = Math.max(0, ...elements.map(e => e.id)) + 1;
  const el = {
    id: newId,
    soundType: recipe.soundType,
    variation: recipe.variation ?? 0,
    note: getHarmonicNote(root, scale, (recipe.deg??0) + chordRoot, recipe.oct??3),
    volume: 0, // starts silent, fades in
    pan: recipe.pan ?? 0,
    visualType: recipe.vtype || 'blob',
    x: recipe.xPos ?? 0.5, y: recipe.yPos ?? 0.5,
    radius: recipe.radius ?? 0.22,
    color: '#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0'),
    shape: {...(recipe.shape||{x:0.5,y:0.5})},
    tone:  {...(recipe.tone ||{x:0.5,y:0.2})},
    space: {...(recipe.space||{x:0.4,y:0.5})},
    muted: false, soloed: false,
    _roleDeg: recipe.deg??0, _roleOct: recipe.oct??3,
    _droneNode: null, _pulse:0, _flashPulse:0,
  };
  applyRoleAndTriggerMode(el);
  applyPreset(el); // sets synthesis defaults — must run before recipe overrides
  // Restore recipe's curated shape/tone/space AFTER applyPreset (which may overwrite them)
  if (recipe.shape) el.shape = {...recipe.shape};
  if (recipe.tone)  el.tone  = {...recipe.tone};
  if (recipe.space) el.space = {...recipe.space};
  elements.push(el);
  maybeStartDrone(el);
  // Fade in over 2.5s
  const targetVol = recipe.vol ?? 0.55;
  const steps = 50; let step = 0;
  const fadeIn = setInterval(() => {
    el.volume = targetVol * (++step / steps);
    if (step >= steps) { el.volume = targetVol; clearInterval(fadeIn); }
  }, 50);
  renderElList();
}

function scheduleLiveDrift(){
  if(!_liveMode) return;
  // Drift every 96–128 bars — random within that range
  const grammar=getGrammar();
  const driftBars=96+Math.floor(Math.random()*32);
  const msPerBar=(60000/bpm)*4;
  _liveDriftTimer=setTimeout(()=>{
    if(!_liveMode) return;
    const neighbors=GENRE_GRAPH[currentStyle]||GENRE_GRAPH.deephouse;
    const next=neighbors[Math.floor(Math.random()*neighbors.length)];
    softDriftToGenre(next);
    scheduleLiveDrift(); // schedule next drift
  }, driftBars*msPerBar);
}

let _morphing = false;

function morphToGenre(newStyleKey, buildFn){
  const FADE_OUT = 1200; // ms — long enough to hear it breathe out
  const FADE_IN  = 80;   // ms delay before new elements start (tiny gap feels intentional)

  // If already morphing, finish immediately and start fresh
  if(_morphing){
    stopAllDrones();
    elements=[];
    _morphing=false;
  }
  _morphing=true;
  conductorLocks.genre = true; // block DJBrain drift + structural changes during morph
  recordConductorDecision('GENRE_CHANGE', {to: newStyleKey, via: 'morph'});

  // 1. Fade out current elements gracefully
  elements.forEach(el=>{
    if(el._droneNode&&audioCtx){
      const g=el._droneNode.gainNode;
      if(g) g.gain.setTargetAtTime(0, audioCtx.currentTime, FADE_OUT*0.0004);
    }
  });

  // 2. After fade, swap everything
  setTimeout(()=>{
    stopAllDrones();
    elements=[];
    activeId=null;
    closeInspector();

    // Apply new genre
    currentStyle=newStyleKey;
    updateEnergyCycleForGenre(currentStyle);
    updateAmbientSub(); // B3: start/stop ambient sub based on new genre
    _lastDropBar=-999; // reset recovery on genre change
    applyReverbForGenre(currentStyle);
    resetBassPhrase();
    pickProgressionForStyle(currentStyle);

    // Update BPM
    const styleDef=STYLES[currentStyle];
    if(styleDef){
      bpm=pickBpm(styleDef);
      document.getElementById('bpmVal').textContent=Math.round(bpm);
      if(beatEnabled){ stopBeat(); startBeat(); }
      startBpmDrift(bpm, styleDef.bpmRange);
    }

    // Build new elements (caller provides this)
    buildFn();

    // 3. Fade new elements in — start silent then ramp up
    // Enforce single Growl before starting any audio
    let growlStarted=false;
    elements=elements.filter(el=>{
      if(el.soundType==='Acid'){
        if(growlStarted){ stopDrone(el); return false; }
        growlStarted=true;
      }
      return true;
    });
    if(soundEnabled){
      setTimeout(()=>{
        elements.forEach(el=>{
          maybeStartDrone(el);
          // Start gain from 0 and ramp up — faster time constant = music rolls in crisply
          setTimeout(()=>{
            if(el._droneNode&&audioCtx){
              const g=el._droneNode.gainNode;
              if(g){
                const target=g.gain.value;
                g.gain.setValueAtTime(0, audioCtx.currentTime);
                g.gain.setTargetAtTime(target, audioCtx.currentTime, 0.15);
              }
            }
          }, 20);
        });
        _morphing=false;
        _releaseGenreLock();
      }, FADE_IN);
    } else {
      _morphing=false;
      _releaseGenreLock();
    }

    renderElList();
    buildDrumGrid();
    renderVibes();
  }, FADE_OUT);
}

let generateInterval=null;

function contextFill(){
  // Use the curated STYLES.arrangement table — it has proper per-role scale degrees,
  // octaves, volumes, pans, and shape/tone/space presets. Walk it in priority order
  // (Sub first, then mids, then leads, then color, then noise) and add what's missing.
  // Each new element is tagged with _roleDeg/_roleOct so it follows chord changes.
  if(!_currentProgression) pickProgressionForStyle(currentStyle);
  const root      = document.getElementById('keySelect').value || 'A';
  const scale     = document.getElementById('scaleSelect').value || 'Minor';
  const style     = STYLES[currentStyle] || STYLES.deephouse;
  const arr       = style.arrangement || [];
  const chordRoot = getChordRootDeg();
  const isMobile  = window.innerWidth <= 600;
  const targetCount = isMobile ? 5 : 7;
  const added = [];

  // Priority: lower = added first. Sub is mandatory; harmonic mids next; leads, color, atonal.
  const PRIORITY = {
    Sub:0,
    Pad:1, WTPad:1, Drone:1, Chord:1,
    Pulse:2, Acid:2, Arp:2, FMStab:2, FM3:2, EP:2, Pluck:2,
    Echo:3, Vocal:3, Phys:3, Ring:3, Conga:3, Shimmer:3,
    Noise:4, Laser:4, SFX:4,
  };

  // Tag any existing untagged elements so they participate in chord progression
  elements.forEach(ensureRoleTag);

  // Identify which roles are missing — match on soundType+variation so different variants
  // of the same type don't deduplicate (e.g. WTPad var 0 and WTPad var 2 in dubtechno).
  const existingKey = new Set(elements.map(e => `${e.soundType}_${e.variation??0}`));
  const missing = arr.filter(r => !existingKey.has(`${r.soundType}_${r.variation??0}`));
  // Sort by combined PRIORITY (60%) + inverse volume (40%) — so within the same
  // priority class, louder voices get smaller indices = larger visual slots.
  // A whisper-quiet WTPad no longer claims the second-biggest slot just because
  // it shares priority with a loud Pulse.
  missing.sort((a,b) => {
    const pa = (PRIORITY[a.soundType]??5) * 100;
    const pb = (PRIORITY[b.soundType]??5) * 100;
    // Volume penalty: quieter → larger penalty → later in sort → smaller visual slot.
    const va = (1 - Math.min(1, Math.max(0, a.vol ?? 0.5))) * 40;
    const vb = (1 - Math.min(1, Math.max(0, b.vol ?? 0.5))) * 40;
    return (pa + va) - (pb + vb);
  });
  // Wire role balance into contextFill — same logic as Generate/Live scene building
  balanceRolesForGenre(missing, currentStyle);

  // Always ensure a Sub is present (genre-defining), even if existing arrangement misses it
  const hasSub = elements.some(e => e.soundType === 'Sub');
  if(!hasSub && !missing.some(r => r.soundType === 'Sub')){
    // Synthesize a Sub role from common defaults
    missing.unshift({
      soundType:'Sub', variation:0, oct:1, deg:0, vol:0.90, pan:0,
      vtype:'blob', xPos:0.5, yPos:0.78, radius:0.50,
      shape:{x:0.85,y:0.9}, tone:{x:0.25,y:0.05}, space:{x:0.3,y:0.5},
    });
  }

  // Track zone occupancy so we don't crowd the mid-range with masking voices
  const zoneCount = countZones();

  // Pre-count how many new elements we'll actually add so the composition
  // template can distribute positions correctly across them.
  // Uses findZoneFor so overflow voices that get octave-shifted still count.
  let plannedCount = 0;
  const previewZone = {...zoneCount};
  for(const role of missing){
    if(elements.length + plannedCount >= targetCount) break;
    const slot = findZoneFor(role.oct ?? 3, previewZone);
    if(!slot) continue; // no zone has room anywhere — must drop
    previewZone[slot.zone]++; plannedCount++;
  }
  pickCompositionTemplate();

  for(const role of missing){
    if(elements.length >= targetCount) break;
    // Zone budget: find a zone with room (preferred octave first, then ±1, ±2).
    // Skip only if no zone has any room at all.
    const slot = findZoneFor(role.oct ?? 3, zoneCount);
    if(!slot) continue;
    // Use role's nominal position to choose visualType (genre-aware), but the
    // composition template will override x/y/radius below for Suprematist layout.
    const vt = role.vtype || pickVisualType(role.soundType, role.xPos, role.yPos);
    const el = createElement(vt, role.xPos, role.yPos, nextColor());
    el.soundType = role.soundType;
    el.variation = role.variation ?? 0;
    applyPreset(el);
    // Override preset with role's curated shape/tone/space (tiny ±0.03 jitter)
    if(role.shape) el.shape = {x:Math.max(0,Math.min(1,role.shape.x+(Math.random()-0.5)*0.06)),y:Math.max(0,Math.min(1,role.shape.y+(Math.random()-0.5)*0.06))};
    if(role.tone)  el.tone  = {x:Math.max(0,Math.min(1,role.tone.x +(Math.random()-0.5)*0.06)),y:Math.max(0,Math.min(1,role.tone.y +(Math.random()-0.5)*0.06))};
    if(role.space) el.space = {x:Math.max(0,Math.min(1,role.space.x+(Math.random()-0.5)*0.06)),y:Math.max(0,Math.min(1,role.space.y+(Math.random()-0.5)*0.06))};
    // Chord-aware note: role.deg is the role's harmonic function relative to chord root.
    // Use slot.oct (possibly shifted from role.oct) so the actual octave matches zone usage.
    el._roleDeg = role.deg ?? 0;
    el._roleOct = slot.oct;
    el.note     = getHarmonicNote(root, scale, el._roleDeg + chordRoot, el._roleOct);
    // Use curated mix values directly — tiny ±3% jitter only, do NOT randomize
    el.volume = (role.vol ?? 0.5) * (0.97 + Math.random()*0.06);
    el.pan    = (role.pan ?? 0)  + (Math.random()-0.5)*0.06;
    el.radius = (role.radius ?? 0.25) * (0.95 + Math.random()*0.10);
    applyRoleAndTriggerMode(el);
    // Initial line geometry (overridden by applyCompositionToElement for diagonals)
    el.x1 = el.x-0.15; el.y1 = el.y; el.x2 = el.x+0.15; el.y2 = el.y;
    el.pos = el.x; el.width = 0.12 + Math.random()*0.20;
    el.angle = (Math.random()-0.5)*Math.PI; el.coneWidth = 0.15 + Math.random()*0.4;
    // Suprematist composition: override position/radius/rotation for this scene's template
    applyCompositionToElement(el, plannedCount);
    elements.push(el);
    zoneCount[slot.zone]++;
    added.push(role.soundType);
  }

  nextId = elements.reduce((m,e) => Math.max(m, e.id+1), 1);
  renderElList(); buildDrumGrid();
  if(soundEnabled) setTimeout(()=>elements.forEach(el=>{if(!el._droneNode)maybeStartDrone(el);}),80);
  if(added.length) showToast('Added: '+added.join(', '));
  else showToast('Arrangement complete');
}

function updateGenerateCapsuleBtn(){
  const cmd = document.getElementById('cmdGenerate');
  if(!cmd) return;
  if(generateActive){
    cmd.textContent = '⏹ Evolving...';
    cmd.classList.add('evolving');
  } else {
    cmd.textContent = '⊕ Generate';
    cmd.classList.remove('evolving');
  }
}

function updateSwStatus(){
  const label = document.getElementById('swStatusLabel');
  if(!label) return;
  // Read from the actual select values — currentStyle may lag on rapid changes
  const styleVal = document.getElementById('styleSelect')?.value || currentStyle;
  const genre  = GENRE_DISPLAY_NAMES[styleVal] || styleVal;
  const bpm    = Math.round(typeof window.bpm !== 'undefined' ? window.bpm : +document.getElementById('bpmVal')?.textContent || 126);
  const key    = document.getElementById('keySelect')?.value || 'A';
  const scale  = document.getElementById('scaleSelect')?.value || 'Minor';
  label.textContent = `${genre} · ${bpm} BPM · ${key} ${scale}`;
}

