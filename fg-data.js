// fg-data.js — Static app vocabulary: pure data constants, no logic, no side effects.
// All other modules import from here. Nothing here writes to anything.

const SOUND_TYPES = {
  Pulse: {
    icon:'PL', sub:'Chord stabs', color:'rgba(251,191,36',
    vars:[
      {name:'House Stab', shape:{x:0.25,y:0.2}, tone:{x:0.6,y:0.35}, space:{x:0.35,y:0.4}},
      {name:'Chord Hit',  shape:{x:0.15,y:0.15}, tone:{x:0.45,y:0.55}, space:{x:0.5,y:0.5}},
      {name:'Pluck',      shape:{x:0.7,y:0.2},  tone:{x:0.75,y:0.2},  space:{x:0.25,y:0.3}},
      {name:'Organ Hit',  shape:{x:0.35,y:0.35}, tone:{x:0.5,y:0.6},  space:{x:0.4,y:0.55}},
    ]
  },
  Drone: {
    icon:'∿', sub:'Sustained pads', color:'rgba(167,139,250',
    vars:[
      {name:'Deep Wash',  shape:{x:0.85,y:0.95}, tone:{x:0.2,y:0.05},  space:{x:0.7,y:0.6}},
      {name:'Shimmer',    shape:{x:0.65,y:0.9},  tone:{x:0.55,y:0.12}, space:{x:0.65,y:0.8}},
      {name:'Dark Pulse', shape:{x:0.7,y:0.8},   tone:{x:0.3,y:0.2},   space:{x:0.5,y:0.45}},
      {name:'Chord Pad',  shape:{x:0.6,y:0.85},  tone:{x:0.35,y:0.15}, space:{x:0.6,y:0.65}},
    ]
  },
  Acid: {
    icon:'AC', sub:'Acid bass line', color:'rgba(255,107,107',
    vars:[
      {name:'Short Stab', shape:{x:0.30,y:0.5},  tone:{x:0.60,y:0.65}, space:{x:0.25,y:0.30}},
      {name:'Slide',      shape:{x:0.55,y:0.65}, tone:{x:0.50,y:0.55}, space:{x:0.28,y:0.35}},
      {name:'Wobble',     shape:{x:0.60,y:0.70}, tone:{x:0.45,y:0.50}, space:{x:0.35,y:0.45}},
      {name:'Open',       shape:{x:0.70,y:0.75}, tone:{x:0.40,y:0.40}, space:{x:0.32,y:0.42}},
    ]
  },
  SFX: {
    icon:'FX', sub:'Sound effects', color:'rgba(255,180,50',
    vars:[
      {name:'Siren',   shape:{x:0.5,y:0.5},  tone:{x:0.5,y:0.5},  space:{x:0.5,y:0.5}},
      {name:'UFO',     shape:{x:0.5,y:0.5},  tone:{x:0.5,y:0.5},  space:{x:0.6,y:0.6}},
      {name:'Shutter', shape:{x:0.8,y:0.3},  tone:{x:0.6,y:0.4},  space:{x:0.2,y:0.2}},
      {name:'Zap',     shape:{x:0.9,y:0.2},  tone:{x:0.7,y:0.3},  space:{x:0.2,y:0.2}},
      {name:'Riser',   shape:{x:0.3,y:0.8},  tone:{x:0.4,y:0.6},  space:{x:0.6,y:0.7}},
      {name:'Vinyl',   shape:{x:0.4,y:0.7},  tone:{x:0.3,y:0.3},  space:{x:0.5,y:0.5}},
    ]
  },
  Sub: {
    icon:'◉', sub:'Low end', color:'rgba(100,80,220',
    vars:[
      {name:'Deep 808',   shape:{x:0.35,y:0.95},tone:{x:0.1,y:0.05},  space:{x:0.15,y:0.15}},
      {name:'Punchy',     shape:{x:0.8,y:0.6},  tone:{x:0.25,y:0.2},  space:{x:0.2,y:0.25}},
      {name:'Long Tail',  shape:{x:0.3,y:1.0},  tone:{x:0.1,y:0.08},  space:{x:0.25,y:0.2}},
    ]
  },
  Ring: {
    icon:'○', sub:'Metallic hits', color:'rgba(0,220,200',
    vars:[
      {name:'Bell',       shape:{x:0.2,y:0.65}, tone:{x:0.15,y:0.25}, space:{x:0.45,y:0.4}},
      {name:'Marimba',    shape:{x:0.35,y:0.5}, tone:{x:0.35,y:0.2},  space:{x:0.3,y:0.35}},
      {name:'Metal Perc', shape:{x:0.15,y:0.4}, tone:{x:0.65,y:0.45}, space:{x:0.35,y:0.3}},
      {name:'Gong',       shape:{x:0.1,y:0.85}, tone:{x:0.5,y:0.35},  space:{x:0.6,y:0.5}},
    ]
  },
  Arp: {
    icon:'↑', sub:'Melodic phrase', color:'rgba(74,222,128',
    vars:[
      {name:'Motif',   shape:{x:0.4,y:0.6},  tone:{x:0.4,y:0.2},  space:{x:0.65,y:0.5}},
      {name:'Pulse',   shape:{x:0.2,y:0.3},  tone:{x:0.6,y:0.4},  space:{x:0.3,y:0.4}},
      {name:'Shimmer', shape:{x:0.8,y:0.9},  tone:{x:0.3,y:0.1},  space:{x:0.8,y:0.7}},
      {name:'Phrase',  shape:{x:0.35,y:0.5}, tone:{x:0.5,y:0.3},  space:{x:0.5,y:0.55}},
    ]
  },
  Shimmer:{
    icon:'SH', sub:'Granular shimmer', color:'rgba(196,181,253',
    vars:[
      {name:'Air',     shape:{x:0.80,y:0.92},tone:{x:0.30,y:0.10},space:{x:0.75,y:0.85}},
      {name:'Glimmer', shape:{x:0.70,y:0.88},tone:{x:0.50,y:0.15},space:{x:0.70,y:0.80}},
      {name:'Cloud',   shape:{x:0.85,y:0.95},tone:{x:0.20,y:0.08},space:{x:0.80,y:0.90}},
      {name:'Sparkle', shape:{x:0.60,y:0.80},tone:{x:0.65,y:0.22},space:{x:0.60,y:0.72}},
    ]
  },
  WTPad:{
    icon:'WT', sub:'Analog wavetable', color:'rgba(94,234,212',
    vars:[
      {name:'Juno Pad',  shape:{x:0.75,y:0.9},tone:{x:0.35,y:0.15},space:{x:0.65,y:0.75}},
      {name:'JP String', shape:{x:0.8,y:0.95}, tone:{x:0.25,y:0.10},space:{x:0.70,y:0.80}},
      {name:'Warm Chord',shape:{x:0.65,y:0.85},tone:{x:0.40,y:0.20},space:{x:0.60,y:0.70}},
      {name:'Poly Sweep',shape:{x:0.70,y:0.88},tone:{x:0.50,y:0.25},space:{x:0.55,y:0.65}},
    ]
  },
  FM3:{
    icon:'FM', sub:'3-op FM synthesis', color:'rgba(251,191,36',
    vars:[
      {name:'E.Piano',    shape:{x:0.35,y:0.55},tone:{x:0.45,y:0.35},space:{x:0.45,y:0.55}},
      {name:'Bell',       shape:{x:0.18,y:0.35},tone:{x:0.65,y:0.55},space:{x:0.55,y:0.60}},
      {name:'Metal Bass', shape:{x:0.55,y:0.65},tone:{x:0.40,y:0.50},space:{x:0.30,y:0.40}},
      {name:'Reed',       shape:{x:0.40,y:0.60},tone:{x:0.35,y:0.30},space:{x:0.50,y:0.58}},
    ]
  },
  Phys:{
    icon:'PH', sub:'Physical modeling', color:'rgba(134,239,172',
    vars:[
      {name:'Bowed String',shape:{x:0.72,y:0.88},tone:{x:0.30,y:0.20},space:{x:0.55,y:0.65}},
      {name:'Steel Drum',  shape:{x:0.20,y:0.60},tone:{x:0.55,y:0.40},space:{x:0.45,y:0.55}},
      {name:'Blown Pipe',  shape:{x:0.55,y:0.75},tone:{x:0.20,y:0.15},space:{x:0.60,y:0.70}},
      {name:'Wood Body',   shape:{x:0.40,y:0.70},tone:{x:0.25,y:0.30},space:{x:0.50,y:0.60}},
      {name:'Cello',       shape:{x:0.80,y:0.92},tone:{x:0.22,y:0.35},space:{x:0.58,y:0.68}},
      {name:'Flute',       shape:{x:0.45,y:0.70},tone:{x:0.65,y:0.12},space:{x:0.55,y:0.62}},
      {name:'Tabla',       shape:{x:0.18,y:0.55},tone:{x:0.48,y:0.52},space:{x:0.35,y:0.42}},
      {name:'Glass Bar',   shape:{x:0.35,y:0.65},tone:{x:0.70,y:0.25},space:{x:0.62,y:0.70}},
    ]
  },
  EP: {
    icon:'EP', sub:'Electric piano', color:'rgba(251,146,60',
    vars:[
      {name:'Rhodes Warm',   shape:{x:0.35,y:0.55}, tone:{x:0.35,y:0.3},  space:{x:0.45,y:0.5}},
      {name:'Rhodes Bright', shape:{x:0.3,y:0.5},   tone:{x:0.6,y:0.4},   space:{x:0.4,y:0.45}},
      {name:'DX7 Bell',      shape:{x:0.25,y:0.45}, tone:{x:0.7,y:0.55},  space:{x:0.5,y:0.55}},
      {name:'Wurlitzer',     shape:{x:0.4,y:0.5},   tone:{x:0.45,y:0.35}, space:{x:0.38,y:0.42}},
    ]
  },
  FMStab: {
    icon:'FM', sub:'FM stabs', color:'rgba(56,189,248',
    vars:[
      {name:'Cold Chord',  shape:{x:0.15,y:0.3},  tone:{x:0.5,y:0.6},  space:{x:0.25,y:0.3}},
      {name:'Metal Stab',  shape:{x:0.1,y:0.25},  tone:{x:0.7,y:0.75}, space:{x:0.2,y:0.25}},
      {name:'Organ Blip',  shape:{x:0.2,y:0.35},  tone:{x:0.4,y:0.45}, space:{x:0.3,y:0.35}},
      {name:'Brass Hit',   shape:{x:0.25,y:0.4},  tone:{x:0.55,y:0.5}, space:{x:0.28,y:0.32}},
    ]
  },
  Noise: {
    icon:'≋', sub:'Texture & sweep', color:'rgba(180,220,255',
    vars:[
      {name:'Wash',       shape:{x:0.8,y:0.9},  tone:{x:0.35,y:0.15}, space:{x:0.7,y:0.7}},
      {name:'Wind',       shape:{x:0.75,y:0.85},tone:{x:0.25,y:0.1},  space:{x:0.65,y:0.8}},
      {name:'Riser',      shape:{x:0.2,y:0.5},  tone:{x:0.55,y:0.3},  space:{x:0.5,y:0.6}},
      {name:'Snare Tex',  shape:{x:0.3,y:0.3},  tone:{x:0.7,y:0.5},   space:{x:0.3,y:0.4}},
    ]
  },
  Pluck: {
    icon:'♪', sub:'Percussive hits', color:'rgba(255,200,60',
    vars:[
      {name:'Pizzicato', shape:{x:0.12,y:0.30}, tone:{x:0.60,y:0.20}, space:{x:0.38,y:0.42}},
      {name:'Kalimba',   shape:{x:0.18,y:0.38}, tone:{x:0.68,y:0.12}, space:{x:0.32,y:0.48}},
      {name:'Marimba',   shape:{x:0.22,y:0.45}, tone:{x:0.48,y:0.18}, space:{x:0.28,y:0.40}},
      {name:'Guitar',    shape:{x:0.28,y:0.52}, tone:{x:0.52,y:0.32}, space:{x:0.42,y:0.50}},
    ]
  },
  Pad: {
    icon:'≈', sub:'Evolving texture', color:'rgba(180,130,255',
    vars:[
      {name:'Supersaw',  shape:{x:0.72,y:0.92}, tone:{x:0.55,y:0.18}, space:{x:0.62,y:0.72}},
      {name:'Warm Wash', shape:{x:0.85,y:0.95}, tone:{x:0.28,y:0.10}, space:{x:0.70,y:0.80}},
      {name:'Glass',     shape:{x:0.60,y:0.82}, tone:{x:0.72,y:0.32}, space:{x:0.55,y:0.65}},
      {name:'PWM',       shape:{x:0.65,y:0.88}, tone:{x:0.45,y:0.22}, space:{x:0.50,y:0.60}},
    ]
  },
  Vocal: {
    icon:'V', sub:'Formant texture', color:'rgba(255,150,200',
    vars:[
      {name:'Aah',   shape:{x:0.60,y:0.82}, tone:{x:0.38,y:0.18}, space:{x:0.52,y:0.62}},
      {name:'Ooh',   shape:{x:0.70,y:0.88}, tone:{x:0.28,y:0.12}, space:{x:0.58,y:0.68}},
      {name:'Eeh',   shape:{x:0.50,y:0.75}, tone:{x:0.55,y:0.28}, space:{x:0.45,y:0.55}},
      {name:'Choir', shape:{x:0.80,y:0.92}, tone:{x:0.32,y:0.08}, space:{x:0.65,y:0.75}},
    ]
  },
  Laser: {
    icon:'⚡', sub:'Deep sweeps', color:'rgba(0,255,200',
    vars:[
      {name:'Sweep',   shape:{x:0.6,y:0.5},  tone:{x:0.4,y:0.6},  space:{x:0.55,y:0.5}},
      {name:'Breath',  shape:{x:0.7,y:0.6},  tone:{x:0.3,y:0.5},  space:{x:0.65,y:0.6}},
      {name:'Wail',    shape:{x:0.65,y:0.55},tone:{x:0.5,y:0.7},  space:{x:0.6,y:0.55}},
      {name:'Throb',   shape:{x:0.55,y:0.65},tone:{x:0.45,y:0.55},space:{x:0.5,y:0.6}},
    ]
  },
  Echo: {
    icon:'↩', sub:'Dub delay echo', color:'rgba(180,255,160',
    vars:[
      {name:'Ping',    shape:{x:0.3,y:0.5},  tone:{x:0.5,y:0.4},  space:{x:0.7,y:0.6}},
      {name:'Dub',     shape:{x:0.5,y:0.6},  tone:{x:0.3,y:0.5},  space:{x:0.8,y:0.7}},
      {name:'Space',   shape:{x:0.4,y:0.7},  tone:{x:0.4,y:0.3},  space:{x:0.85,y:0.8}},
      {name:'Flutter', shape:{x:0.2,y:0.4},  tone:{x:0.6,y:0.5},  space:{x:0.65,y:0.55}},
    ]
  },
  Conga: {
    icon:'◐', sub:'Pitched percussion', color:'rgba(255,180,80',
    vars:[
      {name:'Conga',   shape:{x:0.25,y:0.4}, tone:{x:0.55,y:0.4}, space:{x:0.3,y:0.4}},
      {name:'Bongo',   shape:{x:0.15,y:0.3}, tone:{x:0.65,y:0.5}, space:{x:0.25,y:0.35}},
      {name:'Tabla',   shape:{x:0.3,y:0.45}, tone:{x:0.45,y:0.6}, space:{x:0.35,y:0.45}},
      {name:'Rim',     shape:{x:0.1,y:0.2},  tone:{x:0.75,y:0.3}, space:{x:0.2,y:0.3}},
      {name:'Claves',  shape:{x:0.05,y:0.15},tone:{x:0.85,y:0.2}, space:{x:0.1,y:0.15}},
    ]
  },
  Chord: {
    icon:'♭', sub:'Evolving harmony', color:'rgba(200,160,255',
    vars:[
      {name:'Slow',    shape:{x:0.8,y:0.9},  tone:{x:0.35,y:0.2}, space:{x:0.7,y:0.7}},
      {name:'Swell',   shape:{x:0.7,y:0.85}, tone:{x:0.45,y:0.25},space:{x:0.65,y:0.65}},
      {name:'String',  shape:{x:0.75,y:0.88},tone:{x:0.3,y:0.15}, space:{x:0.75,y:0.75}},
      {name:'Organ',   shape:{x:0.6,y:0.8},  tone:{x:0.5,y:0.35}, space:{x:0.6,y:0.6}},
    ]
  },
};

const SOUND_TYPE_NAMES = Object.keys(SOUND_TYPES);

const ARRANGEMENT_ROLES=[
  {soundType:'Sub',   octave:1, scaleDegree:0,  volume:0.9},
  {soundType:'Acid', octave:2, scaleDegree:0,  volume:0.75},
  {soundType:'Drone', octave:3, scaleDegree:0,  volume:0.65},
  {soundType:'Drone', octave:3, scaleDegree:2,  volume:0.55},
  {soundType:'Drone', octave:3, scaleDegree:4,  volume:0.5},
  {soundType:'Pulse', octave:3, scaleDegree:0,  volume:0.7},
  {soundType:'Pulse', octave:3, scaleDegree:4,  volume:0.6},
  {soundType:'Ring',  octave:4, scaleDegree:2,  volume:0.55},
  {soundType:'Noise', octave:3, scaleDegree:0,  volume:0.45},
  {soundType:'Pluck', octave:4, scaleDegree:0,  volume:0.65},
  {soundType:'Pluck', octave:4, scaleDegree:4,  volume:0.55},
  {soundType:'Pad',   octave:3, scaleDegree:0,  volume:0.60},
  {soundType:'Pad',   octave:3, scaleDegree:2,  volume:0.50},
  {soundType:'Vocal', octave:3, scaleDegree:0,  volume:0.55},
];

const SCALE_INTERVALS = {
  'Major':      [0,2,4,5,7,9,11],
  'Minor':      [0,2,3,5,7,8,10],
  'Dorian':     [0,2,3,5,7,9,10],
  'Phrygian':   [0,1,3,5,7,8,10],  // dark, brooding — flat-2 creates warehouse tension
  'Pentatonic': [0,2,4,7,9],
  'Lydian':     [0,2,4,6,7,9,11],
  'Chromatic':  [0,1,2,3,4,5,6,7,8,9,10,11],
};

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

const VIS_TYPES = {blob:{icon:'◎',label:'Blob'},neon:{icon:'—',label:'Neon'},fold:{icon:'/',label:'Fold'},spot:{icon:'*',label:'Spot'},beam:{icon:'|',label:'Beam'}};

const DRUM_VOICES = ['kick','clap','hihat','openhh','perc'];

const DRUM_PRESETS = [
  {name:'Four/Four',  drumStyle:'house',   kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],hihat:[1,0,0,1,0,1,0,0,1,0,0,1,0,1,0,1],openhh:[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],perc:[0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0]},
  {name:'Driving 4x4',drumStyle:'house',   kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0],openhh:[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],perc:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0]},
  {name:'Acid Beat',  drumStyle:'house',   kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],openhh:[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],perc:[0,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0]},
  {name:'Industrial', drumStyle:'techno',  kick:[1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],hihat:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],openhh:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],perc:[0,0,1,0,0,1,0,0,0,0,1,0,0,1,0,0]},
  {name:'Minimal',    drumStyle:'techno',  kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0],clap:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],hihat:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],openhh:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],perc:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0]},
  {name:'Dub Space',  drumStyle:'dub',     kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],hihat:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],openhh:[0,0,1,0,0,0,0,1,0,0,1,0,0,0,0,1],perc:[0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0]},
  {name:'Shuffle',    drumStyle:'garage',  kick:[1,0,0,0,0,0,1,0,1,0,0,0,0,1,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],hihat:[1,1,0,1,1,0,1,1,1,1,0,1,1,0,1,1],openhh:[0,0,1,0,0,1,0,0,0,0,1,0,0,1,0,0],perc:[0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0]},
  {name:'Amen Break', drumStyle:'dnb',     kick:[1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],clap:[0,0,0,0,1,0,0,1,0,0,0,0,1,0,1,0],hihat:[1,1,0,1,1,0,1,0,1,1,0,1,1,0,1,0],openhh:[0,1,0,0,0,0,1,0,0,1,0,0,0,0,1,0],perc:[0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0]},
  {name:'Sparse',     drumStyle:'ambient', kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],hihat:[1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0],openhh:[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],perc:[0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0]},
  {name:'Trance 138', drumStyle:'trance',  kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],openhh:[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],perc:[0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0]},
  {name:'Hammered',drumStyle:'hardtechno',kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],hihat:[0,0,1,0,0,0,1,0,0,0,1,0,0,1,0,0],openhh:[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],perc:[1,0,0,1,0,0,0,0,1,0,0,1,0,0,0,0]},
  {name:'Downtempo',   drumStyle:'hiphop',      kick:[1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],hihat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],openhh:[0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0],perc:[0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0]},
  {name:'Electronica', drumStyle:'electronica',  kick:[1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],hihat:[1,0,1,0,1,0,1,0,0,0,1,0,1,0,0,1],openhh:[0,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],perc:[0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0]},
  {name:'Italo Disco', drumStyle:'italo',        kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],openhh:[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],perc:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],snap:[0,0,0,0,1,0,0,0,0,0,1,0,1,0,0,0]},
];

