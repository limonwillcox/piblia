export type LangMode = "translation" | "original";
export type Theme = "day" | "night";
export type ReadOptId = "nums" | "head" | "fn" | "xref";

const OPT_DEFAULT: Record<ReadOptId, boolean> = {
  nums: true,
  head: true,
  fn: true,
  xref: true
};

export function storedOpt(id: ReadOptId, fallback = OPT_DEFAULT[id]): boolean {
  const v = localStorage.getItem("fg-opt-" + id);
  if (v == null) return fallback;
  return v !== "off";
}

export function setStoredOpt(id: ReadOptId, on: boolean): void {
  localStorage.setItem("fg-opt-" + id, on ? "on" : "off");
}

export function storedMode(): LangMode {
  return localStorage.getItem("fg-mode") === "original" ? "original" : "translation";
}

export function setStoredMode(mode: LangMode): void {
  localStorage.setItem("fg-mode", mode);
}

export function storedVersion(): string {
  return localStorage.getItem("fg-version") || "";
}

export function setStoredVersion(id: string): void {
  if (id) localStorage.setItem("fg-version", id);
}

export function storedParallel(): boolean {
  return localStorage.getItem("fg-orig-parallel") !== "off";
}

export function setStoredParallel(on: boolean): void {
  localStorage.setItem("fg-orig-parallel", on ? "on" : "off");
}

export function storedFont(): number {
  return Number(localStorage.getItem("fg-font") || 18);
}

export function setStoredFont(n: number): void {
  localStorage.setItem("fg-font", String(n));
}

export function storedTheme(): Theme {
  return localStorage.getItem("fg-theme") === "night" ? "night" : "day";
}

export function setStoredTheme(theme: Theme): void {
  localStorage.setItem("fg-theme", theme);
}

export function storedUser(): string | null {
  return localStorage.getItem("fg-user");
}

export function setStoredUser(name: string | null): void {
  if (name) localStorage.setItem("fg-user", name);
  else localStorage.removeItem("fg-user");
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme === "night" ? "night" : "day");
}

export function applyFont(n: number): void {
  document.documentElement.style.setProperty("--read-size", n + "px");
}

export function applyReadOptionClasses(opts: Record<ReadOptId, boolean>): void {
  document.body.classList.toggle("hide-nums", !opts.nums);
  document.body.classList.toggle("hide-head", !opts.head);
  document.body.classList.toggle("hide-fn", !opts.fn);
  document.body.classList.toggle("hide-xref", !opts.xref);
}
