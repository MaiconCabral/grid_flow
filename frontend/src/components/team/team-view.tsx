"use client";

import { X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useTheme } from "@/components/theme-provider";
import { notifyError, notifySuccess } from "@/lib/alerts";
import { ApiError, api } from "@/lib/api-client";
import type { AuthUser } from "@/lib/session";

type Member = {
  id: number;
  name: string;
  email: string;
  role: string;
  workspace_id: number | null;
  workspace_name: string | null;
};

type Brand = {
  id: number;
  name: string;
  clients: { id: number; name: string; email: string }[];
};

type Draft =
  | {
      kind: "member";
      id: number | null;
      name: string;
      email: string;
      password: string;
      role: string;
    }
  | {
      kind: "client-record";
      tab: "brand" | "user";
      brandId: number | null;
      brandName: string;
      userId: number | null;
      userName: string;
      email: string;
      password: string;
      workspaceId: string;
    };

/** Returns an empty client form opened on the given tab. */
function blankClientRecord(tab: "brand" | "user" = "user"): Extract<Draft, { kind: "client-record" }> {
  return {
    kind: "client-record",
    tab,
    brandId: null,
    brandName: "",
    userId: null,
    userName: "",
    email: "",
    password: "",
    workspaceId: "",
  };
}

const roleLabels: Record<string, string> = {
  agency_admin: "Agency Admin",
  designer: "Designer",
  copywriter: "Copywriter",
  client: "Client",
};

const teamRoles = [
  { value: "agency_admin", label: "Agency Admin" },
  { value: "designer", label: "Designer" },
  { value: "copywriter", label: "Copywriter" },
];

const buttonStyle = { fontSize: 11, fontWeight: 700, lineHeight: "16.5px" } as const;

