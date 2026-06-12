/* ══════════════════════════════════════════
   DATA
══════════════════════════════════════════ */
const tracks = [
  {
    title: 'Chill Ambient', artist: 'Lo-Fi Studio', genre: 'Lo-Fi',
    color: '#10b981', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    img: 'images/Chill Ambient.jpg',
    thumb: 'images/Chill Ambient.jpg',
  },
  {
    title: 'Jazz Evening', artist: 'Blue Note Sessions', genre: 'Jazz',
    color: '#818cf8', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    img: 'images/Jazz Evening.webp',
    thumb: 'images/Jazz Evening.webp',
  },
  {
    title: 'Deep Focus', artist: 'Study Beats', genre: 'Ambient',
    color: '#f59e0b', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    img: 'images/Deep Focus.jpg',
    thumb: 'images/Deep Focus.jpg',
  },
  {
    title: 'Night Drive', artist: 'Synthwave Collective', genre: 'Synthwave',
    color: '#ec4899', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    img: 'images/Night Drive.jpg',
    thumb: 'images/Night Drive.jpg',
  },
  {
    title: 'Morning Coffee', artist: 'Acoustic Minds', genre: 'Acoustic',
    color: '#f97316', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    img: 'images/Morning Coffee.jpg',
    thumb: 'images/Morning Coffee.jpg',
  },
  {
    title: 'Ocean Waves', artist: 'Ambient Works', genre: 'Ambient',
    color: '#06b6d4', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    img: 'images/Ocean Waves.jpg',
    thumb: 'images/Ocean Waves.jpg',
  },
  {
    title: 'City Pulse', artist: 'Urban Frequencies', genre: 'Electronic',
    color: '#a78bfa', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    img: 'images/City Pulse.jpg',
    thumb: 'images/City Pulse.jpg',
  },
  {
    title: 'Sakura Rain', artist: 'Eastern Tones', genre: 'World',
    color: '#fb7185', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    img: 'images/Sakura Rain.jpg',
    thumb: 'images/Sakura Rain.jpg',
  },
];

/* ══════════════════════════════════════════
   STATE
══════════════════════════════════════════ */
let current = 0;
let isPlaying = false;
let autoplay = true;
let shuffle = false;
let repeat = false; // 'none' | 'one' | 'all'
let repeatMode = 'none';
let muted = false;
let likedSet = new Set();
let playCount = {};
let searchQ = '';
let sortMode = 'default';
let queue = [];
let shuffledOrder = [];
let visInterval = null;
let prevVolume = 70;
tracks.forEach((_, i) => { playCount[i] = 0; });

/* ══════════════════════════════════════════
   ELEMENTS
══════════════════════════════════════════ */
const audio = document.getElementById('audioEl');
const albumArt = document.getElementById('albumArt');
const artGlow = document.getElementById('artGlow');
const artWrap = document.getElementById('artWrap');
const artRing = document.getElementById('artRing');
const songTitle = document.getElementById('songTitle');
const artistName = document.getElementById('artistName');
const genrePill = document.getElementById('genrePill');
const btnPlay = document.getElementById('btnPlay');
const progressFill = document.getElementById('progressFill');
const progressTrack = document.getElementById('progressTrack');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const volumeSlider = document.getElementById('volume');
const volPct = document.getElementById('volPct');
const volIcon = document.getElementById('volIcon');
const likeBtn = document.getElementById('likeBtn');
const btnShuffle = document.getElementById('btnShuffle');
const btnRepeat = document.getElementById('btnRepeat');
const ambient = document.getElementById('ambient');
const miniArt = document.getElementById('miniArt');
const miniTitle = document.getElementById('miniTitle');
const miniArtist = document.getElementById('miniArtist');

/* ══════════════════════════════════════════
   TOAST
══════════════════════════════════════════ */
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), 2000);
}

/* ══════════════════════════════════════════
   VISUALIZER (fake animated waveform)
══════════════════════════════════════════ */
const visEl = document.getElementById('visualizer');
const VIS_BARS = 28;
const visHeights = Array.from({ length: VIS_BARS }, () => Math.random() * 70 + 15);

for (let i = 0; i < VIS_BARS; i++) {
  const b = document.createElement('div');
  b.className = 'vis-bar';
  b.style.height = visHeights[i] + '%';
  visEl.appendChild(b);
}

function animateVis() {
  const bars = visEl.querySelectorAll('.vis-bar');
  bars.forEach((b, i) => {
    const t = tracks[current];
    const h = isPlaying
      ? Math.abs(Math.sin(Date.now() / (300 + i * 40) + i)) * 75 + 8
      : visHeights[i] * 0.3;
    b.style.height = h + '%';
    b.classList.toggle('active', isPlaying && h > 40);
  });
}

