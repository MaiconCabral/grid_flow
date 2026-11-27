"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { notifyError } from "@/lib/alerts";
import { ApiError, api } from "@/lib/api-client";
import {
  assetUrl,
  clientCanSee,
  coverGradient,
  formatLabel,
  formatPlural,
  formats,
  statusBadgeClass,
  statusLabel,
  typeClass,
  typeLabel,
  type ActivityBoard,
  type BoardActivity,
} from "@/lib/activities";
import { PiecePreview } from "@/components/client/piece-preview";
import type { AgencyLocale } from "@/lib/agency-theme";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";

/** Lists the brand's reviewable pieces as a monthly feed the client can open. */
export function ClientHome() {
  const slug = usePathname().split("/")[1] ?? "";
  const { locale, t } = useI18n();
  const [items, setItems] = useState<BoardActivity[] | null>(null);
  const [chosenFormat, setChosenFormat] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    /** Reloads the feed so a piece sent for approval shows its image. */
    function load() {
      api<ActivityBoard>("/activities")
        .then((board) => {
          if (active) setItems(board.data);
        })
        .catch((error: unknown) => notifyError(error instanceof ApiError ? error.message : t("client.loadFailed")));
    }
    /** Refreshes the feed when the client comes back to the tab. */
    function onVisible() {
      if (document.visibilityState === "visible") load();
    }
    load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [t]);

  const sent = useMemo(() => (items ?? []).filter((item) => clientCanSee(item.status)), [items]);
  const month = chosen ?? preferredMonth(sent);
  const available = useMemo(
    () => formats.filter((item) => sent.some((activity) => activity.format === item.value)),
    [sent],
  );
  const format = available.some((item) => item.value === chosenFormat) ? chosenFormat : (available[0]?.value ?? null);

  const visible = sent.filter((item) => item.due_on?.startsWith(month) && item.format === format);
  const loose = sent.filter((item) => !item.due_on && item.format === format);
  const sequence = [...visible, ...loose];
  const openIndex = openId === null ? -1 : sequence.findIndex((item) => item.id === openId);

  /** Marks a piece approved without leaving the preview. */
  function markApproved(id: number) {
    setItems((current) => current?.map((item) => (item.id === id ? { ...item, status: "approved" } : item)) ?? null);
  }

  return (
    <div className="mx-auto max-w-[1640px] px-[38px] pt-10 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-3 flex items-center gap-[7px] text-[9px] font-bold tracking-[1.4px] text-muted uppercase">
            <span className="size-[7px] rounded-full bg-lime shadow-[0_0_0_4px_rgba(187,255,82,0.1)]" />
            {t("client.feed")}
          </p>
          <div className="flex items-center gap-2">
            <MonthButton label={t("client.previous")} onClick={() => setChosen(shiftMonth(month, -1))}>
              <ChevronLeft className="size-5" />
            </MonthButton>
            <h1 className="font-display text-[30px] leading-[1.18] font-extrabold tracking-[-1.3px]">{monthTitle(month, locale)}</h1>
            <MonthButton label={t("client.next")} onClick={() => setChosen(shiftMonth(month, 1))}>
              <ChevronRight className="size-5" />
            </MonthButton>
          </div>
          <p className="mt-2 text-[13px] text-muted">{deliveryLine(format, t)}</p>
        </div>
        {available.length > 0 ? (
          <div className="inline-flex flex-wrap rounded-full bg-raised p-1">
            {available.map((item) => (
              <SurfaceButton key={item.value} active={format === item.value} onClick={() => { setChosenFormat(item.value); setOpenId(null); }}>
                {formatLabel(item.value, t)}
              </SurfaceButton>
            ))}
          </div>
        ) : null}
      </header>

      {items === null ? <p className="mt-10 text-sm text-muted">{t("client.loading")}</p> : null}
      {items !== null && sent.length === 0 ? <p className="mt-10 text-sm text-muted">{t("client.none")}</p> : null}
      {items !== null && sent.length > 0 && visible.length === 0 ? (
        <p className="mt-10 text-sm text-muted">{t("client.noneMonth", { name: format ? formatPlural(format, t) : t("nav.pieces").toLowerCase() })}</p>
      ) : null}

      <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {visible.map((activity) => (
          <li key={activity.id}>
            <PieceCard activity={activity} onOpen={setOpenId} />
          </li>
        ))}
      </ul>

      {loose.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-lg font-extrabold tracking-[-0.4px]">{t("client.noDate")}</h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {loose.map((activity) => (
              <li key={activity.id}>
                <PieceCard activity={activity} onOpen={setOpenId} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {openIndex >= 0 ? (
        <PiecePreview
          pieces={sequence}
          index={openIndex}
          slug={slug}
          onClose={() => setOpenId(null)}
          onIndex={(next) => setOpenId(sequence[next]?.id ?? null)}
          onApproved={markApproved}
        />
      ) : null}
    </div>
  );
}

