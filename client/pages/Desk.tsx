import { Bell, GripHorizontal, X } from "lucide-react";
import { useLocation } from "react-router-dom";

import AddPanelContent from "@/components/AddPanelContent";
import { CopilotContent } from "@/components/CopilotPopunder";
import { useLayoutContext } from "@/components/Layout";
import DeskDataTable from "@/components/DeskDataTable";
import NotesPanel from "@/components/NotesPanel";

import Placeholder from "./Placeholder";

export default function Desk() {
  const location = useLocation();
  const { closeAppSpacePanel, selectedAssignment, undockDeskPanel } = useLayoutContext();
  const view = new URLSearchParams(location.search).get("view");
  const isCopilotView = view === "copilot";
  const isNotesView = view === "notes";
  const isAddView = view === "add";
  const isCustomerView = view === "customer";
  const isNotificationsView = view === "notifications";
  const panelLabel = isCopilotView
    ? "Copilot"
    : isNotesView
      ? "Notes"
      : isAddView
        ? "Add"
        : isCustomerView
          ? "Customer Information"
          : isNotificationsView
            ? "Notifications"
            : "Desk";
  const panelView = isCopilotView
    ? "copilot"
    : isNotesView
      ? "notes"
      : isAddView
        ? "add"
        : isCustomerView
          ? "customer"
          : isNotificationsView
            ? "notifications"
            : "desk";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div
        data-desk-panel-header
        className="flex min-h-[68px] items-start justify-between gap-3 border-b border-border bg-background/50 px-5 py-4"
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            aria-label={`Undock ${panelLabel} panel`}
            onMouseDown={(event) => undockDeskPanel(panelView, event)}
            className="mt-0.5 flex h-6 w-6 flex-shrink-0 cursor-grab items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333] active:cursor-grabbing"
          >
            <GripHorizontal className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight text-[#333333]">{panelLabel}</h3>
          </div>
        </div>

        <button
          type="button"
          aria-label={`Close ${panelLabel} container`}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={closeAppSpacePanel}
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
              : isNotificationsView
                ? (
                  <Placeholder
                    title="Notifications"
                    description="Review alerts, workflow updates, and queue notices alongside the current conversation."
                    icon={Bell}
                  />
                )
                : <DeskDataTable />}
    </div>
  );
}
