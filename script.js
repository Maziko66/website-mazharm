// ── Scope view transitions: sidebar frozen, right panel animates ───
document.querySelector('.left-panel')?.style.setProperty('view-transition-name', 'sidebar');
document.querySelector('.right-panel')?.style.setProperty('view-transition-name', 'main-content');

// ── Sync line animation with view transition ──────────────────
let _resolveAnimReady;
const _animReady = new Promise(r => { _resolveAnimReady = r; });

document.addEventListener('pagereveal', async (e) => {
  if (e.viewTransition) {
    await document.fonts.ready;
    await e.viewTransition.finished;
  }
  _resolveAnimReady();
});

// Fallback for browsers without pagereveal support (window.load fires after pagereveal)
window.addEventListener('load', () => _resolveAnimReady(), { once: true });

// ── Auto-detect active nav link from current URL ──────────────
(function() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.side-nav a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
})();

// ── L/Z-path title bar animation ─────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await _animReady;

  const activeLink   = document.querySelector('.side-nav a.active');
  const titleLine    = document.querySelector('.page-title-line');
  const titleText    = document.querySelector('.page-title-text');
  const rightContent = document.querySelector('.right-content');
  if (!titleLine) return;

  const VERT_DUR   = 200; // ms – vertical segment
  const HORIZ_DUR  = 280; // ms – title line draws
  const FADE_OFF   = 80;  // ms – extra before content fades in
  const UNDRAW_DUR = 160; // ms – each undraw segment

  function run(totalDelay) {
    titleLine.style.animationDelay     = totalDelay + 'ms';
    titleLine.style.animationPlayState = 'running';
    if (titleText) {
      titleText.style.animationDelay     = (totalDelay + HORIZ_DUR) + 'ms';
      titleText.style.animationPlayState = 'running';
    }
    if (rightContent) {
      rightContent.style.animationDelay     = (totalDelay + HORIZ_DUR + FADE_OFF) + 'ms';
      rightContent.style.animationPlayState = 'running';
    }
  }

  if (!activeLink) { run(0); return; }

  const btnRect  = activeLink.getBoundingClientRect();
  const lineRect = titleLine.getBoundingClientRect();
  const lineY    = lineRect.top + lineRect.height / 2;   // centre of title line
  const btnMidY  = btnRect.top;                          // button top-right corner Y

  // Flash the button's right edge as the launch point
  activeLink.style.boxShadow = 'inset -2px 0 0 #c08830, inset -4px 0 10px rgba(192,136,48,0.5)';
  setTimeout(() => { activeLink.style.boxShadow = ''; }, VERT_DUR + 80);

  const injected = [];
  function mkLine() {
    const el = document.createElement('div');
    el.style.position      = 'fixed';
    el.style.background    = '#c08830';
    el.style.boxShadow     = '0 0 6px rgba(192,136,48,0.7)';
    el.style.zIndex        = '201';
    el.style.pointerEvents = 'none';
    document.body.appendChild(el);
    injected.push(el);
    return el;
  }

  // Undraw an element by shrinking from start-point toward end-point.
  function undrawEl(el, type, startDelay) {
    setTimeout(() => {
      el.style.transformOrigin = type === 'horiz' ? 'right center' : 'top center';
      const anim = el.animate(
        [{ transform: type === 'horiz' ? 'scaleX(1)' : 'scaleY(1)' },
         { transform: type === 'horiz' ? 'scaleX(0)' : 'scaleY(0)' }],
        { duration: UNDRAW_DUR, easing: 'ease-in', fill: 'forwards' }
      );
      anim.onfinish = () => el.parentNode?.removeChild(el);
    }, startDelay);
  }

  const bridgeW = Math.round(lineRect.left) - Math.round(btnRect.right);

  if (bridgeW > 4) {
    // ── Z-shape: RIGHT (bridge at btn level) → UP (at panel edge) → RIGHT (title) ──
    const BRIDGE_DUR = Math.max(80, Math.round(bridgeW * HORIZ_DUR / 600));
    const vertH      = btnMidY - lineY;

    if (vertH <= 4) { run(0); return; }

    // 1. Bridge: from btn right-edge going RIGHT, at button centre Y
    const bridge = mkLine();
    bridge.style.left            = (Math.round(btnRect.right) - 1) + 'px';
    bridge.style.top             = (Math.round(btnMidY) - 1) + 'px';
    bridge.style.width           = (bridgeW + 2) + 'px';
    bridge.style.height          = '2px';
    bridge.style.transformOrigin = 'left center';
    bridge.style.transform       = 'scaleX(0)';
    bridge.animate(
      [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
      { duration: BRIDGE_DUR, easing: 'ease-out', fill: 'forwards' }
    );

    // 2. Vertical: at panel left edge, from button centre Y going UP to title Y
    const vert = mkLine();
    vert.style.left            = (Math.round(lineRect.left) - 1) + 'px';
    vert.style.top             = (Math.round(lineY) - 1) + 'px';
    vert.style.width           = '2px';
    vert.style.height          = (Math.round(vertH) + 1) + 'px';
    vert.style.transformOrigin = 'bottom center';
    vert.style.transform       = 'scaleY(0)';
    vert.animate(
      [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }],
      { duration: VERT_DUR, delay: BRIDGE_DUR, easing: 'ease-out', fill: 'forwards' }
    );

    const drawEnd = BRIDGE_DUR + VERT_DUR;
    run(drawEnd);

    // Undraw: bridge first (right-center), then vertical (top-center)
    const PAUSE = 300;
    undrawEl(bridge, 'horiz', drawEnd + HORIZ_DUR + PAUSE);
    undrawEl(vert,   'vert',  drawEnd + HORIZ_DUR + PAUSE + UNDRAW_DUR);

  } else {
    // ── L-shape: UP (vertical at btn right edge) → RIGHT (title) ──
    const vertH = btnMidY - lineY;
    if (vertH <= 4) { run(0); return; }

    const vert = mkLine();
    vert.style.left            = (Math.round(btnRect.right) - 1) + 'px';
    vert.style.top             = (Math.round(lineY) - 1) + 'px';
    vert.style.width           = '2px';
    vert.style.height          = (Math.round(vertH) + 1) + 'px';
    vert.style.transformOrigin = 'bottom center';
    vert.style.transform       = 'scaleY(0)';
    vert.animate(
      [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }],
      { duration: VERT_DUR, easing: 'ease-out', fill: 'forwards' }
    );

    run(VERT_DUR);
    undrawEl(vert, 'vert', VERT_DUR + HORIZ_DUR + 300);
  }
});

