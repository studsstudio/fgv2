// fg-visual.js — Canvas rendering, draw loop, all visual functions.
// draw(ts), drawBlob, drawNeon, drawFold, drawSpot, drawBeam, drawMarker,
// particles, color helpers, XY pad SVG, sound lib blobs.
// Depends on: fg-data.js, fg-state.js, fg-audio.js

const canvas=document.getElementById('canvas');
let ctx=null, offscreen=null, oCtx=null;
const DPR=window.devicePixelRatio||1;
let W=700,H=500;

function ensureCtx(){
  if(ctx) return true;
  if(!canvas) return false;
  ctx=canvas.getContext('2d');
  if(!ctx) return false;
  if(!offscreen){
    offscreen=document.createElement('canvas');
    oCtx=offscreen.getContext('2d');
  }
  return true;
}

function resize(){
  const wrap=document.getElementById('canvasWrap');
  if(!wrap||!canvas) return;
  // iOS Safari: use visualViewport for accurate height (avoids address bar issues)
  const vvp = window.visualViewport;
  W = wrap.clientWidth || (vvp ? vvp.width : window.innerWidth) || 700;
  H = wrap.clientHeight || (vvp ? vvp.height : window.innerHeight) || 500;
  // In live mode, force full screen dimensions
  if(_liveMode){
    W = vvp ? vvp.width : window.innerWidth;
    H = vvp ? vvp.height : window.innerHeight;
  }
  canvas.width=W*DPR; canvas.height=H*DPR;
  if(ensureCtx()) ctx.setTransform(DPR,0,0,DPR,0,0);
}

function nextColor(){const hues=[0,30,60,120,180,210,270,330];const h=(paletteHue+hues[paletteIdx%hues.length])%360;paletteIdx++;return hslToHex(h,65+Math.random()*20,50+Math.random()*15);}
function hslToHex(h,s,l){s/=100;l/=100;const a=s*Math.min(l,1-l);const f=n=>{const k=(n+h/30)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1));};return '#'+[f(0),f(8),f(4)].map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('');}
function hexToRgba(hex,a){if(!hex||hex[0]!=='#') return `rgba(100,100,100,${a})`;return `rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},${a})`;}

let elapsed=0,lastTime=0;
let beatPulseKick=0,beatPulseClap=0,beatPulseHihat=0;

function getVisParams(el){
  const sx=(el.shape&&el.shape.x!=null?el.shape.x:0.5), sy=(el.shape&&el.shape.y!=null?el.shape.y:0.5);
  const tx=(el.tone&&el.tone.x!=null?el.tone.x:0.4),  ty=(el.tone&&el.tone.y!=null?el.tone.y:0.2);
  const px=(el.space&&el.space.x!=null?el.space.x:0.35), py=(el.space&&el.space.y!=null?el.space.y:0.4);
  const vol=el.volume??0.75;
  // Role-gated beat boost — rhythm elements sync to kick, atmosphere ignores it
  const _elRole = getInstrumentRole ? getInstrumentRole(el) : 'voice';
  const _isRhythm = _elRole === 'rhythm';
  const _isAtmo   = _elRole === 'atmosphere';
  const kickBoost    = beatPulseKick  * (_isRhythm ? 0.65 : _isAtmo ? 0.0 : 0.08);
  const clapFlash    = beatPulseClap  * (_isRhythm ? 0.50 : _isAtmo ? 0.0 : 0.06);
  const hihatFlicker = beatPulseHihat * (_isRhythm ? 0.22 : _isAtmo ? 0.0 : 0.04);
  // Atmosphere gets its own glow from _notePulse undulation instead
  const notePulseBoost = (el._notePulse||0) * (_isAtmo ? 0.55 : 0.20);
  const droneActive=el._droneNode?1:0;
  const brightness=Math.pow(tx,0.7);
  const resonance=Math.pow(ty,0.8);
  const sharpness=1-sx;
  const wetness=px;
  // Touch-held boost + engine-synced visual flicker
  const touchBoost=el._touchHeld?0.22:0;
  let flicker=0;
  if(el._touchHeld&&el._holdFlickerHz&&el._holdStartT&&audioCtx){
    // Read current audio time — syncs render to engine frequency exactly
    const phase=2*Math.PI*(audioCtx.currentTime-el._holdStartT)*el._holdFlickerHz;
    flicker=Math.max(0,Math.sin(phase)); // 0-1, pulses at engine Hz
  }
  return {
    opacity: 0.04+(brightness*0.85)+(vol*0.15)+clapFlash+notePulseBoost*0.3+touchBoost*0.50+flicker*0.35,
    glowMult: 0.3+(wetness*2.5)+(py*0.8)+kickBoost*0.8+notePulseBoost*0.8+droneActive*0.3+touchBoost+flicker*1.4,
    sharpness: resonance*0.92,
    animSpeed: 0.004+sharpness*0.18,
    sizeScale: 0.15+(vol*1.4)+kickBoost*0.45+notePulseBoost*0.4+touchBoost*0.35+flicker*0.55,
    falloff: 0.12+(1-brightness)*0.7+(py*0.2),
    satBoost: resonance,
    cutHz: 60+Math.pow(tx,1.4)*12000,
    resoPct: ty*100,
    revPct: px*100,
    wideness: py,
    volPct: vol,
    hihatFlicker,
    droneActive,
  };
}

const _particles = Array.from({length:24}, ()=>({
  x: Math.random(),
  y: Math.random(),
  vx: (Math.random()-.5)*0.00012,
  vy: (Math.random()-.5)*0.00009,
  alpha: 0.04 + Math.random()*0.10,
  r: 0.6 + Math.random()*1.4,
  phase: Math.random()*Math.PI*2,
}));

function drawParticles(ctx, W, H, elapsed, kick){
  const kickBoost = kick * 0.08;
  ctx.save();
  ctx.globalCompositeOperation='screen';
  _particles.forEach(p=>{
    // Drift
    p.x += p.vx; p.y += p.vy;
    // Wrap edges
    if(p.x<0) p.x=1; if(p.x>1) p.x=0;
    if(p.y<0) p.y=1; if(p.y>1) p.y=0;
    // Breathe alpha gently
    const breath = Math.sin(elapsed*0.4+p.phase)*0.025;
    const a = Math.max(0, Math.min(0.22, p.alpha + breath + kickBoost));
    const px=p.x*W, py=p.y*H;
    const rr = p.r + kick*1.5;
    ctx.beginPath();
    ctx.arc(px, py, rr, 0, Math.PI*2);
    ctx.fillStyle=`rgba(255,255,255,${a})`;
    ctx.fill();
  });
  ctx.restore();
}

let _liveLabelEls = new Map(); // el.id -> DOM element

