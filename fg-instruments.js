// fg-instruments.js — All instrument builders and note schedulers.
// buildDrone*, schedule*, drum synthesis, arp patterns, voice motifs.
// Depends on: fg-data.js, fg-state.js, fg-audio.js

function fireReverbThrow(el, maxBoost=0.72, decaySecs=4.5){
  if(!audioCtx||!el||!el._droneNode) return;
  const node=el._droneNode;
  // Build a dedicated throw gain node routed to reverb
  // We can't easily access the existing revSend so we create a parallel one
  const throwSend=audioCtx.createGain();
  throwSend.gain.setValueAtTime(0, audioCtx.currentTime);
  throwSend.gain.linearRampToValueAtTime(maxBoost, audioCtx.currentTime+0.08);
  throwSend.gain.setTargetAtTime(0, audioCtx.currentTime+0.12, decaySecs*0.28);
  if(node.gainNode && reverbNode){
    node.gainNode.connect(throwSend);
    throwSend.connect(reverbNode);
    // Auto-disconnect after tail
    setTimeout(()=>{ try{throwSend.disconnect();node.gainNode.disconnect(throwSend);}catch(e){} }, (decaySecs+1)*1000);
  }
  // Visual flash on the element
  el._flashPulse=0.6;
  el._reverbThrowActive=true;
  // Global throw-active flag — prevents overlapping throws on different elements.
  // Declared in fg-conductor.js; guarded for safety in case load order ever shifts.
  if(typeof window !== 'undefined') window._anyReverbThrowActive = true;
  setTimeout(()=>{
    el._reverbThrowActive=false;
    if(typeof window !== 'undefined') window._anyReverbThrowActive = false;
  }, decaySecs*1000);
}

function scheduleHatMuteBar(){
  if(_silencedHats) return;
  _silencedHats=true;
  _silenceSavedHats=[...drumPattern.hihat];
  drumPattern.hihat=Array(16).fill(0);
  // Restore after 1 bar (bar boundary fires in onBarBoundary)
  const restoreMs=(60000/bpm)*4;
  setTimeout(()=>{
    if(_silenceSavedHats){ drumPattern.hihat=[..._silenceSavedHats]; _silenceSavedHats=null; }
    _silencedHats=false;
  }, restoreMs);
}

function scheduleKickDropHalfBar(){
  if(_silencedKick) return;
  _silencedKick=true;
  _silenceSavedKick=[...drumPattern.kick];
  drumPattern.kick=Array(16).fill(0);
  const restoreMs=(60000/bpm)*2; // half bar
  setTimeout(()=>{
    if(_silenceSavedKick){ drumPattern.kick=[..._silenceSavedKick]; _silenceSavedKick=null; }
    _silencedKick=false;
  }, restoreMs);
}

function getElDepth(el){
  const y = el.y ?? 0.5;
  const r = Math.min(1, (el.radius ?? 0.25) / 0.40); // normalise: 0.40 = "medium" blob
  // Cutoff multiplier: top=2.2 (bright, open), centre=1.0, bottom=0.18 (very dark, distant)
  // Uses exponential curve so the bottom half darkens hard
  const cutoffMult = Math.pow(2.2, 1 - y * 1.85) + r * 0.12;
  // Reverb multiplier: top=0.2 (almost dry), centre=1.0, bottom=2.8 (very wet)
  const reverbMult = 0.2 + Math.pow(y, 0.7) * 2.6;
  // Gain attenuation: audible distance rolloff — bottom is noticeably quieter
  const gainAttn = 1.0 - y * 0.35;
  return { cutoffMult, reverbMult, gainAttn };
}

function buildDronePad(el,freq,vol,panVal){
  const now=audioCtx.currentTime;
  const _depth=getElDepth(el);
  const model=getSoundModel('Drone');
  const sx=(el.shape&&el.shape.x!=null?el.shape.x:0.5), sy=(el.shape&&el.shape.y!=null?el.shape.y:0.7);
  const tx=(el.tone&&el.tone.x!=null?el.tone.x:0.35), ty=(el.tone&&el.tone.y!=null?el.tone.y:0.1);
  const py=(el.space&&el.space.y!=null?el.space.y:0.4);
  const v=el.variation??0;
  const atkMult=model.attackMult??1.0;
  const brightMult=model.brightnessMult??1.0;
  const revBoost=model.reverbBoost??0;
  vol=vol*_depth.gainAttn;
  if(v===3){
    const intervals=[1, 1.189, 1.498, 2.0];
    const atkTime=(0.15+(1-sx)*2.5)*atkMult;
    const cutoff=Math.max(80,(300+tx*5000)*brightMult*_depth.cutoffMult);
    const filter=audioCtx.createBiquadFilter();
    filter.type='lowpass'; filter.frequency.value=cutoff; filter.Q.value=0.4+ty*3;
    filter.frequency.setValueAtTime(cutoff*0.4,now);
    filter.frequency.exponentialRampToValueAtTime(cutoff,now+atkTime*0.6);
    const gainNode=audioCtx.createGain();
    gainNode.gain.setValueAtTime(0,now);
    gainNode.gain.linearRampToValueAtTime(Math.min(0.25,vol*0.75),now+atkTime);
    const panner=audioCtx.createStereoPanner(); panner.pan.value=panVal;
    const sat=audioCtx.createWaveShaper(); sat.curve=makeSoftClip(); sat.oversample='2x';
    const oscs=[];
    intervals.forEach((ratio,i)=>{
      const o=audioCtx.createOscillator();
      o.type=i===0?'sawtooth':'triangle'; // root=saw, upper=triangle for blend
      o.frequency.value=freq*ratio;
      o.detune.value=(i-1.5)*4; // gentle detuning
      const g=audioCtx.createGain();
      g.gain.value=[0.45,0.3,0.25,0.18][i];
      o.connect(g); g.connect(sat); o.start(now); oscs.push(o);
    });
    sat.connect(filter); filter.connect(gainNode);
    return {oscs,gainNode,filterNode:filter,pannerNode:panner};
  }
  const atkTime=(0.3+(1-sx)*4.0)*atkMult;
  const cutoff=Math.max(80,(200+tx*6000)*brightMult*_depth.cutoffMult);
  const q=0.4+ty*3.5; // was ty*8 — too resonant, now gentler
  const detuneAmt=8+py*35;
  const filter=audioCtx.createBiquadFilter();
  filter.type='lowpass'; filter.frequency.value=cutoff; filter.Q.value=q;
  const sat=audioCtx.createWaveShaper(); sat.curve=makeSoftClip(); sat.oversample='2x';
  const lfo=audioCtx.createOscillator(); lfo.type='sine';
  const lfoG=audioCtx.createGain();
  lfo.frequency.value=0.025+py*0.08; // was 0.07+0.25 — much slower, breath-like
  lfoG.gain.value=cutoff*0.18*(0.2+ty); // was 0.25 — gentler filter movement
  lfo.connect(lfoG); lfoG.connect(filter.frequency); lfo.start(now);
  const ampLfo=audioCtx.createOscillator(); ampLfo.type='sine';
  const ampLfoG=audioCtx.createGain();
  ampLfo.frequency.value=0.05+py*0.10; // was 0.15+0.3 — much slower tremolo
  ampLfoG.gain.value=py*0.06;
  ampLfo.connect(ampLfoG); ampLfo.start(now);
  const gainNode=audioCtx.createGain();
  gainNode.gain.setValueAtTime(0,now);
  gainNode.gain.linearRampToValueAtTime(Math.min(0.25,vol*0.85),now+atkTime);
  ampLfoG.connect(gainNode.gain);
  const panner=audioCtx.createStereoPanner(); panner.pan.value=panVal;
  const oscs=[];
  const detunes=[-detuneAmt*1.5,-detuneAmt*0.6,0,detuneAmt*0.6,detuneAmt*1.5];
  const gains=[0.15,0.25,0.4,0.25,0.15];
  detunes.forEach((det,i)=>{
    const o=audioCtx.createOscillator(); o.type='sawtooth';
    o.frequency.value=freq; o.detune.value=det;
    const g=audioCtx.createGain(); g.gain.value=gains[i];
    o.connect(g); g.connect(sat); o.start(now); oscs.push(o);
  });
  const sub=audioCtx.createOscillator(); sub.type='sine';
  sub.frequency.value=freq/2;
  const subG=audioCtx.createGain(); subG.gain.value=0.2;
  sub.connect(subG); subG.connect(filter); sub.start(now); oscs.push(sub);
  sat.connect(filter); filter.connect(gainNode);
  if(revBoost!==0&&reverbGain&&audioCtx){
    const targetRev=Math.max(0,Math.min(1.0,(conductorParams.reverbAmt*0.62)+revBoost*0.4));
    reverbGain.gain.setTargetAtTime(targetRev,now,0.5);
  }
  return {oscs:[...oscs,lfo,ampLfo],gainNode,filterNode:filter,pannerNode:panner,lfoNode:lfo,lfoGain:lfoG};
}

function buildDroneSub(el,freq,vol,panVal){
  const now=audioCtx.currentTime;
  const model=getSoundModel('Sub');
  const sx=(el.shape&&el.shape.x!=null?el.shape.x:0.5), sy=(el.shape&&el.shape.y!=null?el.shape.y:0.8);
  const tx=(el.tone&&el.tone.x!=null?el.tone.x:0.3),  ty=(el.tone&&el.tone.y!=null?el.tone.y:0.2);
  const decayMult=model.decayMult??1.0;
  const warmth=model.warmth??0.0;
  const isMoving=model.moving??false;
  // Genre sub profile
  const sp = SUB_PROFILES[currentStyle] || SUB_PROFILES.deephouse;
  // B3: ambient/electronica/dubtechno get longer sustained sub — felt presence not a hit
  const SUB_TAIL_MULT = {ambienttechno:2.2, electronica:1.8, dubtechno:1.8, downtempo:1.6, italo:0.9};
  const genreTailMult = SUB_TAIL_MULT[currentStyle] ?? 1.0;
  const atkTime=0.001 * sp.atkMul;
  const pitchDecay=(0.04+(1-sy)*0.35) * sp.decayMul;
  const tailLen=(0.15+sy*2.5)*decayMult*genreTailMult;
  const pitchStart=freq*4;
  const hpf=audioCtx.createBiquadFilter();
  hpf.type='highpass'; hpf.frequency.value=20; hpf.Q.value=0.7;
  const filter=audioCtx.createBiquadFilter();
  filter.type='lowpass'; filter.frequency.value=(60+tx*300)*(1+warmth*0.8)*sp.filterMul; filter.Q.value=1.5+ty*3;
  // Genre-aware saturation curve
  const sat=audioCtx.createWaveShaper();
  const satDr = sp.satDrive;
  const sc=new Float32Array(256);
  for(let i=0;i<256;i++){const x=i*2/256-1;sc[i]=Math.tanh(x*1.6*satDr)/Math.tanh(1.6*satDr);}
  sat.curve=sc;
  const gainNode=audioCtx.createGain();
  gainNode.gain.setValueAtTime(0,now);
  gainNode.gain.linearRampToValueAtTime(Math.min(0.25,vol*1.0),now+atkTime);
  gainNode.gain.setTargetAtTime(0.001,now+tailLen*0.6,tailLen*0.3);
  const panner=audioCtx.createStereoPanner(); panner.pan.value=panVal;
  const o=audioCtx.createOscillator(); o.type=sp.wave;
  o.frequency.setValueAtTime(pitchStart,now);
  o.frequency.exponentialRampToValueAtTime(Math.max(20,freq),now+pitchDecay);
  if(isMoving){
    const subLfo=audioCtx.createOscillator(); subLfo.type='sine';
    subLfo.frequency.value=bpm/60/8; // synced to 8 bars
    const subLfoG=audioCtx.createGain(); subLfoG.gain.value=freq*0.08;
    subLfo.connect(subLfoG); subLfoG.connect(o.frequency); subLfo.start(now);
  }
  const harm2=audioCtx.createOscillator(); harm2.type='sine';
  harm2.frequency.setValueAtTime(pitchStart*2,now);
  harm2.frequency.exponentialRampToValueAtTime(Math.max(40,freq*2),now+pitchDecay);
  const harm2G=audioCtx.createGain(); harm2G.gain.value=sp.harmVol+warmth*0.1;
  const click=audioCtx.createOscillator(); click.type='triangle';
  click.frequency.setValueAtTime(pitchStart*1.5,now);
  click.frequency.exponentialRampToValueAtTime(freq*1.5,now+pitchDecay*0.5);
  const clickG=audioCtx.createGain();
  clickG.gain.setValueAtTime(vol*sp.clickVol,now);
  clickG.gain.exponentialRampToValueAtTime(0.001,now+0.05);
  o.connect(hpf); harm2.connect(harm2G);
  hpf.connect(filter); harm2G.connect(filter);
  filter.connect(sat); sat.connect(gainNode);
  click.connect(clickG); clickG.connect(gainNode);
  o.start(now); harm2.start(now); click.start(now);
  const stopT=now+tailLen+0.5;
  o.stop(stopT); harm2.stop(stopT); click.stop(stopT);
  return {oscs:[o,harm2,click],gainNode,filterNode:filter,pannerNode:panner};
}

function buildDroneGrowl(el,freq,vol,panVal){
  const now=audioCtx.currentTime;
  const model=getSoundModel('Acid');
  const sx=(el.shape&&el.shape.x!=null?el.shape.x:0.5);
  const tx=(el.tone&&el.tone.x!=null?el.tone.x:0.5), ty=(el.tone&&el.tone.y!=null?el.tone.y:0.4);
  const v=el.variation??0;
  const atkTime=0.002+(1-sx)*0.08;
  // Each variation gets a distinct filter character — not just subtle XY differences
  const ACID_VAR_PROFILES=[
    {cutoffBase:400,  cutoffRange:1200, resBase:0.8, resRange:1.2, envSpeed:0.08, waveform:'sawtooth', lfoAmt:0,    name:'Short Stab'}, // tight, closed
    {cutoffBase:800,  cutoffRange:2400, resBase:1.2, resRange:0.6, envSpeed:0.18, waveform:'sawtooth', lfoAmt:200,  name:'Slide'},      // mid, sliding
    {cutoffBase:300,  cutoffRange:3000, resBase:1.6, resRange:0.4, envSpeed:0.25, waveform:'sawtooth', lfoAmt:600,  name:'Wobble'},     // deep, wobbly
    {cutoffBase:1200, cutoffRange:4000, resBase:0.5, resRange:1.8, envSpeed:0.35, waveform:'sawtooth', lfoAmt:0,    name:'Open'},       // open, wide sweep
  ];
  const vp=ACID_VAR_PROFILES[v]||ACID_VAR_PROFILES[0];
  const cutoff=Math.max(80, vp.cutoffBase + tx*vp.cutoffRange);
  const resMult=model.resonanceMult??1.0;
  // B1: per-genre resonance ceiling — acid house allows full character,
  // everything else is tamer so Growl sits in the mix rather than drilling
  const GROWL_RES_CEILING = {
    acidhouse:    2.0, techhouse: 1.8, detroittechno: 1.8,
    hardcore:     1.4, hardtechno:1.2, dnb:       1.8, ukgarage:      1.6,
    deephouse:    1.4, dubtechno: 1.2, minimaltechno: 1.0,
    ambienttechno:0.9, downtempo: 1.0, electronica:   1.4,
    trance:       1.4, italo:     1.6,
  };
  const resCeiling = GROWL_RES_CEILING[currentStyle] ?? 1.6;
  const ladderRes=Math.min(resCeiling, vp.resBase + ty*vp.resRange);
  const envDecay=vp.envSpeed + tx*0.3;

  // B1: accent boost capped at 1.2 (was 1.45) — still punchy, not overwhelming
  const isAccent=model.accentEnable&&(Math.random()<0.28);
  const isSlide =model.slideEnable&&el._lastGrowlFreq&&(Math.random()<0.32);
  const prevFreq=el._lastGrowlFreq||freq;
  el._lastGrowlFreq=freq;
  const accentBoost=isAccent?1.10:1.0;

  // Build ladder filter (falls back to biquad if worklet not ready)
  const flt=buildLadderFilter(cutoff*3, ladderRes);

  // Post-filter limiter — hard ceiling regardless of resonance state
  const fltLimiter=audioCtx.createGain();
  fltLimiter.gain.value=0.55;

  // Filter envelope — open on attack, sweep to cutoff. Range capped to avoid resonant spike.
  const filterPeak=isAccent?Math.min(12000,cutoff*4):Math.min(8000,cutoff*2.5);
  flt.setCutoffNow(filterPeak);
  if(isAccent){
    flt.setCutoff(Math.max(80,cutoff*0.9), now+0.20);
  } else {
    flt.setCutoff(Math.max(80,cutoff), now+envDecay);
  }

  // Filter modulation LFO - disabled to avoid volume spikes from resonant peak sweep
  const lfo=audioCtx.createOscillator(); lfo.type='triangle';
  lfo.frequency.value=model.squelch?bpm/60/4:bpm/60/8;
  const lfoG=audioCtx.createGain();
  lfoG.gain.value=vp.lfoAmt; // Wobble gets 600Hz LFO depth, Slide 200Hz, others 0
  lfo.connect(lfoG);
  lfo.start(now);

  const gainNode=audioCtx.createGain();
  gainNode.gain.setValueAtTime(0,now);
  gainNode.gain.linearRampToValueAtTime(Math.min(0.12,vol*0.16*accentBoost),now+atkTime);
  // B1: high shelf tames harshness — deeper cut in non-acid genres
  const GROWL_SHELF_CUT = {
    acidhouse:-3, techhouse:-5, detroittechno:-5, hardcore:-4, dnb:-5,
    deephouse:-8, dubtechno:-9, ambienttechno:-11, minimaltechno:-10,
    downtempo:-9, electronica:-7, trance:-7, ukgarage:-6, italo:-6,
  };
  const shelfCut = GROWL_SHELF_CUT[currentStyle] ?? -6;
  const growlShelf=audioCtx.createBiquadFilter();
  growlShelf.type='highshelf';
  growlShelf.frequency.value=4500;
  growlShelf.gain.value=shelfCut;
  const panner=audioCtx.createStereoPanner(); panner.pan.value=panVal;

  // Oscillator source — sawtooth + square mix + unison saws
  const sat=audioCtx.createWaveShaper();
  const distAmt=model.squelch?(ty*1.0):(ty*0.7);
  sat.curve=makeAcidClip(distAmt); sat.oversample='4x';
  const sawRatio=Math.max(0,Math.min(1,1-ty));

  if(model.reeseMod||model.reeseLight){
    const detune=model.reeseMod?18:8;
    const oA=audioCtx.createOscillator(); oA.type='sawtooth'; oA.frequency.value=freq; oA.detune.value=-detune;
    const oB=audioCtx.createOscillator(); oB.type='sawtooth'; oB.frequency.value=freq; oB.detune.value=+detune;
    const oSub=audioCtx.createOscillator(); oSub.type='sine'; oSub.frequency.value=freq/2;
    const gA=audioCtx.createGain(); gA.gain.value=0.45;
    const gB=audioCtx.createGain(); gB.gain.value=0.45;
    const gSub=audioCtx.createGain(); gSub.gain.value=0.3;
    if(model.reeseMod){
      const reeselfo=audioCtx.createOscillator(); reeselfo.type='sine';
      reeselfo.frequency.value=bpm/60/4;
      const rlfog=audioCtx.createGain(); rlfog.gain.value=detune*0.8;
      reeselfo.connect(rlfog); rlfog.connect(oB.detune); reeselfo.start(now);
    }
    oA.connect(gA); oB.connect(gB); oSub.connect(gSub);
    gA.connect(sat); gB.connect(sat); gSub.connect(flt.input);
    sat.connect(flt.input); flt.output.connect(fltLimiter);fltLimiter.connect(growlShelf);growlShelf.connect(gainNode);
    oA.start(now); oB.start(now); oSub.start(now);
    return {oscs:[oA,oB,oSub,lfo],gainNode,filterNode:flt.node,pannerNode:panner,lfoNode:lfo,lfoGain:lfoG};
  }
  if(model.moogStyle){
    flt.setResonance(Math.min(2.0,ladderRes*0.5));
    flt.setCutoffNow(Math.min(3000,cutoff*0.6));
    const oSaw=audioCtx.createOscillator(); oSaw.type='sawtooth'; oSaw.frequency.value=freq;
    const oSaw2=audioCtx.createOscillator(); oSaw2.type='sawtooth'; oSaw2.frequency.value=freq; oSaw2.detune.value=-5;
    const oSub=audioCtx.createOscillator(); oSub.type='sine'; oSub.frequency.value=freq/2;
    const gS=audioCtx.createGain(); gS.gain.value=0.5;
    const gS2=audioCtx.createGain(); gS2.gain.value=0.35;
    const gSub=audioCtx.createGain(); gSub.gain.value=0.25;
    const msat=audioCtx.createWaveShaper();
    const mc=new Float32Array(256);
    for(let i=0;i<256;i++){const x=i*2/256-1;mc[i]=Math.tanh(x*1.2)/Math.tanh(1.2);}
    msat.curve=mc;
    oSaw.connect(gS); oSaw2.connect(gS2); oSub.connect(gSub);
    gS.connect(msat); gS2.connect(msat); gSub.connect(flt.input);
    msat.connect(flt.input); flt.output.connect(fltLimiter);fltLimiter.connect(growlShelf);growlShelf.connect(gainNode);
    oSaw.start(now); oSaw2.start(now); oSub.start(now);
    return {oscs:[oSaw,oSaw2,oSub,lfo],gainNode,filterNode:flt.node,pannerNode:panner,lfoNode:lfo,lfoGain:lfoG};
  }
  if(model.fmCharacter){
    const mod=audioCtx.createOscillator(); mod.type='sine'; mod.frequency.value=freq*2.5;
    const modG=audioCtx.createGain(); modG.gain.value=freq*(0.5+ty*3);
    modG.gain.exponentialRampToValueAtTime(modG.gain.value*0.1,now+0.3);
    const carrier=audioCtx.createOscillator(); carrier.type='sine'; carrier.frequency.value=freq;
    const fmsat=audioCtx.createWaveShaper(); fmsat.curve=makeAcidClip(0.4); fmsat.oversample='2x';
    mod.connect(modG); modG.connect(carrier.frequency);
    carrier.connect(flt.input); flt.output.connect(fmsat); fmsat.connect(gainNode);
    mod.start(now); carrier.start(now);
    return {oscs:[mod,carrier,lfo],gainNode,filterNode:flt.node,pannerNode:panner,lfoNode:lfo,lfoGain:lfoG};
  }
  if(model.subPulse){
    flt.setCutoffNow(Math.min(800,cutoff*0.35));
    flt.setResonance(0.3);
    const oSine=audioCtx.createOscillator(); oSine.type='sine'; oSine.frequency.value=freq;
    const oSine2=audioCtx.createOscillator(); oSine2.type='sine'; oSine2.frequency.value=freq*2; oSine2.detune.value=3;
    const g2=audioCtx.createGain(); g2.gain.value=0.12;
    oSine.connect(flt.input); oSine2.connect(g2); g2.connect(flt.input);
    flt.output.connect(fltLimiter);fltLimiter.connect(growlShelf);growlShelf.connect(gainNode);
    oSine.start(now); oSine2.start(now);
    return {oscs:[oSine,oSine2,lfo],gainNode,filterNode:flt.node,pannerNode:panner,lfoNode:lfo,lfoGain:lfoG};
  }

  // Main 303 / acid path — 4 oscillators through ladder filter
  const oSaw=audioCtx.createOscillator(); oSaw.type='sawtooth';
  const oSq=audioCtx.createOscillator(); oSq.type='square'; oSq.detune.value=2;
  const oSaw2=audioCtx.createOscillator(); oSaw2.type='sawtooth'; oSaw2.detune.value=-8;
  const oSaw3=audioCtx.createOscillator(); oSaw3.type='sawtooth'; oSaw3.detune.value=8;
  if(isSlide){
    const slideDur=(60/bpm)/4*0.85;
    [oSaw,oSq,oSaw2,oSaw3].forEach(o=>{
      o.frequency.setValueAtTime(prevFreq,now);
      o.frequency.linearRampToValueAtTime(freq,now+slideDur);
    });
  } else {
    [oSaw,oSq,oSaw2,oSaw3].forEach(o=>o.frequency.value=freq);
  }
  const sawG=audioCtx.createGain(); sawG.gain.value=sawRatio*0.5;
  const sqG=audioCtx.createGain(); sqG.gain.value=(1-sawRatio)*0.35;
  const uniG=audioCtx.createGain(); uniG.gain.value=sawRatio*0.2;
  oSaw.connect(sawG); oSq.connect(sqG); oSaw2.connect(uniG); oSaw3.connect(uniG);
  sawG.connect(sat); sqG.connect(sat); uniG.connect(sat);
  sat.connect(flt.input); flt.output.connect(fltLimiter);fltLimiter.connect(growlShelf);growlShelf.connect(gainNode);
  oSaw.start(now); oSq.start(now); oSaw2.start(now); oSaw3.start(now);
  return {oscs:[oSaw,oSq,oSaw2,oSaw3,lfo],gainNode,filterNode:flt.node,ladderStages:flt.stages,pannerNode:panner,lfoNode:lfo,lfoGain:lfoG};
}

function scheduleAcidNote(el, t, freq){
  if(!audioCtx) return;
  const v = el.variation ?? 0;
  const sx = el.shape?.x ?? 0.4;
  const tx = el.tone?.x  ?? 0.55;
  const ty = el.tone?.y  ?? 0.6;
  const vol = (el.volume ?? 0.7) * 0.38;
  const panVal = Math.max(-1, Math.min(1, (el.x - 0.5) * 1.5 + (el.pan || 0)));

  // 303 accent: wider filter sweep + louder hit
  const isAccent = !!el._acidAccent;
  const accentVolBoost = isAccent ? 1.20 : 1.0;
  const accentFilterBoost = isAccent ? 1.40 : 1.0;

  // Per-variation envelope
  const atkTime  = 0.002;
  const decayMap = [0.08 + sx * 0.14,   // v0 short
                    0.18 + sx * 0.28,    // v1 slide
                    0.22 + sx * 0.40,    // v2 wobble
                    0.28 + sx * 0.50];   // v3 open
  const decay = decayMap[v] ?? 0.12;

  // Filter envelope -- opens on attack then sweeps down
  const cutoffBase  = 200 + tx * 3200;
  const cutoffPeak  = Math.min(8000, cutoffBase * (2.5 + ty * 2.5)) * accentFilterBoost;
  const filterDecay = decay * (0.4 + ty * 0.5);
  const resonance   = 4 + ty * 12; // Q -- gives character without feedback

  const oSaw = audioCtx.createOscillator(); oSaw.type = 'sawtooth';
  const oSq  = audioCtx.createOscillator(); oSq.type  = 'square';

  // v1: pitch slide from previous note
  const prevFreq = _acidState.lastFreq || freq;
  if(v === 1 && prevFreq && prevFreq !== freq){
    const slideDur = decay * 0.55;
    [oSaw, oSq].forEach(o => {
      o.frequency.setValueAtTime(prevFreq, t);
      o.frequency.linearRampToValueAtTime(freq, t + slideDur);
    });
  } else {
    oSaw.frequency.value = freq;
    oSq.frequency.value  = freq;
  }
  _acidState.lastFreq = freq;
  oSq.detune.value = 3; // slight detune for thickness

  const sawG = audioCtx.createGain(); sawG.gain.value = 0.65;
  const sqG  = audioCtx.createGain(); sqG.gain.value  = 0.28;

  // Filter -- biquad lowpass only, no feedback
  const filt = audioCtx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.Q.value = resonance;
  filt.frequency.setValueAtTime(cutoffPeak, t);
  filt.frequency.exponentialRampToValueAtTime(Math.max(80, cutoffBase), t + filterDecay);

  // v2: slow LFO on filter for wobble
  let wobbleLfo = null;
  if(v === 2){
    wobbleLfo = audioCtx.createOscillator(); wobbleLfo.type = 'sine';
    wobbleLfo.frequency.value = 1.5 + sx * 3;
    const wobG = audioCtx.createGain(); wobG.gain.value = cutoffBase * 0.6;
    wobbleLfo.connect(wobG); wobG.connect(filt.frequency);
    wobbleLfo.start(t);
  }

  // Soft clip -- gentle, no harsh edges
  const sat = audioCtx.createWaveShaper();
  const satC = new Float32Array(256);
  for(let i = 0; i < 256; i++){
    const x = i * 2 / 256 - 1;
    satC[i] = Math.tanh(x * 1.6) / Math.tanh(1.6);
  }
  sat.curve = satC;

  const gainNode = audioCtx.createGain();
  const acidVol = vol * accentVolBoost;
  gainNode.gain.setValueAtTime(0, t);
  gainNode.gain.linearRampToValueAtTime(acidVol, t + atkTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t + decay);

  const panner = audioCtx.createStereoPanner(); panner.pan.value = panVal;
  const revSend = audioCtx.createGain();
  revSend.gain.value = (el.space?.x ?? 0.3) * 0.3;

  oSaw.connect(sawG); oSq.connect(sqG);
  sawG.connect(filt); sqG.connect(filt);
  filt.connect(sat); sat.connect(gainNode);
  gainNode.connect(panner);
  panner.connect(sidechainGain || compressor);
  if(reverbNode){ gainNode.connect(revSend); revSend.connect(reverbNode); }

  oSaw.start(t); oSq.start(t);
  const stopT = t + decay + 0.04;
  oSaw.stop(stopT); oSq.stop(stopT);
  if(wobbleLfo) wobbleLfo.stop(stopT);
  oSaw.onended = () => {
    try{ oSaw.disconnect(); oSq.disconnect(); sawG.disconnect(); sqG.disconnect();
         filt.disconnect(); sat.disconnect(); gainNode.disconnect();
         panner.disconnect(); revSend.disconnect();
         if(wobbleLfo) wobbleLfo.disconnect(); }catch(e){}
  };
}

