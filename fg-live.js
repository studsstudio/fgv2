// fg-live.js — Live performance mode.
// enterLiveMode, exitLiveMode, touch/gesture handlers, live solo,
// hold labels, ix filters, pinch, momentum float, haptics.
// Depends on: fg-data.js, fg-state.js, fg-audio.js, fg-visual.js

let _liveMode   = false;
let _liveDriftTimer = null;
let _liveHideTimer  = null;
let _liveBarCount   = 0; // bars elapsed since live started

function livePt(clientX,clientY){
  const rect=canvas.getBoundingClientRect();
  return {
    mx:(clientX-rect.left)*(W/rect.width),
    my:(clientY-rect.top)*(H/rect.height),
  };
}

function liveHitTest(mx,my){
  for(let i=elements.length-1;i>=0;i--){
    const el=elements[i];
    if(el.muted) continue;
    if(el.visualType==='beam'){
      // Beam is a full-height vertical strip at el.pos*W — check horizontal distance only
      const beamX=(el.pos!=null?el.pos:el.x)*W;
      const halfW=Math.max(40,(el.width||0.15)*W*0.5+24);
      if(Math.abs(mx-beamX)<halfW) return el;
    } else if(el.visualType==='neon'||el.visualType==='fold'){
      const x1=(el.x1||0)*W,y1=(el.y1||0)*H,x2=(el.x2||1)*W,y2=(el.y2||0)*H;
      const dx=x2-x1,dy=y2-y1,len2=dx*dx+dy*dy;
      if(len2<1) continue;
      const t=Math.max(0,Math.min(1,((mx-x1)*dx+(my-y1)*dy)/len2));
      if(Math.hypot(mx-x1-t*dx,my-y1-t*dy)<38) return el;
    } else {
      const hitR=Math.max(80,(el.radius||0.25)*Math.min(W,H)*0.85);
      if(Math.hypot(mx-el.x*W,my-el.y*H)<hitR) return el;
    }
  }
  return null;
}

function startHoldBuzz(el){ /* disabled — was causing motor sound on touch */ }
function stopHoldBuzz(el){ if(el._holdBuzz) el._holdBuzz=null; }
// (hold buzz disabled)

function applyLiveSolo(){
  if(!audioCtx) return;
  const now = audioCtx.currentTime;

  // Collect held element ids from all input paths
  const heldIds = new Set();
  Object.values(_liveT).forEach(st => { if(st.el) heldIds.add(st.el.id); });
  if(_liveMouse.active && _liveMouse.el) heldIds.add(_liveMouse.el.id);
  if(canvasDragging){
    const el = elements.find(e => e.id === canvasDragging.id);
    if(el) heldIds.add(el.id);
  }
  // Also pick up any _touchHeld elements
  elements.forEach(el => { if(el._touchHeld) heldIds.add(el.id); });

  const holding = _dragSolo; // driven by explicit drag start/end only — not recomputed here

  // Continuous sounds — instant gain cut or restore
  elements.forEach(el => {
    if(!el._droneNode?.gainNode) return;
    const base = Math.min(0.25, (el.volume ?? 0.5) * 0.45);
    if(holding && !heldIds.has(el.id)){
      el._droneNode.gainNode.gain.cancelScheduledValues(now);
      el._droneNode.gainNode.gain.setValueAtTime(0, now);
      if(el._droneNode.revSend){
        el._droneNode.revSend.gain.cancelScheduledValues(now);
        el._droneNode.revSend.gain.setValueAtTime(0, now);
      }
    } else if(holding && heldIds.has(el.id)){
      // Held element — push forward
      el._droneNode.gainNode.gain.cancelScheduledValues(now);
      el._droneNode.gainNode.gain.setValueAtTime(Math.min(0.35, base * 1.4), now);
    } else {
      // Release — restore smoothly
      el._droneNode.gainNode.gain.setTargetAtTime(base, now, 0.4);
      if(el._droneNode.revSend)
        el._droneNode.revSend.gain.setTargetAtTime((el.space?.x ?? 0.35) * 0.65, now, 0.4);
    }
  });

  // Drums — instant cut, smooth restore
  if(drumGain){
    if(holding){
      drumGain.gain.cancelScheduledValues(now);
      drumGain.gain.setValueAtTime(0, now);
    } else {
      const sg = (typeof DRUM_STYLE_GAIN !== 'undefined' ? DRUM_STYLE_GAIN[activeDrumStyle] : null) ?? 0.88;
      drumGain.gain.setTargetAtTime((conductorParams.drumVol ?? 1) * sg, now, 0.5);
    }
  }
}

let _holdLabelEl = null;

function showHoldLabel(el){
  if(!_holdLabelEl){
    _holdLabelEl = document.createElement('div');
    _holdLabelEl.style.cssText = 'position:fixed;pointer-events:none;z-index:900;font-size:8px;font-family:monospace;letter-spacing:.18em;color:rgba(255,255,255,0.75);text-shadow:0 0 12px rgba(0,0,0,0.9);text-transform:uppercase;transform:translateX(-50%);transition:opacity .2s;white-space:nowrap';
    document.body.appendChild(_holdLabelEl);
  }
  _holdLabelEl.textContent = HOLD_LABELS[el.soundType] || ('HOLDING ' + (el.soundType||'SOUND').toUpperCase());
  _holdLabelEl.style.opacity = '1';
  // Position near element
  const canvas = document.getElementById('canvas');
  const rect = canvas ? canvas.getBoundingClientRect() : {left:0,top:0,width:window.innerWidth,height:window.innerHeight};
  const px = rect.left + el.x * rect.width;
  const py = rect.top  + el.y * rect.height - 44;
  _holdLabelEl.style.left = px + 'px';
  _holdLabelEl.style.top  = py + 'px';
}

