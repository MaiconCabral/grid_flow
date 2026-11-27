"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NotificationAlert } from "@/components/shell/notification-alert";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { useNotifications } from "@/components/shell/use-notifications";
import { publishAgency } from "@/lib/agency-theme";
import { api } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import type { AuthAccount } from "@/lib/session";

const titles: Record<string, MessageKey> = {
  dashboard: "nav.dashboard",
  workspace: "nav.workspace",
  approval: "nav.approval",
  team: "nav.team",
  settings: "nav.settings",
};

const roleKeys: Record<string, MessageKey> = {
  agency_admin: "role.agency_admin",
  copywriter: "role.copywriter",
  designer: "role.designer",
  client: "role.client",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [, tenantSlug = "", section = "dashboard"] = pathname.split("/");
  const [account, setAccount] = useState<AuthAccount | null>(null);
  const notices = useNotifications();

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
        role: roleKeys[account.user.role] ? t(roleKeys[account.user.role]) : account.user.role,
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
          title={account?.user.role === "client" && section === "dashboard" ? t("nav.pieces") : titles[section] ? t(titles[section]) : "Post Grid"}
          tenantSlug={tenantSlug}
          tenantName={account?.tenant.name}
          user={user}
          canEditTheme={account?.user.role === "agency_admin"}
          notifications={notices.items}
          unread={notices.unread}
          onOpenNotification={(item) => void notices.open(item)}
        />
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
        {notices.alert ? <NotificationAlert item={notices.alert} onOpen={(item) => void notices.open(item)} onClose={notices.dismiss} /> : null}
      </div>
    </div>
  );
}
