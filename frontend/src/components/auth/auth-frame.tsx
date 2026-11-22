import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function AuthFrame({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-[420px]">
        <Link href="/login" className="mb-8 flex items-center gap-[9px] font-display text-[20px] leading-none font-extrabold tracking-[-0.7px]">
          <span className="grid size-[26px] place-items-center rounded-lg bg-lime text-lime-ink">
            <Sparkles className="size-3.5" />
          </span>
          morrow
        </Link>
        <section className="rounded-[14px] bg-card p-6">
          <h1 className="font-display text-[26px] leading-none font-extrabold tracking-[-1px]">{title}</h1>
          <p className="mt-2 text-[13px] text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </section>
        <p className="mt-4 text-center text-[12px] text-muted">{footer}</p>
      </div>
    </main>
  );
}
