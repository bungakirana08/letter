// ===== CONFIG =====
const CORRECT_PIN = '290526';

// ===== HELPERS =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const target = document.getElementById(id);
  target.style.display = '';
  setTimeout(() => target.classList.add('active'), 10);
  target.scrollTop = 0;
}

// ===== SCREEN 1: LOADING =====
function startLoading() {
  const loading = document.getElementById('screen-loading');
  loading.style.display = 'flex';
  loading.classList.add('active');
  const bar = document.getElementById('progress-bar');
  const pct = document.getElementById('progress-pct');
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 4 + 1;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      bar.style.width = '100%';
      pct.textContent = '100%';
      setTimeout(() => showScreen('screen-cover'), 600);
    } else {
      bar.style.width = progress + '%';
      pct.textContent = Math.floor(progress) + '%';
    }
  }, 80);
}

// ===== SCREEN 2: COVER =====
function initCover() {
  const coverScreen = document.getElementById('screen-cover');

  function drawHeartText() {
    // Hapus SVG lama kalau ada
    const oldSvg = document.getElementById('heart-svg');
    if (oldSvg) oldSvg.remove();

    const VW = coverScreen.offsetWidth  || window.innerWidth;
    const VH = coverScreen.offsetHeight || window.innerHeight;
    const cx = VW / 2;
    const cy = VH / 2;

    // Skala: hati mengisi ~60% lebar atau ~55% tinggi
    const scale = Math.min(VW * 0.60, VH * 0.55) / 32;

    const words = ['I love you', 'love', 'I love', 'I love you'];

    // Konversi parameter t → koordinat SVG (px)
    function heartPt(t) {
      const hx =  16 * Math.pow(Math.sin(t), 3);
      const hy = -(13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t));
      return { x: cx + hx * scale, y: cy + hy * scale };
    }

    // Cek apakah titik pixel ada di dalam hati
    // Persamaan implicit: (x²+y²-1)³ - x²y³ ≤ 0
    function isInsideHeart(px, py) {
      const nx =  (px - cx) / scale;
      const ny = -(py - cy) / scale; // flip Y
      return Math.pow(nx*nx + ny*ny - 1, 3) - nx*nx * ny*ny*ny <= 0;
    }

    // --- Titik outline hati ---
    const OUTLINE_N = 130;
    const outlinePts = [];
    for (let i = 0; i < OUTLINE_N; i++) {
      const t = (i / OUTLINE_N) * 2 * Math.PI;
      outlinePts.push(heartPt(t));
    }

    // --- Titik isian dalam hati (grid) ---
    const innerPts = [];
    const step = Math.max(8, scale * 1.6);
    const bx0 = cx - 16 * scale, bx1 = cx + 16 * scale;
    const by0 = cy - 13 * scale, by1 = cy + 17 * scale;
    for (let px = bx0; px <= bx1; px += step) {
      for (let py = by0; py <= by1; py += step) {
        if (isInsideHeart(px, py)) {
          innerPts.push({
            x: px + (Math.random()-0.5)*step*0.5,
            y: py + (Math.random()-0.5)*step*0.5
          });
        }
      }
    }

    // Buat SVG fullscreen
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'heart-svg';
    svg.setAttribute('width',  VW);
    svg.setAttribute('height', VH);
    svg.style.cssText = `
      position:absolute;
      top:0; left:0;
      width:100%; height:100%;
      pointer-events:none;
      z-index:1;
      overflow:visible;
    `;

    const allPts = [...outlinePts, ...innerPts];

    allPts.forEach((pt, i) => {
      const isOutline = i < OUTLINE_N;
      const word = words[i % words.length];
      const fs   = isOutline ? (0.52 + Math.random()*0.22) : (0.36 + Math.random()*0.20);
      const op   = isOutline ? (0.50 + Math.random()*0.35) : (0.12 + Math.random()*0.14);
      const rot  = (Math.random()-0.5) * 28;

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.textContent = word;
      text.setAttribute('x', pt.x.toFixed(1));
      text.setAttribute('y', pt.y.toFixed(1));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('transform', `rotate(${rot.toFixed(1)},${pt.x.toFixed(1)},${pt.y.toFixed(1)})`);
      text.style.cssText = `
        font-size:${fs.toFixed(2)}rem;
        font-family:'Cormorant Garamond',serif;
        font-style:italic;
        fill:rgba(255,255,255,0.95);
        opacity:${op.toFixed(2)};
        user-select:none;
      `;
      svg.appendChild(text);
    });

    // Sisipkan SVG sebagai child pertama cover screen (di bawah teks nama)
    coverScreen.insertBefore(svg, coverScreen.firstChild);
  }

  // Gambar ulang saat resize (rotasi HP)
  window.addEventListener('resize', () => {
    if (coverScreen.classList.contains('active')) {
      setTimeout(drawHeartText, 50);
    }
  });

  // Tunggu sampai screen-cover benar-benar aktif dan punya ukuran
  const observer = new MutationObserver(() => {
    if (coverScreen.classList.contains('active')) {
      observer.disconnect();
      // rAF ganda: pastikan layout sudah selesai
      requestAnimationFrame(() => requestAnimationFrame(drawHeartText));
    }
  });
  observer.observe(coverScreen, { attributes: true, attributeFilter: ['class'] });

  coverScreen.addEventListener('click', () => {
    showScreen('screen-password');
    initPassword();
  });
}

