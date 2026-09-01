import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { fetchSearch } from "../api/client";
import { useApp } from "../context/AppContext";
import type { SearchHit } from "../../server/types";

export function SearchPage() {
  const { setActivePassage } = useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get("q") || "";
  const advanced = params.get("advanced") || "";
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  useEffect(() => {
    let cancelled = false;
    if (!q) {
      setHits([]);
      return;
    }
    setHits(null);
    fetchSearch(q)
      .then((res) => {
        if (cancelled) return;
        if (res.query.type === "ref" && !advanced) {
          const ch = res.query.chapter;
          navigate("/read?work=" + encodeURIComponent(res.query.work) + (ch != null ? "&chapter=" + ch + "#ch-" + ch : ""), { replace: true });
          return;
        }
        setHits(res.hits);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [q, advanced, navigate]);

  return (
    <>
      <div className="prose">
        <h1>{advanced ? "Advanced search" : "Search results"}</h1>
        {advanced ? (
          <p>
            Type a father, a work and chapter (<em>Confessions 1</em>), or any keyword. Search looks at titles and the public-domain
            texts themselves. Translation or original is chosen with the two buttons beside the search bar after a work is open.
          </p>
        ) : null}
        {q ? (
          <p className="meta" style={{ color: "var(--muted)" }}>
            {hits ? hits.length : "…"} result{hits && hits.length === 1 ? "" : "s"} for <strong>{q}</strong>
          </p>
        ) : (
          <p>Enter a query in the search bar.</p>
        )}
      </div>
      {error ? <p className="empty">{error}</p> : null}
      {hits && hits.length
        ? hits.map((h) => (
            <article className="result" key={h.work + ":" + h.chapter}>
              <h3>
                <Link to={"/read?work=" + h.work + "&chapter=" + h.chapter + "#ch-" + h.chapter}>
                  {h.title} {h.chapter} — {h.heading}
                </Link>
              </h3>
              <div className="meta">{h.author}</div>
              <p dangerouslySetInnerHTML={{ __html: h.snippetHtml }} />
            </article>
          ))
        : q && hits && !hits.length
          ? (
              <p className="empty">
                No passages in this demo corpus matched that query. Try <em>restless</em>, <em>wheat of God</em>, or{" "}
                <em>Confessions 1</em>.
              </p>
            )
          : null}
    </>
  );
}
