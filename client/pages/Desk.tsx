import { GripHorizontal, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { CopilotContent } from "@/components/CopilotPopunder";
import DeskDataTable from "@/components/DeskDataTable";

export default function Desk() {
  const location = useLocation();
  const navigate = useNavigate();
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

        <button
          type="button"
          aria-label={`Close ${isCopilotView ? "Copilot" : "Desk"} container`}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => navigate("/activity")}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {isCopilotView ? <CopilotContent /> : <DeskDataTable />}
    </div>
  );
}
