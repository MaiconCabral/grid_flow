import { translate, type MessageKey } from "@/lib/i18n/messages";

type Copy = (key: MessageKey, vars?: Record<string, string | number>) => string;

export type AppNotification = {
  id: number;
  type: "asset_added" | "queued" | "pending_review" | "approved" | "revision_requested";
  activity_id: number;
  title: string;
  body: string;
  actor_name: string | null;
  href: string;
  read_at: string | null;
  created_at: string;
};

export type NotificationFeed = {
  data: AppNotification[];
  unread: number;
};

/** Inserts one notice at the top when it is not already listed. */
export function applyNotification(current: AppNotification[], incoming: AppNotification) {
  if (current.some((item) => item.id === incoming.id)) return current;
  return [incoming, ...current];
}

/** Builds the bell sentence from the notice type in the active language. */
export function notificationText(item: Pick<AppNotification, "type" | "title" | "actor_name" | "body">, t: Copy) {
  const name = item.actor_name ?? "";
  const title = item.title;
  if (item.type === "asset_added") return t("notice.asset", { name, title });
  if (item.type === "queued") return t("notice.queued", { title });
  if (item.type === "pending_review") return t("notice.pending", { title });
  if (item.type === "approved") return t("notice.approved", { name, title });
  if (item.type === "revision_requested") return t("notice.revision", { name, title });
  return item.body;
}

/** Formats a notice timestamp as a short age in the active language. */
export function notificationAge(iso: string, t: Copy = (key, vars) => translate("en", key, vars)) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return t("notice.justNow");
  if (minutes < 60) return t("notice.minutes", { count: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t("notice.hours", { count: hours });
  return t("notice.days", { count: Math.round(hours / 24) });
}
