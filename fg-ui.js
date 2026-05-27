// fg-ui.js — All UI, sidebar, inspector, drum grid, sound library,
// timeline, mobile panels, vibes, first-run choreography.
// Also contains instrument/scheduling utilities: applyPreset, getScaleNotes,
// tickArp, tickConversation, evolveOnce, secondary perc patterns.
// Depends on: all other fg-*.js modules

function applyPreset(el){
  const st=SOUND_TYPES[el.soundType];
  if(!st) return;
  const preset=st.vars[el.variation||0];
  if(!preset) return;
  if(preset.shape) el.shape={...preset.shape};
  if(preset.tone)  el.tone={...preset.tone};
  if(preset.space) el.space={...preset.space};
}
function getHarmonicNote(root, scale, degree, octave){
  const notes=getScaleNotes(root,scale,[octave]);
  return notes[degree%notes.length]?.name || root+octave;
}
function smartRandomizeElement(el){
  const root=document.getElementById('keySelect').value||'A';
  const scale=document.getElementById('scaleSelect').value||'Minor';
  const matchingRoles=ARRANGEMENT_ROLES.filter(r=>r.soundType===el.soundType);
  const role=matchingRoles[Math.floor(Math.random()*matchingRoles.length)]||ARRANGEMENT_ROLES[0];
  el.note=getHarmonicNote(root,scale,role.scaleDegree,role.octave+Math.floor(Math.random()*2));
  el.variation=Math.floor(Math.random()*4);
  applyPreset(el);
  el.shape.x=Math.max(0,Math.min(1,el.shape.x+(Math.random()-0.5)*0.15));
  el.shape.y=Math.max(0,Math.min(1,el.shape.y+(Math.random()-0.5)*0.15));
  el.tone.x=Math.max(0,Math.min(1,el.tone.x+(Math.random()-0.5)*0.12));
  el.tone.y=Math.max(0,Math.min(1,el.tone.y+(Math.random()-0.5)*0.12));
  applyRoleAndTriggerMode(el);
}
function getScaleNotes(root, scale, octaves=[2,3,4,5]) {
  const rootIdx = NOTE_NAMES.indexOf(root);
  const intervals = SCALE_INTERVALS[scale] || SCALE_INTERVALS['Major'];
  const notes = [];
  octaves.forEach(oct => {
    intervals.forEach(iv => {
      const semitone = rootIdx + iv;
      const noteIdx = semitone % 12;
      // Correctly carry the octave when rootIdx+iv wraps past 12
      const actualOct = oct + Math.floor(semitone / 12);
      const midi = (actualOct + 1) * 12 + noteIdx;
      notes.push({ name: NOTE_NAMES[noteIdx] + actualOct, midi });
    });
  });
  // Sort by midi so contour offsets always walk the scale in pitch order
  notes.sort((a, b) => a.midi - b.midi);
  return notes;
}
function midiToFreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
// Compositional rules per genre — drives form cycle, mutation rate, silence,
// element constraints, and build-arc transposition behaviour.
// ─── CHORD PROGRESSION ENGINE ────────────────────────────────────────────────
// Per-genre diatonic chord progressions as scale-degree offsets. Each entry
// in a progression is the new chord root, expressed as a scale degree (0=tonic,
// 2=mediant, 4=dominant, 5=submediant, etc). The progression cycles every
// `cycleBars`; on each change, every harmonic element retransposes so that
// its role.deg shifts by the new chord root. This is what gives the music
// harmonic motion instead of sitting on the tonic forever.


// Sound types that follow the chord progression. Noise/Conga/Laser are atonal/percussive.




// Ensure an element has _roleDeg / _roleOct tags so it can follow the progression.
// Inferred from STYLES.arrangement if missing; falls back to root.

// Per-genre: should bass (Sub/Acid) follow chord changes or stay on root?



// ─── DENSITY ENVELOPE ────────────────────────────────────────────────────────
// Form-cycle arc: thin intro, full body, breakdown, restore. Mutes "color"
// elements (Echo, Pluck, Conga, etc) at phase points to give Generate-mode
// music intro/build/drop dynamics it otherwise lacks.



// ─── FORM-CYCLE TEXTURE ENVELOPE ─────────────────────────────────────────────
// Slow modulation of pad filter cutoffs and reverb send across the formCycle.
// Intro: warm (closed filter, slight ambience). Peak: open & dry. Breakdown:
// dark and washy. Build-back: filter sweep up. The subtle automation that
// makes a track feel produced rather than looped.

// ── REVERB THROW ─────────────────────────────────────────────────────────────
// A brief moment where reverb becomes compositional — one element's send spikes
// dramatically then fades back. Like Mutualism's reverb-as-motif technique.
// maxBoost: 0→1, how far to push (0.7 = dramatic, 0.4 = subtle)
// decaySecs: how long the tail hangs before returning

// Pick a good candidate element for a throw — prefers Vocal, Chord, WTPad, Drone



// ─── SUPREMATIST COMPOSITION ENGINE ──────────────────────────────────────────
// Layout templates inspired by Malevich's Suprematist paintings. Each template
// is a function (idx, total) → {x, y, radiusScale} that assigns a position to
// the idx-th element being placed in a scene. Templates emphasize diagonal
// dynamism, off-center mass, size hierarchy, and negative space — the qualities
// that make Suprematist compositions feel composed rather than arranged.
//
// idx 0 is the anchor (typically Sub/bass). Subsequent elements distribute
// according to the template's geometric logic. radiusScale multiplies the
// element's base radius for the hierarchy of forms — Malevich's compositions
// always have one or two dominant forms balanced by smaller satellites.



// Drift all current elements to a fresh Suprematist layout.
// Called on chord changes so the visual composition shifts with the music.
// Elements that are being touched or floating are left alone.

// Apply the current template to a newly-created element. Pass the count of
// elements that will be in the final scene (for normalization). Also overrides
// line-element geometry (x1/y1/x2/y2) so neon/beam/fold rotate along the
// template's compositional axis.

// ─── FREQUENCY ZONE BUDGETING ────────────────────────────────────────────────
// Spectral separation: cap how many voices can sit in each octave-zone. Without
// this the mid-range gets crowded (4 voices at oct 3 mask each other).

// ─── CHORD VOICING ENGINE ────────────────────────────────────────────────────
// Per-genre semitone offset arrays for Pulse, EP, and Drone chord stabs.
// [0] = root always present. Additional values = intervals above root in semitones.
// Multiple voicings per genre/type — system picks one randomly each note event.

// Returns an array of semitone offsets for the current genre + sound type.
// Always picks from the genre's voicing list; falls back to [0,7] if unknown.

// Convert semitone offsets to frequency multipliers from a root freq


// Sub stops being a continuous drone — it becomes a rhythmic voice with a
// genre-specific 16-step trigger pattern. 1 = hit, 0 = rest.

// Live phrase state — mutates gradually away from the BASS_PHRASES base
let _bassPhrase = null;
let _bassPhraseMutCount = 0; // steps that differ from base



// Chord-position bass variation — each chord in the progression gets a subtly
// different bass pattern. Tonic (chord 0) gets the full active phrase; the
// "weaker" chords (5,2) drop a hit for lighter feel; the leading chord (4)
// adds a pickup hit on step 15 to push back to the tonic.


// Mutate 1 non-downbeat step — caps drift at 3 steps from base


// ACID_PHRASES — separate from bass. Acid is "gesture": busier, accented, filter motion.
// Sub is "foundation": sparse, stable, defines the groove. These should never be mirrors.

// Acid phrase state — independent from bass phrase, owns its own mutation
let _acidPhrase = null;
let _acidPhraseMutCount = 0;



// Mutate acid phrase independently — allows more steps than bass (acid can be busier)

// ─── MOTIF MEMORY ─────────────────────────────────────────────────────────────
// Snapshot of the musical state at Generate-time. The composition engine
// mutates away from this, then returnToMainMotif() pulls it back.



// ─── SILENCE ENGINE ──────────────────────────────────────────────────────────
// Intentional mute moments — makes the music breathe.
let _silencedHats=false, _silencedKick=false, _silenceSavedHats=null, _silenceSavedKick=null;



// Faint floating dust particles — like light through fog in a club.
// Very subtle: 24 particles, barely visible, respond to kick.



// ─── LIVE TOUCH LABELS ───────────────────────────────────────────────────────



// ─── REVERB PROFILES ─────────────────────────────────────────────────────────
// ─── RUMBLE BUS ───────────────────────────────────────────────────────────────
// Basement/industrial kick rumble: kick body → short dark reverb → hard distortion
// → 180Hz LPF → sidechain gain (ducked by kick, swells between hits).
// Creates the rolling subterranean thunder that defines warehouse techno.
// Genre-gated: only active for techno/industrial styles.



// ─────────────────────────────────────────────────────────────────────────────
// ─── HAAS STEREO WIDENER ──────────────────────────────────────────────────────
// Psychoacoustic width via the Haas effect: duplicate signal, pan hard L/R,
// delay one side 10–22ms. Creates massive club-width without center buildup.
// Returns an output gain node; caller connects their source into haas.input.

// ─── LADDER FILTER (Pure Web Audio — no AudioWorklet needed) ─────────────────
// 4-pole Moog-style ladder filter using cascaded biquads + resonance feedback
// Achieves true 24dB/oct slope and self-oscillation without any worklet/blob/CSP issues
//
// Architecture:
//   input → [stage1] → [stage2] → [stage3] → [stage4] → output
//                ↑___________________________________|
//                         resonance feedback
//
// Each stage is a 1-pole lowpass (biquad shelving approximation).
// Feedback from output back to input creates the resonance peak and self-oscillation.
// Nonlinearity (tanh-like) is applied via a WaveShaper in the feedback path.

// ─── MOBILE AUDIO OPTIMIZATION ───────────────────────────────────────────────
// iPhone speakers roll off below ~150Hz and have limited headroom above 3kHz.
// We compensate with a 3-band mobile EQ inserted before the master compressor.
// Haptics: navigator.vibrate() for Android; iOS uses a sub-bass pulse trick.


// Sub-bass haptic pulse for iOS — very short 40Hz sine burst at kick time
// iOS doesn't support navigator.vibrate() but a loud sub burst can trigger
// the Taptic Engine if device volume is above 50%.

// ─── AUDIO NODE GC SWEEP ─────────────────────────────────────────────────────
// Safety net: suspends and resumes AudioContext every 8 minutes to force
// the browser to GC any leaked nodes. Inaudible on iOS/Safari, imperceptible
// on Chrome (suspension is < 50ms). Resets the accumulation clock.

function pickBpm(style){
  const r=style?.bpmRange;
  if(!r) return style?.bpm||126;
  return r[0]+Math.floor(Math.random()*(r[1]-r[0]+1));
}
// B3: Genre-aware stereo spread — ambient/electronica genres get wider field
function getElPan(el){ const spread=GENRE_PAN_SPREAD[currentStyle]??1.5; return Math.max(-1,Math.min(1,(el.x-0.5)*spread+(el.pan||0))); }
// Spatial depth: Y position + radius → filter darkness, reverb wetness, gain distance attenuation
// Y=0 (top) = close/bright/dry  |  Y=1 (bottom) = distant/dark/wet
// Large radius = slightly more presence. Returns multipliers applied on top of XY-pad values.
function connectOutput(nodeGroup, el){
  const {gainNode,pannerNode}=nodeGroup;
  const px=(el.space&&el.space.x!=null?el.space.x:0.35);
  const py=(el.space&&el.space.y!=null?el.space.y:0.4);
  const chorusWet=audioCtx.createGain();
  chorusWet.gain.value=0.15+py*0.35;
  const chorusDry=audioCtx.createGain();
  chorusDry.gain.value=1;
  const dL=audioCtx.createDelay(0.05); dL.delayTime.value=0.007+py*0.005;
  const dR=audioCtx.createDelay(0.05); dR.delayTime.value=0.012+py*0.006;
  const chLfo=audioCtx.createOscillator(); chLfo.frequency.value=0.4+py*0.6;
  const chLfoG=audioCtx.createGain(); chLfoG.gain.value=0.003;
  chLfo.connect(chLfoG); chLfoG.connect(dL.delayTime); chLfoG.connect(dR.delayTime);
  chLfo.start(audioCtx.currentTime);
  gainNode.connect(dL); gainNode.connect(dR);
  dL.connect(chorusWet); dR.connect(chorusWet);
  const revSend=audioCtx.createGain(); revSend.gain.value=px*0.5;
  gainNode.connect(revSend);
  if(reverbNode) revSend.connect(reverbNode);
  const droneModel=getSoundModel(el.soundType||'Drone');
  const feedbackOverride=droneModel.delayFeedback;
  const stepSec=(60/bpm)/4;
  const delayNode=audioCtx.createDelay(2.0);
  const delayFeed=audioCtx.createGain();
  const delayWet=audioCtx.createGain();
  delayNode.delayTime.value=feedbackOverride?stepSec*3:stepSec*2;
  delayFeed.gain.value=feedbackOverride??0.28;
  delayWet.gain.value=feedbackOverride?Math.min(0.85,px*0.9+0.25):px*0.35;
  gainNode.connect(delayNode);
  delayNode.connect(delayFeed); delayFeed.connect(delayNode);
  delayNode.connect(delayWet);
  gainNode.connect(chorusDry);
  chorusDry.connect(pannerNode);
  chorusWet.connect(pannerNode);
  delayWet.connect(pannerNode);
  // Sub gets its own lightly-pumped bus so the bass stays solid between kicks.
  // Everything else goes through the heavy-pump bus for the "production" feel.
  const subBus = (el.soundType==='Sub') ? sidechainSub : sidechainGain;
  pannerNode.connect(subBus || sidechainGain || compressor);
  nodeGroup.revSend=revSend; nodeGroup.delayNode=delayNode;
  nodeGroup.delayWet=delayWet; nodeGroup.chLfo=chLfo;
  nodeGroup.chorusWet=chorusWet; nodeGroup.chorusDry=chorusDry;
}
// Per-genre sub bass profiles — wave, attack, saturation, filter character


// ── B3: AMBIENT SUB DRONE ─────────────────────────────────────────────────────
// A sustained sine sub sitting at the root note (~55–60Hz) that runs continuously
// in ambient/spaceship genres. Felt as pressure, not heard as a hit.
// Mutualism/Jellyfish reference: strong 32–64Hz foundation always present.




// --- ACID BASS SEQUENCER -----------------------------------------------------
// Replaces Growl. Sawtooth through a plain biquad + filter envelope per note.
// No ladder filter, no feedback path, no spike risk.
// v0: Short stab -- classic tight acid hit
// v1: Slide      -- pitch glide from prev note, longer decay
// v2: Wobble     -- slow LFO on filter, open and moody
// v3: Open       -- longer decay, brighter, more melodic
const _acidState = { lastFreq: null };


// --- 3-OPERATOR FM SYNTHESIS (DX7-style) ---
// v0: E.Piano  -- cascade mod2->mod1->carrier, ratio 1:14:1
// v1: Bell     -- parallel mods, inharmonic ratios
// v2: Metal Bass -- fork algorithm, sub-octave carrier
// v3: Reed     -- single mod high index, vocal character


// ─── PLUCK (Karplus-Strong) ───────────────────────────────────────────────────
// ─── PAD (Multi-osc evolving) ─────────────────────────────────────────────────
// ─── VOCAL (Formant synthesis) ────────────────────────────────────────────────
// --- WAVETABLE PAD (Juno-style warm analog pad) ---

// --- GRANULAR SHIMMER ---
// 12 overlapping grain oscillators scattered in pitch and time.
// Creates the air texture underneath everything -- the club shimmer.


// --- PHYSICAL MODELING -------------------------------------------------------
// Four resonator-based timbres using IIR comb filters + feedback.
// v0: Bowed String  -- sustained sawtooth through resonant comb, bow pressure = tone.y
// v1: Steel Drum    -- noise burst through tuned bandpass cluster, fast ring-off
// v2: Blown Pipe    -- noise + fundamental through waveguide-style feedback, breathy
// v3: Wood Body     -- click exciter through multi-mode resonator, woody thump

const FORMANTS={
  aah: [{f:800,Q:10},{f:1200,Q:12},{f:2800,Q:14}],
  ooh: [{f:300,Q:10},{f:870, Q:12},{f:2240,Q:14}],
  eeh: [{f:270,Q:10},{f:2300,Q:12},{f:3000,Q:14}],
  choir:[{f:600,Q:8}, {f:1050,Q:10},{f:2600,Q:12}],
};
function restartDrone(el){
  if(el.soundType==='Arp'||el.soundType==='EP'||el.soundType==='FMStab'||el.soundType==='Ring'||el.soundType==='Laser'||el.soundType==='Echo'||el.soundType==='Conga'){
    if(el.soundType==='Arp'){el._arpPattern=null;el._arpStep=0;el._arpStepCounter=0;}
    return;
  }
  if(el._droneNode){stopDrone(el,0.04);setTimeout(()=>startDrone(el),80);}
}
function retrigerDroneOnBeat(el){
  if(!audioCtx||el.muted) return;
  if(el.soundType==='Pulse'){
    schedulePulseOneShot(el, audioCtx.currentTime+0.005);
    el._pulse=0.9; el._flashPulse=0.7;
  } else if(el.soundType==='Ring'){
    scheduleRingOneShot(el, audioCtx.currentTime+0.005);
    el._pulse=0.7; el._flashPulse=0.5;
  } else if(el.soundType==='Laser'){
    scheduleLaserOneShot(el, audioCtx.currentTime+0.005);
    el._pulse=0.9; el._flashPulse=0.8;
  } else if(el.soundType==='Echo'){
    scheduleEchoNote(el, audioCtx.currentTime+0.005);
    el._pulse=0.8; el._flashPulse=0.6;
  } else if(el.soundType==='Conga'){
    scheduleCongaNote(el, audioCtx.currentTime+0.005);
    el._pulse=0.85; el._flashPulse=0.65;
  } else if(el.soundType==='SFX'){
    scheduleSFX(el, audioCtx.currentTime+0.005);
    el._pulse=0.9; el._flashPulse=0.8;
  } else if(el.soundType==='Sub'){
    startDrone(el);
  } else {
    el._pulse=0.8; el._flashPulse=0.5;
    updateDroneParams(el);
  }
}
// ─── ECHO (dub delay instrument) ─────────────────────────────────────────────
// A single note fired through a tempo-synced feedback delay.
// The echo IS the instrument — sparse notes that bloom into rhythmic space.

// ─── CONGA (pitched percussion) ───────────────────────────────────────────────
// Membrane percussion synthesis: noise burst + pitched sine body
// Tonal but percussive — bridges drums and harmony

// ─── CHORD (slowly evolving harmony drone) ───────────────────────────────────
// Sustained chord that slowly moves between voicings — the harmonic heartbeat.
// This is what makes the harmony feel alive rather than frozen.


// Deep resonant sweeps with high+low mutualism — jellyfish spaceship feeling.
// shape.x = sweep length, shape.y = depth of pitch
// tone.x = filter brightness, tone.y = resonance
// space.x = reverb send

// Named melodic shapes as scale-degree offset sequences.
// Each value = steps above the root index in the scale notes array.

// Genre → preferred contour names (85% of the time picks from here)

// Genre → rhythm patterns (step durations in 16th notes)
// More variety: straight, swung, syncopated, sparse, triplet-feel patterns

// Genre → octave range for arp notes [low, high]


function tickArp(el){
  if(!el._arpPattern?.length) buildArpPattern(el);
  // P1-D: if a new contour is pending, switch at the top of the loop (step 0) — no mid-loop click
  if(el._arpStep===0&&el._arpPendingPattern){
    buildArpPattern(el);
    el._arpPendingPattern=false;
  }
  const note=el._arpPattern[el._arpStep%el._arpPattern.length];
  const fire=el._arpStepCounter===0;
  // A2: rest step — skip firing but still advance
  const freq=fire&&!note.rest?midiToFreq(note.midi):null;
  const gate=note.gate??0.85;
  const vel=note.vel??1.0;
  const portamento=note.portamento??false;
  el._arpStepCounter++;
  if(el._arpStepCounter>=note.steps){
    el._arpStepCounter=0;
    el._arpStep=(el._arpStep+1)%el._arpPattern.length;
  }
  return freq?{freq,gate,vel,portamento}:null;
}
function startAllFree(){
  if(!soundEnabled) return;
  elements.forEach(el=>{if(el.syncMode==='free'&&!el._droneNode&&!el.muted)maybeStartDrone(el);});
}
// Per-drumStyle gain multipliers — each genre needs different drum prominence
// Italo/techno: punchy and present. Ambient/dub: soft, felt not heard.

// W7: Per-style drum room send levels (how much drum bleeds into the reverb)
// Kick is always near-dry — room is for clap/snare/perc/conga

// W8: Per-style drum tightness — scales decay of snare tail + perc ring
// 1.0 = normal, <1.0 = tighter, >1.0 = looser/more room


// W7: Update drum room send level when style changes

// ─── DRUM PROFILES ───────────────────────────────────────────────────────────
const CLAP_PROFILES={
  house:      {bursts:3,spacing:0.012,burstDecay:0.030,bpfFreq:1400,bpfQ:0.5,tailDecay:0.12,gain:0.50, bodyFreq:220,bodyDecay:0.055},
  techno:     {bursts:4,spacing:0.008,burstDecay:0.022,bpfFreq:1800,bpfQ:0.6,tailDecay:0.08,gain:0.55, bodyFreq:280,bodyDecay:0.040},
  dub:        {bursts:2,spacing:0.018,burstDecay:0.040,bpfFreq:1000,bpfQ:0.4,tailDecay:0.18,gain:0.42,bodyFreq:180,bodyDecay:0.10},
  dnb:        {bursts:3,spacing:0.008,burstDecay:0.020,bpfFreq:4500,bpfQ:1.5,tailDecay:0.08,gain:0.70,hpf:2500,bodyFreq:220,bodyDecay:0.05},
  trance:     {bursts:4,spacing:0.006,burstDecay:0.020,bpfFreq:2200,bpfQ:0.7,tailDecay:0.10,gain:0.52, bodyFreq:200,bodyDecay:0.045},
  hiphop:     {bursts:3,spacing:0.015,burstDecay:0.040,bpfFreq:900, bpfQ:0.4,tailDecay:0.22,gain:0.60, bodyFreq:160,bodyDecay:0.075},
  garage:     {bursts:3,spacing:0.007,burstDecay:0.020,bpfFreq:2000,bpfQ:0.6,tailDecay:0.07,gain:0.55, bodyFreq:260,bodyDecay:0.035},
  ambient:    {bursts:2,spacing:0.022,burstDecay:0.050,bpfFreq:800, bpfQ:0.3,tailDecay:0.28,gain:0.38, bodyFreq:120,bodyDecay:0.090},
  hardcore:   {bursts:2,spacing:0.006,burstDecay:0.014,bpfFreq:2200,bpfQ:1.2,tailDecay:0.06,gain:0.80,distort:true, bodyFreq:320,bodyDecay:0.025},
  hardtechno: {bursts:2,spacing:0.008,burstDecay:0.018,bpfFreq:1600,bpfQ:0.8,tailDecay:0.08,gain:0.72,distort:true,bodyFreq:200,bodyDecay:0.06},
  italo:      {bursts:3,spacing:0.010,burstDecay:0.025,bpfFreq:1600,bpfQ:0.5,tailDecay:0.06,gain:0.52, bodyFreq:180,bodyDecay:0.060},
  electronica:{bursts:2,spacing:0.015,burstDecay:0.035,bpfFreq:1200,bpfQ:0.4,tailDecay:0.16,gain:0.44, bodyFreq:150,bodyDecay:0.065},
};
const HIHAT_PROFILES={
  house:      {f1:317,f2:438,metalGain:0.18,noiseHpf:6000, noiseGain:0.22,closedDecay:0.035,openDecay:0.13, clickGain:0.30,clickDecay:0.010,clickHpf:5000, metalRatios:[1, 1.483, 1.932, 2.546, 3.014, 4.011]},
  techno:     {f1:350,f2:500,metalGain:0.20,noiseHpf:7000, noiseGain:0.20,closedDecay:0.025,openDecay:0.10, clickGain:0.45,clickDecay:0.008,clickHpf:6000, metalRatios:[1, 1.483, 1.932, 2.546, 3.014, 4.011]},
  dub:        {f1:270,f2:380,metalGain:0.12,noiseHpf:4500, noiseGain:0.18,closedDecay:0.055,openDecay:0.38, clickGain:0.15,clickDecay:0.018,clickHpf:3500, metalRatios:[1, 1.52,  2.10,  2.78,  3.22,  4.35]},
  dnb:        {f1:420,f2:580,metalGain:0.16,noiseHpf:9000, noiseGain:0.20,closedDecay:0.018,openDecay:0.09, clickGain:0.55,clickDecay:0.006,clickHpf:8000, metalRatios:[1, 1.34,  1.68,  2.28,  2.85,  3.55]},
  trance:     {f1:380,f2:520,metalGain:0.22,noiseHpf:8000, noiseGain:0.18,closedDecay:0.022,openDecay:0.08, clickGain:0.40,clickDecay:0.007,clickHpf:7000, metalRatios:[1, 1.483, 1.932, 2.546, 3.014, 4.011]},
  hiphop:     {f1:280,f2:400,metalGain:0.14,noiseHpf:5500, noiseGain:0.20,closedDecay:0.048,openDecay:0.16, clickGain:0.25,clickDecay:0.014,clickHpf:4000, metalRatios:[1, 1.50,  1.95,  2.60,  3.10,  3.90]},
  garage:     {f1:300,f2:420,metalGain:0.16,noiseHpf:7000, noiseGain:0.22,closedDecay:0.030,openDecay:0.11, clickGain:0.50,clickDecay:0.007,clickHpf:6500, metalRatios:[1, 1.483, 1.932, 2.546, 3.014, 4.011]},
  ambient:    {f1:250,f2:350,metalGain:0.08,noiseHpf:4500, noiseGain:0.14,closedDecay:0.080,openDecay:0.28, clickGain:0.08,clickDecay:0.025,clickHpf:3000, metalRatios:[1, 1.58,  2.18,  2.90,  3.45,  4.60]},
  hardcore:   {f1:380,f2:550,metalGain:0.30,noiseHpf:7000, noiseGain:0.22,closedDecay:0.025,openDecay:0.08, clickGain:0.60,clickDecay:0.005,clickHpf:8000, metalRatios:[1, 1.28,  1.55,  2.05,  2.68,  3.28]},
  hardtechno: {f1:320,f2:480,metalGain:0.22,noiseHpf:6000, noiseGain:0.20,closedDecay:0.030,openDecay:0.12, clickGain:0.50,clickDecay:0.006,clickHpf:7000, metalRatios:[1, 1.32,  1.62,  2.15,  2.75,  3.40]},
  italo:      {f1:340,f2:470,metalGain:0.20,noiseHpf:7500, noiseGain:0.20,closedDecay:0.028,openDecay:0.10, clickGain:0.35,clickDecay:0.009,clickHpf:6000, metalRatios:[1, 1.483, 1.932, 2.546, 3.014, 4.011]},
  electronica:{f1:280,f2:390,metalGain:0.12,noiseHpf:5000, noiseGain:0.20,closedDecay:0.045,openDecay:0.18, clickGain:0.20,clickDecay:0.016,clickHpf:4500, metalRatios:[1, 1.45,  2.05,  2.72,  3.18,  4.25]},
};
const PERC_PROFILES={
  house:      {f1:800, f2:300, decay:0.08, wave:'triangle',gain:0.30,noiseMix:0.12},
  techno:     {f1:900, f2:380, decay:0.07, wave:'triangle',gain:0.40,hpf:800,noiseMix:0.28,distort:false},
  dub:        {f1:400, f2:180, decay:0.10, wave:'sine',    gain:0.35,noiseMix:0.08},
  dnb:        {f1:1500,f2:600, decay:0.03, wave:'square',  gain:0.40,noiseMix:0.30},
  trance:     {f1:2500,f2:2200,decay:0.02, wave:'sine',    gain:0.28,noiseMix:0.10},
  hiphop:     {f1:600, f2:250, decay:0.07, wave:'triangle',gain:0.40,noiseMix:0.15},
  garage:     {f1:1000,f2:400, decay:0.05, wave:'square',  gain:0.32,hpf:1500,noiseMix:0.20},
  ambient:    {f1:400, f2:200, decay:0.12, wave:'sine',    gain:0.22},
  hardcore:   {f1:1800,f2:600, decay:0.05, wave:'noise',   gain:0.50,distort:true},
  hardtechno: {f1:900, f2:320, decay:0.08, wave:'triangle',gain:0.55,distort:true,noiseMix:0.22},
  italo:      {f1:480, f2:720, decay:0.10, wave:'triangle', gain:0.42, twoTone:true, noiseMix:0.18, detune:3},
  electronica:{f1:3000,f2:1500,decay:0.015,wave:'sine',    gain:0.28},
};


// ─── DRUM KIT PROFILES (genre-level) ─────────────────────────────────────────
// These override specific timbre params from KICK_PROFILES/CLAP_PROFILES/HIHAT_PROFILES.
// Multiple genres can share a drum style (e.g. deephouse + techhouse both use 'house')
// but kit profiles give each genre its own sonic personality.
//
// kickBodyEnd: lower = deeper. kickDecay: longer = more tail.
// kickSoftness: 0=hard/punchy, 1=soft/warm (scales punchGain and clickGain).
// clapRoomMix: extra reverb on clap (0–1 on top of base room send).
// hatBrightness: 0=dark, 1=bright (scales noiseHpf and metalGain).
// subRoomBleed: how much Sub bass bleeds into reverb.
//

