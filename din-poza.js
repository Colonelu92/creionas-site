/* Creionaș – planșă din poză. Poza se micșorează în browser (max 1200 px, JPEG; fără EXIF/GPS),
   utilizatorul trage un cadru în jurul subiectului, apoi se trimite la serverul nostru care întoarce planșa PNG. */
(function () {
  var root = document.getElementById("din-poza");
  if (!root) return;
  var API = root.getAttribute("data-api");
  var q = new URLSearchParams(location.search).get("api");
  if (q && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) API = q;   // doar pentru test local

  var inputs = root.querySelectorAll("input[type=file]");
  var pas2 = document.getElementById("pz-pas2"), pas3 = document.getElementById("pz-pas3");
  var cv = document.getElementById("pz-canvas"), ctx = cv.getContext("2d");
  var btn = document.getElementById("pz-fa"), stare = document.getElementById("pz-stare");
  var rez = document.getElementById("pz-rez"), desc = document.getElementById("pz-desc");
  var TOT = [0, 0, 1, 1], img = null, cadru = TOT, trag = null, blob = null;

  function deseneaza() {
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    if (cadru === TOT) return;
    var x0 = cadru[0] * cv.width, y0 = cadru[1] * cv.height, x1 = cadru[2] * cv.width, y1 = cadru[3] * cv.height;
    ctx.fillStyle = "rgba(255,255,255,.65)";
    ctx.fillRect(0, 0, cv.width, y0); ctx.fillRect(0, y1, cv.width, cv.height - y1);
    ctx.fillRect(0, y0, x0, y1 - y0); ctx.fillRect(x1, y0, cv.width - x1, y1 - y0);
    ctx.strokeStyle = "#FF6B6B"; ctx.lineWidth = Math.max(3, cv.width / 200);
    ctx.setLineDash([12, 8]); ctx.strokeRect(x0, y0, x1 - x0, y1 - y0); ctx.setLineDash([]);
  }

  function incarca(fisier) {
    if (!fisier || !/^image\//.test(fisier.type)) { stare.textContent = "Alege o imagine (JPG, PNG, HEIC)."; return; }
    var u = URL.createObjectURL(fisier), i = new Image();
    i.onload = function () {
      var k = Math.min(1, 1200 / Math.max(i.naturalWidth, i.naturalHeight));
      cv.width = Math.round(i.naturalWidth * k); cv.height = Math.round(i.naturalHeight * k);
      img = i; cadru = TOT; deseneaza();
      // varianta trimisa = imaginea micsorata, fara cadru desenat (canvas separat); canvas-ul scoate EXIF/GPS
      var c2 = document.createElement("canvas"); c2.width = cv.width; c2.height = cv.height;
      c2.getContext("2d").drawImage(i, 0, 0, c2.width, c2.height);
      c2.toBlob(function (b) { blob = b; URL.revokeObjectURL(u); }, "image/jpeg", 0.85);
      pas2.hidden = false; pas3.hidden = true; stare.textContent = "";
      pas2.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    i.onerror = function () { stare.textContent = "Nu am putut deschide imaginea. Încearcă alta (JPG sau PNG)."; };
    i.src = u;
  }
  inputs.forEach(function (inp) { inp.addEventListener("change", function () { incarca(inp.files[0]); inp.value = ""; }); });

  function punct(ev) {
    var r = cv.getBoundingClientRect();
    return [Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height))];
  }
  cv.addEventListener("pointerdown", function (ev) { if (!img) return; cv.setPointerCapture(ev.pointerId); trag = punct(ev); });
  cv.addEventListener("pointermove", function (ev) {
    if (!trag) return;
    var p = punct(ev);
    cadru = [Math.min(trag[0], p[0]), Math.min(trag[1], p[1]), Math.max(trag[0], p[0]), Math.max(trag[1], p[1])];
    deseneaza();
  });
  cv.addEventListener("pointerup", function () {
    trag = null;
    if ((cadru[2] - cadru[0]) < 0.1 || (cadru[3] - cadru[1]) < 0.1) { cadru = TOT; deseneaza(); }
  });

  btn.addEventListener("click", function () {
    if (!blob) return;
    btn.disabled = true; stare.textContent = "Desenez conturul… (câteva secunde)";
    fetch(API + (cadru === TOT ? "" : "?cadru=" + cadru.map(function (x) { return x.toFixed(3); }).join(",")),
          { method: "POST", body: blob, headers: { "Content-Type": "image/jpeg" }, credentials: "omit" })
      .then(function (r) {
        if (r.ok) return r.blob().then(function (b) { return { b: b, ramase: r.headers.get("X-Ramase") }; });
        return r.json().catch(function () { return {}; }).then(function (j) { throw new Error(j.eroare || "Ceva n-a mers. Încearcă din nou."); });
      })
      .then(function (x) {
        var u = URL.createObjectURL(x.b);
        rez.src = u; desc.href = u; pas3.hidden = false;
        var r = x.ramase === null ? null : +x.ramase;
        stare.textContent = r === null ? "Gata!" : r === 0 ? "Gata! A fost ultima planșă de azi."
          : r === 1 ? "Gata! Îți mai rămâne o planșă azi." : "Gata! Îți mai rămân " + r + " planșe azi.";
        pas3.scrollIntoView({ behavior: "smooth", block: "start" });
      })
      .catch(function (e) { stare.textContent = e.message || "Serverul nu răspunde. Încearcă mai târziu."; })
      .then(function () { btn.disabled = false; });
  });
  document.getElementById("pz-print").addEventListener("click", function () { window.print(); });
})();
