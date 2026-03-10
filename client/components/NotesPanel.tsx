import { useState } from "react";
import { ChevronUp, Eye, FileDown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import CustomerInfoPanel from "@/components/CustomerInfoPanel";

const TABS = ["Details", "Notes", "Accounts", "Tickets", "Directory"];
const EXTRA_TABS = ["Cases", "Tasks", "Emails", "Contacts", "History"];

const notes = [
  {
    id: 1,
    author: "John Smith",
    date: "03/22/2024 02:12:11 PM",
    preview:
      "It is a long established fact that a reader will be distracted by the readable content...",
    full: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.",
  },
  {
    id: 2,
    author: "Patrick Johnson",
    date: "03/22/2024 02:12:11 PM",
    preview:
      "Customer is requesting a mortgage but having issues with the online portal...",
    full: "Customer is requesting a mortgage but having issues with the online portal. Transferred to the mortgage team.",
  },
  {
    id: 3,
    author: "Alex Bogush",
    date: "03/22/2024 02:12:11 PM",
    preview:
      "I have to say this customer is really angry - I think we sho...",
    full: "I have to say this customer is really angry - I think we should escalate this case immediately.",
  },
  {
    id: 4,
    author: "Alex Bogush",
    date: "03/22/2024 02:12:11 PM",
    preview:
      "Talked to them again and I think we are good-to-go. Setti...",
    full: "Talked to them again and I think we are good-to-go. Setting up a follow-up call for next week.",
  },
  {
    id: 5,
    author: "Patrick Johnson",
    date: "03/22/2024 02:12:11 PM",
    preview:
      "Set up a payment plan, the customer is happy and will n...",
    full: "Set up a payment plan, the customer is happy and will not churn. Case resolved.",
  },
];

function NoteItem({ note }: { note: (typeof notes)[0] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-[rgba(0,0,0,0.08)] px-4 py-3">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-2 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-[#333]">
              {note.author}
            </span>
            <span className="text-[10px] text-[#9CA3AF]">{note.date}</span>
          </div>
          <p className="mt-0.5 text-xs text-[#6B7280] leading-relaxed">
            {expanded ? note.full : note.preview}
          </p>
        </div>
        <ChevronUp
          className={cn(
            "mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#9CA3AF] transition-transform duration-150",
            !expanded && "rotate-180",
          )}
        />
      </button>
    </div>
  );
}

export default function NotesPanel() {
  const [activeTab, setActiveTab] = useState("Notes");
  const [showMoreTabs, setShowMoreTabs] = useState(false);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center border-b border-[rgba(0,0,0,0.1)] px-1 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "relative px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap",
              activeTab === tab
                ? "text-[#6E00FD] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#6E00FD] after:rounded-t"
                : "text-[#6B7280] hover:text-[#333]",
            )}
          >
            {tab}
          </button>
        ))}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMoreTabs((v) => !v)}
            className="flex items-center gap-0.5 px-3 py-2.5 text-xs font-medium text-[#6B7280] hover:text-[#333] whitespace-nowrap"
          >
            5 More
            <ChevronDown className="h-3 w-3" />
          </button>
          {showMoreTabs && (
            <div className="absolute left-0 top-full z-10 mt-1 w-36 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white py-1 shadow-lg">
              {EXTRA_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setShowMoreTabs(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-xs text-[#333] hover:bg-[#F8F8F9]"
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes content */}
      {activeTab === "Notes" && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Notes header */}
          <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.08)] px-4 py-2.5 shrink-0">
            <span className="text-xs font-semibold text-[#333]">
              Latest Notes
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-[#6B7280] hover:text-[#333] transition-colors"
                aria-label="Export notes"
              >
                <FileDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="text-[#6B7280] hover:text-[#333] transition-colors"
                aria-label="View notes"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto">
            {notes.map((note) => (
              <NoteItem key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}

      {activeTab === "Details" && (
        <div className="flex-1 overflow-y-auto">
          <CustomerInfoPanel className="h-auto" />
        </div>
      )}

      {activeTab !== "Notes" && activeTab !== "Details" && (
        <div className="flex flex-1 items-center justify-center text-xs text-[#9CA3AF]">
          No {activeTab.toLowerCase()} to display
        </div>
      )}
    </div>
  );
}
