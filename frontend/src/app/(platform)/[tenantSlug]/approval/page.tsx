import type { Metadata } from "next";
import { ApprovalList } from "@/components/approval/approval-list";
import { StaffGate } from "@/components/client/staff-gate";

export const metadata: Metadata = {
  title: "Approval Center",
};

export default function ApprovalPage() {
  return (
    <StaffGate>
      <ApprovalList />
    </StaffGate>
  );
}