function scheduleArpNote(el, t, freq, gate, vel, portamento){
  if(!audioCtx) return;
  const sx=(el.shape&&el.shape.x!=null?el.shape.x:0.4);
  const tx=(el.tone&&el.tone.x!=null?el.tone.x:0.4);
  const ty=(el.tone&&el.tone.y!=null?el.tone.y:0.2);
  const spx=(el.space&&el.space.x!=null?el.space.x:0.5);
  const velScale = vel ?? 1.0;
  const velJitter = 0.88 + Math.random()*0.12;
  const _depth = getElDepth(el);
  const vol = Math.min(0.45, (el.volume??0.65) * 0.60 * velScale * velJitter * _depth.gainAttn);
  const panVal = getElPan(el) + (Math.random()-0.5)*0.10;
  const gateAmt = gate ?? 0.85;
  const variation = el.variation ?? 0;
  const reverbAmt = spx * 0.75 * _depth.reverbMult;

  const panner = audioCtx.createStereoPanner(); panner.pan.value = panVal;
  const revSend = audioCtx.createGain(); revSend.gain.value = reverbAmt;

  if(variation === 0){
    // ── MOTIF: chameleon — bell wash, or driving melodic hook ────────────────
    // Bright genres get a detuned-saw lead-style voice that drives a 6-note
    // repeating hook. Warm genres keep the original sine-bell motif character.
    const isBrightLead = ['italo','trance','hardcore','hardtechno'].includes(currentStyle);

    if(isBrightLead){
      // Detuned saw hook synth — bright, present, sits over the chord pad
      const noteLen = 0.08 + sx*0.14;        // 0.08–0.22s
      const releaseTime = 0.06 + sx*0.10;
      const totalDur = noteLen + releaseTime;
      const detuneAmt = 4 + Math.random()*4;

      const filt = audioCtx.createBiquadFilter(); filt.type='lowpass';
      const baseCutoff = (900 + tx*4500) * _depth.cutoffMult;       // 900–5400Hz — bright lead, depth-darkened when low on canvas
      const peakCutoff = baseCutoff * (1.4 + ty*1.6);
      filt.Q.value = 1.0 + ty*1.8;
      filt.frequency.setValueAtTime(peakCutoff, t);
      filt.frequency.setTargetAtTime(baseCutoff, t+0.015, noteLen*0.35);

      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(vol, t+0.003);    // fast attack — plucky
      env.gain.setValueAtTime(vol*0.78, t+noteLen*0.5);
      env.gain.exponentialRampToValueAtTime(0.0001, t+totalDur);

      const o1 = audioCtx.createOscillator(); o1.type='sawtooth'; o1.frequency.value=freq;
      o1.detune.value = detuneAmt;
      const o2 = audioCtx.createOscillator(); o2.type='sawtooth'; o2.frequency.value=freq;
      o2.detune.value = -detuneAmt;
      // Soft saturation for character without harshness
      const sat = audioCtx.createWaveShaper();
      const sc = new Float32Array(256);
      for(let i=0;i<256;i++){const x=i*2/256-1; sc[i]=Math.tanh(x*1.5)/Math.tanh(1.5);}
      sat.curve = sc;
      const g1 = audioCtx.createGain(); g1.gain.value=0.5;
      const g2 = audioCtx.createGain(); g2.gain.value=0.5;

      o1.connect(g1); o2.connect(g2);
      g1.connect(filt); g2.connect(filt);
      filt.connect(sat); sat.connect(env); env.connect(panner);
      if(reverbNode){ env.connect(revSend); revSend.connect(reverbNode); }
      panner.connect(sidechainGain||compressor);

      const stopT = t+totalDur+0.05;
      [o1,o2].forEach(o=>{ o.start(t); o.stop(stopT); });
      o1.onended=()=>{try{o1.disconnect();o2.disconnect();g1.disconnect();g2.disconnect();filt.disconnect();sat.disconnect();env.disconnect();panner.disconnect();revSend.disconnect();}catch(e){}};

    } else if(['electronica','downtempo','deephouse'].includes(currentStyle)){
      // ── Mid-bright: triangle + filtered harmonics — pushes 1–4kHz without harshness ──
      // Inspired by Jellyfish/Mutualism: present mids, warm not sharp
      const decayTime = 0.35 + sx*1.2;   // 0.35–1.55s — medium length
      const attack    = 0.006 + sx*0.015;
      const noteLen   = 0.06 + sx*0.12;

      // Triangle fundamental — warm but has odd harmonics above fundamental
      const o1 = audioCtx.createOscillator(); o1.type='triangle'; o1.frequency.value=freq;
      // Soft sawtooth one octave up — adds the 1–4kHz harmonic series
      const o2 = audioCtx.createOscillator(); o2.type='sawtooth'; o2.frequency.value=freq*2;
      o2.detune.value = (Math.random()-0.5)*6;
      const g1 = audioCtx.createGain(); g1.gain.value=0.72;
      const g2 = audioCtx.createGain(); g2.gain.value=0.22; // present but not dominant

      // Filter sweeps open briefly on attack then settles — adds the 1–4kHz presence
      const filt = audioCtx.createBiquadFilter(); filt.type='lowpass';
      const peakF = freq * (4 + tx*6) * _depth.cutoffMult;   // depth-darkened when element is low
      const settleF = freq * (1.8 + tx*2.5) * _depth.cutoffMult; // settles at 1.8–4.3x — 1–4kHz zone
      filt.frequency.setValueAtTime(peakF, t);
      filt.frequency.setTargetAtTime(settleF, t+attack, decayTime*0.25);
      filt.Q.value = 0.6 + ty*0.8;

      // Soft saturation — rounds off the sawtooth for warmth not buzz
      const sat = audioCtx.createWaveShaper();
      const sc = new Float32Array(256);
      for(let i=0;i<256;i++){const x=i*2/256-1; sc[i]=Math.tanh(x*1.8)/Math.tanh(1.8);}
      sat.curve=sc;

      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(vol, t+attack);
      env.gain.exponentialRampToValueAtTime(0.0001, t+decayTime);

      o1.connect(g1); o2.connect(g2);
      g1.connect(filt); g2.connect(filt);
      filt.connect(sat); sat.connect(env); env.connect(panner);
      if(reverbNode){ env.connect(revSend); revSend.connect(reverbNode); }
      panner.connect(sidechainGain||compressor);

      const stopT = t+decayTime+0.08;
      o1.start(t); o2.start(t); o1.stop(stopT); o2.stop(stopT);
      o1.onended=()=>{try{o1.disconnect();o2.disconnect();g1.disconnect();g2.disconnect();filt.disconnect();sat.disconnect();env.disconnect();panner.disconnect();revSend.disconnect();}catch(e){}};

    } else {
      // ── Warm bell motif: clean sine + soft overtone, long tail ──────────────
      const decayTime = 0.8 + sx*2.2; // 0.8–3s — slow, breathing
      const attack = 0.008 + sx*0.02;

      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(vol, t+attack);
      env.gain.exponentialRampToValueAtTime(0.0001, t+decayTime);

      // Fundamental + soft overtone for warmth
      const o1 = audioCtx.createOscillator(); o1.type='sine'; o1.frequency.value=freq;
      const o2 = audioCtx.createOscillator(); o2.type='sine'; o2.frequency.value=freq*2.01;
      const g1 = audioCtx.createGain(); g1.gain.value=0.85;
      const g2 = audioCtx.createGain(); g2.gain.value=0.18;
      // Overtone fades faster — bell-like
      g2.gain.setValueAtTime(0.18, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t+decayTime*0.3);

      // Subtle pitch wobble — hand-struck quality
      const pitchWobble = audioCtx.createOscillator(); pitchWobble.type='sine';
      pitchWobble.frequency.value = 4.2 + Math.random()*2;
      const wobbleG = audioCtx.createGain(); wobbleG.gain.value = freq*0.003;
      pitchWobble.connect(wobbleG); wobbleG.connect(o1.frequency);

      o1.connect(g1); o2.connect(g2);
      g1.connect(env); g2.connect(env);
      env.connect(panner);
      if(reverbNode){ env.connect(revSend); revSend.connect(reverbNode); }
      panner.connect(sidechainGain||compressor);

      const stopT = t+decayTime+0.1;
      [o1,o2,pitchWobble].forEach(o=>{ o.start(t); o.stop(stopT); });
      o1.onended=()=>{try{o1.disconnect();o2.disconnect();g1.disconnect();g2.disconnect();pitchWobble.disconnect();wobbleG.disconnect();env.disconnect();panner.disconnect();revSend.disconnect();}catch(e){}};
    }

  } else if(variation === 1){
    // ── PULSE: single pitched hit, rhythmic not melodic ──────────────────────
    // Short, punchy. The rhythm is the point, not the note movement.
    const noteLen = 0.04 + sx*0.10; // deliberately short
    const releaseTime = 0.06 + sx*0.15;

    const filt = audioCtx.createBiquadFilter(); filt.type='bandpass';
    filt.frequency.value = freq * (1.2 + tx*1.5);
    filt.Q.value = 1.5 + ty*3;

    const env = audioCtx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vol*1.1, t+0.003);
    env.gain.exponentialRampToValueAtTime(0.0001, t+noteLen+releaseTime);

    const o1 = audioCtx.createOscillator(); o1.type='square'; o1.frequency.value=freq;
    const o2 = audioCtx.createOscillator(); o2.type='sine'; o2.frequency.value=freq;
    o2.detune.value = 5 + Math.random()*8;
    const g1 = audioCtx.createGain(); g1.gain.value=0.6;
    const g2 = audioCtx.createGain(); g2.gain.value=0.4;

    // Portamento: slides between hits
    if(portamento && el._arpLastFreq && el._arpLastFreq!==freq){
      o1.frequency.setValueAtTime(el._arpLastFreq, t);
      o1.frequency.linearRampToValueAtTime(freq, t+0.018);
    }
    el._arpLastFreq = freq;

    o1.connect(g1); o2.connect(g2); g1.connect(filt); g2.connect(filt);
    filt.connect(env); env.connect(panner);
    if(reverbNode){ env.connect(revSend); revSend.connect(reverbNode); }
    panner.connect(sidechainGain||compressor);

    const stopT = t+noteLen+releaseTime+0.05;
    o1.start(t); o2.start(t); o1.stop(stopT); o2.stop(stopT);
    o1.onended=()=>{try{o1.disconnect();o2.disconnect();g1.disconnect();g2.disconnect();filt.disconnect();env.disconnect();panner.disconnect();revSend.disconnect();}catch(e){}};

  } else if(variation === 2){
    // ── SHIMMER: chameleon — bright chord sparkle, or atmospheric wash ──────
    // Bright genres get a present, tighter sparkle with the genre's chord voicing.
    // Warm genres keep the airy wash, tightened slightly to read better.
    const isBrightLead = ['italo','trance','hardcore','hardtechno'].includes(currentStyle);

    if(isBrightLead){
      // Bright chord sparkle — short attack, present in the mix
      const decayTime = 0.30 + sx*0.50;     // 0.30–0.80s — tight
      const attack = 0.004 + sx*0.012;      // 4–16ms — fast attack
      const shimmerVol = vol * 0.85;        // present, not buried

      // Use the genre's chord voicing as interval set — actual harmony, not random ratios
      const voicing = getChordVoicing('Pulse', el);  // semitone offsets, e.g. [0,4,7,12,16] for italo
      const ratios = voicing.map(s => Math.pow(2, s/12));
      const detunes = voicing.map((_, i) => (i===0 ? 0 : (Math.random()-0.5)*8));
      const gains   = voicing.map((_, i) => i===0 ? 0.55 : 0.42 / (1 + i*0.4));

      // Filter sweep — opens during attack, settles during decay
      const filt = audioCtx.createBiquadFilter(); filt.type='lowpass';
      filt.frequency.setValueAtTime(freq*8, t);
      filt.frequency.setTargetAtTime(freq*(2.5+tx*1.5), t+attack, decayTime*0.4);
      filt.Q.value = 0.7+ty*1.0;

      const mix = audioCtx.createGain(); mix.gain.value=1.0;
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(shimmerVol, t+attack);
      env.gain.exponentialRampToValueAtTime(0.0001, t+decayTime);

      const oscs = ratios.map((ratio, i)=>{
        const o = audioCtx.createOscillator();
        // Lower partials use sawtooth (more present), top partials use triangle (softer sparkle)
        o.type = i < 2 ? 'sawtooth' : 'triangle';
        o.frequency.value = freq * ratio;
        o.detune.value = detunes[i];
        const g = audioCtx.createGain();
        g.gain.value = gains[i];
        o.connect(g); g.connect(mix);
        return {o, g};
      });

      mix.connect(filt); filt.connect(env); env.connect(panner);
      if(reverbNode){
        const rev = audioCtx.createGain(); rev.gain.value = Math.min(0.55, reverbAmt*0.85);
        env.connect(rev); rev.connect(reverbNode);
      }
      panner.connect(sidechainGain||compressor);

      const stopT = t+decayTime+0.1;
      oscs.forEach(({o,g})=>{ o.start(t); o.stop(stopT); });
      oscs[0].o.onended=()=>{try{oscs.forEach(({o,g})=>{o.disconnect();g.disconnect();});mix.disconnect();filt.disconnect();env.disconnect();panner.disconnect();}catch(e){}};

    } else {
      // ── Warm chord wash: detuned sines, big reverb, slow attack ─────────────
      // Tightened from previous: faster attack (was 120–370ms), shorter decay,
      // uses chord voicing intervals so it harmonizes correctly.
      const decayTime = 1.0 + sx*2.0;       // 1.0–3.0s (was 1.5–4.5)
      const attack = 0.050 + sx*0.150;      // 50–200ms (was 120–370)
      const shimmerVol = vol * 0.55;        // quieter than other modes

      // Use genre's chord voicing as ratios — actual chord tones, not random
      const voicing = getChordVoicing('Pulse', el);
      const ratios = voicing.map(s => Math.pow(2, s/12));
      const detunes = voicing.map((_, i) => (i===0 ? 0 : (Math.random()-0.5)*6));
      const gains   = voicing.map((_, i) => Math.max(0.20, 0.75 / (1 + i*0.55)));

      const mix = audioCtx.createGain(); mix.gain.value=1.0;
      const env = audioCtx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(shimmerVol, t+attack);
      env.gain.exponentialRampToValueAtTime(0.0001, t+decayTime);

      const oscs = ratios.map((ratio, i)=>{
        const o = audioCtx.createOscillator(); o.type='sine';
        o.frequency.value = freq * ratio;
        o.detune.value = detunes[i];
        const g = audioCtx.createGain();
        g.gain.value = gains[i];
        o.connect(g); g.connect(mix);
        return {o, g};
      });

      mix.connect(env); env.connect(panner);
      // Shimmer is mostly reverb in warm mode
      if(reverbNode){
        const bigRev = audioCtx.createGain(); bigRev.gain.value = Math.min(0.95, reverbAmt*1.4);
        env.connect(bigRev); bigRev.connect(reverbNode);
      }
      panner.connect(sidechainGain||compressor);

      const stopT = t+decayTime+0.1;
      oscs.forEach(({o,g})=>{ o.start(t); o.stop(stopT); });
      oscs[0].o.onended=()=>{try{oscs.forEach(({o,g})=>{o.disconnect();g.disconnect();});mix.disconnect();env.disconnect();panner.disconnect();}catch(e){}};
    }

  } else {
    // ── PHRASE: chameleon lead — warm long phrase, or bright plucky lead ─────
    // For italo/trance/hardcore-class genres: short notes, bright filter, fast
    // attack — the driving 16th-note lead that defines those genres.
    // For everything else: warm filtered saw, long notes, breathing phrase.
    const isBrightLead = ['italo','trance','hardcore','hardtechno'].includes(currentStyle);
    const noteLen = isBrightLead
      ? 0.05 + sx*0.10      // 0.05–0.15s — fits 16th notes at 124+ BPM
      : 0.15 + sx*0.45;     // 0.15–0.60s — warm phrase, breathes
    const releaseTime = isBrightLead
      ? 0.04 + sx*0.08
      : 0.10 + sx*0.25;
    const totalDur = noteLen + releaseTime;
    const detuneAmt = 3 + Math.random()*5;

    const filt = audioCtx.createBiquadFilter(); filt.type='lowpass';
    const baseCutoff = isBrightLead
      ? 800 + tx*4000       // 800–4800Hz — bright italo lead
      : 400 + tx*2500;      // 400–2900Hz — warm phrase
    const peakCutoff = baseCutoff * (1.5 + ty*2);
    filt.Q.value = isBrightLead ? 1.2 + ty*2.0 : 0.8 + ty*2.5;
    filt.frequency.setValueAtTime(peakCutoff, t);
    filt.frequency.setTargetAtTime(baseCutoff, t+0.02, noteLen*0.3);

    const env = audioCtx.createGain();
    env.gain.setValueAtTime(0, t);
    const attackTime = isBrightLead ? 0.003 : 0.012;
    env.gain.linearRampToValueAtTime(vol, t+attackTime);
    env.gain.setValueAtTime(vol*0.75, t+noteLen*0.6);
    env.gain.exponentialRampToValueAtTime(0.0001, t+totalDur);

    const o1 = audioCtx.createOscillator(); o1.type='sawtooth'; o1.frequency.value=freq;
    o1.detune.value = detuneAmt;
    const o2 = audioCtx.createOscillator(); o2.type='sawtooth'; o2.frequency.value=freq;
    o2.detune.value = -detuneAmt;
    const g1 = audioCtx.createGain(); g1.gain.value=0.55;
    const g2 = audioCtx.createGain(); g2.gain.value=0.45;

    if(portamento && el._arpLastFreq && el._arpLastFreq!==freq){
      const glide = 0.03 + Math.random()*0.02;
      o1.frequency.setValueAtTime(el._arpLastFreq, t);
      o1.frequency.linearRampToValueAtTime(freq, t+glide);
      o2.frequency.setValueAtTime(el._arpLastFreq, t);
      o2.frequency.linearRampToValueAtTime(freq, t+glide);
    }
    el._arpLastFreq = freq;

    const sat = audioCtx.createWaveShaper();
    const sc = new Float32Array(256);
    for(let i=0;i<256;i++){const x=i*2/256-1; sc[i]=Math.tanh(x*1.6)/Math.tanh(1.6);}
    sat.curve = sc;

    o1.connect(g1); o2.connect(g2); g1.connect(filt); g2.connect(filt);
    filt.connect(sat); sat.connect(env); env.connect(panner);
    if(reverbNode){ env.connect(revSend); revSend.connect(reverbNode); }
    panner.connect(sidechainGain||compressor);

    const stopT = t+totalDur+0.05;
    o1.start(t); o2.start(t); o1.stop(stopT); o2.stop(stopT);
    o1.onended=()=>{try{o1.disconnect();o2.disconnect();g1.disconnect();g2.disconnect();filt.disconnect();sat.disconnect();env.disconnect();panner.disconnect();revSend.disconnect();}catch(e){}};
  }

  const delay = Math.max(0,(t-audioCtx.currentTime)*1000);
  setTimeout(()=>{el._pulse=0.5;el._flashPulse=0.3;},delay);
}

function buildDronePulse(el,freq,vol,panVal){
  const now=audioCtx.currentTime;
  const sx=(el.shape&&el.shape.x!=null?el.shape.x:0.35);  // shape.x: left=short stab, right=long pad
  const tx=(el.tone&&el.tone.x!=null?el.tone.x:0.55);   // tone.x: dark → bright
  const ty=(el.tone&&el.tone.y!=null?el.tone.y:0.35);   // tone.y: clean → resonant
  // Phase 4: genre-aware chord voicing
  const semitones=getChordVoicing('Pulse', el);
  const notes=voicingToFreqs(freq, semitones);
  const gateLen=0.08+Math.pow(sx,1.5)*1.1;
  const attack=0.004+sx*0.025;   // snappy attack on stabs, soft on pads
  const release=0.06+sx*0.35;    // short tail on stabs, long fade on pads
  const baseCutoff=300+Math.pow(tx,1.4)*4500;
  const filter=audioCtx.createBiquadFilter();
  filter.type='lowpass';
  filter.Q.value=0.5+ty*6;       // subtle resonance — never self-oscillating
  filter.frequency.setValueAtTime(Math.min(18000,baseCutoff*(2+tx*3)),now);
  filter.frequency.exponentialRampToValueAtTime(Math.max(150,baseCutoff),now+attack+0.04);
  const gainNode=audioCtx.createGain();
  gainNode.gain.setValueAtTime(0,now);
  gainNode.gain.linearRampToValueAtTime(Math.min(0.25,vol*0.72),now+attack);
  gainNode.gain.setTargetAtTime(vol*0.55,now+attack,gateLen*0.3); // slight sustain dip
  gainNode.gain.setTargetAtTime(0.001,now+gateLen,release*0.5);
  const sat=audioCtx.createWaveShaper();
  const wsCurve=new Float32Array(256);
  for(let i=0;i<256;i++){
    const x=i*2/256-1;
    wsCurve[i]=Math.tanh(x*1.8)/Math.tanh(1.8); // very gentle soft clip
  }
  sat.curve=wsCurve;
  const panner=audioCtx.createStereoPanner();
  panner.pan.value=panVal;
  const detunes=[-6,-2,0,3,7]; // chorus-like spread
  const oscs=[];
  notes.forEach((f,i)=>{
    const o=audioCtx.createOscillator();
    o.type=sx<0.4?'sawtooth':'triangle';
    o.frequency.value=f;
    o.detune.value=(detunes[i]||0);
    const g=audioCtx.createGain();
    g.gain.value=i===0?0.55:i===1?0.35:0.22;
    o.connect(g); g.connect(sat);
    o.start(now);
    o.stop(now+gateLen+release+0.1);
    oscs.push(o);
  });
  sat.connect(filter);
  filter.connect(gainNode);
  return {oscs, gainNode, filterNode:filter, pannerNode:panner};
}

function buildDroneRing(el,freq,vol,panVal){
  const now=audioCtx.currentTime;
  const sx=(el.shape&&el.shape.x!=null?el.shape.x:0.3), sy=(el.shape&&el.shape.y!=null?el.shape.y:0.5);
  const tx=(el.tone&&el.tone.x!=null?el.tone.x:0.5), ty=(el.tone&&el.tone.y!=null?el.tone.y:0.3);
  const v=el.variation??0;
  const atkTime=0.002+sx*0.025;
  const decayTime=v<2?0.8+sy*3.5:0.3+sy*1.5; // longer decay — was 0.4+2.2, more ring
  const fmRatios=[[1,2.756],[1,5.4],[1,1.414],[1,8.93]];
  const [carRatio,modRatio]=fmRatios[v]||fmRatios[0];
  // FM depth reduced — was freq*(0.2+ty*2.5), now much gentler for less harshness
  const fmDepth=freq*(0.08+ty*0.9)*(getSoundModel('Ring').fmDepthMult??1.0);
  const filterFreq=v===2?freq*1.5:v===3?freq*0.8:freq*2;
  const filter=audioCtx.createBiquadFilter();
  filter.type='bandpass'; filter.frequency.value=filterFreq;
  filter.Q.value=1.2+tx*2.5; // was 3.5 — softer

  const gainNode=audioCtx.createGain();
  gainNode.gain.setValueAtTime(0,now);
  gainNode.gain.linearRampToValueAtTime(Math.min(0.25,vol*0.85),now+atkTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001,now+atkTime+decayTime);
  const panner=audioCtx.createStereoPanner(); panner.pan.value=panVal;

  const mod=audioCtx.createOscillator(); mod.type='sine';
  mod.frequency.value=freq*modRatio;
  const modG=audioCtx.createGain();
  modG.gain.setValueAtTime(fmDepth,now);
  modG.gain.exponentialRampToValueAtTime(Math.max(0.001,fmDepth*0.04),now+decayTime*0.3);
  const carrier=audioCtx.createOscillator(); carrier.type='sine';
  carrier.frequency.value=freq*carRatio;

  if(v===1||v===3){
    const mod2=audioCtx.createOscillator(); mod2.type='sine';
    mod2.frequency.value=freq*modRatio*1.41;
    const mod2G=audioCtx.createGain();
    mod2G.gain.setValueAtTime(fmDepth*0.35,now);
    mod2G.gain.exponentialRampToValueAtTime(0.001,now+decayTime*0.2);
    mod2.connect(mod2G); mod2G.connect(carrier.frequency);
    mod2.start(now); mod2.stop(now+decayTime+0.1);
  }

  // Warm sine body underneath — gives the bell warmth and physical weight
  const body=audioCtx.createOscillator(); body.type='sine';
  body.frequency.value=freq;
  const bodyG=audioCtx.createGain();
  bodyG.gain.setValueAtTime(vol*0.25,now);
  bodyG.gain.exponentialRampToValueAtTime(0.0001,now+decayTime*0.8);
  body.connect(bodyG); bodyG.connect(gainNode);

  mod.connect(modG); modG.connect(carrier.frequency);
  carrier.connect(filter); filter.connect(gainNode);
  const stopT=now+atkTime+decayTime+0.05;
  mod.start(now); carrier.start(now); body.start(now);
  mod.stop(stopT); carrier.stop(stopT); body.stop(stopT);
  return {oscs:[mod,carrier,body],gainNode,filterNode:filter,pannerNode:panner};
}

function buildDroneNoise(el,freq,vol,panVal){
  const now=audioCtx.currentTime;
  const sx=(el.shape&&el.shape.x!=null?el.shape.x:0.5), sy=(el.shape&&el.shape.y!=null?el.shape.y:0.7);
  const tx=(el.tone&&el.tone.x!=null?el.tone.x:0.4),  ty=(el.tone&&el.tone.y!=null?el.tone.y:0.3);
  const v=el.variation??0;
  const panner=audioCtx.createStereoPanner(); panner.pan.value=panVal;
  const gainNode=audioCtx.createGain(); gainNode.gain.setValueAtTime(0,now);
  if(v===2){
    const atkTime=0.8+(1-sx)*6.0;
    gainNode.gain.linearRampToValueAtTime(vol*0.55,now+atkTime);
    const filter=audioCtx.createBiquadFilter();
    filter.type='bandpass'; filter.Q.value=1.5+ty*4;
    filter.frequency.setValueAtTime(80+tx*200,now);
    filter.frequency.exponentialRampToValueAtTime(Math.min(12000,800+tx*10000),now+atkTime);
    const hpf=audioCtx.createBiquadFilter(); hpf.type='highpass';
    hpf.frequency.setValueAtTime(60,now);
    hpf.frequency.exponentialRampToValueAtTime(2000+tx*6000,now+atkTime);
    const src=audioCtx.createBufferSource(); src.buffer=noiseBuffer; src.loop=true;
    src.connect(hpf); hpf.connect(filter); filter.connect(gainNode);
    gainNode.connect(panner); panner.connect(sidechainGain||compressor);
    src.start(now);
    return {oscs:[src],gainNode,filterNode:filter,pannerNode:panner,extraNodes:[hpf]};
  }
  if(v===3){
    const atkTime=0.001;
    const cutoff=2000+tx*8000;
    gainNode.gain.setValueAtTime(0,now);
    gainNode.gain.linearRampToValueAtTime(vol*0.45,now+atkTime);
    const hpf=audioCtx.createBiquadFilter(); hpf.type='highpass';
    hpf.frequency.value=cutoff; hpf.Q.value=0.5+ty*3;
    const filter=audioCtx.createBiquadFilter(); filter.type='peaking';
    filter.frequency.value=cutoff*1.5; filter.gain.value=6; filter.Q.value=2;
    const trem=audioCtx.createOscillator(); trem.type='square';
    trem.frequency.value=(bpm/60)*4;
    const tremG=audioCtx.createGain(); tremG.gain.value=vol*0.2;
    trem.connect(tremG); tremG.connect(gainNode.gain); trem.start(now);
    const src=audioCtx.createBufferSource(); src.buffer=noiseBuffer; src.loop=true;
    src.connect(hpf); hpf.connect(filter); filter.connect(gainNode);
    gainNode.connect(panner); panner.connect(sidechainGain||compressor);
    src.start(now);
    return {oscs:[src,trem],gainNode,filterNode:filter,pannerNode:panner,lfoNode:trem,extraNodes:[hpf,tremG]};
  }
  const atkTime=0.3+(1-sx)*3.5;
  const cutoff=v===1?60+tx*1500:120+tx*5000; // Wind is darker
  const q=0.8+ty*(v===1?6:12);
  const filter=audioCtx.createBiquadFilter();
  filter.type='bandpass'; filter.frequency.value=cutoff; filter.Q.value=q;
  const filter2=audioCtx.createBiquadFilter();
  filter2.type='highpass'; filter2.frequency.value=cutoff*0.3; filter2.Q.value=0.7;
  const lfo=audioCtx.createOscillator(); lfo.type='sine';
  const lfoG=audioCtx.createGain();
  lfo.frequency.value=v===1?0.02+sy*0.08:0.05+sy*0.35;
  lfoG.gain.value=cutoff*(v===1?0.3:0.55);
  lfo.connect(lfoG); lfoG.connect(filter.frequency); lfo.start(now);
  gainNode.gain.linearRampToValueAtTime(vol*0.6,now+atkTime);
  const src=audioCtx.createBufferSource(); src.buffer=noiseBuffer; src.loop=true;
  src.connect(filter2); filter2.connect(filter); filter.connect(gainNode);
  src.start(now);
  return {oscs:[src,lfo],gainNode,filterNode:filter,pannerNode:panner,lfoNode:lfo,lfoGain:lfoG,extraNodes:[filter2]};
}