// ===== SCREEN 3: PASSWORD =====
let pinInput = '';

function initPassword() {
  pinInput = '';
  const lockQ    = document.querySelector('.lock-question');
  const hintText = document.getElementById('hint-text');
  const hintSub  = document.getElementById('hint-sub');
  lockQ.textContent = 'apa yaa kode nyaa';
  hintText.style.display = '';
  hintSub.textContent = '';
  updateDots();

  document.querySelectorAll('.key[data-val]').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => {
      if (pinInput.length < 6) {
        pinInput += newBtn.getAttribute('data-val');
        updateDots();
        if (pinInput.length === 6) checkPin();
      }
    });
  });

  const delBtn = document.getElementById('key-del');
  const newDel = delBtn.cloneNode(true);
  delBtn.parentNode.replaceChild(newDel, delBtn);
  newDel.id = 'key-del';
  newDel.addEventListener('click', () => {
    if (pinInput.length > 0) {
      pinInput = pinInput.slice(0, -1);
      updateDots();
    }
  });
}

function updateDots() {
  document.querySelectorAll('#pin-dots .dot').forEach((dot, i) => {
    dot.classList.remove('filled','error','success');
    if (i < pinInput.length) dot.classList.add('filled');
  });
}

function checkPin() {
  const dots = document.querySelectorAll('#pin-dots .dot');
  if (pinInput === CORRECT_PIN) {
    dots.forEach(d => { d.classList.remove('filled'); d.classList.add('success'); });
    document.getElementById('hint-sub').textContent = '';
    setTimeout(() => {
      document.querySelector('.lock-question').textContent = 'yeay, kamu berhasil reyhan';
      document.getElementById('hint-text').style.display = 'none';
      setTimeout(() => showScreen('screen-ticket'), 1000);
    }, 600);
  } else {
    dots.forEach(d => { d.classList.remove('filled'); d.classList.add('error'); });
    document.getElementById('hint-sub').textContent = 'ututuu, kodenya 290526 sayangku';
    setTimeout(() => {
      pinInput = '';
      updateDots();
      document.getElementById('hint-sub').textContent = '';
    }, 1200);
  }
}

// ===== SCREEN 4: TICKET =====
function initTicket() {
  document.getElementById('btn-masuk').addEventListener('click', () => showScreen('screen-museum'));
}

// ===== SCREEN 5: MUSEUM =====
function initMuseum() {
  document.getElementById('btn-buka-surat').addEventListener('click', () => showScreen('screen-surat'));
}

// ===== SCREEN 6: SURAT =====
function initSurat() {
  document.getElementById('btn-bouquet').addEventListener('click', () => {
    showScreen('screen-bouquet');
    initBouquet();
  });
}

// ===== SCREEN 7: BOUQUET =====
function initBouquet() {
  document.getElementById('btn-back').addEventListener('click', () => showScreen('screen-cover'));
  document.getElementById('btn-ulang').addEventListener('click', () => location.reload());
}

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.screen').forEach(s => {
    s.style.display = 'none';
    s.classList.remove('active');
  });
  startLoading();
  initCover();
  initTicket();
  initMuseum();
  initSurat();
});