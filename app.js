// Creionaș — nivelul preferat (1-4) se aplica pe toate plansele afisate.
(function () {
  var KEY = "creionas-nivel";
  function citeste() { try { return parseInt(localStorage.getItem(KEY), 10) || 0; } catch (e) { return 0; } }
  function scrie(n) { try { localStorage.setItem(KEY, String(n)); } catch (e) {} }

  function aplica(n, scope) {
    scope = scope || document;
    scope.querySelectorAll("img[data-base]").forEach(function (img) {
      var thumb = img.hasAttribute("data-thumb");
      img.src = img.getAttribute("data-base") + "nivel-" + n + (thumb ? "-mic" : "") + ".png";
    });
    scope.querySelectorAll("[data-nivel]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(+b.getAttribute("data-nivel") === n));
    });
    var dl = document.getElementById("descarca");
    if (dl) {
      dl.href = dl.getAttribute("data-base") + "nivel-" + n + ".png";
      dl.setAttribute("download", dl.getAttribute("data-nume") + "-nivel-" + n + ".png");
    }
  }

  // demo din hero: trece singur prin niveluri pana la primul click
  var demo = document.querySelector("[data-demo]");
  if (demo) {
    var imgs = demo.querySelectorAll(".stage img"), cur = 1, timer;
    var arata = function (n) {
      cur = n;
      imgs.forEach(function (im, i) { im.style.opacity = i < n ? 1 : 0; });
      demo.querySelectorAll("[data-demo-nivel]").forEach(function (b) {
        b.setAttribute("aria-pressed", String(+b.getAttribute("data-demo-nivel") === n));
      });
    };
    timer = setInterval(function () { arata(cur % 4 + 1); }, 1800);
    demo.querySelectorAll("[data-demo-nivel]").forEach(function (b) {
      b.addEventListener("click", function () { clearInterval(timer); arata(+b.getAttribute("data-demo-nivel")); });
    });
    arata(1);
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-nivel]");
    if (!b) return;
    var n = +b.getAttribute("data-nivel");
    scrie(n);
    aplica(n);
    if (b.hasAttribute("data-mergi")) { var t = document.getElementById("teme"); if (t) t.scrollIntoView({ behavior: "smooth" }); }
  });

  // Varianta A4 (300 dpi, umple foaia) se face in browser din imaginea de ecran: decupare pe contur, marire,
  // netezire si prag (aceeasi reteta ca vechiul export din construieste_site.py). Fara fisiere -a4.png pe server.
  var A4W = 2244, A4H = 3272, cacheA4 = {};
  function faA4(src, cb) {
    if (cacheA4[src]) return cb(cacheA4[src]);
    var im = new Image();
    im.onload = function () {
      try {
        var w = im.naturalWidth, h = im.naturalHeight, c = document.createElement("canvas");
        c.width = w; c.height = h; var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0);
        var d = x.getImageData(0, 0, w, h).data, x0 = w, y0 = h, x1 = -1, y1 = -1;
        for (var y = 0; y < h; y++) for (var i = 0; i < w; i++) if (d[(y * w + i) * 4] <= 200) {
          if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 < 0) { x0 = 0; y0 = 0; x1 = w - 1; y1 = h - 1; }
        var cw = x1 - x0 + 1, ch = y1 - y0 + 1, f = Math.min(A4W * 0.94 / cw, A4H * 0.94 / ch);
        var dw = Math.round(cw * f), dh = Math.round(ch * f);
        var o = document.createElement("canvas"); o.width = A4W; o.height = A4H;
        var ox = o.getContext("2d"); ox.fillStyle = "#fff"; ox.fillRect(0, 0, A4W, A4H);
        ox.imageSmoothingEnabled = true; ox.imageSmoothingQuality = "high";
        if ("filter" in ox) ox.filter = "blur(" + (f * 0.55).toFixed(2) + "px)";
        ox.drawImage(c, x0, y0, cw, ch, Math.round((A4W - dw) / 2), Math.round((A4H - dh) / 2), dw, dh);
        ox.filter = "none";
        var px = ox.getImageData(0, 0, A4W, A4H), p2 = px.data;
        for (var k = 0; k < p2.length; k += 4) {
          var v = p2[k], g = v < 110 ? 0 : v > 170 ? 255 : (v - 110) * 4.25;
          p2[k] = p2[k + 1] = p2[k + 2] = g; p2[k + 3] = 255;
        }
        ox.putImageData(px, 0, 0);
        o.toBlob(function (b) { if (!b) return cb(null); cacheA4[src] = URL.createObjectURL(b); cb(cacheA4[src]); }, "image/png");
      } catch (e) { cb(null); }
    };
    im.onerror = function () { cb(null); };
    im.src = src;
  }

  var p = document.getElementById("printeaza");
  var a4 = document.getElementById("plansa-a4"), ecran = document.getElementById("plansa");
  if (p && a4 && ecran) p.addEventListener("click", function () {
    p.disabled = true;
    faA4(ecran.src, function (u) {
      p.disabled = false;
      if (!u) { window.print(); return; }
      if (a4.src === u && a4.complete) { window.print(); return; }
      a4.classList.remove("gata");
      a4.onload = function () { a4.classList.add("gata"); window.print(); };
      a4.onerror = function () { window.print(); };
      a4.src = u;
    });
  });
  var dl = document.getElementById("descarca");
  if (dl && ecran) dl.addEventListener("click", function (ev) {
    if (dl.hasAttribute("data-gata")) { dl.removeAttribute("data-gata"); return; }   // al doilea click = descarcarea propriu-zisa
    ev.preventDefault();
    var nume = dl.getAttribute("download");
    faA4(ecran.src, function (u) {
      if (u) dl.href = u;                 // daca A4 nu se poate face, se descarca imaginea de ecran
      dl.setAttribute("download", nume);
      dl.setAttribute("data-gata", ""); dl.click();
      setTimeout(function () { dl.href = ecran.src; }, 1000);
    });
  });

  // variante pe pagina planșei: schimba desenul principal (nivelul ramane)
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-varianta]");
    if (!b || !ecran) return;
    var base = b.getAttribute("data-varianta");
    ecran.setAttribute("data-base", base);
    if (dl) dl.setAttribute("data-base", base);
    document.querySelectorAll("[data-varianta]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    var k = (base.match(/\/v(\d+)\/$/) || [, 1])[1];
    if (dl) dl.setAttribute("data-nume", dl.getAttribute("data-nume").replace(/-v\d+$/, "") + (k > 1 ? "-v" + k : ""));
    aplica(citeste() || 3);
    ecran.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // Google Analytics 4: se incarca DOAR dupa „Accept" (consent mode v2, varianta de baza)
  var CK = "creionas-cookie", GA = document.body.getAttribute("data-ga");
  function cookieCiteste() { try { return localStorage.getItem(CK); } catch (e) { return null; } }
  function cookieScrie(v) { try { localStorage.setItem(CK, v); } catch (e) {} }
  function pornesteGA() {
    if (!GA || window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" });
    gtag("js", new Date());
    gtag("config", GA);
    var s = document.createElement("script"); s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA; document.head.appendChild(s);
  }
  function eveniment(nume, date) { if (window.gtag) gtag("event", nume, date); }
  // contor propriu (VPS), fara cookie si fara IP: numara toti vizitatorii, nu doar pe cei care accepta GA
  function numara(ev, n) {
    try { fetch("https://dashboard.3donemodels.com/creionas/c?e=" + ev + "&p=" + encodeURIComponent(location.pathname) + "&n=" + (n || ""),
                { mode: "no-cors", keepalive: true, credentials: "omit" }).catch(function () {}); } catch (e) {}
  }
  var banner = document.getElementById("cookie");
  if (cookieCiteste() === "da") pornesteGA(); else if (!cookieCiteste() && banner) banner.hidden = false;
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-cookie-alege]");
    if (a) {
      var v = a.getAttribute("data-cookie-alege"); cookieScrie(v); banner.hidden = true;
      if (v === "da") pornesteGA(); else if (window.gtag) location.reload();
    }
    if (e.target.closest("[data-cookie]") && banner) banner.hidden = false;
    var pl = document.getElementById("plansa");
    if (pl && e.isTrusted && e.target.closest("#printeaza, #descarca")) {
      numara(e.target.closest("#printeaza") ? "p" : "d", (pl.src.match(/nivel-(\d)/) || [])[1]);
      eveniment(e.target.closest("#printeaza") ? "printare_plansa" : "descarcare_plansa",
        { plansa: location.pathname, nivel: (pl.src.match(/nivel-(\d)/) || [])[1] });
    }
  });

  if (document.getElementById("plansa")) numara("v", "");

  var start = citeste() || +(document.body.getAttribute("data-nivel-implicit") || 3);
  aplica(start);

  // pagina de cautare
  var rez = document.getElementById("rezultate");
  if (rez) {
    var norm = function (s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
    var q = new URLSearchParams(location.search).get("q") || "";
    var inp = document.getElementById("q"); inp.value = q;
    fetch("/cauta.json").then(function (r) { return r.json(); }).then(function (date) {
      var cauta = function () {
        var t = norm(inp.value.trim()), n = citeste() || 3;
        var gasite = t ? date.filter(function (d) { return norm(d.t + " " + d.c).indexOf(t) >= 0; }) : [];
        document.getElementById("nr").textContent = t ? gasite.length + " planșe găsite" : "";
        rez.innerHTML = gasite.map(function (d) {
          return '<a class="card" href="' + d.u + '"><div class="pic"><img loading="lazy" data-thumb data-base="' + d.b +
            '" src="' + d.b + "nivel-" + n + '-mic.png" alt="' + d.t + '"></div><h3>' + d.t + "</h3><small>" + d.c + "</small></a>";
        }).join("") || (t ? '<p class="empty">N-am găsit nimic. Încearcă „dinozaur”, „pisică” sau „Crăciun”.</p>' : "");
      };
      inp.addEventListener("input", cauta);
      cauta();
    });
  }
})();
