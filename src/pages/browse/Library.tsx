import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  SHELF_PERIODS,
  deathCentury,
  defaultBinWidthPx,
  inspectTimelineEra,
  packAuthorCatalog,
  packCatalog,
  periodIdForAuthor,
  spineBandPlace,
  type PackedBook,
  type PackedShelf,
  type ShelfPeriodId
} from "../../../server/shelf";
import type { Author, Catalog, Work } from "../../../server/types";

const DESKTOP_MQ = "(min-width: 761px)";

export function useDesktopLibrary(): boolean {
  const [on, setOn] = useState(() => typeof window !== "undefined" && window.matchMedia(DESKTOP_MQ).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const onChange = () => setOn(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return on;
}

function periodMeta(id: ShelfPeriodId) {
  return SHELF_PERIODS.find((p) => p.id === id)!;
}

function formatWords(n: number): string {
  if (n >= 10000) return Math.round(n / 1000) + "k words";
  return n.toLocaleString() + " words";
}

function authorTint(id: string): number {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i) * (i + 1)) % 5;
  return n;
}

/** Well-known shelf form. Full enough to read; no ellipsis. */
const SHELF_NAMES: Record<string, string> = {
  ambrose: "Ambrose",
  arnobius: "Arnobius",
  augustine: "Augustine",
  commodianus: "Commodianus",
  gregory: "Gregory the Great",
  gregory_thaumaturgus: "Gregory Thaumaturgus",
  methodius: "Methodius",
  jerome: "Jerome",
  lactantius: "Lactantius",
  leo: "Leo",
  minucius_felix: "Minucius Felix",
  novatian: "Novatian",
  sulpicius_severus: "Sulpicius",
  tertullian: "Tertullian",
  vincent: "Vincent",
  justin: "Justin",
  irenaeus: "Irenaeus",
  clement_rome: "Clement of Rome",
  ignatius: "Ignatius",
  polycarp: "Polycarp",
  hermas: "Hermas",
  barnabas: "Barnabas",
  didache: "Didache",
  papias: "Papias",
  mathetes: "Mathetes",
  tatian: "Tatian",
  theophilus: "Theophilus",
  athenagoras: "Athenagoras",
  clement_alexandria: "Clement of Alexandria",
  origen: "Origen",
  hippolytus: "Hippolytus",
  cyprian: "Cyprian",
  dionysius: "Dionysius",
  eusebius: "Eusebius",
  athanasius: "Athanasius",
  basil: "Basil",
  gregory_nazianzen: "Gregory Nazianzen",
  gregory_nyssa: "Gregory of Nyssa",
  chrysostom: "Chrysostom",
  cyril_jerusalem: "Cyril",
  hilary: "Hilary",
  john_damascus: "John of Damascus",
  socrates: "Socrates",
  sozomen: "Sozomen",
  theodoret: "Theodoret",
  rufinus: "Rufinus",
  cassian: "Cassian",
  ephraim: "Ephraim",
  aphrahat: "Aphrahat",
  councils: "Councils",
  apostolic: "Apostolic Fathers",
  unknown: "Unknown"
};

function shelfName(author: Author | undefined, id: string): string {
  return SHELF_NAMES[id] || author?.name || id;
}

function spineFontPx(binWidth: number, title: string): number {
  const base = Math.min(20, Math.max(13, Math.round(binWidth * 0.42)));
  if (title.length > 42) return Math.max(10, base - 5);
  if (title.length > 32) return Math.max(11, base - 3);
  if (title.length > 22) return Math.max(12, base - 1);
  return base;
}

function SpineMark() {
  return (
    <svg className="lib-spine-mark" viewBox="0 0 32 32" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M8 25 V11 Q8 5 16 5 Q24 5 24 11 V25" />
        <path d="M12 25 V14 Q12 10 16 10 Q20 10 20 14 V25" />
      </g>
    </svg>
  );
}

function SpineBands({ century, half }: { century: number; half?: "a" | "b" }) {
  const pairs =
    half === "a" ? Math.ceil(century / 2) : half === "b" ? Math.floor(century / 2) : century;
  return (
    <span className="lib-spine-bands" aria-hidden="true">
      {Array.from({ length: pairs }, (_, i) => (
        <span className="lib-spine-pair" key={i}>
          <i />
          <i />
        </span>
      ))}
    </span>
  );
}

function authorRunStyle(label: string, width: number): { width: number; fontSize: number; letterSpacing: string } {
  const inner = Math.max(18, width - 10);
  const size = Math.min(15, Math.max(9, Math.floor(inner / (Math.max(label.length, 1) * 0.58))));
  return { width, fontSize: size, letterSpacing: size < 12 ? "0.01em" : "0.05em" };
}

type LibraryMode = "periods" | "authors";
const MODE_KEY = "piblia-library-mode";

