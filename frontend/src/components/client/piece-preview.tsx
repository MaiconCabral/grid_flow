"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import { DocumentFrame } from "@/components/document-frame";
import { useTheme } from "@/components/theme-provider";
import { notifyError, notifySuccess } from "@/lib/alerts";
import { ApiError, api } from "@/lib/api-client";
import {
  assetUrl,
  avatarColor,
  channelLabel,
  coverGradient,
  initials,
  statusBadgeClass,
  statusLabel,
  youtubeEmbed,
  type BoardActivity,
} from "@/lib/activities";

type Frame = "story" | "player" | "feed";

/** Shows one piece as a social post, with approve and a path to corrections. */
export function PiecePreview({
  pieces,
  index,
  slug,
  onClose,
  onIndex,
  onApproved,
}: {
  pieces: BoardActivity[];
  index: number;
  slug: string;
  onClose: () => void;
  onIndex: (index: number) => void;
  onApproved: (id: number) => void;
}) {
  const { theme } = useTheme();
  const activity = pieces[index];
  const [busy, setBusy] = useState(false);
  const [slide, setSlide] = useState(0);
  const [slideFor, setSlideFor] = useState<number | null>(activity?.id ?? null);
  if ((activity?.id ?? null) !== slideFor) {
    setSlideFor(activity?.id ?? null);
    setSlide(0);
  }
  const total = pieces.length;
  const pending = activity?.status === "pending";

  useEffect(() => {
    /** Closes on Escape and moves between pieces with the arrow keys. */
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && index > 0) onIndex(index - 1);
      if (event.key === "ArrowRight" && index < total - 1) onIndex(index + 1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, onClose, onIndex, total]);

  if (!activity) return null;

  /** Approves the open piece when it is waiting on the client. */
  async function approve() {
    if (!activity || activity.status !== "pending" || busy) return;
    setBusy(true);
    try {
      await api(`/activities/${activity.id}/approve`, { method: "POST" });
      onApproved(activity.id);
      notifySuccess("Piece approved.");
    } catch (error) {
      notifyError(error instanceof ApiError ? error.message : "Could not approve the piece.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto ${theme === "light" ? "bg-[#181b19]/55" : "bg-black/70"}`}
      onMouseDown={onClose}
    >
      <div className="flex min-h-full items-center justify-center px-4 py-10">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="piece-preview-title"
          onMouseDown={(event) => event.stopPropagation()}
          className="relative w-full max-w-[760px]"
        >
          <button
            type="button"
            aria-label="Close preview"
            onClick={onClose}
            className="absolute -top-2 right-0 grid size-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="size-4" />
          </button>
          <div className="mb-4 flex items-center justify-center gap-3 pr-10">
            <p className="text-sm font-semibold text-white">
              {index + 1} / {total}
            </p>
            <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${statusBadgeClass(activity.status)}`}>
              {statusLabel(activity.status)}
            </span>
          </div>
          <h2 id="piece-preview-title" className="sr-only">
            {activity.title}
          </h2>
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <Arrow label="Previous piece" disabled={index === 0} onClick={() => onIndex(index - 1)} direction="left" />
            <div className="flex justify-center">
              <SocialFrame activity={activity} slide={slide} onSlide={setSlide} />
            </div>
            <Arrow label="Next piece" disabled={index >= total - 1} onClick={() => onIndex(index + 1)} direction="right" />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={!pending || busy}
              title={pending ? undefined : "Only a piece pending approval can be approved."}
              onClick={() => void approve()}
              className="rounded-xl bg-lime px-5 py-2.5 text-sm font-bold text-lime-ink disabled:cursor-not-allowed disabled:opacity-45"
            >
              {busy ? "Approving..." : "Approve"}
            </button>
            <Link
              href={`/${slug}/approval/${activity.id}`}
              className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20"
            >
              Add corrections
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Steps to the previous or next piece. */
function Arrow({
  label,
  disabled,
  onClick,
  direction,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  direction: "left" | "right";
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
    >
      <Icon className="size-5" />
    </button>
  );
}

/** Frames the cover the way that network will show it. */
function SocialFrame({ activity, slide, onSlide }: { activity: BoardActivity; slide: number; onSlide: (index: number) => void }) {
  const slides = activity.slides.length > 0 ? activity.slides : activity.cover_url ? [activity.cover_url] : [];
  const src = assetUrl(slides[slide] ?? slides[0] ?? null);
  const caption = activity.caption?.trim() ?? "";
  const publishedTitle = activity.headline?.trim() || activity.title;
  const kind = frameKind(activity.channel, activity.format);
  const gradient = coverGradient(activity);
  const embed = activity.format === "video" ? youtubeEmbed(assetUrl(activity.video_url)) : null;

  if (activity.format === "blog") {
    return (
      <div className="w-full max-w-[640px]">
        <div className="overflow-hidden rounded-xl shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <Cover src={src} title={publishedTitle} gradient={gradient} className="aspect-[16/9] w-full" />
        </div>
        <p className="mt-3 text-center text-sm font-semibold text-white">{publishedTitle}</p>
        <DocumentFrame
          activityId={activity.id}
          name={activity.document?.name ?? null}
          url={activity.document?.url ?? null}
          title={publishedTitle}
          gradient={gradient}
          className="mt-3 shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
        />
      </div>
    );
  }

  if (activity.format === "video") {
    return (
      <div className="w-full max-w-[640px] overflow-hidden rounded-xl bg-black shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
        <div className="relative aspect-video">
          {embed ? (
            <iframe src={embed} title={activity.title} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          ) : (
            <Cover src={null} title={activity.title} gradient={gradient} className="h-full w-full" />
          )}
        </div>
      </div>
    );
  }

  if (kind === "story") {
    return (
      <div className="relative aspect-[9/16] w-[280px] overflow-hidden rounded-[28px] bg-black shadow-[0_24px_70px_rgba(0,0,0,0.35)] ring-1 ring-white/15">
        <Cover src={src} title={activity.title} gradient={gradient} className="h-full w-full" />
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-4 pt-4 pb-10">
          <p className="text-[12px] font-semibold text-white">{activity.workspace.name}</p>
        </div>
        <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pt-10 pb-4 text-[12px] leading-snug text-white">
          {publishedTitle}
          {caption ? ` ${caption}` : ""}
        </p>
      </div>
    );
  }

  if (kind === "player") {
    return (
      <div className="w-full max-w-[640px] overflow-hidden rounded-xl bg-black shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
        <div className="relative aspect-video">
          <Cover src={src} title={activity.title} gradient={gradient} className="h-full w-full" />
          <span className="absolute top-1/2 left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black">
            <Play className="size-6" fill="currentColor" />
          </span>
        </div>
        <p className="px-4 py-3 text-[13px] leading-snug whitespace-pre-wrap text-white">
          <span className="font-semibold">{publishedTitle}</span>
          {caption ? `\n${caption}` : ""}
        </p>
      </div>
    );
  }

  return (
    <article className="w-full max-w-[380px] overflow-hidden rounded-[16px] bg-white text-[#141414] shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
      <header className="flex items-center gap-2.5 px-3 py-3">
        <span
          className="grid size-8 place-items-center rounded-full text-[10px] font-bold text-white"
          style={{ background: avatarColor(activity.workspace.name) }}
        >
          {initials(activity.workspace.name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold">{activity.workspace.name}</span>
          <span className="block text-[11px] text-[#737373]">{channelLabel(activity.channel)}</span>
        </span>
      </header>
      <div className="relative aspect-square bg-[#efefef]">
        <Cover src={src} title={activity.title} gradient={gradient} className="h-full w-full" />
        {slides.length > 1 ? <Dots count={slides.length} active={slide} onPick={onSlide} /> : null}
      </div>
      <p className="max-h-32 overflow-y-auto px-3 py-3 text-[13px] leading-snug whitespace-pre-wrap">
        <span className="font-semibold">{publishedTitle}</span>
        {caption ? `\n${caption}` : ""}
      </p>
    </article>
  );
}

/** Chooses a vertical story, a video player, or a feed post. */
function frameKind(channel: string, format: string): Frame {
  if (format === "story" || channel === "tiktok") return "story";
  if (channel === "youtube") return "player";
  return "feed";
}

/** Shows the cover, or the title when the piece has no image. */
function Cover({ src, title, gradient, className }: { src: string | null; title: string; gradient?: { backgroundImage: string }; className: string }) {
  if (!src) {
    return (
      <span className={`grid place-items-center px-6 text-center text-sm font-semibold text-white ${className}`} style={gradient ?? { background: "#1c1c1c" }}>
        {title}
      </span>
    );
  }
  return <img src={src} alt="" className={`object-cover ${className}`} />; // eslint-disable-line @next/next/no-img-element -- file is served by the API
}

/** Switches the open slide of a carousel. */
function Dots({ count, active, onPick }: { count: number; active: number; onPick: (index: number) => void }) {
  return (
    <span className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
      {Array.from({ length: count }, (_, index) => (
        <button key={index} type="button" aria-label={`Slide ${index + 1}`} onClick={() => onPick(index)} className={`size-1.5 rounded-full ${index === active ? "bg-white" : "bg-white/45"}`} />
      ))}
    </span>
  );
}
