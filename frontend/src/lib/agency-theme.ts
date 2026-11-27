"use client";

import { useSyncExternalStore } from "react";

export type AgencyTheme = "dark" | "light";

export type AgencyLocale = "en" | "pt";

export type AgencyAppearance = {
  name: string;
  slug: string;
  theme: AgencyTheme;
  light_background: string;
  dark_background: string;
  accent: string;
  plan: string;
  locale?: AgencyLocale;
};

export const lightBackgrounds = [
  { value: "#f0f1ed", label: "Mist" },
  { value: "#ffffff", label: "White" },
  { value: "#f6f1e8", label: "Sand" },
] as const;

export const darkBackgrounds = [
  { value: "#111313", label: "Ink" },
  { value: "#181a1a", label: "Graphite" },
  { value: "#3a3e3c", label: "Ash" },
] as const;

export const accents = [
  { value: "#bbff52", label: "Lime" },
  { value: "#c084fc", label: "Violet" },
  { value: "#7dd3fc", label: "Sky" },
  { value: "#f5c16c", label: "Amber" },
  { value: "#ffb4d0", label: "Rose" },
  { value: "#6ef0d0", label: "Teal" },
  { value: "#ffb088", label: "Coral" },
] as const;

const cacheKey = "postgrid-theme";
const agencyEvent = "postgrid-agency";
const themeEvent = "morrow-theme";

let current: AgencyAppearance | null = null;

/** Mixes two hex colors. */
function mix(from: string, to: string, amount: number) {
  const read = (hex: string) => Number.parseInt(hex.slice(1), 16);
  const left = read(from);
  const right = read(to);
  const channels = [16, 8, 0].map((shift) => {
    const start = (left >> shift) & 255;
    const end = (right >> shift) & 255;
    return Math.round(start + (end - start) * amount);
  });
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/** Builds the surface and accent variables for the active theme. */
export function deriveAgencyVars(appearance: AgencyAppearance) {
  const dark = appearance.theme === "dark";
  const background = dark ? appearance.dark_background : appearance.light_background;
  const flatGraphite = dark && background.toLowerCase() === "#181a1a";

  return {
    "--background": background,
    "--sidebar": flatGraphite ? background : mix(background, "#ffffff", dark ? 0.03 : 0.55),
    "--card": flatGraphite ? background : mix(background, "#ffffff", dark ? 0.03 : 0.7),
    "--raised": mix(background, dark ? "#ffffff" : "#000000", dark ? 0.055 : 0.035),
    "--soft": mix(background, dark ? "#ffffff" : "#000000", dark ? 0.09 : 0.06),
    "--lime": appearance.accent,
    "--lime-dark": dark ? mix(appearance.accent, background, 0.84) : mix(appearance.accent, "#ffffff", 0.72),
    "--good": dark ? appearance.accent : mix(appearance.accent, "#17230a", 0.5),
  };
}

/** Subscribes to agency appearance changes. */
function subscribe(onChange: () => void) {
  window.addEventListener(agencyEvent, onChange);
  return () => window.removeEventListener(agencyEvent, onChange);
}

/** Applies the agency theme and keeps a copy for the next paint. */
export function publishAgency(appearance: AgencyAppearance) {
  current = appearance;
  const vars = deriveAgencyVars(appearance);
  document.documentElement.dataset.theme = appearance.theme;
  for (const [key, value] of Object.entries(vars)) {
    document.documentElement.style.setProperty(key, value);
  }
  localStorage.setItem(cacheKey, JSON.stringify({ theme: appearance.theme, vars }));
  window.dispatchEvent(new Event(agencyEvent));
  window.dispatchEvent(new Event(themeEvent));
}

/** Returns the agency appearance loaded in this tab. */
export function useAgency() {
  return useSyncExternalStore(subscribe, () => current, () => null);
}
