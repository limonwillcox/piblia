/* Landscape parallel: L and R cycle through enabled sources. Notes is a pane. */
(function (w) {
  const D = w.FG_DATA;
  const ALL = ["english", "latin", "bible", "notes"];

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
  function account() {
    return localStorage.getItem("fg-user") || "local";
  }
  function layoutKey() { return "fg-parallel-layout:" + account(); }
  function enabledKey() { return "fg-parallel-on:" + account(); }
  function notesKey() {
    const wk = work();
    return "fg-notes:" + account() + ":" + (wk ? wk.id : "confessions");
  }

  function enabled() {
    try {
      const v = JSON.parse(localStorage.getItem(enabledKey()) || "null");
      if (Array.isArray(v)) {
        const list = v.filter((id) => ALL.indexOf(id) >= 0);
        if (list.length >= 2) return list;
      }
    } catch (e) { /* ignore */ }
    return ALL.slice();
  }
  function setEnabled(list) {
    const next = list.filter((id) => ALL.indexOf(id) >= 0);
    if (next.length < 2) return enabled();
    localStorage.setItem(enabledKey(), JSON.stringify(next));
    const panes = livePanes();
    const on = next;
    if (on.indexOf(panes.left) < 0) panes.left = on[0];
    if (on.indexOf(panes.right) < 0 || panes.right === panes.left) {
      panes.right = on.find((id) => id !== panes.left) || on[1];
    }
    savePanes(panes);
    return next;
  }
  function defaultPanes() {
    const on = enabled();
    return { left: on[0] || "english", right: on[1] || "latin" };
  }
  function livePanes() {
    try {
      const v = JSON.parse(localStorage.getItem(layoutKey()) || "null");
      const on = enabled();
      if (v && on.indexOf(v.left) >= 0 && on.indexOf(v.right) >= 0 && v.left !== v.right) {
        return { left: v.left, right: v.right };
      }
      if (v && v.left && v.right) {
        return { left: v.left, right: v.right };
      }
    } catch (e) { /* ignore */ }
    return defaultPanes();
  }
  function savePanes(p) {
    localStorage.setItem(layoutKey(), JSON.stringify({ left: p.left, right: p.right }));
  }

  function noteLabel(id) {
    const title = workTitle();
    if (id === "english") return title + " English";
    if (id === "latin") return title + " Latin";
    if (id === "notes") return "Notes";
    return "Bible";
  }

  function wrapWords(escaped, version, chap, paraIndex) {
    let n = 0;
    return escaped.replace(/(\S+)/g, (tok) => {
      const id = version + "-" + chap + "-" + paraIndex + "-" + n++;
      return '<span class="w" data-w="' + id + '">' + tok + "</span>";
    });
  }

  function fatherParas(version) {
    const p = passage();
    if (!p) return '<p class="empty">No text.</p>';
    const paras = (p.versions && p.versions[version]) || [];
    if (!paras.length) return '<p class="empty">No text.</p>';
    return paras.map((text, i) =>
      '<p class="para"><span class="pnum">' + (i + 1) + "</span> " + wrapWords(esc(text), version, p.chapter, i) + "</p>"
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
  function renderNotesPane(label) {
    const saved = localStorage.getItem(notesKey()) || "";
    return (
      '<div class="ios-pane ios-pane-notes" data-kind="notes">' +
      '<header class="ios-pane-head">' +
      '<button type="button" class="ios-pane-note" id="notesToggle">' + esc(label) + "</button>" +
      "</header>" +
      '<div class="ios-pane-body">' +
      '<textarea class="notes-pad" id="notesPad" placeholder="Tap Notes, then write.">' + esc(saved) + "</textarea>" +
      "</div></div>"
    );
  }
  function paneFor(id) {
    const label = noteLabel(id);
    if (id === "english") return renderFatherPane("pusey", label);
    if (id === "latin") return renderFatherPane("lat", label);
    if (id === "notes") return renderNotesPane(label);
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
  function bindNotes() {
    const pad = qs("#notesPad");
    const tog = qs("#notesToggle");
    if (!pad) return;
    pad.addEventListener("input", () => localStorage.setItem(notesKey(), pad.value));
    if (tog && !tog.dataset.bound) {
      tog.dataset.bound = "1";
      tog.addEventListener("click", () => {
        if (document.activeElement === pad) pad.blur();
        else pad.focus();
      });
    }
  }

  function restoreHl() {
    const wk = work();
    if (!wk) return;
    try {
      const map = JSON.parse(localStorage.getItem("fg-hl-" + wk.id) || "{}");
      Object.keys(map).forEach((k) => {
        const el = document.querySelector('.w[data-w="' + k + '"]');
        if (el) el.classList.add(map[k]);
      });
    } catch (e) { /* ignore */ }
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
    const bar = qs("#hlBar");
    if (bar) page.appendChild(bar);
    restoreHl();
    bindNotes();
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

  function cycle(side) {
    const panes = livePanes();
    const other = side === "left" ? panes.right : panes.left;
    const pool = enabled().filter((id) => id !== other);
    if (!pool.length) return;
    const cur = panes[side];
    const i = pool.indexOf(cur);
    const next = pool[(i + 1) % pool.length];
    if (side === "left") panes.left = next;
    else panes.right = next;
    savePanes(panes);
    applyPanes();
  }

  function paintSettings() {
    const host = qs("#parLayout");
    if (!host) return;
    const on = enabled();
    const labels = { english: "English", latin: "Latin", bible: "Bible", notes: "Notes" };
    host.innerHTML =
      '<p class="par-help">Turn on the panes you want in the cycle. Each half of the screen skips whatever the other half is showing.</p>' +
      ALL.map((id) => {
        const isOn = on.indexOf(id) >= 0;
        return '<div class="set-row"><span>' + esc(labels[id]) + '</span>' +
          '<button type="button" class="switch' + (isOn ? " on" : "") + '" data-src="' + id + '" aria-pressed="' + isOn + '"></button></div>';
      }).join("");
    qsa("#parLayout [data-src]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.src;
        let list = enabled().slice();
        const i = list.indexOf(id);
        if (i >= 0) {
          if (list.length <= 2) return;
          list.splice(i, 1);
        } else list.push(id);
        list = ALL.filter((x) => list.indexOf(x) >= 0);
        setEnabled(list);
        paintSettings();
      });
    });
  }

  function onParallelTap() {
    if (!document.body.classList.contains("ios-landscape")) return false;
    const next = localStorage.getItem("fg-ios-parallel") === "on" ? "off" : "on";
    localStorage.setItem("fg-ios-parallel", next);
    document.body.classList.toggle("ios-parallel-on", next === "on");
    applyPanes();
    return true;
  }

  w.FG = w.FG || {};
  w.FG.parallel = {
    applyPanes: applyPanes,
    onParallelTap: onParallelTap,
    cycle: cycle,
    mountSettings: paintSettings
  };
})(window);
