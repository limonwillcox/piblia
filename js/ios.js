/* Phone chrome: YouVersion-style top bar + bottom tabs. Desktop layout is unchanged. */
(function (w) {
  const D = w.FG_DATA;
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII"];

  const ICO = {
    read: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h7a3 3 0 0 1 3 3v13H7a3 3 0 0 0-3-3V5z"/><path d="M20 5h-7a3 3 0 0 0-3 3v13h7a3 3 0 0 1 3-3V5z"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="M20 20l-3.2-3.2"/></svg>',
    about: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 8h.01"/></svg>',
    give: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.2 6.2l1.4 1.4M16.4 16.4l1.4 1.4M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4"/></svg>',
    parallel: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="7.5" height="14" rx="1.2"/><rect x="13" y="5" width="7.5" height="14" rx="1.2"/></svg>',
    chi: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2v17.6"/><path d="M12 3.4h3.2c2.2 0 3.6 1.3 3.6 3.4S17.4 10.2 15.2 10.2H12"/><path d="M6.2 7.2l11.6 11.6M17.8 7.2L6.2 18.8"/></svg>',
    chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg>',
    crossEmpty: '<svg class="cross-empty" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M8 8h8"/></svg>',
    crossFilled: '<svg class="cross-filled" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.2 3.2h3.6v4.4h5.2v3.4h-5.2v9.8h-3.6v-9.8H5v-3.4h5.2z"/></svg>'
  };

  function qs(sel, el) { return (el || document).querySelector(sel); }
  function qsa(sel, el) { return Array.from((el || document).querySelectorAll(sel)); }
  function param(name, fallback) {
    const v = new URLSearchParams(location.search).get(name);
    return v == null || v === "" ? fallback : v;
  }
  function isPhone() {
    return window.matchMedia("(max-width: 760px), (orientation: landscape) and (max-height: 520px)").matches
      || /iPhone|iPod|Android.+Mobile/i.test(navigator.userAgent);
  }
  function isLandscape() {
    return window.matchMedia("(orientation: landscape) and (max-height: 520px)").matches
      || (isPhone() && window.innerWidth > window.innerHeight);
  }
  function roman(n) { return ROMAN[n - 1] || String(n); }
  function liberLabel(n) { return "Liber " + roman(n); }
  function fatherShort(author) {
    if (!author) return "Father";
    const of = author.name.split(/\s+of\s+/i);
    if (of.length > 1) return of[0];
    return author.name.split(/\s+/)[0];
  }
  function workShort(work) {
    if (!work) return "Work";
    return (work.short && work.short !== "Conf.") ? work.short.replace(/\.$/, "") : work.title.replace(/^The\s+/i, "");
  }
  function workById(id) { return D.works.find((x) => x.id === id); }
  function authorById(id) { return D.authors.find((x) => x.id === id); }
  function storedMode() { return localStorage.getItem("fg-mode") === "original" ? "original" : "translation"; }
  function parallelOn() { return localStorage.getItem("fg-ios-parallel") === "on"; }
  function focusOn() { return localStorage.getItem("fg-focus") === "on"; }

  function currentContext() {
    const workId = param("work", "confessions");
    const work = workById(workId) || D.works[0];
    const author = work ? authorById(work.author) : D.authors[0];
    let chapter = Number(param("chapter", "0")) || 0;
    const hash = (location.hash || "").match(/ch-(\d+)/);
    if (hash) chapter = Number(hash[1]);
    if (!chapter) chapter = 1;
    return { work, author, chapter };
  }

  function tabs(active) {
    const items = [
      ["read.html?work=confessions", "read", "Read", active === "read" || active === "home"],
      ["search.html", "search", "Search", active === "search"],
      ["about.html", "about", "About", active === "about"],
      ["give.html", "give", "Give", active === "give"],
      ["settings.html", "settings", "Settings", active === "settings"]
    ];
    return (
      '<nav class="ios-tabbar" aria-label="Primary">' +
      items.map(([href, icon, label, on]) =>
        '<a class="ios-tab' + (on ? " active" : "") + '" href="' + href + '">' + ICO[icon] + "<span>" + label + "</span></a>"
      ).join("") +
      "</nav>"
    );
  }

  function topbar(page) {
    const ctx = currentContext();
    const latin = storedMode() === "original";
    const par = parallelOn();
    const focus = focusOn();
    const showLoc = page === "read" || page === "home";
    return (
      '<header class="ios-topbar">' +
      '<div class="ios-loc"' + (showLoc ? "" : " hidden") + ">" +
      '<button type="button" class="ios-pill" id="iosAuthor" aria-haspopup="listbox">' +
      '<span>' + escapeHtml(fatherShort(ctx.author)) + "</span>" + ICO.chev + "</button>" +
      '<button type="button" class="ios-pill" id="iosWork">' +
      '<span>' + escapeHtml(workShort(ctx.work)) + "</span>" + ICO.chev + "</button>" +
      '<button type="button" class="ios-pill" id="iosSection">' +
      '<span>' + escapeHtml(liberLabel(ctx.chapter)) + "</span>" + ICO.chev + "</button>" +
      '<button type="button" class="ios-icon' + (latin ? " active" : "") + '" id="iosChi" title="Latin" aria-label="Toggle Latin" aria-pressed="' + latin + '">' + ICO.chi + "</button>" +
      '<button type="button" class="ios-icon' + (par ? " active" : "") + '" id="iosParallel" title="Parallel" aria-label="Parallel reading" aria-pressed="' + par + '">' + ICO.parallel + "</button>" +
      "</div>" +
      '<button type="button" class="ios-focus-btn' + (focus ? " on" : "") + '" id="iosFocus" title="Focus mode" aria-label="Focus mode" aria-pressed="' + focus + '">' +
      ICO.crossEmpty + ICO.crossFilled +
      "</button>" +
      "</header>"
    );
  }

  function sheet() {
    return (
      '<div class="ios-sheet-back" id="iosSheet" hidden>' +
      '<div class="ios-sheet" role="dialog" aria-labelledby="iosSheetTitle">' +
      '<div class="ios-sheet-grab"></div>' +
      '<div class="ios-sheet-head"><h2 id="iosSheetTitle"></h2>' +
      '<button type="button" class="ios-sheet-close" id="iosSheetClose" aria-label="Close">Done</button></div>' +
      '<div class="ios-sheet-body" id="iosSheetBody"></div>' +
      "</div></div>" +
      '<div class="ios-toast" id="iosToast" hidden></div>'
    );
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg) {
    const el = qs("#iosToast");
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    el.classList.add("open");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      el.classList.remove("open");
      el.hidden = true;
    }, 2400);
  }

  function openSheet(title, html) {
    const back = qs("#iosSheet");
    qs("#iosSheetTitle").textContent = title;
    qs("#iosSheetBody").innerHTML = html;
    back.hidden = false;
    requestAnimationFrame(() => back.classList.add("open"));
  }
  function closeSheet() {
    const back = qs("#iosSheet");
    if (!back) return;
    back.classList.remove("open");
    setTimeout(() => { back.hidden = true; }, 220);
  }

  function openAuthors() {
    const authors = D.authors.slice().sort((a, b) => a.name.localeCompare(b.name));
    const ctx = currentContext();
    openSheet("Church Fathers", authors.map((a) =>
      '<button type="button" class="ios-row' + (ctx.author && a.id === ctx.author.id ? " active" : "") + '" data-pick-author="' + a.id + '">' +
      "<strong>" + escapeHtml(a.name) + "</strong>" +
      '<span class="meta">' + escapeHtml(a.dates) + " · " + escapeHtml(a.region) + "</span></button>"
    ).join("") || '<p class="ios-empty">No fathers in the library yet.</p>');
  }

  function openWorks(authorId) {
    const author = authorById(authorId) || currentContext().author;
    const works = D.works.filter((w) => w.author === author.id);
    const ctx = currentContext();
    openSheet(fatherShort(author), works.map((w) =>
      '<a class="ios-row' + (ctx.work && w.id === ctx.work.id ? " active" : "") + '" href="read.html?work=' + encodeURIComponent(w.id) + '">' +
      "<strong>" + escapeHtml(w.title) + "</strong>" +
      '<span class="meta">' + w.chapters + " libri</span></a>"
    ).join(""));
  }

  function openSections() {
    const ctx = currentContext();
    const n = ctx.work ? ctx.work.chapters : 13;
    const rows = [];
    for (let i = 1; i <= n; i++) {
      rows.push(
        '<a class="ios-row' + (i === ctx.chapter ? " active" : "") + '" href="read.html?work=' + encodeURIComponent(ctx.work.id) + "&chapter=" + i + "#ch-" + i + '">' +
        "<strong>" + escapeHtml(liberLabel(i)) + "</strong></a>"
      );
    }
    openSheet(workShort(ctx.work), rows.join(""));
  }

  function applyShellState() {
    const phone = isPhone();
    const land = isLandscape();
    const focus = focusOn();
    document.body.classList.toggle("ios-shell", phone);
    document.body.classList.toggle("ios-landscape", phone && land);
    document.body.classList.toggle("ios-focus", phone && focus);
    document.body.classList.toggle("ios-latin", storedMode() === "original");
    document.body.classList.toggle("ios-parallel-on", parallelOn());
    const btn = qs("#iosFocus");
    if (btn) {
      btn.classList.toggle("on", focus);
      btn.setAttribute("aria-pressed", focus);
    }
    const chi = qs("#iosChi");
    if (chi) {
      const on = storedMode() === "original";
      chi.classList.toggle("active", on);
      chi.setAttribute("aria-pressed", on);
    }
    const par = qs("#iosParallel");
    if (par) {
      par.classList.toggle("active", parallelOn());
      par.setAttribute("aria-pressed", parallelOn());
    }
  }

  function setSectionLabel(n) {
    const pill = qs("#iosSection span");
    if (pill) pill.textContent = liberLabel(n);
  }

  function observeLibri() {
    const chapters = qsa(".book-chapter");
    if (!chapters.length || !("IntersectionObserver" in w)) return;
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!vis) return;
      const n = Number((vis.target.id || "").replace("ch-", ""));
      if (n) setSectionLabel(n);
    }, { rootMargin: "-20% 0px -60% 0px", threshold: [0.1, 0.25, 0.5] });
    chapters.forEach((el) => io.observe(el));
  }

  function bind() {
    qs("#iosAuthor")?.addEventListener("click", openAuthors);
    qs("#iosWork")?.addEventListener("click", () => openWorks(currentContext().author && currentContext().author.id));
    qs("#iosSection")?.addEventListener("click", openSections);
    qs("#iosSheetClose")?.addEventListener("click", closeSheet);
    qs("#iosSheet")?.addEventListener("click", (e) => {
      if (e.target.id === "iosSheet") closeSheet();
      const author = e.target.closest("[data-pick-author]");
      if (author) {
        const a = authorById(author.dataset.pickAuthor);
        const w = D.works.find((x) => x.author === a.id);
        if (w) location.href = "read.html?work=" + encodeURIComponent(w.id);
        else closeSheet();
      }
    });
    qs("#iosChi")?.addEventListener("click", () => {
      const next = storedMode() === "original" ? "translation" : "original";
      localStorage.setItem("fg-mode", next);
      const u = new URL(location.href);
      if (u.pathname.indexOf("read") !== -1) {
        u.searchParams.set("mode", next);
        location.href = u.toString();
      } else {
        applyShellState();
      }
    });
    qs("#iosParallel")?.addEventListener("click", () => {
      if (!isLandscape()) {
        toast("Turn the phone sideways to read in parallel.");
        return;
      }
      const next = parallelOn() ? "off" : "on";
      localStorage.setItem("fg-ios-parallel", next);
      if (next === "on" && storedMode() === "original") {
        localStorage.setItem("fg-mode", "translation");
        localStorage.setItem("fg-orig-parallel", "on");
        const u = new URL(location.href);
        u.searchParams.set("mode", "translation");
        location.href = u.toString();
        return;
      }
      applyShellState();
    });
    qs("#iosFocus")?.addEventListener("click", () => {
      const next = focusOn() ? "off" : "on";
      localStorage.setItem("fg-focus", next);
      applyShellState();
    });
    w.addEventListener("orientationchange", () => {
      setTimeout(applyShellState, 80);
    });
    w.addEventListener("resize", () => applyShellState());
    observeLibri();
  }

  function mount(page) {
    if (!isPhone()) return;
    if (page === "home") {
      location.replace("read.html?work=confessions");
      return;
    }
    if (qs(".ios-topbar")) {
      applyShellState();
      return;
    }
    document.body.insertAdjacentHTML("afterbegin", topbar(page));
    document.body.insertAdjacentHTML("beforeend", tabs(page) + sheet());
    applyShellState();
    bind();
  }

  w.FG = w.FG || {};
  w.FG.mountIOS = mount;
  w.FG.liberLabel = liberLabel;
})(window);
