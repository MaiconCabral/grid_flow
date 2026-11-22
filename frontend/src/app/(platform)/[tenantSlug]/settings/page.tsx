import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div className="px-6 py-10">
      <p className="text-[11px] font-medium tracking-[0.16em] text-lime uppercase">Manage</p>
      <h1 className="mt-2 text-3xl font-semibold">Settings</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Account preferences stay with the theme menu for now. Dark and Light apply across the workspace.
      </p>
    </div>
  );
}