const GROOVE_PROFILES = {
  // kickOffsetMs: kick sits on grid (0) or slightly ahead (-) for urgency
  // clapOffsetMs: clap pulled early (negative) = urgency; late (positive) = lazy
  // hatOffsetMs:  hat pushed late (positive) = rolling pocket feel (Dilla)
  deephouse:     { swing:0.18, humanizeMs:10, velocityVar:0.15, ghostChance:0.08, hatSkip:0.12, ratchetChance:0.00, ratchetSteps:2, kickOffsetMs:0,  clapOffsetMs:-2,  hatOffsetMs:7  },
  techhouse:     { swing:0.12, humanizeMs:4,  velocityVar:0.10, ghostChance:0.05, hatSkip:0.08, ratchetChance:0.04, ratchetSteps:2, kickOffsetMs:0,  clapOffsetMs:-3,  hatOffsetMs:4  },
  acidhouse:     { swing:0.12, humanizeMs:6,  velocityVar:0.20, ghostChance:0.10, hatSkip:0.15, ratchetChance:0.18, ratchetSteps:3, kickOffsetMs:0,  clapOffsetMs:-4,  hatOffsetMs:5  },
  detroittechno: { swing:0.05, humanizeMs:7,  velocityVar:0.12, ghostChance:0.12, hatSkip:0.10, ratchetChance:0.08, ratchetSteps:2, kickOffsetMs:0,  clapOffsetMs:-2,  hatOffsetMs:6  },
  minimaltechno: { swing:0.03, humanizeMs:3,  velocityVar:0.08, ghostChance:0.05, hatSkip:0.20, ratchetChance:0.02, ratchetSteps:2, kickOffsetMs:0,  clapOffsetMs:-1,  hatOffsetMs:3  },
  dubtechno:     { swing:0.10, humanizeMs:10, velocityVar:0.18, ghostChance:0.08, hatSkip:0.18, ratchetChance:0.03, ratchetSteps:2, kickOffsetMs:0,  clapOffsetMs:-3,  hatOffsetMs:9  },
  ukgarage:      { swing:0.42, humanizeMs:12, velocityVar:0.28, ghostChance:0.22, hatSkip:0.15, ratchetChance:0.10, ratchetSteps:2, kickOffsetMs:0,  clapOffsetMs:-5,  hatOffsetMs:10 },
  dnb:           { swing:0.06, humanizeMs:4,  velocityVar:0.22, ghostChance:0.30, hatSkip:0.08, ratchetChance:0.12, ratchetSteps:3, kickOffsetMs:0,  clapOffsetMs:-4,  hatOffsetMs:3  },
  ambienttechno: { swing:0.05, humanizeMs:14, velocityVar:0.12, ghostChance:0.03, hatSkip:0.28, ratchetChance:0.00, ratchetSteps:2, kickOffsetMs:0,  clapOffsetMs:-2,  hatOffsetMs:12 },
  trance:        { swing:0.00, humanizeMs:2,  velocityVar:0.08, ghostChance:0.04, hatSkip:0.05, ratchetChance:0.05, ratchetSteps:2, kickOffsetMs:0,  clapOffsetMs:0,   hatOffsetMs:0  },
  hardcore:      { swing:0.00, humanizeMs:2,  velocityVar:0.05, ghostChance:0.02, hatSkip:0.03, ratchetChance:0.25, ratchetSteps:4, kickOffsetMs:0,  clapOffsetMs:0,   hatOffsetMs:0  },
  hardtechno:    { swing:0.04, humanizeMs:3,  velocityVar:0.18, ghostChance:0.04, hatSkip:0.10, ratchetChance:0.06, ratchetSteps:2, kickOffsetMs:0,  clapOffsetMs:-2,  hatOffsetMs:2  },
  downtempo:     { swing:0.25, humanizeMs:16, velocityVar:0.30, ghostChance:0.18, hatSkip:0.20, ratchetChance:0.06, ratchetSteps:2, kickOffsetMs:0,  clapOffsetMs:-5,  hatOffsetMs:14 },
  electronica:   { swing:0.14, humanizeMs:18, velocityVar:0.35, ghostChance:0.22, hatSkip:0.25, ratchetChance:0.04, ratchetSteps:2, kickOffsetMs:0,  clapOffsetMs:-6,  hatOffsetMs:16 },
  italo:         { swing:0.00, humanizeMs:2,  velocityVar:0.06, ghostChance:0.00, hatSkip:0.00, ratchetChance:0.00, ratchetSteps:2, kickOffsetMs:0,  clapOffsetMs:0,   hatOffsetMs:0  },
};

const EVOLUTION_RULES = {
  deephouse:     { filterDrift:true,  chordInversion:true,  hatMutate:true,  drumDensity:false, accentShift:false, harmonicShift:true  },
  techhouse:     { filterDrift:true,  chordInversion:false, hatMutate:true,  drumDensity:true,  accentShift:true,  harmonicShift:false },
  acidhouse:     { filterDrift:true,  chordInversion:false, hatMutate:true,  drumDensity:false, accentShift:true,  harmonicShift:false },
  detroittechno: { filterDrift:false, chordInversion:false, hatMutate:true,  drumDensity:true,  accentShift:true,  harmonicShift:false },
  minimaltechno: { filterDrift:true,  chordInversion:false, hatMutate:true,  drumDensity:false, accentShift:false, harmonicShift:false },
  dubtechno:     { filterDrift:true,  chordInversion:true,  hatMutate:false, drumDensity:false, accentShift:false, harmonicShift:true  },
  ukgarage:      { filterDrift:false, chordInversion:true,  hatMutate:true,  drumDensity:true,  accentShift:true,  harmonicShift:true  },
  dnb:           { filterDrift:true,  chordInversion:false, hatMutate:true,  drumDensity:true,  accentShift:true,  harmonicShift:false },
  ambienttechno: { filterDrift:true,  chordInversion:false, hatMutate:false, drumDensity:false, accentShift:false, harmonicShift:true  },
  trance:        { filterDrift:true,  chordInversion:false, hatMutate:true,  drumDensity:false, accentShift:false, harmonicShift:false },
  hardcore:      { filterDrift:false, chordInversion:false, hatMutate:false, drumDensity:false, accentShift:true,  harmonicShift:false },
  hardtechno:    { filterDrift:true,  chordInversion:false, hatMutate:true,  drumDensity:false, accentShift:true,  harmonicShift:false },
  downtempo:     { filterDrift:true,  chordInversion:true,  hatMutate:true,  drumDensity:false, accentShift:false, harmonicShift:true  },
  electronica:   { filterDrift:true,  chordInversion:true,  hatMutate:true,  drumDensity:false, accentShift:false, harmonicShift:true  },
  italo:         { filterDrift:true,  chordInversion:false, hatMutate:false, drumDensity:false, accentShift:false, harmonicShift:false },
};

const GENRE_GRAMMAR = {
  deephouse:    { mutationRate:0.12, silenceChance:0.15, formCycle:32, buildTranspose:false },
  techhouse:    { mutationRate:0.20, silenceChance:0.08, formCycle:32, buildTranspose:false },
  acidhouse:    { mutationRate:0.18, silenceChance:0.10, formCycle:32, buildTranspose:false },
  detroittechno:{ mutationRate:0.10, silenceChance:0.18, formCycle:64, buildTranspose:true,  buildInterval:12 }, // long slow arc
  minimaltechno:{ mutationRate:0.06, silenceChance:0.28, formCycle:64, buildTranspose:false },
  dubtechno:    { mutationRate:0.06, silenceChance:0.28, formCycle:64, buildTranspose:false },
  ukgarage:     { mutationRate:0.24, silenceChance:0.12, formCycle:32, buildTranspose:false },
  dnb:          { mutationRate:0.22, silenceChance:0.08, formCycle:32, buildTranspose:false },
  ambienttechno:{ mutationRate:0.05, silenceChance:0.35, formCycle:64, buildTranspose:false },
  trance:       { mutationRate:0.18, silenceChance:0.05, formCycle:32, buildTranspose:true,  buildInterval:7  },
  hardcore:     { mutationRate:0.28, silenceChance:0.04, formCycle:32, buildTranspose:true,  buildInterval:12 },
  hardtechno:   { mutationRate:0.08, silenceChance:0.06, formCycle:64, buildTranspose:true,  buildInterval:12 }, // filter opens over 64 bars
  downtempo:    { mutationRate:0.10, silenceChance:0.20, formCycle:48, buildTranspose:false },
  electronica:  { mutationRate:0.15, silenceChance:0.18, formCycle:48, buildTranspose:false },
  italo:        { mutationRate:0.20, silenceChance:0.08, formCycle:32, buildTranspose:true,  buildInterval:7  },
};

const CHORD_PROGRESSIONS = {
  // ── Highly harmonic — active progressions, short cycles ─────────────────
  deephouse:     { progressions:[[0,5,2,4],[0,3,5,4],[0,5,3,4],[0,2,5,4]], cycleBars:4  },
  ukgarage:      { progressions:[[0,5,3,4],[0,3,5,4],[0,5,2,4]],            cycleBars:4  },
  trance:        { progressions:[[0,5,2,4],[0,3,5,4],[0,5,3,4]],            cycleBars:4  },
  italo:         { progressions:[[0,5,3,4],[0,3,5,4],[0,5,2,4],[0,3,4,5]], cycleBars:4  },
  downtempo:     { progressions:[[0,5,2,4],[0,3,5,4],[0,4,5,3]],            cycleBars:8  },
  electronica:   { progressions:[[0,5,2,4],[0,3,5,4],[0,4,5,3],[0,5,3,2]], cycleBars:8  },
  // ── Moderately harmonic — some movement, longer cycles ──────────────────
  techhouse:     { progressions:[[0,0,5,0],[0,4,0,4],[0,0,3,4]],            cycleBars:8  },
  acidhouse:     { progressions:[[0,0,5,0],[0,5,0,0],[0,0,0,4]],            cycleBars:8  },
  detroittechno: { progressions:[[0,5,2,5],[0,3,5,4],[0,0,5,4]],            cycleBars:32 }, // slow — tension from waiting
  // ── Modal / root-heavy — barely moves ───────────────────────────────────
  minimaltechno: { progressions:[[0,0,0,0],[0,0,5,0],[0,0,0,5]],            cycleBars:32 },
  dubtechno:     { progressions:[[0,0,5,5],[0,5,2,5],[0,0,3,5]],            cycleBars:32 },
  ambienttechno: { progressions:[[0,0,5,5],[0,2,5,4],[0,0,0,2]],            cycleBars:32 },
  dnb:           { progressions:[[0,5,3,0],[0,3,0,4],[0,5,0,0]],            cycleBars:16 },
  // ── Essentially static — identity is rhythm, not harmony ────────────────
  hardcore:      { progressions:[[0,0,0,0],[0,0,5,0]],                      cycleBars:32 },
  hardtechno:    { progressions:[[0,0,0,5],[0,5,3,4]],                      cycleBars:64 }, // sits on root for 64 bars, filter opens slowly
};

const HARMONIC_TYPES = new Set([
  'Sub','Drone','Pad','WTPad','Chord','EP','FMStab','FM3','Pluck',
  'Echo','Acid','Pulse','Vocal','Phys','Ring','Shimmer','Arp',
]);

const BASS_FOLLOWS_CHORD = {
  deephouse:true, italo:true, trance:true, garage:true, downtempo:true,
  hiphop:true, electronica:true,
  techhouse:false, minimaltechno:false, dubtechno:false, dnb:false,
  detroittechno:false, acidhouse:false, hardcore:false, hardtechno:false,
  ambienttechno:false,
};

const DENSITY_COLOR_TYPES = new Set([
  'Echo','Pluck','Conga','Shimmer','Arp','Ring','FMStab','FM3','EP',
]);

const COMPOSITION_TEMPLATES = [
  {
    name: 'Aeroplane Diagonal',  // SW → NE — ascending dynamism
    layout(idx, total){
      const t = total>1 ? idx/(total-1) : 0.5;
      const j = (Math.random()-0.5)*0.05;
      return {
        x: 0.18 + t*0.65 + j,
        y: 0.82 - t*0.62 + j,
        radiusScale: 1.30 - t*0.65,  // big anchor → small satellites
      };
    },
    rotation: 0.49,   // ~28°, line elements lean upward right
  },
  {
    name: 'Descending Stream',  // NW → SE
    layout(idx, total){
      const t = total>1 ? idx/(total-1) : 0.5;
      const j = (Math.random()-0.5)*0.05;
      return {
        x: 0.82 - t*0.65 + j,
        y: 0.80 - t*0.60 + j,
        radiusScale: 1.30 - t*0.65,
      };
    },
    rotation: -0.49,
  },
  {
    name: 'Cross',  // central anchor + cross-wings
    layout(idx, total){
      // Discrete slots — anchor + cross-wings + crown
      const slots = [
        {x:0.50, y:0.70, r:1.40},   // 0: anchor (bass)
        {x:0.22, y:0.50, r:0.80},   // 1: left wing
        {x:0.78, y:0.50, r:0.80},   // 2: right wing
        {x:0.50, y:0.22, r:0.65},   // 3: crown
        {x:0.34, y:0.62, r:0.55},   // 4: lower-left satellite
        {x:0.66, y:0.62, r:0.55},   // 5: lower-right satellite
        {x:0.50, y:0.42, r:0.50},   // 6: mid center
      ];
      const p = slots[idx] || slots[slots.length-1];
      const j = (Math.random()-0.5)*0.04;
      return { x: p.x+j, y: p.y+j, radiusScale: p.r };
    },
    rotation: 0,
  },
  {
    name: 'Off-Center Weight',  // heavy mass right-bottom + counterweights upper-left
    layout(idx, total){
      if(idx === 0){
        const j = (Math.random()-0.5)*0.05;
        return {x: 0.72+j, y: 0.78+j*0.5, radiusScale: 1.50};
      }
      const seq = [
        {x:0.62, y:0.55, r:0.95},
        {x:0.25, y:0.30, r:0.80},
        {x:0.18, y:0.55, r:0.55},
        {x:0.38, y:0.20, r:0.55},
        {x:0.78, y:0.30, r:0.60},
        {x:0.45, y:0.42, r:0.45},
      ];
      const p = seq[(idx-1) % seq.length];
      const j = (Math.random()-0.5)*0.04;
      return {x: p.x+j, y: p.y+j, radiusScale: p.r};
    },
    rotation: -0.78,  // ~-45°
  },
  {
    name: 'Floating Cluster',  // upper-region cluster, isolated bass anchor below
    layout(idx, total){
      if(idx === 0){
        return {x: 0.50+(Math.random()-0.5)*0.10, y: 0.85, radiusScale: 1.25};
      }
      // Others form a tight cluster in upper area — spiral outward
      const cx = 0.45, cy = 0.32;
      const angle = (idx*2.4) % (Math.PI*2);
      const r = 0.10 + (idx-1)*0.05;
      return {
        x: cx + Math.cos(angle)*r,
        y: cy + Math.sin(angle)*r*0.7,
        radiusScale: 1.05 - (idx-1)*0.10,
      };
    },
    rotation: 0.26,  // ~15°
  },
  {
    name: 'Cascading Stack',  // vertical waterfall with horizontal drift
    layout(idx, total){
      const j = (Math.random()-0.5)*0.04;
      const driftX = 0.42 + Math.sin(idx*0.95)*0.20;
      const y = 0.85 - idx*0.13;
      return {x: driftX+j, y: Math.max(0.10, y), radiusScale: 1.20 - idx*0.11};
    },
    rotation: 1.05,  // ~60°
  },
];

const ZONE_CAPS = { sub:2, low:3, mid:6, high:4, air:3 };

const CHORD_VOICINGS = {
  deephouse: {
    Pulse: [[0,3,7,10],[0,3,7,10],[0,5,7,10]], // minor7, minor7, minor9-ish
    EP:    [[0,3,7],[0,5,9],[0,3,7,10]],        // minor, sus4, minor7
    Drone: [[0,7],[0,7,12]],                    // fifth, fifth+oct
  },
  techhouse: {
    Pulse: [[0,5,7],[0,7],[0,2,7]],             // sus2, fifth, sus2 open
    EP:    [[0,7],[0,5,7]],                     // fifth, sus2
    Drone: [[0,7],[0,7]],
  },
  acidhouse: {
    Pulse: [[0,7],[0,5,7],[0,3,7]],             // sparse — acid doesn't chord much
    EP:    [[0,7],[0,3,7]],
    Drone: [[0,7]],
  },
  detroittechno: {
    Pulse: [[0,4,7,11],[0,3,7,10],[0,4,7]],     // maj7, min7, major triad
    EP:    [[0,4,7],[0,4,7,11]],                // major, major7
    Drone: [[0,7],[0,4,7]],
  },
  minimaltechno: {
    Pulse: [[0,7],[0,5,7]],                     // very sparse
    EP:    [[0,7]],
    Drone: [[0,7]],
  },
  dubtechno: {
    Pulse: [[0,7,14],[0,5,9,14],[0,7,12]],      // root+fifth+ninth, 9sus4, oct
    EP:    [[0,7],[0,7,14]],
    Drone: [[0,7],[0,12]],
  },
  ukgarage: {
    Pulse: [[0,3,7],[0,3,7,10],[0,5,9]],        // minor, minor7, sus2 maj
    EP:    [[0,3,7],[0,5,9]],
    Drone: [[0,7],[0,3,7]],
  },
  dnb: {
    Pulse: [[0,3,7],[0,7],[0,3,7,10]],
    EP:    [[0,7],[0,3,7]],
    Drone: [[0,7]],
  },
  ambienttechno: {
    Pulse: [[0,7,12],[0,5,9,14],[0,3,7,10,14]], // wide open voicings
    EP:    [[0,7,12],[0,5,9,14]],
    Drone: [[0,7],[0,7,14]],
  },
  trance: {
    Pulse: [[0,7,12],[0,4,7,12],[0,4,7]],       // fifth+oct, major+oct, major
    EP:    [[0,4,7],[0,4,7,11]],                // major, major7
    Drone: [[0,7],[0,4,7]],
  },
  hardcore: {
    Pulse: [[0,7],[0,12],[0,7,12]],             // power chords
    EP:    [[0,7],[0,12]],
    Drone: [[0,7]],
  },
  hardtechno: {
    Pulse: [[0,7],[0,7,12],[0,5,7]],
    EP:    [[0,7],[0,5,7]],
    Drone: [[0,7],[0,5]],
  },
  downtempo: {
    Pulse: [[0,3,7,10],[0,2,7,10],[0,5,9,14]],  // min7, min9, 9sus4
    EP:    [[0,3,7,10],[0,5,9]],
    Drone: [[0,7],[0,3,7]],
  },
  electronica: {
    Pulse: [[0,3,7,10],[0,4,7,11],[0,5,9,14]],  // varied — min7, maj7, 9sus4
    EP:    [[0,4,7,11],[0,5,9]],
    Drone: [[0,7],[0,3,7]],
  },
  italo: {
    Pulse: [[0,4,7,12,16],[0,5,9,12,17],[0,4,7,11,16],[0,2,7,12,16],[0,4,9,12,16]], // wide: major+2oct, sus4+oct, maj7+oct, sus2+oct, major6+oct
    EP:    [[0,4,7,12],[0,4,7,11,14],[0,5,9,12],[0,2,7,12]],                         // major+oct, maj7 wide, sus4+oct, sus2+oct
    Drone: [[0,7,12],[0,4,7,12],[0,4,9,12]],                                          // fifth+oct, major+oct, major6+oct
  },
};

