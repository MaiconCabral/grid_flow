"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, Send, Share2 } from "lucide-react";
import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { notifyError, notifySuccess } from "@/lib/alerts";
import { ApiError, api } from "@/lib/api-client";
import {
  assetUrl,
  avatarColor,
  dateLabel,
  eventWhen,
  initials,
  roleLabels,
  statusLabel,
  typeLabel,
  type ActivityComment,
  type ActivityDetail,
  type ActivityVersion,
} from "@/lib/activities";
import type { AuthUser } from "@/lib/session";

type Kind = "image" | "pdf" | "document" | "link";

/** Shows one piece with its versions, pins, comments, and the client's decision. */
export function ApprovalView() {
  const params = useParams<{ tenantSlug: string; activityId: string }>();
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [versionId, setVersionId] = useState<number | null>(null);
  const [tab, setTab] = useState<"comments" | "details">("comments");
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ActivityComment | null>(null);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);
  const [internal, setInternal] = useState(false);
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState(false);
  const [kind, setKind] = useState<Kind>("image");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [shared, setShared] = useState(false);
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
        if (!active) return;
        setActivity(detail);
        setVersionId(detail.versions.find((item) => item.is_current)?.id ?? detail.versions[0]?.id ?? null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
          setMissing(true);
          return;
        }
        notifyError(error instanceof ApiError ? error.message : "Could not load the piece.");
      });
    return () => {
      active = false;
    };
  }, [params.activityId]);

  if (missing) {
    return (
      <div className="mx-auto max-w-[860px] px-[38px] py-16">
        <p className="text-sm text-muted">This piece is not available.</p>
        <Link href={user?.role === "client" ? `/${params.tenantSlug}/dashboard` : `/${params.tenantSlug}/approval`} className="mt-4 inline-block text-sm font-semibold text-lime">
          {user?.role === "client" ? "Your pieces" : "Back to the list"}
        </Link>
      </div>
    );
  }

  if (!activity || !user) {
    return <p className="px-[38px] py-16 text-sm text-muted">Loading the piece...</p>;
  }

  const versions = activity.versions;
  const selected = versions.find((item) => item.id === versionId) ?? versions[0] ?? null;
  const selectedIndex = selected ? versions.findIndex((item) => item.id === selected.id) : 0;
  const staff = user.role === "agency_admin" || user.role === "designer" || user.role === "copywriter";
  const canUpload = staff && activity.status === "production";
  const canDecide = user.role === "client" && user.workspace_id === activity.workspace.id;
  const preview = assetUrl(selected?.url ?? null);
  const thread = activity.comments.filter((comment) => comment.version_id === null || comment.version_id === selected?.id);

  /** Moves the preview to the previous or next version. */
  function shift(direction: number) {
    if (versions.length === 0) return;
    const next = (selectedIndex + direction + versions.length) % versions.length;
    setVersionId(versions[next].id);
    setPendingPin(null);
  }

  /** Records a pin position from a click on the image. */
  function placePin(event: MouseEvent<HTMLDivElement>) {
    if (!selected || selected.kind !== "image") return;
    if ((event.target as HTMLElement).closest("[data-pin]")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 10000) / 100;
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 10000) / 100;
    setPendingPin({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
    setReplyTo(null);
    setTab("comments");
  }

  /** Sends a comment, or a pin with its first comment. */
  async function submitComment(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !activity) return;
    setBusy(true);
    try {
      const detail = pendingPin && selected
        ? await api<ActivityDetail>(`/activities/${activity.id}/versions/${selected.id}/annotations`, {
            method: "POST",
            body: JSON.stringify({ x: pendingPin.x, y: pendingPin.y, body, is_internal: internal }),
          })
        : await api<ActivityDetail>(`/activities/${activity.id}/comments`, {
            method: "POST",
            body: JSON.stringify({
              body,
              parent_id: replyTo?.id ?? null,
              version_id: selected?.id ?? null,
              is_internal: internal,
            }),
          });
      setActivity(detail);
      setDraft("");
      setReplyTo(null);
      setPendingPin(null);
      setInternal(false);
      notifySuccess(pendingPin ? "Pin added." : "Comment added.");
    } catch (error) {
      notifyError(error instanceof ApiError ? error.message : "Could not save the comment.");
    } finally {
      setBusy(false);
    }
  }

  /** Toggles a comment between resolved and open. */
  async function toggleResolved(comment: ActivityComment) {
    if (!activity) return;
    try {
      const detail = await api<ActivityDetail>(`/activities/${activity.id}/comments/${comment.id}`, {
        method: "PATCH",
        body: JSON.stringify({ resolved: comment.resolved_at === null }),
      });
      setActivity(detail);
    } catch (error) {
      notifyError(error instanceof ApiError ? error.message : "Could not update the comment.");
    }
  }

  /** Stores the next version of this piece. */
  async function upload(event: FormEvent) {
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
      setVersionId(detail.versions.find((item) => item.is_current)?.id ?? null);
      setFile(null);
      setUrl("");
      notifySuccess("Version uploaded.");
    } catch (error) {
      notifyError(error instanceof ApiError ? error.message : "Could not upload the version.");
    } finally {
      setBusy(false);
    }
  }

  /** Approves the piece for the brand. */
  async function approve() {
    if (!activity) return;
    setBusy(true);
    try {
      const detail = await api<ActivityDetail>(`/activities/${activity.id}/approve`, { method: "POST" });
      setActivity(detail);
      notifySuccess("Piece approved.");
    } catch (error) {
      notifyError(error instanceof ApiError ? error.message : "Could not approve the piece.");
    } finally {
      setBusy(false);
    }
  }

  /** Sends the piece back to production with the client's note. */
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
      notifySuccess("Revisions requested.");
    } catch (error) {
      notifyError(error instanceof ApiError ? error.message : "Could not request revisions.");
    } finally {
      setBusy(false);
    }
  }

  /** Opens the file of the version on screen. */
  function download() {
    if (preview) window.open(preview, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto max-w-[1640px] px-[38px] pt-10 pb-12">
      <Link href={user.role === "client" ? `/${params.tenantSlug}/dashboard` : `/${params.tenantSlug}/approval`} className="text-[11px] font-bold tracking-wide text-muted uppercase">
        {user.role === "client" ? "Your pieces" : "All pieces"}
      </Link>
      <header className="mt-4 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-3 flex items-center gap-1.5 text-[9px] font-bold tracking-[1.4px] text-muted uppercase">
            <span className="size-1.5 rounded-full bg-purple shadow-[0_0_0_4px_rgba(155,53,170,0.12)]" />
            Client review · {activity.workspace.name}
          </p>
          <h1 className="mb-2 font-display text-[30px] leading-[1.18] font-extrabold tracking-[-1.3px]">{activity.title}</h1>
          <p className="text-[13px] text-muted">{activity.briefing}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-lg px-3 py-2 text-[10px] font-bold ${activity.status === "approved" ? "bg-lime-dark text-good" : "bg-orange-soft text-[#ebb77a]"}`}>
            {statusLabel(activity.status)}
          </span>
          <button type="button" onClick={() => { setShared(true); window.setTimeout(() => setShared(false), 2000); }} className="inline-flex items-center gap-2 rounded-[9px] bg-raised px-3.5 py-2.5 text-[11px] font-bold">
            <Share2 className="size-4" />
            {shared ? "Link copied" : "Share"}
          </button>
        </div>
      </header>

      <div className="mt-8 grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-[14px] bg-card">
          <div className="flex items-center justify-between gap-3 bg-raised px-[17px] py-[15px]">
            <div>
              <p className="text-sm font-semibold">{selected ? selected.name : "No file yet"}</p>
              <p className="text-xs text-muted">{selected ? `Version ${selected.number} · ${selected.author ?? "Someone"} · ${eventWhen(selected.created_at)}` : "Upload a version to start the review."}</p>
            </div>
            <button type="button" aria-label="Download file" onClick={download} disabled={!preview} className="grid size-8 place-items-center rounded-lg hover:bg-soft disabled:opacity-40">
              <Download className="size-4" />
            </button>
          </div>
          <div className="bg-raised p-5">
            <Preview version={selected} preview={preview} pendingPin={pendingPin} onPlace={placePin} onShift={shift} />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Version</span>
                {versions.map((item) => (
                  <button key={item.id} type="button" onClick={() => { setVersionId(item.id); setPendingPin(null); }} className={`rounded-[5px] px-2 py-1.5 text-[10px] ${item.id === selected?.id ? "bg-lime-dark font-semibold text-lime" : "text-muted"}`}>
                    v{item.number}
                    {item.is_current ? <span className="ml-1 opacity-80">Current</span> : null}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted">{selected?.kind === "image" ? "Click anywhere to add a pin" : "This file has no pins"}{selected ? ` · viewing v${selected.number}` : ""}</p>
            </div>
            {canUpload ? (
              <form onSubmit={upload} className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[160px_minmax(0,1fr)_auto]">
                <select value={kind} onChange={(event) => setKind(event.target.value as Kind)} aria-label="Kind" className="rounded-[9px] bg-card px-3 py-2 text-[13px] outline-none">
                  <option value="image">Image</option>
                  <option value="pdf">PDF</option>
                  <option value="document">Document</option>
                  <option value="link">YouTube link</option>
                </select>
                {kind === "link" ? (
                  <input key="link" required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=" className="rounded-[9px] bg-card px-3 py-2 text-[13px] outline-none" />
                ) : (
                  <input key={kind} required type="file" accept={kind === "image" ? "image/*" : kind === "pdf" ? "application/pdf" : ".doc,.docx"} onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="text-[13px]" />
                )}
                <button type="submit" disabled={busy} className="rounded-[9px] bg-lime px-3 py-2 text-[11px] font-bold text-lime-ink disabled:opacity-60">
                  {busy ? "Saving..." : "Upload version"}
                </button>
              </form>
            ) : null}
          </div>
        </section>

        <aside className="flex min-h-[500px] flex-col overflow-hidden rounded-[14px] bg-card">
          <div className="grid grid-cols-2 bg-raised p-[5px]">
            <button type="button" onClick={() => setTab("comments")} className={`rounded-[7px] px-3 py-2.5 text-[11px] ${tab === "comments" ? "bg-card font-medium" : "text-muted"}`}>
              Comments {thread.length}
            </button>
            <button type="button" onClick={() => setTab("details")} className={`rounded-[7px] px-3 py-2.5 text-[11px] ${tab === "details" ? "bg-card font-medium" : "text-muted"}`}>
              Details
            </button>
          </div>
          {tab === "comments" ? (
            <>
              <div className="px-4 pt-4">
                <h2 className="font-semibold">Feedback thread</h2>
                <p className="text-xs text-muted">{thread.length} comments{selected ? ` · v${selected.number}` : ""}</p>
              </div>
              <ul className="flex-1 space-y-4 overflow-auto px-4 py-4">
                {thread.map((comment) => (
                  <li key={comment.id} className={comment.resolved_at ? "opacity-50" : undefined}>
                    <div className="flex items-start gap-2">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-lime-ink" style={{ background: avatarColor(comment.author ?? "?") }}>
                        {initials(comment.author ?? "?")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{comment.author ?? "Someone"}</p>
                        <p className="text-xs text-muted">
                          {roleLabels[comment.role ?? ""] ?? comment.role} · {eventWhen(comment.created_at)}
                          {comment.is_internal ? " · Internal" : ""}
                        </p>
                      </div>
                      {comment.pin ? <span className="grid size-5 place-items-center rounded-full bg-lime text-[11px] font-semibold text-lime-ink">{comment.pin}</span> : null}
                    </div>
                    <p className={`mt-2 text-sm ${comment.parent_id ? "pl-10" : ""}`}>{comment.body}</p>
                    <div className="mt-2 flex gap-3 text-xs text-muted">
                      <button type="button" onClick={() => { setReplyTo(comment); setPendingPin(null); }} className="hover:text-foreground">Reply</button>
                      <button type="button" onClick={() => toggleResolved(comment)} className="hover:text-foreground">{comment.resolved_at ? "Reopen" : "Resolve"}</button>
                    </div>
                  </li>
                ))}
              </ul>
              <form className="border-t border-line p-3" onSubmit={submitComment}>
                {replyTo ? (
                  <p className="mb-2 flex items-center justify-between text-xs text-muted">
                    Replying to {replyTo.author}
                    <button type="button" onClick={() => setReplyTo(null)}>Cancel</button>
                  </p>
                ) : null}
                {pendingPin ? (
                  <p className="mb-2 flex items-center justify-between text-xs text-muted">
                    Pin at {pendingPin.x.toFixed(0)}%, {pendingPin.y.toFixed(0)}%
                    <button type="button" onClick={() => setPendingPin(null)}>Cancel</button>
                  </p>
                ) : null}
                <div className="flex items-center gap-2">
                  <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={pendingPin ? "Comment on this pin..." : "Add a comment..."} className="min-w-0 flex-1 rounded-xl border border-line bg-raised px-3 py-2 text-sm outline-none" />
                  <button type="submit" aria-label="Send comment" disabled={busy} className="grid size-9 place-items-center rounded-xl bg-lime text-lime-ink disabled:opacity-60">
                    <Send className="size-4" />
                  </button>
                </div>
                {staff ? (
                  <label className="mt-2 flex items-center gap-2 text-xs text-muted">
                    <input type="checkbox" checked={internal} onChange={(event) => setInternal(event.target.checked)} />
                    Internal note
                  </label>
                ) : null}
              </form>
            </>
          ) : (
            <div className="space-y-4 p-4">
              <Detail label="Client" value={activity.workspace.name} />
              <Detail label="Format" value={typeLabel(activity.channel, activity.format)} />
              <Detail label="Due date" value={dateLabel(activity.due_on)} />
              <Detail label="Assignee" value={activity.assignee?.name ?? "Unassigned"} />
              <Detail label="Status" value={statusLabel(activity.status)} />
            </div>
          )}
        </aside>
      </div>

      {canDecide ? (
        <footer className="mt-3.5 rounded-[13px] bg-card px-[17px] py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Ready to make a decision?</p>
              <p className="text-sm text-muted">Your feedback helps the team move faster.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setAsking((open) => !open)} className="rounded-xl border border-line bg-card px-4 py-2 text-sm font-medium">
                Request revisions
              </button>
              <button type="button" disabled={busy} onClick={approve} className="rounded-xl bg-lime px-4 py-2 text-sm font-semibold text-lime-ink disabled:opacity-60">
                Approve piece
              </button>
            </div>
          </div>
          {asking ? (
            <form onSubmit={requestChanges} className="mt-3 grid gap-2">
              <textarea required value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="What should change?" className="rounded-[9px] bg-raised px-3 py-2 text-sm outline-none" />
              <button type="submit" disabled={busy} className="w-fit rounded-[9px] bg-foreground px-3 py-2 text-[11px] font-bold text-background disabled:opacity-60">
                Send note
              </button>
            </form>
          ) : null}
        </footer>
      ) : null}
    </div>
  );
}

/** Renders the open version and the pins that belong to it. */
function Preview({
  version,
  preview,
  pendingPin,
  onPlace,
  onShift,
}: {
  version: ActivityVersion | null;
  preview: string | null;
  pendingPin: { x: number; y: number } | null;
  onPlace: (event: MouseEvent<HTMLDivElement>) => void;
  onShift: (direction: number) => void;
}) {
  return (
    <div className="relative mx-auto aspect-[1.57] max-w-[690px] overflow-hidden rounded-[7px] bg-soft" onClick={onPlace}>
      {version?.kind === "image" && preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- file is served by the API
        <img src={preview} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center px-6 text-center text-sm text-muted">
          {preview ? <a href={preview} target="_blank" rel="noreferrer" className="font-semibold text-lime" onClick={(event) => event.stopPropagation()}>{version?.name}</a> : "Nothing attached yet."}
        </div>
      )}
      {version?.annotations.map((pin) => (
        <button key={pin.id} type="button" data-pin aria-label={`Pin ${pin.number}`} className="absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-lime text-[10px] font-extrabold text-lime-ink shadow-[0_0_0_5px_rgba(187,255,82,0.2)]" style={{ left: `${pin.x}%`, top: `${pin.y}%` }}>
          {pin.number}
        </button>
      ))}
      {pendingPin ? <span data-pin className="absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-lime" style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }} /> : null}
      <button type="button" aria-label="Previous version" onClick={(event) => { event.stopPropagation(); onShift(-1); }} className="absolute top-1/2 left-3 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white">
        <ChevronLeft className="size-4" />
      </button>
      <button type="button" aria-label="Next version" onClick={(event) => { event.stopPropagation(); onShift(1); }} className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white">
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

/** Renders one labeled fact on the details tab. */
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
