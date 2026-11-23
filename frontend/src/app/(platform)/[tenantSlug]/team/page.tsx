import type { Metadata } from "next";
import { TeamView } from "@/components/team/team-view";

export const metadata: Metadata = {
  title: "Team & Clients",
};

/** Renders the team and client management screen. */
export default function TeamPage() {
  return <TeamView />;
}