// Merge genre kit profile into base drum style profile at runtime
function getKickProfile(){
  const base = Object.assign({}, KICK_PROFILES[activeDrumStyle] || KICK_PROFILES.house);
  const kit = DRUM_KIT_PROFILES[currentStyle];
  if(!kit) return base;
  // Apply genre overrides
  if(kit.kickBodyEnd !== undefined) base.bodyEnd = kit.kickBodyEnd;
  if(kit.kickDecay   !== undefined) base.bodyDecay = kit.kickDecay;
  if(kit.kickSoftness !== undefined){
    const soft = kit.kickSoftness; // 0=hard, 1=soft
    base.punchGain  *= (1 - soft * 0.5);  // reduce punch on soft kicks
    base.clickGain  *= (1 - soft * 0.6);  // reduce click
    base.bodyGain   *= (1 + soft * 0.15); // slightly warmer body
  }
  return base;
}

function getClapProfile(){
  const base = Object.assign({}, CLAP_PROFILES[activeDrumStyle] || CLAP_PROFILES.house);
  const kit = DRUM_KIT_PROFILES[currentStyle];
  if(!kit || kit.clapRoomMix === undefined) return base;
  // Genre-level room mix stored for use in scheduleClap
  base._genreRoomMix = kit.clapRoomMix;
  return base;
}

function getHihatProfile(){
  const base = Object.assign({}, HIHAT_PROFILES[activeDrumStyle] || HIHAT_PROFILES.house);
  const kit = DRUM_KIT_PROFILES[currentStyle];
  if(!kit || kit.hatBrightness === undefined) return base;
  const bright = kit.hatBrightness; // 0=dark, 1=bright
  base.noiseHpf   = base.noiseHpf   * (0.7 + bright * 0.6);
  base.metalGain  = base.metalGain  * (0.6 + bright * 0.8);
  base.clickGain  = base.clickGain  * (0.5 + bright * 1.0);
  base.clickHpf   = base.clickHpf   * (0.7 + bright * 0.6);
  return base;
}

// ─── DRUM SYNTHESIS ──────────────────────────────────────────────────────────
// DFAM-style: pitch of previous kick slightly influences the next one.
// Not random — coupled. Creates organic instability without chaos.


// ─── FINGER SNAP ─────────────────────────────────────────────────────────────
// A real finger snap is an IMPULSE — ~15-22ms total, not a ringing tone.
// Three layers:
//   1. Broadband noise click — the snap attack, very fast envelope, broad spectrum
//      (hi-pass 600Hz, low-pass 7.5kHz, peaking +6dB at 2.4kHz with low Q)
//   2. Palm-flesh body — 480→280Hz sweep, ~14ms — the "thup" from finger-to-palm contact
//   3. Edge click — tiny 2.2→0.8kHz pitch sweep for attack definition
// No long ring tail. Broadband rather than narrow bandpass.
// ─── CALL & RESPONSE ENGINE ──────────────────────────────────────────────────
// When a "call" element fires (Pulse, Sub, EP), a "response" element (Pluck,
// Arp, Ring) can answer a step or two later at a harmonically related note.
// This creates musical conversation between elements rather than parallel layers.

// Genres where call & response is active (too sparse/aggressive genres skip it)

// Pending response queue: [{respondEl, t, freq, gate}]

// Record a call event — called when Pulse/Sub/EP fires

// ─── ELEMENT CONVERSATION ENGINE ─────────────────────────────────────────────
// Elements react to each other — not just call/response notes, but volume and
// presence. Three rules:
//
// RULE 1 — BACKING OFF: when a lead voice fires, backing elements duck slightly
//   (pad, drone, chord). The lead gets space to breathe.
//
// RULE 2 — FILLING SPACE: when a lead is silent for N bars, a secondary voice
//   swells to fill the gap. When the lead returns, the filler recedes.
//
// RULE 3 — RHYTHMIC LOCK: when Sub plays on a step, Arp skips that step.
//   When Sub is silent, Arp is more likely to play. Creates push-pull groove.
//
// These are probabilistic and genre-gated — not mechanical.

// Per-element last-fired tracker for RULE 2
const _elLastFiredBar = new Map(); // el.id → bar number

// Track which element is currently "lead" (most recently prominent voice)

// Genre-specific conversation aggressiveness (0=none, 1=full)

// RULE 1: When a prominent voice fires, duck backing elements briefly
// Called from the scheduler when EP, Pluck, FM3, Arp fires
function notifyConversationFired(el, bar){
  const strength = CONVERSATION_STRENGTH[currentStyle] ?? 0.5;
  if(strength < 0.3 || arcState !== 'idle') return;

  const role = getInstrumentRole(el);
  if(role !== 'voice') return;

  // Update lead tracker
  _conversationLead = el.id;
  _conversationLeadBar = bar;
  _elLastFiredBar.set(el.id, bar);

  // Duck atmosphere elements when a voice speaks
  // Only duck if strength is high enough and we haven't ducked recently
  if(strength >= 0.50 && Math.random() < strength * 0.4){
    elements.forEach(backing => {
      if(backing.id === el.id || backing.muted) return;
      const backRole = getInstrumentRole(backing);
      if(backRole !== 'atmosphere') return;
      if(!backing._convOrigVol) backing._convOrigVol = backing.volume;
      // Duck to 65-80% for about 1 bar
      const duckTo = backing.volume * (0.65 + Math.random() * 0.15);
      backing.volume = duckTo;
      updateDroneParams(backing);
      // Restore after 1-2 bars
      const restoreMs = (60000/bpm) * 4 * (1 + Math.floor(Math.random() * 2));
      setTimeout(() => {
        if(backing._convOrigVol && !backing.muted){
          backing.volume = backing._convOrigVol;
          backing._convOrigVol = null;
          updateDroneParams(backing);
        }
      }, restoreMs);
    });
  }
}

// RULE 2: Called each bar — check if any voice has been silent and swell a filler
function tickConversation(bar){
  const strength = CONVERSATION_STRENGTH[currentStyle] ?? 0.5;
  if(strength < 0.4 || arcState !== 'idle') return;
  if(Math.random() > strength * 0.3) return; // sparse checks

  // Find a voice that has been silent for 4+ bars
  const silentVoices = elements.filter(el =>
    !el.muted &&
    getInstrumentRole(el) === 'voice' &&
    el.soundType !== 'Sub' &&
    (_elLastFiredBar.get(el.id) ?? -99) < bar - 4
  );

  // Find a secondary that could fill
  const fillers = elements.filter(el =>
    !el.muted &&
    (getInstrumentRole(el) === 'atmosphere' ||
     (getInstrumentRole(el) === 'voice' && el.soundType !== 'Sub')) &&
    el.soundType !== 'Chord' && // Chord doesn't "fill" — it sustains
    (_elLastFiredBar.get(el.id) ?? -99) < bar - 2
  );

  if(silentVoices.length && fillers.length && Math.random() < 0.35){
    // Swell one filler element slightly
    const filler = fillers[Math.floor(Math.random() * fillers.length)];
    if(!filler._convOrigVol) filler._convOrigVol = filler.volume;
    const swellTo = Math.min(filler.volume * 1.25, 1.0);
    filler.volume = swellTo;
    updateDroneParams(filler);
    // Recede when lead returns (after 4-8 bars)
    const recedeMs = (60000/bpm) * 4 * (4 + Math.floor(Math.random() * 4));
    setTimeout(() => {
      if(filler._convOrigVol && !filler.muted){
        filler.volume = filler._convOrigVol;
        filler._convOrigVol = null;
        updateDroneParams(filler);
      }
    }, recedeMs);
  }
}

// RULE 3: Sub/Arp rhythmic lock — checked in the beat scheduler
// Returns true if Arp should skip this step because Sub just played
function shouldArpYieldToSub(beatStep){
  const strength = CONVERSATION_STRENGTH[currentStyle] ?? 0.5;
  if(strength < 0.45) return false;
  // Check if Sub fired on this step or adjacent step
  const subActive = elements.some(el =>
    el.soundType === 'Sub' && !el.muted && el.syncMode === 'sync'
  );
  if(!subActive) return false;
  // Sub pattern check — yield on steps where Sub is active
  const basePh = getBassPhrase();
  if(!basePh[beatStep]) return false;
  // Arp yields ~40% of the time when Sub plays on the same step
  return Math.random() < strength * 0.4;
}


// Flush any due responses — called each scheduler tick
function flushCallResponseQueue(now){
  if(!_crQueue.length) return;
  const due = _crQueue.filter(ev => ev.fireAt <= now + 0.05);
  _crQueue  = _crQueue.filter(ev => ev.fireAt >  now + 0.05);
  due.forEach(ev=>{
    if(ev.respondEl.muted||!CR_ACTIVE_GENRES.has(currentStyle)) return;
    const el = ev.respondEl;
    if(el.soundType==='Pluck'){
      schedulePluckNote({...el, volume: ev.vol}, ev.fireAt, ev.freq);
    } else if(el.soundType==='Arp'){
      scheduleArpNote({...el, volume: ev.vol}, ev.fireAt, ev.freq, 0.55);
    } else if(el.soundType==='Ring'){
      scheduleRingOneShot({...el, volume: ev.vol}, ev.fireAt);
    } else if(el.soundType==='Laser'){
      scheduleLaserOneShot({...el, volume: ev.vol}, ev.fireAt);
    } else if(el.soundType==='Echo'){
      scheduleEchoNote({...el, volume: ev.vol, note: midiToNote(Math.round(69+12*Math.log2(ev.freq/440)))}, ev.fireAt);
    } else if(el.soundType==='Conga'){
      scheduleCongaNote({...el, volume: ev.vol, note: midiToNote(Math.round(69+12*Math.log2(ev.freq/440)))}, ev.fireAt);
    }
    el._pulse=0.5; el._flashPulse=0.3;
  });
}

const _origRunBeat=runBeatScheduler;


document.getElementById('btnBuild').addEventListener('click',()=>{if(!soundEnabled)return;startBuildArc();updateArcUI();});
document.getElementById('btnDrop').addEventListener('click',()=>{if(!soundEnabled)return;startDropArc();updateArcUI();});
document.getElementById('btnBreak').addEventListener('click',()=>{if(!soundEnabled)return;startBreakArc();updateArcUI();});
function getConductorMods(){
  return {
    bloom:    conductorParams.bloom,
    cool:     conductorParams.cool,
    tension:  conductorParams.tension,
    drift:    conductorParams.drift,
    shimmer:  conductorParams.shimmer,
    dropFlash:_dropFlash,
    dropBurst:_dropBurst,
  };
}
function decayDropFlash(){
  if(_dropFlash>0) _dropFlash=Math.max(0,_dropFlash-0.04);
  if(_dropBurst>0) _dropBurst=Math.max(0,_dropBurst-0.025); // slower decay = elements settle
}

// ─── SILENCE ENGINE ──────────────────────────────────────────────────────────
// Scheduled moments where specific elements drop out for 4-8 bars then return.
// Silence creates anticipation. The return feels earned.
//
// Four event types:
//   'voice_out'   — a voice element mutes for N bars, then returns (creates space)
//   'hat_out'     — hihats drop for 4 bars (classic DJ move before a section change)
//   'all_but_sub' — everything mutes except Sub for 2 bars (negative space moment)
//   'bass_drop'   — Sub drops out for 2 bars while everything else plays (tension)
//
// These fire probabilistically based on genre silenceChance + arc state.
// They never fire during an active arc (build/drop/break owns that territory).


// How many bars each silence type lasts per genre

// Which silence types are allowed per genre (some don't suit every style)

function fireSilenceEvent(type, durationBars){
  if(_silenceEngineActive) return;
  if(arcState !== 'idle') return; // never compete with arcs
  _silenceEngineActive = true;

  const barMs = (60000 / bpm) * 4;
  const restoreMs = durationBars * barMs;

  if(type === 'voice_out'){
    // Mute one non-essential voice element for durationBars
    const candidates = elements.filter(e =>
      !e.muted && getInstrumentRole(e) === 'voice' &&
      e.soundType !== 'Sub' && e.soundType !== 'Acid' &&
      !_silencedVoiceIds.has(e.id)
    );
    if(!candidates.length){ _silenceEngineActive = false; return; }
    // Pick the most active/prominent element — it leaving will be most noticeable
    const el = candidates.sort((a,b) => (b.volume||0) - (a.volume||0))[0];
    el.muted = true;
    _silencedVoiceIds.add(el.id);
    stopDrone(el, 0.8);
    setTimeout(() => {
      el.muted = false;
      _silencedVoiceIds.delete(el.id);
      if(soundEnabled) setTimeout(() => maybeStartDrone(el), 100);
      _silenceEngineActive = false;
    }, restoreMs);
  }

  else if(type === 'hat_out'){
    // Drop hihats — but only if they're already playing
    if(_silencedHats){ _silenceEngineActive = false; return; }
    _silencedHats = true;
    _silenceSavedHats = [...drumPattern.hihat];
    drumPattern.hihat = Array(16).fill(0);
    // Also drop open hats
    const savedOpen = [...drumPattern.openhh];
    drumPattern.openhh = Array(16).fill(0);
    setTimeout(() => {
      if(_silenceSavedHats){ drumPattern.hihat = [..._silenceSavedHats]; _silenceSavedHats = null; }
      drumPattern.openhh = savedOpen;
      _silencedHats = false;
      _silenceEngineActive = false;
    }, restoreMs);
  }

  else if(type === 'all_but_sub'){
    // Everything drops except Sub — pure negative space
    const toMute = elements.filter(e =>
      !e.muted && e.soundType !== 'Sub' && !_densityMutedIds.has(e.id)
    );
    const muteIds = new Set();
    toMute.forEach(el => {
      el.muted = true;
      muteIds.add(el.id);
      stopDrone(el, 1.0);
    });
    // Drop drums too (keep Sub bass)
    const savedKick = [...drumPattern.kick];
    const savedClap = [...drumPattern.clap];
    const savedHat  = [...drumPattern.hihat];
    drumPattern.kick  = Array(16).fill(0);
    drumPattern.clap  = Array(16).fill(0);
    drumPattern.hihat = Array(16).fill(0);
    setTimeout(() => {
      // Restore everything — stagger entries for more drama
      muteIds.forEach((id, i) => {
        const el = elements.find(e => e.id === id);
        if(!el) return;
        setTimeout(() => {
          el.muted = false;
          if(soundEnabled) maybeStartDrone(el);
        }, i * 200); // elements re-enter staggered 200ms apart
      });
      drumPattern.kick  = savedKick;
      drumPattern.clap  = savedClap;
      drumPattern.hihat = savedHat;
      _silenceEngineActive = false;
    }, restoreMs);
  }

  else if(type === 'bass_drop'){
    // Sub drops out — everything else keeps playing — creates hanging tension
    const sub = elements.find(e => e.soundType === 'Sub' && !e.muted);
    if(!sub){ _silenceEngineActive = false; return; }
    sub.muted = true;
    stopDrone(sub, 0.3);
    setTimeout(() => {
      sub.muted = false;
      if(soundEnabled) maybeStartDrone(sub);
      _silenceEngineActive = false;
    }, restoreMs);
  }
}

