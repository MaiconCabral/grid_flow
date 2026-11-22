import type { Metadata } from "next";
import { ApprovalView } from "@/components/approval/approval-view";

export const metadata: Metadata = {
  title: "Approval Center",
};

export default function ApprovalPage() {
  return <ApprovalView />;
}