function hideHoldLabel(){
  if(_holdLabelEl){ _holdLabelEl.style.opacity = '0'; }
}

function ixFilterStart(el){
  if(!audioCtx || !soundEnabled || !el._droneNode) return;
  if(el._ixFilter) return; // already active

  const dn = el._droneNode;
  const src = dn.gainNode;
  const dst = dn.pannerNode;
  if(!src || !dst) return;

  // Build resonant bandpass insert — it sits between gainNode and pannerNode
  const f = audioCtx.createBiquadFilter();
  f.type = 'lowpass';
  // Start at element's current tone setting so sweep begins from a known point
  const tx = el.tone?.x ?? 0.4;
  f.frequency.value = 150 * Math.pow(8000/150, tx);
  f.Q.value = 0.7; // neutral — no resonance on touch, builds only with upward drag
  f.gain.value = 0;

  // Disconnect existing gainNode→pannerNode, insert filter between them
  try { src.disconnect(dst); } catch(e){}
  src.connect(f);
  f.connect(dst);

  el._ixFilter = f;
  el._ixFilterActive = true;
}

function ixFilterUpdate(el, normX, normY){
  if(!el._ixFilter || !audioCtx) return;
  const now = audioCtx.currentTime;
  const f = el._ixFilter;

  // Logarithmic frequency sweep — sounds natural to the ear
  const minHz = 150, maxHz = 8000;
  const targetFreq = minHz * Math.pow(maxHz / minHz, Math.max(0, Math.min(1, normX)));
  f.frequency.exponentialRampToValueAtTime(Math.max(20, targetFreq), now + 0.04);

  // Y → resonance: stays neutral in lower half, builds gently toward top
  // normY=0 (top), normY=1 (bottom) — only rises above center
  const yAboveCenter = Math.max(0, 0.5 - Math.max(0, Math.min(1, normY)));
  const targetQ = 0.7 + yAboveCenter * 14; // 0.7 neutral → ~7.7 at top — no self-oscillation
  f.Q.linearRampToValueAtTime(targetQ, now + 0.04);
}

function ixFilterRelease(el){
  if(!el._ixFilter || !audioCtx) return;
  const f = el._ixFilter;
  const dn = el._droneNode;
  if(!dn) { el._ixFilter = null; return; }

  const now = audioCtx.currentTime;
  const tx = el.tone?.x ?? 0.4;
  const restFreq = 150 * Math.pow(8000/150, tx);

  // Ramp filter back to element's natural tone setting before disconnecting
  f.frequency.exponentialRampToValueAtTime(Math.max(20, restFreq), now + 0.18);
  f.Q.linearRampToValueAtTime(0.7, now + 0.18);

  setTimeout(() => {
    if(!el._ixFilter) return;
    const src = dn.gainNode;
    const dst = dn.pannerNode;
    try { src.disconnect(f); f.disconnect(dst); } catch(e){}
    try { if(src && dst) src.connect(dst); } catch(e){}
    el._ixFilter = null;
    el._ixFilterActive = false;
  }, 220);
}

function ixPinchUpdate(el, scale){
  if(!audioCtx || !reverbGain) return;
  const now = audioCtx.currentTime;

  // Reverb wet: pinch out = huge room, pinch in = dead dry
  const reverbTarget = Math.min(1.8, Math.max(0.05, (scale - 0.3) * 0.9));
  reverbGain.gain.linearRampToValueAtTime(reverbTarget, now + 0.12);

  // Delay feedback on element's own delay node — approaches 0.98 on full pinch out
  // Creates infinite loop / runaway feedback riser
  if(el._droneNode?.delayWet){
    const feedTarget = Math.min(0.97, 0.05 + scale * 0.42);
    el._droneNode.delayWet.gain.linearRampToValueAtTime(feedTarget, now + 0.12);
  }

  // Pitch riser — drone oscillators bend upward as you open the pinch
  // Simulates DJ pitch-bend on a turntable / analog riser
  if(scale > 1.2){
    const pitchBend = (scale - 1.2) * 120; // up to +100 cents on max pinch
    elements.forEach(ae=>{
      if(!ae._droneNode?.oscs || ae.muted) return;
      ae._droneNode.oscs.forEach(o=>{
        if(o.detune && o.frequency?.value > 20){
          o.detune.setTargetAtTime(pitchBend, now, 0.15);
        }
      });
    });
  }

  // Master HPF inverse: pinch out opens up low end for room pressure
  if(masterHPFNode && arcState === 'idle'){
    const hpfTarget = Math.max(0, 0.15 - (scale - 1) * 0.1);
    masterHPFNode.frequency.linearRampToValueAtTime(
      20 + Math.pow(Math.max(0,hpfTarget), 1.6) * 3980, now + 0.12
    );
  }
}

