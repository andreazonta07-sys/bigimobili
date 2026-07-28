/* Bi.Gi. Mobili — Cartigliano (VI) — interazioni (Lenis + GSAP/ScrollTrigger) */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasG = !!window.gsap;
  if (hasG && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Header: sfondo su scroll + comparsa logo a preloader finito ---------- */
  var header = document.querySelector('.site-header');
  var brand = document.querySelector('.brand');
  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  function showBrand() {
    if (brand) brand.classList.add('is-visible');
  }
  window.addEventListener('bigiLoaderDone', showBrand);
  if (document.documentElement.classList.contains('loader-done')) showBrand();
  /* fallback: se il preloader non esiste proprio (no-js/errore), mostra comunque il logo */
  if (!document.getElementById('preloader')) showBrand();

  /* ---------- Nav mobile ---------- */
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open);
    });
    document.querySelectorAll('.site-nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
      });
    });
  }

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    if (hasG && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
    }
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -84 }); }
      });
    });
  }

  /* ---------- Hero: pin + zoom scrub sullo sfondo segnaposto ---------- */
  var heroPin = document.querySelector('.hero-pin');
  var heroBg = document.querySelector('.hero-bg');
  var heroScroll = document.querySelector('.hero-scroll');
  /* l'intro (heroIntro, sotto) porta .hero-scroll a opacity:1 con uno stile
     inline: da quel momento in poi solo GSAP può farlo sparire allo scroll,
     la regola CSS .scrolled-past non basterebbe più (l'inline vince sempre). */
  function updateScrollHint(progress) {
    if (!heroScroll || !hasG) return;
    gsap.to(heroScroll, { opacity: progress > 0.02 ? 0 : 1, duration: .3, overwrite: 'auto' });
  }
  if (heroPin && hasG && window.ScrollTrigger) {
    if (heroBg) gsap.set(heroBg, { scale: 1, transformOrigin: '50% 45%' });

    if (!reduceMotion && heroBg) {
      gsap.timeline({
        scrollTrigger: {
          trigger: heroPin,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          onUpdate: function (self) {
            heroPin.classList.toggle('scrolled-past', self.progress > 0.02);
            updateScrollHint(self.progress);
          }
        }
      }).to(heroBg, { scale: 2.15, ease: 'none', duration: 1 }, 0);
    } else {
      ScrollTrigger.create({
        trigger: heroPin,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: function (self) {
          heroPin.classList.toggle('scrolled-past', self.progress > 0.02);
          updateScrollHint(self.progress);
        }
      });
    }
  }

  /* ---------- Intro hero: righe del titolo ---------- */
  function heroIntro() {
    var lines = document.querySelectorAll('.hero-title .line > span');
    if (!lines.length || reduceMotion || !hasG) {
      lines.forEach(function (l) { l.style.transform = 'none'; });
      return;
    }
    gsap.set(lines, { yPercent: 112 });
    gsap.set('.hero-kicker, .hero-sub, .hero-cta-row, .hero-scroll', { opacity: 0, y: 16 });
    gsap.to(lines, { yPercent: 0, duration: 1, ease: 'power4.out', stagger: .1, delay: .2 });
    gsap.to('.hero-kicker, .hero-sub, .hero-cta-row, .hero-scroll', {
      opacity: 1, y: 0, duration: .85, ease: 'power2.out', stagger: .09, delay: .5
    });
  }
  if (document.getElementById('preloader')) {
    window.addEventListener('bigiLoaderDone', heroIntro);
  } else {
    heroIntro();
  }

  /* ---------- Reveal allo scroll: IntersectionObserver + GSAP ----------
     Tecnica volutamente diversa dai siti fratelli (che usano ScrollTrigger
     trigger/start/once): qui un solo IntersectionObserver condiviso pilota
     tutte le apparizioni, easing/durata leggermente diversi. */
  if (hasG && !reduceMotion && 'IntersectionObserver' in window) {
    var singles = gsap.utils.toArray('[data-reveal]');
    var groups = gsap.utils.toArray('[data-reveal-group]');

    gsap.set(singles, { opacity: 0, y: 34, scale: .985 });
    groups.forEach(function (g) { gsap.set(g.children, { opacity: 0, y: 30 }); });

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        obs.unobserve(el);
        if (el.hasAttribute('data-reveal-group')) {
          gsap.to(el.children, {
            opacity: 1, y: 0, duration: .85, ease: 'power2.out', stagger: .09
          });
        } else {
          gsap.to(el, { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power2.out' });
        }
      });
    }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });

    singles.forEach(function (el) { io.observe(el); });
    groups.forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('[data-reveal], [data-reveal-group] > *').forEach(function (el) {
      el.style.opacity = 1;
    });
  }

  /* ---------- Marquee striscia testuale: scorrimento continuo + spinta scroll ---------- */
  document.querySelectorAll('.marquee-strip .marquee-track').forEach(function (track) {
    track.innerHTML += track.innerHTML;

    var half = 0;
    function measure() { half = track.scrollWidth / 2; }
    measure();
    window.addEventListener('resize', measure);

    var pos = 0;
    var idleSpeed = reduceMotion ? 0 : 40;
    var scrollFactor = .09;
    var lastScrollY = window.scrollY;

    function tick(now, dt) {
      if (!half) measure();
      pos += idleSpeed * (dt / 1000);
      var sy = window.scrollY;
      var dy = sy - lastScrollY;
      if (dy) { pos += dy * scrollFactor; lastScrollY = sy; }
      pos = ((pos % half) + half) % half - half;
      track.style.transform = 'translate3d(' + pos + 'px,0,0)';
    }
    if (hasG) {
      gsap.ticker.add(function (t, dt) { tick(t, dt); });
    } else {
      var last = performance.now();
      (function loop(now) { tick(now, now - last); last = now; requestAnimationFrame(loop); })(last);
    }
  });

})();