// Called from evolveOnBar — fires silence events at musically meaningful positions
function tickSilenceEngine(bar, phraseBar, grammar){
  if(_silenceEngineActive) return;
  if(arcState !== 'idle') return;
  if(!soundEnabled) return;

  const silenceChance = grammar.silenceChance || 0;
  if(silenceChance <= 0) return;

  const allowed = SILENCE_TYPES_ALLOWED[currentStyle] || ['voice_out','hat_out'];
  const durations = SILENCE_DURATION[currentStyle] || { voice_out:4, hat_out:4, all_but_sub:2, bass_drop:2 };
  const formCycle = grammar.formCycle || 32;

  // Fire at specific phrase positions — not randomly throughout
  // Position 1/4: voice drop (creates space in the middle of a cycle)
  const voicePoint = Math.floor(formCycle * 0.25);
  // Position 3/8: hat out (classic before a section change)
  const hatPoint   = Math.floor(formCycle * 0.375);
  // Position 5/8: negative space moment
  const spacePoint = Math.floor(formCycle * 0.625);
  // Position 7/8: bass tension before cycle reset
  const bassPoint  = Math.floor(formCycle * 0.875);

  if(phraseBar === voicePoint && allowed.includes('voice_out') && Math.random() < silenceChance * 0.7){
    fireSilenceEvent('voice_out', durations.voice_out);
  }
  else if(phraseBar === hatPoint && allowed.includes('hat_out') && Math.random() < silenceChance * 1.2){
    fireSilenceEvent('hat_out', durations.hat_out);
  }
  else if(phraseBar === spacePoint && allowed.includes('all_but_sub') && Math.random() < silenceChance * 0.4){
    fireSilenceEvent('all_but_sub', durations.all_but_sub);
  }
  else if(phraseBar === bassPoint && allowed.includes('bass_drop') && Math.random() < silenceChance * 0.5){
    fireSilenceEvent('bass_drop', durations.bass_drop);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DJ SET BRAIN
// Nested time scales: MACRO ARC → CHAPTERS → PHRASES → MEMORY + RESTRAINT
// Runs on top of evolveOnBar — steers conductorTargets, genre, mutes, arcs.
// Does NOT replace existing systems; provides long-term intelligence above them.
// ─────────────────────────────────────────────────────────────────────────────

// ── Journey states — the macro arc of a full session ────────────────────────

// Default journey arc progression — can be interrupted by user or peaks

// ── Chapter identities — sonic color of each 8–16 min chapter ───────────────

// ── Phrase decisions ─────────────────────────────────────────────────────────
// ── DJ Brain state ───────────────────────────────────────────────────────────

// ── Start / stop ─────────────────────────────────────────────────────────────


// ── Main tick — called from evolveOnBar ──────────────────────────────────────

// ── Journey state machine ────────────────────────────────────────────────────



// ── Chapter system ───────────────────────────────────────────────────────────



// ── Phrase decision engine ───────────────────────────────────────────────────




// ── Decision implementations ─────────────────────────────────────────────────







// ── Memory management ─────────────────────────────────────────────────────────

// ── Phrase length — varies between 16/32/64 bars ─────────────────────────────

// ── Public API ────────────────────────────────────────────────────────────────
function getDJBrainState(){
  return {
    journey: DJBrain.journeyState,
    chapter: DJBrain.chapterIdentity,
    decision: DJBrain.phraseDecision,
    continuity: Math.round(DJBrain.continuityScore * 100) + '%',
    barsInState: DJBrain.journeyBarsInState,
    memoryDepth: DJBrain.memory.motifs.length,
  };
}

// ── Inject into evolveOnBar — called directly from evolveOnBar body ──────────
// djBrainTick(bar) is called at the bottom of evolveOnBar (see that function above).

// ─────────────────────────────────────────────────────────────────────────────
// END DJ SET BRAIN
// ─────────────────────────────────────────────────────────────────────────────

// ─── DRUM PATTERN BANK ────────────────────────────────────────────────────────
// Each genre has named patterns with distinct feels.
// Labels: 'main' 'halftime' 'broken' 'stripped' 'synco' 'fill' 'drive'
// The system cycles through them every few bars for real variety.

// Pattern feel sequence per genre — determines what order feels rotate through
const DRUM_FEEL_SEQUENCE = {
  deephouse:    ['main','main','stripped','synco','main','broken','halftime','main'],
  techhouse:    ['main','main','drive','synco','main','broken','stripped','main'],
  detroittechno:['main','synco','main','halftime','broken','main','stripped','synco'],
  dubtechno:    ['main','main','halftime','stripped','synco','main','halftime','main'],
  minimaltechno:['main','halftime','main','stripped','synco','main','stripped','halftime'],
  downtempo:    ['main','synco','broken','main','halftime','stripped','synco','main'],
  electronica:  ['main','synco','broken','drive','main','halftime','stripped','broken','main'],
  italo:        ['main','main','synco','halftime','main','stripped','synco','main'],
  dnb:          ['main','synco','main','halftime','synco','main','broken','main'],
  ambienttechno:['main','stripped','synco','stripped','main','stripped','main','stripped'],
};


function evolveDrumMicro(rules, rate){
  // rate overrides grammar mutationRate for caller-controlled intensity
  const flipChance = rate!=null ? rate : 0.35;
  if(rules.hatMutate){
    const candidates=[];
    for(let i=0;i<16;i++){
      if(!drumPattern.kick[i]&&!drumPattern.clap[i]) candidates.push(i);
    }
    if(candidates.length && Math.random()<flipChance){
      const idx=candidates[Math.floor(Math.random()*candidates.length)];
      drumPattern.hihat[idx]=drumPattern.hihat[idx]?0:1;
    }
  }
  if(rules.accentShift){
    const kickSteps=drumPattern.kick.map((v,i)=>v?i:-1).filter(i=>i>=0);
    if(kickSteps.length){
      const step=kickSteps[Math.floor(Math.random()*kickSteps.length)];
      if(!drumPattern._accents) drumPattern._accents={};
      const cur=drumPattern._accents[step]||1.0;
      drumPattern._accents[step]=cur>1.1?0.85:1.2;
    }
  }
}
function evolveElementFilter(rules){
  if(!rules.filterDrift) return;
  const candidates=elements.filter(el=>!el.muted&&(el.soundType==='Drone'||el.soundType==='Acid'));
  if(!candidates.length) return;
  const el=candidates[Math.floor(Math.random()*candidates.length)];
  const delta=(Math.random()<0.5?1:-1)*0.06;
  el.tone.x=Math.max(0.1,Math.min(0.9,el.tone.x+delta));
  if(el._droneNode&&audioCtx) updateDroneParams(el);
}
function evolveHarmony(rules){
  if(!rules.harmonicShift&&!rules.chordInversion) return;
  const candidates=elements.filter(el=>!el.muted&&
    (el.soundType==='Pulse'||el.soundType==='Drone'||el.soundType==='Arp'||
     el.soundType==='Pad'||el.soundType==='WTPad'||el.soundType==='Chord'));
  if(!candidates.length) return;
  const el=candidates[Math.floor(Math.random()*candidates.length)];
  if(rules.chordInversion&&el.soundType==='Pulse'){
    el.variation=(el.variation+1)%4;
  }
  if(rules.harmonicShift&&el.soundType!=='Pulse'){
    // Walk _roleDeg through chord tones (0=root, 2=third, 4=fifth) — gives voicing
    // changes that stay in harmony with the chord progression engine.
    ensureRoleTag(el);
    const dir=Math.random()<0.5?1:-1;
    const chordTones=[0,2,4];
    const idx=chordTones.indexOf(el._roleDeg);
    el._roleDeg = idx>=0
      ? chordTones[(idx+dir+chordTones.length)%chordTones.length]
      : 0; // snap to root if was off-grid
    const root=document.getElementById('keySelect').value||'A';
    const scale=document.getElementById('scaleSelect').value||'Minor';
    const chordRoot=getChordRootDeg();
    const newNote=getHarmonicNote(root,scale,el._roleDeg+chordRoot,el._roleOct);
    if(newNote===el.note) return;
    el.note=newNote;
    if(el.soundType==='Arp'){
      el._arpPendingPattern=true;
    } else if(el._droneNode&&soundEnabled&&audioCtx){
      const newFreq=midiToFreq(noteToMidi(newNote));
      const now=audioCtx.currentTime;
      el._droneNode.oscs.forEach(o=>{
        try{
          if(o.frequency&&o.frequency.value>10){
            const ratio=o.frequency.value/(el._lastBaseFreq||newFreq);
            o.frequency.setTargetAtTime(newFreq*Math.max(0.25,Math.min(4,ratio)),now,0.6);
          }
        }catch(e){}
      });
      el._lastBaseFreq=newFreq;
    } else if(!el._droneNode&&soundEnabled){
      maybeStartDrone(el);
    }
  }
}
function evolveFullRefresh(){
  // Stagger restarts - but only restart ONE Growl maximum
  let growlScheduled=false;
  elements.forEach((el,i)=>{
    if(el.syncMode==='free'&&!el.muted&&el._droneNode&&soundEnabled){
      if(el.soundType==='Acid'){
        if(growlScheduled) return;
        growlScheduled=true;
      }
      setTimeout(()=>{
        stopDrone(el,0.8);
        setTimeout(()=>maybeStartDrone(el),900);
      },i*1800);
    }
  });
}

// ─── VISUAL DRIFT / FLOAT SYSTEM ─────────────────────────────────────────────

function initElementDrift(el) {
  if (!el._drift) {
    const angle = Math.random() * Math.PI * 2;
    el._drift = {
      vx: 0, vy: 0,
      ax: 0, ay: 0,
      angle,           // current wander direction
      homeX:  el.x,   homeY:  el.y,
      homeX1: el.x1,  homeY1: el.y1,
      homeX2: el.x2,  homeY2: el.y2,
      orbitPhase: Math.random() * Math.PI * 2, // for Ring orbital motion
    };
  }
}

// Per sound-type drift personality
function getDriftProfile(el) {
  const beatSec = 60 / bpm;
  const st = el.soundType;
  switch(st) {
    case 'Sub':
      // Barely moves — deep, slow breathing, like the floor vibrating
      return { baseSpeed:0.00008, wanderRate:0.000004, maxWander:0.04, turbulence:0, rhythmic:false, orbital:false };
    case 'Drone':
    case 'Pad':
      // Slow dreamy drift — long phrases, like clouds
      return { baseSpeed:0.00018, wanderRate:0.000008, maxWander:0.08, turbulence:0.000003, rhythmic:false, orbital:false };
    case 'Vocal':
      // Gentle float with a slight breathing oscillation
      return { baseSpeed:0.00015, wanderRate:0.000006, maxWander:0.07, turbulence:0.000002, rhythmic:false, orbital:false };
    case 'Acid':
      // Medium speed, driven by BPM — feels like the bass pushing air
      return { baseSpeed:0.0003, wanderRate:0.000015, maxWander:0.10, turbulence:0.00001, rhythmic:false, orbital:false };
    case 'Noise':
      // Slightly turbulent, like static
      return { baseSpeed:0.00025, wanderRate:0.000012, maxWander:0.09, turbulence:0.00003, rhythmic:false, orbital:false };
    case 'Ring':
      // Slow orbital — circles its home position, metallic planet
      return { baseSpeed:0.0002, wanderRate:0.000005, maxWander:0.08, turbulence:0, rhythmic:false, orbital:true, orbitSpeed: 0.008 + Math.random()*0.006 };
    case 'Arp':
      // Fast and skittery — zips around matching the arp rate
      return { baseSpeed:0.0008, wanderRate:0.00004, maxWander:0.14, turbulence:0.00004, rhythmic:true, rhythmBoost:0.006, orbital:false };
    case 'Pluck':
      // Medium-fast, little directional bursts on each hit
      return { baseSpeed:0.0005, wanderRate:0.00002, maxWander:0.11, turbulence:0.00002, rhythmic:true, rhythmBoost:0.004, orbital:false };
    case 'Pulse':
    case 'EP':
    case 'FMStab':
      // Rhythmic hop — bounces on the beat, drifts between hits
      return { baseSpeed:0.0003, wanderRate:0.000015, maxWander:0.09, turbulence:0.000008, rhythmic:true, rhythmBoost:0.005, orbital:false };
    default:
      return { baseSpeed:0.0002, wanderRate:0.00001, maxWander:0.08, turbulence:0.000005, rhythmic:false, orbital:false };
  }
}

function tickVisualDrift() {
  if (!driftActive) return;

  elements.forEach(el => {
    initElementDrift(el);
    const d = el._drift;
    const p = getDriftProfile(el);

    // Orbital motion for Ring — circles home position
    if (p.orbital) {
      d.orbitPhase = (el._drift.orbitPhase || 0) + p.orbitSpeed;
      el._drift.orbitPhase = d.orbitPhase;
      const orbitR = 0.06 + (el.volume || 0.5) * 0.04;
      const targetX = d.homeX + Math.cos(d.orbitPhase) * orbitR;
      const targetY = d.homeY + Math.sin(d.orbitPhase) * orbitR * 0.6; // ellipse
      d.vx += (targetX - el.x) * 0.04;
      d.vy += (targetY - el.y) * 0.04;
    } else {
      // Wander: slowly rotate direction angle + turbulence nudge
      d.angle += (Math.random() - 0.5) * p.wanderRate * 80;
      d.ax = Math.cos(d.angle) * p.baseSpeed * 0.15;
      d.ay = Math.sin(d.angle) * p.baseSpeed * 0.15;
      // Turbulence — random micro-jitter per sound type
      if (p.turbulence) {
        d.ax += (Math.random() - 0.5) * p.turbulence * 8;
        d.ay += (Math.random() - 0.5) * p.turbulence * 8;
      }
      d.vx += d.ax;
      d.vy += d.ay;
    }

    // Rhythmic kick — beat-synced types get a velocity burst on each pulse
    if (p.rhythmic && el._pulse > 0.3) {
      const kickAngle = d.angle + (Math.random() - 0.5) * 1.2;
      d.vx += Math.cos(kickAngle) * p.rhythmBoost;
      d.vy += Math.sin(kickAngle) * p.rhythmBoost;
    }

    // Speed cap — each type has its own ceiling
    const speed = Math.sqrt(d.vx*d.vx + d.vy*d.vy);
    const maxSpeed = p.baseSpeed * 4;
    if (speed > maxSpeed) { d.vx *= maxSpeed/speed; d.vy *= maxSpeed/speed; }

    // Home attraction — rubber band, kicks in beyond 60% of max wander
    const distX = el.x - d.homeX;
    const distY = el.y - d.homeY;
    const dist = Math.sqrt(distX*distX + distY*distY);
    if (dist > p.maxWander * 0.6) {
      const pull = (dist - p.maxWander * 0.6) * 0.0003;
      d.vx -= (distX / dist) * pull;
      d.vy -= (distY / dist) * pull;
    }

    // Friction — dampen velocity so motion stays fluid, not choppy
    d.vx *= 0.94;
    d.vy *= 0.94;

    // Apply to correct coordinates per visual type
    const vt = el.visualType;

    if (vt === 'blob' || vt === 'spot') {
      el.x = Math.max(0.04, Math.min(0.96, el.x + d.vx));
      el.y = Math.max(0.04, Math.min(0.96, el.y + d.vy));
      if (el.x<=0.05||el.x>=0.95) d.vx*=-0.5;
      if (el.y<=0.05||el.y>=0.95) d.vy*=-0.5;

    } else if (vt === 'neon' || vt === 'fold') {
      const nx1=el.x1+d.vx, ny1=el.y1+d.vy, nx2=el.x2+d.vx, ny2=el.y2+d.vy;
      if (nx1>0.01&&nx2<0.99&&nx1<0.99&&nx2>0.01) { el.x1=nx1; el.x2=nx2; } else d.vx*=-0.5;
      if (ny1>0.01&&ny2<0.99&&ny1<0.99&&ny2>0.01) { el.y1=ny1; el.y2=ny2; } else d.vy*=-0.5;
      el.x=(el.x1+el.x2)/2; el.y=(el.y1+el.y2)/2;

    } else if (vt === 'beam') {
      el.x = Math.max(0.04, Math.min(0.96, el.x + d.vx));
      el.y = Math.max(0.04, Math.min(0.96, el.y + d.vy));
      if (d.homeX1 !== undefined) {
        el.x1 = el.x + (d.homeX1 - d.homeX);
        el.y1 = el.y + (d.homeY1 - d.homeY);
      }
      if (el.x<=0.05||el.x>=0.95) d.vx*=-0.5;
      if (el.y<=0.05||el.y>=0.95) d.vy*=-0.5;
    }
  });

  driftRafId = requestAnimationFrame(tickVisualDrift);
}

function startDrift() {
  driftActive = true;
  elements.forEach(el => initElementDrift(el));
  driftRafId = requestAnimationFrame(tickVisualDrift);
}

function stopDrift() {
  driftActive = false;
  if (driftRafId) { cancelAnimationFrame(driftRafId); driftRafId = null; }
  elements.forEach(el => { el._drift = null; });
}
function midiToNote(midi){
  const names=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  return names[midi%12]+(Math.floor(midi/12)-1);
}
function noteToMidi(note){
  const m=note.match(/^([A-G]#?)(\d)$/);
  if(!m) return 57; // A3 fallback
  const ni=NOTE_NAMES.indexOf(m[1]);
  return (parseInt(m[2])+1)*12+ni;
}
function cycleNote(currentNote){
  const root=document.getElementById('keySelect').value||'C';
  const scale=document.getElementById('scaleSelect').value||'Major';
  const notes=getScaleNotes(root,scale,[2,3,4,5]);
  const noteNames=notes.map(n=>n.name);
  const idx=noteNames.indexOf(currentNote);
  return noteNames[(idx+1)%noteNames.length]||'A3';
}
// ── Role-aware XY pad labels ──────────────────────────────────────────────────
// The three pads keep the same layout but their semantic meaning and axis labels
// change based on the element's role (rhythm / voice / atmosphere).
const PAD_LABELS = {
  rhythm: {
    shape: {
      title: 'Pattern',
      axes:  'Tight ← → Loose · Sparse ↑ ↓ Dense',
      tl: 'Tight/Sparse', br: 'Loose/Dense'
    },
    tone: {
      title: 'Punch',
      axes:  'Soft ← → Hard · Low ↑ ↓ Snap',
      tl: 'Soft/Low', br: 'Hard/Snap'
    },
    space: {
      title: 'Room',
      axes:  'Dry ← → Room · Short ↑ ↓ Echo',
      tl: 'Dry/Short', br: 'Room/Echo'
    }
  },
  voice: {
    shape: {
      title: 'Phrase',
      axes:  'Short ← → Long · Sparse ↑ ↓ Dense',
      tl: 'Short/Sparse', br: 'Long/Dense'
    },
    tone: {
      title: 'Filter',
      axes:  'Dark ← → Bright · Clean ↑ ↓ Resonant',
      tl: 'Dark/Clean', br: 'Bright/Resonant'
    },
    space: {
      title: 'Accent',
      axes:  'Soft ← → Hard · Dry ↑ ↓ Delay',
      tl: 'Soft/Dry', br: 'Hard/Delay'
    }
  },
  atmosphere: {
    shape: {
      title: 'Motion',
      axes:  'Still ← → Moving · Thin ↑ ↓ Wide',
      tl: 'Still/Thin', br: 'Moving/Wide'
    },
    tone: {
      title: 'Colour',
      axes:  'Dark ← → Bright · Muted ↑ ↓ Open',
      tl: 'Dark/Muted', br: 'Bright/Open'
    },
    space: {
      title: 'Field',
      axes:  'Close ← → Far · Dry ↑ ↓ Deep',
      tl: 'Close/Dry', br: 'Far/Deep'
    }
  }
};

function updateRolePadLabels(el) {
  const role = (typeof getInstrumentRole === 'function') ? getInstrumentRole(el) : 'atmosphere';
  const labels = PAD_LABELS[role] || PAD_LABELS.atmosphere;
  const pads = ['shape','tone','space'];
  pads.forEach(key => {
    const def = labels[key];
    const padEl = document.getElementById('xy' + key.charAt(0).toUpperCase() + key.slice(1));
    if (!padEl) return;
    const block = padEl.closest('.xy-block');
    if (!block) return;
    const titleEl = block.querySelector('.xy-title');
    const axesEl  = block.querySelector('.xy-axes');
    const tlEl    = block.querySelector('.xy-corner.tl');
    const brEl    = block.querySelector('.xy-corner.br');
    if (titleEl) titleEl.textContent = def.title;
    if (axesEl)  axesEl.textContent  = def.axes;
    if (tlEl)    tlEl.textContent    = def.tl;
    if (brEl)    brEl.textContent    = def.br;
  });
  buildRoleControls(el, role);
}

// Role-specific controls: label, source getter on el, display formatter, accent color
const ROLE_CONTROLS = {
  rhythm: [
    { label:'Density', pad:'shape', axis:'y', fmt: v=>`${Math.round(v*100)}%`,               color:'rgba(255,100,100' },
    { label:'Groove',  pad:'space', axis:'x', fmt: v=>v<0.15?'Straight':v<0.4?'Light':v<0.7?'Medium':'Heavy', color:'rgba(255,140,100' },
    { label:'Punch',   pad:'tone',  axis:'x', fmt: v=>`${Math.round(v*100)}%`,               color:'rgba(255,100,100' },
    { label:'Echo',    pad:'space', axis:'y', fmt: v=>`${Math.round(v*100)}%`,               color:'rgba(255,100,100' },
    { label:'Decay',   pad:'shape', axis:'x', fmt: v=>v<0.3?'Tight':v<0.6?'Mid':'Long',      color:'rgba(255,140,100' },
    { label:'Drive',   pad:'tone',  axis:'y', fmt: v=>`${Math.round(v*100)}%`,               color:'rgba(255,100,100' },
  ],
  voice: [
    { label:'Phrase',    pad:'shape', axis:'y', fmt: v=>v<0.3?'Short':v<0.6?'Mid':'Long',    color:'rgba(72,202,228' },
    { label:'Gate',      pad:'shape', axis:'x', fmt: v=>`${Math.round(v*100)}%`,             color:'rgba(72,202,228' },
    { label:'Filter',    pad:'tone',  axis:'x', fmt: v=>v<0.3?'Dark':v<0.6?'Mid':'Open',     color:'rgba(72,202,228' },
    { label:'Resonance', pad:'tone',  axis:'y', fmt: v=>`${Math.round(v*100)}%`,             color:'rgba(100,180,255' },
    { label:'Accent',    pad:'space', axis:'x', fmt: v=>v<0.3?'Soft':v<0.6?'Mid':'Hard',     color:'rgba(72,202,228' },
    { label:'Delay',     pad:'space', axis:'y', fmt: v=>`${Math.round(v*100)}%`,             color:'rgba(72,202,228' },
  ],
  atmosphere: [
    { label:'Motion',   pad:'shape', axis:'x', fmt: v=>v<0.2?'Still':v<0.5?'Drift':v<0.8?'Flow':'Wave', color:'rgba(181,131,141' },
    { label:'Width',    pad:'shape', axis:'y', fmt: v=>`${Math.round(v*100)}%`,              color:'rgba(181,131,141' },
    { label:'Colour',   pad:'tone',  axis:'x', fmt: v=>v<0.3?'Dark':v<0.6?'Warm':'Bright',  color:'rgba(181,131,141' },
    { label:'Texture',  pad:'tone',  axis:'y', fmt: v=>`${Math.round(v*100)}%`,              color:'rgba(181,131,141' },
    { label:'Distance', pad:'space', axis:'x', fmt: v=>`${Math.round(v*100)}%`,              color:'rgba(181,131,141' },
    { label:'Depth',    pad:'space', axis:'y', fmt: v=>`${Math.round(v*100)}%`,              color:'rgba(181,131,141' },
  ]
};

// Map getter source string back to pad key + axis for write-back

function buildRoleControls(el, role) {
  const grid  = document.getElementById('roleControlsGrid');
  const label = document.getElementById('roleControlsLabel');
  if (!grid) return;
  const defs = ROLE_CONTROLS[role] || ROLE_CONTROLS.atmosphere;
  const roleColor = role==='rhythm'?'rgba(255,100,100,0.6)':role==='voice'?'rgba(72,202,228,0.6)':'rgba(181,131,141,0.6)';
  if (label) { label.textContent = role.charAt(0).toUpperCase()+role.slice(1)+' Controls'; label.style.color=roleColor; }
  grid.innerHTML = defs.map((def,i)=>{
    const val = Math.max(0,Math.min(1, (el[def.pad]?.[def.axis]) ?? 0.5));
    const pct = Math.round(val*100);
    return `<div class="role-ctrl" data-ctrl-idx="${i}">
      <div class="role-ctrl-label">${def.label}</div>
      <div class="role-ctrl-track" data-ctrl-idx="${i}">
        <div class="role-ctrl-fill" style="width:${pct}%;background:${def.color},0.55)"></div>
      </div>
      <div class="role-ctrl-val">${def.fmt(val)}</div>
    </div>`;
  }).join('');

  // Drag to adjust underlying shape/tone/space values
  grid.querySelectorAll('.role-ctrl-track').forEach(track=>{
    let dragging=false;
    const onMove=(ex)=>{
      if(!dragging) return;
      const el2=elements.find(e=>e.id===activeId); if(!el2) return;
      const r=track.getBoundingClientRect();
      const v=Math.max(0,Math.min(1,(ex-r.left)/r.width));
      const idx=parseInt(track.dataset.ctrlIdx);
      const def=defs[idx];
      if(!el2[def.pad]) el2[def.pad]={x:0.5,y:0.5};
      el2[def.pad][def.axis]=v;
      // Update fill + label live
      const fill=track.querySelector('.role-ctrl-fill');
      const valEl=track.parentElement.querySelector('.role-ctrl-val');
      if(fill) fill.style.width=Math.round(v*100)+'%';
      if(valEl) valEl.textContent=def.fmt(v);
      updateDroneParams(el2);
    };
    track.addEventListener('mousedown',e=>{dragging=true;onMove(e.clientX);e.preventDefault();});
    track.addEventListener('touchstart',e=>{dragging=true;onMove(e.touches[0].clientX);},{passive:true});
    document.addEventListener('mousemove',e=>{if(dragging)onMove(e.clientX);});
    document.addEventListener('mouseup',()=>{dragging=false;});
    document.addEventListener('touchend',()=>{dragging=false;});
    document.addEventListener('touchmove',e=>{if(dragging&&e.cancelable){e.preventDefault();onMove(e.touches[0].clientX);}},{passive:false});
  });
}
function updatePadVisuals(el){
  if(!el) return;
  updateRolePadLabels(el);
  const sx=(el.shape&&el.shape.x!=null?el.shape.x:0.7),sy=(el.shape&&el.shape.y!=null?el.shape.y:0.7);
  const tx=(el.tone&&el.tone.x!=null?el.tone.x:0.4),ty=(el.tone&&el.tone.y!=null?el.tone.y:0.2);
  const px=(el.space&&el.space.x!=null?el.space.x:0.35),py=(el.space&&el.space.y!=null?el.space.y:0.4);
  const shapeSvg=document.getElementById('xyShapeSvg');
  const toneSvg=document.getElementById('xyToneSvg');
  const spaceSvg=document.getElementById('xySpaceSvg');
  if(shapeSvg) drawShapePadSvg(shapeSvg,sx,sy);
  if(toneSvg) drawTonePadSvg(toneSvg,tx,ty);
  if(spaceSvg) drawSpacePadSvg(spaceSvg,px,py);
  const dot=(id,x,y)=>{
    const d=document.getElementById(id);
    if(!d) return;
    const pad=d.parentElement;
    const rect=pad.getBoundingClientRect();
    if(rect.width===0) return; // not yet laid out
    d.style.left=(x*100)+'%';
    d.style.top=(y*100)+'%';
  };
  const st=SOUND_TYPES[el.soundType]||SOUND_TYPES.Drone;
  const c=st.color;
  dot('dotShape',sx,sy);
  dot('dotTone',tx,ty);
  dot('dotSpace',px,py);
  ['dotShape','dotTone','dotSpace'].forEach(id=>{
    const d=document.getElementById(id);
    if(d){d.style.background=c+',0.15)';d.style.boxShadow='0 0 8px '+c+',0.4)';}
  });
}
function setupXyPad(padId,dotId,padKey){
  const pad=document.getElementById(padId);
  if(!pad) return;
  let dragging=false;
  function mv(ex,ey){
    const r=pad.getBoundingClientRect();
    const xv=Math.max(0,Math.min(1,(ex-r.left)/r.width));
    const yv=Math.max(0,Math.min(1,(ey-r.top)/r.height));
    const el=elements.find(e=>e.id===activeId);
    if(!el) return;
    if(!el[padKey]) el[padKey]={x:0.5,y:0.5};
    el[padKey].x=xv;el[padKey].y=yv;
    updatePadVisuals(el);
    updateDroneParams(el);
    const dot=document.getElementById(dotId);
    if(dot){
      const st=SOUND_TYPES[el.soundType]||SOUND_TYPES.Drone;
      const c=st.color;
      const energy=Math.sqrt(xv*xv+yv*yv)/Math.sqrt(2);
      dot.style.width=dot.style.height=(14+energy*8)+'px';
      dot.style.transform=`translate(-${7+energy*4}px,-${7+energy*4}px)`;
      dot.style.background=c+',0.3)';
      dot.style.boxShadow=`0 0 ${12+energy*20}px ${c},${0.5+energy*0.5})`;
      dot.style.borderColor=`rgba(255,255,255,${0.6+energy*0.4})`;
    }
  }
  function up(){
    dragging=false;
    const dot=document.getElementById(dotId);
    if(dot){dot.style.width=dot.style.height='13px';dot.style.transform='translate(-6.5px,-6.5px)';}
  }
  pad.addEventListener('mousedown',e=>{e.preventDefault();dragging=true;mv(e.clientX,e.clientY);});
  document.addEventListener('mousemove',e=>{if(dragging)mv(e.clientX,e.clientY);});
  document.addEventListener('mouseup',up);
  pad.addEventListener('touchstart',e=>{e.preventDefault();dragging=true;mv(e.touches[0].clientX,e.touches[0].clientY);},{passive:false});
  pad.addEventListener('touchmove',e=>{if(dragging){e.preventDefault();mv(e.touches[0].clientX,e.touches[0].clientY);}},{passive:false});
  pad.addEventListener('touchend',up);
}
let canvasDragging=null,lineStart=null,handleDrag=null,spotStart=null;
let _dragSolo = false; // true while any element is being dragged — mutes all others
function elHandlePos(el){
  if(el.visualType==='beam') return {x:el.pos*W, y:H/2};
  if(el.visualType==='neon'||el.visualType==='fold') return {x:(el.x1+el.x2)/2*W, y:(el.y1+el.y2)/2*H};
  return {x:el.x*W, y:el.y*H};
}
function getHandleHitTargets(el){
  const hits=[];
  if((el.visualType==='fold'||el.visualType==='neon')&&el.id===activeId){
    hits.push({type:'foldA', x:el.x1*W, y:el.y1*H, r:12});
    hits.push({type:'foldB', x:el.x2*W, y:el.y2*H, r:12});
  }
  if(el.visualType==='spot'&&el.id===activeId){
    const v=getVisParams(el);
    const baseReach=(100+v.revPct*2.5)*v.volPct;
    const reach=el.reachPx??baseReach;
    const a=el.angle??-Math.PI/2;
    const cw=el.coneWidth||0.3;
    const sx=el.x*W,sy=el.y*H;
    hits.push({type:'spotReach',      x:sx+Math.cos(a)*reach,         y:sy+Math.sin(a)*reach,         r:12});
    hits.push({type:'spotWidthLeft',  x:sx+Math.cos(a-cw)*reach*0.7,  y:sy+Math.sin(a-cw)*reach*0.7,  r:10});
    hits.push({type:'spotWidthRight', x:sx+Math.cos(a+cw)*reach*0.7,  y:sy+Math.sin(a+cw)*reach*0.7,  r:10});
  }
  return hits;
}
let _studioHintTimer = null;
function showStudioHints(){
  if(_liveMode) return;
  const h = document.getElementById('studioGestureHints');
  if(!h) return;
  h.style.opacity = '1'; h.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(_studioHintTimer);
  _studioHintTimer = setTimeout(hideStudioHints, 3000);
}
function hideStudioHints(){
  const h = document.getElementById('studioGestureHints');
  if(!h) return;
  h.style.opacity = '0'; h.style.transform = 'translateX(-50%) translateY(-8px)';
}

canvas.addEventListener('mousedown',e=>{
  if(_liveMode) return;
  showStudioHints();
  const rect=canvas.getBoundingClientRect();
  const mx=e.clientX-rect.left,my=e.clientY-rect.top;
  if(activeId!==null){
    const activeEl=elements.find(el=>el.id===activeId);
    if(activeEl){
      for(const h of getHandleHitTargets(activeEl)){
        if(Math.hypot(mx-h.x,my-h.y)<h.r){
          handleDrag={elId:activeEl.id,type:h.type,lastMx:mx,lastMy:my};
          return;
        }
      }
    }
  }
  for(let i=elements.length-1;i>=0;i--){
    const el=elements[i];
    const hp=elHandlePos(el);
    if(Math.hypot(mx-hp.x,my-hp.y)<25){
      activeId=el.id;
      canvasDragging={id:el.id,lastMx:mx,lastMy:my,hasMoved:false};
      _dragSolo=true;
      applyLiveSolo();
      // Don't open inspector yet — wait for mouseup to see if it was a drag or click
      renderElList();
      return;
    }
  }
  if(currentTool==='neon'||currentTool==='fold'){
    if(!lineStart){
      lineStart={x:mx/W,y:my/H};
      document.getElementById('vibeLabel').querySelector('span').textContent='— click endpoint';
      return;
    } else {
      const el=createElement(currentTool,(lineStart.x+mx/W)/2,(lineStart.y+my/H)/2,nextColor());
      el.x1=lineStart.x;el.y1=lineStart.y;el.x2=mx/W;el.y2=my/H;
      pushUndo();elements.push(el);activeId=el.id;lineStart=null;
      document.getElementById('vibeLabel').querySelector('span').textContent='— click to place';
      openInspector(el.id);renderElList();maybeStartDrone(el);return;
    }
  }
  if(currentTool==='spot'){
    if(!spotStart){
      spotStart={x:mx/W, y:my/H, step:1};
    } else if(spotStart.step===1){
      spotStart.angle=Math.atan2(my/H-spotStart.y, mx/W-spotStart.x);
      spotStart.step=2;
    } else if(spotStart.step===2){
      const clickAngle=Math.atan2(my/H-spotStart.y, mx/W-spotStart.x);
      const cw=Math.max(0.05,Math.min(0.9,Math.abs(clickAngle-spotStart.angle)/(Math.PI*0.5)));
      const el=createElement('spot',spotStart.x,spotStart.y,nextColor());
      el.angle=spotStart.angle;
      el.coneWidth=cw;
      pushUndo();elements.push(el);activeId=el.id;
      spotStart=null;
      openInspector(el.id);renderElList();maybeStartDrone(el);
    }
    return;
  }
  if(currentTool==='beam'){
    const el=createElement('beam',mx/W,my/H,nextColor());el.pos=mx/W;
    pushUndo();elements.push(el);activeId=el.id;openInspector(el.id);renderElList();maybeStartDrone(el);return;
  }
  const el=createElement(currentTool,mx/W,my/H,nextColor());
  pushUndo();elements.push(el);activeId=el.id;
  canvasDragging={id:el.id,lastMx:mx,lastMy:my,hasMoved:false};
  openInspector(el.id);renderElList();
  maybeStartDrone(el);
});
canvas.addEventListener('mousemove',e=>{
  const rect=canvas.getBoundingClientRect();
  const mx=e.clientX-rect.left,my=e.clientY-rect.top;
  if(handleDrag){
    const el=elements.find(e2=>e2.id===handleDrag.elId);
    if(el){
      const dx=(mx-handleDrag.lastMx)/W;
      const dy=(my-handleDrag.lastMy)/H;
      handleDrag.lastMx=mx;handleDrag.lastMy=my;
      if(handleDrag.type==='foldA'){
        el.x1=Math.max(0,Math.min(1,el.x1+dx));
        el.y1=Math.max(0,Math.min(1,el.y1+dy));
        el.x=(el.x1+el.x2)/2;el.y=(el.y1+el.y2)/2;
        el._foldCacheKey=null;
      } else if(handleDrag.type==='foldB'){
        el.x2=Math.max(0,Math.min(1,el.x2+dx));
        el.y2=Math.max(0,Math.min(1,el.y2+dy));
        el.x=(el.x1+el.x2)/2;el.y=(el.y1+el.y2)/2;
        el._foldCacheKey=null;
      } else if(handleDrag.type==='spotReach'){
        const sx=el.x*W,sy=el.y*H;
        const newAngle=Math.atan2(my-sy,mx-sx);
        const newReach=Math.max(20,Math.hypot(mx-sx,my-sy));
        el.angle=newAngle;
        el.reachPx=newReach;
      } else if(handleDrag.type==='spotWidthLeft'){
        const sx=el.x*W,sy=el.y*H;
        const a=el.angle??-Math.PI/2;
        const pointAngle=Math.atan2(my-sy,mx-sx);
        el.coneWidth=Math.max(0.05,Math.min(Math.PI*0.9,Math.abs(a-pointAngle)));
      } else if(handleDrag.type==='spotWidthRight'){
        const sx=el.x*W,sy=el.y*H;
        const a=el.angle??-Math.PI/2;
        const pointAngle=Math.atan2(my-sy,mx-sx);
        el.coneWidth=Math.max(0.05,Math.min(Math.PI*0.9,Math.abs(pointAngle-a)));
      }
    }
    return;
  }
  if(!canvasDragging) return;
  const el=elements.find(e2=>e2.id===canvasDragging.id);
  if(!el) return;
  const dx=(mx-canvasDragging.lastMx)/W;
  const dy=(my-canvasDragging.lastMy)/H;
  canvasDragging.lastMx=mx;canvasDragging.lastMy=my;
  canvasDragging.hasMoved=true;
  if(el.visualType==='beam'){
    el.pos=Math.max(0,Math.min(1,el.pos+dx));
    el.x=el.pos;
  } else if(el.visualType==='neon'||el.visualType==='fold'){
    el.x1=Math.max(0,Math.min(1,el.x1+dx));el.y1=Math.max(0,Math.min(1,el.y1+dy));
    el.x2=Math.max(0,Math.min(1,el.x2+dx));el.y2=Math.max(0,Math.min(1,el.y2+dy));
    el.x=(el.x1+el.x2)/2;el.y=(el.y1+el.y2)/2;
    if(el.visualType==='fold') el._foldCacheKey=null;
  } else {
    el.x=Math.max(0,Math.min(1,el.x+dx));
    el.y=Math.max(0,Math.min(1,el.y+dy));
  }
  if(el._droneNode) updateDroneParams(el);
  // Gestural filter sweep + conductor — same as liveDrag
  if(soundEnabled && audioCtx && el._droneNode?.filterNode){
    const now=audioCtx.currentTime;
    const targetFreq=120*Math.pow(14000/120,el.x);
    const yAbove=Math.max(0,0.5-el.y);
    el._droneNode.filterNode.frequency.exponentialRampToValueAtTime(Math.max(20,targetFreq),now+0.04);
    el._droneNode.filterNode.Q.linearRampToValueAtTime(0.7+yAbove*12,now+0.04);
  }
  submitConductorIntent('userGesture.studio.tension', 'tension', el.x*0.7,       CONDUCTOR_PRIORITY.userGesture, 500);
  submitConductorIntent('userGesture.studio.shimmer', 'shimmer', (1-el.y)*0.6,   CONDUCTOR_PRIORITY.userGesture, 500);
});
document.addEventListener('mouseup',(e)=>{
  // Clean click (no drag) → open inspector
  if(canvasDragging && !canvasDragging.hasMoved && activeId!==null){
    openInspector(activeId);
  }
  canvasDragging=null;handleDrag=null;_dragSolo=false;
  clearConductorIntents('userGesture.studio');
  applyLiveSolo();
});
window.addEventListener('blur',()=>{canvasDragging=null;handleDrag=null;_dragSolo=false;applyLiveSolo();});
document.addEventListener('mouseleave',()=>{if(canvasDragging||_dragSolo){canvasDragging=null;handleDrag=null;_dragSolo=false;applyLiveSolo();}});
let mousePx={x:0,y:0};
canvas.addEventListener('mousemove',e=>{
  const r=canvas.getBoundingClientRect();
  mousePx={x:e.clientX-r.left,y:e.clientY-r.top};
  showStudioHints();
  // Change cursor to pointer when over an element
  if(!_liveMode){
    const overEl = elements.some(el=>{
      if(el.muted) return false;
      const hp = elHandlePos ? elHandlePos(el) : {x:el.x*W,y:el.y*H};
      return Math.hypot(mousePx.x-hp.x, mousePx.y-hp.y) < (el.radius||0.25)*Math.min(W,H)*0.9+30;
    });
    canvas.style.cursor = overEl ? 'pointer' : 'crosshair';
  }
});
function removeElement(id){
  const el = elements.find(e => e.id === id);
  if(el) stopDrone(el);
  elements = elements.filter(e => e.id !== id);
  if(activeId === id){ activeId = null; closeInspector(); }
  renderElList();
}

function renderElList(){
  refreshSbElementLists();
  const body=document.getElementById('elListBody');
  const _elCount=document.getElementById('elCount');if(_elCount)_elCount.textContent=elements.length;
  if(!body) return; // old elListBody removed — tab lists handle rendering now
  if(!elements.length){body.innerHTML='<div style="padding:20px 10px;text-align:center;color:rgba(255,255,255,0.1);font-size:7px">Click canvas to place elements — they play immediately</div>';return;}
  body.innerHTML=elements.map(el=>{
    const st=SOUND_TYPES[el.soundType]||SOUND_TYPES.Drone;
    const c=st.color;
    const vt=VIS_TYPES[el.visualType]||VIS_TYPES.blob;
    const tm=el.triggerMode||(el.syncMode==='sync'?'step':'continuous');
    const tmClass=tm==='step'?'synced-step':tm==='phrase'?'synced-phrase':'synced-continuous';
    const tmLabel=tm==='step'?'Step':tm==='phrase'?'Phrase':'Field';
    return `<div class="el-card${el.id===activeId?' active':''}" data-id="${el.id}">
      <div class="el-card-dot" style="background:${el.color}${el.muted?';opacity:0.2':''}"></div>
      <div class="el-card-name" style="${el.muted?'text-decoration:line-through;opacity:0.3':''}">${vt.label} ${el.id}</div>
      ${el.soloed?'<span style="font-size:5.5px;color:rgba(251,191,36,0.7);margin-right:2px">S</span>':''}
      ${el.muted?'<span style="font-size:5.5px;color:rgba(255,80,80,0.5);margin-right:2px">M</span>':''}
      <div class="el-card-sync ${tmClass}">${tmLabel}</div>
      <div class="el-card-sf" style="color:${c},0.6)">${el.soundType}</div>
      <div class="el-card-vis" data-del="${el.id}">✕</div>
    </div>`;
  }).join('');
  body.querySelectorAll('.el-card').forEach(card=>{
    card.addEventListener('click',e=>{
      if(e.target.closest('[data-del]')){
        const id=+e.target.closest('[data-del]').dataset.del;
        const dEl=elements.find(e2=>e2.id===id);
        if(dEl) stopDrone(dEl);
        elements=elements.filter(e2=>e2.id!==id);
        if(activeId===id){activeId=null;closeInspector();}
        renderElList();return;
      }
      activeId=+card.dataset.id;openInspector(activeId);renderElList();
    });
  });
}
function openInspector(id){
  const el=elements.find(e=>e.id===id);if(!el) return;
  // Two-state: show Sound Settings panel
  activeId=el.id;
  showSoundPanel(el);
  populateInspector(el);
  buildDrumGrid();
  renderFieldElementList();
  updateCmdCapsule();
  // On mobile: selecting an element updates state but doesn't open overlay
  // User taps Settings in bottom nav to edit the selected element
}
function closeInspector(){
  activeId=null;
  if(window.innerWidth<=600){
    closeMobileSidebar();
    const sidebar=document.getElementById('sidebar');
    const insp=document.getElementById('inspector');
    if(sidebar&&insp&&insp.parentElement?.id==='sheetInspectorBody'){
      sidebar.appendChild(insp);
    }
    const sheet=document.getElementById('sheetInspector');
    if(sheet){
      sheet.classList.remove('open');
      setTimeout(()=>{ if(!sheet.classList.contains('open')) sheet.style.display='none'; },260);
    }
  }
  activeId=null;
  showFieldPanel();
  renderElList();
  if(typeof updateCmdCapsule==='function') updateCmdCapsule();
}
function populateInspector(el){
  const st=SOUND_TYPES[el.soundType]||SOUND_TYPES.Drone;
  const c=st.color;
  const vt=VIS_TYPES[el.visualType]||VIS_TYPES.blob;
  document.getElementById('elIcon').style.background=c+',0.12)';
  document.getElementById('elIcon').style.color=c+',0.7)';
  document.getElementById('elIcon').textContent=st.icon;
  document.getElementById('elName').textContent=vt.label+' '+el.id;
  document.getElementById('elName').style.color=c+',0.85)';
  // UI-02: voiceRole tag — shows subrole for voice instruments
  const roleTagEl=document.getElementById('elRoleTag');
  if(roleTagEl){
    const elRole=getInstrumentRole(el);
    if(elRole==='voice'){
      const subrole=VOICE_SUBROLE[el.soundType]||'voice';
      const subroleLabel={bass:'Bass',stab:'Stab',arp:'Arp',pluck:'Pluck',keys:'Keys',echoPhrase:'Echo',pitchedPerc:'Perc'}[subrole]||subrole;
      roleTagEl.textContent=subroleLabel;
      roleTagEl.style.display='inline-block';
    } else {
      roleTagEl.style.display='none';
    }
  }
  document.getElementById('vtGrid').querySelectorAll('.abtn').forEach(b=>{
    const a=b.dataset.vt===el.visualType;
    b.classList.toggle('active',a);
    b.style.background=a?c+',0.1)':'';
    b.style.borderColor=a?c+',0.25)':'';
    b.style.color=a?c+',0.85)':'';
  });
  // W3: auto-jump to the role tab matching this element
  _activeRoleTab = getInstrumentRole(el);
  buildSoundTypes(el,c);
  document.getElementById('noteDisplay').textContent=el.note||'A3';
  document.getElementById('noteDisplay').style.color=c+',0.85)';
  const muteBtn=document.getElementById('muteBtn'),soloBtn=document.getElementById('soloBtn');
  muteBtn.classList.toggle('active-mute',!!el.muted);
  soloBtn.classList.toggle('active-solo',!!el.soloed);
  const volPct=el.volume??0.75;
  document.getElementById('volFill').style.height=(volPct*100)+'%';
  document.getElementById('volFill').style.background=c+',0.18)';
  document.getElementById('volThumb').style.bottom=Math.max(0,volPct*100-4)+'%';
  document.getElementById('volVal').textContent=Math.round(volPct*100)+'%';
  const panVal=(el.pan||0);
  const panPct=panVal/2+0.5;
  document.getElementById('panFill').style.height=(panPct*100)+'%';
  document.getElementById('panThumb').style.bottom=Math.max(0,panPct*100-4)+'%';
  document.getElementById('panVal').textContent=panPct<0.47?Math.round((0.5-panPct)*200)+'L':panPct>0.53?Math.round((panPct-0.5)*200)+'R':'C';
  setTimeout(()=>updatePadVisuals(el),30);
}
// W4: Instruments with their own sequencer logic — excluded from generic drone retrigger
const GENERIC_RETRIGGER_EXCLUDE = new Set([
  'Pulse','Ring','Sub','Conga','SFX','Echo',
  'Laser','Pluck','Arp','EP','FM3','FMStab','Acid'
]);

// ── W6: Secondary Percussion Sequencer ───────────────────────────────────────
// Derives interlocking 16-step patterns for rhythm-role canvas instruments
// (Conga, Ring/MetalPerc, SFX/Shutter, SFX/Zap, Noise/SnareTex, Phys/Tabla, Phys/WoodBody)
// Patterns are generated from kick/clap positions and evolve at phrase boundaries.

// Per-style density for secondary perc (0=very sparse, 1=dense)
const SEC_PERC_DENSITY = {
  house:      0.55, techno:     0.45, italo:      0.60,
  garage:     0.65, dnb:        0.70, trance:     0.40,
  hiphop:     0.60, dub:        0.50, ambient:    0.25,
  hardcore:   0.75, hardtechno: 0.70, electronica:0.45,
};

// Generate a 16-step pattern for a secondary perc element
// Returns array of 16 values: 0=silent, 0.01–1.0=velocity
function getSecondaryPercPattern(el, drumPat, density, phraseBar) {
  const v = el.variation ?? 0;
  const stype = el.soundType;
  const varName = SOUND_TYPES[stype]?.vars?.[v]?.name || '';
  const kick = drumPat.kick  || Array(16).fill(0);
  const clap = drumPat.clap  || Array(16).fill(0);
  const pat  = Array(16).fill(0);

  // Seed random consistently per element + phraseBar so pattern holds for 8 bars
  const seed = (el.id * 1000 + phraseBar) | 0;
  const rng = (i) => { const x = Math.sin(seed * 9301 + i * 49297) * 0.5 + 0.5; return x - Math.floor(x); };

  if (stype === 'Conga' || varName === 'Tabla' || varName === 'Wood Body') {
    // Classic counter-rhythm: land on upbeats, avoid kick, answer clap
    const baseSteps = v === 0 ? [2,6,10,14]         // Conga: on-the-2
                    : v === 1 ? [1,5,9,13]           // Bongo: tight offbeat
                    : v === 2 ? [3,7,11,15]           // Tabla: delayed offbeat
                    : v === 4 ? [0,2,4,6,8,10,12,14]  // Claves: steady 8th-note pulse
                    :           [2,4,10,14];           // Rim: syncopated
    baseSteps.forEach(s => {
      if (v === 4) {
        // Claves: steady 8th-note pulse — lower velocity, higher fire probability
        // Skip kick steps only; claves ride over everything else
        if (!kick[s] && rng(s + 100) < Math.min(1, density * 1.4)) {
          pat[s] = 0.42 + rng(s) * 0.18; // quieter than conga — sits behind the beat
        }
      } else {
        if (!kick[s]) {
          const vel = (s === 2 || s === 10) ? 0.9 + rng(s) * 0.1 : 0.55 + rng(s) * 0.3;
          if (rng(s + 100) < density) pat[s] = vel;
        }
      }
    });
    // Answer clap: add ghost one step before clap positions (not for Claves)
    if (v !== 4) {
      clap.forEach((c, i) => {
        if (c && i > 0 && !kick[i-1] && !pat[i-1] && rng(i + 200) < density * 0.6)
          pat[i-1] = 0.45 + rng(i) * 0.2;
      });
    }
  }
  else if (varName === 'Metal Perc') {
    // Sparse metallic: avoid kick and clap, sit in the holes
    const candidates = [2,3,6,7,10,11,14,15];
    candidates.forEach(s => {
      if (!kick[s] && !clap[s] && rng(s + 300) < density * 0.55)
        pat[s] = 0.40 + rng(s) * 0.25;
    });
  }
  else if (varName === 'Snare Tex') {
    // Layer with / just before clap: ghost snare texture
    clap.forEach((c, i) => {
      if (c && rng(i + 400) < 0.85) pat[i] = 0.30 + rng(i) * 0.20;      // on clap
      if (c && i > 0 && rng(i + 401) < density * 0.5) pat[i-1] = 0.15 + rng(i) * 0.15; // ghost before
    });
    // Extra ghost rolls at high density
    if (density > 0.55) {
      [3,7,11].forEach(s => {
        if (!kick[s] && !clap[s] && rng(s + 450) < (density - 0.4))
          pat[s] = 0.12 + rng(s) * 0.10;
      });
    }
  }
  else if (varName === 'Shutter' || varName === 'Zap') {
    // Glitch perc: sparse, probabilistic, avoid downbeats
    [1,3,5,7,9,11,13,15].forEach(s => {
      if (!kick[s] && rng(s + 500) < density * 0.4)
        pat[s] = 0.50 + rng(s) * 0.35;
    });
    // Occasional fill burst: cluster 2 steps near a clap
    clap.forEach((c, i) => {
      if (c && rng(i + 550) < density * 0.35 && i + 1 < 16 && !kick[i+1])
        pat[i+1] = 0.60 + rng(i) * 0.25;
    });
  }
  else {
    // Generic fallback: sparse offbeat pattern
    [2,6,10,14].forEach(s => {
      if (!kick[s] && rng(s + 600) < density * 0.5)
        pat[s] = 0.50 + rng(s) * 0.30;
    });
  }

  return pat;
}

// Per-element pattern cache: { pattern, phraseBar }

// Per-genre phrase length for secondary perc pattern regeneration
const SEC_PERC_PHRASE_LENGTH = {
  deephouse:8, techhouse:8, detroittechno:8, minimaltechno:8,
  dubtechno:16, dnb:4, ambienttechno:32, trance:8,
  hardcore:4, hardtechno:4, italo:8, downtempo:16,
  electronica:16, garage:8, hiphop:8,
};

// Get or generate pattern for element — additive DFAM-style fill logic.
// Starts sparse, adds one hit per phrase until full density, then resets.
// This makes patterns feel performed rather than randomly generated.
function getOrBuildSecPercPattern(el, drumPat, density, bar) {
  const phraseLen = SEC_PERC_PHRASE_LENGTH[activeDrumStyle] ?? 8;
  const phraseBar = Math.floor(bar / phraseLen);
  const key = el.id;
  const cached = _secPercCache.get(key);

  if (cached && cached.phraseBar === phraseBar) return cached.pattern;

  if (!cached) {
    // First time: build a sparse seed pattern (half density)
    const sparsePat = getSecondaryPercPattern(el, drumPat, density * 0.45, phraseBar);
    _secPercCache.set(key, { pattern: sparsePat, phraseBar, fillCount: 0, maxFills: Math.floor(density * 5 + 1) });
    return sparsePat;
  }

  // New phrase boundary: additive fill
  const prev = cached;
  const maxFills = prev.maxFills ?? Math.floor(density * 5 + 1);

  if (prev.fillCount < maxFills) {
    // Add one hit to the existing pattern — find a good empty slot
    const newPat = [...prev.pattern];
    const kick = drumPat.kick || Array(16).fill(0);
    // Candidate slots: non-downbeat, not already active, not on kick
    const candidates = [];
    for (let i = 1; i < 16; i++) {
      if (!newPat[i] && !kick[i] && i % 4 !== 0) candidates.push(i);
    }
    if (candidates.length) {
      // Pick the candidate that creates the best counter-rhythm (furthest from existing hits)
      const best = candidates.reduce((bestIdx, s) => {
        const minDist = newPat.reduce((d, v, i) => v ? Math.min(d, Math.abs(i - s)) : d, 16);
        const bestDist = newPat.reduce((d, v, i) => v ? Math.min(d, Math.abs(i - bestIdx)) : d, 16);
        return minDist > bestDist ? s : bestIdx;
      }, candidates[0]);
      newPat[best] = 0.5 + Math.random() * 0.3;
    }
    _secPercCache.set(key, { pattern: newPat, phraseBar, fillCount: prev.fillCount + 1, maxFills });
    return newPat;
  } else {
    // Reached max fills — reset to sparse and start again (cycle)
    const sparsePat = getSecondaryPercPattern(el, drumPat, density * 0.40, phraseBar);
    _secPercCache.set(key, { pattern: sparsePat, phraseBar, fillCount: 0, maxFills });
    return sparsePat;
  }
}

// Tick one step for a secondary perc element
// Polymeter lengths for hypnotic phase-shifting — assigned per element on first use
// Against the 4/4 16-step grid, a 5-step pattern completes every 80 steps (5 bars),
// a 7-step pattern every 112 steps, an 11-step pattern every 176 steps.
// The groove never repeats the same way twice.
const POLY_LENGTHS = [5, 7, 11]; // Wire Fest modular feel
const POLY_GENRES  = new Set(['detroittechno','minimaltechno','dubtechno','hardtechno','techhouse','ambienttechno']);

function getPolyStep(el, beatStep, bar){
  // Assign a polymeter length to this element if it doesn't have one
  if(!el._polyLen){
    // Deterministic but varied — based on element id so each element gets different length
    el._polyLen   = POLY_LENGTHS[el.id % POLY_LENGTHS.length];
    el._polyPhase = (el.id * 3) % el._polyLen; // offset phase so elements don't all align at bar 0
  }
  // Absolute step count across bars
  const absStep = bar * 16 + beatStep;
  return (absStep + el._polyPhase) % el._polyLen;
}

function tickSecondaryPerc(el, beatStep, t, drumPat, bar) {
  const density = SEC_PERC_DENSITY[activeDrumStyle] ?? 0.5;

  // Polymeter mode for hypnotic genres — element loops on its own step length
  const usePolymeter = POLY_GENRES.has(activeDrumStyle) || POLY_GENRES.has(currentStyle);
  let effectiveBeatStep = beatStep;
  let pattern;

  if(usePolymeter && el._polyLen){
    // Use polymetric step — reads from a pattern of length _polyLen
    const polyStep = getPolyStep(el, beatStep, bar);
    // Build a poly-length pattern if needed (or reuse)
    if(!el._polyPattern || el._polyPattern.length !== el._polyLen){
      el._polyPattern = buildPolyPattern(el, el._polyLen, density);
    }
    const vel = el._polyPattern[polyStep];
    if(!vel) return;
    firSecPercHit(el, t, vel);
    return;
  }

  // Standard 16-step mode
  pattern = getOrBuildSecPercPattern(el, drumPat, density, bar);
  const vel = pattern[beatStep];
  if (!vel) return;
  firSecPercHit(el, t, vel);
}


function firSecPercHit(el, t, vel){
  const stype = el.soundType;
  const varName = SOUND_TYPES[stype]?.vars?.[el.variation ?? 0]?.name || '';
  const tightness = DRUM_TIGHTNESS[activeDrumStyle] ?? 1.0;
  const humanVel = vel * (0.85 + Math.random() * 0.15);

  if (stype === 'Conga') {
    scheduleCongaNote({...el, volume: (el.volume ?? 0.65) * humanVel}, t);
  } else if (stype === 'Ring') {
    scheduleRingOneShot({...el, volume: (el.volume ?? 0.65) * humanVel}, t);
  } else if (stype === 'SFX') {
    scheduleSFXBurst(el, t, humanVel);
  } else if (stype === 'Noise' && varName === 'Snare Tex') {
    scheduleSnareTexBurst(el, t, humanVel, tightness);
  } else if (stype === 'Phys') {
    schedulePhysPercBurst(el, t, humanVel);
  }

  el._pulse = humanVel * 0.9;
  el._flashPulse = humanVel * 0.7;
}

// SFX burst: short noise transient for Shutter/Zap

// Snare Tex burst: layered noise for ghost snare texture

// Phys perc burst: simple pitched hit for Tabla/Wood Body
// ── W9: Voice Phrase / Motif Engine ──────────────────────────────────────────
// Gives Sub, Acid, Pulse, EP, FM3, FMStab, Pluck, Ring(voice), Phys(voice), Echo
// a shared phrase context: motif memory, register separation, 8-bar mutation,
// call-and-response awareness, and atmosphere-density scaling.

// Voice subrole by soundType — determines register + phrase behaviour
const VOICE_SUBROLE = {
  Sub:    'bass',
  Acid:   'bass',
  Pulse:  'stab',
  FMStab: 'stab',
  Arp:    'arp',
  Pluck:  'pluck',
  EP:     'keys',
  FM3:    'keys',
  Echo:   'echoPhrase',
  Ring:   'pitchedPerc',   // voice variants only
  Phys:   'pitchedPerc',   // voice variants only (Steel Drum, Glass Bar)
};

// Register (octave range) per subrole — prevents bass/melody collision
const VOICE_REGISTER = {
  bass:       { min: 1, max: 2 },
  stab:       { min: 3, max: 4 },
  arp:        { min: 3, max: 5 },
  pluck:      { min: 3, max: 5 },
  keys:       { min: 3, max: 4 },
  echoPhrase: { min: 3, max: 5 },
  pitchedPerc:{ min: 3, max: 5 },
};

// Per-style contour shape weights — changes how melodies *feel* per genre

// ─── GENRE MELODY RULES ───────────────────────────────────────────────────────
// Controls how melodic voice phrases are built per genre.
// repeatBias: probability of repeating the current note vs moving (0=always move, 1=never move)
// restBias:   extra probability of resting on non-downbeats (stacks on top of density)
// maxLeap:    maximum scale-degree jump allowed between consecutive notes
// octaveRange:how many octaves the melody can span (tighter = more cohesive)
// allowedContours: which contour shapes are permitted (null = use GENRE_CONTOUR_WEIGHTS)

// ─── GENRE LAYER LIMITS ───────────────────────────────────────────────────────
// When generating a live scene, limit how many instruments are active simultaneously.
// Fewer, stronger roles sound more composed than dense walls of sound.


// ─── MELODIC ANCHOR / SIGNATURE INTERVAL ─────────────────────────────────────
// One interval per genre that keeps returning across the session.
// This is the thing you can almost hum — the identity of the set.
// Not a full melody. Just a two or three note relationship that recurs.
//
// Format: array of scale-step offsets (scale-index, not semitones).
// e.g. [0,5,3] = root note, +5 scale steps up, +3 scale steps up.
// Applied as gravity — accented notes get pulled toward nearest signature step.
//

// Session-level signature — set once per Generate/Live start, persists across phrase boundaries



// Apply signature gravity to a voice motif step —
// with probability returnBias, nudge the note toward the nearest signature interval

// Weave signature into the arp hook — the hook picks from signature intervals
// when building its note choices. Called from buildArpPattern.

function pickWeightedContour(style, rngVal) {
  const w = GENRE_CONTOUR_WEIGHTS[style] || GENRE_CONTOUR_WEIGHTS.deephouse;
  const keys = ['repeat','rise','fall','arch','question'];
  const total = keys.reduce((s,k) => s + (w[k]||0), 0);
  let acc = 0;
  for (const k of keys) { acc += (w[k]||0) / total; if (rngVal < acc) return k; }
  return 'arch';
}

// Per-style phrase density (note density within a 16-step motif)

// Motif store: el.id → { steps: [{midi,rest,vel,accent}], phraseBar, mutCount }

// Build a fresh motif for a voice element

// Get or build motif — 80/15/5 memory rule:
//   80% keep the existing motif intact
//   15% apply a small variation (mutate 1-2 steps)
//   5%  build a completely new phrase
// Motif anchors at 8-bar phrase boundaries. Between boundaries, it is stable.

// Apply a single small variation to an existing motif without rebuilding it

// Mutate one step of an existing motif (called at 16-bar boundary)

// Transposes motif anchor note when chord changes

// Get the voice step for the current beatStep — used in scheduler

// Clear voice motif cache on style/chord changes

// ── ECHO-01: Phrase-aware Echo scheduling ────────────────────────────────────
// Replaces mechanical fixed-step firing with musically intentional throws.
// Echo fires as: dub throws at phrase tails, section punctuation at resets,
// and rhythmic flutter for variation 3. All other steps are silent.


// ── W2: Instrument Role Registry ─────────────────────────────────────────────
// Maps every soundType to primaryRole: 'rhythm' | 'voice' | 'atmosphere'
// Variant-level overrides for mixed types (Ring, Phys, SFX, Noise)
// DATA-02: Target role ratios per genre — used by Generate + Live scene building

// getRecipeRole: variant-aware role for arrangement recipe entries (Ring/Metal Perc = rhythm, etc.)
function getRecipeRole(recipe) {
  const def = INSTRUMENT_ROLE_REGISTRY[recipe.soundType];
  if (!def) return 'atmosphere';
  const varName = SOUND_TYPES[recipe.soundType]?.vars?.[recipe.variation ?? 0]?.name || '';
  return def.variantRoles?.[varName] || def.primaryRole;
}

// Balance a selected arrangement slice toward the genre's role targets
// Uses variant-aware role counting via getRecipeRole
function balanceRolesForGenre(selectedArr, style) {
  const balance = GENRE_ROLE_BALANCE[style] || { rhythm:0.15, voice:0.45, atmosphere:0.40 };
  const n = selectedArr.length;
  if (n < 2) return selectedArr;

  const counts = { rhythm:0, voice:0, atmosphere:0 };
  selectedArr.forEach(r => {
    const role = getRecipeRole(r);
    counts[role] = (counts[role]||0) + 1;
  });

  const fullArr = (typeof STYLES !== 'undefined' ? (STYLES[style]?.arrangement||[]) : []);

  for (const [excessRole, targetRole] of [
    ['atmosphere','voice'],
    ['atmosphere','rhythm'],
    ['rhythm','voice'],
    ['rhythm','atmosphere'],
    ['voice','rhythm'],
  ]) {
    const target = Math.round(balance[excessRole] * n);
    if (counts[excessRole] - target <= 1) continue;

    const excessItems = selectedArr.filter(r => getRecipeRole(r) === excessRole && !r._required);
    const needItems = fullArr.filter(r => {
      return getRecipeRole(r) === targetRole &&
             !selectedArr.some(s => s.soundType === r.soundType && (s.variation??0) === (r.variation??0));
    });

    if (excessItems.length && needItems.length) {
      const idx = selectedArr.indexOf(excessItems[0]);
      selectedArr[idx] = needItems[0];
      counts[excessRole]--;
      counts[targetRole]++;
      break;
    }
  }

  return selectedArr;
}


// Tab groupings — by musical feel, not just registry role

function getInstrumentRole(el) {
  const def = INSTRUMENT_ROLE_REGISTRY[el.soundType];
  if (!def) return 'atmosphere';
  if (def.variantRoles) {
    const varName = SOUND_TYPES[el.soundType]?.vars?.[el.variation ?? 0]?.name || '';
    if (def.variantRoles[varName]) return def.variantRoles[varName];
  }
  return def.primaryRole;
}

// ARCH-02: Trigger mode — HOW an instrument fires, derived from role + type
// step       = beat-grid sequenced (rhythm)
// phrase     = fires at musical phrase points (voices + atmospheric sweeps)
// continuous = sustained field, starts once and runs (atmosphere drones/pads)
function getInstrumentTriggerMode(el) {
  const role = getInstrumentRole(el);
  const type = el.soundType;
  const varName = SOUND_TYPES[type]?.vars?.[el.variation ?? 0]?.name || '';

  if (role === 'rhythm') return 'step';
  if (role === 'voice')  return 'phrase';

  // Atmosphere: most continuous, but sweeps/gestures are phrase-event driven
  if (role === 'atmosphere') {
    if (type === 'Laser') return 'phrase';
    if (type === 'SFX') {
      if (varName === 'Riser' || varName === 'Siren' || varName === 'UFO') return 'phrase';
      return 'continuous'; // Vinyl, Shutter (rhythm handled above) → texture field
    }
    if (type === 'Ring' && varName === 'Gong') return 'phrase';
    if (type === 'Noise' && varName === 'Riser') return 'phrase';
    return 'continuous';
  }

  return 'continuous';
}

// Sets el.syncMode and el.triggerMode from role — replaces SYNC_DEFAULTS lookup
function applyRoleAndTriggerMode(el) {
  const mode = getInstrumentTriggerMode(el);
  el.triggerMode = mode;
  el.syncMode = (mode === 'continuous') ? 'free' : 'sync';
}

// Role-based menu groupings for W3
// W3: active role tab state — remembers last selected tab per session
let _activeRoleTab = null;

function _getRoleTabForEl(el) {
  return getInstrumentRole(el);
}

function buildSoundTypes(el, cAccent) {
  const ind = document.getElementById('syncIndicator');
  if (ind) {
    const tm = el.triggerMode || getInstrumentTriggerMode(el);
    const tmLabels = {
      step:       { text:'● sequenced',   color:'rgba(255,100,100,0.7)' },
      phrase:     { text:'◈ phrase',       color:'rgba(72,202,228,0.7)' },
      continuous: { text:'◉ continuous',   color:'rgba(126,232,162,0.6)' },
    };
    const lbl = tmLabels[tm] || tmLabels.continuous;
    ind.textContent = lbl.text;
    ind.style.color = lbl.color;
  }

  // Default tab to the active element's role if not already set
  if (!_activeRoleTab) _activeRoleTab = _getRoleTabForEl(el);

  _renderRoleTabs(el);
  _renderSoundGrid(el, _activeRoleTab);
  buildVariations(el);
}

function _renderRoleTabs(el) {
  const tabsEl = document.getElementById('roleTabs');
  if (!tabsEl) return;
  tabsEl.querySelectorAll('.role-tab').forEach(tab => {
    const role = tab.dataset.role;
    tab.className = 'role-tab' + (role === _activeRoleTab ? ` active-${role}` : '');
    tab.onclick = () => {
      _activeRoleTab = role;
      _renderRoleTabs(el);
      const el2 = elements.find(e => e.id === activeId) || el;
      _renderSoundGrid(el2, role);
    };
  });
}

function _renderSoundGrid(el, role) {
  const container = document.getElementById('soundTypes');
  if (!container) return;
  const roleDef = ROLE_MENU[role];
  if (!roleDef) return;

  let html = '';

  roleDef.groups.forEach(group => {
    // For mixed types (Ring, Phys, SFX, Noise), only show variants belonging to this role
    // Build a flat list of { soundType, varIdx, varName, st } for this group
    const items = [];
    group.types.forEach(typeName => {
      const st = SOUND_TYPES[typeName];
      if (!st) return;
      const def = INSTRUMENT_ROLE_REGISTRY[typeName];
      if (!def) return;

      if (def.variantRoles) {
        // Mixed type — only include variants that match this role
        st.vars.forEach((v, i) => {
          const vRole = def.variantRoles[v.name] || def.primaryRole;
          if (vRole === role) items.push({ soundType: typeName, varIdx: i, varName: v.name, st });
        });
      } else {
        // Whole type belongs to this role — show as single button (varIdx: -1 means "any")
        items.push({ soundType: typeName, varIdx: -1, varName: null, st });
      }
    });

    if (!items.length) return;

    html += `<div class="role-group-label">${group.label}</div>`;
    html += items.map(item => {
      const { soundType, varIdx, varName, st } = item;
      const isActive = varIdx === -1
        ? el.soundType === soundType
        : el.soundType === soundType && (el.variation ?? 0) === varIdx;
      const c = st.color;
      const displayName = varIdx === -1 ? soundType : varName;
      const displaySub  = varIdx === -1 ? st.sub : soundType;
      return `<div class="stype-btn${isActive ? ' active' : ''}" data-stype="${soundType}" data-varidx="${varIdx}" style="${isActive ? `border-color:${c},0.4);background:${c},0.08);color:${c},0.9)` : ''}">` +
        `<div class="stype-name">${displayName}</div>` +
        `<div class="stype-sub">${displaySub}</div>` +
        `</div>`;
    }).join('');
  });

  container.innerHTML = html;

  container.querySelectorAll('.stype-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const el2 = elements.find(e => e.id === activeId); if (!el2) return;
      const newType = btn.dataset.stype;
      const varIdx  = parseInt(btn.dataset.varidx, 10);
      el2.soundType = newType;
      el2.variation = varIdx >= 0 ? varIdx : 0;
      applyPreset(el2);
      const prevTrigger = el2.triggerMode;
      applyRoleAndTriggerMode(el2);
      if (el2.triggerMode !== prevTrigger || !el2._droneNode) {
        if (el2.triggerMode === 'continuous') {
          stopDrone(el2);
          setTimeout(() => startDrone(el2), 50);
        } else {
          stopDrone(el2);
          if (beatEnabled) startDrone(el2);
        }
      } else {
        restartDrone(el2);
      }
      populateInspector(el2); renderElList();
    });
  });
}
function buildVariations(el){
  const st=SOUND_TYPES[el.soundType]||SOUND_TYPES.Drone;
  const c=st.color;
  const container=document.getElementById('varDots');
  const labelEl=document.getElementById('varLabel');
  const varDef=st.vars[el.variation||0];
  labelEl.textContent=''; // name now shown in chip
  labelEl.style.color=c+',0.6)';
  // Replace dots with labeled chips
  container.style.cssText='display:flex;flex-wrap:wrap;gap:5px;padding:2px 0';
  container.innerHTML=st.vars.map((v,i)=>{
    const isActive=(el.variation||0)===i;
    const def = INSTRUMENT_ROLE_REGISTRY[el.soundType];
    const varRole = def?.variantRoles?.[v.name];
    const roleColor = varRole==='rhythm'?'rgba(255,100,100,0.7)':varRole==='voice'?'rgba(72,202,228,0.7)':'rgba(181,131,141,0.7)';
    return `<div class="var-chip${isActive?' active':''}" data-var="${i}"
      style="padding:5px 10px;border-radius:4px;border:1px solid ${isActive?c+',0.45)':'rgba(255,255,255,0.1)'};
      background:${isActive?c+',0.12)':'rgba(255,255,255,0.03)'};
      color:${isActive?c+',0.95)':'rgba(255,255,255,0.5)'};
      font-size:8.5px;font-weight:${isActive?'600':'400'};cursor:pointer;transition:all .12s;
      font-family:inherit;letter-spacing:.02em;white-space:nowrap"
      title="${v.name}">${v.name}${varRole?`<span style="font-size:6px;margin-left:3px;color:${roleColor}">${varRole==='rhythm'?'R':varRole==='voice'?'V':'A'}</span>`:''}</div>`;
  }).join('');
  container.querySelectorAll('.var-chip').forEach(dot=>{
    dot.addEventListener('click',()=>{
      const el2=elements.find(e=>e.id===activeId);if(!el2) return;
      el2.variation=+dot.dataset.var;
      applyPreset(el2);
      const prevTrigger=el2.triggerMode;
      applyRoleAndTriggerMode(el2); // ARCH-03: recompute role+mode on variation change
      if(el2.triggerMode!==prevTrigger||!el2._droneNode){
        if(el2.triggerMode==='continuous'){
          stopDrone(el2);
          setTimeout(()=>startDrone(el2),50);
        } else {
          stopDrone(el2);
          if(beatEnabled) startDrone(el2);
        }
      } else {
        restartDrone(el2);
      }
      buildVariations(el2);
      populateInspector(el2);
      setTimeout(()=>updatePadVisuals(el2),30);
    });
  });
}
function buildDrumGrid(){
  const grid=document.getElementById('drumGrid');
  const voices=['kick','clap','snap','hihat','openhh','perc'];
  const labels=['Kick','Clap','Snap','HH','OH','Perc'];
  const colors=['rgba(255,80,80','rgba(255,200,80','rgba(255,140,180','rgba(180,220,255','rgba(120,200,255','rgba(200,160,255'];
  grid.innerHTML='';
  voices.forEach((voice,vi)=>{
    // Defensive: any voice missing from drumPattern gets initialized as empty
    if(!drumPattern[voice]) drumPattern[voice] = Array(16).fill(0);
    const lbl=document.createElement('div');
    lbl.className='drum-label';lbl.style.color=colors[vi]+',0.5)';lbl.textContent=labels[vi];
    grid.appendChild(lbl);
    for(let s=0;s<16;s++){
      const cell=document.createElement('div');
      cell.className='drum-cell'+(drumPattern[voice][s]?' on':'')+(s%4===0?' beat':'');
      cell.dataset.voice=voice;cell.dataset.step=s;
      if(drumPattern[voice][s]) cell.style.background=colors[vi]+',0.15)';
      cell.addEventListener('click',()=>{
        drumPattern[voice][s]=drumPattern[voice][s]?0:1;
        cell.classList.toggle('on');
        cell.style.background=drumPattern[voice][s]?colors[vi]+',0.15)':'';
      });
      grid.appendChild(cell);
    }
  });
  const presetRow=document.getElementById('drumPresets');
  if(presetRow){
  presetRow.innerHTML=DRUM_PRESETS.map((p,i)=>`<div class="drum-preset${i===activeDrumPreset?' active':''}" data-dpi="${i}">${p.name}</div>`).join('');
  presetRow.querySelectorAll('.drum-preset').forEach(btn=>{
    btn.addEventListener('click',()=>{
      activeDrumPreset=+btn.dataset.dpi;
      const p=DRUM_PRESETS[activeDrumPreset];
      drumPattern.kick=[...p.kick];drumPattern.clap=[...p.clap];
      drumPattern.hihat=[...p.hihat];drumPattern.openhh=[...p.openhh];drumPattern.perc=[...p.perc];
      drumPattern.snap=[...(p.snap||Array(16).fill(0))];
      activeDrumStyle=p.drumStyle||'house'; updateDrumGain(); updateDrumSends(); clearVoiceMotifCache();
      buildDrumGrid();showToast(p.name);
    });
  });
  } // end if(presetRow)
}
(function(){
  const t=document.getElementById('volTrack');if(!t)return;
  let d=false;
  function mv(cx,cy){
    const r=t.getBoundingClientRect();
    const horiz=r.width>r.height;
    const pct=horiz?Math.max(0,Math.min(1,(cx-r.left)/r.width)):Math.max(0,Math.min(1,1-(cy-r.top)/r.height));
    if(horiz){
      document.getElementById('volFill').style.width=(pct*100)+'%';
      document.getElementById('volFill').style.height='100%';
      document.getElementById('volThumb').style.left=(pct*100)+'%';
      document.getElementById('volThumb').style.bottom='auto';
    } else {
      document.getElementById('volFill').style.height=(pct*100)+'%';
      document.getElementById('volThumb').style.bottom=Math.max(0,pct*100-4)+'%';
    }
    document.getElementById('volVal').textContent=Math.round(pct*100)+'%';
    const el=elements.find(e=>e.id===activeId);if(el){el.volume=pct;updateDroneParams(el);}
  }
  t.addEventListener('mousedown',e=>{d=true;mv(e.clientX,e.clientY);});
  document.addEventListener('mousemove',e=>{if(d)mv(e.clientX,e.clientY);});
  document.addEventListener('mouseup',()=>{d=false;});
  t.addEventListener('touchstart',e=>{e.preventDefault();d=true;mv(e.touches[0].clientX,e.touches[0].clientY);},{passive:false});
  t.addEventListener('touchmove',e=>{if(d){e.preventDefault();mv(e.touches[0].clientX,e.touches[0].clientY);}},{passive:false});
  t.addEventListener('touchend',()=>{d=false;});
})();
(function(){
  const t=document.getElementById('panTrack');if(!t)return;
  let d=false;
  function mv(cx,cy){
    const r=t.getBoundingClientRect();
    const horiz=r.width>r.height;
    const raw=horiz?(cx-r.left)/r.width:1-(cy-r.top)/r.height;
    const pct=Math.max(0,Math.min(1,raw));
    const panVal=(pct-0.5)*2;
    if(horiz){
      document.getElementById('panFill').style.width=(pct*100)+'%';
      document.getElementById('panFill').style.height='100%';
      document.getElementById('panThumb').style.left=(pct*100)+'%';
      document.getElementById('panThumb').style.bottom='auto';
    } else {
      document.getElementById('panFill').style.height=(pct*100)+'%';
      document.getElementById('panThumb').style.bottom=Math.max(0,pct*100-4)+'%';
    }
    document.getElementById('panVal').textContent=pct<0.47?Math.round((0.5-pct)*200)+'L':pct>0.53?Math.round((pct-0.5)*200)+'R':'C';
    const el=elements.find(e=>e.id===activeId);if(el){el.pan=panVal;updateDroneParams(el);}
  }
  t.addEventListener('mousedown',e=>{d=true;mv(e.clientX,e.clientY);});
  document.addEventListener('mousemove',e=>{if(d)mv(e.clientX,e.clientY);});
  document.addEventListener('mouseup',()=>{d=false;});
  t.addEventListener('touchstart',e=>{e.preventDefault();d=true;mv(e.touches[0].clientX,e.touches[0].clientY);},{passive:false});
  t.addEventListener('touchmove',e=>{if(d){e.preventDefault();mv(e.touches[0].clientX,e.touches[0].clientY);}},{passive:false});
  t.addEventListener('touchend',()=>{d=false;});
})();
setupXyPad('xyShape','dotShape','shape');
setupXyPad('xyTone','dotTone','tone');
setupXyPad('xySpace','dotSpace','space');
document.querySelectorAll('.tool-btn[data-tool]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    currentTool=btn.dataset.tool;
    document.querySelectorAll('.tool-btn').forEach(b=>b.classList.toggle('active',b===btn));
    // Sync place buttons in sidebar
    document.querySelectorAll('.sb-place-btn').forEach(b=>b.classList.toggle('active',b.dataset.vt===btn.dataset.tool));
    lineStart=null;
    spotStart=null;
    if(currentTool!=='blob'){
      activeId=null;
      if(activeId){activeId=null;showFieldPanel();}
    }
  });
});
document.getElementById('elDice').addEventListener('click',()=>{
  const el=elements.find(e=>e.id===activeId);if(!el) return;
  pushUndo();
  smartRandomizeElement(el);
  restartDrone(el);
  populateInspector(el);renderElList();
  showToast('Randomized '+el.soundType);
});
document.getElementById('elClose').addEventListener('click',closeInspector);
document.getElementById('muteBtn').addEventListener('click',()=>{
  const el=elements.find(e=>e.id===activeId);if(!el) return;
  el.muted=!el.muted;
  if(el.muted) stopDrone(el);
  else maybeStartDrone(el);
  populateInspector(el);renderElList();
});
document.getElementById('soloBtn').addEventListener('click',()=>{
  const el=elements.find(e=>e.id===activeId);if(!el) return;
  el.soloed=!el.soloed;
  const anySoloed=elements.some(e=>e.soloed);
  elements.forEach(e2=>{
    if(anySoloed&&!e2.soloed&&!e2.muted){
      if(e2._droneNode) stopDrone(e2);
    } else if(!anySoloed&&!e2.muted){
      if(!e2._droneNode) maybeStartDrone(e2);
    } else if(e2.soloed&&!e2.muted){
      if(!e2._droneNode) maybeStartDrone(e2);
    }
  });
  populateInspector(el);renderElList();
});
document.getElementById('vtGrid').addEventListener('click',e=>{
  const btn=e.target.closest('.abtn');if(!btn) return;
  const el=elements.find(e2=>e2.id===activeId);
  if(el){pushUndo();el.visualType=btn.dataset.vt;populateInspector(el);renderElList();}
});
document.getElementById('noteDisplay').addEventListener('click',()=>{
  const el=elements.find(e=>e.id===activeId);if(!el) return;
  el.note=cycleNote(el.note||'A3');
  document.getElementById('noteDisplay').textContent=el.note;
  if(el._droneNode&&audioCtx){
    const newFreq=midiToFreq(noteToMidi(el.note));
    const now=audioCtx.currentTime;
    const glideTime=0.08; // short portamento
    el._droneNode.oscs.forEach(o=>{
      try{
        if(o.frequency&&o.frequency.value>10){
          const ratio=o.frequency.value/(el._lastBaseFreq||newFreq);
          const targetFreq=newFreq*Math.max(0.25,Math.min(16,ratio));
          o.frequency.setTargetAtTime(targetFreq,now,glideTime/3);
        }
      }catch(e){}
    });
    el._lastBaseFreq=newFreq;
  } else {
    restartDrone(el);
  }
});
document.getElementById('bpmBox')?.addEventListener('click',()=>{
  const bpms=[80,88,90,100,110,115,120,122,124,126,128,130,132,135,140,150,160,165,174,180];
  const cur=bpms.findIndex(b=>Math.round(bpm)===b);
  bpm=bpms[(cur+1)%bpms.length];
  document.getElementById('bpmVal').textContent=bpm;
  if(beatEnabled){stopBeat();startBeat();}
  const range=STYLES[currentStyle]?.bpmRange;
  startBpmDrift(bpm, range);
  showToast(bpm+' BPM');
});
document.getElementById('btnMarkers').addEventListener('click',()=>{
  showMarkers=!showMarkers;
  const btn=document.getElementById('btnMarkers');
  btn.classList.toggle('on', showMarkers);
  btn.style.opacity=showMarkers?'':'0.45';
});
// ─── LIVE SETS — programmed 2-hour arcs ──────────────────────────────────────

