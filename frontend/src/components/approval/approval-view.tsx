"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, Send, Share2, Upload } from "lucide-react";
import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { DocumentFrame } from "@/components/document-frame";
import { showVisualPlaceholders } from "@/lib/placeholders";
import { notifyError, notifySuccess } from "@/lib/alerts";
import { ApiError, api } from "@/lib/api-client";
import {
  assetUrl,
  avatarColor,
  coverGradient,
  dateLabel,
  deliveryMode,
  deliveryNotice,
  eventWhen,
  initials,
  statusLabel,
  typeLabel,
  youtubeEmbed,
  type ActivityComment,
  type ActivityDetail,
  type ActivityVersion,
} from "@/lib/activities";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import type { AuthUser } from "@/lib/session";

/** Shows one piece with its versions, pins, comments, and the client's decision. */
export function ApprovalView() {
  const params = useParams<{ tenantSlug: string; activityId: string }>();
  const { locale, t } = useI18n();
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [versionId, setVersionId] = useState<number | null>(null);
  const [tab, setTab] = useState<"comments" | "details">("comments");
  const [previewTab, setPreviewTab] = useState<"creative" | "copy">("creative");
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ActivityComment | null>(null);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number; fileId: number | null } | null>(null);
  const [slide, setSlide] = useState(0);
  const [internal, setInternal] = useState(false);
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [cover, setCover] = useState<File | null>(null);
  const [headline, setHeadline] = useState("");
  const [caption, setCaption] = useState("");
  const [trackedVersion, setTrackedVersion] = useState<number | null>(null);
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
      .catch((error: unknown) => notifyError(error instanceof ApiError ? error.message : t("piece.sessionFailed")));
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
        notifyError(error instanceof ApiError ? error.message : t("piece.loadFailed"));
      });
    return () => {
      active = false;
    };
  }, [params.activityId, t]);

  if (missing) {
    return (
      <div className="mx-auto max-w-[860px] px-[38px] py-16">
        <p className="text-sm text-muted">{t("piece.missing")}</p>
        <Link href={user?.role === "client" ? `/${params.tenantSlug}/dashboard` : `/${params.tenantSlug}/approval`} className="mt-4 inline-block text-sm font-semibold text-lime">
          {user?.role === "client" ? t("piece.yours") : t("piece.back")}
        </Link>
      </div>
    );
  }

  if (!activity || !user) {
    return <p className="px-[38px] py-16 text-sm text-muted">{t("piece.loading")}</p>;
  }

  const versions = activity.versions;
  const selected = versions.find((item) => item.id === versionId) ?? versions[0] ?? null;
  const selectedIndex = selected ? versions.findIndex((item) => item.id === selected.id) : 0;
  const staff = user.role === "agency_admin" || user.role === "designer" || user.role === "copywriter";
  const canUpload = staff && (activity.status === "production" || activity.format === "video");
  const canDecide = user.role === "client" && user.workspace_id === activity.workspace.id;
  const mode = deliveryMode(activity.format);
  const coverFile = selected?.files.find((file) => file.role === "cover") ?? null;
  const slideFile = selected?.files.filter((file) => file.role !== "cover")[slide] ?? selected?.files.find((file) => file.role !== "cover") ?? null;
  const selectedId = selected?.id ?? null;
  if (selectedId !== trackedVersion) {
    setTrackedVersion(selectedId);
    setHeadline(selected?.headline ?? "");
    setCaption(selected?.caption ?? "");
  }
  const preview = assetUrl((previewTab === "copy" ? selected?.url : coverFile?.url ?? slideFile?.url ?? selected?.url) ?? null);
  const scope = previewTab === "copy" ? "copy" : "asset";
  const thread = activity.comments.filter((comment) => (comment.version_id === null || comment.version_id === selected?.id) && comment.scope === scope);
  const canPin = previewTab === "creative" && (selected?.kind === "image" || Boolean(coverFile));

  /** Moves the preview to the previous or next version. */
  function shift(direction: number) {
    if (versions.length === 0) return;
    const next = (selectedIndex + direction + versions.length) % versions.length;
    setVersionId(versions[next].id);
    setSlide(0);
    setPendingPin(null);
  }

  /** Records a pin position from a click on the image. */
  function placePin(event: MouseEvent<HTMLDivElement>) {
    if (!canPin) return;
    if ((event.target as HTMLElement).closest("[data-pin]")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 10000) / 100;
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 10000) / 100;
    setPendingPin({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)), fileId: coverFile?.id ?? slideFile?.id ?? null });
    setReplyTo(null);
    setTab("comments");
  }

  /** Opens the creative or the copy, each with its own comments. */
  function openPreview(next: "creative" | "copy") {
    setPreviewTab(next);
    setPendingPin(null);
    setReplyTo(null);
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
            body: JSON.stringify({ x: pendingPin.x, y: pendingPin.y, file_id: pendingPin.fileId, body, is_internal: internal }),
          })
        : await api<ActivityDetail>(`/activities/${activity.id}/comments`, {
            method: "POST",
            body: JSON.stringify({
              body,
              parent_id: replyTo?.id ?? null,
              version_id: selected?.id ?? null,
              scope,
              is_internal: internal,
            }),
          });
      setActivity(detail);
      setDraft("");
      setReplyTo(null);
      setPendingPin(null);
      setInternal(false);
      notifySuccess(pendingPin ? t("piece.pinAdded") : t("piece.commentAdded"));
    } catch (error) {
      notifyError(error instanceof ApiError ? error.message : t("piece.commentFailed"));
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
      notifyError(error instanceof ApiError ? error.message : t("piece.commentUpdateFailed"));
    }
  }

  /** Stores the next version of this piece. */
  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!activity) return;
    const body = new FormData();
    body.set("headline", headline);
    if (mode !== "blog") body.set("caption", caption);
    if (mode === "link") body.set("url", url);
    else if (files.length > 0) files.forEach((item) => body.append("files[]", item));
    else return;
    if (mode === "blog") {
      if (!cover) return;
      body.set("cover", cover);
    }
    setBusy(true);
    try {
      const detail = await api<ActivityDetail>(`/activities/${activity.id}/assets`, { method: "POST", body });
      setActivity(detail);
      setVersionId(detail.versions.find((item) => item.is_current)?.id ?? null);
      setFiles([]);
      setCover(null);
      setUrl("");
      notifySuccess(t("piece.uploaded"));
    } catch (error) {
      notifyError(error instanceof ApiError ? error.message : t("piece.uploadFailed"));
    } finally {
      setBusy(false);
    }
  }

  /** Updates the published title and caption of the current version. */
  async function saveCopy(event: FormEvent) {
    event.preventDefault();
    if (!activity || !selected?.is_current) return;
    setBusy(true);
    try {
      const detail = await api<ActivityDetail>(`/activities/${activity.id}/versions/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify(mode === "blog" ? { headline } : { headline, caption }),
      });
      setActivity(detail);
      notifySuccess(t("task.copySaved"));
    } catch (error) {
      notifyError(error instanceof ApiError ? error.message : t("task.copyFailed"));
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
      notifySuccess(t("piece.approved"));
    } catch (error) {
      notifyError(error instanceof ApiError ? error.message : t("piece.approveFailed"));
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
      notifySuccess(t("piece.revisionsSent"));
    } catch (error) {
      notifyError(error instanceof ApiError ? error.message : t("piece.revisionsFailed"));
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
        {user.role === "client" ? t("piece.yours") : t("piece.all")}
      </Link>
      <header className="mt-4 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-3 flex items-center gap-1.5 text-[9px] font-bold tracking-[1.4px] text-muted uppercase">
            <span className="size-1.5 rounded-full bg-purple shadow-[0_0_0_4px_rgba(155,53,170,0.12)]" />
            Client review · {activity.workspace.name}
          </p>
          <h1 className="mb-2 font-display text-[30px] leading-[1.18] font-extrabold tracking-[-1.3px]">{activity.title}</h1>
          <p className="text-[13px] text-muted">{activity.briefing}</p>
          {activity.briefing_file ? (
            <a href={assetUrl(activity.briefing_file.url) ?? undefined} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[13px] font-semibold text-lime">
              {activity.briefing_file.name}
            </a>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-lg px-3 py-2 text-[10px] font-bold ${activity.status === "approved" ? "bg-lime-dark text-good" : "bg-orange-soft text-[#ebb77a]"}`}>
            {statusLabel(activity.status)}
          </span>
          {showVisualPlaceholders ? (
            <button type="button" onClick={() => { setShared(true); window.setTimeout(() => setShared(false), 2000); }} className="inline-flex items-center gap-2 rounded-[9px] bg-raised px-3.5 py-2.5 text-[11px] font-bold">
              <Share2 className="size-4" />
              {shared ? "Link copied" : "Share"}
            </button>
          ) : null}
        </div>
      </header>

      <div className="mt-8 grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-[14px] bg-card">
          <div className="flex items-center justify-between gap-3 bg-raised px-[17px] py-[15px]">
            <div>
              <p className="text-sm font-semibold">{selected ? selected.name : t("piece.noFile")}</p>
              <p className="text-xs text-muted">{selected ? t("piece.versionLine", { number: selected.number, author: selected.author ?? t("date.someone"), when: eventWhen(selected.created_at, locale) }) : mode === "link" ? t("piece.paste") : t("piece.uploadStart")}</p>
            </div>
            <button type="button" aria-label={t("piece.download")} onClick={download} disabled={!preview} className="grid size-8 place-items-center rounded-lg hover:bg-soft disabled:opacity-40">
              <Download className="size-4" />
            </button>
          </div>
          <div className="bg-raised p-5">
            <div className="mb-3 flex gap-2">
              <button type="button" onClick={() => openPreview("creative")} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${previewTab === "creative" ? "bg-lime text-lime-ink" : "text-muted"}`}>
                {t("piece.creative")}
              </button>
              <button type="button" onClick={() => openPreview("copy")} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${previewTab === "copy" ? "bg-lime text-lime-ink" : "text-muted"}`}>
                {t("piece.copy")}
              </button>
            </div>
            {previewTab === "copy" ? (
              <CopyPane
                format={activity.format}
                version={selected}
                activityId={activity.id}
                headline={headline}
                caption={caption}
                canEdit={canUpload && Boolean(selected?.is_current)}
                busy={busy}
                onHeadline={setHeadline}
                onCaption={setCaption}
                onSave={saveCopy}
              />
            ) : (
              <Preview activityId={activity.id} version={selected} preview={assetUrl(coverFile?.url ?? slideFile?.url ?? selected?.url ?? null)} embed={youtubeEmbed(selected?.kind === "link" ? preview : null)} slide={slide} pendingPin={pendingPin} gradient={coverGradient(activity)} onPlace={placePin} onShift={shift} onSlide={(index) => { setSlide(index); setPendingPin(null); }} />
            )}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">{t("piece.version")}</span>
                {versions.map((item) => (
                  <button key={item.id} type="button" onClick={() => { setVersionId(item.id); setSlide(0); setPendingPin(null); }} className={`rounded-[5px] px-2 py-1.5 text-[10px] ${item.id === selected?.id ? "bg-lime-dark font-semibold text-lime" : "text-muted"}`}>
                    v{item.number}
                    {item.is_current ? <span className="ml-1 opacity-80">{t("piece.current")}</span> : null}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted">{previewTab === "copy" ? t("piece.copyComments") : canPin ? t("piece.clickPin") : t("piece.noPins")}{selected ? ` · ${t("piece.viewing", { number: selected.number })}` : ""}</p>
            </div>
            {canUpload ? (
              <form onSubmit={upload} className="mt-4 grid gap-3 border-t border-line pt-4">
                <p className="text-xs text-muted">{deliveryNotice(activity.format, t)}</p>
                {previewTab === "creative" ? (
                  <>
                    <input required value={headline} onChange={(event) => setHeadline(event.target.value)} maxLength={160} placeholder={t("task.title")} aria-label={t("task.title")} className="rounded-[9px] bg-card px-3 py-2 text-[13px] outline-none" />
                    {mode === "blog" ? null : (
                      <textarea required value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={5000} rows={3} placeholder={t("task.caption")} aria-label={t("task.caption")} className="rounded-[9px] bg-card px-3 py-2 text-[13px] outline-none" />
                    )}
                  </>
                ) : null}
                <div className="flex flex-wrap items-center gap-3">
                  {mode === "link" ? (
                    <input key="link" required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=" aria-label="YouTube URL" className="min-w-[240px] flex-1 rounded-[9px] bg-card px-3 py-2 text-[13px] outline-none" />
                  ) : (
                    <FileButton mode={mode} files={files} onPick={(picked) => setFiles(picked)} />
                  )}
                  {mode === "blog" ? <CoverButton file={cover} onPick={setCover} /> : null}
                  <button type="submit" disabled={busy} className="rounded-[9px] bg-lime px-3 py-2 text-[11px] font-bold text-lime-ink disabled:opacity-60">
                    {busy ? t("common.saving") : t("piece.uploadVersion")}
                  </button>
                </div>
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
                <h2 className="font-semibold">{t("piece.thread")}</h2>
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
                        <p className="text-sm font-semibold">{comment.author ?? t("date.someone")}</p>
                        <p className="text-xs text-muted">
                          {roleName(comment.role, t)} · {eventWhen(comment.created_at, locale)}
                          {comment.is_internal ? ` · ${t("piece.internal")}` : ""}
                        </p>
                      </div>
                      {comment.pin ? <span className="grid size-5 place-items-center rounded-full bg-lime text-[11px] font-semibold text-lime-ink">{comment.pin}</span> : null}
                    </div>
                    <p className={`mt-2 text-sm ${comment.parent_id ? "pl-10" : ""}`}>{comment.body}</p>
                    <div className="mt-2 flex gap-3 text-xs text-muted">
                      <button type="button" onClick={() => { setReplyTo(comment); setPendingPin(null); }} className="hover:text-foreground">{t("piece.reply")}</button>
                      <button type="button" onClick={() => toggleResolved(comment)} className="hover:text-foreground">{comment.resolved_at ? t("piece.reopen") : t("piece.resolve")}</button>
                    </div>
                  </li>
                ))}
              </ul>
              <form className="border-t border-line p-3" onSubmit={submitComment}>
                {replyTo ? (
                  <p className="mb-2 flex items-center justify-between text-xs text-muted">
                    Replying to {replyTo.author}
                    <button type="button" onClick={() => setReplyTo(null)}>{t("common.cancel")}</button>
                  </p>
                ) : null}
                {pendingPin ? (
                  <p className="mb-2 flex items-center justify-between text-xs text-muted">
                    Pin at {pendingPin.x.toFixed(0)}%, {pendingPin.y.toFixed(0)}%
                    <button type="button" onClick={() => setPendingPin(null)}>{t("common.cancel")}</button>
                  </p>
                ) : null}
                <div className="flex items-center gap-2">
                  <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={pendingPin ? t("piece.pinComment") : t("piece.addComment")} className="min-w-0 flex-1 rounded-xl border border-line bg-raised px-3 py-2 text-sm outline-none" />
                  <button type="submit" aria-label={t("piece.send")} disabled={busy} className="grid size-9 place-items-center rounded-xl bg-lime text-lime-ink disabled:opacity-60">
                    <Send className="size-4" />
                  </button>
                </div>
                {staff ? (
                  <label className="mt-2 flex items-center gap-2 text-xs text-muted">
                    <input type="checkbox" checked={internal} onChange={(event) => setInternal(event.target.checked)} />
                    {t("piece.internalNote")}
                  </label>
                ) : null}
              </form>
            </>
          ) : (
            <div className="space-y-4 p-4">
              <Detail label={t("piece.client")} value={activity.workspace.name} />
              <Detail label={t("piece.format")} value={typeLabel(activity.channel, activity.format, t)} />
              <Detail label={t("piece.due")} value={dateLabel(activity.due_on, locale, t)} />
              <Detail label={t("piece.assignee")} value={activity.assignee?.name ?? t("common.unassigned")} />
              <Detail label={t("piece.status")} value={statusLabel(activity.status, t)} />
            </div>
          )}
        </aside>
      </div>

      {canDecide ? (
        <footer className="mt-3.5 rounded-[13px] bg-card px-[17px] py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{t("piece.ready")}</p>
              <p className="text-sm text-muted">{t("piece.readyLine")}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setAsking((open) => !open)} className="rounded-xl border border-line bg-card px-4 py-2 text-sm font-medium">
                {t("piece.revisions")}
              </button>
              <button type="button" disabled={busy} onClick={approve} className="rounded-xl bg-lime px-4 py-2 text-sm font-semibold text-lime-ink disabled:opacity-60">
                {t("piece.approve")}
              </button>
            </div>
          </div>
          {asking ? (
            <form onSubmit={requestChanges} className="mt-3 grid gap-2">
              <textarea required value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder={t("piece.whatChange")} className="rounded-[9px] bg-raised px-3 py-2 text-sm outline-none" />
              <button type="submit" disabled={busy} className="w-fit rounded-[9px] bg-foreground px-3 py-2 text-[11px] font-bold text-background disabled:opacity-60">
                {t("task.sendNote")}
              </button>
            </form>
          ) : null}
        </footer>
      ) : null}
    </div>
  );
}