function scheduleEPNote(el, t, freq, velocity){
  if(!audioCtx) return;
  const v=el.variation??0;
  const sx=(el.shape&&el.shape.x!=null?el.shape.x:0.35);
  const tx=(el.tone&&el.tone.x!=null?el.tone.x:0.5), ty=(el.tone&&el.tone.y!=null?el.tone.y:0.35);
  const vol=(el.volume??0.65)*0.48;
  const panVal=getElPan(el);
  const _depth=getElDepth(el);
  const decay=v===2?0.3+sx*1.2:v===3?0.25+sx*0.9:0.5+sx*2.0;
  const attack=0.004+sx*0.012; // softer — was 0.001, now 4–16ms

  // Velocity-scaled FM depth: soft = warm bell (0.4x), hard = bark/growl (1.2x)
  const velScale = velocity ?? 0.7;
  const fmVelMul = 0.4 + velScale * 0.8;

  // FM depths reduced significantly — real Rhodes is subtle FM, not aggressive
  const configs=[
    {modRatio:2.756, fmDepth:(0.18+ty*0.65)*fmVelMul, filterCutoff:(1800+tx*3000)*_depth.cutoffMult}, // Rhodes Warm
    {modRatio:3.5,   fmDepth:(0.25+ty*0.90)*fmVelMul, filterCutoff:(2500+tx*4000)*_depth.cutoffMult}, // Rhodes Bright
    {modRatio:14.0,  fmDepth:(0.12+ty*0.50)*fmVelMul, filterCutoff:(4000+tx*5000)*_depth.cutoffMult}, // DX7 Bell
    {modRatio:1.414, fmDepth:(0.30+ty*0.80)*fmVelMul, filterCutoff:(1200+tx*2500)*_depth.cutoffMult}, // Wurlitzer
  ];
  const cfg=configs[v]||configs[0];
  const semitones=getChordVoicing('EP', el);

  // Softer click — triangle not square, much quieter
  const click=audioCtx.createOscillator();
  click.type='triangle';
  click.frequency.setValueAtTime(freq*3.2,t);
  click.frequency.exponentialRampToValueAtTime(freq*0.8,t+0.010);
  const clickG=audioCtx.createGain();
  clickG.gain.setValueAtTime(vol*0.18,t); // was 0.6 — much softer
  clickG.gain.exponentialRampToValueAtTime(0.0001,t+0.022);

  const filter=audioCtx.createBiquadFilter();
  filter.type='lowpass'; filter.frequency.value=cfg.filterCutoff; filter.Q.value=0.4;

  // Gentle warmth saturation
  const sat=audioCtx.createWaveShaper();
  const sc=new Float32Array(256);
  for(let i=0;i<256;i++){const x=i*2/256-1;sc[i]=Math.tanh(x*1.5)/Math.tanh(1.5);}
  sat.curve=sc;

  const gainNode=audioCtx.createGain();
  gainNode.gain.setValueAtTime(0,t);
  gainNode.gain.linearRampToValueAtTime(vol,t+attack);
  gainNode.gain.exponentialRampToValueAtTime(vol*0.72,t+0.025);
  gainNode.gain.exponentialRampToValueAtTime(0.0001,t+decay);
  const panner=audioCtx.createStereoPanner(); panner.pan.value=panVal;

  semitones.forEach((st, i)=>{
    const vFreq = freq * Math.pow(2, st/12);
    const mod=audioCtx.createOscillator(); mod.type='sine';
    mod.frequency.value=vFreq*cfg.modRatio;
    const modG=audioCtx.createGain();
    // FM depth as absolute semitone equivalent — more musical scaling
    const depthHz=vFreq*cfg.fmDepth;
    modG.gain.setValueAtTime(depthHz,t);
    modG.gain.exponentialRampToValueAtTime(Math.max(0.001,depthHz*0.05),t+decay*0.4);
    modG.gain.exponentialRampToValueAtTime(0.001,t+decay);
    const carrier=audioCtx.createOscillator(); carrier.type='sine';
    carrier.frequency.value=vFreq;
    const vG=audioCtx.createGain(); vG.gain.value=i===0?0.55:0.28;
    mod.connect(modG); modG.connect(carrier.frequency);
    carrier.connect(vG); vG.connect(sat);
    mod.start(t); carrier.start(t);
    mod.stop(t+decay+0.05); carrier.stop(t+decay+0.05);
    mod.onended=()=>{ try{mod.disconnect();modG.disconnect();}catch(e){} };
    carrier.onended=()=>{ try{carrier.disconnect();vG.disconnect();}catch(e){} };
  });

  click.connect(clickG);
  sat.connect(filter); filter.connect(gainNode);
  clickG.connect(gainNode);
  gainNode.connect(panner);
  click.connect(clickG); clickG.connect(panner);
  const revSend=audioCtx.createGain();
  revSend.gain.value=((el.space&&el.space.x!=null?el.space.x:0.4))*0.6*_depth.reverbMult;
  if(reverbNode){gainNode.connect(revSend);revSend.connect(reverbNode);}
  panner.connect(sidechainGain||compressor);
  const stopT2=t+decay+0.1;
  click.onended=()=>{ try{click.disconnect();clickG.disconnect();}catch(e){} };
  setTimeout(()=>{
    try{filter.disconnect();gainNode.disconnect();panner.disconnect();revSend.disconnect();}catch(e){}
  },(stopT2-audioCtx.currentTime+0.1)*1000);
  const delay=Math.max(0,(t-audioCtx.currentTime)*1000);
  setTimeout(()=>{el._pulse=0.8;el._flashPulse=0.6;},delay);
}

function scheduleFM3Note(el,t,freq){
  if(!audioCtx) return;
  const v=el.variation??0;
  const sx=el.shape?.x??0.35,tx=el.tone?.x??0.45,ty=el.tone?.y??0.35;
  const vol=Math.min(0.25,(el.volume??0.65)*0.38);
  const panVal=getElPan(el);
  const ALGOS=[
    {decay:0.8+sx*2.5,attack:0.003+sx*0.015,op1:{ratio:14.0,idx:ty*3.5+0.8,decay:0.4},op2:{ratio:1.0,idx:ty*2.0+0.5,decay:0.8},car:{ratio:1.0}},
    {decay:1.8+sx*4.0,attack:0.001,op1:{ratio:2.756,idx:ty*4.0+1.0,decay:0.6},op2:{ratio:9.722,idx:ty*1.5+0.3,decay:0.3},car:{ratio:1.0}},
    {decay:0.3+sx*1.2,attack:0.002+sx*0.01,op1:{ratio:3.5,idx:ty*5.0+1.5,decay:0.15},op2:{ratio:1.0,idx:ty*2.0+1.0,decay:0.3},car:{ratio:0.5}},
    {decay:0.6+sx*2.0,attack:0.015+sx*0.06,op1:{ratio:2.0,idx:ty*6.0+2.0,decay:0.5},op2:{ratio:4.0,idx:ty*1.0+0.2,decay:0.2},car:{ratio:1.0}},
  ];
  const algo=ALGOS[v]||ALGOS[0];
  const chord=getChordVoicing('EP', el);
  const gainNode=audioCtx.createGain();
  gainNode.gain.setValueAtTime(0,t);
  gainNode.gain.linearRampToValueAtTime(vol,t+algo.attack);
  gainNode.gain.exponentialRampToValueAtTime(vol*0.6,t+algo.attack*3);
  gainNode.gain.exponentialRampToValueAtTime(0.0001,t+algo.decay);
  const filter=audioCtx.createBiquadFilter();
  filter.type='lowpass'; filter.frequency.value=800+tx*5000; filter.Q.value=0.3+ty*0.8;
  filter.frequency.setValueAtTime((800+tx*5000)*1.8,t);
  filter.frequency.exponentialRampToValueAtTime(800+tx*2000,t+algo.decay*0.4);
  const panner=audioCtx.createStereoPanner(); panner.pan.value=panVal;
  chord.forEach((st,ci)=>{
    const vFreq=freq*Math.pow(2,st/12);
    const op1=audioCtx.createOscillator(); op1.type='sine'; op1.frequency.value=vFreq*algo.op1.ratio;
    const op1G=audioCtx.createGain();
    const op1depth=vFreq*algo.op1.idx;
    op1G.gain.setValueAtTime(op1depth,t);
    op1G.gain.exponentialRampToValueAtTime(Math.max(0.001,op1depth*0.02),t+algo.op1.decay);
    op1G.gain.exponentialRampToValueAtTime(0.0001,t+algo.decay);
    const op2=audioCtx.createOscillator(); op2.type='sine'; op2.frequency.value=vFreq*algo.op2.ratio;
    const op2G=audioCtx.createGain();
    const op2depth=vFreq*algo.op2.idx;
    op2G.gain.setValueAtTime(op2depth,t);
    op2G.gain.exponentialRampToValueAtTime(Math.max(0.001,op2depth*0.05),t+algo.op2.decay);
    op2G.gain.exponentialRampToValueAtTime(0.0001,t+algo.decay);
    const car=audioCtx.createOscillator(); car.type='sine'; car.frequency.value=vFreq*algo.car.ratio;
    const vG=audioCtx.createGain(); vG.gain.value=ci===0?1.0:0.4;
    if(v===0){op1.connect(op1G);op1G.connect(op2.frequency);op2.connect(op2G);op2G.connect(car.frequency);}
    else{op1.connect(op1G);op1G.connect(car.frequency);op2.connect(op2G);op2G.connect(car.frequency);}
    car.connect(vG); vG.connect(filter);
    const stopT=t+algo.decay+0.1;
    op1.start(t);op1.stop(stopT);op2.start(t);op2.stop(stopT);car.start(t);car.stop(stopT);
  });
  filter.connect(gainNode); gainNode.connect(panner);
  panner.connect(sidechainGain||compressor);
  if(reverbNode){const rs=audioCtx.createGain();rs.gain.value=0.5;gainNode.connect(rs);rs.connect(reverbNode);}
}

function scheduleFMStabNote(el, t, freq){
  if(!audioCtx) return;
  const v=el.variation??0;
  const sx=(el.shape&&el.shape.x!=null?el.shape.x:0.15);
  const tx=(el.tone&&el.tone.x!=null?el.tone.x:0.55), ty=(el.tone&&el.tone.y!=null?el.tone.y:0.6);
  const vol=(el.volume??0.65)*0.42; // slightly lower than before
  const panVal=getElPan(el);
  const _depth=getElDepth(el);
  const gateLen=0.04+sx*0.18;
  const attack=0.006+sx*0.008; // shape-dependent attack — slower for longer stabs
  const release=0.06+sx*0.14;
  const chordConfigs=[
    [[1,0],[1.189,-5],[1.498,5],[1.782,-3]],
    [[1,0],[1.059,-8],[1.122,8],[1.498,0]],
    [[1,0],[2,0],[3,-3],[4,3]],
    [[1,0],[1.333,0],[1.498,-4],[2,4]],
  ];
  const voices=chordConfigs[v]||chordConfigs[0];
  // Cap FM depth — was ty*5 which caused piercing harmonics at high ty values
  const fmRatios=[2.8, 5.5, 1.8, 3.5];  // reduced from [3.5,7.0,2.0,4.5]
  const fmDepths=[ty*1.8, ty*2.5, ty*1.0, ty*1.6]; // reduced from ty*3/5/1.5/2.5
  const fmRatio=fmRatios[v]||2.8;
  const fmDepth=fmDepths[v]||ty*1.8;
  const gainNode=audioCtx.createGain();
  gainNode.gain.setValueAtTime(0,t);
  gainNode.gain.linearRampToValueAtTime(vol,t+attack);
  gainNode.gain.setTargetAtTime(vol*0.45,t+attack,gateLen*0.25);
  gainNode.gain.setTargetAtTime(0.0001,t+gateLen,release*0.35);
  // Softer filter — was 800+tx*8000, now capped lower to reduce harshness; depth darkens distant stabs
  const filter=audioCtx.createBiquadFilter();
  filter.type='lowpass';
  filter.frequency.value=Math.min(5500, (600+tx*5000)*_depth.cutoffMult);
  filter.Q.value=0.4+ty*1.2; // was 0.5+ty*2 — less resonance
  // Soft clip to round off FM harshness
  const sat=audioCtx.createWaveShaper();
  const sc=new Float32Array(256);
  for(let i=0;i<256;i++){const x=i*2/256-1;sc[i]=Math.tanh(x*1.4)/Math.tanh(1.4);}
  sat.curve=sc;
  const panner=audioCtx.createStereoPanner(); panner.pan.value=panVal;
  const stopT=t+gateLen+release+0.06;
  voices.forEach(([ratio,detune])=>{
    const vFreq=freq*ratio;
    const mod=audioCtx.createOscillator(); mod.type='sine';
    mod.frequency.value=vFreq*fmRatio;
    const modG=audioCtx.createGain();
    modG.gain.setValueAtTime(vFreq*fmDepth,t);
    modG.gain.exponentialRampToValueAtTime(vFreq*fmDepth*0.04,t+gateLen);
    const carrier=audioCtx.createOscillator(); carrier.type='sine';
    carrier.frequency.value=vFreq;
    carrier.detune.value=detune;
    const vG=audioCtx.createGain(); vG.gain.value=0.26;
    mod.connect(modG); modG.connect(carrier.frequency);
    carrier.connect(vG); vG.connect(sat);
    mod.start(t); carrier.start(t);
    mod.stop(stopT); carrier.stop(stopT);
    // Disconnect after stop to prevent node accumulation
    mod.onended=()=>{ try{mod.disconnect();modG.disconnect();}catch(e){} };
    carrier.onended=()=>{ try{carrier.disconnect();vG.disconnect();}catch(e){} };
  });
  sat.connect(filter); filter.connect(gainNode); gainNode.connect(panner);
  const revSend=audioCtx.createGain();
  revSend.gain.value=((el.space&&el.space.x!=null?el.space.x:0.25))*0.35*_depth.reverbMult;
  if(reverbNode){gainNode.connect(revSend);revSend.connect(reverbNode);}
  panner.connect(sidechainGain||compressor);
  // Cleanup
  setTimeout(()=>{
    try{sat.disconnect();filter.disconnect();gainNode.disconnect();
        panner.disconnect();revSend.disconnect();}catch(e){}
  },(stopT-audioCtx.currentTime+0.2)*1000);
  const delay=Math.max(0,(t-audioCtx.currentTime)*1000);
  setTimeout(()=>{el._pulse=0.9;el._flashPulse=0.7;},delay);
}

function schedulePluckNote(el, t, freq){
  if(!audioCtx||!noiseBuffer) return;
  const v=el.variation??0;
  const sx=el.shape?.x??0.18, tx=el.tone?.x??0.60, ty=el.tone?.y??0.20;
  const vol=(el.volume??0.65)*0.52;
  const panVal=getElPan(el);
  const _depth=getElDepth(el);
  const model=getSoundModel('Pluck')||{};
  const brightScale=model.brightness??1.0;
  const brightness=Math.min(8000,(300+tx*5000)*brightScale*_depth.cutoffMult); // depth darkens distant plucks
  const sustain=Math.min(0.92, 0.84+sx*0.08); // was 0.86 — longer ring
  const decayTime=Math.max(0.05, Math.min(3.0, (0.15+sx*1.8)*(model.decay??1.0)));
  // Short noise exciter
  const excLen=0.003+v*0.002;
  const nSrc=audioCtx.createBufferSource();nSrc.buffer=noiseBuffer;
  const excG=audioCtx.createGain();
  excG.gain.setValueAtTime(vol*2.5,t);
  excG.gain.exponentialRampToValueAtTime(0.001,t+excLen);
  // Karplus-Strong: delay + feedback loop + damping LPF
  // Clamp freq to safe range to prevent sub-ms delays
  const safeDelay=Math.max(0.001,Math.min(0.049,1/Math.max(20,freq)));
  const kDelay=audioCtx.createDelay(0.05);kDelay.delayTime.value=safeDelay;
  const fbk=audioCtx.createGain();fbk.gain.value=sustain;
  const dampLpf=audioCtx.createBiquadFilter();dampLpf.type='lowpass';
  dampLpf.frequency.value=brightness;dampLpf.Q.value=0.3+ty*0.5;
  const outGain=audioCtx.createGain();
  outGain.gain.setValueAtTime(0,t);
  outGain.gain.linearRampToValueAtTime(vol,t+0.002);
  outGain.gain.exponentialRampToValueAtTime(0.0001,t+decayTime);
  const panner=audioCtx.createStereoPanner();panner.pan.value=panVal;
  // Kalimba: triangle exciter adds metallic 'ding'
  if(v===1){
    const toneExc=audioCtx.createOscillator();toneExc.type='triangle';
    toneExc.frequency.setValueAtTime(freq*4,t);
    toneExc.frequency.exponentialRampToValueAtTime(freq*2,t+0.01);
    const teG=audioCtx.createGain();
    teG.gain.setValueAtTime(vol*0.8,t);teG.gain.exponentialRampToValueAtTime(0.001,t+0.012);
    toneExc.connect(teG);teG.connect(kDelay);toneExc.start(t);toneExc.stop(t+0.015);
  }
  // Flow: exciter → kDelay → dampLpf → fbk → kDelay (loop) / dampLpf → outGain → output
  nSrc.connect(excG);excG.connect(kDelay);
  kDelay.connect(dampLpf);
  dampLpf.connect(fbk);fbk.connect(kDelay);
  dampLpf.connect(outGain);outGain.connect(panner);
  const revSend=audioCtx.createGain();revSend.gain.value=(el.space?.x??0.38)*0.4*_depth.reverbMult;
  if(reverbNode){outGain.connect(revSend);revSend.connect(reverbNode);}
  panner.connect(sidechainGain||compressor);
  nSrc.start(t);nSrc.stop(t+excLen+0.01);
  nSrc.onended=()=>{ try{nSrc.disconnect();excG.disconnect();}catch(e){} };
  // Kill feedback loop after decay — critical to prevent node accumulation
  const msUntilKill=Math.max(50,(decayTime+0.25)*1000+(t-audioCtx.currentTime)*1000);
  setTimeout(()=>{
    try{
      fbk.gain.value=0;
      fbk.disconnect();kDelay.disconnect();dampLpf.disconnect();
      outGain.disconnect();panner.disconnect();revSend.disconnect();
    }catch(e){}
  }, msUntilKill);
  el._pulse=0.75;el._flashPulse=0.55;
}

function buildDronePadType(el,freq,vol,panVal){
  const now=audioCtx.currentTime;
  const _depth=getElDepth(el);
  const v=el.variation??0;
  const sx=el.shape?.x??0.72, sy=el.shape?.y??0.92;
  const tx=el.tone?.x??0.45,  ty=el.tone?.y??0.18;
  const model=getSoundModel('Pad')||{};
  const atkMult=model.attackMult??1.0;
  const atkTime=(0.8+(1-sx)*7.0)*atkMult;
  const cutoff=(300+tx*5000)*_depth.cutoffMult;
  vol=vol*_depth.gainAttn;
  const filter=audioCtx.createBiquadFilter();filter.type='lowpass';
  filter.frequency.value=cutoff;filter.Q.value=0.5+ty*6;
  // Slow breathing LFO on filter
  const fLfo=audioCtx.createOscillator();fLfo.type='sine';
  fLfo.frequency.value=0.018+sy*0.06;
  const fLfoG=audioCtx.createGain();fLfoG.gain.value=cutoff*0.45;
  fLfo.connect(fLfoG);fLfoG.connect(filter.frequency);fLfo.start(now);
  const gainNode=audioCtx.createGain();
  gainNode.gain.setValueAtTime(0,now);
  gainNode.gain.linearRampToValueAtTime(vol*0.55,now+atkTime);
  const panner=audioCtx.createStereoPanner();panner.pan.value=panVal;
  const oscs=[];
  if(v===0){
    // Supersaw: 7 detuned saws — tighter detune (±14 cents) for richer unison not flange
    const detunes=[-14,-9,-4,0,4,9,14],gains=[0.10,0.14,0.20,0.24,0.20,0.14,0.10];
    const pans=[-0.6,-0.4,-0.2,0,0.2,0.4,0.6]; // stereo spread
    detunes.forEach((d,i)=>{
      const o=audioCtx.createOscillator();o.type='sawtooth';
      o.frequency.value=freq;o.detune.value=d;
      const g=audioCtx.createGain();g.gain.value=gains[i];
      const sp=audioCtx.createStereoPanner();sp.pan.value=pans[i];
      const dLfo=audioCtx.createOscillator();dLfo.frequency.value=0.08+Math.random()*0.18;
      const dG=audioCtx.createGain();dG.gain.value=4+Math.random()*6;
      dLfo.connect(dG);dG.connect(o.detune);dLfo.start(now);
      o.connect(g);g.connect(sp);sp.connect(filter);o.start(now);oscs.push(o,dLfo);
    });
  } else if(v===1){
    // Warm Wash: triangle + sine layers, very dark
    [1,1.003,0.997,2,0.5].forEach((ratio,i)=>{
      const o=audioCtx.createOscillator();o.type=i<3?'triangle':'sine';
      o.frequency.value=freq*ratio;
      const g=audioCtx.createGain();g.gain.value=[0.28,0.24,0.22,0.12,0.14][i];
      o.connect(g);g.connect(filter);o.start(now);oscs.push(o);
    });
  } else if(v===2){
    // Glass: FM with sweeping mod index
    const mod=audioCtx.createOscillator();mod.type='sine';mod.frequency.value=freq*3.01;
    const modG=audioCtx.createGain();modG.gain.value=freq*0.6;
    const modLfo=audioCtx.createOscillator();modLfo.frequency.value=0.025;
    const modLG=audioCtx.createGain();modLG.gain.value=freq*2.0;
    modLfo.connect(modLG);modLG.connect(modG.gain);modLfo.start(now);
    const carrier=audioCtx.createOscillator();carrier.type='sine';carrier.frequency.value=freq;
    mod.connect(modG);modG.connect(carrier.frequency);
    carrier.connect(filter);mod.start(now);carrier.start(now);oscs.push(mod,carrier,modLfo);
  } else {
    // PWM: two saws with slowly sweeping detune differential
    const sq1=audioCtx.createOscillator();sq1.type='sawtooth';sq1.frequency.value=freq;
    const sq2=audioCtx.createOscillator();sq2.type='sawtooth';sq2.frequency.value=freq;
    const pwmLfo=audioCtx.createOscillator();pwmLfo.frequency.value=0.12+sy*0.25;
    const pwmG=audioCtx.createGain();pwmG.gain.value=18;
    pwmLfo.connect(pwmG);pwmG.connect(sq2.detune);pwmLfo.start(now);
    const g1=audioCtx.createGain();g1.gain.value=0.32;
    const g2=audioCtx.createGain();g2.gain.value=-0.28;
    sq1.connect(g1);sq2.connect(g2);g1.connect(filter);g2.connect(filter);
    sq1.start(now);sq2.start(now);oscs.push(sq1,sq2,pwmLfo);
  }
  filter.connect(gainNode);
  return {oscs,gainNode,filterNode:filter,pannerNode:panner,lfoNode:fLfo,lfoGain:fLfoG};
}

function buildWavetablePad(el,freq,vol,panVal){
  const now=audioCtx.currentTime;
  const _depth=getElDepth(el);
  const sx=el.shape?.x??0.6,sy=el.shape?.y??0.7;
  const tx=el.tone?.x??0.35,ty=el.tone?.y??0.2;
  vol=vol*_depth.gainAttn;
  const real=new Float32Array(9);
  // Each variation gets a distinct harmonic profile
  // v0 Juno Pad: warm, even harmonics dominant — classic JP-8000 feel
  // v1 JP String: odd harmonics, hollow — JP-8 strings
  // v2 Warm Chord: rich even+odd, full body
  // v3 Poly Sweep: bright sawtooth-like, all harmonics present
  const v=el.variation??0;
  if(v===0){      // Juno Pad — warm, 2nd harmonic heavy
    real[1]=1.0; real[2]=0.72; real[3]=0.18; real[4]=0.28; real[5]=0.08; real[6]=0.12; real[7]=0.04;
  } else if(v===1){ // JP String — odd harmonics, hollow like a clarinet
    real[1]=1.0; real[2]=0.05; real[3]=0.55; real[4]=0.04; real[5]=0.35; real[6]=0.03; real[7]=0.22;
  } else if(v===2){ // Warm Chord — full spectrum, balanced
    real[1]=1.0; real[2]=0.55; real[3]=0.40; real[4]=0.22; real[5]=0.18; real[6]=0.10; real[7]=0.08;
  } else {          // Poly Sweep — sawtooth-like, every harmonic 1/n
    real[1]=1.0; real[2]=0.50; real[3]=0.33; real[4]=0.25; real[5]=0.20; real[6]=0.17; real[7]=0.14;
  }
  const imag2=new Float32Array(9);
  const wave=audioCtx.createPeriodicWave(real,imag2,{disableNormalization:false});
  const detuneProfiles=[[-5,0,5,-8],[-7,0,7,-3],[-4,0,4,12],[-6,0,6,3]];
  const gainProfiles=[[0.3,0.4,0.3,0.2],[0.25,0.45,0.25,0.15],[0.3,0.4,0.3,0.25],[0.35,0.45,0.35,0.22]];
  const detunes=detuneProfiles[v]||detuneProfiles[0];
  const gains=gainProfiles[v]||gainProfiles[0];
  const mixGain=audioCtx.createGain(); mixGain.gain.value=1.0;
  const oscs=[];
  const extraNodes=[mixGain];
  detunes.forEach((det,i)=>{
    const o=audioCtx.createOscillator();
    o.setPeriodicWave(wave);
    o.frequency.value=freq;
    o.detune.value=det+(Math.random()-0.5)*2;
    const g=audioCtx.createGain(); g.gain.value=gains[i]||0.25;
    o.connect(g); g.connect(mixGain);
    o.start(now); oscs.push(o);
    extraNodes.push(g);
  });
  const chorusLfo=audioCtx.createOscillator(); chorusLfo.type='sine';
  chorusLfo.frequency.value=0.06+sy*0.05; // was 0.28 — much slower, Juno-style
  const chorusG=audioCtx.createGain(); chorusG.gain.value=8+tx*6;
  chorusLfo.connect(chorusG);
  oscs.slice(0,2).forEach(o=>chorusG.connect(o.detune));
  chorusLfo.start(now); oscs.push(chorusLfo);
  const filter=audioCtx.createBiquadFilter();
  filter.type='lowpass';
  filter.frequency.value=(400+tx*3200)*_depth.cutoffMult;
  filter.Q.value=0.3+ty*0.6;
  const filterLfo=audioCtx.createOscillator(); filterLfo.type='sine';
  filterLfo.frequency.value=0.06+sy*0.08;
  const filterLfoG=audioCtx.createGain(); filterLfoG.gain.value=120+tx*200;
  filterLfo.connect(filterLfoG); filterLfoG.connect(filter.frequency);
  filterLfo.start(now); oscs.push(filterLfo);
  extraNodes.push(filterLfoG);
  const gainNode=audioCtx.createGain();
  const atkTime=0.8+(1-sx)*3.0;
  gainNode.gain.setValueAtTime(0,now);
  gainNode.gain.linearRampToValueAtTime(vol*0.55,now+atkTime);
  // Haas widener — 12–18ms delay spread for club-width without center buildup
  const haas = buildHaasWidener(12 + tx*6);
  const panner=audioCtx.createStereoPanner(); panner.pan.value=panVal;
  mixGain.connect(filter); filter.connect(gainNode);
  gainNode.connect(haas.input); haas.output.connect(panner);
  panner.connect(sidechainGain||compressor);
  if(reverbNode){const rs=audioCtx.createGain();rs.gain.value=0.65*_depth.reverbMult;gainNode.connect(rs);rs.connect(reverbNode);}
  const haasNodes = haas ? haas.nodes : [];
  return {oscs,gainNode,filterNode:filter,pannerNode:panner,lfoNode:chorusLfo,lfoGain:chorusG,extraNodes:[...extraNodes,...haasNodes]};
}

