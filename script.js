/* ==========================================================================
   Mahmoud Harb — Portfolio Interactions
   - Language preference persistence (EN / AR)
   - Accessible Mobile Navigation Drawer (keyboard + Escape + focus)
   - Portfolio Category Filtering (non-destructive)
   - Progressive-enhancement section reveals (safe if JS disabled)
   ========================================================================== */

(function () {
  'use strict';

  const LANG_KEY = 'mh_portfolio_lang';
  const currentLang = document.documentElement.lang === 'ar' ? 'ar' : 'en';

  // 1. Language Switcher: save preference & preserve hash section
  document.querySelectorAll('[data-lang-switch]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetLang = link.getAttribute('data-lang-switch');
      if (targetLang) {
        try {
          localStorage.setItem(LANG_KEY, targetLang);
        } catch (_) {
          // Ignore storage restrictions
        }
      }
      if (window.location.hash) {
        const href = link.getAttribute('href');
        if (href && !href.includes('#')) {
          event.preventDefault();
          window.location.href = href + window.location.hash;
        }
      }
    });
  });

  // Gently honor saved Arabic preference on initial visit to root EN page
  // (Skipped if user came from the AR page or explicitly navigated with ?lang=)
  try {
    const saved = localStorage.getItem(LANG_KEY);
    const referrer = document.referrer || '';
    const cameFromAr = referrer.includes('/ar/') || referrer.endsWith('/ar');
    if (currentLang === 'en' && saved === 'ar' && !cameFromAr && !window.location.search.includes('lang=en')) {
      const arLink = document.querySelector('[data-lang-switch="ar"]');
      if (arLink && arLink.getAttribute('href')) {
        window.location.replace(arLink.getAttribute('href') + window.location.hash);
        return;
      }
    }
  } catch (_) {
    // Ignore storage errors
  }

  // 2. Portrait fallback handler (if assets/mahmoud-harb.jpg not yet extracted)
  const portraitImg = document.querySelector('[data-portrait-img]');
  if (portraitImg) {
    const markFallback = () => {
      const wrap = portraitImg.closest('.portrait-inner');
      if (wrap) wrap.classList.add('is-fallback');
      portraitImg.style.display = 'none';
    };
    portraitImg.addEventListener('error', markFallback);
    if (portraitImg.complete && portraitImg.naturalWidth === 0) {
      markFallback();
    }
  }

  // 3. Accessible Mobile Navigation Drawer
  const toggleBtn = document.getElementById('nav-toggle');
  const closeBtn = document.getElementById('drawer-close');
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('mobile-backdrop');

  if (toggleBtn && drawer && backdrop) {
    let lastFocused = null;

    const getFocusable = () =>
      drawer.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');

    const openDrawer = () => {
      lastFocused = document.activeElement;
      drawer.inert = false;
      drawer.classList.add('is-open');
      backdrop.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      toggleBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      const firstFocusable = getFocusable()[0];
      if (firstFocusable) firstFocusable.focus();
    };

    const closeDrawer = () => {
      drawer.classList.remove('is-open');
      drawer.inert = true;
      backdrop.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      toggleBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    };

    toggleBtn.addEventListener('click', () => {
      const isOpen = drawer.classList.contains('is-open');
      if (isOpen) closeDrawer();
      else openDrawer();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);

    drawer.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', closeDrawer);
    });

    document.addEventListener('keydown', (event) => {
      if (!drawer.classList.contains('is-open')) return;
      if (event.key === 'Escape') {
        closeDrawer();
        return;
      }
      if (event.key === 'Tab') {
        const focusables = getFocusable();
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  // 4. Portfolio Category Filter
  const filterButtons = document.querySelectorAll('[data-filter]');
  const filterItems = document.querySelectorAll('[data-categories]');

  if (filterButtons.length && filterItems.length) {
    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const selected = btn.getAttribute('data-filter');
        filterButtons.forEach((b) => {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        filterItems.forEach((item) => {
          const cats = (item.getAttribute('data-categories') || '').split(' ');
          const show = selected === 'all' || cats.includes(selected);
          item.classList.toggle('is-filtered-out', !show);
        });
      });
    });
  }

  // 5. Progressive-Enhancement Scroll Reveal (respects prefers-reduced-motion)
  const prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReduced && 'IntersectionObserver' in window) {
    const revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length) {
      document.documentElement.classList.add('js-reveal');
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
      );
      revealEls.forEach((el) => observer.observe(el));

      // Safety fallback: ensure nothing stays hidden if observer misses
      window.setTimeout(() => {
        revealEls.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight + 120) {
            el.classList.add('is-visible');
          }
        });
      }, 600);
    }
  }
})();
