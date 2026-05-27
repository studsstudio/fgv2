// fg-audio.js — Web Audio API core.
// AudioContext, master chain, reverb, rumble, sidechain,
// drone/beat lifecycle, BPM drift, GC sweep.
// Depends on: fg-data.js, fg-state.js

let audioCtx=null,masterGain=null,compressor=null,soundEnabled=false,drumGain=null,noiseBuffer=null;
let reverbNode=null,reverbGain=null,sidechainGain=null,sidechainSub=null;
let drumRoomSend=null,drumEchoSend=null; // W7: drum room/echo sends
let _ambientSubOsc=null,_ambientSubGain=null; // B3: sustained sub drone for spaceship feel
let masterSoftClip=null,masterShelf=null,masterLimiter=null,masterLimiterInput=null;

function triggerSidechain(){
  if(!sidechainGain||!audioCtx) return;
  const now=audioCtx.currentTime;
  const pumpDepth=activeDrumStyle==='hardcore'?0.20:
                  activeDrumStyle==='hardtechno'?0.28:
                  activeDrumStyle==='ambient'?0.60:
                  activeDrumStyle==='dub'?0.45:
                  activeDrumStyle==='techno'?0.32:
                  activeDrumStyle==='trance'?0.28:
                  activeDrumStyle==='dnb'?0.40:0.35;
  const pumpRelease=activeDrumStyle==='ambient'?0.30:
                    activeDrumStyle==='hardtechno'?0.26:
                    activeDrumStyle==='dub'?0.28:
                    activeDrumStyle==='trance'?0.18:
                    activeDrumStyle==='dnb'?0.10:0.22;
  sidechainGain.gain.cancelScheduledValues(now);
  sidechainGain.gain.setValueAtTime(pumpDepth,now);
  sidechainGain.gain.exponentialRampToValueAtTime(0.75,now+pumpRelease*0.3);
  sidechainGain.gain.exponentialRampToValueAtTime(1.0,now+pumpRelease);
  // Sub gets a much lighter pump on a separate bus — just enough to clear room
  // for the kick transient without making the bass feel wobbly between hits.
  // Maps the pad bus's heavy dip (~0.35) to a soft dip (~0.72) on Sub.
  if(sidechainSub){
    const subPump = Math.min(0.85, 0.55 + pumpDepth*0.45);
    const subRelease = pumpRelease * 0.55; // recover faster so bass stays solid
    sidechainSub.gain.cancelScheduledValues(now);
    sidechainSub.gain.setValueAtTime(subPump,now);
    sidechainSub.gain.exponentialRampToValueAtTime(1.0,now+subRelease);
  }
}

function makeSoftClip(){
  const n=4096, curve=new Float32Array(n);
  for(let i=0;i<n;i++){
    const x=(i*2/n)-1;
    curve[i]=Math.tanh(x*1.8)*0.85;
  }
  return curve;
}

function makeAcidClip(drive){
  const n=4096, curve=new Float32Array(n);
  for(let i=0;i<n;i++){
    const x=(i*2/n)-1;
    const d=1+drive*8;
    curve[i]=Math.tanh(x*d)/Math.tanh(d);
  }
  return curve;
}

let _reverbBuffers={};

function generateReverbIR(profile){
  const sr=audioCtx.sampleRate;
  const preSamples=Math.floor(sr*profile.preDelayMs/1000);
  const tailSamples=Math.floor(sr*profile.decaySec);
  const buf=audioCtx.createBuffer(2,preSamples+tailSamples,sr);
  for(let ch=0;ch<2;ch++){
    const d=buf.getChannelData(ch);
    const stereoShift=ch===1?Math.floor(profile.stereoSpread*0.004*sr):0;

    // Discrete early reflections — deterministic taps for spatial depth
    const erTimes = [0.012, 0.018, 0.028, 0.045, 0.062, 0.078];
    const erGains = [0.45, 0.35, 0.30, 0.22, 0.18, 0.15];
    const erScale = profile.earlyGain;
    erTimes.forEach((t, i) => {
      const sample = preSamples + stereoShift + Math.floor(t * sr);
      if (sample < d.length) {
        // Slight stereo variation — right channel taps offset by ~1ms
        const offset = ch === 1 ? Math.floor(0.001 * sr * (i % 3)) : 0;
        const pos = Math.min(d.length - 1, sample + offset);
        d[pos] += erGains[i] * erScale * (0.7 + Math.random() * 0.3);
      }
    });

    // Additional diffuse early taps (original random approach, reduced count)
    const numTaps=4+Math.floor(profile.earlyGain*6);
    const earlyWin=Math.floor(sr*profile.earlyMs/1000);
    for(let tap=0;tap<numTaps;tap++){
      const pos=preSamples+stereoShift+Math.floor(Math.random()*earlyWin);
      if(pos<d.length)
        d[pos]+=(Math.random()*2-1)*profile.earlyGain*0.5*Math.exp(-tap/numTaps*2.5);
    }

    let lpfState=0;
    const lpfCoeff=1-Math.exp(-2*Math.PI*profile.tailLpf/sr);
    for(let i=0;i<tailSamples;i++){
      const tt=i/tailSamples;
      const envelope=Math.pow(1-tt,1.7)*0.35;
      const darkCoeff=lpfCoeff*(1-tt*profile.tailDark);
      const white=Math.random()*2-1;
      lpfState=lpfState+darkCoeff*(white-lpfState);
      d[preSamples+i]+=lpfState*envelope*(ch===1?0.95:1.0);
    }
  }
  return buf;
}

function prebuildReverbIRs(){
  for(const [name,profile] of Object.entries(REVERB_PROFILES)){
    _reverbBuffers[name]=generateReverbIR(profile);
  }
}

function applyReverbForGenre(genre){
  const key=GENRE_REVERB[genre]||'plate';
  if(reverbNode&&_reverbBuffers[key]) reverbNode.buffer=_reverbBuffers[key];
}

let rumbleInput=null, rumbleSidechain=null, rumbleConvolver=null, rumbleLpf=null;


function buildRumbleBus(){
  if(!audioCtx) return;
  // Input gain — kick body taps here
  rumbleInput = audioCtx.createGain();
  rumbleInput.gain.value = 0; // starts silent — genre gate sets this

  // Short dark room reverb (tiny IR — 80ms noise burst)
  rumbleConvolver = audioCtx.createConvolver();
  const irLen = Math.floor(audioCtx.sampleRate * 0.08);
  const irBuf = audioCtx.createBuffer(1, irLen, audioCtx.sampleRate);
  const irData = irBuf.getChannelData(0);
  for(let i=0;i<irLen;i++) irData[i] = (Math.random()*2-1) * Math.pow(1-i/irLen, 3);
  rumbleConvolver.buffer = irBuf;

  // Hard distortion — drive 6x, tanh clip, keeps it grimy
  const rumbleDist = audioCtx.createWaveShaper();
  const dc = new Float32Array(512);
  for(let i=0;i<512;i++){ const x=i*2/512-1; dc[i]=Math.tanh(x*6)*0.7; }
  rumbleDist.curve = dc; rumbleDist.oversample = '2x';

  // 180Hz LPF — sub frequencies only, pure physical pressure
  rumbleLpf = audioCtx.createBiquadFilter();
  rumbleLpf.type = 'lowpass'; rumbleLpf.frequency.value = 180; rumbleLpf.Q.value = 0.8;

  // Sidechain gain — ducked on kick hit, swells back between hits
  rumbleSidechain = audioCtx.createGain();
  rumbleSidechain.gain.value = 0.45;

  rumbleInput.connect(rumbleConvolver);
  rumbleConvolver.connect(rumbleDist);
  rumbleDist.connect(rumbleLpf);
  rumbleLpf.connect(rumbleSidechain);
  rumbleSidechain.connect(masterGain);
}

