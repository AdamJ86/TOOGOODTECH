/* TooGoodTech — motion system.
   One rAF scheduler drives every scroll-linked effect, so scrolling stays on
   a single frame budget. Transform/opacity only. Everything degrades to a
   static page under prefers-reduced-motion. */

const EASE = 'cubic-bezier(0.16,1,0.3,1)';
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── shared scroll scheduler ─────────────────────────────── */
const painters = new Set();
let queued = false;
function frame() {
  queued = false;
  const vh = window.innerHeight;
  const y = window.scrollY;
  painters.forEach((fn) => fn(y, vh));
}
function schedule() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
function onScroll(fn) {
  if (!painters.size) {
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
  }
  painters.add(fn);
  schedule();
}

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/* ── reveals ─────────────────────────────────────────────────
   Five characters so not everything arrives the same way, plus automatic
   stagger for siblings that share a parent and don't set data-delay. */
const HIDDEN = {
  up:    'opacity:0;transform:translate3d(0,32px,0)',
  fade:  'opacity:0',
  scale: 'opacity:0;transform:translate3d(0,18px,0) scale(0.972)',
  mask:  'opacity:0;clip-path:inset(0 0 90% 0);transform:translate3d(0,16px,0) scale(1.012)',
  side:  'opacity:0;transform:translate3d(-30px,0,0)',
  line:  'opacity:0;clip-path:inset(0 0 105% 0);transform:translate3d(0,0.32em,0)'
};
const SHOWN = {
  up: 'opacity:1;transform:none',
  fade: 'opacity:1',
  scale: 'opacity:1;transform:none',
  mask: 'opacity:1;clip-path:inset(0 0 0 0);transform:none',
  side: 'opacity:1;transform:none',
  line: 'opacity:1;clip-path:inset(-0.2em 0 -0.2em 0);transform:none'
};
const DUR = { up: 900, fade: 900, scale: 900, mask: 1250, side: 900, line: 1050 };

function autoStagger(nodes) {
  const seen = new Map();
  nodes.forEach((el) => {
    if (el.dataset.delay !== undefined) return;
    const parent = el.parentElement;
    const n = seen.get(parent) || 0;
    seen.set(parent, n + 1);
    if (n > 0) el.dataset.delay = String(Math.min(n * 70, 420));
  });
}

export function initReveal(root = document) {
  const nodes = Array.from(root.querySelectorAll('[data-reveal]:not([data-revealed])'));
  if (!nodes.length) return;
  nodes.forEach((el) => { el.dataset.revealed = 'pending'; });
  if (reduced() || !('IntersectionObserver' in window)) {
    nodes.forEach((el) => { el.dataset.revealed = 'done'; });
    return;
  }
  autoStagger(nodes);
  nodes.forEach((el) => {
    const kind = HIDDEN[el.dataset.reveal] ? el.dataset.reveal : 'up';
    const dur = Number(el.dataset.revealDur) || DUR[kind];
    el.style.cssText += ';' + HIDDEN[kind];
    el.style.transition = `opacity ${dur}ms ${EASE}, transform ${dur}ms ${EASE}, clip-path ${dur}ms ${EASE}`;
    el.style.transitionDelay = (el.dataset.delay || 0) + 'ms';
    el.style.willChange = 'transform,opacity';
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const kind = SHOWN[el.dataset.reveal] ? el.dataset.reveal : 'up';
      el.style.cssText += ';' + SHOWN[kind];
      el.dataset.revealed = 'done';
      const settle = (Number(el.dataset.delay) || 0) + DUR[kind] + 120;
      setTimeout(() => { el.style.willChange = 'auto'; }, settle);
      io.unobserve(el);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
  nodes.forEach((el) => io.observe(el));
}

/* ── counters ────────────────────────────────────────────── */
export function initCountUps(root = document, format = (n) => String(Math.round(n))) {
  const nodes = Array.from(root.querySelectorAll('[data-count-to]:not([data-counted])'));
  if (!nodes.length) return;
  nodes.forEach((el) => { el.dataset.counted = 'pending'; });
  if (reduced() || !('IntersectionObserver' in window)) {
    nodes.forEach((el) => { el.textContent = format(Number(el.dataset.countTo) || 0, el); });
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      io.unobserve(el);
      const to = Number(el.dataset.countTo) || 0;
      const dur = Number(el.dataset.countDur) || 1300;
      const t0 = performance.now();
      const tick = (t) => {
        const p = clamp((t - t0) / dur);
        el.textContent = format(to * (1 - Math.pow(1 - p, 4)), el);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = format(to, el);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.35 });
  nodes.forEach((el) => io.observe(el));
}

/* ── hero media ──────────────────────────────────────────── */
export function initHeroVideo(video) {
  if (!video) return;
  video.muted = true;
  const show = () => { video.style.opacity = '1'; };
  if (video.readyState >= 2) show();
  else {
    video.addEventListener('loadeddata', show, { once: true });
    video.addEventListener('canplay', show, { once: true });
  }
  const tryPlay = () => { if (!reduced()) video.play().catch(() => {}); };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries[0]?.isIntersecting ? tryPlay() : video.pause();
    }, { threshold: 0.15 });
    io.observe(video);
  } else tryPlay();
  document.addEventListener('visibilitychange', () => {
    document.hidden ? video.pause() : tryPlay();
  });
  document.addEventListener('pointerdown', tryPlay, { once: true });
  document.addEventListener('keydown', tryPlay, { once: true });
}

