export type StageId = "todo" | "production" | "pending" | "approved" | "scheduled";

export type Person = {
  initials: string;
  name: string;
  color: string;
};

export type Activity = {
  id: string;
  stage: StageId;
  format: string;
  client: string;
  title: string;
  dateLabel: string;
  date: string;
  assignees: Person[];
  comments: number;
  attachments: number;
  priority: "High";
  image: string;
};

export const agency = {
  name: "Agency Alpha",
  workspaces: 4,
  storageUsed: "68.4 GB",
  storageTotal: "100 GB",
  storagePercent: 68.4,
};

export const currentUser = {
  name: "Jordan Miller",
  role: "Agency Admin",
  initials: "JM",
};

export const clients = ["Aster & Co.", "Northstar Labs", "Kora House", "Acme Corp"];

export const people = {
  ak: { initials: "AK", name: "Alex Kim", color: "#7c5cbf" },
  sr: { initials: "SR", name: "Sarah Reyes", color: "#3d9a6a" },
  ml: { initials: "ML", name: "Mia Lee", color: "#3d7ea6" },
  jp: { initials: "JP", name: "John Park", color: "#c47a3a" },
} satisfies Record<string, Person>;

export const stages: { id: StageId; label: string; count: number }[] = [
  { id: "todo", label: "To Do", count: 4 },
  { id: "production", label: "In Production", count: 3 },
  { id: "pending", label: "Pending Approval", count: 2 },
  { id: "approved", label: "Approved", count: 8 },
  { id: "scheduled", label: "Scheduled", count: 12 },
];

export const activities: Activity[] = [
  {
    id: "linkedin-new-way",
    stage: "todo",
    format: "LinkedIn Post",
    client: "Northstar Labs",
    title: "The new way to work",
    dateLabel: "Aug 27",
    date: "2024-08-27",
    assignees: [people.ak, people.sr],
    comments: 2,
    attachments: 5,
    priority: "High",
    image: "/mock/swatches.jpg",
  },
  {
    id: "story-texture",
    stage: "todo",
    format: "Instagram Story",
    client: "Aster & Co.",
    title: "Texture study / 04",
    dateLabel: "Sep 01",
    date: "2024-09-01",
    assignees: [people.ml],
    comments: 1,
    attachments: 3,
    priority: "High",
    image: "/mock/products.jpg",
  },
  {
    id: "brand-film",
    stage: "production",
    format: "Short-form Video",
    client: "Kora House",
    title: "Brand film — cut 02",
    dateLabel: "Aug 29",
    date: "2024-08-29",
    assignees: [people.jp],
    comments: 8,
    attachments: 1,
    priority: "High",
    image: "/mock/building.jpg",
  },
  {
    id: "summer-carousel",
    stage: "pending",
    format: "Instagram Carousel",
    client: "Aster & Co.",
    title: "Summer campaign — carousel",
    dateLabel: "Today, 4:00 PM",
    date: "2024-08-22",
    assignees: [people.ml, people.jp],
    comments: 4,
    attachments: 2,
    priority: "High",
    image: "/mock/carousel.jpg",
  },
  {
    id: "studio-stills",
    stage: "approved",
    format: "Social Collection",
    client: "Kora House",
    title: "Studio stills — selects",
    dateLabel: "Sep 02",
    date: "2024-09-02",
    assignees: [people.sr, people.ak],
    comments: 3,
    attachments: 4,
    priority: "High",
    image: "/mock/portrait.jpg",
  },
];

export const workspaceMetrics = [
  { label: "Active activities", value: "24", delta: "+12%", up: true },
  { label: "Awaiting approval", value: "03", delta: "-8%", up: false },
  { label: "Due this week", value: "09", delta: "+4%", up: true },
  { label: "Client satisfaction", value: "94%", delta: "+6%", up: true },
];

export const dashboardMetrics = [
  {
    label: "Awaiting approval",
    value: "03",
    detail: "Requires client review",
    foot: "Requires client review",
  },
  {
    label: "Weekly deliverables",
    value: "12",
    detail: "8 of 12 scheduled",
    progress: 8 / 12,
  },
  {
    label: "First-pass approval rate",
    value: "84%",
    detail: "+5% this month",
    badge: "+5%",
  },
  {
    label: "Avg. time in production",
    value: "2.4d",
    detail: "On track",
    badge: "healthy",
  },
];

export const actionItems = [
  {
    title: "Revision requested by Aster & Co.",
    meta: "Instagram Carousel · Due in 6 hours",
    action: "Review now",
    href: "/approval",
    image: "/mock/carousel.jpg",
  },
  {
    title: "Piece pending approval for 48h",
    meta: "LinkedIn Post · Northstar Labs",
    action: "Assign designer",
    href: "/team",
    image: "/mock/swatches.jpg",
  },
  {
    title: "Brand film v2 awaiting review",
    meta: "Short-form Video · Kora House",
    action: "Review now",
    href: "/approval",
    image: "/mock/building.jpg",
  },
];

