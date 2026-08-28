/* Landscape parallel: left pane is permanent. Right swaps with archive. */
(function (w) {
  const D = w.FG_DATA;
  const IDS = ["english", "latin", "bible"];

  function qs(sel, el) { return (el || document).querySelector(sel); }
  function qsa(sel, el) { return Array.from((el || document).querySelectorAll(sel)); }
  function param(name, fallback) {
    const v = new URLSearchParams(location.search).get(name);
    return v == null || v === "" ? fallback : v;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&" + "amp;")
      .replace(/</g, "&" + "lt;")
      .replace(/>/g, "&" + "gt;")
      .replace(/"/g, "&" + "quot;");
  }

  function work() {
    return D.works.find((x) => x.id === param("work", "confessions")) || D.works[0];
  }
  function workTitle() {
    const t = work();
    return t ? t.title.replace(/^The\s+/i, "") : "Work";
  }
  function chapter() {
    const hash = (location.hash || "").match(/ch-(\d+)/);
    return Number(param("chapter", hash ? hash[1] : "1")) || 1;
  }
  function passage() {
    const wk = work();
    return D.passages.find((p) => p.work === wk.id && String(p.chapter) === String(chapter()));
  }
  function accountKey() {
    return "fg-parallel-layout:" + (localStorage.getItem("fg-user") || "local");
  }
  function defaultLayout() {
    return { left: "english", right: "latin", archive: "bible" };
  }
  function normalize(v) {
    if (!v) return null;
    if (v.left && v.right && v.archive) {
      const used = [v.left, v.right, v.archive].sort().join(",");
      if (used === IDS.slice().sort().join(",")) return { left: v.left, right: v.right, archive: v.archive };
    }
    if (Array.isArray(v.visible) && v.visible.length === 2 && v.archive) {
      return { left: v.visible[0], right: v.visible[1], archive: v.archive };
    }
    return null;
  }
  function loadLayout() {
    try {
      const n = normalize(JSON.parse(localStorage.getItem(accountKey()) || "null"));
      if (n) return n;
    } catch (e) { /* ignore */ }
    return defaultLayout();
  }
  function saveLayout(layout) {
    localStorage.setItem(accountKey(), JSON.stringify(layout));
    localStorage.setItem("fg-parallel-swapped", "off");
  }
  function swapped() {
    return localStorage.getItem("fg-parallel-swapped") === "on";
  }
  function setSwapped(on) {
    localStorage.setItem("fg-parallel-swapped", on ? "on" : "off");
  }
  function livePanes() {
    const L = loadLayout();
    return {
      left: L.left,
      right: swapped() ? L.archive : L.right
    };
  }

  function noteLabel(id) {
    const title = workTitle();
    if (id === "english") return title + " English";
    if (id === "latin") return title + " Latin";
    return "Bible";
  }
  function cardHtml(id) {
    return (
      '<div class="par-card" data-src="' + id + '">' +
      '<span class="par-handle" aria-hidden="true"></span>' +
      '<span class="par-note">' + esc(noteLabel(id)) + "</span></div>"
    );
  }

  function fatherParas(version) {
    const p = passage();
    if (!p) return '<p class="empty">No text.</p>';
    const paras = (p.versions && p.versions[version]) || [];
    if (!paras.length) return '<p class="empty">No text.</p>';
    return paras.map((text, i) =>
      '<p class="para"><span class="pnum">' + (i + 1) + "</span> " + esc(text) + "</p>"
    ).join("");
  }
  function renderFatherPane(version, label) {
    const p = passage();
    const heading = p && p.heading ? p.heading : "";
    return (
      '<div class="ios-pane" data-kind="' + version + '">' +
      '<header class="ios-pane-head"><div class="ios-pane-note">' + esc(label) + "</div></header>" +
      '<div class="ios-pane-body passage">' +
      (heading ? '<h2 class="heading">' + esc(heading) + "</h2>" : "") +
      fatherParas(version) +
      "</div></div>"
    );
  }
  function renderBiblePane(label) {
    return (
      '<div class="ios-pane ios-pane-bible" data-kind="bible">' +
      '<header class="ios-pane-head">' +
      '<div class="ios-pane-note">' + esc(label) + "</div>" +
      '<div class="kjv-nav">' +
      '<button type="button" id="kjvPrev" aria-label="Previous chapter">‹</button>' +
      '<select id="kjvBook" aria-label="Bible book"></select>' +
      '<select id="kjvChapter" aria-label="Chapter"></select>' +
      '<button type="button" id="kjvNext" aria-label="Next chapter">›</button>' +
      "</div></header>" +
      '<div class="ios-pane-body passage" id="kjvBody">Loading…</div></div>'
    );
  }
  function paneFor(id) {
    const label = noteLabel(id);
    if (id === "english") return renderFatherPane("pusey", label);
    if (id === "latin") return renderFatherPane("lat", label);
    return renderBiblePane(label);
  }

  function fillBibleNav(manifest, ref) {
    const bookSel = qs("#kjvBook");
    const chSel = qs("#kjvChapter");
    if (!bookSel) return;
    bookSel.innerHTML = manifest.map((b) =>
      '<option value="' + b.id + '"' + (b.id === ref.book ? " selected" : "") + ">" + esc(b.name) + "</option>"
    ).join("");
    const meta = manifest.find((b) => b.id === ref.book) || manifest[0];
    const ch = Math.min(Math.max(1, ref.chapter), meta.chapters);
    chSel.innerHTML = Array.from({ length: meta.chapters }, (_, i) =>
      '<option value="' + (i + 1) + '"' + (i + 1 === ch ? " selected" : "") + ">" + (i + 1) + "</option>"
    ).join("");
  }
  function paintBibleBody(book) {
    const ref = w.FG.KJV.storedRef();
    const ch = Math.min(Math.max(1, ref.chapter), book.chapters.length);
    qs("#kjvBody").innerHTML = (book.chapters[ch - 1] || []).map((v, i) =>
      '<p class="para"><span class="pnum">' + (i + 1) + "</span> " + esc(v) + "</p>"
    ).join("");
  }
  function bindBible() {
    const bookSel = qs("#kjvBook");
    if (!bookSel || bookSel.dataset.bound) return;
    bookSel.dataset.bound = "1";
    function go(book, ch) {
      w.FG.KJV.setRef(book, ch);
      w.FG.KJV.loadManifest().then((m) => {
        fillBibleNav(m, { book: book, chapter: ch });
        return w.FG.KJV.loadBook(book);
      }).then(paintBibleBody);
    }
    bookSel.addEventListener("change", () => go(bookSel.value, 1));
    qs("#kjvChapter").addEventListener("change", () => go(bookSel.value, Number(qs("#kjvChapter").value)));
    qs("#kjvPrev").addEventListener("click", () => {
      w.FG.KJV.loadManifest().then((list) => {
        const ref = w.FG.KJV.storedRef();
        if (ref.chapter > 1) return go(ref.book, ref.chapter - 1);
        const i = list.findIndex((b) => b.id === ref.book);
        if (i > 0) go(list[i - 1].id, list[i - 1].chapters);
      });
    });
    qs("#kjvNext").addEventListener("click", () => {
      w.FG.KJV.loadManifest().then((list) => {
        const ref = w.FG.KJV.storedRef();
        const meta = list.find((b) => b.id === ref.book);
        if (ref.chapter < meta.chapters) return go(ref.book, ref.chapter + 1);
        const i = list.findIndex((b) => b.id === ref.book);
        if (i < list.length - 1) go(list[i + 1].id, 1);
      });
    });
  }

  function applyPanes() {
    const page = qs("#page");
    if (!page) return;
    const on = localStorage.getItem("fg-ios-parallel") === "on" && document.body.classList.contains("ios-landscape");
    let dual = qs("#iosDualRead");
    let single = qs("#iosSingleRead");
    if (!single) {
      single = document.createElement("div");
      single.id = "iosSingleRead";
      while (page.firstChild) single.appendChild(page.firstChild);
      page.appendChild(single);
    }
    if (!dual) {
      dual = document.createElement("div");
      dual.id = "iosDualRead";
      dual.hidden = true;
      page.appendChild(dual);
    }
    if (!on) {
      dual.hidden = true;
      dual.innerHTML = "";
      single.hidden = false;
      return;
    }
    const panes = livePanes();
    dual.innerHTML = paneFor(panes.left) + paneFor(panes.right);
    dual.hidden = false;
    single.hidden = true;
    if ((panes.left === "bible" || panes.right === "bible") && w.FG.KJV) {
      const ref = w.FG.KJV.storedRef();
      w.FG.KJV.loadManifest().then((m) => {
        fillBibleNav(m, ref);
        bindBible();
        return w.FG.KJV.loadBook(ref.book);
      }).then(paintBibleBody).catch(() => {
        const body = qs("#kjvBody");
        if (body) body.textContent = "The KJV file did not load.";
      });
    }
  }

  function paintSettings() {
    const host = qs("#parLayout");
    if (!host) return;
    const L = loadLayout();
    host.innerHTML =
      '<div class="par-board par-board-settings">' +
      slotCol("Left pane — stays put", "left", L.left) +
      slotCol("Right pane", "right", L.right) +
      slotCol("Not visible", "archive", L.archive) +
      "</div>";
    bindSettingsDrag(host);
  }
  function slotCol(title, key, id) {
    return (
      '<section class="par-col" aria-label="' + esc(title) + '">' +
      "<h3>" + esc(title) + "</h3>" +
      '<div class="par-slot" data-key="' + key + '">' + cardHtml(id) + "</div></section>"
    );
  }
  function readSettings() {
    return {
      left: qs('#parLayout [data-key="left"] .par-card').dataset.src,
      right: qs('#parLayout [data-key="right"] .par-card').dataset.src,
      archive: qs('#parLayout [data-key="archive"] .par-card').dataset.src
    };
  }
  function bindSettingsDrag(host) {
    let drag = null;
    function slotAt(x, y) {
      const el = document.elementFromPoint(x, y);
      return el && el.closest("#parLayout .par-slot");
    }
    host.addEventListener("pointerdown", (e) => {
      const card = e.target.closest(".par-card");
      if (!card) return;
      const slot = card.closest(".par-slot");
      drag = {
        card: card,
        from: slot,
        ox: e.clientX - card.getBoundingClientRect().left,
        oy: e.clientY - card.getBoundingClientRect().top
      };
      card.classList.add("dragging");
      card.style.pointerEvents = "none";
      card.style.width = card.getBoundingClientRect().width + "px";
      card.style.position = "fixed";
      card.style.zIndex = "120";
      card.style.left = (e.clientX - drag.ox) + "px";
      card.style.top = (e.clientY - drag.oy) + "px";
      card.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    host.addEventListener("pointermove", (e) => {
      if (!drag) return;
      drag.card.style.left = (e.clientX - drag.ox) + "px";
      drag.card.style.top = (e.clientY - drag.oy) + "px";
      qsa("#parLayout .par-slot").forEach((s) => s.classList.remove("over"));
      const over = slotAt(e.clientX, e.clientY);
      if (over) over.classList.add("over");
    });
    function end(e) {
      if (!drag) return;
      const over = slotAt(e.clientX, e.clientY);
      qsa("#parLayout .par-slot").forEach((s) => s.classList.remove("over"));
      drag.card.classList.remove("dragging");
      drag.card.style.cssText = "";
      if (over && over !== drag.from) {
        const ca = drag.from.querySelector(".par-card");
        const cb = over.querySelector(".par-card");
        drag.from.appendChild(cb);
        over.appendChild(ca);
        saveLayout(readSettings());
      } else {
        drag.from.appendChild(drag.card);
      }
      drag = null;
    }
    host.addEventListener("pointerup", end);
    host.addEventListener("pointercancel", end);
  }

  function onParallelTap() {
    if (!document.body.classList.contains("ios-landscape")) return false;
    const next = localStorage.getItem("fg-ios-parallel") === "on" ? "off" : "on";
    localStorage.setItem("fg-ios-parallel", next);
    document.body.classList.toggle("ios-parallel-on", next === "on");
    applyPanes();
    return true;
  }
  function onSwapTap() {
    if (localStorage.getItem("fg-ios-parallel") !== "on") return false;
    setSwapped(!swapped());
    applyPanes();
    return true;
  }

  w.FG = w.FG || {};
  w.FG.parallel = {
    applyPanes: applyPanes,
    onParallelTap: onParallelTap,
    onSwapTap: onSwapTap,
    swapped: swapped,
    mountSettings: paintSettings
  };
})(window);