// Get current and upcoming sets based on real time







// ── lerp helper ──────────────────────────────────────────────────────────────
// ── Get exact minute position within the current set ─────────────────────────

// ── Get interpolated cue state at a given minute ──────────────────────────────


// Live-mode grammar overlay — combined at runtime, never mutates GENRE_GRAMMAR base

// Call this in live mode instead of getGrammar() to get energy-adjusted values

// ── Apply energy level to conductor and grammar ───────────────────────────────

// ── Fire a cue event (intro, peak, breakdown, resolution, etc.) ───────────────

// ── Main LiveSetRunner tick — runs every 5 seconds ────────────────────────────

// ── Handle set ending ─────────────────────────────────────────────────────────

// ── Start/stop the runner ──────────────────────────────────────────────────────



// Show cue label on transition


// ─── GENRE GRAPH — soft drift neighbors ──────────────────────────────────────
// Each genre connects to 3–4 adjacent genres by energy/BPM/harmonic character.
// Drift always moves to a neighbor — never jumps across the map.


// Time-of-day starting genre

// Soft drift — no element rebuild, just shift genre identity gradually



// LIVE-01: Gradually re-orchestrate scene toward new genre's identity

// Fade an element out and remove it from the scene

// Spawn an element from an arrangement recipe with fade-in


