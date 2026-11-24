"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api-client";
import type { AuthUser } from "@/lib/session";

/** Sends a client back home and renders the page for the agency team. */
export function StaffGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    api<{ user: AuthUser }>("/auth/me")
      .then((session) => {
        if (!active) return;
        if (session.user.role === "client") {
          const slug = pathname.split("/")[1] ?? "";
          router.replace(`/${slug}/dashboard`);
          return;
        }
        setReady(true);
      })
      .catch(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (!ready) return <p className="px-[38px] pt-10 text-[13px] text-muted">Loading...</p>;
  return children;
}
