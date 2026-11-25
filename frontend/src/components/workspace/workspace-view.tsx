"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock, Download, LayoutGrid, List, MessageSquare, MoreHorizontal, Paperclip, Plus, Search, Smile, X, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { notifyError, notifySuccess } from "@/lib/alerts";
import { ApiError, api } from "@/lib/api-client";
import {
  addDays,
  assetUrl,
  avatarColor,
  channels,
  coverGradient,
  dateLabel,
  formats,
  initials,
  isoDate,
  stages,
  startOfWeek,
  typeClass,
  typeLabel,
  type ActivityBoard,
  type BoardActivity,
  type StageId,
} from "@/lib/activities";
import type { AuthUser } from "@/lib/session";
import { useTheme } from "@/components/theme-provider";

type View = "board" | "list" | "calendar";

type StaffUser = { id: number; name: string; role: string };

type Draft = {
  workspaceId: string;
  assigneeId: string;
  title: string;
  briefing: string;
  channel: string;
  format: string;
  dueOn: string;
};

const columnDot: Record<string, string> = {
  todo: "bg-faint",
  production: "bg-[#70b4d3]",
  pending: "bg-purple",
  approved: "bg-lime",
  scheduled: "bg-[#e9a15b]",
};

const headingButton = { fontSize: 11, fontWeight: 700, lineHeight: "16.5px" } as const;
const metricIcons = [Zap, Clock, Smile, CalendarDays];
const metricIconClass = ["bg-lime-dark text-lime", "bg-purple-soft text-[#d97ce7]", "bg-orange-soft text-[#efa85e]", "bg-blue-soft text-[#70b4d3]"];
const barSets = [
  [8, 14, 10, 18, 12, 20, 16],
  [16, 12, 18, 10, 8, 14, 11],
  [10, 16, 12, 20, 14, 11, 18],
  [12, 18, 14, 10, 20, 16, 13],
];

const emptyDraft: Draft = {
  workspaceId: "",
  assigneeId: "",
  title: "",
  briefing: "",
  channel: "instagram",
  format: "post",
  dueOn: "",
};

