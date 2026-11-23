export type StageId = "todo" | "production" | "pending" | "approved" | "scheduled";

export type BoardActivity = {
  id: number;
  title: string;
  briefing: string;
  channel: string;
  format: string;
  status: StageId;
  due_on: string | null;
  workspace: { id: number; name: string };
  assignee: { id: number; name: string } | null;
  assets_count: number;
  events_count: number;
  cover_url: string | null;
};

export type ActivityAsset = {
  id: number;
  kind: string;
  name: string;
  url: string | null;
  author: string | null;
  created_at: string | null;
};

export type ActivityPin = {
  id: number;
  number: number;
  x: number;
  y: number;
  author: string | null;
};

export type ActivityVersion = ActivityAsset & {
  number: number;
  is_current: boolean;
  annotations: ActivityPin[];
};

export type ActivityComment = {
  id: number;
  body: string;
  parent_id: number | null;
  version_id: number | null;
  annotation_id: number | null;
  pin: number | null;
  is_internal: boolean;
  resolved_at: string | null;
  author: string | null;
  role: string | null;
  created_at: string | null;
};

export type ActivityEvent = {
  id: number;
  type: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  actor: string | null;
  created_at: string | null;
};

export type ActivityDetail = BoardActivity & {
  assets: ActivityAsset[];
  versions: ActivityVersion[];
  comments: ActivityComment[];
  events: ActivityEvent[];
};

export const roleLabels: Record<string, string> = {
  agency_admin: "Agency Admin",
  designer: "Designer",
  copywriter: "Copywriter",
  client: "Client",
};

export type ActivityBoard = {
  data: BoardActivity[];
  brands: { id: number; name: string }[];
  metrics: { production: number; pending: number; approved: number; scheduled: number };
};

export const stages: { id: StageId; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "production", label: "In Production" },
  { id: "pending", label: "Pending Approval" },
  { id: "approved", label: "Approved" },
  { id: "scheduled", label: "Scheduled" },
];

export const channels = [
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
];

export const formats = [
  { value: "post", label: "Post" },
  { value: "carousel", label: "Carousel" },
  { value: "story", label: "Story" },
  { value: "video", label: "Video" },
  { value: "text", label: "Text" },
];

const channelTone: Record<string, string> = {
  instagram: "text-[#f5a8bf]",
  linkedin: "text-[#9ed9ef]",
  facebook: "text-[#9ed9ef]",
  youtube: "text-[#f7d37c]",
  tiktok: "text-[#d6ff8a]",
};

/** Returns the English name of a channel. */
export function channelLabel(value: string) {
  return channels.find((item) => item.value === value)?.label ?? value;
}

/** Returns the English name of a format. */
export function formatLabel(value: string) {
  return formats.find((item) => item.value === value)?.label ?? value;
}

/** Returns the English name of a column. */
export function statusLabel(value: string) {
  return stages.find((item) => item.id === value)?.label ?? value;
}

/** Builds the badge text shown on a card. */
export function typeLabel(channel: string, format: string) {
  return `${channelLabel(channel)} ${formatLabel(format)}`;
}

/** Picks the badge color for a channel. */
export function typeClass(channel: string) {
  return channelTone[channel] ?? "text-lime";
}

/** Turns a stored path into an address the browser can open. */
export function assetUrl(path: string | null) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return `${base}${path}`;
}

/** Formats a due date for the card. */
export function dateLabel(iso: string | null) {
  if (!iso) return "No date";
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Formats the moment an event was recorded. */
export function eventWhen(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/** Describes one history entry in a sentence. */
export function eventSentence(event: ActivityEvent) {
  if (event.type === "created") return "Created the task";
  if (event.type === "approved") return "Approved the task";
  if (event.type === "asset_added") return `Added ${event.note ?? "a file"}`;
  if (event.type === "revision_requested") return event.note ? `Requested changes: ${event.note}` : "Requested changes";
  if (event.type === "status_changed") {
    return `Moved from ${statusLabel(event.from_status ?? "")} to ${statusLabel(event.to_status ?? "")}`;
  }
  return "Updated the task";
}

/** Builds two initials from a person's name. */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

const avatarColors = ["#7c5cbf", "#3d9a6a", "#3d7ea6", "#c47a3a", "#b85c7a"];

/** Picks a stable avatar color for a name. */
export function avatarColor(name: string) {
  const index = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % avatarColors.length;
  return avatarColors[index];
}

/** Returns midnight on the Monday of the given week. */
export function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

/** Shifts a date by a number of days. */
export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Formats a date as YYYY-MM-DD in local time. */
export function isoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