// ── Mobile panel toggle ───────────────────────────────────────
const menuBtn = document.querySelector('.mobile-menu-btn');
const leftPanel = document.querySelector('.left-panel');
if (menuBtn && leftPanel) {
  menuBtn.addEventListener('click', () => leftPanel.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (!leftPanel.contains(e.target) && !menuBtn.contains(e.target))
      leftPanel.classList.remove('open');
  });
}

// ── Expandable sidebar sections ──────────────────────────────
document.querySelectorAll('.about-expand-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.closest('.about-expandable');
    section.classList.toggle('open');
    btn.classList.toggle('open');
  });
});

// ── Tabs ──────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

document.querySelectorAll('.game-embed-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const wrap   = document.getElementById(btn.dataset.target);
    const iframe = wrap.querySelector('iframe');
    const open   = wrap.classList.toggle('open');
    if (open) {
      iframe.src = iframe.dataset.src;
      btn.textContent = '▼ HIDE GAME';
    } else {
      iframe.src = '';
      btn.textContent = '▶ PLAY IN BROWSER';
    }
  });
});

document.querySelectorAll('.tracks-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const list = btn.closest('.music-album').querySelector('.tracks-list');
    const open = list.classList.toggle('open');
    btn.textContent = open ? '▼ HIDE TRACKS' : '▶ SHOW TRACKS';
  });
});

