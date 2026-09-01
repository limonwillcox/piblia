import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="stat">
      <strong>{n}</strong>
      {label}
    </div>
  );
}

export function StudyPage() {
  const { setActivePassage } = useApp();
  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  return (
    <div className="prose">
      <h1>Study desk</h1>
      <p>
        This library is built around one work for now: Augustine's <em>Confessions</em>, in E. B. Pusey's public-domain English
        (Project Gutenberg eBook #3296) with the Latin <em>Confessiones</em> beside it. The thirteen books sit on a single page.
        Scroll the whole confession; use the book strip to jump. Switch <strong>Original</strong> for Latin only, or leave Split
        on for both columns.
      </p>
      <div className="stat-row">
        <Stat n="1" label="Father" />
        <Stat n="13" label="Books" />
        <Stat n="2" label="Texts" />
        <Stat n="PD" label="License" />
      </div>
      <h2>How to read the Confessions</h2>
      <p>
        Books I–IX tell Augustine's life up to his conversion and the death of Monica. Book X is a treatise on memory and
        temptation. Books XI–XIII turn the same prayer toward time and the opening of Genesis.
      </p>
      <p>
        Search a keyword, or a book number (<em>Book 8</em>, <em>Confessions 10</em>). Notes sit in the column to the right of the
        text so the reading column is not broken by footnotes between paragraphs.
      </p>
      <h2>First paths</h2>
      <p>
        <Link to="/read?work=confessions">The whole work</Link> · <Link to="/read?work=confessions&chapter=1">Book I</Link> ·{" "}
        <Link to="/read?work=confessions&chapter=8">Book VIII (the garden)</Link> ·{" "}
        <Link to="/read?work=confessions&chapter=10">Book X</Link>
      </p>
    </div>
  );
}
