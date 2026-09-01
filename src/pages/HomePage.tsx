import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

export function HomePage() {
  const { catalog, catalogError, mode, setActivePassage } = useApp();
  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  if (catalogError) return <p className="empty">{catalogError}</p>;
  if (!catalog) return <p className="empty">Loading library…</p>;

  const v = catalog.votd;
  const work = catalog.works.find((w) => w.id === v.work);
  const author = work ? catalog.authors.find((a) => a.id === work.author) : undefined;
  if (!work || !author) return <p className="empty">Catalog is missing the Passage of the Day.</p>;

  const quote = mode === "original" && v.latin ? v.latin : v.quote;

  return (
    <div className="home-grid">
      <section className="votd">
        <h2>Passage of the Day</h2>
        <div className="ref">
          <Link to={"/read?work=" + v.work + "&chapter=" + v.chapter}>
            {work.title} {v.chapter}
          </Link>{" "}
          · {author.name}
        </div>
        <blockquote>“{quote}”</blockquote>
        <div className="actions">
          <Link to={"/read?work=" + v.work}>Read the book</Link>
        </div>
      </section>
    </div>
  );
}
