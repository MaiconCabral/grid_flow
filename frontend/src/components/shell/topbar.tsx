"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, ChevronDown, Moon, Sun, UserCog } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { activityFeed, agency, currentUser } from "@/data/mock";
import { useTheme } from "@/components/theme-provider";
import { notifyError, notifySuccess } from "@/lib/alerts";
import { publishAgency, useAgency, type AgencyAppearance } from "@/lib/agency-theme";
import { ApiError, api } from "@/lib/api-client";
import { clearSession } from "@/lib/session";

type Menu = "view" | "bell" | "user";

const roles = [
  { id: "admin", label: "Agency Admin", dot: "bg-lime" },
  { id: "client", label: "Client (Aster & Co.)", dot: "bg-purple" },
] as const;

export function Topbar({
  title,
  tenantSlug,
  tenantName,
  user,
  canEditTheme = false,
}: {
  title: string;
  tenantSlug: string;
  tenantName?: string;
  user?: { name: string; role: string; initials: string } | null;
  canEditTheme?: boolean;
}) {
  const { theme } = useTheme();
  const storedAgency = useAgency();
  const [savingTheme, setSavingTheme] = useState(false);
  const router = useRouter();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [roleId, setRoleId] = useState<(typeof roles)[number]["id"]>("admin");
  const role = roles.find((item) => item.id === roleId) ?? roles[0];
  const barRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!barRef.current?.contains(event.target as Node)) setMenu(null);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function toggle(next: Menu) {
    setMenu((current) => (current === next ? null : next));
  }

  /** Saves the agency light or dark mode. */
  async function changeTheme() {
    if (!canEditTheme || savingTheme) return;
    setSavingTheme(true);
    try {
      const saved = await api<AgencyAppearance>("/settings", {
        method: "PATCH",
        body: JSON.stringify({ theme: theme === "dark" ? "light" : "dark" }),
      });
      publishAgency(saved);
      void notifySuccess("Theme updated.");
    } catch (caught) {
      void notifyError(caught instanceof ApiError ? caught.message : "Could not update the theme.");
    } finally {
      setSavingTheme(false);
    }
  }

  async function signOut() {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // The local cookies still have to go if the token is already invalid.
    }
    clearSession();
    router.push("/login");
  }

  const profile = user ?? { name: currentUser.name, role: currentUser.role, initials: currentUser.initials };

  return (
    <header ref={barRef} className="flex h-[72px] shrink-0 items-center justify-between bg-sidebar px-[38px]">
      <p className="flex items-center gap-[10px] text-[12px] text-faint">
        <span>{storedAgency?.name ?? tenantName ?? agency.name}</span>
        <span aria-hidden>›</span>
        <strong className="font-bold text-foreground">{title}</strong>
      </p>

      <div className="flex items-center gap-2.5">
        <div className="relative">
          <button
            type="button"
            onClick={() => toggle("view")}
            style={{ fontSize: 10, fontWeight: 400, lineHeight: "15px" }}
            className="inline-flex items-center gap-[7px] rounded-[9px] bg-raised px-[10px] py-[7px] text-muted hover:bg-soft hover:text-foreground"
          >
            <UserCog size={14} className="shrink-0 text-lime" />
            <span>
              Viewing as: <strong className="font-bold text-foreground">{role.label}</strong>
            </span>
            <ChevronDown className="size-[13px] shrink-0 text-lime" />
          </button>
          {menu === "view" ? (
            <div className="absolute top-11 right-0 z-30 w-[230px] rounded-[13px] bg-raised p-2.5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
              <p className="px-[9px] py-1.5 text-[9px] font-bold tracking-[1px] text-faint">SWITCH ROLE</p>
              {roles.map((item) => {
                const active = item.id === role.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setRoleId(item.id);
                      setMenu(null);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-[9px] py-[9px] text-left text-[11px] ${
                      active ? "text-foreground" : "text-muted hover:bg-soft hover:text-foreground"
                    }`}
                  >
                    <span className={`size-[7px] shrink-0 rounded-full ${item.dot}`} />
                    {item.label}
                    {active ? <Check className="ml-auto size-[13px] text-lime" /> : null}
                  </button>
                );
              })}
              <p className="px-[9px] pt-2 pb-0.5 text-[9px] leading-[1.4] text-faint">Switching roles adapts the dashboard layout</p>
            </div>
          ) : null}
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Toggle theme"
            disabled={!canEditTheme || savingTheme}
            onClick={() => void changeTheme()}
            className="grid size-[35px] place-items-center rounded-[9px] bg-raised text-lime hover:bg-soft disabled:opacity-50"
          >
            {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </button>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => toggle("bell")}
            className="relative grid size-[35px] place-items-center rounded-[9px] bg-raised text-muted hover:bg-soft hover:text-foreground"
          >
            <Bell className="size-4" />
            <span className="absolute top-1 right-1 size-1.5 rounded-full bg-lime" />
          </button>
          {menu === "bell" ? (
            <div className="absolute top-11 right-0 z-30 w-[290px] rounded-[13px] bg-raised p-2.5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
              <p className="px-2 py-1.5 text-[9px] font-bold tracking-[1px] text-faint uppercase">Notifications</p>
              <ul>
                {activityFeed.slice(0, 3).map((item) => (
                  <li key={item.name} className="rounded-lg px-2 py-2.5 text-[11px] hover:bg-soft">
                    <span className="font-semibold">{item.name}</span> <span className="text-muted">{item.text}</span>{" "}
                    <span>{item.emphasis}</span>
                    <span className="mt-0.5 block text-[10px] text-faint">{item.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggle("user")}
            className="flex items-center gap-1.5 rounded-[9px] bg-raised py-1 pr-2 pl-1 text-muted hover:bg-soft"
          >
            <span className="grid size-[27px] place-items-center rounded-full bg-[#6988a8] text-[9px] font-bold text-white">
              {profile.initials}
            </span>
            <ChevronDown className="size-3" />
          </button>
          {menu === "user" ? (
            <div className="absolute top-11 right-0 z-30 w-[220px] rounded-[13px] bg-raised p-2.5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
              <div className="px-2 py-2">
                <p className="text-xs font-semibold">{profile.name}</p>
                <p className="text-[10px] text-muted">{profile.role}</p>
              </div>
              <Link href={`/${tenantSlug}/settings`} onClick={() => setMenu(null)} className="block rounded-lg px-2 py-2.5 text-[11px] text-muted hover:bg-soft hover:text-foreground">
                Account preferences
              </Link>
              <Link href={`/${tenantSlug}/team`} onClick={() => setMenu(null)} className="block rounded-lg px-2 py-2.5 text-[11px] text-muted hover:bg-soft hover:text-foreground">
                Invite teammates
              </Link>
              <button type="button" onClick={signOut} className="block w-full rounded-lg px-2 py-2.5 text-left text-[11px] text-muted hover:bg-soft hover:text-foreground">
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

