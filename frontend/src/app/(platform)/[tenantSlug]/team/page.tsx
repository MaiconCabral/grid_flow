import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team & Clients",
};

export default function TeamPage() {
  return (
    <div className="px-6 py-10">
      <p className="text-[11px] font-medium tracking-[0.16em] text-lime uppercase">Manage</p>
      <h1 className="mt-2 text-3xl font-semibold">Team & Clients</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Teammates, client workspaces, and invites are next. The dashboard and approval flow are ready to use.
      </p>
    </div>
  );
}
