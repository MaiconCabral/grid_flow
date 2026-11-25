"use client";

import mammoth from "mammoth";
import { useEffect, useState } from "react";
import { apiBuffer } from "@/lib/api-client";
import { assetUrl, documentKind } from "@/lib/activities";

/** Shows a text delivery as a page, a rendered Word file, or an open link. */
export function DocumentFrame({
  activityId,
  versionId,
  name,
  url,
  title,
  gradient,
  className,
}: {
  activityId: number;
  versionId?: number | null;
  name: string | null;
  url: string | null;
  title: string;
  gradient?: { backgroundImage: string };
  className?: string;
}) {
  const href = assetUrl(url);
  const kind = documentKind(name);

  if (!href || !kind) {
    return (
      <div className={`overflow-hidden rounded-xl ${className ?? ""}`}>
        <span className="grid min-h-[420px] place-items-center px-6 text-center text-sm font-semibold text-white" style={gradient ?? { background: "#1c1c1c" }}>
          {title}
        </span>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl bg-white ${className ?? ""}`}>
      {kind === "pdf" ? (
        <iframe src={href} title={name ?? title} className="h-[70vh] w-full bg-white" />
      ) : kind === "docx" ? (
        <DocxBody key={`${activityId}-${versionId ?? "current"}`} activityId={activityId} versionId={versionId} href={href} name={name} />
      ) : (
        <OpenFile href={href} name={name} />
      )}
    </div>
  );
}

/** Converts a docx into HTML and shows it on the page. */
function DocxBody({
  activityId,
  versionId,
  href,
  name,
}: {
  activityId: number;
  versionId?: number | null;
  href: string;
  name: string | null;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const query = versionId ? `?version=${versionId}` : "";
    apiBuffer(`/activities/${activityId}/document${query}`)
      .then((buffer) => mammoth.convertToHtml({ arrayBuffer: buffer }))
      .then((result) => {
        if (!cancelled) setHtml(result.value);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [activityId, versionId]);

  if (failed) return <OpenFile href={href} name={name} />;
  if (html === null) {
    return <p className="grid h-40 place-items-center text-sm text-[#737373]">Reading the document...</p>;
  }

  return (
    <div
      className="max-h-[70vh] overflow-y-auto px-8 py-6 text-sm leading-relaxed text-[#141414] [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-semibold [&_li]:mb-1 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Offers the file when the browser cannot draw it. */
function OpenFile({ href, name }: { href: string; name: string | null }) {
  return (
    <div className="grid min-h-40 place-items-center gap-2 px-6 py-8 text-center">
      <p className="text-sm font-semibold text-[#141414]">{name}</p>
      <a href={href} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#141414] underline">
        Open
      </a>
    </div>
  );
}
