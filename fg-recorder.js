// fg-recorder.js — Video + Audio recording.
// Captures canvas visuals + master audio output together as a .webm video.
// Free: 30 second limit. Pro: unlimited.
// Depends on: fg-audio.js, fg-entitlements.js

const Recorder = {
  _mediaRecorder:  null,
  _chunks:         [],
  _startTime:      null,
  _timerInterval:  null,
  _streamDest:     null,  // MediaStreamAudioDestinationNode
  _offscreen:      null,  // OffscreenCanvas for resizing
  _offCtx:         null,
  _rafId:          null,  // rAF loop for drawing scaled frames
  _isRecording:    false,
  _size:           null,  // chosen size: {w, h, label}
  FREE_LIMIT_SECS: 30,

  // ── Preset sizes ──────────────────────────────────────────────────────────
  SIZES: [
    { id: 'square',  label: 'Square',   w: 1080, h: 1080, icon: '⬛' },
    { id: 'portrait',label: 'Portrait', w: 1080, h: 1920, icon: '📱' },
    { id: 'landscape',label:'Landscape',w: 1920, h: 1080, icon: '🖥' },
    { id: 'story',   label: 'Story',    w:  720, h: 1280, icon: '📲' },
  ],

  // ── Setup audio tap ───────────────────────────────────────────────────────
  init() {
    if (this._streamDest || !audioCtx) return;
    try {
      this._streamDest = audioCtx.createMediaStreamDestination();
      if (masterLimiter) masterLimiter.connect(this._streamDest);
    } catch(e) { console.error('[Recorder] init failed:', e); }
  },

  // ── Show size picker before starting ─────────────────────────────────────
  showPicker() {
    if (this._isRecording) { this.stop(); return; }
    if (!audioCtx || !soundEnabled) {
      showToast('Tap canvas to start audio first');
      return;
    }
    if (window.location.protocol === 'file:') {
      showToast('⚠️ Saving needs a server — use npx serve .');
    }

    const existing = document.getElementById('_fgRecPicker');
    if (existing) { existing.remove(); return; }

    const picker = document.createElement('div');
    picker.id = '_fgRecPicker';
    picker.style.cssText = [
      'position:fixed;bottom:90px;left:50%;transform:translateX(-50%)',
      'background:rgba(8,8,14,0.96);border:1px solid rgba(255,255,255,0.1)',
      'border-radius:14px;padding:14px 16px;z-index:9999',
      'font-family:monospace;min-width:260px',
      'box-shadow:0 4px 28px rgba(0,0,0,0.7)',
    ].join(';');

    picker.innerHTML = `
      <div style="font-size:9px;letter-spacing:.14em;color:rgba(255,255,255,0.35);
                  text-transform:uppercase;margin-bottom:10px">
        Record Format
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px">
        ${this.SIZES.map(s => `
          <button data-size="${s.id}" style="
            background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);
            border-radius:8px;padding:10px 8px;cursor:pointer;font-family:monospace;
            color:rgba(255,255,255,0.7);font-size:11px;
            display:flex;flex-direction:column;align-items:center;gap:4px;
            transition:all .12s;
          ">
            <span style="font-size:18px">${s.icon}</span>
            <span style="font-weight:600">${s.label}</span>
            <span style="font-size:9px;color:rgba(255,255,255,0.3)">${s.w}×${s.h}</span>
          </button>
        `).join('')}
      </div>
      <button onclick="document.getElementById('_fgRecPicker').remove()" style="
        width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
        border-radius:8px;padding:8px;cursor:pointer;font-family:monospace;
        color:rgba(255,255,255,0.35);font-size:10px;letter-spacing:.06em;
      ">Cancel</button>
    `;

    // Wire size buttons
    picker.querySelectorAll('[data-size]').forEach(btn => {
      btn.addEventListener('click', () => {
        const size = this.SIZES.find(s => s.id === btn.dataset.size);
        picker.remove();
        this.start(size);
      });
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(255,255,255,0.08)';
        btn.style.borderColor = 'rgba(255,255,255,0.2)';
        btn.style.color = 'rgba(255,255,255,0.95)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(255,255,255,0.04)';
        btn.style.borderColor = 'rgba(255,255,255,0.1)';
        btn.style.color = 'rgba(255,255,255,0.7)';
      });
    });

    document.body.appendChild(picker);
    // Click outside to dismiss
    setTimeout(() => {
      document.addEventListener('click', function _close(e) {
        if (!picker.contains(e.target)) {
          picker.remove();
          document.removeEventListener('click', _close);
        }
      });
    }, 50);
  },

  // ── Start recording with chosen size ─────────────────────────────────────
  start(size) {
    if (this._isRecording) return;
    this._size = size || this.SIZES[0];
    this.init();
    if (!this._streamDest) { showToast('Recording not supported'); return; }

    const canvas = document.getElementById('canvas');
    if (!canvas) { showToast('Canvas not found'); return; }

    const { w, h } = this._size;

    // Create offscreen canvas at target size
    this._offscreen = document.createElement('canvas');
    this._offscreen.width  = w;
    this._offscreen.height = h;
    this._offCtx = this._offscreen.getContext('2d');

    // Combine canvas video stream + audio stream
    const fps = 30;
    const videoStream = this._offscreen.captureStream(fps);
    const audioTracks = this._streamDest.stream.getAudioTracks();
    audioTracks.forEach(t => videoStream.addTrack(t));

    // Pick best video+audio format
    const mimeType = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ].find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';

    try {
      this._chunks = [];
      this._mediaRecorder = new MediaRecorder(videoStream, { mimeType, videoBitsPerSecond: 4000000 });
      this._mediaRecorder.ondataavailable = (e) => {
        if (e.data?.size > 0) this._chunks.push(e.data);
      };
      this._mediaRecorder.onstop = () => this._onStop();

      // rAF loop: copy canvas → offscreen at target size, letterboxed
      const drawFrame = () => {
        if (!this._isRecording) return;
        const ctx = this._offCtx;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        // Letterbox / fit the canvas into target size
        const srcW = canvas.width, srcH = canvas.height;
        const scale = Math.min(w / srcW, h / srcH);
        const dw = srcW * scale, dh = srcH * scale;
        const dx = (w - dw) / 2, dy = (h - dh) / 2;
        ctx.drawImage(canvas, dx, dy, dw, dh);
        this._rafId = requestAnimationFrame(drawFrame);
      };
      this._rafId = requestAnimationFrame(drawFrame);

      this._mediaRecorder.start(100);
      this._isRecording = true;
      this._startTime   = Date.now();
      this._updateBtn(true);

      const limit = (typeof FG !== 'undefined' && FG.can('longRecording')) ? null : this.FREE_LIMIT_SECS;
      this._timerInterval = setInterval(() => {
        const elapsed = (Date.now() - this._startTime) / 1000;
        this._updateTimer(elapsed, limit);
        if (limit && elapsed >= limit) this.stop();
      }, 250);

    } catch(e) {
      console.error('[Recorder] start failed:', e);
      showToast('Recording failed: ' + e.message);
    }
  },

  // ── Stop ─────────────────────────────────────────────────────────────────
  stop() {
    if (!this._isRecording || !this._mediaRecorder) return;
    clearInterval(this._timerInterval);
    cancelAnimationFrame(this._rafId);
    this._isRecording = false;
    this._mediaRecorder.stop();
    this._updateBtn(false);
  },

  toggle() { this._isRecording ? this.stop() : this.showPicker(); },

  // ── Download ─────────────────────────────────────────────────────────────
  _onStop() {
    if (!this._chunks.length) return;
    const secs = Math.round((Date.now() - this._startTime) / 1000);
    const blob  = new Blob(this._chunks, { type: 'video/webm' });
    const label = this._size?.label || 'video';
    const name  = `fieldgradients-${label.toLowerCase()}-${Date.now()}.webm`;
    this._chunks = [];
    this._updateTimer(0, null);
    this._offscreen = null; this._offCtx = null;

    if (window.location.protocol === 'file:') {
      this._showServerWarning(secs);
      return;
    }
    try {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      showToast(`⬇ Saved ${secs}s · ${label}`);
    } catch(e) {
      showToast('Download failed — try a different browser');
    }
  },

  // ── Server warning (file:// only) ─────────────────────────────────────────
  _showServerWarning(secs) {
    const existing = document.getElementById('_fgRecorderWarning');
    if (existing) existing.remove();
    const box = document.createElement('div');
    box.id = '_fgRecorderWarning';
    box.style.cssText = [
      'position:fixed;bottom:90px;left:50%;transform:translateX(-50%)',
      'background:rgba(10,10,20,0.97);border:1px solid rgba(255,100,100,0.4)',
      'border-radius:10px;padding:16px 20px;z-index:9999;max-width:320px',
      'font-family:monospace;font-size:11px;color:rgba(255,255,255,0.85)',
      'text-align:center;line-height:1.6;box-shadow:0 4px 24px rgba(0,0,0,0.7)',
    ].join(';');
    box.innerHTML = `
      <div style="font-size:22px;margin-bottom:8px">🎬</div>
      <div style="color:rgba(255,180,180,0.9);font-weight:600;margin-bottom:6px">
        ${secs}s recorded — needs a server to save
      </div>
      <div style="color:rgba(255,255,255,0.45);font-size:10px;margin-bottom:12px">
        Browsers block file downloads from file://<br>
        Run a local server to save your video
      </div>
      <div style="background:rgba(255,255,255,0.06);border-radius:5px;padding:8px 12px;
                  font-size:10px;color:rgba(126,232,162,0.9);margin-bottom:12px">
        npx serve . → http://localhost:3000
      </div>
      <button onclick="this.parentNode.remove()" style="
        background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);
        color:rgba(255,255,255,0.6);padding:6px 20px;border-radius:5px;
        cursor:pointer;font-family:inherit;font-size:10px">Got it</button>
    `;
    document.body.appendChild(box);
    setTimeout(() => { if (box.parentNode) box.remove(); }, 12000);
  },

  // ── HUD ──────────────────────────────────────────────────────────────────
  _updateBtn(recording) {
    const btn = document.getElementById('liveBtnRecord');
    if (!btn) return;
    if (recording) {
      btn.style.background  = 'rgba(255,40,40,0.35)';
      btn.style.borderColor = 'rgba(255,60,60,0.9)';
      btn.style.color       = '#ff4040';
      btn.title             = 'Stop recording';
      this._showHUD();
    } else {
      btn.style.background  = 'rgba(255,80,80,0.08)';
      btn.style.borderColor = 'rgba(255,80,80,0.3)';
      btn.style.color       = 'rgba(255,100,100,0.85)';
      btn.textContent       = '⏺';
      btn.title             = 'Record';
      this._hideHUD();
    }
  },

  _updateTimer(elapsed, limit) {
    if (elapsed === 0 && limit === null) return;
    const e = Math.floor(elapsed);
    const hudTime  = document.getElementById('_fgRecHudTime');
    const hudBar   = document.getElementById('_fgRecHudBar');
    const hudLabel = document.getElementById('_fgRecHudLabel');
    if (hudTime) {
      hudTime.textContent = `${Math.floor(e/60)}:${String(e%60).padStart(2,'0')}`;
    }
    if (limit && hudBar) {
      const pct = Math.min(100, (elapsed / limit) * 100);
      const r   = Math.ceil(limit - elapsed);
      hudBar.style.width      = pct + '%';
      hudBar.style.background = r <= 5 ? 'rgba(255,40,40,0.9)' : 'rgba(255,100,100,0.7)';
      if (hudLabel) hudLabel.textContent = r <= 5 ? `stopping in ${r}s` : `${Math.round(pct)}% · ${r}s left`;
    } else if (hudLabel) {
      hudLabel.textContent = 'recording…';
    }
  },

  _showHUD() {
    const existing = document.getElementById('_fgRecHUD');
    if (existing) existing.remove();
    const isPro  = typeof FG !== 'undefined' && FG.can('longRecording');
    const limit  = isPro ? null : this.FREE_LIMIT_SECS;
    const sLabel = this._size ? `${this._size.icon} ${this._size.label} · ${this._size.w}×${this._size.h}` : '';

    const hud = document.createElement('div');
    hud.id = '_fgRecHUD';
    hud.style.cssText = [
      'position:fixed;top:16px;left:50%;transform:translateX(-50%)',
      'background:rgba(8,8,14,0.93);border:1px solid rgba(255,60,60,0.45)',
      'border-radius:50px;padding:8px 18px;z-index:9999',
      'display:flex;align-items:center;gap:10px',
      'font-family:monospace;font-size:11px;color:rgba(255,255,255,0.85)',
      'box-shadow:0 2px 20px rgba(255,40,40,0.2);white-space:nowrap',
    ].join(';');

    hud.innerHTML = `
      <span style="width:8px;height:8px;border-radius:50%;background:#ff4040;flex-shrink:0;
                   animation:_fgRecPulse 1s ease-in-out infinite"></span>
      <span id="_fgRecHudTime" style="font-size:15px;font-weight:600;
                                       color:rgba(255,255,255,0.95);min-width:34px">0:00</span>
      <div style="display:flex;flex-direction:column;gap:3px">
        ${limit ? `<div style="height:3px;background:rgba(255,255,255,0.1);border-radius:2px;
                               overflow:hidden;width:80px">
                    <div id="_fgRecHudBar" style="height:100%;width:0%;border-radius:2px;
                                                   background:rgba(255,100,100,0.7);
                                                   transition:width .25s linear,background .3s">
                    </div></div>` : ''}
        <span id="_fgRecHudLabel" style="font-size:9px;color:rgba(255,255,255,0.35);letter-spacing:.05em">
          ${limit ? `free · ${limit}s max` : 'recording…'}
        </span>
        ${sLabel ? `<span style="font-size:9px;color:rgba(255,255,255,0.25)">${sLabel}</span>` : ''}
      </div>
      <button onclick="Recorder.stop()" style="
        background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);
        color:rgba(255,255,255,0.6);font-size:10px;padding:4px 12px;
        border-radius:20px;cursor:pointer;font-family:inherit">Stop ⏹</button>
    `;

    if (!document.getElementById('_fgRecStyles')) {
      const style = document.createElement('style');
      style.id = '_fgRecStyles';
      style.textContent = `@keyframes _fgRecPulse {
        0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(0.75)} }`;
      document.head.appendChild(style);
    }
    document.body.appendChild(hud);
  },

  _hideHUD() {
    const hud = document.getElementById('_fgRecHUD');
    if (hud) { hud.style.opacity = '0'; setTimeout(() => hud.remove(), 300); }
  },
};
