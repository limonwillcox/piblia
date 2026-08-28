/* Catalog for the Augustine Confessions library. Full text: js/confessions-data.js */
window.FG_DATA = {
  versions: [
    { id: "pusey", label: "Pusey (1838)", short: "Pusey", group: "translation" },
    { id: "lat", label: "Latin", short: "Latin", group: "original" }
  ],
  authors: [
    { id: "augustine", name: "Augustine of Hippo", dates: "354–430", era: "post-nicene", region: "North Africa" }
  ],
  eras: [
    { id: "post-nicene", label: "Post-Nicene" }
  ],
  works: [
    {
      id: "confessions",
      author: "augustine",
      title: "The Confessions",
      short: "Conf.",
      chapters: 13,
      series: "Pusey"
    }
  ],
  votd: { work: "confessions", chapter: 1, para: 0 },
  passages: []
};

(function () {
  const C = window.FG_CONFESSIONS;
  if (!C || !C.books) return;
  window.FG_DATA.passages = C.books.map(function (b) {
    return {
      work: "confessions",
      chapter: b.n,
      heading: b.heading,
      versions: { pusey: b.paras, lat: b.latin || [] },
      footnotes: (b.notes || []).map(function (n) {
        return { n: n.n, text: n.text, para: n.para };
      }),
      scripture: []
    };
  });
  const w = window.FG_DATA.works[0];
  if (w) w.chapters = C.books.length;
})();