type LibraryProps = { catalog: Catalog };

export function Library({ catalog }: LibraryProps) {
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1100);
  const [mode, setMode] = useState<LibraryMode>(() => {
    if (typeof localStorage === "undefined") return "periods";
    return localStorage.getItem(MODE_KEY) === "authors" ? "authors" : "periods";
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [coverOpen, setCoverOpen] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [chipId, setChipId] = useState<ShelfPeriodId>(SHELF_PERIODS[0].id);

  const packed = useMemo(() => packCatalog(catalog, Math.max(320, width)), [catalog, width]);
  const authorPacked = useMemo(() => packAuthorCatalog(catalog), [catalog]);
  const flat = useMemo(() => {
    if (mode === "authors") {
      return authorPacked.flatMap((a) => {
        const who = catalog.authors.find((x) => x.id === a.authorId);
        const periodId = who ? periodIdForAuthor(who) : ("apostolic" as ShelfPeriodId);
        return a.shelves.flatMap((shelf) => shelf.map((book) => ({ book, periodId })));
      });
    }
    return packed.flatMap((s) => s.runs.flatMap((r) => r.books.map((b) => ({ book: b, periodId: s.periodId }))));
  }, [mode, packed, authorPacked, catalog.authors]);
  const authors = useMemo(() => new Map(catalog.authors.map((a) => [a.id, a])), [catalog.authors]);
  const works = useMemo(() => new Map(catalog.works.map((w) => [w.id, w])), [catalog.works]);

  useEffect(() => {
    document.body.classList.add("browse-library");
    return () => document.body.classList.remove("browse-library");
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.floor(el.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "periods") return;
    const rows = trackRef.current?.querySelectorAll<HTMLElement>("[data-shelf-period]");
    if (!rows?.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const id = hit?.target.getAttribute("data-shelf-period") as ShelfPeriodId | null;
        if (id) setChipId(id);
      },
      { rootMargin: "-120px 0px -45% 0px", threshold: 0.15 }
    );
    rows.forEach((row) => io.observe(row));
    return () => io.disconnect();
  }, [mode, packed.length]);

  function indexOf(id: string | null): number {
    if (!id) return -1;
    return flat.findIndex((x) => x.book.workId === id);
  }

  function selectAt(i: number) {
    const item = flat[(i + flat.length) % flat.length];
    if (!item) return;
    setSelectedId(item.book.workId);
    if (inspectId) {
      setInspectId(item.book.workId);
      setCoverOpen(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (inspectId) {
          setInspectId(null);
          setCoverOpen(false);
          setExpanding(false);
        }
        return;
      }
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const cur = indexOf(inspectId || selectedId);
        const next = cur < 0 ? 0 : cur + (e.key === "ArrowRight" ? 1 : -1);
        selectAt(next);
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const cur = indexOf(inspectId || selectedId);
        const dir = e.key === "ArrowDown" ? 1 : -1;
        const approxPerShelf = Math.max(8, Math.round(width / 56));
        selectAt(cur < 0 ? 0 : cur + dir * approxPerShelf);
      }
      if ((e.key === "Enter" || e.key === " ") && selectedId && !inspectId) {
        e.preventDefault();
        setInspectId(selectedId);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [flat, inspectId, selectedId, width]);

  function openInspect(id: string) {
    setSelectedId(id);
    setInspectId(id);
    setCoverOpen(false);
    setExpanding(false);
  }

  function goRead(id: string) {
    const href = "/read?work=" + encodeURIComponent(id);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      navigate(href);
      return;
    }
    setExpanding(true);
    window.setTimeout(() => navigate(href), 420);
  }

  const inspectBook = inspectId ? works.get(inspectId) : undefined;
  const inspectAuthor = inspectBook ? authors.get(inspectBook.author) : undefined;
  const inspectPeriod = inspectId ? flat.find((x) => x.book.workId === inspectId)?.periodId : undefined;
  const inspectBin = inspectId ? flat.find((x) => x.book.workId === inspectId)?.book.bin : 5;

  return (
    <div className={"library" + (mode === "authors" ? " library--authors" : "")}>
      <div className="lib-toolbar">
        <div className="lib-mode" role="tablist" aria-label="Library arrangement">
          <button type="button" className={mode === "periods" ? "is-on" : ""} onClick={() => setMode("periods")}>
            Periods
          </button>
          <button type="button" className={mode === "authors" ? "is-on" : ""} onClick={() => setMode("authors")}>
            Authors
          </button>
        </div>
        {mode === "periods" ? (
          <div className="lib-chip" aria-live="polite">
            <span>{periodMeta(chipId).label}</span>
          </div>
        ) : null}
      </div>
      <div className="lib-track" ref={trackRef}>
        {mode === "authors"
          ? authorPacked.map((block) => {
              const author = authors.get(block.authorId);
              if (!author) return null;
              return (
                <AuthorSection
                  key={block.authorId}
                  author={author}
                  shelves={block.shelves}
                  catalogWorks={works}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onOpen={openInspect}
                />
              );
            })
          : packed.map((shelf, i) => (
              <ShelfRow
                key={shelf.periodId + "-" + i}
                shelf={shelf}
                catalogAuthors={authors}
                catalogWorks={works}
                selectedId={selectedId}
                onOpen={openInspect}
                onSelect={setSelectedId}
              />
            ))}
      </div>
      {inspectBook && inspectAuthor && inspectPeriod ? (
        <InspectOverlay
          work={inspectBook}
          author={inspectAuthor}
          periodId={inspectPeriod}
          bin={inspectBin || 5}
          coverOpen={coverOpen}
          expanding={expanding}
          onHoverBook={setCoverOpen}
          onClose={() => {
            setInspectId(null);
            setCoverOpen(false);
            setExpanding(false);
          }}
          onRead={() => goRead(inspectBook.id)}
        />
      ) : null}
    </div>
  );
}