function rumbleKickSidechain(t){
  if(!rumbleSidechain || !audioCtx) return;
  // Instant duck to near-zero on kick hit, slow bloom back over 350ms
  // This is the "pump" — the negative space that makes the kick feel physical
  rumbleSidechain.gain.cancelScheduledValues(t);
  rumbleSidechain.gain.setValueAtTime(0.001, t);                    // instant cut
  rumbleSidechain.gain.setTargetAtTime(0.55, t + 0.008, 0.10);     // bloom: fast initial swell
  rumbleSidechain.gain.setTargetAtTime(0.45, t + 0.120, 0.28);     // settle: slow tail
}

function updateRumbleGain(){
  if(!rumbleInput) return;
  const active = RUMBLE_GENRES.has(activeDrumStyle) || RUMBLE_GENRES.has(currentStyle);
  rumbleInput.gain.setTargetAtTime(active ? 1.0 : 0, audioCtx.currentTime, 0.3);
}

function buildReverb(){
  if(!audioCtx) return;
  reverbNode=audioCtx.createConvolver();
  reverbGain=audioCtx.createGain();
  reverbGain.gain.value=0.62;

  // Reverb tail saturation — subtle tube warmth on the wet signal only.
  // WaveShaper with a soft tanh curve: adds odd harmonics to long tails,
  // making the virtual room feel warmer and less metallic. Drive ~1.8x.
  const reverbSat = audioCtx.createWaveShaper();
  const satCurve = (()=>{
    const n = 256, curve = new Float32Array(n);
    const drive = 1.8; // gentle — just enough to warm the tail
    for(let i=0; i<n; i++){
      const x = (i * 2 / (n-1)) - 1;
      // Soft tanh saturation — preserves quiet tails, gently clips loud blooms
      curve[i] = Math.tanh(drive * x) / Math.tanh(drive);
    }
    return curve;
  })();
  reverbSat.curve = satCurve;
  reverbSat.oversample = '2x'; // reduce aliasing on the harmonics

  reverbNode.connect(reverbSat);
  reverbSat.connect(reverbGain);
  reverbGain.connect(masterGain);
  applyReverbForGenre(currentStyle);
}

function buildHaasWidener(delayMs){
  if(!audioCtx) return null;
  const delayS = (delayMs || 14) * 0.001;
  const input   = audioCtx.createGain(); input.gain.value = 1.0;
  const dryGain = audioCtx.createGain(); dryGain.gain.value = 0.5;
  const wetGain = audioCtx.createGain(); wetGain.gain.value = 0.5;
  const delay   = audioCtx.createDelay(0.05); delay.delayTime.value = delayS;
  const panL    = audioCtx.createStereoPanner(); panL.pan.value  = -0.85;
  const panR    = audioCtx.createStereoPanner(); panR.pan.value  =  0.85;
  const output  = audioCtx.createGain(); output.gain.value = 1.0;

  // Dry signal → pan left
  input.connect(dryGain); dryGain.connect(panL); panL.connect(output);
  // Wet signal (delayed) → pan right
  input.connect(delay); delay.connect(wetGain); wetGain.connect(panR); panR.connect(output);

  // Return object — caller does: source.connect(haas.input); haas.output.connect(...)
  return { input, output, delay, nodes:[input,dryGain,wetGain,delay,panL,panR,output] };
}

function buildLadderFilter(initialCutoff, initialRes) {
  // 4 one-pole lowpass stages
  const stages = [];
  for (let i = 0; i < 4; i++) {
    const f = audioCtx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = initialCutoff;
    f.Q.value = 0.5; // Butterworth — resonance comes from feedback, not Q
    stages.push(f);
  }
  // Chain stages in series
  stages[0].connect(stages[1]);
  stages[1].connect(stages[2]);
  stages[2].connect(stages[3]);

  // Feedback path: stage4 output → nonlinear saturator → feedback gain → stage1 input
  const fbSat = audioCtx.createWaveShaper();
  const fbCurve = new Float32Array(512);
  for (let i = 0; i < 512; i++) {
    const x = (i * 2 / 512) - 1;
    // Gentler saturation — softer knee, less high-frequency generation
    fbCurve[i] = Math.tanh(x * 0.8);
  }
  fbSat.curve = fbCurve;
  fbSat.oversample = '2x';

  // LPF in feedback path — damps the harshness of resonance, warmer character
  const fbLpf = audioCtx.createBiquadFilter();
  fbLpf.type = 'lowpass';
  fbLpf.frequency.value = 6000;
  fbLpf.Q.value = 0.5;

  const fbGain = audioCtx.createGain();
  // Lower ceiling — 0.72 max prevents harsh self-oscillation edge
  fbGain.gain.value = Math.min(0.60, (initialRes / 4.2) * 0.60);

  const inputMix = audioCtx.createGain();
  inputMix.gain.value = 1.0;

  // Feedback loop with LPF: stages[3] → fbSat → fbLpf → fbGain → inputMix → stages[0]
  stages[3].connect(fbSat);
  fbSat.connect(fbLpf);
  fbLpf.connect(fbGain);
  fbGain.connect(inputMix);
  inputMix.connect(stages[0]);

  // Helper to set all stage frequencies
  const setAllFreq = (v) => {
    const clamped = Math.max(20, Math.min(20000, v));
    stages.forEach(f => f.frequency.value = clamped);
  };
  const setAllFreqAtTime = (v, t) => {
    const clamped = Math.max(20, Math.min(20000, v));
    stages.forEach(f => f.frequency.linearRampToValueAtTime(clamped, t));
  };
  const setAllFreqExp = (v, t) => {
    const clamped = Math.max(20, Math.min(20000, v));
    stages.forEach(f => f.frequency.exponentialRampToValueAtTime(clamped, t));
  };

  setAllFreq(initialCutoff);

  return {
    node:   stages[0],   // for filterNode reference in nodeGroup
    input:  inputMix,    // connect audio source here
    output: stages[3],   // connect to gainNode from here
    setCutoff(v, t)      { setAllFreqAtTime(v, t || audioCtx.currentTime); },
    setCutoffNow(v)      { setAllFreq(v); },
    setCutoffExp(v, t)   { setAllFreqExp(v, t); },
    setResonance(v)      { fbGain.gain.value = Math.min(0.60, (v / 4.2) * 0.60); },
    setResonanceAtTime(v,t){ fbGain.gain.linearRampToValueAtTime(Math.min(0.60,(v/4.2)*0.60), t); },
    stages, fbGain,
    type: 'ladder'
  };
}

