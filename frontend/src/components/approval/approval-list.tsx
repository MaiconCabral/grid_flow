"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { notifyError } from "@/lib/alerts";
import { ApiError, api } from "@/lib/api-client";
import { dateLabel, statusLabel, typeLabel, type ActivityBoard, type BoardActivity } from "@/lib/activities";

/** Lists the pieces the signed-in person is allowed to review. */
export function ApprovalList() {
  const slug = usePathname().split("/")[1] ?? "";
  const [items, setItems] = useState<BoardActivity[] | null>(null);

  useEffect(() => {
    let active = true;
    api<ActivityBoard>("/activities")
      .then((board) => {
        if (active) setItems(board.data);
      })
      .catch((error: unknown) => notifyError(error instanceof ApiError ? error.message : "Could not load the pieces."));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-[980px] px-[38px] pt-10 pb-16">
      <p className="mb-3 flex items-center gap-1.5 text-[9px] font-bold tracking-[1.4px] text-muted uppercase">
        <span className="size-1.5 rounded-full bg-purple shadow-[0_0_0_4px_rgba(155,53,170,0.12)]" />
        Approval center
      </p>
      <h1 className="font-display text-[30px] leading-tight font-extrabold tracking-[-1px]">Pieces to review</h1>
      <p className="mt-2 text-[13px] text-muted">Open a task to see the latest version, leave a pin, or decide.</p>
      {items === null ? <p className="mt-8 text-sm text-muted">Loading pieces...</p> : null}
      {items?.length === 0 ? <p className="mt-8 text-sm text-muted">No pieces for you yet.</p> : null}
      <ul className="mt-8 space-y-2">
        {items?.map((activity) => (
          <li key={activity.id}>
            <Link href={`/${slug}/approval/${activity.id}`} className="flex items-center gap-4 rounded-[13px] bg-card px-4 py-3 hover:bg-raised">
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-lime">{activity.workspace.name}</span>
                <span className="block truncate text-sm font-semibold">{activity.title}</span>
              </span>
              <span className="hidden text-xs text-muted sm:block">{typeLabel(activity.channel, activity.format)}</span>
              <span className="text-xs text-muted">{statusLabel(activity.status)}</span>
              <span className="hidden text-xs text-muted md:block">{activity.assignee?.name ?? "Unassigned"}</span>
              <span className="text-xs text-muted">{dateLabel(activity.due_on)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