function ixPinchRelease(){
  if(!audioCtx || !reverbGain) return;
  const now = audioCtx.currentTime;
  // Restore reverb to conductor target
  const targetRev = Math.min(1.0, 0.62 * (conductorParams.reverbAmt ?? 1));
  reverbGain.gain.linearRampToValueAtTime(targetRev, now + 0.4);

  // Reset all drone pitch bends immediately — snaps back on release
  elements.forEach(ae=>{
    if(!ae._droneNode?.oscs || ae.muted) return;
    ae._droneNode.oscs.forEach(o=>{
      if(o.detune && o.frequency?.value > 20){
        o.detune.cancelScheduledValues(now);
        o.detune.setTargetAtTime(0, now, 0.08);
      }
    });
  });

  // Slam kick back in — the drop after the riser
  // Only fires if we were in a meaningful pinch (feedback was rising)
  if(soundEnabled && beatEnabled){
    scheduleKick(now + 0.05, 1.15); // slightly hot kick hit
    setTimeout(()=>{ beatPulseKick=1; }, 50);
  }
}

function liveActivate(el){
  if(el._momentumRaf){ cancelAnimationFrame(el._momentumRaf); el._momentumRaf=null; }
  el._pulse=1.0;el._flashPulse=0.7;el._touchHeld=true;
  el._heldIntensity = 0;
  _dragSolo=true;
  startHoldBuzz(el);
  applyLiveSolo();
  liveHaptic(el);
  showHoldLabel(el);
  dismissChoreo();
}

function liveRelease(el){
  if(!el) return;
  el._touchHeld=false;
  el._holdFlickerHz=null;
  el._holdStartT=null;
  el._heldIntensity = 0;
  ixPinchRelease();
  stopHoldBuzz(el);
  // Restore conductor targets that drag manipulated — release userGesture claims
  // so lower-priority systems (liveSet, djBrain, formCycle, base) can resume.
  clearConductorIntents('userGesture.touch');
  // Clear solo state before restoring mix
  const stillHeld = elements.some(e => e._touchHeld);
  if(!stillHeld) _dragSolo = false;
  applyLiveSolo();
  hideHoldLabel();
  if(soundEnabled&&audioCtx) updateDroneParams(el);
}

function liveDrag(el,incDx,incDy,totalDy,startToneX){
  el.x=Math.max(0.05,Math.min(0.95,el.x+incDx/W));
  el.y=Math.max(0.05,Math.min(0.95,el.y+incDy/H));
  if(el.visualType==='neon'||el.visualType==='fold'){
    const d={x:incDx/W,y:incDy/H};
    el.x1=Math.max(0,Math.min(1,(el.x1||0)+d.x));
    el.y1=Math.max(0,Math.min(1,(el.y1||0)+d.y));
    el.x2=Math.max(0,Math.min(1,(el.x2||1)+d.x));
    el.y2=Math.max(0,Math.min(1,(el.y2||0)+d.y));
    el.x=(el.x1+el.x2)/2;el.y=(el.y1+el.y2)/2;
  }
  if(el.visualType==='beam'||el.visualType==='spot') el.pos=el.x;
  if(!el.tone) el.tone={x:0.4,y:0.2};
  // Drag up = brighter (filter opens), drag down = darker
  el.tone.x=Math.max(0.05,Math.min(0.95,startToneX-totalDy/H*1.5));

  // ── Gestural audio feedback ───────────────────────────────────────────────
  if(soundEnabled && audioCtx){
    const now = audioCtx.currentTime;
    // X → filter cutoff sweep: left=closed(120Hz), right=open(14kHz) — exponential
    const minHz=120, maxHz=14000;
    const targetFreq = minHz * Math.pow(maxHz/minHz, el.x);
    // Y → Q: neutral in lower half, builds toward top (no motor — max Q=7)
    const yAbove = Math.max(0, 0.5 - el.y); // 0 at center/below, 0.5 at top
    const targetQ = 0.7 + yAbove * 12;      // 0.7 neutral → 6.7 at top

    if(el._droneNode?.filterNode){
      el._droneNode.filterNode.frequency.exponentialRampToValueAtTime(Math.max(20,targetFreq), now+0.04);
      el._droneNode.filterNode.Q.linearRampToValueAtTime(targetQ, now+0.04);
    }

    // Wow & Flutter — drag velocity warps pitch like bumping a tape deck
    // Fast aggressive drag = audible pitch wobble on all drones
    const dragVel = Math.sqrt(incDx*incDx + incDy*incDy);
    if(dragVel > 2){ // only fires on intentional fast swipes
      const wowAmount = Math.min(dragVel * 0.8, 25); // cents — max ±25¢
      elements.forEach(ae=>{
        if(!ae._droneNode?.oscs || ae.muted) return;
        ae._droneNode.oscs.forEach(o=>{
          if(o.detune && o.frequency?.value > 20){
            o.detune.cancelScheduledValues(now);
            o.detune.setValueAtTime((Math.random()-0.5)*wowAmount*2, now);
            o.detune.setTargetAtTime(0, now+0.04, 0.18); // wobble then settle back
          }
        });
      });
    }

    // Conductor targets respond to drag position — userGesture priority (120,
    // beats arc) so the user always feels in control. Short duration (500ms)
    // means stopping drag releases the claim quickly.
    submitConductorIntent('userGesture.touch.tension', 'tension', el.x * 0.7,        CONDUCTOR_PRIORITY.userGesture, 500);
    submitConductorIntent('userGesture.touch.shimmer', 'shimmer', (1 - el.y) * 0.6,  CONDUCTOR_PRIORITY.userGesture, 500);
  }
  // C — fast upward flick triggers reverb throw — the DJ reverb gesture
  // totalDy is negative when dragging up. Threshold: dragged up more than 15% of screen height
  if(totalDy/H < -0.15 && !el._reverbThrowActive && audioCtx && soundEnabled){
    const throwAmt=Math.min(0.90, 0.50 + Math.abs(totalDy/H)*1.5); // harder flick = more reverb
    fireReverbThrow(el, throwAmt, 4.0);
  }
  if(soundEnabled) updateDroneParams(el);
}

