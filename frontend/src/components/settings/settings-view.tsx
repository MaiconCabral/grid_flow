"use client";

import { useEffect, useState } from "react";
import { notifyError, notifySuccess } from "@/lib/alerts";
import {
  accents,
  darkBackgrounds,
  lightBackgrounds,
  publishAgency,
  type AgencyAppearance,
} from "@/lib/agency-theme";
import { ApiError, api } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import { showVisualPlaceholders } from "@/lib/placeholders";
import type { AuthUser } from "@/lib/session";

type Plan = {
  id: string;
  name: string;
  price: string;
  summary: string;
  points: string[];
};

type Settings = AgencyAppearance & { plans: Plan[] };

type Tab = "agency" | "appearance" | "plans";

const buttonStyle = { fontSize: 11, fontWeight: 700, lineHeight: "16.5px" } as const;

const colorNames: Record<string, MessageKey> = {
  Mist: "color.mist",
  White: "color.white",
  Sand: "color.sand",
  Ink: "color.ink",
  Graphite: "color.graphite",
  Ash: "color.ash",
  Lime: "color.lime",
  Violet: "color.violet",
  Sky: "color.sky",
  Amber: "color.amber",
  Rose: "color.rose",
  Teal: "color.teal",
  Coral: "color.coral",
};

