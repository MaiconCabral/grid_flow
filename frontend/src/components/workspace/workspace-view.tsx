"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock, Download, LayoutGrid, List, MessageSquare, MoreHorizontal, Paperclip, Plus, Search, Smile, Zap } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { activities, clients, stages, workspaceMetrics, type Activity } from "@/data/mock";

type View = "board" | "list" | "calendar";

const formatClass: Record<string, string> = {
  "LinkedIn Post": "text-[#9ed9ef]",
  "Instagram Story": "text-[#f5a8bf]",
  "Short-form Video": "text-[#9ed9ef]",
  "Instagram Carousel": "text-[#f7d37c]",
  "Social Collection": "text-[#d6ff8a]",
};

const columnDot: Record<string, string> = {
  todo: "bg-faint",
  production: "bg-[#70b4d3]",
  pending: "bg-purple",
  approved: "bg-lime",
  scheduled: "bg-[#e9a15b]",
};

const headingButton = { fontSize: 11, fontWeight: 700, lineHeight: "16.5px" } as const;

const metricIcons = [Zap, Clock, CalendarDays, Smile];
const metricIconClass = ["bg-lime-dark text-lime", "bg-purple-soft text-[#d97ce7]", "bg-orange-soft text-[#efa85e]", "bg-blue-soft text-[#70b4d3]"];

const barSets = [
  [8, 14, 10, 18, 12, 20, 16],
  [16, 12, 18, 10, 8, 14, 11],
  [10, 16, 12, 20, 14, 11, 18],
  [12, 18, 14, 10, 20, 16, 13],
];

export function WorkspaceView() {
  const [view, setView] = useState<View>("board");
  const [query, setQuery] = useState("");
  const [client, setClient] = useState("All clients");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [weekStart, setWeekStart] = useState(() => new Date(2024, 7, 19));

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return activities.filter((activity) => {
      const matchesClient = client === "All clients" || activity.client === client;
      const haystack = `${activity.title} ${activity.client} ${activity.format}`.toLowerCase();
      return matchesClient && haystack.includes(needle);
    });
  }, [client, query]);

  const filtering = query.trim() !== "" || client !== "All clients";

  return (
    <div className="mx-auto max-w-[1640px] px-[38px] pt-10 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-3 flex items-center gap-1.5 text-[9px] font-bold tracking-[1.4px] text-muted uppercase">
            <span className="size-1.5 rounded-full bg-lime shadow-[0_0_0_4px_rgba(187,255,82,0.1)]" />
            Live workspace
          </p>
          <h1 className="mb-2 font-display text-[30px] leading-[1.18] font-extrabold tracking-[-1.3px]">
            Good morning, Jordan <span className="ml-1 text-[22px] text-lime">✦</span>
          </h1>
          <p className="text-[13px] text-muted">Keep your team moving and your clients in the loop.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" style={headingButton} className="inline-flex items-center gap-2 rounded-[9px] bg-raised px-[14px] py-[10px] text-foreground hover:bg-soft">
            <Download size={15} />
            Export
          </button>
          <button type="button" style={headingButton} className="inline-flex items-center gap-2 rounded-[9px] bg-lime px-[14px] py-[10px] text-[#17240b] shadow-[0_8px_25px_rgba(187,255,82,0.12)] hover:-translate-y-px hover:shadow-[0_10px_30px_rgba(187,255,82,0.23)]">
            <Plus size={17} />
            New activity
          </button>
        </div>
      </header>

      <section className="mt-9 mb-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {workspaceMetrics.map((metric, index) => {
          const Icon = metricIcons[index];
          return (
            <article key={metric.label} className="flex items-center gap-3 overflow-hidden rounded-[13px] bg-card p-[17px]">
              <span className={`grid size-[33px] shrink-0 place-items-center rounded-[9px] ${metricIconClass[index]}`}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] text-muted">{metric.label}</p>
                <p className="mt-1 flex items-center gap-1.5">
                  <span className="font-display text-[20px] leading-none font-bold">{metric.value}</span>
                  <span className={`text-[10px] ${metric.up ? "text-lime" : "text-bad"}`}>{metric.delta}</span>
                </p>
              </div>
              <MiniBars heights={barSets[index]} />
            </article>
          );
        })}
      </section>

      <div className="mt-4 mb-[17px] flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-1 rounded-[9px] bg-card p-[3px]">
          <ViewButton current={view} value="board" label="Board" icon={<LayoutGrid className="size-4" />} onClick={setView} />
          <ViewButton current={view} value="list" label="List" icon={<List className="size-4" />} onClick={setView} />
          <ViewButton current={view} value="calendar" label="Calendar" icon={<CalendarDays className="size-4" />} onClick={setView} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-[34px] w-[195px] items-center gap-2 rounded-lg bg-card px-2.5 text-faint">
            <Search className="size-3.5" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search activities..."
              className="w-full bg-transparent text-[11px] text-foreground outline-none placeholder:text-faint"
            />
          </label>
          <select
            aria-label="Filter by client"
            value={client}
            onChange={(event) => setClient(event.target.value)}
            className="h-[34px] rounded-lg bg-card px-2.5 text-[11px]"
          >
            <option>All clients</option>
            {clients
              .filter((name) => name !== "Acme Corp")
              .map((name) => (
                <option key={name}>{name}</option>
              ))}
          </select>
          <div className="relative">
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-lg bg-card px-2.5 py-2 text-[11px] font-bold"
            >
              Filters
              <span className="rounded-full bg-lime px-1.5 text-xs font-semibold text-lime-ink">2</span>
            </button>
            {filtersOpen ? (
              <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-line bg-card p-3 text-sm shadow-lg">
                <p className="text-xs text-muted">Active filters</p>
                <p className="mt-2 rounded-lg bg-raised px-2 py-1">Priority · High</p>
                <p className="mt-1 rounded-lg bg-raised px-2 py-1">Owner · My team</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {view === "board" ? <Board activities={filtered} filtering={filtering} /> : null}
      {view === "list" ? <ActivityList activities={filtered} filtering={filtering} /> : null}
      {view === "calendar" ? (
        <WeekCalendar
          activities={filtered}
          weekStart={weekStart}
          onPrev={() => setWeekStart((date) => addDays(date, -7))}
          onNext={() => setWeekStart((date) => addDays(date, 7))}
        />
      ) : null}
    </div>
  );
}

