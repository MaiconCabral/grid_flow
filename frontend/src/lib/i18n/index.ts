"use client";

import { useCallback } from "react";
import { useAgency, type AgencyLocale } from "@/lib/agency-theme";
import { translate, type MessageKey } from "@/lib/i18n/messages";

export type { MessageKey };
export { translate };

/** Returns the agency language and a function that reads its dictionary. */
export function useI18n() {
  const agency = useAgency();
  const locale: AgencyLocale = agency?.locale === "pt" ? "pt" : "en";
  const t = useCallback((key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars), [locale]);
  return { locale, t };
}
