export type DashboardCounts = {
  total: number;
  todo: number;
  production: number;
  pending: number;
  approved: number;
  scheduled: number;
  due_this_week: number;
  overdue: number;
};

export type DashboardAction = {
  id: number;
  title: string;
  status: string;
  due_on: string | null;
  workspace: string | null;
  reason: "overdue" | "pending" | "production";
};

export type DashboardEvent = {
  id: number;
  type: string;
  activity_id: number;
  activity_title: string | null;
  actor: string | null;
  actor_role: string | null;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  created_at: string | null;
};

export type DashboardBrand = {
  id: number | null;
  name: string | null;
  open: number;
  pending: number;
};

export type Dashboard = {
  role: string;
  counts: DashboardCounts;
  pipeline: { status: string; count: number }[];
  actions: DashboardAction[];
  events: DashboardEvent[];
  week: {
    start: string;
    end: string;
    days: { date: string; tasks: { id: number; title: string }[] }[];
  };
  brands: DashboardBrand[];
};
