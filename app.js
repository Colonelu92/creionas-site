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
      dl.href = dl.getAttribute("data-base") + "nivel-" + n + "-a4.png";
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

  var p = document.getElementById("printeaza");
  // la printare se foloseste varianta A4 (300 dpi, umple foaia); daca nu s-a incarcat, cade pe imaginea de ecran
  var a4 = document.getElementById("plansa-a4"), ecran = document.getElementById("plansa");
  if (p && a4 && ecran) p.addEventListener("click", function () {
    var src = ecran.src.replace(/\.png$/, "-a4.png");
    if (a4.src === src && a4.complete) { window.print(); return; }
    a4.classList.remove("gata");
    a4.onload = function () { a4.classList.add("gata"); window.print(); };
    a4.onerror = function () { window.print(); };
    a4.src = src;
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
    if (pl && e.target.closest("#printeaza, #descarca")) {
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
