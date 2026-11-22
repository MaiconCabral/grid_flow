import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowUpRight, CalendarDays, Clock, Download, Play, Plus, RotateCcw, TriangleAlert, TrendingUp, UserRound } from "lucide-react";
import { actionItems, activityFeed, pipeline, topClients, weekDays } from "@/data/mock";

const pipelineTone: Record<string, string> = {
  "To Do": "bg-faint",
  "In Production": "bg-[#70b4d3]",
  "Internal Review": "bg-purple",
  "Client Review": "bg-[#e9a15b]",
  Approved: "bg-lime",
  Scheduled: "bg-[#e9a15b]",
};

const headingButton = { fontSize: 11, fontWeight: 700, lineHeight: "16.5px" } as const;

const actionMarks = [
  { color: "bg-[#7fb83a]", icon: RotateCcw },
  { color: "bg-purple", icon: UserRound },
  { color: "bg-[#e9a15b]", icon: Play },
];

export async function DashboardView() {
  const slug = (await cookies()).get("gridflow_tenant")?.value ?? "";
  const pipelineMax = Math.max(...pipeline.map((stage) => stage.count));

  return (
    <div className="mx-auto max-w-[1640px] px-[38px] pt-10 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-3 flex items-center gap-[7px] text-[9px] font-bold tracking-[1.4px] text-muted uppercase">
            <span className="size-[7px] rounded-full bg-lime shadow-[0_0_0_4px_rgba(187,255,82,0.1)]" />
            Agency overview
          </p>
          <h1 className="mb-2 font-display text-[30px] leading-[1.18] font-extrabold tracking-[-1.3px]">
            Welcome back, Jordan <span className="ml-[3px] text-[22px] text-lime">✦</span>
          </h1>
          <p className="text-[13px] text-muted">Here&apos;s what&apos;s happening across your agency today.</p>
        </div>
        <div className="flex gap-[9px]">
          <button type="button" style={headingButton} className="inline-flex items-center gap-2 rounded-[9px] bg-raised px-[14px] py-[10px] text-foreground hover:bg-soft">
            <Download size={15} />
            Export report
          </button>
          <button type="button" style={headingButton} className="inline-flex items-center gap-2 rounded-[9px] bg-lime px-[14px] py-[10px] text-[#17240b] shadow-[0_8px_25px_rgba(187,255,82,0.12)] hover:-translate-y-px hover:shadow-[0_10px_30px_rgba(187,255,82,0.23)]">
            <Plus size={17} />
            New activity
          </button>
        </div>
      </header>

      <section className="mt-9 mb-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="flex flex-col gap-3.5 rounded-[13px] bg-[linear-gradient(140deg,var(--lime-dark),var(--card))] p-[18px]">
          <span className="grid size-[34px] place-items-center rounded-[9px] bg-[rgba(187,255,82,0.12)] text-lime">
            <Clock className="size-4" strokeWidth={1.75} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-display text-[26px] leading-none font-extrabold tracking-[-1px]">03</p>
            <p className="text-[11px] text-muted">Awaiting approval</p>
            <p className="text-[9px] font-bold text-lime">Requires client review</p>
          </div>
        </article>
        <article className="flex flex-col gap-3.5 rounded-[13px] bg-card p-[18px]">
          <span className="grid size-[34px] place-items-center rounded-[9px] bg-purple-soft text-[#d97ce7]">
            <CalendarDays className="size-4" strokeWidth={1.75} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-display text-[26px] leading-none font-extrabold tracking-[-1px]">12</p>
            <p className="text-[11px] text-muted">Weekly deliverables</p>
            <p className="text-[10px] text-faint">8 of 12 scheduled</p>
            <div className="h-1 overflow-hidden rounded-lg bg-soft">
              <div className="h-full w-2/3 rounded-lg bg-purple" />
            </div>
          </div>
        </article>
        <article className="flex flex-col gap-3.5 rounded-[13px] bg-card p-[18px]">
          <div className="flex items-center justify-between">
            <span className="grid size-[34px] place-items-center rounded-[9px] bg-blue-soft text-[#70b4d3]">
              <TrendingUp className="size-4" strokeWidth={1.75} />
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-lime">
              <ArrowUpRight className="size-3" /> +5%
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-display text-[26px] leading-none font-extrabold tracking-[-1px]">84%</p>
            <p className="text-[11px] text-muted">First-pass approval rate</p>
            <p className="text-[10px] text-faint">+5% this month</p>
          </div>
        </article>
        <article className="flex flex-col gap-3.5 rounded-[13px] bg-card p-[18px]">
          <div className="flex items-center justify-between">
            <span className="grid size-[34px] place-items-center rounded-[9px] bg-orange-soft text-[#efa85e]">
              <TriangleAlert className="size-4" strokeWidth={1.75} />
            </span>
            <span className="rounded-[6px] bg-[rgba(187,255,82,0.12)] px-2 py-1 text-[9px] font-bold text-[#5f852e]">healthy</span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-display text-[26px] leading-none font-extrabold tracking-[-1px]">2.4d</p>
            <p className="text-[11px] text-muted">Avg. time in production</p>
            <p className="text-[10px] text-faint">On track</p>
          </div>
        </article>
      </section>

      <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-3.5">
          <section className="rounded-[14px] bg-card p-[18px]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex flex-col gap-[3px]">
                <h2 className="text-[13px] font-bold">Action needed</h2>
                <p className="text-[10px] text-muted">3 items require attention</p>
              </div>
              <Link href={`/${slug}/workspace`} className="inline-flex items-center gap-[5px] text-[10px] font-semibold text-lime">
                View all <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <ul className="flex flex-col gap-2">
              {actionItems.map((item, index) => {
                const mark = actionMarks[index];
                const Icon = mark.icon;
                return (
                  <li key={item.title} className="flex items-center gap-[11px] rounded-[10px] bg-raised p-2.5">
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-lg">
                      <Image src={item.image} alt="" fill sizes="44px" className="object-cover" />
                      <span className={`absolute -right-0.5 -bottom-0.5 grid size-[18px] place-items-center rounded-full text-white shadow-[0_0_0_2px_var(--raised)] ${mark.color}`}>
                        <Icon className="size-2.5" strokeWidth={2.5} />
                      </span>
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[11px] font-bold">{item.title}</span>
                      <span className="truncate text-[9px] text-muted">{item.meta}</span>
                    </span>
                    <Link href={`/${slug}${item.href}`} className="shrink-0 rounded-[7px] bg-lime px-3 py-[7px] text-[9px] leading-none font-bold text-[#17240b]">
                      {item.action}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-[14px] bg-card p-[18px]">
            <div className="mb-4 flex flex-col gap-[3px]">
              <h2 className="text-[13px] font-bold">Workflow pipeline</h2>
              <p className="text-[10px] text-muted">29 active tasks across 6 stages</p>
            </div>
            <ul className="flex flex-col gap-2.5">
              {pipeline.map((stage) => (
                <li key={stage.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-[7px] text-[10px] text-muted">
                    <span className={`size-[7px] rounded-full ${pipelineTone[stage.label]}`} />
                    {stage.label}
                    <em className="ml-auto text-[10px] font-bold text-foreground not-italic">{stage.count}</em>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-lg bg-raised">
                    <div className={`h-full rounded-lg ${pipelineTone[stage.label]}`} style={{ width: `${(stage.count / pipelineMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[14px] bg-card p-[18px]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex flex-col gap-[3px]">
                <h2 className="text-[13px] font-bold">This week&apos;s calendar</h2>
                <p className="text-[10px] text-muted">Aug 19 — 25, 2024</p>
              </div>
              <div className="flex gap-1">
                <span className="rounded-[5px] bg-[#e8849f]/10 px-1.5 py-1 text-[9px] font-bold text-[#e8849f]">6</span>
                <span className="rounded-[5px] bg-blue-soft px-1.5 py-1 text-[9px] font-bold text-[#70b4d3]">3</span>
                <span className="rounded-[5px] bg-purple-soft px-1.5 py-1 text-[9px] font-bold text-[#d97ce7]">2</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {weekDays.map((day) => (
                <div key={day.day} className="min-w-0">
                  <div className="mb-1.5 flex flex-col items-center rounded-[7px] bg-raised py-1.5">
                    <span className="text-[9px] font-semibold text-muted">{day.day}</span>
                    <small className="text-[11px] font-extrabold">{day.date}</small>
                  </div>
                  <div className="flex flex-col gap-1">
                    {day.events.map((event) => (
                      <p key={event.time} className="rounded-md bg-raised px-1 py-1 text-center text-[8px] text-muted">
                        {event.time}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3.5">
          <section className="rounded-[14px] bg-card p-[18px]">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex flex-col gap-[3px]">
                <h2 className="text-[13px] font-bold">Activity feed</h2>
                <p className="text-[10px] text-muted">Live updates</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-lime">
                <span className="size-1.5 rounded-full bg-lime" />
                Live
              </span>
            </div>
            <ul>
              {activityFeed.map((item) => (
                <li key={item.name + item.time} className="flex gap-2.5 py-3">
                  <span
                    className="grid size-7 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white"
                    style={{ background: item.color }}
                  >
                    {item.initials}
                  </span>
                  <div>
                    <p className="mb-1 text-[11px] leading-[1.45] text-muted">
                      <strong className="font-bold text-foreground">{item.name}</strong>{" "}
                      <span className="text-[9px] font-semibold text-lime">{item.role}</span> {item.text}{" "}
                      <em className="font-semibold text-foreground not-italic">{item.emphasis}</em>
                    </p>
                    <small className="text-[9px] text-faint">{item.time}</small>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[14px] bg-card p-[18px]">
            <div className="flex flex-col gap-[3px]">
              <h2 className="text-[13px] font-bold">Top clients</h2>
              <p className="text-[10px] text-muted">4 active workspaces</p>
            </div>
            <ul className="mt-3 flex flex-col gap-1">
              {topClients.map((client, index) => (
                <li key={client.name} className="flex items-center gap-2.5 rounded-[9px] p-2.5 hover:bg-raised">
                  <span
                    className="grid size-[30px] place-items-center rounded-lg text-[10px] font-extrabold text-white"
                    style={{ background: client.color }}
                  >
                    {client.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold">{client.name}</span>
                    <span className="block text-[9px] text-muted">{client.pending} pending tasks</span>
                  </span>
                  <span className={`size-2 rounded-full ${index === 1 ? "bg-[#e9a15b] shadow-[0_0_0_3px_rgba(233,161,91,0.12)]" : "bg-lime shadow-[0_0_0_3px_rgba(187,255,82,0.12)]"}`} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
