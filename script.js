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