const BASS_PHRASES = {
  deephouse:    [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,1,0,0],
  techhouse:    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
  acidhouse:    [1,0,1,0, 0,1,0,1, 1,0,0,1, 0,1,0,0],
  detroittechno:[1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
  minimaltechno:[1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
  dubtechno:    [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
  ukgarage:     [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,0],
  dnb:          [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
  ambienttechno:[1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
  trance:       [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
  hardcore:     [1,0,0,0, 0,0,1,0, 0,1,0,0, 1,0,0,1],
  hardtechno:   [1,0,0,0, 0,0,0,0, 1,0,0,1, 0,0,1,0],
  downtempo:    [1,0,0,0, 0,0,0,1, 1,0,0,0, 0,1,0,0],
  electronica:  [1,0,0,1, 0,0,1,0, 1,0,0,0, 0,1,0,1],
  italo:        [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0],
};

const ACID_PHRASES = {
  deephouse:    [1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0],  // sparse, warm — foundation only
  techhouse:    [1,0,0,1,0,0,1,0,0,1,0,0,0,0,0,1],  // medium density, driving
  acidhouse:    [1,0,1,1, 0,1,0,1, 1,0,1,0, 1,1,0,1],  // classic 303 busy
  detroittechno:    [1,0,0,0,0,1,0,0,1,0,0,0,0,1,0,0],  // syncopated, restrained
  minimaltechno:    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],  // very sparse, just marks time
  dubtechno:    [1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],  // echo-like, 2 hits only
  ukgarage:    [1,0,0,1,0,1,0,0,0,0,1,0,0,0,0,1],  // garage shuffle, restrained
  dnb:          [1,0,0,1, 0,0,1,0, 0,0,0,1, 0,1,0,0],  // choppy, syncopated
  ambienttechno:    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],  // near silent — accent only
  trance:    [1,0,1,0,0,0,1,0,1,0,0,0,0,1,0,0],  // melodic, open spaces
  hardcore:     [1,1,0,1, 1,0,1,0, 1,1,0,0, 1,0,1,1],  // aggressive, dense
  hardtechno:   [1,0,1,0, 1,0,0,1, 1,0,1,1, 0,1,0,0],  // punchy, mechanical
  downtempo:    [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],  // hip-hop sparse
  electronica:    [1,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0],  // glitchy, selective
  italo:    [1,0,1,0,0,0,0,1,1,0,0,0,0,1,0,0],  // melodic gestures
};

const GENRE_SOUND_MODELS = {
  deephouse: {
    Acid: { resonanceMult:0.55, filterBase:0.35, slideEnable:false },
    Drone: { brightnessMult:0.7, attackMult:1.8, reverbBoost:0.25 },
    Pulse: { chordType:'minor7', gateMult:1.4, attackSoft:true },
    Sub:   { decayMult:1.3, warmth:0.3 },
    Pluck: { brightness:0.55, decay:1.2 }, Pad: { attackMult:1.6, filterDrift:true }, Vocal: { formantShift:0 },
  },
  techhouse: {
    Acid: { resonanceMult:0.85, filterBase:0.55, slideEnable:false },
    Drone: { brightnessMult:1.1, attackMult:0.7, reverbBoost:-0.1 },
    Pulse: { chordType:'sus2', gateMult:0.7, attackSoft:false },
    Sub:   { decayMult:0.7, warmth:0.1 },
    Pluck: { brightness:0.70, decay:0.6 }, Pad: { attackMult:0.8, filterDrift:false }, Vocal: null,
  },
  acidhouse: {
    Acid: { resonanceMult:1.1, filterBase:0.5, slideEnable:true, accentEnable:true, squelch:true },
    Drone: { brightnessMult:0.6, attackMult:1.2, reverbBoost:-0.15 },
    Pulse: { chordType:'power', gateMult:0.5, attackSoft:false },
    Sub:   { decayMult:0.9, warmth:0.2 },
    Pluck: { brightness:0.80, decay:0.5 }, Pad: null, Vocal: null,
  },
  detroittechno: {
    Acid: { resonanceMult:0.9, filterBase:0.6, fmCharacter:true },
    Drone: { brightnessMult:1.3, attackMult:0.8, metallic:true },
    Pulse: { chordType:'major7', gateMult:0.6, attackSoft:false },
    Sub:   { decayMult:0.8, warmth:0.0 },
    Pluck: { brightness:0.65, decay:0.8 }, Pad: { attackMult:0.7, filterDrift:false }, Vocal: null,
  },
  minimaltechno: {
    Acid: { resonanceMult:0.8, filterBase:0.5 },
    Drone: { brightnessMult:0.9, attackMult:1.0 },
    Pulse: { chordType:'sus2', gateMult:0.6, attackSoft:false },
    Sub:   { decayMult:0.8, warmth:0.05 },
    Pluck: { brightness:0.60, decay:0.9 }, Pad: { attackMult:1.0, filterDrift:true }, Vocal: null,
  },
  dubtechno: {
    Acid: { resonanceMult:0.4, filterBase:0.25, subPulse:true },
    Drone: { brightnessMult:0.5, attackMult:2.5, reverbBoost:0.45, delayFeedback:0.62 },
    Pulse: { chordType:'minor7', gateMult:2.8, attackSoft:true, delayWet:0.65 },
    Sub:   { decayMult:1.8, warmth:0.4 },
    Pluck: { brightness:0.40, decay:1.6 }, Pad: { attackMult:2.5, filterDrift:true }, Vocal: { formantShift:-30 },
  },
  ukgarage: {
    Acid: { resonanceMult:0.9, filterBase:0.6, reeseLight:true },
    Drone: { brightnessMult:0.9, attackMult:1.0, reverbBoost:0.05 },
    Pulse: { chordType:'minor7', gateMult:0.55, attackSoft:false, choppy:true },
    Sub:   { decayMult:0.65, warmth:0.15 },
    Pluck: { brightness:0.75, decay:0.7 }, Pad: { attackMult:1.0, filterDrift:false }, Vocal: { formantShift:0 },
  },
  dnb: {
    Acid: { resonanceMult:1.0, filterBase:0.55, reeseMod:true },
    Drone: { brightnessMult:0.7, attackMult:1.5, reverbBoost:0.2 },
    Pulse: { chordType:'minor7', gateMult:0.45, attackSoft:false },
    Sub:   { decayMult:1.1, warmth:0.05, moving:true },
    Pluck: { brightness:0.80, decay:0.5 }, Pad: { attackMult:1.2, filterDrift:true }, Vocal: null,
  },
  ambienttechno: {
    Acid: { resonanceMult:0.4, filterBase:0.2 },
    Drone: { brightnessMult:0.5, attackMult:3.0, reverbBoost:0.5 },
    Pulse: { chordType:'minor7', gateMult:2.0, attackSoft:true },
    Sub:   { decayMult:2.0, warmth:0.5 },
    Pluck: { brightness:0.35, decay:2.2 }, Pad: { attackMult:3.5, filterDrift:true }, Vocal: { formantShift:-20 },
  },
  trance: {
    Acid: { resonanceMult:0.9, filterBase:0.6 },
    Drone: { brightnessMult:1.1, attackMult:0.9 },
    Pulse: { chordType:'major7', gateMult:0.6, attackSoft:false },
    Sub:   { decayMult:0.9, warmth:0.1 },
    Pluck: { brightness:0.65, decay:0.9 }, Pad: { attackMult:1.0, filterDrift:true }, Vocal: { formantShift:0 },
  },
  hardcore: {
    Acid: { resonanceMult:1.3, filterBase:0.75, accentEnable:true },
    Drone: { brightnessMult:1.8, attackMult:0.3 },
    Pulse: { chordType:'power', gateMult:0.2, attackSoft:false },
    Sub:   { decayMult:0.6, warmth:0.0 },
    Noise: { brightness:0.15, decay:0.4 },
    Pluck: { brightness:0.90, decay:0.3 }, Pad: null, Vocal: null,
  },
  hardtechno: {
    Acid: { resonanceMult:1.2, filterBase:0.65, accentEnable:true, slideEnable:true },
    Drone: { brightnessMult:1.4, attackMult:0.4 },
    Pulse: { chordType:'power', gateMult:0.25, attackSoft:false },
    Sub:   { decayMult:0.7, warmth:0.0 },
    Noise: { brightness:0.12, decay:0.5 },
    Pluck: { brightness:0.85, decay:0.4 }, Pad: null, Vocal: null,
  },
  downtempo: {
    Acid: { resonanceMult:0.6, filterBase:0.3, moogStyle:true },
    Drone: { brightnessMult:0.65, attackMult:2.0, reverbBoost:0.3 },
    Pulse: { chordType:'minor7', gateMult:1.8, attackSoft:true },
    Sub:   { decayMult:1.4, warmth:0.35 },
    Pluck: { brightness:0.45, decay:1.5 }, Pad: { attackMult:2.2, filterDrift:true }, Vocal: { formantShift:10 },
  },
  electronica: {
    Acid: { resonanceMult:0.5,  filterBase:0.30, moogStyle:true },
    Drone: { brightnessMult:0.5, attackMult:3.5, reverbBoost:0.55 }, // B2: much slower attack, more reverb — breathing texture underneath
    Pulse: { chordType:'minor7', gateMult:1.6, attackSoft:true },
    Sub:   { decayMult:1.5, warmth:0.4 },
    Ring:  { fmDepthMult:1.4 }, // B2: boosted Ring metallic texture
    Pluck: { brightness:0.75, decay:1.8 }, Pad: { attackMult:2.8, filterDrift:true }, Vocal: { formantShift:-10 },
  },
  italo: {
    Acid: { resonanceMult:1.0, filterBase:0.60, slideEnable:true, accentEnable:true },
    Drone: { brightnessMult:1.2, attackMult:0.6, reverbBoost:0.0 },
    Pulse: { chordType:'major7', gateMult:0.35, attackSoft:false }, // shorter snappier gate
    Sub:   { decayMult:0.55, warmth:0.0 }, // very punchy — hits and releases fast
    Pluck: { brightness:0.80, decay:0.6 }, Pad: { attackMult:0.9, filterDrift:false }, Vocal: { formantShift:20 },
  },
};

const LIVE_LABEL_SUBTITLES = {
  Sub:'foundation', Acid:'gesture', Arp:'melody', Pluck:'phrase',
  EP:'keys', FM3:'keys', FMStab:'stab', Pulse:'pulse', Echo:'echo',
  Pad:'atmosphere', Drone:'field', Chord:'harmony', WTPad:'texture',
  Shimmer:'shimmer', Vocal:'voice', Noise:'texture', Conga:'rhythm',
  Ring:'perc', Laser:'beam', Phys:'body', SFX:'colour',
};

const REVERB_PROFILES={
  plate: {preDelayMs:12, decaySec:2.0, earlyMs:65,  earlyGain:0.42, tailLpf:4500, tailDark:0.55, stereoSpread:0.30},
  room:  {preDelayMs:8,  decaySec:1.3, earlyMs:45,  earlyGain:0.55, tailLpf:3800, tailDark:0.62, stereoSpread:0.20},
  hall:  {preDelayMs:22, decaySec:4.2, earlyMs:90,  earlyGain:0.32, tailLpf:2800, tailDark:0.78, stereoSpread:0.90},
  spring:{preDelayMs:14, decaySec:2.2, earlyMs:55,  earlyGain:0.48, tailLpf:4200, tailDark:0.40, stereoSpread:0.25},
  space: {preDelayMs:32, decaySec:6.0, earlyMs:130, earlyGain:0.20, tailLpf:2200, tailDark:0.88, stereoSpread:1.40},
  cosmos:{preDelayMs:22, decaySec:3.6, earlyMs:100, earlyGain:0.28, tailLpf:3200, tailDark:0.72, stereoSpread:1.10},
  warehouse:{preDelayMs:18, decaySec:2.8, earlyMs:80, earlyGain:0.35, tailLpf:2600, tailDark:0.82, stereoSpread:0.60}
};

const GENRE_REVERB={
  deephouse:'plate',  techhouse:'room',   acidhouse:'room',
  detroittechno:'warehouse', minimaltechno:'warehouse', dubtechno:'hall',
  ukgarage:'plate',    dnb:'room',
  ambienttechno:'space', trance:'cosmos', hardcore:'warehouse', hardtechno:'warehouse', downtempo:'spring',
  electronica:'space', italo:'cosmos',
};

const RUMBLE_GENRES = new Set(['detroittechno','techhouse','minimaltechno','dubtechno','acidtechno','hardtechno','industrialtechno']);

const GENRE_PAN_SPREAD = {ambienttechno:2.2, electronica:2.0, dubtechno:1.9, downtempo:1.8, italo:1.7};

const SUB_PROFILES = {
  deephouse:     { wave:'sine',     atkMul:1.0,  decayMul:1.0,  satDrive:1.0,  harmVol:0.15, clickVol:0.28, filterMul:1.0  },
  techhouse:     { wave:'sine',     atkMul:0.8,  decayMul:0.9,  satDrive:1.2,  harmVol:0.18, clickVol:0.32, filterMul:1.1  },
  detroittechno: { wave:'sine',     atkMul:0.7,  decayMul:0.85, satDrive:1.3,  harmVol:0.20, clickVol:0.35, filterMul:1.15 },
  minimaltechno: { wave:'sine',     atkMul:0.6,  decayMul:0.8,  satDrive:1.1,  harmVol:0.12, clickVol:0.30, filterMul:0.9  },
  dubtechno:     { wave:'sine',     atkMul:1.5,  decayMul:1.6,  satDrive:0.8,  harmVol:0.10, clickVol:0.15, filterMul:0.7  },
  dnb:           { wave:'triangle', atkMul:0.4,  decayMul:0.7,  satDrive:1.8,  harmVol:0.25, clickVol:0.40, filterMul:1.4  },
  ambienttechno: { wave:'sine',     atkMul:2.0,  decayMul:1.8,  satDrive:0.7,  harmVol:0.08, clickVol:0.10, filterMul:0.5  },
  trance:        { wave:'sine',     atkMul:0.8,  decayMul:1.0,  satDrive:1.1,  harmVol:0.18, clickVol:0.30, filterMul:1.0  },
  hardcore:      { wave:'sawtooth', atkMul:0.3,  decayMul:0.6,  satDrive:2.5,  harmVol:0.30, clickVol:0.45, filterMul:1.6  },
  hardtechno:    { wave:'sawtooth', atkMul:0.4,  decayMul:0.7,  satDrive:2.2,  harmVol:0.28, clickVol:0.42, filterMul:1.5  },
  italo:         { wave:'sine',     atkMul:1.0,  decayMul:1.1,  satDrive:0.9,  harmVol:0.15, clickVol:0.25, filterMul:0.95 },
  downtempo:     { wave:'sine',     atkMul:1.3,  decayMul:1.4,  satDrive:0.8,  harmVol:0.12, clickVol:0.18, filterMul:0.75 },
  electronica:   { wave:'sine',     atkMul:1.2,  decayMul:1.3,  satDrive:0.9,  harmVol:0.14, clickVol:0.20, filterMul:0.8  },
  garage:        { wave:'sine',     atkMul:0.9,  decayMul:1.0,  satDrive:1.0,  harmVol:0.16, clickVol:0.28, filterMul:1.0  },
  hiphop:        { wave:'sine',     atkMul:0.8,  decayMul:1.2,  satDrive:1.1,  harmVol:0.18, clickVol:0.22, filterMul:0.9  },
};

const AMBIENT_SUB_GENRES = new Set(['ambienttechno','electronica','dubtechno','downtempo','deephouse']);

const AMBIENT_SUB_GAIN = { ambienttechno:0.28, electronica:0.24, dubtechno:0.22, downtempo:0.18, deephouse:0.14 };

const VOCAL_VARIANTS=['aah','ooh','eeh','choir'];

const ARP_CONTOURS = {
  // Original
  ascend:    [0,1,2,3,4,5,6,7],
  descend:   [7,6,5,4,3,2,1,0],
  arch:      [0,2,4,5,4,2,0,2,4,5,4,2,0,2,4,5],
  valley:    [5,4,2,0,2,4,5,4,2,0,2,4,5,4,2,0],
  pendulum:  [0,4,2,5,1,4,0,3,2,5,3,4,1,5,0,4],
  arpeggio:  [0,2,4,0,2,4,7,4,2,0,2,4,7,4,2,4],
  stutter:   [0,0,2,2,4,4,2,2,0,0,2,2,4,4,7,7],
  leapdown:  [7,0,6,1,5,2,4,3,5,2,4,3,7,0,6,1],
  pentatonic:[0,2,4,7,9,7,4,2,0,2,4,7,9,7,4,0],
  groove:    [0,0,0,2,0,0,2,4,0,0,0,2,0,2,4,5],
  // New — more melodic variety
  spiral:    [0,1,3,2,4,3,5,4,6,5,7,6,5,4,3,2],   // spiral up then down
  bounce:    [0,4,2,6,1,5,3,7,0,3,1,5,2,4,0,3],   // bouncy leaps
  wave:      [0,3,5,3,0,3,5,7,5,3,0,3,5,3,0,2],   // wave shape
  ladder:    [0,2,1,3,2,4,3,5,4,6,5,7,6,5,4,3],   // step up by 2nds
  clave:     [0,0,2,0,4,0,2,4,0,0,2,0,5,4,2,0],   // clave-inspired gaps
  triad:     [0,2,4,2,0,4,7,4,0,2,4,7,4,2,0,2],   // triad arpeggio
  blues:     [0,3,4,3,5,3,7,5,3,0,3,4,3,5,3,0],   // blues-adjacent
  ping:      [0,7,1,6,2,5,3,4,3,5,2,6,1,7,0,4],   // ping-pong extremes
  stepdown:  [7,5,7,4,5,3,4,2,3,1,2,0,1,0,2,4],   // step descent
  modal:     [0,1,3,5,6,5,3,1,0,1,3,5,7,5,3,1],   // modal feel
  call:      [0,2,4,5,4,2,4,2,0,2,4,5,7,5,4,2],   // call phrase
  response:  [5,4,2,0,2,4,2,0,5,4,2,0,2,1,0,2],   // response phrase
  ostinato:  [0,2,0,4,0,2,0,5,0,2,0,4,0,7,0,5],   // root-based ostinato
  syncopate: [0,0,3,0,0,5,3,0,2,0,4,0,2,5,0,4],   // syncopated gaps
};

const GENRE_ARP_CONTOURS = {
  deephouse:    ['arch','arpeggio','groove','wave','triad'],
  techhouse:    ['groove','stutter','pendulum','syncopate','ostinato'],
  acidhouse:    ['groove','stutter','groove','clave','syncopate'],
  detroittechno:['leapdown','arch','pendulum','ping','bounce'],
  minimaltechno:['groove','valley','ostinato','clave'],
  dubtechno:    ['arch','valley','descend','wave','modal'],
  ukgarage:     ['groove','stutter','arch','clave','syncopate'],
  dnb:          ['leapdown','stutter','groove','ping','bounce'],
  ambienttechno:['arch','valley','pentatonic','wave','modal','spiral'],
  trance:       ['ascend','arch','descend','ladder','spiral'],
  hardcore:     ['stutter','leapdown','groove','ping'],
  hardtechno:   ['stutter','groove','leapdown','stutter','clave'],
  downtempo:    ['pentatonic','arch','valley','blues','call','response'],
  electronica:  ['pendulum','pentatonic','pendulum','leapdown','arch','spiral','bounce','modal'],
  italo:        ['ascend','ascend','arch','arpeggio','ladder','triad'],
};

const GENRE_ARP_RHYTHMS = {
  deephouse:    [[1,1,1,1,1,1,1,1],[2,1,1,2,1,1,2,1],[1,1,2,1,2,1,1,2],[3,1,2,3,1,2],[2,2,1,1,2,1,1,2]],
  techhouse:    [[1,1,1,1,1,1,1,1],[1,1,2,1,1,1,2,1],[1,2,1,1,1,2,1,1],[2,1,1,1,2,1,2,1],[1,1,1,2,1,1,1,2]],
  acidhouse:    [[1,1,1,2,1,1,1,2],[1,2,1,1,2,1,1,1],[1,1,2,2,1,1,2,2],[3,1,3,1,2,2,2],[1,1,1,1,2,1,1,2]],
  detroittechno:[[1,1,1,1,1,1,1,1],[1,2,1,1,1,1,2,1],[2,1,2,1,1,2,1,1],[1,1,2,1,1,2,1,2],[3,1,2,1,3,1,2,1]],
  minimaltechno:[[2,2,2,2],[1,1,2,1,1,1,2,2],[4,2,2,4],[2,1,1,4,2,2],[3,1,4,4]],
  dubtechno:    [[2,2,2,2],[2,1,1,2,2],[4,2,2,4],[3,1,4,4],[2,2,1,1,2,4]],
  ukgarage:     [[1,1,2,1,1,2,1,1],[1,2,1,1,1,1,2,1],[3,1,2,1,1,2,1,1],[1,1,1,2,3,1,2,1],[2,1,1,1,2,1,1,2]],
  dnb:          [[1,1,1,1,1,1,1,1],[1,2,1,1,1,2,1,1],[3,1,2,3,1,2],[1,1,2,1,2,1,1,1],[2,1,1,2,1,1,1,2]],
  ambienttechno:[[2,2,2,2],[4,2,2,4],[4,4,4,4],[3,1,4,4,4],[6,2,4,4]],
  trance:       [[1,1,1,1,1,1,1,1],[2,1,1,2,1,1,1,1],[1,1,2,1,1,1,2,1]],
  hardcore:     [[1,1,1,1,1,1,1,1],[1,1,2,1,1,1,1,2],[2,2,1,1,2,2,1,1]],
  hardtechno:   [[2,1,1,2,1,1,2,1],[1,2,1,1,2,1,1,1],[2,2,2,2],[1,1,1,1,2,1,2,1]],
  downtempo:    [[2,1,1,2,1,1,2,2],[1,1,2,2,1,1,2,2],[3,1,2,2,3,1,2],[2,1,1,1,3,1,2,1],[4,2,2,2,2,4]],
  electronica:  [[1,1,2,1,1,2,1,1],[1,2,1,2,1,1,2,1],[2,1,1,2,1,2,1,1],[3,1,2,1,3,1,2,1],[1,1,1,2,2,1,1,2],[2,2,1,2,1,1,2,1]],
  italo:        [[1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],[1,1,2,1,1,1,2,1],[2,1,1,2,1,1,1,1],[1,1,1,1,2,1,1,2]],
};

const GENRE_ARP_OCTAVES = {
  deephouse:    [3,4],
  techhouse:    [4,5],
  minimaltechno:[3,4],
  dubtechno:    [2,3,4],
  ukgarage:     [4,5],
  dnb:          [3,4,5],
  ambienttechno:[3,4],
  trance:       [4,5,6],
  hardcore:     [4,5],
  hardtechno:   [3,4],
  downtempo:    [3,4],
  electronica:  [3,4,5],
  italo:        [4,5,6],   // high register — the shimmer lives up here
};

const DRUM_STYLE_GAIN = {
  house:      0.90,
  techno:     1.00,
  italo:      1.05, // disco kick needs to thump
  garage:     0.92,
  dnb:        1.05,
  trance:     0.95,
  hiphop:     0.85,
  dub:        0.70, // dub kick recedes into reverb
  ambient:    0.52, // barely there
  hardcore:   1.10,
  hardtechno: 1.05,
  electronica:0.78, // softer, more textural
};

const DRUM_ROOM_SEND = {
  house:      0.14,
  techno:     0.08,  // tight, dry
  italo:      0.18,
  garage:     0.12,
  dnb:        0.06,  // very tight
  trance:     0.10,
  hiphop:     0.20,
  dub:        0.42,  // dub lives in the reverb
  ambient:    0.38,
  hardcore:   0.05,
  hardtechno: 0.06,
  electronica:0.22,
};

const DRUM_TIGHTNESS = {
  house:      0.85,
  techno:     0.70,
  italo:      0.90,
  garage:     0.72,
  dnb:        0.55,  // very tight, sharp breaks
  trance:     0.75,
  hiphop:     1.10,  // loose, bouncy
  dub:        1.40,  // long room, everything rings
  ambient:    1.60,
  hardcore:   0.50,
  hardtechno: 0.58,
  electronica:1.00,
};

const DRUM_KIT_PROFILES = {
  deephouse:    { kickBodyEnd:32,  kickDecay:0.15, kickSoftness:0.70, clapRoomMix:0.18, hatBrightness:0.35, subRoomBleed:0.08 },
  techhouse:    { kickBodyEnd:40,  kickDecay:0.09, kickSoftness:0.30, clapRoomMix:0.06, hatBrightness:0.68, subRoomBleed:0.03 },
  acidhouse:    { kickBodyEnd:36,  kickDecay:0.12, kickSoftness:0.45, clapRoomMix:0.10, hatBrightness:0.55, subRoomBleed:0.04 },
  detroittechno:{ kickBodyEnd:40,  kickDecay:0.08, kickSoftness:0.28, clapRoomMix:0.07, hatBrightness:0.60, subRoomBleed:0.03 },
  minimaltechno:{ kickBodyEnd:42,  kickDecay:0.07, kickSoftness:0.20, clapRoomMix:0.05, hatBrightness:0.65, subRoomBleed:0.02 },
  dubtechno:    { kickBodyEnd:30,  kickDecay:0.20, kickSoftness:0.80, clapRoomMix:0.40, hatBrightness:0.22, subRoomBleed:0.12 },
  ukgarage:     { kickBodyEnd:38,  kickDecay:0.10, kickSoftness:0.42, clapRoomMix:0.08, hatBrightness:0.62, subRoomBleed:0.03 },
  dnb:          { kickBodyEnd:50,  kickDecay:0.05, kickSoftness:0.10, clapRoomMix:0.04, hatBrightness:0.80, subRoomBleed:0.01 },
  ambienttechno:{ kickBodyEnd:28,  kickDecay:0.22, kickSoftness:0.90, clapRoomMix:0.45, hatBrightness:0.18, subRoomBleed:0.15 },
  trance:       { kickBodyEnd:38,  kickDecay:0.11, kickSoftness:0.38, clapRoomMix:0.09, hatBrightness:0.58, subRoomBleed:0.05 },
  hardcore:     { kickBodyEnd:38,  kickDecay:0.06, kickSoftness:0.05, clapRoomMix:0.03, hatBrightness:0.85, subRoomBleed:0.01 },
  hardtechno:   { kickBodyEnd:35,  kickDecay:0.18, kickSoftness:0.15, clapRoomMix:0.04, hatBrightness:0.70, subRoomBleed:0.02 },
  downtempo:    { kickBodyEnd:34,  kickDecay:0.18, kickSoftness:0.65, clapRoomMix:0.22, hatBrightness:0.30, subRoomBleed:0.08 },
  electronica:  { kickBodyEnd:42,  kickDecay:0.14, kickSoftness:0.55, clapRoomMix:0.20, hatBrightness:0.45, subRoomBleed:0.06 },
  italo:        { kickBodyEnd:42,  kickDecay:0.09, kickSoftness:0.40, clapRoomMix:0.12, hatBrightness:0.60, subRoomBleed:0.04 },
};

const CR_ACTIVE_GENRES = new Set([
  'deephouse','dubtechno','ukgarage','downtempo','electronica',
  'ambienttechno','trance','italo','detroittechno',
]);

const CONVERSATION_STRENGTH = {
  deephouse:    0.70,
  techhouse:    0.50,
  acidhouse:    0.45,
  detroittechno:0.55,
  minimaltechno:0.80, // minimal: very deliberate space
  dubtechno:    0.85, // dub: maximum conversation, echo answers everything
  ukgarage:     0.55,
  dnb:          0.40,
  ambienttechno:0.90, // ambient: everything listens
  trance:       0.35, // trance: less conversation, more unison
  hardcore:     0.25,
  hardtechno:   0.30,
  downtempo:    0.65,
  electronica:  0.70,
  italo:        0.60,
};

const RECOVERY_BARS = {
  deephouse:16, techhouse:16, acidhouse:14, detroittechno:16,
  minimaltechno:24, dubtechno:28, ukgarage:12, dnb:12,
  ambienttechno:32, trance:16, hardcore:12, hardtechno:12,
  downtempo:24, electronica:20, italo:16,
};

const AUTO_BREAK_CHANCE = {
  deephouse:0.40, techhouse:0.30, acidhouse:0.25, detroittechno:0.35,
  minimaltechno:0.50, dubtechno:0.55, ukgarage:0.20, dnb:0.20,
  ambienttechno:0.60, trance:0.30, hardcore:0.15, hardtechno:0.20,
  downtempo:0.50, electronica:0.45, italo:0.30,
};

const SILENCE_DURATION = {
  minimaltechno:{ voice_out:8,  hat_out:4, all_but_sub:2, bass_drop:2 },
  dubtechno:    { voice_out:8,  hat_out:8, all_but_sub:4, bass_drop:4 },
  ambienttechno:{ voice_out:12, hat_out:8, all_but_sub:4, bass_drop:2 },
  deephouse:    { voice_out:4,  hat_out:4, all_but_sub:2, bass_drop:2 },
  techhouse:    { voice_out:4,  hat_out:2, all_but_sub:2, bass_drop:1 },
  acidhouse:    { voice_out:4,  hat_out:4, all_but_sub:2, bass_drop:2 },
  detroittechno:{ voice_out:4,  hat_out:4, all_but_sub:2, bass_drop:2 },
  electronica:  { voice_out:4,  hat_out:4, all_but_sub:2, bass_drop:2 },
  downtempo:    { voice_out:6,  hat_out:4, all_but_sub:2, bass_drop:2 },
  dnb:          { voice_out:2,  hat_out:2, all_but_sub:1, bass_drop:1 },
  italo:        { voice_out:4,  hat_out:2, all_but_sub:2, bass_drop:2 },
  trance:       { voice_out:4,  hat_out:4, all_but_sub:2, bass_drop:2 },
  hardcore:     { voice_out:2,  hat_out:2, all_but_sub:1, bass_drop:1 },
  hardtechno:   { voice_out:2,  hat_out:2, all_but_sub:1, bass_drop:1 },
  ukgarage:     { voice_out:4,  hat_out:2, all_but_sub:2, bass_drop:2 },
};

const SILENCE_TYPES_ALLOWED = {
  minimaltechno:['voice_out','hat_out','all_but_sub'],
  dubtechno:    ['voice_out','hat_out','all_but_sub','bass_drop'],
  ambienttechno:['voice_out','hat_out','all_but_sub'],
  deephouse:    ['voice_out','hat_out','all_but_sub'],
  techhouse:    ['voice_out','hat_out'],
  acidhouse:    ['voice_out','hat_out','bass_drop'],
  detroittechno:['voice_out','hat_out','all_but_sub'],
  electronica:  ['voice_out','hat_out','all_but_sub','bass_drop'],
  downtempo:    ['voice_out','hat_out','all_but_sub'],
  dnb:          ['hat_out','bass_drop'],
  italo:        ['voice_out','hat_out'],
  trance:       ['hat_out','all_but_sub'],
  hardcore:     ['hat_out','bass_drop'],
  hardtechno:   ['hat_out','bass_drop'],
  ukgarage:     ['voice_out','hat_out'],
};

const DJ_JOURNEY_STATES = {
  ARRIVAL:   { energy:[0.05,0.25], bpmMod:0,    drumVol:[0.30,0.50], reverbAmt:[1.8,1.4], melodicAct:0.3, bassPress:0.2, brightness:0.5, density:0.25, noise:0.3,  changeProb:0.06 },
  LOCK_IN:   { energy:[0.30,0.55], bpmMod:2,    drumVol:[0.55,0.80], reverbAmt:[1.3,1.0], melodicAct:0.5, bassPress:0.5, brightness:0.6, density:0.50, noise:0.25, changeProb:0.10 },
  PRESSURE:  { energy:[0.55,0.75], bpmMod:4,    drumVol:[0.80,1.05], reverbAmt:[0.9,0.7], melodicAct:0.4, bassPress:0.8, brightness:0.55,density:0.70, noise:0.4,  changeProb:0.14 },
  RELEASE:   { energy:[0.25,0.45], bpmMod:-2,   drumVol:[0.40,0.65], reverbAmt:[1.6,1.2], melodicAct:0.7, bassPress:0.3, brightness:0.8, density:0.40, noise:0.15, changeProb:0.08 },
  PEAK:      { energy:[0.80,1.00], bpmMod:5,    drumVol:[1.00,1.20], reverbAmt:[0.7,0.5], melodicAct:0.6, bassPress:1.0, brightness:0.9, density:0.90, noise:0.5,  changeProb:0.18 },
  AFTERGLOW: { energy:[0.15,0.35], bpmMod:-4,   drumVol:[0.30,0.55], reverbAmt:[1.8,1.5], melodicAct:0.8, bassPress:0.2, brightness:0.7, density:0.30, noise:0.1,  changeProb:0.05 },
  ENDING:    { energy:[0.05,0.15], bpmMod:-6,   drumVol:[0.10,0.25], reverbAmt:[2.2,2.5], melodicAct:0.4, bassPress:0.1, brightness:0.4, density:0.15, noise:0.05, changeProb:0.03 },
};

const DJ_JOURNEY_SEQUENCE = ['ARRIVAL','LOCK_IN','PRESSURE','RELEASE','PEAK','AFTERGLOW','ENDING'];

const DJ_CHAPTER_IDENTITIES = {
  dubby:       { genres:['dubtechno','deephouse'],          mutRate:0.06, silChance:0.40, formMult:0.8, feel:'stripped' },
  percussive:  { genres:['techhouse','detroittechno'],      mutRate:0.12, silChance:0.15, formMult:1.0, feel:'drive'    },
  acid:        { genres:['acidtechno','techhouse'],         mutRate:0.18, silChance:0.20, formMult:1.2, feel:'synco'    },
  warm:        { genres:['deephouse','italo'],              mutRate:0.08, silChance:0.25, formMult:0.9, feel:'halftime' },
  industrial:  { genres:['detroittechno','industrialtechno'],mutRate:0.20,silChance:0.12, formMult:1.1, feel:'broken'   },
  stripped:    { genres:['minimaltechno','dubtechno'],      mutRate:0.05, silChance:0.45, formMult:0.7, feel:'stripped' },
  euphoric:    { genres:['italo','deephouse'],              mutRate:0.14, silChance:0.10, formMult:1.3, feel:'main'     },
  ambient:     { genres:['dubtechno','minimaltechno'],      mutRate:0.04, silChance:0.55, formMult:0.6, feel:'stripped' },
  broken:      { genres:['detroittechno','techhouse'],      mutRate:0.22, silChance:0.18, formMult:1.0, feel:'broken'   },
  driving:     { genres:['techhouse','detroittechno'],      mutRate:0.16, silChance:0.08, formMult:1.2, feel:'drive'    },
};

const DRUM_BANK = {
  deephouse: [
    {feel:'main',    kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,0,0,1,0,1,0,0,1,0,0,1,0,1,0,1],perc:[0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0]},
    {feel:'synco',   kick:[1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],hihat:[0,0,1,0,0,1,0,1,0,0,1,0,0,1,0,1],perc:[0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0]},
    {feel:'halftime',kick:[1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],clap:[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],hihat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],perc:[0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0]},
    {feel:'stripped',kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],perc:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
    {feel:'broken',  kick:[1,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,1,0,0,1,0],hihat:[1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,0],perc:[0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1]},
  ],
  techhouse: [
    {feel:'main',    kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0],perc:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0]},
    {feel:'drive',   kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],perc:[0,0,0,1,0,0,1,0,0,0,0,1,0,0,0,0]},
    {feel:'synco',   kick:[1,0,0,0,1,0,0,1,0,0,1,0,0,0,1,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],hihat:[1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,0],perc:[0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,1]},
    {feel:'stripped',kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],perc:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
    {feel:'broken',  kick:[1,0,0,0,0,0,1,0,1,0,0,1,0,0,1,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],hihat:[1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,0],perc:[0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0]},
  ],
  detroittechno: [
    {feel:'main',    kick:[1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],hihat:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],perc:[0,0,1,0,0,1,0,0,0,0,1,0,0,1,0,0]},
    {feel:'synco',   kick:[1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,0,1,1,0,1,1,0,1,0,1,1,0,1,1,0],perc:[0,1,0,0,1,0,0,1,0,1,0,0,1,0,0,1]},
    {feel:'halftime',kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,0],perc:[0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0]},
    {feel:'stripped',kick:[1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1],perc:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
    {feel:'broken',  kick:[1,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0],clap:[0,0,0,0,1,0,0,1,0,0,0,0,1,0,1,0],hihat:[1,1,0,1,1,0,1,1,0,1,0,1,1,0,1,0],perc:[0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0]},
  ],
  dubtechno: [
    {feel:'main',    kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],hihat:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],perc:[0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0]},
    {feel:'halftime',kick:[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],hihat:[1,0,0,1,0,0,0,0,1,0,0,1,0,0,0,0],perc:[0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0]},
    {feel:'synco',   kick:[1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],hihat:[1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0],perc:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0]},
    {feel:'stripped',kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],hihat:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],perc:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
  ],
  minimaltechno: [
    {feel:'main',    kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0],clap:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],hihat:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],perc:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0]},
    {feel:'halftime',kick:[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],hihat:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],perc:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
    {feel:'synco',   kick:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],hihat:[0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0],perc:[0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0]},
    {feel:'stripped',kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],hihat:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],perc:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
  ],
  downtempo: [
    {feel:'main',    kick:[1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],hihat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],perc:[0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0]},
    {feel:'halftime',kick:[1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],clap:[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],hihat:[1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1],perc:[0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0]},
    {feel:'synco',   kick:[1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0],hihat:[1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0],perc:[0,0,1,0,0,0,0,1,0,0,0,0,0,0,1,0]},
    {feel:'broken',  kick:[1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0],clap:[0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0],hihat:[1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1],perc:[0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0]},
    {feel:'stripped',kick:[1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],hihat:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],perc:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
  ],
  electronica: [
    {feel:'main',    kick:[1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],hihat:[1,0,1,0,1,0,1,0,0,0,1,0,1,0,0,1],perc:[0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0]},
    {feel:'synco',   kick:[1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0],hihat:[1,1,0,0,0,1,0,0,1,1,0,0,0,1,0,1],perc:[0,0,1,0,0,0,0,1,0,0,1,0,0,0,0,0]},
    {feel:'broken',  kick:[1,0,0,1,0,0,0,0,1,0,0,0,0,0,1,0],clap:[0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0],hihat:[1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,0],perc:[0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,1]},
    {feel:'halftime',kick:[1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],clap:[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],hihat:[1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0],perc:[0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0]},
    {feel:'stripped',kick:[1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],hihat:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],perc:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
    {feel:'drive',   kick:[1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],hihat:[1,1,1,0,1,1,0,1,1,1,1,0,1,1,0,1],perc:[0,0,1,0,0,1,0,0,0,0,1,0,0,1,0,0]},
  ],
  italo: [
    {feel:'main',    kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],perc:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],snap:[0,0,0,0,1,0,0,0,0,0,1,0,1,0,0,0]},
    {feel:'synco',   kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],hihat:[1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1],perc:[0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0],snap:[0,0,0,0,1,0,0,1,0,0,1,0,1,0,0,1]},
    {feel:'halftime',kick:[1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,1,0,1,1,0,1,1,1,1,0,1,1,0,1,1],perc:[0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0],snap:[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]},
    {feel:'stripped',kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1],perc:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],snap:[0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0]},
  ],
  dnb: [
    {feel:'main',    kick:[1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],clap:[0,0,0,0,1,0,0,1,0,0,0,0,1,0,1,0],hihat:[1,1,0,1,1,0,1,0,1,1,0,1,1,0,1,0],perc:[0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0]},
    {feel:'synco',   kick:[1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,1,0,0,0,1,0,0,1,0],hihat:[1,0,1,0,1,0,1,1,0,1,0,1,0,1,1,0],perc:[0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1]},
    {feel:'halftime',kick:[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],hihat:[1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,0],perc:[0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0]},
  ],
  ambienttechno: [
    {feel:'main',    kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],hihat:[1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0],perc:[0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0]},
    {feel:'stripped',kick:[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],hihat:[0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0],perc:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
    {feel:'synco',   kick:[1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],clap:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],hihat:[1,0,0,1,0,0,0,0,1,0,0,1,0,0,0,0],perc:[0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0]},
  ],
};