/** Renders team and client management for the agency admin. */
export function TeamView() {
  const [role, setRole] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pending, setPending] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ kind: "user" | "brand"; id: number } | null>(null);

  /** Loads teammates and brands for the signed-in agency. */
  async function loadLists() {
    const [users, workspaces] = await Promise.all([
      api<{ data: Member[] }>("/users"),
      api<{ data: Brand[] }>("/workspaces"),
    ]);
    setMembers(users.data.filter((user) => user.role !== "client"));
    setBrands(workspaces.data);
  }

  useEffect(() => {
    api<{ user: AuthUser }>("/auth/me")
      .then((session) => {
        setRole(session.user.role);
        if (session.user.role !== "agency_admin") {
          setReady(true);
          return;
        }
        return loadLists().then(() => setReady(true));
      })
      .catch((caught) => {
        void notifyError(caught instanceof ApiError ? caught.message : "Could not load the team.");
        setReady(true);
      });
  }, []);

  /** Opens the lightbox for a teammate, brand, or client. */
  function openDraft(next: Draft) {
    setRemoveTarget(null);
    setDraft(next);
  }

  /** Creates or updates the record of the open tab. */
  async function saveDraft(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setPending(true);
    try {
      if (draft.kind === "client-record" && draft.tab === "brand") {
        const body = JSON.stringify({ name: draft.brandName });
        if (draft.brandId === null) await api("/workspaces", { method: "POST", body });
        else await api(`/workspaces/${draft.brandId}`, { method: "PATCH", body });
      } else if (draft.kind === "client-record") {
        const body = JSON.stringify({
          name: draft.userName,
          email: draft.email,
          password: draft.password || null,
          role: "client",
          workspace_id: Number(draft.workspaceId),
        });
        if (draft.userId === null) await api("/users", { method: "POST", body });
        else await api(`/users/${draft.userId}`, { method: "PATCH", body });
      } else {
        const body = JSON.stringify({
          name: draft.name,
          email: draft.email,
          password: draft.password || null,
          role: draft.role,
          workspace_id: null,
        });
        if (draft.id === null) await api("/users", { method: "POST", body });
        else await api(`/users/${draft.id}`, { method: "PATCH", body });
      }
      await loadLists();
      setDraft(null);
      void notifySuccess(savedLabel(draft));
    } catch (caught) {
      void notifyError(caught instanceof ApiError ? caught.message : "Could not save.");
    } finally {
      setPending(false);
    }
  }

  /** Deletes the brand or user waiting for confirmation. */
  async function remove() {
    if (!removeTarget) return;
    setPending(true);
    const removed = removeTarget.kind === "brand" ? "Brand removed." : "User removed.";
    try {
      const path = removeTarget.kind === "brand" ? `/workspaces/${removeTarget.id}` : `/users/${removeTarget.id}`;
      await api(path, { method: "DELETE" });
      await loadLists();
      setRemoveTarget(null);
      setDraft(null);
      void notifySuccess(removed);
    } catch (caught) {
      void notifyError(caught instanceof ApiError ? caught.message : "Could not remove.");
    } finally {
      setPending(false);
    }
  }

  if (!ready) {
    return <p className="px-[38px] pt-10 text-[13px] text-muted">Loading team...</p>;
  }

  if (role !== "agency_admin") {
    return (
      <div className="mx-auto max-w-[1640px] px-[38px] pt-10 pb-12">
        <Header />
        <section className="mt-8 max-w-xl rounded-[14px] bg-card p-[18px]">
          <p className="text-[13px] text-muted">This page is not available.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1640px] px-[38px] pt-10 pb-12">
      <Header />
      {draft ? (
        <DraftDialog
          draft={draft}
          brands={brands}
          pending={pending}
          onChange={setDraft}
          onClose={() => {
            if (!pending) setDraft(null);
          }}
          onSubmit={saveDraft}
        />
      ) : null}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[18px] font-extrabold tracking-[-0.4px]">Team</h2>
          <button
            type="button"
            style={buttonStyle}
            onClick={() =>
              openDraft({ kind: "member", id: null, name: "", email: "", password: "", role: "designer" })
            }
            className="rounded-[9px] bg-lime px-[14px] py-[10px] text-[#17240b]"
          >
            Add teammate
          </button>
        </div>
        <ul className="flex flex-col gap-2">
          {members.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-card px-[18px] py-3">
              <div>
                <p className="text-[13px] font-bold">{member.name}</p>
                <p className="text-[11px] text-muted">
                  {member.email} · {roleLabels[member.role] ?? member.role}
                </p>
              </div>
              <RowActions
                pending={pending}
                confirming={removeTarget?.kind === "user" && removeTarget.id === member.id}
                onEdit={() =>
                  openDraft({
                    kind: "member",
                    id: member.id,
                    name: member.name,
                    email: member.email,
                    password: "",
                    role: member.role,
                  })
                }
                onAsk={() => setRemoveTarget({ kind: "user", id: member.id })}
                onCancel={() => setRemoveTarget(null)}
                onConfirm={remove}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[18px] font-extrabold tracking-[-0.4px]">Clients</h2>
          <button
            type="button"
            style={buttonStyle}
            onClick={() => openDraft(blankClientRecord("brand"))}
            className="rounded-[9px] bg-lime px-[14px] py-[10px] text-[#17240b]"
          >
            Add clients
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {brands.map((brand) => (
            <article key={brand.id} className="rounded-[14px] bg-card p-[18px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-[14px] font-bold">{brand.name}</h3>
                <RowActions
                  pending={pending}
                  confirming={removeTarget?.kind === "brand" && removeTarget.id === brand.id}
                  onEdit={() => openDraft({ ...blankClientRecord("brand"), brandId: brand.id, brandName: brand.name })}
                  onAsk={() => setRemoveTarget({ kind: "brand", id: brand.id })}
                  onCancel={() => setRemoveTarget(null)}
                  onConfirm={remove}
                />
              </div>
              <ul className="mt-3 flex flex-col gap-2">
                {brand.clients.length === 0 ? <li className="text-[12px] text-muted">No client login yet.</li> : null}
                {brand.clients.map((client) => (
                  <li key={client.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-raised px-3 py-2">
                    <div>
                      <p className="text-[13px] font-bold">{client.name}</p>
                      <p className="text-[11px] text-muted">{client.email}</p>
                    </div>
                    <RowActions
                      pending={pending}
                      confirming={removeTarget?.kind === "user" && removeTarget.id === client.id}
                      onEdit={() =>
                        openDraft({
                          ...blankClientRecord("user"),
                          userId: client.id,
                          userName: client.name,
                          email: client.email,
                          workspaceId: String(brand.id),
                        })
                      }
                      onAsk={() => setRemoveTarget({ kind: "user", id: client.id })}
                      onCancel={() => setRemoveTarget(null)}
                      onConfirm={remove}
                    />
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Shows the create or edit form in a theme-aware lightbox. */
function DraftDialog({
  draft,
  brands,
  pending,
  onChange,
  onClose,
  onSubmit,
}: {
  draft: Draft;
  brands: Brand[];
  pending: boolean;
  onChange: (draft: Draft) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const { theme } = useTheme();

  useEffect(() => {
    /** Closes the lightbox when Escape is pressed. */
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 grid place-items-center px-4 ${theme === "light" ? "bg-[#181b19]/35" : "bg-black/60"}`}
      onMouseDown={onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-draft-title"
        onSubmit={onSubmit}
        onMouseDown={(event) => event.stopPropagation()}
        style={{ colorScheme: theme }}
        className="grid w-full max-w-[420px] gap-3 rounded-[14px] bg-card p-[18px] text-foreground shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
      >
        <div className="flex items-start justify-between gap-3">
          <p id="team-draft-title" className="text-[13px] font-bold">
            {draftTitle(draft)}
          </p>
          <button type="button" aria-label="Close" onClick={onClose} className="grid size-7 place-items-center rounded-md text-muted hover:bg-raised hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        {draft.kind === "client-record" ? (
          <div role="tablist" aria-label="Client record" className="flex gap-1 rounded-[9px] bg-raised p-1">
            {(["brand", "user"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={draft.tab === tab}
                onClick={() => onChange({ ...draft, tab })}
                style={buttonStyle}
                className={`flex-1 rounded-[7px] px-3 py-[8px] ${draft.tab === tab ? "bg-lime text-lime-ink" : "text-muted"}`}
              >
                {tab === "brand" ? "Brands" : "Users"}
              </button>
            ))}
          </div>
        ) : null}
        {draft.kind === "member" ? (
          <>
            <Field label="Name" value={draft.name} onChange={(name) => onChange({ ...draft, name })} />
            <Field label="Email" type="email" value={draft.email} onChange={(email) => onChange({ ...draft, email })} />
            <Field
              label={draft.id === null ? "Password" : "New password"}
              type="password"
              required={draft.id === null}
              value={draft.password}
              onChange={(password) => onChange({ ...draft, password })}
            />
            <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
              Role
              <select
                value={draft.role}
                onChange={(event) => onChange({ ...draft, role: event.target.value })}
                className="rounded-[9px] bg-raised px-3 py-2.5 text-[13px] font-normal text-foreground outline-none"
              >
                {teamRoles.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
        {draft.kind === "client-record" && draft.tab === "brand" ? (
          <Field label="Brand name" value={draft.brandName} onChange={(brandName) => onChange({ ...draft, brandName })} />
        ) : null}
        {draft.kind === "client-record" && draft.tab === "user" ? (
          <>
            <Field label="Name" value={draft.userName} onChange={(userName) => onChange({ ...draft, userName })} />
            <Field label="Email" type="email" value={draft.email} onChange={(email) => onChange({ ...draft, email })} />
            <Field
              label={draft.userId === null ? "Password" : "New password"}
              type="password"
              required={draft.userId === null}
              value={draft.password}
              onChange={(password) => onChange({ ...draft, password })}
            />
            <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
              Brand
              <select
                required
                value={draft.workspaceId}
                onChange={(event) => onChange({ ...draft, workspaceId: event.target.value })}
                className="rounded-[9px] bg-raised px-3 py-2.5 text-[13px] font-normal text-foreground outline-none"
              >
                <option value="">Select a brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
        <div className="flex gap-2">
          <button type="submit" disabled={pending} style={buttonStyle} className="rounded-[9px] bg-lime px-[14px] py-[10px] text-lime-ink disabled:opacity-60">
            {pending ? "Saving..." : "Save"}
          </button>
          <button type="button" style={buttonStyle} onClick={onClose} className="rounded-[9px] bg-raised px-[14px] py-[10px] text-foreground">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

/** Renders the Team & Clients title. */
function Header() {
  return (
    <header>
      <p className="mb-3 text-[9px] font-bold tracking-[1.4px] text-muted uppercase">Manage</p>
      <h1 className="font-display text-[30px] leading-[1.18] font-extrabold tracking-[-1.3px]">Team & Clients</h1>
      <p className="mt-2 text-[13px] text-muted">People who work at the agency, and the brands they serve.</p>
    </header>
  );
}

/** Builds the success message for the saved record. */
function savedLabel(draft: Draft) {
  if (draft.kind === "client-record" && draft.tab === "brand") {
    return draft.brandId === null ? "Brand created." : "Brand updated.";
  }
  if (draft.kind === "client-record") {
    return draft.userId === null ? "Client created." : "Client updated.";
  }
  return draft.id === null ? "Teammate created." : "Teammate updated.";
}

/** Builds the lightbox title for the open form. */
function draftTitle(draft: Draft) {
  if (draft.kind === "member") return draft.id === null ? "New teammate" : "Edit teammate";
  if (draft.tab === "brand") return draft.brandId === null ? "New brand" : "Edit brand";
  return draft.userId === null ? "New client" : "Edit client";
}

/** Renders a labeled text input. */
function Field({
  label,
  value,
  onChange,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-[9px] bg-raised px-3 py-2.5 text-[13px] font-normal text-foreground outline-none"
      />
    </label>
  );
}

/** Renders edit and remove, or the remove confirmation. */
function RowActions({
  pending,
  confirming,
  onEdit,
  onAsk,
  onCancel,
  onConfirm,
}: {
  pending: boolean;
  confirming: boolean;
  onEdit: () => void;
  onAsk: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (confirming) return <Confirm pending={pending} onCancel={onCancel} onConfirm={onConfirm} />;

  return (
    <div className="flex gap-2">
      <button type="button" style={buttonStyle} onClick={onEdit} className="rounded-[9px] bg-raised px-[14px] py-[10px] text-foreground">
        Edit
      </button>
      <button type="button" style={buttonStyle} onClick={onAsk} className="rounded-[9px] bg-raised px-[14px] py-[10px] text-foreground">
        Remove
      </button>
    </div>
  );
}

/** Asks the admin to confirm a removal. */
function Confirm({ pending, onCancel, onConfirm }: { pending: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="flex gap-2">
      <button type="button" disabled={pending} style={buttonStyle} onClick={onConfirm} className="rounded-[9px] bg-lime px-[14px] py-[10px] text-[#17240b] disabled:opacity-60">
        Confirm
      </button>
      <button type="button" style={buttonStyle} onClick={onCancel} className="rounded-[9px] bg-raised px-[14px] py-[10px] text-foreground">
        Cancel
      </button>
    </div>
  );
}