function liveScale(el,scale){
  el.radius=Math.max(0.05,Math.min(0.55,el.radius*scale));
  el.volume=Math.max(0.15,Math.min(1.10,(el.volume??0.5)*scale));
  // Pinch → room size morph: pinch in = dry/tight, pinch out = infinite shimmer
  ixPinchUpdate(el, el.radius / 0.20); // normalise: 0.20 = "medium" = scale 1.0
  if(soundEnabled) updateDroneParams(el);
}

function liveScaleBeam(el,scale){
  el.width=Math.max(0.02,Math.min(0.60,(el.width||0.15)*scale));
  el._flashPulse=0.3;
}

function liveStretchNeon(el,scale){
  const cx=(el.x1+el.x2)/2, cy=(el.y1+el.y2)/2;
  const hdx=(el.x2-el.x1)/2, hdy=(el.y2-el.y1)/2;
  const len=Math.hypot(hdx,hdy)*scale;
  const ang=el.angle||Math.atan2(hdy,hdx);
  el.x1=Math.max(0,Math.min(1,cx-Math.cos(ang)*len));
  el.y1=Math.max(0,Math.min(1,cy-Math.sin(ang)*len));
  el.x2=Math.max(0,Math.min(1,cx+Math.cos(ang)*len));
  el.y2=Math.max(0,Math.min(1,cy+Math.sin(ang)*len));
  el.x=(el.x1+el.x2)/2; el.y=(el.y1+el.y2)/2;
  el.width=len*2;
  el._flashPulse=0.3;
}

function startFloatMomentum(el, vxLogical, vyLogical){
  // Cancel any existing momentum on this element
  if(el._momentumRaf){ cancelAnimationFrame(el._momentumRaf); el._momentumRaf=null; }
  const MIN_SPEED = 0.00015; // logical units/ms — stop threshold
  let vx = vxLogical, vy = vyLogical;
  let lastTs = null;
  function step(ts){
    if(!lastTs){ lastTs=ts; el._momentumRaf=requestAnimationFrame(step); return; }
    const dt = Math.min(ts-lastTs, 50); lastTs=ts;
    el.x = Math.max(0.05,Math.min(0.95, el.x + vx*dt));
    el.y = Math.max(0.05,Math.min(0.95, el.y + vy*dt));
    if(el.visualType==='neon'||el.visualType==='fold'){
      el.x1=Math.max(0,Math.min(1,(el.x1||0)+vx*dt));
      el.y1=Math.max(0,Math.min(1,(el.y1||0)+vy*dt));
      el.x2=Math.max(0,Math.min(1,(el.x2||1)+vx*dt));
      el.y2=Math.max(0,Math.min(1,(el.y2||0)+vy*dt));
      el.x=(el.x1+el.x2)/2; el.y=(el.y1+el.y2)/2;
    }
    if(el.visualType==='beam'||el.visualType==='spot') el.pos=el.x;
    // Soft bounce on canvas edges
    if(el.x<=0.05||el.x>=0.95){ vx*=-0.4; }
    if(el.y<=0.05||el.y>=0.95){ vy*=-0.4; }
    // Decay — 0.92^(dt/16) normalises to 60fps decay
    const decay = Math.pow(0.92, dt/16);
    vx*=decay; vy*=decay;
    // Update audio pan in real time as element drifts
    if(soundEnabled && el._droneNode) updateDroneParams(el);
    if(Math.hypot(vx,vy)>MIN_SPEED){
      el._momentumRaf=requestAnimationFrame(step);
    } else {
      el._momentumRaf=null;
    }
  }
  el._momentumRaf=requestAnimationFrame(step);
}

function getFlickVel(st){
  const dt=st.lastT-(st.prevT||st.lastT);
  if(dt<5||dt>120) return null; // stale or too fast to be intentional
  return {
    vx:(st.lMx-st.prevMx)/(dt*W),
    vy:(st.lMy-st.prevMy)/(dt*H),
  };
}

let _liveMouse={active:false,el:null,lMx:0,lMy:0,sMy:0,sToneX:0.4,prevMx:0,prevMy:0,prevT:0,lastT:0};

function onLiveMouseDown(e){
  if(!_liveMode) return;
  const {mx,my}=livePt(e.clientX,e.clientY);
  const el=liveHitTest(mx,my);
  if(!el) return;
  e.preventDefault();
  const now=Date.now();
  _liveMouse={active:true,el,lMx:mx,lMy:my,sMy:my,sToneX:(el.tone?.x??0.4),prevMx:mx,prevMy:my,prevT:now,lastT:now};
  liveActivate(el);
}

function onLiveMouseMove(e){
  if(!_liveMode||!_liveMouse.active) return;
  const {mx,my}=livePt(e.clientX,e.clientY);
  const now=Date.now();
  liveDrag(_liveMouse.el,mx-_liveMouse.lMx,my-_liveMouse.lMy,my-_liveMouse.sMy,_liveMouse.sToneX);
  _liveMouse.prevMx=_liveMouse.lMx;_liveMouse.prevMy=_liveMouse.lMy;_liveMouse.prevT=_liveMouse.lastT;
  _liveMouse.lMx=mx;_liveMouse.lMy=my;_liveMouse.lastT=now;
}