function initAudio(){
  if(audioCtx) return;
  try{
    audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended') audioCtx.resume();
    compressor=audioCtx.createDynamicsCompressor();
    compressor.threshold.value=-20;
    compressor.knee.value=4;
    compressor.ratio.value=6.0;
    compressor.attack.value=0.002;
    compressor.release.value=0.15;
    // True limiter after compressor — brickwall at -1dB
    const limiter=audioCtx.createDynamicsCompressor();
    masterLimiter=limiter;
    limiter.threshold.value=-1;
    limiter.knee.value=0;
    limiter.ratio.value=20.0;
    limiter.attack.value=0.001;
    limiter.release.value=0.05;
    masterGain=audioCtx.createGain();
    masterGain.gain.value=0.55;
    // Master chain: compressor -> masterGain -> lowMid -> softClip -> highShelf -> mobileEQ
    const _clipCurve=new Float32Array(8192);
    for(let i=0;i<8192;i++){
      const x=(i*2/8192)-1;
      // Harder knee -- catches peaks the compressor misses on very fast transients
      _clipCurve[i]=Math.tanh(x*2.2)/Math.tanh(2.2);
    }
    masterSoftClip=audioCtx.createWaveShaper();
    masterSoftClip.curve=_clipCurve;
    masterSoftClip.oversample='4x';
    // Low-mid warmth boost -- reduced to avoid pushing the master hot
    const masterLowMid=audioCtx.createBiquadFilter();
    masterLowMid.type='peaking';
    masterLowMid.frequency.value=260;
    masterLowMid.Q.value=0.7;
    masterLowMid.gain.value=1.2;
    masterShelf=audioCtx.createBiquadFilter();
    masterShelf.type='highshelf';
    masterShelf.frequency.value=7000;
    masterShelf.gain.value=-1.5; // was -5.0 — open up air above 7kHz toward Mutualism/Jellyfish ref
    compressor.connect(masterGain);
    masterGain.connect(masterLowMid);
    masterLowMid.connect(masterSoftClip);
    masterSoftClip.connect(masterShelf);
    // Brickwall limiter: shelf -> limiter -> mobileEQ -> destination
    const mobileEQInput = buildMobileEQ(audioCtx, audioCtx.destination);
    masterLimiterInput = mobileEQInput;
    masterShelf.connect(limiter);
    limiter.connect(mobileEQInput);
    sidechainGain=audioCtx.createGain();
    sidechainGain.gain.value=1.0;
    sidechainGain.connect(compressor);
    // Separate bus for Sub — lighter pump so the bass stays solid between kicks
    sidechainSub=audioCtx.createGain();
    sidechainSub.gain.value=1.0;
    sidechainSub.connect(compressor);
    drumGain=audioCtx.createGain();
    drumGain.gain.value=0.85;
    // W7: Drum bus — shared compressor → soft saturation → low cut → master
    const drumBusComp=audioCtx.createDynamicsCompressor();
    drumBusComp.threshold.value=-18;
    drumBusComp.knee.value=6;
    drumBusComp.ratio.value=4.0;
    drumBusComp.attack.value=0.003;
    drumBusComp.release.value=0.12;
    const drumBusSat=audioCtx.createWaveShaper();
    const _dbc=new Float32Array(512);
    for(let i=0;i<512;i++){const x=i*2/512-1;_dbc[i]=Math.tanh(x*1.6)/Math.tanh(1.6);}
    drumBusSat.curve=_dbc;
    const drumBusHPF=audioCtx.createBiquadFilter();
    drumBusHPF.type='highpass';drumBusHPF.frequency.value=35;drumBusHPF.Q.value=0.7;
    drumGain.connect(drumBusComp);
    drumBusComp.connect(drumBusSat);
    drumBusSat.connect(drumBusHPF);
    drumBusHPF.connect(compressor);
    const nLen=Math.floor(audioCtx.sampleRate*4);
    noiseBuffer=audioCtx.createBuffer(2,nLen,audioCtx.sampleRate);
    for(let ch=0;ch<2;ch++){
      const nd=noiseBuffer.getChannelData(ch);
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0;
      for(let i=0;i<nLen;i++){
        const w=Math.random()*2-1;
        b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
        b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
        b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
        nd[i]=(b0+b1+b2+b3+b4+b5+w*0.5362)*0.11;
      }
    }
    prebuildReverbIRs();
    buildReverb(); // BUG-D: reverb must exist before drum sends
    buildRumbleBus();
    // W7: Drum room/echo sends — created AFTER buildReverb() so reverbNode is valid
    drumRoomSend=audioCtx.createGain();drumRoomSend.gain.value=0;
    drumRoomSend.connect(reverbNode);
    drumEchoSend=audioCtx.createGain();drumEchoSend.gain.value=0;
    const _drumEchoDelay=audioCtx.createDelay(1.0);
    _drumEchoDelay.delayTime.value=60/120*0.5;
    const _drumEchoFB=audioCtx.createGain();_drumEchoFB.gain.value=0.28;
    const _drumEchoOut=audioCtx.createGain();_drumEchoOut.gain.value=0.32;
    drumEchoSend.connect(_drumEchoDelay);
    _drumEchoDelay.connect(_drumEchoFB);_drumEchoFB.connect(_drumEchoDelay);
    _drumEchoDelay.connect(_drumEchoOut);_drumEchoOut.connect(reverbGain);
    updateDrumSends();
  }catch(e){console.warn('Audio init failed:',e);}
}

let _mobileEQ = null;
let _isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
let _isIOS    = /iPhone|iPad|iPod/i.test(navigator.userAgent);

function buildMobileEQ(ctx, destination){
  if(!_isMobile) return destination;
  // Sub warmth: +1.5dB at 100Hz -- gentler, avoids pushing sub into clipping on iPad
  const lowShelf=ctx.createBiquadFilter();
  lowShelf.type='lowshelf'; lowShelf.frequency.value=100; lowShelf.gain.value=1.5;
  // Upper-mid cut: -4dB at 3kHz -- where iPad harshness peaks
  const mid=ctx.createBiquadFilter();
  mid.type='peaking'; mid.frequency.value=3000; mid.Q.value=1.0; mid.gain.value=-4.0;
  // Air cut: -5dB above 8kHz -- roll off harshness more aggressively
  const hiShelf=ctx.createBiquadFilter();
  hiShelf.type='highshelf'; hiShelf.frequency.value=8000; hiShelf.gain.value=-2.0; // was -5.0
  lowShelf.connect(mid); mid.connect(hiShelf); hiShelf.connect(destination);
  _mobileEQ={lowShelf,mid,hiShelf};
  return lowShelf;
}