// ─── LIVE TOUCH INTERACTION ──────────────────────────────────────────────────
// In Live mode, elements are playable instruments:
//   Touch/click → pulse + gain swell + haptics (reward on every contact)
//   Drag X/Y    → position (pan) and filter brightness
//   Pinch       → radius + volume scale
//   Scroll      → same as pinch (mouse version)
// Two separate systems: native touch events (iOS-reliable) + mouse events
// (document-level so drag works past canvas edge).

// Convert clientXY → canvas logical coords, accounting for CSS/canvas size ratio

// Hit test in canvas logical coords — generous radius for touch

// Shared helpers
// ── HOLD BUZZ — tactile feedback synth while element is held ─────────────────


// ── LIVE SOLO — duck everything when one element is held ─────────────────────
// "Caught a butterfly" — the world quiets, that one sound steps forward.



// ─── HOLD LABELS ─────────────────────────────────────────────────────────────




// ── GESTURAL INTERACTION FX ───────────────────────────────────────────────────
// When a user touches/drags an element, a resonant filter is inserted inline
// into that element's audio path. X → cutoff sweep (150–8kHz log), Y → Q (1–14).
// Pinch maps scale → reverb wetness + delay feedback for room-size control.
// On release, filter cutoff returns to element's tone setting, then disconnects.
// Works in both Live and Studio mode — fires wherever liveDrag/liveScale run.




// Pinch → reverb + delay room size morph
// scale: 0.5 (tight/dry) → 2.5 (infinite/wet)


// ─────────────────────────────────────────────────────────────────────────────

// Pinch on beam → widen or narrow the beam strip width
// Pinch on neon/fold → stretch/shrink the line length around its center
// When called after rotating el.angle, also updates x1/y1/x2/y2 endpoints.

// ── MOMENTUM / FLOAT-ON-RELEASE ──────────────────────────────────────────────
// When a drag is released with velocity, the element floats in that direction
// and decays to a stop — like tossing a physical object.




// ── TOUCH HANDLERS (native events — most reliable on iOS) ────────────────────








// Schedule panel open/close
function openSchedulePanel(){
  renderSchedule();
  const panel=document.getElementById('liveSchedulePanel');
  if(panel){ panel.style.transform='translateY(0)'; }
  // Dim controls while panel is open
  const controls=document.getElementById('liveControls');
  if(controls) controls.style.opacity='0';
}
function closeSchedulePanel(){
  const panel=document.getElementById('liveSchedulePanel');
  if(panel){ panel.style.transform='translateY(100%)'; }
  const controls=document.getElementById('liveControls');
  if(controls) controls.style.opacity='1';
}

// ── SOUND LIBRARY ─────────────────────────────────────────────────────────────
let _soundLibOpen=false;
let _soundLibBuilt=false;
let _soundLibPreviewEl=null;
let _soundLibHoverTimer=null;
let _soundLibAnimRaf=null;
let _soundLibWasBeatEnabled=false;
const _soundLibActiveCards=new Map();


function enterSoundLib(){
  if(_soundLibOpen) return;
  _soundLibOpen=true;
  ensureAudio();
  // Make sure audio is enabled
  if(!soundEnabled){
    soundEnabled=true;
    const btnA=document.getElementById('btnAudio');
    if(btnA) btnA.classList.add('on');
  }
  // Boost master volume for preview — normal playback uses 0.55
  if(masterGain) masterGain.gain.setTargetAtTime(1.0, audioCtx.currentTime, 0.05);

  // Ensure drum profiles are accessible
  if(!activeDrumStyle) activeDrumStyle='house';
  if(!drumGain&&audioCtx){drumGain=audioCtx.createGain();drumGain.connect(compressor||masterGain);}
  if(drumGain) drumGain.gain.setTargetAtTime(1.0,audioCtx.currentTime,0.05);

  // Pause everything — stop beat, stop all drones
  _soundLibWasBeatEnabled=beatEnabled;
  if(beatEnabled) stopBeat();
  stopAllDrones();

  // Show overlay
  const ov=document.getElementById('soundLibOverlay');
  ov.style.display='flex';
  requestAnimationFrame(()=>ov.style.opacity='1');

  if(!_soundLibBuilt){ buildSoundLib(); _soundLibBuilt=true; }

  // Start blob animation
  _soundLibAnimRaf=requestAnimationFrame(animSoundLib);
}

function exitSoundLib(){
  if(!_soundLibOpen) return;
  _soundLibOpen=false;
  stopSoundLibPreview();
  // Restore master and drum gain
  if(masterGain&&audioCtx) masterGain.gain.setTargetAtTime(0.55, audioCtx.currentTime, 0.1);
  if(drumGain&&audioCtx) drumGain.gain.setTargetAtTime(0.85, audioCtx.currentTime, 0.1);

  // Hide overlay
  const ov=document.getElementById('soundLibOverlay');
  ov.style.display='none';

  // Cancel anim
  if(_soundLibAnimRaf){ cancelAnimationFrame(_soundLibAnimRaf); _soundLibAnimRaf=null; }

  // Restore beat if it was running
  if(_soundLibWasBeatEnabled) startBeat();
}

function stopSoundLibPreview(){
  clearTimeout(_soundLibHoverTimer);
  if(_soundLibPreviewEl){
    if(_soundLibPreviewEl._previewInterval) clearInterval(_soundLibPreviewEl._previewInterval);
    stopDrone(_soundLibPreviewEl);
    _soundLibPreviewEl=null;
  }
  document.getElementById('soundLibActiveLabel').textContent='';
  // Deactivate all cards visually
  _soundLibActiveCards.forEach(e=>{ e.active=false; });
}

function startSoundLibPreview(soundType, variation, label){
  stopSoundLibPreview();
  if(!audioCtx||!soundEnabled) return;

  // Drum types — call the REAL schedule functions so library = main app
  if(soundType.startsWith('__')){
    const KICK_STYLES  =['house','techno','hiphop','italo'];
    const CLAP_STYLES  =['house','techno','dnb','hiphop'];
    const HIHAT_STYLES =['house','techno','dub','dnb'];
    const OHIHAT_STYLES=['house','techno','hiphop','dnb'];
    const PERC_STYLES  =['house','techno','hiphop','italo'];
    const SNAP_STYLES  =['house','dnb','techno','hiphop'];
    const styleMap={__KICK__:KICK_STYLES,__CLAP__:CLAP_STYLES,__HIHAT__:HIHAT_STYLES,__OHIHAT__:OHIHAT_STYLES,__PERC__:PERC_STYLES,__SNAP__:SNAP_STYLES};
    if(!drumGain&&audioCtx){drumGain=audioCtx.createGain();drumGain.gain.value=0.85;drumGain.connect(compressor||masterGain);}
    const savedStyle=activeDrumStyle;
    const fireDrum=()=>{
      activeDrumStyle=(styleMap[soundType]||KICK_STYLES)[variation]||'house';
      const tt=audioCtx.currentTime+0.02;
      if(soundType==='__KICK__')    scheduleKick(tt,1.0);
      else if(soundType==='__CLAP__')   scheduleClap(tt,1.0);
      else if(soundType==='__HIHAT__')  scheduleHihat(tt,0.85);
      else if(soundType==='__OHIHAT__') scheduleOpenHH(tt);
      else if(soundType==='__PERC__')   schedulePerc(tt);
      else if(soundType==='__SNAP__')   scheduleSnap(tt,1.0);
      activeDrumStyle=savedStyle;
    };
    fireDrum();
    const repeatMs={__KICK__:480,__CLAP__:600,__HIHAT__:180,__OHIHAT__:360,__PERC__:440,__SNAP__:500}[soundType]||480;
    const el={id:'__soundlib__',soundType,variation,note:'A3',volume:1,muted:false,soloed:false,syncMode:'free',shape:{x:0.5,y:0.5},tone:{x:0.5,y:0.5},space:{x:0.5,y:0.5},x:0.5,y:0.5,pan:0,_droneNode:null,_pulse:0,_flashPulse:0};
    el._previewInterval=setInterval(fireDrum,repeatMs);
    _soundLibPreviewEl=el;
    document.getElementById('soundLibActiveLabel').textContent=label;
    return;
  }

  const st=SOUND_TYPES[soundType]; if(!st) return;
  const v=st.vars[variation]||st.vars[0];

  const el={
    id:'__soundlib__',
    soundType, variation,
    note:'A3',
    volume: ({
      Acid:5.5,  // buildDroneGrowl multiplies by 0.16 internally — needs big boost
      Pluck:1.8, Vocal:1.8, Ring:1.2,
      Shimmer:1.8, WTPad:1.4, Phys:1.6, FMStab:1.5, FM3:1.4, EP:1.5,
      Noise:0.55, Pulse:0.65, Chord:0.60, Sub:0.80,
      Arp:0.75,  // Phrase variation too sharp/loud
    }[soundType]||1.0),
    muted:false, soloed:false,
    syncMode:'free',
    shape:{...(v.shape||{x:0.5,y:0.5})},
    tone: {...(v.tone ||{x:0.4,y:0.3})},
    space:{...(v.space||{x:0.5,y:0.5})},
    x:0.5, y:0.5, pan:0,
    _droneNode:null, _pulse:0, _flashPulse:0,
  };

  const freq=midiToFreq(noteToMidi('A3'));
  const SUSTAINED=new Set(['Drone','WTPad','Pad','Vocal','Noise','Shimmer','Pulse','Phys','Chord','Acid','Sub']);

  // Per-variation overrides for Acid — baked tone/shape drives filter character
  if(soundType==='Acid'){
    const ACID_SHAPES=[{x:0.75,y:0.5},{x:0.55,y:0.65},{x:0.40,y:0.70},{x:0.70,y:0.75}];
    const ACID_TONES= [{x:0.55,y:0.60},{x:0.45,y:0.50},{x:0.15,y:0.85},{x:0.75,y:0.20}];
    el.shape=ACID_SHAPES[variation]||ACID_SHAPES[0];
    el.tone= ACID_TONES[variation]||ACID_TONES[0];
    if(variation===2) el.note='A2'; // Wobble — octave lower for deep growl
  }
  if(soundType==='Arp') el.tone={x:0.25,y:0.15};

  if(SUSTAINED.has(soundType)){
    startDrone(el);
  } else {
    const fire=()=>{
      const t=audioCtx.currentTime+0.02;
      if(soundType==='EP')          scheduleEPNote(el,t,freq);
      else if(soundType==='FM3')    scheduleFM3Note(el,t,freq);
      else if(soundType==='FMStab') scheduleFMStabNote(el,t,freq);
      else if(soundType==='Pluck')  schedulePluckNote(el,t,freq);
      else if(soundType==='Arp')    scheduleArpNote(el,t,freq,0.4,0.8,0);
      else if(soundType==='Echo')   scheduleEchoNote(el,t);
      else if(soundType==='Conga')  scheduleCongaNote(el,t);
      else if(soundType==='Laser')  scheduleLaserOneShot(el,t);
      else if(soundType==='SFX')    scheduleSFX(el,t);
      else if(soundType==='Ring')   scheduleRingOneShot(el,t);
      else if(soundType==='Sub'||soundType==='Acid'){
        // Self-contained synthesis direct to destination — clean and loud
        const out=audioCtx.destination;
        if(soundType==='Sub'){
          const cfgs=[
            {start:180,end:55,sweep:0.045,dec:0.55},
            {start:160,end:40,sweep:0.08,dec:0.9},
            {start:220,end:55,sweep:0.022,dec:0.28},
            {start:150,end:55,sweep:0.1,dec:1.4},
          ];
          const c=cfgs[variation]||cfgs[0];
          const o=audioCtx.createOscillator(),g=audioCtx.createGain();
          o.type='sine';o.frequency.setValueAtTime(c.start,t);
          o.frequency.exponentialRampToValueAtTime(Math.max(20,c.end),t+c.sweep);
          g.gain.setValueAtTime(0.85,t);g.gain.exponentialRampToValueAtTime(0.001,t+c.dec);
          o.connect(g);g.connect(out);o.start(t);o.stop(t+c.dec+0.1);
          o.onended=()=>{try{o.disconnect();g.disconnect();}catch(e){}};
        } else {
          // Acid — sawtooth through cascaded resonant lowpass
          const cfgs=[
            {freq:220,cutoff:800,res:18,dec:0.22,slide:true},
            {freq:110,cutoff:600,res:22,dec:0.35,slide:false},
            {freq:110,cutoff:400,res:8, dec:0.5, slide:false},
            {freq:220,cutoff:500,res:25,dec:0.28,slide:true},
          ];
          const c=cfgs[variation]||cfgs[0];
          const o=audioCtx.createOscillator(),g=audioCtx.createGain();
          o.type='sawtooth';o.frequency.value=c.freq;
          if(c.slide){o.frequency.setValueAtTime(c.freq*1.5,t);o.frequency.exponentialRampToValueAtTime(c.freq,t+0.06);}
          const f1=audioCtx.createBiquadFilter();f1.type='lowpass';
          f1.frequency.setValueAtTime(c.cutoff*2,t);f1.frequency.exponentialRampToValueAtTime(c.cutoff*0.4,t+c.dec*0.5);f1.Q.value=c.res;
          const f2=audioCtx.createBiquadFilter();f2.type='lowpass';f2.frequency.value=c.cutoff*1.5;f2.Q.value=c.res*0.5;
          g.gain.setValueAtTime(0.75,t);g.gain.exponentialRampToValueAtTime(0.001,t+c.dec);
          o.connect(f1);f1.connect(f2);f2.connect(g);g.connect(out);
          o.start(t);o.stop(t+c.dec+0.1);
          o.onended=()=>{try{o.disconnect();f1.disconnect();f2.disconnect();g.disconnect();}catch(e){}};
        }
      }
    };
    fire();
    const melodicRepeat={
      Arp:600, Echo:900, Ring:variation===3?3500:variation===0?2200:variation===1?1000:400,
      Pluck:380, EP:500, FM3:500, FMStab:400, Laser:500, Conga:440, Sub:500, Acid:480,
      SFX:[1400,2000,600,300,2200,1000][variation]||800,
    }[soundType]||500;
    el._previewInterval=setInterval(fire,melodicRepeat);
  }
  _soundLibPreviewEl=el;
  document.getElementById('soundLibActiveLabel').textContent=label;
}