/** Opens the file picker as a button in a lighter accent. */
function FileButton({ mode, files, onPick }: { mode: string; files: File[]; onPick: (files: File[]) => void }) {
  const { t } = useI18n();
  const idle = mode === "blog" ? t("piece.uploadPdf") : mode === "slides" ? t("piece.uploadImages") : t("piece.uploadImage");
  const label = files.length === 0 ? idle : files.length === 1 ? files[0].name : t("piece.files", { count: files.length });

  return (
    <label
      className="inline-flex w-fit max-w-full cursor-pointer items-center gap-2 rounded-[9px] px-3.5 py-2.5 text-[11px] font-bold text-lime-ink"
      style={{ background: "color-mix(in srgb, var(--lime) 34%, white)" }}
    >
      <Upload className="size-3.5 shrink-0" />
      <span className="truncate">{label}</span>
      <input
        key={mode}
        required
        type="file"
        multiple={mode === "slides"}
        accept={mode === "blog" ? ".pdf,.doc,.docx" : "image/*"}
        aria-label={idle}
        onChange={(event) => onPick(Array.from(event.target.files ?? []))}
        className="sr-only"
      />
    </label>
  );
}

/** Picks the blog cover with the same lighter accent as the article upload. */
function CoverButton({ file, onPick }: { file: File | null; onPick: (file: File | null) => void }) {
  const { t } = useI18n();
  return (
    <label
      className="inline-flex w-fit max-w-full cursor-pointer items-center gap-2 rounded-[9px] px-3.5 py-2.5 text-[11px] font-bold text-lime-ink"
      style={{ background: "color-mix(in srgb, var(--lime) 34%, white)" }}
    >
      <Upload className="size-3.5 shrink-0" />
      <span className="truncate">{file ? file.name : t("piece.uploadCover")}</span>
      <input required type="file" accept="image/*" aria-label={t("piece.uploadCover")} onChange={(event) => onPick(event.target.files?.[0] ?? null)} className="sr-only" />
    </label>
  );
}