function triggerHaptic(t){
  if(!audioCtx) return;
  if(navigator.vibrate&&!_isIOS){
    // Android: use Vibration API — 30ms pulse on kick
    const delay=Math.max(0,(t-audioCtx.currentTime)*1000);
    setTimeout(()=>navigator.vibrate(28), delay);
    return;
  }
  if(_isIOS){
    // iOS: 40Hz sine, very short, sent to a separate gain node at low volume
    // Acts as a sub-bass transient that can trigger haptic feedback
    const hapticOsc=audioCtx.createOscillator();
    hapticOsc.type='sine'; hapticOsc.frequency.value=42;
    const hapticG=audioCtx.createGain();
    hapticG.gain.setValueAtTime(0,t);
    hapticG.gain.linearRampToValueAtTime(0.35,t+0.003);
    hapticG.gain.exponentialRampToValueAtTime(0.0001,t+0.045);
    hapticOsc.connect(hapticG); hapticG.connect(audioCtx.destination);
    hapticOsc.start(t); hapticOsc.stop(t+0.05);
    hapticOsc.onended=()=>{ try{hapticOsc.disconnect();hapticG.disconnect();}catch(e){} };
  }
}

let _gcSweepTimer = null;

function startGCSweep(){
  if(_gcSweepTimer) clearInterval(_gcSweepTimer);
  _gcSweepTimer = setInterval(()=>{
    if(!audioCtx||!soundEnabled||!beatEnabled) return;
    // Only sweep if audio is running and not mid-arc
    if(arcState!=='idle') return;
    audioCtx.suspend().then(()=>{
      setTimeout(()=>audioCtx.resume(), 80);
    }).catch(()=>{});
  }, 5*60*1000); // every 5 minutes
}

function ensureAudio(){
  if(!audioCtx) initAudio();
  if(audioCtx && audioCtx.state==='suspended') audioCtx.resume();
}

let _bpmDriftBase=126;      // the BPM we started at for this genre
let _bpmDriftTarget=126;    // where we're slowly heading
let _bpmDriftTimer=null;

function startBpmDrift(baseBpm, range){
  if(_bpmDriftTimer) clearInterval(_bpmDriftTimer);
  _bpmDriftBase=baseBpm;
  _bpmDriftTarget=baseBpm;
  const lo=Math.max((range?.[0]??baseBpm-4), baseBpm-2);
  const hi=Math.min((range?.[1]??baseBpm+4), baseBpm+2);
  _bpmDriftTimer=setInterval(()=>{
    if(!beatEnabled||!soundEnabled) return;
    _bpmDriftTarget=lo+Math.random()*(hi-lo);
    const steps=80; // 80 intervals of 100ms = 8s
    let step=0;
    const startBpm=bpm;
    const lerp=setInterval(()=>{
      step++;
      const t=step/steps;
      bpm=Math.round((startBpm+((_bpmDriftTarget-startBpm)*t))*10)/10;
      document.getElementById('bpmVal').textContent=Math.round(bpm);
      const _lbd=document.getElementById('liveBpmDisplay'); if(_lbd) _lbd.textContent=Math.round(bpm)+' BPM';
      if(step>=steps) clearInterval(lerp);
    },100);
  }, 20000+Math.random()*15000); // every 20-35 seconds
}

function stopBpmDrift(){
  if(_bpmDriftTimer){ clearInterval(_bpmDriftTimer); _bpmDriftTimer=null; }
}

function startAmbientSub(){
  if(!audioCtx||!soundEnabled) return;
  stopAmbientSub();
  if(!AMBIENT_SUB_GENRES.has(currentStyle)) return;

  const now=audioCtx.currentTime;
  const targetGain=AMBIENT_SUB_GAIN[currentStyle]||0.18;

  // Root note at genre key — default to A1 (55Hz) if key not set
  const rootHz = 55; // ~A1, sits right in the Jellyfish 57Hz sweet spot

  // Main sub sine
  const osc=audioCtx.createOscillator();
  osc.type='sine';
  osc.frequency.value=rootHz;

  // Very slow vibrato — barely perceptible, 0.08Hz, adds life without pitch drift
  const vibratoLfo=audioCtx.createOscillator();
  vibratoLfo.type='sine';
  vibratoLfo.frequency.value=0.08;
  const vibratoDepth=audioCtx.createGain();
  vibratoDepth.gain.value=rootHz*0.012; // ±0.6Hz wobble
  vibratoLfo.connect(vibratoDepth);
  vibratoDepth.connect(osc.frequency);

  // HPF at 30Hz — remove subsonic rumble
  const hpf=audioCtx.createBiquadFilter();
  hpf.type='highpass'; hpf.frequency.value=30; hpf.Q.value=0.7;

  // Gentle lowpass at 120Hz — pure sub, nothing sneaking into the mids
  const lpf=audioCtx.createBiquadFilter();
  lpf.type='lowpass'; lpf.frequency.value=120; lpf.Q.value=0.5;

  const gainNode=audioCtx.createGain();
  gainNode.gain.setValueAtTime(0,now);
  gainNode.gain.linearRampToValueAtTime(targetGain, now+3.0); // slow fade in — 3s

  osc.connect(hpf); hpf.connect(lpf); lpf.connect(gainNode);
  gainNode.connect(sidechainSub||compressor||masterGain);

  osc.start(now);
  vibratoLfo.start(now);

  _ambientSubOsc={osc,vibratoLfo};
  _ambientSubGain=gainNode;
}

function stopAmbientSub(){
  if(!_ambientSubOsc) return;
  if(audioCtx&&_ambientSubGain){
    const now=audioCtx.currentTime;
    _ambientSubGain.gain.setValueAtTime(_ambientSubGain.gain.value,now);
    _ambientSubGain.gain.linearRampToValueAtTime(0,now+2.0); // slow fade out
    const osc=_ambientSubOsc.osc;
    const lfo=_ambientSubOsc.vibratoLfo;
    setTimeout(()=>{ try{osc.stop();lfo.stop();}catch(e){} },2200);
  }
  _ambientSubOsc=null;
  _ambientSubGain=null;
}

function updateAmbientSub(){
  // Called on genre change — restart if needed
  if(AMBIENT_SUB_GENRES.has(currentStyle)){
    if(!_ambientSubOsc&&soundEnabled) startAmbientSub();
  } else {
    stopAmbientSub();
  }
}

