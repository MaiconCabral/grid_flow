"use client";

import { X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { notificationText, type AppNotification } from "@/lib/notifications";

/** Announces one new notice and offers a direct jump to the task. */
export function NotificationAlert({
  item,
  onOpen,
  onClose,
}: {
  item: AppNotification;
  onOpen: (item: AppNotification) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-alert-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="grid w-full max-w-[420px] gap-4 rounded-[14px] bg-card p-[18px] text-foreground shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
      >
        <div className="flex items-start justify-between gap-3">
          <p id="notification-alert-title" className="text-[13px] font-bold">
            {item.title}
          </p>
          <button type="button" aria-label={t("notice.close")} onClick={onClose} className="grid size-7 place-items-center rounded-md text-muted hover:bg-raised hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <p className="text-[13px] leading-relaxed text-muted">{notificationText(item, t)}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-[9px] bg-raised px-3 py-2 text-[11px] font-bold text-foreground">
            {t("notice.close")}
          </button>
          <button type="button" onClick={() => onOpen(item)} className="rounded-[9px] bg-lime px-3 py-2 text-[11px] font-bold text-lime-ink">
            {t("notice.open")}
          </button>
        </div>
      </div>
    </div>
  );
}