const GENRE_MELODY_RULES = {
  deephouse:    { repeatBias:0.62, restBias:0.30, maxLeap:3, octaveRange:1.5 },
  techhouse:    { repeatBias:0.50, restBias:0.20, maxLeap:4, octaveRange:1.5 },
  acidhouse:    { repeatBias:0.40, restBias:0.18, maxLeap:5, octaveRange:2.0 },
  detroittechno:{ repeatBias:0.55, restBias:0.22, maxLeap:4, octaveRange:1.5 },
  minimaltechno:{ repeatBias:0.80, restBias:0.45, maxLeap:2, octaveRange:1.0 },
  dubtechno:    { repeatBias:0.85, restBias:0.55, maxLeap:2, octaveRange:1.0 },
  ukgarage:     { repeatBias:0.45, restBias:0.15, maxLeap:5, octaveRange:2.0 },
  dnb:          { repeatBias:0.40, restBias:0.20, maxLeap:6, octaveRange:2.0 },
  ambienttechno:{ repeatBias:0.90, restBias:0.65, maxLeap:2, octaveRange:1.0 },
  trance:       { repeatBias:0.35, restBias:0.12, maxLeap:5, octaveRange:2.5 },
  hardcore:     { repeatBias:0.55, restBias:0.20, maxLeap:4, octaveRange:1.5 },
  hardtechno:   { repeatBias:0.60, restBias:0.25, maxLeap:3, octaveRange:1.5 },
  downtempo:    { repeatBias:0.58, restBias:0.35, maxLeap:4, octaveRange:1.5 },
  electronica:  { repeatBias:0.42, restBias:0.22, maxLeap:6, octaveRange:2.0 },
  italo:        { repeatBias:0.38, restBias:0.15, maxLeap:5, octaveRange:2.0 },
};

const GENRE_LAYER_LIMITS = {
  minimaltechno:{ min:3, max:5 },
  dubtechno:    { min:3, max:5 },
  ambienttechno:{ min:3, max:5 },
  deephouse:    { min:5, max:7 },
  techhouse:    { min:5, max:6 },
  acidhouse:    { min:5, max:7 },
  detroittechno:{ min:5, max:7 },
  ukgarage:     { min:5, max:7 },
  dnb:          { min:4, max:6 },
  trance:       { min:6, max:8 },
  hardcore:     { min:5, max:7 },
  hardtechno:   { min:5, max:6 },
  downtempo:    { min:3, max:6 },
  electronica:  { min:5, max:8 },
  italo:        { min:6, max:8 },
};

const GENRE_SIGNATURE = {
  deephouse:    { intervals:[0,5,3],   returnBias:0.55, name:'minor7 fall'    }, // scale: root→+5→+3
  techhouse:    { intervals:[0,7,5],   returnBias:0.50, name:'5th punch'      }, // scale: root→+7→+5
  acidhouse:    { intervals:[0,3,7],   returnBias:0.45, name:'minor triad'    }, // scale: root→+3→+7
  detroittechno:{ intervals:[0,7,10],  returnBias:0.52, name:'minor7 reach'   }, // scale: root→+7→+10
  minimaltechno:{ intervals:[0,0,7],   returnBias:0.70, name:'root+5th drone' }, // root repeats, occasional 5th
  dubtechno:    { intervals:[0,5,0],   returnBias:0.75, name:'root+4th echo'  }, // root→4th→return
  ukgarage:     { intervals:[0,4,7],   returnBias:0.48, name:'major triad'    }, // bright, uplifting
  dnb:          { intervals:[0,7,12],  returnBias:0.42, name:'octave reach'   }, // root→5th→octave
  ambienttechno:{ intervals:[0,5,9],   returnBias:0.80, name:'sus4 float'     }, // suspended, open
  trance:       { intervals:[0,4,7,12],returnBias:0.38, name:'major 7th rise' }, // euphoric climb
  hardcore:     { intervals:[0,7,7],   returnBias:0.55, name:'5th hammer'     }, // aggressive repeat
  hardtechno:   { intervals:[0,5,7],   returnBias:0.58, name:'power chord'    }, // industrial
  downtempo:    { intervals:[0,3,5],   returnBias:0.60, name:'blues curl'     }, // minor3→4th
  electronica:  { intervals:[0,4,9],   returnBias:0.45, name:'major6 colour'  }, // unexpected 6th
  italo:        { intervals:[0,4,7,4], returnBias:0.42, name:'disco bounce'   }, // root→3→5→3 bounce
};

const GENRE_CONTOUR_WEIGHTS = {
  deephouse:     { repeat:20, rise:20, fall:15, arch:30, question:15 },
  techhouse:     { repeat:30, rise:15, fall:15, arch:25, question:15 },
  detroittechno: { repeat:25, rise:15, fall:20, arch:25, question:15 },
  minimaltechno: { repeat:50, rise:10, fall:15, arch:20, question:5  },
  dubtechno:     { repeat:60, rise:10, fall:10, arch:15, question:5  },
  dnb:           { repeat:25, rise:20, fall:25, arch:15, question:15 },
  ambienttechno: { repeat:50, rise:20, fall:10, arch:15, question:5  },
  trance:        { repeat:10, rise:35, fall:10, arch:35, question:10 },
  hardcore:      { repeat:40, rise:15, fall:20, arch:15, question:10 },
  hardtechno:    { repeat:40, rise:15, fall:20, arch:15, question:10 },
  italo:         { repeat:15, rise:25, fall:10, arch:35, question:15 },
  downtempo:     { repeat:25, rise:20, fall:15, arch:30, question:10 },
  electronica:   { repeat:20, rise:20, fall:15, arch:25, question:20 },
  garage:        { repeat:20, rise:20, fall:15, arch:25, question:20 },
  hiphop:        { repeat:35, rise:15, fall:15, arch:20, question:15 },
};

const VOICE_PHRASE_DENSITY = {
  house:      0.50, techno:     0.45, italo:      0.55,
  garage:     0.60, dnb:        0.55, trance:     0.45,
  hiphop:     0.55, dub:        0.40, ambient:    0.25,
  hardcore:   0.50, hardtechno: 0.50, electronica:0.45,
};

const SYNC_DEFAULTS={Pulse:'sync',Drone:'free',Acid:'sync',Sub:'sync',Ring:'sync',Noise:'free',Arp:'sync',EP:'sync',FMStab:'sync',WTPad:'free',Shimmer:'free',FM3:'sync',Pluck:'sync',Pad:'free',Vocal:'free',Phys:'free',Laser:'sync',Echo:'sync',Conga:'sync',Chord:'free',SFX:'sync'};

const GENRE_ROLE_BALANCE = {
  deephouse:    { rhythm:0.15, voice:0.45, atmosphere:0.40 },
  techhouse:    { rhythm:0.30, voice:0.55, atmosphere:0.15 },
  acidhouse:    { rhythm:0.20, voice:0.60, atmosphere:0.20 },
  detroittechno:{ rhythm:0.20, voice:0.55, atmosphere:0.25 },
  minimaltechno:{ rhythm:0.10, voice:0.40, atmosphere:0.50 },
  dubtechno:    { rhythm:0.10, voice:0.25, atmosphere:0.65 },
  ukgarage:     { rhythm:0.25, voice:0.55, atmosphere:0.20 },
  dnb:          { rhythm:0.40, voice:0.45, atmosphere:0.15 },
  ambienttechno:{ rhythm:0.05, voice:0.25, atmosphere:0.70 },
  trance:       { rhythm:0.10, voice:0.55, atmosphere:0.35 },
  hardcore:     { rhythm:0.35, voice:0.50, atmosphere:0.15 },
  downtempo:    { rhythm:0.20, voice:0.45, atmosphere:0.35 },
  electronica:  { rhythm:0.15, voice:0.45, atmosphere:0.40 },
  italo:        { rhythm:0.20, voice:0.55, atmosphere:0.25 },
};