function startDrone(el){
  if(!audioCtx||!soundEnabled) return;
  if(el.soundType==='EP'||el.soundType==='FMStab'||el.soundType==='FM3'||el.soundType==='Arp'||el.soundType==='Pluck'||el.soundType==='Laser'||el.soundType==='Echo'||el.soundType==='Conga'||el.soundType==='SFX') return;
  // Hard block -- never allow more than one active Growl
  if(el.soundType==='Acid'){
    const activeGrowls=elements.filter(e=>e.soundType==='Acid'&&e._droneNode&&e.id!==el.id);
    if(activeGrowls.length>0){ return; }
  }
  stopDrone(el);
  const anySoloed=elements.some(e=>e.soloed);
  if(el.muted||anySoloed&&!el.soloed) return;
  const freq=midiToFreq(noteToMidi(el.note||'A3'));

  // B2: equal-loudness summing — when multiple Drone/Pad/Growl types are active,
  // scale each one down so the total perceived level stays consistent.
  // Formula: gainScale = 1/sqrt(n) where n = count of active sustained elements.
  const SUMMING_TYPES = new Set(['Drone','Pad','Acid','Vocal','Noise','Ring','Pulse','Phys']);
  const activeSustained = elements.filter(e=>
    !e.muted && e._droneNode && SUMMING_TYPES.has(e.soundType) && e.id!==el.id
  ).length + 1; // +1 for the one we're about to start
  const densityScale = activeSustained > 1 ? 1/Math.sqrt(activeSustained) : 1.0;

  const vol=(el.volume??0.75)*0.32*densityScale;
  const panVal=getElPan(el);
  let nodeGroup;
  switch(el.soundType){
    case 'Sub':   nodeGroup=buildDroneSub(el,freq,vol,panVal);   break;
    case 'Acid': nodeGroup=buildDroneGrowl(el,freq,vol,panVal); break;
    case 'Pulse': nodeGroup=buildDronePulse(el,freq,vol,panVal); break;
    case 'Ring':  nodeGroup=buildDroneRing(el,freq,vol,panVal);  break;
    case 'Noise': nodeGroup=buildDroneNoise(el,freq,vol,panVal); break;
    case 'Shimmer':nodeGroup=buildGranularShimmer(el,freq,vol,panVal);break;
    case 'WTPad': nodeGroup=buildWavetablePad(el,freq,vol,panVal);  break;
    case 'Pad':   nodeGroup=buildDronePadType(el,freq,vol,panVal); break;
    case 'Vocal': nodeGroup=buildDroneVocal(el,freq,vol,panVal);   break;
    case 'Phys':  nodeGroup=buildPhysicalModel(el,freq,vol,panVal); break;
    case 'Chord': nodeGroup=buildDroneChord(el,freq,vol,panVal);   break;
    default:      nodeGroup=buildDronePad(el,freq,vol,panVal);   break;
  }
  connectOutput(nodeGroup,el);
  el._droneNode=nodeGroup;
  el._lastBaseFreq=freq;
}

function stopDrone(el,fadeTime=0.12){
  if(!el._droneNode||!audioCtx) return;
  const dn=el._droneNode;
  const {oscs,gainNode,chLfo,filterNode,pannerNode,lfoNode,lfoGain,delayNode,revSend,ladderStages,extraNodes}=dn;
  const now=audioCtx.currentTime;
  if(gainNode){
    gainNode.gain.setTargetAtTime(0,now,fadeTime/3);
    setTimeout(()=>{
      try{
        oscs.forEach(o=>{ try{o.stop();o.disconnect();}catch(e){} });
        if(chLfo){ try{chLfo.stop();chLfo.disconnect();}catch(e){} }
        if(lfoNode){ try{lfoNode.stop();lfoNode.disconnect();}catch(e){} }
        if(lfoGain){ try{lfoGain.disconnect();}catch(e){} }
        if(filterNode) try{filterNode.disconnect();}catch(e){}
        if(pannerNode) try{pannerNode.disconnect();}catch(e){}
        if(delayNode)  try{delayNode.disconnect();}catch(e){}
        if(revSend)    try{revSend.disconnect();}catch(e){}
        // Disconnect ladder filter internal nodes
        if(ladderStages) ladderStages.forEach(n=>{ try{n.disconnect();}catch(e){} });
        // Any extra nodes registered by builder
        if(extraNodes) extraNodes.forEach(n=>{ try{n.disconnect();}catch(e){} });
        gainNode.disconnect();
      }catch(e){}
    },(fadeTime+0.3)*1000);
  }
  el._droneNode=null;
}

