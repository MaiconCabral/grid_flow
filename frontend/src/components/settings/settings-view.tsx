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

/** Renders agency, appearance, and plan settings. */
export function SettingsView() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("agency");
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);

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
        void notifyError(caught instanceof ApiError ? caught.message : "Could not load settings.");
        setReady(true);
      });
  }, []);

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
      void notifyError(caught instanceof ApiError ? caught.message : "Could not save settings.");
    } finally {
      setPending(false);
    }
  }

  if (!ready) {
    return <p className="px-[38px] pt-10 text-[13px] text-muted">Loading settings...</p>;
  }

  if (role !== "agency_admin") {
    return (
      <div className="mx-auto max-w-[860px] px-[38px] pt-10">
        <p className="text-[13px] text-muted">This page is not available.</p>
      </div>
    );
  }

  if (!settings) {
    return <p className="px-[38px] pt-10 text-[13px] text-muted">Could not load settings.</p>;
  }

  return (
    <div className="mx-auto max-w-[1640px] px-[38px] pt-10 pb-12">
      <header>
        <p className="mb-3 text-[9px] font-bold tracking-[1.4px] text-muted uppercase">Manage</p>
        <h1 className="font-display text-[30px] leading-[1.18] font-extrabold tracking-[-1.3px]">Settings</h1>
        <p className="mt-2 text-[13px] text-muted">{showVisualPlaceholders ? "Agency details, colors, and the current subscription." : "Agency details and colors."}</p>
      </header>

      <div role="tablist" aria-label="Settings" className="mt-8 flex w-fit gap-1 rounded-[9px] bg-card p-1">
        {(
          [
            ["agency", "Agency"],
            ["appearance", "Appearance"],
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
              void save({ name }, "Agency updated.");
            }}
          >
            <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
              Agency name
              <input
                required
                disabled={!canEdit}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-[9px] bg-raised px-3 py-2.5 text-[13px] font-normal text-foreground outline-none disabled:opacity-70"
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
              Slug
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
                {pending ? "Saving..." : "Save"}
              </button>
            ) : (
              <p className="text-[12px] text-muted">Only the Agency Admin can change these details.</p>
            )}
          </form>
        </section>
      ) : null}

      {tab === "appearance" ? (
        <section className="mt-4 max-w-xl rounded-[14px] bg-card p-[18px]">
          <p className="text-[11px] font-bold text-muted">Mode</p>
          <div className="mt-2 flex gap-2">
            {(["dark", "light"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={!canEdit || pending}
                onClick={() => void save({ theme: mode }, "Theme updated.")}
                style={buttonStyle}
                className={`rounded-[9px] px-[14px] py-[10px] capitalize disabled:opacity-60 ${
                  settings.theme === mode ? "bg-lime text-lime-ink" : "bg-raised text-foreground"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <Swatches
            label="Light background"
            options={lightBackgrounds}
            selected={settings.light_background}
            disabled={!canEdit || pending}
            onPick={(light_background) => void save({ light_background }, "Colors updated.")}
          />
          <Swatches
            label="Dark background"
            options={darkBackgrounds}
            selected={settings.dark_background}
            disabled={!canEdit || pending}
            onPick={(dark_background) => void save({ dark_background }, "Colors updated.")}
          />
          <Swatches
            label="Accent"
            options={accents}
            selected={settings.accent}
            disabled={!canEdit || pending}
            onPick={(accent) => void save({ accent }, "Colors updated.")}
          />
          {canEdit ? null : <p className="mt-4 text-[12px] text-muted">Only the Agency Admin can change the theme.</p>}
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
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