function formatTime(s) {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

function updateSeekVisual(seek, pct) {
  seek.style.background =
    `linear-gradient(to right, var(--accent) ${pct}%, var(--border-dark) ${pct}%)`;
}

// Inject scrubber elements after each track-title (before track-dur)
document.querySelectorAll('.track-play').forEach(btn => {
  const row    = btn.closest('.track-row');
  const title  = row?.querySelector('.track-title');
  if (!title) return;

  const scrubber = document.createElement('span');
  scrubber.className = 'track-scrubber';
  scrubber.innerHTML =
    '<input type="range" class="track-seek" min="0" max="100" value="0" step="0.1">' +
    '<span class="track-time">0:00/0:00</span>';
  title.insertAdjacentElement('afterend', scrubber);

  const seek   = scrubber.querySelector('.track-seek');
  const timeEl = scrubber.querySelector('.track-time');

  // While dragging: freeze timeupdate updates, only update display
  seek.addEventListener('mousedown',  () => { scrubber._seeking = true; });
  seek.addEventListener('touchstart', () => { scrubber._seeking = true; }, { passive: true });

  seek.addEventListener('input', () => {
    const audio = scrubber._audio;
    if (!audio) return;
    const pct = parseFloat(seek.value);
    const t   = audio.duration ? (pct / 100) * audio.duration : 0;
    updateSeekVisual(seek, pct);
    timeEl.textContent = formatTime(t) + '/' + formatTime(audio.duration);
  });

  // Commit seek only on release to avoid glitch
  function commitSeek() {
    scrubber._seeking = false;
    const audio = scrubber._audio;
    if (audio && audio.duration) {
      audio.currentTime = (seek.value / 100) * audio.duration;
    }
  }
  seek.addEventListener('mouseup',  commitSeek);
  seek.addEventListener('touchend', commitSeek);
});

let currentAudio    = null;
let currentPlayBtn  = null;
let currentScrubber = null;

function hideScrubber() {
  if (currentScrubber) {
    currentScrubber.classList.remove('visible');
    currentScrubber.closest('.track-row')?.classList.remove('active-track');
    currentScrubber._audio   = null;
    currentScrubber._seeking = false;
  }
}

document.querySelectorAll('.track-play').forEach(btn => {
  btn.addEventListener('click', () => {
    // Toggle play/pause on current track
    if (currentPlayBtn === btn) {
      if (currentAudio.paused) {
        currentAudio.play();
        btn.textContent = '⏸';
        btn.classList.add('playing');
      } else {
        currentAudio.pause();
        btn.textContent = '▶';
        btn.classList.remove('playing');
      }
      return;
    }

    // Stop previous track
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentPlayBtn.textContent = '▶';
      currentPlayBtn.classList.remove('playing');
      hideScrubber();
    }

    currentAudio   = new Audio(btn.dataset.src);
    currentPlayBtn = btn;
    btn.textContent = '⏸';
    btn.classList.add('playing');

    const scrubber = btn.closest('.track-row')?.querySelector('.track-scrubber');
    if (scrubber) {
      currentScrubber          = scrubber;
      scrubber._audio          = currentAudio;
      scrubber._seeking        = false;

      const row    = btn.closest('.track-row');
      const seek   = scrubber.querySelector('.track-seek');
      const timeEl = scrubber.querySelector('.track-time');

      seek.value = 0;
      updateSeekVisual(seek, 0);
      timeEl.textContent = '0:00/0:00';

      scrubber.classList.add('visible');
      row?.classList.add('active-track');

      currentAudio.addEventListener('loadedmetadata', () => {
        timeEl.textContent = '0:00/' + formatTime(currentAudio.duration);
      });

      currentAudio.addEventListener('timeupdate', () => {
        if (scrubber._seeking) return;
        const pct = currentAudio.duration
          ? (currentAudio.currentTime / currentAudio.duration) * 100
          : 0;
        seek.value = pct;
        updateSeekVisual(seek, pct);
        timeEl.textContent =
          formatTime(currentAudio.currentTime) + '/' + formatTime(currentAudio.duration);
      });
    }

    currentAudio.play();

    currentAudio.addEventListener('ended', () => {
      btn.textContent = '▶';
      btn.classList.remove('playing');
      hideScrubber();
      currentAudio    = null;
      currentPlayBtn  = null;
      currentScrubber = null;
    });
  });
});