function buildSoundLib(){
  const body=document.getElementById('soundLibBody');
  if(!body)return;

  const DRUM_DEFS=[
    {key:'__KICK__',   name:'Kick',        sub:'808-style bass drum',   color:'rgba(255,45,20',   vars:['House','Techno','Hip Hop','Italo']},
    {key:'__CLAP__',   name:'Clap / Snare',sub:'Layered noise bursts',  color:'rgba(255,140,0',   vars:['House','Techno','DNB','Hip Hop']},
    {key:'__HIHAT__',  name:'Hi-Hat',      sub:'Closed metallic hit',   color:'rgba(255,220,0',   vars:['House','Techno','Dub','DNB']},
    {key:'__OHIHAT__', name:'Open Hi-Hat', sub:'Open resonant cymbal',  color:'rgba(180,255,80',  vars:['House','Techno','Hip Hop','DNB']},
    {key:'__SNAP__',   name:'Snap / Rim',  sub:'Sharp transient click', color:'rgba(0,220,180',   vars:['House','DNB','Techno','Hip Hop']},
    {key:'__PERC__',   name:'Perc',        sub:'Tonal percussion hit',  color:'rgba(180,80,255',  vars:['House','Techno','Hip Hop','Italo']},
  ];

  function makeCard(key,vi,vname,colorStr,labelName,shapeKey){
    const id=`sl_${key}_${vi}`;
    const hueShifts=[0,30,-25,55,80,-45,110,-60];
    const varColor=vi>0?shiftColorStr(colorStr,hueShifts[vi]||0):colorStr;
    const card=document.createElement('div');
    card.style.cssText='position:relative;width:140px;height:140px;cursor:pointer;user-select:none;-webkit-user-select:none;transition:transform .15s cubic-bezier(.34,1.56,.64,1);flex-shrink:0;overflow:visible';
    const wrap=document.createElement('div');wrap.style.cssText='position:absolute;inset:0;overflow:visible';
    const canvas=document.createElement('canvas');canvas.width=280;canvas.height=280;
    canvas.style.cssText='position:absolute;width:280px;height:280px;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none';
    wrap.appendChild(canvas);card.appendChild(wrap);
    const lbl=document.createElement('div');
    lbl.style.cssText='position:absolute;bottom:16px;left:0;right:0;text-align:center;pointer-events:none;z-index:2';
    lbl.innerHTML=`<div style="font-size:11px;letter-spacing:.02em;color:rgba(255,255,255,0.92);font-weight:600;text-shadow:0 1px 8px rgba(0,0,0,0.95),0 0 16px rgba(0,0,0,0.7)">${vname}</div><div style="font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,0.38);text-shadow:0 1px 3px rgba(0,0,0,0.8)">${labelName}</div>`;
    card.appendChild(lbl);
    const phase=Math.random()*100;
    const sk=shapeKey||key;
    _soundLibActiveCards.set(id,{canvas,active:false,phase,key:sk,colorStr:varColor});
    drawSoundLibBlob(canvas,varColor,sk,false,phase);
    const onEnter=()=>{
      clearTimeout(_soundLibHoverTimer);
      _soundLibHoverTimer=setTimeout(()=>{
        card.style.transform='scale(1.08)';
        _soundLibActiveCards.forEach((e,k)=>{e.active=(k===id);});
        startSoundLibPreview(key,vi,`${labelName} · ${vname}`);
      },80);
    };
    const onLeave=()=>{
      clearTimeout(_soundLibHoverTimer);card.style.transform='scale(1)';
      if(_soundLibActiveCards.get(id))_soundLibActiveCards.get(id).active=false;
      stopSoundLibPreview();
    };
    card.addEventListener('mouseenter',onEnter);card.addEventListener('mouseleave',onLeave);
    card.addEventListener('touchstart',e=>{e.preventDefault();onEnter();},{passive:false});
    card.addEventListener('touchend',()=>{setTimeout(onLeave,600);});
    return card;
  }

  SOUND_LIB_SECTIONS.forEach(sec=>{
    const secDiv=document.createElement('div');
    secDiv.style.cssText='margin-top:24px';
    secDiv.innerHTML=`<div style="font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,0.30);margin-bottom:16px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.05)">${sec.label}</div>`;
    body.appendChild(secDiv);

    sec.keys.forEach(key=>{
      if(key==='__DRUMS__'){
        DRUM_DEFS.forEach(dd=>{
          const instDiv=document.createElement('div');instDiv.style.cssText='margin-bottom:20px';
          const rowHdr=document.createElement('div');rowHdr.style.cssText='display:flex;align-items:baseline;gap:8px;margin-bottom:12px';
          rowHdr.innerHTML=`<span style="font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,0.78);font-weight:600">${dd.name}</span><span style="font-size:9px;color:rgba(255,255,255,0.32);letter-spacing:.04em">${dd.sub}</span>`;
          instDiv.appendChild(rowHdr);
          const grid=document.createElement('div');grid.style.cssText='display:flex;flex-wrap:wrap;gap:2px;overflow:visible';
          dd.vars.forEach((vname,vi)=>{
            grid.appendChild(makeCard(dd.key,vi,vname,dd.color,dd.name,dd.key));
          });
          instDiv.appendChild(grid);secDiv.appendChild(instDiv);
        });
        return;
      }
      const st=SOUND_TYPES[key];if(!st)return;
      // Variant filter: for mixed-role types (Ring, Phys, SFX, Noise),
      // only show variants whose role matches the section's varFilter
      const varFilter = sec.varFilter;
      const filteredVars = varFilter
        ? st.vars.filter((v,vi)=>{
            const def = INSTRUMENT_ROLE_REGISTRY[key];
            if (!def) return true;
            const varRole = def.variantRoles?.[v.name] || def.primaryRole;
            return varRole === varFilter;
          })
        : st.vars.map((v,vi)=>({...v,_vi:vi}));

      // Skip this key in this section if no variants pass the filter
      if (varFilter && filteredVars.length === 0) return;

      const instDiv=document.createElement('div');instDiv.style.cssText='margin-bottom:20px';
      const rowHdr=document.createElement('div');rowHdr.style.cssText='display:flex;align-items:baseline;gap:8px;margin-bottom:12px';
      rowHdr.innerHTML=`<span style="font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,0.78);font-weight:600">${key}</span><span style="font-size:9px;color:rgba(255,255,255,0.32);letter-spacing:.04em">${st.sub}</span>`;
      instDiv.appendChild(rowHdr);
      const grid=document.createElement('div');grid.style.cssText='display:flex;flex-wrap:wrap;gap:2px;overflow:visible';
      st.vars.forEach((v,vi)=>{
        // If varFilter is active, skip variants that don't match
        if (varFilter) {
          const def = INSTRUMENT_ROLE_REGISTRY[key];
          const varRole = def?.variantRoles?.[v.name] || def?.primaryRole || 'atmosphere';
          if (varRole !== varFilter) return;
        }
        grid.appendChild(makeCard(key,vi,v.name,st.color,key,key));
      });
      instDiv.appendChild(grid);secDiv.appendChild(instDiv);
    });
  });
}

function animSoundLib(){
  if(!_soundLibOpen){ return; }
  const t=performance.now()*0.001;
  _soundLibActiveCards.forEach(({canvas,active,phase,key,colorStr})=>{
    drawSoundLibBlob(canvas,colorStr,key,active,t+phase);
  });
  _soundLibAnimRaf=requestAnimationFrame(animSoundLib);
}

function shiftColorStr(colorStr,deg){
  // Takes 'rgba(R,G,B' string, shifts hue by deg, returns same format
  const m=colorStr.match(/(\d+),\s*(\d+),\s*(\d+)/);
  if(!m) return colorStr;
  const shifted=rotateColor([+m[1],+m[2],+m[3]],deg);
  return `rgba(${shifted[0]},${shifted[1]},${shifted[2]}`;
}
function rotateColor(rgb,deg){
  const a=deg*Math.PI/180,cos=Math.cos(a),sin=Math.sin(a);
  const m=[cos+0.299*(1-cos),0.299*(1-cos)-0.169*sin,0.299*(1-cos)+0.328*sin,
           0.587*(1-cos)+0.169*sin,cos+0.587*(1-cos),0.587*(1-cos)-0.328*sin,
           0.114*(1-cos)-0.328*sin,0.114*(1-cos)+0.328*sin,cos+0.114*(1-cos)];
  return[Math.min(255,Math.max(0,Math.round(rgb[0]*m[0]+rgb[1]*m[1]+rgb[2]*m[2]))),
         Math.min(255,Math.max(0,Math.round(rgb[0]*m[3]+rgb[1]*m[4]+rgb[2]*m[5]))),
         Math.min(255,Math.max(0,Math.round(rgb[0]*m[6]+rgb[1]*m[7]+rgb[2]*m[8])))];
}

// Per-instrument blob personalities — same visual language as main app
// Parameters: warpFreqA, warpFreqB, warpAmt, layers[{scale,alphaActive,alphaIdle}], speed
// Per-instrument blob personalities
// warp: edge roughness. speed: animation speed. falloff: how sharp edge is (0=hard,1=soft)
// rings[]: scale of each concentric ring. sat[]: opacity of each ring.

const _blobOffsets=new Map();
const _blobParams=new Map(); // stable random params per canvas




document.getElementById('liveTapZone').addEventListener('click',(e)=>{
  // If in Live mode and a blob/element is under the click, skip controls toggle —
  // the touch interaction already handled it.
  if(_liveMode){const {mx,my}=livePt(e.clientX,e.clientY);if(liveHitTest(mx,my)) return;}
  const panel=document.getElementById('liveSchedulePanel');
  const isOpen = panel?.style.transform==='translateY(0px)' || panel?.style.transform==='translateY(0)';
  if(isOpen){ closeSchedulePanel(); return; }
  _liveControlsVisible ? hideLiveControls() : showLiveControls();
});

// Pause / Play
document.getElementById('liveBtnPause').addEventListener('click',(e)=>{
  e.stopPropagation();
  _livePaused=!_livePaused;
  const btn=document.getElementById('liveBtnPause');
  if(_livePaused){
    // Pause: stop beat and drones
    if(beatEnabled) stopBeat();
    stopAllDrones();
    if(audioCtx) audioCtx.suspend();
    btn.textContent='▶';
    btn.style.color='rgba(126,232,162,0.9)';
    btn.style.borderColor='rgba(126,232,162,0.3)';
    // Show paused indicator
    const dot=document.getElementById('liveDot');
    if(dot){ dot.style.background='#888'; dot.style.boxShadow='none'; dot.style.animation='none'; }
  } else {
    // Resume
    if(audioCtx) audioCtx.resume();
    if(!beatEnabled) startBeat();
    elements.forEach(el=>maybeStartDrone(el));
    btn.textContent='⏸';
    btn.style.color='rgba(255,255,255,0.85)';
    btn.style.borderColor='rgba(255,255,255,0.15)';
    const dot=document.getElementById('liveDot');
    if(dot){ dot.style.background='#ff4040'; dot.style.boxShadow='0 0 8px rgba(255,64,64,0.8)'; dot.style.animation='liveDotPulse 1.4s ease-in-out infinite'; }
  }
  showLiveControls();
});

// Record button — delegates to Recorder module (fg-recorder.js)
document.getElementById('liveBtnRecord').addEventListener('click',(e)=>{
  e.stopPropagation();
  Recorder.toggle();
  showLiveControls();
});


// Share buttons — copy a link to the current field
// Studio: topbar Share button
document.getElementById('btnShare')?.addEventListener('click', () => {
  copyFieldLink();
});

// Live: ↑ button in bottom controls bar
document.getElementById('liveBtnShare').addEventListener('click',(e)=>{
  e.stopPropagation();
  copyFieldLink();
  showLiveControls(); // keep controls visible after tap
});

function downloadCanvasImage(canvas){
  const a=document.createElement('a');
  a.href=canvas.toDataURL('image/png');
  a.download=`fieldgradients-${Date.now()}.png`;
  a.click();
}

// Exit button
document.getElementById('liveBtnSchedule').addEventListener('click',(e)=>{
  e.stopPropagation();
  const panel=document.getElementById('liveSchedulePanel');
  const isOpen=panel&&panel.style.transform!=='translateY(100%)';
  if(isOpen) closeSchedulePanel(); else openSchedulePanel();
});
document.getElementById('liveBtnCloseSchedule').addEventListener('click',(e)=>{
  e.stopPropagation();
  closeSchedulePanel();
});
document.getElementById('liveBtnExit').addEventListener('click',(e)=>{
  e.stopPropagation();
  if(_liveRecording&&_liveMediaRecorder) _liveMediaRecorder.stop();
  exitLiveMode();
});

// Show controls on any touch/mouse move in live mode
document.getElementById('liveOverlay').addEventListener('pointermove',(e)=>{
  // Track mouse position for hover effects in live mode
  const r = document.getElementById('canvas').getBoundingClientRect();
  if(typeof mousePx !== 'undefined') mousePx = {x: e.clientX - r.left, y: e.clientY - r.top};
  if(_liveMode) showLiveControls();
});

// Tap anywhere to exit live mode — OLD: removed. Now tap shows controls, exit button exits.

document.getElementById('btnLive').addEventListener('click',()=>{
  if(_liveMode) exitLiveMode();
  else enterLiveMode();
});

// Mode toggle buttons
document.getElementById('btnModeStudio')?.addEventListener('click', ()=>{
  if(_liveMode) exitLiveMode();
});
document.getElementById('btnModeLive')?.addEventListener('click', ()=>{
  if(!_liveMode) enterLiveMode();
});

function updateModeToggle(){
  const studioBtn = document.getElementById('btnModeStudio');
  const liveBtn   = document.getElementById('btnModeLive');
  if(!studioBtn || !liveBtn) return;
  if(_liveMode){
    studioBtn.className = 'mode-toggle-btn';
    liveBtn.className   = 'mode-toggle-btn active-live';
  } else {
    studioBtn.className = 'mode-toggle-btn active-studio';
    liveBtn.className   = 'mode-toggle-btn';
  }
}
document.getElementById('btnBeat').addEventListener('click',()=>{
  if(beatEnabled) stopBeat(); else startBeat();
});
document.getElementById('btnAudio').addEventListener('click',()=>{
  const btn=document.getElementById('btnAudio');
  if(soundEnabled){
    soundEnabled=false;btn.classList.remove('on');btn.textContent='Audio Off';
    stopAllDrones();if(beatEnabled) stopBeat();
  } else {
    ensureAudio();
    soundEnabled=true;
    btn.classList.add('on');btn.textContent='Audio';
    startAllFree();
    if(!beatEnabled) startBeat();
  }
});
function loadState(state){
  hydrateState(state);
  updateDrumGain(); updateDrumSends(); clearVoiceMotifCache();
  setTimeout(()=>{
    if(soundEnabled) elements.forEach(el=>maybeStartDrone(el));
  },100);
}
function renderVibes(){
  const builtIn=document.getElementById('vibesBuiltIn');
  builtIn.innerHTML='';
  BUILT_IN_VIBES.forEach(v=>{
    const item=document.createElement('div');
    item.className='vibe-item'+(activeVibeName===v.name?' active':'');
    item.draggable=true;
    const dots=(v.state.elements||[]).slice(0,4).map(e=>`<span class="vi-dot" style="background:${e.color}"></span>`).join('');
    item.innerHTML=`<div class="vi-dots">${dots}</div><span class="vi-name">${v.name}</span>`;
    item.addEventListener('click',()=>{
      pushUndo();
      activeVibeName=v.name;
      const vibeToStyle=Object.fromEntries(BUILT_IN_VIBES.map(v=>[v.name,v.style||'deephouse']));
      const newStyle=vibeToStyle[v.name]||currentStyle;
      document.getElementById('styleSelect').value=newStyle;
      const stateSnapshot=JSON.parse(JSON.stringify(v.state));
      morphToGenre(newStyle, ()=>{
        loadState(stateSnapshot);
        const activeStyleDef=STYLES[currentStyle];
        if(activeStyleDef!=null && activeStyleDef.drumPreset!=null){
          const dp=activeStyleDef.drumPreset;
          activeDrumPreset=dp;
          activeDrumStyle=DRUM_PRESETS[dp]?.drumStyle||activeStyleDef.drumStyle||'house'; updateDrumGain(); updateDrumSends(); clearVoiceMotifCache();
          const p=DRUM_PRESETS[dp];
          if(p){drumPattern.kick=[...p.kick];drumPattern.clap=[...p.clap];drumPattern.hihat=[...p.hihat];drumPattern.openhh=[...p.openhh];drumPattern.perc=[...p.perc];drumPattern.snap=[...(p.snap||Array(16).fill(0))];}
          _drumBankIdx=-1;
          if(DRUM_BANK[currentStyle]) rotateDrumPattern();
        }
        showToast('Loaded: '+v.name);
      });
    });
    item.addEventListener('dragstart',e=>{const c=v.state.elements[0]?.color||'#888';e.dataTransfer.setData('text/plain',JSON.stringify({name:v.name,state:v.state,color:c}));});
    builtIn.appendChild(item);
  });
  const saved=document.getElementById('vibesSaved');
  saved.innerHTML='';
  const userVibes=loadUserVibes();
  userVibes.forEach((v,i)=>{
    const item=document.createElement('div');
    item.className='vibe-item'+(activeVibeName===v.name?' active':'');
    item.draggable=true;
    const c=v.state?.elements?.[0]?.color||'#888';
    const dots=(v.state?.elements||[]).slice(0,4).map(e=>`<span class="vi-dot" style="background:${e.color}"></span>`).join('');
    item.innerHTML=`<div class="vi-dots">${dots}</div><span class="vi-name">${v.name}</span><span class="vi-del" data-delidx="${i}">✕</span>`;
    item.addEventListener('click',e2=>{
      if(e2.target.classList.contains('vi-del')){
        const vibes=loadUserVibes();vibes.splice(+e2.target.dataset.delidx,1);
        saveUserVibes(vibes);renderVibes();showToast('Field deleted');return;
      }
      pushUndo();
      activeVibeName=v.name;
      loadState(JSON.parse(JSON.stringify(v.state)));
      renderElList();buildDrumGrid();renderVibes();
      showToast('Loaded: '+v.name);
    });
    item.addEventListener('dragstart',e2=>{e2.dataTransfer.setData('text/plain',JSON.stringify({name:v.name,state:v.state,color:c}));});
    saved.appendChild(item);
  });
  if(!userVibes.length) saved.innerHTML='<div style="padding:4px 7px;font-size:6.5px;color:rgba(255,255,255,0.1)">No saved fields yet</div>';
}
[document.getElementById('vibesSaveBtn'),document.getElementById('btnSave')].forEach(btn=>{
  btn?.addEventListener('click',()=>{document.getElementById('saveModal').classList.add('open');setTimeout(()=>document.getElementById('saveNameInput').focus(),100);});
});
document.getElementById('saveCancelBtn').addEventListener('click',()=>document.getElementById('saveModal').classList.remove('open'));
document.getElementById('saveModal').addEventListener('click',e=>{if(e.target===e.currentTarget)document.getElementById('saveModal').classList.remove('open');});
document.getElementById('saveConfirmBtn').addEventListener('click',confirmSave);
document.getElementById('saveNameInput').addEventListener('keydown',e=>{if(e.key==='Enter')confirmSave();if(e.key==='Escape')document.getElementById('saveModal').classList.remove('open');});
function confirmSave(){
  const name=document.getElementById('saveNameInput').value.trim();if(!name) return;
  const vibes=loadUserVibes();vibes.push({name,state:serializeState(),created:Date.now()});
  saveUserVibes(vibes);document.getElementById('saveModal').classList.remove('open');document.getElementById('saveNameInput').value='';
  showToast('Field saved: '+name);renderVibes();
}
function renderSceneList(){
  const list=document.getElementById('tlVibeList');
  list.innerHTML=scenes.map(s=>{
    const dots=(s.state?.elements||[]).slice(0,3).map(e=>`<span class="vdot" style="background:${e.color}"></span>`).join('');
    return `<div class="tl-vibe-item${s.id===activeSceneId?' active':''}" data-sid="${s.id}"><div class="vdots">${dots}</div><span class="vname">${s.name}</span><span class="vdel" data-del="${s.id}">✕</span></div>`;
  }).join('');
  list.querySelectorAll('.tl-vibe-item').forEach(item=>{
    item.addEventListener('click',e2=>{
      if(e2.target.classList.contains('vdel')){const id=+e2.target.dataset.del;scenes=scenes.filter(s=>s.id!==id);if(activeSceneId===id)activeSceneId=null;renderSceneList();renderSceneBlocks();return;}
      activeSceneId=+item.dataset.sid;renderSceneList();renderSceneBlocks();
    });
  });
}
function renderSceneBlocks(){
  const inner=document.getElementById('tlTrackInner');
  const ph=document.getElementById('tlPlayhead');
  inner.innerHTML='';inner.appendChild(ph);
  scenes.forEach(s=>{
    const block=document.createElement('div');
    block.className='tl-scene-block'+(s.id===activeSceneId?' active':'');
    block.style.cssText=`left:${s.startBar/TL_TOTAL_BARS*100}%;width:${s.durationBars/TL_TOTAL_BARS*100}%;background:${s.color};`;
    block.innerHTML=`<div class="resize-l"></div><div class="tl-scene-label">${s.name}</div><div class="resize-r"></div>`;
    block.addEventListener('mousedown',e=>{
      if(e.target.classList.contains('resize-l')||e.target.classList.contains('resize-r')){
        const isLeft=e.target.classList.contains('resize-l');const startX=e.clientX,origStart=s.startBar,origDur=s.durationBars;
        const trackRect=document.getElementById('tlTrack').getBoundingClientRect();
        const handler=ev=>{const dx=ev.clientX-startX;const dBars=Math.round(dx/trackRect.width*TL_TOTAL_BARS);if(isLeft){s.startBar=Math.max(0,origStart+dBars);s.durationBars=Math.max(1,origDur-dBars);}else{s.durationBars=Math.max(1,origDur+dBars);}renderSceneBlocks();};
        const up=()=>{document.removeEventListener('mousemove',handler);document.removeEventListener('mouseup',up);};
        document.addEventListener('mousemove',handler);document.addEventListener('mouseup',up);e.stopPropagation();return;
      }
      activeSceneId=s.id;renderSceneList();renderSceneBlocks();
      const startX2=e.clientX,origStart2=s.startBar;const trackRect2=document.getElementById('tlTrack').getBoundingClientRect();let moved=false;
      const handler2=ev=>{moved=true;const dx=ev.clientX-startX2;s.startBar=Math.max(0,Math.round(origStart2+dx/trackRect2.width*TL_TOTAL_BARS));renderSceneBlocks();};
      const up2=()=>{document.removeEventListener('mousemove',handler2);document.removeEventListener('mouseup',up2);if(!moved){pushUndo();loadState(JSON.parse(JSON.stringify(s.state)));renderElList();buildDrumGrid();showToast('Scene: '+s.name);}};
      document.addEventListener('mousemove',handler2);document.addEventListener('mouseup',up2);
    });
    inner.appendChild(block);
  });
}
document.getElementById('tlAddBtn').addEventListener('click',()=>{
  const name='Scene '+(scenes.length+1);const state=serializeState();
  const c=elements[0]?hexToRgba(elements[0].color,0.15):'rgba(167,139,250,0.12)';
  addScene(name,state,c);showToast('Added: '+name);
});
document.getElementById('tlXfade').addEventListener('click',()=>{
  const opts=[1,2,4,8];const i=opts.indexOf(xfadeBars);xfadeBars=opts[(i+1)%opts.length];
  document.getElementById('tlXfadeVal').textContent=xfadeBars+' bars';showToast('Xfade: '+xfadeBars+' bars');
});
const tlTrack=document.getElementById('tlTrack');
tlTrack.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='copy';});
tlTrack.addEventListener('drop',e=>{
  e.preventDefault();
  try{const data=JSON.parse(e.dataTransfer.getData('text/plain'));const rect=tlTrack.getBoundingClientRect();const bar=Math.round((e.clientX-rect.left)/rect.width*TL_TOTAL_BARS);addScene(data.name,data.state,hexToRgba(data.color,0.15),bar,8);showToast('Added: '+data.name);}catch(err){}
});
let tlPlaying=false,tlPlayheadPos=0,tlInterval=null,tlCurrentSceneId=null,tlXfadeState=null;
function applyTimelineCrossfade(sceneA, sceneB, fadeProgress){
  const stateA=JSON.parse(JSON.stringify(sceneA.state));
  const stateB=JSON.parse(JSON.stringify(sceneB.state));
  const merged=[
    ...stateA.elements.map(el=>({...el, volume:(el.volume??0.75)*(1-fadeProgress), _xfadeId:'A'+el.id})),
    ...stateB.elements.map(el=>({...el, volume:(el.volume??0.75)*fadeProgress, _xfadeId:'B'+el.id})),
  ];
  merged.forEach(mel=>{
    const existing=elements.find(e=>e._xfadeId===mel._xfadeId);
    if(existing){
      existing.volume=mel.volume;
      updateDroneParams(existing);
    } else {
      const newEl={...mel, id:nextId++, _droneNode:null, _pulse:0, _flashPulse:0, _cloudOffsets:null, _animPhase:Math.random()*Math.PI*2};
      applyRoleAndTriggerMode(newEl);
      elements.push(newEl);
      if(soundEnabled) maybeStartDrone(newEl);
    }
  });
  elements.forEach(el=>{
    if(!merged.find(m=>m._xfadeId===el._xfadeId)){
      el.volume=Math.max(0,el.volume-0.05);
      updateDroneParams(el);
      if(el.volume<=0.01) stopDrone(el);
    }
  });
  renderElList();
}
document.getElementById('tlPlay').addEventListener('click',()=>{
  if(tlPlaying){
    clearInterval(tlInterval);tlPlaying=false;
    document.getElementById('tlPlay').classList.remove('active');
  } else {
    tlPlaying=true;document.getElementById('tlPlay').classList.add('active');
    const stepMs=(60000/bpm)/4;
    tlInterval=setInterval(()=>{
      const loopEnd=scenes.length?Math.max(...scenes.map(sc=>sc.startBar+sc.durationBars)):TL_TOTAL_BARS;
      const loopStart=scenes.length?Math.min(...scenes.map(sc=>sc.startBar)):0;
      tlPlayheadPos+=0.25;if(tlPlayheadPos>=loopEnd)tlPlayheadPos=loopStart;
      document.getElementById('tlPlayhead').style.left=(tlPlayheadPos/TL_TOTAL_BARS*100)+'%';
      const sec=Math.round(tlPlayheadPos*60/bpm*4);
      document.getElementById('tlTime').textContent=Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');
      const totalSec=Math.round(loopEnd*60/bpm*4);
      document.getElementById('tlTotal').textContent='/ '+Math.floor(totalSec/60)+':'+String(totalSec%60).padStart(2,'0');
      const pos=tlPlayheadPos;
      const active2=scenes.filter(sc=>pos>=sc.startBar&&pos<sc.startBar+sc.durationBars);
      if(active2.length>=2){
        const scA=active2[0], scB=active2[1];
        const overlapStart=Math.max(scA.startBar,scB.startBar);
        const overlapEnd=Math.min(scA.startBar+scA.durationBars,scB.startBar+scB.durationBars);
        const fadeProgress=Math.max(0,Math.min(1,(pos-overlapStart)/(overlapEnd-overlapStart)));
        if(Math.round(pos*4)%4===0){
          applyTimelineCrossfade(scA,scB,fadeProgress);
        }
        activeSceneId=fadeProgress>0.5?scB.id:scA.id;
        renderSceneList();renderSceneBlocks();
      } else if(active2.length===1){
        const sc=active2[0];
        if(tlCurrentSceneId!==sc.id){
          tlCurrentSceneId=sc.id;activeSceneId=sc.id;
          loadState(JSON.parse(JSON.stringify(sc.state)));
          renderElList();buildDrumGrid();renderSceneList();renderSceneBlocks();
        }
      }
    },stepMs);
  }
});
document.getElementById('tlStop').addEventListener('click',()=>{clearInterval(tlInterval);tlPlaying=false;tlPlayheadPos=0;tlCurrentSceneId=null;document.getElementById('tlPlay').classList.remove('active');document.getElementById('tlPlayhead').style.left='0';document.getElementById('tlTime').textContent='0:00';});
// ─── GENRE MORPH — smooth crossfade between genres ───────────────────────────
// Instead of hard-cutting (stopAllDrones + wipe elements), we:
//   1. Fade out all current drones over FADE_OUT ms
//   2. Swap reverb profile at the silence point
//   3. Call buildFn() to populate the new state
//   4. Fade new elements in from zero


