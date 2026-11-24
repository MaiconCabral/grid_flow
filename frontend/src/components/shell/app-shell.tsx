"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { publishAgency } from "@/lib/agency-theme";
import { api } from "@/lib/api-client";
import type { AuthAccount } from "@/lib/session";

const titles: Record<string, string> = {
  dashboard: "Dashboard",
  workspace: "Workspace",
  approval: "Approval Center",
  team: "Team & Clients",
  settings: "Settings",
};

const roleLabels: Record<string, string> = {
  agency_admin: "Agency Admin",
  copywriter: "Copywriter",
  designer: "Designer",
  client: "Client",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [, tenantSlug = "", section = "dashboard"] = pathname.split("/");
  const [account, setAccount] = useState<AuthAccount | null>(null);

  useEffect(() => {
    api<AuthAccount>("/auth/me")
      .then((session) => {
        setAccount(session);
        publishAgency(session.tenant);
      })
      .catch(() => setAccount(null));
  }, []);

  const user = account
    ? {
        name: account.user.name,
        role: roleLabels[account.user.role] ?? account.user.role,
        roleKey: account.user.role,
        initials: account.user.name
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
          .toUpperCase(),
      }
    : null;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        pathname={pathname}
        tenantSlug={tenantSlug}
        tenantName={account?.tenant.name}
        user={user}
        agencies={account?.agencies ?? []}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={account?.user.role === "client" && section === "dashboard" ? "Pieces" : (titles[section] ?? "Post Grid")}
          tenantSlug={tenantSlug}
          tenantName={account?.tenant.name}
          user={user}
          canEditTheme={account?.user.role === "agency_admin"}
        />
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
