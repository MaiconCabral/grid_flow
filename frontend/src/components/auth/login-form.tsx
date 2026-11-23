"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFrame } from "@/components/auth/auth-frame";
import { notifyError } from "@/lib/alerts";
import { ApiError, api } from "@/lib/api-client";
import { writeSession, type AuthSession } from "@/lib/session";

export function LoginForm() {
  const [email, setEmail] = useState("jordan@agency-alpha.test");
  const [password, setPassword] = useState("password");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const session = await api<AuthSession>("/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email, password }),
      });
      writeSession(session);
      router.push(`/${session.tenant.slug}/dashboard`);
    } catch (caught) {
      void notifyError(caught instanceof ApiError ? caught.message : "Could not sign in.");
      setPending(false);
    }
  }

  return (
    <AuthFrame
      title="Sign in"
      subtitle="Use your agency account to open the workspace."
      footer={
        <>
          New agency?{" "}
          <Link href="/register" className="font-bold text-lime">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Password" type="password" value={password} onChange={setPassword} />
        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-[9px] bg-lime px-[14px] py-[10px] text-[11px] font-bold text-[#17240b] disabled:opacity-60"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
        <p className="text-[11px] text-faint">Demo: jordan@agency-alpha.test / password</p>
      </form>
    </AuthFrame>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
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