/* ── bounded scroll-linked drift: data-parallax="0.03" ───── */
export function initParallax(root = document) {
  const nodes = Array.from(root.querySelectorAll('[data-parallax]'));
  if (!nodes.length || reduced()) return;
  nodes.forEach((el) => { el.style.willChange = 'transform'; });
  onScroll((y, vh) => {
    nodes.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -160 || r.top > vh + 160) return;
      const centre = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1);
      const shift = centre * -(vh * (Number(el.dataset.parallax) || 0.03));
      const grow = el.dataset.parallaxScale ? 1 + (1 - Math.abs(centre)) * Number(el.dataset.parallaxScale) : 1;
      el.style.transform = `translate3d(0,${shift.toFixed(2)}px,0) scale(${grow.toFixed(4)})`;
    });
  });
}

/* ── hero copy settles as you leave it ───────────────────── */
export function initHeroExit(el) {
  if (!el || reduced()) return;
  el.style.willChange = 'transform,opacity';
  onScroll((y, vh) => {
    const p = clamp(y / (vh * 0.9));
    el.style.opacity = String(1 - p * 0.85);
    el.style.transform = `translate3d(0,${(-46 * p).toFixed(2)}px,0)`;
  });
}

/* ── scroll progress rule ────────────────────────────────── */
export function initProgress(el) {
  if (!el) return;
  onScroll((y) => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    el.style.transform = `scaleX(${clamp(y / max).toFixed(4)})`;
  });
}

/* ── bars fill when seen ─────────────────────────────────── */
export function initBars(root = document) {
  const nodes = Array.from(root.querySelectorAll('[data-fill]'));
  if (!nodes.length) return;
  const set = (el) => { el.style.width = (Number(el.dataset.fill) || 0) + '%'; };
  if (reduced() || !('IntersectionObserver' in window)) { nodes.forEach(set); return; }
  nodes.forEach((el) => {
    el.style.width = '0%';
    el.style.transition = `width 1300ms ${EASE}`;
    el.style.transitionDelay = (el.dataset.delay || 0) + 'ms';
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { set(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.25 });
  nodes.forEach((el) => io.observe(el));
}

/* ── late images ease in instead of popping ──────────────── */
export function initImageFade(root = document) {
  if (reduced()) return;
  root.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    if (img.complete && img.naturalWidth) return;
    img.style.opacity = '0';
    img.style.transition = `opacity 700ms ${EASE}`;
    const show = () => { img.style.opacity = '1'; };
    img.addEventListener('load', show, { once: true });
    img.addEventListener('error', show, { once: true });
  });
}

/* ── nav retracts on the way down, returns on the way up ── */
export function initNavAutoHide(nav, isBlocked = () => false) {
  if (!nav || reduced()) return;
  let last = window.scrollY;
  nav.style.transition = `transform 520ms ${EASE}, background 400ms ${EASE}, border-color 400ms ${EASE}`;
  onScroll((y) => {
    if (isBlocked()) { nav.style.transform = 'translate3d(0,0,0)'; last = y; return; }
    const down = y > last + 4;
    const up = y < last - 4;
    if (down && y > 220) nav.style.transform = 'translate3d(0,-100%,0)';
    else if (up) nav.style.transform = 'translate3d(0,0,0)';
    if (down || up) last = y;
  });
}