export const pipeline = [
  { label: "To Do", count: 4 },
  { label: "In Production", count: 7 },
  { label: "Internal Review", count: 3 },
  { label: "Client Review", count: 2 },
  { label: "Approved", count: 8 },
  { label: "Scheduled", count: 5 },
];

export const weekDays = [
  { day: "Mon", date: "19", events: [{ time: "9:00 AM", tone: "lime" }] },
  {
    day: "Tue",
    date: "20",
    events: [
      { time: "11:00 AM", tone: "violet" },
      { time: "2:00 PM", tone: "blue" },
    ],
  },
  { day: "Wed", date: "21", events: [{ time: "10:00 AM", tone: "lime" }] },
  { day: "Thu", date: "22", events: [{ time: "3:00 PM", tone: "amber" }] },
  {
    day: "Fri",
    date: "23",
    events: [
      { time: "1:00 PM", tone: "violet" },
      { time: "5:00 PM", tone: "blue" },
    ],
  },
  { day: "Sat", date: "24", events: [] },
  { day: "Sun", date: "25", events: [] },
];

export const activityFeed = [
  {
    initials: "OC",
    name: "Olivia Chen",
    role: "Client",
    text: "approved Instagram Reel v2",
    emphasis: "Acme Corp",
    time: "10m ago",
    color: "#7c5cbf",
  },
  {
    initials: "SR",
    name: "Sarah Reyes",
    role: "Designer",
    text: "uploaded new version for",
    emphasis: "LinkedIn Carousel",
    time: "1h ago",
    color: "#3d9a6a",
  },
  {
    initials: "JP",
    name: "John Park",
    role: "Copywriter",
    text: "added an internal comment on",
    emphasis: "Summer Campaign",
    time: "3h ago",
    color: "#c47a3a",
  },
  {
    initials: "ML",
    name: "Mia Lee",
    role: "Designer",
    text: "scheduled",
    emphasis: "3 posts for next week",
    time: "5h ago",
    color: "#3d7ea6",
  },
  {
    initials: "JM",
    name: "Jordan Miller",
    role: "Admin",
    text: "assigned Sarah to",
    emphasis: "Brand Film v2",
    time: "Yesterday",
    color: "#c6f135",
  },
];

export const topClients = [
  { initials: "A", name: "Aster & Co.", pending: 3, color: "#c6f135" },
  { initials: "N", name: "Northstar Labs", pending: 5, color: "#7c5cbf" },
  { initials: "K", name: "Kora House", pending: 2, color: "#3d7ea6" },
  { initials: "AC", name: "Acme Corp", pending: 1, color: "#c47a3a" },
];

export const piece = {
  eyebrow: "Client review · Aster & Co.",
  title: "Summer campaign — carousel",
  summary: "Review the latest version and leave contextual feedback for the team.",
  file: "summer-campaign-carousel.fig",
  uploaded: "Uploaded Aug 24, 2024 by Mia Lee · 8.4 MB",
  status: "Awaiting your review",
  versions: ["v1", "v2", "v3"],
  currentVersion: "v3",
  details: [
    { label: "Client", value: "Aster & Co." },
    { label: "Format", value: "Instagram Carousel" },
    { label: "Due date", value: "Today, 4:00 PM" },
    { label: "Views", value: "18 people" },
  ],
  tags: ["Summer 2024", "Launch campaign", "Paid social"],
};

export type PieceComment = {
  id: string;
  initials: string;
  author: string;
  role: string;
  time: string;
  body: string;
  pin?: number;
  color: string;
};

export const pieceComments: PieceComment[] = [
  {
    id: "c1",
    initials: "OC",
    author: "Olivia Chen",
    role: "Client",
    time: "12 min ago",
    body: "Can we make the product feel a little more grounded? The shadow looks slightly too soft here.",
    pin: 1,
    color: "#7c5cbf",
  },
  {
    id: "c2",
    initials: "ML",
    author: "Mia Lee",
    role: "Designer",
    time: "8 min ago",
    body: "Updated the shadow treatment in v3. Let me know if this feels closer to the direction.",
    pin: 2,
    color: "#3d7ea6",
  },
  {
    id: "c3",
    initials: "JM",
    author: "Jordan Miller",
    role: "Agency Admin",
    time: "Just now",
    body: "This is looking beautiful. Final polish before we send it live.",
    color: "#c6f135",
  },
];

export const slides = [
  { src: "/mock/carousel.jpg", alt: "Summer campaign preview" },
  { src: "/mock/fabric.jpg", alt: "Fabric detail" },
  { src: "/mock/products.jpg", alt: "Product still" },
  { src: "/mock/portrait.jpg", alt: "Campaign portrait" },
  { src: "/mock/swatches.jpg", alt: "Color study" },
];
