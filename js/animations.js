/**
 * KoomBei Animation System — homepage only, non-hero sections.
 * The hero keeps its existing CSS keyframe animations; this file never
 * touches it.
 *
 * Five effects, chosen deliberately from a larger set: everything here
 * either has no design-system tradeoff (no new font, no cursor change,
 * no fixed-position element competing with the chatbot corner) or
 * directly replaces an existing effect rather than layering on it.
 *   1. Section reveal — replaces the plain CSS .fade-in on the card
 *      grids with a staggered GSAP entrance. The .fade-in class has
 *      been removed from those cards in the HTML so the two systems
 *      don't fight over the same opacity/transform.
 *   2. Card spotlight — soft glow that follows the cursor inside cards.
 *   3. Magnetic buttons — primary CTAs drift slightly toward the cursor.
 *   4. Stats bar pulse — the amber bar's numbers animate in on scroll.
 *   5. Marquee hover speedup — trivial, no dependencies.
 *
 * Depends on:
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js">
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js">
 * Loaded via <script src="js/animations.js" defer> in <head>, after the
 * two GSAP tags above (also deferred, so execution order is preserved).
 */

(function () {
  'use strict';

  // Bail out gracefully if GSAP didn't load (e.g. CSP or network issue)
  // or the visitor prefers reduced motion. Cards still render normally
  // without the .fade-in class, so nothing is left stuck invisible.
  if (typeof gsap === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  /* ============================================================
     1. SECTION REVEAL
  ============================================================ */
  (function initSectionReveal() {
    document.querySelectorAll('.stat-num[data-target]').forEach(el => {
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          gsap.to({ val: 0 }, {
            val: target,
            duration: 1.6,
            ease: 'power2.out',
            onUpdate() { el.textContent = Math.round(this.targets()[0].val) + suffix; },
          });
        },
      });
    });

    ['why-grid', 'services-grid', 'work-grid', 'testimonials-grid'].forEach(cls => {
      const grid = document.querySelector('.' + cls);
      if (!grid) return;
      const cards = grid.querySelectorAll(':scope > *');
      gsap.from(cards, {
        scrollTrigger: { trigger: grid, start: 'top 85%', toggleActions: 'play none none reverse' },
        opacity: 0,
        y: 36,
        duration: 0.65,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'all',
      });
    });

    const pkgGrid = document.querySelector('.packages-grid');
    if (pkgGrid) {
      gsap.from(pkgGrid.querySelectorAll('.pkg'), {
        scrollTrigger: { trigger: pkgGrid, start: 'top 85%', toggleActions: 'play none none reverse' },
        opacity: 0,
        y: 40,
        scale: 0.97,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power3.out',
        clearProps: 'all',
      });
    }

    const serveGrid = document.querySelector('.serve-grid');
    if (serveGrid) {
      gsap.from(serveGrid.querySelectorAll('.serve-card'), {
        scrollTrigger: { trigger: serveGrid, start: 'top 85%', toggleActions: 'play none none reverse' },
        opacity: 0,
        y: 50,
        duration: 0.75,
        stagger: 0.14,
        ease: 'power3.out',
        clearProps: 'all',
      });
    }

    gsap.utils.toArray('.section-title').forEach(el => {
      if (el.closest('.hero')) return;
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
        opacity: 0,
        y: 28,
        duration: 0.7,
        ease: 'power3.out',
        clearProps: 'all',
      });
    });

    // process-node and its connecting line are deliberately left alone here:
    // they already have a working, non-conflicting reveal via the existing
    // ".process-section.visible .process-node" CSS rule, triggered by the
    // ancestor section's own .fade-in class. Re-animating them with GSAP
    // too would just be redundant, not broken, but there is no reason to.

    const globeFeatures = document.querySelectorAll('.globe-feature');
    if (globeFeatures.length) {
      gsap.from(globeFeatures, {
        scrollTrigger: { trigger: '.globe-grid', start: 'top 82%', toggleActions: 'play none none reverse' },
        opacity: 0,
        x: -28,
        duration: 0.6,
        stagger: 0.14,
        ease: 'power2.out',
        clearProps: 'all',
      });
    }

    const founderBlock = document.querySelector('.founder-block');
    if (founderBlock) {
      gsap.from(founderBlock.querySelector('.founder-photo'), {
        scrollTrigger: { trigger: founderBlock, start: 'top 82%', toggleActions: 'play none none reverse' },
        opacity: 0,
        x: -40,
        duration: 0.8,
        ease: 'power3.out',
        clearProps: 'all',
      });
      gsap.from(founderBlock.querySelector('.founder-content'), {
        scrollTrigger: { trigger: founderBlock, start: 'top 82%', toggleActions: 'play none none reverse' },
        opacity: 0,
        x: 40,
        duration: 0.8,
        delay: 0.1,
        ease: 'power3.out',
        clearProps: 'all',
      });
    }

    const ctaSection = document.querySelector('.cta-section');
    if (ctaSection) {
      gsap.from(ctaSection.querySelectorAll('h2, p, .cta-btns'), {
        scrollTrigger: { trigger: ctaSection, start: 'top 85%', toggleActions: 'play none none reverse' },
        opacity: 0,
        y: 24,
        duration: 0.65,
        stagger: 0.12,
        ease: 'power2.out',
        clearProps: 'all',
      });
    }
  })();

  /* ============================================================
     2. CARD SPOTLIGHT
  ============================================================ */
  (function initSpotlight() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    if (!document.getElementById('kbSpotlightStyle')) {
      const st = document.createElement('style');
      st.id = 'kbSpotlightStyle';
      st.textContent = `
        .why-card, .service-card, .work-card, .testimonial-card, .pkg {
          --mx: 50%; --my: 50%;
        }
        .why-card::after, .service-card::after, .work-card::after,
        .testimonial-card::after, .pkg::after {
          content: '' !important;
          position: absolute !important;
          inset: 0 !important;
          background: radial-gradient(160px circle at var(--mx) var(--my),
            rgba(199,160,3,0.07), transparent 70%) !important;
          opacity: 0 !important;
          transition: opacity 0.3s !important;
          pointer-events: none !important;
          border-radius: inherit !important;
          z-index: 0 !important;
        }
        .why-card:hover::after, .service-card:hover::after, .work-card:hover::after,
        .testimonial-card:hover::after, .pkg:hover::after {
          opacity: 1 !important;
        }
        .why-card > *, .service-card > *, .work-card > *,
        .testimonial-card > *, .pkg > * {
          position: relative;
          z-index: 1;
        }
      `;
      document.head.appendChild(st);
    }

    document.querySelectorAll('.why-card, .service-card, .work-card, .testimonial-card, .pkg')
      .forEach(card => {
        card.addEventListener('mousemove', e => {
          const r = card.getBoundingClientRect();
          card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
          card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
      });
  })();

  /* ============================================================
     3. MAGNETIC BUTTONS
  ============================================================ */
  (function initMagnetic() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    document.querySelectorAll('.btn-primary, .nav-cta').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.22;
        const y = (e.clientY - r.top - r.height / 2) * 0.22;
        gsap.to(btn, { x, y, duration: 0.3, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' });
      });
    });
  })();

  /* ============================================================
     4. STATS BAR PULSE
  ============================================================ */
  (function initStatsPulse() {
    const statsBar = document.querySelector('.stats-bar');
    if (!statsBar) return;
    ScrollTrigger.create({
      trigger: statsBar,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.from(statsBar.querySelectorAll('.stat'), {
          opacity: 0,
          y: 16,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out',
          clearProps: 'all',
        });
      },
    });
  })();

  /* ============================================================
     5. MARQUEE HOVER SPEEDUP
  ============================================================ */
  (function initMarquee() {
    const track = document.querySelector('.marquee-track');
    if (!track) return;
    const BASE_DURATION = 40;
    track.style.animationDuration = BASE_DURATION + 's';
    track.addEventListener('mouseenter', () => {
      track.style.animationDuration = (BASE_DURATION * 0.4) + 's';
    });
    track.addEventListener('mouseleave', () => {
      track.style.animationDuration = BASE_DURATION + 's';
    });
  })();

})();