document.getElementById('btnRnd').addEventListener('click',()=>{
  if(driftActive) stopDrift(); document.getElementById('btnDrift').style.color='rgba(180,140,255,0.7)'; document.getElementById('btnDrift').style.background=''; document.getElementById('btnDrift').style.boxShadow='';
  const selectVal=document.getElementById('styleSelect').value;
  const vibeToStyle=Object.fromEntries(BUILT_IN_VIBES.map(v=>[v.name,v.style||'deephouse']));
  const styleFromVibe=activeVibeName?vibeToStyle[activeVibeName]:null;
  const styleKey=styleFromVibe||selectVal||currentStyle||'deephouse';

  if(generateActive){clearInterval(generateInterval);generateInterval=null;generateActive=false;const btn=document.getElementById('btnGenerate');btn.textContent='Generate';btn.style.color='rgba(126,232,162,0.9)';btn.style.background='rgba(126,232,162,0.06)';updateGenerateCapsuleBtn();}
  activeVibeName=null;
  document.getElementById('styleSelect').value=styleKey;
  pushUndo();

  morphToGenre(styleKey, ()=>{
    const style=STYLES[styleKey]||STYLES['deephouse'];
    paletteHue=Math.random()*360; paletteIdx=0;
    pickProgressionForStyle(styleKey);
    const root=document.getElementById('keySelect').value||'A';
    const scale=document.getElementById('scaleSelect').value||'Minor';
    const chordRoot=getChordRootDeg();
    const arr=style.arrangement;
    const subRoles=arr.filter(r=>r.soundType==='Sub');
    const requiredRoles2=arr.filter(r=>r._required&&r.soundType!=='Sub');
    const otherRoles=arr.filter(r=>r.soundType!=='Sub'&&!r._required);
    const shuffled=[...otherRoles].sort(()=>Math.random()-0.5);
    const isMobile=window.innerWidth<=600;
    const maxOther=isMobile?2:Math.min(4,otherRoles.length);
    const pickCount=1+Math.floor(Math.random()*maxOther);
    let growlSeen2=false;
    const chosenRaw=[...subRoles.slice(0,1),...requiredRoles2,...shuffled.slice(0,pickCount).filter(r=>{
      if(r.soundType==='Acid'){if(growlSeen2)return false;growlSeen2=true;}return true;
    })];
    // DATA-02: Balance role ratios for this genre
    balanceRolesForGenre(chosenRaw, styleKey);
    // Zone budgeting: drop roles whose octave-zone is already full
    const zc={ sub:0, low:0, mid:0, high:0, air:0 };
    const chosen=chosenRaw.filter(role=>{
      const z=getOctZone(role.oct??3);
      if((zc[z]||0) >= ZONE_CAPS[z]) return false;
      zc[z]++; return true;
    });
    pickCompositionTemplate(); // Suprematist layout for this scene
    chosen.forEach((role)=>{
      // Always call pickVisualType — don't lock in the arrangement's hardcoded vtype.
      // Only honour neon/fold/beam/spot if explicitly set; blob is the default fallback
      // so we ignore it and let pickVisualType make the genre-aware decision.
      const roleVtype = role.vtype;
      const vt = (roleVtype==='fold'||roleVtype==='neon'||roleVtype==='beam'||roleVtype==='spot')
        ? roleVtype
        : pickVisualType(role.soundType, role.xPos, role.yPos);
      const el=createElement(vt,role.xPos,role.yPos,nextColor());
      el.soundType=role.soundType;
      el.variation=role.variation??Math.floor(Math.random()*4);
      applyPreset(el);
      // Small ±0.03 jitter — preserve the curated character of the role
      if(role.shape) el.shape={x:Math.max(0,Math.min(1,role.shape.x+(Math.random()-0.5)*0.06)), y:Math.max(0,Math.min(1,role.shape.y+(Math.random()-0.5)*0.06))};
      if(role.tone)  el.tone ={x:Math.max(0,Math.min(1,role.tone.x +(Math.random()-0.5)*0.06)), y:Math.max(0,Math.min(1,role.tone.y +(Math.random()-0.5)*0.06))};
      if(role.space) el.space={x:Math.max(0,Math.min(1,role.space.x+(Math.random()-0.5)*0.06)), y:Math.max(0,Math.min(1,role.space.y+(Math.random()-0.5)*0.06))};
      if(!role.shape)['shape','tone','space'].forEach(pad=>{el[pad].x=Math.max(0,Math.min(1,el[pad].x+(Math.random()-0.5)*0.12));el[pad].y=Math.max(0,Math.min(1,el[pad].y+(Math.random()-0.5)*0.12));});
      // Tag for chord progression and pitch at current chord position
      el._roleDeg=role.deg??0;
      el._roleOct=role.oct??3;
      el.note=getHarmonicNote(root,scale,el._roleDeg+chordRoot,el._roleOct);
      // Preserve the carefully-tuned arrangement mix — tiny jitter only
      el.volume=role.vol*(0.97+Math.random()*0.06);
      el.pan=role.pan+(Math.random()-0.5)*0.08;
      applyRoleAndTriggerMode(el);
      el.radius=role.radius*(0.95+Math.random()*0.10);
      // Default line geometry — composition template overrides for diagonals
      const cx=el.x,cy=el.y,hw=0.12+Math.random()*0.20;
      el.x1=cx-hw;el.y1=cy+(Math.random()-0.5)*0.15;
      el.x2=cx+hw;el.y2=cy+(Math.random()-0.5)*0.15;
      el.angle=(Math.random()-0.5)*Math.PI;el.coneWidth=0.15+Math.random()*0.4;
      el.pos=el.x;el.width=0.12+Math.random()*0.20;
      // Suprematist composition: override position/radius/rotation
      applyCompositionToElement(el, chosen.length);
      elements.push(el);
    });
    nextId=elements.length+1;
    showToast(style.name+' · '+chosen.length+' elements · '+root+' '+(document.getElementById('scaleSelect').value||'Minor'));
  });
});
function evolveOnce(){
  if(!elements.length) return;
  const root=document.getElementById('keySelect').value||'A';
  const scale=document.getElementById('scaleSelect').value||'Minor';
  if(Math.random()<0.2 && elements.length<8){
    const styleObj=STYLES[currentStyle]||STYLES['deephouse'];
    const arr=styleObj.arrangement;
    const existingTypes=elements.map(e=>e.soundType);
    // Filter missing roles to those whose zone has room — prevents mid-range crowding
    const zc=countZones();
    const missing=arr.filter(r=>!existingTypes.includes(r.soundType) && (zc[getOctZone(r.oct??3)]||0) < ZONE_CAPS[getOctZone(r.oct??3)]);
    if(!missing.length) return; // every zone full — skip the add
    const role=missing[Math.floor(Math.random()*missing.length)];
    const jx=(Math.random()-0.5)*0.2, jy=(Math.random()-0.5)*0.15;
    const vt=role.vtype||'blob';
    const el=createElement(vt,Math.max(0.05,Math.min(0.95,role.xPos+jx)),Math.max(0.05,Math.min(0.95,role.yPos+jy)),nextColor());
    el.soundType=role.soundType;el.variation=role.variation;applyPreset(el);
    // Tag for chord progression and pitch at current chord position
    el._roleDeg=role.deg??0;
    el._roleOct=role.oct??3;
    const chordRoot=getChordRootDeg();
    el.note=getHarmonicNote(root,scale,el._roleDeg+chordRoot,el._roleOct);
    el.volume=role.vol*0.8;el.radius=role.radius*0.8;
    applyRoleAndTriggerMode(el);
    el.x1=el.x-0.15;el.y1=el.y;el.x2=el.x+0.15;el.y2=el.y;
    el.pos=el.x;
    elements.push(el);
    nextId=Math.max(nextId,el.id+1);
    if(soundEnabled) maybeStartDrone(el);
    renderElList();
    showToast('+ '+el.soundType);
    return;
  }
  if(Math.random()<0.15 && elements.length>4){
    const removable=elements.filter(e=>e.soundType!=='Sub');
    if(removable.length){
      const victim=removable[Math.floor(Math.random()*removable.length)];
      victim._pulse=1;victim._flashPulse=1;
      setTimeout(()=>{
        stopDrone(victim);
        elements=elements.filter(e=>e.id!==victim.id);
        if(activeId===victim.id){activeId=null;closeInspector();}
        renderElList();
      },400);
      showToast('− '+victim.soundType);
      return;
    }
  }
  // P1-C: pick the element that has been untouched longest, not a random one
  elements.forEach(el=>{ if(el._lastEvolved==null) el._lastEvolved=0; });
  const sorted=[...elements].sort((a,b)=>a._lastEvolved-b._lastEvolved);
  const el=sorted[0];
  el._lastEvolved=barCount;
  el._pulse=1.0; el._flashPulse=0.8;

  // Pick an action that's musically safe for this element's role.
  // Sub is the foundation — never touch its filter, volume, or pitch (chord engine owns it).
  // Pad/Vocal/Shimmer rely on their reverb bed — don't slam space.
  // Acid has a volatile envelope — don't randomize its volume.
  // Noise/Conga/Laser are atonal/percussive — no note walks.
  let allowed;
  switch(el.soundType){
    case 'Sub':                       allowed=['space','shape']; break;
    case 'Pad': case 'WTPad':         allowed=['tone','shape','vol','note']; break;
    case 'Vocal': case 'Shimmer':     allowed=['tone','shape','vol']; break;
    case 'Acid':                      allowed=['tone','shape','space','note']; break;
    case 'Noise': case 'Conga': case 'Laser': allowed=['tone','shape','space','vol']; break;
    default:                          allowed=['tone','space','shape','vol','note'];
  }
  const action=allowed[Math.floor(Math.random()*allowed.length)];

  if(action==='tone'){
    // ±0.05 — small, no slams
    el.tone.x=Math.max(0,Math.min(1,el.tone.x+(Math.random()-0.5)*0.10));
    el.tone.y=Math.max(0,Math.min(1,el.tone.y+(Math.random()-0.5)*0.08));
    updateDroneParams(el);
  } else if(action==='space'){
    el.space.x=Math.max(0,Math.min(1,el.space.x+(Math.random()-0.5)*0.10));
    el.space.y=Math.max(0,Math.min(1,el.space.y+(Math.random()-0.5)*0.08));
    updateDroneParams(el);
  } else if(action==='shape'){
    el.shape.x=Math.max(0,Math.min(1,el.shape.x+(Math.random()-0.5)*0.10));
    el.shape.y=Math.max(0,Math.min(1,el.shape.y+(Math.random()-0.5)*0.08));
    updateDroneParams(el);
  } else if(action==='vol'){
    // Drift ±10% from current instead of random-within-range
    const maxVol = el.soundType==='Acid' ? 0.55 : 0.95;
    const cur=el.volume??0.5;
    el.volume=Math.max(0.20, Math.min(maxVol, cur+(Math.random()-0.5)*0.10));
    updateDroneParams(el);
  } else if(action==='note'){
    // Voice leading: ±1 step 75%, ±2 step 20%, ±3 rare
    ensureRoleTag(el);
    const intervals=SCALE_INTERVALS[scale]||SCALE_INTERVALS.Minor;
    const scaleLen=intervals.length;
    const r=Math.random();
    const stepMag=r<0.75?1:r<0.95?2:3;
    const dir=Math.random()<0.5?1:-1;
    el._roleDeg=(((el._roleDeg||0)+dir*stepMag)%scaleLen+scaleLen)%scaleLen;
    const chordRoot=getChordRootDeg();
    const newNote=getHarmonicNote(root,scale,el._roleDeg+chordRoot,el._roleOct);
    if(newNote!==el.note){
      el.note=newNote;
      if(el._droneNode&&audioCtx){
        const newFreq=midiToFreq(noteToMidi(newNote));
        const now=audioCtx.currentTime;
        el._droneNode.oscs?.forEach(o=>{
          try{if(o.frequency&&o.frequency.value>10){
            const ratio=o.frequency.value/(el._lastBaseFreq||newFreq);
            o.frequency.setTargetAtTime(newFreq*Math.max(0.25,Math.min(16,ratio)),now,0.10);
          }}catch(e){}
        });
        el._lastBaseFreq=newFreq;
      }
      if(el.soundType==='Arp') el._arpPendingPattern=true;
    }
  }
  updatePadVisuals(el);
  if(activeId===el.id) populateInspector(el);
}
document.getElementById('btnDrift').addEventListener('click',()=>{
  const btn=document.getElementById('btnDrift');
  if(driftActive){
    stopDrift();
    btn.style.color='rgba(180,140,255,0.7)';
    btn.style.borderColor='rgba(180,140,255,0.2)';
    btn.style.background='';
    btn.style.boxShadow='';
  } else {
    if(!soundEnabled){ showToast('Start audio first'); return; }
    startDrift();
    btn.style.color='rgba(200,160,255,1.0)';
    btn.style.borderColor='rgba(180,140,255,0.6)';
    btn.style.background='rgba(180,140,255,0.12)';
    btn.style.boxShadow='0 0 8px rgba(180,140,255,0.3)';
  }
});
document.getElementById('btnSounds').addEventListener('click',()=>enterSoundLib());
document.getElementById('btnSoundsBack').addEventListener('click',()=>exitSoundLib());

document.getElementById('btnGenerate').addEventListener('click',()=>{
  const btn=document.getElementById('btnGenerate');
  if(generateActive){
    clearInterval(generateInterval);generateInterval=null;generateActive=false;
    btn.textContent='Generate';
    btn.style.color='rgba(126,232,162,0.9)';
    btn.style.background='rgba(126,232,162,0.06)';
    densityUnmute();
    resetFormPosition();
    djBrainStop();
    showToast('Evolution stopped');
  } else {
    contextFill();
    captureMotif();
    generateActive=true;
    btn.textContent='⏹ Evolving';
    btn.style.color='rgba(126,232,162,1)';
    btn.style.background='rgba(126,232,162,0.15)';
    const beatMs=(60000/bpm);
    generateInterval=setInterval(()=>{
      evolveOnce();
    }, beatMs*(2+Math.random()*2));
    djBrainStart();
    showToast('Evolving…');
  }
  updateGenerateCapsuleBtn();
});
document.getElementById('btnUndo').addEventListener('click',()=>{
  if(!undoStack.length) return;
  redoStack.push(JSON.stringify(serializeState()));
  loadState(JSON.parse(undoStack.pop()));renderElList();buildDrumGrid();showToast('Undo');
});
document.getElementById('btnRedo').addEventListener('click',()=>{
  if(!redoStack.length) return;
  undoStack.push(JSON.stringify(serializeState()));
  loadState(JSON.parse(redoStack.pop()));renderElList();buildDrumGrid();showToast('Redo');
});
document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT') return;
  if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();document.getElementById(e.shiftKey?'btnRedo':'btnUndo').click();}
  if(e.key==='Delete'||e.key==='Backspace'){
    if(activeId){const dEl=elements.find(e2=>e2.id===activeId);if(dEl)stopDrone(dEl);elements=elements.filter(e2=>e2.id!==activeId);activeId=null;closeInspector();renderElList();}
  }
  if(e.key===' '){e.preventDefault();if(beatEnabled)stopBeat();else startBeat();}
});
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2000);}
window.addEventListener('resize',resize);
if(window.visualViewport) window.visualViewport.addEventListener('resize', resize);
resize(); draw();
// elList replaced by tab-based lists — refresh them instead
  if(typeof refreshSbElementLists === 'function') refreshSbElementLists();
(function(){
  const ruler=document.getElementById('tlRuler');
  for(let b=0;b<=32;b++){
    const tick=document.createElement('div');tick.style.cssText=`position:absolute;top:0;bottom:0;left:${b/32*100}%;border-left:1px solid rgba(255,255,255,${b%4===0?0.08:0.03})`;ruler.appendChild(tick);
    if(b%4===0){const lbl=document.createElement('div');lbl.style.cssText=`position:absolute;top:2px;left:${b/32*100}%;font-size:5px;color:rgba(255,255,255,0.15);transform:translateX(2px)`;lbl.textContent=b;ruler.appendChild(lbl);}
  }
})();
(function(){
  // ── SNAPSHOT OR URL STATE — load shared field on boot ───────────────────────
  const _snapshotMatch = window.location.pathname.match(/^\/s\/([a-zA-Z0-9]{6,12})$/);
  let _loadedFromURL = false;
  if (_snapshotMatch) {
    // Load from snapshot ID — async, handled after boot
    loadFromSnapshot(_snapshotMatch[1]).then(ok => {
      if (ok) {
        updateDrumGain(); updateDrumSends(); clearVoiceMotifCache();
        applyReverbForGenre(currentStyle);
        document.getElementById('styleSelect').value = currentStyle;
        buildDrumGrid(); renderElList(); renderVibes();
        updateLiveSetLabel(); syncSbSelectsFromHidden();
      }
    });
  } else {
    _loadedFromURL = loadFromURL(); // fallback: ?fg= param
  }
  if (_loadedFromURL) {
    // State hydrated from URL — apply audio/UI side effects now
    updateDrumGain(); updateDrumSends(); clearVoiceMotifCache();
    applyReverbForGenre(currentStyle);
    document.getElementById('styleSelect').value = currentStyle;
    const _dp = activeDrumPreset;
    const _p  = DRUM_PRESETS[_dp];
    if (_p) {
      drumPattern.kick=[..._p.kick]; drumPattern.clap=[..._p.clap];
      drumPattern.hihat=[..._p.hihat]; drumPattern.openhh=[..._p.openhh];
      drumPattern.perc=[..._p.perc]; drumPattern.snap=[...(_p.snap||Array(16).fill(0))];
    }
    setTimeout(() => {
      buildDrumGrid(); renderElList(); renderVibes();
      updateLiveSetLabel(); syncSbSelectsFromHidden();
    }, 0);
  }

  // Safe localStorage helpers — iOS Safari Private Browsing throws SecurityError
  // on every read/write, which would otherwise crash this entire init block.
  const _ls = {
    get(k){ try{ return localStorage.getItem(k); } catch(e){ return null; } },
    set(k,v){ try{ localStorage.setItem(k,v); } catch(e){} },
  };
  // ── FIRST RUN DETECTION ──────────────────────────────────────────────────
  // On first load ever, open in Live Mode with Deep House.
  // After that, remember last mode.
  const _isFirstRun = !_loadedFromURL && !_ls.get('fg_hasOpened');
  const _lastWasLive = _ls.get('fg_lastMode') === 'live';

  // Use Deep House for first run, time-of-day genre otherwise
  const todGenre = _isFirstRun ? 'deephouse' : getTimeOfDayGenre();
  const todStyle=STYLES[todGenre]||STYLES['deephouse'];
  currentStyle=todGenre;
  applyReverbForGenre(currentStyle);
  document.getElementById('styleSelect').value=todGenre;
  const root='A', scale='Minor';
  const arr=todStyle.arrangement;
  // Apply genre layer limits to startup scene — sparse genres stay sparse
  const _todLimits = GENRE_LAYER_LIMITS[todGenre] || { min:4, max:6 };
  const _todSubs = arr.filter(r=>r.soundType==='Sub');
  const _todReq  = arr.filter(r=>r._required&&r.soundType!=='Sub');
  const _todOther= arr.filter(r=>r.soundType!=='Sub'&&!r._required).sort(()=>Math.random()-.5);
  const _todMax  = Math.min(_todLimits.max - _todSubs.length - _todReq.length, _todOther.length);
  const _todMin  = Math.max(0, _todLimits.min - _todSubs.length - _todReq.length);
  const _todPick = _todMin + Math.floor(Math.random()*Math.max(1,_todMax-_todMin+1));
  const _todArr  = [..._todSubs.slice(0,1), ..._todReq, ..._todOther.slice(0,_todPick)];
  if (!_loadedFromURL) {
  const fakeElements=_todArr.map((role,i)=>{
    const el=createElement(role.vtype||'blob',role.xPos,role.yPos,nextColor());
    el.soundType=role.soundType; el.variation=role.variation; applyPreset(el);
    if(role.shape) el.shape={...el.shape,...role.shape};
    if(role.tone)  el.tone ={...el.tone, ...role.tone};
    if(role.space) el.space={...el.space,...role.space};
    el.note=getHarmonicNote(root,scale,role.deg,role.oct);
    el.volume=role.vol; el.pan=role.pan; el.radius=role.radius;
    applyRoleAndTriggerMode(el);
    el.x1=el.x-0.15;el.y1=el.y;el.x2=el.x+0.15;el.y2=el.y;el.pos=el.x;
    return el;
  });
  elements=fakeElements;
  nextId=elements.length+1;
  bpm=pickBpm(todStyle);
  document.getElementById('bpmVal').textContent=Math.round(bpm);
  startBpmDrift(bpm, todStyle.bpmRange);
  const dp=todStyle.drumPreset??0;
  activeDrumPreset=dp;
  activeDrumStyle=DRUM_PRESETS[dp]?.drumStyle||'house'; updateDrumGain(); updateDrumSends(); clearVoiceMotifCache();
  const p=DRUM_PRESETS[dp];
  if(p){drumPattern.kick=[...p.kick];drumPattern.clap=[...p.clap];
        drumPattern.hihat=[...p.hihat];drumPattern.openhh=[...p.openhh];drumPattern.perc=[...p.perc];
        drumPattern.snap=[...(p.snap||Array(16).fill(0))];}
  _drumBankIdx=-1;
  if(DRUM_BANK[currentStyle]) rotateDrumPattern();
  const todState={bgColor:'#000000',elements:elements.map(e=>({...e})),drumPattern:{...drumPattern},activeDrumPreset:dp,bpm};
  addScene(todStyle.name, todState, hexToRgba(elements[0]?.color||'#888',0.15), 0, 8);
  activeSceneId=scenes[0].id;
  renderSceneList(); renderSceneBlocks();
  // Defensive: any single render failure shouldn't cascade and leave panels empty
  try { buildDrumGrid(); }       catch(e){ console.error('buildDrumGrid:', e); }
  try { renderElList(); }        catch(e){ console.error('renderElList:', e); }
  try { renderVibes(); }         catch(e){ console.error('renderVibes:', e); }
  try { updateLiveSetLabel(); }  catch(e){ console.error('updateLiveSetLabel:', e); }
  if(activeId){activeId=null;showFieldPanel();}
  } // end !_loadedFromURL
  conductorLerpTick();
  // Mobile: go straight to live mode without waiting for a touch event
  let audioUnlocked=false;
  function unlockAudio(){
    if(audioUnlocked) return;
    audioUnlocked=true;
    if(!audioCtx) initAudio();
    if(audioCtx && audioCtx.state==='suspended') audioCtx.resume();
    soundEnabled=true;
    document.getElementById('btnAudio').classList.add('on');
    document.getElementById('btnAudio').textContent='Audio';
    ensureMasterHPF();
    startBeat();
    startIntroArc();
    _ls.set('fg_hasOpened', '1');
    showToast('Loading…');
    // Init recorder tap node now that audio context exists
    setTimeout(() => Recorder.init(), 200);
  }
  // Save mode on live enter/exit
  const _origEnterLive = enterLiveMode;
  window.enterLiveMode = function(){
    _origEnterLive();
    _ls.set('fg_lastMode', 'live');
    _ls.set('fg_hasOpened', '1');
  };
  const _origExitLive = exitLiveMode;
  window.exitLiveMode = function(){
    _origExitLive();
    _ls.set('fg_lastMode', 'studio');
  };

  const _isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || ('ontouchstart' in window);
  if(_isMobile || _isFirstRun || _lastWasLive){
    enterLiveMode();
  }

  document.addEventListener('touchend', function firstTouch(e){
    unlockAudio();
    document.removeEventListener('touchend', firstTouch);
  }, {once:true, passive:true});
  document.addEventListener('click', function firstClick(){
    unlockAudio();
    document.removeEventListener('click', firstClick);
  }, {once:true});
  document.getElementById('btnAudio').addEventListener('touchend', e=>{
    e.preventDefault();
    unlockAudio();
  }, {passive:false});
})();
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden && audioCtx && audioCtx.state==='suspended' && soundEnabled){
    audioCtx.resume();
  }
});

// ── Sound type role groups ───────────────────────────────────────────────────
// ─── TWO-STATE SIDEBAR ────────────────────────────────────────────────────────
// Field Settings (default) ↔ Sound Settings (element selected)

function showFieldPanel(){
  document.getElementById('panelField')?.classList.add('active');
  document.getElementById('panelSound')?.classList.remove('active');
  renderFieldElementList();
  syncSbSelectsFromHidden();

}

function showSoundPanel(el){
  document.getElementById('panelField')?.classList.remove('active');
  document.getElementById('panelSound')?.classList.add('active');
  // Mobile overlay is opened explicitly by openMobileSidebar() — not here
  const title = document.getElementById('soundPanelTitle');
  if(title) title.textContent = (el.soundType||'Sound') + ' Settings';
  // Update sound type display
  const def = SOUND_TYPES[el.soundType] || {};
  const iconEl = document.getElementById('soundTypeIcon');
  const nameEl = document.getElementById('soundTypeName');
  const subEl  = document.getElementById('soundTypeSub');
  if(iconEl) iconEl.textContent = def.icon || el.soundType?.slice(0,2) || '◎';
  if(iconEl && def.color) { iconEl.style.background = def.color+',0.12)'; iconEl.style.borderColor = def.color+',0.25)'; iconEl.style.color = def.color+',0.9)'; }
  if(nameEl) nameEl.textContent = el.soundType || 'Sound';
  if(subEl)  subEl.textContent  = def.sub || '';
}

function syncSbSelectsFromHidden(){
  const map = [['styleSelect','sbStyleSelect'],['keySelect','sbKeySelect'],['scaleSelect','sbScaleSelect']];
  map.forEach(([src,dst]) => {
    const s = document.getElementById(src), d = document.getElementById(dst);
    if(s && d && d.value !== s.value) d.value = s.value;
  });
  if(typeof updateSwStatus === 'function'){
    updateSwStatus(); // immediate
    setTimeout(updateSwStatus, 120); // delayed — after currentStyle + bpm settle
  }
}

function renderFieldElementList(){
  const body = document.getElementById('elListBody2');
  const count = document.getElementById('elCount');
  if(!body) return;
  if(count) count.textContent = elements.length;
  body.innerHTML = '';
  if(!elements.length){
    body.innerHTML = '<div style="padding:14px 12px;font-size:8px;color:rgba(255,255,255,0.18)">Click the canvas to place sounds</div>';
    return;
  }
  elements.forEach(el => {
    const def = SOUND_TYPES[el.soundType] || {};
    const varName = def.vars?.[el.variation??0]?.name || el.soundType;
    const row = document.createElement('div');
    row.className = 'el-card' + (el.id===activeId?' active':'');
    row.innerHTML = `
      <div class="el-card-dot" style="background:${el.color};${el.muted?'opacity:0.2':''}"></div>
      <div class="el-card-name" style="${el.muted?'opacity:0.3;text-decoration:line-through':''}">${el.soundType}<span style="color:rgba(255,255,255,0.3);font-size:7.5px;margin-left:4px">${varName}</span></div>
      <div class="el-card-vis" data-del="${el.id}" title="Remove">✕</div>
    `;
    row.addEventListener('click', e => {
      if(e.target.closest('[data-del]')) return;
      openInspector(el.id);
    });
    row.querySelector('[data-del]').addEventListener('click', e => {
      e.stopPropagation();
      removeElement(el.id);
    });
    body.appendChild(row);
  });
}

function initSoundPicker(){
  const scroll = document.getElementById('soundPickerScroll');
  if(!scroll) return;
  scroll.innerHTML = '';

  const groups = [
    { label:'Rhythm',     types:SB_RHYTHM_TYPES },
    { label:'Voice',      types:SB_VOICE_TYPES },
    { label:'Atmosphere', types:SB_ATMOSPHERE_TYPES },
  ];

  groups.forEach(g => {
    // Group header
    const gl = document.createElement('div');
    gl.className = 'sound-picker-group';
    gl.textContent = g.label;
    scroll.appendChild(gl);

    g.types.forEach(stype => {
      const def = SOUND_TYPES[stype];
      if(!def) return;
      const hasVars = def.vars && def.vars.length > 1;

      // Instrument row
      const row = document.createElement('div');
      row.style.cssText = 'border-bottom:1px solid rgba(255,255,255,0.05)';

      const header = document.createElement('div');
      header.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;transition:background .1s';

      // Small blob canvas
      const blobWrap = document.createElement('div');
      blobWrap.style.cssText = 'width:30px;height:30px;flex-shrink:0;position:relative;overflow:visible';
      const blobCanvas = document.createElement('canvas');
      blobCanvas.width = 60; blobCanvas.height = 60;
      blobCanvas.style.cssText = 'position:absolute;width:60px;height:60px;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none';
      blobWrap.appendChild(blobCanvas);
      header.appendChild(blobWrap);
      if(typeof drawSoundLibBlob === 'function'){
        drawSoundLibBlob(blobCanvas, def.color, stype, false, Math.random()*100);
      }

      const textDiv = document.createElement('div');
      textDiv.style.cssText = 'flex:1;min-width:0';
      // Show variant names as a preview line
      const varPreview = hasVars ? def.vars.map(v=>v.name).join(' · ') : '';
      textDiv.innerHTML = `
        <div style="font-size:10px;color:rgba(255,255,255,0.82);font-weight:500">${stype}</div>
        <div style="font-size:7px;color:rgba(255,255,255,0.32);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${varPreview || (def.sub||'')}</div>
      `;
      header.appendChild(textDiv);

      if(hasVars){
        const arr = document.createElement('div');
        arr.style.cssText = 'font-size:10px;color:rgba(255,255,255,0.22);flex-shrink:0';
        arr.textContent = '›';
        header.appendChild(arr);
        header._arrow = arr;
      }

      header.addEventListener('mouseover', ()=>{ header.style.background='rgba(255,255,255,0.03)'; });
      header.addEventListener('mouseout',  ()=>{ header.style.background=''; });

      row.appendChild(header);

      if(hasVars){
        // Variants panel — hidden by default
        const panel = document.createElement('div');
        panel.style.cssText = 'display:none;padding:2px 12px 8px 12px;background:rgba(255,255,255,0.02)';

        def.vars.forEach((v, i) => {
          const vBtn = document.createElement('div');
          vBtn.style.cssText = 'padding:7px 10px;margin-bottom:3px;border-radius:5px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03);cursor:pointer;font-size:9px;color:rgba(255,255,255,0.7);font-weight:500;transition:all .1s';
          vBtn.textContent = v.name;
          vBtn.addEventListener('mouseover', ()=>{ vBtn.style.background='rgba(255,255,255,0.08)'; vBtn.style.color='rgba(255,255,255,0.95)'; });
          vBtn.addEventListener('mouseout',  ()=>{ vBtn.style.background='rgba(255,255,255,0.03)'; vBtn.style.color='rgba(255,255,255,0.7)'; });
          vBtn.addEventListener('click', ()=>{
            addInstrumentToCanvas(stype, i);
            closeSoundPicker();
          });
          panel.appendChild(vBtn);
        });

        let open = false;
        const arrow = header._arrow;
        // Store reference on the panel for auto-collapse
        panel._header = header;
        panel._closeFunc = () => {
          open = false;
          panel.style.display = 'none';
          if(arrow){ arrow.textContent = '›'; arrow.style.color = 'rgba(255,255,255,0.22)'; }
        };
        header.addEventListener('click', ()=>{
          open = !open;
          if(open){
            // Auto-collapse all other open panels
            scroll.querySelectorAll('.sp-panel').forEach(p => {
              if(p !== panel && p._closeFunc) p._closeFunc();
            });
          }
          panel.style.display = open ? 'block' : 'none';
          if(arrow) arrow.textContent = open ? '▾' : '›';
          if(arrow) arrow.style.color = open ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.22)';
        });
        panel.className = 'sp-panel';

        row.appendChild(panel);
      } else {
        // No variants — add directly
        header.addEventListener('click', ()=>{
          addInstrumentToCanvas(stype, 0);
          closeSoundPicker();
        });
      }

      scroll.appendChild(row);
    });
  });
}


