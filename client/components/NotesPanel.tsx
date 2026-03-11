import { useEffect, useState } from "react";
import { Eye, FileDown, ChevronDown, ArrowUpRight, Bot, Clock3, Sparkles, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CustomerOverviewCard } from "@/components/CustomerInfoPanel";

const TABS = ["Overview", "Accounts", "Tickets", "Directory"];
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

const overviewSummaryBullets = [
  "Billing mismatch and zip-code verification triggered the latest payment block during the upgrade attempt.",
  "Customer shows strong product intent and remains engaged across SMS, chat, and email despite repeated failures.",
  "Best next action is to confirm the hold is cleared, guide a fresh retry, and monitor for one more payment event.",
];

const overviewTimeline = [
  {
    id: 1,
    title: "Upgrade retry blocked",
    timestamp: "Today · 10:26 AM",
    detail: "Card was declined again after billing verification failed on the Pro upgrade flow.",
    tone: "critical",
  },
  {
    id: 2,
    title: "Agent responded on SMS",
    timestamp: "Today · 10:25 AM",
    detail: "Agent acknowledged the issue and started reviewing payment security flags.",
    tone: "info",
  },
  {
    id: 3,
    title: "Customer opened live chat",
    timestamp: "Today · 10:24 AM",
    detail: "Customer reported the checkout failure from the pricing page and requested immediate help.",
    tone: "default",
  },
  {
    id: 4,
    title: "Security rule triggered",
    timestamp: "Today · 10:23 AM",
    detail: "Fraud rule flagged a mismatch between billing zip and stored payment profile details.",
    tone: "warning",
  },
];

const recentTickets = [
  {
    id: "TCK-2091",
    title: "Pro plan upgrade blocked by billing mismatch",
    status: "Open",
    priority: "High",
    updatedAt: "2 min ago",
  },
  {
    id: "TCK-1984",
    title: "Payment profile review requested",
    status: "Pending",
    priority: "Medium",
    updatedAt: "Yesterday",
  },
  {
    id: "TCK-1877",
    title: "Subscription renewal confirmation",
    status: "Resolved",
    priority: "Low",
    updatedAt: "Mar 6",
  },
  {
    id: "TCK-1812",
    title: "Two-factor code delivery issue",
    status: "Resolved",
    priority: "Medium",
    updatedAt: "Mar 1",
  },
  {
    id: "TCK-1759",
    title: "Invoice address correction",
    status: "Closed",
    priority: "Low",
    updatedAt: "Feb 21",
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

function OverviewSummaryCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#D9CCFF] bg-[linear-gradient(135deg,#FCFAFF_0%,#F7F3FF_100%)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E9DFFF] bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6E00FD]">
            <Sparkles className="h-3.5 w-3.5" />
            AI Auto Summary
          </div>
          <h3 className="mt-3 text-base font-semibold tracking-tight text-[#1F2937]">Alex is likely to convert if the billing hold is cleared in-session.</h3>
          <p className="mt-2 max-w-xl text-[13px] leading-5 text-[#6B7280]">
            The account shows healthy payment history and repeated intent to upgrade. Current friction is operational rather than churn-related.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:min-w-[220px]">
          <div className="rounded-xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[#8B5CF6]">Intent</div>
            <div className="mt-1 text-[13px] font-semibold text-[#1F2937]">High to upgrade</div>
          </div>
          <div className="rounded-xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[#8B5CF6]">Risk</div>
            <div className="mt-1 text-[13px] font-semibold text-[#1F2937]">Medium friction</div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-t border-[#E9DFFF] bg-white/60 px-4 py-4 lg:grid-cols-3">
        {overviewSummaryBullets.map((item) => (
          <div key={item} className="rounded-xl border border-white bg-white px-4 py-3 text-[13px] leading-5 text-[#4B5563] shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#6E00FD]">
              <Bot className="h-3.5 w-3.5" />
              Insight
            </div>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewTimelineCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
        <div>
          <div className="text-[13px] font-semibold tracking-tight text-[#333333]">Interaction timeline</div>
          <div className="mt-0.5 text-[11px] text-[#6B7280]">Latest events across channels</div>
        </div>
        <Clock3 className="h-4 w-4 text-[#7A7A7A]" />
      </div>

      <div className="px-5 py-4">
        <div className="space-y-4">
          {overviewTimeline.map((item, index) => (
            <div key={item.id} className="relative flex gap-3 pl-6">
              {index < overviewTimeline.length - 1 && (
                <span className="absolute left-[7px] top-6 h-[calc(100%+8px)] w-px bg-black/10" />
              )}
              <span
                className={cn(
                  "absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm",
                  item.tone === "critical" && "bg-[#F04438]",
                  item.tone === "warning" && "bg-[#F59E0B]",
                  item.tone === "info" && "bg-[#6E00FD]",
                  item.tone === "default" && "bg-[#CBD5E1]",
                )}
              />
              <div className="min-w-0 rounded-xl bg-[#F8F8F9] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[13px] font-semibold text-[#333333]">{item.title}</div>
                  <div className="text-[11px] text-[#6B7280]">{item.timestamp}</div>
                </div>
                <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TicketListCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
        <div>
          <div className="text-[13px] font-semibold tracking-tight text-[#333333]">Last 5 tickets</div>
          <div className="mt-0.5 text-[11px] text-[#6B7280]">Recent customer support cases</div>
        </div>
        <Ticket className="h-4 w-4 text-[#7A7A7A]" />
      </div>

      <div className="px-5 py-3">
        <div className="space-y-2">
          {recentTickets.map((ticket) => (
            <div key={ticket.id} className="rounded-xl border border-black/[0.06] bg-[#FCFCFD] px-4 py-3 transition-colors hover:border-[#D9CCFF] hover:bg-[#FCFAFF]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6E00FD]">{ticket.id}</span>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                        ticket.status === "Open" && "border-[#FECACA] bg-[#FEF2F2] text-[#B42318]",
                        ticket.status === "Pending" && "border-[#FEDF89] bg-[#FFFAEB] text-[#B54708]",
                        ticket.status === "Resolved" && "border-[#ABEFC6] bg-[#ECFDF3] text-[#067647]",
                        ticket.status === "Closed" && "border-black/10 bg-white text-[#6B7280]",
                      )}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <div className="mt-1 text-[13px] font-medium text-[#333333]">{ticket.title}</div>
                  <div className="mt-1 text-[11px] text-[#6B7280]">Priority: {ticket.priority} · Updated {ticket.updatedAt}</div>
                </div>
                <ArrowUpRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#9CA3AF]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OverviewDashboard() {
  return (
    <div className="space-y-4 pb-4">
      <OverviewSummaryCard />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <div className="space-y-4">
          <CustomerOverviewCard />
          <OverviewTimelineCard />
        </div>
        <div>
          <TicketListCard />
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
  initialTab = "Overview",
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

      {activeTab === "Overview" && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
          <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-black/[0.08] bg-[#F8F8F9] p-3">
            <OverviewDashboard />
          </div>
        </div>
      )}

      {activeTab !== "Notes" && activeTab !== "Overview" && (
        <div className="flex flex-1 items-center justify-center text-xs text-[#9CA3AF]">
          No {activeTab.toLowerCase()} to display
        </div>
      )}
    </div>
  );
}
