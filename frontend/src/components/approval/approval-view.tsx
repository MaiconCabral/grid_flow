"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Download, MoreHorizontal, Send, Share2 } from "lucide-react";
import { useState } from "react";
import { currentUser, piece, pieceComments, slides, type PieceComment } from "@/data/mock";

type Decision = "awaiting" | "revisions" | "approved";

const statusCopy: Record<Decision, string> = {
  awaiting: "Awaiting your review",
  revisions: "Revisions requested",
  approved: "Piece approved",
};

export function ApprovalView() {
  const [tab, setTab] = useState<"comments" | "details">("comments");
  const [version, setVersion] = useState(piece.currentVersion);
  const [slide, setSlide] = useState(0);
  const [comments, setComments] = useState<PieceComment[]>(pieceComments);
  const [resolved, setResolved] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision>("awaiting");
  const [shared, setShared] = useState(false);

  const current = slides[slide];

  function shift(direction: number) {
    setSlide((index) => (index + direction + slides.length) % slides.length);
  }

  function addComment() {
    const body = draft.trim();
    if (!body) return;
    setComments((currentComments) => [
      ...currentComments,
      {
        id: `local-${currentComments.length + 1}`,
        initials: currentUser.initials,
        author: currentUser.name,
        role: currentUser.role,
        time: "Just now",
        body: replyTo ? `Reply to ${replyTo}: ${body}` : body,
        color: "#c6f135",
      },
    ]);
    setDraft("");
    setReplyTo(null);
    setTab("comments");
  }

  function share() {
    setShared(true);
    window.setTimeout(() => setShared(false), 2000);
  }

  return (
    <div className="mx-auto max-w-[1640px] px-[38px] pt-10 pb-12">
      <div>
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-[9px] font-bold tracking-[1.4px] text-muted uppercase">
              <span className="size-1.5 rounded-full bg-purple shadow-[0_0_0_4px_rgba(155,53,170,0.12)]" />
              {piece.eyebrow}
            </p>
            <h1 className="mb-2 font-display text-[30px] leading-[1.18] font-extrabold tracking-[-1.3px]">{piece.title}</h1>
            <p className="text-[13px] text-muted">{piece.summary}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-lg px-3 py-2 text-[10px] font-bold ${
                decision === "approved" ? "bg-lime-dark text-good" : "bg-orange-soft text-[#ebb77a]"
              }`}
            >
              {statusCopy[decision]}
            </span>
            <button type="button" onClick={share} className="inline-flex items-center gap-2 rounded-[9px] bg-raised px-3.5 py-2.5 text-[11px] font-bold">
              <Share2 className="size-4" />
              {shared ? "Link copied" : "Share"}
            </button>
          </div>
        </header>

        <div className="mt-8 grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="overflow-hidden rounded-[14px] bg-card">
            <div className="flex items-center justify-between gap-3 bg-raised px-[17px] py-[15px]">
              <div>
                <p className="text-sm font-semibold">{piece.file}</p>
                <p className="text-xs text-muted">{piece.uploaded}</p>
              </div>
              <div className="flex gap-1">
                <button type="button" aria-label="Download file" className="grid size-8 place-items-center rounded-lg hover:bg-raised">
                  <Download className="size-4" />
                </button>
                <button type="button" aria-label="More file actions" className="grid size-8 place-items-center rounded-lg hover:bg-raised">
                  <MoreHorizontal className="size-4" />
                </button>
              </div>
            </div>

            <div className="relative bg-raised p-5">
            <div className="relative mx-auto aspect-[1.57] max-w-[690px] overflow-hidden rounded-[7px]">
              <Image
                src={current.src}
                alt={current.alt}
                width={1200}
                height={760}
                priority
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                aria-label="Pin 1"
                className="absolute top-[38%] left-[42%] grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-lime text-[10px] font-extrabold text-lime-ink shadow-[0_0_0_5px_rgba(187,255,82,0.2)]"
              >
                1
              </button>
              <button
                type="button"
                aria-label="Pin 2"
                className="absolute top-[58%] left-[62%] grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-lime text-[10px] font-extrabold text-lime-ink shadow-[0_0_0_5px_rgba(187,255,82,0.2)]"
              >
                2
              </button>
              <button
                type="button"
                aria-label="Previous slide"
                onClick={() => shift(-1)}
                className="absolute top-1/2 left-3 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={() => shift(1)}
                className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white"
              >
                <ChevronRight className="size-4" />
              </button>
              <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
                {String(slide + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Version</span>
                {piece.versions.map((item) => {
                  const active = item === version;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setVersion(item)}
                      className={`rounded-[5px] px-2 py-1.5 text-[10px] ${active ? "bg-lime-dark font-semibold text-lime" : "text-muted"}`}
                    >
                      {item}
                      {item === piece.currentVersion ? <span className="ml-1 opacity-80">Current</span> : null}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted">
                Click anywhere to add a pin · viewing {version}
              </p>
            </div>
            </div>
          </section>

          <aside className="flex min-h-[500px] flex-col overflow-hidden rounded-[14px] bg-card">
            <div className="grid grid-cols-2 bg-raised p-[5px]">
              <button
                type="button"
                onClick={() => setTab("comments")}
                className={`rounded-[7px] px-3 py-2.5 text-[11px] ${tab === "comments" ? "bg-card font-medium" : "text-muted"}`}
              >
                Comments {comments.length}
              </button>
              <button
                type="button"
                onClick={() => setTab("details")}
                className={`rounded-[7px] px-3 py-2.5 text-[11px] ${tab === "details" ? "bg-card font-medium" : "text-muted"}`}
              >
                Details
              </button>
            </div>

            {tab === "comments" ? (
              <>
                <div className="px-4 pt-4">
                  <h2 className="font-semibold">Feedback thread</h2>
                  <p className="text-xs text-muted">
                    {comments.length} comments · {version}
                  </p>
                </div>
                <ul className="flex-1 space-y-4 overflow-auto px-4 py-4">
                  {comments.map((comment) => (
                    <li key={comment.id} className={resolved[comment.id] ? "opacity-50" : undefined}>
                      <div className="flex items-start gap-2">
                        <span
                          className="grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-lime-ink"
                          style={{ background: comment.color }}
                        >
                          {comment.initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{comment.author}</p>
                          <p className="text-xs text-muted">
                            {comment.role} · {comment.time}
                          </p>
                        </div>
                        {comment.pin ? (
                          <span className="grid size-5 place-items-center rounded-full bg-lime text-[11px] font-semibold text-lime-ink">
                            {comment.pin}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm">{comment.body}</p>
                      <div className="mt-2 flex gap-3 text-xs text-muted">
                        <button type="button" onClick={() => setReplyTo(comment.author)} className="hover:text-foreground">
                          Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => setResolved((current) => ({ ...current, [comment.id]: !current[comment.id] }))}
                          className="hover:text-foreground"
                        >
                          {resolved[comment.id] ? "Reopen" : "Resolve"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <form
                  className="border-t border-line p-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    addComment();
                  }}
                >
                  {replyTo ? (
                    <p className="mb-2 flex items-center justify-between text-xs text-muted">
                      Replying to {replyTo}
                      <button type="button" onClick={() => setReplyTo(null)}>
                        Cancel
                      </button>
                    </p>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <input
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Add a comment..."
                      className="min-w-0 flex-1 rounded-xl border border-line bg-raised px-3 py-2 text-sm outline-none"
                    />
                    <button type="submit" aria-label="Send comment" className="grid size-9 place-items-center rounded-xl bg-lime text-lime-ink">
                      <Send className="size-4" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="space-y-4 p-4">
                {piece.details.map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-muted">{item.label}</p>
                    <p className="text-sm font-semibold">{item.value}</p>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 pt-2">
                  {piece.tags.map((tag) => (
                    <span key={tag} className="rounded-[5px] bg-purple-soft px-2 py-1.5 text-[9px] text-purple">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      <footer className="mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-[13px] bg-card px-[17px] py-3.5">
        <div>
          <p className="font-semibold">Ready to make a decision?</p>
          <p className="text-sm text-muted">Your feedback helps the team move faster.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDecision("revisions")}
            className="rounded-xl border border-line bg-card px-4 py-2 text-sm font-medium"
          >
            Request revisions
          </button>
          <button
            type="button"
            onClick={() => setDecision("approved")}
            className="rounded-xl bg-lime px-4 py-2 text-sm font-semibold text-lime-ink"
          >
            Approve piece
          </button>
        </div>
      </footer>
    </div>
  );
}