function openSoundPicker(){
  if(window.innerWidth <= 600){
    // On mobile: build a fresh overlay outside the hidden sidebar
    let mPicker = document.getElementById('mobileSoundPickerOverlay');
    if(!mPicker){
      mPicker = document.createElement('div');
      mPicker.id = 'mobileSoundPickerOverlay';
      document.body.appendChild(mPicker);
    }
    mPicker.style.cssText = 'position:fixed;top:50px;left:0;right:0;bottom:0;z-index:800;background:#09090f;flex-direction:column;overflow:hidden;border-radius:12px 12px 0 0;display:flex';
    mPicker.innerHTML = '';
    // Header
    const hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.08);flex-shrink:0;background:#08080e';
    hdr.innerHTML = '<div style="font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,0.5);flex:1">Add Sound</div><div style="padding:6px 14px;border-radius:20px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.8);font-size:9px;font-weight:600;cursor:pointer" id="mobilePickerClose">✕ Close</div>';
    hdr.querySelector('#mobilePickerClose').onclick = closeSoundPicker;
    mPicker.appendChild(hdr);
    // Scroll area
    const scroll = document.createElement('div');
    scroll.style.cssText = 'flex:1;overflow-y:auto';
    mPicker.appendChild(scroll);
    // Build accordion into scroll
    const groups = [
      { label:'Rhythm', types:SB_RHYTHM_TYPES },
      { label:'Voice',  types:SB_VOICE_TYPES },
      { label:'Atmosphere', types:SB_ATMOSPHERE_TYPES },
    ];
    groups.forEach(g => {
      const gl = document.createElement('div');
      gl.style.cssText = 'padding:10px 14px 3px;font-size:7px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,0.3)';
      gl.textContent = g.label;
      scroll.appendChild(gl);
      g.types.forEach(stype => {
        const def = SOUND_TYPES[stype]; if(!def) return;
        const hasVars = def.vars && def.vars.length > 1;
        const row = document.createElement('div');
        row.style.cssText = 'border-bottom:1px solid rgba(255,255,255,0.05)';
        const header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;min-height:52px';
        header.innerHTML = '<div style="flex:1"><div style="font-size:12px;color:rgba(255,255,255,0.82);font-weight:500">' + stype + '</div><div style="font-size:8.5px;color:rgba(255,255,255,0.38);margin-top:2px">' + (def.sub||'') + '</div></div>' + (hasVars ? '<div style="font-size:12px;color:rgba(255,255,255,0.25)">›</div>' : '');
        row.appendChild(header);
        if(hasVars){
          const panel = document.createElement('div');
          panel.style.cssText = 'display:none;padding:4px 14px 10px 24px;background:rgba(255,255,255,0.02)';
          def.vars.forEach((v,i) => {
            const vb = document.createElement('div');
            vb.style.cssText = 'padding:11px 12px;margin-bottom:4px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);cursor:pointer;font-size:11px;color:rgba(255,255,255,0.75);font-weight:500';
            vb.textContent = v.name;
            vb.addEventListener('click', () => { addInstrumentToCanvas(stype,i); closeSoundPicker(); });
            panel.appendChild(vb);
          });
          let open = false;
          const arr = header.querySelector('div[style*="0.25"]');
          header.addEventListener('click', () => {
            // Collapse all others
            scroll.querySelectorAll('.sp-sub-panel').forEach(p => { if(p!==panel){ p.style.display='none'; const a=p._arr; if(a)a.textContent='›'; } });
            open=!open; panel.style.display=open?'block':'none';
            if(arr) arr.textContent=open?'▾':'›';
          });
          panel.classList.add('sp-sub-panel');
          panel._arr = arr;
          row.appendChild(panel);
        } else {
          header.addEventListener('click', () => { addInstrumentToCanvas(stype,0); closeSoundPicker(); });
        }
        scroll.appendChild(row);
      });
    });
    return;
  }
  // Desktop: use the sidebar sound picker
  initSoundPicker();
  const picker = document.getElementById('soundPicker');
  if(!picker) return;
  picker.classList.add('open');
}

function closeSoundPicker(){
  // Mobile overlay
  const mPicker = document.getElementById('mobileSoundPickerOverlay');
  if(mPicker) mPicker.remove();
  // Desktop
  const picker = document.getElementById('soundPicker');
  if(picker){ picker.classList.remove('open'); picker.style.cssText=''; }
}

function initSidebarTabs(){ initSidebarUI(); } // compat alias

function initSidebarUI(){
  syncSbSelectsFromHidden();
  initSoundPicker();

  // Sound panel close button
  document.getElementById('soundPanelClose')?.addEventListener('click', () => {
    closeInspector();
  });

  // Add sound button — opens sound type picker
  document.getElementById('sbBtnAddSound')?.addEventListener('click', openSoundPicker);
  document.getElementById('soundPickerBack')?.addEventListener('click', closeSoundPicker);

  // Wire sb action buttons to existing functions
  document.getElementById('sbBtnGenerate')?.addEventListener('click', () => {
    document.getElementById('btnGenerate')?.click();
  });
  document.getElementById('sbBtnRand')?.addEventListener('click', () => {
    document.getElementById('btnRnd')?.click();
  });
  document.getElementById('sbBtnDrift')?.addEventListener('click', () => {
    document.getElementById('btnDrift')?.click();
  });

  // Delete button in sound panel
  document.getElementById('sbBtnDelete')?.addEventListener('click', () => {
    if(activeId) removeElement(activeId);
  });

  // Sound Library button
  document.getElementById('sbBtnSoundLib')?.addEventListener('click', () => {
    if(typeof enterSoundLib === 'function') enterSoundLib();
  });

  // Place buttons — highlight only when actively clicked, deactivate after placing
  document.querySelectorAll('.sb-place-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const wasActive = btn.classList.contains('active');
      document.querySelectorAll('.sb-place-btn').forEach(b => b.classList.remove('active'));
      if(!wasActive){
        currentTool = btn.dataset.vt;
        btn.classList.add('active');
        showToast('Click canvas to place ' + btn.dataset.vt);
      } else {
        // Second click deselects
        currentTool = 'blob';
      }
    });
  });

  // Deactivate place buttons after placing on canvas
  const _origCanvasMousedown = document.getElementById('canvas')?.onmousedown;
  document.getElementById('canvas')?.addEventListener('mousedown', () => {
    setTimeout(() => {
      document.querySelectorAll('.sb-place-btn').forEach(b => b.classList.remove('active'));
    }, 200);
  }, {passive:true});

  // Edit Drums button — open drum machine overlay
  document.getElementById('sbBtnEditDrums')?.addEventListener('click', () => {
    buildDrumGrid();
    document.getElementById('drumMachinePanel')?.classList.add('open');
  });
  document.getElementById('drumMachineBack')?.addEventListener('click', () => {
    document.getElementById('drumMachinePanel')?.classList.remove('open');
  });

  // Change Sound Type — opens sound type picker
  document.getElementById('sbBtnChangeSoundType')?.addEventListener('click', openSoundPicker);

  // Sync hidden selects back to sb selects on change
  ['styleSelect','keySelect','scaleSelect'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', syncSbSelectsFromHidden);
  });

  // Floating capsule buttons
  document.getElementById('cmdGenerate')?.addEventListener('click', () => {
    document.getElementById('btnGenerate')?.click();
  });
  document.getElementById('cmdRandomize')?.addEventListener('click', () => {
    document.getElementById('btnRnd')?.click();
  });

  initSwControls();
  showFieldPanel();
}

function updateCmdCapsule(){
  const capsule = document.getElementById('cmdCapsule');
  if(!capsule) return;
  // Hide when element selected (Sound Settings showing)
  const soundActive = document.getElementById('panelSound')?.classList.contains('active');
  // Push up when arc bar is visible
  const arcVisible = document.getElementById('arcBarEl')?.classList.contains('visible');
  capsule.classList.toggle('hidden', !!soundActive);
  capsule.classList.toggle('arc-visible', !!arcVisible && !soundActive);
}

function refreshSbElementLists(){
  if(typeof SB_RHYTHM_TYPES === 'undefined') return;
  renderFieldElementList();
}



function addInstrumentToCanvas(stype, variation=0){
  const x = 0.2 + Math.random()*0.6;
  const y = 0.2 + Math.random()*0.6;
  const vtype = pickVisualType(stype, x, y);
  const el = createElement(vtype, x, y, nextColor());
  el.soundType = stype;
  el.variation = variation;
  applyPreset(el);
  applyRoleAndTriggerMode(el);
  const root  = document.getElementById('keySelect')?.value||'A';
  const scale = document.getElementById('scaleSelect')?.value||'Minor';
  el.note = getHarmonicNote(root, scale, 0, 4);
  elements.push(el);
  if(soundEnabled) maybeStartDrone(el);
  renderElList();
  openInspector(el.id);
  const varName = SOUND_TYPES[stype]?.vars?.[variation]?.name || stype;
  showToast(varName + ' added');
}


// Mobile two-state navigation
function mobileShowPanel(panel){
  document.querySelectorAll('.mobile-nav-btn').forEach(b => b.classList.remove('active'));

  if(panel === 'fields'){
    document.getElementById('mNavField')?.classList.add('active');
    closeAllSheets();
    openSheet('sheetVibes'); // left Fields panel as a sheet
  } else if(panel === 'settings'){
    document.getElementById('mNavSettings')?.classList.add('active');
    // Show sidebar directly as overlay on mobile
    const sb = document.querySelector('.sidebar');
    if(sb){
      sb.style.cssText = 'display:flex!important;position:fixed;top:50px;left:0;right:0;bottom:0;z-index:600;width:100%!important;max-width:100%;flex-direction:column;border-radius:12px 12px 0 0;overflow:hidden';
      // Remove any previous close bar
      const prev = sb.querySelector('#sbMobileCloseBar');
      if(prev) prev.remove();
      // Add close bar at top
      const closeBar = document.createElement('div');
      closeBar.id = 'sbMobileCloseBar';
      closeBar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.1);background:#08080e;flex-shrink:0';
      closeBar.innerHTML = '<span style="font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,0.45)">Settings</span><div style="padding:6px 14px;border-radius:20px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.8);font-size:9px;font-weight:600;cursor:pointer;letter-spacing:.06em" id="sbMobileCloseBtn">Done</div>';
      closeBar.querySelector('#sbMobileCloseBtn').onclick = () => {
        sb.style.cssText = '';
        closeBar.remove();
        document.querySelectorAll('.mobile-nav-btn').forEach(b=>b.classList.remove('active'));
      };
      sb.insertBefore(closeBar, sb.firstChild);
      syncSbSelectsFromHidden();
    }
  } else if(panel === 'sounds'){
    document.getElementById('mNavSounds')?.classList.add('active');
    closeAllSheets();
    openSoundPicker();
  }
}

// Keep old names as aliases
function mobileShowField(){ mobileShowPanel('fields'); }
function mobileShowSounds(){ mobileShowPanel('sounds'); }


// ─── SOUND WORLD STATUS ───────────────────────────────────────────────────────


function initSwControls(){
  // Edit toggle
  const editBtn  = document.getElementById('swEditBtn');
  const expanded = document.getElementById('swExpanded');
  let swOpen = false;
  editBtn?.addEventListener('click', () => {
    swOpen = !swOpen;
    expanded.style.display = swOpen ? 'block' : 'none';
    editBtn.textContent = swOpen ? 'Done' : 'Edit';
    editBtn.style.color = swOpen ? 'rgba(126,232,162,0.8)' : 'rgba(255,255,255,0.45)';
    editBtn.style.borderColor = swOpen ? 'rgba(126,232,162,0.25)' : 'rgba(255,255,255,0.1)';
  });

  // Advanced (Key/Scale) toggle
  const advBtn = document.getElementById('swAdvancedToggle');
  const adv    = document.getElementById('swAdvanced');
  let advOpen  = false;
  advBtn?.addEventListener('click', () => {
    advOpen = !advOpen;
    adv.style.display = advOpen ? 'block' : 'none';
    advBtn.textContent = (advOpen ? '▼' : '▶') + ' Key & Scale';
  });

  // BPM box tap-tempo (keep existing behavior, just update status after)
  document.getElementById('bpmBox')?.addEventListener('click', () => {
    setTimeout(updateSwStatus, 300);
  });

  // Update status whenever style changes
  document.getElementById('styleSelect')?.addEventListener('change', () => {
    setTimeout(updateSwStatus, 50);
  });

  updateSwStatus();
}


function renderMobileSettings(){
  const body = document.getElementById('sheetSettingsBody');
  const title = document.getElementById('sheetSettingsTitle');
  if(!body) return;
  // Clone the sidebar content into the sheet
  const sidebar = document.querySelector('.sidebar');
  if(!sidebar) return;
  // Show the right panel label
  const isSound = document.getElementById('panelSound')?.classList.contains('active');
  if(title) title.textContent = isSound ? 'Sound Settings' : 'Field Settings';
  body.innerHTML = '';
  // Clone active panel content
  const activePanel = sidebar.querySelector('.sb-panel.active');
  if(activePanel){
    const clone = activePanel.cloneNode(true);
    clone.style.display = 'block';
    clone.style.maxHeight = 'none';
    clone.style.overflow = 'visible';
    body.appendChild(clone);
  }
}

function renderMobileSoundPicker(){
  const body = document.getElementById('sheetSoundPickerBody');
  if(!body) return;
  body.innerHTML = '';
  // Build accordion directly into body
  const groups = [
    { label:'Rhythm',     types:SB_RHYTHM_TYPES },
    { label:'Voice',      types:SB_VOICE_TYPES },
    { label:'Atmosphere', types:SB_ATMOSPHERE_TYPES },
  ];
  groups.forEach(g => {
    const gl = document.createElement('div');
    gl.style.cssText = 'padding:8px 12px 3px;font-size:7px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,0.3)';
    gl.textContent = g.label;
    body.appendChild(gl);
    g.types.forEach(stype => {
      const def = SOUND_TYPES[stype]; if(!def) return;
      const hasVars = def.vars && def.vars.length > 1;
      const row = document.createElement('div');
      row.style.cssText = 'border-bottom:1px solid rgba(255,255,255,0.05)';
      const header = document.createElement('div');
      header.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:pointer';
      header.innerHTML = `<div style="flex:1"><div style="font-size:11px;color:rgba(255,255,255,0.82);font-weight:500">${stype}</div><div style="font-size:8px;color:rgba(255,255,255,0.38);margin-top:2px">${def.sub||''}</div></div>${hasVars?'<div style="font-size:11px;color:rgba(255,255,255,0.25)">›</div>':''}`;
      row.appendChild(header);
      if(hasVars){
        const panel = document.createElement('div');
        panel.style.cssText = 'display:none;padding:2px 12px 8px 20px;background:rgba(255,255,255,0.02)';
        def.vars.forEach((v,i) => {
          const vb = document.createElement('div');
          vb.style.cssText = 'padding:9px 10px;margin-bottom:4px;border-radius:5px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);cursor:pointer;font-size:10px;color:rgba(255,255,255,0.75);font-weight:500';
          vb.textContent = v.name;
          vb.addEventListener('click', () => { addInstrumentToCanvas(stype,i); if(window.openSheet) openSheet(null); });
          panel.appendChild(vb);
        });
        let open = false;
        const arr = header.querySelector('div[style*="0.25"]');
        header.addEventListener('click', () => {
          open = !open; panel.style.display = open?'block':'none';
          if(arr) arr.textContent = open?'▾':'›';
        });
        row.appendChild(panel);
      } else {
        header.addEventListener('click', () => { addInstrumentToCanvas(stype,0); if(window.openSheet) openSheet(null); });
      }
      body.appendChild(row);
    });
  });
}


// Open mobile sidebar overlay — only called by explicit user action
function openMobileSidebar(titleText, onClose){
  if(window.innerWidth > 600) return;
  const sb = document.querySelector('.sidebar');
  if(!sb) return;
  sb.style.cssText = 'display:flex!important;position:fixed;top:50px;left:0;right:0;bottom:0;z-index:600;width:100%!important;max-width:100%;flex-direction:column;border-radius:12px 12px 0 0;overflow:hidden';
  const prev = sb.querySelector('#sbMobileCloseBar');
  if(prev) prev.remove();
  const closeBar = document.createElement('div');
  closeBar.id = 'sbMobileCloseBar';
  closeBar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.1);background:#08080e;flex-shrink:0;z-index:10';
  closeBar.innerHTML = '<span style="font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,0.45)">' + (titleText||'Settings') + '</span><div style="padding:6px 16px;border-radius:20px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.85);font-size:9px;font-weight:600;cursor:pointer">Done</div>';
  closeBar.querySelector('div[style]').onclick = () => {
    closeMobileSidebar();
    if(onClose) onClose();
  };
  sb.insertBefore(closeBar, sb.firstChild);
}

function closeMobileSidebar(){
  if(window.innerWidth > 600) return;
  const sb = document.querySelector('.sidebar');
  if(sb && sb.style.position === 'fixed'){
    sb.style.cssText = '';
    const bar = sb.querySelector('#sbMobileCloseBar');
    if(bar) bar.remove();
  }
  document.querySelectorAll('.mobile-nav-btn').forEach(b => b.classList.remove('active'));
}


// ─── FIRST-RUN CHOREOGRAPHY ───────────────────────────────────────────────────
// Quiet onboarding: pulse one blob, show "HOLD THIS SOUND", dismiss on first hold.
// Never shows again after dismissed.

let _choregraphyDone = (function(){ try { return !!localStorage.getItem('fg_choreo_done'); } catch(e){ return false; } })();
let _choreoHintEl = null;
let _choreoArrowEl = null;
let _choreoTargetId = null;
let _choreoInterval = null;

function startFirstRunChoreo(){
  if(_choregraphyDone) return;
  if(!_liveMode) return;
  // Wait for elements to be on canvas
  if(!elements.length){ setTimeout(startFirstRunChoreo, 800); return; }

  // Pick the best element to highlight — prefer Sub, then Pad, then first
  const target = elements.find(e=>e.soundType==='Sub' && !e.muted)
               || elements.find(e=>e.soundType==='Pad' && !e.muted)
               || elements.find(e=>!e.muted);
  if(!target) return;

  _choreoTargetId = target.id;

  // Create hint overlay
  _choreoHintEl = document.createElement('div');
  _choreoHintEl.id = 'choreoHint';
  _choreoHintEl.style.cssText = [
    'position:fixed',
    'pointer-events:none',
    'z-index:850',
    'text-align:center',
    'opacity:0',
    'transition:opacity .6s',
    'transform:translateX(-50%)',
  ].join(';');
  _choreoHintEl.innerHTML = [
    '<div style="font-size:9px;letter-spacing:.20em;color:rgba(255,255,255,0.9);',
    'text-transform:uppercase;text-shadow:0 0 20px rgba(0,0,0,1);font-weight:600;',
    'margin-bottom:6px">Hold This Sound</div>',
    '<div style="width:1px;height:24px;background:linear-gradient(to bottom,rgba(255,255,255,0.6),transparent);',
    'margin:0 auto"></div>',
  ].join('');
  document.body.appendChild(_choreoHintEl);

  // Position and show after 1.5s
  setTimeout(()=>{
    if(!_choreoHintEl) return;
    positionChoreoHint(target);
    _choreoHintEl.style.opacity = '1';

    // Pulse the target element
    _choreoInterval = setInterval(()=>{
      const el = elements.find(e=>e.id===_choreoTargetId);
      if(el && !el._touchHeld){
        el._pulse = Math.max(el._pulse, 0.7);
        el._flashPulse = Math.max(el._flashPulse, 0.4);
      }
    }, 800);

    // Ghost finger animation after 5s if no interaction
    setTimeout(()=>{
      if(!_choregraphyDone && _choreoHintEl){
        animateChoreoGhost(target);
      }
    }, 5000);

  }, 1500);
}

function positionChoreoHint(el){
  if(!_choreoHintEl) return;
  const canvas = document.getElementById('canvas');
  if(!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const hp = elHandlePos ? elHandlePos(el) : {x:el.x*rect.width, y:el.y*rect.height};
  const px = rect.left + hp.x;
  const py = rect.top  + hp.y - (el.radius||0.35) * Math.min(rect.width,rect.height) * 0.5 - 70;
  _choreoHintEl.style.left = px + 'px';
  _choreoHintEl.style.top  = py + 'px';
}

function animateChoreoGhost(el){
  // Brief wiggle on the target element to suggest interaction
  if(!el || _choregraphyDone) return;
  const canvas = document.getElementById('canvas');
  if(!canvas) return;
  const ghost = document.createElement('div');
  ghost.style.cssText = [
    'position:fixed',
    'width:44px',
    'height:44px',
    'border-radius:50%',
    'border:2px solid rgba(255,255,255,0.5)',
    'pointer-events:none',
    'z-index:851',
    'transform:translate(-50%,-50%)',
    'animation:ghostPulse 1.2s ease-in-out 2 forwards',
  ].join(';');
  const rect = canvas.getBoundingClientRect();
  const hp = elHandlePos ? elHandlePos(el) : {x:el.x*rect.width, y:el.y*rect.height};
  ghost.style.left = (rect.left + hp.x) + 'px';
  ghost.style.top  = (rect.top  + hp.y) + 'px';
  document.body.appendChild(ghost);
  setTimeout(()=>ghost.remove(), 2600);
}

function dismissChoreo(){
  if(_choregraphyDone) return;
  _choregraphyDone = true;
  try { localStorage.setItem('fg_choreo_done', '1'); } catch(e){}
  if(_choreoInterval){ clearInterval(_choreoInterval); _choreoInterval=null; }
  if(_choreoHintEl){
    _choreoHintEl.style.opacity = '0';
    setTimeout(()=>{ if(_choreoHintEl){ _choreoHintEl.remove(); _choreoHintEl=null; } }, 700);
  }
}

(function(){
  const isMobile=()=>window.innerWidth<=600;
  let activeSheet=null;
  window.openSheet = function openSheet(id){
    if(activeSheet===id){closeAllSheets();return;}
    closeAllSheets(false);
    const el=document.getElementById(id);
    if(!el) return;
    el.style.display='flex';
    requestAnimationFrame(()=>el.classList.add('open'));
    activeSheet=id;
    document.querySelectorAll('.mobile-nav-btn').forEach(btn=>{
      btn.classList.toggle('active',btn.dataset.sheet===id);
    });
    if(id==='sheetVibes')   renderMobileVibes();
    if(id==='sheetSettings')  renderMobileSettings();
    if(id==='sheetSoundPicker') renderMobileSoundPicker();
    if(id==='sheetElements') renderMobileElements();
    if(id==='sheetDrums')   renderMobileDrums();
    // sheetStyle removed — genre moved to Field Settings
  }
  window.closeAllSheets = function closeAllSheets(clearActive=true){
    document.querySelectorAll('.mobile-sheet').forEach(el=>{
      el.classList.remove('open');
      setTimeout(()=>{ if(!el.classList.contains('open')) el.style.display='none'; },260);
    });
    if(clearActive){
      activeSheet=null;
      document.querySelectorAll('.mobile-nav-btn').forEach(b=>b.classList.remove('active'));
    }
  }
  document.getElementById('canvas').addEventListener('touchstart',()=>{
    if(activeSheet) closeAllSheets();
  },{passive:true});
  document.querySelectorAll('.mobile-nav-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(!isMobile()) return;
      openSheet(btn.dataset.sheet);
    });
  });
  function renderMobileVibes(){
    const builtIn=document.getElementById('vibesBuiltInM');
    const saved=document.getElementById('vibesSavedM');
    if(!builtIn) return;
    builtIn.innerHTML=document.getElementById('vibesBuiltIn').innerHTML;
    saved.innerHTML=document.getElementById('vibesSaved')?.innerHTML||'';
    builtIn.querySelectorAll('.vibe-item').forEach((item,i)=>{
      item.addEventListener('click',()=>{
        const v=BUILT_IN_VIBES[i];
        if(!v) return;
        const vibeToStyle=Object.fromEntries(BUILT_IN_VIBES.map(vv=>[vv.name,vv.style||'deephouse']));
        const newStyle=vibeToStyle[v.name]||currentStyle;
        document.getElementById('styleSelect').value=newStyle;
        activeVibeName=v.name;
        const stateSnapshot=JSON.parse(JSON.stringify(v.state));
        morphToGenre(newStyle, ()=>{
          loadState(stateSnapshot);
          const activeStyleDef=STYLES[currentStyle];
          if(activeStyleDef?.drumPreset!=null){
            const dp=activeStyleDef.drumPreset;
            activeDrumPreset=dp;
            activeDrumStyle=DRUM_PRESETS[dp]?.drumStyle||activeStyleDef.drumStyle||'house'; updateDrumGain(); updateDrumSends(); clearVoiceMotifCache();
            const p=DRUM_PRESETS[dp];
            if(p){drumPattern.kick=[...p.kick];drumPattern.clap=[...p.clap];drumPattern.hihat=[...p.hihat];drumPattern.openhh=[...p.openhh];drumPattern.perc=[...p.perc];drumPattern.snap=[...(p.snap||Array(16).fill(0))];}
            _drumBankIdx=-1;
            if(DRUM_BANK[currentStyle]) rotateDrumPattern();
          }
          showToast('Loaded: '+v.name);
        });
        closeAllSheets();
      });
    });
  }
  function renderMobileElements(){
    const body=document.getElementById('elListBodyM');
    if(!body) return;
    body.innerHTML=document.getElementById('elListBody').innerHTML;
    body.querySelectorAll('.el-card').forEach((card,i)=>{
      card.addEventListener('click',()=>{
        const el=elements[i];
        if(!el) return;
        activeId=el.id;
        openInspector(el.id);
        closeAllSheets();
      });
    });
  }
  function renderMobileDrums(){
    const body=document.getElementById('sheetDrumsBody');
    if(!body) return;
    const drumSrc=document.querySelector('.drum-section');
    if(drumSrc) body.innerHTML=drumSrc.outerHTML;
    // Voice → color prefix lookup (matches buildDrumGrid)
    const VOICE_COLORS = {
      kick:'rgba(255,80,80',  clap:'rgba(255,200,80', snap:'rgba(255,140,180',
      hihat:'rgba(180,220,255', openhh:'rgba(120,200,255', perc:'rgba(200,160,255',
    };
    body.querySelectorAll('.drum-cell').forEach(cell=>{
      cell.addEventListener('click',()=>{
        const voice=cell.dataset.voice, step=+cell.dataset.step;
        if(!voice||isNaN(step)) return;
        if(!drumPattern[voice]) drumPattern[voice]=Array(16).fill(0);
        drumPattern[voice][step]=drumPattern[voice][step]?0:1;
        const isOn=!!drumPattern[voice][step];
        cell.classList.toggle('on',isOn);
        const c=VOICE_COLORS[voice]||'rgba(255,255,255';
        cell.style.background=isOn?c+',0.15)':'';
      });
    });
    body.querySelectorAll('.drum-preset-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const dpi=+btn.dataset.dpi;
        activeDrumPreset=dpi;
        const p=DRUM_PRESETS[dpi];
        if(!p) return;
        drumPattern.kick=[...p.kick];drumPattern.clap=[...p.clap];
        drumPattern.hihat=[...p.hihat];drumPattern.openhh=[...p.openhh];drumPattern.perc=[...p.perc];
        drumPattern.snap=[...(p.snap||Array(16).fill(0))];
        activeDrumStyle=p.drumStyle||'house'; updateDrumGain(); updateDrumSends(); clearVoiceMotifCache();
        buildDrumGrid();
        renderMobileDrums(); // refresh
      });
    });
  }
  const GENRE_LABELS={
    deephouse:'Deep House', techhouse:'Tech House', acidhouse:'Acid House',
    detroittechno:'Detroit', minimaltechno:'Minimal', dubtechno:'Dub Techno',
    ukgarage:'UK Garage', dnb:'D&B', ambienttechno:'Ambient',
    trance:'Trance', hardcore:'Hardcore', downtempo:'Downtempo',
    electronica:'Electronica', italo:'Italo Disco'
  };
  document.getElementById('keySelectM')?.addEventListener('change',e=>{
    document.getElementById('keySelect').value=e.target.value;
    document.getElementById('keySelect').dispatchEvent(new Event('change'));
  });
  document.getElementById('scaleSelectM')?.addEventListener('change',e=>{
    document.getElementById('scaleSelect').value=e.target.value;
    document.getElementById('scaleSelect').dispatchEvent(new Event('change'));
  });
  function rebuildAllArps(){
    elements.forEach(el=>{
      if(el.soundType==='Arp'){
        el._arpPattern=null; el._arpStep=0; el._arpStepCounter=0;
      }
    });
  }
  document.getElementById('keySelect').addEventListener('change', ()=>{ rebuildAllArps(); clearVoiceMotifCache(); });
  document.getElementById('scaleSelect').addEventListener('change', ()=>{ rebuildAllArps(); clearVoiceMotifCache(); });
  document.getElementById('mBtnRnd')?.addEventListener('click',()=>{
    document.getElementById('btnRnd').click();
    closeAllSheets();
    showToast('Randomized');
  });
  document.getElementById('mBtnGenerate')?.addEventListener('click',()=>{
    document.getElementById('btnGenerate').click();
    closeAllSheets();
  });
  document.getElementById('mBtnSave')?.addEventListener('click',()=>{
    document.getElementById('btnSave').click();
    closeAllSheets();
  });
  document.getElementById('vibesSaveBtnM')?.addEventListener('click',()=>{
    document.getElementById('vibesSaveBtn').click();
    closeAllSheets();
  });
  const canvas=document.getElementById('canvas');
  function touchToMouse(touch, type){
    canvas.dispatchEvent(new MouseEvent(type,{
      bubbles:true, cancelable:true,
      clientX:touch.clientX, clientY:touch.clientY,
    }));
  }
  canvas.addEventListener('touchstart',e=>{
    if(_liveMode) return; // Live mode handles touch via pointer events
    if(e.touches.length===1) touchToMouse(e.touches[0],'mousedown');
  },{passive:true});
  canvas.addEventListener('touchmove',e=>{
    if(_liveMode) return;
    if(e.touches.length===1){
      e.preventDefault();
      touchToMouse(e.touches[0],'mousemove');
    }
  },{passive:false});
  canvas.addEventListener('touchend',e=>{
    if(e.changedTouches.length===1) touchToMouse(e.changedTouches[0],'mouseup');
  },{passive:true});
  document.getElementById('elClose')?.addEventListener('click',()=>{
    closeInspector();
  });
  let swipeStartY=0;
  document.querySelectorAll('.mobile-sheet').forEach(sheet=>{
    sheet.addEventListener('touchstart',e=>{
      swipeStartY=e.touches[0].clientY;
    },{passive:true});
    sheet.addEventListener('touchend',e=>{
      const dy=e.changedTouches[0].clientY-swipeStartY;
      if(dy>60) closeAllSheets(); // swipe down 60px = close
    },{passive:true});
  });
  window.addEventListener('resize',()=>{
    if(!isMobile()) closeAllSheets();
  });
  const _origRenderElList=renderElList;
  window.renderElList=function(){
    _origRenderElList();
    if(activeSheet==='sheetElements') renderMobileElements();
  };

  // Init sidebar tabs
  initSidebarTabs();
  refreshSbElementLists();

  // Sync sb selects on style change from anywhere
  const _sbStyleObs = new MutationObserver(() => syncSbSelectsFromHidden());
  const styleSelEl = document.getElementById('styleSelect');
  if(styleSelEl) styleSelEl.addEventListener('change', syncSbSelectsFromHidden);

})();
