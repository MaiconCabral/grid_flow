"use client";

import Link from "next/link";
import {
  CalendarCheck,
  Check,
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
import { showVisualPlaceholders } from "@/lib/placeholders";
import { useAgency } from "@/lib/agency-theme";
import { notifyError } from "@/lib/alerts";
import { ApiError, api } from "@/lib/api-client";
import type { Dashboard } from "@/lib/dashboard";
import { useI18n } from "@/lib/i18n";
import { writeTenant, type AuthAgency, type AuthTenant } from "@/lib/session";

function isActive(pathname: string, href: string) {
  return pathname === href;
}

export function Sidebar({
  pathname,
  tenantSlug,
  tenantName,
  user,
  agencies = [],
}: {
  pathname: string;
  tenantSlug: string;
  tenantName?: string;
  user?: { name: string; role: string; roleKey?: string; initials: string } | null;
  agencies?: AuthAgency[];
}) {
  const { t } = useI18n();
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
  const known = Boolean(user?.roleKey);
  const client = user?.roleKey === "client";
  const workspaceNav = client
    ? [{ href: `${base}/dashboard`, label: t("nav.pieces"), icon: LayoutGrid }]
    : [
        { href: `${base}/dashboard`, label: t("nav.dashboard"), icon: LayoutDashboard },
        { href: `${base}/workspace`, label: t("nav.workspace"), icon: SquareKanban, badge: counts ? String(counts.total) : undefined },
        { href: `${base}/approval`, label: t("nav.approval"), icon: CalendarCheck, badge: counts ? String(counts.pending) : undefined },
      ];
  const admin = user?.roleKey === "agency_admin";
  const manageNav = admin
    ? [
        { href: `${base}/team`, label: t("nav.team"), icon: Users },
        { href: `${base}/settings`, label: t("nav.settings"), icon: Settings },
      ]
    : [];
  const profile = user ?? { name: currentUser.name, role: currentUser.role, initials: currentUser.initials };
  const storedAgency = useAgency();
  const agencyLabel = storedAgency?.name || tenantName || agency.name;
  const agencyInitial = agencyLabel.trim().charAt(0).toUpperCase() || "A";
  const canSwitch = agencies.length > 1;
  const [agencyOpen, setAgencyOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  /** Opens another agency and reloads the dashboard there. */
  async function chooseAgency(target: AuthAgency) {
    if (target.slug === tenantSlug || switching) {
      setAgencyOpen(false);
      return;
    }
    setSwitching(true);
    try {
      const session = await api<{ tenant: AuthTenant }>("/auth/switch-agency", {
        method: "POST",
        body: JSON.stringify({ tenant_id: target.id }),
      });
      writeTenant(session.tenant);
      window.location.assign(`/${session.tenant.slug}/dashboard`);
    } catch (caught) {
      void notifyError(caught instanceof ApiError ? caught.message : t("top.switchFailed"));
      setSwitching(false);
    }
  }

  return (
    <aside className="flex h-full w-[244px] shrink-0 flex-col bg-sidebar px-3.5 pt-[26px] pb-4">
      <div className="flex min-w-0 items-center gap-[9px] px-[13px] pb-[26px] font-display text-[20px] leading-none font-extrabold tracking-[-0.7px]">
        <span className="grid size-[26px] shrink-0 place-items-center rounded-lg bg-lime text-lime-ink">
          <LayoutGrid className="size-3.5" />
        </span>
        <span className="truncate">{agencyLabel}</span>
      </div>

      <div className="relative mx-1 mb-7">
        {canSwitch ? (
          <button
            type="button"
            onClick={() => setAgencyOpen((open) => !open)}
            className="flex w-full items-center gap-2.5 rounded-xl bg-raised p-2.5 text-left"
          >
            <AgencyMark initial={agencyInitial} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-bold">{agencyLabel}</span>
              <span className="block text-[10px] text-muted">{t("nav.agencies", { count: agencies.length })}</span>
            </span>
            <ChevronDown className={`size-4 text-muted ${agencyOpen ? "rotate-180" : ""}`} />
          </button>
        ) : (
          <div className="flex w-full items-center gap-2.5 rounded-xl bg-raised p-2.5 text-left">
            <AgencyMark initial={agencyInitial} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-bold">{agencyLabel}</span>
            </span>
          </div>
        )}
        {canSwitch && agencyOpen ? (
          <div className="absolute top-12 left-0 z-30 w-[215px] rounded-[13px] bg-raised p-2.5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            {agencies.map((item) => {
              const active = item.slug === tenantSlug;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={switching}
                  onClick={() => void chooseAgency(item)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold ${
                    active ? "bg-soft text-foreground" : "text-muted hover:bg-soft hover:text-foreground"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  {active ? <Check className="size-[13px] shrink-0 text-lime" /> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <nav className="space-y-7">
        {known ? <NavGroup label={client ? t("nav.review") : t("nav.workspace")} items={workspaceNav} pathname={pathname} /> : null}
        {manageNav.length > 0 ? <NavGroup label={t("nav.manage")} items={manageNav} pathname={pathname} /> : null}
      </nav>

      <div className="mt-auto px-[11px] pt-3.5 pb-3.5">
        {showVisualPlaceholders && admin ? (
          <div className="mb-6">
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
            <div className="h-1 overflow-hidden rounded-lg bg-soft">
              <div className="h-full rounded-lg bg-lime" style={{ width: `${agency.storagePercent}%` }} />
            </div>
          </div>
        ) : null}

        {showVisualPlaceholders ? (
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
        ) : null}

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

/** Renders the agency initial beside its name. */
function AgencyMark({ initial }: { initial: string }) {
  return (
    <span className="grid size-[30px] place-items-center rounded-lg bg-[#d2ff89] font-display text-[15px] leading-none font-extrabold text-[#233312]">
      {initial}
    </span>
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
