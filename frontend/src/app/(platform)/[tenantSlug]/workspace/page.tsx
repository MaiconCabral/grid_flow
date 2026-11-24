import type { Metadata } from "next";
import { StaffGate } from "@/components/client/staff-gate";
import { WorkspaceView } from "@/components/workspace/workspace-view";

export const metadata: Metadata = {
  title: "Workspace",
};

export default function WorkspacePage() {
  return (
    <StaffGate>
      <WorkspaceView />
    </StaffGate>
  );
}