const INSTRUMENT_ROLE_REGISTRY = {
  Pulse:   { primaryRole: 'voice' },
  Drone:   { primaryRole: 'atmosphere' },
  Acid:    { primaryRole: 'voice' },
  Sub:     { primaryRole: 'voice' },
  Arp:     { primaryRole: 'voice' },
  Shimmer: { primaryRole: 'atmosphere' },
  WTPad:   { primaryRole: 'atmosphere' },
  FM3:     { primaryRole: 'voice' },
  EP:      { primaryRole: 'voice' },
  FMStab:  { primaryRole: 'voice' },
  Pluck:   { primaryRole: 'voice' },
  Pad:     { primaryRole: 'atmosphere' },
  Vocal:   { primaryRole: 'atmosphere' },
  Laser:   { primaryRole: 'atmosphere' },
  Echo:    { primaryRole: 'voice' },
  Conga:   { primaryRole: 'rhythm' },
  Chord:   { primaryRole: 'atmosphere' },
  SFX: {
    primaryRole: 'atmosphere',
    variantRoles: { Siren:'atmosphere', UFO:'atmosphere', Shutter:'rhythm', Zap:'rhythm', Riser:'atmosphere', Vinyl:'atmosphere' }
  },
  Ring: {
    primaryRole: 'voice',
    variantRoles: { Bell:'voice', Marimba:'voice', 'Metal Perc':'rhythm', Gong:'atmosphere' }
  },
  Phys: {
    primaryRole: 'atmosphere',
    variantRoles: {
      'Bowed String':'atmosphere', 'Steel Drum':'voice', 'Blown Pipe':'atmosphere',
      'Wood Body':'rhythm', Cello:'atmosphere', Flute:'atmosphere', Tabla:'rhythm', 'Glass Bar':'voice'
    }
  },
  Noise: {
    primaryRole: 'atmosphere',
    variantRoles: { Wash:'atmosphere', Wind:'atmosphere', Riser:'atmosphere', 'Snare Tex':'rhythm' }
  },
};

const SB_RHYTHM_TYPES     = ['Sub','Acid','Conga','Ring','Pluck','FMStab','Noise','SFX','Phys'];

const SB_VOICE_TYPES      = ['Arp','EP','FM3','Pulse','Echo','Vocal'];

const SB_ATMOSPHERE_TYPES = ['Drone','Pad','Chord','WTPad','Shimmer','Laser'];

const ROLE_MENU = {
  rhythm: {
    label: 'Rhythm',
    color: 'rgba(255,100,100',
    groups: [
      { label: 'Drum Core',         types: [] }, // populated dynamically — drum machine only
      { label: 'Hand Percussion',   types: ['Conga'] },
      { label: 'Metal & Glitch',    types: ['Ring','SFX','Noise','Phys'] }, // filtered to rhythm variants
    ]
  },
  voice: {
    label: 'Voices',
    color: 'rgba(72,202,228',
    groups: [
      { label: 'Bass',              types: ['Sub','Acid'] },
      { label: 'Stabs & Chords',    types: ['Pulse','FMStab'] },
      { label: 'Arps & Plucks',     types: ['Arp','Pluck'] },
      { label: 'Keys & FM',         types: ['EP','FM3'] },
      { label: 'Pitched Perc & Echo', types: ['Ring','Echo','Phys'] }, // filtered to voice variants
    ]
  },
  atmosphere: {
    label: 'Atmosphere',
    color: 'rgba(181,131,141',
    groups: [
      { label: 'Pads & Fields',     types: ['Pad','WTPad','Drone','Chord'] },
      { label: 'Vocal & Shimmer',   types: ['Vocal','Shimmer'] },
      { label: 'Noise & Sweeps',    types: ['Laser','SFX','Noise','Phys'] }, // filtered to atmos variants
    ]
  }
};

const SYNC_HINTS={
  Pulse:'Retriggers on every beat',
  Drone:'Plays continuously',
  Acid:'Fires per beat',
  Sub:'Retriggers on every beat',
  Ring:'Retriggers on every beat',
  Noise:'Plays continuously',
};

const LIVE_SETS = [
  {
    id:'first_light',
    name:'First Light',
    tagline:'delicate · emerging · hopeful',
    timeSlot:[6,8],
    endMode:'dissolve',
    genres:['Ambient Techno','Downtempo','Deep House'],
    cues:[
      {at:0,   genre:'ambienttechno', energy:0.20, bpm:104, label:'opening'},
      {at:25,  genre:'downtempo',     energy:0.38, bpm:108, label:'warming'},
      {at:55,  genre:'deephouse',     energy:0.58, bpm:118, label:'groove'},
      {at:85,  genre:'downtempo',     energy:0.40, bpm:110, label:'settling'},
      {at:108, genre:'ambienttechno', energy:0.18, bpm:104, label:'close'},
    ]
  },
  {
    id:'morning_rise',
    name:'Morning Rise',
    tagline:'warm · unhurried · golden',
    timeSlot:[8,10],
    endMode:'high',
    genres:['Deep House','Electronica','Italo Disco'],
    cues:[
      {at:0,   genre:'deephouse',   energy:0.35, bpm:118, label:'arrival'},
      {at:30,  genre:'electronica', energy:0.52, bpm:118, label:'colour'},
      {at:65,  genre:'deephouse',   energy:0.68, bpm:122, label:'depth'},
      {at:90,  genre:'italo',       energy:0.88, bpm:124, label:'heat'},
      {at:108, genre:'italo',       energy:0.95, bpm:126, label:'closer'},
    ]
  },
  {
    id:'midday',
    name:'Midday',
    tagline:'bright · open · moving',
    timeSlot:[10,12],
    endMode:'high',
    genres:['Italo Disco','Tech House','Detroit Techno'],
    cues:[
      {at:0,   genre:'italo',        energy:0.45, bpm:122, label:'spark'},
      {at:28,  genre:'techhouse',    energy:0.62, bpm:128, label:'rise'},
      {at:58,  genre:'detroittechno',energy:0.80, bpm:130, label:'locked'},
      {at:85,  genre:'techhouse',    energy:0.90, bpm:132, label:'peak'},
      {at:108, genre:'detroittechno',energy:0.85, bpm:130, label:'drive'},
    ]
  },
  {
    id:'long_afternoon',
    name:'Long Afternoon',
    tagline:'relentless · sweaty · hypnotic',
    timeSlot:[12,14],
    endMode:'high',
    genres:['Tech House','Acid House','Detroit Techno'],
    cues:[
      {at:0,   genre:'techhouse',    energy:0.60, bpm:130, label:'enter'},
      {at:25,  genre:'detroittechno',energy:0.75, bpm:132, label:'locked'},
      {at:50,  genre:'acidhouse',    energy:0.88, bpm:134, label:'acid'},
      {at:72,  genre:'techhouse',    energy:0.92, bpm:134, label:'return'},
      {at:92,  genre:'acidhouse',    energy:0.98, bpm:135, label:'peak'},
      {at:108, genre:'acidhouse',    energy:0.95, bpm:134, label:'closer'},
    ]
  },
  {
    id:'descent',
    name:'Late Afternoon',
    tagline:'drifting · hypnotic · deep',
    timeSlot:[14,16],
    endMode:'dissolve',
    genres:['Minimal Techno','Dub Techno','Detroit Techno','Acid House'],
    cues:[
      {at:0,   genre:'minimaltechno',energy:0.30, bpm:128, label:'entrance'},
      {at:22,  genre:'dubtechno',    energy:0.50, bpm:126, label:'depth'},
      {at:45,  genre:'detroittechno',energy:0.72, bpm:130, label:'momentum'},
      {at:65,  genre:'acidhouse',    energy:0.92, bpm:133, label:'peak'},
      {at:80,  genre:'detroittechno',energy:0.70, bpm:130, label:'return'},
      {at:98,  genre:'dubtechno',    energy:0.42, bpm:126, label:'space'},
      {at:112, genre:'minimaltechno',energy:0.18, bpm:124, label:'resolution'},
    ]
  },
  {
    id:'golden_hour',
    name:'Golden Hour',
    tagline:'electric · anticipatory · alive',
    timeSlot:[16,18],
    endMode:'high',
    genres:['Italo Disco','Deep House','Electronica'],
    cues:[
      {at:0,   genre:'deephouse',   energy:0.38, bpm:116, label:'light'},
      {at:30,  genre:'italo',       energy:0.62, bpm:122, label:'glow'},
      {at:62,  genre:'electronica', energy:0.75, bpm:120, label:'colour'},
      {at:88,  genre:'italo',       energy:0.90, bpm:124, label:'peak'},
      {at:108, genre:'italo',       energy:0.92, bpm:126, label:'closer'},
    ]
  },
  {
    id:'late_wave',
    name:'Late Wave',
    tagline:'hazy · melodic · drifting',
    timeSlot:[18,20],
    endMode:'dissolve',
    genres:['Electronica','Deep House','Dub Techno'],
    cues:[
      {at:0,   genre:'electronica', energy:0.35, bpm:112, label:'drift',     event:'intro'},
      {at:28,  genre:'deephouse',   energy:0.58, bpm:118, label:'groove',    transition:'soft'},
      {at:55,  genre:'deephouse',   energy:0.65, bpm:120, label:'peak',      event:'peak'},
      {at:68,  genre:'dubtechno',   energy:0.20, bpm:114, label:'breakdown', transition:'breakdown', event:'breakdown'},
      {at:82,  genre:'dubtechno',   energy:0.38, bpm:116, label:'space',     event:'dissolve'},
      {at:100, genre:'electronica', energy:0.30, bpm:112, label:'return',    transition:'soft',      event:'return'},
      {at:112, genre:'electronica', energy:0.18, bpm:110, label:'fade',      event:'resolution'},
    ]
  },
  {
    id:'uk_night',
    name:'UK Night',
    tagline:'swing · syncopated · electric',
    timeSlot:[20,22],
    endMode:'high',
    genres:['UK Garage','Italo Disco','Tech House'],
    cues:[
      {at:0,   genre:'ukgarage',  energy:0.50, bpm:130, label:'shuffle'},
      {at:30,  genre:'italo',     energy:0.68, bpm:128, label:'colour'},
      {at:60,  genre:'techhouse', energy:0.82, bpm:132, label:'drive'},
      {at:85,  genre:'ukgarage',  energy:0.90, bpm:132, label:'peak'},
      {at:108, genre:'techhouse', energy:0.92, bpm:134, label:'closer'},
    ]
  },
  {
    id:'after_hours',
    name:'After Hours',
    tagline:'deep · searching · raw',
    timeSlot:[22,24],
    endMode:'dissolve',
    genres:['Detroit Techno','Minimal Techno','Dub Techno'],
    cues:[
      {at:0,   genre:'detroittechno',energy:0.65, bpm:130, label:'open'},
      {at:35,  genre:'minimaltechno',energy:0.78, bpm:130, label:'strip'},
      {at:68,  genre:'dubtechno',    energy:0.60, bpm:126, label:'space'},
      {at:95,  genre:'minimaltechno',energy:0.45, bpm:128, label:'return'},
      {at:112, genre:'dubtechno',    energy:0.25, bpm:124, label:'dissolve'},
    ]
  },
  {
    id:'dnb_night',
    name:'DNB Night',
    tagline:'kinetic · urgent · relentless',
    timeSlot:[0,2],
    endMode:'high',
    genres:['UK Garage','Drum & Bass','Hardcore'],
    cues:[
      {at:0,   genre:'ukgarage',  energy:0.55, bpm:130, label:'warmup'},
      {at:25,  genre:'dnb',       energy:0.78, bpm:170, label:'jump'},
      {at:60,  genre:'hardcore',  energy:0.92, bpm:175, label:'peak'},
      {at:85,  genre:'dnb',       energy:0.88, bpm:170, label:'return'},
      {at:108, genre:'hardcore',  energy:0.98, bpm:175, label:'closer'},
    ]
  },
  {
    id:'trance_dawn',
    name:'Trance Dawn',
    tagline:'euphoric · ascending · infinite',
    timeSlot:[2,4],
    endMode:'high',
    genres:['Trance','Italo Disco','Detroit Techno'],
    cues:[
      {at:0,   genre:'italo',        energy:0.42, bpm:122, label:'before'},
      {at:28,  genre:'trance',       energy:0.65, bpm:136, label:'lift'},
      {at:58,  genre:'detroittechno',energy:0.80, bpm:132, label:'anchor'},
      {at:82,  genre:'trance',       energy:0.95, bpm:138, label:'peak'},
      {at:108, genre:'trance',       energy:0.98, bpm:138, label:'euphoria'},
    ]
  },
  {
    id:'sunrise',
    name:'Sunrise',
    tagline:'coming down · light · released',
    timeSlot:[4,6],
    endMode:'dissolve',
    genres:['Downtempo','Ambient Techno','Electronica'],
    cues:[
      {at:0,   genre:'downtempo',    energy:0.40, bpm:108, label:'coming down'},
      {at:30,  genre:'ambienttechno',energy:0.28, bpm:104, label:'light'},
      {at:65,  genre:'electronica',  energy:0.35, bpm:108, label:'colour'},
      {at:95,  genre:'ambienttechno',energy:0.20, bpm:100, label:'peace'},
      {at:112, genre:'ambienttechno',energy:0.12, bpm:98,  label:'close'},
    ]
  },
];

const GENRE_GRAPH = {
  deephouse:    ['techhouse','dubtechno','downtempo','electronica'],
  techhouse:    ['deephouse','minimaltechno','ukgarage','detroittechno'],
  acidhouse:    ['techhouse','detroittechno','hardcore'],
  detroittechno:['acidhouse','minimaltechno','dubtechno','techhouse'],
  minimaltechno:['techhouse','detroittechno','dubtechno'],
  dubtechno:    ['ambienttechno','detroittechno','deephouse','minimaltechno'],
  ukgarage:     ['techhouse','deephouse','dnb'],
  dnb:          ['ukgarage','hardcore','detroittechno'],
  ambienttechno:['dubtechno','downtempo','electronica'],
  trance:       ['electronica','detroittechno','techhouse','italo'],
  hardcore:     ['dnb','acidhouse','detroittechno'],
  downtempo:    ['ambienttechno','electronica','deephouse'],
  electronica:  ['downtempo','ambienttechno','trance','deephouse'],
  italo:        ['deephouse','techhouse','trance'],
};

const GENRE_LABELS = {
  deephouse:'Deep House', techhouse:'Tech House', acidhouse:'Acid House',
  detroittechno:'Detroit Techno', minimaltechno:'Minimal Techno',
  dubtechno:'Dub Techno', ukgarage:'UK Garage', dnb:'Drum & Bass',
  ambienttechno:'Ambient Techno', trance:'Trance', hardcore:'Hardcore',
  downtempo:'Downtempo', electronica:'Electronica', italo:'Italo Disco',
};

const HOLD_LABELS = {
  Sub:'HOLDING BASS', Acid:'HOLDING ACID', Arp:'HOLDING MELODY',
  Pluck:'HOLDING PLUCK', EP:'HOLDING KEYS', FM3:'HOLDING KEYS',
  FMStab:'HOLDING CHORD', Pulse:'HOLDING PULSE', Echo:'HOLDING ECHO',
  Pad:'HOLDING PAD', Drone:'HOLDING DRONE', Chord:'HOLDING CHORD',
  WTPad:'HOLDING PAD', Shimmer:'HOLDING SHIMMER', Vocal:'HOLDING VOICE',
  Noise:'HOLDING NOISE', Conga:'HOLDING RHYTHM', Ring:'HOLDING RHYTHM',
  Laser:'HOLDING LASER', Phys:'HOLDING RHYTHM', SFX:'HOLDING SFX',
};

const HAPTIC_PATTERNS = {
  Sub:     [40,20,40,20,40],          // slow heavy — feel the bass pressure
  Drone:   [30,15,30,15,30],
  Pad:     [5,5,5,5,5,5,5,5,5,5],    // soft continuous hum
  WTPad:   [5,5,5,5,5,5,5,5],
  Chord:   [20,10,20,10,20],
  Pulse:   [15,8,15,8,15,8],
  Acid:    [8,4,12,3,6,4,8,3,10,4],  // jittery, irregular
  FMStab:  [12,6,12,6,12,6],
  FM3:     [10,6,10,6,10],
  EP:      [15,8,15,8],
  Pluck:   [10,5,10,5,8],
  Echo:    [18,12,18,12,18],
  Arp:     [6,4,6,4,6,4,6,4],
  Ring:    [8,4,8,4,8,4],
  Vocal:   [20,10,20,10,20,10],
  Shimmer: [4,6,4,6,4,6,4,6],
  Noise:   [3,2,5,1,4,2,3,1,6,2,3,1,5], // grainy, irregular
  Conga:   [12,8,10],
  Phys:    [15,8,15,8],
  Laser:   [5,2,5,2,5,2,5],
};

const SOUND_LIB_SECTIONS=[
  {label:'Drums',      keys:['__DRUMS__']},
  // ── Rhythm ──────────────────────────────────────────────────────────────
  {label:'Rhythm · Hand & Body',  keys:['Conga'],         varFilter:'rhythm'},
  {label:'Rhythm · Metal & Perc', keys:['Ring','Phys'],   varFilter:'rhythm'},
  {label:'Rhythm · Glitch',       keys:['SFX','Noise'],   varFilter:'rhythm'},
  // ── Voices ──────────────────────────────────────────────────────────────
  {label:'Voices · Bass',         keys:['Sub','Acid']},
  {label:'Voices · Stabs',        keys:['Pulse','FMStab']},
  {label:'Voices · Arps & Plucks',keys:['Arp','Pluck']},
  {label:'Voices · Keys & FM',    keys:['EP','FM3']},
  {label:'Voices · Echo',         keys:['Echo']},
  {label:'Voices · Pitched Perc', keys:['Ring','Phys'],   varFilter:'voice'},
  // ── Atmosphere ──────────────────────────────────────────────────────────
  {label:'Atmosphere · Pads',     keys:['Pad','WTPad','Drone','Chord']},
  {label:'Atmosphere · Vocal & Shimmer', keys:['Vocal','Shimmer']},
  {label:'Atmosphere · Noise & Sweeps',  keys:['Noise','Laser','SFX'], varFilter:'atmosphere'},
  {label:'Atmosphere · Strings & Winds', keys:['Phys','Ring'],         varFilter:'atmosphere'},
];

const BLOB_PERSONAS={
  // DRUMS — punchy, fast, tight falloff
  __KICK__: {fA:2,fB:3,warp:0.18,speed:2.2,falloff:[0.3,0.6,0.9],rings:[1.0,0.70,0.45,0.25],sat:[0.85,0.70,0.50,0.30]},
  __CLAP__: {fA:5,fB:9,warp:0.22,speed:3.0,falloff:[0.25,0.55,0.85],rings:[1.0,0.68,0.42,0.22],sat:[0.80,0.65,0.45,0.28]},
  __HIHAT__:{fA:7,fB:11,warp:0.14,speed:4.0,falloff:[0.2,0.5,0.8],rings:[1.0,0.72,0.48,0.28],sat:[0.75,0.60,0.42,0.25]},
  __OHIHAT__:{fA:6,fB:10,warp:0.16,speed:3.2,falloff:[0.15,0.45,0.8],rings:[1.0,0.74,0.50,0.30],sat:[0.72,0.58,0.40,0.24]},
  __SNAP__: {fA:8,fB:13,warp:0.12,speed:5.0,falloff:[0.2,0.5,0.82],rings:[1.0,0.66,0.40,0.20],sat:[0.82,0.66,0.46,0.28]},
  __PERC__: {fA:4,fB:7, warp:0.20,speed:2.8,falloff:[0.28,0.58,0.88],rings:[1.0,0.70,0.44,0.24],sat:[0.80,0.65,0.46,0.28]},
  // BASS — large, slow, soft wide falloff
  Sub:    {fA:2,fB:3, warp:0.22,speed:0.7,falloff:[0.5,0.75,0.95],rings:[1.0,0.72,0.48,0.28,0.14],sat:[0.90,0.75,0.55,0.35,0.18]},
  Acid:   {fA:3,fB:6, warp:0.28,speed:1.6,falloff:[0.35,0.65,0.90],rings:[1.0,0.70,0.44,0.24],sat:[0.88,0.72,0.52,0.32]},
  Pulse:  {fA:4,fB:5, warp:0.20,speed:1.2,falloff:[0.4,0.68,0.92],rings:[1.0,0.71,0.46,0.26],sat:[0.82,0.67,0.48,0.30]},
  // PADS — very diffuse, wide, slow falloff
  Drone:  {fA:2,fB:4, warp:0.18,speed:0.4,falloff:[0.6,0.80,0.96],rings:[1.0,0.74,0.52,0.34,0.18],sat:[0.88,0.72,0.52,0.32,0.16]},
  WTPad:  {fA:3,fB:7, warp:0.16,speed:0.6,falloff:[0.55,0.78,0.95],rings:[1.0,0.73,0.50,0.30,0.15],sat:[0.86,0.70,0.50,0.30,0.15]},
  Pad:    {fA:4,fB:2, warp:0.15,speed:0.5,falloff:[0.58,0.80,0.96],rings:[1.0,0.74,0.52,0.33,0.17],sat:[0.84,0.68,0.48,0.29,0.14]},
  Shimmer:{fA:8,fB:12,warp:0.12,speed:0.5,falloff:[0.6,0.82,0.97],rings:[1.0,0.78,0.58,0.40,0.24,0.12],sat:[0.82,0.68,0.50,0.34,0.20,0.10]},
  Noise:  {fA:3,fB:5, warp:0.32,speed:1.8,falloff:[0.3,0.60,0.88],rings:[1.0,0.68,0.42,0.22],sat:[0.80,0.64,0.44,0.26]},
  // MELODIC — medium sharpness
  EP:     {fA:5,fB:3, warp:0.20,speed:1.0,falloff:[0.38,0.65,0.90],rings:[1.0,0.71,0.46,0.26],sat:[0.84,0.68,0.48,0.30]},
  FM3:    {fA:5,fB:8, warp:0.22,speed:1.1,falloff:[0.35,0.62,0.88],rings:[1.0,0.70,0.45,0.25],sat:[0.86,0.70,0.50,0.30]},
  FMStab: {fA:4,fB:6, warp:0.26,speed:2.0,falloff:[0.28,0.55,0.85],rings:[1.0,0.69,0.43,0.23],sat:[0.88,0.72,0.52,0.32]},
  Arp:    {fA:6,fB:4, warp:0.20,speed:1.4,falloff:[0.38,0.65,0.90],rings:[1.0,0.71,0.46,0.26],sat:[0.84,0.68,0.48,0.30]},
  Pluck:  {fA:4,fB:9, warp:0.24,speed:1.5,falloff:[0.32,0.60,0.88],rings:[1.0,0.70,0.44,0.24],sat:[0.86,0.70,0.50,0.30]},
  Echo:   {fA:3,fB:5, warp:0.18,speed:0.8,falloff:[0.50,0.75,0.94],rings:[1.0,0.76,0.54,0.35,0.18],sat:[0.80,0.65,0.46,0.28,0.14]},
  Conga:  {fA:5,fB:7, warp:0.22,speed:1.8,falloff:[0.30,0.58,0.86],rings:[1.0,0.70,0.44,0.24],sat:[0.82,0.66,0.46,0.28]},
  // EXPRESSIVE — warm, organic falloff
  Vocal:  {fA:2,fB:4, warp:0.26,speed:0.5,falloff:[0.55,0.78,0.95],rings:[1.0,0.72,0.48,0.28,0.14],sat:[0.88,0.72,0.52,0.32,0.16]},
  Ring:   {fA:7,fB:5, warp:0.22,speed:1.2,falloff:[0.35,0.62,0.88],rings:[1.0,0.71,0.46,0.26],sat:[0.86,0.70,0.50,0.30]},
  Phys:   {fA:2,fB:5, warp:0.24,speed:0.7,falloff:[0.45,0.72,0.93],rings:[1.0,0.73,0.50,0.30],sat:[0.84,0.68,0.48,0.29]},
  Laser:  {fA:10,fB:7,warp:0.26,speed:2.5,falloff:[0.22,0.50,0.82],rings:[1.0,0.68,0.42,0.22],sat:[0.88,0.72,0.52,0.32]},
  Chord:  {fA:3,fB:5, warp:0.17,speed:0.6,falloff:[0.52,0.76,0.94],rings:[1.0,0.74,0.52,0.33],sat:[0.82,0.66,0.46,0.28]},
};