/** Shows the published title and caption, and the article when the piece is a blog. */
function CopyPane({
  format,
  version,
  activityId,
  headline,
  caption,
  canEdit,
  busy,
  onHeadline,
  onCaption,
  onSave,
}: {
  format: string;
  version: ActivityVersion | null;
  activityId: number;
  headline: string;
  caption: string;
  canEdit: boolean;
  busy: boolean;
  onHeadline: (value: string) => void;
  onCaption: (value: string) => void;
  onSave: (event: FormEvent) => void;
}) {
  const { t } = useI18n();
  return (
    <form onSubmit={onSave} className="mx-auto grid max-w-[690px] gap-3">
      {canEdit ? (
        <>
          <label className="grid gap-1 text-[11px] font-bold text-muted">
            Title
            <input required value={headline} onChange={(event) => onHeadline(event.target.value)} maxLength={160} className="rounded-[9px] bg-card px-3 py-2 text-[13px] font-normal text-foreground outline-none" />
          </label>
          {format === "blog" ? null : (
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              Caption
              <textarea required value={caption} onChange={(event) => onCaption(event.target.value)} maxLength={5000} rows={6} className="rounded-[9px] bg-card px-3 py-2 text-[13px] font-normal text-foreground outline-none" />
            </label>
          )}
          <button type="submit" disabled={busy} className="w-fit rounded-[9px] bg-lime px-3 py-2 text-[11px] font-bold text-lime-ink disabled:opacity-60">
            {busy ? t("common.saving") : t("task.saveCopy")}
          </button>
        </>
      ) : (
        <>
          <h2 className="text-lg font-semibold">{version?.headline || t("piece.noTitle")}</h2>
          {format === "blog" ? null : <p className="text-sm leading-relaxed whitespace-pre-wrap">{version?.caption || t("piece.noCaption")}</p>}
        </>
      )}
      {format === "blog" && version?.kind === "document" ? (
        <DocumentFrame activityId={activityId} versionId={version.id} name={version.name} url={version.url} title={version.name} />
      ) : null}
    </form>
  );
}

