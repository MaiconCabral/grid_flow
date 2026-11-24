import type { Metadata } from "next";
import { StaffGate } from "@/components/client/staff-gate";
import { ActivityView } from "@/components/workspace/activity-view";

export const metadata: Metadata = {
  title: "Activity",
};

export default function ActivityPage() {
  return (
    <StaffGate>
      <ActivityView />
    </StaffGate>
  );
}
