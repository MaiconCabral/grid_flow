"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFrame } from "@/components/auth/auth-frame";
import { notifyError } from "@/lib/alerts";
import { ApiError, api } from "@/lib/api-client";
import { writeSession, type AuthSession } from "@/lib/session";

/** Builds a URL slug from the agency name. */
function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Creates an agency and its admin, then opens the workspace. */
export function RegisterForm() {
  const [agencyName, setAgencyName] = useState("");
  const [agencySlug, setAgencySlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  /** Sends the agency signup and stores the session. */
  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const session = await api<AuthSession>("/auth/register", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          agency_name: agencyName,
          agency_slug: agencySlug,
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });
      writeSession(session);
      router.push(`/${session.tenant.slug}/dashboard`);
    } catch (caught) {
      void notifyError(caught instanceof ApiError ? caught.message : "Could not create the agency.");
      setPending(false);
    }
  }

  return (
    <AuthFrame
      title="Create agency"
      subtitle="This account becomes the agency admin."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className="font-bold text-lime">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Field
          label="Agency name"
          value={agencyName}
          onChange={(value) => {
            setAgencyName(value);
            if (!slugEdited) setAgencySlug(slugify(value));
          }}
        />
        <Field
          label="Agency slug"
          value={agencySlug}
          onChange={(value) => {
            setSlugEdited(true);
            setAgencySlug(slugify(value));
          }}
        />
        <Field label="Your name" value={name} onChange={setName} />
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Password" type="password" value={password} onChange={setPassword} />
        <Field label="Confirm password" type="password" value={passwordConfirmation} onChange={setPasswordConfirmation} />
        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-[9px] bg-lime px-[14px] py-[10px] text-[11px] font-bold text-[#17240b] disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create agency"}
        </button>
      </form>
    </AuthFrame>
  );
}

/** Renders a labeled input. */
function Field({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-bold text-muted">
      {label}
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-[9px] bg-raised px-3 py-2.5 text-[13px] font-normal text-foreground outline-none"
      />
    </label>
  );
}
