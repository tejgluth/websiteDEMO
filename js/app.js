/* ═══════════════════════════════════════════════════════════
   VELOCITY ONE ANC — app.js
   9 modules: Lenis, Preloader, Canvas, FrameScroll,
              HeroTransition, SectionAnimations, Counters,
              Marquee, DarkOverlay
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Constants ──────────────────────────────────────────────
  const FRAME_COUNT = 121;
  const FRAME_EXT = 'jpg';
  const FRAME_PATH = 'frames/frame_';
  const FRAME_SPEED = 2.0; // complete by 50% scroll

  // ─── Reduced-motion check ────────────────────────────────────
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── Shared state ────────────────────────────────────────────
  let currentFrame = 0;
  const images = new Array(FRAME_COUNT);
  let framesLoaded = 0;
  let allFramesReady = false;

  // ─── DOM refs ────────────────────────────────────────────────
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const loader = document.getElementById('loader');
  const loaderBar = document.getElementById('loader-bar');
  const loaderPct = document.getElementById('loader-pct');
  const canvasWrap = document.querySelector('.canvas-wrap');
  const heroEl = document.querySelector('.hero-standalone');
  const darkOverlay = document.getElementById('dark-overlay');
  const marqueeWrap = document.querySelector('.marquee-wrap');
  const marqueeTrack = document.getElementById('marquee-track');
  const siteHeader = document.querySelector('.site-header');

  // ─── Utility: responsive horizontal anchor (% of canvas width) ─
  function getAnchorPct() {
    const cw = window.innerWidth;
    return cw <= 768 ? 50 : cw <= 1024 ? 40 : 32;
  }

  // ─── Utility: zero-padded frame index ────────────────────────
  function frameSrc(i) {
    const n = String(i + 1).padStart(4, '0');
    return `${FRAME_PATH}${n}.${FRAME_EXT}`;
  }

  // ══════════════════════════════════════════════════════════════
  // MODULE 1 — Lenis Smooth Scroll
  // ══════════════════════════════════════════════════════════════
  gsap.registerPlugin(ScrollTrigger);

  let lenis;

  function initLenis() {
    if (reducedMotion) return;

    lenis = new Lenis({
      duration: 1.2,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // Smooth-scroll nav anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        const id = anchor.getAttribute('href').slice(1);
        if (!id) return;
        const target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: 0, duration: 1.4 });
        }
      });
    });
  }

  // ══════════════════════════════════════════════════════════════
  // MODULE 2 — Frame Preloader
  // ══════════════════════════════════════════════════════════════
  function loadImage(index) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        images[index] = img;
        framesLoaded++;
        updateLoader(framesLoaded / FRAME_COUNT);
        resolve(img);
      };
      img.onerror = () => {
        framesLoaded++;
        updateLoader(framesLoaded / FRAME_COUNT);
        resolve(null);
      };
      img.src = frameSrc(index);
    });
  }

  function updateLoader(progress) {
    const pct = Math.round(progress * 100);
    loaderBar.style.width = `${pct}%`;
    loaderPct.textContent = `${pct}%`;
  }

  async function preloadFrames() {
    if (reducedMotion) {
      // In reduced-motion mode, load only first and last frames
      await loadImage(0);
      drawFrame(0);
      canvasWrap.style.clipPath = `circle(100% at ${getAnchorPct()}% 50%)`;
      hideLoader();
      allFramesReady = true;
      return;
    }

    // Phase 1: Load first 10 frames eagerly
    const phase1 = [];
    for (let i = 0; i < Math.min(10, FRAME_COUNT); i++) {
      phase1.push(loadImage(i));
    }
    await Promise.all(phase1);

    // Show first frame, keep loader visible until 100%
    drawFrame(0);

    // Phase 2: Load remaining frames in batches
    const BATCH = 10;
    for (let i = 10; i < FRAME_COUNT; i += BATCH) {
      const batch = [];
      for (let j = i; j < Math.min(i + BATCH, FRAME_COUNT); j++) {
        batch.push(loadImage(j));
      }
      await Promise.all(batch);
    }

    allFramesReady = true;
    hideLoader();
  }

  function hideLoader() {
    loader.classList.add('hidden');
    siteHeader.classList.add('visible');
    setTimeout(() => {
      loader.style.display = 'none';
    }, 700);
  }

  // ══════════════════════════════════════════════════════════════
  // MODULE 3 — Canvas Renderer
  // ══════════════════════════════════════════════════════════════
  const IMAGE_SCALE = 0.87;

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
    if (images[currentFrame]) drawFrame(currentFrame);
  }

  function drawFrame(index) {
    const img = images[index];
    if (!img) return;

    const cw = window.innerWidth;
    const ch = window.innerHeight;

    const scale = IMAGE_SCALE;
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = cw / ch;

    let drawW, drawH;
    if (imgAspect > canvasAspect) {
      drawH = ch * scale;
      drawW = drawH * imgAspect;
    } else {
      drawW = cw * scale;
      drawH = drawW / imgAspect;
    }

    const dx = (cw * getAnchorPct() / 100) - (drawW / 2);
    const dy = (ch - drawH) / 2;

    // Sample bg color from edges for seamless bleed (every 20 frames)
    if (index % 20 === 0) {
      try {
        const sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = 1;
        sampleCanvas.height = 1;
        const sCtx = sampleCanvas.getContext('2d');
        sCtx.drawImage(img, 0, 0, 1, 1);
        const px = sCtx.getImageData(0, 0, 1, 1).data;
        const r = Math.round(px[0] * 0.4);
        const g = Math.round(px[1] * 0.4);
        const b = Math.round(px[2] * 0.4);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
      } catch (e) {
        ctx.fillStyle = '#080808';
      }
    } else {
      ctx.fillStyle = '#080808';
    }

    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, drawW, drawH);
  }

  window.addEventListener('resize', resizeCanvas);

  // ══════════════════════════════════════════════════════════════
  // MODULE 4 — Frame-to-Scroll Binding
  // ══════════════════════════════════════════════════════════════
  function initFrameScroll() {
    if (reducedMotion) return;

    ScrollTrigger.create({
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: self => {
        if (!allFramesReady) return;
        const progress = Math.min(self.progress * FRAME_SPEED, 1);
        const idx = Math.min(Math.floor(progress * FRAME_COUNT), FRAME_COUNT - 1);
        if (idx !== currentFrame) {
          currentFrame = idx;
          requestAnimationFrame(() => drawFrame(idx));
        }
      },
    });
  }

  // ══════════════════════════════════════════════════════════════
  // MODULE 5 — Hero Transition (Circle Wipe + Hero Fade)
  // ══════════════════════════════════════════════════════════════
  function initHeroTransition() {
    if (reducedMotion) {
      canvasWrap.style.clipPath = `circle(100% at ${getAnchorPct()}% 50%)`;
      return;
    }

    ScrollTrigger.create({
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: self => {
        const p = self.progress;

        // Hero fades out quickly
        const heroOpacity = Math.max(0, 1 - p * 15);
        heroEl.style.opacity = heroOpacity;

        // Canvas circle wipe from 0% scroll
        const wipeProgress = Math.min(p * 20, 1);
        const circleSize = wipeProgress * 75;
        canvasWrap.style.clipPath = `circle(${circleSize}% at ${getAnchorPct()}% 50%)`;
      },
    });
  }

  // ══════════════════════════════════════════════════════════════
  // MODULE 6 — Section Animation System
  // ══════════════════════════════════════════════════════════════

  // Animation definitions
  const ANIMATIONS = {
    'fade-up': {
      hidden: { opacity: 0, y: 40 },
      visible: { opacity: 1, y: 0 },
      duration: 0.7,
      ease: 'power2.out',
    },
    'slide-left': {
      hidden: { opacity: 0, x: -60 },
      visible: { opacity: 1, x: 0 },
      duration: 0.8,
      ease: 'power2.out',
    },
    'slide-right': {
      hidden: { opacity: 0, x: 60 },
      visible: { opacity: 1, x: 0 },
      duration: 0.8,
      ease: 'power2.out',
    },
    'scale-up': {
      hidden: { opacity: 0, scale: 0.92 },
      visible: { opacity: 1, scale: 1 },
      duration: 0.9,
      ease: 'power2.out',
    },
    'rotate-in': {
      hidden: { opacity: 0, rotationX: 15, y: 30 },
      visible: { opacity: 1, rotationX: 0, y: 0 },
      duration: 0.9,
      ease: 'power2.out',
    },
    'stagger-up': {
      hidden: { opacity: 0, y: 50 },
      visible: { opacity: 1, y: 0 },
      duration: 0.8,
      ease: 'power2.out',
      stagger: 0.12,
    },
    'clip-reveal': {
      hidden: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
      visible: { opacity: 1, clipPath: 'inset(0 0% 0 0)' },
      duration: 1.0,
      ease: 'power3.out',
    },
  };

  function getSectionTargets(section) {
    const animType = section.dataset.animation || 'fade-up';
    if (animType === 'stagger-up') {
      // Stats-specific: each .stat animates individually
      return Array.from(section.querySelectorAll('.stat, .connect-row, .section-label, .section-heading, .section-body'));
    }
    return Array.from(section.querySelectorAll(
      '.section-label, .section-heading, .section-body, .section-note, ' +
      '.spec-row, .colorways, .stats-grid, .connect-row, .specs-table, ' +
      '.reviews-list, .faq-list, .cta-price, .cta-sub, .cta-buttons, .trust-row'
    ));
  }

  function positionSection(section) {
    const enter = parseFloat(section.dataset.enter) / 100;
    const leave = parseFloat(section.dataset.leave) / 100;
    const midpoint = (enter + leave) / 2;

    // Calculate absolute top within scroll-container (1200vh tall)
    const scrollHeight = document.getElementById('scroll-container').offsetHeight;
    const sectionTop = midpoint * scrollHeight - window.innerHeight / 2;

    section.style.top = `${sectionTop}px`;
    section.style.minHeight = `${window.innerHeight}px`;
  }

  const sectionAnimState = new Map();

  function initSectionAnimations() {
    const sections = document.querySelectorAll('.scroll-section');

    sections.forEach(section => {
      positionSection(section);

      const animType = section.dataset.animation || 'fade-up';
      const anim = ANIMATIONS[animType] || ANIMATIONS['fade-up'];
      const isPersist = section.dataset.persist === 'true';
      const targets = getSectionTargets(section);

      // Set initial hidden state
      if (!reducedMotion) {
        targets.forEach((el, i) => {
          if (animType === 'clip-reveal') {
            gsap.set(el, { ...anim.hidden });
          } else {
            gsap.set(el, { ...anim.hidden });
          }
        });
      }

      sectionAnimState.set(section, { hasEntered: false, animType, anim, isPersist, targets });
    });

    // Single ScrollTrigger for all sections
    ScrollTrigger.create({
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: false,
      onUpdate: self => {
        const progress = self.progress * 100;
        sections.forEach(section => animateSection(section, progress));
      },
    });
  }

  function animateSection(section, progress) {
    const state = sectionAnimState.get(section);
    if (!state) return;

    const enter = parseFloat(section.dataset.enter);
    const leave = parseFloat(section.dataset.leave);
    const { hasEntered, anim, animType, isPersist, targets } = state;

    const isInRange = progress >= enter && progress <= leave;
    const hasPassed = progress > leave;

    if (isInRange && !hasEntered) {
      // Animate in
      state.hasEntered = true;
      section.classList.add('is-active');

      if (animType === 'stagger-up') {
        gsap.to(targets, {
          ...anim.visible,
          duration: anim.duration,
          ease: anim.ease,
          stagger: anim.stagger,
        });
      } else {
        gsap.to(targets, {
          ...anim.visible,
          duration: anim.duration,
          ease: anim.ease,
          stagger: 0.08,
        });
      }
    } else if (!isInRange && !hasPassed && hasEntered) {
      // Animate out (scrolling back up)
      if (!isPersist) {
        state.hasEntered = false;
        section.classList.remove('is-active');
        gsap.to(targets, {
          ...anim.hidden,
          duration: anim.duration * 0.6,
          ease: 'power2.in',
          stagger: 0,
        });
      }
    } else if (hasPassed && hasEntered && !isPersist) {
      // Past the section — reset for scroll-back
      state.hasEntered = false;
      section.classList.remove('is-active');
      gsap.set(targets, { ...anim.hidden });
    } else if (hasPassed && !hasEntered && isPersist) {
      // Persist sections: animate in when we pass through
      state.hasEntered = true;
      section.classList.add('is-active');
      gsap.to(targets, {
        ...anim.visible,
        duration: anim.duration,
        ease: anim.ease,
        stagger: 0.08,
      });
    }
  }

  // ══════════════════════════════════════════════════════════════
  // MODULE 7 — Counter Animations
  // ══════════════════════════════════════════════════════════════
  function initCounters() {
    const stats = document.querySelectorAll('.stat-number');
    let countersTriggered = false;

    // Piggyback on the main scroll progress watcher
    ScrollTrigger.create({
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: self => {
        const p = self.progress * 100;
        // Trigger counters when battery section enters (57%)
        if (p >= 57 && !countersTriggered) {
          countersTriggered = true;
          stats.forEach(el => {
            const target = parseInt(el.dataset.target, 10);
            const obj = { val: 0 };
            gsap.to(obj, {
              val: target,
              duration: 2,
              ease: 'power1.out',
              onUpdate: () => {
                el.textContent = Math.round(obj.val);
              },
            });
          });
        }
        // Reset if scroll back before the section
        if (p < 54) {
          countersTriggered = false;
          stats.forEach(el => { el.textContent = '0'; });
        }
      },
    });
  }

  // ══════════════════════════════════════════════════════════════
  // MODULE 8 — Horizontal Marquee
  // ══════════════════════════════════════════════════════════════
  function initMarquee() {
    if (reducedMotion) return;

    // Marquee visibility tied to 45–70% scroll range
    ScrollTrigger.create({
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: self => {
        const p = self.progress * 100;
        const SHOW_START = 49;
        const SHOW_END = 73;

        let opacity = 0;
        if (p >= SHOW_START && p <= SHOW_END) {
          // Fade in over 2%, fade out over 2%
          const fadeIn = Math.min((p - SHOW_START) / 2, 1);
          const fadeOut = Math.min((SHOW_END - p) / 2, 1);
          opacity = Math.min(fadeIn, fadeOut);
        }
        marqueeWrap.style.opacity = opacity;

        // Parallax scroll: -25% to 0 across full scroll
        const xOffset = (self.progress * -25);
        marqueeTrack.style.transform = `translateX(${xOffset}%)`;
      },
    });
  }

  // ══════════════════════════════════════════════════════════════
  // MODULE 9 — Dark Overlay
  // ══════════════════════════════════════════════════════════════
  function initDarkOverlay() {
    if (reducedMotion) return;

    const OVERLAY_ENTER = 57;
    const OVERLAY_LEAVE = 70;
    const FADE_RANGE = 2;

    ScrollTrigger.create({
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: self => {
        const p = self.progress * 100;
        let opacity = 0;

        if (p >= OVERLAY_ENTER && p <= OVERLAY_LEAVE) {
          const fadeIn = Math.min((p - OVERLAY_ENTER) / FADE_RANGE, 1);
          const fadeOut = Math.min((OVERLAY_LEAVE - p) / FADE_RANGE, 1);
          opacity = Math.min(fadeIn, fadeOut) * 0.9;
        }

        darkOverlay.style.opacity = opacity;
      },
    });
  }

  // ══════════════════════════════════════════════════════════════
  // INIT — Boot sequence
  // ══════════════════════════════════════════════════════════════
  async function init() {
    resizeCanvas();

    // Reduced-motion: make everything visible immediately
    if (reducedMotion) {
      canvasWrap.style.clipPath = `circle(100% at ${getAnchorPct()}% 50%)`;
      heroEl.style.opacity = '1';
      siteHeader.classList.add('visible');

      // Load first frame only
      const img = new Image();
      img.onload = () => {
        images[0] = img;
        drawFrame(0);
      };
      img.src = frameSrc(FRAME_COUNT - 1); // show final frame
      loader.classList.add('hidden');
      setTimeout(() => { loader.style.display = 'none'; }, 700);
      return;
    }

    // Normal mode
    initLenis();
    initHeroTransition();
    initFrameScroll();
    initSectionAnimations();
    initMarquee();
    initDarkOverlay();
    initCounters();

    // Start preloading
    await preloadFrames();

    initScrollProgress();

    // Refresh ScrollTrigger after layout settles
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  }

  // ══════════════════════════════════════════════════════════════
  // MODULE 10 — Scroll Progress Bar
  // ══════════════════════════════════════════════════════════════
  function initScrollProgress() {
    const thumb = document.getElementById('scroll-progress-thumb');
    if (!thumb) return;

    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      thumb.style.height = `${pct}%`;
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // Reposition sections on resize
  window.addEventListener('resize', () => {
    const sections = document.querySelectorAll('.scroll-section');
    sections.forEach(positionSection);
    resizeCanvas();
    ScrollTrigger.refresh();
  });

  // Boot when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

// ══════════════════════════════════════════════════════════════
// FAQ Accordion — button-driven, accessible, cross-browser
// ══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  function initFaqAccordion() {
    const buttons = document.querySelectorAll('.faq-question');
    buttons.forEach(btn => {
      const answerId = btn.getAttribute('aria-controls');
      const answer = document.getElementById(answerId);
      if (!answer) return;

      btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';

        // Close all siblings first
        buttons.forEach(sibling => {
          if (sibling !== btn) {
            sibling.setAttribute('aria-expanded', 'false');
            const sibAnswerId = sibling.getAttribute('aria-controls');
            const sibAnswer = document.getElementById(sibAnswerId);
            if (sibAnswer) sibAnswer.hidden = true;
          }
        });

        // Toggle this one
        if (isOpen) {
          btn.setAttribute('aria-expanded', 'false');
          answer.hidden = true;
        } else {
          btn.setAttribute('aria-expanded', 'true');
          answer.hidden = false;
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFaqAccordion);
  } else {
    initFaqAccordion();
  }
})();
