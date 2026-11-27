"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, CalendarDays, Clock, Download, TriangleAlert, TrendingUp } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { notifyError } from "@/lib/alerts";
import { showVisualPlaceholders } from "@/lib/placeholders";
import { ApiError, api } from "@/lib/api-client";
import { dateLabel, eventSentence, eventWhen, initials, roleLabels, statusLabel, avatarColor } from "@/lib/activities";
import type { Dashboard, DashboardAction } from "@/lib/dashboard";
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
  const [board, setBoard] = useState<Dashboard | null>(null);
  const [hello, setHello] = useState("Good afternoon");

  useEffect(() => {
    let active = true;
    api<{ user: AuthUser }>("/auth/me")
      .then((session) => {
        if (active) setHello(greeting(session.user.name.split(" ")[0] ?? ""));
      })
      .catch((error: unknown) => notifyError(error instanceof ApiError ? error.message : "Could not load your session."));
    api<Dashboard>("/dashboard")
      .then((payload) => {
        if (active) setBoard(payload);
      })
      .catch((error: unknown) => notifyError(error instanceof ApiError ? error.message : "Could not load the dashboard."));
    return () => {
      active = false;
    };
  }, []);

  if (!board) {
    return <p className="px-[38px] pt-10 text-[13px] text-muted">Loading the dashboard...</p>;
  }

  const admin = board.role === "agency_admin";
  const client = board.role === "client";
  const cards = metricCards(board);
  const pipelineMax = Math.max(...board.pipeline.map((stage) => stage.count), 1);

  return (
    <div className="mx-auto max-w-[1640px] px-[38px] pt-10 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-3 flex items-center gap-[7px] text-[9px] font-bold tracking-[1.4px] text-muted uppercase">
            <span className="size-[7px] rounded-full bg-lime shadow-[0_0_0_4px_rgba(187,255,82,0.1)]" />
            {client ? "Your brand" : admin ? "Agency overview" : "Your work"}
          </p>
          <h1 className="mb-2 font-display text-[30px] leading-[1.18] font-extrabold tracking-[-1.3px]">
            {hello} <span className="ml-[3px] text-[22px] text-lime">✦</span>
          </h1>
          <p className="text-[13px] text-muted">{intro(board.role)}</p>
        </div>
        {admin ? (
          <div className="flex gap-[9px]">
            {showVisualPlaceholders ? (
              <button type="button" style={headingButton} className="inline-flex items-center gap-2 rounded-[9px] bg-raised px-[14px] py-[10px] text-foreground">
                <Download size={15} />
                Export report
              </button>
            ) : null}
            <Link href={`/${slug}/workspace`} style={headingButton} className="inline-flex items-center gap-2 rounded-[9px] bg-lime px-[14px] py-[10px] text-[#17240b]">
              New activity
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
                <h2 className="text-[13px] font-bold">Action needed</h2>
                <p className="text-[10px] text-muted">{actionCount(board.actions.length)}</p>
              </div>
              <Link href={client ? `/${slug}/approval` : `/${slug}/workspace`} className="inline-flex items-center gap-[5px] text-[10px] font-semibold text-lime">
                View all <ArrowUpRight className="size-3" />
              </Link>
            </div>
            {board.actions.length === 0 ? <p className="text-[12px] text-muted">Nothing needs attention.</p> : null}
            <ul className="flex flex-col gap-2">
              {board.actions.map((action) => (
                <li key={action.id} className="flex items-center gap-[11px] rounded-[10px] bg-raised p-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-bold">{action.title}</span>
                    <span className="block truncate text-[9px] text-muted">{actionMeta(action)}</span>
                  </span>
                  <Link href={actionHref(slug, action, client)} className="shrink-0 rounded-[7px] bg-lime px-3 py-[7px] text-[9px] leading-none font-bold text-[#17240b]">
                    {client ? "Review" : "Open"}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[14px] bg-card p-[18px]">
            <div className="mb-4 flex flex-col gap-[3px]">
              <h2 className="text-[13px] font-bold">Workflow pipeline</h2>
              <p className="text-[10px] text-muted">{board.counts.total} tasks across 5 stages</p>
            </div>
            <ul className="flex flex-col gap-2.5">
              {board.pipeline.map((stage) => (
                <li key={stage.status} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-[7px] text-[10px] text-muted">
                    <span className={`size-[7px] rounded-full ${pipelineTone[stage.status] ?? "bg-faint"}`} />
                    {statusLabel(stage.status)}
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
              <h2 className="text-[13px] font-bold">This week&apos;s calendar</h2>
              <p className="text-[10px] text-muted">{dateLabel(board.week.start)} — {dateLabel(board.week.end)}</p>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {board.week.days.map((day) => {
                const parts = dayParts(day.date);
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
              <h2 className="text-[13px] font-bold">Activity feed</h2>
              <p className="text-[10px] text-muted">Latest updates</p>
            </div>
            {board.events.length === 0 ? <p className="py-3 text-[12px] text-muted">No updates yet.</p> : null}
            <ul>
              {board.events.map((event) => (
                <li key={event.id} className="flex gap-2.5 py-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white" style={{ background: avatarColor(event.actor ?? "?") }}>
                    {initials(event.actor ?? "?")}
                  </span>
                  <div>
                    <p className="mb-1 text-[11px] leading-[1.45] text-muted">
                      <strong className="font-bold text-foreground">{event.actor ?? "Someone"}</strong>{" "}
                      <span className="text-[9px] font-semibold text-lime">{roleLabels[event.actor_role ?? ""] ?? event.actor_role}</span>{" "}
                      {eventSentence(event)}{" "}
                      <em className="font-semibold text-foreground not-italic">{event.activity_title}</em>
                    </p>
                    <small className="text-[9px] text-faint">{eventWhen(event.created_at)}</small>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {client ? null : (
            <section className="rounded-[14px] bg-card p-[18px]">
              <div className="flex flex-col gap-[3px]">
                <h2 className="text-[13px] font-bold">{admin ? "Top clients" : "Your brands"}</h2>
                <p className="text-[10px] text-muted">{board.brands.length} {admin ? "brands with open work" : "brands on your tasks"}</p>
              </div>
              {board.brands.length === 0 ? <p className="mt-3 text-[12px] text-muted">No open work yet.</p> : null}
              <ul className="mt-3 flex flex-col gap-1">
                {board.brands.map((brand) => (
                  <li key={brand.id ?? brand.name} className="flex items-center gap-2.5 rounded-[9px] p-2.5">
                    <span className="grid size-[30px] place-items-center rounded-lg text-[10px] font-extrabold text-white" style={{ background: avatarColor(brand.name ?? "?") }}>
                      {initials(brand.name ?? "?")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold">{brand.name}</span>
                      <span className="block text-[9px] text-muted">{brand.open} open · {brand.pending} pending</span>
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

/** Picks the four numbers that matter for this role. */
function metricCards(board: Dashboard) {
  const counts = board.counts;
  const icon = (node: ReactNode, iconClass: string) => ({ icon: node, iconClass });
  const clock = icon(<Clock className="size-4" strokeWidth={1.75} />, "bg-[rgba(187,255,82,0.12)] text-lime");
  const calendar = icon(<CalendarDays className="size-4" strokeWidth={1.75} />, "bg-purple-soft text-[#d97ce7]");
  const trend = icon(<TrendingUp className="size-4" strokeWidth={1.75} />, "bg-blue-soft text-[#70b4d3]");
  const alert = icon(<TriangleAlert className="size-4" strokeWidth={1.75} />, "bg-orange-soft text-[#efa85e]");

  if (board.role === "client") {
    return [
      { ...clock, label: "Awaiting your review", value: counts.pending, hint: "Pieces ready for a decision" },
      { ...calendar, label: "In production", value: counts.production, hint: "Still with the team" },
      { ...trend, label: "Approved", value: counts.approved, hint: "Signed off" },
      { ...alert, label: "Scheduled", value: counts.scheduled, hint: "Ready to publish" },
    ];
  }

  if (board.role === "agency_admin") {
    return [
      { ...clock, label: "In production", value: counts.production, hint: "Being made now" },
      { ...calendar, label: "Pending approval", value: counts.pending, hint: "Waiting on a client" },
      { ...trend, label: "Approved", value: counts.approved, hint: "Signed off" },
      { ...alert, label: "Scheduled", value: counts.scheduled, hint: "Ready to publish" },
    ];
  }

  return [
    { ...clock, label: "In production", value: counts.production, hint: "On your desk" },
    { ...calendar, label: "Awaiting client", value: counts.pending, hint: "Waiting on a decision" },
    { ...trend, label: "Due this week", value: counts.due_this_week, hint: "Deliveries this week" },
    { ...alert, label: "Overdue", value: counts.overdue, hint: "Past the due date" },
  ];
}

/** Writes the action-list count in plain language. */
function actionCount(count: number) {
  if (count === 0) return "Nothing is waiting";
  if (count === 1) return "1 item requires attention";
  return `${count} items require attention`;
}

/** Describes one action row. */
function actionMeta(action: DashboardAction) {
  const reason = action.reason === "overdue" ? "Overdue" : action.reason === "pending" ? "Pending approval" : "In production";
  return `${action.workspace ?? "No brand"} · ${reason} · ${dateLabel(action.due_on)}`;
}

/** Opens the piece for a client and the task for the team. */
function actionHref(slug: string, action: DashboardAction, client: boolean) {
  return client ? `/${slug}/approval/${action.id}` : `/${slug}/workspace/${action.id}`;
}

/** Builds a greeting from the time of day. */
function greeting(name: string) {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name}` : part;
}

/** Splits a date into a weekday and a day number. */
function dayParts(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    day: date.getDate(),
  };
}

/** Writes the sentence under the greeting. */
function intro(role: string) {
  if (role === "client") return "Here is what is waiting on your brand.";
  if (role === "agency_admin") return "Here is what is happening across your agency today.";
  return "Here is what is on your desk today.";
}