function updateDroneParams(el){
  if(!el._droneNode||!audioCtx) return;
  const {filterNode,gainNode,pannerNode,delayNode,delayWet,revSend,
         lfoNode,lfoGain,chorusWet,chorusDry,oscs}=el._droneNode;
  const sx=(el.shape&&el.shape.x!=null?el.shape.x:0.5), sy=(el.shape&&el.shape.y!=null?el.shape.y:0.7);
  const tx=(el.tone&&el.tone.x!=null?el.tone.x:0.4),  ty=(el.tone&&el.tone.y!=null?el.tone.y:0.2);
  const px=(el.space&&el.space.x!=null?el.space.x:0.35), py=(el.space&&el.space.y!=null?el.space.y:0.4);
  const _depth=getElDepth(el);
  const now=audioCtx.currentTime;
  const ramp=0.025; // snappy — feel every drag immediately
  if(filterNode){
    let cutoff,q;
    if(el.soundType==='Acid'){
      cutoff=60+Math.pow(tx,1.5)*12000;
      q=0.7+Math.pow(ty,1.2)*19;
      // Update all 4 ladder stages if available
      const ladderStages=el._droneNode&&el._droneNode.ladderStages;
      if(ladderStages){
        ladderStages.forEach(f=>{
          f.frequency.setTargetAtTime(Math.max(20,Math.min(18000,cutoff)),now,ramp);
        });
      } else {
        filterNode.frequency.setTargetAtTime(Math.max(20,Math.min(18000,cutoff)),now,ramp);
        filterNode.Q.setTargetAtTime(Math.max(0.1,q),now,ramp);
      }
    } else if(el.soundType==='Pulse'){
      cutoff=200+Math.pow(tx,1.3)*9000;
      q=0.5+ty*14;
    } else if(el.soundType==='Sub'){
      cutoff=40+tx*400; q=1+ty*5;
    } else if(el.soundType==='Noise'){
      cutoff=80+Math.pow(tx,1.4)*10000; q=0.8+ty*18;
    } else { // Drone / Pad / WTPad / Chord / etc
      cutoff=80+Math.pow(tx,1.4)*9000;
      q=0.4+ty*10;
    }
    // Spatial depth: Y position darkens/brightens filter — bottom of canvas = distant = darker
    // Sub stays full range (depth irrelevant for pure bass fundamentals)
    if(el.soundType!=='Sub') cutoff *= _depth.cutoffMult;
    // Form-cycle openness modulates harmonic-bed filters so user tone changes
    // don't reset the slow form sweep (applyFormPosition writes here too).
    if((generateActive || _liveMode) && el.soundType !== 'Acid' && el.soundType !== 'Pulse' &&
       el.soundType !== 'Sub' && el.soundType !== 'Noise' &&
       ['Pad','WTPad','Chord','Drone'].includes(el.soundType)){
      cutoff *= 0.45 + _formOpenness * 0.55;
    }
    if(el.soundType!=='Acid'){
      filterNode.frequency.setTargetAtTime(Math.max(20,Math.min(18000,cutoff)),now,ramp);
      filterNode.Q.setTargetAtTime(Math.max(0.1,q),now,ramp);
    }
  }
  if(lfoNode&&lfoGain&&filterNode){
    const lfoRate=el.soundType==='Acid'
      ? (bpm/60)*(0.1+sx*0.9)   // Growl: LFO syncs to beat feel
      : 0.05+(1-sx)*0.4;         // others: slow breath
    const lfoDepth=el.soundType==='Acid'
      ? (60+Math.pow(tx,1.5)*12000)*0.4*sx
      : (80+tx*9000)*0.2*(0.2+ty);
    lfoNode.frequency.setTargetAtTime(lfoRate,now,ramp*2);
    lfoGain.gain.setTargetAtTime(lfoDepth,now,ramp*2);
  }
  // Solo guard — during a drag, don't restore gain on silenced elements
  const _isDragTarget = (canvasDragging && canvasDragging.id === el.id) || el._touchHeld;
  if(_dragSolo && !_isDragTarget) return;

  if(gainNode&&el.soundType==='Acid'){
    // Hard cap -- evolve/conductor cannot push Growl above 0.15 ever
    gainNode.gain.setTargetAtTime(Math.min(0.15,(el.volume??0.75)*0.18),now,ramp);
  } else if(gainNode&&(el.soundType==='Drone'||el.soundType==='Noise'||el.soundType==='Pad'||el.soundType==='Vocal')){
    const targetVol=Math.min(0.25,(el.volume??0.75)*0.45*(0.4+sy*0.6)*_depth.gainAttn);
    gainNode.gain.setTargetAtTime(targetVol,now,0.1+(1-sx)*0.4);
  } else if(gainNode){
    gainNode.gain.setTargetAtTime(Math.min(0.25,(el.volume??0.75)*0.45*_depth.gainAttn),now,ramp);
  }
  // Spatial depth: distant elements (low Y) get more reverb — they sit further back in the room
  if(revSend) revSend.gain.setTargetAtTime(Math.max(0,px*0.65*_depth.reverbMult),now,ramp);
  if(delayWet) delayWet.gain.setTargetAtTime(px*0.4,now,ramp);
  if(delayNode){
    const stepSec=(60/bpm)/4;
    const delayMult=py<0.5?1:py<0.75?1.5:2;
    delayNode.delayTime.setTargetAtTime(stepSec*delayMult,now,0.05);
  }
  if(chorusWet){
    const width=Math.pow(py,0.8)*0.6;
    chorusWet.gain.setTargetAtTime(width,now,ramp);
    if(chorusDry) chorusDry.gain.setTargetAtTime(1-width*0.3,now,ramp);
  }
  if(pannerNode) pannerNode.pan.setTargetAtTime(
    getElPan(el),now,ramp);
}

function stopAllDrones(){ elements.forEach(el=>stopDrone(el)); }


function updateDrumGain(){
  if(!drumGain||!audioCtx) return;
  const g=DRUM_STYLE_GAIN[activeDrumStyle]??0.88;
  drumGain.gain.setTargetAtTime(g, audioCtx.currentTime, 0.1);
}

function updateDrumSends(){
  if(!drumRoomSend||!audioCtx) return;
  const room=DRUM_ROOM_SEND[activeDrumStyle]??0.14;
  drumRoomSend.gain.setTargetAtTime(room, audioCtx.currentTime, 0.2);
  // W6: Invalidate secondary perc pattern cache on style change
  if(typeof _secPercCache !== 'undefined') _secPercCache.clear();
}

function startBeat(){
  if(beatEnabled) return;
  ensureAudio();
  beatEnabled=true;beatStep=0;
  nextBeatTime=audioCtx.currentTime+0.05;
  document.getElementById('btnBeat').classList.add('beat-on');
  elements.forEach(el=>{if(el.soundType==='Arp'){el._arpStep=0;el._arpStepCounter=0;el._arpPattern=null;}});
  elements.forEach(el=>{if(el.syncMode==='sync'&&!el._droneNode&&!el.muted)maybeStartDrone(el);});
  startGCSweep();
  runBeatScheduler();
  startAmbientSub(); // B3: sustained sub drone underneath
}

function stopBeat(){
  beatEnabled=false;clearTimeout(beatSchedulerTimer);beatSchedulerTimer=null;beatStep=0;
  document.getElementById('btnBeat').classList.remove('beat-on');
  updateDrumHighlight(-1);
  elements.forEach(el=>{if(el.syncMode==='sync')stopDrone(el);});
  stopAmbientSub(); // B3
}

