import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

export function BrowsePage() {
  const { catalog, catalogError, setActivePassage } = useApp();
  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  if (catalogError) return <p className="empty">{catalogError}</p>;
  if (!catalog) return <p className="empty">Loading library…</p>;

  return (
    <>
      <div className="prose">
        <h1>Writings list</h1>
        <p>Browse the demo corpus the way Bible Gateway lists books of the Bible — by era, then father, then work and chapter.</p>
      </div>
      <div className="browse-grid">
        {catalog.eras.map((era) => {
          const authors = catalog.authors.filter((a) => a.era === era.id);
          return (
            <div className="era-col" key={era.id}>
              <h2>{era.label}</h2>
              {authors.map((a) => {
                const works = catalog.works.filter((w) => w.author === a.id);
                return (
                  <div className="author-card" key={a.id}>
                    <h3>{a.name}</h3>
                    <div className="dates">
                      {a.dates} · {a.region}
                    </div>
                    <ul>
                      {works.map((w) => (
                        <li key={w.id}>
                          <Link to={"/read?work=" + w.id}>{w.title}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}