function buildGranularShimmer(el,freq,vol,panVal){
  const now=audioCtx.currentTime;
  const _depth=getElDepth(el);
  const sx=el.shape?.x??0.6,sy=el.shape?.y??0.7;
  const tx=el.tone?.x??0.4,ty=el.tone?.y??0.2;
  vol=vol*_depth.gainAttn;
  const NUM_GRAINS=12;
  const GRAIN_DUR=0.08+sx*0.12;
  const SPREAD_CENTS=30+tx*120;
  // Each variation has a distinct harmonic/texture character
  // v0 Air: high odd harmonics, sparse, slow — pure ethereal shimmer
  // v1 Glimmer: beating pairs of close harmonics, medium speed
  // v2 Cloud: dense even harmonics, slow swell — warm cloud texture
  // v3 Sparkle: random high harmonics, fast — bright glitter
  const v=el.variation??0;
  const shimmerProfiles=[
    {harmonics:[3,5,7,9,11,3,5,7,9,11,13,15], driftRate:0.03, driftDepth:3,  grainG:0.09, atk:1.8},// Air
    {harmonics:[2,2,4,4,6,6,8,8,2,4,6,8],     driftRate:0.08, driftDepth:5,  grainG:0.08, atk:0.8},// Glimmer
    {harmonics:[1,2,3,4,5,6,1,2,3,4,5,6],     driftRate:0.04, driftDepth:4,  grainG:0.10, atk:2.2},// Cloud
    {harmonics:[5,7,9,11,13,6,8,10,12,14,7,9],driftRate:0.18, driftDepth:8,  grainG:0.11, atk:0.4},// Sparkle
  ];
  const profile=shimmerProfiles[v]||shimmerProfiles[0];
  const masterGainNode=audioCtx.createGain();
  masterGainNode.gain.setValueAtTime(0,now);
  masterGainNode.gain.linearRampToValueAtTime(Math.min(0.22,vol*0.28),now+profile.atk+(1-sx)*2);
  const shimFilter=audioCtx.createBiquadFilter();
  shimFilter.type='lowpass';
  shimFilter.frequency.value=(1800+tx*4000)*_depth.cutoffMult;
  shimFilter.Q.value=0.4;
  const shimPan=audioCtx.createStereoPanner(); shimPan.pan.value=panVal;
  const panLfo=audioCtx.createOscillator(); panLfo.type='sine';
  panLfo.frequency.value=0.05+sy*0.12;
  const panLfoG=audioCtx.createGain(); panLfoG.gain.value=0.5+sy*0.4;
  panLfo.connect(panLfoG); panLfoG.connect(shimPan.pan);
  panLfo.start(now);
  // Haas widener — shimmer benefits most from width (18–22ms for maximum spread)
  const haas = buildHaasWidener(18 + sx*4);
  masterGainNode.connect(shimFilter);
  shimFilter.connect(haas.input); haas.output.connect(shimPan);
  shimPan.connect(sidechainGain||compressor);
  if(reverbNode){const rs=audioCtx.createGain();rs.gain.value=0.7*_depth.reverbMult;masterGainNode.connect(rs);rs.connect(reverbNode);}
  const oscs=[panLfo];
  const extraNodes=[panLfoG]; // gain nodes not in oscs that need disconnect
  const grainTypes=['sine','sine','triangle','sine'];
  for(let g=0;g<NUM_GRAINS;g++){
    const offset=(g/NUM_GRAINS)*GRAIN_DUR*NUM_GRAINS*0.5;
    const detuneCents=(Math.random()-0.5)*SPREAD_CENTS;
    const grainFreq=freq*Math.pow(2,detuneCents/1200);
    const harmonic=profile.harmonics[g%profile.harmonics.length];
    const o=audioCtx.createOscillator();
    o.type=grainTypes[g%grainTypes.length];
    o.frequency.value=grainFreq*harmonic;
    const driftLfo=audioCtx.createOscillator(); driftLfo.type='sine';
    driftLfo.frequency.value=profile.driftRate+Math.random()*profile.driftRate;
    const driftG=audioCtx.createGain(); driftG.gain.value=profile.driftDepth+Math.random()*profile.driftDepth;
    driftLfo.connect(driftG); driftG.connect(o.detune);
    const grainGain=audioCtx.createGain();
    grainGain.gain.setValueAtTime(0,now+offset);
    grainGain.gain.linearRampToValueAtTime(profile.grainG+Math.random()*0.03,now+offset+GRAIN_DUR*0.4);
    grainGain.gain.setTargetAtTime(profile.grainG*0.5,now+offset+GRAIN_DUR*0.6,GRAIN_DUR*0.3);
    o.connect(grainGain); grainGain.connect(masterGainNode);
    o.start(now+offset); driftLfo.start(now+offset);
    oscs.push(o,driftLfo);
    extraNodes.push(driftG,grainGain);
  }
  return {oscs,gainNode:masterGainNode,filterNode:shimFilter,pannerNode:shimPan,lfoNode:panLfo,lfoGain:panLfoG,extraNodes:[...extraNodes,...(haas?haas.nodes:[])]};
}

function buildPhysicalModel(el,freq,vol,panVal){
  const now=audioCtx.currentTime;
  const v=el.variation??0;
  const sx=el.shape?.x??0.5, sy=el.shape?.y??0.7;
  const tx=el.tone?.x??0.35, ty=el.tone?.y??0.25;
  const spx=el.space?.x??0.55;
  const oscs=[];

  const masterGain=audioCtx.createGain();
  masterGain.gain.setValueAtTime(0,now);
  const panner=audioCtx.createStereoPanner(); panner.pan.value=panVal;
  masterGain.connect(panner);
  panner.connect(sidechainGain||compressor);
  if(reverbNode){
    const rs=audioCtx.createGain(); rs.gain.value=0.35+spx*0.5;
    masterGain.connect(rs); rs.connect(reverbNode);
  }

  if(v===0){
    // BOWED STRING -- sawtooth through resonant comb feedback chain
    const bowPressure=0.3+ty*0.6;   // ty: clean bow to heavy press
    const brightness=400+tx*3200;    // tx: dark to bright — was 0.4 which is subsonic!
    const src=audioCtx.createOscillator(); src.type='sawtooth';
    src.frequency.value=freq;
    const src2=audioCtx.createOscillator(); src2.type='sawtooth';
    src2.frequency.value=freq*1.001; src2.detune.value=12; // octave shimmer
    const srcGain=audioCtx.createGain(); srcGain.gain.value=0.5;
    const src2Gain=audioCtx.createGain(); src2Gain.gain.value=0.18;
    src.connect(srcGain); src2.connect(src2Gain);

    // Body resonator: bandpass at freq + 2nd harmonic
    const bodyBpf=audioCtx.createBiquadFilter(); bodyBpf.type='bandpass';
    bodyBpf.frequency.value=freq*2; bodyBpf.Q.value=8+ty*18;
    // Rosin texture: subtle distortion for bow stick-slip
    const rosinGain=audioCtx.createGain(); rosinGain.gain.value=1.5+bowPressure*2;
    const rosinClip=audioCtx.createWaveShaper();
    const curve=new Float32Array(256);
    for(let i=0;i<256;i++){const x=i/128-1; curve[i]=Math.tanh(x*(1.5+bowPressure*3));}
    rosinClip.curve=curve;
    const outputFilter=audioCtx.createBiquadFilter(); outputFilter.type='lowpass';
    outputFilter.frequency.value=brightness; outputFilter.Q.value=0.8;

    srcGain.connect(bodyBpf); src2Gain.connect(bodyBpf);
    bodyBpf.connect(rosinGain); rosinGain.connect(rosinClip);
    rosinClip.connect(outputFilter); outputFilter.connect(masterGain);

    // Slow pressure LFO -- bow speed variation
    const bowLfo=audioCtx.createOscillator(); bowLfo.type='sine';
    bowLfo.frequency.value=0.08+sy*0.18;
    const bowLfoG=audioCtx.createGain(); bowLfoG.gain.value=0.08;
    bowLfo.connect(bowLfoG); bowLfoG.connect(rosinGain.gain);
    bowLfo.start(now); oscs.push(bowLfo);

    const atkTime=0.6+(1-sx)*2.5;
    masterGain.gain.linearRampToValueAtTime(vol*0.6,now+atkTime);
    src.start(now); src2.start(now); oscs.push(src,src2);

  } else if(v===1){
    // STEEL DRUM -- noise burst excites tuned resonator cluster
    // Partials for steelpan: 1, 1.5, 1.96, 2.98 (Caribbean tuning)
    const partials=[1, 1.497, 1.960, 2.979, 3.962];
    const gains=   [1, 0.55,  0.35,  0.20,  0.12 ];
    partials.forEach((p,i)=>{
      const bpf=audioCtx.createBiquadFilter(); bpf.type='bandpass';
      bpf.frequency.value=freq*p; bpf.Q.value=12+ty*18; // was 60+ty*80 — too high, killed signal
      // Noise exciter pulse
      const noiseOsc=audioCtx.createOscillator(); noiseOsc.type='sawtooth';
      noiseOsc.frequency.value=freq*p*(1+Math.random()*0.002);
      const pg=audioCtx.createGain(); pg.gain.value=gains[i]*0.7;
      noiseOsc.connect(bpf); bpf.connect(pg); pg.connect(masterGain);
      noiseOsc.start(now); oscs.push(noiseOsc);
    });
    // Fast strike envelope -- steelpan rings, then decays
    const decayTime=0.8+(1-sx)*2.5; // shape.x: short to long ring
    masterGain.gain.setValueAtTime(0,now);
    masterGain.gain.linearRampToValueAtTime(vol*0.9,now+0.004);
    masterGain.gain.setTargetAtTime(vol*0.15,now+0.05,decayTime*0.35);
    masterGain.gain.setTargetAtTime(0,now+decayTime,decayTime*0.4);
    // But in sustained mode re-excite gently on beat -- tremolo sustain
    const tremoloLfo=audioCtx.createOscillator(); tremoloLfo.type='sine';
    tremoloLfo.frequency.value=3.5+sy*4;
    const tremoloG=audioCtx.createGain(); tremoloG.gain.value=0.04;
    tremoloLfo.connect(tremoloG); tremoloG.connect(masterGain.gain);
    tremoloLfo.start(now+0.1); oscs.push(tremoloLfo);

  } else if(v===2){
    // BLOWN PIPE -- noise + fundamental through waveguide-style resonator
    // Breath: highpass noise as air column
    const bufferSize=audioCtx.sampleRate*2;
    const noiseBuffer=audioCtx.createBuffer(1,bufferSize,audioCtx.sampleRate);
    const nd=noiseBuffer.getChannelData(0);
    for(let i=0;i<bufferSize;i++) nd[i]=(Math.random()*2-1);
    const noiseNode=audioCtx.createBufferSource();
    noiseNode.buffer=noiseBuffer; noiseNode.loop=true;
    const breathAmount=0.15+ty*0.35;
    const noiseGain=audioCtx.createGain(); noiseGain.gain.value=breathAmount;
    // Tube resonance: high-Q bandpass at fundamental + odd harmonics (closed pipe)
    const pipeFilter=audioCtx.createBiquadFilter(); pipeFilter.type='bandpass';
    pipeFilter.frequency.value=freq; pipeFilter.Q.value=12+ty*20;
    const pipe3rd=audioCtx.createBiquadFilter(); pipe3rd.type='bandpass';
    pipe3rd.frequency.value=freq*3; pipe3rd.Q.value=8+ty*14;
    const pipe3G=audioCtx.createGain(); pipe3G.gain.value=0.35;
    // Fundamental oscillator -- the stable tone underneath the breath
    const fundOsc=audioCtx.createOscillator(); fundOsc.type='sine';
    fundOsc.frequency.value=freq;
    const fundGain=audioCtx.createGain(); fundGain.gain.value=0.55;
    // Embouchure LFO -- slight frequency wobble like lip pressure
    const embLfo=audioCtx.createOscillator(); embLfo.type='sine';
    embLfo.frequency.value=0.06+sy*0.12;
    const embG=audioCtx.createGain(); embG.gain.value=3+sy*5;
    embLfo.connect(embG); embG.connect(fundOsc.detune);
    embLfo.start(now);

    const outFilter=audioCtx.createBiquadFilter(); outFilter.type='lowpass';
    outFilter.frequency.value=1800+tx*3000;

    noiseNode.connect(noiseGain);
    noiseGain.connect(pipeFilter); pipeFilter.connect(outFilter);
    noiseGain.connect(pipe3rd); pipe3rd.connect(pipe3G); pipe3G.connect(outFilter);
    fundOsc.connect(fundGain); fundGain.connect(outFilter);
    outFilter.connect(masterGain);

    const atkTime=0.4+(1-sx)*1.8;
    masterGain.gain.linearRampToValueAtTime(vol*0.55,now+atkTime);
    noiseNode.start(now); fundOsc.start(now);
    oscs.push(noiseNode,fundOsc,embLfo);

  } else if(v===3){
    // WOOD BODY -- click exciter through multi-mode resonator
    // Modeled on tabla/wood block/kora body resonance
    // Click source: very short noise burst
    const bufSz=Math.floor(audioCtx.sampleRate*0.015);
    const clickBuf=audioCtx.createBuffer(1,bufSz,audioCtx.sampleRate);
    const cd=clickBuf.getChannelData(0);
    for(let i=0;i<bufSz;i++) cd[i]=(Math.random()*2-1)*(1-i/bufSz);
    const clickSrc=audioCtx.createBufferSource();
    clickSrc.buffer=clickBuf; clickSrc.loop=false;
    // Wood body modes: near-harmonic but slightly inharmonic (wood character)
    const modeRatios=[1, 1.48, 2.14, 2.92, 3.85];
    const modeQs=    [10, 8,   6,    5,    4  ]; // was [30,20,15,10,8] — too high, killed signal
    const modeGains= [1, 0.6,  0.35, 0.20, 0.10];
    const resonatorOut=audioCtx.createGain(); resonatorOut.gain.value=1;
    modeRatios.forEach((r,i)=>{
      const bpf=audioCtx.createBiquadFilter(); bpf.type='bandpass';
      bpf.frequency.value=Math.min(freq*r,18000); bpf.Q.value=modeQs[i]+(ty*8); // was ty*20
      const mg=audioCtx.createGain(); mg.gain.value=modeGains[i];
      clickSrc.connect(bpf); bpf.connect(mg); mg.connect(resonatorOut);
    });
    // Sustained body -- low oscillator that hums like a resonant wood surface
    const bodyOsc=audioCtx.createOscillator(); bodyOsc.type='triangle';
    bodyOsc.frequency.value=freq;
    const bodyGain=audioCtx.createGain(); bodyGain.gain.value=0.25;
    // Rattle/texture: very subtle noise under the body
    const bodyFilter=audioCtx.createBiquadFilter(); bodyFilter.type='lowpass';
    bodyFilter.frequency.value=600+tx*1200; bodyFilter.Q.value=2;
    // Slow knock LFO -- like wood grain resonance
    const knockLfo=audioCtx.createOscillator(); knockLfo.type='sine';
    knockLfo.frequency.value=0.04+sy*0.10;
    const knockG=audioCtx.createGain(); knockG.gain.value=0.05;
    knockLfo.connect(knockG); knockG.connect(bodyOsc.detune);
    knockLfo.start(now);

    resonatorOut.connect(masterGain);
    bodyOsc.connect(bodyGain); bodyGain.connect(bodyFilter); bodyFilter.connect(masterGain);
    const atkTime=0.15+(1-sx)*1.2;
    masterGain.gain.setValueAtTime(0,now);
    masterGain.gain.linearRampToValueAtTime(vol*0.65,now+atkTime);
    clickSrc.start(now); bodyOsc.start(now);
    oscs.push(clickSrc,bodyOsc,knockLfo);

  } else if(v===4){
    // CELLO -- deeper bowed string, richer harmonics, slower vibrato
    const bowPressure=0.4+ty*0.5;
    const brightness=300+tx*2200;
    const src=audioCtx.createOscillator(); src.type='sawtooth'; src.frequency.value=freq*0.5;
    const src2=audioCtx.createOscillator(); src2.type='sawtooth'; src2.frequency.value=freq*0.5*1.002;
    const srcG=audioCtx.createGain(); srcG.gain.value=0.55;
    const src2G=audioCtx.createGain(); src2G.gain.value=0.22;
    src.connect(srcG); src2.connect(src2G);
    const bodyBpf=audioCtx.createBiquadFilter(); bodyBpf.type='bandpass';
    bodyBpf.frequency.value=freq; bodyBpf.Q.value=6+ty*12;
    const rosinG=audioCtx.createGain(); rosinG.gain.value=1.8+bowPressure*2;
    const ws=audioCtx.createWaveShaper();
    const curve=new Float32Array(256);
    for(let i=0;i<256;i++){const x=i/128-1;curve[i]=Math.tanh(x*(2+bowPressure*2));}
    ws.curve=curve;
    const outLpf=audioCtx.createBiquadFilter(); outLpf.type='lowpass';
    outLpf.frequency.value=brightness; outLpf.Q.value=0.7;
    // Slow cello vibrato ~5Hz
    const vibratoLfo=audioCtx.createOscillator(); vibratoLfo.type='sine';
    vibratoLfo.frequency.value=4.5+sy*1.5;
    const vibratoG=audioCtx.createGain(); vibratoG.gain.value=6+sy*8;
    vibratoLfo.connect(vibratoG);
    [src,src2].forEach(o=>vibratoG.connect(o.frequency));
    vibratoLfo.start(now); oscs.push(vibratoLfo);
    srcG.connect(bodyBpf); src2G.connect(bodyBpf);
    bodyBpf.connect(rosinG); rosinG.connect(ws); ws.connect(outLpf); outLpf.connect(masterGain);
    const atkTime=0.8+(1-sx)*2.0;
    masterGain.gain.linearRampToValueAtTime(vol*0.62,now+atkTime);
    src.start(now); src2.start(now); oscs.push(src,src2);

  } else if(v===5){
    // FLUTE -- breathy noise + pure fundamental + 2nd harmonic, overblown character
    const bufSz=audioCtx.sampleRate*2;
    const nBuf=audioCtx.createBuffer(1,bufSz,audioCtx.sampleRate);
    const nd=nBuf.getChannelData(0); for(let i=0;i<bufSz;i++) nd[i]=(Math.random()*2-1);
    const nNode=audioCtx.createBufferSource(); nNode.buffer=nBuf; nNode.loop=true;
    const breathAmt=0.08+ty*0.18; // flute is less breathy than pipe
    const breathG=audioCtx.createGain(); breathG.gain.value=breathAmt;
    // Flute embouchure — high-pass the breath for airy character
    const breathHpf=audioCtx.createBiquadFilter(); breathHpf.type='highpass';
    breathHpf.frequency.value=2000+tx*3000; breathHpf.Q.value=0.5;
    // Fundamental — pure sine
    const fund=audioCtx.createOscillator(); fund.type='sine'; fund.frequency.value=freq*2; // flute is high
    const fundG=audioCtx.createGain(); fundG.gain.value=0.65;
    // 2nd harmonic overtone
    const harm2=audioCtx.createOscillator(); harm2.type='sine'; harm2.frequency.value=freq*4;
    const harm2G=audioCtx.createGain(); harm2G.gain.value=0.20;
    // Gentle flutter vibrato
    const flutterLfo=audioCtx.createOscillator(); flutterLfo.type='sine';
    flutterLfo.frequency.value=5.5+sy*1.5;
    const flutterG=audioCtx.createGain(); flutterG.gain.value=4+sy*6;
    flutterLfo.connect(flutterG); flutterG.connect(fund.frequency); flutterLfo.start(now);
    const outLpf=audioCtx.createBiquadFilter(); outLpf.type='lowpass'; outLpf.frequency.value=8000;
    nNode.connect(breathG); breathG.connect(breathHpf); breathHpf.connect(outLpf);
    fund.connect(fundG); fundG.connect(outLpf);
    harm2.connect(harm2G); harm2G.connect(outLpf);
    outLpf.connect(masterGain);
    const atkTime=0.3+(1-sx)*1.2;
    masterGain.gain.linearRampToValueAtTime(vol*0.58,now+atkTime);
    nNode.start(now); fund.start(now); harm2.start(now);
    oscs.push(nNode,fund,harm2,flutterLfo);

  } else if(v===6){
    // TABLA -- two-headed drum: sharp click + pitched resonance, Indian character
    const bufSz=Math.floor(audioCtx.sampleRate*0.012);
    const cBuf=audioCtx.createBuffer(1,bufSz,audioCtx.sampleRate);
    const cd=cBuf.getChannelData(0); for(let i=0;i<bufSz;i++) cd[i]=(Math.random()*2-1)*(1-i/bufSz);
    const cSrc=audioCtx.createBufferSource(); cSrc.buffer=cBuf;
    // Tabla has a distinct tonal pitch — the black patch (siyahi) tunes the drum
    const tablaFreq=freq*1.8;
    const bpf1=audioCtx.createBiquadFilter(); bpf1.type='bandpass'; bpf1.frequency.value=tablaFreq; bpf1.Q.value=18;
    const bpf2=audioCtx.createBiquadFilter(); bpf2.type='bandpass'; bpf2.frequency.value=tablaFreq*1.5; bpf2.Q.value=10;
    const bodyOsc=audioCtx.createOscillator(); bodyOsc.type='sine'; bodyOsc.frequency.value=tablaFreq;
    // Pitch bend down — tabla sound characteristic
    bodyOsc.frequency.setValueAtTime(tablaFreq*1.15,now);
    bodyOsc.frequency.exponentialRampToValueAtTime(tablaFreq,now+0.08);
    const bodyG=audioCtx.createGain(); bodyG.gain.value=0.4;
    const bpf1G=audioCtx.createGain(); bpf1G.gain.value=0.7;
    const bpf2G=audioCtx.createGain(); bpf2G.gain.value=0.35;
    const decayTime=0.4+sx*1.2;
    masterGain.gain.setValueAtTime(0,now);
    masterGain.gain.linearRampToValueAtTime(vol*0.80,now+0.003);
    masterGain.gain.setTargetAtTime(0,now+0.05,decayTime*0.3);
    cSrc.connect(bpf1); bpf1.connect(bpf1G); bpf1G.connect(masterGain);
    cSrc.connect(bpf2); bpf2.connect(bpf2G); bpf2G.connect(masterGain);
    bodyOsc.connect(bodyG); bodyG.connect(masterGain);
    cSrc.start(now); cSrc.stop(now+0.015); bodyOsc.start(now); bodyOsc.stop(now+decayTime+0.1);
    oscs.push(cSrc,bodyOsc);

  } else {
    // GLASS BAR (v7) -- struck glass/crystal: very clean sine harmonics, long sustain
    // Like a glass harmonica or crystal bowl
    const glassPartials=[1, 2.756, 5.404, 8.933]; // inharmonic glass partials
    const glassGains=[1.0, 0.35, 0.18, 0.08];
    const decayTime=2.0+sx*3.0; // glass rings for a long time
    masterGain.gain.setValueAtTime(0,now);
    masterGain.gain.linearRampToValueAtTime(vol*0.70,now+0.01);
    masterGain.gain.setTargetAtTime(0,now+decayTime*0.3,decayTime*0.4);
    glassPartials.forEach((p,i)=>{
      const o=audioCtx.createOscillator(); o.type='sine';
      o.frequency.value=freq*2*p;
      const g=audioCtx.createGain();
      g.gain.setValueAtTime(glassGains[i],now);
      g.gain.exponentialRampToValueAtTime(0.001,now+decayTime*(0.8-i*0.12));
      // Subtle ring — very slight detune
      o.detune.value=(Math.random()-0.5)*1.5;
      o.connect(g); g.connect(masterGain);
      o.start(now); o.stop(now+decayTime+0.1);
      oscs.push(o);
    });
  }

  // Collect all intermediate nodes for cleanup -- varies by variation
  const extraNodes = oscs.reduce((acc,o)=>acc, []); // placeholder; builder populates below
  return {oscs,gainNode:masterGain,filterNode:null,pannerNode:panner,lfoNode:null,lfoGain:null,extraNodes:[]};
}

function buildDroneVocal(el,freq,vol,panVal){
  const now=audioCtx.currentTime;
  const v=el.variation??0;
  const sx=el.shape?.x??0.60, sy=el.shape?.y??0.82;
  const tx=el.tone?.x??0.5;
  const fmts=FORMANTS[VOCAL_VARIANTS[v]];
  const model=getSoundModel('Vocal')||{};
  const formantShift=model.formantShift??0;
  const atkTime=0.3+(1-sx)*1.5;
  // Source: 3 detuned saws + soft sub octave for body
  const srcMix=audioCtx.createGain();srcMix.gain.value=1.0;
  const oscs=[];
  [-6,0,7].forEach(detune=>{
    const o=audioCtx.createOscillator();o.type='sawtooth';
    o.frequency.value=freq;o.detune.value=detune+formantShift;
    // B4: slow pitch envelope — rises slightly then settles, expressive vocal gesture
    o.frequency.setValueAtTime(freq*0.985,now);
    o.frequency.linearRampToValueAtTime(freq*1.012,now+atkTime*0.6);
    o.frequency.linearRampToValueAtTime(freq,now+atkTime*1.4);
    const g=audioCtx.createGain();g.gain.value=0.35;
    o.connect(g);g.connect(srcMix);o.start(now);oscs.push(o);
  });
  // Sub octave body — adds the chest resonance missing from formant-only approach
  const subOsc=audioCtx.createOscillator();subOsc.type='sine';
  subOsc.frequency.value=freq*0.5;
  const subG=audioCtx.createGain();subG.gain.value=0.18;
  subOsc.connect(subG);subG.connect(srcMix);subOsc.start(now);oscs.push(subOsc);

  // Parallel formant BPF filters — boosted for more presence
  const formantOut=audioCtx.createGain();formantOut.gain.value=1.8; // was 1.2
  let firstBpf=null, secondBpf=null;
  fmts.forEach((fmt,i)=>{
    const bpf=audioCtx.createBiquadFilter();bpf.type='bandpass';
    bpf.frequency.value=fmt.f*(1+tx*0.15); // tx shifts formants slightly for vowel variation
    bpf.Q.value=fmt.Q;
    const fg=audioCtx.createGain();fg.gain.value=[1.0,0.75,0.40][i]*0.55; // boosted from 0.48
    srcMix.connect(bpf);bpf.connect(fg);fg.connect(formantOut);
    if(i===0) firstBpf=bpf;
    if(i===1) secondBpf=bpf;
  });
  // Small unfiltered body — chest resonance
  const bodyPass=audioCtx.createBiquadFilter();bodyPass.type='lowpass';bodyPass.frequency.value=700;
  const bodyGain=audioCtx.createGain();bodyGain.gain.value=0.18; // was 0.12
  srcMix.connect(bodyPass);bodyPass.connect(bodyGain);
  // Slow vowel drift on first two formants — more expressive movement
  const driftLfo=audioCtx.createOscillator();driftLfo.type='sine';
  driftLfo.frequency.value=0.012+sy*0.04;
  const driftG=audioCtx.createGain();driftG.gain.value=200+sy*150;
  if(firstBpf){driftLfo.connect(driftG);driftG.connect(firstBpf.frequency);}
  // Second formant drifts in opposite phase — creates vowel morph feeling
  const driftG2=audioCtx.createGain();driftG2.gain.value=-(120+sy*80);
  if(secondBpf){driftLfo.connect(driftG2);driftG2.connect(secondBpf.frequency);}
  driftLfo.start(now);oscs.push(driftLfo);
  const gainNode=audioCtx.createGain();
  gainNode.gain.setValueAtTime(0,now);
  gainNode.gain.linearRampToValueAtTime(vol*0.88,now+atkTime);
  const panner=audioCtx.createStereoPanner();panner.pan.value=panVal;
  formantOut.connect(gainNode);
  bodyGain.connect(gainNode);
  // B4: Vocal reverb — very high send for ethereal character
  if(reverbNode){const vrs=audioCtx.createGain();vrs.gain.value=Math.min(0.98,(el.space?.x??0.5)*1.6);gainNode.connect(vrs);vrs.connect(reverbNode);}
  gainNode.connect(panner);panner.connect(sidechainGain||compressor);
  return {oscs,gainNode,filterNode:null,pannerNode:panner,lfoNode:driftLfo,lfoGain:driftG};
}

