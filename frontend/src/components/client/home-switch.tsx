"use client";

import { useEffect, useState } from "react";
import { ClientHome } from "@/components/client/client-home";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { notifyError } from "@/lib/alerts";
import { ApiError, api } from "@/lib/api-client";
import type { AuthUser } from "@/lib/session";

/** Sends a client to the feed and everyone else to the dashboard. */
export function HomeSwitch() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api<{ user: AuthUser }>("/auth/me")
      .then((session) => {
        if (active) setRole(session.user.role);
      })
      .catch((error: unknown) => {
        if (!active) return;
        notifyError(error instanceof ApiError ? error.message : "Could not load your session.");
        setRole("agency_admin");
      });
    return () => {
      active = false;
    };
  }, []);

  if (!role) return <p className="px-[38px] pt-10 text-[13px] text-muted">Loading...</p>;
  if (role === "client") return <ClientHome />;
  return <DashboardView />;
}