function ViewButton({
  current,
  value,
  label,
  icon,
  onClick,
}: {
  current: View;
  value: View;
  label: string;
  icon: ReactNode;
  onClick: (view: View) => void;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-2 text-[11px] ${active ? "bg-soft text-foreground" : "text-muted"}`}
    >
      {icon}
      {label}
    </button>
  );
}

function Board({ activities: items, filtering }: { activities: Activity[]; filtering: boolean }) {
  return (
    <div className="grid grid-cols-5 gap-3 overflow-x-auto pb-2">
      {stages.map((stage) => {
        const cards = items.filter((activity) => activity.stage === stage.id);
        const count = filtering ? cards.length : stage.count;
        return (
          <section key={stage.id} className="min-h-[440px] w-full min-w-[205px] rounded-[13px] bg-raised p-2.5">
            <header className="mb-3 flex items-center justify-between px-1">
              <h2 className="flex items-center gap-2 text-[11px] font-semibold">
                <span className={`size-1.5 rounded-full ${columnDot[stage.id]}`} />
                {stage.label}
                <small className="rounded-[10px] bg-soft px-1.5 py-0.5 text-[10px] text-faint">{count}</small>
              </h2>
              <button type="button" aria-label={`${stage.label} options`} className="text-muted">
                <MoreHorizontal className="size-3.5" />
              </button>
            </header>
            <div className="space-y-3">
              {cards.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
              {cards.length === 0 ? (
                <p className="flex min-h-[120px] flex-col items-center justify-center rounded-[9px] bg-card text-[10px] text-faint">
                  Drop activity here
                </p>
              ) : null}
              <button type="button" className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-[10px] text-muted hover:bg-soft hover:text-foreground">
                <Plus className="size-3" /> Add activity
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ActivityList({ activities: items, filtering }: { activities: Activity[]; filtering: boolean }) {
  return (
    <div className="space-y-4">
      {stages.map((stage) => {
        const rows = items.filter((activity) => activity.stage === stage.id);
        const count = filtering ? rows.length : stage.count;
        return (
          <section key={stage.id} className="overflow-hidden rounded-[13px] bg-card">
            <h2 className="bg-raised px-4 py-3 text-[11px] font-semibold">
              {stage.label} <span className="text-muted">{count}</span>
            </h2>
            {rows.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted">No activities in this stage.</p>
            ) : (
              <ul>
                {rows.map((activity) => (
                  <li key={activity.id} className="flex items-center gap-4 border-b border-raised px-4 py-3 last:border-b-0">
                    <Image src={activity.image} alt="" width={64} height={44} className="h-11 w-16 rounded-lg object-cover" />
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${formatClass[activity.format]}`}>
                      {activity.format}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-muted">{activity.client}</span>
                      <span className="block truncate text-sm font-semibold">{activity.title}</span>
                    </span>
                    <span className="text-xs text-muted">{activity.dateLabel}</span>
                    <Assignees activity={activity} />
                    <Meta activity={activity} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function WeekCalendar({
  activities: items,
  weekStart,
  onPrev,
  onNext,
}: {
  activities: Activity[];
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
}) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const label = `${formatDay(days[0])} — ${formatDay(days[6])}`;

  return (
    <section className="rounded-[14px] bg-card p-[18px]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{label}</h2>
        <div className="flex gap-2">
          <button type="button" onClick={onPrev} className="rounded-lg border border-line px-3 py-1 text-sm">
            Previous
          </button>
          <button type="button" onClick={onNext} className="rounded-lg border border-line px-3 py-1 text-sm">
            Next
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const key = iso(day);
          const cards = items.filter((activity) => activity.date === key);
          return (
            <div key={key} className="min-h-40 rounded-xl bg-raised p-2">
              <p className="text-[11px] text-muted">{day.toLocaleDateString("en-US", { weekday: "short" })}</p>
              <p className="text-sm font-semibold">{day.getDate()}</p>
              <div className="mt-2 space-y-1">
                {cards.map((activity) => (
                  <p key={activity.id} className="rounded-md bg-lime/15 px-1.5 py-1 text-[11px] leading-tight">
                    <span className="block font-medium">{activity.title}</span>
                    <span className="text-muted">{activity.client}</span>
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ActivityCard({ activity }: { activity: Activity }) {
  const slug = usePathname().split("/")[1];
  const body = (
    <>
      <div className="relative h-[100px] overflow-hidden">
        <Image src={activity.image} alt="" fill sizes="240px" className="object-cover" />
        <span className={`absolute bottom-2 left-2 rounded-[5px] bg-black/70 px-1.5 py-1 text-[8px] font-bold backdrop-blur ${formatClass[activity.format]}`}>
          {activity.format}
        </span>
        <span className="absolute top-1.5 right-1.5 grid size-[23px] place-items-center rounded-md bg-black/55 text-white">
          <MoreHorizontal className="size-3" />
        </span>
      </div>
      <div className="px-[11px] pt-[11px] pb-2.5">
        <p className="text-[9px] font-bold tracking-[0.3px] text-lime">{activity.client}</p>
        <p className="mt-1 font-display text-xs leading-snug font-semibold">{activity.title}</p>
        <div className="mt-3.5 flex items-center justify-between">
          <span className="text-[9px] text-muted">{activity.dateLabel}</span>
          <Assignees activity={activity} />
        </div>
      </div>
      <Meta activity={activity} />
    </>
  );

  const className = "block overflow-hidden rounded-[10px] bg-card shadow-[0_8px_18px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5";

  if (activity.id === "summer-carousel") {
    return (
      <Link href={`/${slug}/approval`} className={className}>
        {body}
      </Link>
    );
  }

  return <article className={className}>{body}</article>;
}

function Assignees({ activity }: { activity: Activity }) {
  return (
    <span className="flex -space-x-1">
      {activity.assignees.map((person) => (
        <span
          key={person.initials}
          className="grid size-[22px] place-items-center rounded-full text-[8px] font-bold text-white shadow-[0_0_0_2px_var(--card)]"
          style={{ background: person.color }}
        >
          {person.initials}
        </span>
      ))}
    </span>
  );
}

function Meta({ activity }: { activity: Activity }) {
  return (
    <div className="flex items-center gap-2.5 bg-raised px-[11px] py-2 text-[9px] text-faint">
      <span className="inline-flex items-center gap-1">
        <MessageSquare className="size-3" /> {activity.comments}
      </span>
      <span className="inline-flex items-center gap-1">
        <Paperclip className="size-3" /> {activity.attachments}
      </span>
      <span className="ml-auto inline-flex items-center gap-1 text-muted">
        <span className="size-[5px] rounded-full bg-[#ed8b64]" />
        {activity.priority}
      </span>
    </div>
  );
}

function MiniBars({ heights }: { heights: number[] }) {
  return (
    <span className="ml-auto flex h-6 items-end gap-[3px] opacity-70" aria-hidden>
      {heights.map((height, index) => (
        <span key={index} className="w-[3px] rounded-full bg-lime" style={{ height: Math.round(height * 0.7) }} />
      ))}
    </span>
  );
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function iso(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatDay(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