function authorHue(id: string): number {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i) * (i + 3)) % 8;
  return n;
}

function AuthorSection({
  author,
  shelves,
  catalogWorks,
  selectedId,
  onSelect,
  onOpen
}: {
  author: Author;
  shelves: PackedBook[][];
  catalogWorks: Map<string, Work>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onOpen: (id: string) => void;
}) {
  const hue = authorHue(author.id);
  const periodId = periodIdForAuthor(author);
  return (
    <section className="lib-author-section" data-author={author.id}>
      <header className="lib-author-head">
        <h2>{shelfName(author, author.id)}</h2>
        {author.dates ? <p>{author.dates}</p> : null}
      </header>
      {shelves.map((books, i) => (
        <div className="lib-poem-shelf" key={author.id + "-" + i}>
          <div className="lib-poem-line">
            <div className="lib-shelf-books">
              {books.map((book) => {
                const work = catalogWorks.get(book.workId);
                if (!work) return null;
                return (
                  <BookSpine
                    key={book.workId}
                    work={work}
                    author={author}
                    book={book}
                    periodId={periodId}
                    hue={hue}
                    selected={selectedId === book.workId}
                    onSelect={() => onSelect(book.workId)}
                    onDeselect={() => onSelect(null)}
                    onOpen={() => onOpen(book.workId)}
                  />
                );
              })}
            </div>
            <div className="lib-plank" aria-hidden="true" />
          </div>
        </div>
      ))}
    </section>
  );
}

