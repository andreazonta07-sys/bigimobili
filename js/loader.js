/* Preloader Bi.Gi. Mobili — "il logo si costruisce":
   la riga del logo si disegna da centro verso i lati; poi le lettere di
   "Bi.Gi." (ritagli reali dello stesso logo, js/logo-parts.js) cadono una
   dopo l'altra sulla riga e si assestano con un solo, morbido rimbalzo;
   arriva l'uccellino, quindi "Mobili" sale dolcemente dal basso.
   Il risultato e' il logo vero, nella stessa posizione e della stessa
   misura del logo della hero: a quel punto lo sfondo si dissolve e il
   passaggio alla hero e' continuo, senza scarti. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("is-loading");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasG = !!window.gsap;

  var preloader = document.getElementById("preloader");
  var bg = document.getElementById("preloader-bg");
  var stage = document.getElementById("preloader-stage");
  var plate = document.getElementById("preloader-plate");
  var glyphsBox = document.getElementById("preloader-glyphs");
  var heroLogo = document.getElementById("hero-logo");
  var parts = window.BIGI_PARTS;
  if (!preloader || !stage || !glyphsBox || !parts || !heroLogo) { root.classList.remove("is-loading"); if (preloader) preloader.remove(); return; }

  var doneFired = false;
  function fireDone() {
    if (doneFired) return;
    doneFired = true;
    window.dispatchEvent(new Event("bigiLoaderDone"));
  }
  function finishUp() {
    root.classList.add("loader-done");
    root.classList.remove("is-loading");
    fireDone();
    /* il logo vero della hero e' gia' visibile nello stesso identico punto */
    setTimeout(function () { if (preloader.parentNode) preloader.parentNode.removeChild(preloader); }, 120);
  }

  if (reduceMotion || !hasG) {
    setTimeout(finishUp, reduceMotion ? 150 : 350);
    return;
  }

  /* ---- il palco ha la stessa misura e posizione del logo della hero ---- */
  function placeStage() {
    var r = heroLogo.getBoundingClientRect();
    stage.style.left = r.left + "px";
    stage.style.top = r.top + "px";
    stage.style.width = r.width + "px";
    stage.style.height = r.height + "px";
    return r;
  }
  var rect = placeStage();
  window.addEventListener("resize", function () { if (preloader.parentNode) rect = placeStage(); });

  /* ---- ritagli del logo, posizionati in % sul quadrato 750x750 ---- */
  var el = {};
  parts.forEach(function (p) {
    var im = new Image();
    im.alt = ""; im.draggable = false;
    im.src = p.d;
    im.className = "lg lg-" + p.n;
    im.style.left = (p.x / 750 * 100) + "%";
    im.style.top = (p.y / 750 * 100) + "%";
    im.style.width = (p.w / 750 * 100) + "%";
    im.style.height = (p.h / 750 * 100) + "%";
    glyphsBox.appendChild(im);
    el[p.n] = im;
  });

  var S = function () { return rect.height || 300; };
  var TOP = ["B", "i1", "p1", "G", "i2", "p2"];
  var BOTTOM = ["M", "o", "b", "i3", "l", "i4"];

  /* stato iniziale sempre via GSAP */
  gsap.set(plate, { opacity: 0 });
  gsap.set(el.line, { scaleX: 0, transformOrigin: "50% 50%" });
  TOP.concat(["bird"]).forEach(function (n) { gsap.set(el[n], { opacity: 0 }); });
  BOTTOM.forEach(function (n) { gsap.set(el[n], { opacity: 0 }); });

  /* ---- caricamento reale: foto chiave + font ---- */
  var assets = [
    "img/hero-facciata.webp",
    "img/hero-insegna.webp",
    "img/chisiamo-cucina-travi.webp",
    "img/logo-bigi.webp"
  ];
  var total = assets.length + 1, loaded = 0, floor = false, started = false;
  function one() { loaded++; }
  assets.forEach(function (src) { var im = new Image(); im.onload = one; im.onerror = one; im.src = src; });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(one).catch(one); else one();
  setTimeout(function () { floor = true; }, 1100);
  var cap = setTimeout(function () { loaded = total; floor = true; }, 4000);

  /* 1. la riga si disegna: e' anche l'indicatore di caricamento */
  var lineDone = false;
  gsap.to(el.line, { scaleX: 1, duration: 1.15, ease: "power3.inOut", delay: .15, onComplete: function () { lineDone = true; } });

  var poll = setInterval(function () {
    if (started || !(loaded >= total && floor && lineDone)) return;
    started = true; clearInterval(poll); clearTimeout(cap);
    build();
  }, 40);

  function drop(tl, n, at) {
    var node = el[n], h = S();
    var tilt = (Math.random() - .5) * 5;
    gsap.set(node, { y: -h * .78, rotation: tilt, transformOrigin: "50% 100%" });
    tl.to(node, { opacity: 1, duration: .28, ease: "power1.out" }, at)
      /* caduta */
      .to(node, { y: 0, rotation: 0, duration: .66, ease: "power2.in" }, at)
      /* appoggio: leggero schiacciamento */
      .to(node, { scaleY: .955, scaleX: 1.018, duration: .09, ease: "sine.out" }, at + .66)
      /* unico rimbalzo, morbido */
      .to(node, { y: -h * .022, scaleY: 1.012, scaleX: .996, duration: .24, ease: "sine.out" }, at + .75)
      .to(node, { y: 0, scaleY: 1, scaleX: 1, duration: .3, ease: "sine.in" }, at + .99);
  }

  function build() {
    var h = S();
    var tl = gsap.timeline({ onComplete: outro });
    var t = 0;
    /* 2. "Bi.Gi." cade sulla riga, lettera per lettera */
    TOP.forEach(function (n, i) { drop(tl, n, t + i * .17); });
    var tBird = t + TOP.length * .17 + .12;
    /* 3. l'uccellino atterra e fa un piccolo saltello */
    var bird = el.bird;
    gsap.set(bird, { y: -h * .5, x: h * .07, rotation: 8, transformOrigin: "50% 100%" });
    tl.to(bird, { opacity: 1, duration: .3, ease: "power1.out" }, tBird)
      .to(bird, { y: 0, x: 0, rotation: 0, duration: .8, ease: "power2.inOut" }, tBird)
      .to(bird, { y: -h * .03, duration: .2, ease: "sine.out" }, tBird + .85)
      .to(bird, { y: 0, duration: .24, ease: "sine.in" }, tBird + 1.05)
      .to(bird, { y: -h * .016, duration: .16, ease: "sine.out" }, tBird + 1.34)
      .to(bird, { y: 0, duration: .2, ease: "sine.in" }, tBird + 1.5);
    /* 4. "Mobili" sale dolcemente, sfumando a fuoco */
    var tMob = tBird + .75;
    BOTTOM.forEach(function (n) { gsap.set(el[n], { y: h * .07, filter: "blur(7px)" }); });
    tl.to(BOTTOM.map(function (n) { return el[n]; }), {
      opacity: 1, y: 0, filter: "blur(0px)", duration: 1.0, ease: "power3.out", stagger: .09,
      clearProps: "filter"
    }, tMob);
    tl.to({}, { duration: .55 }); /* breve pausa sul logo completo */
  }

  /* 5. il logo e' completo: sotto compare la piastra bianca (come nella hero),
     lo sfondo del preloader si dissolve e il logo resta li' dov'e' */
  function outro() {
    var tl = gsap.timeline({ onComplete: finishUp });
    tl.to(plate, { opacity: 1, duration: .55, ease: "sine.inOut" }, 0)
      .to(bg, { opacity: 0, duration: .9, ease: "sine.inOut" }, .1)
      /* il logo vero della hero appare (identico) e il palco puo' sparire */
      .add(function () { window.dispatchEvent(new Event("bigiLogoReady")); }, ">-0.05")
      .to(stage, { opacity: 0, duration: .01 }, ">.05");
  }
})();