/** Renders the live board, list, and calendar for the agency. */
export function WorkspaceView() {
  const [view, setView] = useState<View>("board");
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [items, setItems] = useState<BoardActivity[]>([]);
  const [brands, setBrands] = useState<ActivityBoard["brands"]>([]);
  const [metrics, setMetrics] = useState<ActivityBoard["metrics"]>({ production: 0, pending: 0, approved: 0, scheduled: 0 });
  const [role, setRole] = useState<string | null>(null);
  const [hello, setHello] = useState("Good afternoon");
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [draftOpen, setDraftOpen] = useState(false);
  const [briefingFile, setBriefingFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const slug = usePathname().split("/")[1] ?? "";

  /** Stores the board payload in the view state. */
  const applyBoard = useCallback((board: ActivityBoard) => {
    setItems(board.data);
    setBrands(board.brands);
    setMetrics(board.metrics);
  }, []);

  /** Reloads the tasks after a create or a move. */
  async function reload() {
    applyBoard(await api<ActivityBoard>("/activities"));
  }

  useEffect(() => {
    let active = true;
    api<{ user: AuthUser }>("/auth/me")
      .then((session) => {
        if (!active) return;
        setRole(session.user.role);
        setHello(greeting(session.user.name.split(" ")[0] ?? ""));
        if (session.user.role === "agency_admin") {
          return api<{ data: StaffUser[] }>("/users").then((users) => {
            if (active) setStaff(users.data.filter((user) => user.role !== "client"));
          });
        }
      })
      .catch((error: unknown) => notifyError(error instanceof ApiError ? error.message : "Could not load your session."));
    api<ActivityBoard>("/activities")
      .then((board) => {
        if (active) applyBoard(board);
      })
      .catch((error: unknown) => notifyError(error instanceof ApiError ? error.message : "Could not load the board."));
    return () => {
      active = false;
    };
  }, [applyBoard]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((activity) => {
      const matchesBrand = brand === "all" || String(activity.workspace.id) === brand;
      const haystack = `${activity.title} ${activity.workspace.name} ${typeLabel(activity.channel, activity.format)}`.toLowerCase();
      return matchesBrand && haystack.includes(needle);
    });
  }, [brand, items, query]);

  const filtering = query.trim() !== "" || brand !== "all";
  const canCreate = role === "agency_admin";
  const metricCards = [
    { label: "In production", value: metrics.production },
    { label: "Pending approval", value: metrics.pending },
    { label: "Approved", value: metrics.approved },
    { label: "Scheduled", value: metrics.scheduled },
  ];

  /** Removes a task from the board. */
  async function remove(id: number) {
    const previous = items;
    setItems(items.filter((activity) => activity.id !== id));
    try {
      await api(`/activities/${id}`, { method: "DELETE" });
      await reload();
      notifySuccess("Activity deleted.");
    } catch (error) {
      setItems(previous);
      notifyError(error instanceof ApiError ? error.message : "Could not delete the task.");
    }
  }

  /** Moves a card when the admin drops it on an allowed column. */
  async function move(id: number, status: StageId) {
    const current = items.find((activity) => activity.id === id);
    if (!current || current.status === status || status === "approved" || role !== "agency_admin") return;
    const previous = items;
    setItems(items.map((activity) => (activity.id === id ? { ...activity, status } : activity)));
    try {
      await api(`/activities/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await reload();
    } catch (error) {
      setItems(previous);
      notifyError(error instanceof ApiError ? error.message : "Could not move the task.");
    }
  }

  /** Creates a task in To Do from the lightbox. */
  async function create(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const body = new FormData();
      body.set("workspace_id", String(Number(draft.workspaceId)));
      if (draft.assigneeId) body.set("assignee_id", String(Number(draft.assigneeId)));
      body.set("title", draft.title);
      body.set("briefing", draft.briefing);
      body.set("channel", draft.channel);
      body.set("format", draft.format);
      if (draft.dueOn) body.set("due_on", draft.dueOn);
      if (briefingFile) body.set("briefing_file", briefingFile);
      await api("/activities", { method: "POST", body });
      setDraftOpen(false);
      setDraft(emptyDraft);
      setBriefingFile(null);
      await reload();
      notifySuccess("Activity created.");
    } catch (error) {
      notifyError(error instanceof ApiError ? error.message : "Could not create the activity.");
    } finally {
      setSaving(false);
    }
  }

  /** Opens the new activity form with the first brand selected. */
  function openDraft() {
    setDraft({ ...emptyDraft, workspaceId: brands[0] ? String(brands[0].id) : "" });
    setDraftOpen(true);
  }

  return (
    <div className="mx-auto max-w-[1640px] px-[38px] pt-10 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-3 flex items-center gap-1.5 text-[9px] font-bold tracking-[1.4px] text-muted uppercase">
            <span className="size-1.5 rounded-full bg-lime shadow-[0_0_0_4px_rgba(187,255,82,0.1)]" />
            Live workspace
          </p>
          <h1 className="mb-2 font-display text-[30px] leading-[1.18] font-extrabold tracking-[-1.3px]">
            {hello} <span className="ml-1 text-[22px] text-lime">✦</span>
          </h1>
          <p className="text-[13px] text-muted">Keep your team moving and your clients in the loop.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" style={headingButton} className="inline-flex items-center gap-2 rounded-[9px] bg-raised px-[14px] py-[10px] text-foreground hover:bg-soft">
            <Download size={15} />
            Export
          </button>
          {canCreate ? (
            <button type="button" onClick={openDraft} style={headingButton} className="inline-flex items-center gap-2 rounded-[9px] bg-lime px-[14px] py-[10px] text-[#17240b] shadow-[0_8px_25px_rgba(187,255,82,0.12)] hover:-translate-y-px hover:shadow-[0_10px_30px_rgba(187,255,82,0.23)]">
              <Plus size={17} />
              New activity
            </button>
          ) : null}
        </div>
      </header>

      <section className="mt-9 mb-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric, index) => {
          const Icon = metricIcons[index];
          return (
            <article key={metric.label} className="flex items-center gap-3 overflow-hidden rounded-[13px] bg-card p-[17px]">
              <span className={`grid size-[33px] shrink-0 place-items-center rounded-[9px] ${metricIconClass[index]}`}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] text-muted">{metric.label}</p>
                <p className="mt-1 font-display text-[20px] leading-none font-bold">{metric.value}</p>
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
              autoComplete="off"
              placeholder="Search activities..."
              className="w-full bg-transparent text-[11px] text-foreground outline-none placeholder:text-faint"
            />
          </label>
          <select
            aria-label="Filter by client"
            value={brand}
            onChange={(event) => setBrand(event.target.value)}
            className="h-[34px] rounded-lg bg-card px-2.5 text-[11px]"
          >
            <option value="all">All clients</option>
            {brands.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
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

      {view === "board" ? (
        <Board
          activities={filtered}
          slug={slug}
          filtering={filtering}
          canMove={role === "agency_admin"}
          canDelete={role === "agency_admin"}
          canCreate={canCreate}
          dragging={dragging}
          onDragStart={setDragging}
          onDragEnd={() => setDragging(null)}
          onMove={move}
          onDelete={remove}
          onCreate={openDraft}
        />
      ) : null}
      {view === "list" ? <ActivityList activities={filtered} slug={slug} filtering={filtering} /> : null}
      {view === "calendar" ? (
        <WeekCalendar
          activities={filtered}
          slug={slug}
          weekStart={weekStart}
          onPrev={() => setWeekStart((date) => addDays(date, -7))}
          onNext={() => setWeekStart((date) => addDays(date, 7))}
        />
      ) : null}
      {draftOpen ? (
        <ActivityDialog
          draft={draft}
          brands={brands}
          staff={staff}
          saving={saving}
          onChange={setDraft}
          onClose={() => { setDraftOpen(false); setBriefingFile(null); }}
          briefingFile={briefingFile}
          onBriefingFile={setBriefingFile}
          onSubmit={create}
        />
      ) : null}
    </div>
  );
}

/** Switches the workspace between board, list, and calendar. */
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

/** Renders the five columns and accepts a dropped card. */
function Board({
  activities: items,
  slug,
  filtering,
  canMove,
  canDelete,
  canCreate,
  dragging,
  onDragStart,
  onDragEnd,
  onMove,
  onDelete,
  onCreate,
}: {
  activities: BoardActivity[];
  slug: string;
  filtering: boolean;
  canMove: boolean;
  canDelete: boolean;
  canCreate: boolean;
  dragging: number | null;
  onDragStart: (id: number) => void;
  onDragEnd: () => void;
  onMove: (id: number, status: StageId) => void;
  onDelete: (id: number) => void;
  onCreate: () => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-3 overflow-x-auto pb-2">
      {stages.map((stage) => {
        const cards = items.filter((activity) => activity.status === stage.id);
        const count = filtering ? cards.length : cards.length;
        const droppable = canMove && stage.id !== "approved" && dragging !== null;
        return (
          <section
            key={stage.id}
            onDragOver={(event) => {
              if (droppable) event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              const id = Number(event.dataTransfer.getData("text/plain"));
              if (id) onMove(id, stage.id);
            }}
            className={`min-h-[440px] w-full min-w-[205px] rounded-[13px] bg-raised p-2.5 ${droppable ? "outline outline-1 outline-lime/40" : ""}`}
          >
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
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  slug={slug}
                  canMove={canMove}
                  canDelete={canDelete && activity.status !== "approved" && activity.status !== "scheduled"}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDelete={onDelete}
                />
              ))}
              {cards.length === 0 ? (
                <p className="flex min-h-[120px] flex-col items-center justify-center rounded-[9px] bg-card text-[10px] text-faint">
                  Drop activity here
                </p>
              ) : null}
              {canCreate ? (
                <button type="button" onClick={onCreate} className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-[10px] text-muted hover:bg-soft hover:text-foreground">
                  <Plus className="size-3" /> Add activity
                </button>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Lists tasks grouped by column. */
function ActivityList({ activities: items, slug, filtering }: { activities: BoardActivity[]; slug: string; filtering: boolean }) {
  return (
    <div className="space-y-4">
      {stages.map((stage) => {
        const rows = items.filter((activity) => activity.status === stage.id);
        const count = filtering ? rows.length : rows.length;
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
                  <li key={activity.id} className="border-b border-raised last:border-b-0">
                    <Link href={activityHref(slug, activity.id)} className="flex items-center gap-4 px-4 py-3 hover:bg-raised/60">
                      <Cover activity={activity} className="h-11 w-16 rounded-lg" />
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${typeClass(activity.channel)}`}>
                        {typeLabel(activity.channel, activity.format)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs text-muted">{activity.workspace.name}</span>
                        <span className="block truncate text-sm font-semibold">{activity.title}</span>
                      </span>
                      <span className="text-xs text-muted">{dateLabel(activity.due_on)}</span>
                      <Assignee activity={activity} />
                      <Meta activity={activity} />
                    </Link>
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

/** Shows the tasks of the visible week. */
function WeekCalendar({
  activities: items,
  slug,
  weekStart,
  onPrev,
  onNext,
}: {
  activities: BoardActivity[];
  slug: string;
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
          const key = isoDate(day);
          const cards = items.filter((activity) => activity.due_on === key);
          return (
            <div key={key} className="min-h-40 rounded-xl bg-raised p-2">
              <p className="text-[11px] text-muted">{day.toLocaleDateString("en-US", { weekday: "short" })}</p>
              <p className="text-sm font-semibold">{day.getDate()}</p>
              <div className="mt-2 space-y-1">
                {cards.map((activity) => (
                  <Link key={activity.id} href={activityHref(slug, activity.id)} className="block rounded-md bg-lime/15 px-1.5 py-1 text-[11px] leading-tight">
                    <span className="block font-medium">{activity.title}</span>
                    <span className="text-muted">{activity.workspace.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Renders one draggable card that opens the task. */
function ActivityCard({
  activity,
  slug,
  canMove,
  canDelete,
  onDragStart,
  onDragEnd,
  onDelete,
}: {
  activity: BoardActivity;
  slug: string;
  canMove: boolean;
  canDelete: boolean;
  onDragStart: (id: number) => void;
  onDragEnd: () => void;
  onDelete: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    /** Closes the card menu after a click outside it. */
    function onPointer(event: MouseEvent) {
      if (!menu.current?.contains(event.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  return (
    <div
      draggable={canMove}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", String(activity.id));
        event.dataTransfer.effectAllowed = "move";
        onDragStart(activity.id);
      }}
      onDragEnd={onDragEnd}
      className={`relative overflow-hidden rounded-[10px] bg-card shadow-[0_8px_18px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 ${canMove ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <Link href={activityHref(slug, activity.id)} className="block">
        <div className="relative h-[150px] overflow-hidden">
          <Cover activity={activity} className="h-full w-full" />
          <span className={`absolute bottom-2 left-2 rounded-[5px] bg-black/70 px-1.5 py-1 text-[8px] font-bold backdrop-blur ${typeClass(activity.channel)}`}>
            {typeLabel(activity.channel, activity.format)}
          </span>
        </div>
        <div className="px-[11px] pt-[11px] pb-2.5">
          <p className="text-[9px] font-bold tracking-[0.3px] text-lime">{activity.workspace.name}</p>
          <p className="mt-1 font-display text-xs leading-snug font-semibold">{activity.title}</p>
          <div className="mt-3.5 flex items-center justify-between">
            <span className="text-[9px] text-muted">{dateLabel(activity.due_on)}</span>
            <Assignee activity={activity} />
          </div>
        </div>
        <Meta activity={activity} />
      </Link>
      <div ref={menu} className="absolute top-1.5 right-1.5 z-10">
        <button
          type="button"
          aria-label={`Options for ${activity.title}`}
          aria-expanded={open}
          draggable={false}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setConfirming(false);
            setOpen((current) => !current);
          }}
          className="grid size-[23px] place-items-center rounded-md bg-black/55 text-white"
        >
          <MoreHorizontal className="size-3" />
        </button>
        {open ? (
          <div className="absolute top-7 right-0 w-36 overflow-hidden rounded-lg border border-line bg-card py-1 text-[12px] shadow-lg">
            {confirming ? (
              <div className="px-3 py-2">
                <p className="text-[11px] leading-snug text-muted">Delete this task?</p>
                <button type="button" onClick={() => onDelete(activity.id)} className="mt-2 block text-left font-semibold text-[#e07a7a]">
                  Delete
                </button>
                <button type="button" onClick={() => setConfirming(false)} className="mt-1 block text-left font-semibold">
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <Link href={activityHref(slug, activity.id)} className="block px-3 py-1.5 font-semibold hover:bg-raised" onClick={() => setOpen(false)}>
                  View
                </Link>
                {canDelete ? (
                  <button type="button" onClick={() => setConfirming(true)} className="block w-full px-3 py-1.5 text-left font-semibold text-[#e07a7a] hover:bg-raised">
                    Delete
                  </button>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Shows the cover image or a plain stand-in. */
function Cover({ activity, className }: { activity: BoardActivity; className: string }) {
  const src = assetUrl(activity.cover_url);
  if (!src) {
    const gradient = coverGradient(activity);
    return <span className={`block ${gradient ? "" : "bg-soft"} ${className}`} style={gradient} />;
  }
  return <img src={src} alt="" className={`object-cover ${className}`} />; // eslint-disable-line @next/next/no-img-element -- file is served by the API
}

/** Shows the initials of the person responsible. */
function Assignee({ activity }: { activity: BoardActivity }) {
  if (!activity.assignee) return null;
  return (
    <span
      title={activity.assignee.name}
      className="grid size-[22px] place-items-center rounded-full text-[8px] font-bold text-white shadow-[0_0_0_2px_var(--card)]"
      style={{ background: avatarColor(activity.assignee.name) }}
    >
      {initials(activity.assignee.name)}
    </span>
  );
}

/** Shows how many notes and files a task has. */
function Meta({ activity }: { activity: BoardActivity }) {
  return (
    <div className="flex items-center gap-2.5 bg-raised px-[11px] py-2 text-[9px] text-faint">
      <span className="inline-flex items-center gap-1">
        <MessageSquare className="size-3" /> {activity.events_count}
      </span>
      <span className="inline-flex items-center gap-1">
        <Paperclip className="size-3" /> {activity.assets_count}
      </span>
    </div>
  );
}

/** Draws the small decorative bars on a metric card. */
function MiniBars({ heights }: { heights: number[] }) {
  return (
    <span className="ml-auto flex h-6 items-end gap-[3px] opacity-70" aria-hidden>
      {heights.map((height, index) => (
        <span key={index} className="w-[3px] rounded-full bg-lime" style={{ height: Math.round(height * 0.7) }} />
      ))}
    </span>
  );
}

/** Collects the briefing for a task that starts in To Do. */
function ActivityDialog({
  draft,
  brands,
  staff,
  saving,
  onChange,
  onClose,
  briefingFile,
  onBriefingFile,
  onSubmit,
}: {
  draft: Draft;
  brands: ActivityBoard["brands"];
  staff: StaffUser[];
  saving: boolean;
  onChange: (draft: Draft) => void;
  onClose: () => void;
  briefingFile: File | null;
  onBriefingFile: (file: File | null) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const { theme } = useTheme();

  useEffect(() => {
    /** Closes the lightbox when Escape is pressed. */
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={`fixed inset-0 z-50 grid place-items-center px-4 ${theme === "light" ? "bg-[#181b19]/35" : "bg-black/60"}`} onMouseDown={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-draft-title"
        onSubmit={onSubmit}
        onMouseDown={(event) => event.stopPropagation()}
        style={{ colorScheme: theme }}
        className="grid max-h-[90vh] w-full max-w-[480px] gap-3 overflow-y-auto rounded-[14px] bg-card p-[18px] text-foreground shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
      >
        <div className="flex items-start justify-between gap-3">
          <p id="activity-draft-title" className="text-[13px] font-bold">
            New activity
          </p>
          <button type="button" aria-label="Close" onClick={onClose} className="grid size-7 place-items-center rounded-md text-muted hover:bg-raised hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <Select label="Brand" value={draft.workspaceId} onChange={(workspaceId) => onChange({ ...draft, workspaceId })}>
          {brands.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <Field label="Title" value={draft.title} onChange={(title) => onChange({ ...draft, title })} />
        <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
          Briefing
          <textarea
            required
            value={draft.briefing}
            onChange={(event) => onChange({ ...draft, briefing: event.target.value })}
            rows={4}
            className="rounded-[9px] bg-raised px-3 py-2.5 text-[13px] font-normal text-foreground outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
          Briefing file
          <input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf"
            onChange={(event) => onBriefingFile(event.target.files?.[0] ?? null)}
            className="text-[13px] font-normal"
          />
          <span className="font-normal text-faint">{briefingFile ? briefingFile.name : "Optional PDF or Word document."}</span>
        </label>
        <Select label="Channel" value={draft.channel} onChange={(channel) => onChange({ ...draft, channel })}>
          {channels.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <Select label="Format" value={draft.format} onChange={(format) => onChange({ ...draft, format })}>
          {formats.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <Select label="Assignee" value={draft.assigneeId} onChange={(assigneeId) => onChange({ ...draft, assigneeId })} required={false}>
          <option value="">Unassigned</option>
          {staff.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </Select>
        <Field label="Due date" type="date" required={false} value={draft.dueOn} onChange={(dueOn) => onChange({ ...draft, dueOn })} />
        <div className="mt-1 flex justify-end gap-2">
          <button type="button" onClick={onClose} style={headingButton} className="rounded-[9px] bg-raised px-3 py-2 text-foreground">
            Cancel
          </button>
          <button type="submit" disabled={saving || brands.length === 0} style={headingButton} className="rounded-[9px] bg-lime px-3 py-2 text-lime-ink disabled:opacity-60">
            {saving ? "Saving..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

/** Renders a labeled text input. */
function Field({
  label,
  value,
  onChange,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-[9px] bg-raised px-3 py-2.5 text-[13px] font-normal text-foreground outline-none"
      />
    </label>
  );
}

/** Renders a labeled select. */
function Select({
  label,
  value,
  onChange,
  required = true,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
      {label}
      <select
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-[9px] bg-raised px-3 py-2.5 text-[13px] font-normal text-foreground outline-none"
      >
        {children}
      </select>
    </label>
  );
}

/** Builds the task page address for the current agency. */
function activityHref(slug: string, id: number) {
  return `/${slug}/workspace/${id}`;
}

/** Picks a greeting from the time of day. */
function greeting(name: string) {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name}` : part;
}

/** Formats a day for the calendar heading. */
function formatDay(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
