/* Landscape parallel: two visible panes, one archived. Drag the labeled notes. */
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
    const n = Number(param("chapter", hash ? hash[1] : "1")) || 1;
    return n;
  }
  function passage() {
    const w = work();
    return D.passages.find((p) => p.work === w.id && String(p.chapter) === String(chapter()));
  }
  function accountKey() {
    return "fg-parallel-layout:" + (localStorage.getItem("fg-user") || "local");
  }
  function defaultLayout() {
    return { visible: ["english", "latin"], archive: "bible" };
  }
  function loadLayout() {
    try {
      const v = JSON.parse(localStorage.getItem(accountKey()) || "null");
      if (v && Array.isArray(v.visible) && v.visible.length === 2 && IDS.indexOf(v.archive) >= 0) {
        const used = v.visible.concat([v.archive]).sort().join(",");
        if (used === IDS.slice().sort().join(",")) return v;
      }
    } catch (e) { /* ignore */ }
    return defaultLayout();
  }
  function saveLayout(layout) {
    localStorage.setItem(accountKey(), JSON.stringify(layout));
  }

  function noteLabel(id) {
    const title = workTitle();
    if (id === "english") return title + " English";
    if (id === "latin") return title + " Latin";
    return "Bible";
  }

  function cardHtml(id) {
    return (
      '<div class="par-card" draggable="false" data-src="' + id + '">' +
      '<span class="par-handle" aria-hidden="true"></span>' +
      '<span class="par-note">' + esc(noteLabel(id)) + "</span>" +
      "</div>"
    );
  }

  function ensureSheet() {
    if (qs("#parSheet")) return;
    document.body.insertAdjacentHTML("beforeend",
      '<div class="par-sheet-back" id="parSheet" hidden>' +
      '<div class="par-sheet" role="dialog" aria-labelledby="parSheetTitle">' +
      '<div class="par-sheet-grab"></div>' +
      '<h2 id="parSheetTitle">Parallel</h2>' +
      '<p class="par-help">Drag a note into Visible to read it. The leftover sits in Not visible.</p>' +
      '<div class="par-board">' +
      '<section class="par-col" aria-label="Visible">' +
      '<h3>Visible</h3>' +
      '<div class="par-slots">' +
      '<div class="par-slot" data-slot="v0"></div>' +
      '<div class="par-slot" data-slot="v1"></div>' +
      "</div></section>" +
      '<section class="par-col par-col-archive" aria-label="Not visible">' +
      "<h3>Not visible</h3>" +
      '<div class="par-slots">' +
      '<div class="par-slot par-slot-archive" data-slot="a0"></div>' +
      "</div></section>" +
      "</div>" +
      '<div class="par-actions">' +
      '<button type="button" class="par-btn par-btn-ghost" id="parOff">Single column</button>' +
      '<button type="button" class="par-btn par-btn-save" id="parSave">Save</button>' +
      "</div></div></div>"
    );
  }

  function paintSheet(layout) {
    qs('[data-slot="v0"]').innerHTML = cardHtml(layout.visible[0]);
    qs('[data-slot="v1"]').innerHTML = cardHtml(layout.visible[1]);
    qs('[data-slot="a0"]').innerHTML = cardHtml(layout.archive);
  }

  function readSheet() {
    return {
      visible: [
        qs('[data-slot="v0"] .par-card').dataset.src,
        qs('[data-slot="v1"] .par-card').dataset.src
      ],
      archive: qs('[data-slot="a0"] .par-card').dataset.src
    };
  }

  function bindDrag() {
    const sheet = qs("#parSheet");
    let drag = null;
    function cardAt(x, y) {
      const el = document.elementFromPoint(x, y);
      return el && el.closest("#parSheet .par-slot");
    }
    sheet.addEventListener("pointerdown", (e) => {
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
    sheet.addEventListener("pointermove", (e) => {
      if (!drag) return;
      drag.card.style.left = (e.clientX - drag.ox) + "px";
      drag.card.style.top = (e.clientY - drag.oy) + "px";
      qsa(".par-slot").forEach((s) => s.classList.remove("over"));
      const over = cardAt(e.clientX, e.clientY);
      if (over) over.classList.add("over");
    });
    function end(e) {
      if (!drag) return;
      const over = cardAt(e.clientX, e.clientY);
      qsa(".par-slot").forEach((s) => s.classList.remove("over"));
      drag.card.classList.remove("dragging");
      drag.card.style.cssText = "";
      if (over && over !== drag.from) {
        const a = drag.from;
        const b = over;
        const ca = a.querySelector(".par-card");
        const cb = b.querySelector(".par-card");
        a.appendChild(cb);
        b.appendChild(ca);
      } else {
        drag.from.appendChild(drag.card);
      }
      drag = null;
    }
    sheet.addEventListener("pointerup", end);
    sheet.addEventListener("pointercancel", end);
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
      '<header class="ios-pane-head"><button type="button" class="ios-pane-note" data-arrange="1">' + esc(label) + "</button></header>" +
      '<div class="ios-pane-body passage">' +
      (heading ? '<h2 class="heading">' + esc(heading) + "</h2>" : "") +
      fatherParas(version) +
      "</div></div>"
    );
  }

  function renderBiblePane(label) {
    const ref = w.FG.KJV.storedRef();
    return (
      '<div class="ios-pane ios-pane-bible" data-kind="bible">' +
      '<header class="ios-pane-head">' +
      '<button type="button" class="ios-pane-note" data-arrange="1">' + esc(label) + "</button>" +
      '<div class="kjv-nav">' +
      '<button type="button" id="kjvPrev" aria-label="Previous chapter">‹</button>' +
      '<select id="kjvBook" aria-label="Bible book"></select>' +
      '<select id="kjvChapter" aria-label="Chapter"></select>' +
      '<button type="button" id="kjvNext" aria-label="Next chapter">›</button>' +
      "</div></header>" +
      '<div class="ios-pane-body passage" id="kjvBody">Loading…</div>' +
      "</div>"
    );
  }

  function fillBibleNav(manifest, ref) {
    const bookSel = qs("#kjvBook");
    const chSel = qs("#kjvChapter");
    if (!bookSel) return;
    bookSel.innerHTML = manifest.map((b) =>
      '<option value="' + b.id + '"' + (b.id === ref.book ? " selected" : "") + ">" + esc(b.name) + "</option>"
    ).join("");
    const meta = manifest.find((b) => b.id === ref.book) || manifest[0];
    const n = meta.chapters;
    const ch = Math.min(Math.max(1, ref.chapter), n);
    chSel.innerHTML = Array.from({ length: n }, (_, i) =>
      '<option value="' + (i + 1) + '"' + (i + 1 === ch ? " selected" : "") + ">" + (i + 1) + "</option>"
    ).join("");
  }

  function paintBibleBody(book) {
    const ref = w.FG.KJV.storedRef();
    const ch = Math.min(Math.max(1, ref.chapter), book.chapters.length);
    const verses = book.chapters[ch - 1] || [];
    qs("#kjvBody").innerHTML = verses.map((v, i) =>
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
      const m = w.FG.KJV;
      m.loadManifest().then((list) => {
        const ref = m.storedRef();
        if (ref.chapter > 1) return go(ref.book, ref.chapter - 1);
        const i = list.findIndex((b) => b.id === ref.book);
        if (i > 0) go(list[i - 1].id, list[i - 1].chapters);
      });
    });
    qs("#kjvNext").addEventListener("click", () => {
      const m = w.FG.KJV;
      m.loadManifest().then((list) => {
        const ref = m.storedRef();
        const meta = list.find((b) => b.id === ref.book);
        if (ref.chapter < meta.chapters) return go(ref.book, ref.chapter + 1);
        const i = list.findIndex((b) => b.id === ref.book);
        if (i < list.length - 1) go(list[i + 1].id, 1);
      });
    });
  }

  function paneFor(id) {
    const label = noteLabel(id);
    if (id === "english") return renderFatherPane("pusey", label);
    if (id === "latin") return renderFatherPane("lat", label);
    return renderBiblePane(label);
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
    const layout = loadLayout();
    dual.innerHTML = paneFor(layout.visible[0]) + paneFor(layout.visible[1]);
    dual.hidden = false;
    single.hidden = true;
    qsa("[data-arrange]").forEach((btn) => btn.addEventListener("click", openArrange));
    if (layout.visible.indexOf("bible") >= 0 && w.FG.KJV) {
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

  let dragBound = false;
  function openArrange() {
    ensureSheet();
    if (!dragBound) { bindDrag(); dragBound = true; }
    paintSheet(loadLayout());
    const back = qs("#parSheet");
    back.hidden = false;
    requestAnimationFrame(() => back.classList.add("open"));
    qs("#parSave").onclick = () => {
      saveLayout(readSheet());
      closeArrange();
      applyPanes();
    };
    qs("#parOff").onclick = () => {
      localStorage.setItem("fg-ios-parallel", "off");
      closeArrange();
      document.body.classList.remove("ios-parallel-on");
      const par = qs("#iosParallel");
      if (par) { par.classList.remove("active"); par.setAttribute("aria-pressed", "false"); }
      applyPanes();
    };
    back.onclick = (e) => { if (e.target.id === "parSheet") closeArrange(); };
  }

  function closeArrange() {
    const back = qs("#parSheet");
    if (!back) return;
    back.classList.remove("open");
    setTimeout(() => { back.hidden = true; }, 220);
  }

  function onParallelTap() {
    const land = document.body.classList.contains("ios-landscape");
    if (!land) return false;
    localStorage.setItem("fg-ios-parallel", "on");
    document.body.classList.add("ios-parallel-on");
    const par = document.querySelector("#iosParallel");
    if (par) {
      par.classList.add("active");
      par.setAttribute("aria-pressed", "true");
    }
    openArrange();
    return true;
  }

  w.FG = w.FG || {};
  w.FG.parallel = {
    openArrange: openArrange,
    applyPanes: applyPanes,
    onParallelTap: onParallelTap
  };
})(window);