function onLiveMouseUp(){
  if(!_liveMouse.active) return;
  const v=getFlickVel(_liveMouse);
  liveRelease(_liveMouse.el);
  if(v&&Math.hypot(v.vx,v.vy)>0.0003) startFloatMomentum(_liveMouse.el,v.vx,v.vy);
  _liveMouse.active=false;
}

function onLiveWheel(e){
  if(!_liveMode) return;
  const {mx,my}=livePt(e.clientX,e.clientY);
  const el=liveHitTest(mx,my);
  if(!el) return;
  e.preventDefault();

  // Fast scroll up = reverb throw (equivalent of upward flick gesture on touch)
  if(e.deltaY < -60 && !el._reverbThrowActive && audioCtx && soundEnabled){
    const throwAmt = Math.min(0.90, 0.50 + Math.abs(e.deltaY) * 0.002);
    fireReverbThrow(el, throwAmt, 4.0);
    el._flashPulse = 1.0;
    return;
  }

  const scale=Math.pow(0.9978,e.deltaY);
  // neon → stretch, fold → rotate, spot → rotate, beam → cone width, rest → scale
  if(el.visualType==='neon'){
    el.angle=(el.angle||0)+e.deltaY*0.0028;
    liveStretchNeon(el,scale);
  } else if(el.visualType==='fold'){
    if(el.angle==null) el.angle=0;
    el.angle+=e.deltaY*0.0028;
    liveStretchNeon(el,scale);
    el.volume=Math.max(0.1,Math.min(1.2,(el.volume??0.5)*scale));
    el._foldCacheKey=null;
    if(soundEnabled&&el._droneNode) updateDroneParams(el);
    el._flashPulse=0.35;
  } else if(el.visualType==='spot'){
    if(el.angle==null) el.angle=-Math.PI/2;
    el.angle+=e.deltaY*0.0028;
    // Scroll down = louder/brighter, scroll up = quieter/dimmer
    el.volume=Math.max(0.05,Math.min(1.3,(el.volume??0.75)*scale));
    el.reachPx=Math.max(40,Math.min(W*0.9,(el.reachPx||(Math.min(W,H)*0.45))*Math.pow(0.9992,e.deltaY)));
    if(soundEnabled&&el._droneNode) updateDroneParams(el);
    el._flashPulse=Math.min(1.0,el.volume*0.8); // brighter when louder
  } else if(el.visualType==='beam'){
    liveScaleBeam(el,scale);
  } else {
    liveScale(el,scale);
  }
  el._flashPulse=0.4;
}

const _liveT={};   // touchId → {el,lMx,lMy,sMy,sToneX}
let _livePinchDist=0;
let _livePinchAngle=0; // angle between two fingers — for spot rotation

function onLiveTouchStart(e){
  if(!_liveMode) return;
  e.preventDefault();
  const now=Date.now();
  Array.from(e.changedTouches).forEach(t=>{
    const {mx,my}=livePt(t.clientX,t.clientY);
    const el=liveHitTest(mx,my);
    if(!el) return;
    _liveT[t.identifier]={el,lMx:mx,lMy:my,sMy:my,sToneX:(el.tone?.x??0.4),prevMx:mx,prevMy:my,prevT:now,lastT:now};
    if(!el._touchHeld) liveActivate(el);
  });
  const ids=Object.keys(_liveT);
  if(ids.length>=2){
    const a=_liveT[ids[0]],b=_liveT[ids[1]];
    _livePinchDist=Math.hypot(a.lMx-b.lMx,a.lMy-b.lMy);
    _livePinchAngle=Math.atan2(b.lMy-a.lMy,b.lMx-a.lMx);
  }
}

function onLiveTouchMove(e){
  if(!_liveMode) return;
  e.preventDefault();
  const ids=Object.keys(_liveT);
  if(ids.length>=2){
    const allTouches=Array.from(e.touches);
    const t0=allTouches.find(t=>t.identifier===+ids[0]);
    const t1=allTouches.find(t=>t.identifier===+ids[1]);
    if(t0&&t1){
      const p0=livePt(t0.clientX,t0.clientY),p1=livePt(t1.clientX,t1.clientY);
      const newDist=Math.hypot(p0.mx-p1.mx,p0.my-p1.my);
      const newAngle=Math.atan2(p1.my-p0.my,p1.mx-p0.mx);
      const el=_liveT[ids[0]].el;

      // Type-aware pinch:
      // neon   → stretch/shrink line length
      // fold   → rotate + scale size (both simultaneously)
      // spot   → rotate cone direction like a dial
      // beam   → widen or narrow cone spread
      // blobs  → scale volume + radius
      if(el.visualType==='neon'){
        el.angle=(el.angle||0)+(newAngle-_livePinchAngle);
        if(_livePinchDist>1) liveStretchNeon(el,newDist/Math.max(1,_livePinchDist));
        el._flashPulse=0.35;
      } else if(el.visualType==='fold'){
        // Rotate
        el.angle=(el.angle||0)+(newAngle-_livePinchAngle);
        // Stretch geometry + scale volume (same as neon stretch but also affects volume)
        if(_livePinchDist>1){
          const s=newDist/Math.max(1,_livePinchDist);
          liveStretchNeon(el,s); // reuses neon stretch — fold shares x1/y1/x2/y2 geometry
          el.volume=Math.max(0.1,Math.min(1.2,(el.volume??0.5)*s));
          el._foldCacheKey=null; // invalidate render cache
          if(soundEnabled) updateDroneParams(el);
        }
        el._flashPulse=0.35;
      } else if(el.visualType==='spot'){
        // Initialize from rendered default if angle was never set explicitly
        if(el.angle==null) el.angle=-Math.PI/2;
        el.angle+=(newAngle-_livePinchAngle);
        el._flashPulse=0.35;
      } else if(el.visualType==='beam'){
        if(_livePinchDist>1) liveScaleBeam(el,newDist/Math.max(1,_livePinchDist));
      } else {
        if(_livePinchDist>1) liveScale(el,newDist/Math.max(1,_livePinchDist));
      }
      _livePinchDist=newDist;
      _livePinchAngle=newAngle;
    }
    return;
  }
  const now=Date.now();
  Array.from(e.changedTouches).forEach(t=>{
    const st=_liveT[t.identifier];if(!st) return;
    const {mx,my}=livePt(t.clientX,t.clientY);
    liveDrag(st.el,mx-st.lMx,my-st.lMy,my-st.sMy,st.sToneX);
    st.prevMx=st.lMx;st.prevMy=st.lMy;st.prevT=st.lastT;
    st.lMx=mx;st.lMy=my;st.lastT=now;
  });
}

