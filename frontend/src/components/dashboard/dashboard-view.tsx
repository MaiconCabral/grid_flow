"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, CalendarDays, Clock, Download, TriangleAlert, TrendingUp } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { notifyError } from "@/lib/alerts";
import { showVisualPlaceholders } from "@/lib/placeholders";
import { ApiError, api } from "@/lib/api-client";
import { dateLabel, eventSentence, eventWhen, initials, statusLabel, avatarColor } from "@/lib/activities";
import type { AgencyLocale } from "@/lib/agency-theme";
import type { Dashboard, DashboardAction } from "@/lib/dashboard";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import type { AuthUser } from "@/lib/session";

const headingButton = { fontSize: 11, fontWeight: 700, lineHeight: "16.5px" } as const;

const pipelineTone: Record<string, string> = {
  todo: "bg-faint",
  production: "bg-[#70b4d3]",
  pending: "bg-[#e9a15b]",
  approved: "bg-lime",
  scheduled: "bg-purple",
};

/** Shows the signed-in person's tasks, week, and recent history. */
export function DashboardView() {
  const slug = usePathname().split("/")[1] ?? "";
  const { locale, t } = useI18n();
  const [board, setBoard] = useState<Dashboard | null>(null);
  const [hello, setHello] = useState("");

  useEffect(() => {
    let active = true;
    api<{ user: AuthUser }>("/auth/me")
      .then((session) => {
        if (active) setHello(greeting(session.user.name.split(" ")[0] ?? "", t));
      })
      .catch((error: unknown) => notifyError(error instanceof ApiError ? error.message : t("dash.sessionFailed")));
    api<Dashboard>("/dashboard")
      .then((payload) => {
        if (active) setBoard(payload);
      })
      .catch((error: unknown) => notifyError(error instanceof ApiError ? error.message : t("dash.loadFailed")));
    return () => {
      active = false;
    };
  }, [t]);

  if (!board) {
    return <p className="px-[38px] pt-10 text-[13px] text-muted">{t("dash.loading")}</p>;
  }

  const admin = board.role === "agency_admin";
  const client = board.role === "client";
  const cards = metricCards(board, t);
  const pipelineMax = Math.max(...board.pipeline.map((stage) => stage.count), 1);

  return (
    <div className="mx-auto max-w-[1640px] px-[38px] pt-10 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-3 flex items-center gap-[7px] text-[9px] font-bold tracking-[1.4px] text-muted uppercase">
            <span className="size-[7px] rounded-full bg-lime shadow-[0_0_0_4px_rgba(187,255,82,0.1)]" />
            {client ? t("dash.brand") : admin ? t("dash.overview") : t("dash.work")}
          </p>
          <h1 className="mb-2 font-display text-[30px] leading-[1.18] font-extrabold tracking-[-1.3px]">
            {hello} <span className="ml-[3px] text-[22px] text-lime">✦</span>
          </h1>
          <p className="text-[13px] text-muted">{intro(board.role, t)}</p>
        </div>
        {admin ? (
          <div className="flex gap-[9px]">
            {showVisualPlaceholders ? (
              <button type="button" style={headingButton} className="inline-flex items-center gap-2 rounded-[9px] bg-raised px-[14px] py-[10px] text-foreground">
                <Download size={15} />
                {t("dash.export")}
              </button>
            ) : null}
            <Link href={`/${slug}/workspace`} style={headingButton} className="inline-flex items-center gap-2 rounded-[9px] bg-lime px-[14px] py-[10px] text-[#17240b]">
              {t("dash.newActivity")}
            </Link>
          </div>
        ) : null}
      </header>

      <section className="mt-9 mb-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <article key={card.label} className={`flex flex-col gap-3.5 rounded-[13px] p-[18px] ${index === 0 ? "bg-[linear-gradient(140deg,var(--lime-dark),var(--card))]" : "bg-card"}`}>
            <span className={`grid size-[34px] place-items-center rounded-[9px] ${card.iconClass}`}>{card.icon}</span>
            <div className="flex flex-col gap-1">
              <p className="font-display text-[26px] leading-none font-extrabold tracking-[-1px]">{String(card.value).padStart(2, "0")}</p>
              <p className="text-[11px] text-muted">{card.label}</p>
              <p className="text-[10px] text-faint">{card.hint}</p>
            </div>
          </article>
        ))}
      </section>

      <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-3.5">
          <section className="rounded-[14px] bg-card p-[18px]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex flex-col gap-[3px]">
                <h2 className="text-[13px] font-bold">{t("dash.action")}</h2>
                <p className="text-[10px] text-muted">{actionCount(board.actions.length, t)}</p>
              </div>
              <Link href={client ? `/${slug}/approval` : `/${slug}/workspace`} className="inline-flex items-center gap-[5px] text-[10px] font-semibold text-lime">
                {t("dash.viewAll")} <ArrowUpRight className="size-3" />
              </Link>
            </div>
            {board.actions.length === 0 ? <p className="text-[12px] text-muted">{t("dash.attention")}</p> : null}
            <ul className="flex flex-col gap-2">
              {board.actions.map((action) => (
                <li key={action.id} className="flex items-center gap-[11px] rounded-[10px] bg-raised p-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-bold">{action.title}</span>
                    <span className="block truncate text-[9px] text-muted">{actionMeta(action, t, locale)}</span>
                  </span>
                  <Link href={actionHref(slug, action, client)} className="shrink-0 rounded-[7px] bg-lime px-3 py-[7px] text-[9px] leading-none font-bold text-[#17240b]">
                    {client ? t("dash.review") : t("dash.open")}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[14px] bg-card p-[18px]">
            <div className="mb-4 flex flex-col gap-[3px]">
              <h2 className="text-[13px] font-bold">{t("dash.pipeline")}</h2>
              <p className="text-[10px] text-muted">{t("dash.tasks", { count: board.counts.total })}</p>
            </div>
            <ul className="flex flex-col gap-2.5">
              {board.pipeline.map((stage) => (
                <li key={stage.status} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-[7px] text-[10px] text-muted">
                    <span className={`size-[7px] rounded-full ${pipelineTone[stage.status] ?? "bg-faint"}`} />
                    {statusLabel(stage.status, t)}
                    <em className="ml-auto text-[10px] font-bold text-foreground not-italic">{stage.count}</em>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-lg bg-raised">
                    <div className={`h-full rounded-lg ${pipelineTone[stage.status] ?? "bg-faint"}`} style={{ width: `${(stage.count / pipelineMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[14px] bg-card p-[18px]">
            <div className="mb-4 flex flex-col gap-[3px]">
              <h2 className="text-[13px] font-bold">{t("dash.week")}</h2>
              <p className="text-[10px] text-muted">{dateLabel(board.week.start, locale, t)} — {dateLabel(board.week.end, locale, t)}</p>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {board.week.days.map((day) => {
                const parts = dayParts(day.date, locale);
                return (
                  <div key={day.date} className="min-w-0">
                    <div className="mb-1.5 flex flex-col items-center rounded-[7px] bg-raised py-1.5">
                      <span className="text-[9px] font-semibold text-muted">{parts.weekday}</span>
                      <small className="text-[11px] font-extrabold">{parts.day}</small>
                    </div>
                    <div className="flex flex-col gap-1">
                      {day.tasks.map((task) => (
                        <p key={task.id} className="truncate rounded-md bg-raised px-1 py-1 text-center text-[8px] text-muted">{task.title}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3.5">
          <section className="rounded-[14px] bg-card p-[18px]">
            <div className="mb-1 flex flex-col gap-[3px]">
              <h2 className="text-[13px] font-bold">{t("dash.feed")}</h2>
              <p className="text-[10px] text-muted">{t("dash.latest")}</p>
            </div>
            {board.events.length === 0 ? <p className="py-3 text-[12px] text-muted">{t("dash.noUpdates")}</p> : null}
            <ul>
              {board.events.map((event) => (
                <li key={event.id} className="flex gap-2.5 py-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white" style={{ background: avatarColor(event.actor ?? "?") }}>
                    {initials(event.actor ?? "?")}
                  </span>
                  <div>
                    <p className="mb-1 text-[11px] leading-[1.45] text-muted">
                      <strong className="font-bold text-foreground">{event.actor ?? t("date.someone")}</strong>{" "}
                      <span className="text-[9px] font-semibold text-lime">{roleName(event.actor_role, t)}</span>{" "}
                      {eventSentence(event, t)}{" "}
                      <em className="font-semibold text-foreground not-italic">{event.activity_title}</em>
                    </p>
                    <small className="text-[9px] text-faint">{eventWhen(event.created_at, locale)}</small>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {client ? null : (
            <section className="rounded-[14px] bg-card p-[18px]">
              <div className="flex flex-col gap-[3px]">
                <h2 className="text-[13px] font-bold">{admin ? t("dash.topClients") : t("dash.brands")}</h2>
                <p className="text-[10px] text-muted">{admin ? t("dash.brandsOpen", { count: board.brands.length }) : t("dash.brandsYours", { count: board.brands.length })}</p>
              </div>
              {board.brands.length === 0 ? <p className="mt-3 text-[12px] text-muted">{t("dash.noOpen")}</p> : null}
              <ul className="mt-3 flex flex-col gap-1">
                {board.brands.map((brand) => (
                  <li key={brand.id ?? brand.name} className="flex items-center gap-2.5 rounded-[9px] p-2.5">
                    <span className="grid size-[30px] place-items-center rounded-lg text-[10px] font-extrabold text-white" style={{ background: avatarColor(brand.name ?? "?") }}>
                      {initials(brand.name ?? "?")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold">{brand.name}</span>
                      <span className="block text-[9px] text-muted">{t("dash.openPending", { open: brand.open, pending: brand.pending })}</span>
                    </span>
                    <span className={`size-2 rounded-full ${brand.pending > 0 ? "bg-[#e9a15b] shadow-[0_0_0_3px_rgba(233,161,91,0.12)]" : "bg-lime shadow-[0_0_0_3px_rgba(187,255,82,0.12)]"}`} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

type Copy = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** Picks the four numbers that matter for this role. */
function metricCards(board: Dashboard, t: Copy) {
  const counts = board.counts;
  const icon = (node: ReactNode, iconClass: string) => ({ icon: node, iconClass });
  const clock = icon(<Clock className="size-4" strokeWidth={1.75} />, "bg-[rgba(187,255,82,0.12)] text-lime");
  const calendar = icon(<CalendarDays className="size-4" strokeWidth={1.75} />, "bg-purple-soft text-[#d97ce7]");
  const trend = icon(<TrendingUp className="size-4" strokeWidth={1.75} />, "bg-blue-soft text-[#70b4d3]");
  const alert = icon(<TriangleAlert className="size-4" strokeWidth={1.75} />, "bg-orange-soft text-[#efa85e]");

  if (board.role === "client") {
    return [
      { ...clock, label: t("dash.awaitingReview"), value: counts.pending, hint: t("dash.awaitingHint") },
      { ...calendar, label: t("dash.production"), value: counts.production, hint: t("dash.productionTeam") },
      { ...trend, label: t("dash.approved"), value: counts.approved, hint: t("dash.signedOff") },
      { ...alert, label: t("dash.scheduled"), value: counts.scheduled, hint: t("dash.ready") },
    ];
  }

  if (board.role === "agency_admin") {
    return [
      { ...clock, label: t("dash.production"), value: counts.production, hint: t("dash.productionNow") },
      { ...calendar, label: t("dash.pending"), value: counts.pending, hint: t("dash.pendingClient") },
      { ...trend, label: t("dash.approved"), value: counts.approved, hint: t("dash.signedOff") },
      { ...alert, label: t("dash.scheduled"), value: counts.scheduled, hint: t("dash.ready") },
    ];
  }

  return [
    { ...clock, label: t("dash.production"), value: counts.production, hint: t("dash.productionDesk") },
    { ...calendar, label: t("dash.awaitingClient"), value: counts.pending, hint: t("dash.awaitingDecision") },
    { ...trend, label: t("dash.dueWeek"), value: counts.due_this_week, hint: t("dash.dueHint") },
    { ...alert, label: t("dash.overdue"), value: counts.overdue, hint: t("dash.overdueHint") },
  ];
}

/** Writes the action-list count in plain language. */
function actionCount(count: number, t: Copy) {
  if (count === 0) return t("dash.nothing");
  if (count === 1) return t("dash.waitingOne");
  return t("dash.waitingMany", { count });
}

/** Describes one action row. */
function actionMeta(action: DashboardAction, t: Copy, locale: AgencyLocale) {
  const reason = action.reason === "overdue" ? t("dash.overdue") : action.reason === "pending" ? t("dash.pending") : t("dash.production");
  return `${action.workspace ?? t("dash.noBrand")} · ${reason} · ${dateLabel(action.due_on, locale, t)}`;
}

/** Opens the piece for a client and the task for the team. */
function actionHref(slug: string, action: DashboardAction, client: boolean) {
  return client ? `/${slug}/approval/${action.id}` : `/${slug}/workspace/${action.id}`;
}

/** Builds a greeting from the time of day. */
function greeting(name: string, t: Copy) {
  const hour = new Date().getHours();
  const part = hour < 12 ? t("hello.morning") : hour < 18 ? t("hello.afternoon") : t("hello.evening");
  return name ? `${part}, ${name}` : part;
}

/** Splits a date into a weekday and a day number. */
function dayParts(iso: string, locale: AgencyLocale) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return {
    weekday: date.toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", { weekday: "short" }),
    day: date.getDate(),
  };
}

/** Writes the sentence under the greeting. */
function intro(role: string, t: Copy) {
  if (role === "client") return t("dash.clientLine");
  if (role === "agency_admin") return t("dash.adminLine");
  return t("dash.staffLine");
}

const roleKeys: Record<string, MessageKey> = {
  agency_admin: "role.agency_admin",
  designer: "role.designer",
  copywriter: "role.copywriter",
  client: "role.client",
};

/** Returns the role name in the active language. */
function roleName(role: string | null, t: Copy) {
  const key = role ? roleKeys[role] : undefined;
  return key ? t(key) : (role ?? "");
}