const BUILT_IN_VIBES=[
  {name:'Deep House',style:'deephouse',state:{bgColor:'#000000',elements:[
    {id:1,visualType:'blob',soundType:'Sub',variation:0,shape:{x:0.5,y:0.9},tone:{x:0.15,y:0.08},space:{x:0.2,y:0.2},volume:0.88,pan:0,note:'A1',syncMode:'sync',x:0.5,y:0.76,color:'#3020aa',radius:0.50,x1:0.35,y1:0.76,x2:0.65,y2:0.76,angle:0,coneWidth:0.3,pos:0.5,width:0.3},
    {id:2,visualType:'blob',soundType:'Drone',variation:0,shape:{x:0.85,y:0.95},tone:{x:0.22,y:0.06},space:{x:0.72,y:0.65},volume:0.58,pan:-0.22,note:'A3',syncMode:'free',x:0.28,y:0.36,color:'#6040cc',radius:0.42,x1:0.13,y1:0.36,x2:0.43,y2:0.36,angle:0,coneWidth:0.3,pos:0.28,width:0.25},
    {id:3,visualType:'blob',soundType:'Drone',variation:1,shape:{x:0.65,y:0.9},tone:{x:0.52,y:0.1},space:{x:0.65,y:0.8},volume:0.48,pan:0.25,note:'E3',syncMode:'free',x:0.68,y:0.30,color:'#8050dd',radius:0.32,x1:0.53,y1:0.30,x2:0.83,y2:0.30,angle:0,coneWidth:0.3,pos:0.68,width:0.2},
    {id:4,visualType:'blob',soundType:'Pulse',variation:0,shape:{x:0.22,y:0.18},tone:{x:0.58,y:0.38},space:{x:0.38,y:0.42},volume:0.65,pan:0.1,note:'A3',syncMode:'sync',x:0.5,y:0.20,color:'#c090ff',radius:0.22,x1:0.35,y1:0.20,x2:0.65,y2:0.20,angle:0,coneWidth:0.3,pos:0.5,width:0.18},
  ],drumPattern:{kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],openhh:[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],perc:[0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0]},activeDrumPreset:0}},
  {name:'Tech House',style:'techhouse',state:{bgColor:'#000000',elements:[
    {id:1,visualType:'blob',soundType:'Sub',variation:2,shape:{x:0.75,y:0.7},tone:{x:0.2,y:0.15},space:{x:0.18,y:0.22},volume:0.90,pan:0,note:'A1',syncMode:'sync',x:0.5,y:0.74,color:'#1a1a55',radius:0.48,x1:0.35,y1:0.74,x2:0.65,y2:0.74,angle:0,coneWidth:0.3,pos:0.5,width:0.3},
    {id:2,visualType:'neon',soundType:'Acid',variation:1,shape:{x:0.5,y:0.7},tone:{x:0.55,y:0.65},space:{x:0.28,y:0.35},volume:0.68,pan:-0.15,note:'A2',syncMode:'free',x:0.5,y:0.50,color:'#ff5500',radius:0.30,x1:0.1,y1:0.35,x2:0.9,y2:0.65,angle:0,coneWidth:0.3,pos:0.5,width:0.2},
    {id:3,visualType:'blob',soundType:'Pulse',variation:2,shape:{x:0.25,y:0.2},tone:{x:0.6,y:0.45},space:{x:0.35,y:0.4},volume:0.72,pan:0.2,note:'A3',syncMode:'sync',x:0.65,y:0.24,color:'#ff8833',radius:0.22,x1:0.5,y1:0.24,x2:0.8,y2:0.24,angle:0,coneWidth:0.3,pos:0.65,width:0.18},
    {id:4,visualType:'beam',soundType:'Noise',variation:3,shape:{x:0.8,y:0.88},tone:{x:0.4,y:0.12},space:{x:0.55,y:0.65},volume:0.35,pan:0,note:'A3',syncMode:'free',x:0.5,y:0.12,color:'#883300',radius:0.25,x1:0.35,y1:0.12,x2:0.65,y2:0.12,angle:0,coneWidth:0.3,pos:0.5,width:0.4},
  ],drumPattern:{kick:[1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],hihat:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],openhh:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],perc:[0,0,1,0,0,1,0,0,0,0,1,0,0,1,0,0]},activeDrumPreset:2}},
  {name:'Acid House',style:'acidhouse',state:{bgColor:'#000000',elements:[
    {id:1,visualType:'blob',soundType:'Sub',variation:0,shape:{x:0.5,y:0.88},tone:{x:0.12,y:0.1},space:{x:0.18,y:0.18},volume:0.90,pan:0,note:'A1',syncMode:'sync',x:0.5,y:0.74,color:'#0a0a44',radius:0.50,x1:0.35,y1:0.74,x2:0.65,y2:0.74,angle:0,coneWidth:0.3,pos:0.5,width:0.3},
    {id:2,visualType:'neon',soundType:'Acid',variation:2,shape:{x:0.45,y:0.68},tone:{x:0.62,y:0.88},space:{x:0.25,y:0.28},volume:0.78,pan:0,note:'A2',syncMode:'free',x:0.5,y:0.48,color:'#ffdd00',radius:0.28,x1:0.08,y1:0.28,x2:0.92,y2:0.68,angle:0,coneWidth:0.3,pos:0.5,width:0.2},
    {id:3,visualType:'blob',soundType:'Drone',variation:2,shape:{x:0.75,y:0.85},tone:{x:0.3,y:0.08},space:{x:0.62,y:0.72},volume:0.45,pan:0.3,note:'E3',syncMode:'free',x:0.68,y:0.28,color:'#aa8800',radius:0.28,x1:0.53,y1:0.28,x2:0.83,y2:0.28,angle:0,coneWidth:0.3,pos:0.68,width:0.2},
  ],drumPattern:{kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1],openhh:[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],perc:[0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0]},activeDrumPreset:0}},
  {name:'Detroit Techno',style:'detroittechno',state:{bgColor:'#000000',elements:[
    {id:1,visualType:'blob',soundType:'Sub',variation:1,shape:{x:0.4,y:0.92},tone:{x:0.1,y:0.05},space:{x:0.15,y:0.18},volume:0.92,pan:0,note:'A1',syncMode:'sync',x:0.5,y:0.76,color:'#050510',radius:0.48,x1:0.35,y1:0.76,x2:0.65,y2:0.76,angle:0,coneWidth:0.3,pos:0.5,width:0.3},
    {id:2,visualType:'neon',soundType:'Acid',variation:0,shape:{x:0.55,y:0.72},tone:{x:0.48,y:0.55},space:{x:0.32,y:0.38},volume:0.65,pan:-0.2,note:'A2',syncMode:'free',x:0.5,y:0.52,color:'#225588',radius:0.26,x1:0.08,y1:0.32,x2:0.92,y2:0.72,angle:0,coneWidth:0.3,pos:0.5,width:0.2},
    {id:3,visualType:'fold',soundType:'Drone',variation:2,shape:{x:0.72,y:0.82},tone:{x:0.28,y:0.22},space:{x:0.48,y:0.42},volume:0.50,pan:0.25,note:'A3',syncMode:'free',x:0.5,y:0.38,color:'#334455',radius:0.30,x1:0.15,y1:0.22,x2:0.85,y2:0.54,angle:0,coneWidth:0.3,pos:0.5,width:0.25},
    {id:4,visualType:'blob',soundType:'Ring',variation:1,shape:{x:0.18,y:0.5},tone:{x:0.35,y:0.28},space:{x:0.38,y:0.32},volume:0.45,pan:0.35,note:'E4',syncMode:'sync',x:0.72,y:0.24,color:'#4477aa',radius:0.16,x1:0.57,y1:0.24,x2:0.87,y2:0.24,angle:0,coneWidth:0.3,pos:0.72,width:0.15},
  ],drumPattern:{kick:[1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],hihat:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],openhh:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],perc:[0,0,1,0,0,1,0,0,0,0,1,0,0,1,0,0]},activeDrumPreset:2}},
  {name:'Minimal Techno',style:'minimaltechno',state:{bgColor:'#000000',elements:[
    {id:1,visualType:'blob',soundType:'Sub',variation:1,shape:{x:0.35,y:0.95},tone:{x:0.1,y:0.05},space:{x:0.15,y:0.18},volume:0.92,pan:0,note:'A1',syncMode:'sync',x:0.5,y:0.78,color:'#050518',radius:0.50,x1:0.35,y1:0.78,x2:0.65,y2:0.78,angle:0,coneWidth:0.3,pos:0.5,width:0.3},
    {id:2,visualType:'fold',soundType:'Drone',variation:2,shape:{x:0.75,y:0.82},tone:{x:0.28,y:0.22},space:{x:0.48,y:0.42},volume:0.52,pan:0,note:'A3',syncMode:'free',x:0.5,y:0.50,color:'#334455',radius:0.30,x1:0.15,y1:0.25,x2:0.85,y2:0.75,angle:0,coneWidth:0.3,pos:0.5,width:0.25},
    {id:3,visualType:'blob',soundType:'Ring',variation:0,shape:{x:0.15,y:0.5},tone:{x:0.22,y:0.25},space:{x:0.38,y:0.35},volume:0.45,pan:0.3,note:'E4',syncMode:'sync',x:0.72,y:0.32,color:'#aaccdd',radius:0.16,x1:0.57,y1:0.32,x2:0.87,y2:0.32,angle:0,coneWidth:0.3,pos:0.72,width:0.15},
  ],drumPattern:{kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0],clap:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],hihat:[1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1],openhh:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],perc:[0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0]},activeDrumPreset:5}},
  {name:'Dub Techno',style:'dubtechno',state:{bgColor:'#000000',elements:[
    {id:1,visualType:'blob',soundType:'Sub',variation:0,shape:{x:0.5,y:0.9},tone:{x:0.12,y:0.06},space:{x:0.18,y:0.2},volume:0.85,pan:0,note:'C2',syncMode:'sync',x:0.5,y:0.76,color:'#0a1a1a',radius:0.50,x1:0.35,y1:0.76,x2:0.65,y2:0.76,angle:0,coneWidth:0.3,pos:0.5,width:0.3},
    {id:2,visualType:'blob',soundType:'Drone',variation:3,shape:{x:0.9,y:0.95},tone:{x:0.2,y:0.04},space:{x:0.82,y:0.75},volume:0.62,pan:-0.3,note:'C3',syncMode:'free',x:0.28,y:0.40,color:'#1a4040',radius:0.45,x1:0.13,y1:0.40,x2:0.43,y2:0.40,angle:0,coneWidth:0.3,pos:0.28,width:0.25},
    {id:3,visualType:'blob',soundType:'Drone',variation:0,shape:{x:0.85,y:0.92},tone:{x:0.18,y:0.05},space:{x:0.75,y:0.82},volume:0.50,pan:0.3,note:'G3',syncMode:'free',x:0.68,y:0.36,color:'#206060',radius:0.35,x1:0.53,y1:0.36,x2:0.83,y2:0.36,angle:0,coneWidth:0.3,pos:0.68,width:0.2},
    {id:4,visualType:'beam',soundType:'Noise',variation:0,shape:{x:0.82,y:0.9},tone:{x:0.3,y:0.08},space:{x:0.72,y:0.88},volume:0.38,pan:0,note:'C3',syncMode:'free',x:0.5,y:0.15,color:'#408080',radius:0.28,x1:0.35,y1:0.15,x2:0.65,y2:0.15,angle:0,coneWidth:0.3,pos:0.5,width:0.4},
  ],drumPattern:{kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],hihat:[1,0,0,1,0,1,0,0,1,0,0,1,0,1,0,1],openhh:[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],perc:[0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0]},activeDrumPreset:3}},
  {name:'UK Garage',style:'ukgarage',state:{bgColor:'#000000',elements:[
    {id:1,visualType:'blob',soundType:'Sub',variation:0,shape:{x:0.5,y:0.85},tone:{x:0.18,y:0.1},space:{x:0.22,y:0.2},volume:0.85,pan:0,note:'F1',syncMode:'sync',x:0.5,y:0.72,color:'#1a0866',radius:0.46,x1:0.35,y1:0.72,x2:0.65,y2:0.72,angle:0,coneWidth:0.3,pos:0.5,width:0.28},
    {id:2,visualType:'blob',soundType:'Pulse',variation:1,shape:{x:0.18,y:0.15},tone:{x:0.48,y:0.52},space:{x:0.45,y:0.48},volume:0.72,pan:-0.35,note:'F3',syncMode:'sync',x:0.28,y:0.28,color:'#ff9900',radius:0.26,x1:0.13,y1:0.28,x2:0.43,y2:0.28,angle:0,coneWidth:0.3,pos:0.28,width:0.2},
    {id:3,visualType:'blob',soundType:'Pulse',variation:0,shape:{x:0.2,y:0.12},tone:{x:0.55,y:0.42},space:{x:0.38,y:0.45},volume:0.65,pan:0.38,note:'C4',syncMode:'sync',x:0.72,y:0.25,color:'#ffbb44',radius:0.22,x1:0.57,y1:0.25,x2:0.87,y2:0.25,angle:0,coneWidth:0.3,pos:0.72,width:0.18},
    {id:4,visualType:'blob',soundType:'Drone',variation:2,shape:{x:0.72,y:0.82},tone:{x:0.35,y:0.18},space:{x:0.52,y:0.55},volume:0.50,pan:0,note:'F3',syncMode:'free',x:0.5,y:0.50,color:'#884400',radius:0.32,x1:0.35,y1:0.50,x2:0.65,y2:0.50,angle:0,coneWidth:0.3,pos:0.5,width:0.22},
  ],drumPattern:{kick:[1,0,0,0,0,0,1,0,1,0,0,0,0,1,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],hihat:[1,1,0,1,1,0,1,1,1,1,0,1,1,0,1,1],openhh:[0,0,1,0,0,1,0,0,0,0,1,0,0,1,0,0],perc:[0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0]},activeDrumPreset:1}},
  {name:'Drum & Bass',style:'dnb',state:{bgColor:'#000000',elements:[
    {id:1,visualType:'blob',soundType:'Sub',variation:3,shape:{x:0.8,y:0.7},tone:{x:0.18,y:0.12},space:{x:0.15,y:0.2},volume:0.92,pan:0,note:'D1',syncMode:'sync',x:0.5,y:0.76,color:'#110022',radius:0.52,x1:0.35,y1:0.76,x2:0.65,y2:0.76,angle:0,coneWidth:0.3,pos:0.5,width:0.3},
    {id:2,visualType:'neon',soundType:'Acid',variation:3,shape:{x:0.6,y:0.65},tone:{x:0.55,y:0.72},space:{x:0.3,y:0.35},volume:0.70,pan:-0.2,note:'D2',syncMode:'free',x:0.5,y:0.50,color:'#6600cc',radius:0.28,x1:0.08,y1:0.30,x2:0.92,y2:0.70,angle:0,coneWidth:0.3,pos:0.5,width:0.2},
    {id:3,visualType:'beam',soundType:'Noise',variation:2,shape:{x:0.55,y:0.7},tone:{x:0.65,y:0.35},space:{x:0.45,y:0.5},volume:0.45,pan:0,note:'D3',syncMode:'free',x:0.5,y:0.18,color:'#440088',radius:0.28,x1:0.35,y1:0.18,x2:0.65,y2:0.18,angle:0,coneWidth:0.3,pos:0.5,width:0.4},
    {id:4,visualType:'blob',soundType:'Ring',variation:2,shape:{x:0.15,y:0.45},tone:{x:0.45,y:0.35},space:{x:0.35,y:0.3},volume:0.48,pan:0.3,note:'A3',syncMode:'sync',x:0.72,y:0.30,color:'#9944ff',radius:0.18,x1:0.57,y1:0.30,x2:0.87,y2:0.30,angle:0,coneWidth:0.3,pos:0.72,width:0.15},
  ],drumPattern:{kick:[1,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],openhh:[0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0],perc:[0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0]},activeDrumPreset:4}},
  {name:'Ambient Techno',style:'ambienttechno',state:{bgColor:'#000000',elements:[
    {id:1,visualType:'blob',soundType:'Drone',variation:3,shape:{x:0.92,y:1.0},tone:{x:0.68,y:0.0},space:{x:0.82,y:0.92},volume:0.58,pan:-0.3,note:'C3',syncMode:'free',x:0.28,y:0.38,color:'#1030aa',radius:0.48,x1:0.13,y1:0.38,x2:0.43,y2:0.38,angle:0,coneWidth:0.3,pos:0.28,width:0.25},
    {id:2,visualType:'blob',soundType:'Drone',variation:0,shape:{x:0.88,y:0.95},tone:{x:0.22,y:0.04},space:{x:0.75,y:0.85},volume:0.50,pan:0.28,note:'G3',syncMode:'free',x:0.68,y:0.42,color:'#0050cc',radius:0.38,x1:0.53,y1:0.42,x2:0.83,y2:0.42,angle:0,coneWidth:0.3,pos:0.68,width:0.22},
    {id:3,visualType:'beam',soundType:'Noise',variation:0,shape:{x:0.82,y:0.92},tone:{x:0.32,y:0.08},space:{x:0.72,y:0.88},volume:0.32,pan:0,note:'C3',syncMode:'free',x:0.5,y:0.55,color:'#80a0e0',radius:0.30,x1:0.35,y1:0.55,x2:0.65,y2:0.55,angle:0,coneWidth:0.3,pos:0.5,width:0.4},
    {id:4,visualType:'blob',soundType:'Ring',variation:3,shape:{x:0.1,y:0.82},tone:{x:0.48,y:0.32},space:{x:0.58,y:0.48},volume:0.40,pan:-0.4,note:'E4',syncMode:'sync',x:0.22,y:0.62,color:'#4080ff',radius:0.18,x1:0.07,y1:0.62,x2:0.37,y2:0.62,angle:0,coneWidth:0.3,pos:0.22,width:0.15},
  ],drumPattern:{kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],hihat:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],openhh:[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],perc:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},activeDrumPreset:3}},
  {name:'Trance',style:'trance',state:{bgColor:'#000000',elements:[
    {id:1,visualType:'blob',soundType:'Sub',variation:0,shape:{x:0.5,y:0.88},tone:{x:0.15,y:0.08},space:{x:0.2,y:0.22},volume:0.88,pan:0,note:'A1',syncMode:'sync',x:0.5,y:0.78,color:'#000066',radius:0.50,x1:0.35,y1:0.78,x2:0.65,y2:0.78,angle:0,coneWidth:0.3,pos:0.5,width:0.3},
    {id:2,visualType:'blob',soundType:'Drone',variation:1,shape:{x:0.75,y:0.92},tone:{x:0.45,y:0.12},space:{x:0.65,y:0.72},volume:0.65,pan:-0.2,note:'A3',syncMode:'free',x:0.30,y:0.35,color:'#2244cc',radius:0.44,x1:0.15,y1:0.35,x2:0.45,y2:0.35,angle:0,coneWidth:0.3,pos:0.30,width:0.25},
    {id:3,visualType:'blob',soundType:'Pulse',variation:3,shape:{x:0.2,y:0.22},tone:{x:0.62,y:0.42},space:{x:0.45,y:0.48},volume:0.70,pan:0.2,note:'A4',syncMode:'sync',x:0.70,y:0.28,color:'#4488ff',radius:0.24,x1:0.55,y1:0.28,x2:0.85,y2:0.28,angle:0,coneWidth:0.3,pos:0.70,width:0.18},
    {id:4,visualType:'blob',soundType:'Ring',variation:0,shape:{x:0.12,y:0.6},tone:{x:0.55,y:0.25},space:{x:0.55,y:0.45},volume:0.55,pan:0,note:'E5',syncMode:'sync',x:0.5,y:0.18,color:'#88aaff',radius:0.20,x1:0.35,y1:0.18,x2:0.65,y2:0.18,angle:0,coneWidth:0.3,pos:0.5,width:0.18},
  ],drumPattern:{kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],openhh:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],perc:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},activeDrumPreset:2}},
  {name:'Hardcore',style:'hardcore',state:{bgColor:'#000000',elements:[
    {id:1,visualType:'blob',soundType:'Sub',variation:2,shape:{x:0.80,y:0.55},tone:{x:0.65,y:0.30},space:{x:0.08,y:0.12},volume:0.95,pan:0,note:'A1',syncMode:'sync',x:0.5,y:0.80,color:'#220000',radius:0.54,x1:0.35,y1:0.80,x2:0.65,y2:0.80,angle:0,coneWidth:0.3,pos:0.5,width:0.3},
    {id:2,visualType:'neon',soundType:'Acid',variation:2,shape:{x:0.35,y:0.60},tone:{x:0.80,y:0.90},space:{x:0.15,y:0.18},volume:0.82,pan:0,note:'A3',syncMode:'free',x:0.5,y:0.48,color:'#ff2200',radius:0.30,x1:0.05,y1:0.20,x2:0.95,y2:0.76,angle:0,coneWidth:0.3,pos:0.5,width:0.2},
    {id:3,visualType:'blob',soundType:'FMStab',variation:1,shape:{x:0.10,y:0.20},tone:{x:0.75,y:0.80},space:{x:0.12,y:0.15},volume:0.75,pan:0.25,note:'A4',syncMode:'sync',x:0.68,y:0.25,color:'#ff6600',radius:0.22,x1:0.53,y1:0.25,x2:0.83,y2:0.25,angle:0,coneWidth:0.3,pos:0.68,width:0.18},
    {id:4,visualType:'beam',soundType:'Noise',variation:2,shape:{x:0.55,y:0.65},tone:{x:0.85,y:0.15},space:{x:0.08,y:0.10},volume:0.55,pan:-0.2,note:'A3',syncMode:'free',x:0.35,y:0.18,color:'#aa2200',radius:0.20,x1:0.20,y1:0.18,x2:0.50,y2:0.18,angle:0,coneWidth:0.3,pos:0.35,width:0.35},
  ],drumPattern:{kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],openhh:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],perc:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0]},activeDrumPreset:10}},
  {name:'Downtempo',style:'downtempo',state:{bgColor:'#000000',elements:[
    {id:1,visualType:'blob',soundType:'Sub',variation:0,shape:{x:0.6,y:0.85},tone:{x:0.2,y:0.12},space:{x:0.28,y:0.25},volume:0.80,pan:0,note:'D2',syncMode:'sync',x:0.5,y:0.74,color:'#1a1a33',radius:0.46,x1:0.35,y1:0.74,x2:0.65,y2:0.74,angle:0,coneWidth:0.3,pos:0.5,width:0.28},
    {id:2,visualType:'blob',soundType:'Drone',variation:0,shape:{x:0.88,y:0.95},tone:{x:0.38,y:0.08},space:{x:0.68,y:0.72},volume:0.60,pan:-0.25,note:'D3',syncMode:'free',x:0.30,y:0.42,color:'#553388',radius:0.42,x1:0.15,y1:0.42,x2:0.45,y2:0.42,angle:0,coneWidth:0.3,pos:0.30,width:0.25},
    {id:3,visualType:'blob',soundType:'Ring',variation:3,shape:{x:0.15,y:0.78},tone:{x:0.42,y:0.28},space:{x:0.55,y:0.5},volume:0.50,pan:0.3,note:'A3',syncMode:'sync',x:0.68,y:0.32,color:'#8855bb',radius:0.22,x1:0.53,y1:0.32,x2:0.83,y2:0.32,angle:0,coneWidth:0.3,pos:0.68,width:0.18},
    {id:4,visualType:'fold',soundType:'Noise',variation:1,shape:{x:0.78,y:0.88},tone:{x:0.28,y:0.12},space:{x:0.65,y:0.78},volume:0.35,pan:0,note:'D3',syncMode:'free',x:0.5,y:0.55,color:'#442266',radius:0.28,x1:0.15,y1:0.40,x2:0.85,y2:0.70,angle:0,coneWidth:0.3,pos:0.5,width:0.25},
  ],drumPattern:{kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],hihat:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],openhh:[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],perc:[0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0]},activeDrumPreset:11}},
  {name:'Electronica',style:'electronica',state:{bgColor:'#000000',elements:[
    {id:1,visualType:'blob',soundType:'Sub',variation:0,shape:{x:0.50,y:0.90},tone:{x:0.15,y:0.08},space:{x:0.25,y:0.30},volume:0.88,pan:0,note:'A1',syncMode:'sync',x:0.50,y:0.78,color:'#0a0a22',radius:0.48,x1:0.35,y1:0.78,x2:0.65,y2:0.78,angle:0,coneWidth:0.3,pos:0.5,width:0.3},
    {id:2,visualType:'fold',soundType:'Acid',variation:1,shape:{x:0.75,y:0.80},tone:{x:0.30,y:0.20},space:{x:0.35,y:0.50},volume:0.62,pan:0,note:'A2',syncMode:'free',x:0.50,y:0.52,color:'#223344',radius:0.28,x1:0.08,y1:0.32,x2:0.92,y2:0.72,angle:0,coneWidth:0.3,pos:0.5,width:0.2},
    {id:3,visualType:'blob',soundType:'Drone',variation:2,shape:{x:0.82,y:0.88},tone:{x:0.25,y:0.10},space:{x:0.45,y:0.60},volume:0.52,pan:0.2,note:'E3',syncMode:'free',x:0.65,y:0.35,color:'#334466',radius:0.26,x1:0.50,y1:0.35,x2:0.80,y2:0.35,angle:0,coneWidth:0.3,pos:0.65,width:0.2},
    {id:4,visualType:'blob',soundType:'Pad',variation:1,shape:{x:0.85,y:0.95},tone:{x:0.28,y:0.10},space:{x:0.65,y:0.75},volume:0.48,pan:-0.2,note:'A3',syncMode:'free',x:0.35,y:0.30,color:'#445577',radius:0.28,x1:0.20,y1:0.30,x2:0.50,y2:0.30,angle:0,coneWidth:0.3,pos:0.35,width:0.22},
    {id:5,visualType:'neon',soundType:'Arp',variation:3,shape:{x:0.35,y:0.40},tone:{x:0.50,y:0.30},space:{x:0.40,y:0.50},volume:0.55,pan:0.3,note:'A4',syncMode:'sync',x:0.72,y:0.20,color:'#5566aa',radius:0.18,x1:0.57,y1:0.20,x2:0.87,y2:0.20,angle:0,coneWidth:0.3,pos:0.72,width:0.15},
  ],drumPattern:{kick:[1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],clap:[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],hihat:[1,0,1,0,1,0,1,0,0,0,1,0,1,0,0,1],openhh:[0,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],perc:[0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0]},activeDrumPreset:12}},
  {name:'Italo Disco',style:'italo',state:{bgColor:'#000000',elements:[
    {id:1,visualType:'blob',soundType:'Sub',variation:2,shape:{x:0.80,y:0.60},tone:{x:0.25,y:0.18},space:{x:0.20,y:0.25},volume:0.90,pan:0,note:'A1',syncMode:'sync',x:0.50,y:0.76,color:'#220033',radius:0.48,x1:0.35,y1:0.76,x2:0.65,y2:0.76,angle:0,coneWidth:0.3,pos:0.5,width:0.3},
    {id:2,visualType:'neon',soundType:'Acid',variation:0,shape:{x:0.50,y:0.70},tone:{x:0.60,y:0.70},space:{x:0.30,y:0.35},volume:0.75,pan:0,note:'A2',syncMode:'free',x:0.50,y:0.50,color:'#cc0088',radius:0.28,x1:0.05,y1:0.25,x2:0.95,y2:0.75,angle:0,coneWidth:0.3,pos:0.5,width:0.2},
    {id:3,visualType:'blob',soundType:'Pulse',variation:1,shape:{x:0.15,y:0.25},tone:{x:0.65,y:0.35},space:{x:0.30,y:0.40},volume:0.70,pan:0.2,note:'A3',syncMode:'sync',x:0.65,y:0.28,color:'#ff44aa',radius:0.24,x1:0.50,y1:0.28,x2:0.80,y2:0.28,angle:0,coneWidth:0.3,pos:0.65,width:0.18},
    {id:4,visualType:'neon',soundType:'Arp',variation:0,shape:{x:0.20,y:0.35},tone:{x:0.75,y:0.45},space:{x:0.38,y:0.45},volume:0.78,pan:-0.25,note:'A4',syncMode:'sync',x:0.35,y:0.22,color:'#ff88cc',radius:0.20,x1:0.05,y1:0.10,x2:0.65,y2:0.35,angle:0,coneWidth:0.3,pos:0.35,width:0.18},
    {id:5,visualType:'blob',soundType:'FMStab',variation:3,shape:{x:0.20,y:0.35},tone:{x:0.55,y:0.55},space:{x:0.25,y:0.30},volume:0.60,pan:0.35,note:'E3',syncMode:'sync',x:0.72,y:0.38,color:'#dd55bb',radius:0.18,x1:0.57,y1:0.38,x2:0.87,y2:0.38,angle:0,coneWidth:0.3,pos:0.72,width:0.15},
  ],drumPattern:{kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hihat:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],openhh:[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],perc:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0]},activeDrumPreset:13}},
];