/** Renders agency, appearance, and plan settings. */
export function SettingsView() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("agency");
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    api<{ user: AuthUser }>("/auth/me")
      .then((session) => {
        setRole(session.user.role);
        if (session.user.role !== "agency_admin") {
          setReady(true);
          return;
        }
        return api<Settings>("/settings").then((agency) => {
          setSettings(agency);
          setName(agency.name);
          publishAgency(agency);
          setReady(true);
        });
      })
      .catch((caught) => {
        void notifyError(caught instanceof ApiError ? caught.message : t("settings.loadFailed"));
        setReady(true);
      });
  }, [t]);

  const canEdit = role === "agency_admin";

  /** Saves one agency setting and applies it. */
  async function save(patch: Partial<AgencyAppearance>, success: string) {
    setPending(true);
    try {
      const saved = await api<Settings>("/settings", { method: "PATCH", body: JSON.stringify(patch) });
      setSettings(saved);
      setName(saved.name);
      publishAgency(saved);
      void notifySuccess(success);
    } catch (caught) {
      void notifyError(caught instanceof ApiError ? caught.message : t("settings.saveFailed"));
    } finally {
      setPending(false);
    }
  }

  if (!ready) {
    return <p className="px-[38px] pt-10 text-[13px] text-muted">{t("settings.loading")}</p>;
  }

  if (role !== "agency_admin") {
    return (
      <div className="mx-auto max-w-[860px] px-[38px] pt-10">
        <p className="text-[13px] text-muted">{t("settings.unavailable")}</p>
      </div>
    );
  }

  if (!settings) {
    return <p className="px-[38px] pt-10 text-[13px] text-muted">{t("settings.loadFailed")}</p>;
  }

  return (
    <div className="mx-auto max-w-[1640px] px-[38px] pt-10 pb-12">
      <header>
        <p className="mb-3 text-[9px] font-bold tracking-[1.4px] text-muted uppercase">{t("settings.manage")}</p>
        <h1 className="font-display text-[30px] leading-[1.18] font-extrabold tracking-[-1.3px]">{t("nav.settings")}</h1>
        <p className="mt-2 text-[13px] text-muted">{showVisualPlaceholders ? t("settings.linePlans") : t("settings.line")}</p>
      </header>

      <div role="tablist" aria-label="Settings" className="mt-8 flex w-fit gap-1 rounded-[9px] bg-card p-1">
        {(
          [
            ["agency", t("settings.agency")],
            ["appearance", t("settings.appearance")],
            ...(showVisualPlaceholders ? [["plans", "Plans"] as const] : []),
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            style={buttonStyle}
            className={`rounded-[7px] px-3 py-[8px] ${tab === value ? "bg-lime text-lime-ink" : "text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "agency" ? (
        <section className="mt-4 max-w-xl rounded-[14px] bg-card p-[18px]">
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void save({ name }, t("settings.updated"));
            }}
          >
            <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
              {t("settings.name")}
              <input
                required
                disabled={!canEdit}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-[9px] bg-raised px-3 py-2.5 text-[13px] font-normal text-foreground outline-none disabled:opacity-70"
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
              {t("settings.slug")}
              <input
                readOnly
                value={settings.slug}
                className="rounded-[9px] bg-raised px-3 py-2.5 text-[13px] font-normal text-foreground outline-none"
              />
            </label>
            {canEdit ? (
              <button
                type="submit"
                disabled={pending}
                style={buttonStyle}
                className="w-fit rounded-[9px] bg-lime px-[14px] py-[10px] text-lime-ink disabled:opacity-60"
              >
                {pending ? t("common.saving") : t("common.save")}
              </button>
            ) : (
              <p className="text-[12px] text-muted">{t("settings.adminDetails")}</p>
            )}
          </form>
        </section>
      ) : null}

      {tab === "appearance" ? (
        <section className="mt-4 max-w-xl rounded-[14px] bg-card p-[18px]">
          <p className="text-[11px] font-bold text-muted">{t("settings.mode")}</p>
          <div className="mt-2 flex gap-2">
            {(["dark", "light"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={!canEdit || pending}
                onClick={() => void save({ theme: mode }, t("top.themeUpdated"))}
                style={buttonStyle}
                className={`rounded-[9px] px-[14px] py-[10px] disabled:opacity-60 ${
                  settings.theme === mode ? "bg-lime text-lime-ink" : "bg-raised text-foreground"
                }`}
              >
                {mode === "dark" ? t("settings.dark") : t("settings.light")}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[11px] font-bold text-muted">{t("settings.language")}</p>
          <div className="mt-2 flex gap-2">
            {(["en", "pt"] as const).map((locale) => (
              <button
                key={locale}
                type="button"
                disabled={!canEdit || pending}
                onClick={() => void save({ locale }, t("settings.languageUpdated"))}
                style={buttonStyle}
                className={`rounded-[9px] px-[14px] py-[10px] disabled:opacity-60 ${
                  (settings.locale ?? "en") === locale ? "bg-lime text-lime-ink" : "bg-raised text-foreground"
                }`}
              >
                {locale === "en" ? t("settings.english") : t("settings.portuguese")}
              </button>
            ))}
          </div>
          <Swatches
            label={t("settings.lightBg")}
            options={lightBackgrounds}
            selected={settings.light_background}
            disabled={!canEdit || pending}
            onPick={(light_background) => void save({ light_background }, t("settings.colorsUpdated"))}
          />
          <Swatches
            label={t("settings.darkBg")}
            options={darkBackgrounds}
            selected={settings.dark_background}
            disabled={!canEdit || pending}
            onPick={(dark_background) => void save({ dark_background }, t("settings.colorsUpdated"))}
          />
          <Swatches
            label={t("settings.accent")}
            options={accents}
            selected={settings.accent}
            disabled={!canEdit || pending}
            onPick={(accent) => void save({ accent }, t("settings.colorsUpdated"))}
          />
          {canEdit ? null : <p className="mt-4 text-[12px] text-muted">{t("settings.adminTheme")}</p>}
        </section>
      ) : null}

      {showVisualPlaceholders && tab === "plans" ? (
        <section className="mt-4 grid gap-3 md:grid-cols-3">
          {settings.plans.map((plan) => {
            const current = plan.id === settings.plan;
            return (
              <article key={plan.id} className={`rounded-[14px] p-[18px] ${current ? "bg-card ring-2 ring-lime" : "bg-card"}`}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[14px] font-bold">{plan.name}</h2>
                  {current ? <span className="rounded-full bg-lime px-2 py-1 text-[10px] font-bold text-lime-ink">Current</span> : null}
                </div>
                <p className="mt-2 font-display text-[22px] font-extrabold tracking-[-0.6px]">{plan.price}</p>
                <p className="mt-2 text-[12px] text-muted">{plan.summary}</p>
                <ul className="mt-3 flex flex-col gap-1 text-[12px]">
                  {plan.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}

/** Renders a row of color choices. */
function Swatches({
  label,
  options,
  selected,
  disabled,
  onPick,
}: {
  label: string;
  options: readonly { value: string; label: string }[];
  selected: string;
  disabled: boolean;
  onPick: (value: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="mt-4">
      <p className="text-[11px] font-bold text-muted">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value.toLowerCase() === selected.toLowerCase();
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onPick(option.value)}
              className={`flex items-center gap-2 rounded-[9px] bg-raised px-2.5 py-2 text-[12px] disabled:opacity-60 ${
                active ? "ring-2 ring-lime" : ""
              }`}
            >
              <span className="size-4 rounded-full" style={{ background: option.value }} />
              {colorNames[option.label] ? t(colorNames[option.label]) : option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