function onLiveTouchEnd(e){
  if(!_liveMode) return;
  e.preventDefault();
  Array.from(e.changedTouches).forEach(t=>{
    const st=_liveT[t.identifier];if(!st) return;
    const stillHeld=Object.entries(_liveT).some(([id,s])=>s.el===st.el&&+id!==t.identifier);
    if(!stillHeld){
      liveRelease(st.el);
      const v=getFlickVel(st);
      if(v&&Math.hypot(v.vx,v.vy)>0.0003) startFloatMomentum(st.el,v.vx,v.vy);
    }
    delete _liveT[t.identifier];
  });
  if(Object.keys(_liveT).length<2){ _livePinchDist=0; _livePinchAngle=0; ixPinchRelease(); }
}

let _liveTarget = null; // element actually receiving events in Live mode

function attachLiveHandlers(){
  // liveTapZone sits above the canvas (z-index:800) and receives all input.
  // Attach to it directly so events aren't intercepted before we see them.
  _liveTarget = document.getElementById('liveTapZone') || canvas;
  _liveTarget.addEventListener('mousedown',  onLiveMouseDown);
  _liveTarget.addEventListener('wheel',      onLiveWheel,     {passive:false});
  _liveTarget.addEventListener('touchstart', onLiveTouchStart,{passive:false});
  _liveTarget.addEventListener('touchmove',  onLiveTouchMove, {passive:false});
  _liveTarget.addEventListener('touchend',   onLiveTouchEnd,  {passive:false});
  _liveTarget.addEventListener('touchcancel',onLiveTouchEnd,  {passive:false});
  // mouse move/up on document so drag works past the element edge
  document.addEventListener('mousemove', onLiveMouseMove);
  document.addEventListener('mouseup',   onLiveMouseUp);
}

function detachLiveHandlers(){
  if(_liveTarget){
    _liveTarget.removeEventListener('mousedown',  onLiveMouseDown);
    _liveTarget.removeEventListener('wheel',      onLiveWheel);
    _liveTarget.removeEventListener('touchstart', onLiveTouchStart);
    _liveTarget.removeEventListener('touchmove',  onLiveTouchMove);
    _liveTarget.removeEventListener('touchend',   onLiveTouchEnd);
    _liveTarget.removeEventListener('touchcancel',onLiveTouchEnd);
    _liveTarget = null;
  }
  document.removeEventListener('mousemove', onLiveMouseMove);
  document.removeEventListener('mouseup',   onLiveMouseUp);
  Object.values(_liveT).forEach(st=>liveRelease(st.el));
  Object.keys(_liveT).forEach(k=>delete _liveT[k]);
  if(_liveMouse.el) liveRelease(_liveMouse.el);
  _liveMouse.active=false; _livePinchDist=0;
  applyLiveSolo(); // restore full mix
}

function liveHaptic(el){
  if(!navigator.vibrate||!el) return;
  navigator.vibrate(HAPTIC_PATTERNS[el.soundType] || [10]);
}