/** Opens the social preview for one sent piece. */
function PieceCard({ activity, onOpen }: { activity: BoardActivity; onOpen: (id: number) => void }) {
  const { t } = useI18n();
  const src = assetUrl(activity.cover_url);
  return (
    <button
      type="button"
      onClick={() => onOpen(activity.id)}
      className="block w-full overflow-hidden rounded-[10px] bg-card text-left shadow-[0_8px_18px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5"
    >
      <span className="relative block h-[150px] overflow-hidden">
        <Cover src={src} activity={activity} />
        <span className={`absolute top-2 right-2 rounded-lg px-2 py-1 text-[10px] font-bold ${statusBadgeClass(activity.status)}`}>
          {statusLabel(activity.status, t)}
        </span>
        <span className={`absolute bottom-2 left-2 rounded-[5px] bg-black/70 px-1.5 py-1 text-[8px] font-bold backdrop-blur ${typeClass(activity.channel)}`}>
          {typeLabel(activity.channel, activity.format, t)}
        </span>
      </span>
      <span className="block px-[11px] pt-[11px] pb-2.5">
        <span className="block text-[9px] font-bold tracking-[0.3px] text-lime">{activity.workspace.name}</span>
        <span className="mt-1 block font-display text-xs leading-snug font-semibold">{activity.title}</span>
      </span>
    </button>
  );
}

/** Shows the cover image or a plain stand-in. */
function Cover({ src, activity }: { src: string | null; activity: BoardActivity }) {
  if (!src) {
    const gradient = coverGradient(activity);
    return <span className={`block h-full w-full ${gradient ? "" : "bg-soft"}`} style={gradient} />;
  }
  return <img src={src} alt="" className="h-full w-full object-cover" />; // eslint-disable-line @next/next/no-img-element -- file is served by the API
}

/** Renders one side of the month switch. */
function MonthButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="grid size-9 place-items-center rounded-full bg-raised text-foreground hover:bg-soft">
      {children}
    </button>
  );
}

/** Highlights the delivery format the client is reviewing. */
function SurfaceButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-[12px] font-bold ${active ? "bg-lime text-lime-ink" : "text-muted hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

/** Names the format open on the grade. */
function deliveryLine(format: string | null, t: (key: MessageKey, vars?: Record<string, string | number>) => string) {
  if (!format) return t("client.reviewSocial");
  return t("client.reviewing", { name: formatPlural(format, t) });
}

/** Opens the current month, or the latest month that has a sent piece. */
function preferredMonth(sent: BoardActivity[]) {
  const now = currentMonth();
  const keys = sent.filter((item) => item.due_on).map((item) => item.due_on!.slice(0, 7));
  if (keys.includes(now) || keys.length === 0) return now;
  return [...keys].sort().at(-1) ?? now;
}

/** Returns the current month as YYYY-MM. */
function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Moves a YYYY-MM key by a number of months. */
function shiftMonth(key: string, delta: number) {
  const [year, month] = key.split("-").map(Number);
  const next = new Date(year, month - 1 + delta, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

/** Formats a YYYY-MM key as a month and year in the agency language. */
function monthTitle(key: string, locale: AgencyLocale) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", { month: "long", year: "numeric" });
}
