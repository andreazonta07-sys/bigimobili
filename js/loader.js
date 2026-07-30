/* Preloader Bi.Gi. Mobili:
   una sottile riga orizzontale si allunga da 0 a 1 seguendo il
   caricamento reale di font e foto chiave -- nessun contatore
   percentuale, la riga stessa è l'indicatore. A caricamento completo
   quella riga sfuma esattamente nel punto in cui si trova la riga
   dentro al logo vero (img/logo-bigi-mark.webp, ritaglio senza sfondo
   dello stesso logo dell'header): nessuno stiramento o deformazione,
   solo una dissolvenza incrociata nella stessa identica posizione, cosi'
   la riga "diventa" la riga del logo in modo naturale. Infine il
   preloader sfuma in opacità e viene rimosso dal DOM. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("is-loading");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var preloader = document.getElementById("preloader");
  var wordTop = document.getElementById("preloader-top");
  var wordBottom = document.getElementById("preloader-bottom");
  var line = wordTop && wordTop.parentNode ? wordTop.parentNode.querySelector(".loader-line") : null;
  var lineFill = document.getElementById("preloader-line-fill");
  var logo = document.getElementById("preloader-logo");
  var stage = document.getElementById("preloader-stage");
  var pattern = document.getElementById("preloader-pattern");
  if (!preloader) { root.classList.remove("is-loading"); return; }

  /* posizione della riga orizzontale dentro l'immagine reale del logo
     (misurata una volta sui pixel di img/logo-bigi.webp, 750x750):
     serve a tagliare/posizionare il logo esattamente sopra alla riga
     del preloader, cosi' il passaggio riga -> logo non ha alcuno scarto. */
  var LOGO_LINE = { x: 0.0733, w: 0.8667, y: 0.4933, h: 0.0147 };

  var hasG = !!window.gsap;

  var doneFired = false;
  function fireDone() {
    if (doneFired) return;
    doneFired = true;
    window.dispatchEvent(new Event("bigiLoaderDone"));
  }

  function finishUp() {
    root.classList.add("loader-done");
    root.classList.remove("is-loading", "loader-travelling");
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
  if (logo) gsap.set(logo, { opacity: 0 });

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

  /* posiziona e dimensiona il logo vero esattamente sopra alla riga del
     preloader: la riga della foto (LOGO_LINE) deve combaciare pixel per
     pixel con il rettangolo reale di .loader-line, cosi' il morph non ha
     nessuno scarto visibile. */
  function fitLogoOnLine() {
    if (!logo || !line || !stage) return;
    var lineRect = line.getBoundingClientRect();
    var stageRect = stage.getBoundingClientRect();
    var logoW = lineRect.width / LOGO_LINE.w;
    var logoLeft = (lineRect.left - stageRect.left) - LOGO_LINE.x * logoW;
    var lineCenterY = (lineRect.top - stageRect.top) + lineRect.height / 2;
    var logoTop = lineCenterY - (LOGO_LINE.y + LOGO_LINE.h / 2) * logoW;
    logo.style.width = logoW + "px";
    logo.style.height = logoW + "px";
    logo.style.left = logoLeft + "px";
    logo.style.top = logoTop + "px";
  }

  function converge() {
    var tl = gsap.timeline({ onComplete: logo ? travelToLogo : outro });

    /* ---- la barra si "addensa" sullo spessore della riga vera, poi
       quella riga diventa la riga del logo: stesso punto esatto, nessuno
       stiramento del logo stesso, solo dissolvenza incrociata ---- */
    if (logo && line) {
      fitLogoOnLine();
      gsap.set(logo, { opacity: 0, scale: 1 });
      gsap.set(lineFill, { transformOrigin: "50% 50%" });
      tl.to(lineFill, { scaleY: 3.4, duration: .3, ease: "power2.in" }, 0)
        .to(line, { opacity: 0, duration: .35, ease: "power2.inOut" }, .12)
        .to(logo, { opacity: 1, duration: .5, ease: "power2.out" }, .22)
        .to(logo, {
          scale: 1.03, duration: .22, ease: "power1.inOut", yoyo: true, repeat: 1, transformOrigin: "50% 50%"
        }, ">-0.05");
    } else {
      tl.to(wordTop, { y: 0, opacity: 1, duration: .55, ease: "power3.out" }, 0)
        .to(wordBottom, { y: 0, opacity: 1, duration: .55, ease: "power3.out" }, 0)
        .to([wordTop, wordBottom], {
          scale: 1.02, duration: .22, ease: "power1.inOut", yoyo: true, repeat: 1, transformOrigin: "50% 50%"
        }, ">-0.05");
    }
  }

  /* ---- il logo vola dal centro dello schermo fino al suo posto
     nell'header: stesso concept del monogramma che "vola" sul logo
     dell'header nel preloader di dep, qui applicato al logo intero
     (non serve un frammento separato: la riga e' gia' orizzontale come
     nel logo reale, quindi non c'e' nessuna rotazione da fare). ---- */
  function travelToLogo() {
    var headerLogo = document.querySelector(".brand img");
    if (!headerLogo) { outro(); return; }
    var from = logo.getBoundingClientRect();
    var to = headerLogo.getBoundingClientRect();
    if (!to.width) { outro(); return; }

    var scale = to.width / from.width;
    var dx = (to.left + to.width / 2) - (from.left + from.width / 2);
    var dy = (to.top + to.height / 2) - (from.top + from.height / 2);

    gsap.to(preloader, { backgroundColor: "rgba(251, 249, 244, 0)", duration: .5, ease: "power2.out" });
    if (pattern) gsap.to(pattern, { opacity: 0, duration: .4, ease: "power2.out" });
    gsap.to(logo, {
      x: dx, y: dy, scale: scale,
      transformOrigin: "50% 50%",
      duration: .85, ease: "power3.inOut",
      onComplete: finishUp
    });
    root.classList.add("loader-travelling");
    root.classList.remove("is-loading");
  }

  function outro() {
    gsap.to(preloader, {
      opacity: 0, duration: .5, ease: "power2.out",
      onComplete: finishUp
    });
  }
})();
