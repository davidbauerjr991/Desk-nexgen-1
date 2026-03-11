import { useEffect, useState } from "react";
import { Eye, FileDown, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import CustomerInfoPanel from "@/components/CustomerInfoPanel";

const TABS = ["Details", "Accounts", "Tickets", "Directory"];
const EXTRA_TABS = ["Cases", "Tasks", "Emails", "Contacts", "History"];

export const NOTES_PANEL_MENU_ITEMS = [...TABS, ...EXTRA_TABS];

const DEFAULT_NOTE_AGENT = {
  name: "Jordan Doe",
  id: "AGT-10984",
};

const initialNotes = [
  {
    id: 1,
    agentName: "John Smith",
    agentId: "AGT-10482",
    createdAt: "03/22/2024 02:12:11 PM",
    body: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.",
  },
  {
    id: 2,
    agentName: "Patrick Johnson",
    agentId: "AGT-11247",
    createdAt: "03/22/2024 02:12:11 PM",
    body: "Customer is requesting a mortgage but having issues with the online portal. Transferred to the mortgage team.",
  },
  {
    id: 3,
    agentName: "Alex Bogush",
    agentId: "AGT-11803",
    createdAt: "03/22/2024 02:12:11 PM",
    body: "I have to say this customer is really angry - I think we should escalate this case immediately.",
  },
  {
    id: 4,
    agentName: "Alex Bogush",
    agentId: "AGT-11803",
    createdAt: "03/22/2024 02:12:11 PM",
    body: "Talked to them again and I think we are good-to-go. Setting up a follow-up call for next week.",
  },
  {
    id: 5,
    agentName: "Patrick Johnson",
    agentId: "AGT-11247",
    createdAt: "03/22/2024 02:12:11 PM",
    body: "Set up a payment plan, the customer is happy and will not churn. Case resolved.",
  },
];

function formatNoteTimestamp(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours();
  const hours12 = hours % 12 || 12;
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const seconds = `${date.getSeconds()}`.padStart(2, "0");
  const meridiem = hours >= 12 ? "PM" : "AM";

  return `${month}/${day}/${year} ${hours12.toString().padStart(2, "0")}:${minutes}:${seconds} ${meridiem}`;
}

function NoteItem({ note }: { note: (typeof initialNotes)[0] }) {
  const initials = note.agentName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="rounded-xl border border-black/[0.06] bg-white px-3 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors hover:border-[#D9CCFF] hover:bg-[#FCFAFF]">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#F8F8F9] text-[11px] font-semibold text-[#6E00FD]">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-semibold leading-5 text-[#333333]">{note.createdAt}</div>
          <div className="mt-2 flex items-center gap-2 text-[12px] leading-5 text-[#6B7280]">
            <span className="truncate font-medium text-[#333333]">{note.agentName}</span>
            <span className="flex-shrink-0 text-[#C0C4CC]">•</span>
            <span className="flex-shrink-0 text-[#6B7280]">{note.agentId}</span>
          </div>
          <p className="mt-1 text-[12px] leading-5 text-[#6B7280]">{note.body}</p>
        </div>
      </div>
    </div>
  );
}

interface NotesPanelProps {
  initialTab?: string;
  notesOnly?: boolean;
  addNoteTrigger?: number;
}

export default function NotesPanel({
  initialTab = "Details",
  notesOnly = false,
  addNoteTrigger = 0,
}: NotesPanelProps) {
  const [activeTab, setActiveTab] = useState(notesOnly ? "Notes" : initialTab);
  const [showMoreTabs, setShowMoreTabs] = useState(false);
  const [notesData, setNotesData] = useState(initialNotes);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    setActiveTab(notesOnly ? "Notes" : initialTab);
  }, [initialTab, notesOnly]);

  useEffect(() => {
    if (addNoteTrigger === 0) return;

    setActiveTab("Notes");
    setIsComposerOpen(true);
  }, [addNoteTrigger]);

  const handleSaveNote = () => {
    const nextBody = noteDraft.trim();
    if (!nextBody) return;

    setNotesData((current) => [
      {
        id: Date.now(),
        agentName: DEFAULT_NOTE_AGENT.name,
        agentId: DEFAULT_NOTE_AGENT.id,
        createdAt: formatNoteTimestamp(new Date()),
        body: nextBody,
      },
      ...current,
    ]);
    setNoteDraft("");
    setIsComposerOpen(false);
  };

  const handleCancelNote = () => {
    setNoteDraft("");
    setIsComposerOpen(false);
  };

  return (
    <div className="flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden">
      {!notesOnly && (
        <>
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
        </>
      )}

      {activeTab === "Notes" && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {notesOnly ? (
            <div className="border-b border-border bg-background/50 px-5 py-4">
              <div className="flex items-center gap-1 text-sm font-semibold tracking-tight text-[#333333]">
                <span>Notes</span>
              </div>
              <div className="mt-0.5 text-xs text-[#6B7280]">Alex Kowalski</div>
            </div>
          ) : (
            <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.08)] px-4 py-2.5 shrink-0">
              <span className="text-xs font-semibold text-[#333]">Latest Notes</span>
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
          )}

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-3 pb-2">
              {isComposerOpen && (
                <div className="rounded-xl border border-[#D9CCFF] bg-[#FCFAFF] p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                  <div className="text-[12px] font-semibold leading-5 text-[#333333]">New Note</div>
                  <div className="mt-1 flex items-center gap-2 text-[12px] leading-5 text-[#6B7280]">
                    <span className="font-medium text-[#333333]">{DEFAULT_NOTE_AGENT.name}</span>
                    <span className="text-[#C0C4CC]">•</span>
                    <span>{DEFAULT_NOTE_AGENT.id}</span>
                  </div>
                  <Textarea
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    placeholder="Add a note"
                    className="mt-3 min-h-[112px] resize-none border-black/10 bg-white text-sm text-[#333333] placeholder:text-[#9CA3AF] focus-visible:border-[#C9B8FF] focus-visible:ring-0 focus-visible:shadow-[inset_0_0_0_1px_#D9CCFF]"
                  />
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button type="button" variant="outline" className="h-8 rounded-lg px-3" onClick={handleCancelNote}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="h-8 rounded-lg bg-[#6E00FD] px-3 hover:bg-[#5B00D1] disabled:bg-[#D9CCFF]"
                      onClick={handleSaveNote}
                      disabled={!noteDraft.trim()}
                    >
                      Save note
                    </Button>
                  </div>
                </div>
              )}

              {notesData.map((note) => (
                <NoteItem key={note.id} note={note} />
              ))}
            </div>
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
