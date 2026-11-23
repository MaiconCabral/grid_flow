import type { Metadata } from "next";
import { TeamView } from "@/components/team/team-view";

export const metadata: Metadata = {
  title: "Team & Clients",
};

export default function TeamPage() {
  return <TeamView />;
}
