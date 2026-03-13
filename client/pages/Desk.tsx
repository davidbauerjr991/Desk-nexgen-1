import { GripHorizontal } from "lucide-react";
import { useLocation } from "react-router-dom";

import { CopilotContent } from "@/components/CopilotPopunder";
import DeskDataTable from "@/components/DeskDataTable";

export default function Desk() {
  const location = useLocation();
  const isCopilotView = new URLSearchParams(location.search).get("view") === "copilot";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData("text/plain", isCopilotView ? "Copilot" : "Desk");
          event.dataTransfer.effectAllowed = "move";
        }}
        className="flex min-h-[68px] cursor-grab items-start justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
      >
        <div className="flex items-start gap-3">
          <GripHorizontal className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight text-[#333333]">{isCopilotView ? "Copilot" : "Desk"}</h3>
          </div>
        </div>
      </div>

      {isCopilotView ? <CopilotContent /> : <DeskDataTable />}
    </div>
  );
}
