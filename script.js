/* ═══════════════════════════════════════════
   LA PARISIENNE — Interactions
═══════════════════════════════════════════ */

'use strict';

// ─── Custom Cursor ────────────────────────────────────────
(function initCursor() {
  const cursor    = document.getElementById('cursor');
  const cursorDot = document.getElementById('cursorDot');
  if (!cursor || !cursorDot) return;

  let mouseX = 0, mouseY = 0;
  let curX = 0, curY = 0;
  let visible = false;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!visible) {
      curX = mouseX; curY = mouseY;
      cursor.classList.add('visible');
      cursorDot.classList.add('visible');
      visible = true;
    }
    cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  });

  document.addEventListener('mouseleave', () => {
    cursor.classList.remove('visible');
    cursorDot.classList.remove('visible');
    visible = false;
  });

  document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
  document.addEventListener('mouseup',   () => cursor.classList.remove('clicking'));

  const hoverTargets = 'a, button, .specialty-card, .review-card, .about-card, .btn, .tag, .nav-cta, .hour-row, .contact-item';
  document.querySelectorAll(hoverTargets).forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
  });

  function lerp(a, b, t) { return a + (b - a) * t; }
  function animateCursor() {
    curX = lerp(curX, mouseX, 0.1);
    curY = lerp(curY, mouseY, 0.1);
    cursor.style.transform = `translate(${curX}px, ${curY}px) translate(-50%, -50%)`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();
})();

// ─── Nav scroll effect ────────────────────────────────────
(function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ─── Scroll Reveal ────────────────────────────────────────
(function initReveal() {
  const els = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = parseInt(el.dataset.delay || 0, 10);
      setTimeout(() => el.classList.add('in-view'), delay);
      observer.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
})();

// ─── Count-up animation ───────────────────────────────────
(function initCountUp() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const isDecimal = target % 1 !== 0;
      const duration = 1800;
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = eased * target;
        el.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = isDecimal ? target.toFixed(1) : target;
      }
      requestAnimationFrame(update);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
})();

// ─── Gold Particles ───────────────────────────────────────
(function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const colors = ['#C9A84C', '#DDB95E', '#F0CF82', '#E8C060', '#B8394A', '#C9A84C'];
  const count = 24;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 1.5 + Math.random() * 3;
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${10 + Math.random() * 75}%;
      --duration: ${6 + Math.random() * 10}s;
      --delay: ${Math.random() * 12}s;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      opacity: ${0.1 + Math.random() * 0.3};
      border-radius: 50%;
    `;
    container.appendChild(p);
  }
})();

// ─── Card tilt effect ─────────────────────────────────────
(function initTilt() {
  const cards = document.querySelectorAll('.specialty-card:not(.specialty-card--cta), .review-card, .about-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `
        translateY(-6px)
        rotateX(${-y * 5}deg)
        rotateY(${x * 5}deg)
      `;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

// ─── Reviews carousel (reusable) ──────────────────────────
function setupCarousel(trackEl) {
  if (!trackEl) return;

  const cards = Array.from(trackEl.children);
  cards.forEach(card => {
    const clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    trackEl.appendChild(clone);
  });
  trackEl.style.animationPlayState = 'running';

  const viewport = trackEl.parentElement;
  let isDragging = false, startX = 0, scrollLeft = 0;

  function getCurrentTranslate() {
    const matrix = new DOMMatrix(window.getComputedStyle(trackEl).transform);
    return matrix.m41;
  }

  viewport.addEventListener('mousedown', (e) => {
    isDragging = true;
    trackEl.style.animationPlayState = 'paused';
    startX = e.pageX;
    scrollLeft = getCurrentTranslate();
    viewport.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    trackEl.style.transform = `translateX(${scrollLeft + (e.pageX - startX)}px)`;
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    viewport.style.cursor = 'grab';
    trackEl.style.animationPlayState = 'running';
    trackEl.style.transform = '';
  });
}

(function initCarousels() {
  setupCarousel(document.getElementById('carouselTrack'));
  setupCarousel(document.getElementById('carouselTrack2'));
})();

// ─── Smooth anchor scroll ─────────────────────────────────
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const navH = document.getElementById('nav')?.offsetHeight ?? 72;
      const top = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

// ─── Hero glow parallax ───────────────────────────────────
(function initParallax() {
  const glow = document.querySelector('.hero-glow');
  if (!glow) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    glow.style.transform = `translate(-50%, calc(-55% + ${y * 0.25}px))`;
  }, { passive: true });
})();
