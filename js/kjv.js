/* Public-domain KJV loader. Fetches one book at a time from Bibles/KJV/. */
(function (w) {
  const cache = {};
  let manifest = null;
  const BASE = "Bibles/KJV/";

  function loadManifest() {
    if (manifest) return Promise.resolve(manifest);
    return fetch(BASE + "manifest.json").then((r) => r.json()).then((m) => {
      manifest = m;
      return m;
    });
  }

  function loadBook(id) {
    if (cache[id]) return Promise.resolve(cache[id]);
    return fetch(BASE + encodeURIComponent(id) + ".json").then((r) => {
      if (!r.ok) throw new Error("KJV book missing: " + id);
      return r.json();
    }).then((b) => {
      cache[id] = b;
      return b;
    });
  }

  function storedRef() {
    try {
      const v = JSON.parse(localStorage.getItem("fg-kjv-ref") || "null");
      if (v && v.book) return v;
    } catch (e) { /* ignore */ }
    return { book: "gn", chapter: 1 };
  }

  function setRef(book, chapter) {
    localStorage.setItem("fg-kjv-ref", JSON.stringify({ book: book, chapter: chapter }));
  }

  w.FG = w.FG || {};
  w.FG.KJV = {
    loadManifest: loadManifest,
    loadBook: loadBook,
    storedRef: storedRef,
    setRef: setRef
  };
})(window);
