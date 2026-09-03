import type { CSSProperties, ReactNode } from "react";

/**
 * The cinematic shots for /church-history, Act I: Pentecost to Nicaea.
 *
 * Theatre owns one sticky stage. Global `--p` on `.ch-theatre` maps to a local
 * `--p` per `[data-shot]` (see src/lib/scrollScene.ts). Elements carry `--start`
 * and `--dur` on a 0s–1s timeline plus one of the shared keyframe classes in
 * styles.css, so a new shot needs artwork and timings only — no CSS.
 *
 * All of it is decoration. Each fact is stated in the timeline below, so the
 * theatre is aria-hidden and the crawler reads each fact exactly once.
 */

type Timing = { start?: string; dur?: string; stagger?: string; i?: number; len?: number };

/** Timing values as custom properties. */
function t(v: Timing): CSSProperties {
  const out: Record<string, string | number> = {};
  if (v.start !== undefined) out["--start"] = v.start;
  if (v.dur !== undefined) out["--dur"] = v.dur;
  if (v.stagger !== undefined) out["--stagger"] = v.stagger;
  if (v.i !== undefined) out["--i"] = v.i;
  if (v.len !== undefined) out["--len"] = v.len;
  return out as CSSProperties;
}

/** Gradients shared by every scene. Rendered once per page, not once per scene. */
export function SceneDefs() {
  return (
    <svg className="ch-defs" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="chFlameGlow">
          <stop offset="0%" stopColor="#ffb765" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#ffb765" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="chBlazeGlow">
          <stop offset="0%" stopColor="#ff8a3c" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ff8a3c" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function Shot({ id, art, caption }: { id: string; art: ReactNode; caption: ReactNode }) {
  return (
    <div className="ch-shot" data-shot={id}>
      <svg className="ch-svg" viewBox="0 0 800 360" role="presentation" focusable="false">
        {art}
      </svg>
      <div className="ch-cap">{caption}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- Pentecost */

const FLAME_COUNT = 12;
const WIND_LINES = [72, 116, 160, 204];
const FLAME_OUTER = "M0 0 C-13 -13 -14 -32 0 -60 C14 -32 13 -13 0 0 Z";
const FLAME_INNER = "M0 -7 C-6 -15 -6 -28 0 -41 C6 -28 6 -15 0 -7 Z";

/**
 * The order follows the text: a *sound* as of a rushing mighty wind (v.2) comes
 * first — there is no light in Acts 2 — then fire, and the fire is *cloven*,
 * resting upon each of them (v.3). Hence twelve separate tongues, not one.
 */
function PentecostScene() {
  return (
    <Shot
      id="pentecost"
      art={
        <>
          <g>
            {WIND_LINES.map((y, i) => (
              <path
                key={y}
                className="ch-anim ch-sweep ch-wind-line"
                style={t({ start: "0.04s", dur: "0.3s", stagger: "0.03s", i })}
                d={"M-160 " + y + " C 90 " + (y - 26) + ", 300 " + (y + 26) + ", 560 " + y}
              />
            ))}
          </g>
          <g>
            {Array.from({ length: FLAME_COUNT }, (_, i) => {
              const p = i / (FLAME_COUNT - 1);
              const x = 96 + p * 608;
              const y = 330 - Math.sin(p * Math.PI) * 44;
              return (
                <g key={i} transform={"translate(" + x.toFixed(1) + " " + y.toFixed(1) + ")"}>
                  <g className="ch-anim ch-rise" style={t({ start: "0.3s", dur: "0.2s", stagger: "0.018s", i })}>
                    <ellipse className="ch-flame-glow" cx="0" cy="-30" rx="30" ry="46" />
                    <path className="ch-flame-outer" d={FLAME_OUTER} />
                    <path className="ch-flame-inner" d={FLAME_INNER} />
                  </g>
                </g>
              );
            })}
          </g>
        </>
      }
      caption={
        <>
          <p className="ch-cap-ref ch-anim ch-fade-up" style={t({ start: "0.54s", dur: "0.12s" })}>
            Acts 2
          </p>
          <p className="ch-cap-date ch-anim ch-fade-up" style={t({ start: "0.61s", dur: "0.11s" })}>
            AD 33
          </p>
          <p className="ch-cap-count ch-anim ch-fade-up" style={t({ start: "0.78s", dur: "0.12s" })}>
            <strong>3,000</strong>
            <span>added that day</span>
          </p>
        </>
      }
    />
  );
}

/* ------------------------------------------------------ Acts 2 through 28 */

const CHAPTERS = Array.from({ length: 26 }, (_, i) => i + 2); // 2 … 27, then 28 lands

/** The book runs out at Acts 28 — Paul in Rome, c. AD 62. It does not reach 70. */
function ActsBookScene() {
  return (
    <Shot
      id="acts-book"
      art={
        <>
          <g className="ch-book">
            <path
              className="ch-anim ch-fade ch-book-page"
              style={t({ start: "0.06s", dur: "0.14s" })}
              d="M400 300 C330 272, 250 262, 140 266 L140 108 C250 104, 330 116, 400 146 Z"
            />
            <path
              className="ch-anim ch-fade ch-book-page"
              style={t({ start: "0.06s", dur: "0.14s" })}
              d="M400 300 C470 272, 550 262, 660 266 L660 108 C550 104, 470 116, 400 146 Z"
            />
            <path className="ch-anim ch-fade ch-book-spine" style={t({ start: "0.06s", dur: "0.14s" })} d="M400 146 L400 300" />
          </g>
          <g>
            {Array.from({ length: 7 }, (_, i) => (
              <path
                key={i}
                className="ch-anim ch-blip ch-book-flip ch-oc"
                style={t({ start: "0.2s", dur: "0.09s", stagger: "0.055s", i })}
                d="M400 146 C470 116, 550 104, 660 108 L660 266 C550 262, 470 272, 400 300 Z"
              />
            ))}
          </g>
        </>
      }
      caption={
        <>
          <p className="ch-cap-ref ch-chapters">
            <span className="ch-anim ch-blip ch-chapter ch-chapter-first" style={t({ start: "0.06s", dur: "0.18s" })}>
              Acts 2
            </span>
            {CHAPTERS.filter((n) => n !== 2).map((n, i) => (
              <span key={n} className="ch-anim ch-blip ch-chapter" style={t({ start: "0.22s", dur: "0.05s", stagger: "0.018s", i })}>
                Acts {n}
              </span>
            ))}
            <span className="ch-anim ch-fade-up ch-chapter ch-chapter-last" style={t({ start: "0.74s", dur: "0.12s" })}>
              Acts 28
            </span>
          </p>
          <p className="ch-cap-date ch-anim ch-fade-up" style={t({ start: "0.79s", dur: "0.11s" })}>
            c. AD 62
          </p>
        </>
      }
    />
  );
}

/* --------------------------------------------------------------- Nero, 64 */

/** Before the Colosseum existed. Peter's cross inverted, Paul's sword. */
function NeroScene() {
  const roofs = [
    "M90 300 L90 214 L150 178 L210 214 L210 300 Z",
    "M226 300 L226 190 L286 190 L286 300 Z",
    "M302 300 L302 160 L318 148 L410 148 L426 160 L426 300 Z",
    "M442 300 L442 200 L502 200 L502 300 Z",
    "M518 300 L518 176 L578 140 L638 176 L638 300 Z",
    "M654 300 L654 222 L714 222 L714 300 Z"
  ];
  return (
    <Shot
      id="nero"
      art={
        <>
          <ellipse className="ch-anim ch-fade ch-blaze-glow ch-oc" style={t({ start: "0.18s", dur: "0.24s" })} cx="400" cy="250" rx="330" ry="150" />
          <g>
            {Array.from({ length: 9 }, (_, i) => {
              const x = 120 + i * 70;
              return (
                <g key={i} transform={"translate(" + x + " 300) scale(1.5)"}>
                  <path
                    className="ch-anim ch-rise ch-flame-outer"
                    style={t({ start: "0.22s", dur: "0.22s", stagger: "0.016s", i })}
                    d={FLAME_OUTER}
                  />
                </g>
              );
            })}
          </g>
          <g>
            {roofs.map((d, i) => (
              <path key={d} className="ch-anim ch-fade ch-city" style={t({ start: "0.08s", dur: "0.14s", stagger: "0.014s", i })} d={d} />
            ))}
          </g>
          <g className="ch-anim ch-fade-up ch-mark" style={t({ start: "0.66s", dur: "0.12s" })}>
            <path d="M292 92 L292 172 M266 148 L318 148" />
          </g>
          <g className="ch-anim ch-fade-up ch-mark" style={t({ start: "0.74s", dur: "0.12s" })}>
            <path d="M508 88 L508 160 M490 108 L526 108 M508 160 L500 176 M508 160 L516 176" />
          </g>
        </>
      }
      caption={
        <>
          <p className="ch-cap-ref ch-anim ch-fade-up" style={t({ start: "0.5s", dur: "0.12s" })}>
            Rome burns
          </p>
          <p className="ch-cap-date ch-anim ch-fade-up" style={t({ start: "0.58s", dur: "0.11s" })}>
            AD 64
          </p>
          <p className="ch-cap-count ch-anim ch-fade-up" style={t({ start: "0.84s", dur: "0.12s" })}>
            <span>Peter and Paul follow</span>
          </p>
        </>
      }
    />
  );
}

/* ---------------------------------------------------------- Jerusalem, 70 */

const STARS: [number, number][] = [
  [150, 70],
  [232, 120],
  [318, 62],
  [404, 108],
  [486, 58],
  [566, 112],
  [648, 74],
  [96, 150],
  [712, 140]
];

/**
 * Sun, moon and stars darken and fall — the language the prophets used for the
 * fall of a nation (Isaiah 13:10), which is how Matthew 24:29 reads it here.
 */
function JerusalemScene() {
  return (
    <Shot
      id="jerusalem"
      art={
        <>
          <g transform="translate(196 96)">
            <g className="ch-anim ch-fall ch-oc" style={t({ start: "0.74s", dur: "0.3s" })}>
              <g className="ch-anim ch-pop ch-oc" style={t({ start: "0.08s", dur: "0.14s" })}>
                <circle className="ch-anim ch-darken ch-body" style={t({ start: "0.44s", dur: "0.16s" })} r="30" />
                <path className="ch-ray" d="M0 -46 L0 -58 M0 46 L0 58 M-46 0 L-58 0 M46 0 L58 0 M-33 -33 L-41 -41 M33 33 L41 41 M-33 33 L-41 41 M33 -33 L41 -41" />
              </g>
            </g>
          </g>
          <g transform="translate(604 92)">
            <g className="ch-anim ch-fall ch-oc" style={t({ start: "0.78s", dur: "0.3s" })}>
              <g className="ch-anim ch-pop ch-oc" style={t({ start: "0.13s", dur: "0.14s" })}>
                <path className="ch-anim ch-darken ch-body" style={t({ start: "0.46s", dur: "0.16s" })} d="M0 -30 A30 30 0 1 0 0 30 A24 24 0 1 1 0 -30 Z" />
              </g>
            </g>
          </g>
          <g>
            {STARS.map(([x, y], i) => (
              <g key={x + "-" + y} transform={"translate(" + x + " " + y + ")"}>
                <g className="ch-anim ch-fall ch-oc" style={t({ start: "0.72s", dur: "0.32s", stagger: "0.012s", i })}>
                  <path
                    className="ch-anim ch-pop ch-oc ch-body ch-star"
                    style={t({ start: "0.18s", dur: "0.14s", stagger: "0.012s", i })}
                    d="M0 -13 L3.4 -3.4 L13 0 L3.4 3.4 L0 13 L-3.4 3.4 L-13 0 L-3.4 -3.4 Z"
                  />
                </g>
              </g>
            ))}
          </g>
          <g className="ch-anim ch-fade ch-city" style={t({ start: "0.3s", dur: "0.16s" })}>
            <path d="M120 320 L120 268 L180 268 L180 320 Z M198 320 L198 250 L258 250 L258 320 Z" />
            <path d="M520 320 L520 254 L580 254 L580 320 Z M600 320 L600 274 L660 274 L660 320 Z" />
          </g>
          {/* The temple itself comes down as the caption lands. */}
          <g transform="translate(400 265)">
            <g className="ch-anim ch-topple ch-oc" style={t({ start: "0.78s", dur: "0.2s" })}>
              <g className="ch-anim ch-fade ch-city" style={t({ start: "0.3s", dur: "0.16s" })}>
                <path d="M-100 55 L-100 -39 L-82 -55 L82 -55 L100 -39 L100 55 Z" />
                <path d="M-70 -55 L-70 -7 M-30 -55 L-30 -7 M10 -55 L10 -7 M50 -55 L50 -7 M70 -55 L70 -7" />
              </g>
            </g>
          </g>
        </>
      }
      caption={
        <>
          <p className="ch-cap-ref ch-anim ch-fade-up" style={t({ start: "0.76s", dur: "0.12s" })}>
            The temple falls
          </p>
          <p className="ch-cap-date ch-anim ch-fade-up" style={t({ start: "0.84s", dur: "0.11s" })}>
            AD 70
          </p>
        </>
      }
    />
  );
}

/* ------------------------------------------- Apostolic Fathers, 96 to 155 */

const FATHERS = [
  { x: 172, name: "Clement", note: "to Corinth, c. 96" },
  { x: 400, name: "Ignatius", note: "seven letters, c. 110" },
  { x: 628, name: "Polycarp", note: "burned, c. 155" }
];

/** The generation that had known the apostles, writing to steady the churches. */
function ApostolicFathersScene() {
  return (
    <Shot
      id="apostolic-fathers"
      art={
        <g>
          {FATHERS.map((f, i) => (
            <g key={f.name} transform={"translate(" + f.x + " 178)"}>
              <g className="ch-anim ch-fade-up" style={t({ start: "0.16s", dur: "0.16s", stagger: "0.13s", i })}>
                <path className="ch-scroll" d="M-72 -86 L72 -86 L72 86 L-72 86 Z" />
                <path className="ch-scroll-line" d="M-46 -50 L46 -50 M-46 -22 L46 -22 M-46 6 L46 6 M-46 34 L10 34" />
                <circle className="ch-seal" cx="0" cy="70" r="12" />
              </g>
              <text className="ch-anim ch-fade-up ch-figure-name" style={t({ start: "0.24s", dur: "0.14s", stagger: "0.13s", i })} x="0" y="132">
                {f.name}
              </text>
            </g>
          ))}
        </g>
      }
      caption={
        <>
          <p className="ch-cap-ref ch-anim ch-fade-up" style={t({ start: "0.66s", dur: "0.12s" })}>
            The Apostolic Fathers
          </p>
          <p className="ch-cap-date ch-anim ch-fade-up" style={t({ start: "0.74s", dur: "0.11s" })}>
            AD 96–155
          </p>
        </>
      }
    />
  );
}

/* ------------------------------------------------ Persecution, Decius 250 */

const DECIAN_FATHERS = [
  { x: 172, name: "Origen", note: "tortured, c. 250" },
  { x: 400, name: "Cyprian", note: "Carthage" },
  { x: 628, name: "Fabian", note: "martyred, 250" }
];

/** Origen, Cyprian, Fabian — the same scroll marks as the Apostolic Fathers. */
function PersecutionScene() {
  return (
    <Shot
      id="persecution"
      art={
        <g>
          {DECIAN_FATHERS.map((f, i) => (
            <g key={f.name} transform={"translate(" + f.x + " 178)"}>
              <g className="ch-anim ch-fade-up" style={t({ start: "0.16s", dur: "0.16s", stagger: "0.13s", i })}>
                <path className="ch-scroll" d="M-72 -86 L72 -86 L72 86 L-72 86 Z" />
                <path className="ch-scroll-line" d="M-46 -50 L46 -50 M-46 -22 L46 -22 M-46 6 L46 6 M-46 34 L10 34" />
                <circle className="ch-seal" cx="0" cy="70" r="12" />
              </g>
              <text className="ch-anim ch-fade-up ch-figure-name" style={t({ start: "0.24s", dur: "0.14s", stagger: "0.13s", i })} x="0" y="132">
                {f.name}
              </text>
            </g>
          ))}
        </g>
      }
      caption={
        <>
          <p className="ch-cap-ref ch-anim ch-fade-up" style={t({ start: "0.64s", dur: "0.12s" })}>
            Sacrifice to idols, or die
          </p>
          <p className="ch-cap-date ch-anim ch-fade-up" style={t({ start: "0.72s", dur: "0.11s" })}>
            AD 250
          </p>
          <p className="ch-cap-count ch-anim ch-fade-up" style={t({ start: "0.84s", dur: "0.12s" })}>
            <span>Under Decius</span>
            <span>the first empire-wide persecution</span>
          </p>
        </>
      }
    />
  );
}

/* ------------------------------------ The Great Persecution, 303 to 313 */

/** Diocletian: the churches pulled down, the Scriptures burned. */
function GreatPersecutionScene() {
  return (
    <Shot
      id="great-persecution"
      art={
        <>
          <ellipse className="ch-anim ch-fade ch-blaze-glow ch-oc" style={t({ start: "0.3s", dur: "0.24s" })} cx="252" cy="220" rx="180" ry="120" />
          <g transform="translate(252 236)">
            <g className="ch-anim ch-fade" style={t({ start: "0.1s", dur: "0.14s" })}>
              <path className="ch-scroll" d="M-84 -64 L84 -64 L84 64 L-84 64 Z" />
              <path className="ch-scroll-line" d="M-56 -30 L56 -30 M-56 -2 L56 -2 M-56 26 L20 26" />
            </g>
          </g>
          <g>
            {Array.from({ length: 6 }, (_, i) => (
              <g key={i} transform={"translate(" + (168 + i * 34) + " 176) scale(1.2)"}>
                <path
                  className="ch-anim ch-rise ch-flame-outer"
                  style={t({ start: "0.34s", dur: "0.2s", stagger: "0.02s", i })}
                  d={FLAME_OUTER}
                />
              </g>
            ))}
          </g>
          <g transform="translate(580 0)">
            <g className="ch-anim ch-topple ch-oc" style={t({ start: "0.56s", dur: "0.26s" })}>
              <g className="ch-anim ch-fade ch-city" style={t({ start: "0.12s", dur: "0.14s" })}>
                <path d="M-90 320 L-90 168 L0 104 L90 168 L90 320 Z" />
                <path d="M0 104 L0 56 M-22 78 L22 78" />
                <path d="M-30 320 L-30 234 C-30 214, 30 214, 30 234 L30 320 Z" />
              </g>
            </g>
          </g>
        </>
      }
      caption={
        <>
          <p className="ch-cap-ref ch-anim ch-fade-up" style={t({ start: "0.7s", dur: "0.12s" })}>
            The Great Persecution
          </p>
          <p className="ch-cap-date ch-anim ch-fade-up" style={t({ start: "0.78s", dur: "0.11s" })}>
            AD 303–313
          </p>
          <p className="ch-cap-count ch-anim ch-fade-up" style={t({ start: "0.86s", dur: "0.12s" })}>
            <span>Under Emperor Diocletian</span>
          </p>
        </>
      }
    />
  );
}

/* --------------------------------------------------- Edict of Milan, 313 */

/**
 * The two witnesses disagree, so the scene shows both: Lactantius has the mark
 * given in a dream and painted on the shields; Eusebius has it in the sky.
 */
function MilanScene() {
  return (
    <Shot
      id="milan"
      art={
        <>
          <g className="ch-chi-rho">
            <path className="ch-anim ch-draw" style={t({ start: "0.14s", dur: "0.18s", len: 210 })} d="M400 44 L400 250" />
            <path className="ch-anim ch-draw" style={t({ start: "0.26s", dur: "0.16s", len: 150 })} d="M400 50 C452 50, 460 106, 400 116" />
            <path className="ch-anim ch-draw" style={t({ start: "0.36s", dur: "0.16s", len: 200 })} d="M330 246 L470 128" />
            <path className="ch-anim ch-draw" style={t({ start: "0.44s", dur: "0.16s", len: 200 })} d="M330 128 L470 246" />
          </g>
          <g>
            {[214, 400, 586].map((x, i) => (
              <g key={x} transform={"translate(" + x + " 306)"}>
                <g className="ch-anim ch-fade-up" style={t({ start: "0.6s", dur: "0.14s", stagger: "0.05s", i })}>
                  <path className="ch-shield" d="M-40 -66 L40 -66 L40 -18 C40 12, 16 30, 0 38 C-16 30, -40 12, -40 -18 Z" />
                  <path className="ch-shield-mark" d="M0 -54 L0 4 M0 -50 C16 -50, 18 -32, 0 -30 M-16 0 L16 -30 M-16 -30 L16 0" />
                </g>
              </g>
            ))}
          </g>
        </>
      }
      caption={
        <>
          <p className="ch-cap-ref ch-anim ch-fade-up" style={t({ start: "0.72s", dur: "0.12s" })}>
            In hoc signo vinces
          </p>
          <p className="ch-cap-date ch-anim ch-fade-up" style={t({ start: "0.8s", dur: "0.11s" })}>
            AD 312
          </p>
        </>
      }
    />
  );
}

/* ----------------------------------------------------------- Nicaea, 325 */

const BISHOPS = 15;

/** The hinge. Everything before is ante-Nicene, everything after post-Nicene. */
function NicaeaScene() {
  return (
    <Shot
      id="nicaea"
      art={
        <>
          <g>
            {Array.from({ length: BISHOPS }, (_, i) => {
              const a = Math.PI * (0.06 + (i / (BISHOPS - 1)) * 0.88);
              const x = 400 - Math.cos(a) * 336;
              const y = 236 - Math.sin(a) * 118;
              return (
                <g key={i} transform={"translate(" + x.toFixed(1) + " " + y.toFixed(1) + ")"}>
                  <g className="ch-anim ch-fade-up ch-figure" style={t({ start: "0.12s", dur: "0.16s", stagger: "0.022s", i })}>
                    <circle cy="-26" r="11" />
                    <path d="M-16 0 C-16 -14, 16 -14, 16 0 Z" />
                  </g>
                </g>
              );
            })}
          </g>
          <text className="ch-anim ch-fade-up ch-greek" style={t({ start: "0.6s", dur: "0.16s" })} x="400" y="330">
            ὁμοούσιον
          </text>
        </>
      }
      caption={
        <>
          <p className="ch-cap-ref ch-anim ch-fade-up" style={t({ start: "0.78s", dur: "0.12s" })}>
            Of one substance
          </p>
          <p className="ch-cap-date ch-anim ch-fade-up" style={t({ start: "0.86s", dur: "0.11s" })}>
            AD 325
          </p>
          <p className="ch-cap-count ch-anim ch-fade-up" style={t({ start: "0.9s", dur: "0.1s" })}>
            <span>The Arian Heresy is struck down at the Council of Nicaea.</span>
          </p>
        </>
      }
    />
  );
}

/** Shot id (from server/churchHistory.ts) to component. */
export const SCENES: Record<string, () => ReactNode> = {
  pentecost: PentecostScene,
  "acts-book": ActsBookScene,
  nero: NeroScene,
  jerusalem: JerusalemScene,
  "apostolic-fathers": ApostolicFathersScene,
  persecution: PersecutionScene,
  "great-persecution": GreatPersecutionScene,
  milan: MilanScene,
  nicaea: NicaeaScene
};

export function Theatre({ shots }: { shots: string[] }) {
  return (
    <section className="ch-theatre" data-scene="act-one" aria-hidden="true" style={{ ["--shot-count" as string]: shots.length }}>
      <div className="ch-stage">
        <div className="ch-backdrop" />
        {shots.map((id) => {
          const Comp = SCENES[id];
          return Comp ? <Comp key={id} /> : null;
        })}
      </div>
    </section>
  );
}