function runBeatScheduler(){
  if(!beatEnabled||!audioCtx) return;
  const stepDur=(60/bpm)/4;
  const groove=getGroove();
  while(nextBeatTime<audioCtx.currentTime+0.1){
    flushCallResponseQueue(nextBeatTime);
    const dp=drumPattern;
    const swingOffset = (beatStep%2===1) ? stepDur*groove.swing*0.5 : 0;
    const humanOffset = (Math.random()-0.5)*groove.humanizeMs*0.001;
    const t = nextBeatTime + swingOffset + humanOffset;
    const kickT = t + (groove.kickOffsetMs||0)*0.001;
    const clapT = t + (groove.clapOffsetMs||0)*0.001 + (Math.random()-0.5)*0.002;
    const hatT  = t + (groove.hatOffsetMs||0)*0.001  + (Math.random()-0.5)*0.001;
    const accentMult=drumPattern._accents?.[beatStep]??1.0;
    const velMult = (1.0 + (Math.random()-0.5)*groove.velocityVar) * accentMult;

    // Solo active — only schedule sounds for the held element, silence everything else
    if(!_dragSolo){
    if(dp.kick[beatStep]){ scheduleKick(kickT, velMult); triggerHaptic(kickT); }
    if(dp.clap[beatStep]) scheduleClap(clapT, velMult);
    const skipHat = dp.hihat[beatStep] && Math.random()<groove.hatSkip;
    if(dp.hihat[beatStep] && !skipHat){
      if(groove.ratchetChance>0 && Math.random()<groove.ratchetChance){
        const steps=groove.ratchetSteps||2;
        const rStep=stepDur/steps;
        for(let ri=0;ri<steps;ri++){
          const rv=((beatStep%2===0?1.0:0.6)*velMult)*(1-ri*0.15);
          scheduleHihat(hatT+ri*rStep, Math.max(0.1,rv));
        }
      } else {
        scheduleHihat(hatT, (beatStep%2===0?1.0:0.6)*velMult);
      }
    }
    // ── Drum fills at chord transitions ─────────────────────────────────────
    // Last 2 steps of the bar before a chord change: add extra hat hits.
    // Stronger fill when the next chord returns to the tonic (perfect cadence).
    if(_currentProgression && beatStep >= 13 && barCount > 0 && soundEnabled){
      const lastBarOfChord = (barCount % _chordCycleBars) === (_chordCycleBars - 1);
      if(lastBarOfChord){
        const nextChordIdx = (_currentChordIdx + 1) % _currentProgression.length;
        const isCadence = nextChordIdx === 0; // returning to tonic
        const fillProb = isCadence ? 0.85 : 0.40;
        if(Math.random() < fillProb){
          const halfStep = stepDur * 0.5;
          scheduleHihat(hatT + halfStep, isCadence ? 0.80 : 0.55);
        }
        // Strongest cadence: also add a 16th-note hat on the very last step
        if(isCadence && beatStep === 15 && Math.random() < 0.7){
          scheduleHihat(hatT + stepDur*0.25, 0.65);
          scheduleHihat(hatT + stepDur*0.75, 0.75);
        }
      }
    }
    if(dp.openhh[beatStep]){
      // D2: choke any ringing open HH when closed hat or new open fires
      if(_openHHNode){ try{
        _openHHNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.004);
      }catch(e){} _openHHNode=null; }
      _openHHNode = scheduleOpenHH(hatT);
    }
    // D2: closed hihat chokes open HH
    if((dp.hihat[beatStep] && !skipHat) && _openHHNode){
      try{ _openHHNode.gain.setTargetAtTime(0, hatT, 0.003); }catch(e){}
      _openHHNode = null;
    }
    if(dp.perc[beatStep]) schedulePerc(t, velMult);
    if(dp.snap && dp.snap[beatStep]) scheduleSnap(t, velMult);
    // D1: ghost notes — genre-aware gain, only on musically relevant empty steps
    if(!dp.hihat[beatStep] && !dp.kick[beatStep] && Math.random()<groove.ghostChance){
      const ghostGain = {
        deephouse:0.18, techhouse:0.12, acidhouse:0.20, detroittechno:0.10,
        minimaltechno:0.06, dubtechno:0.08, ukgarage:0.25, dnb:0.28,
        ambienttechno:0.05, trance:0.06, hardcore:0.04, hardtechno:0.05,
        downtempo:0.22, electronica:0.20, italo:0.00,
      }[currentStyle] ?? 0.10;
      if(ghostGain > 0) scheduleHihat(hatT, ghostGain * (0.7 + Math.random() * 0.6));
    }
    // D4: clap flam — occasional micro pre-hit 1-3ms before the clap
    if(dp.clap[beatStep]){
      const flamChance = {
        deephouse:0.10, techhouse:0.06, acidhouse:0.08, detroittechno:0.04,
        ukgarage:0.14, dnb:0.10, downtempo:0.12, electronica:0.08,
        hardtechno:0.00, hardcore:0.00, trance:0.02, italo:0.05,
      }[currentStyle] ?? 0.05;
      if(Math.random() < flamChance){
        const flamOffset = 0.001 + Math.random() * 0.002;
        scheduleClap(clapT - flamOffset, velMult * 0.35);
      }
    }
    updateDrumHighlight(beatStep);
    } // end if(!_dragSolo) — drums only gated above

    // Get held element id for per-element solo check below
    const _heldId = _dragSolo
      ? (canvasDragging?.id ?? [...Object.values(_liveT).map(s=>s.el?.id), _liveMouse.active?_liveMouse.el?.id:null].find(Boolean) ?? null)
      : null;
    // Helper: should this element fire when solo is active?
    const _soloAllows = (el) => !_dragSolo || el.id === _heldId || el._touchHeld;

    // W4: Only retrigger continuous/drone-type instruments
    if(beatStep%4===0){
      elements.forEach(el=>{
        if(el.syncMode==='sync'&&!el.muted&&!GENERIC_RETRIGGER_EXCLUDE.has(el.soundType)&&_soloAllows(el)){
          retrigerDroneOnBeat(el);
          el._pulse=0.8;el._flashPulse=0.6;
        }
      });
    }
    // Bass phrase engine — Sub fires per 16-step pattern, varied by chord position
    elements.forEach(el=>{
      if(el.syncMode==='sync'&&!el.muted&&el.soundType==='Sub'&&_soloAllows(el)){
        const phrase=getBassPhraseForChord();
        if(phrase[beatStep]){
          startDrone(el);
          el._pulse=1.0; el._flashPulse=0.85; // strong snap — bass is rhythmic
          el._notePulse=0.55; // hold a little after the hit
          recordCallEvent(el, t, noteToMidi(el.note||'A1'));
        }
      }
    });
    // W9: Pulse — stab subrole, uses voice phrase engine for note selection
    elements.forEach(el=>{
      if(el.syncMode==='sync'&&!el.muted&&el.soundType==='Pulse'&&_soloAllows(el)){
        const v=el.variation??0;
        const model=getSoundModel('Pulse');
        const hiSpeed=bpm>158;
        const fires=hiSpeed?[0]:v===0?[0,8]:v===1?[0]:v===2?[0,4,8,12]:[0,4,8,12];
        if(fires.includes(beatStep)){
          const vp = tickVoicePhrase(el, beatStep, barCount);
          const useFreq = vp ? vp.freq : midiToFreq(noteToMidi(el.note||'A3'));
          const vol = vp ? (el.volume??0.65) * vp.vel : (el.volume??0.65);
          schedulePulseOneShot({...el, volume: vol}, t, useFreq);
          el._pulse=0.9; el._flashPulse=0.7;
          recordCallEvent(el, t, vp ? Math.round(69+12*Math.log2(useFreq/440)) : noteToMidi(el.note||'A3'));
          if(model.choppy&&!hiSpeed&&Math.random()<0.55){
            const chopT=t+(stepDur*3)*(1+groove.swing*0.3);
            schedulePulseOneShot({...el,volume:(vol)*0.5}, chopT, useFreq);
          }
        }
      }
    });
    // Arp — has its own pattern engine (tickArp), keep as-is
    elements.forEach(el=>{
      if(el.syncMode==='sync'&&!el.muted&&el.soundType==='Arp'&&_soloAllows(el)){
        // RULE 3: yield to Sub on shared steps — creates push-pull groove
        if(!shouldArpYieldToSub(beatStep)){
          const result=tickArp(el);
          if(result){
            scheduleArpNote(el, t, result.freq, result.gate, result.vel, result.portamento);
            _elLastFiredBar.set(el.id, barCount);
            el._pulse = result.vel * 0.75; // flickers per note — reads as melody
            el._notePulse = result.vel * 0.6; // holds for note gate
          }
        }
      }
    });
    // W9: Pluck — voice phrase engine drives note, variation drives fire pattern
    elements.forEach(el=>{
      if(el.syncMode==='sync'&&!el.muted&&el.soundType==='Pluck'&&_soloAllows(el)){
        const v=el.variation??0;
        const hiSpeed=bpm>158;
        const fires=hiSpeed?[0]:v===1?[0,8]:v===3?[0,3,8,11]:[0,4,8,12];
        if(fires.includes(beatStep)){
          const vp = tickVoicePhrase(el, beatStep, barCount);
          const freq = vp ? vp.freq : midiToFreq(noteToMidi(el.note||'A4'));
          schedulePluckNote(el, t, freq);
          notifyConversationFired(el, barCount);
          _elLastFiredBar.set(el.id, barCount);
          el._pulse = vp ? vp.vel * 0.9 : 0.7;
          el._notePulse = vp ? vp.vel * 0.65 : 0.55; // pluck — shorter note hold
        }
      }
    });
    elements.forEach(el=>{
      if(el.syncMode!=='sync'||el.muted) return;
      const hiSpeed=bpm>158;
      // W9: EP, FMStab, FM3 — voice phrase engine for note + velocity
      if(el.soundType==='EP'){
        const fires=hiSpeed?[0]:[0,8];
        if(fires.includes(beatStep)){
          const vp = tickVoicePhrase(el, beatStep, barCount);
          const freq = vp ? vp.freq : midiToFreq(noteToMidi(el.note||'A3'));
          const vel = vp ? vp.vel : 0.7;
          scheduleEPNote(el, t, freq, vel);
          recordCallEvent(el, t, vp ? Math.round(69+12*Math.log2(freq/440)) : noteToMidi(el.note||'A3'));
          notifyConversationFired(el, barCount);
          _elLastFiredBar.set(el.id, barCount);
          el._pulse = vp ? vp.vel * 0.9 : 0.8;
          el._notePulse = vp ? vp.vel * 0.85 : 0.75; // holds for note duration
        }
      }
      if(el.soundType==='FMStab'){
        const v=el.variation??0;
        const fires=hiSpeed?[0]:v===0||v===2?[0,8]:[0];
        if(fires.includes(beatStep)){
          const vp = tickVoicePhrase(el, beatStep, barCount);
          const freq = vp ? vp.freq : midiToFreq(noteToMidi(el.note||'A3'));
          scheduleFMStabNote(el, t, freq);
          el._pulse = vp ? vp.vel * 0.9 : 0.8;
        }
      }
      if(el.soundType==='FM3'){
        const fv=el.variation??0;
        const fires=fv===0?[0,8]:fv===1?[0]:fv===3?[0,8]:[0];
        if(fires.includes(beatStep)){
          const vp = tickVoicePhrase(el, beatStep, barCount);
          const freq = vp ? vp.freq : midiToFreq(noteToMidi(el.note||'A3'));
          scheduleFM3Note(el, t, freq);
          el._pulse = vp ? vp.vel * 0.9 : 0.8;
        }
      }
      if(el.soundType==='Acid'){
        // Acid uses its own phrase engine — independent of Sub bass phrase.
        // Acid is "gesture": busier, more accented, with filter motion.
        const phrase = getAcidPhrase();
        const epFreq = midiToFreq(noteToMidi(el.note||'A2'));
        if(phrase[beatStep]){
          // 303 accent system — accented steps get wider filter sweep + louder volume
          const av = el.variation ?? 0;
          const accentProb = av === 0 ? 0.30 : av === 1 ? 0.28 : av === 2 ? 0.22 : 0.25;
          el._acidAccent = Math.random() < accentProb;
          scheduleAcidNote(el, t, epFreq);
          el._pulse=0.8; el._flashPulse=0.6;
        }
      }
    });
    // Ring — route by role: voice variants fire on bar downbeat, rhythm variants use secondary perc sequencer
    if(beatStep===0){
      elements.forEach(el=>{
        if(el.syncMode==='sync'&&!el.muted&&el.soundType==='Ring'&&_soloAllows(el)){
          const role = getInstrumentRole(el);
          if(role === 'voice' || role === 'atmosphere') {
            scheduleRingOneShot(el, t);
            el._pulse=0.7; el._flashPulse=0.5;
          }
          // rhythm variants handled below in secondary perc block
        }
      });
    }
    // Laser — deep sweeps, fire on bar/half-bar boundaries, not every beat
    elements.forEach(el=>{
      if(el.syncMode!=='sync'||el.muted||el.soundType!=='Laser') return;
      const v=el.variation??0;
      const dp=drumPattern;
      let fire=false;

      if(v===0){
        if(beatStep===0) fire=true;
        else if(beatStep===8&&Math.random()<0.4) fire=true;
      } else if(v===1){
        if(beatStep===0) fire=true;
      } else if(v===2){
        if(beatStep===0) fire=true;
        else if(beatStep===8&&Math.random()<0.3) fire=true;
        else if(beatStep===4&&dp.clap[4]&&Math.random()<0.35) fire=true;
      } else {
        if(beatStep===0) fire=true;
        else if(beatStep===8&&dp.kick[8]&&Math.random()<0.5) fire=true;
      }

      if(fire){
        scheduleLaserOneShot(el, t);
        el._pulse=0.9; el._flashPulse=0.8;
      }
    });
    // ECHO-01: Phrase-aware Echo — sparse, deliberate throws at musical phrase points
    elements.forEach(el=>{
      if(el.syncMode!=='sync'||el.muted||el.soundType!=='Echo') return;
      const grammar=getGrammar();
      const phraseBar=barCount%grammar.formCycle;
      phraseAwareEchoTick(el, beatStep, t, barCount, phraseBar, grammar.formCycle);
    });

    // W6: Secondary Percussion Sequencer
    // Handles all rhythm-role canvas instruments: Conga, Ring/MetalPerc,
    // SFX/Shutter, SFX/Zap, Noise/SnareTex, Phys/Tabla, Phys/WoodBody
    elements.forEach(el=>{
      if(el.syncMode!=='sync'||el.muted||!_soloAllows(el)) return;
      if(getInstrumentRole(el) !== 'rhythm') return;
      if(['kick','clap','hihat','perc','snap'].includes(el.soundType?.toLowerCase())) return;
      tickSecondaryPerc(el, beatStep, t, drumPattern, barCount);
    });

    nextBeatTime+=stepDur;
    beatStep=(beatStep+1)%16;
    if(beatStep===0) onBarBoundary();
  }
  beatSchedulerTimer=setTimeout(runBeatScheduler,25);
}

let masterHPFNode = null;           // Web Audio HPF on master chain

function maybeStartDrone(el){
  if(!soundEnabled) return;
  // Never allow more than one active Growl -- two growls = mud
  if(el.soundType==='Acid'){
    const activeGrowls=elements.filter(e=>e.soundType==='Acid'&&e._droneNode&&e.id!==el.id);
    if(activeGrowls.length>0) return;
  }
  if(typeof applyRoleAndTriggerMode!=='undefined') applyRoleAndTriggerMode(el);
  if(el.syncMode==='free'){ensureAudio();startDrone(el);}
  else if(el.syncMode==='sync'&&beatEnabled){startDrone(el);}
}

