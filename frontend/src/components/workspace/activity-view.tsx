"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { DocumentFrame } from "@/components/document-frame";
import { notifyError, notifySuccess } from "@/lib/alerts";
import { ApiError, api } from "@/lib/api-client";
import {
  assetUrl,
  dateLabel,
  deliveryMode,
  deliveryNotice,
  eventSentence,
  eventWhen,
  statusLabel,
  typeLabel,
  youtubeEmbed,
  type ActivityDetail,
} from "@/lib/activities";
import { useI18n } from "@/lib/i18n";
import type { AuthUser } from "@/lib/session";

/** Shows one task, its files, and the history of what happened. */
export function ActivityView() {
  const params = useParams<{ tenantSlug: string; activityId: string }>();
  const { locale, t } = useI18n();
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [cover, setCover] = useState<File | null>(null);
  const [briefingUpload, setBriefingUpload] = useState<File | null>(null);
  const [headline, setHeadline] = useState("");
  const [caption, setCaption] = useState("");
  const [trackedVersion, setTrackedVersion] = useState<number | null>(null);
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
      .catch((error: unknown) => notifyError(error instanceof ApiError ? error.message : t("task.sessionFailed")));
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
        notifyError(error instanceof ApiError ? error.message : t("task.loadFailed"));
      });
    return () => {
      active = false;
    };
  }, [params.activityId, t]);

  if (missing) {
    return (
      <div className="mx-auto max-w-[860px] px-[38px] py-16">
        <p className="text-sm text-muted">{t("task.missing")}</p>
        <Link href={`/${params.tenantSlug}/workspace`} className="mt-4 inline-block text-sm font-semibold text-lime">
          {t("task.back")}
        </Link>
      </div>
    );
  }

  if (!activity || !user) {
    return <p className="px-[38px] py-16 text-sm text-muted">{t("task.loading")}</p>;
  }

  const staff = user.role === "agency_admin" || user.role === "designer" || user.role === "copywriter";
  const canAttach = staff && activity.status === "production";
  const canDecide = user.role === "client" && user.workspace_id === activity.workspace.id && activity.status === "pending";
  const mode = deliveryMode(activity.format);
  const current = activity.versions.find((item) => item.is_current) ?? activity.versions.at(-1) ?? null;
  const currentId = current?.id ?? null;
  if (currentId !== trackedVersion) {
    setTrackedVersion(currentId);
    setHeadline(current?.headline ?? "");
    setCaption(current?.caption ?? "");
  }
  const video = current?.kind === "link" ? youtubeEmbed(assetUrl(current.url)) : null;
  const coverImage = assetUrl(current?.files.find((file) => file.role === "cover")?.url ?? null);

  /** Stores the delivery the format accepts. */
  async function attach(event: FormEvent) {
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
      setFiles([]);
      setCover(null);
      setUrl("");
      notifySuccess(t("task.deliveryAdded"));
    } catch (error) {
      notifyError(error instanceof ApiError ? error.message : t("task.deliveryFailed"));
    } finally {
      setBusy(false);
    }
  }

  /** Updates the published title and caption without a new file. */
  async function saveCopy() {
    if (!activity || !current) return;
    setBusy(true);
    try {
      const detail = await api<ActivityDetail>(`/activities/${activity.id}/versions/${current.id}`, {
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

  /** Stores or replaces the optional briefing document. */
  async function saveBriefing(event: FormEvent) {
    event.preventDefault();
    if (!activity || !briefingUpload) return;
    const body = new FormData();
    body.set("file", briefingUpload);
    setBusy(true);
    try {
      const detail = await api<ActivityDetail>(`/activities/${activity.id}/briefing`, { method: "POST", body });
      setActivity(detail);
      setBriefingUpload(null);
      notifySuccess(t("task.briefingSaved"));
    } catch (error) {
      notifyError(error instanceof ApiError ? error.message : t("task.briefingFailed"));
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
      notifySuccess(t("task.approved"));
    } catch (error) {
      notifyError(error instanceof ApiError ? error.message : t("task.approveFailed"));
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
      notifySuccess(t("task.changes"));
    } catch (error) {
      notifyError(error instanceof ApiError ? error.message : t("task.changesFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[860px] px-[38px] pt-10 pb-16">
      <Link href={`/${params.tenantSlug}/workspace`} className="text-[11px] font-bold tracking-wide text-muted uppercase">
        {t("task.back")}
      </Link>
      <p className="mt-4 text-[9px] font-bold tracking-[1.4px] text-lime uppercase">{activity.workspace.name}</p>
      <h1 className="mt-2 font-display text-[30px] leading-tight font-extrabold tracking-[-1px]">{activity.title}</h1>
      <p className="mt-2 text-[13px] text-muted">
        {typeLabel(activity.channel, activity.format, t)} · {statusLabel(activity.status, t)} · {dateLabel(activity.due_on, locale, t)}
        {activity.assignee ? ` · ${activity.assignee.name}` : ""}
      </p>

      <section className="mt-8 rounded-[14px] bg-card p-5">
        <h2 className="text-[11px] font-bold tracking-wide text-muted uppercase">{t("task.briefing")}</h2>
        <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{activity.briefing}</p>
        {activity.briefing_file ? (
          <a href={assetUrl(activity.briefing_file.url) ?? undefined} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-lime">
            {activity.briefing_file.name}
          </a>
        ) : null}
        {staff ? (
          <form onSubmit={saveBriefing} className="mt-4 flex flex-wrap items-center gap-3 border-t border-raised pt-4">
            <input type="file" accept=".pdf,.doc,.docx,application/pdf" onChange={(event) => setBriefingUpload(event.target.files?.[0] ?? null)} className="text-[13px]" />
            <button type="submit" disabled={busy || !briefingUpload} className="rounded-[9px] bg-raised px-3 py-2 text-[11px] font-bold disabled:opacity-60">
              {activity.briefing_file ? t("task.replaceBriefing") : t("task.addBriefing")}
            </button>
          </form>
        ) : null}
      </section>

      <section className="mt-4 rounded-[14px] bg-card p-5">
        <h2 className="text-[11px] font-bold tracking-wide text-muted uppercase">{t("task.delivery")}</h2>
        {current?.headline ? <p className="mt-3 text-sm font-semibold">{current.headline}</p> : null}
        {current?.caption ? <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-muted">{current.caption}</p> : null}
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- file is served by the API
          <img src={coverImage} alt="" className="mt-3 h-[150px] w-full rounded-[10px] object-cover" />
        ) : null}
        {video ? (
          <iframe src={video} title={current?.name ?? "Video"} className="mt-3 aspect-video w-full rounded-[10px]" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : null}
        {current?.kind === "document" ? (
          <DocumentFrame activityId={activity.id} versionId={current.id} name={current.name} url={current.url} title={current.name} className="mt-3" />
        ) : null}
        {activity.assets.length === 0 ? <p className="mt-3 text-sm text-muted">{t("task.nothing")}</p> : null}
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
                {asset.files.some((item) => item.role === "cover") || (asset.kind === "image" && asset.files.length > 0) ? (
                  <span className="flex shrink-0 gap-1">
                    {asset.files.filter((item) => asset.kind === "image" || item.role === "cover").map((item) => {
                      const thumb = assetUrl(item.url);
                      return thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element -- file is served by the API
                        <img key={item.id} src={thumb} alt="" className="h-12 w-12 rounded-md object-cover" />
                      ) : null;
                    })}
                  </span>
                ) : asset.kind === "image" && href ? (
                  // eslint-disable-next-line @next/next/no-img-element -- file is served by the API
                  <img src={href} alt="" className="h-12 w-16 rounded-md object-cover" />
                ) : null}
              </li>
            );
          })}
        </ul>
        {canAttach ? (
          <form onSubmit={attach} className="mt-4 grid gap-3 border-t border-raised pt-4">
            <p className="text-[12px] leading-relaxed text-muted">{deliveryNotice(activity.format, t)}</p>
            <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
              {t("task.title")}
              <input required value={headline} onChange={(event) => setHeadline(event.target.value)} maxLength={160} className="rounded-[9px] bg-raised px-3 py-2.5 text-[13px] font-normal text-foreground outline-none" />
            </label>
            {mode === "blog" ? null : (
              <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
                {t("task.caption")}
                <textarea required value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={5000} rows={4} className="rounded-[9px] bg-raised px-3 py-2.5 text-[13px] font-normal text-foreground outline-none" />
              </label>
            )}
            {mode === "link" ? (
              <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
                YouTube URL
                <input required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=" className="rounded-[9px] bg-raised px-3 py-2.5 text-[13px] font-normal text-foreground outline-none" />
              </label>
            ) : (
              <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
                {mode === "blog" ? t("task.document") : mode === "slides" ? t("task.images") : t("task.image")}
                <input
                  required
                  type="file"
                  multiple={mode === "slides"}
                  accept={mode === "blog" ? ".pdf,.doc,.docx" : "image/*"}
                  onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
                  className="text-[13px] font-normal"
                />
              </label>
            )}
            {mode === "blog" ? (
              <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
                {t("task.cover")}
                <input required type="file" accept="image/*" onChange={(event) => setCover(event.target.files?.[0] ?? null)} className="text-[13px] font-normal" />
              </label>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={busy} className="w-fit rounded-[9px] bg-lime px-3 py-2 text-[11px] font-bold text-lime-ink disabled:opacity-60">
                {busy ? t("common.saving") : t("task.addDelivery")}
              </button>
              {current ? (
                <button type="button" disabled={busy} onClick={saveCopy} className="w-fit rounded-[9px] bg-raised px-3 py-2 text-[11px] font-bold disabled:opacity-60">
                  {t("task.saveCopy")}
                </button>
              ) : null}
            </div>
          </form>
        ) : null}
      </section>

      {canDecide ? (
        <section className="mt-4 rounded-[14px] bg-card p-5">
          <h2 className="text-[11px] font-bold tracking-wide text-muted uppercase">{t("task.decision")}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={approve} className="rounded-[9px] bg-lime px-3 py-2 text-[11px] font-bold text-lime-ink disabled:opacity-60">
              {t("client.approve")}
            </button>
            <button type="button" onClick={() => setAsking((open) => !open)} className="rounded-[9px] bg-raised px-3 py-2 text-[11px] font-bold">
              {t("task.request")}
            </button>
          </div>
          {asking ? (
            <form onSubmit={requestChanges} className="mt-3 grid gap-2">
              <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
                {t("task.note")}
                <textarea required value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="rounded-[9px] bg-raised px-3 py-2.5 text-[13px] font-normal text-foreground outline-none" />
              </label>
              <button type="submit" disabled={busy} className="w-fit rounded-[9px] bg-foreground px-3 py-2 text-[11px] font-bold text-background disabled:opacity-60">
                {t("task.sendNote")}
              </button>
            </form>
          ) : null}
        </section>
      ) : null}

      <section className="mt-4 rounded-[14px] bg-card p-5">
        <h2 className="text-[11px] font-bold tracking-wide text-muted uppercase">{t("task.history")}</h2>
        <ol className="mt-3 space-y-3">
          {activity.events.map((event) => (
            <li key={event.id} className="border-l-2 border-lime/40 pl-3">
              <p className="text-sm">{eventSentence(event, t)}</p>
              <p className="text-[11px] text-muted">
                {event.actor ?? t("date.someone")} · {eventWhen(event.created_at, locale)}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
