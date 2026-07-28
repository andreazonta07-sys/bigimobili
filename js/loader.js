/* Preloader Bi.Gi. Mobili:
   "Bi.Gi." e "Mobili" restano separati sopra e sotto una sottile riga
   orizzontale (la stessa geometria del logo, ma in testo vero). La riga
   si allunga da 0 a 1 seguendo il caricamento reale di font e foto chiave
   -- nessun contatore percentuale, la riga stessa è l'indicatore. A
   caricamento completo le due parole convergono sulla riga, un piccolo
   respiro, poi il preloader sfuma in opacità e viene rimosso dal DOM. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("is-loading");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var preloader = document.getElementById("preloader");
  var wordTop = document.getElementById("preloader-top");
  var wordBottom = document.getElementById("preloader-bottom");
  var lineFill = document.getElementById("preloader-line-fill");
  if (!preloader) { root.classList.remove("is-loading"); return; }

  var hasG = !!window.gsap;

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
    preloader.classList.add("is-hidden");
    setTimeout(function () {
      if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
    }, 700);
  }

  if (reduceMotion || !hasG) {
    setTimeout(finishUp, reduceMotion ? 150 : 350);
    return;
  }

  /* stato iniziale via gsap.set: mai una posizione impostata staticamente via CSS.
     "Bi.Gi." e "Mobili" restano scostati e invisibili per tutta la fase di
     caricamento: l'unico indicatore di avanzamento è la riga che si allunga.
     Le due parole convergono soltanto a caricamento completato, in converge(). */
  gsap.set(wordTop, { y: -26, opacity: 0 });
  gsap.set(wordBottom, { y: 26, opacity: 0 });
  gsap.set(lineFill, { scaleX: 0 });

  /* ---- progresso reale: alcune foto chiave + font ---- */
  var assets = [
    "img/chisiamo-cucina-travi.webp",
    "img/cucina-legno-forno.webp",
    "img/camera-armadio-scrivania.webp",
    "img/boiserie-doghe-madia.webp"
  ];
  var totalAssets = assets.length + 1; /* +1 per i font */
  var loadedAssets = 0;
  var allAssetsLoaded = false;
  var minFloorReached = false;

  function assetDone() {
    loadedAssets++;
    if (loadedAssets >= totalAssets) allAssetsLoaded = true;
  }
  assets.forEach(function (src) {
    var im = new Image();
    im.onload = assetDone; im.onerror = assetDone;
    im.src = src;
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(assetDone).catch(assetDone);
  } else {
    assetDone();
  }
  setTimeout(function () { minFloorReached = true; }, reduceMotion ? 100 : 900);
  var hardCap = setTimeout(function () { allAssetsLoaded = true; minFloorReached = true; }, 4000);

  var target = 0, display = 0, closing = false;

  /* setInterval invece di requestAnimationFrame: rAF può restare sospeso
     a lungo in una tab non visibile (es. aperta in background), mentre
     setInterval continua comunque a scattare (al più rallentato) e
     garantisce che il preloader si concluda sempre. */
  var tickTimer = setInterval(tick, 30);
  function tick() {
    if (closing) return;
    var real = Math.min(96, (loadedAssets / totalAssets) * 96);
    target = (allAssetsLoaded && minFloorReached) ? 100 : Math.max(target, real);
    display += (target - display) * .09;
    if (target === 100 && display > 99.3) display = 100;
    if (lineFill) lineFill.style.transform = "scaleX(" + (display / 100) + ")";
    if (display >= 100) {
      closing = true;
      clearInterval(tickTimer);
      clearTimeout(hardCap);
      converge();
    }
  }

  function converge() {
    var tl = gsap.timeline({ onComplete: outro });
    tl.to(wordTop, { y: 0, opacity: 1, duration: .55, ease: "power3.out" }, 0)
      .to(wordBottom, { y: 0, opacity: 1, duration: .55, ease: "power3.out" }, 0)
      .to([wordTop, wordBottom], {
        scale: 1.02, duration: .22, ease: "power1.inOut", yoyo: true, repeat: 1, transformOrigin: "50% 50%"
      }, ">-0.05");
  }

  function outro() {
    gsap.to(preloader, {
      opacity: 0, duration: .5, ease: "power2.out",
      onComplete: finishUp
    });
  }
})();