function updateLiveTouchLabels(){
  const canvas = document.getElementById('canvas');
  if(!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const W = rect.width, H = rect.height;

  // Remove labels for elements no longer present
  const seen = new Set();
  elements.forEach(el => {
    if(el.muted) return;
    seen.add(el.id);

    let labelEl = _liveLabelEls.get(el.id);
    if(!labelEl){
      labelEl = document.createElement('div');
      labelEl.className = 'live-touch-label';
      labelEl.innerHTML = '<span class="ltl-main"></span><span class="ltl-sub"></span>';
      labelEl.style.position = 'fixed'; // fixed so not clipped by canvas-wrap overflow:hidden
      document.body.appendChild(labelEl);
      _liveLabelEls.set(el.id, labelEl);
    }

    // Position: offset right and above the handle dot
    // Use getBoundingClientRect for fixed positioning so overflow:hidden doesn't clip
    let hp;
    try {
      hp = elHandlePos ? elHandlePos(el) : {x: el.x*W, y: el.y*H};
    } catch(e) {
      hp = {x: (el.x||0.5)*W, y: (el.y||0.5)*H};
    }
    // Sanitize — handle NaN/Infinity/undefined from missing geometry (e.g. beam/neon
    // elements with incomplete pos data, or Sub variants with non-standard layout)
    if(!isFinite(hp.x) || !isFinite(hp.y)){
      hp = {x: (el.x||0.5)*W, y: (el.y||0.5)*H};
    }
    if(!isFinite(hp.x)) hp.x = W*0.5;
    if(!isFinite(hp.y)) hp.y = H*0.5;
    const px = rect.left + hp.x + 18;
    const py = rect.top  + hp.y - 22;
    labelEl.style.left = Math.max(4, Math.min(window.innerWidth - 100, px)) + 'px';
    labelEl.style.top  = Math.max(4, Math.min(window.innerHeight - 30, py)) + 'px';

    // Content
    const mainText = el.soundType || '?';
    const subText  = LIVE_LABEL_SUBTITLES[el.soundType] || '';
    labelEl.querySelector('.ltl-main').textContent = mainText;
    labelEl.querySelector('.ltl-sub').textContent  = subText;

    // Opacity: live mode full brightness, studio mode dimmer unless active; hidden if markers off
    const isActive = el.id === activeId;
    const opacity = _liveMode
      ? (el._touchHeld ? 1.0 : 0.65)
      : (!showMarkers ? 0 : isActive ? 0.90 : 0.38);
    labelEl.style.opacity = opacity;
  });

  // Remove labels for removed/muted elements
  _liveLabelEls.forEach((labelEl, id) => {
    if(!seen.has(id)){ labelEl.remove(); _liveLabelEls.delete(id); }
  });
}

function draw(ts){
  if(!ensureCtx()||!oCtx){requestAnimationFrame(draw);return;}
  if(ts){const dt=ts-(lastTime||ts);lastTime=ts;elapsed+=dt*0.001;}
  // Update touch labels every 3 frames (both studio and live)
  if(Math.round(elapsed*30)%3===0) updateLiveTouchLabels();
  elements.forEach(el=>{
    // Role-aware decay — rhythm snaps, melody holds, atmosphere breathes
    const _role = getInstrumentRole ? getInstrumentRole(el) : 'voice';
    const _stype = el.soundType || '';

    // _pulse decay rate: rhythm=fast snap, voice=medium, atmosphere=slow breathe
    const _pulseDecay = _role === 'rhythm'     ? 0.72   // fast snap — drum hit
                      : _role === 'atmosphere'  ? 0.965  // slow breathe — pad/drone
                      : (_stype==='Arp'||_stype==='Pluck') ? 0.82  // flicker per note
                      : (_stype==='Sub'||_stype==='Acid')  ? 0.78  // bass — medium snap
                      : 0.87; // other voice — medium hold

    // _flashPulse decay: always faster than _pulse
    const _flashDecay = _role === 'rhythm'    ? 0.68
                      : _role === 'atmosphere' ? 0.94
                      : 0.80;

    if(el._pulse>0){el._pulse*=_pulseDecay;if(el._pulse<0.01)el._pulse=0;}
    else{el._lastPulse=0;}
    // Held intensity — ramps up while held, snaps to 0 on release
    if(el._touchHeld){
      if(!el._heldIntensity) el._heldIntensity=0;
      el._heldIntensity = Math.min(1, (el._heldIntensity||0) + 0.04); // ~25 frames to full
    } else if(el._heldIntensity > 0){
      el._heldIntensity *= 0.85;
      if(el._heldIntensity < 0.01) el._heldIntensity = 0;
    }
    if(el._flashPulse>0){el._flashPulse*=_flashDecay;if(el._flashPulse<0.01)el._flashPulse=0;}

    // _notePulse: melodic note-hold visual — set to note gate duration, decays slowly
    // Used by drawBlob/drawNeon to show note sustain separately from beat flash
    if(el._notePulse>0){el._notePulse*=0.97;if(el._notePulse<0.01)el._notePulse=0;}

    // Atmosphere elements: sustained _notePulse while drone is playing
    // Undulates slowly — tied to elapsed time, not beat
    if(_role === 'atmosphere' && el._droneNode && !el.muted){
      const undulate = 0.15 + Math.sin(elapsed * 0.4 + el.id * 1.3) * 0.10;
      el._notePulse = undulate; // gentle slow breath — not beat-locked
    }
    // Suprematist drift: smoothly lerp each element toward its target position.
    // Skipped while user is holding or momentum is running.
    if(el._tx!=null && !el._touchHeld && !el._momentumRaf){
      const k=1-Math.exp(-(lastTime?ts-lastTime:16)*0.00085); // ~3.5s convergence
      el.x += (el._tx-el.x)*k; el.y += (el._ty-el.y)*k;
      if(el.visualType==='neon'||el.visualType==='fold'){
        if(el._tx1!=null){
          el.x1+=(el._tx1-el.x1)*k; el.y1+=(el._ty1-el.y1)*k;
          el.x2+=(el._tx2-el.x2)*k; el.y2+=(el._ty2-el.y2)*k;
        }
      }
      if(el.visualType==='beam'||el.visualType==='spot') el.pos=el.x;
      if(el._tradius) el.radius+=(el._tradius-el.radius)*k;
      if(Math.abs(el._tx-el.x)<0.001 && Math.abs(el._ty-el.y)<0.001){
        el.x=el._tx; el.y=el._ty; el._tx=null; el._ty=null;
        if(el._tradius){el.radius=el._tradius;el._tradius=null;}
      }
      if(soundEnabled && el._droneNode) updateDroneParams(el);
    }
  });
  beatPulseKick*=0.88;if(beatPulseKick<0.01)beatPulseKick=0;
  beatPulseClap*=0.82;if(beatPulseClap<0.01)beatPulseClap=0;
  beatPulseHihat*=0.75;if(beatPulseHihat<0.01)beatPulseHihat=0;
  decayDropFlash();
  const cmods=getConductorMods();
  if(offscreen&&(offscreen.width!==W||offscreen.height!==H)){offscreen.width=W;offscreen.height=H;}
  if(W<1||H<1){requestAnimationFrame(draw);return;}
  ctx.globalCompositeOperation='source-over';
  ctx.fillStyle=bgColor;ctx.fillRect(0,0,W,H);
  if(cmods.dropFlash>0.02){
    ctx.fillStyle=`rgba(255,255,255,${cmods.dropFlash*0.35})`;
    ctx.fillRect(0,0,W,H);
    // Shockwave ring expanding from centre
    const shockR=Math.min(W,H)*(1.2-cmods.dropFlash*0.8);
    const shockG=ctx.createRadialGradient(W/2,H/2,shockR*0.85,W/2,H/2,shockR);
    shockG.addColorStop(0,   `rgba(255,255,255,0)`);
    shockG.addColorStop(0.6, `rgba(255,255,255,${cmods.dropFlash*0.25})`);
    shockG.addColorStop(1,   `rgba(255,255,255,0)`);
    ctx.fillStyle=shockG; ctx.fillRect(0,0,W,H);
  }
  // ── LIVING BACKGROUND ────────────────────────────────────────────────────
  {
    const rootNote = document.getElementById('keySelect')?.value||'A';
    const KEY_HUE = {C:200,D:220,'D#':230,E:240,F:250,'F#':260,G:270,'G#':180,A:195,'A#':210,B:205,'C#':215};
    const baseHue = KEY_HUE[rootNote]||200;
    const tension = cmods.tension||0;

    // Live energy shifts background — high energy = brighter, more saturated
    // breakdown/resolution = dims to near-black
    const energyBoost = _liveMode ? _liveEnergy * 0.4 : 0;
    const hue = baseHue + Math.sin(elapsed*0.04)*8;
    const sat = Math.max(15, 35 - tension*20 + energyBoost*25);
    const lBase = Math.max(2, 6 - tension*3 + energyBoost*6);

    // Throttle: only redraw background orbs every 3 frames (~20fps) — saves gradient allocations
    if(!draw._bgTick) draw._bgTick=0;
    if(draw._bgTick++%3===0){
      [[0.3,0.25,0.55],[0.72,0.65,0.45]].forEach(([fx2,fy2,phase])=>{
        const ox2=Math.sin(elapsed*0.018+phase)*0.12;
        const oy2=Math.cos(elapsed*0.013+phase)*0.10;
        const bx2=(fx2+ox2)*W, by2=(fy2+oy2)*H;
        const br=Math.max(W,H)*(0.55+Math.sin(elapsed*0.022+phase)*0.05);
        const ag=ctx.createRadialGradient(bx2,by2,0,bx2,by2,br);
        ag.addColorStop(0,   `hsla(${hue},${sat}%,${lBase+2}%,0.85)`);
        ag.addColorStop(0.5, `hsla(${hue},${sat}%,${lBase}%,0.4)`);
        ag.addColorStop(1,   `hsla(${hue},${sat}%,${lBase-1}%,0)`);
        ctx.globalCompositeOperation='source-over';
        ctx.fillStyle=ag;
        ctx.fillRect(0,0,W,H);
      });
    }

    // Kick pulse — only when fresh (>0.15 threshold avoids redundant gradient creation)
    if(beatPulseKick>0.15){
      const kr=beatPulseKick*Math.min(W,H)*0.6;
      const kg=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,kr);
      kg.addColorStop(0,   `hsla(${hue},60%,50%,0)`);
      kg.addColorStop(0.7, `hsla(${hue},60%,50%,${beatPulseKick*0.06})`);
      kg.addColorStop(1,   `hsla(${hue},60%,50%,0)`);
      ctx.fillStyle=kg; ctx.fillRect(0,0,W,H);
    }
  }

  oCtx.clearRect(0,0,W,H);
  // Sort back-to-front by depth so far elements render under near ones
  const sortedEls = [...elements].sort((a,b)=>(a._depth||0.7)-(b._depth||0.7));
  sortedEls.forEach((el,i)=>{
    const depth = el._depth || 0.7; // 0.4=far, 1.0=near
    let burstX=0,burstY=0;
    if(cmods.dropBurst>0.01){
      const bx=(el.x-0.5)*W, by=(el.y-0.5)*H;
      const dist=Math.sqrt(bx*bx+by*by)||1;
      const strength=cmods.dropBurst*Math.pow(cmods.dropBurst,0.5)*180;
      burstX=(bx/dist)*strength;
      burstY=(by/dist)*strength;
    }
    let driftX=0,driftY=0;
    if(cmods.drift>0.05){
      const angle=el._animPhase*2;
      const d=cmods.drift*0.04*W;
      driftX=Math.cos(angle+elapsed*0.15)*d;
      driftY=Math.sin(angle*0.7+elapsed*0.12)*d;
    }
    let tensionX=0,tensionY=0;
    if(cmods.tension>0.05){
      tensionX=(0.5-el.x)*W*cmods.tension*0.35;
      tensionY=(0.5-el.y)*H*cmods.tension*0.35;
    }
    let shimX=0,shimY=0;
    if(cmods.shimmer>0.05){
      shimX=Math.sin(elapsed*7+i*2.3)*cmods.shimmer*6;
      shimY=Math.cos(elapsed*5.5+i*1.7)*cmods.shimmer*4;
    }
    // Hover float — cursor proximity makes element gently bob, signalling interactability
    let hoverX=0,hoverY=0;
    if(!_liveMode && mousePx && el.visualType!=='neon' && el.visualType!=='fold'){
      const hpEl = elHandlePos ? elHandlePos(el) : {x:el.x*W, y:el.y*H};
      const hdx=mousePx.x-hpEl.x, hdy=mousePx.y-hpEl.y;
      const hdist=Math.sqrt(hdx*hdx+hdy*hdy);
      const hoverZone = (el.radius||0.25)*Math.min(W,H)*1.8 + 60;
      const rawAmt = Math.max(0, 1 - hdist/hoverZone);
      el._hoverAmt = (el._hoverAmt||0)*0.85 + rawAmt*0.15;
      if(el._hoverAmt > 0.01){
        const ha = el._hoverAmt;
        hoverX = Math.sin(elapsed*2.2 + el.id*1.1) * ha * 18;
        hoverY = Math.cos(elapsed*1.8 + el.id*0.9) * ha * 14 - ha*8; // float upward
      }
    } else {
      el._hoverAmt = (el._hoverAmt||0)*0.92;
    }
    // Parallax: far elements (low depth) move less, near elements move more
    const parallaxMult = 0.3 + depth * 0.7;
    el._conductorOffsetX = (burstX+driftX+tensionX+shimX+hoverX) * parallaxMult;
    el._conductorOffsetY = (burstY+driftY+tensionY+shimY+hoverY) * parallaxMult;
    // Hover glow — clear brightness increase when cursor is near
    if(el._hoverAmt > 0.05 && !_liveMode){
      el._flashPulse = Math.max(el._flashPulse||0, el._hoverAmt * 0.55);
      el._pulse = Math.max(el._pulse||0, el._hoverAmt * 0.35);
    }
    // Depth scale: far elements render smaller (0.4=60% size, 1.0=100%)
    el._depthScale = 0.55 + depth * 0.45;
    // Depth opacity: far elements dimmer
    el._depthOpacity = 0.45 + depth * 0.55;
    // Hover proximity — works in both studio and live mode
    if(typeof mousePx!=='undefined' && mousePx.x!==undefined){
      const hpEl = {x: el.x*W, y: el.y*H};
      const hdist = Math.hypot(mousePx.x - hpEl.x, mousePx.y - hpEl.y);
      const hzone = (el.radius||0.25)*Math.min(W,H)*1.4 + 50;
      const rawH = Math.max(0, 1 - hdist/hzone);
      el._hoverAmt = (el._hoverAmt||0)*0.82 + rawH*0.18;
    } else {
      el._hoverAmt = (el._hoverAmt||0)*0.85;
    }
    const baseAlpha = cmods.drift>0.1 ? Math.max(0.15,1-cmods.drift*0.5) : 1;
    if(el.muted){oCtx.globalAlpha=0.08;}
    else{oCtx.globalAlpha=baseAlpha * el._depthOpacity;}
    if(el.visualType==='blob') drawBlob(el);
    else if(el.visualType==='neon') drawNeon(el);
    else if(el.visualType==='fold') drawFold(el);
    else if(el.visualType==='spot') drawSpot(el);
    else if(el.visualType==='beam') drawBeam(el);
    oCtx.globalAlpha=1;
  });
  ctx.globalCompositeOperation='screen';
  if(offscreen&&offscreen.width>0&&offscreen.height>0) ctx.drawImage(offscreen,0,0);

  if(cmods.cool>0.02){
    ctx.globalCompositeOperation='source-over';
    ctx.fillStyle=`rgba(20,60,140,${cmods.cool*0.22})`;
    ctx.fillRect(0,0,W,H);
  }
  if(cmods.bloom>0.05){
    ctx.globalCompositeOperation='screen';
    ctx.fillStyle=`rgba(255,255,255,${cmods.bloom*0.06})`;
    ctx.fillRect(0,0,W,H);
  }
  ctx.globalCompositeOperation='source-over';
  elements.forEach(el=>drawMarker(el));
  const mx=mousePx.x,my=mousePx.y;
  if(currentTool==='fold'&&lineStart){
    ctx.save();ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=1;ctx.setLineDash([4,4]);
    ctx.beginPath();ctx.moveTo(lineStart.x*W,lineStart.y*H);ctx.lineTo(mx,my);ctx.stroke();
    ctx.setLineDash([]);ctx.restore();
  }
  if(currentTool==='spot'&&spotStart){
    ctx.save();ctx.globalAlpha=0.35;
    const sox=spotStart.x*W,soy=spotStart.y*H;
    if(spotStart.step===1){
      ctx.beginPath();ctx.moveTo(sox,soy);ctx.lineTo(mx,my);
      ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([]);
      ctx.beginPath();ctx.arc(sox,soy,4,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
    } else if(spotStart.step===2){
      const ca=Math.atan2(my/H-spotStart.y,mx/W-spotStart.x);
      const ph=Math.abs(ca-spotStart.angle);
      const bLen=Math.max(W,H)*1.2;
      const lx2=sox+Math.cos(spotStart.angle-ph)*bLen,ly2=soy+Math.sin(spotStart.angle-ph)*bLen;
      const rx2=sox+Math.cos(spotStart.angle+ph)*bLen,ry2=soy+Math.sin(spotStart.angle+ph)*bLen;
      ctx.beginPath();ctx.moveTo(sox,soy);ctx.lineTo(lx2,ly2);ctx.lineTo(rx2,ry2);ctx.closePath();
      ctx.fillStyle='rgba(255,255,255,0.06)';ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;ctx.stroke();
      ctx.beginPath();ctx.arc(sox,soy,4,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
    }
    ctx.restore();
  }
  requestAnimationFrame(draw);
}

function addBlobStops(g,color,alpha,falloff,sharp){
  const f=falloff??0.5;
  if(sharp>0.5){
    const rs=Math.max(0.1,f*0.7),rp=Math.min(0.95,f);
    g.addColorStop(0,hexToRgba(color,alpha*0.12));
    g.addColorStop(rs,hexToRgba(color,alpha*0.12));
    g.addColorStop(rp,hexToRgba(color,Math.min(1,alpha*1.2)));
    g.addColorStop(Math.min(0.99,rp+0.06),hexToRgba(color,alpha*0.08));
    g.addColorStop(1,hexToRgba(color,0));
  }else{
    g.addColorStop(0,hexToRgba(color,Math.min(1,alpha)));
    g.addColorStop(Math.min(0.99,f),hexToRgba(color,alpha*0.06));
    g.addColorStop(1,hexToRgba(color,0));
  }
}

function drawBlob(el){
  const ox=el._conductorOffsetX||0, oy=el._conductorOffsetY||0;
  const cx=el.x*W+ox, cy=el.y*H+oy, v=getVisParams(el);
  // C3: each element gets its own breathing rhythm — no two blobs pulse identically
  if(!el._warpFreqA) el._warpFreqA = 2 + Math.floor(Math.random()*3);   // 2,3,4
  if(!el._warpFreqB) el._warpFreqB = 4 + Math.floor(Math.random()*3);   // 4,5,6
  if(!el._warpSpeed) el._warpSpeed = 0.6 + Math.random()*0.8;           // 0.6–1.4×
  const depthScale = el._depthScale ?? 1.0;
  // Hover effect — computed fresh here, no dependency on conductor offset system
  const hov = el._hoverAmt || 0;
  const bassPulse = el.soundType==='Sub' ? (el._pulse||0)*0.25 : 0;
  const pulseMult = 0.15 + depthScale * 0.20;
  const notePulse = el._notePulse || 0;
  const baseR=(40+v.sizeScale*250)*(el.radius||0.35)*1.6*depthScale*(1+hov*0.22+el._pulse*pulseMult+bassPulse+notePulse*0.18);
  const t=elapsed*v.animSpeed*el._warpSpeed+el._animPhase + hov*Math.sin(elapsed*2.2+el.id)*0.15;
  const warp=v.sharpness*0.4;
  const glowMult=v.glowMult*(1+(el._flashPulse||0)*0.7+(el._notePulse||0)*0.35+hov*0.5);
  const satShift=v.satBoost*0.4;
  const renderColor=el.color;
  const numLayers=3;
  for(let li=0;li<numLayers;li++){
    const lr=(li===0?2.0:li===1?1.15:0.55)*baseR;
    const lA=li===0
      ? v.opacity*0.3*glowMult
      : li===1
      ? v.opacity*0.6*glowMult
      : Math.min(1,v.opacity*1.1*(1+satShift));
    if(!el._cloudOffsets||el._cloudOffsets.length<20)
      el._cloudOffsets=Array.from({length:20},()=>(Math.random()-0.5)*0.3);
    const pts=16;
    oCtx.beginPath();
    for(let i=0;i<=pts;i++){
      const a=(i/pts)*Math.PI*2;
      const noise=el._cloudOffsets[i%el._cloudOffsets.length];
      const rr=lr*(1+noise*warp+Math.sin(a*el._warpFreqA+t)*warp*0.6+Math.cos(a*el._warpFreqB+t*1.3)*warp*0.3);
      const px2=cx+Math.cos(a)*rr,py2=cy+Math.sin(a)*rr;
      i===0?oCtx.moveTo(px2,py2):oCtx.lineTo(px2,py2);
    }
    oCtx.closePath();
    const g=oCtx.createRadialGradient(cx,cy,0,cx,cy,lr);
    addBlobStops(g,renderColor,lA,v.falloff,v.sharpness);
    oCtx.fillStyle=g;
    // iOS Safari doesn't support ctx.filter — use multiple alpha passes instead
    if(li<2){
      oCtx.globalAlpha=0.35;
      oCtx.fill();
      oCtx.globalAlpha=lA;
    }
    oCtx.fill();
    oCtx.globalAlpha=1;
  }

  // ── Core spark ────────────────────────────────────────────────────────────
  const sparkR=2.5+el._pulse*9+el._flashPulse*5;
  const sg=oCtx.createRadialGradient(cx,cy,0,cx,cy,sparkR);
  sg.addColorStop(0,   `rgba(255,255,255,${Math.min(1,0.55+(el._pulse||0)*0.45)})`);
  sg.addColorStop(0.45,hexToRgba(el.color,0.35));
  sg.addColorStop(1,   hexToRgba(el.color,0));
  oCtx.fillStyle=sg;
  oCtx.beginPath(); oCtx.arc(cx,cy,sparkR,0,Math.PI*2); oCtx.fill();
}

function drawNeon(el){
  const ox=el._conductorOffsetX||0, oy=el._conductorOffsetY||0;
  const depthScale = el._depthScale ?? 1.0;
  const ax=el.x1*W+ox,ay=el.y1*H+oy,bx=el.x2*W+ox,by=el.y2*H+oy;
  const v=getVisParams(el);

  // LED strip mode for Arp elements
  if(el.soundType==='Arp'){
    const dx=bx-ax, dy=by-ay;
    const len=Math.sqrt(dx*dx+dy*dy);
    if(len<4) return;

    const ledSpacing=6;
    const numLeds=Math.max(6,Math.round(len/ledSpacing));

    // Beat reactivity values
    const pulse     = el._pulse||0;          // arp note just fired
    const flash     = el._flashPulse||0;     // general flash
    const kick      = beatPulseKick||0;      // kick drum
    const clap      = beatPulseClap||0;      // clap/snare
    const hihat     = beatPulseHihat||0;     // hihat

    // Kick: whole strip surges bright momentarily
    const kickSurge   = kick*0.45;
    // Hihat: dim LEDs shimmer — like electricity crackling through
    const hihatShimmer= hihat*0.18;
    // Clap: active + tail burst white
    const clapBurst   = clap*0.6;

    // Active position — smooth sub-step interpolation
    const step=el._arpStep||0;
    const stepCounter=el._arpStepCounter||0;
    const currentNote=el._arpPattern?.[step%Math.max(1,(el._arpPattern?.length||16))];
    const noteSteps=currentNote?.steps||1;
    const frac=noteSteps>0?Math.min(1,stepCounter/noteSteps):0;
    const activePosFrac=((step+frac)%numLeds);
    const activePos=Math.floor(activePosFrac);

    // Parse color
    let cr=255,cg=255,cb=255;
    const cm=el.color&&el.color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if(cm){cr=parseInt(cm[1],16);cg=parseInt(cm[2],16);cb=parseInt(cm[3],16);}

    const tailLen=4;

    oCtx.save();

    // Track line — brightens on kick
    oCtx.strokeStyle=`rgba(${cr},${cg},${cb},${0.06+kickSurge*0.2})`;
    oCtx.lineWidth=1+kick*1.5;
    oCtx.beginPath();oCtx.moveTo(ax,ay);oCtx.lineTo(bx,by);oCtx.stroke();

    for(let i=0;i<numLeds;i++){
      const t=numLeds>1?i/(numLeds-1):0;
      // Kick pushes LEDs slightly outward from centre — shockwave feel
      const kickOffset=kick*3*Math.sin(t*Math.PI);
      const nx2=-(dy/len), ny2=(dx/len); // perpendicular to strip
      const lx=ax+dx*t + nx2*kickOffset;
      const ly=ay+dy*t + ny2*kickOffset;

      const behind=(activePos-i+numLeds)%numLeds;
      const isActive=i===activePos;
      const ahead=(i-activePos+numLeds)%numLeds;
      const isAhead=ahead===1;
      const isTail=behind>0&&behind<=tailLen;
      const isDim=!isActive&&!isTail&&!isAhead;

      if(isDim){
        // Dim LEDs shimmer with hihat and surge with kick
        const dimBase=0.07+kickSurge*0.35+hihatShimmer*(0.5+Math.random()*0.5);
        oCtx.fillStyle=`rgba(${cr},${cg},${cb},${dimBase})`;
        oCtx.beginPath();oCtx.arc(lx,ly,1.8+kick*0.8,0,Math.PI*2);oCtx.fill();
        continue;
      }

      const tailBrights=[0, 0.60, 0.38, 0.20, 0.10];
      const aheadBright=0.18;
      // Active LED: pulse from arp note + clap burst + kick surge
      const activeBright=0.88+pulse*0.12+clapBurst+kickSurge*0.4;
      const brightness=isActive
        ? Math.min(1,activeBright)
        : isAhead ? aheadBright+kickSurge*0.2
        : Math.min(1,(tailBrights[behind]||0)+kickSurge*0.25+clapBurst*0.5);

      // LED size — active grows on note fire, kick, and clap
      const r=isActive
        ? 3.5+pulse*2.0+kick*2.5+clap*1.8
        : isTail?(2.0-behind*0.25+kick*0.8):1.6+kick*0.5;

      // Bloom — larger on beat hits
      const bloomMult=isActive?(2.2+kick*0.8+clap*0.6):1.8+kick*0.4;
      const bloomR=r*bloomMult;
      const grad=oCtx.createRadialGradient(lx,ly,r*0.2,lx,ly,bloomR);
      grad.addColorStop(0,`rgba(${cr},${cg},${cb},${brightness*0.55})`);
      grad.addColorStop(1,`rgba(${cr},${cg},${cb},0)`);
      oCtx.fillStyle=grad;
      oCtx.beginPath();oCtx.arc(lx,ly,bloomR,0,Math.PI*2);oCtx.fill();

      // Hard LED dot
      oCtx.fillStyle=`rgba(${cr},${cg},${cb},${brightness})`;
      oCtx.beginPath();oCtx.arc(lx,ly,r,0,Math.PI*2);oCtx.fill();

      // Specular pinprick — white on active, yellow-white on clap burst
      if(isActive){
        const specAlpha=Math.min(1,0.88+pulse*0.12+clapBurst*0.8);
        const specR=clapBurst>0.3?Math.round(255):255;
        const specG=clapBurst>0.3?Math.round(255-clapBurst*40):255;
        oCtx.fillStyle=`rgba(${specR},${specG},255,${specAlpha})`;
        oCtx.beginPath();oCtx.arc(lx-r*0.25,ly-r*0.25,r*0.30+clap*0.8,0,Math.PI*2);oCtx.fill();
      }
    }
    oCtx.restore();
    return;
  }

  // Classic neon — layered strokes with endpoint radial bleeds.
  const glow=(4+v.glowMult*16+el._pulse*12)*depthScale*(1+(el._hoverAmt||0)*0.5);
  const brightness=v.opacity*(1+(el._hoverAmt||0)*0.4), thickness=(1+v.volPct*4)*depthScale*(1+(el._hoverAmt||0)*0.3), flicker=1+el._flashPulse*0.6+v.hihatFlicker*2;
  const dx=bx-ax, dy=by-ay, len=Math.sqrt(dx*dx+dy*dy);
  if(len<2){ oCtx.restore(); return; }

  oCtx.save();
  oCtx.globalCompositeOperation='screen';
  oCtx.lineCap='round'; // round cap — but glow strokes extend past endpoints

  // Glow passes: extend each pass slightly beyond endpoints so glow bleeds naturally
  const ux=dx/len, uy=dy/len;
  const passes=[
    {w:Math.min(glow*2.0,180), ext:glow*2.0, a:brightness*0.028*flicker},
    {w:Math.min(glow*1.4,120), ext:glow*1.4, a:brightness*0.060*flicker},
    {w:Math.min(glow*0.9, 80), ext:glow*0.9, a:brightness*0.12*flicker},
    {w:Math.min(glow*0.5, 40), ext:glow*0.5, a:brightness*0.21*flicker},
    {w:Math.min(glow*0.2, 16), ext:glow*0.2, a:brightness*0.34*flicker},
  ];
  passes.forEach(({w,ext,a})=>{
    // Start and end slightly outside the element endpoints
    const sx2=ax-ux*ext*0.5, sy2=ay-uy*ext*0.5;
    const ex2=bx+ux*ext*0.5, ey2=by+uy*ext*0.5;
    oCtx.strokeStyle=hexToRgba(el.color, Math.min(1,a));
    oCtx.lineWidth=w;
    oCtx.beginPath(); oCtx.moveTo(sx2,sy2); oCtx.lineTo(ex2,ey2); oCtx.stroke();
  });

  // Core tube line
  oCtx.globalCompositeOperation='source-over';
  oCtx.lineCap='round';
  oCtx.strokeStyle=hexToRgba(el.color, Math.min(1,brightness*flicker));
  oCtx.lineWidth=thickness;
  oCtx.beginPath(); oCtx.moveTo(ax,ay); oCtx.lineTo(bx,by); oCtx.stroke();

  // Hot white filament
  const coreW=Math.min(1,v.resoPct/100)*0.6;
  if(coreW>0.05){
    oCtx.strokeStyle=`rgba(255,255,255,${Math.min(1,coreW*flicker)})`;
    oCtx.lineWidth=Math.max(0.5,thickness*0.35);
    oCtx.beginPath(); oCtx.moveTo(ax,ay); oCtx.lineTo(bx,by); oCtx.stroke();
  }

  oCtx.restore();
}

function drawFold(el){
  const ox=el._conductorOffsetX||0, oy=el._conductorOffsetY||0;
  const x1=el.x1*W+ox,y1=el.y1*H+oy,x2=el.x2*W+ox,y2=el.y2*H+oy;
  const dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy);if(len<2)return;
  const ux=dx/len,uy=dy/len;
  const v=getVisParams(el);
  const nx=uy,ny=-ux;
  const strength=Math.max(0.2,Math.min(1,v.revPct/100+0.3));
  const spread=len*0.2+len*1.0*strength;
  const color=el.color||'#ffffff';
  const cr=parseInt(color.slice(1,3),16)||255;
  const cg=parseInt(color.slice(3,5),16)||255;
  const cb=parseInt(color.slice(5,7),16)||255;
  const alpha=(0.15+strength*0.55)*Math.min(1,v.opacity*1.5+el._flashPulse*0.2);
  const cacheKey=`${Math.round(x1)},${Math.round(y1)},${Math.round(x2)},${Math.round(y2)},${color},${Math.round(strength*100)},${W},${H}`;
  if(el._foldCacheKey!==cacheKey){
    if(!el._foldCanvas) el._foldCanvas=document.createElement('canvas');
    const fc=el._foldCanvas; fc.width=W; fc.height=H;
    const fx=fc.getContext('2d'); fx.clearRect(0,0,W,H);
    fx.globalCompositeOperation='screen';
    const clipFar=Math.max(W,H)*3;
    fx.beginPath();
    fx.moveTo(x1-ux*clipFar,y1-uy*clipFar);
    fx.lineTo(x2+ux*clipFar,y2+uy*clipFar);
    fx.lineTo(x2+ux*clipFar+nx*clipFar,y2+uy*clipFar+ny*clipFar);
    fx.lineTo(x1-ux*clipFar+nx*clipFar,y1-uy*clipFar+ny*clipFar);
    fx.closePath(); fx.clip();
    const stamps=Math.max(10,Math.ceil(len/6));
    for(let s=0;s<=stamps;s++){
      const frac=s/stamps;
      const lx=x1+(x2-x1)*frac, ly=y1+(y2-y1)*frac;
      const r=spread*0.85;
      const rg=fx.createRadialGradient(lx,ly,0,lx,ly,r);
      rg.addColorStop(0,  `rgba(${cr},${cg},${cb},${alpha*0.45})`);
      rg.addColorStop(0.2,`rgba(${cr},${cg},${cb},${alpha*0.25})`);
      rg.addColorStop(0.5,`rgba(${cr},${cg},${cb},${alpha*0.08})`);
      rg.addColorStop(1,  `rgba(${cr},${cg},${cb},0)`);
      fx.fillStyle=rg; fx.fillRect(lx-r,ly-r,r*2,r*2);
    }
    fx.beginPath(); fx.moveTo(x1,y1); fx.lineTo(x2,y2);
    fx.strokeStyle=`rgba(${cr},${cg},${cb},${Math.min(1,alpha*1.2)})`;
    fx.lineWidth=1+strength*1.5; fx.stroke();
    el._foldCacheKey=cacheKey;
  }
  const kickSpread = 1 + beatPulseKick * 0.18;
  const clapAlpha  = 1 + beatPulseClap * 0.5;
  const hihatFlick = 1 + beatPulseHihat * 0.08;
  const midX=(x1+x2)/2, midY=(y1+y2)/2;
  oCtx.save();
  oCtx.globalCompositeOperation='screen';
  oCtx.globalAlpha=Math.min(1, clapAlpha * hihatFlick);
  oCtx.translate(midX, midY);
  oCtx.scale(1 + (kickSpread-1)*Math.abs(nx), 1 + (kickSpread-1)*Math.abs(ny));
  oCtx.translate(-midX, -midY);
  oCtx.drawImage(el._foldCanvas,0,0);
  oCtx.restore();
}

function drawSpot(el){
  // Throttle: spot creates 3-4 radial gradients per frame — skip every other frame
  if(!el._spotFrameTick) el._spotFrameTick=0;
  el._spotFrameTick++;
  if(el._spotFrameTick%2!==0 && !el._pulse && !el._flashPulse) return; // skip if no pulse
  const sx=el.x*W, sy=el.y*H;
  const color=el.color||'#ffffff';
  const cr=parseInt(color.slice(1,3),16)||200;
  const cg=parseInt(color.slice(3,5),16)||200;
  const cb=parseInt(color.slice(5,7),16)||255;
  const beamLen=Math.max(W,H)*1.5;
  const pulse = el._pulse||0;
  const flash = el._flashPulse||0;
  const vol   = el.volume??0.75;
  const snd   = el.soundType||'Drone';

  // ── Instrument-specific behaviour ────────────────────────────────────────
  // Each sound type drives the spot differently based on how it plays musically.

  let intensity   = vol*0.60;     // base brightness
  // Hover proximity boost — cursor near spot = brighter (studio mode)
  if(!_liveMode && mousePx){
    const mdx = mousePx.x - sx, mdy = mousePx.y - sy;
    const mdist = Math.sqrt(mdx*mdx + mdy*mdy);
    const hoverZone = (el.reachPx ?? Math.min(W,H)*0.45) * 0.5;
    const hoverBoost = Math.max(0, 1 - mdist/hoverZone) * 0.35;
    intensity += hoverBoost;
  }
  let coneScale   = 1.0;          // cone width multiplier
  let sweepAmt    = 0.0;          // angle sweep range (radians)
  let sweepSpeed  = 0.008;        // sweep frequency
  let doFlutter   = false;        // hihat-style on/off blink
  let whiteFlash  = 0;            // extra white burst (0–1)
  let angleJolt   = 0;            // random angle snap

  switch(snd){
    case 'Pulse':
    case 'FMStab':
      // Chord stab: sharp bright flash on each hit, no sweep, stays tight
      intensity  = vol*0.55 + flash*0.45 + pulse*0.35;
      coneScale  = 1.0 + pulse*0.25 + flash*0.15;
      whiteFlash = flash*0.5;
      sweepAmt   = 0; // stationary — it marks where the chord hits
      break;

    case 'EP':
    case 'Pluck':
      // Melodic hit: medium flash on note, slight cone expansion, gentle sway
      intensity  = vol*0.55 + pulse*0.40 + flash*0.20;
      coneScale  = 1.0 + pulse*0.20;
      sweepAmt   = 0.12;
      sweepSpeed = 0.006;
      break;

    case 'Drone':
    case 'Pad':
      // Sustained: breathes slowly with tone, very gentle sweep
      intensity  = vol*0.50 + Math.sin(elapsed*0.8+el.id)*0.08;
      coneScale  = 1.0 + Math.sin(elapsed*0.5+el.id*0.7)*0.12;
      sweepAmt   = 0.20;
      sweepSpeed = 0.004;
      break;

    case 'Vocal':
      // Vocal: breathes with volume, slow wide sweep like a follow-spot
      intensity  = vol*0.55 + pulse*0.25 + Math.sin(elapsed*0.6+el.id)*0.10;
      coneScale  = 1.0 + Math.sin(elapsed*0.4+el.id)*0.15;
      sweepAmt   = 0.30;
      sweepSpeed = 0.005;
      break;

    case 'Ring':
      // Bell/metallic: sharp flash on hit, flickers between hits
      intensity  = vol*0.45 + pulse*0.50 + flash*0.20;
      coneScale  = 1.0 + pulse*0.30;
      whiteFlash = pulse*0.4;
      sweepAmt   = 0.08;
      sweepSpeed = 0.010;
      break;

    default:
      intensity  = vol*0.50 + pulse*0.20;
      sweepAmt   = 0.15;
      break;
  }

  intensity = Math.min(1, intensity);

  // Flutter gate: only for instruments that don't sustain (stabs/hits)
  // Flutter at pulse rate — blinks off briefly just after a hit decays
  if(doFlutter && Math.random() < 0.4) return;

  // Angle: base + optional slow sweep
  const baseAngle = el.angle ?? -Math.PI/2;
  const angle = baseAngle
    + Math.sin(elapsed*sweepSpeed + el.id*1.3) * sweepAmt
    + angleJolt;

  const halfCone = (el.coneWidth??0.3)*Math.PI*0.5 * coneScale;

  oCtx.save();
  oCtx.globalCompositeOperation='screen';

  // Main cone
  const rg=oCtx.createRadialGradient(sx,sy,0, sx,sy,beamLen);
  rg.addColorStop(0,    `rgba(${cr},${cg},${cb},${Math.min(1,intensity*0.58)})`);
  rg.addColorStop(0.08, `rgba(${cr},${cg},${cb},${Math.min(1,intensity*0.40)})`);
  rg.addColorStop(0.25, `rgba(${cr},${cg},${cb},${Math.min(1,intensity*0.22)})`);
  rg.addColorStop(0.55, `rgba(${cr},${cg},${cb},${Math.min(1,intensity*0.08)})`);
  rg.addColorStop(1,    `rgba(${cr},${cg},${cb},0)`);
  oCtx.beginPath();
  oCtx.moveTo(sx,sy);
  oCtx.arc(sx,sy,beamLen, angle-halfCone, angle+halfCone);
  oCtx.closePath();
  oCtx.fillStyle=rg;
  oCtx.fill();

  // Penumbra
  const penumbra=oCtx.createRadialGradient(sx,sy,0, sx,sy,beamLen*0.7);
  penumbra.addColorStop(0,   `rgba(${cr},${cg},${cb},${Math.min(1,intensity*0.14)})`);
  penumbra.addColorStop(0.4, `rgba(${cr},${cg},${cb},${Math.min(1,intensity*0.04)})`);
  penumbra.addColorStop(1,   `rgba(${cr},${cg},${cb},0)`);
  oCtx.beginPath();
  oCtx.moveTo(sx,sy);
  oCtx.arc(sx,sy,beamLen*0.7, angle-halfCone*1.5, angle+halfCone*1.5);
  oCtx.closePath();
  oCtx.fillStyle=penumbra;
  oCtx.fill();

  // White burst overlay (Pulse/Ring/FMStab on hit)
  if(whiteFlash>0.05){
    const wb=oCtx.createRadialGradient(sx,sy,0, sx,sy,beamLen*0.45);
    wb.addColorStop(0,  `rgba(255,255,255,${whiteFlash*0.55})`);
    wb.addColorStop(0.4,`rgba(${cr},${cg},${cb},${whiteFlash*0.20})`);
    wb.addColorStop(1,  `rgba(${cr},${cg},${cb},0)`);
    oCtx.beginPath();
    oCtx.moveTo(sx,sy);
    oCtx.arc(sx,sy,beamLen*0.45, angle-halfCone*1.1, angle+halfCone*1.1);
    oCtx.closePath();
    oCtx.fillStyle=wb;
    oCtx.fill();
  }

  // Source flare
  const flareR=7+intensity*12+pulse*10;
  const fg=oCtx.createRadialGradient(sx,sy,0,sx,sy,flareR);
  fg.addColorStop(0,   `rgba(255,255,255,${Math.min(1,intensity*0.90+whiteFlash*0.5)})`);
  fg.addColorStop(0.35,`rgba(${cr},${cg},${cb},${intensity*0.45})`);
  fg.addColorStop(1,   `rgba(${cr},${cg},${cb},0)`);
  oCtx.fillStyle=fg;
  oCtx.beginPath(); oCtx.arc(sx,sy,flareR,0,Math.PI*2); oCtx.fill();

  oCtx.restore();
  el._spotCacheKey=null;
}

function drawBeam(el){
  const bx=el.pos*W;const v=getVisParams(el);
  const bw=el.width*W*(0.3+v.revPct/100)*v.volPct*(1+beatPulseKick*0.15);
  const softness=Math.max(0.15,1-v.cutHz/10000);
  const oAlpha=Math.min(1,v.opacity+el._flashPulse*0.3+beatPulseClap*0.15);
  const strobeFlicker=beatPulseHihat>0.3?(Math.random()>0.5?1.3:0.7):1;
  oCtx.save();
  if(el.beamAngle){oCtx.translate(W/2,H/2);oCtx.rotate(el.beamAngle*Math.PI/180);oCtx.translate(-W/2,-H/2);}
  const g=oCtx.createLinearGradient(bx-bw,0,bx+bw,0);
  g.addColorStop(0,hexToRgba(el.color,0));g.addColorStop(softness*0.3,hexToRgba(el.color,oAlpha*0.3*strobeFlicker));
  g.addColorStop(0.5,hexToRgba(el.color,oAlpha*strobeFlicker));g.addColorStop(1-softness*0.3,hexToRgba(el.color,oAlpha*0.3*strobeFlicker));
  g.addColorStop(1,hexToRgba(el.color,0));oCtx.fillStyle=g;oCtx.fillRect(bx-bw*2,0,bw*4,H);oCtx.restore();
}

function drawMarker(el){
  // In Live Mode: skip Studio markers — live touch labels handle display
  if(_liveMode) return;
  const hp=elHandlePos(el);
  const px=hp.x,py=hp.y;
  const isActive=el.id===activeId;
  const st=SOUND_TYPES[el.soundType]||SOUND_TYPES.Drone;
  const c=st.color;
  const vt=VIS_TYPES[el.visualType]||VIS_TYPES.blob;
  const label=vt.label+' '+el.id+' · '+el.soundType;
  ctx.save();
  if(isActive && (el.visualType==='fold'||el.visualType==='neon')){
    const ax=el.x1*W,ay=el.y1*H,bx2=el.x2*W,by2=el.y2*H;
    ctx.strokeStyle=c+',0.25)';ctx.lineWidth=1;ctx.setLineDash([4,4]);
    ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx2,by2);ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();ctx.arc(ax,ay,7,0,Math.PI*2);
    ctx.fillStyle=c+',0.15)';ctx.fill();
    ctx.strokeStyle=c+',0.7)';ctx.lineWidth=1.5;ctx.stroke();
    ctx.beginPath();ctx.arc(bx2,by2,7,0,Math.PI*2);
    ctx.fillStyle=c+',0.15)';ctx.fill();
    ctx.strokeStyle=c+',0.7)';ctx.lineWidth=1.5;ctx.stroke();
  }
  if(isActive && el.visualType==='spot'){
    const sx=el.x*W,sy=el.y*H;
    const v=getVisParams(el);
    const baseReach=(100+v.revPct*2.5)*v.volPct;
    const reach=el.reachPx??baseReach;
    const a=el.angle??-Math.PI/2;
    const cw=el.coneWidth||0.3;
    const rhx=sx+Math.cos(a)*reach,rhy=sy+Math.sin(a)*reach;
    ctx.strokeStyle=c+',0.3)';ctx.lineWidth=1;ctx.setLineDash([3,4]);
    ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(rhx,rhy);ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();ctx.arc(rhx,rhy,6,0,Math.PI*2);
    ctx.fillStyle=c+',0.2)';ctx.fill();
    ctx.strokeStyle=c+',0.8)';ctx.lineWidth=1.5;ctx.stroke();
    const wh1x=sx+Math.cos(a-cw)*reach*0.7,wh1y=sy+Math.sin(a-cw)*reach*0.7;
    const wh2x=sx+Math.cos(a+cw)*reach*0.7,wh2y=sy+Math.sin(a+cw)*reach*0.7;
    [wh1x,wh2x].forEach((wx,i)=>{
      const wy=[wh1y,wh2y][i];
      ctx.beginPath();ctx.arc(wx,wy,5,0,Math.PI*2);
      ctx.fillStyle=c+',0.15)';ctx.fill();
      ctx.strokeStyle=c+',0.55)';ctx.lineWidth=1.2;ctx.stroke();
    });
  }
  const numR=isActive?11:9;
  if(showMarkers){
  ctx.beginPath();ctx.arc(px,py,numR,0,Math.PI*2);
  ctx.fillStyle=c+','+(isActive?0.35:0.2)+')';ctx.fill();
  ctx.strokeStyle=c+','+(isActive?0.6:0.35)+')';ctx.lineWidth=1.5;ctx.stroke();
  ctx.font='600 '+(isActive?10:8)+'px "DM Mono",monospace';
  ctx.fillStyle='rgba(255,255,255,'+(isActive?0.95:0.75)+')';
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(el.id,px,py+0.5);
  if(el._droneNode&&!el.muted){
    ctx.beginPath();ctx.arc(px,py,numR+4+Math.sin(elapsed*3+el._animPhase)*1.5,0,Math.PI*2);
    ctx.strokeStyle=c+',0.35)';ctx.lineWidth=1;ctx.stroke();
  }
  }
  ctx.font='500 8px "DM Mono",monospace';
  // Labels now rendered as DOM elements by updateLiveTouchLabels() — no canvas drawing needed
  if(el.muted){
    ctx.strokeStyle='rgba(255,80,80,0.5)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(px-numR,py-numR);ctx.lineTo(px+numR,py+numR);ctx.stroke();
    ctx.beginPath();ctx.moveTo(px+numR,py-numR);ctx.lineTo(px-numR,py+numR);ctx.stroke();
  }
  if(el.soloed){
    ctx.beginPath();ctx.arc(px,py,numR+4,0,Math.PI*2);
    ctx.strokeStyle='rgba(251,191,36,0.6)';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.stroke();ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawShapePadSvg(svgEl,xv,yv){
  const W=200,H=130;
  const atkX=xv*0.3+0.05,susY=(1-yv)*0.7+0.1;
  const pts=[];
  pts.push([0,H*0.85]);
  pts.push([W*atkX,H*0.2]);
  const decEnd=W*(atkX+0.1);
  pts.push([decEnd,H*(0.2+susY*0.45)]);
  pts.push([W*0.75,H*(0.2+susY*0.45)]);
  pts.push([W*(0.75+(1-xv)*0.22),H*0.85]);
  const path=pts.map((p,i)=>i===0?`M${p[0].toFixed(1)},${p[1].toFixed(1)}`:`L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  svgEl.innerHTML=`
    <path d="${path}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" stroke-linejoin="round"/>
    <line x1="0" y1="100" x2="${W}" y2="100" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/>
  `;
}

function drawTonePadSvg(svgEl,xv,yv){
  const W=200,H=130;
  const cutoffX=10+xv*(W-20);
  const resonancePeak=yv*40;
  const pts=[];
  for(let i=0;i<=50;i++){
    const ix=(i/50)*W;
    let iy;
    if(ix<cutoffX-30){iy=H*0.35+H*0.1*(1-xv);}
    else if(ix<cutoffX){
      const t=(ix-(cutoffX-30))/30;
      iy=H*0.35-resonancePeak*Math.sin(t*Math.PI)+H*0.1*(1-xv);}
    else{iy=H*0.35+H*0.45*(ix-cutoffX)/(W-cutoffX);}
    pts.push([ix,Math.max(5,Math.min(H-5,iy))]);
  }
  const path=pts.map((p,i)=>i===0?`M${p[0].toFixed(1)},${p[1].toFixed(1)}`:`L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  svgEl.innerHTML=`<path d="${path}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>`;
}

function drawSpacePadSvg(svgEl,xv,yv){
  const cx=100,cy=65;
  const maxR=50+xv*40;
  const numRings=Math.max(1,Math.round(3+yv*3));
  let circles='';
  for(let i=0;i<numRings;i++){
    const r=maxR*((i+1)/numRings);
    const alpha=0.04+((numRings-i)/numRings)*0.12*xv;
    circles+=`<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r*(0.35+yv*0.45)}" fill="none" stroke="rgba(255,255,255,${alpha.toFixed(3)})" stroke-width="1"/>`;
  }
  svgEl.innerHTML=circles;
}

function drawSoundLibBlob(canvas,colorStr,key,active,t){
  const size=canvas.width,cx=size/2,cy=size/2;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,size,size);
  const m=colorStr.match(/(\d+),\s*(\d+),\s*(\d+)/);
  if(!m)return;
  const rgb=[+m[1],+m[2],+m[3]];

  // Each blob gets stable random personality assigned once
  if(!_blobParams.has(canvas)){
    _blobParams.set(canvas,{
      warpFreqA: 2+Math.floor(Math.random()*3),   // 2,3,4
      warpFreqB: 3+Math.floor(Math.random()*3),   // 3,4,5 — was up to 7, caused artifacts
      warpAmt:   0.08+Math.random()*0.13,          // 0.08–0.21 — tighter, no jagged edges
      animSpeed: 0.4+Math.random()*1.0,
      baseScale: 0.18+Math.random()*0.08,  // 280px canvas: baseR = 280*(0.18-0.26) = 50-73px, outer glow 80-117px — fades well before 140px edge
      sharpness: 0.3+Math.random()*0.5,
      offsets:   Array.from({length:20},()=>(Math.random()-0.5)*0.30),
    });
  }
  const bp=_blobParams.get(canvas);

  const growScale=active?1.35:1.0;
  const warpMult=active?2.2:1.0;
  const tt=t*bp.animSpeed;
  const baseR=size*bp.baseScale*growScale;
  const warp=bp.warpAmt*warpMult;

  // 3 layers — outer glow wide, mid body, inner core
  const layers=[
    {scale:1.6, alphaA:0.20, alphaI:0.07},  // outer glow — wide, fades to nothing
    {scale:1.0, alphaA:0.52, alphaI:0.19},  // mid body
    {scale:0.50,alphaA:0.88, alphaI:0.38},  // inner core — bright
  ];

  // Pure circles with radial gradients — no polygon, no angles, no artifacts
  layers.forEach(({scale,alphaA,alphaI})=>{
    const lr=baseR*scale;
    const alpha=active?alphaA:alphaI;
    // Slight organic size wobble using time — stays circular, just breathes
    const breathe=1+Math.sin(tt*bp.animSpeed*0.3)*0.04;
    const r2=lr*breathe;
    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r2);
    g.addColorStop(0,           `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`);
    g.addColorStop(bp.sharpness,`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha*0.55})`);
    g.addColorStop(1,           `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    ctx.fillStyle=g;
    ctx.globalAlpha=0.35;ctx.beginPath();ctx.arc(cx,cy,r2,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1.0;ctx.beginPath();ctx.arc(cx,cy,r2,0,Math.PI*2);ctx.fill();
  });

  // Centre spark
  const sk=active?6:2.5;
  const sg=ctx.createRadialGradient(cx,cy,0,cx,cy,sk);
  sg.addColorStop(0,  `rgba(255,255,255,${active?0.9:0.5})`);
  sg.addColorStop(0.5,`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${active?0.6:0.25})`);
  sg.addColorStop(1,  `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
  ctx.fillStyle=sg;ctx.beginPath();ctx.arc(cx,cy,sk,0,Math.PI*2);ctx.fill();
}

function pickVisualType(soundType, xPos, yPos){
  const r=Math.random();
  if(soundType==='Sub')    return 'blob'; // sub is always blob — it's a bass element
  if(soundType==='Noise')  return r<0.5?'beam':'fold';
  if(soundType==='Acid')  return r<0.50?'neon':r<0.75?'blob':'fold';
  if(soundType==='Pulse')  return r<0.45?'spot':r<0.72?'blob':'neon';  // chord stabs suit spotlight
  if(soundType==='Drone')  return r<0.40?'spot':r<0.68?'blob':'fold';   // ambient cone
  if(soundType==='Vocal')  return r<0.55?'spot':r<0.80?'blob':'neon';   // voice = spotlight
  if(soundType==='Arp')    return r<0.60?'neon':r<0.85?'blob':'spot';   // LED strip is identity
  if(soundType==='Pluck')  return r<0.40?'neon':r<0.68?'blob':'spot';
  if(soundType==='EP')     return r<0.45?'spot':r<0.72?'blob':'neon';
  if(soundType==='FMStab') return r<0.40?'spot':r<0.68?'blob':'neon';
  if(soundType==='Ring')   return r<0.45?'spot':r<0.72?'blob':'fold';
  if(soundType==='Pad')    return r<0.45?'spot':r<0.72?'blob':'fold';
  if(soundType==='SFX')   return r<0.55?'spot':r<0.80?'blob':'neon';
  return r<0.35?'spot':r<0.70?'blob':'fold'; // default has spot chance too
}

