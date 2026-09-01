export type VersionGroup = "translation" | "original";

export type Version = {
  id: string;
  label: string;
  short: string;
  group: VersionGroup;
};

export type Author = {
  id: string;
  name: string;
  dates: string;
  era: string;
  region: string;
};

export type Era = {
  id: string;
  label: string;
};

export type Work = {
  id: string;
  author: string;
  title: string;
  short: string;
  chapters: number;
  series: string;
};

export type Footnote = {
  n: string;
  text: string;
  para: number;
};

export type Passage = {
  work: string;
  chapter: number;
  heading: string;
  versions: Record<string, string[]>;
  footnotes: Footnote[];
};

export type Catalog = {
  versions: Version[];
  authors: Author[];
  eras: Era[];
  works: Work[];
  votd: {
    work: string;
    chapter: number;
    quote: string;
    latin: string;
  };
};

export type QueryRef = { type: "ref"; work: string; chapter: number | null };
export type QueryKeyword = { type: "keyword"; q: string };
export type QueryEmpty = { type: "empty" };
export type Query = QueryRef | QueryKeyword | QueryEmpty;

export type SearchHit = {
  work: string;
  chapter: number;
  heading: string;
  author: string;
  title: string;
  snippet: string;
  snippetHtml: string;
};

export type WorkPayload = {
  work: Work;
  author: Author;
  chapters: Passage[];
};

export type ApiResult = {
  status: number;
  json: unknown;
};
