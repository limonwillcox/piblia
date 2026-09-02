import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { parseQuery, translationsOf } from "../../server/query";
import { useApp } from "../context/AppContext";
import type { ReadOptId } from "../lib/prefs";
import { ICONS } from "./Icons";

function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Piblia">
      <img className="logo" src="/assets/piblia-logo.jpg" alt="" width={32} height={32} />
      <span className="brand-name">Piblia</span>
    </Link>
  );
}

function Rail() {
  const { navOpen, opts, parallel, toggleOpt, setParallel, setNavOpen } = useApp();
  const location = useLocation();
  const readActive = location.pathname === "/" || location.pathname === "/read";
  const tools: { id: ReadOptId | "parallel"; label: string; title: string; on: boolean }[] = [
    { id: "nums", label: "Nos", title: "Paragraph numbers", on: opts.nums },
    { id: "head", label: "Heads", title: "Section headings", on: opts.head },
    { id: "fn", label: "Notes", title: "Footnotes", on: opts.fn },
    { id: "xref", label: "Refs", title: "Scripture references", on: opts.xref },
    { id: "parallel", label: "Split", title: "Parallel original on the right", on: parallel }
  ];
  return (
    <nav className={"rail" + (navOpen ? " open" : "")} id="rail" aria-label="Primary">
      <div className="rail-pages">
        <NavLink to="/" end className={() => (readActive ? "active" : "")} onClick={() => setNavOpen(false)}>
          {ICONS.read}
          <span>Read</span>
        </NavLink>
        <NavLink to="/study" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setNavOpen(false)}>
          {ICONS.study}
          <span>Study</span>
        </NavLink>
        <NavLink to="/browse" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setNavOpen(false)}>
          {ICONS.browse}
          <span>Browse</span>
        </NavLink>
        <NavLink
          to="/church-history/"
          className={({ isActive }) => (isActive ? "active" : "")}
          onClick={() => setNavOpen(false)}
        >
          {ICONS.history}
          <span>History</span>
        </NavLink>
        <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setNavOpen(false)}>
          {ICONS.about}
          <span>About</span>
        </NavLink>
        <NavLink to="/give" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setNavOpen(false)}>
          {ICONS.give}
          <span>Give</span>
        </NavLink>
      </div>
      <div className="rail-tools" aria-label="Reading options">
        {tools.map((t) => (
          <button
            key={t.id}
            type="button"
            className={"rail-tool" + (t.on ? " active" : "")}
            data-readopt={t.id}
            title={t.title}
            onClick={() => {
              if (t.id === "parallel") setParallel(!parallel);
              else toggleOpt(t.id);
            }}
          >
            {ICONS[t.id]}
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function Header() {
  const { user, theme, setTheme, setNavOpen, setLoginOpen, setUser, navOpen } = useApp();
  return (
    <header className="site-header">
      <button
        className="icon-btn hamburger"
        id="hamburger"
        aria-label="Open menu"
        onClick={() => setNavOpen(!navOpen)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      <Brand />
      <div className="header-actions">
        <button
          className="icon-btn"
          id="themeBtn"
          title="Night mode"
          aria-label="Toggle night mode"
          onClick={() => setTheme(theme === "night" ? "day" : "night")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
          </svg>
        </button>
        {user ? (
          <>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{user}</span>
            <button className="linkish" id="signOut" onClick={() => setUser(null)}>
              Sign out
            </button>
          </>
        ) : (
          <button className="linkish" id="loginBtn" onClick={() => setLoginOpen(true, "signin")}>
            Log In
          </button>
        )}
      </div>
    </header>
  );
}

function SearchStrip() {
  const { catalog, mode, setMode, version, setVersion, font, setFont, booklistOpen, setBooklistOpen, activePassage } = useApp();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useStateLocal(params.get("q") || "");
  const navigate = useNavigate();
  const location = useLocation();
  const onRead = location.pathname === "/read";

  function applyMode(next: "translation" | "original") {
    setMode(next);
    if (onRead) {
      const nextParams = new URLSearchParams(params);
      nextParams.set("mode", next);
      setParams(nextParams, { replace: true });
    }
  }

  useEffect(() => {
    const next = params.get("q") || "";
    setQ(next);
  }, [params]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = catalog ? parseQuery(q, catalog) : { type: "keyword" as const, q };
    if (parsed.type === "ref") {
      const ch = parsed.chapter;
      navigate("/read?work=" + encodeURIComponent(parsed.work) + (ch != null ? "&chapter=" + ch : "") + (ch != null ? "#ch-" + ch : ""));
      return;
    }
    navigate("/search?q=" + encodeURIComponent(q));
  }

  const trans = onRead && mode === "translation" && activePassage ? translationsOf(activePassage, catalog?.versions || []) : [];
  const showEditions = trans.length > 0;

  return (
    <div className="search-strip">
      <form className="search-row" id="searchForm" onSubmit={onSubmit}>
        <input
          type="search"
          name="q"
          id="q"
          placeholder="Search Confessions (e.g. Book 8, restless, pear tree)"
          value={q}
          aria-label="Search writings"
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="lang-toggle" role="group" aria-label="Text language">
          <button type="button" data-mode="translation" className={mode === "translation" ? "active" : ""} onClick={() => applyMode("translation")}>
            Translation
          </button>
          <button type="button" data-mode="original" className={mode === "original" ? "active" : ""} onClick={() => applyMode("original")}>
            Original
          </button>
        </div>
        <button className="btn-search" type="submit">
          Search
        </button>
      </form>
      <div className={"edition-bar" + (showEditions ? " show" : "")} id="editionBar" aria-label="Available translations">
        {showEditions
          ? trans.map((v) => (
              <button
                key={v.id}
                type="button"
                className={"edition-chip" + (v.id === version || (!version && v.id === trans[0]?.id) ? " active" : "")}
                data-edition={v.id}
                onClick={() => {
                  setVersion(v.id);
                  if (onRead) {
                    const nextParams = new URLSearchParams(params);
                    nextParams.set("version", v.id);
                    setParams(nextParams, { replace: true });
                  }
                }}
              >
                {v.short}
              </button>
            ))
          : null}
      </div>
      <div className="search-tools">
        <button type="button" id="booklistBtn" onClick={() => setBooklistOpen(!booklistOpen)}>
          Writings list
        </button>
        <Link to="/search?advanced=1">Advanced search</Link>
        <div className="font-ctrl">
          Aa{" "}
          <button type="button" id="fontDown" aria-label="Decrease text size" onClick={() => setFont(Math.max(14, font - 2))}>
            −
          </button>
          <button type="button" id="fontUp" aria-label="Increase text size" onClick={() => setFont(Math.min(26, font + 2))}>
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function useStateLocal(initial: string) {
  return useState(initial);
}

function Booklist() {
  const { catalog, booklistOpen, setBooklistOpen } = useApp();
  const [authorId, setAuthorId] = useState("augustine");
  if (!catalog || !booklistOpen) {
    return <div className="booklist" id="booklist" hidden />;
  }
  const author = catalog.authors.find((a) => a.id === authorId) || catalog.authors[0];
  const works = author ? catalog.works.filter((w) => w.author === author.id) : [];
  return (
    <div className="booklist open" id="booklist">
      <div className="booklist-eras">
        {catalog.eras.map((era) => (
          <div key={era.id}>
            <div className="era-label">{era.label}</div>
            {catalog.authors
              .filter((a) => a.era === era.id)
              .map((a) => (
                <button
                  key={a.id}
                  type="button"
                  data-author={a.id}
                  className={a.id === author?.id ? "active" : ""}
                  onClick={() => setAuthorId(a.id)}
                >
                  {a.name}
                </button>
              ))}
          </div>
        ))}
      </div>
      <div className="booklist-works" id="booklistWorks">
        {author ? (
          <>
            <h3>{author.name}</h3>
            <div className="meta">
              {author.dates} · {author.region}
            </div>
            {works.map((w) => (
              <div key={w.id}>
                <Link className="work-link" to={"/read?work=" + w.id} onClick={() => setBooklistOpen(false)}>
                  <strong>{w.title}</strong>{" "}
                  <span className="meta">
                    ({w.short} · {w.series})
                  </span>
                </Link>
                <div className="chapters">
                  {Array.from({ length: w.chapters }, (_, i) => i + 1).map((n) => (
                    <Link key={n} to={"/read?work=" + w.id + "&chapter=" + n + "#ch-" + n} onClick={() => setBooklistOpen(false)}>
                      {n}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}

function Footer() {
  const { setLoginOpen, user } = useApp();
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <h4>Read</h4>
          <Link to="/read?work=confessions">The Confessions</Link>
          <Link to="/read?work=confessions&chapter=1">Book I</Link>
          <Link to="/read?work=confessions&chapter=8">Book VIII</Link>
          <Link to="/browse">Browse</Link>
        </div>
        <div>
          <h4>Study</h4>
          <Link to="/study">Study desk</Link>
          <Link to="/search?q=incarnation">Keyword search</Link>
          <Link to="/church-history/">Church history</Link>
          <Link to="/church-history/#pre-nicene">Before Nicaea</Link>
          <Link to="/church-history/#post-nicene">After Nicaea</Link>
          <Link to="/about#editions">Editions</Link>
        </div>
        <div>
          <h4>Account</h4>
          {user ? (
            <span>{user}</span>
          ) : (
            <a
              href="#"
              id="footerLogin"
              onClick={(e) => {
                e.preventDefault();
                setLoginOpen(true, "signin");
              }}
            >
              Sign in
            </a>
          )}
          <Link to="/about#privacy">Privacy</Link>
          <Link to="/give">Give</Link>
        </div>
      </div>
      <p className="legal">
        Piblia is a searchable library of public-domain Church Father writings. Texts come from the Ante-Nicene Fathers and Nicene
        and Post-Nicene Fathers series (ed. Roberts, Donaldson, Schaff) and related 19th-century editions.
      </p>
    </footer>
  );
}

function AuthModal() {
  const { loginOpen, loginTab, setLoginOpen, setLoginTab, setUser, showToast } = useApp();
  const [signinEmail, setSigninEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  if (!loginOpen) {
    return (
      <div className="modal-back" id="loginModal">
        <div className="modal" role="dialog" aria-labelledby="loginTitle" />
      </div>
    );
  }
  return (
    <div
      className="modal-back open"
      id="loginModal"
      onClick={(e) => {
        if ((e.target as HTMLElement).id === "loginModal") setLoginOpen(false);
      }}
    >
      <div className="modal" role="dialog" aria-labelledby="loginTitle">
        <h2 id="loginTitle">{loginTab === "create" ? "Create account" : "Sign in"}</h2>
        <div className="auth-tabs">
          <button type="button" className={loginTab === "signin" ? "active" : ""} data-auth="signin" onClick={() => setLoginTab("signin")}>
            Sign in
          </button>
          <button type="button" className={loginTab === "create" ? "active" : ""} data-auth="create" onClick={() => setLoginTab("create")}>
            Create account
          </button>
        </div>
        {loginTab === "signin" ? (
          <div className="auth-panel active" id="panel-signin">
            <label>Email</label>
            <input id="signinEmail" type="email" placeholder="you@example.org" value={signinEmail} onChange={(e) => setSigninEmail(e.target.value)} />
            <label>Password</label>
            <input id="signinPass" type="password" placeholder="Password" />
            <button
              className="btn-burgundy"
              id="signinSubmit"
              style={{ width: "100%" }}
              onClick={() => {
                const email = signinEmail.trim();
                setUser(email ? email.split("@")[0] : "Reader");
                setLoginOpen(false);
              }}
            >
              Sign in
            </button>
          </div>
        ) : (
          <div className="auth-panel active" id="panel-create">
            <label>Display name</label>
            <input id="loginName" placeholder="e.g. Paula of Bethlehem" value={createName} onChange={(e) => setCreateName(e.target.value)} />
            <label>Email</label>
            <input id="loginEmail" type="email" placeholder="you@example.org" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} />
            <label>Password</label>
            <input id="loginPass" type="password" placeholder="Create a password" />
            <button
              className="btn-burgundy"
              id="loginSubmit"
              style={{ width: "100%" }}
              onClick={() => {
                const name = (createName || createEmail || "Reader").trim();
                setUser(name.includes("@") ? name.split("@")[0] : name);
                setLoginOpen(false);
              }}
            >
              Create account
            </button>
          </div>
        )}
        <div className="oauth-block">
          <p className="fineprint" style={{ marginTop: 0 }}>
            OAuth is optional and not required. It is not connected in this mock.
          </p>
          <button type="button" className="btn-oauth" data-oauth="google" onClick={() => showToast("OAuth is optional and not connected in this mock.")}>
            Continue with Google
          </button>
          <button type="button" className="btn-oauth" data-oauth="microsoft" onClick={() => showToast("OAuth is optional and not connected in this mock.")}>
            Continue with Microsoft
          </button>
        </div>
        <p style={{ textAlign: "center", margin: "12px 0 0" }}>
          <button className="linkish" id="loginCancel" onClick={() => setLoginOpen(false)}>
            Cancel
          </button>
        </p>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { setNavOpen, setBooklistOpen, setLoginOpen, toast, navOpen } = useApp();
  const location = useLocation();

  useEffect(() => {
    document.body.classList.toggle("nav-open", navOpen);
  }, [navOpen]);

  useEffect(() => {
    setNavOpen(false);
    setBooklistOpen(false);
  }, [location.pathname, location.search, setNavOpen, setBooklistOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLoginOpen(false);
        setBooklistOpen(false);
        setNavOpen(false);
      }
    }
    function onClick(e: MouseEvent) {
      if (!navOpen) return;
      const t = e.target as HTMLElement;
      if (t.closest("#rail") || t.closest("#hamburger")) return;
      setNavOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [navOpen, setLoginOpen, setBooklistOpen, setNavOpen]);

  return (
    <>
      <a className="skip-link" href="#page">
        Skip to content
      </a>
      <Rail />
      <Header />
      <SearchStrip />
      <Booklist />
      <main className="page" id="page">
        {children}
      </main>
      <Footer />
      <AuthModal />
      <div className={"toast" + (toast ? " open" : "")} id="toast">
        {toast}
      </div>
    </>
  );
}

export function readHref(work: string, chapter?: number | null): string {
  let u = "/read?work=" + encodeURIComponent(work);
  if (chapter != null) u += "&chapter=" + encodeURIComponent(String(chapter));
  return u;
}
