"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { notifyError, notifySuccess } from "@/lib/alerts";
import { ApiError, api } from "@/lib/api-client";
import {
  assetUrl,
  dateLabel,
  eventSentence,
  eventWhen,
  statusLabel,
  typeLabel,
  type ActivityDetail,
} from "@/lib/activities";
import type { AuthUser } from "@/lib/session";

type Kind = "image" | "pdf" | "document" | "link";

/** Shows one task, its files, and the history of what happened. */
export function ActivityView() {
  const params = useParams<{ tenantSlug: string; activityId: string }>();
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [kind, setKind] = useState<Kind>("image");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let active = true;
    api<{ user: AuthUser }>("/auth/me")
      .then((session) => {
        if (active) setUser(session.user);
      })
      .catch((error: unknown) => notifyError(error instanceof ApiError ? error.message : "Could not load your session."));
    api<ActivityDetail>(`/activities/${params.activityId}`)
      .then((detail) => {
        if (active) setActivity(detail);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
          setMissing(true);
          return;
        }
        notifyError(error instanceof ApiError ? error.message : "Could not load the task.");
      });
    return () => {
      active = false;
    };
  }, [params.activityId]);

  if (missing) {
    return (
      <div className="mx-auto max-w-[860px] px-[38px] py-16">
        <p className="text-sm text-muted">This task is not available.</p>
        <Link href={`/${params.tenantSlug}/workspace`} className="mt-4 inline-block text-sm font-semibold text-lime">
          Back to the board
        </Link>
      </div>
    );
  }

  if (!activity || !user) {
    return <p className="px-[38px] py-16 text-sm text-muted">Loading the task...</p>;
  }

  const staff = user.role === "agency_admin" || user.role === "designer" || user.role === "copywriter";
  const canAttach = staff && activity.status === "production";
  const canDecide = user.role === "client" && user.workspace_id === activity.workspace.id && activity.status === "pending";

  /** Stores a file or a YouTube link on the task. */
  async function attach(event: FormEvent) {
    event.preventDefault();
    if (!activity) return;
    const body = new FormData();
    body.set("kind", kind);
    if (kind === "link") body.set("url", url);
    else if (file) body.set("file", file);
    else return;
    setBusy(true);
    try {
      const detail = await api<ActivityDetail>(`/activities/${activity.id}/assets`, { method: "POST", body });
      setActivity(detail);
      setFile(null);
      setUrl("");
      notifySuccess("Delivery added.");
    } catch (error) {
      notifyError(error instanceof ApiError ? error.message : "Could not add the delivery.");
    } finally {
      setBusy(false);
    }
  }

  /** Approves the task for the brand. */
  async function approve() {
    if (!activity) return;
    setBusy(true);
    try {
      const detail = await api<ActivityDetail>(`/activities/${activity.id}/approve`, { method: "POST" });
      setActivity(detail);
      notifySuccess("Activity approved.");
    } catch (error) {
      notifyError(error instanceof ApiError ? error.message : "Could not approve the task.");
    } finally {
      setBusy(false);
    }
  }

  /** Sends the task back to production with a note. */
  async function requestChanges(event: FormEvent) {
    event.preventDefault();
    if (!activity) return;
    setBusy(true);
    try {
      const detail = await api<ActivityDetail>(`/activities/${activity.id}/request-changes`, {
        method: "POST",
        body: JSON.stringify({ note }),
      });
      setActivity(detail);
      setNote("");
      setAsking(false);
      notifySuccess("Changes requested.");
    } catch (error) {
      notifyError(error instanceof ApiError ? error.message : "Could not send the note.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[860px] px-[38px] pt-10 pb-16">
      <Link href={`/${params.tenantSlug}/workspace`} className="text-[11px] font-bold tracking-wide text-muted uppercase">
        Back to the board
      </Link>
      <p className="mt-4 text-[9px] font-bold tracking-[1.4px] text-lime uppercase">{activity.workspace.name}</p>
      <h1 className="mt-2 font-display text-[30px] leading-tight font-extrabold tracking-[-1px]">{activity.title}</h1>
      <p className="mt-2 text-[13px] text-muted">
        {typeLabel(activity.channel, activity.format)} · {statusLabel(activity.status)} · {dateLabel(activity.due_on)}
        {activity.assignee ? ` · ${activity.assignee.name}` : ""}
      </p>

      <section className="mt-8 rounded-[14px] bg-card p-5">
        <h2 className="text-[11px] font-bold tracking-wide text-muted uppercase">Briefing</h2>
        <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{activity.briefing}</p>
      </section>

      <section className="mt-4 rounded-[14px] bg-card p-5">
        <h2 className="text-[11px] font-bold tracking-wide text-muted uppercase">Delivery</h2>
        {activity.assets.length === 0 ? <p className="mt-3 text-sm text-muted">Nothing attached yet.</p> : null}
        <ul className="mt-3 space-y-2">
          {activity.assets.map((asset) => {
            const href = assetUrl(asset.url);
            return (
              <li key={asset.id} className="flex items-center justify-between gap-3 rounded-[10px] bg-raised px-3 py-2">
                <span className="min-w-0">
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer" className="block truncate text-sm font-semibold hover:text-lime">
                      {asset.name}
                    </a>
                  ) : (
                    <span className="block truncate text-sm font-semibold">{asset.name}</span>
                  )}
                  <span className="text-[11px] text-muted">
                    {asset.kind} {asset.author ? `· ${asset.author}` : ""}
                  </span>
                </span>
                {asset.kind === "image" && href ? (
                  // eslint-disable-next-line @next/next/no-img-element -- file is served by the API
                  <img src={href} alt="" className="h-12 w-16 rounded-md object-cover" />
                ) : null}
              </li>
            );
          })}
        </ul>
        {canAttach ? (
          <form onSubmit={attach} className="mt-4 grid gap-3 border-t border-raised pt-4">
            <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
              Kind
              <select value={kind} onChange={(event) => setKind(event.target.value as Kind)} className="rounded-[9px] bg-raised px-3 py-2.5 text-[13px] font-normal text-foreground outline-none">
                <option value="image">Image</option>
                <option value="pdf">PDF</option>
                <option value="document">Document</option>
                <option value="link">YouTube link</option>
              </select>
            </label>
            {kind === "link" ? (
              <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
                URL
                <input required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=" className="rounded-[9px] bg-raised px-3 py-2.5 text-[13px] font-normal text-foreground outline-none" />
              </label>
            ) : (
              <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
                File
                <input
                  required
                  type="file"
                  accept={kind === "image" ? "image/*" : kind === "pdf" ? "application/pdf" : ".doc,.docx"}
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="text-[13px] font-normal"
                />
              </label>
            )}
            <button type="submit" disabled={busy} className="w-fit rounded-[9px] bg-lime px-3 py-2 text-[11px] font-bold text-lime-ink disabled:opacity-60">
              {busy ? "Saving..." : "Add delivery"}
            </button>
          </form>
        ) : null}
      </section>

      {canDecide ? (
        <section className="mt-4 rounded-[14px] bg-card p-5">
          <h2 className="text-[11px] font-bold tracking-wide text-muted uppercase">Your decision</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={approve} className="rounded-[9px] bg-lime px-3 py-2 text-[11px] font-bold text-lime-ink disabled:opacity-60">
              Approve
            </button>
            <button type="button" onClick={() => setAsking((open) => !open)} className="rounded-[9px] bg-raised px-3 py-2 text-[11px] font-bold">
              Request changes
            </button>
          </div>
          {asking ? (
            <form onSubmit={requestChanges} className="mt-3 grid gap-2">
              <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
                Note
                <textarea required value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="rounded-[9px] bg-raised px-3 py-2.5 text-[13px] font-normal text-foreground outline-none" />
              </label>
              <button type="submit" disabled={busy} className="w-fit rounded-[9px] bg-foreground px-3 py-2 text-[11px] font-bold text-background disabled:opacity-60">
                Send note
              </button>
            </form>
          ) : null}
        </section>
      ) : null}

      <section className="mt-4 rounded-[14px] bg-card p-5">
        <h2 className="text-[11px] font-bold tracking-wide text-muted uppercase">History</h2>
        <ol className="mt-3 space-y-3">
          {activity.events.map((event) => (
            <li key={event.id} className="border-l-2 border-lime/40 pl-3">
              <p className="text-sm">{eventSentence(event)}</p>
              <p className="text-[11px] text-muted">
                {event.actor ?? "Someone"} · {eventWhen(event.created_at)}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