function enterLiveMode(){
  if(_liveMode) return;
  _liveMode=true;
  hideStudioHints();
  clearTimeout(_studioHintTimer);
  document.body.classList.add('live-mode');
  const tz=document.getElementById('liveTapZone');
  if(tz) tz.style.display='block';
  updateModeToggle();
  // Force canvas to fill full screen — use rAF to wait for CSS to apply
  requestAnimationFrame(()=>{ resize(); requestAnimationFrame(resize); });
  // Start first-run choreography after scene settles
  setTimeout(startFirstRunChoreo, 1000);
  // Apply live mode styles directly via JS (belt + suspenders)
  const topbar = document.querySelector('.topbar');
  if(topbar) topbar.style.setProperty('display','none','important');
  const mobileNav = document.querySelector('.mobile-nav');
  if(mobileNav) mobileNav.style.setProperty('display','none','important');
  const cmdCapsule = document.getElementById('cmdCapsule');
  if(cmdCapsule) cmdCapsule.style.setProperty('display','none','important');
  const sidebar = document.querySelector('.sidebar');
  if(sidebar) sidebar.style.setProperty('display','none','important');
  const vibesLeft = document.querySelector('.vibes-left');
  if(vibesLeft) vibesLeft.style.setProperty('display','none','important');
  requestAnimationFrame(()=>resize());
  attachLiveHandlers();

  ensureAudio();
  if(!soundEnabled){
    soundEnabled=true;
    document.getElementById('btnAudio').classList.add('on');
  }
  // Stop beat immediately so nothing leaks from the current scene
  if(beatEnabled) stopBeat();

  // Load current set based on time of day
  _currentLiveSet = getCurrentSet();
  const startCue  = getCurrentCue(_currentLiveSet);

  // Morph into the set's current genre and generate a fresh scene for it
  // morphToGenre handles the smooth crossfade + element rebuild
  const targetGenre = startCue.genre || _currentLiveSet.cues[0].genre;
  morphToGenre(targetGenre, ()=>{
    // Build fresh arrangement for this set/genre
    const style = STYLES[targetGenre] || STYLES['deephouse'];
    paletteHue = Math.random()*360; paletteIdx = 0;
    pickProgressionForStyle(targetGenre);
    const root  = document.getElementById('keySelect').value||'A';
    const scale = document.getElementById('scaleSelect').value||'Minor';
    const chordRoot = getChordRootDeg();
    const arr   = style.arrangement;
    const subRoles   = arr.filter(r=>r.soundType==='Sub');
    const requiredRoles = arr.filter(r=>r._required&&r.soundType!=='Sub');
    const otherRoles = arr.filter(r=>r.soundType!=='Sub'&&!r._required);
    const shuffled   = [...otherRoles].sort(()=>Math.random()-.5);
    const isMobile   = window.innerWidth<=600;
    // Genre layer limits — fewer stronger roles sounds more composed than dense walls
    const layerLimits = GENRE_LAYER_LIMITS[targetGenre] || { min:4, max:6 };
    const totalFixed   = subRoles.slice(0,1).length + requiredRoles.length;
    const maxOtherGenre = isMobile
      ? Math.min(2, layerLimits.max - totalFixed)
      : Math.min(layerLimits.max - totalFixed, otherRoles.length);
    const minOther   = Math.max(0, layerLimits.min - totalFixed);
    const maxOther   = Math.max(minOther, maxOtherGenre);
    const pickCount  = minOther + Math.floor(Math.random() * Math.max(1, maxOther - minOther + 1));
    // Cap Growl at 1 -- never add a second Growl to the scene
    let growlSeen=false;
    const chosenRaw=[...subRoles.slice(0,1),...requiredRoles,...shuffled.slice(0,pickCount).filter(r=>{
      if(r.soundType==='Acid'){if(growlSeen)return false;growlSeen=true;}return true;
    })];
    // DATA-02: Balance role ratios for this genre before zone filtering
    balanceRolesForGenre(chosenRaw, targetGenre);
    // Zone budgeting: drop roles whose octave-zone is already full
    const liveZc={ sub:0, low:0, mid:0, high:0, air:0 };
    const chosen=chosenRaw.filter(role=>{
      const z=getOctZone(role.oct??3);
      if((liveZc[z]||0) >= ZONE_CAPS[z]) return false;
      liveZc[z]++; return true;
    });
    pickCompositionTemplate(); // Suprematist layout for this Live set scene
    chosen.forEach(role=>{
      const vt=role.vtype==='fold'?'fold':role.vtype==='neon'?'neon':role.vtype==='beam'?'beam':role.vtype==='spot'?'spot':pickVisualType(role.soundType,role.xPos,role.yPos);
      const el=createElement(vt,role.xPos,role.yPos,nextColor());
      el.soundType=role.soundType;
      el.variation=role.variation??Math.floor(Math.random()*4);
      applyPreset(el);
      // Tiny ±0.03 jitter on shape/tone/space — preserve role character
      if(role.shape) el.shape={x:Math.max(0,Math.min(1,role.shape.x+(Math.random()-.5)*.06)),y:Math.max(0,Math.min(1,role.shape.y+(Math.random()-.5)*.06))};
      if(role.tone)  el.tone ={x:Math.max(0,Math.min(1,role.tone.x +(Math.random()-.5)*.06)),y:Math.max(0,Math.min(1,role.tone.y +(Math.random()-.5)*.06))};
      if(role.space) el.space={x:Math.max(0,Math.min(1,role.space.x+(Math.random()-.5)*.06)),y:Math.max(0,Math.min(1,role.space.y+(Math.random()-.5)*.06))};
      // Tag for chord progression, pitch at current chord position
      el._roleDeg=role.deg??0;
      el._roleOct=role.oct??3;
      el.note=getHarmonicNote(root,scale,el._roleDeg+chordRoot,el._roleOct);
      // Preserve curated mix balance — tiny ±3% jitter only
      el.volume=role.vol*(0.97+Math.random()*0.06);
      el.pan=role.pan+(Math.random()-.5)*0.08;
      applyRoleAndTriggerMode(el);
      el.radius=role.radius*(0.95+Math.random()*0.10);
      // Default line geometry — composition template overrides for diagonals
      const cx=el.x,cy=el.y,hw=.12+Math.random()*.20;
      el.x1=cx-hw;el.y1=cy+(Math.random()-.5)*.15;
      el.x2=cx+hw;el.y2=cy+(Math.random()-.5)*.15;
      el.angle=(Math.random()-.5)*Math.PI;el.coneWidth=.15+Math.random()*.4;
      el.pos=el.x;el.width=.12+Math.random()*.20;
      // Suprematist composition: override position/radius/rotation
      applyCompositionToElement(el, chosen.length);
      elements.push(el);
    });
    nextId=elements.length+1;

    // Start evolving
    captureMotif();
    generateActive=true;
    const beatMs=(60000/bpm);
    generateInterval=setInterval(()=>evolveOnce(), beatMs*(2+Math.random()*2));

    // Show cue label
    showLiveCueLabel(_currentLiveSet, startCue);
    renderSchedule();
    // Start beat here — after scene is fully built, no sound leak from old elements
    if(!beatEnabled) startBeat();
    startLiveSetRunner();
    scheduleLiveDrift();
  });

  // Reset pause/record state
  _livePaused=false; _liveRecording=false;
  const pauseBtn=document.getElementById('liveBtnPause');
  if(pauseBtn){ pauseBtn.textContent='⏸'; pauseBtn.style.color='rgba(255,255,255,0.85)'; pauseBtn.style.borderColor='rgba(255,255,255,0.15)'; }
  const recBtn=document.getElementById('liveBtnRecord');
  if(recBtn){ recBtn.textContent='⏺'; recBtn.style.color='rgba(255,100,100,0.85)'; recBtn.style.background='rgba(255,80,80,0.08)'; }

  showLiveControls();
  updateLiveSetLabel(); // show set name in button immediately

  const btn=document.getElementById('btnLive');
  btn.style.color='rgba(255,80,80,1)';
  btn.style.background='rgba(255,80,80,0.15)';
  btn.style.borderColor='rgba(255,80,80,0.5)';
}

