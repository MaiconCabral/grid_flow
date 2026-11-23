import type { Metadata } from "next";
import { ApprovalView } from "@/components/approval/approval-view";

export const metadata: Metadata = {
  title: "Piece",
};

export default function PiecePage() {
  return <ApprovalView />;
}
