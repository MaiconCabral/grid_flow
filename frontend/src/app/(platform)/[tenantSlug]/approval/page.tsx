import type { Metadata } from "next";
import { ApprovalList } from "@/components/approval/approval-list";

export const metadata: Metadata = {
  title: "Approval Center",
};

export default function ApprovalPage() {
  return <ApprovalList />;
}
