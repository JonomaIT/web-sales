import { applyMode, Mode } from "@cloudscape-design/global-styles";

// Light or dark: the person's last choice, else the system's.

const KEY = "web-sales:mode";

export function initialMode(): Mode {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === Mode.Dark || saved === Mode.Light) return saved;
  } catch {
    // storage blocked (private window): fall back to the system
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? Mode.Dark : Mode.Light;
}

export function saveMode(mode: Mode): void {
  applyMode(mode);
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    // not remembered, still applied
  }
}