function scheduleRingOneShot(el, t){
  if(!audioCtx) return;
  const freq=midiToFreq(noteToMidi(el.note||'A4'));
  const vol=(el.volume??0.5)*0.4;
  const sy=(el.shape&&el.shape.y!=null?el.shape.y:0.3);
  const tx=(el.tone&&el.tone.x!=null?el.tone.x:0.5), ty=(el.tone&&el.tone.y!=null?el.tone.y:0.3);
  const panVal=getElPan(el);
  const _depth=getElDepth(el);
  const v=el.variation??0;
  const barLen=(60/bpm)*4;
  const maxDecay=barLen*0.85;
  const rawDecay=0.12+sy*2.0; // max 2.12s, much shorter than before
  const decayTime=Math.min(rawDecay, maxDecay);
  const ratios=[[1,2.76],[1,5.4],[1,2.76,8.93],[1,1.41]]; // bell, metallic, complex, fifth
  const fmRatio=ratios[v%4][1]||2.76;
  const fmDepth=freq*(0.2+ty*3);
  const filter=audioCtx.createBiquadFilter();
  filter.type='bandpass';
  // B1: Italo EP — brighter filter and higher FM ratio for the signature shimmer
  const isItalo = currentStyle==='italo';
  filter.frequency.value=freq*(isItalo ? (1.8+tx*2.5) : (1+tx*2))*_depth.cutoffMult;
  filter.Q.value=(isItalo ? 2.5 : 1.5)+tx*3;
  const gainNode=audioCtx.createGain();
  gainNode.gain.setValueAtTime(0,t);
  gainNode.gain.linearRampToValueAtTime(vol,t+0.001);
  gainNode.gain.exponentialRampToValueAtTime(0.0001,t+decayTime);
  const panner=audioCtx.createStereoPanner();
  panner.pan.value=panVal;
  const revSend=audioCtx.createGain();
  revSend.gain.value=((el.space&&el.space.x!=null?el.space.x:0.4))*0.6*_depth.reverbMult;
  const mod=audioCtx.createOscillator(); mod.type='sine';
  mod.frequency.value=freq*fmRatio;
  const modG=audioCtx.createGain();
  modG.gain.setValueAtTime(fmDepth,t);
  modG.gain.exponentialRampToValueAtTime(fmDepth*0.05,t+decayTime*0.3);
  const carrier=audioCtx.createOscillator(); carrier.type='sine';
  carrier.frequency.value=freq;
  mod.connect(modG); modG.connect(carrier.frequency);
  carrier.connect(filter); filter.connect(gainNode);
  gainNode.connect(panner);
  if(reverbNode){gainNode.connect(revSend);revSend.connect(reverbNode);}
  panner.connect(sidechainGain||compressor);
  const stopT=t+decayTime+0.05;
  mod.start(t); carrier.start(t);
  mod.stop(stopT); carrier.stop(stopT);
  mod.onended=()=>{ try{mod.disconnect();modG.disconnect();}catch(e){} };
  carrier.onended=()=>{ try{carrier.disconnect();filter.disconnect();gainNode.disconnect();panner.disconnect();revSend.disconnect();}catch(e){} };
}

function scheduleEchoNote(el, t){
  if(!audioCtx) return;
  const vol=(el.volume??0.65)*0.48;
  const sx=el.shape?.x??0.3;
  const tx=el.tone?.x??0.5, ty=el.tone?.y??0.4;
  const spx=el.space?.x??0.75;
  const v=el.variation??0;
  const note=el.note||'A3';
  const freq=midiToFreq(noteToMidi(note));
  const panVal=getElPan(el);
  const _depth=getElDepth(el);
  const beat=(60/bpm);
  const delayTimes=[beat*0.5, beat*0.75, beat*1.0, beat*0.375][v]; // 8th, dotted 8th, quarter, triplet
  const feedback=0.35+ty*0.35; // 0.35–0.7, never runaway
  const numEchoes=3+Math.floor(sx*4); // 3–6 echoes

  const panner=audioCtx.createStereoPanner();
  panner.pan.value=panVal;
  panner.connect(sidechainGain||compressor);

  const masterEnv=audioCtx.createGain();
  masterEnv.gain.value=1.0;
  masterEnv.connect(panner);
  if(reverbNode){
    const rs=audioCtx.createGain();rs.gain.value=spx*0.6*_depth.reverbMult;
    masterEnv.connect(rs);rs.connect(reverbNode);
  }

  // Source timbre depends on variation
  function makeSource(t2, gainAmt){
    const env=audioCtx.createGain();
    env.gain.setValueAtTime(gainAmt,t2);
    env.gain.exponentialRampToValueAtTime(0.001,t2+0.18+sx*0.4);

    if(v===0||v===3){
      // Ping: clean sine — pure tone
      const o=audioCtx.createOscillator();o.type='sine';o.frequency.value=freq;
      o.connect(env);env.connect(masterEnv);
      o.start(t2);o.stop(t2+0.25+sx*0.5);
      o.onended=()=>{try{o.disconnect();env.disconnect();}catch(e){}};
    } else if(v===1){
      // Dub: filtered sawtooth — reggae bass tone
      const o=audioCtx.createOscillator();o.type='sawtooth';o.frequency.value=freq;
      const filt=audioCtx.createBiquadFilter();filt.type='lowpass';
      filt.frequency.setValueAtTime(2000+tx*3000,t2);
      filt.frequency.exponentialRampToValueAtTime(200+tx*500,t2+0.08);
      filt.Q.value=2+ty*4;
      o.connect(filt);filt.connect(env);env.connect(masterEnv);
      o.start(t2);o.stop(t2+0.3+sx*0.5);
      o.onended=()=>{try{o.disconnect();filt.disconnect();env.disconnect();}catch(e){}};
    } else {
      // Space: two detuned sines — shimmer
      const o1=audioCtx.createOscillator();o1.type='sine';o1.frequency.value=freq;
      const o2=audioCtx.createOscillator();o2.type='sine';o2.frequency.value=freq*1.498; // fifth
      const g2=audioCtx.createGain();g2.gain.value=0.4;
      o2.connect(g2);o1.connect(env);g2.connect(env);env.connect(masterEnv);
      o1.start(t2);o2.start(t2);o1.stop(t2+0.4+sx*0.6);o2.stop(t2+0.4+sx*0.6);
      o1.onended=()=>{try{o1.disconnect();o2.disconnect();g2.disconnect();env.disconnect();}catch(e){}};
    }
  }

  // Fire the source note + each echo with decreasing volume
  for(let i=0;i<numEchoes;i++){
    const echoT=t+i*delayTimes;
    const echoVol=vol*Math.pow(feedback,i);
    if(echoVol<0.002) break;
    // Alternating pan for stereo width
    const echoPan=panVal+((i%2===0)?0.3:-0.3)*ty;
    makeSource(echoT, echoVol);
  }

  // Cleanup masterEnv after all echoes
  const totalDur=numEchoes*delayTimes+0.6;
  setTimeout(()=>{try{masterEnv.disconnect();panner.disconnect();}catch(e){}},
    (t-audioCtx.currentTime+totalDur)*1000);

  const delay=Math.max(0,(t-audioCtx.currentTime)*1000);
  setTimeout(()=>{el._pulse=0.8;el._flashPulse=0.6;},delay);
}

function scheduleCongaNote(el, t){
  if(!audioCtx) return;
  const vol=(el.volume??0.65)*0.55;
  const sx=el.shape?.x??0.25;
  const tx=el.tone?.x??0.55, ty=el.tone?.y??0.4;
  const v=el.variation??0;
  const note=el.note||'A3';
  const freq=midiToFreq(noteToMidi(note))*(1+Math.random()*0.01); // tiny pitch humanize
  const panVal=getElPan(el)+(Math.random()-0.5)*0.15;
  const _depth=getElDepth(el);

  const panner=audioCtx.createStereoPanner();panner.pan.value=panVal;
  panner.connect(sidechainGain||compressor);
  if(reverbNode){
    const rs=audioCtx.createGain();rs.gain.value=(el.space?.x??0.3)*0.35*_depth.reverbMult;
    panner.connect(rs); // connect after panner
    rs.connect(reverbNode);
  }

  // Pitched body: sine with fast pitch drop (membrane behavior)
  // v===4 (Claves) uses completely different synthesis — wooden click, no membrane
  if (v === 4) {
    // ── Claves ──────────────────────────────────────────────────────────────
    // Sharp wooden stick strike: two hard-wood cylinders clicked together.
    // Character: very high pitch (1.8–2.8kHz), extremely short (20–35ms),
    // dry, no sustain, almost no reverb. Click transient + resonant body.

    // Resonant wood body — decaying sine at 2–2.5kHz range
    const clavFreq = 2200 + (tx * 600); // 2200–2800Hz based on tone
    const clavBody = audioCtx.createOscillator(); clavBody.type = 'sine';
    clavBody.frequency.setValueAtTime(clavFreq * 1.08, t);
    clavBody.frequency.exponentialRampToValueAtTime(clavFreq, t + 0.006);
    const clavDecay = 0.018 + (sx * 0.016); // 18–34ms — tighter = shorter
    const clavEnv = audioCtx.createGain();
    clavEnv.gain.setValueAtTime(vol * 1.1, t);
    clavEnv.gain.exponentialRampToValueAtTime(0.001, t + clavDecay);

    // Click transient — very short noise burst for attack definition
    const clavClick = audioCtx.createOscillator(); clavClick.type = 'square';
    clavClick.frequency.setValueAtTime(clavFreq * 2.2, t);
    clavClick.frequency.exponentialRampToValueAtTime(clavFreq * 1.5, t + 0.003);
    const clavClickEnv = audioCtx.createGain();
    clavClickEnv.gain.setValueAtTime(vol * 0.35, t);
    clavClickEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.004);

    // Second partial (5th above) — wood resonance harmonic
    const clavPartial = audioCtx.createOscillator(); clavPartial.type = 'sine';
    clavPartial.frequency.value = clavFreq * 1.51; // ~perfect 5th
    const clavPartialEnv = audioCtx.createGain();
    clavPartialEnv.gain.setValueAtTime(vol * 0.25, t);
    clavPartialEnv.gain.exponentialRampToValueAtTime(0.001, t + clavDecay * 0.6);

    // Highpass to keep it crisp — claves have no low end
    const clavHpf = audioCtx.createBiquadFilter(); clavHpf.type = 'highpass';
    clavHpf.frequency.value = 1600; clavHpf.Q.value = 0.8;

    clavBody.connect(clavEnv); clavEnv.connect(clavHpf);
    clavClick.connect(clavClickEnv); clavClickEnv.connect(clavHpf);
    clavPartial.connect(clavPartialEnv); clavPartialEnv.connect(clavHpf);
    clavHpf.connect(panner);

    clavBody.start(t);   clavBody.stop(t + clavDecay + 0.01);
    clavClick.start(t);  clavClick.stop(t + 0.006);
    clavPartial.start(t);clavPartial.stop(t + clavDecay * 0.65);

    clavBody.onended = () => {
      try { clavBody.disconnect(); clavEnv.disconnect();
            clavClick.disconnect(); clavClickEnv.disconnect();
            clavPartial.disconnect(); clavPartialEnv.disconnect();
            clavHpf.disconnect(); panner.disconnect(); } catch(e) {}
    };
    const delayClav = Math.max(0,(t-audioCtx.currentTime)*1000);
    setTimeout(()=>{el._pulse=0.95;el._flashPulse=0.75;}, delayClav);
    return;
  }

  const bodyFreqs=[[freq*1.5, freq*0.85],[freq*1.8, freq],[freq*1.3, freq*0.7],[freq*2.2, freq*1.2]];
  const [startF, endF]=bodyFreqs[v]||bodyFreqs[0];
  const decayTime=[0.18+sx*0.35, 0.12+sx*0.25, 0.22+sx*0.4, 0.08+sx*0.15][v];

  const body=audioCtx.createOscillator();body.type='sine';
  body.frequency.setValueAtTime(startF,t);
  body.frequency.exponentialRampToValueAtTime(Math.max(endF,20),t+decayTime*0.15);
  const bodyEnv=audioCtx.createGain();
  bodyEnv.gain.setValueAtTime(vol,t);
  bodyEnv.gain.exponentialRampToValueAtTime(0.001,t+decayTime);

  // Noise transient: the slap of the hand
  const noiseDecay=0.008+tx*0.025;
  let noiseSrc=null;
  if(noiseBuffer){
    noiseSrc=audioCtx.createBufferSource();noiseSrc.buffer=noiseBuffer;
    const nhpf=audioCtx.createBiquadFilter();nhpf.type='highpass';
    nhpf.frequency.value=400+ty*2000;
    const nbpf=audioCtx.createBiquadFilter();nbpf.type='bandpass';
    nbpf.frequency.value=startF*1.2;nbpf.Q.value=1.5;
    const noiseEnv=audioCtx.createGain();
    noiseEnv.gain.setValueAtTime(vol*0.7,t);
    noiseEnv.gain.exponentialRampToValueAtTime(0.001,t+noiseDecay);
    noiseSrc.connect(nhpf);nhpf.connect(nbpf);nbpf.connect(noiseEnv);
    noiseEnv.connect(panner);
    noiseSrc.start(t);noiseSrc.stop(t+noiseDecay+0.01);
    noiseSrc.onended=()=>{try{noiseSrc.disconnect();nhpf.disconnect();nbpf.disconnect();noiseEnv.disconnect();}catch(e){}};
  }

  // Optional second partial for tabla/bongo harmonics
  if(v===2||v===1){
    const partial=audioCtx.createOscillator();partial.type='sine';
    partial.frequency.setValueAtTime(startF*(v===2?1.7:2.1),t);
    partial.frequency.exponentialRampToValueAtTime(endF*(v===2?1.2:1.5),t+decayTime*0.1);
    const pg=audioCtx.createGain();
    pg.gain.setValueAtTime(vol*0.35,t);
    pg.gain.exponentialRampToValueAtTime(0.001,t+decayTime*0.6);
    partial.connect(pg);pg.connect(panner);
    partial.start(t);partial.stop(t+decayTime*0.65);
    partial.onended=()=>{try{partial.disconnect();pg.disconnect();}catch(e){}};
  }

  body.connect(bodyEnv);bodyEnv.connect(panner);
  const stopT=t+decayTime+0.05;
  body.start(t);body.stop(stopT);
  body.onended=()=>{try{body.disconnect();bodyEnv.disconnect();panner.disconnect();}catch(e){}};

  const delay=Math.max(0,(t-audioCtx.currentTime)*1000);
  setTimeout(()=>{el._pulse=0.85;el._flashPulse=0.65;},delay);
}

function buildDroneChord(el,freq,vol,panVal){
  const now=audioCtx.currentTime;
  const _depth=getElDepth(el);
  const v=el.variation??0;
  const sx=el.shape?.x??0.75, sy=el.shape?.y??0.88;
  const tx=el.tone?.x??0.35, ty=el.tone?.y??0.2;
  const spx=el.space?.x??0.7;
  vol=vol*_depth.gainAttn;

  const atkTime=(0.5+(1-sx)*4.0);
  const cutoff=(150+tx*1800)*_depth.cutoffMult;

  // Chord voicing — 4-note stack, voiced wide
  const semitones=getChordVoicing('Chord',el)||[0,7,12,16];
  const freqs=semitones.map(s=>freq*Math.pow(2,s/12));

  const masterGain=audioCtx.createGain();
  masterGain.gain.setValueAtTime(0,now);
  masterGain.gain.linearRampToValueAtTime(vol*0.55,now+atkTime);

  const filter=audioCtx.createBiquadFilter();filter.type='lowpass';
  filter.frequency.value=cutoff;filter.Q.value=0.4+ty*1.5;

  // Slow filter breath LFO
  const fLfo=audioCtx.createOscillator();fLfo.type='sine';
  fLfo.frequency.value=0.015+sy*0.04;
  const fLfoG=audioCtx.createGain();fLfoG.gain.value=cutoff*0.4;
  fLfo.connect(fLfoG);fLfoG.connect(filter.frequency);fLfo.start(now);

  const panner=audioCtx.createStereoPanner();panner.pan.value=panVal;
  masterGain.connect(filter);filter.connect(panner);
  panner.connect(sidechainGain||compressor);
  if(reverbNode){const rs=audioCtx.createGain();rs.gain.value=spx*0.75*_depth.reverbMult;masterGain.connect(rs);rs.connect(reverbNode);}

  const oscs=[];

  if(v===0||v===2){
    // Slow/String: detuned saws with heavy chorus — slow attack string ensemble
    const detunes=[-12,-5,0,5,12,-8,8];
    const gainVals=[0.12,0.16,0.22,0.16,0.12,0.10,0.10];
    freqs.forEach((f,fi)=>{
      detunes.slice(0,fi===0?4:2).forEach((det,di)=>{
        const o=audioCtx.createOscillator();
        o.type=v===2?'sawtooth':'triangle';
        o.frequency.value=f;
        o.detune.value=det+(Math.random()-0.5)*3;
        const g=audioCtx.createGain();g.gain.value=(gainVals[di]||0.1)*(fi===0?1.0:0.55);
        // Slow chorus LFO per oscillator
        const cLfo=audioCtx.createOscillator();cLfo.type='sine';
        cLfo.frequency.value=0.06+Math.random()*0.12;
        const cG=audioCtx.createGain();cG.gain.value=3+Math.random()*5;
        cLfo.connect(cG);cG.connect(o.detune);cLfo.start(now);
        o.connect(g);g.connect(masterGain);
        o.start(now);oscs.push(o,cLfo);
      });
    });
  } else if(v===1){
    // Swell: 3 sines per note with wide stereo spread
    freqs.forEach((f,fi)=>{
      [-8,0,8].forEach((det,di)=>{
        const o=audioCtx.createOscillator();o.type='sine';
        o.frequency.value=f;o.detune.value=det;
        const sp=audioCtx.createStereoPanner();
        sp.pan.value=[-0.6,0,0.6][di];
        const g=audioCtx.createGain();g.gain.value=[0.35,0.45,0.35][di]*(fi===0?1.0:0.5);
        o.connect(g);g.connect(sp);sp.connect(masterGain);
        o.start(now);oscs.push(o);
      });
    });
  } else {
    // Organ: square waves with drawbar-style mix
    const drawbars=[1,2,4,8]; // 8',4',2',1'
    freqs.forEach((f,fi)=>{
      drawbars.forEach((mult,di)=>{
        const o=audioCtx.createOscillator();o.type='square';
        o.frequency.value=f*mult;
        const g=audioCtx.createGain();
        g.gain.value=[0.3,0.2,0.12,0.06][di]*(fi===0?1.0:0.45);
        o.connect(g);g.connect(masterGain);
        o.start(now);oscs.push(o);
      });
    });
  }

  return {oscs:[...oscs,fLfo],gainNode:masterGain,filterNode:filter,pannerNode:panner,lfoNode:fLfo,lfoGain:fLfoG};
}

