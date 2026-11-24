import type { Metadata } from "next";
import { HomeSwitch } from "@/components/client/home-switch";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return <HomeSwitch />;
}
