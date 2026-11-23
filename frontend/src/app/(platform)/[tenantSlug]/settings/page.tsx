import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = {
  title: "Settings",
};

/** Renders the agency settings screen. */
export default function SettingsPage() {
  return <SettingsView />;
}