function exitLiveMode(){
  if(!_liveMode) return;
  _liveMode=false;
  document.body.classList.remove('live-mode');
  const tz=document.getElementById('liveTapZone');
  if(tz) tz.style.display='none';
  updateModeToggle();
  // Clean up live labels
  if(typeof updateLiveTouchLabels === 'function') updateLiveTouchLabels();
  // Restore styles
  const topbar = document.querySelector('.topbar');
  if(topbar) topbar.style.removeProperty('display');
  const mobileNav = document.querySelector('.mobile-nav');
  if(mobileNav) mobileNav.style.removeProperty('display');
  const cmdCapsule = document.getElementById('cmdCapsule');
  if(cmdCapsule) cmdCapsule.style.removeProperty('display');
  const sidebar = document.querySelector('.sidebar');
  if(sidebar) sidebar.style.removeProperty('display');
  const vibesLeft = document.querySelector('.vibes-left');
  if(vibesLeft) vibesLeft.style.removeProperty('display');
  requestAnimationFrame(()=>resize());
  if(_liveDriftTimer){ clearTimeout(_liveDriftTimer); _liveDriftTimer=null; }
  clearTimeout(_liveHideTimer);
  stopLiveSetRunner();
  resetFormPosition(); // restore neutral filter/reverb
  detachLiveHandlers(); // remove touch instrument handlers

  // If paused, resume audio
  if(_livePaused){
    _livePaused=false;
    if(audioCtx&&audioCtx.state==='suspended') audioCtx.resume();
    if(!beatEnabled) startBeat();
    elements.forEach(el=>maybeStartDrone(el));
  }

  // Stop recording if active
  if(_liveRecording&&_liveMediaRecorder&&_liveMediaRecorder.state!=='inactive'){
    _liveMediaRecorder.stop();
    _liveRecording=false;
  }

  // Stop generate -- edit mode should be static, no evolution
  if(generateActive){
    clearInterval(generateInterval); generateInterval=null; generateActive=false;
    const gBtn=document.getElementById('btnGenerate');
    if(gBtn){ gBtn.textContent='Generate'; gBtn.style.color='rgba(126,232,162,0.9)'; gBtn.style.background='rgba(126,232,162,0.06)'; }
    densityUnmute();
    resetFormPosition();
  }

  // Reset arc to idle -- no more builds/drops/breaks
  arcState='idle'; arcBar=0;

  // Reset conductor: clear all live-mode intents (liveSet, userGesture, djBrain).
  // After clearing, resolveConductorTargets() will fall back to conductorBaseTargets
  // automatically on the next frame — no direct writes needed.
  clearConductorIntents('liveSet.');
  clearConductorIntents('userGesture.');
  clearConductorIntents('djBrain.');
  clearConductorIntents('formCycle.');
  clearConductorIntents('microTexture.');

  updateLiveSetLabel();

  const btn=document.getElementById('btnLive');
  btn.style.color='rgba(255,80,80,0.85)';
  btn.style.background='rgba(255,80,80,0.06)';
  btn.style.borderColor='rgba(255,80,80,0.3)';
}

function showLiveControls(){
  const c=document.getElementById('liveControls');
  const h=document.getElementById('liveGestureHints');
  if(!c) return;
  c.style.display='flex';
  c.style.opacity='1'; c.style.transform='translateX(-50%) translateY(0)';
  if(h){ h.style.opacity='1'; h.style.transform='translateX(-50%) translateY(0)'; }
  _liveControlsVisible=true;
  clearTimeout(_liveHideTimer);
  _liveHideTimer=setTimeout(hideLiveControls, 4000);
}

function hideLiveControls(){
  const c=document.getElementById('liveControls');
  const h=document.getElementById('liveGestureHints');
  if(!c) return;
  c.style.opacity='0'; c.style.transform='translateX(-50%) translateY(12px)';
  if(h){ h.style.opacity='0'; h.style.transform='translateX(-50%) translateY(-10px)'; }
  _liveControlsVisible=false;
}