function scheduleSFX(el, t){
  if(!audioCtx) return;
  const v=el.variation??0;
  const vol=(el.volume??0.7)*0.55;
  const panVal=getElPan(el);
  const panner=audioCtx.createStereoPanner(); panner.pan.value=panVal;
  panner.connect(sidechainGain||compressor);
  if(reverbNode){ const rs=audioCtx.createGain();rs.gain.value=0.4;panner.connect(rs);rs.connect(reverbNode); }

  function out(node){ node.connect(panner); }
  function osc(type,f,dur,gain,freqEnd){
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type=type; o.frequency.setValueAtTime(f,t);
    if(freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(20,freqEnd),t+dur);
    g.gain.setValueAtTime(gain,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.connect(g); out(g); o.start(t); o.stop(t+dur+0.05);
    o.onended=()=>{try{o.disconnect();g.disconnect();}catch(e){}};
    return {o,g};
  }

  if(v===0){
    // SIREN — two-tone alternating wail, LFO pitch sweep
    const dur=1.2;
    const carrier=audioCtx.createOscillator(); carrier.type='sawtooth'; carrier.frequency.value=600;
    const lfo=audioCtx.createOscillator(); lfo.type='sine'; lfo.frequency.value=1.8;
    const lfoG=audioCtx.createGain(); lfoG.gain.value=180;
    lfo.connect(lfoG); lfoG.connect(carrier.frequency);
    const filt=audioCtx.createBiquadFilter(); filt.type='bandpass'; filt.frequency.value=800; filt.Q.value=1.5;
    const env=audioCtx.createGain();
    env.gain.setValueAtTime(0,t); env.gain.linearRampToValueAtTime(vol,t+0.05);
    env.gain.setTargetAtTime(0,t+dur*0.75,dur*0.2);
    carrier.connect(filt); filt.connect(env); out(env);
    lfo.start(t); carrier.start(t); lfo.stop(t+dur+0.1); carrier.stop(t+dur+0.1);
    lfo.onended=()=>{try{lfo.disconnect();lfoG.disconnect();carrier.disconnect();filt.disconnect();env.disconnect();}catch(e){}};

  } else if(v===1){
    // UFO — ring modulation + slow pitch wobble, alien theremin
    const dur=1.5;
    const carrier=audioCtx.createOscillator(); carrier.type='sine'; carrier.frequency.value=220;
    const modOsc=audioCtx.createOscillator(); modOsc.type='sine'; modOsc.frequency.value=280;
    const wobble=audioCtx.createOscillator(); wobble.type='sine'; wobble.frequency.value=0.4;
    const wobG=audioCtx.createGain(); wobG.gain.value=60;
    wobble.connect(wobG); wobG.connect(carrier.frequency);
    const ringG=audioCtx.createGain(); ringG.gain.value=0;
    modOsc.connect(ringG.gain); // ring mod
    carrier.connect(ringG);
    const env=audioCtx.createGain();
    env.gain.setValueAtTime(0,t); env.gain.linearRampToValueAtTime(vol*1.4,t+0.3);
    env.gain.setTargetAtTime(0,t+dur*0.7,dur*0.25);
    ringG.connect(env); out(env);
    [carrier,modOsc,wobble].forEach(o=>{o.start(t);o.stop(t+dur+0.1);});
    carrier.onended=()=>{try{carrier.disconnect();modOsc.disconnect();wobble.disconnect();wobG.disconnect();ringG.disconnect();env.disconnect();}catch(e){}};

  } else if(v===2){
    // SHUTTER — rapid noise burst + mechanical click, camera shutter
    if(!noiseBuffer) return;
    const clicks=3+Math.floor(Math.random()*2);
    for(let i=0;i<clicks;i++){
      const tt=t+i*0.022;
      const src=audioCtx.createBufferSource(); src.buffer=noiseBuffer;
      const hpf=audioCtx.createBiquadFilter(); hpf.type='highpass'; hpf.frequency.value=4000+Math.random()*2000;
      const g=audioCtx.createGain();
      g.gain.setValueAtTime(vol*(1-i*0.2),tt); g.gain.exponentialRampToValueAtTime(0.001,tt+0.018);
      src.connect(hpf); hpf.connect(g); out(g);
      src.start(tt); src.stop(tt+0.02);
      src.onended=()=>{try{src.disconnect();hpf.disconnect();g.disconnect();}catch(e){}};
      // Mechanical body click
      const oc=audioCtx.createOscillator(),gc=audioCtx.createGain();
      oc.type='square'; oc.frequency.setValueAtTime(2200,tt); oc.frequency.exponentialRampToValueAtTime(800,tt+0.012);
      gc.gain.setValueAtTime(vol*0.4,tt); gc.gain.exponentialRampToValueAtTime(0.001,tt+0.015);
      oc.connect(gc); out(gc); oc.start(tt); oc.stop(tt+0.018);
      oc.onended=()=>{try{oc.disconnect();gc.disconnect();}catch(e){}};
    }

  } else if(v===3){
    // ZAP — fast downward laser sweep, classic sci-fi
    const dur=0.18;
    osc('sawtooth', 1800, dur, vol*1.2, 80);
    // Noise burst underneath
    if(noiseBuffer){
      const src=audioCtx.createBufferSource(); src.buffer=noiseBuffer;
      const hpf=audioCtx.createBiquadFilter(); hpf.type='highpass'; hpf.frequency.value=2000;
      const g=audioCtx.createGain();
      g.gain.setValueAtTime(vol*0.4,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur*0.5);
      src.connect(hpf); hpf.connect(g); out(g);
      src.start(t); src.stop(t+dur);
      src.onended=()=>{try{src.disconnect();hpf.disconnect();g.disconnect();}catch(e){}};
    }

  } else if(v===4){
    // RISER — filtered noise sweep upward, DJ riser/transition
    if(!noiseBuffer) return;
    const dur=1.8;
    const src=audioCtx.createBufferSource(); src.buffer=noiseBuffer;
    const filt=audioCtx.createBiquadFilter(); filt.type='bandpass';
    filt.frequency.setValueAtTime(200,t); filt.frequency.exponentialRampToValueAtTime(8000,t+dur);
    filt.Q.value=3;
    const env=audioCtx.createGain();
    env.gain.setValueAtTime(0,t); env.gain.linearRampToValueAtTime(vol*1.3,t+dur*0.7);
    env.gain.exponentialRampToValueAtTime(0.001,t+dur);
    src.connect(filt); filt.connect(env); out(env);
    src.start(t); src.stop(t+dur+0.05);
    src.onended=()=>{try{src.disconnect();filt.disconnect();env.disconnect();}catch(e){}};

  } else {
    // VINYL — crackle + noise static, lo-fi record warmth
    if(!noiseBuffer) return;
    const dur=0.8;
    // Static hiss
    const src=audioCtx.createBufferSource(); src.buffer=noiseBuffer;
    const lpf=audioCtx.createBiquadFilter(); lpf.type='lowpass'; lpf.frequency.value=4000;
    const env=audioCtx.createGain();
    env.gain.setValueAtTime(vol*0.25,t); env.gain.setTargetAtTime(0,t+dur*0.5,dur*0.25);
    src.connect(lpf); lpf.connect(env); out(env);
    src.start(t); src.stop(t+dur);
    src.onended=()=>{try{src.disconnect();lpf.disconnect();env.disconnect();}catch(e){}};
    // Random crackle pops
    const pops=4+Math.floor(Math.random()*5);
    for(let i=0;i<pops;i++){
      const tt=t+Math.random()*dur*0.8;
      const ps=audioCtx.createBufferSource(); ps.buffer=noiseBuffer;
      const php=audioCtx.createBiquadFilter(); php.type='highpass'; php.frequency.value=1000+Math.random()*3000;
      const pg=audioCtx.createGain();
      pg.gain.setValueAtTime(vol*(0.1+Math.random()*0.4),tt); pg.gain.exponentialRampToValueAtTime(0.001,tt+0.008);
      ps.connect(php); php.connect(pg); out(pg);
      ps.start(tt); ps.stop(tt+0.01);
      ps.onended=()=>{try{ps.disconnect();php.disconnect();pg.disconnect();}catch(e){}};
    }
  }
}

function scheduleLaserOneShot(el, t){
  if(!audioCtx) return;
  const vol=(el.volume??0.6)*0.58;
  const sx=(el.shape&&el.shape.x!=null?el.shape.x:0.6);
  const sy=(el.shape&&el.shape.y!=null?el.shape.y:0.5);
  const tx=(el.tone&&el.tone.x!=null?el.tone.x:0.4);
  const ty=(el.tone&&el.tone.y!=null?el.tone.y:0.6);
  const panVal=getElPan(el);
  const v=el.variation??0;
  const spx=(el.space&&el.space.x!=null?el.space.x:0.55);

  const barLen=(60/bpm)*4;
  const sweepLen=Math.min(barLen*0.75, 0.4+sx*1.8);

  const panner=audioCtx.createStereoPanner();
  panner.pan.value=panVal+(Math.random()-0.5)*0.15;
  const revSend=audioCtx.createGain();
  revSend.gain.value=spx*0.65;
  panner.connect(sidechainGain||compressor);

  const masterGain=audioCtx.createGain();
  masterGain.gain.value=1.0;
  masterGain.connect(panner);
  if(reverbNode){masterGain.connect(revSend);revSend.connect(reverbNode);}

  const lowFilt=audioCtx.createBiquadFilter();
  lowFilt.type='lowpass';
  lowFilt.Q.value=4+ty*10;
  const lowEnv=audioCtx.createGain();
  lowEnv.gain.setValueAtTime(0,t);

  const highFilt=audioCtx.createBiquadFilter();
  highFilt.type='bandpass';
  highFilt.Q.value=2+ty*5;
  const highEnv=audioCtx.createGain();
  highEnv.gain.setValueAtTime(0,t);
  const highMix=audioCtx.createGain();
  highMix.gain.value=0.28+tx*0.18;

  lowEnv.connect(masterGain);
  highEnv.connect(highMix);highMix.connect(masterGain);

  function cleanup(){
    try{lowFilt.disconnect();lowEnv.disconnect();highFilt.disconnect();highEnv.disconnect();highMix.disconnect();masterGain.disconnect();panner.disconnect();revSend.disconnect();}catch(e){}
  }

  if(v===0){
    // SWEEP: low dives, high rises simultaneously
    const lowStart=300+tx*400; const lowEnd=28+sy*55;
    const highStart=800+tx*1200; const highEnd=4000+tx*6000;

    const osc=audioCtx.createOscillator();osc.type='sawtooth';
    osc.frequency.setValueAtTime(lowStart,t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(lowEnd,20),t+sweepLen);
    const sub=audioCtx.createOscillator();sub.type='sine';
    sub.frequency.setValueAtTime(lowStart*0.5,t);
    sub.frequency.exponentialRampToValueAtTime(Math.max(lowEnd*0.5,10),t+sweepLen);
    const subG=audioCtx.createGain();subG.gain.value=0.55;
    sub.connect(subG);subG.connect(lowFilt);
    lowFilt.frequency.setValueAtTime(lowStart*3,t);
    lowFilt.frequency.exponentialRampToValueAtTime(Math.max(lowEnd*2,20),t+sweepLen);
    lowEnv.gain.linearRampToValueAtTime(vol,t+0.012);
    lowEnv.gain.setValueAtTime(vol,t+sweepLen*0.7);
    lowEnv.gain.exponentialRampToValueAtTime(0.001,t+sweepLen+0.15);

    const hOsc1=audioCtx.createOscillator();hOsc1.type='sine';
    hOsc1.frequency.setValueAtTime(highStart,t);
    hOsc1.frequency.exponentialRampToValueAtTime(highEnd,t+sweepLen);
    const hOsc2=audioCtx.createOscillator();hOsc2.type='sine';
    hOsc2.frequency.setValueAtTime(highStart*1.32,t);
    hOsc2.frequency.exponentialRampToValueAtTime(highEnd*1.32,t+sweepLen);
    const hg2=audioCtx.createGain();hg2.gain.value=0.6;
    hOsc2.connect(hg2);hg2.connect(highFilt);
    highFilt.frequency.setValueAtTime(highStart*0.8,t);
    highFilt.frequency.exponentialRampToValueAtTime(highEnd*1.2,t+sweepLen);
    highEnv.gain.linearRampToValueAtTime(0.001,t+sweepLen*0.2);
    highEnv.gain.linearRampToValueAtTime(vol*0.55,t+sweepLen*0.7);
    highEnv.gain.exponentialRampToValueAtTime(0.001,t+sweepLen+0.08);

    osc.connect(lowFilt);lowFilt.connect(lowEnv);
    hOsc1.connect(highFilt);highFilt.connect(highEnv);
    const stopT=t+sweepLen+0.25;
    [osc,sub,hOsc1,hOsc2].forEach(o=>{o.start(t);o.stop(stopT);});
    osc.onended=()=>{try{osc.disconnect();sub.disconnect();subG.disconnect();hOsc1.disconnect();hOsc2.disconnect();hg2.disconnect();}catch(e){} cleanup();};

  } else if(v===1){
    // BREATH: deep note breathes, high overtone inverse-breathes
    const baseFreq=38+sy*75;
    const filterPeak=180+tx*900;
    const filterBase=45+sy*35;

    const osc=audioCtx.createOscillator();osc.type='sawtooth';
    osc.frequency.value=baseFreq;
    osc.detune.value=(Math.random()-0.5)*10;
    const osc2=audioCtx.createOscillator();osc2.type='sawtooth';
    osc2.frequency.value=baseFreq*1.004;
    const g2=audioCtx.createGain();g2.gain.value=0.4;
    osc2.connect(g2);g2.connect(lowFilt);
    lowFilt.frequency.setValueAtTime(filterBase,t);
    lowFilt.frequency.exponentialRampToValueAtTime(filterPeak,t+sweepLen*0.25);
    lowFilt.frequency.setValueAtTime(filterPeak,t+sweepLen*0.5);
    lowFilt.frequency.exponentialRampToValueAtTime(filterBase,t+sweepLen);
    lowEnv.gain.linearRampToValueAtTime(vol,t+0.02);
    lowEnv.gain.setValueAtTime(vol,t+sweepLen*0.8);
    lowEnv.gain.exponentialRampToValueAtTime(0.001,t+sweepLen+0.18);

    const hFreq=Math.min(baseFreq*5*(1+tx*0.5),8000);
    const hOsc=audioCtx.createOscillator();hOsc.type='sine';
    hOsc.frequency.value=hFreq;
    hOsc.detune.value=(Math.random()-0.5)*15;
    const hOsc2=audioCtx.createOscillator();hOsc2.type='sine';
    hOsc2.frequency.value=Math.min(hFreq*1.5,12000);
    const hg2b=audioCtx.createGain();hg2b.gain.value=0.4;
    hOsc2.connect(hg2b);hg2b.connect(highFilt);
    highFilt.frequency.value=Math.min(hFreq*1.2,10000);
    highEnv.gain.linearRampToValueAtTime(vol*0.5,t+0.015);
    highEnv.gain.setTargetAtTime(vol*0.15,t+sweepLen*0.2,sweepLen*0.08);
    highEnv.gain.setTargetAtTime(vol*0.5,t+sweepLen*0.6,sweepLen*0.08);
    highEnv.gain.exponentialRampToValueAtTime(0.001,t+sweepLen+0.1);

    osc.connect(lowFilt);lowFilt.connect(lowEnv);
    hOsc.connect(highFilt);highFilt.connect(highEnv);
    const stopT=t+sweepLen+0.3;
    [osc,osc2,hOsc,hOsc2].forEach(o=>{o.start(t);o.stop(stopT);});
    osc.onended=()=>{try{osc.disconnect();osc2.disconnect();g2.disconnect();hOsc.disconnect();hOsc2.disconnect();hg2b.disconnect();}catch(e){} cleanup();};

  } else if(v===2){
    // WAIL: low arcs up-then-down, high arcs down-then-up — mirror image
    const midLow=70+tx*200;
    const midHigh=2000+tx*4000;
    const riseTime=sweepLen*0.38;
    const fallTime=sweepLen*0.62;

    const osc=audioCtx.createOscillator();osc.type='sawtooth';
    osc.frequency.setValueAtTime(midLow*0.4,t);
    osc.frequency.exponentialRampToValueAtTime(midLow*2,t+riseTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(midLow*0.22,20),t+riseTime+fallTime);
    const mod=audioCtx.createOscillator();mod.type='sine';
    mod.frequency.setValueAtTime(midLow*0.8,t);
    mod.frequency.exponentialRampToValueAtTime(midLow*4,t+riseTime);
    mod.frequency.exponentialRampToValueAtTime(Math.max(midLow*0.4,20),t+riseTime+fallTime);
    const modG=audioCtx.createGain();
    modG.gain.setValueAtTime(midLow*ty*0.4,t);
    modG.gain.exponentialRampToValueAtTime(midLow*ty*1.2,t+riseTime);
    modG.gain.exponentialRampToValueAtTime(0.001,t+riseTime+fallTime*0.4);
    mod.connect(modG);modG.connect(osc.frequency);
    lowFilt.frequency.setValueAtTime(midLow*2,t);
    lowFilt.frequency.exponentialRampToValueAtTime(midLow*6,t+riseTime);
    lowFilt.frequency.exponentialRampToValueAtTime(midLow*1.5,t+riseTime+fallTime);
    lowEnv.gain.linearRampToValueAtTime(vol,t+0.015);
    lowEnv.gain.exponentialRampToValueAtTime(0.001,t+sweepLen+0.1);

    const hOsc=audioCtx.createOscillator();hOsc.type='sine';
    hOsc.frequency.setValueAtTime(midHigh*2.2,t);
    hOsc.frequency.exponentialRampToValueAtTime(midHigh*0.6,t+riseTime);
    hOsc.frequency.exponentialRampToValueAtTime(midHigh*3,t+riseTime+fallTime);
    const hOsc2=audioCtx.createOscillator();hOsc2.type='sine';
    hOsc2.frequency.setValueAtTime(midHigh*3.1,t);
    hOsc2.frequency.exponentialRampToValueAtTime(midHigh*0.8,t+riseTime);
    hOsc2.frequency.exponentialRampToValueAtTime(midHigh*4.2,t+riseTime+fallTime);
    const hg2=audioCtx.createGain();hg2.gain.value=0.5;
    hOsc2.connect(hg2);hg2.connect(highFilt);
    highFilt.frequency.setValueAtTime(midHigh*3,t);
    highFilt.frequency.exponentialRampToValueAtTime(midHigh*0.5,t+riseTime);
    highFilt.frequency.exponentialRampToValueAtTime(midHigh*4,t+riseTime+fallTime);
    highEnv.gain.linearRampToValueAtTime(0.001,t+riseTime*0.5);
    highEnv.gain.linearRampToValueAtTime(vol*0.45,t+riseTime);
    highEnv.gain.linearRampToValueAtTime(vol*0.65,t+riseTime+fallTime);
    highEnv.gain.exponentialRampToValueAtTime(0.001,t+sweepLen+0.06);

    osc.connect(lowFilt);lowFilt.connect(lowEnv);
    hOsc.connect(highFilt);highFilt.connect(highEnv);
    const stopT=t+sweepLen+0.25;
    [osc,mod,hOsc,hOsc2].forEach(o=>{o.start(t);o.stop(stopT);});
    mod.onended=()=>{try{mod.disconnect();modG.disconnect();}catch(e){}};
    osc.onended=()=>{try{osc.disconnect();hOsc.disconnect();hOsc2.disconnect();hg2.disconnect();}catch(e){} cleanup();};

  } else {
    // THROB: deep pulses, high tick on each pulse open — ca-ca-ca-ciaoo
    const baseFreq=33+sy*65;
    const numPulses=2+Math.floor(sx*3);
    const pulseSpacing=sweepLen/numPulses;
    const filterHigh=120+tx*500;
    const filterLow=35+sy*25;
    const highTickFreq=3000+tx*5000;

    const osc=audioCtx.createOscillator();osc.type='sawtooth';
    osc.frequency.value=baseFreq;
    const sub=audioCtx.createOscillator();sub.type='sine';
    sub.frequency.value=baseFreq*0.5;
    const subG=audioCtx.createGain();subG.gain.value=0.65;
    sub.connect(subG);subG.connect(lowFilt);
    lowFilt.frequency.setValueAtTime(filterLow,t);
    for(let i=0;i<numPulses;i++){
      const pt=t+i*pulseSpacing;
      lowFilt.frequency.setValueAtTime(filterLow,pt);
      lowFilt.frequency.exponentialRampToValueAtTime(filterHigh,pt+pulseSpacing*0.22);
      lowFilt.frequency.exponentialRampToValueAtTime(filterLow,pt+pulseSpacing*0.7);
      // High tick fires on each pulse open
      const hO=audioCtx.createOscillator();hO.type='sine';
      const tickFreq=highTickFreq*(1+Math.random()*0.3);
      const tickDecay=0.03+sx*0.02;
      hO.frequency.setValueAtTime(tickFreq,pt);
      hO.frequency.exponentialRampToValueAtTime(tickFreq*0.3,pt+tickDecay);
      const hG=audioCtx.createGain();
      hG.gain.setValueAtTime(vol*0.35,pt);
      hG.gain.exponentialRampToValueAtTime(0.001,pt+tickDecay);
      hO.connect(hG);hG.connect(masterGain);
      hO.start(pt);hO.stop(pt+tickDecay+0.02);
      hO.onended=()=>{try{hO.disconnect();hG.disconnect();}catch(e){}};
    }
    lowFilt.frequency.exponentialRampToValueAtTime(filterHigh,t+sweepLen);
    lowFilt.frequency.exponentialRampToValueAtTime(Math.max(filterLow*0.6,15),t+sweepLen+0.28);
    lowEnv.gain.linearRampToValueAtTime(vol,t+0.012);
    lowEnv.gain.setValueAtTime(vol,t+sweepLen*0.85);
    lowEnv.gain.exponentialRampToValueAtTime(0.001,t+sweepLen+0.38);

    osc.connect(lowFilt);lowFilt.connect(lowEnv);
    const stopT=t+sweepLen+0.5;
    [osc,sub].forEach(o=>{o.start(t);o.stop(stopT);});
    osc.onended=()=>{try{osc.disconnect();sub.disconnect();subG.disconnect();}catch(e){} cleanup();};
  }

  const delay=Math.max(0,(t-audioCtx.currentTime)*1000);
  setTimeout(()=>{el._pulse=0.9;el._flashPulse=0.8;},delay);
}

function buildArpPattern(el){
  const scale=document.getElementById('scaleSelect')?.value||'Minor';
  const key=document.getElementById('keySelect')?.value||'A';
  const variation = el.variation ?? 0;

  // Pick octave range per genre
  const octaves=GENRE_ARP_OCTAVES[currentStyle]||[3,4,5];
  const scaleNotes=getScaleNotes(key,scale,octaves);
  if(!scaleNotes.length){ el._arpPattern=[{midi:69,steps:4,vel:0.8,rest:false}]; el._arpStep=0; el._arpStepCounter=0; return; }

  const rootMidi=noteToMidi(el.note||'A3');
  let rootIdx=scaleNotes.findIndex(n=>n.midi>=rootMidi);
  if(rootIdx<0) rootIdx=Math.floor(scaleNotes.length/4);

  // ── MOTIF (v0): chameleon — repeating melodic hook, or sparse contemplative ─
  if(variation === 0){
    const isBrightLead = ['italo','trance','hardcore','hardtechno'].includes(currentStyle);

    if(isBrightLead){
      // Driving 6-note hook that REPEATS every bar. Same figure each pass — the
      // listener recognizes it. Uses chord-tone offsets so it transposes cleanly
      // when the chord progression advances. Rhythmic positions every 2-3 steps.
      // Use genre signature intervals as the hook — this is the recurring figure
      // the listener will recognize. Falls back to random variants for genres
      // without a signature (shouldn't happen but safe).
      const hookVariants = [
        [0, 2, 4, 7, 4, 2],
        [0, 4, 7, 4, 2, 0],
        [0, 2, 4, 2, 4, 7],
        [7, 4, 2, 4, 0, 2],
        [0, 4, 2, 7, 4, 2],
      ];
      const sigOffsets = getSignatureHookOffsets();
      // Blend: 65% signature, 35% random variant for variety
      const hook = Math.random() < 0.65
        ? sigOffsets
        : hookVariants[Math.floor(Math.random()*hookVariants.length)];
      const positions = [0, 3, 6, 8, 11, 14]; // 6 notes per 16-step bar
      const pattern = [];
      for(let i=0; i<32; i++){
        const barPos = i % 16;
        const hookIdx = positions.indexOf(barPos);
        if(hookIdx >= 0){
          const offset = hook[hookIdx];
          const noteIdx = Math.max(0, Math.min(scaleNotes.length-1, rootIdx+offset));
          const midi = Math.max(24, Math.min(108, scaleNotes[noteIdx].midi));
          // Beat-1 of each bar gets accent; mid-bar notes softer
          const accent = (barPos===0 || barPos===8) ? 0.92 : 0.72;
          const vel = accent + Math.random()*0.08;
          pattern.push({midi, steps:1, gate:0.65, vel, rest:false, portamento:false});
        } else {
          const rootNote = scaleNotes[rootIdx]?.midi || 69;
          pattern.push({midi:rootNote, steps:1, gate:0.5, vel:0.5, rest:true, portamento:false});
        }
      }
      el._arpPattern=pattern; el._arpContour='hook'; el._arpStep=0; el._arpStepCounter=0;
      return;
    }

    // Warm-genre sparse motif: 3-5 notes across 2 bars, heavy rests, breathing
    const phraseLen = 3 + Math.floor(Math.random()*3); // 3–5 notes
    const contourKeys = GENRE_ARP_CONTOURS[currentStyle] || ['arch','wave','call'];
    const contourKey = contourKeys[Math.floor(Math.random()*contourKeys.length)];
    const offsets = ARP_CONTOURS[contourKey] || [0,2,4,2];
    const pattern = [];
    const notePositions = [0, 4, 8, 14, 20, 26].slice(0, phraseLen);
    let patStep = 0;
    for(let i=0; i<32; i++){
      const isNote = notePositions.includes(i);
      if(isNote){
        const offset = offsets[patStep % offsets.length];
        const noteIdx = Math.max(0, Math.min(scaleNotes.length-1, rootIdx+offset));
        const midi = Math.max(24, Math.min(108, scaleNotes[noteIdx].midi));
        const vel = 0.65 + Math.random()*0.25;
        pattern.push({midi, steps:1, gate:0.75+Math.random()*0.2, vel, rest:false, portamento:false});
        patStep++;
      } else {
        const rootNote = scaleNotes[rootIdx]?.midi || 69;
        pattern.push({midi:rootNote, steps:1, gate:0.5, vel:0.5, rest:true, portamento:false});
      }
    }
    el._arpPattern=pattern; el._arpContour=contourKey; el._arpStep=0; el._arpStepCounter=0;
    return;
  }

  // ── SHIMMER (v2): chameleon — bright chord arpeggio, or sparse atmospheric wash ─
  if(variation === 2){
    const isBrightLead = ['italo','trance','hardcore','hardtechno'].includes(currentStyle);

    if(isBrightLead){
      // Dense high-octave chord arpeggio — 8 notes per bar, sparkly sustained
      // movement. Lives on top of the mix. Quiet per note but constant presence.
      const chordOffsets = [0, 2, 4, 7, 4, 2, 7, 4]; // R-3-5-oct-5-3-oct-5 sparkle
      const positions = [0, 2, 4, 6, 8, 10, 12, 14]; // every 2 steps
      // Push the arp UP an octave so it sits above pads/chord — true "shimmer"
      const octShift = 12;
      const pattern = [];
      for(let i=0; i<32; i++){
        const barPos = i % 16;
        const arpIdx = positions.indexOf(barPos);
        if(arpIdx >= 0){
          const offset = chordOffsets[arpIdx];
          const noteIdx = Math.max(0, Math.min(scaleNotes.length-1, rootIdx+offset));
          const midi = Math.max(24, Math.min(108, scaleNotes[noteIdx].midi + octShift));
          // Soft accent: down-beats slightly louder
          const accent = (barPos % 4 === 0) ? 0.55 : 0.42;
          const vel = accent + Math.random()*0.10;
          pattern.push({midi, steps:1, gate:0.65, vel, rest:false, portamento:false});
        } else {
          pattern.push({midi: scaleNotes[rootIdx]?.midi || 69, steps:1, gate:0.5, vel:0.4, rest:true, portamento:false});
        }
      }
      el._arpPattern=pattern; el._arpContour='sparkle'; el._arpStep=0; el._arpStepCounter=0;
      return;
    }

    // Warm-genre wash: sparse chord tones, lots of silence — atmospheric
    const chordOffsets = [0, 2, 4, 7]; // root, 3rd, 5th, octave
    const pattern = [];
    for(let i=0; i<32; i++){
      const isNote = i % (4+Math.floor(Math.random()*4)) === 0;
      const offset = chordOffsets[i % chordOffsets.length];
      const noteIdx = Math.max(0, Math.min(scaleNotes.length-1, rootIdx+offset));
      const midi = Math.max(24, Math.min(108, scaleNotes[noteIdx].midi));
      const vel = 0.35 + Math.random()*0.25; // quiet — shimmer is background
      pattern.push({midi, steps:1, gate:0.9, vel, rest:!isNote, portamento:false});
    }
    el._arpPattern=pattern; el._arpContour='shimmer'; el._arpStep=0; el._arpStepCounter=0;
    return;
  }

  // ── PULSE (v1) and PHRASE (v3): rhythm-driven patterns ────────────────────
  const GROOVE_WEIGHT = {
    deephouse:0.55, downtempo:0.50, electronica:0.45, ukgarage:0.40,
    dubtechno:0.35, dnb:0.30,
  };
  const grooveW = GROOVE_WEIGHT[currentStyle] ?? 0;
  const preferred = GENRE_ARP_CONTOURS[currentStyle] || ['arch','groove','pendulum'];
  let contourKey;
  if(grooveW > 0 && Math.random() < grooveW){
    contourKey = 'groove';
  } else {
    contourKey = Math.random() < 0.85
      ? preferred[Math.floor(Math.random()*preferred.length)]
      : Object.keys(ARP_CONTOURS)[Math.floor(Math.random()*Object.keys(ARP_CONTOURS).length)];
  }
  const baseOffsets=ARP_CONTOURS[contourKey];

  // Pulse uses sparser rhythms; Phrase uses longer note values
  const rhythms = variation===1
    ? GENRE_ARP_RHYTHMS[currentStyle] || [[1,1,1,1,1,1,1,1]]
    : (GENRE_ARP_RHYTHMS[currentStyle]||[[2,2,2,2]]).map(r=>r.map(v=>v*1)); // Phrase: same rhythms, longer feel via gate

  const rhythm=rhythms[Math.floor(Math.random()*rhythms.length)];

  const REST_CHANCE = {
    deephouse:0.12, dubtechno:0.18, ambienttechno:0.22, downtempo:0.15,
    electronica:0.12, minimaltechno:0.16, dnb:0.06, techhouse:0.06,
    trance:0.04, italo:0.03, acidhouse:0.05, detroittechno:0.08,
    ukgarage:0.07, hardcore:0.05, hardtechno:0.05,
  };
  // Phrase rests more — breathes between musical thoughts
  const restChance = (REST_CHANCE[currentStyle] ?? 0.08) * (variation===3 ? 1.8 : 1.0);

  const len=32;
  const pattern=[];
  let prevOffset = baseOffsets[0];

  const relatedContours = {
    arch:['valley','wave','call'], valley:['arch','modal','response'], groove:['groove','clave','syncopate'],
    ascend:['descend','ladder','spiral'], descend:['ascend','valley','stepdown'], pendulum:['arch','bounce','ping'],
    stutter:['groove','clave','ostinato'], leapdown:['arch','ping','bounce'],
    arpeggio:['triad','arch','spiral'], pentatonic:['modal','blues','wave'],
    spiral:['arch','ladder','wave'], bounce:['ping','pendulum','leapdown'],
    wave:['arch','modal','call'], ladder:['ascend','spiral','stepdown'],
    clave:['groove','syncopate','ostinato'], triad:['arpeggio','arch','modal'],
    blues:['pentatonic','groove','response'], ping:['bounce','leapdown','pendulum'],
    stepdown:['descend','valley','response'], modal:['pentatonic','wave','call'],
    call:['response','arch','wave'], response:['call','valley','modal'],
    ostinato:['groove','clave','stutter'], syncopate:['clave','groove','bounce'],
  };
  const bar2ContourKey = Math.random()<0.7
    ? (relatedContours[contourKey]||[contourKey])[Math.floor(Math.random()*2)]
    : contourKey;
  const bar2Offsets = ARP_CONTOURS[bar2ContourKey] || baseOffsets;
  const bar2OctShift = Math.random()<0.25 ? 12 : 0;

  for(let i=0; i<len; i++){
    const isBar2 = i >= 16;
    const offsets = isBar2 ? bar2Offsets : baseOffsets;
    const offset = offsets[i%offsets.length];
    const nudge = Math.random()<0.07 ? (Math.random()<0.5?1:-1) : 0;
    const noteIdx = Math.max(0, Math.min(scaleNotes.length-1, rootIdx+offset+nudge));
    const stepOctShift = isBar2 ? bar2OctShift : 0;
    const midi = Math.max(24, Math.min(108, scaleNotes[noteIdx].midi+stepOctShift));
    const steps = rhythm[i%rhythm.length];
    // Phrase: longer gate feels more connected
    const gate = variation===3
      ? (Math.random()<0.1 ? 0.45 : 0.92)
      : (steps===1 && Math.random()<0.15 ? 0.30 : 0.82);
    const rest = i > 0 && Math.random() < (isBar2 ? restChance*1.3 : restChance);
    const beatPos = i % 4;
    const velBase = beatPos===0 ? 0.92+Math.random()*0.08
                  : beatPos===2 ? 0.68+Math.random()*0.10
                  : 0.42+Math.random()*0.28;
    const intervalSize = Math.abs(offset - prevOffset);
    const usePortamento = intervalSize >= 4 && Math.random() < 0.65;
    prevOffset = offset;
    pattern.push({midi, steps, gate, vel:velBase, rest, portamento:usePortamento});
  }

  el._arpPattern=pattern;
  el._arpContour=contourKey;
  el._arpStep=0;
  el._arpStepCounter=0;
}

function schedulePulseOneShot(el, t, freqOverride=null){
  if(!audioCtx) return;
  const model=getSoundModel('Pulse');
  const freq=freqOverride??midiToFreq(noteToMidi(el.note||'A3'));
  const vol=(el.volume??0.65)*0.55;
  const sx=(el.shape&&el.shape.x!=null?el.shape.x:0.35);
  const tx=(el.tone&&el.tone.x!=null?el.tone.x:0.55);
  const ty=(el.tone&&el.tone.y!=null?el.tone.y:0.3);
  const panVal=getElPan(el);
  // Phase 4: genre-aware chord voicing via semitone offsets
  const semitones=getChordVoicing('Pulse', el);
  const notes=voicingToFreqs(freq, semitones);
  const gateMult=model.gateMult??1.0;
  const softAtk=model.attackSoft??false;
  const isItalo=currentStyle==='italo';
  const gateLen=(0.10+Math.pow(sx,1.5)*0.9)*gateMult;
  const attack=softAtk?0.02+sx*0.04:0.005+sx*0.02;
  const release=0.08+sx*0.3;
  // Italo: brighter filter base, opens much wider on attack for signature shimmer
  const baseCutoff=isItalo ? 1200+Math.pow(tx,1.2)*6000 : 350+Math.pow(tx,1.4)*4000;
  const filter=audioCtx.createBiquadFilter();
  filter.type='lowpass';
  filter.Q.value=Math.max(0.1,isItalo ? 0.8+ty*2.5 : 0.4+ty*4);
  filter.frequency.setValueAtTime(Math.min(18000,baseCutoff*(isItalo?2.8:1.5+tx*2)),t);
  filter.frequency.exponentialRampToValueAtTime(Math.max(200,baseCutoff),t+attack+0.05);
  const gainNode=audioCtx.createGain();
  gainNode.gain.setValueAtTime(0,t);
  gainNode.gain.linearRampToValueAtTime(vol,t+attack);
  gainNode.gain.setTargetAtTime(vol*0.6,t+attack,gateLen*0.25);
  gainNode.gain.setTargetAtTime(0.0001,t+gateLen,release*0.4);
  const sat=audioCtx.createWaveShaper();
  const c=new Float32Array(256);
  for(let i=0;i<256;i++){const x=i*2/256-1;c[i]=Math.tanh(x*1.6)/Math.tanh(1.6);}
  sat.curve=c;
  const panner=audioCtx.createStereoPanner();
  panner.pan.value=panVal;
  const revSend=audioCtx.createGain();
  const delayWet=audioCtx.createGain();
  const delayNode=audioCtx.createDelay(2.0);
  const delayWetAmt=model.delayWet??(((el.space&&el.space.x!=null?el.space.x:0.35))*0.35);
  revSend.gain.value=((el.space&&el.space.x!=null?el.space.x:0.35))*0.5;
  delayWet.gain.value=delayWetAmt;
  delayNode.delayTime.value=(60/bpm)*1.5; // dotted quarter
  // Voice gain tapers off: root loudest, upper voices progressively quieter
  const voiceGains=[0.55,0.32,0.22,0.14];
  const stopT=t+gateLen+release+0.15;
  notes.forEach((f,i)=>{
    const o=audioCtx.createOscillator();
    o.type=isItalo?'sawtooth':sx<0.35?'sawtooth':'triangle';
    o.frequency.value=f;
    o.detune.value=[-5,-1,0,3][i]||0;
    const g=audioCtx.createGain();
    g.gain.value=voiceGains[i]??0.12;
    o.connect(g); g.connect(sat);
    o.start(t); o.stop(stopT);
    o.onended=()=>{ try{o.disconnect();g.disconnect();}catch(e){} };
  });
  sat.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(panner);
  if(delayWetAmt>0.05){
    gainNode.connect(delayNode);
    delayNode.connect(delayWet);
    delayWet.connect(panner);
  }
  if(reverbNode){gainNode.connect(revSend);revSend.connect(reverbNode);}
  panner.connect(sidechainGain||compressor);
  setTimeout(()=>{
    try{sat.disconnect();filter.disconnect();gainNode.disconnect();
        panner.disconnect();revSend.disconnect();delayWet.disconnect();}catch(e){}
  },(stopT-audioCtx.currentTime+0.3)*1000);
}

const KICK_PROFILES={
  house:      {bodyStart:180,bodyEnd:35, bodyDecay:0.12,bodyHold:0.06,bodyGain:1.0, punchFreq:140,punchDecay:0.022,punchGain:0.28, clickFreq:800, clickDecay:0.015,clickGain:0.40,clickType:'square', noiseBurst:0.15,noiseBurstDecay:0.008, subTail:true, subDecay:0.35,subGain:0.25},
  techno:     {bodyStart:200,bodyEnd:40, bodyDecay:0.08,bodyHold:0.03,bodyGain:1.4, punchFreq:180,punchDecay:0.015,punchGain:0.45, clickFreq:1200,clickDecay:0.010,clickGain:0.60,clickType:'square', noiseBurst:0.22,noiseBurstDecay:0.006, subTail:false},
  dub:        {bodyStart:100,bodyEnd:38, bodyDecay:0.16,bodyHold:0.09,bodyGain:0.9, punchFreq:90, punchDecay:0.030,punchGain:0.22, clickFreq:500, clickDecay:0.022,clickGain:0.25,clickType:'sine',   noiseBurst:0.12,noiseBurstDecay:0.012, subTail:true, subDecay:0.45,subGain:0.35},
  dnb:        {bodyStart:220,bodyEnd:50, bodyDecay:0.05,bodyHold:0.015,bodyGain:1.5,punchFreq:160,punchDecay:0.015,punchGain:0.55, clickFreq:1400,clickDecay:0.010,clickGain:0.75,clickType:'square', noiseBurst:0.30,noiseBurstDecay:0.005, subTail:false},
  trance:     {bodyStart:160,bodyEnd:40, bodyDecay:0.10,bodyHold:0.05,bodyGain:1.3, punchFreq:150,punchDecay:0.018,punchGain:0.38, clickFreq:1000,clickDecay:0.020,clickGain:0.42,clickType:'sine',   noiseBurst:0.16,noiseBurstDecay:0.007, subTail:true, subDecay:0.40,subGain:0.25},
  hiphop:     {bodyStart:120,bodyEnd:38, bodyDecay:0.18,bodyHold:0.10,bodyGain:1.1, punchFreq:100,punchDecay:0.030,punchGain:0.20, clickFreq:600, clickDecay:0.025,clickGain:0.35,clickType:'square', noiseBurst:0.14,noiseBurstDecay:0.010, subTail:true, subDecay:0.50,subGain:0.40},
  ambient:    {bodyStart:90, bodyEnd:40, bodyDecay:0.20,bodyHold:0.12,bodyGain:0.7, punchFreq:80, punchDecay:0.035,punchGain:0.15, clickFreq:400, clickDecay:0.030,clickGain:0.20,clickType:'sine',   noiseBurst:0.08,noiseBurstDecay:0.015, subTail:true, subDecay:0.60,subGain:0.40},
  garage:     {bodyStart:160,bodyEnd:40, bodyDecay:0.10,bodyHold:0.04,bodyGain:1.2, punchFreq:130,punchDecay:0.020,punchGain:0.38, clickFreq:900, clickDecay:0.015,clickGain:0.48,clickType:'square', noiseBurst:0.20,noiseBurstDecay:0.007, subTail:false},
  hardcore:   {bodyStart:180,bodyEnd:38, bodyDecay:0.055,bodyHold:0.012,bodyGain:2.2,punchFreq:200,punchDecay:0.012,punchGain:0.85, clickFreq:2500,clickDecay:0.008,clickGain:1.0, clickType:'square', noiseBurst:0.55,noiseBurstDecay:0.005, distort:true, subTail:false},
  hardtechno: {bodyStart:80, bodyEnd:35, bodyDecay:0.18, bodyHold:0.02, bodyGain:1.2,punchFreq:160,punchDecay:0.018,punchGain:0.50, clickFreq:1800,clickDecay:0.010,clickGain:0.55,clickType:'square', noiseBurst:0.25,noiseBurstDecay:0.008, distort:true, subTail:true, subDecay:0.22,subGain:0.22},
  italo:      {bodyStart:170,bodyEnd:42, bodyDecay:0.09,bodyHold:0.04,bodyGain:1.25,punchFreq:150,punchDecay:0.018,punchGain:0.42, clickFreq:1100,clickDecay:0.012,clickGain:0.55,clickType:'square', noiseBurst:0.18,noiseBurstDecay:0.007, subTail:true, subDecay:0.22,subGain:0.30},
  electronica:{bodyStart:100,bodyEnd:42, bodyDecay:0.14,bodyHold:0.06,bodyGain:0.85,punchFreq:100,punchDecay:0.025,punchGain:0.22, clickFreq:500, clickDecay:0.020,clickGain:0.30,clickType:'sine',   noiseBurst:0.10,noiseBurstDecay:0.012, subTail:true, subDecay:0.40,subGain:0.32},
};

let _lastKickBodyStart = null;
let _kickHitCount = 0;

function scheduleKick(t,velMult=1){
  if(!audioCtx) return;
  // Humanise: tiny random velocity and timing nudge every hit
  const hv=0.93+Math.random()*0.07;
  const ht=Math.random()*0.001; // ±1ms timing flutter
  t=t+ht;
  const v=Math.max(0.4,Math.min(1.1,velMult*hv));
  const p=getKickProfile(); // genre-aware: merges KICK_PROFILES + DRUM_KIT_PROFILES

  // DFAM pitch coupling: bodyStart is nudged by previous hit's starting pitch.
  // Coupling amount varies by genre — techno genres get more, ambient gets none.
  const dfamCoupling = {
    techno:0.08, hardtechno:0.10, hardcore:0.12, detroittechno:0.07,
    minimaltechno:0.09, dnb:0.06, house:0.04, garage:0.04,
    dub:0.02, ambient:0.0, italo:0.03, trance:0.04, hiphop:0.03, electronica:0.05,
  }[activeDrumStyle] ?? 0.05;

  let coupledBodyStart = p.bodyStart;
  if(_lastKickBodyStart !== null && dfamCoupling > 0){
    // Nudge toward previous pitch, scaled by coupling amount
    // Then drift back toward base over time (every 4 hits)
    const drift = (_kickHitCount % 4 === 0) ? 0 : 1;
    const target = drift ? _lastKickBodyStart : p.bodyStart;
    coupledBodyStart = p.bodyStart + (target - p.bodyStart) * dfamCoupling;
    // Small random perturbation on top — the DFAM's analog imprecision
    coupledBodyStart *= (1 + (Math.random() - 0.5) * dfamCoupling * 0.5);
    coupledBodyStart = Math.max(p.bodyStart * 0.85, Math.min(p.bodyStart * 1.18, coupledBodyStart));
  }
  _lastKickBodyStart = coupledBodyStart;
  _kickHitCount++;

  // Body: sine pitch sweep — using DFAM-coupled start frequency
  const body=audioCtx.createOscillator(),bodyG=audioCtx.createGain();
  body.frequency.setValueAtTime(coupledBodyStart,t);
  body.frequency.exponentialRampToValueAtTime(p.bodyEnd,t+p.bodyDecay);
  bodyG.gain.setValueAtTime(p.bodyGain*v,t);
  bodyG.gain.exponentialRampToValueAtTime(0.001,t+p.bodyDecay*1.2);

  // Punch: triangle mid-freq transient
  const punch=audioCtx.createOscillator();punch.type='triangle';
  const punchG=audioCtx.createGain();
  punch.frequency.setValueAtTime(p.punchFreq,t);
  punch.frequency.exponentialRampToValueAtTime(p.punchFreq*0.5,t+p.punchDecay);
  punchG.gain.setValueAtTime(p.punchGain*v,t);
  punchG.gain.exponentialRampToValueAtTime(0.001,t+p.punchDecay);

  // Click: high transient
  const click=audioCtx.createOscillator();click.type=p.clickType||'square';
  const clickG=audioCtx.createGain();
  click.frequency.setValueAtTime(p.clickFreq,t);
  click.frequency.exponentialRampToValueAtTime(p.clickFreq*0.1,t+p.clickDecay);
  clickG.gain.setValueAtTime(p.clickGain*v,t);
  clickG.gain.exponentialRampToValueAtTime(0.001,t+p.clickDecay);

  // Membrane noise: short broadband burst at attack for physical "thump"
  let memNoise=null,memNoiseG=null,memNoiseLpf=null;
  if(noiseBuffer){
    memNoise=audioCtx.createBufferSource();memNoise.buffer=noiseBuffer;
    memNoiseLpf=audioCtx.createBiquadFilter();memNoiseLpf.type='bandpass';
    memNoiseLpf.frequency.value=180;memNoiseLpf.Q.value=0.8;
    memNoiseG=audioCtx.createGain();
    memNoiseG.gain.setValueAtTime(0.35*v,t);
    memNoiseG.gain.exponentialRampToValueAtTime(0.001,t+0.012);
    memNoise.connect(memNoiseLpf);memNoiseLpf.connect(memNoiseG);
    memNoise.onended=()=>{try{memNoise.disconnect();memNoiseLpf.disconnect();memNoiseG.disconnect();}catch(e){}};
  }

  // Air noise: HPF noise burst for attack snap
  let noiseSrc=null,noiseG=null,noiseHpf=null;
  if(noiseBuffer&&p.noiseBurst>0){
    noiseSrc=audioCtx.createBufferSource();noiseSrc.buffer=noiseBuffer;
    noiseHpf=audioCtx.createBiquadFilter();noiseHpf.type='highpass';noiseHpf.frequency.value=800;
    noiseG=audioCtx.createGain();
    noiseG.gain.setValueAtTime(p.noiseBurst*v,t);
    noiseG.gain.exponentialRampToValueAtTime(0.001,t+p.noiseBurstDecay);
    noiseSrc.connect(noiseHpf);noiseHpf.connect(noiseG);
    noiseSrc.onended=()=>{try{noiseSrc.disconnect();noiseHpf.disconnect();noiseG.disconnect();}catch(e){}};
  }

  // Warm saturation on ALL genres (not just distort) — tanh with gentle drive
  const satDrive = p.distort ? 7 : 2.2;
  const satOut   = p.distort ? 0.85 : 0.92;
  const ws=audioCtx.createWaveShaper();
  const curve=new Float32Array(512);
  for(let i=0;i<512;i++){const x=i*2/512-1;curve[i]=Math.tanh(x*satDrive)*satOut;}
  ws.curve=curve;if(p.distort) ws.oversample='4x';

  const mixG=audioCtx.createGain();mixG.gain.value=p.distort?0.7:0.85;
  body.connect(bodyG);bodyG.connect(mixG);
  punch.connect(punchG);punchG.connect(mixG);
  click.connect(clickG);clickG.connect(mixG);
  if(noiseG) noiseG.connect(mixG);
  if(memNoiseG) memNoiseG.connect(mixG);
  const outG=audioCtx.createGain();outG.gain.value=p.distort?0.9:1.0;
  mixG.connect(ws);ws.connect(outG);outG.connect(drumGain);
  // Rumble bus tap — body low end feeds the distorted sub rumble chain
  if(rumbleInput){ const _rb=audioCtx.createGain();_rb.gain.value=0.6;bodyG.connect(_rb);_rb.connect(rumbleInput);outG.onended=()=>{try{_rb.disconnect();}catch(e){}};}
  // W7: Kick room send — minimal, keeps kick punchy and dry
  if(drumRoomSend){ const _kr=audioCtx.createGain();_kr.gain.value=0.05;outG.connect(_kr);_kr.connect(drumRoomSend);}

  body.onended=()=>{try{body.disconnect();punch.disconnect();click.disconnect();bodyG.disconnect();punchG.disconnect();clickG.disconnect();mixG.disconnect();ws.disconnect();outG.disconnect();}catch(e){}};
  punch.onended=()=>{try{punch.disconnect();punchG.disconnect();}catch(e){}};
  click.onended=()=>{try{click.disconnect();clickG.disconnect();}catch(e){}};

  body.start(t);punch.start(t);click.start(t);
  if(noiseSrc){noiseSrc.start(t);noiseSrc.stop(t+p.noiseBurstDecay+0.01);}
  if(memNoise){memNoise.start(t);memNoise.stop(t+0.018);}
  body.stop(t+p.bodyDecay*1.2+0.1);
  punch.stop(t+p.punchDecay+0.05);
  click.stop(t+p.clickDecay+0.02);

  if(p.subTail){
    const sub=audioCtx.createOscillator();sub.type='sine';sub.frequency.value=p.bodyEnd;
    const subG=audioCtx.createGain();
    subG.gain.setValueAtTime(p.subGain*v,t+p.bodyHold);
    subG.gain.exponentialRampToValueAtTime(0.001,t+p.bodyHold+p.subDecay);
    sub.connect(subG);subG.connect(drumGain);
    sub.start(t+p.bodyHold);sub.stop(t+p.bodyHold+p.subDecay+0.1);
    sub.onended=()=>{try{sub.disconnect();subG.disconnect();}catch(e){}};
  }
  const delay=Math.max(0,(t-audioCtx.currentTime)*1000);
  setTimeout(()=>{beatPulseKick=1;triggerSidechain();},delay);
  rumbleKickSidechain(t); // duck rumble tail on kick hit
}

function scheduleClap(t,velMult=1){
  if(!audioCtx||!noiseBuffer) return;
  // Humanise
  const hv=0.92+Math.random()*0.08;
  const ht=Math.random()*0.0015;
  t=t+ht;
  const v=Math.max(0.4,Math.min(1.1,velMult*hv));
  const p=getClapProfile(); // genre-aware: merges CLAP_PROFILES + DRUM_KIT_PROFILES
  for(let b=0;b<p.bursts;b++){
    const off=b*p.spacing;
    const src=audioCtx.createBufferSource();src.buffer=noiseBuffer;
    const bpf=audioCtx.createBiquadFilter();bpf.type='bandpass';
    bpf.frequency.value=p.bpfFreq*(0.97+Math.random()*0.06); // slight freq variation per burst
    bpf.Q.value=p.bpfQ;
    const burstEnd=t+off+p.burstDecay+(b===0?p.tailDecay:p.burstDecay*0.3);
    const g=audioCtx.createGain();
    g.gain.setValueAtTime(p.gain*v,t+off);
    g.gain.exponentialRampToValueAtTime(0.001,burstEnd);
    let hpf=null;
    if(p.hpf){
      hpf=audioCtx.createBiquadFilter();hpf.type='highpass';hpf.frequency.value=p.hpf;
      src.connect(hpf);hpf.connect(bpf);
    } else {src.connect(bpf);}
    if(p.distort){
      const ws=audioCtx.createWaveShaper();
      const c=new Float32Array(256);
      for(let i=0;i<256;i++){const x=i*2/256-1;c[i]=Math.tanh(x*4);}
      ws.curve=c;bpf.connect(ws);ws.connect(g);
      src.onended=()=>{try{src.disconnect();if(hpf)hpf.disconnect();bpf.disconnect();ws.disconnect();g.disconnect();}catch(e){}};
    } else {
      bpf.connect(g);
      src.onended=()=>{try{src.disconnect();if(hpf)hpf.disconnect();bpf.disconnect();g.disconnect();}catch(e){}};
    }
    g.connect(drumGain);
    src.start(t+off);src.stop(burstEnd+0.02);
    if(b===0&&p.bodyFreq){
      const bod=audioCtx.createOscillator();bod.type='triangle';
      bod.frequency.setValueAtTime(p.bodyFreq,t+off);
      bod.frequency.exponentialRampToValueAtTime(p.bodyFreq*0.6,t+off+p.bodyDecay);
      const bg=audioCtx.createGain();
      bg.gain.setValueAtTime(0.30*v,t+off);
      bg.gain.exponentialRampToValueAtTime(0.001,t+off+p.bodyDecay);
      bod.connect(bg);bg.connect(drumGain);
      bod.start(t+off);bod.stop(t+off+p.bodyDecay+0.02);
      bod.onended=()=>{try{bod.disconnect();bg.disconnect();}catch(e){}};
    }
  }
  // Room tail: diffuse noise filtered to ~2kHz, decays like a small room
  if(noiseBuffer){
    const room=audioCtx.createBufferSource();room.buffer=noiseBuffer;
    const roomBpf=audioCtx.createBiquadFilter();roomBpf.type='bandpass';
    roomBpf.frequency.value=1800;roomBpf.Q.value=0.4;
    const roomLpf=audioCtx.createBiquadFilter();roomLpf.type='lowpass';roomLpf.frequency.value=4000;
    const roomG=audioCtx.createGain();
    const roomStart=t+p.bursts*p.spacing+0.004;
    const roomDecay=p.tailDecay*0.7;
    roomG.gain.setValueAtTime(p.gain*v*0.18,roomStart);
    roomG.gain.exponentialRampToValueAtTime(0.001,roomStart+roomDecay);
    room.connect(roomBpf);roomBpf.connect(roomLpf);roomLpf.connect(roomG);roomG.connect(drumGain);
    room.onended=()=>{try{room.disconnect();roomBpf.disconnect();roomLpf.disconnect();roomG.disconnect();}catch(e){}};
    room.start(roomStart);room.stop(roomStart+roomDecay+0.02);
  }
  const delay=Math.max(0,(t-audioCtx.currentTime)*1000);
  setTimeout(()=>{beatPulseClap=1;},delay);
  // W7: Clap room send — medium plate/room character
  if(drumRoomSend&&noiseBuffer){
    const rs=audioCtx.createBufferSource();rs.buffer=noiseBuffer;
    const rsHpf=audioCtx.createBiquadFilter();rsHpf.type='highpass';rsHpf.frequency.value=1200;
    const rsG=audioCtx.createGain();
    const tightness=DRUM_TIGHTNESS[activeDrumStyle]??1.0;
    rsG.gain.setValueAtTime(0.22,t+0.008);
    rsG.gain.exponentialRampToValueAtTime(0.001,t+0.08*tightness);
    rs.connect(rsHpf);rsHpf.connect(rsG);rsG.connect(drumRoomSend);
    rs.start(t+0.006);rs.stop(t+0.09*tightness+0.01);
    rs.onended=()=>{try{rs.disconnect();rsHpf.disconnect();rsG.disconnect();}catch(e){}};
  }
}

function _buildHihat(t,vel,isOpen){
  if(!audioCtx||!noiseBuffer) return;
  // Humanise
  const hv=0.92+Math.random()*0.08;
  const ht=Math.random()*0.0008;
  t=t+ht;
  const p=getHihatProfile(); // genre-aware: merges HIHAT_PROFILES + DRUM_KIT_PROFILES
  // DRUM-01: Apply tightness to hihat decay so DNB hats snap, dub hats ring
  const tightnessHH = DRUM_TIGHTNESS[activeDrumStyle] ?? 1.0;
  const decay=(isOpen?p.openDecay:p.closedDecay) * tightnessHH;
  const velFinal=(isOpen?1.05:vel)*hv;
  const mVol=velFinal*p.metalGain;
  const nVol=velFinal*p.noiseGain;

  // 6 inharmonic square oscillators — real cymbals have complex inharmonic spectra
  // Per-genre metallic ratios give each genre's hi-hat a distinct character
  const mr = p.metalRatios || [1, 1.483, 1.932, 2.546, 3.014, 4.011];
  const baseFreqs=[p.f1*mr[0], p.f1*mr[1], p.f1*mr[2], p.f1*mr[3], p.f1*mr[4], p.f1*mr[5]];
  const metalMix=audioCtx.createGain();metalMix.gain.value=1;
  const metalHpf=audioCtx.createBiquadFilter();metalHpf.type='highpass';metalHpf.frequency.value=5000;
  const mGain=audioCtx.createGain();
  mGain.gain.setValueAtTime(mVol,t);
  mGain.gain.exponentialRampToValueAtTime(0.001,t+decay);
  // Ring-mod trick: pair oscillators multiplicatively through gain nodes
  const osc1=audioCtx.createOscillator();osc1.type='square';osc1.frequency.value=baseFreqs[0];
  const osc2=audioCtx.createOscillator();osc2.type='square';osc2.frequency.value=baseFreqs[1];
  const osc3=audioCtx.createOscillator();osc3.type='square';osc3.frequency.value=baseFreqs[2];
  const osc4=audioCtx.createOscillator();osc4.type='square';osc4.frequency.value=baseFreqs[3];
  const ring1=audioCtx.createGain();ring1.gain.value=0;
  const ring2=audioCtx.createGain();ring2.gain.value=0;
  osc1.connect(ring1);osc2.connect(ring1.gain);
  osc3.connect(ring2);osc4.connect(ring2.gain);
  ring1.connect(metalMix);ring2.connect(metalMix);
  // Two direct oscillators for body tone
  const osc5=audioCtx.createOscillator();osc5.type='square';osc5.frequency.value=baseFreqs[4];
  const osc6=audioCtx.createOscillator();osc6.type='square';osc6.frequency.value=baseFreqs[5];
  const dg5=audioCtx.createGain();dg5.gain.value=0.4;
  const dg6=audioCtx.createGain();dg6.gain.value=0.3;
  osc5.connect(dg5);dg5.connect(metalMix);
  osc6.connect(dg6);dg6.connect(metalMix);
  metalMix.connect(metalHpf);metalHpf.connect(mGain);mGain.connect(drumGain);

  // Noise component
  const nSrc=audioCtx.createBufferSource();nSrc.buffer=noiseBuffer;
  const nHpf=audioCtx.createBiquadFilter();nHpf.type='highpass';nHpf.frequency.value=p.noiseHpf;
  const nGain=audioCtx.createGain();
  nGain.gain.setValueAtTime(nVol,t);nGain.gain.exponentialRampToValueAtTime(0.001,t+decay);
  nSrc.connect(nHpf);nHpf.connect(nGain);nGain.connect(drumGain);

  // DRUM-01: Transient click layer — short attack burst for definition
  // Separate from the metallic body — gives hats a crisp "tick" at the moment of strike
  if(p.clickGain>0){
    const ckSrc=audioCtx.createBufferSource();ckSrc.buffer=noiseBuffer;
    const ckHpf=audioCtx.createBiquadFilter();ckHpf.type='highpass';ckHpf.frequency.value=p.clickHpf??5000;
    const ckPeak=audioCtx.createBiquadFilter();ckPeak.type='peaking';
    ckPeak.frequency.value=(p.clickHpf??5000)*1.4;ckPeak.Q.value=1.2;ckPeak.gain.value=4;
    const ckG=audioCtx.createGain();
    const ckDecay=p.clickDecay??0.010;
    ckG.gain.setValueAtTime(velFinal*p.clickGain,t);
    ckG.gain.exponentialRampToValueAtTime(0.001,t+ckDecay);
    ckSrc.connect(ckHpf);ckHpf.connect(ckPeak);ckPeak.connect(ckG);ckG.connect(drumGain);
    ckSrc.start(t);ckSrc.stop(t+ckDecay+0.005);
    ckSrc.onended=()=>{try{ckSrc.disconnect();ckHpf.disconnect();ckPeak.disconnect();ckG.disconnect();}catch(e){}};
  }

  const stopT=t+decay+0.01;
  [osc1,osc2,osc3,osc4,osc5,osc6].forEach(o=>{o.start(t);o.stop(stopT);});
  nSrc.start(t);nSrc.stop(stopT);

  osc1.onended=()=>{try{
    osc1.disconnect();osc2.disconnect();osc3.disconnect();osc4.disconnect();osc5.disconnect();osc6.disconnect();
    ring1.disconnect();ring2.disconnect();dg5.disconnect();dg6.disconnect();
    metalMix.disconnect();metalHpf.disconnect();mGain.disconnect();
  }catch(e){}};
  nSrc.onended=()=>{try{nSrc.disconnect();nHpf.disconnect();nGain.disconnect();}catch(e){}};
  return mGain;
}

let _openHHNode = null; // D2: tracks ringing open HH for choke

function scheduleHihat(t,vel=0.8){
  _buildHihat(t,vel,false);
  const delay=Math.max(0,(t-audioCtx.currentTime)*1000);
  setTimeout(()=>{beatPulseHihat=1;},delay);
}

function scheduleOpenHH(t){
  const gainNode = _buildHihat(t,0.85,true);
  return gainNode; // returned so beat scheduler can choke it
}

function schedulePerc(t){
  if(!audioCtx) return;
  // Humanise
  const hv=0.90+Math.random()*0.10;
  const ht=Math.random()*0.0012;
  t=t+ht;
  const p=PERC_PROFILES[activeDrumStyle]||PERC_PROFILES.house;
  // DRUM-01: Apply tightness to perc decay
  const percTightness = DRUM_TIGHTNESS[activeDrumStyle] ?? 1.0;
  const percDecay = p.decay * percTightness;
  if(p.wave==='noise'){
    if(!noiseBuffer) return;
    const src=audioCtx.createBufferSource();src.buffer=noiseBuffer;
    const bpf=audioCtx.createBiquadFilter();bpf.type='bandpass';bpf.frequency.value=p.f1;bpf.Q.value=2;
    const g=audioCtx.createGain();
    g.gain.setValueAtTime(p.gain*hv,t);g.gain.exponentialRampToValueAtTime(0.001,t+percDecay);
    if(p.distort){
      const ws=audioCtx.createWaveShaper();
      const c=new Float32Array(256);
      for(let i=0;i<256;i++){const x=i*2/256-1;c[i]=Math.tanh(x*5);}
      ws.curve=c;src.connect(bpf);bpf.connect(ws);ws.connect(g);
    } else {src.connect(bpf);bpf.connect(g);}
    g.connect(drumGain);src.start(t);src.stop(t+percDecay+0.02);
    return;
  }
  // Tonal perc — main oscillator
  const osc=audioCtx.createOscillator();osc.type=p.wave;
  osc.frequency.setValueAtTime(p.f1,t);
  osc.frequency.exponentialRampToValueAtTime(p.f2,t+percDecay);
  const g=audioCtx.createGain();
  g.gain.setValueAtTime(p.gain*hv,t);g.gain.exponentialRampToValueAtTime(0.001,t+percDecay);
  // Saturation for warmth
  const sat=audioCtx.createWaveShaper();
  const sc=new Float32Array(256);
  const satAmt=p.distort?5:1.8;
  for(let i=0;i<256;i++){const x=i*2/256-1;sc[i]=Math.tanh(x*satAmt)/Math.tanh(satAmt);}
  sat.curve=sc;
  let hpfPerc=null;
  if(p.hpf){
    hpfPerc=audioCtx.createBiquadFilter();hpfPerc.type='highpass';hpfPerc.frequency.value=p.hpf;
    osc.connect(hpfPerc);hpfPerc.connect(sat);
  } else {osc.connect(sat);}
  sat.connect(g);g.connect(drumGain);
  osc.start(t);osc.stop(t+percDecay+0.02);
  osc.onended=()=>{try{osc.disconnect();if(hpfPerc)hpfPerc.disconnect();sat.disconnect();g.disconnect();}catch(e){}};
  // Second resonant layer
  const osc2=audioCtx.createOscillator();
  osc2.type=p.wave||'triangle';
  osc2.frequency.setValueAtTime(p.twoTone?p.f2:p.f1*1.78,t);
  osc2.frequency.exponentialRampToValueAtTime(p.twoTone?p.f2*0.7:p.f2*1.2,t+percDecay*0.7);
  if(p.detune) osc2.detune.value=p.detune;
  const g2=audioCtx.createGain();
  g2.gain.setValueAtTime(p.gain*(p.twoTone?0.65:0.28)*hv,t);
  g2.gain.exponentialRampToValueAtTime(0.001,t+percDecay*(p.twoTone?0.8:0.6));
  osc2.connect(g2);g2.connect(drumGain);
  osc2.start(t);osc2.stop(t+percDecay);
  osc2.onended=()=>{try{osc2.disconnect();g2.disconnect();}catch(e){}};
  // Noise body for all tonal percs
  if(noiseBuffer){
    const noiseMixAmt=p.noiseMix??(0.08);
    const nSrc=audioCtx.createBufferSource();nSrc.buffer=noiseBuffer;
    const nhpf=audioCtx.createBiquadFilter();nhpf.type='highpass';nhpf.frequency.value=3500;
    const ng=audioCtx.createGain();
    ng.gain.setValueAtTime(noiseMixAmt*hv,t);ng.gain.exponentialRampToValueAtTime(0.001,t+percDecay*0.4);
    nSrc.connect(nhpf);nhpf.connect(ng);ng.connect(drumGain);
    nSrc.start(t);nSrc.stop(t+percDecay);
    nSrc.onended=()=>{try{nSrc.disconnect();nhpf.disconnect();ng.disconnect();}catch(e){}};
  }
  // W7: Perc echo send — tempo-synced echo for congas/percs
  if(drumEchoSend){
    const tightness=DRUM_TIGHTNESS[activeDrumStyle]??1.0;
    const echoAmt=(DRUM_ROOM_SEND[activeDrumStyle]??0.14)*0.5;
    const esG=audioCtx.createGain();esG.gain.value=echoAmt*tightness;
    // tap directly off perc output — use a silent gain as proxy
    const tapG=audioCtx.createGain();tapG.gain.setValueAtTime(0.3,t);tapG.gain.exponentialRampToValueAtTime(0.001,t+0.08);
    if(noiseBuffer){
      const esSrc=audioCtx.createBufferSource();esSrc.buffer=noiseBuffer;
      const esHpf=audioCtx.createBiquadFilter();esHpf.type='highpass';esHpf.frequency.value=2000;
      esSrc.connect(esHpf);esHpf.connect(esG);esG.connect(drumEchoSend);
      esSrc.start(t);esSrc.stop(t+0.05);
      esSrc.onended=()=>{try{esSrc.disconnect();esHpf.disconnect();esG.disconnect();}catch(e){}};
    }
  }
}

function scheduleSnap(t, velMult=1){
  if(!audioCtx) return;
  const hv = 0.88 + Math.random()*0.12;
  const ht = Math.random()*0.0008;
  t = t + ht;
  const vel = (velMult ?? 1) * hv;

  // Layer 1: warm noise click — the "skin" component
  // Spectrum warmer than typical synth snap so it feels acoustic, not electronic.
  if(noiseBuffer){
    const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
    const hpf = audioCtx.createBiquadFilter(); hpf.type='highpass';
    hpf.frequency.value = 380 + Math.random()*80;
    const peak = audioCtx.createBiquadFilter(); peak.type='peaking';
    peak.frequency.value = 1900 + Math.random()*200;  // warmer than v43's 2.4kHz
    peak.Q.value = 1.2;
    peak.gain.value = 5.5;
    const lpf = audioCtx.createBiquadFilter(); lpf.type='lowpass';
    lpf.frequency.value = 6000;                       // softer top end
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.46*vel, t+0.0006);
    g.gain.exponentialRampToValueAtTime(0.001, t+0.026);
    src.connect(hpf); hpf.connect(peak); peak.connect(lpf); lpf.connect(g); g.connect(drumGain);
    src.start(t); src.stop(t+0.034);
    src.onended=()=>{try{src.disconnect();hpf.disconnect();peak.disconnect();lpf.disconnect();g.disconnect();}catch(e){}};
  }

  // Layer 2: palm-flesh body — main "thup", now longer and louder for body
  const body = audioCtx.createOscillator(); body.type='sine';
  body.frequency.setValueAtTime(490, t);
  body.frequency.exponentialRampToValueAtTime(260, t+0.012);
  const bg = audioCtx.createGain();
  bg.gain.setValueAtTime(0.32*vel, t);
  bg.gain.exponentialRampToValueAtTime(0.001, t+0.025);
  body.connect(bg); bg.connect(drumGain);
  body.start(t); body.stop(t+0.030);
  body.onended=()=>{try{body.disconnect();bg.disconnect();}catch(e){}};

  // Layer 3: woody sub-thump — the low knock from finger-bone-to-palm contact
  // This is what gives the snap acoustic weight without competing with the kick.
  const sub = audioCtx.createOscillator(); sub.type='sine';
  sub.frequency.setValueAtTime(180, t);
  sub.frequency.exponentialRampToValueAtTime(110, t+0.010);
  const sg = audioCtx.createGain();
  sg.gain.setValueAtTime(0.22*vel, t);
  sg.gain.exponentialRampToValueAtTime(0.001, t+0.020);
  sub.connect(sg); sg.connect(drumGain);
  sub.start(t); sub.stop(t+0.024);
  sub.onended=()=>{try{sub.disconnect();sg.disconnect();}catch(e){}};

  // Layer 4: edge click — keeps the attack defined
  const click = audioCtx.createOscillator(); click.type='sine';
  click.frequency.setValueAtTime(2100, t);
  click.frequency.exponentialRampToValueAtTime(800, t+0.005);
  const cg = audioCtx.createGain();
  cg.gain.setValueAtTime(0.13*vel, t);
  cg.gain.exponentialRampToValueAtTime(0.001, t+0.009);
  click.connect(cg); cg.connect(drumGain);
  click.start(t); click.stop(t+0.013);
  click.onended=()=>{try{click.disconnect();cg.disconnect();}catch(e){}};
}

