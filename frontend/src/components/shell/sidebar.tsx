"use client";

import Link from "next/link";
import {
  CalendarCheck,
  ChevronDown,
  CircleHelp,
  HardDrive,
  LayoutDashboard,
  LayoutGrid,
  Settings,
  SquareKanban,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { agency, currentUser } from "@/data/mock";
import { useAgency } from "@/lib/agency-theme";
import { api } from "@/lib/api-client";
import type { Dashboard } from "@/lib/dashboard";

function isActive(pathname: string, href: string) {
  return pathname === href;
}

export function Sidebar({
  pathname,
  tenantSlug,
  tenantName,
  user,
}: {
  pathname: string;
  tenantSlug: string;
  tenantName?: string;
  user?: { name: string; role: string; roleKey?: string; initials: string } | null;
}) {
  const base = `/${tenantSlug}`;
  const [counts, setCounts] = useState<{ total: number; pending: number } | null>(null);
  useEffect(() => {
    let active = true;
    api<Dashboard>("/dashboard")
      .then((board) => {
        if (active) setCounts({ total: board.counts.total, pending: board.counts.pending });
      })
      .catch(() => {
        if (active) setCounts(null);
      });
    return () => {
      active = false;
    };
  }, []);
  const workspaceNav = [
    { href: `${base}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
    { href: `${base}/workspace`, label: "Workspace", icon: SquareKanban, badge: counts ? String(counts.total) : undefined },
    { href: `${base}/approval`, label: "Approval Center", icon: CalendarCheck, badge: counts ? String(counts.pending) : undefined },
  ];
  const manageNav = user?.roleKey === "agency_admin"
    ? [
        { href: `${base}/team`, label: "Team & Clients", icon: Users },
        { href: `${base}/settings`, label: "Settings", icon: Settings },
      ]
    : [];
  const profile = user ?? { name: currentUser.name, role: currentUser.role, initials: currentUser.initials };
  const storedAgency = useAgency();
  const agencyLabel = storedAgency?.name || tenantName || agency.name;
  const agencyInitial = agencyLabel.trim().charAt(0).toUpperCase() || "A";
  const [agencyOpen, setAgencyOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <aside className="flex h-full w-[244px] shrink-0 flex-col bg-sidebar px-3.5 pt-[26px] pb-4">
      <div className="flex min-w-0 items-center gap-[9px] px-[13px] pb-[26px] font-display text-[20px] leading-none font-extrabold tracking-[-0.7px]">
        <span className="grid size-[26px] shrink-0 place-items-center rounded-lg bg-lime text-lime-ink">
          <LayoutGrid className="size-3.5" />
        </span>
        <span className="truncate">{agencyLabel}</span>
      </div>

      <div className="relative mx-1 mb-7">
        <button
          type="button"
          onClick={() => setAgencyOpen((open) => !open)}
          className="flex w-full items-center gap-2.5 rounded-xl bg-raised p-2.5 text-left"
        >
          <span className="grid size-[30px] place-items-center rounded-lg bg-[#d2ff89] font-display text-[15px] leading-none font-extrabold text-[#233312]">
            {agencyInitial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-bold">{agencyLabel}</span>
            <span className="block text-[10px] text-muted">{agency.workspaces} workspaces</span>
          </span>
          <ChevronDown className={`size-4 text-muted ${agencyOpen ? "rotate-180" : ""}`} />
        </button>
        {agencyOpen ? (
          <div className="absolute top-12 left-0 z-30 w-[215px] rounded-[13px] bg-raised p-2.5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <p className="rounded-lg bg-soft px-2.5 py-2 text-[11px] font-semibold">{agencyLabel}</p>
          </div>
        ) : null}
      </div>

      <nav className="space-y-7">
        <NavGroup label="Workspace" items={workspaceNav} pathname={pathname} />
        {manageNav.length > 0 ? <NavGroup label="Manage" items={manageNav} pathname={pathname} /> : null}
      </nav>

      <div className="mt-auto px-[11px] pt-3.5 pb-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <span>
            <span className="block text-[10px] text-muted">Storage</span>
            <strong className="mt-[3px] block text-[11px] font-bold">
              {agency.storageUsed} <small className="font-normal text-faint">/ {agency.storageTotal}</small>
            </strong>
          </span>
          <span className="grid size-[25px] place-items-center rounded-md bg-lime-dark text-lime">
            <HardDrive className="size-3.5" />
          </span>
        </div>
        <div className="mb-6 h-1 overflow-hidden rounded-lg bg-soft">
          <div className="h-full rounded-lg bg-lime" style={{ width: `${agency.storagePercent}%` }} />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setHelpOpen((open) => !open)}
            className="flex w-full items-center gap-2 text-xs text-muted"
          >
            <CircleHelp className="size-3.5" />
            Help center
            <span className="ml-auto grid size-5 place-items-center rounded-md bg-soft text-[11px]">?</span>
          </button>
          {helpOpen ? (
            <p className="absolute bottom-full z-30 mb-2 w-full rounded-[13px] bg-raised px-3 py-2 text-[11px] text-muted shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
              Guides for approvals and production land here soon.
            </p>
          ) : null}
        </div>

        <div className="mt-3 flex items-center gap-[9px] rounded-xl bg-raised px-[9px] pt-[11px] pb-1">
          <span className="grid size-[30px] place-items-center rounded-full bg-[#6683a4] text-[10px] font-bold text-white">
            {profile.initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11px] font-bold">{profile.name}</span>
            <span className="block text-[10px] text-muted">{profile.role}</span>
          </span>
        </div>
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: { href: string; label: string; icon: typeof LayoutDashboard; badge?: string }[];
  pathname: string;
}) {
  return (
    <div>
      <p className="px-[13px] pb-2 text-[10px] font-bold tracking-[1.3px] text-faint uppercase">{label}</p>
      <ul className="flex flex-col gap-[3px]">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-[10px] px-[13px] py-[11px] text-[13px] font-semibold ${
                  active ? "nav-active bg-lime-dark text-lime" : "text-muted hover:bg-raised hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <em
                    className={`min-w-5 rounded-full px-[5px] py-[3px] text-center text-[10px] leading-none not-italic ${
                      active ? "bg-lime text-lime-ink" : "bg-soft text-muted"
                    }`}
                  >
                    {item.badge}
                  </em>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