/** Renders the open version and the pins that belong to it. */
function Preview({
  activityId,
  version,
  preview,
  embed,
  slide,
  pendingPin,
  gradient,
  onPlace,
  onShift,
  onSlide,
}: {
  activityId: number;
  version: ActivityVersion | null;
  preview: string | null;
  embed: string | null;
  slide: number;
  pendingPin: { x: number; y: number; fileId: number | null } | null;
  gradient?: { backgroundImage: string };
  onPlace: (event: MouseEvent<HTMLDivElement>) => void;
  onShift: (direction: number) => void;
  onSlide: (index: number) => void;
}) {
  const { t } = useI18n();
  const cover = version?.files.find((file) => file.role === "cover") ?? null;
  if (cover) {
    const src = assetUrl(cover.url);
    const pins = (version?.annotations ?? []).filter((pin) => pin.file_id == null || pin.file_id === cover.id);
    return (
      <div className="relative mx-auto aspect-[1.57] max-w-[690px] overflow-hidden rounded-[7px] bg-soft" style={src ? undefined : gradient} onClick={onPlace}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- file is served by the API
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted">{t("task.nothing")}</div>
        )}
        {pins.map((pin) => (
          <button key={pin.id} type="button" data-pin aria-label={`Pin ${pin.number}`} className="absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-lime text-[10px] font-extrabold text-lime-ink shadow-[0_0_0_5px_rgba(187,255,82,0.2)]" style={{ left: `${pin.x}%`, top: `${pin.y}%` }}>
            {pin.number}
          </button>
        ))}
        {pendingPin ? <span data-pin className="absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-lime" style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }} /> : null}
      </div>
    );
  }

  if (version?.kind === "document") {
    return (
      <DocumentFrame
        activityId={activityId}
        versionId={version.id}
        name={version.name}
        url={version.url}
        title={version.name}
        gradient={gradient}
      />
    );
  }

  const slides = version?.files.filter((file) => file.role !== "cover") ?? [];
  const current = slides[slide] ?? slides[0] ?? null;
  const pins = (version?.annotations ?? []).filter((pin) => (pin.file_id == null ? slide === 0 : pin.file_id === current?.id));
  return (
    <div className="relative mx-auto aspect-[1.57] max-w-[690px] overflow-hidden rounded-[7px] bg-soft" style={embed || (version?.kind === "image" && preview) ? undefined : gradient} onClick={onPlace}>
      {embed ? (
        <iframe src={embed} title={version?.name ?? "Video"} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      ) : version?.kind === "image" && preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- file is served by the API
        <img src={preview} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center px-6 text-center text-sm text-muted">
          {preview ? <a href={preview} target="_blank" rel="noreferrer" className="font-semibold text-lime" onClick={(event) => event.stopPropagation()}>{version?.name}</a> : t("task.nothing")}
        </div>
      )}
      {pins.map((pin) => (
        <button key={pin.id} type="button" data-pin aria-label={`Pin ${pin.number}`} className="absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-lime text-[10px] font-extrabold text-lime-ink shadow-[0_0_0_5px_rgba(187,255,82,0.2)]" style={{ left: `${pin.x}%`, top: `${pin.y}%` }}>
          {pin.number}
        </button>
      ))}
      {pendingPin ? <span data-pin className="absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-lime" style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }} /> : null}
      {slides.length > 1 ? (
        <span className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {slides.map((file, index) => (
            <button key={file.id} type="button" aria-label={`Slide ${index + 1}`} onClick={(event) => { event.stopPropagation(); onSlide(index); }} className={`size-2 rounded-full ${index === slide ? "bg-white" : "bg-white/45"}`} />
          ))}
        </span>
      ) : null}
      <button type="button" aria-label={t("piece.previous")} onClick={(event) => { event.stopPropagation(); onShift(-1); }} className="absolute top-1/2 left-3 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white">
        <ChevronLeft className="size-4" />
      </button>
      <button type="button" aria-label={t("piece.next")} onClick={(event) => { event.stopPropagation(); onShift(1); }} className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white">
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

/** Renders one labeled fact on the details tab. */
const roleKeys: Record<string, MessageKey> = {
  agency_admin: "role.agency_admin",
  designer: "role.designer",
  copywriter: "role.copywriter",
  client: "role.client",
};

/** Returns the role name in the active language. */
function roleName(role: string | null | undefined, t: (key: MessageKey) => string) {
  const key = role ? roleKeys[role] : undefined;
  return key ? t(key) : (role ?? "");
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