function startVis() {
  if (visInterval) return;
  visInterval = setInterval(animateVis, 60);
}

function stopVis() {
  clearInterval(visInterval);
  visInterval = null;
  animateVis();
}

/* ══════════════════════════════════════════
   FORMAT TIME
══════════════════════════════════════════ */
function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2,'0')}`;
}

/* ══════════════════════════════════════════
   LOAD TRACK
══════════════════════════════════════════ */
function loadTrack(idx) {
  const t = tracks[idx];
  current = idx;

  audio.src = t.src;
  albumArt.src = t.img;
  miniArt.src = t.thumb;
  songTitle.textContent = t.title;
  artistName.textContent = t.artist;
  genrePill.textContent = t.genre;
  miniTitle.textContent = t.title;
  miniArtist.textContent = t.artist;

  progressFill.style.width = '0%';
  currentTimeEl.textContent = '0:00';
  durationEl.textContent = '—';

  // Update like btn
  likeBtn.textContent = likedSet.has(idx) ? '❤️' : '🤍';
  likeBtn.classList.toggle('liked', likedSet.has(idx));

  // Ambient glow
  ambient.style.background = `radial-gradient(ellipse 800px 600px at 50% 50%, ${t.color}18 0%, transparent 70%)`;
  ambient.classList.add('on');
  artGlow.style.background = t.color;

  // Art ring color
  artRing.style.setProperty('--track-color', t.color + '60');

  renderAll();
}

/* ══════════════════════════════════════════
   PLAY / PAUSE
══════════════════════════════════════════ */
function play() {
  audio.play().catch(() => {});
  isPlaying = true;
  btnPlay.textContent = '⏸';
  artWrap.classList.add('playing');
  startVis();
  playCount[current] = (playCount[current] || 0) + 1;
  renderAll();
}

function pause() {
  audio.pause();
  isPlaying = false;
  btnPlay.textContent = '▶';
  artWrap.classList.remove('playing');
  stopVis();
  renderAll();
}

function toggle() { isPlaying ? pause() : play(); }
btnPlay.onclick = toggle;

/* ══════════════════════════════════════════
   NEXT / PREV
══════════════════════════════════════════ */
function getNextIdx() {
  if (shuffle) {
    const others = tracks.map((_, i) => i).filter(i => i !== current);
    return others[Math.floor(Math.random() * others.length)];
  }
  return (current + 1) % tracks.length;
}

function getPrevIdx() {
  if (audio.currentTime > 3) { audio.currentTime = 0; return current; }
  return (current - 1 + tracks.length) % tracks.length;
}

function next() { loadTrack(getNextIdx()); play(); }
function prev() { const i = getPrevIdx(); if (i === current) return; loadTrack(i); play(); }

document.getElementById('btnNext').onclick = next;
document.getElementById('btnPrev').onclick = prev;

/* ══════════════════════════════════════════
   SHUFFLE & REPEAT
══════════════════════════════════════════ */
btnShuffle.addEventListener('click', () => {
  shuffle = !shuffle;
  btnShuffle.classList.toggle('on', shuffle);
  toast(shuffle ? 'Shuffle on' : 'Shuffle off');
});

btnRepeat.addEventListener('click', () => {
  const modes = ['none', 'all', 'one'];
  const next = modes[(modes.indexOf(repeatMode) + 1) % 3];
  repeatMode = next;
  btnRepeat.classList.toggle('on', repeatMode !== 'none');
  btnRepeat.textContent = repeatMode === 'one' ? '↺¹' : '↻';
  btnRepeat.style.color = repeatMode !== 'none' ? 'var(--accent)' : '';
  toast(repeatMode === 'none' ? 'Repeat off' : repeatMode === 'one' ? 'Repeat one' : 'Repeat all');
});

/* ══════════════════════════════════════════
   AUDIO EVENTS
══════════════════════════════════════════ */
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width = pct + '%';
  currentTimeEl.textContent = fmt(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  durationEl.textContent = fmt(audio.duration);
});

audio.addEventListener('ended', () => {
  if (repeatMode === 'one') { audio.currentTime = 0; play(); return; }
  if (autoplay || repeatMode === 'all') { next(); return; }
  pause();
  progressFill.style.width = '0%';
  currentTimeEl.textContent = '0:00';
});

/* ══════════════════════════════════════════
   PROGRESS SEEK
══════════════════════════════════════════ */
let seeking = false;

progressTrack.addEventListener('mousedown', e => { seeking = true; seek(e); });
progressTrack.addEventListener('touchstart', e => { seeking = true; seek(e.touches[0]); }, { passive: true });
document.addEventListener('mousemove', e => { if (seeking) seek(e); });
document.addEventListener('touchmove', e => { if (seeking) seek(e.touches[0]); }, { passive: true });
document.addEventListener('mouseup', () => { seeking = false; });
document.addEventListener('touchend', () => { seeking = false; });

function seek(e) {
  const rect = progressTrack.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  if (audio.duration) audio.currentTime = pct * audio.duration;
}

/* ══════════════════════════════════════════
   VOLUME
══════════════════════════════════════════ */
function setVolume(v) {
  v = Math.max(0, Math.min(100, v));
  volumeSlider.value = v;
  audio.volume = v / 100;
  volPct.textContent = v + '%';
  volIcon.textContent = v === 0 ? '🔇' : v < 40 ? '🔈' : v < 70 ? '🔉' : '🔊';
  muted = v === 0;
  audio.muted = muted;
}

volumeSlider.addEventListener('input', () => setVolume(+volumeSlider.value));

volIcon.addEventListener('click', () => {
  if (muted) {
    setVolume(prevVolume || 70);
    muted = false;
  } else {
    prevVolume = +volumeSlider.value;
    setVolume(0);
    muted = true;
  }
  toast(muted ? 'Muted' : 'Unmuted');
});

/* ══════════════════════════════════════════
   LIKE
══════════════════════════════════════════ */
likeBtn.addEventListener('click', () => {
  if (likedSet.has(current)) {
    likedSet.delete(current);
    likeBtn.textContent = '🤍';
    likeBtn.classList.remove('liked');
    toast('Removed from liked');
  } else {
    likedSet.add(current);
    likeBtn.textContent = '❤️';
    likeBtn.classList.add('liked');
    toast('Added to liked ❤️');
  }
  renderPlaylist();
});

/* ══════════════════════════════════════════
   PLAYLIST RENDER
══════════════════════════════════════════ */
function getFilteredTracks() {
  let list = tracks.map((t, i) => ({ ...t, _i: i }));
  if (searchQ) list = list.filter(t =>
    t.title.toLowerCase().includes(searchQ) ||
    t.artist.toLowerCase().includes(searchQ) ||
    t.genre.toLowerCase().includes(searchQ)
  );
  if (sortMode === 'az') list.sort((a, b) => a.title.localeCompare(b.title));
  else if (sortMode === 'genre') list.sort((a, b) => a.genre.localeCompare(b.genre));
  else if (sortMode === 'duration') {
    list.sort((a, b) => {
      const dur = t => { const parts = t.split(':'); return +parts[0]*60 + +parts[1]; };
      return dur(a.duration || '0:00') - dur(b.duration || '0:00');
    });
  }
  return list;
}

function renderPlaylist() {
  const el = document.getElementById('playlistEl');
  const list = getFilteredTracks();
  el.innerHTML = '';

  if (!list.length) {
    el.innerHTML = `<div style="text-align:center;padding:40px 0;color:var(--sub);font-size:0.82rem">No tracks found</div>`;
    return;
  }

  list.forEach((t, visIdx) => {
    const row = document.createElement('div');
    row.className = 'track' + (t._i === current ? ' active' : '');

    const isActive = t._i === current;
    const isLiked = likedSet.has(t._i);

    row.innerHTML = `
      <div class="track-num">${isActive && isPlaying
        ? `<div class="bars"><span></span><span></span><span></span></div>`
        : (visIdx + 1)}
      </div>
      <img class="track-art" src="${t.thumb || t.img}" alt="">
      <div class="track-meta">
        <div class="track-name">${t.title}</div>
        <div class="track-artist">${t.artist} · <span style="color:var(--accent);font-size:0.65rem">${t.genre}</span></div>
      </div>
      <div class="track-right">
        <div class="track-like-dot ${isLiked ? 'show' : ''}"></div>
        <div class="track-dur">${t.duration || '—'}</div>
      </div>`;

    row.addEventListener('click', () => { loadTrack(t._i); play(); });
    el.appendChild(row);
  });
}

/* ══════════════════════════════════════════
   QUEUE RENDER
══════════════════════════════════════════ */
function renderQueue() {
  const el = document.getElementById('queueEl');
  el.innerHTML = `<div class="up-next-section"><div class="up-next-label">Up Next</div></div>`;

  const upcoming = [];
  for (let i = 1; i <= Math.min(tracks.length - 1, 6); i++) {
    const idx = shuffle
      ? Math.floor(Math.random() * tracks.length)
      : (current + i) % tracks.length;
    upcoming.push({ ...tracks[idx], _i: idx });
  }

  upcoming.forEach((t, i) => {
    const row = document.createElement('div');
    row.className = 'track';
    row.innerHTML = `
      <div class="track-num" style="color:var(--sub)">${i + 1}</div>
      <img class="track-art" src="${t.thumb || t.img}" alt="">
      <div class="track-meta">
        <div class="track-name">${t.title}</div>
        <div class="track-artist">${t.artist}</div>
      </div>
      <div class="track-dur">${t.duration || '—'}</div>`;
    row.addEventListener('click', () => { loadTrack(t._i); play(); });
    el.appendChild(row);
  });
}

/* ══════════════════════════════════════════
   STATS RENDER
══════════════════════════════════════════ */
function renderStats() {
  const pane = document.getElementById('statsPane');
  const maxPlays = Math.max(...Object.values(playCount), 1);

  const topTracks = tracks
    .map((t, i) => ({ ...t, _i: i, plays: playCount[i] || 0 }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 6);

  const genres = {};
  tracks.forEach(t => { genres[t.genre] = (genres[t.genre] || 0) + 1; });

  pane.innerHTML = `
    <div class="stat-card">
      <h4>Most Played</h4>
      <div class="stat-bars">
        ${topTracks.map(t => `
          <div class="stat-row">
            <div class="stat-label">${t.title}</div>
            <div class="stat-bar-wrap"><div class="stat-bar-fill" style="width:${(t.plays / maxPlays) * 100}%"></div></div>
            <div class="stat-val">${t.plays}</div>
          </div>`).join('')}
      </div>
    </div>
    <div class="stat-card">
      <h4>Library Overview</h4>
      <div class="stat-bars">
        <div class="stat-row">
          <div class="stat-label">Total Tracks</div>
          <div class="stat-bar-wrap"><div class="stat-bar-fill" style="width:100%"></div></div>
          <div class="stat-val">${tracks.length}</div>
        </div>
        <div class="stat-row">
          <div class="stat-label">Liked</div>
          <div class="stat-bar-wrap"><div class="stat-bar-fill" style="width:${(likedSet.size / tracks.length) * 100}%"></div></div>
          <div class="stat-val">${likedSet.size}</div>
        </div>
        <div class="stat-row">
          <div class="stat-label">Genres</div>
          <div class="stat-bar-wrap"><div class="stat-bar-fill" style="width:100%"></div></div>
          <div class="stat-val">${Object.keys(genres).length}</div>
        </div>
      </div>
    </div>
    <div class="stat-card">
      <h4>Genres</h4>
      <div class="stat-bars">
        ${Object.entries(genres).map(([g, n]) => `
          <div class="stat-row">
            <div class="stat-label">${g}</div>
            <div class="stat-bar-wrap"><div class="stat-bar-fill" style="width:${(n / tracks.length) * 100}%"></div></div>
            <div class="stat-val">${n}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

/* ══════════════════════════════════════════
   TABS
══════════════════════════════════════════ */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const pane = document.getElementById('tab-' + btn.dataset.tab);
    pane.classList.add('active');
    if (btn.dataset.tab === 'queue') renderQueue();
    if (btn.dataset.tab === 'stats') renderStats();
  });
});

/* ══════════════════════════════════════════
   SEARCH + SORT
══════════════════════════════════════════ */
document.getElementById('searchInput').addEventListener('input', e => {
  searchQ = e.target.value.toLowerCase().trim();
  renderPlaylist();
});

document.getElementById('sortSelect').addEventListener('change', e => {
  sortMode = e.target.value;
  renderPlaylist();
});

/* ══════════════════════════════════════════
   RENDER ALL
══════════════════════════════════════════ */
function renderAll() {
  renderPlaylist();
}

/* ══════════════════════════════════════════
   KEYBOARD
══════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  switch (e.key) {
    case ' ': e.preventDefault(); toggle(); break;
    case 'ArrowRight': e.preventDefault(); next(); break;
    case 'ArrowLeft':  e.preventDefault(); prev(); break;
    case 'ArrowUp':   e.preventDefault(); setVolume(+volumeSlider.value + 5); break;
    case 'ArrowDown': e.preventDefault(); setVolume(+volumeSlider.value - 5); break;
    case 'm': case 'M': volIcon.click(); break;
    case 's': case 'S': btnShuffle.click(); break;
    case 'r': case 'R': btnRepeat.click(); break;
    case 'l': case 'L': likeBtn.click(); break;
  }
});

/* ══════════════════════════════════════════
   SWIPE (mobile)
══════════════════════════════════════════ */
let touchX = 0;
document.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 60) { dx < 0 ? next() : prev(); }
});

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
setVolume(70);
loadTrack(0);
startVis();