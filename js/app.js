/* Fathers Gateway shared chrome + reader behaviour */
(function (w) {
  const D = w.FG_DATA;
  const ICONS = {
    read: '<svg viewBox="0 0 24 24"><path d="M4 5h7a3 3 0 0 1 3 3v13H7a3 3 0 0 0-3 3V5z"/><path d="M20 5h-7a3 3 0 0 0-3 3v13h7a3 3 0 0 1 3 3V5z"/></svg>',
    study: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="M20 20l-3.2-3.2"/></svg>',
    browse: '<svg viewBox="0 0 24 24"><path d="M6 7h12M6 12h12M6 17h8"/></svg>',
    about: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 8h.01"/></svg>',
    nums: '<svg viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h8"/><path d="M4 6v.01M4 12v.01M4 18v.01"/></svg>',
    head: '<svg viewBox="0 0 24 24"><path d="M5 7h14M12 7v11"/></svg>',
    fn: '<svg viewBox="0 0 24 24"><path d="M12 4v16M6 8l12 8M6 16l12-8"/></svg>',
    xref: '<svg viewBox="0 0 24 24"><path d="M10 13a4.5 4.5 0 0 0 6.4 0l1.6-1.6a4.5 4.5 0 0 0-6.4-6.4L10.5 6"/><path d="M14 11a4.5 4.5 0 0 0-6.4 0L6 12.6a4.5 4.5 0 0 0 6.4 6.4l1.1-1.1"/></svg>',
    parallel: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="7" height="14" rx="1"/><rect x="13" y="5" width="7" height="14" rx="1"/></svg>'
  };
  const HL_COLORS = ["hl-yellow", "hl-green", "hl-blue", "hl-pink"];

  function storedOpt(id, fallback) {
    const v = localStorage.getItem("fg-opt-" + id);
    if (v == null) return fallback;
    return v !== "off";
  }
  function setStoredOpt(id, on) {
    localStorage.setItem("fg-opt-" + id, on ? "on" : "off");
  }

  function qs(sel, el) { return (el || document).querySelector(sel); }
  function qsa(sel, el) { return Array.from((el || document).querySelectorAll(sel)); }
  function param(name, fallback) {
    const v = new URLSearchParams(location.search).get(name);
    return v == null || v === "" ? fallback : v;
  }
  function workById(id) { return D.works.find((x) => x.id === id); }
  function authorById(id) { return D.authors.find((x) => x.id === id); }
  function passageOf(work, chapter) {
    return D.passages.find((p) => p.work === work && String(p.chapter) === String(chapter));
  }
  function storedMode() {
    return localStorage.getItem("fg-mode") === "original" ? "original" : "translation";
  }
  function setStoredMode(mode) {
    localStorage.setItem("fg-mode", mode);
  }
  function storedVersion() {
    return localStorage.getItem("fg-version") || "";
  }
  function setStoredVersion(id) {
    if (id) localStorage.setItem("fg-version", id);
  }
  function versionLabel(id) {
    const v = D.versions.find((x) => x.id === id);
    return v ? v.label : id.toUpperCase();
  }
  function versionShort(id) {
    const v = D.versions.find((x) => x.id === id);
    return v ? (v.short || v.label) : id.toUpperCase();
  }
  function translationsOf(passage) {
    if (!passage) return [];
    return D.versions.filter((v) => v.group === "translation" && passage.versions[v.id] && passage.versions[v.id].length);
  }
  function originalOf(passage) {
    if (!passage) return null;
    if (passage.versions.lat && passage.versions.lat.length) return { id: "lat", paras: passage.versions.lat };
    if (passage.versions.grk && passage.versions.grk.length) return { id: "grk", paras: passage.versions.grk };
    return null;
  }
  function pickTranslation(passage, preferred) {
    const list = translationsOf(passage);
    if (!list.length) return null;
    const match = list.find((v) => v.id === preferred);
    return match || list[0];
  }
  function pickText(passage, version) {
    if (passage.versions[version]) return { version, paras: passage.versions[version] };
    const t = pickTranslation(passage, version);
    if (t) return { version: t.id, paras: passage.versions[t.id] };
    const orig = originalOf(passage);
    return orig ? { version: orig.id, paras: orig.paras } : { version, paras: [] };
  }
  function passagesOf(workId) {
    return D.passages.filter((p) => p.work === workId).sort((a, b) => a.chapter - b.chapter);
  }
  function readRef(work, ch) {
    let u = "read.html?work=" + encodeURIComponent(work);
    if (ch != null && ch !== "") u += "&chapter=" + encodeURIComponent(ch);
    return u;
  }
  function neighborWorks(workId) {
    const i = D.works.findIndex((w) => w.id === workId);
    return { prev: i > 0 ? D.works[i - 1] : null, next: i >= 0 && i < D.works.length - 1 ? D.works[i + 1] : null };
  }

  function rail(active) {
    const items = [
      ["index.html", "read", "Read", active === "home" || active === "read"],
      ["study.html", "study", "Study", active === "study"],
      ["browse.html", "browse", "Browse", active === "browse"],
      ["about.html", "about", "About", active === "about"]
    ];
    const tools = [
      ["nums", "Nos", "Paragraph numbers", storedOpt("nums", true)],
      ["head", "Heads", "Section headings", storedOpt("head", true)],
      ["fn", "Notes", "Footnotes", storedOpt("fn", true)],
      ["xref", "Refs", "Scripture references", storedOpt("xref", true)],
      ["parallel", "Split", "Parallel original on the right", localStorage.getItem("fg-orig-parallel") !== "off"]
    ];
    return (
      '<nav class="rail" id="rail" aria-label="Primary">' +
      '<div class="rail-pages">' +
      items.map(([href, icon, label, on]) =>
        '<a class="' + (on ? "active" : "") + '" href="' + href + '">' + ICONS[icon] + "<span>" + label + "</span></a>"
      ).join("") +
      "</div>" +
      '<div class="rail-tools" aria-label="Reading options">' +
      tools.map(([id, label, title, on]) =>
        '<button type="button" class="rail-tool' + (on ? " active" : "") + '" data-readopt="' + id + '" title="' + title + '">' +
        ICONS[id] + "<span>" + label + "</span></button>"
      ).join("") +
      "</div></nav>"
    );
  }

  function header() {
    const signed = localStorage.getItem("fg-user");
    return (
      '<header class="site-header">' +
      '<button class="icon-btn hamburger" id="hamburger" aria-label="Open menu">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>' +
      '<a class="brand" href="index.html" aria-label="Fathers Gateway">' +
      '<svg class="logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 40" role="img" aria-hidden="true">' +
      '<g fill="none" stroke="#952004" stroke-width="1.7" stroke-linecap="round">' +
      '<path d="M8 30 V14 Q8 6 16 6 h12 Q36 6 36 14 V30"/>' +
      '<path d="M14 30 V18 Q14 13 20 13 h4 Q30 13 30 18 V30"/>' +
      '<path d="M8 30 H36"/></g>' +
      '<text x="48" y="28" font-family="Georgia, Times New Roman, serif" font-size="22" fill="currentColor">Fathers</text>' +
      '<text x="142" y="28" font-family="Georgia, Times New Roman, serif" font-size="22" fill="#952004">Gateway</text>' +
      "</svg></a>" +
      '<div class="header-actions">' +
      '<button class="icon-btn" id="themeBtn" title="Night mode" aria-label="Toggle night mode">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"/></svg></button>' +
      (signed
        ? '<span style="font-size:14px;font-weight:600">' + signed + '</span><button class="linkish" id="signOut">Sign out</button>'
        : '<button class="linkish" id="loginBtn">Log In</button>') +
      "</div></header>"
    );
  }

  function searchStrip(query) {
    const mode = storedMode();
    return (
      '<div class="search-strip">' +
      '<form class="search-row" id="searchForm" action="search.html" method="get">' +
      '<input type="search" name="q" id="q" placeholder="Search Confessions (e.g. Book 8, restless, pear tree)" value="' +
      escapeHtml(query || "") + '" aria-label="Search writings">' +
      '<div class="lang-toggle" role="group" aria-label="Text language">' +
      '<button type="button" data-mode="translation"' + (mode === "translation" ? " class=\"active\"" : "") + ">Translation</button>" +
      '<button type="button" data-mode="original"' + (mode === "original" ? " class=\"active\"" : "") + ">Original</button>" +
      "</div>" +
      '<button class="btn-search" type="submit">Search</button>' +
      "</form>" +
      '<div class="edition-bar" id="editionBar" aria-label="Available translations"></div>' +
      '<div class="search-tools">' +
      '<button type="button" id="booklistBtn">Writings list</button>' +
      '<a href="search.html?advanced=1">Advanced search</a>' +
      '<div class="font-ctrl">Aa ' +
      '<button type="button" id="fontDown" aria-label="Decrease text size">−</button>' +
      '<button type="button" id="fontUp" aria-label="Increase text size">+</button>' +
      "</div></div></div>"
    );
  }

  function booklist() {
    const groups = D.eras.map((era) => {
      const authors = D.authors.filter((a) => a.era === era.id);
      return (
        '<div class="era-label">' + era.label + "</div>" +
        authors.map((a, i) =>
          '<button type="button" data-author="' + a.id + '"' + (era.id === "post-nicene" && a.id === "augustine" ? " class=\"active\"" : "") + ">" +
          a.name + "</button>"
        ).join("")
      );
    }).join("");
    return (
      '<div class="booklist" id="booklist" hidden>' +
      '<div class="booklist-eras">' + groups + "</div>" +
      '<div class="booklist-works" id="booklistWorks"></div></div>'
    );
  }

  function footer() {
    return (
      '<footer class="site-footer">' +
      '<div class="footer-grid">' +
      "<div><h4>Read</h4><a href='read.html?work=confessions'>The Confessions</a><a href='read.html?work=confessions&chapter=1'>Book I</a><a href='read.html?work=confessions&chapter=8'>Book VIII</a><a href='browse.html'>Browse</a></div>" +
      "<div><h4>Study</h4><a href='study.html'>Study desk</a><a href='search.html?q=incarnation'>Keyword search</a><a href='about.html#editions'>Editions</a></div>" +
      "<div><h4>Account</h4><a href='#' id='footerLogin'>Sign in</a><a href='about.html#privacy'>Privacy</a></div>" +
      "</div>" +
      "<p class='legal'>Fathers Gateway is a searchable library of public-domain Church Father writings, with a reading layout inspired by Bible Gateway. Texts in this mock come from the Ante-Nicene Fathers and Nicene and Post-Nicene Fathers series (ed. Roberts, Donaldson, Schaff) and related 19th-century editions. This is a demonstration site, not an official Bible Gateway product.</p>" +
      "</footer>"
    );
  }

  function modal() {
    return (
      '<div class="modal-back" id="loginModal">' +
      '<div class="modal" role="dialog" aria-labelledby="loginTitle">' +
      "<h2 id='loginTitle'>Sign in</h2>" +
      '<div class="auth-tabs">' +
      '<button type="button" class="active" data-auth="signin">Sign in</button>' +
      '<button type="button" data-auth="create">Create account</button>' +
      "</div>" +
      '<div class="auth-panel active" id="panel-signin">' +
      '<label>Email</label><input id="signinEmail" type="email" placeholder="you@example.org">' +
      '<label>Password</label><input id="signinPass" type="password" placeholder="Password">' +
      '<button class="btn-burgundy" id="signinSubmit" style="width:100%">Sign in</button>' +
      "</div>" +
      '<div class="auth-panel" id="panel-create">' +
      '<label>Display name</label><input id="loginName" placeholder="e.g. Paula of Bethlehem">' +
      '<label>Email</label><input id="loginEmail" type="email" placeholder="you@example.org">' +
      '<label>Password</label><input id="loginPass" type="password" placeholder="Create a password">' +
      '<button class="btn-burgundy" id="loginSubmit" style="width:100%">Create account</button>' +
      "</div>" +
      '<div class="oauth-block">' +
      '<p class="fineprint" style="margin-top:0">OAuth is optional and not required. It is not connected in this mock.</p>' +
      '<button type="button" class="btn-oauth" data-oauth="google">Continue with Google</button>' +
      '<button type="button" class="btn-oauth" data-oauth="microsoft">Continue with Microsoft</button>' +
      "</div>" +
      '<p style="text-align:center;margin:12px 0 0"><button class="linkish" id="loginCancel">Cancel</button></p>' +
      "</div></div><div class='toast' id='toast'></div>"
    );
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function toast(msg) {
    const el = qs("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("open");
    setTimeout(() => el.classList.remove("open"), 2200);
  }

  function fillWorks(authorId) {
    const author = authorById(authorId);
    const works = D.works.filter((w) => w.author === authorId);
    const box = qs("#booklistWorks");
    if (!box || !author) return;
    qsa(".booklist-eras button").forEach((b) => b.classList.toggle("active", b.dataset.author === authorId));
    box.innerHTML =
      "<h3>" + escapeHtml(author.name) + "</h3>" +
      '<div class="meta">' + escapeHtml(author.dates) + " · " + escapeHtml(author.region) + "</div>" +
      works.map((w) => {
        const chans = [];
        for (let i = 1; i <= w.chapters; i++) chans.push('<a href="' + readRef(w.id, i) + '#ch-' + i + '">' + i + "</a>");
        return (
          '<a class="work-link" href="' + readRef(w.id) + '"><strong>' + escapeHtml(w.title) +
          "</strong> <span class='meta'>(" + w.short + " · " + w.series + ")</span></a>" +
          '<div class="chapters">' + chans.join("") + "</div>"
        );
      }).join("");
  }

  function parseQuery(raw) {
    const q = (raw || "").trim();
    if (!q) return { type: "empty" };
    const lower = q.toLowerCase();
    const romans = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12, xiii: 13 };
    const bookHit = lower.match(/^(?:book|conf(?:essions|\.)?)\s+(i{1,3}|iv|vi{0,3}|ix|xi{0,2}|xiii|x|\d+)$/);
    if (bookHit) {
      const raw = bookHit[1];
      const n = romans[raw] || Number(raw);
      if (n >= 1 && n <= 13) return { type: "ref", work: "confessions", chapter: n };
    }
    for (const w of D.works) {
      const names = [w.id, w.title, w.short].map((s) => s.toLowerCase());
      for (const n of names) {
        const re = new RegExp("^" + n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*(\\d+)?$", "i");
        const m = lower.match(re);
        if (m) return { type: "ref", work: w.id, chapter: m[1] ? Number(m[1]) : null };
      }
    }
    for (const a of D.authors) {
      if (a.name.toLowerCase() === lower || a.id === lower) {
        const w = D.works.find((x) => x.author === a.id);
        if (w) return { type: "ref", work: w.id, chapter: null };
      }
    }
    return { type: "keyword", q: q };
  }

  function searchKeyword(q) {
    const needle = q.toLowerCase();
    const hits = [];
    D.passages.forEach((p) => {
      const blobs = [];
      translationsOf(p).forEach((v) => blobs.push(p.versions[v.id].join(" ")));
      const orig = originalOf(p);
      if (orig) blobs.push(orig.paras.join(" "));
      blobs.push(p.heading);
      const hay = blobs.join(" ");
      if (hay.toLowerCase().includes(needle)) {
        const work = workById(p.work);
        const author = authorById(work.author);
        let snip = p.heading;
        translationsOf(p).some((v) => {
          const para = (p.versions[v.id] || []).find((t) => t.toLowerCase().includes(needle));
          if (para) { snip = snippet(para, needle); return true; }
          return false;
        });
        if (snip === p.heading && orig) {
          const para = orig.paras.find((t) => t.toLowerCase().includes(needle));
          if (para) snip = snippet(para, needle);
        }
        hits.push({
          work: p.work, chapter: p.chapter, heading: p.heading,
          author: author.name, title: work.title,
          snippet: snip.indexOf("<mark>") >= 0 ? snip : escapeHtml(snip)
        });
      }
    });
    D.authors.forEach((a) => {
      if (a.name.toLowerCase().includes(needle)) {
        const w = D.works.find((x) => x.author === a.id);
        if (w) hits.unshift({
          work: w.id, chapter: 1, heading: a.name,
          author: a.name, title: w.title,
          snippet: escapeHtml(a.name + " · " + a.dates + " · " + a.region)
        });
      }
    });
    const seen = new Set();
    return hits.filter((h) => {
      const k = h.work + ":" + h.chapter;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function snippet(text, needle) {
    const i = text.toLowerCase().indexOf(needle.toLowerCase());
    const start = Math.max(0, i - 90);
    const end = Math.min(text.length, i + needle.length + 110);
    let s = (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
    const re = new RegExp("(" + needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
    return escapeHtml(s).replace(re, "<mark>$1</mark>");
  }

  function applyFont() {
    const n = Number(localStorage.getItem("fg-font") || 18);
    document.documentElement.style.setProperty("--read-size", n + "px");
  }
  function applyTheme() {
    const t = localStorage.getItem("fg-theme") || "day";
    document.documentElement.setAttribute("data-theme", t === "night" ? "night" : "day");
  }

  function bindChrome() {
    applyFont();
    applyTheme();
    const ham = qs("#hamburger");
    if (ham) ham.addEventListener("click", () => {
      const open = qs("#rail").classList.toggle("open");
      document.body.classList.toggle("nav-open", open);
    });
    document.addEventListener("click", (e) => {
      if (!document.body.classList.contains("nav-open")) return;
      if (e.target.closest("#rail") || e.target.closest("#hamburger")) return;
      qs("#rail").classList.remove("open");
      document.body.classList.remove("nav-open");
    });
    qsa("[data-readopt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.readopt;
        if (id === "parallel") {
          const next = localStorage.getItem("fg-orig-parallel") === "off" ? "on" : "off";
          localStorage.setItem("fg-orig-parallel", next);
          btn.classList.toggle("active", next !== "off");
          if (/read/i.test(location.pathname + location.href)) location.reload();
          return;
        }
        const next = !storedOpt(id, true);
        setStoredOpt(id, next);
        btn.classList.toggle("active", next);
        applyReadOptions();
      });
    });
    const theme = qs("#themeBtn");
    if (theme) theme.addEventListener("click", () => {
      const next = (localStorage.getItem("fg-theme") || "day") === "night" ? "day" : "night";
      localStorage.setItem("fg-theme", next);
      applyTheme();
    });
    const form = qs("#searchForm");
    if (form) form.addEventListener("submit", (e) => {
      const q = qs("#q").value;
      let parsed;
      try { parsed = parseQuery(q); } catch (err) { parsed = { type: "keyword", q: q }; }
      if (parsed.type === "ref") {
        e.preventDefault();
        location.href = readRef(parsed.work, parsed.chapter) + (parsed.chapter ? "#ch-" + parsed.chapter : "");
      }
    });
    qsa("[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;
        setStoredMode(mode);
        qsa("[data-mode]").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
        applyLangMode();
      });
    });
    const blBtn = qs("#booklistBtn");
    const bl = qs("#booklist");
    if (blBtn && bl) {
      blBtn.addEventListener("click", () => {
        const open = bl.classList.toggle("open");
        bl.hidden = !open;
        if (open) fillWorks(qs(".booklist-eras button.active")?.dataset.author || "augustine");
      });
      bl.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-author]");
        if (btn) fillWorks(btn.dataset.author);
      });
    }
    qs("#fontUp")?.addEventListener("click", () => {
      const n = Math.min(26, Number(localStorage.getItem("fg-font") || 18) + 2);
      localStorage.setItem("fg-font", n); applyFont();
    });
    qs("#fontDown")?.addEventListener("click", () => {
      const n = Math.max(14, Number(localStorage.getItem("fg-font") || 18) - 2);
      localStorage.setItem("fg-font", n); applyFont();
    });
    const openLogin = (tab) => {
      qs("#loginModal")?.classList.add("open");
      if (tab) switchAuth(tab);
    };
    function switchAuth(tab) {
      qsa("[data-auth]").forEach((b) => b.classList.toggle("active", b.dataset.auth === tab));
      qs("#panel-signin")?.classList.toggle("active", tab === "signin");
      qs("#panel-create")?.classList.toggle("active", tab === "create");
      const title = qs("#loginTitle");
      if (title) title.textContent = tab === "create" ? "Create account" : "Sign in";
    }
    qsa("[data-auth]").forEach((b) => b.addEventListener("click", () => switchAuth(b.dataset.auth)));
    qs("#loginBtn")?.addEventListener("click", () => openLogin("signin"));
    qs("#footerLogin")?.addEventListener("click", (e) => { e.preventDefault(); openLogin("signin"); });
    qs("#loginCancel")?.addEventListener("click", () => qs("#loginModal").classList.remove("open"));
    qs("#loginModal")?.addEventListener("click", (e) => {
      if (e.target.id === "loginModal") e.target.classList.remove("open");
    });
    function finishAuth(name) {
      localStorage.setItem("fg-user", name);
      qs("#loginModal").classList.remove("open");
      location.reload();
    }
    qs("#signinSubmit")?.addEventListener("click", () => {
      const email = (qs("#signinEmail").value || "").trim();
      finishAuth(email ? email.split("@")[0] : "Reader");
    });
    qs("#loginSubmit")?.addEventListener("click", () => {
      const name = (qs("#loginName").value || qs("#loginEmail").value || "Reader").trim();
      finishAuth(name.includes("@") ? name.split("@")[0] : name);
    });
    qsa("[data-oauth]").forEach((btn) => {
      btn.addEventListener("click", () => toast("OAuth is optional and not connected in this mock."));
    });
    qs("#signOut")?.addEventListener("click", () => {
      localStorage.removeItem("fg-user");
      location.reload();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        qs("#loginModal")?.classList.remove("open");
        qs("#booklist")?.classList.remove("open");
      }
    });
  }

  function promoBar() {
    return (
      '<div class="promo-bar">' +
      "A searchable library of public-domain Church Father writings." +
      '<button class="dismiss" type="button" aria-label="Dismiss">×</button>' +
      "</div>"
    );
  }

  function mountChrome(active, extra) {
    const modeParam = param("mode");
    if (modeParam === "original" || modeParam === "translation") setStoredMode(modeParam);
    const q = param("q", extra && extra.q || "");
    document.body.insertAdjacentHTML(
      "afterbegin",
      rail(active) + promoBar() + header() + searchStrip(q) + booklist()
    );
    document.body.insertAdjacentHTML("beforeend", footer() + modal());
    qs(".promo-bar .dismiss")?.addEventListener("click", (e) => e.currentTarget.parentElement.remove());
    bindChrome();
    applyReadOptions();
  }

  function applyReadOptions() {
    document.body.classList.toggle("hide-nums", !storedOpt("nums", true));
    document.body.classList.toggle("hide-head", !storedOpt("head", true));
    document.body.classList.toggle("hide-fn", !storedOpt("fn", true));
    document.body.classList.toggle("hide-xref", !storedOpt("xref", true));
    if (qs("#footnotes")) qs("#footnotes").style.display = storedOpt("fn", true) ? "" : "none";
    if (qs("#crossrefs")) qs("#crossrefs").style.display = storedOpt("xref", true) ? "" : "none";
  }

  function showEditionBar(passage, selectedId) {
    const bar = qs("#editionBar");
    if (!bar) return;
    const mode = storedMode();
    const list = translationsOf(passage);
    if (mode !== "translation" || !list.length) {
      bar.classList.remove("show");
      bar.innerHTML = "";
      return;
    }
    bar.innerHTML = list.map((v) =>
      '<button type="button" class="edition-chip' + (v.id === selectedId ? " active" : "") + '" data-edition="' + v.id + '">' +
      escapeHtml(v.short) + "</button>"
    ).join("");
    requestAnimationFrame(() => bar.classList.add("show"));
    qsa("[data-edition]", bar).forEach((chip) => {
      chip.addEventListener("click", () => {
        setStoredVersion(chip.dataset.edition);
        const u = new URL(location.href);
        if (u.pathname.indexOf("read") !== -1) {
          u.searchParams.set("version", chip.dataset.edition);
          location.href = u.toString();
        }
      });
    });
  }

  function hideEditionBar() {
    const bar = qs("#editionBar");
    if (!bar) return;
    bar.classList.remove("show");
    bar.innerHTML = "";
  }

  function applyLangMode() {
    const mode = storedMode();
    const onRead = location.pathname.indexOf("read") !== -1 || /read\.html/i.test(location.href);
    if (mode === "original" || !onRead) {
      hideEditionBar();
    }
    if (onRead) {
      const u = new URL(location.href);
      u.searchParams.set("mode", mode);
      location.href = u.toString();
    }
  }

  function renderHome() {
    const p = passageOf(D.votd.work, D.votd.chapter);
    const work = workById(p.work);
    const author = authorById(work.author);
    const mode = storedMode();
    const orig = originalOf(p);
    const trans = pickTranslation(p, storedVersion());
    let quote = mode === "original" && orig
      ? orig.paras[0]
      : (trans ? p.versions[trans.id][0] : (p.versions.pusey || [])[0] || "");
    if (quote && quote.length > 420) quote = quote.slice(0, 420).replace(/\s+\S*$/, "") + "…";
    qs("#page").innerHTML =
      '<div class="home-grid">' +
      '<section class="votd">' +
      "<h2>Passage of the Day</h2>" +
      '<div class="ref"><a href="' + readRef(p.work, p.chapter) + '">' +
      escapeHtml(work.title) + " " + p.chapter + "</a> · " + escapeHtml(author.name) + "</div>" +
      "<blockquote>“" + escapeHtml(quote) + "”</blockquote>" +
      '<div class="actions">' +
      '<a href="' + readRef(p.work) + '">Read the book</a>' +
      "</div></section></div>";
    hideEditionBar();
  }

  function renderNotes(passage) {
    const notes = passage.footnotes || [];
    if (!notes.length) return '<p class="notes-empty">No notes for this book.</p>';
    return notes.map(function (f) {
      return '<p class="note-item"><sup class="fn">(' + escapeHtml(f.n) + ")</sup> " +
        escapeHtml(f.text) + "</p>";
    }).join("");
  }

  function renderChapterBody(passage, mode, preferred, split) {
    const orig = originalOf(passage);
    const trans = pickTranslation(passage, preferred);
    const notes = '<aside class="chapter-notes" aria-label="Notes">' +
      '<p class="notes-label">Notes</p>' + renderNotes(passage) + "</aside>";
    let main = "";
    if (mode === "original") {
      if (!orig) {
        main = '<div class="trans-pane"><p class="empty">No original-language text for this book is in the library yet.</p></div>';
      } else {
        main = '<div class="trans-pane"><p class="pane-label">' + escapeHtml(versionLabel(orig.id)) + " · original</p>" +
          '<div class="passage">' + renderParas(passage, orig.id) + "</div></div>";
      }
      return '<div class="chapter-row">' + main + notes + "</div>";
    }
    if (split && orig && trans) {
      return '<div class="chapter-row has-orig">' +
        '<div class="trans-pane"><p class="pane-label">' + escapeHtml(versionLabel(trans.id)) + "</p>" +
        '<div class="passage">' + renderParas(passage, trans.id) + "</div></div>" +
        '<div class="orig-pane"><p class="pane-label">' + escapeHtml(versionLabel(orig.id)) + " · original</p>" +
        '<div class="passage">' + renderParas(passage, orig.id) + "</div></div>" +
        notes + "</div>";
    }
    if (trans) {
      main = '<div class="trans-pane"><p class="pane-label">' + escapeHtml(versionLabel(trans.id)) + "</p>" +
        '<div class="passage">' + renderParas(passage, trans.id) + "</div></div>";
      return '<div class="chapter-row">' + main + notes + "</div>";
    }
    return '<div class="chapter-row"><p class="empty">No text available.</p>' + notes + "</div>";
  }

  function renderRead() {
    const workId = param("work", "confessions");
    const jumpChapter = param("chapter", "");
    const work = workById(workId) || workById("confessions");
    const chapters = passagesOf(work.id);
    if (!chapters.length) {
      qs("#page").innerHTML = "<p class='empty'>The Confessions text did not load. Check js/confessions-data.js.</p>";
      return;
    }
    const first = chapters[0];
    const author = authorById(work.author);
    const modeParam = param("mode", storedMode());
    if (modeParam === "original" || modeParam === "translation") setStoredMode(modeParam);
    const mode = storedMode();
    const preferred = param("version", storedVersion());
    const anyTrans = pickTranslation(first, preferred);
    if (anyTrans) setStoredVersion(anyTrans.id);
    const showParallelOrig = mode === "translation" && (localStorage.getItem("fg-orig-parallel") !== "off" || localStorage.getItem("fg-ios-parallel") === "on");
    const neighbors = neighborWorks(work.id);

    const toc = chapters.map((p) => {
      const label = (p.heading || "").replace(/^Book\s+/i, "") || String(p.chapter);
      return '<a href="#ch-' + p.chapter + '">' + escapeHtml(label) + "</a>";
    }).join("");

    const body = chapters.map((p) => {
      return (
        '<section class="book-chapter" id="ch-' + p.chapter + '">' +
        '<h2 class="heading">' + escapeHtml(p.heading) + "</h2>" +
        renderChapterBody(p, mode, preferred, showParallelOrig && !!originalOf(p)) +
        "</section>"
      );
    }).join("");

    const editionNote = mode === "original"
      ? "Latin text of the Confessiones"
      : (anyTrans ? versionLabel(anyTrans.id) : "");

    qs("#page").innerHTML =
      '<div class="read-toolbar">' +
      (neighbors.prev
        ? '<a class="nav-chap" href="' + readRef(neighbors.prev.id) + '" title="' + escapeHtml(neighbors.prev.title) + '" aria-label="Previous work">‹</a>'
        : '<span class="nav-chap" style="opacity:.35;display:inline-flex;align-items:center;justify-content:center">‹</span>') +
      (neighbors.next
        ? '<a class="nav-chap" href="' + readRef(neighbors.next.id) + '" title="' + escapeHtml(neighbors.next.title) + '" aria-label="Next work">›</a>'
        : '<span class="nav-chap" style="opacity:.35;display:inline-flex;align-items:center;justify-content:center">›</span>') +
      "<div><h1 class='read-title'>" + escapeHtml(work.title) + "</h1>" +
      '<div class="version-name">' + escapeHtml(author.name) + " · " + chapters.length + " books</div></div></div>" +
      '<nav class="book-toc" aria-label="Chapters">' + toc + "</nav>" +
      body +
      '<p class="copyright"><strong>' + escapeHtml(editionNote) + "</strong>. English: E. B. Pusey (1838), Project Gutenberg eBook #3296. Latin: the Confessiones under <code>Fathers/Latin/</code>. Highlighting is stored only in this browser.</p>" +
      '<div class="hl-bar" id="hlBar">' +
      '<button data-hl="hl-yellow" style="background:#ffe566" title="Yellow"></button>' +
      '<button data-hl="hl-green" style="background:#7dcc70" title="Green"></button>' +
      '<button data-hl="hl-blue" style="background:#7eb6ff" title="Blue"></button>' +
      '<button data-hl="hl-pink" style="background:#ff8fb8" title="Pink"></button>' +
      '<button data-hl="" style="background:#fff;color:#000" title="Clear">×</button>' +
      "</div>";

    if (mode === "translation") showEditionBar(first, anyTrans && anyTrans.id);
    else hideEditionBar();
    applyReadOptions();
    restoreHighlights(work.id);
    bindWordHighlight(work.id);
    if (jumpChapter) {
      const el = qs("#ch-" + jumpChapter);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }

  function wrapWords(escaped, version, chapter, paraIndex) {
    let n = 0;
    return escaped.replace(/(\S+)/g, (tok) => {
      const id = version + "-" + chapter + "-" + paraIndex + "-" + n++;
      return '<span class="w" data-w="' + id + '">' + tok + "</span>";
    });
  }

  function renderParas(passage, version) {
    const picked = pickText(passage, version);
    return picked.paras.map((text, i) => {
      let t = wrapWords(escapeHtml(text), version, passage.chapter, i);
      (passage.footnotes || []).filter(function (f) { return f.para === i; }).forEach(function (f) {
        t += '<sup class="fn">(' + escapeHtml(f.n) + ")</sup>";
      });
      const key = passage.work + "-" + passage.chapter + "-" + version + "-" + i;
      return '<p class="para" data-key="' + key + '"><span class="pnum">' + (i + 1) + "</span> " + t + "</p>";
    }).join("");
  }

  function wordsFromSelection() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return [];
    const range = sel.getRangeAt(0);
    return qsa(".w").filter((w) => {
      try { return range.intersectsNode(w); } catch (e) { return false; }
    });
  }

  function bindWordHighlight(work) {
    let pending = [];
    const page = qs("#page");
    function showHl(e) {
      if (e.target.closest && e.target.closest("#hlBar")) return;
      const selected = wordsFromSelection();
      const word = e.target.closest && e.target.closest(".w");
      pending = selected.length ? selected : (word ? [word] : []);
      const bar = qs("#hlBar");
      if (!pending.length || !bar) {
        bar && bar.classList.remove("open");
        return;
      }
      bar.classList.add("open");
      bar.style.left = Math.min(e.clientX || 0, innerWidth - 170) + "px";
      bar.style.top = Math.max(8, (e.clientY || 0) - 44) + "px";
    }
    page.addEventListener("mouseup", showHl);
    page.addEventListener("touchend", (e) => {
      const t = e.changedTouches && e.changedTouches[0];
      showHl({
        target: e.target,
        clientX: t ? t.clientX : 0,
        clientY: t ? t.clientY : 0
      });
    });
    qs("#hlBar")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-hl]");
      if (!btn) return;
      pending.forEach((w) => {
        HL_COLORS.forEach((c) => w.classList.remove(c));
        if (btn.dataset.hl) w.classList.add(btn.dataset.hl);
      });
      saveHighlights(work);
      qs("#hlBar").classList.remove("open");
      window.getSelection()?.removeAllRanges();
      pending = [];
    });
    document.addEventListener("mousedown", (e) => {
      if (!e.target.closest("#hlBar") && !e.target.closest(".w")) qs("#hlBar")?.classList.remove("open");
    });
  }

  function saveHighlights(work) {
    const map = {};
    qsa(".w").forEach((w) => {
      const hl = HL_COLORS.find((c) => w.classList.contains(c));
      if (hl) map[w.dataset.w] = hl;
    });
    localStorage.setItem("fg-hl-" + work, JSON.stringify(map));
  }
  function restoreHighlights(work) {
    try {
      const map = JSON.parse(localStorage.getItem("fg-hl-" + work) || "{}");
      Object.keys(map).forEach((k) => {
        const el = document.querySelector('.w[data-w="' + k + '"]');
        if (el && HL_COLORS.indexOf(map[k]) !== -1) el.classList.add(map[k]);
      });
    } catch (e) { /* ignore */ }
  }

  function renderSearch() {
    const q = param("q", "");
    const advanced = param("advanced", "");
    const parsed = parseQuery(q);
    if (parsed.type === "ref" && !advanced) {
      location.replace(readRef(parsed.work, parsed.chapter) + (parsed.chapter ? "#ch-" + parsed.chapter : ""));
      return;
    }
    const hits = q ? searchKeyword(q) : [];
    hideEditionBar();
    qs("#page").innerHTML =
      "<div class='prose'><h1>" + (advanced ? "Advanced search" : "Search results") + "</h1>" +
      (advanced
        ? "<p>Type a father, a work and chapter (<em>Confessions 1</em>), or any keyword. Search looks at titles and the public-domain texts themselves. Translation or original is chosen with the two buttons beside the search bar after a work is open.</p>"
        : "") +
      (q
        ? "<p class='meta' style='color:var(--muted)'>" + hits.length + " result" + (hits.length === 1 ? "" : "s") +
          " for <strong>" + escapeHtml(q) + "</strong></p>"
        : "<p>Enter a query in the search bar.</p>") +
      "</div>" +
      (hits.length
        ? hits.map((h) =>
          '<article class="result"><h3><a href="' + readRef(h.work, h.chapter) + "#ch-" + h.chapter + '">' +
          escapeHtml(h.title) + " " + h.chapter + " — " + escapeHtml(h.heading) + "</a></h3>" +
          '<div class="meta">' + escapeHtml(h.author) + "</div>" +
          "<p>" + h.snippet + "</p></article>"
        ).join("")
        : (q ? "<p class='empty'>No passages in this demo corpus matched that query. Try <em>restless</em>, <em>wheat of God</em>, or <em>Confessions 1</em>.</p>" : ""));
  }

  function renderBrowse() {
    qs("#page").innerHTML =
      '<div class="prose"><h1>Writings list</h1><p>Browse the demo corpus the way Bible Gateway lists books of the Bible — by era, then father, then work and chapter.</p></div>' +
      '<div class="browse-grid">' +
      D.eras.map((era) => {
        const authors = D.authors.filter((a) => a.era === era.id);
        return (
          '<div class="era-col"><h2>' + era.label + "</h2>" +
          authors.map((a) => {
            const works = D.works.filter((w) => w.author === a.id);
            return (
              '<div class="author-card"><h3>' + escapeHtml(a.name) + "</h3>" +
              '<div class="dates">' + escapeHtml(a.dates) + " · " + escapeHtml(a.region) + "</div><ul>" +
              works.map((w) => "<li><a href='" + readRef(w.id) + "'>" + escapeHtml(w.title) + "</a></li>").join("") +
              "</ul></div>"
            );
          }).join("") + "</div>"
        );
      }).join("") + "</div>";
  }

  function renderStudy() {
    qs("#page").innerHTML =
      '<div class="prose">' +
      "<h1>Study desk</h1>" +
      "<p>This library is built around one work for now: Augustine's <em>Confessions</em>, in E. B. Pusey's public-domain English (Project Gutenberg eBook #3296) with the Latin <em>Confessiones</em> beside it. The thirteen books sit on a single page. Scroll the whole confession; use the book strip to jump. Switch <strong>Original</strong> for Latin only, or leave Split on for both columns.</p>" +
      '<div class="stat-row">' +
      stat("1", "Father") +
      stat("13", "Books") +
      stat("2", "Texts") +
      stat("PD", "License") +
      "</div>" +
      "<h2>How to read the Confessions</h2>" +
      "<p>Books I-IX tell Augustine's life up to his conversion and the death of Monica. Book X is a treatise on memory and temptation. Books XI-XIII turn the same prayer toward time and the opening of Genesis.</p>" +
      "<p>Search a keyword, or a book number (<em>Book 8</em>, <em>Confessions 10</em>). Notes sit in the column to the right of the text so the reading column is not broken by footnotes between paragraphs.</p>" +
      "<h2>First paths</h2>" +
      "<p><a href='read.html?work=confessions'>The whole work</a> · <a href='read.html?work=confessions&chapter=1'>Book I</a> · <a href='read.html?work=confessions&chapter=8'>Book VIII (the garden)</a> · <a href='read.html?work=confessions&chapter=10'>Book X</a></p>" +
      "</div>";
  }

  function stat(n, label) {
    return '<div class="stat"><strong>' + n + "</strong>" + label + "</div>";
  }

  function renderPlans() {
    qs("#page").innerHTML =
      '<div class="prose"><h1>Reading plans</h1>' +
      '<div class="archived"><p><strong>Archived.</strong> Reading plans are parked for now and are not linked from the rest of the site. The old demo plan list is kept below so the feature can come back later.</p></div></div>' +
      '<div class="plan-list" id="plans" style="margin-top:20px"></div>';
    const plans = [
      { id: "aug30", title: "Thirty days with Augustine", blurb: "Confessions I–III in this demo, then a pointer to the rest of the work.", days: [
        ["Day 1", "confessions", 1, "Praise, restlessness, the opening prayer"],
        ["Day 2", "confessions", 2, "Where can God come in?"],
        ["Day 3", "confessions", 3, "Infancy and the beginning of sin"]
      ]},
      { id: "inc7", title: "A week on the Incarnation", blurb: "Athanasius in three sittings — creation, embodiment, theosis.", days: [
        ["Day 1", "incarnation", 1, "Creation and the fall"],
        ["Day 2", "incarnation", 2, "Why the Word took a body"],
        ["Day 3", "incarnation", 3, "He became man that we might become God"]
      ]},
      { id: "apostolic", title: "Apostolic letters", blurb: "Rome, Antioch, Smyrna, and the Two Ways.", days: [
        ["Day 1", "1-clement", 1, "Clement to Corinth"],
        ["Day 2", "ign-romans", 2, "Wheat of God"],
        ["Day 3", "didache", 1, "The two ways"],
        ["Day 4", "polycarp-phil", 1, "Polycarp to Philippi"]
      ]}
    ];
    qs("#plans").innerHTML = plans.map((p) => {
      const done = JSON.parse(localStorage.getItem("fg-plan-" + p.id) || "[]");
      return (
        '<article class="plan"><span class="badge">FREE</span><h3>' + p.title + "</h3><p>" + p.blurb + "</p><ul>" +
        p.days.map((d, i) =>
          "<li><label><input type='checkbox' data-plan='" + p.id + "' data-i='" + i + "'" +
          (done.includes(i) ? " checked" : "") + "> <a href='" + readRef(d[1], d[2]) + "'>" + d[0] +
          "</a> — " + d[3] + "</label></li>"
        ).join("") + "</ul></article>"
      );
    }).join("");
    qsa("[data-plan]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const id = cb.dataset.plan;
        const on = qsa('[data-plan="' + id + '"]:checked').map((x) => Number(x.dataset.i));
        localStorage.setItem("fg-plan-" + id, JSON.stringify(on));
      });
    });
  }

  function renderAbout() {
    qs("#page").innerHTML =
      '<div class="prose">' +
      "<h1>Augustine’s Confessions</h1>" +
      "<p>Fathers Gateway is a searchable reader for public-domain patristic texts. The first work in the library is <em>The Confessions of Saint Augustine</em>: Pusey's English (1838) and the Latin <em>Confessiones</em>. The thirteen books are one scrollable work; Original and Split put the Latin on the page.</p>" +
      "<h2 id='editions'>This edition</h2>" +
      "<p>English texts follow <strong>Philip Schaff</strong>’s Nicene and Post-Nicene Fathers series. The Confessions English is <strong>E. B. Pusey, 1838</strong>. The reader bar always names the Church Father — never the translator.</p>" +
      "<p><strong>Pusey, 1838</strong> — public domain in the United States. Source file under <code>Fathers/English/</code> (Gutenberg #3296). The Project Gutenberg license is kept in <code>Regulations/Project GutenBerg</code>.</p>" +
      "<p><strong>Latin</strong> — the <em>Confessiones</em> in thirteen books, from <code>Fathers/Latin/</code>. Open a book and use <strong>Original</strong>, or keep Translation with Split on, to read it.</p>" +
      "<h2 id='privacy'>Privacy</h2>" +
      "<p>The mock stores display name, font size, night mode, and highlights in <code>localStorage</code>. Sign-in is local only. OAuth buttons are optional placeholders and do not call a provider.</p>" +
      "<p class='fineprint'>“Bible Gateway” is a trademark of its owner; this project is an independent design study and is not affiliated with HarperCollins Christian Publishing.</p>" +
      "</div>";
  }

  function renderGive() {
    qs("#page").innerHTML =
      '<div class="prose">' +
      "<h1>Give</h1>" +
      '<div class="give-card">' +
      "<h2>Support the library</h2>" +
      "<p>Piblia is a public-domain Church Fathers reader. A donation link will live here as soon as it is set.</p>" +
      "</div></div>";
  }

  function renderSettings() {
    function row(id, label, on) {
      return '<div class="set-row"><span>' + label + '</span><button type="button" class="switch' + (on ? " on" : "") + '" data-set="' + id + '" aria-pressed="' + on + '" aria-label="' + label + '"></button></div>';
    }
    const themeNight = (localStorage.getItem("fg-theme") || "day") === "night";
    const font = Number(localStorage.getItem("fg-font") || 18);
    qs("#page").innerHTML =
      '<div class="prose">' +
      "<h1>Settings</h1>" +
      row("theme", "Night mode", themeNight) +
      '<div class="set-row"><span>Text size</span><div class="font-step">' +
      '<button type="button" id="setFontDown" aria-label="Smaller">A−</button>' +
      '<button type="button" id="setFontUp" aria-label="Larger">A+</button></div></div>' +
      row("nums", "Paragraph numbers", storedOpt("nums", true)) +
      row("head", "Section headings", storedOpt("head", true)) +
      row("fn", "Notes", storedOpt("fn", true)) +
      row("xref", "Scripture references", storedOpt("xref", true)) +
      '<h2 id="parallel-layout">Parallel layout</h2>' +
      "<p>Choose which panes sit in the landscape cycle. Tap L or R on the reader to walk through whatever the other side is not showing.</p>" +
      '<div id="parLayout"></div>' +
      "<p class='fineprint'>English editions on this site currently follow Philip Schaff’s NPNF series (Pusey for the Confessions). The translator is not shown in the reader bar — only the Father, the work, and the liber.</p>" +
      "</div>";
    qsa("[data-set]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.set;
        if (id === "theme") {
          const next = (localStorage.getItem("fg-theme") || "day") === "night" ? "day" : "night";
          localStorage.setItem("fg-theme", next);
          applyTheme();
          btn.classList.toggle("on", next === "night");
          return;
        }
        const next = !storedOpt(id, true);
        setStoredOpt(id, next);
        btn.classList.toggle("on", next);
        applyReadOptions();
      });
    });
    qs("#setFontUp")?.addEventListener("click", () => {
      const n = Math.min(26, Number(localStorage.getItem("fg-font") || 18) + 2);
      localStorage.setItem("fg-font", n); applyFont();
    });
    qs("#setFontDown")?.addEventListener("click", () => {
      const n = Math.max(14, Number(localStorage.getItem("fg-font") || 18) - 2);
      localStorage.setItem("fg-font", n); applyFont();
    });
    if (w.FG.parallel) w.FG.parallel.mountSettings();
  }

  const pages = {
    home: renderHome,
    read: renderRead,
    search: renderSearch,
    browse: renderBrowse,
    study: renderStudy,
    plans: renderPlans,
    about: renderAbout,
    give: renderGive,
    settings: renderSettings
  };

  w.FG = {
    boot(page) {
      mountChrome(page);
      const run = pages[page];
      if (run) run();
      if (w.FG.mountIOS) w.FG.mountIOS(page);
    }
  };
})(window);
