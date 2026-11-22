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
  /* il logo dell'header non compare piu' subito a preloader finito: resta
     nascosto finche' il logo della hero, scrollando, non "vola" al suo
     posto (vedi il blocco Hero piu' sotto). */
  /* fallback: se il preloader non esiste proprio (no-js/errore), mostra comunque il logo */
  if (!document.getElementById('preloader')) showBrand();

  /* ---------- Logo header: si rimpicciolisce scrollando via dalla cima ---------- */
  if (brand && hasG && window.ScrollTrigger && !reduceMotion) {
    gsap.set(brand, { transformOrigin: '0% 50%' });
    gsap.to(brand, {
      scale: .72, ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: '+=140', scrub: .3 }
    });
  }

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

  /* ---------- Hero: nessun pin, nessuno scrub sulle foto.
     Le due foto si alternano da sole con una dissolvenza lenta e un
     respiro (zoom appena percettibile); scrollando, il logo si alleggerisce
     e sfuma mentre quello dell'header compare con una dissolvenza morbida
     (basata sul tempo, non sullo scroll: nessuno scatto). ---------- */
  var heroPin = document.querySelector('.hero-pin');
  var heroBg1 = document.getElementById('hero-bg-1');
  var heroBg2 = document.getElementById('hero-bg-2');
  var heroLogo = document.getElementById('hero-logo');
  var heroScroll = document.querySelector('.hero-scroll');
  var heroPhotos = [heroBg1, heroBg2];

  if (hasG) {
    gsap.set(heroBg2, { opacity: 0 });
    gsap.set(heroPhotos, { scale: 1.04, transformOrigin: '50% 50%' });
    if (brand) gsap.set(brand, { opacity: 0, y: -8 });
  }
  /* il logo della hero e' invisibile finche' il preloader non ha finito
     di costruire il logo identico sopra di lui */
  if (heroLogo && hasG && !reduceMotion && document.getElementById('preloader')) gsap.set(heroLogo, { opacity: 0 });

  var brandShown = false;
  function toggleBrand(show) {
    if (!brand || show === brandShown) return;
    brandShown = show;
    if (!hasG) { brand.classList.toggle('is-visible', show); brand.style.opacity = show ? 1 : 0; return; }
    if (show) brand.classList.add('is-visible');
    gsap.to(brand, { opacity: show ? 1 : 0, y: show ? 0 : -8, duration: .7, ease: 'power2.out', overwrite: 'auto' });
  }

  function startHeroLoop() {
    if (!hasG || reduceMotion || !heroBg1 || !heroBg2) return;
    var idx = 0;
    /* respiro lento sulla foto visibile */
    gsap.to(heroPhotos, { scale: 1.1, duration: 14, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 7 });
    function swap() {
      var from = heroPhotos[idx], to = heroPhotos[1 - idx];
      idx = 1 - idx;
      gsap.to(to, { opacity: 1, duration: 2.2, ease: 'sine.inOut' });
      gsap.to(from, { opacity: 0, duration: 2.2, ease: 'sine.inOut', delay: .4 });
      gsap.delayedCall(7, swap);
    }
    gsap.delayedCall(5, swap);
  }

  if (heroPin && hasG && window.ScrollTrigger && !reduceMotion) {
    /* leggero parallax del logo e della scena, lisciato da Lenis */
    if (heroLogo) {
      gsap.fromTo(heroLogo, { yPercent: 0, scale: 1, opacity: 1 }, {
        yPercent: -14, scale: .9, opacity: 0, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: heroPin, start: 'top top', end: '+=' + Math.round(window.innerHeight * .55), scrub: true }
      });
    }
    gsap.to('.hero-bg', {
      yPercent: 7, ease: 'none',
      scrollTrigger: { trigger: heroPin, start: 'top top', end: 'bottom top', scrub: true }
    });
    ScrollTrigger.create({
      trigger: heroPin, start: 'top top', end: '+=' + Math.round(window.innerHeight * .4),
      onUpdate: function (self) {
        heroPin.classList.toggle('scrolled-past', self.progress > 0.02);
        updateScrollHint(self.progress);
      },
      onToggle: function (self) { toggleBrand(self.progress > .9 || !self.isActive); }
    });
  } else if (heroPin) {
    toggleBrand(true);
    if (heroScroll) heroScroll.style.opacity = 0;
  }
  function updateScrollHint(progress) {
    if (!heroScroll || !hasG) return;
    gsap.to(heroScroll, { opacity: progress > 0.02 ? 0 : 1, duration: .3, overwrite: 'auto' });
  }

  /* ---------- Intro hero: a preloader concluso ---------- */
  var heroShown = false;
  function showHeroLogo() {
    if (heroShown) return; heroShown = true;
    if (heroLogo && hasG) gsap.set(heroLogo, { opacity: 1 });
  }
  function heroIntro() {
    showHeroLogo();
    if (!hasG || reduceMotion) return;
    startHeroLoop();
    gsap.set('.hero-scroll', { opacity: 0, y: 16 });
    gsap.to('.hero-scroll', { opacity: 1, y: 0, duration: 1, ease: 'power2.out', delay: .6 });
  }
  if (document.getElementById('preloader') && !reduceMotion && hasG) {
    window.addEventListener('bigiLogoReady', showHeroLogo);
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

  /* ---------- Chi siamo: foto con wipe direzionale + parallax continuo + tilt hover ---------- */
  (function chiSiamoPhotos() {
    var photos = gsap.utils.toArray('.chisiamo-photo');
    if (!photos.length) return;

    var INSET_BY_WIPE = {
      left: 'inset(0% 100% 0% 0%)',
      top: 'inset(0% 0% 100% 0%)',
      bottom: 'inset(100% 0% 0% 0%)'
    };

    if (!hasG || !window.ScrollTrigger || reduceMotion) {
      photos.forEach(function (fig) {
        var clip = fig.querySelector('.chisiamo-photo-clip');
        if (clip) clip.style.clipPath = 'inset(0% 0% 0% 0%)';
      });
      return;
    }

    photos.forEach(function (fig, i) {
      var clip = fig.querySelector('.chisiamo-photo-clip');
      var img = fig.querySelector('img');
      var wipe = fig.getAttribute('data-wipe') || 'left';

      if (clip) {
        gsap.set(clip, { clipPath: INSET_BY_WIPE[wipe] || INSET_BY_WIPE.left });
        gsap.to(clip, {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.1,
          delay: i * .12,
          ease: 'power4.inOut',
          scrollTrigger: { trigger: fig, start: 'top 85%', toggleActions: 'play none none none' }
        });
      }

      if (img) {
        gsap.set(img, { scale: 1.18 });
        gsap.fromTo(img,
          { yPercent: -6 },
          {
            yPercent: 6, ease: 'none',
            scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: .6 }
          }
        );
      }
    });

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      photos.forEach(function (fig) {
        var rotX = gsap.quickTo(fig, 'rotationX', { duration: .6, ease: 'power3.out' });
        var rotY = gsap.quickTo(fig, 'rotationY', { duration: .6, ease: 'power3.out' });
        var lift = gsap.quickTo(fig, 'scale', { duration: .6, ease: 'power3.out' });
        fig.addEventListener('pointermove', function (e) {
          var r = fig.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - .5;
          var py = (e.clientY - r.top) / r.height - .5;
          rotX(py * -10);
          rotY(px * 10);
          lift(1.015);
        });
        fig.addEventListener('pointerleave', function () {
          rotX(0); rotY(0); lift(1);
        });
      });
    }
  })();

  /* ---------- Recensioni: card che ruotano in ingresso + stelle a scintilla ---------- */
  (function reviewCards() {
    var cards = gsap.utils.toArray('.review-card');
    if (!cards.length) return;

    cards.forEach(function (card) {
      var starsEl = card.querySelector('.review-stars');
      if (starsEl && !starsEl.querySelector('span')) {
        var chars = starsEl.textContent.split('');
        starsEl.textContent = '';
        chars.forEach(function (ch) {
          var s = document.createElement('span');
          s.textContent = ch;
          s.style.display = 'inline-block';
          starsEl.appendChild(s);
        });
      }
    });

    if (!hasG || !window.ScrollTrigger || reduceMotion) return;

    cards.forEach(function (card, i) {
      var fromRight = card.getAttribute('data-align') === 'right';
      var stars = card.querySelectorAll('.review-stars span');

      gsap.set(card, { opacity: 0, y: 60, scale: .92, rotate: fromRight ? 5 : -5, transformOrigin: '50% 100%' });
      if (stars.length) gsap.set(stars, { opacity: 0, scale: 0 });

      var tl = gsap.timeline({
        scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none none' }
      });
      tl.to(card, { opacity: 1, y: 0, scale: 1, rotate: 0, duration: .85, ease: 'back.out(1.5)' });
      if (stars.length) {
        tl.to(stars, { opacity: 1, scale: 1, duration: .35, ease: 'back.out(3)', stagger: .07 }, '-=.35');
      }
    });
  })();

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
