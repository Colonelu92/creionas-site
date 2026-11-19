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