let beatEnabled=false,beatStep=0,nextBeatTime=0,beatSchedulerTimer=null;

let _crQueue = [];

let _conversationLead = null;
let _conversationLeadBar = -99;

function recordCallEvent(callerEl, t, midi){
  if(!CR_ACTIVE_GENRES.has(currentStyle)) return;
  // B — reverb throw on call: Vocal/Chord/WTPad occasionally bloom into the call
  // Rare (12% chance), only when caller is a sustained harmonic element
  if(['Vocal','Chord','WTPad','Drone'].includes(callerEl.soundType) &&
     Math.random()<0.12 &&
     (barCount - _lastReverbThrowBar) >= 8){
    setTimeout(()=>fireReverbThrow(callerEl, 0.55, 3.8), (t - audioCtx.currentTime)*1000 + 50);
    _lastReverbThrowBar=barCount;
  }
  // Find a responder: prefer Pluck, then Arp, then Ring
  const responders = elements.filter(el=>
    !el.muted &&
    el.syncMode==='sync' &&
    (el.soundType==='Pluck'||el.soundType==='Arp'||el.soundType==='Ring'||el.soundType==='Laser'||el.soundType==='Echo'||el.soundType==='Conga') &&
    el.id !== callerEl.id
  );
  if(!responders.length) return;
  // Only respond ~38% of the time — keep it musical, not mechanical
  if(Math.random()>0.38) return;

  const responder = responders[Math.floor(Math.random()*responders.length)];
  const stepDur = (60/bpm)/4;

  // Response arrives 1 or 2 steps after the call
  const delay = (1 + Math.floor(Math.random()*2)) * stepDur;

  // Chord-aware answer: pick a chord tone (root/3rd/5th) of the CURRENT chord
  // at the responder's natural octave. Was a blind scale-step walk which could
  // clash with the chord engine after v37.
  const root  = document.getElementById('keySelect')?.value  || 'A';
  const scale = document.getElementById('scaleSelect')?.value || 'Minor';
  const chordRoot = _currentProgression ? getChordRootDeg() : 0;
  ensureRoleTag(responder);
  const answerOct = responder._roleOct ?? 4;
  // Weighted: prefer the 3rd (most "answer"-sounding), then 5th, then root
  const r = Math.random();
  const tone = r < 0.45 ? 2 : r < 0.80 ? 4 : 0;
  const answerNote = getHarmonicNote(root, scale, chordRoot + tone, answerOct);
  const answerFreq = midiToFreq(noteToMidi(answerNote));

  _crQueue.push({
    respondEl: responder,
    callerEl:  callerEl,
    fireAt: t + delay,
    freq: answerFreq,
    vol: 0.38,
  });
}