const STYLES={
  deephouse:{
    name:'Deep House', bpm:122, bpmRange:[118,125],
    arrangement:[
      {soundType:'Sub',    variation:0, oct:1, deg:0, vol:0.82, pan:0,    vtype:'blob', xPos:0.5, yPos:0.78, radius:0.52, shape:{x:0.85,y:0.9}, tone:{x:0.25,y:0.05}, space:{x:0.3,y:0.5}},
      {soundType:'WTPad',  variation:0, oct:3, deg:0, vol:0.45, pan:-0.3, vtype:'blob', xPos:0.25,yPos:0.38, radius:0.42, shape:{x:0.78,y:0.92}, tone:{x:0.28,y:0.10}, space:{x:0.65,y:0.72}, _required:true},
      {soundType:'Chord',  variation:0, oct:3, deg:0, vol:0.40, pan:0.2,  vtype:'blob', xPos:0.65,yPos:0.42, radius:0.32, shape:{x:0.80,y:0.90}, tone:{x:0.32,y:0.18}, space:{x:0.70,y:0.75}, _required:true},
      {soundType:'Echo',   variation:1, oct:3, deg:4, vol:0.42, pan:-0.35,vtype:'spot', xPos:0.25,yPos:0.22, radius:0.16, shape:{x:0.5,y:0.6},  tone:{x:0.3,y:0.5},  space:{x:0.80,y:0.70}},
      {soundType:'FM3',    variation:0, oct:4, deg:0, vol:0.50, pan:0.2,  vtype:'blob', xPos:0.65,yPos:0.22, radius:0.22, shape:{x:0.35,y:0.55}, tone:{x:0.42,y:0.32}, space:{x:0.45,y:0.5}},
      {soundType:'Arp',    variation:0, oct:4, deg:2, vol:0.38, pan:-0.3, vtype:'blob', xPos:0.3, yPos:0.20, radius:0.14, shape:{x:0.32,y:0.38}, tone:{x:0.5,y:0.22},  space:{x:0.42,y:0.48}},
      {soundType:'Vocal',  variation:1, oct:3, deg:4, vol:0.32, pan:0.28, vtype:'spot', xPos:0.68,yPos:0.35, radius:0.18, shape:{x:0.65,y:0.55}, tone:{x:0.45,y:0.25}, space:{x:0.70,y:0.65}},
    ], drumPreset:0, drumStyle:'house'
  },
  techhouse:{
    name:'Tech House', bpm:128, bpmRange:[126,132],
    arrangement:[
      {soundType:'Sub',   variation:2, oct:1, deg:0, vol:0.92, pan:0,    vtype:'blob', xPos:0.5, yPos:0.74, radius:0.48, shape:{x:0.65,y:0.8},  tone:{x:0.45,y:0.2},  space:{x:0.2,y:0.3}},
      {soundType:'Acid',  variation:1, oct:2, deg:0, vol:0.65, pan:-0.2, vtype:'neon', xPos:0.5, yPos:0.50, radius:0.30, shape:{x:0.4,y:0.6},  tone:{x:0.65,y:0.4},  space:{x:0.3,y:0.35}, _required:true},
      {soundType:'Pulse', variation:2, oct:3, deg:0, vol:0.60, pan:0.25, vtype:'blob', xPos:0.68,yPos:0.22, radius:0.20, shape:{x:0.15,y:0.2},  tone:{x:0.55,y:0.3},  space:{x:0.25,y:0.3}, _required:true},
      {soundType:'Conga', variation:0, oct:3, deg:2, vol:0.52, pan:-0.3, vtype:'blob', xPos:0.28,yPos:0.25, radius:0.14, shape:{x:0.25,y:0.4},  tone:{x:0.55,y:0.4},  space:{x:0.3,y:0.4}},
      {soundType:'Noise', variation:3, oct:3, deg:0, vol:0.28, pan:0,    vtype:'beam', xPos:0.5, yPos:0.10, radius:0.22, shape:{x:0.5,y:0.5},  tone:{x:0.7,y:0.1},   space:{x:0.15,y:0.2}},
      {soundType:'FMStab',variation:1, oct:3, deg:0, vol:0.48, pan:0.35, vtype:'blob', xPos:0.72,yPos:0.32, radius:0.16, shape:{x:0.12,y:0.22}, tone:{x:0.60,y:0.55}, space:{x:0.20,y:0.28}},
      {soundType:'Ring',  variation:1, oct:4, deg:4, vol:0.30, pan:-0.38,vtype:'blob', xPos:0.25,yPos:0.32, radius:0.12, shape:{x:0.1,y:0.15},  tone:{x:0.5,y:0.3},   space:{x:0.20,y:0.25}},
    ], drumPreset:1, drumStyle:'house'
  },
  acidhouse:{
    name:'Acid House', bpm:130, bpmRange:[128,133],
    arrangement:[
      {soundType:'Sub',   variation:0, oct:1, deg:0, vol:0.92, pan:0,    vtype:'blob', xPos:0.5, yPos:0.76, radius:0.50, shape:{x:0.8,y:0.88}, tone:{x:0.2,y:0.08}, space:{x:0.25,y:0.4}},
      {soundType:'Acid',  variation:2, oct:2, deg:0, vol:0.82, pan:0,    vtype:'neon', xPos:0.5, yPos:0.48, radius:0.30, shape:{x:0.35,y:0.55}, tone:{x:0.62,y:0.55}, space:{x:0.3,y:0.3}, _required:true},
      {soundType:'WTPad', variation:3, oct:3, deg:4, vol:0.35, pan:0.35, vtype:'blob', xPos:0.72,yPos:0.28, radius:0.24, shape:{x:0.82,y:0.92}, tone:{x:0.35,y:0.10}, space:{x:0.55,y:0.65}},
      {soundType:'Acid',  variation:0, oct:2, deg:4, vol:0.55, pan:0.3,  vtype:'neon', xPos:0.72,yPos:0.52, radius:0.20, shape:{x:0.3,y:0.5},  tone:{x:0.55,y:0.45}, space:{x:0.28,y:0.32}},
      {soundType:'Conga', variation:0, oct:3, deg:2, vol:0.45, pan:-0.3, vtype:'blob', xPos:0.28,yPos:0.22, radius:0.12, shape:{x:0.2,y:0.35}, tone:{x:0.5,y:0.4},  space:{x:0.28,y:0.35}},
      {soundType:'SFX',   variation:0, oct:3, deg:0, vol:0.35, pan:0.4,  vtype:'spot', xPos:0.72,yPos:0.18, radius:0.12, shape:{x:0.5,y:0.5},  tone:{x:0.5,y:0.5},  space:{x:0.4,y:0.5}},
    ], drumPreset:2, drumStyle:'house'
  },
  detroittechno:{
    name:'Detroit Techno', bpm:132, bpmRange:[130,138],
    arrangement:[
      {soundType:'Sub',    variation:1, oct:1, deg:0, vol:0.94, pan:0,    vtype:'blob', xPos:0.5, yPos:0.78, radius:0.50, shape:{x:0.7,y:0.85},  tone:{x:0.3,y:0.1},  space:{x:0.15,y:0.25}},
      {soundType:'Acid',   variation:0, oct:2, deg:0, vol:0.65, pan:-0.25,vtype:'neon', xPos:0.5, yPos:0.52, radius:0.26, shape:{x:0.45,y:0.65},  tone:{x:0.55,y:0.35}, space:{x:0.2,y:0.3}},
      {soundType:'FMStab', variation:0, oct:3, deg:0, vol:0.62, pan:0.38, vtype:'blob', xPos:0.75,yPos:0.25, radius:0.20, shape:{x:0.12,y:0.28},  tone:{x:0.55,y:0.65}, space:{x:0.22,y:0.28}, _required:true},
      {soundType:'FMStab', variation:1, oct:4, deg:4, vol:0.52, pan:-0.4, vtype:'blob', xPos:0.22,yPos:0.22, radius:0.16, shape:{x:0.1,y:0.22},   tone:{x:0.65,y:0.72}, space:{x:0.18,y:0.22}},
      {soundType:'Shimmer',variation:0, oct:5, deg:0, vol:0.22, pan:0,    vtype:'blob', xPos:0.5, yPos:0.18, radius:0.13, shape:{x:0.80,y:0.92}, tone:{x:0.35,y:0.08}, space:{x:0.70,y:0.82}},
      {soundType:'Noise',  variation:0, oct:3, deg:0, vol:0.25, pan:0,    vtype:'beam', xPos:0.5, yPos:0.10, radius:0.20, shape:{x:0.5,y:0.5},   tone:{x:0.75,y:0.05}, space:{x:0.1,y:0.15}},
      {soundType:'Phys',   variation:1, oct:3, deg:2, vol:0.38, pan:0.3,  vtype:'blob', xPos:0.72,yPos:0.40, radius:0.16, shape:{x:0.25,y:0.55}, tone:{x:0.55,y:0.40}, space:{x:0.30,y:0.38}},
    ], drumPreset:3, drumStyle:'techno'
  },
  minimaltechno:{
    name:'Minimal Techno', bpm:133, bpmRange:[128,135],
    arrangement:[
      {soundType:'Sub',   variation:1, oct:1, deg:0, vol:0.94, pan:0,    vtype:'blob', xPos:0.5, yPos:0.80, radius:0.52, shape:{x:0.88,y:0.92}, tone:{x:0.2,y:0.05}, space:{x:0.1,y:0.2}, _required:true},
      {soundType:'WTPad', variation:0, oct:3, deg:0, vol:0.32, pan:0,    vtype:'blob', xPos:0.5, yPos:0.50, radius:0.28, shape:{x:0.92,y:0.95}, tone:{x:0.20,y:0.06}, space:{x:0.60,y:0.70}, _required:true},
      {soundType:'Ring',  variation:0, oct:4, deg:2, vol:0.32, pan:0.35, vtype:'blob', xPos:0.75,yPos:0.30, radius:0.12, shape:{x:0.1,y:0.15},  tone:{x:0.5,y:0.3},   space:{x:0.15,y:0.2}},
      {soundType:'Acid',  variation:3, oct:2, deg:0, vol:0.45, pan:-0.3, vtype:'neon', xPos:0.28,yPos:0.55, radius:0.20, shape:{x:0.5,y:0.65},  tone:{x:0.45,y:0.3},  space:{x:0.25,y:0.3}},
      {soundType:'Noise', variation:0, oct:3, deg:0, vol:0.20, pan:0,    vtype:'beam', xPos:0.5, yPos:0.12, radius:0.18, shape:{x:0.5,y:0.5},   tone:{x:0.7,y:0.05},  space:{x:0.1,y:0.15}},
      {soundType:'Conga', variation:0, oct:3, deg:4, vol:0.38, pan:0.3,  vtype:'blob', xPos:0.72,yPos:0.22, radius:0.11, shape:{x:0.2,y:0.35},  tone:{x:0.5,y:0.4},   space:{x:0.25,y:0.32}},
    ], drumPreset:4, drumStyle:'techno'
  },
  dubtechno:{
    name:'Dub Techno', bpm:128, bpmRange:[124,130],
    arrangement:[
      {soundType:'Sub',   variation:0, oct:1, deg:0, vol:0.85, pan:0,    vtype:'blob', xPos:0.5, yPos:0.78, radius:0.52, shape:{x:0.95,y:0.95}, tone:{x:0.18,y:0.05}, space:{x:0.55,y:0.7}},
      {soundType:'WTPad', variation:0, oct:3, deg:0, vol:0.48, pan:-0.35,vtype:'blob', xPos:0.25,yPos:0.40, radius:0.48, shape:{x:0.92,y:0.95}, tone:{x:0.20,y:0.08}, space:{x:0.68,y:0.78}, _required:true},
      {soundType:'Chord', variation:1, oct:3, deg:0, vol:0.42, pan:0.3,  vtype:'blob', xPos:0.68,yPos:0.44, radius:0.36, shape:{x:0.88,y:0.92}, tone:{x:0.25,y:0.12}, space:{x:0.72,y:0.80}},
      {soundType:'Echo',  variation:2, oct:3, deg:4, vol:0.45, pan:-0.4, vtype:'spot', xPos:0.22,yPos:0.28, radius:0.14, shape:{x:0.4,y:0.7},  tone:{x:0.25,y:0.4},  space:{x:0.85,y:0.80}, _required:true},
      {soundType:'WTPad', variation:3, oct:3, deg:4, vol:0.38, pan:0.35, vtype:'blob', xPos:0.72,yPos:0.36, radius:0.38, shape:{x:0.88,y:0.92}, tone:{x:0.18,y:0.06}, space:{x:0.65,y:0.75}},
      {soundType:'Shimmer',variation:0, oct:5, deg:4, vol:0.25, pan:0,    vtype:'blob', xPos:0.5, yPos:0.18, radius:0.13, shape:{x:0.85,y:0.95}, tone:{x:0.22,y:0.06}, space:{x:0.78,y:0.88}},
      {soundType:'Noise', variation:0, oct:3, deg:0, vol:0.28, pan:0,    vtype:'beam', xPos:0.5, yPos:0.15, radius:0.26, shape:{x:0.8,y:0.85},  tone:{x:0.3,y:0.05},  space:{x:0.7,y:0.8}},
      {soundType:'Phys',  variation:2, oct:4, deg:7, vol:0.30, pan:0.28, vtype:'blob', xPos:0.72,yPos:0.22, radius:0.14, shape:{x:0.60,y:0.78}, tone:{x:0.18,y:0.12}, space:{x:0.72,y:0.80}},
    ], drumPreset:5, drumStyle:'dub'
  },
  ukgarage:{
    name:'UK Garage', bpm:130, bpmRange:[128,133],
    arrangement:[
      {soundType:'Sub',   variation:0, oct:1, deg:0, vol:0.88, pan:0,    vtype:'blob', xPos:0.5, yPos:0.74, radius:0.48, shape:{x:0.72,y:0.82}, tone:{x:0.35,y:0.1},  space:{x:0.3,y:0.4}},
      {soundType:'Pulse', variation:0, oct:3, deg:0, vol:0.62, pan:-0.38,vtype:'blob', xPos:0.25,yPos:0.26, radius:0.22, shape:{x:0.18,y:0.22}, tone:{x:0.5,y:0.28},  space:{x:0.35,y:0.4}, _required:true},
      {soundType:'Arp',   variation:2, oct:4, deg:0, vol:0.58, pan:0.3,  vtype:'blob', xPos:0.72,yPos:0.22, radius:0.18, shape:{x:0.22,y:0.3},  tone:{x:0.62,y:0.32}, space:{x:0.38,y:0.42}, _required:true},
      {soundType:'FM3',   variation:0, oct:4, deg:2, vol:0.38, pan:0,    vtype:'blob', xPos:0.5, yPos:0.50, radius:0.22, shape:{x:0.35,y:0.55}, tone:{x:0.42,y:0.32}, space:{x:0.45,y:0.50}},
      {soundType:'Vocal', variation:0, oct:3, deg:0, vol:0.40, pan:0.2,  vtype:'spot', xPos:0.65,yPos:0.35, radius:0.20, shape:{x:0.60,y:0.55}, tone:{x:0.48,y:0.28}, space:{x:0.65,y:0.58}},
      {soundType:'Pluck', variation:2, oct:4, deg:4, vol:0.42, pan:-0.28,vtype:'blob', xPos:0.28,yPos:0.35, radius:0.14, shape:{x:0.3,y:0.45},  tone:{x:0.65,y:0.30}, space:{x:0.42,y:0.48}},
    ], drumPreset:6, drumStyle:'garage'
  },
  dnb:{
    name:'Drum & Bass', bpm:172, bpmRange:[168,178],
    arrangement:[
      {soundType:'Sub',   variation:1, oct:1, deg:0, vol:0.92, pan:0,    vtype:'blob', xPos:0.5, yPos:0.76, radius:0.48, shape:{x:0.55,y:0.72}, tone:{x:0.42,y:0.15}, space:{x:0.2,y:0.28}, _required:true},
      {soundType:'Acid',  variation:3, oct:2, deg:0, vol:0.68, pan:-0.2, vtype:'neon', xPos:0.5, yPos:0.50, radius:0.26, shape:{x:0.38,y:0.58}, tone:{x:0.60,y:0.42}, space:{x:0.25,y:0.3}},
      {soundType:'Arp',   variation:1, oct:4, deg:0, vol:0.62, pan:0.28, vtype:'neon', xPos:0.68,yPos:0.22, radius:0.18, shape:{x:0.22,y:0.35}, tone:{x:0.68,y:0.35}, space:{x:0.38,y:0.45}, _required:true},
      {soundType:'FM3',   variation:2, oct:4, deg:4, vol:0.42, pan:-0.35,vtype:'blob', xPos:0.28,yPos:0.28, radius:0.16, shape:{x:0.28,y:0.48}, tone:{x:0.58,y:0.45}, space:{x:0.35,y:0.42}},
      {soundType:'Noise', variation:3, oct:3, deg:0, vol:0.35, pan:0,    vtype:'beam', xPos:0.5, yPos:0.10, radius:0.20, shape:{x:0.5,y:0.5},   tone:{x:0.8,y:0.08},  space:{x:0.12,y:0.18}},
      {soundType:'Ring',  variation:2, oct:5, deg:2, vol:0.28, pan:0.38, vtype:'blob', xPos:0.72,yPos:0.28, radius:0.11, shape:{x:0.1,y:0.15},  tone:{x:0.55,y:0.35}, space:{x:0.20,y:0.25}},
      {soundType:'SFX',   variation:3, oct:3, deg:0, vol:0.30, pan:-0.4, vtype:'spot', xPos:0.25,yPos:0.18, radius:0.11, shape:{x:0.8,y:0.3},   tone:{x:0.7,y:0.3},   space:{x:0.2,y:0.2}},
    ], drumPreset:7, drumStyle:'dnb'
  },
  ambienttechno:{
    name:'Ambient Techno', bpm:115, bpmRange:[110,120],
    arrangement:[
      {soundType:'Sub',   variation:0, oct:1, deg:0, vol:0.62, pan:0,    vtype:'blob', xPos:0.5, yPos:0.80, radius:0.50, shape:{x:0.98,y:0.98}, tone:{x:0.10,y:0.04}, space:{x:0.78,y:0.88}},
      {soundType:'WTPad', variation:0, oct:3, deg:0, vol:0.45, pan:-0.35,vtype:'blob', xPos:0.25,yPos:0.40, radius:0.50, shape:{x:0.88,y:0.95}, tone:{x:0.22,y:0.08}, space:{x:0.72,y:0.82}, _required:true},
      {soundType:'Chord', variation:1, oct:3, deg:0, vol:0.38, pan:0.3,  vtype:'blob', xPos:0.68,yPos:0.44, radius:0.36, shape:{x:0.90,y:0.94}, tone:{x:0.20,y:0.10}, space:{x:0.78,y:0.85}, _required:true},
      {soundType:'Echo',  variation:2, oct:4, deg:7, vol:0.35, pan:-0.4, vtype:'spot', xPos:0.22,yPos:0.26, radius:0.13, shape:{x:0.4,y:0.7},  tone:{x:0.35,y:0.3},  space:{x:0.88,y:0.82}},
      {soundType:'WTPad', variation:1, oct:3, deg:4, vol:0.38, pan:0.35, vtype:'blob', xPos:0.72,yPos:0.44, radius:0.38, shape:{x:0.85,y:0.92}, tone:{x:0.18,y:0.06}, space:{x:0.68,y:0.78}},
      {soundType:'Phys',  variation:2, oct:4, deg:7, vol:0.32, pan:-0.2, vtype:'blob', xPos:0.32,yPos:0.22, radius:0.16, shape:{x:0.60,y:0.80}, tone:{x:0.18,y:0.12}, space:{x:0.72,y:0.82}},
      {soundType:'Shimmer',variation:0, oct:5, deg:7, vol:0.28, pan:0,    vtype:'blob', xPos:0.5, yPos:0.18, radius:0.14, shape:{x:0.82,y:0.92}, tone:{x:0.28,y:0.08}, space:{x:0.80,y:0.90}},
      {soundType:'Ring',  variation:3, oct:5, deg:2, vol:0.25, pan:-0.4, vtype:'blob', xPos:0.2, yPos:0.62, radius:0.14, shape:{x:0.05,y:0.1},  tone:{x:0.45,y:0.25}, space:{x:0.55,y:0.65}},
      {soundType:'Drone', variation:1, oct:2, deg:0, vol:0.38, pan:0.2,  vtype:'blob', xPos:0.65,yPos:0.62, radius:0.30, shape:{x:0.95,y:0.95}, tone:{x:0.15,y:0.05}, space:{x:0.85,y:0.90}, _required:true},
    ], drumPreset:8, drumStyle:'ambient'
  },
  trance:{
    name:'Trance', bpm:140, bpmRange:[136,145],
    arrangement:[
      {soundType:'Sub',    variation:0, oct:1, deg:0, vol:0.90, pan:0,    vtype:'blob', xPos:0.5, yPos:0.80, radius:0.52, shape:{x:0.82,y:0.88}, tone:{x:0.22,y:0.06}, space:{x:0.3,y:0.45}},
      {soundType:'WTPad',  variation:1, oct:3, deg:0, vol:0.55, pan:-0.25,vtype:'blob', xPos:0.28,yPos:0.36, radius:0.46, shape:{x:0.88,y:0.92}, tone:{x:0.38,y:0.15}, space:{x:0.65,y:0.72}, _required:true},
      {soundType:'Arp',    variation:0, oct:4, deg:0, vol:0.65, pan:0.2,  vtype:'blob', xPos:0.72,yPos:0.20, radius:0.22, shape:{x:0.15,y:0.25}, tone:{x:0.72,y:0.22}, space:{x:0.42,y:0.48}, _required:true},
      {soundType:'FMStab', variation:2, oct:3, deg:0, vol:0.60, pan:-0.3, vtype:'blob', xPos:0.28,yPos:0.20, radius:0.18, shape:{x:0.1,y:0.2},   tone:{x:0.48,y:0.5},  space:{x:0.32,y:0.38}},
      {soundType:'Pluck',  variation:0, oct:5, deg:4, vol:0.48, pan:0.35, vtype:'blob', xPos:0.72,yPos:0.28, radius:0.13, shape:{x:0.2,y:0.4},   tone:{x:0.72,y:0.20}, space:{x:0.38,y:0.45}},
      {soundType:'Chord',  variation:2, oct:3, deg:4, vol:0.42, pan:0.28, vtype:'blob', xPos:0.68,yPos:0.48, radius:0.26, shape:{x:0.75,y:0.85}, tone:{x:0.45,y:0.22}, space:{x:0.62,y:0.68}},
      {soundType:'SFX',    variation:4, oct:3, deg:0, vol:0.28, pan:0,    vtype:'spot', xPos:0.5, yPos:0.12, radius:0.12, shape:{x:0.3,y:0.8},   tone:{x:0.4,y:0.6},   space:{x:0.6,y:0.7}},
    ], drumPreset:9, drumStyle:'trance'
  },
  hardcore:{
    name:'Hardcore', bpm:148, bpmRange:[144,155],
    arrangement:[
      {soundType:'Sub',    variation:2, oct:1, deg:0, vol:0.92, pan:0,    vtype:'blob', xPos:0.5,  yPos:0.80, radius:0.52, shape:{x:0.75,y:0.60}, tone:{x:0.62,y:0.28}, space:{x:0.08,y:0.12}},
      {soundType:'Acid',   variation:0, oct:2, deg:0, vol:0.80, pan:0,    vtype:'neon', xPos:0.5,  yPos:0.48, radius:0.28, shape:{x:0.20,y:0.50}, tone:{x:0.78,y:0.85}, space:{x:0.12,y:0.15}, _required:true},
      {soundType:'Noise',  variation:3, oct:3, deg:0, vol:0.45, pan:-0.3, vtype:'beam', xPos:0.28, yPos:0.22, radius:0.18, shape:{x:0.40,y:0.55}, tone:{x:0.75,y:0.08}, space:{x:0.10,y:0.14}},
      {soundType:'Phys',   variation:3, oct:2, deg:0, vol:0.48, pan:0.35, vtype:'blob', xPos:0.72, yPos:0.35, radius:0.20, shape:{x:0.30,y:0.60}, tone:{x:0.68,y:0.38}, space:{x:0.14,y:0.18}},
      {soundType:'FMStab', variation:3, oct:3, deg:0, vol:0.62, pan:-0.35,vtype:'blob', xPos:0.28, yPos:0.28, radius:0.18, shape:{x:0.08,y:0.18}, tone:{x:0.72,y:0.68}, space:{x:0.15,y:0.20}},
      {soundType:'SFX',    variation:3, oct:3, deg:0, vol:0.38, pan:0.4,  vtype:'spot', xPos:0.72, yPos:0.18, radius:0.12, shape:{x:0.9,y:0.2},   tone:{x:0.7,y:0.3},   space:{x:0.2,y:0.2}},
    ], drumPreset:10, drumStyle:'hardtechno'
  },
  downtempo:{
    name:'Downtempo', bpm:88, bpmRange:[80,95],
    arrangement:[
      {soundType:'Sub',   variation:0, oct:2, deg:0, vol:0.82, pan:0,    vtype:'blob', xPos:0.5, yPos:0.76, radius:0.48, shape:{x:0.88,y:0.92}, tone:{x:0.22,y:0.08}, space:{x:0.4,y:0.55}},
      {soundType:'WTPad', variation:1, oct:3, deg:0, vol:0.50, pan:-0.28,vtype:'blob', xPos:0.28,yPos:0.44, radius:0.44, shape:{x:0.88,y:0.92}, tone:{x:0.28,y:0.10}, space:{x:0.62,y:0.72}, _required:true},
      {soundType:'Chord', variation:2, oct:3, deg:0, vol:0.45, pan:0.25, vtype:'blob', xPos:0.68,yPos:0.40, radius:0.34, shape:{x:0.82,y:0.90}, tone:{x:0.28,y:0.14}, space:{x:0.72,y:0.78}, _required:true},
      {soundType:'Echo',  variation:0, oct:3, deg:4, vol:0.42, pan:-0.4, vtype:'spot', xPos:0.22,yPos:0.26, radius:0.15, shape:{x:0.3,y:0.5},  tone:{x:0.5,y:0.4},  space:{x:0.78,y:0.72}},
      {soundType:'Conga', variation:2, oct:3, deg:2, vol:0.48, pan:0.3,  vtype:'blob', xPos:0.70,yPos:0.24, radius:0.13, shape:{x:0.3,y:0.45}, tone:{x:0.45,y:0.6},  space:{x:0.35,y:0.45}},
      {soundType:'Phys',  variation:0, oct:3, deg:4, vol:0.40, pan:0.28, vtype:'blob', xPos:0.72,yPos:0.38, radius:0.28, shape:{x:0.72,y:0.88}, tone:{x:0.30,y:0.22}, space:{x:0.55,y:0.65}},
      {soundType:'FM3',   variation:3, oct:4, deg:0, vol:0.45, pan:0.3,  vtype:'blob', xPos:0.72,yPos:0.28, radius:0.20, shape:{x:0.40,y:0.60}, tone:{x:0.35,y:0.28}, space:{x:0.50,y:0.58}},
      {soundType:'Arp',   variation:1, oct:4, deg:2, vol:0.42, pan:-0.25,vtype:'blob', xPos:0.3, yPos:0.20, radius:0.16, shape:{x:0.6,y:0.52},  tone:{x:0.4,y:0.28},  space:{x:0.48,y:0.52}},
      {soundType:'Vocal', variation:2, oct:3, deg:4, vol:0.38, pan:0.2,  vtype:'spot', xPos:0.65,yPos:0.32, radius:0.18, shape:{x:0.65,y:0.52}, tone:{x:0.42,y:0.22}, space:{x:0.68,y:0.62}},
    ], drumPreset:11, drumStyle:'hiphop'
  },
  electronica:{
    name:'Electronica', bpm:115, bpmRange:[110,122],
    arrangement:[
      {soundType:'Sub',   variation:0, oct:1, deg:0, vol:0.85, pan:0,    vtype:'blob', xPos:0.50,yPos:0.80, radius:0.48, shape:{x:0.85,y:0.90}, tone:{x:0.18,y:0.08}, space:{x:0.30,y:0.35}},
      {soundType:'WTPad', variation:2, oct:3, deg:0, vol:0.58, pan:-0.2,  vtype:'blob', xPos:0.30,yPos:0.45, radius:0.38, shape:{x:0.88,y:0.92}, tone:{x:0.25,y:0.08}, space:{x:0.70,y:0.80}},
      {soundType:'Arp',   variation:3, oct:4, deg:0, vol:0.72, pan:-0.28,vtype:'neon', xPos:0.30,yPos:0.22, radius:0.18, shape:{x:0.30,y:0.38}, tone:{x:0.55,y:0.32}, space:{x:0.45,y:0.52}, _required:true},
      {soundType:'Drone', variation:0, oct:2, deg:0, vol:0.42, pan:0.15, vtype:'blob', xPos:0.55,yPos:0.58, radius:0.35, shape:{x:0.95,y:0.95}, tone:{x:0.18,y:0.05}, space:{x:0.85,y:0.90}, _required:true},
      {soundType:'Chord', variation:3, oct:3, deg:0, vol:0.48, pan:0.22, vtype:'blob', xPos:0.68,yPos:0.42, radius:0.30, shape:{x:0.72,y:0.85}, tone:{x:0.42,y:0.28}, space:{x:0.65,y:0.72}},
      {soundType:'Echo',  variation:2, oct:4, deg:2, vol:0.45, pan:-0.38,vtype:'spot', xPos:0.25,yPos:0.24, radius:0.14, shape:{x:0.4,y:0.7},  tone:{x:0.4,y:0.3},  space:{x:0.82,y:0.75}},
      {soundType:'WTPad', variation:3, oct:3, deg:2, vol:0.45, pan:0.25, vtype:'blob', xPos:0.68,yPos:0.32, radius:0.26, shape:{x:0.82,y:0.88}, tone:{x:0.30,y:0.10}, space:{x:0.62,y:0.72}},
      {soundType:'Ring',  variation:2, oct:5, deg:4, vol:0.52, pan:0.35, vtype:'spot', xPos:0.72,yPos:0.25, radius:0.14, shape:{x:0.12,y:0.65}, tone:{x:0.55,y:0.40}, space:{x:0.60,y:0.55}},
      {soundType:'Phys',  variation:3, oct:3, deg:2, vol:0.42, pan:-0.3, vtype:'blob', xPos:0.25,yPos:0.55, radius:0.18, shape:{x:0.45,y:0.72}, tone:{x:0.28,y:0.32}, space:{x:0.52,y:0.62}},
      {soundType:'Shimmer',variation:1, oct:5, deg:4, vol:0.35, pan:0.35, vtype:'blob', xPos:0.72,yPos:0.18, radius:0.13, shape:{x:0.80,y:0.90}, tone:{x:0.42,y:0.10}, space:{x:0.72,y:0.82}},
      {soundType:'Pluck', variation:0, oct:5, deg:7, vol:0.52, pan:-0.38,vtype:'blob', xPos:0.25,yPos:0.18, radius:0.12, shape:{x:0.15,y:0.35}, tone:{x:0.70,y:0.15}, space:{x:0.40,y:0.48}},
    ], drumPreset:12, drumStyle:'electronica'
  },
  italo:{
    name:'Italo Disco', bpm:124, bpmRange:[120,128],
    arrangement:[
      {soundType:'Sub',   variation:0, oct:1, deg:0, vol:0.92, pan:0,    vtype:'blob', xPos:0.50,yPos:0.78, radius:0.46, shape:{x:0.15,y:0.30}, tone:{x:0.55,y:0.20}, space:{x:0.18,y:0.22}},
      {soundType:'Pulse', variation:1, oct:3, deg:0, vol:0.78, pan:0.18, vtype:'spot', xPos:0.65,yPos:0.28, radius:0.22, shape:{x:0.12,y:0.20}, tone:{x:0.82,y:0.45}, space:{x:0.35,y:0.42}, _required:true},
      {soundType:'Arp',   variation:3, oct:5, deg:0, vol:0.78, pan:-0.22,vtype:'neon', xPos:0.32,yPos:0.20, radius:0.18, shape:{x:0.18,y:0.30}, tone:{x:0.85,y:0.55}, space:{x:0.40,y:0.48}, _required:true},
      {soundType:'EP',    variation:1, oct:3, deg:2, vol:0.65, pan:0.30, vtype:'blob', xPos:0.68,yPos:0.48, radius:0.20, shape:{x:0.30,y:0.40}, tone:{x:0.78,y:0.52}, space:{x:0.45,y:0.50}},
      {soundType:'Chord', variation:0, oct:3, deg:0, vol:0.45, pan:-0.25,vtype:'blob', xPos:0.30,yPos:0.42, radius:0.28, shape:{x:0.78,y:0.88}, tone:{x:0.50,y:0.28}, space:{x:0.60,y:0.65}},
      {soundType:'Conga', variation:1, oct:4, deg:2, vol:0.55, pan:0.35, vtype:'blob', xPos:0.72,yPos:0.22, radius:0.12, shape:{x:0.15,y:0.3},  tone:{x:0.65,y:0.5},  space:{x:0.25,y:0.35}},
      {soundType:'Pluck', variation:1, oct:4, deg:4, vol:0.58, pan:-0.35,vtype:'blob', xPos:0.28,yPos:0.42, radius:0.16, shape:{x:0.25,y:0.45}, tone:{x:0.72,y:0.38}, space:{x:0.50,y:0.48}},
      {soundType:'Vocal', variation:0, oct:3, deg:0, vol:0.35, pan:0,    vtype:'spot', xPos:0.50,yPos:0.32, radius:0.30, shape:{x:0.60,y:0.55}, tone:{x:0.58,y:0.30}, space:{x:0.65,y:0.55}},
      {soundType:'SFX',   variation:2, oct:3, deg:0, vol:0.25, pan:-0.4, vtype:'spot', xPos:0.22,yPos:0.18, radius:0.10, shape:{x:0.8,y:0.3},   tone:{x:0.6,y:0.4},   space:{x:0.2,y:0.2}},
    ], drumPreset:13, drumStyle:'italo'
  },
};

const GENRE_DISPLAY_NAMES = {
  deephouse:'Deep House', techhouse:'Tech House', acidhouse:'Acid House',
  detroittechno:'Detroit Techno', minimaltechno:'Minimal Techno', dubtechno:'Dub Techno',
  ukgarage:'UK Garage', dnb:'Drum & Bass', ambienttechno:'Ambient Techno',
  trance:'Trance', hardcore:'Hardcore', hardtechno:'Hard Techno',
  downtempo:'Downtempo', electronica:'Electronica', italo:'Italo Disco',
};

