import { GripHorizontal, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import AddPanelContent from "@/components/AddPanelContent";
import { CopilotContent } from "@/components/CopilotPopunder";
import { useLayoutContext } from "@/components/Layout";
import DeskDataTable from "@/components/DeskDataTable";
import NotesPanel from "@/components/NotesPanel";

export default function Desk() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedAssignment, undockDeskPanel } = useLayoutContext();
  const view = new URLSearchParams(location.search).get("view");
  const isCopilotView = view === "copilot";
  const isNotesView = view === "notes";
  const isAddView = view === "add";
  const isCustomerView = view === "customer";
  const panelLabel = isCopilotView
    ? "Copilot"
    : isNotesView
      ? "Notes"
      : isAddView
        ? "Add"
        : isCustomerView
          ? "Customer Information"
          : "Desk";
  const panelView = isCopilotView
    ? "copilot"
    : isNotesView
      ? "notes"
      : isAddView
        ? "add"
        : isCustomerView
          ? "customer"
          : "desk";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div
        onMouseDown={(event) => undockDeskPanel(panelView, event)}
        className="flex min-h-[68px] cursor-grab items-start justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
      >
        <div className="flex items-start gap-3">
          <GripHorizontal className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight text-[#333333]">{panelLabel}</h3>
          </div>
        </div>

        <button
          type="button"
          aria-label={`Close ${panelLabel} container`}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => navigate("/activity", { state: { hideMainCanvasPanel: true } })}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {isCopilotView
        ? <CopilotContent />
        : isNotesView
          ? <NotesPanel notesOnly />
          : isAddView
            ? <AddPanelContent />
            : isCustomerView
              ? <NotesPanel customerId={selectedAssignment.customerId} />
              : <DeskDataTable />}
    </div>
  );
}
