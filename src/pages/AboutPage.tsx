import { useEffect } from "react";
import { useApp } from "../context/AppContext";

export function AboutPage() {
  const { setActivePassage } = useApp();
  useEffect(() => {
    setActivePassage(null);
  }, [setActivePassage]);

  return (
    <div className="prose">
      <h1>Augustine’s Confessions</h1>
      <p>
        Piblia is a searchable reader for public-domain patristic texts. The first work in the library is{" "}
        <em>The Confessions of Saint Augustine</em>: Pusey's English (1838) and the Latin <em>Confessiones</em>. The thirteen
        books are one scrollable work; Original and Split put the Latin on the page.
      </p>
      <h2 id="editions">This edition</h2>
      <p>
        <strong>Pusey, 1838</strong> — public domain in the United States. Source file under <code>Fathers/English/</code>{" "}
        (Gutenberg #3296). The Project Gutenberg license is kept in <code>Regulations/Project GutenBerg</code>.
      </p>
      <p>
        <strong>Latin</strong> — the <em>Confessiones</em> in thirteen books, from <code>Fathers/Latin/</code>. Open a book and
        use <strong>Original</strong>, or keep Translation with Split on, to read it.
      </p>
      <h2 id="privacy">Privacy</h2>
      <p>
        The mock stores display name, font size, night mode, and highlights in <code>localStorage</code>. Sign-in is local only.
        OAuth buttons are optional placeholders and do not call a provider.
      </p>
      <p className="fineprint">
        “Bible Gateway” is a trademark of its owner; this project is an independent design study and is not affiliated with
        HarperCollins Christian Publishing.
      </p>
    </div>
  );
}