function ShelfRow({
  shelf,
  catalogAuthors,
  catalogWorks,
  selectedId,
  onSelect,
  onOpen
}: {
  shelf: PackedShelf;
  catalogAuthors: Map<string, Author>;
  catalogWorks: Map<string, Work>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onOpen: (id: string) => void;
}) {
  const period = periodMeta(shelf.periodId);
  return (
    <section className="lib-shelf-row" data-shelf-period={shelf.periodId} data-period-end={shelf.isPeriodEnd ? "1" : "0"}>
      <div className="lib-shelf-wood">
        <div className="lib-shelf-books">
          {shelf.runs.map((run) =>
            run.books.map((book) => {
              const work = catalogWorks.get(book.workId);
              const author = catalogAuthors.get(book.authorId);
              if (!work || !author) return null;
              return (
                <BookSpine
                  key={book.workId}
                  work={work}
                  author={author}
                  book={book}
                  periodId={shelf.periodId}
                  selected={selectedId === book.workId}
                  onSelect={() => onSelect(book.workId)}
                  onDeselect={() => onSelect(null)}
                  onOpen={() => onOpen(book.workId)}
                />
              );
            })
          )}
          {shelf.isPeriodEnd ? (
            <div className="lib-bookend" aria-hidden="true">
              <span className="lib-bookend-year">{period.bookendYear}</span>
            </div>
          ) : null}
          {shelf.isPeriodEnd && shelf.nextPeriodLabel ? (
            <p className="lib-era-next">{shelf.nextPeriodLabel}</p>
          ) : null}
        </div>
        <div className="lib-plank" aria-hidden="true" />
        <div className="lib-author-bar">
          {shelf.runs.map((run) => {
            const author = catalogAuthors.get(run.authorId);
            const w = run.books.reduce((n, b) => n + defaultBinWidthPx(b.bin), 0);
            const label = shelfName(author, run.authorId) + (run.continued ? " (Cont.)" : "");
            return (
              <span className="lib-author-run" style={authorRunStyle(label, w)} key={run.authorId + (run.continued ? "-c" : "")}>
                {label}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BookSpine({
  work,
  author,
  book,
  periodId,
  hue,
  selected,
  onSelect,
  onDeselect,
  onOpen
}: {
  work: Work;
  author: Author;
  book: PackedBook;
  periodId: ShelfPeriodId;
  hue?: number;
  selected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onOpen: () => void;
}) {
  const href = "/read?work=" + encodeURIComponent(work.id);
  const century = deathCentury(author.deathYear);
  const bandPlace = spineBandPlace(century);
  const binW = defaultBinWidthPx(book.bin);
  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onOpen();
  }
  return (
    <a
      className={"lib-book" + (selected ? " is-selected" : "")}
      href={href}
      data-period={periodId}
      data-century={century}
      data-band-place={bandPlace}
      data-hue={hue == null ? undefined : hue}
      data-tint={hue == null ? authorTint(author.id) : undefined}
      data-bin={book.bin}
      style={{
        width: binW,
        ["--spine-size" as string]: spineFontPx(binW, work.title) + "px"
      }}
      aria-label={work.title + " — " + author.name}
      onMouseEnter={onSelect}
      onMouseLeave={onDeselect}
      onFocus={onSelect}
      onBlur={onDeselect}
      onClick={onClick}
    >
      <span className="lib-book-scene">
        <span className="lib-book-box">
          <span className="lib-face lib-face-spine">
            <span className="lib-spine-head">
              <SpineMark />
              <span className="lib-spine-rule lib-spine-rule--crown" aria-hidden="true" />
              {bandPlace === "upper" ? <SpineBands century={century} /> : null}
              {bandPlace === "split" ? <SpineBands century={century} half="a" /> : null}
            </span>
            <span className="lib-spine-title">{work.title}</span>
            {bandPlace === "lower" ? (
              <span className="lib-spine-foot">
                <SpineBands century={century} />
              </span>
            ) : null}
            {bandPlace === "split" ? (
              <span className="lib-spine-foot">
                <SpineBands century={century} half="b" />
              </span>
            ) : null}
          </span>
          <span className="lib-face lib-face-front">
            {work.cover ? <img src={work.cover} alt="" /> : null}
            <span className="lib-front-title">{work.title}</span>
            <span className="lib-front-author">{author.name}</span>
          </span>
          <span className="lib-face lib-face-pages" />
        </span>
      </span>
    </a>
  );
}

function InspectOverlay({
  work,
  author,
  periodId,
  bin,
  coverOpen,
  expanding,
  onHoverBook,
  onClose,
  onRead
}: {
  work: Work;
  author: Author;
  periodId: ShelfPeriodId;
  bin: number;
  coverOpen: boolean;
  expanding: boolean;
  onHoverBook: (open: boolean) => void;
  onClose: () => void;
  onRead: () => void;
}) {
  const era = inspectTimelineEra(work.id, periodId, author.deathYear);
  return (
    <div className="lib-inspect" role="dialog" aria-modal="true" aria-labelledby="lib-inspect-title">
      <button type="button" className="lib-inspect-back" aria-label="Close" onClick={onClose} />
      <div className="lib-inspect-grid">
        <aside className="lib-inspect-author">
          <h2>{author.name}</h2>
          <p className="lib-inspect-meta">
            {author.dates}
            {author.region ? " · " + author.region : ""}
          </p>
          {author.bio ? <p>{author.bio}</p> : null}
        </aside>
        <div className="lib-inspect-stage">
          <button
            type="button"
            className={
              "lib-inspect-book" +
              (coverOpen ? " is-open" : "") +
              (expanding ? " is-expanding" : "")
            }
            data-period={periodId}
            style={{ ["--bin" as string]: String(bin) }}
            onMouseEnter={() => onHoverBook(true)}
            onMouseLeave={() => onHoverBook(false)}
            onClick={onRead}
          >
            <span className="lib-inspect-3d">
              <span className="lib-inspect-front">
                {work.cover ? <img src={work.cover} alt="" /> : null}
                <span className="lib-front-title">{work.title}</span>
                <span className="lib-front-author">{author.name}</span>
              </span>
              <span className="lib-inspect-page">
                <span id="lib-inspect-title">{work.title}</span>
                <span>{author.name}</span>
                <strong>Click to read</strong>
              </span>
            </span>
          </button>
        </div>
        <aside className="lib-inspect-era">
          <p className="lib-inspect-date">{era.display}</p>
          <h2>{era.title}</h2>
          <p>{era.body}</p>
        </aside>
        <div className="lib-inspect-blurb">
          <p>
            <strong>{work.title}</strong>
            {" · "}
            {work.series}
            {" · "}
            {work.chapters} {work.chapters === 1 ? "part" : "parts"}
            {" · "}
            {formatWords(work.wordCount)}
          </p>
          {work.blurb ? <p>{work.blurb}</p> : null}
        </div>
      </div>
    </div>
  );
}