let _currentDrumHL=-1;

function updateDrumHighlight(step){
  if(_currentDrumHL>=0){document.querySelectorAll(`.drum-cell[data-step="${_currentDrumHL}"]`).forEach(c=>c.classList.remove('playing'));}
  if(step>=0){document.querySelectorAll(`.drum-cell[data-step="${step}"]`).forEach(c=>c.classList.add('playing'));_currentDrumHL=step;}
}

let _drumBankIdx = -1; // -1 = uninitialized; randomized on first rotate

function rotateDrumPattern(forceFeel){
  const bank = DRUM_BANK[currentStyle];
  if(!bank||!bank.length) return;
  // W6: New drum pattern = new secondary perc patterns
  if(typeof _secPercCache !== 'undefined') _secPercCache.clear();

  let pattern;
  if(forceFeel){
    pattern = bank.find(p=>p.feel===forceFeel) || bank[0];
  } else {
    const seq = DRUM_FEEL_SEQUENCE[currentStyle];
    if(seq){
      // 65% chance of 'main' groove, 35% picks from the full sequence
      if(_drumBankIdx < 0) _drumBankIdx = Math.floor(Math.random()*seq.length);
      else _drumBankIdx = (_drumBankIdx+1) % seq.length;
      const feel = Math.random() < 0.65 ? 'main' : seq[_drumBankIdx];
      pattern = bank.find(p=>p.feel===feel) || bank[Math.floor(Math.random()*bank.length)];
    } else {
      pattern = bank[Math.floor(Math.random()*bank.length)];
    }
  }

  drumPattern.kick  = [...pattern.kick];
  drumPattern.clap  = [...(pattern.clap||drumPattern.clap)];
  drumPattern.hihat = [...(pattern.hihat||drumPattern.hihat)];
  if(pattern.perc) drumPattern.perc = [...pattern.perc];
  if(pattern.snap) drumPattern.snap = [...pattern.snap];
  drumPattern._accents = {};
  buildDrumGrid(); // refresh UI
}

const _secPercCache = new Map();

function buildPolyPattern(el, len, density){
  // Euclidean-style distribution: spread hits evenly across len steps
  const hits = Math.max(1, Math.round(len * density * 0.6));
  const pattern = new Array(len).fill(0);
  // Bjorklund algorithm — evenly distribute `hits` across `len` steps
  let remainder = new Array(hits).fill([1]);
  let divisor   = new Array(len - hits).fill([0]);
  while(divisor.length > 1){
    const newRem = [];
    const count  = Math.min(remainder.length, divisor.length);
    for(let i=0; i<count; i++) remainder[i] = [...remainder[i], ...divisor[i]];
    if(remainder.length > divisor.length) newRem.push(...remainder.slice(divisor.length));
    divisor = divisor.length > remainder.length ? divisor.slice(remainder.length) : newRem;
    remainder = remainder.slice(0, count);
    if(divisor.length === 0){ remainder.push(...newRem); break; }
  }
  const seq = [...remainder, ...divisor].flat();
  for(let i=0; i<len; i++) pattern[i] = seq[i] ? (0.5 + Math.random()*0.5) : 0;
  return pattern;
}

function scheduleSFXBurst(el, t, vel) {
  if (!audioCtx || !noiseBuffer) return;
  const v = el.variation ?? 0;
  const isZap = SOUND_TYPES.SFX?.vars?.[v]?.name === 'Zap';
  const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
  const hpf = audioCtx.createBiquadFilter(); hpf.type = 'highpass';
  hpf.frequency.value = isZap ? 3000 : 1500;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(vel * 0.55, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + (isZap ? 0.025 : 0.06));
  const pan = audioCtx.createStereoPanner();
  pan.pan.value = (Math.random() - 0.5) * 0.6;
  src.connect(hpf); hpf.connect(g); g.connect(pan);
  pan.connect(sidechainGain || compressor);
  if (drumEchoSend) { const es = audioCtx.createGain(); es.gain.value = 0.3; g.connect(es); es.connect(drumEchoSend); src.onended = () => { try { es.disconnect(); } catch(e) {} }; }
  src.start(t); src.stop(t + 0.08);
  src.onended = () => { try { src.disconnect(); hpf.disconnect(); g.disconnect(); pan.disconnect(); } catch(e) {} };
}

function scheduleSnareTexBurst(el, t, vel, tightness) {
  if (!audioCtx || !noiseBuffer) return;
  const src = audioCtx.createBufferSource(); src.buffer = noiseBuffer;
  const bpf = audioCtx.createBiquadFilter(); bpf.type = 'bandpass';
  bpf.frequency.value = 1800 + Math.random() * 400; bpf.Q.value = 1.5;
  const g = audioCtx.createGain();
  const decay = 0.04 * tightness;
  g.gain.setValueAtTime(vel * 0.35, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + decay);
  src.connect(bpf); bpf.connect(g); g.connect(drumGain);
  if (drumRoomSend) { const rs = audioCtx.createGain(); rs.gain.value = 0.4; g.connect(rs); rs.connect(drumRoomSend); }
  src.start(t); src.stop(t + decay + 0.01);
  src.onended = () => { try { src.disconnect(); bpf.disconnect(); g.disconnect(); } catch(e) {} };
}

function schedulePhysPercBurst(el, t, vel) {
  if (!audioCtx) return;
  const freq = midiToFreq(noteToMidi(el.note || 'A3'));
  const osc = audioCtx.createOscillator(); osc.type = 'sine';
  osc.frequency.setValueAtTime(freq * 1.4, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.8, t + 0.03);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(vel * 0.5, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(g); g.connect(drumGain);
  osc.start(t); osc.stop(t + 0.18);
  osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch(e) {} };
}

let _sessionSignature = null;
let _sessionSignatureRoot = null;

function initSessionSignature(){
  const sig = GENRE_SIGNATURE[currentStyle];
  if(!sig) return;
  _sessionSignature = sig;
  _sessionSignatureRoot = currentStyle;
}

function getSessionSignature(){
  // Refresh if genre changed significantly (live drift)
  if(!_sessionSignature || _sessionSignatureRoot !== currentStyle){
    initSessionSignature();
  }
  return _sessionSignature;
}

function applySignatureGravity(midi, scaleNotes, anchorMidi){
  const sig = getSessionSignature();
  if(!sig) return midi;
  if(Math.random() > sig.returnBias) return midi; // only applies some of the time

  // Find the closest signature interval note to current position
  const anchorIdx = scaleNotes.findIndex(n => n.midi === anchorMidi) ||
                    scaleNotes.reduce((bi,n,i) => Math.abs(n.midi-anchorMidi)<Math.abs(scaleNotes[bi].midi-anchorMidi)?i:bi, 0);

  let bestMidi = midi;
  let bestDist = 999;
  sig.intervals.forEach(offset => {
    const targetIdx = Math.max(0, Math.min(scaleNotes.length-1, anchorIdx + offset));
    const targetMidi = scaleNotes[targetIdx].midi;
    const dist = Math.abs(midi - targetMidi);
    if(dist < bestDist){
      bestDist = dist;
      bestMidi = targetMidi;
    }
  });

  // Only pull if it's reasonably close — don't force unnatural jumps
  return bestDist <= 5 ? bestMidi : midi;
}

function getSignatureHookOffsets(){
  const sig = getSessionSignature();
  if(!sig) return [0,2,4,7,4,2]; // fallback
  const base = [...sig.intervals];
  // Pad to 6 notes by repeating/inverting
  while(base.length < 6) base.push(base[base.length-1-Math.floor(base.length/2)]||0);
  return base.slice(0,6);
}

const _voiceMotifStore = new Map();

function buildVoiceMotif(el, phraseBar) {
  const root   = document.getElementById('keySelect')?.value  || 'A';
  const scale  = document.getElementById('scaleSelect')?.value || 'Minor';
  const subrole = VOICE_SUBROLE[el.soundType] || 'keys';
  const reg    = VOICE_REGISTER[subrole] || { min:3, max:5 };
  const baseDensity = VOICE_PHRASE_DENSITY[activeDrumStyle] ?? 0.50;
  // Scale density by active voice count — more voices = each plays less
  const voiceCount = elements.filter(e => !e.muted && getInstrumentRole(e) === 'voice').length;
  const crowdFactor = Math.max(0.4, 1.0 - (voiceCount - 1) * 0.15);
  // Subrole weighting: bass plays more, pitched perc plays less
  const subroleScale = { bass:1.2, stab:1.0, arp:0.9, keys:0.85, pluck:0.8, pitchedPerc:0.7, echoPhrase:0.5 };
  // Arc tension: Build increases density + favors rise, Break reduces density
  const tension = (typeof conductorParams !== 'undefined') ? (conductorParams.tension || 0) : 0;
  const arcDensityMul = tension > 0.5 ? (1.0 + (tension - 0.5) * 0.6) : // Build: up to +30%
                        (typeof arcState !== 'undefined' && arcState === 'break') ? 0.65 : 1.0; // Break: -35%
  const density = baseDensity * crowdFactor * (subroleScale[subrole] ?? 1.0) * arcDensityMul;

  // Get scale notes in the element's register
  const octaves = [];
  for (let o = reg.min; o <= reg.max; o++) octaves.push(o);
  const scaleNotes = getScaleNotes(root, scale, octaves);
  if (!scaleNotes.length) return null;

  // Anchor: prefer the element's currently assigned note as the motif root
  const anchorMidi = noteToMidi(el.note || root + reg.min);
  const anchorIdx  = scaleNotes.reduce((bi, n, i) =>
    Math.abs(n.midi - anchorMidi) < Math.abs(scaleNotes[bi].midi - anchorMidi) ? i : bi, 0);

  // Seed for this element + phrase — consistent per 8-bar block
  const seed = (el.id * 7919 + phraseBar * 1301) | 0;
  const rng  = (i) => { const x = Math.sin(seed * 9301 + i * 49297) * 0.5 + 0.5; return x - Math.floor(x); };

  // Choose a melodic contour shape — weighted by genre
  // During Build (high tension), bias toward 'rise' for building energy
  let contour;
  if(tension > 0.5 && rng(0) < 0.6){
    contour = 'rise';
  } else {
    contour = pickWeightedContour(activeDrumStyle, rng(0));
  }

  // Genre melody rules — repeatBias, restBias, maxLeap, octaveRange
  const melRules = GENRE_MELODY_RULES[currentStyle] || { repeatBias:0.5, restBias:0.25, maxLeap:5, octaveRange:2 };
  const maxRange = subrole === 'bass' ? 2 : Math.min(Math.round(melRules.maxLeap), scaleNotes.length - 1);

  // Build 16 steps
  const steps = [];
  let pos = anchorIdx;

  for (let i = 0; i < 16; i++) {
    const isDownbeat = i % 4 === 0;
    // Genre-aware rest probability: downbeats more likely to fire, off-beats filtered by restBias
    const fireProb   = isDownbeat ? density * 1.3 : density * (1 - melRules.restBias * 0.5);
    const isRest     = rng(i + 10) > Math.min(0.95, fireProb);

    if (!isRest) {
      // repeatBias: probability of staying on current note rather than moving
      const shouldRepeat = rng(i + 25) < melRules.repeatBias;
      if (!shouldRepeat) {
        // Move position based on contour — but respect maxLeap
        let step = 0;
        if (contour === 'rise')     step = rng(i+20) < 0.65 ? 1 : 0;
        else if (contour === 'fall') step = rng(i+20) < 0.65 ? -1 : 0;
        else if (contour === 'arch') step = i < 8 ? (rng(i+20) < 0.55 ? 1 : 0) : (rng(i+20) < 0.55 ? -1 : 0);
        else if (contour === 'question') step = i < 12 ? 0 : (anchorIdx - pos > 0 ? -1 : 0);
        else step = rng(i+30) < 0.4 ? (rng(i+31) < 0.5 ? 1 : -1) : 0; // repeat contour: mostly stay

        // Clamp to maxLeap from anchor
        const newPos = Math.max(0, Math.min(scaleNotes.length - 1, pos + step));
        if (Math.abs(newPos - anchorIdx) <= maxRange) pos = newPos;
        else pos = anchorIdx + Math.sign(newPos - anchorIdx) * maxRange;
      }
      pos = Math.max(0, Math.min(scaleNotes.length - 1, pos));

      const accent = isDownbeat && rng(i + 40) < 0.65;
      const vel    = accent ? 0.85 + rng(i+50) * 0.15 : 0.50 + rng(i+50) * 0.35;
      // Signature gravity: nudge toward genre's signature interval on accented steps
      const rawMidi = scaleNotes[pos].midi;
      const sigMidi = accent ? applySignatureGravity(rawMidi, scaleNotes, anchorMidi) : rawMidi;
      steps.push({ midi: sigMidi, rest: false, vel, accent });
    } else {
      steps.push({ midi: anchorMidi, rest: true, vel: 0, accent: false });
    }
  }

  return { steps, phraseBar, mutCount: 0 };
}

function getOrBuildVoiceMotif(el, bar) {
  const phraseBar = Math.floor(bar / 8);
  const key = el.id;
  const cached = _voiceMotifStore.get(key);

  // Same 8-bar block — return as-is (motif is stable within a phrase)
  if (cached && cached.phraseBar === phraseBar) return cached;

  // New phrase boundary — apply 80/15/5
  if (cached) {
    const roll = Math.random();
    if (roll < 0.80) {
      // 80%: keep motif, just update phraseBar marker
      cached.phraseBar = phraseBar;
      return cached;
    } else if (roll < 0.95) {
      // 15%: small variation — mutate 1-2 steps in place
      const numMutations = Math.random() < 0.4 ? 2 : 1;
      for (let m = 0; m < numMutations; m++) _applySmallVariation(cached, el);
      cached.phraseBar = phraseBar;
      return cached;
    }
    // 5%: fall through to build a new phrase
  }

  // Build fresh (first time, or 5% new-phrase roll)
  const motif = buildVoiceMotif(el, phraseBar);
  if (!motif) return null;
  _voiceMotifStore.set(key, motif);
  return motif;
}

function _applySmallVariation(motif, el) {
  const root  = document.getElementById('keySelect')?.value  || 'A';
  const scale = document.getElementById('scaleSelect')?.value || 'Minor';
  const subrole = VOICE_SUBROLE[el.soundType] || 'keys';
  const reg   = VOICE_REGISTER[subrole] || { min:3, max:5 };
  const octaves = []; for (let o = reg.min; o <= reg.max; o++) octaves.push(o);
  const scaleNotes = getScaleNotes(root, scale, octaves);
  if (!scaleNotes.length) return;
  const melRules = GENRE_MELODY_RULES[currentStyle] || { maxLeap:5 };

  // Only touch non-downbeat steps
  const candidates = [1,2,3,5,6,7,9,10,11,13,14,15];
  const idx = candidates[Math.floor(Math.random() * candidates.length)];
  const step = motif.steps[idx];

  const roll = Math.random();
  if (step.rest && roll < 0.5) {
    // Activate a rest with a scale-adjacent note
    const baseIdx = scaleNotes.findIndex(n => n.midi === motif.steps[0]?.midi) || 0;
    const newIdx = Math.max(0, Math.min(scaleNotes.length-1, baseIdx + Math.floor(Math.random()*3)-1));
    motif.steps[idx] = { midi: scaleNotes[newIdx].midi, rest: false, vel: 0.5 + Math.random()*0.25, accent: false };
  } else if (!step.rest && roll < 0.45) {
    // Silence
    motif.steps[idx] = { ...step, rest: true };
  } else if (!step.rest) {
    // Pitch shift by ±1 scale step, capped at maxLeap from nearest downbeat note
    const curIdx = scaleNotes.findIndex(n => n.midi === step.midi);
    const delta = Math.random() < 0.5 ? 1 : -1;
    const newIdx = Math.max(0, Math.min(scaleNotes.length-1, (curIdx < 0 ? 0 : curIdx) + delta));
    motif.steps[idx] = { ...step, midi: scaleNotes[newIdx].midi };
  }
}

function mutateVoiceMotif(el) {
  const motif = _voiceMotifStore.get(el.id);
  if (!motif || motif.mutCount >= 4) return;
  const root  = document.getElementById('keySelect')?.value  || 'A';
  const scale = document.getElementById('scaleSelect')?.value || 'Minor';
  const subrole = VOICE_SUBROLE[el.soundType] || 'keys';
  const reg   = VOICE_REGISTER[subrole] || { min:3, max:5 };
  const octaves = []; for (let o = reg.min; o <= reg.max; o++) octaves.push(o);
  const scaleNotes = getScaleNotes(root, scale, octaves);
  if (!scaleNotes.length) return;

  // Flip one non-downbeat step
  const candidates = [1,2,3,5,6,7,9,10,11,13,14,15];
  const idx = candidates[Math.floor(Math.random() * candidates.length)];
  const step = motif.steps[idx];
  if (step.rest) {
    // Activate a rest
    const midiIdx = Math.floor(Math.random() * scaleNotes.length);
    motif.steps[idx] = { midi: scaleNotes[midiIdx].midi, rest: false, vel: 0.55 + Math.random() * 0.25, accent: false };
  } else {
    // Silence an active step or shift its pitch
    if (Math.random() < 0.5) {
      motif.steps[idx] = { ...step, rest: true };
    } else {
      const newIdx = Math.max(0, Math.min(scaleNotes.length-1, scaleNotes.findIndex(n => n.midi === step.midi) + (Math.random() < 0.5 ? 1 : -1)));
      motif.steps[idx] = { ...step, midi: scaleNotes[newIdx].midi };
    }
  }
  motif.mutCount++;
}

function transposeVoiceMotif(el) {
  const motif = _voiceMotifStore.get(el.id);
  if (!motif) return;
  const root  = document.getElementById('keySelect')?.value  || 'A';
  const scale = document.getElementById('scaleSelect')?.value || 'Minor';
  const subrole = VOICE_SUBROLE[el.soundType] || 'keys';
  const reg   = VOICE_REGISTER[subrole] || { min:3, max:5 };
  const octaves = []; for (let o = reg.min; o <= reg.max; o++) octaves.push(o);
  const scaleNotes = getScaleNotes(root, scale, octaves);
  if (!scaleNotes.length) return;

  // Shift all non-rest steps to nearest scale note (re-harmonize)
  motif.steps.forEach(step => {
    if (step.rest) return;
    const nearest = scaleNotes.reduce((best, n) =>
      Math.abs(n.midi - step.midi) < Math.abs(best.midi - step.midi) ? n : best, scaleNotes[0]);
    step.midi = nearest.midi;
  });
}

function tickVoicePhrase(el, beatStep, bar) {
  const motif = getOrBuildVoiceMotif(el, bar);
  if (!motif) return null;
  const step = motif.steps[beatStep];
  if (!step || step.rest) return null;

  // Atmosphere density gate: reduce voice activity when atmosphere is heavy
  const atmCount = elements.filter(e => !e.muted && getInstrumentRole(e) === 'atmosphere').length;
  const voiceCount = elements.filter(e => !e.muted && getInstrumentRole(e) === 'voice').length;
  if (atmCount > 3 && voiceCount > 2 && Math.random() < 0.25) return null; // occasional rest under dense texture

  return { freq: midiToFreq(step.midi), vel: step.vel, accent: step.accent };
}

function clearVoiceMotifCache() {
  _voiceMotifStore.clear();
}

function phraseAwareEchoTick(el, beatStep, t, bar, phraseBar, formCycle) {
  const v = el.variation ?? 0;

  // Pick note from voice motif store if available — keeps echo harmonically coherent
  function fireEcho() {
    const motif = _voiceMotifStore.get(el.id);
    if (motif) {
      const motifStep = ((bar % 8) * 2) % 16;
      const step = motif.steps[motifStep];
      if (step && !step.rest) {
        scheduleEchoNote({...el, note: midiToNote(step.midi)}, t);
        return;
      }
    }
    scheduleEchoNote(el, t);
  }

  // Mode 1: Dub throw — once at phrase tail (step 14 of bar 7 in every 8-bar cycle)
  // The most important mode: sparse, deliberate, feels like a DJ throw
  const isPhraseTail = (bar % 8 === 7) && beatStep === 14;
  if (isPhraseTail && Math.random() < 0.42) { fireEcho(); return; }

  // Mode 2: Section punctuation — step 12-13 just before the formCycle resets
  // Marks transitions: a single echo that announces the coming change
  const isPreReset = (phraseBar === formCycle - 1) && (beatStep === 12 || beatStep === 13);
  if (isPreReset && Math.random() < 0.55) { fireEcho(); return; }

  // Mode 3: Flutter (v=3) — more active but still anchored to even bars
  // Fires on beat 4.5 (step 4) of every other bar — rhythmic without being mechanical
  if (v === 3 && bar % 2 === 0 && beatStep === 4 && Math.random() < 0.45) { fireEcho(); return; }

  // Mode 4: Ping/Space (v=0,v=2) — occasional downbeat on bar 0 of 4-bar cycle
  // Subtle — just marks the section quietly
  if ((v === 0 || v === 2) && bar % 4 === 0 && beatStep === 0 && Math.random() < 0.30) { fireEcho(); return; }
}

