import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Eye, FileDown, GripVertical, Search, Ticket, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import CustomerInfoPanel from "@/components/CustomerInfoPanel";
import OverviewDashboard from "@/components/OverviewDashboard";
import { cn } from "@/lib/utils";

const TABS = ["Overview", "Details", "Accounts", "Tickets", "Recent Interactions", "Directory"];
const EXTRA_TABS = ["Cases", "Tasks", "Emails", "Contacts", "History"];
const TICKET_PAGE_SIZE = 6;

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

type CustomerTicket = {
  id: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  type: "Complaint" | "Question" | "Task" | "Incident" | "Problem" | "Request";
  subject: string;
  status:
    | "Open"
    | "Cancelled"
    | "Closed"
    | "Duplicate"
    | "Escalated"
    | "In Progress"
    | "On-Hold"
    | "Pending Customer"
    | "Needing Attention"
    | "De-Escalated"
    | "Training Rescheduled";
  agent: string;
  agentTeam: string;
  modifiedBy: string;
};

type TicketColumnKey = "priority" | "id" | "type" | "subject" | "status" | "agent" | "agentTeam" | "modifiedBy";

type TicketColumn = {
  key: TicketColumnKey;
  label: string;
  minWidth: number;
  defaultWidth: number;
  renderCell: (ticket: CustomerTicket) => ReactNode;
};

const customerTickets: CustomerTicket[] = [
  {
    id: "CASE-56",
    priority: "Medium",
    type: "Complaint",
    subject: "Test Ticket",
    status: "Open",
    agent: "David Bauer",
    agentTeam: "Digital Care",
    modifiedBy: "DAVID.BAUER",
  },
  {
    id: "CASE-84",
    priority: "High",
    type: "Incident",
    subject: "Mobile app crashes after biometric login",
    status: "Escalated",
    agent: "Priya Shah",
    agentTeam: "Authentication Ops",
    modifiedBy: "PRIYA.SHAH",
  },
  {
    id: "CASE-112",
    priority: "Low",
    type: "Question",
    subject: "Customer asked how to export monthly statements",
    status: "Pending Customer",
    agent: "Marcus Lee",
    agentTeam: "Billing Support",
    modifiedBy: "MARCUS.LEE",
  },
  {
    id: "CASE-139",
    priority: "Urgent",
    type: "Problem",
    subject: "Wire transfer locked after fraud screening review",
    status: "Needing Attention",
    agent: "Elena Petrova",
    agentTeam: "Risk Response",
    modifiedBy: "ELENA.PETROVA",
  },
  {
    id: "CASE-147",
    priority: "Medium",
    type: "Request",
    subject: "Requested address update before policy renewal",
    status: "In Progress",
    agent: "Chris Nolan",
    agentTeam: "Account Services",
    modifiedBy: "CHRIS.NOLAN",
  },
  {
    id: "CASE-163",
    priority: "High",
    type: "Complaint",
    subject: "Duplicate late fee applied to commercial account",
    status: "De-Escalated",
    agent: "Sofia Ramirez",
    agentTeam: "Enterprise Billing",
    modifiedBy: "SOFIA.RAMIREZ",
  },
  {
    id: "CASE-188",
    priority: "Low",
    type: "Task",
    subject: "Follow up with customer on document upload status",
    status: "On-Hold",
    agent: "Ben Carter",
    agentTeam: "Document Review",
    modifiedBy: "BEN.CARTER",
  },
  {
    id: "CASE-204",
    priority: "Medium",
    type: "Request",
    subject: "Reschedule onboarding training for branch admins",
    status: "Training Rescheduled",
    agent: "Lina Park",
    agentTeam: "Enablement Desk",
    modifiedBy: "LINA.PARK",
  },
  {
    id: "CASE-219",
    priority: "High",
    type: "Incident",
    subject: "Payment processor timeout during checkout confirmation",
    status: "Closed",
    agent: "Owen Brooks",
    agentTeam: "Checkout Operations",
    modifiedBy: "OWEN.BROOKS",
  },
  {
    id: "CASE-233",
    priority: "Low",
    type: "Question",
    subject: "Asked whether rewards can be pooled across accounts",
    status: "Cancelled",
    agent: "Ava Thompson",
    agentTeam: "Rewards Support",
    modifiedBy: "AVA.THOMPSON",
  },
  {
    id: "CASE-248",
    priority: "Medium",
    type: "Problem",
    subject: "Submitted claim appears twice in the case timeline",
    status: "Duplicate",
    agent: "Noah Kim",
    agentTeam: "Claims Resolution",
    modifiedBy: "NOAH.KIM",
  },
  {
    id: "CASE-271",
    priority: "Urgent",
    type: "Complaint",
    subject: "VIP customer unable to access same-day settlement funds",
    status: "Open",
    agent: "Mila Fischer",
    agentTeam: "Premier Support",
    modifiedBy: "MILA.FISCHER",
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

function getPriorityTone(priority: CustomerTicket["priority"]) {
  switch (priority) {
    case "Urgent":
      return "bg-[#F04438]";
    case "High":
      return "bg-[#F79009]";
    case "Medium":
      return "bg-[#F2C94C]";
    default:
      return "bg-[#98A2B3]";
  }
}

function getStatusBadgeClasses(status: CustomerTicket["status"]) {
  switch (status) {
    case "Open":
      return "border-[#B8D7F0] bg-[#EEF6FC] text-[#1D4E89]";
    case "Escalated":
    case "Needing Attention":
      return "border-[#FECACA] bg-[#FEF2F2] text-[#B42318]";
    case "In Progress":
    case "Pending Customer":
    case "On-Hold":
    case "Training Rescheduled":
      return "border-[#FEDF89] bg-[#FFFAEB] text-[#B54708]";
    case "Closed":
    case "Cancelled":
    case "Duplicate":
      return "border-[#D0D5DD] bg-[#F9FAFB] text-[#667085]";
    case "De-Escalated":
      return "border-[#D9CCFF] bg-[#FCFAFF] text-[#6E00FD]";
    default:
      return "border-[#ABEFC6] bg-[#ECFDF3] text-[#067647]";
  }
}

const TICKET_COLUMNS: TicketColumn[] = [
  {
    key: "priority",
    label: "Priority",
    minWidth: 120,
    defaultWidth: 140,
    renderCell: (ticket) => (
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className={cn("h-2.5 w-2.5 rounded-full", getPriorityTone(ticket.priority))} />
        <span className="font-medium text-[#344054]">{ticket.priority}</span>
      </div>
    ),
  },
  {
    key: "id",
    label: "Ticket Full Number",
    minWidth: 150,
    defaultWidth: 180,
    renderCell: (ticket) => <span className="block truncate font-medium text-[#344054]">{ticket.id}</span>,
  },
  {
    key: "type",
    label: "Type",
    minWidth: 120,
    defaultWidth: 140,
    renderCell: (ticket) => <span className="block truncate text-[#475467]">{ticket.type}</span>,
  },
  {
    key: "subject",
    label: "Subject",
    minWidth: 280,
    defaultWidth: 360,
    renderCell: (ticket) => <span className="block truncate text-[#101828]">{ticket.subject}</span>,
  },
  {
    key: "status",
    label: "Status",
    minWidth: 180,
    defaultWidth: 190,
    renderCell: (ticket) => (
      <button
        type="button"
        className={cn(
          "inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium shadow-sm",
          getStatusBadgeClasses(ticket.status),
        )}
      >
        <span className="truncate">{ticket.status}</span>
        <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
      </button>
    ),
  },
  {
    key: "agent",
    label: "Agent",
    minWidth: 150,
    defaultWidth: 170,
    renderCell: (ticket) => <span className="block truncate text-[#475467]">{ticket.agent}</span>,
  },
  {
    key: "agentTeam",
    label: "Agent Team",
    minWidth: 170,
    defaultWidth: 190,
    renderCell: (ticket) => <span className="block truncate text-[#475467]">{ticket.agentTeam}</span>,
  },
  {
    key: "modifiedBy",
    label: "Modified By",
    minWidth: 160,
    defaultWidth: 180,
    renderCell: (ticket) => <span className="block truncate text-[#475467]">{ticket.modifiedBy}</span>,
  },
];

const TICKET_COLUMN_MAP = Object.fromEntries(TICKET_COLUMNS.map((column) => [column.key, column])) as Record<
  TicketColumnKey,
  TicketColumn
>;

const INITIAL_TICKET_COLUMN_ORDER = TICKET_COLUMNS.map((column) => column.key);
const INITIAL_TICKET_COLUMN_WIDTHS = Object.fromEntries(
  TICKET_COLUMNS.map((column) => [column.key, column.defaultWidth]),
) as Record<TicketColumnKey, number>;

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

function reorderTicketColumns(columnOrder: TicketColumnKey[], draggedKey: TicketColumnKey, targetKey: TicketColumnKey) {
  if (draggedKey === targetKey) return columnOrder;

  const nextOrder = [...columnOrder];
  const draggedIndex = nextOrder.indexOf(draggedKey);
  const targetIndex = nextOrder.indexOf(targetKey);

  if (draggedIndex === -1 || targetIndex === -1) return columnOrder;

  nextOrder.splice(draggedIndex, 1);
  nextOrder.splice(targetIndex, 0, draggedKey);

  return nextOrder;
}

function TicketRecordView({ ticket }: { ticket: CustomerTicket }) {
  return (
    <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden bg-white p-4">
      <ScrollArea className="h-full min-h-0 w-full">
        <div className="space-y-4 pb-4">
          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#D9CCFF] bg-[#FCFAFF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6E00FD]">
                    <Ticket className="h-3.5 w-3.5" />
                    {ticket.id}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-medium text-[#475467]">
                    <span className={cn("h-2.5 w-2.5 rounded-full", getPriorityTone(ticket.priority))} />
                    {ticket.priority} Priority
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-[#111827]">{ticket.subject}</h3>
                <p className="mt-1 text-sm text-[#667085]">
                  {ticket.type} case owned by {ticket.agent} in {ticket.agentTeam}.
                </p>
              </div>

              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium shadow-sm",
                  getStatusBadgeClasses(ticket.status),
                )}
              >
                <span>{ticket.status}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#667085]">Ticket Details</div>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#667085]">Ticket Number</dt>
                  <dd className="font-medium text-[#111827]">{ticket.id}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#667085]">Type</dt>
                  <dd className="font-medium text-[#111827]">{ticket.type}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#667085]">Modified By</dt>
                  <dd className="font-medium text-[#111827]">{ticket.modifiedBy}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#667085]">Assigned Team</dt>
                  <dd className="font-medium text-[#111827]">{ticket.agentTeam}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#667085]">Summary</div>
              <p className="mt-4 text-sm leading-6 text-[#475467]">
                This ticket record was opened directly from the tickets table so agents can review the case without leaving the Customer
                Record. The tab can be closed with the cancel icon in the tab header at any time.
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function TicketsDataGrid({ onOpenTicket }: { onOpenTicket: (ticket: CustomerTicket) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [columnOrder, setColumnOrder] = useState<TicketColumnKey[]>(() => [...INITIAL_TICKET_COLUMN_ORDER]);
  const [columnWidths, setColumnWidths] = useState<Record<TicketColumnKey, number>>(() => ({ ...INITIAL_TICKET_COLUMN_WIDTHS }));
  const draggingColumnRef = useRef<TicketColumnKey | null>(null);
  const resizeStateRef = useRef<{
    key: TicketColumnKey;
    startX: number;
    startWidth: number;
  } | null>(null);

  const orderedColumns = useMemo(() => columnOrder.map((key) => TICKET_COLUMN_MAP[key]), [columnOrder]);

  const filteredTickets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return customerTickets;

    return customerTickets.filter((ticket) =>
      [
        ticket.priority,
        ticket.id,
        ticket.type,
        ticket.subject,
        ticket.status,
        ticket.agent,
        ticket.agentTeam,
        ticket.modifiedBy,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / TICKET_PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!resizeStateRef.current) return;

      const { key, startX, startWidth } = resizeStateRef.current;
      const minWidth = TICKET_COLUMN_MAP[key].minWidth;
      const nextWidth = Math.max(minWidth, startWidth + event.clientX - startX);

      setColumnWidths((current) =>
        current[key] === nextWidth
          ? current
          : {
              ...current,
              [key]: nextWidth,
            },
      );
    };

    const handleMouseUp = () => {
      resizeStateRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * TICKET_PAGE_SIZE;
    return filteredTickets.slice(startIndex, startIndex + TICKET_PAGE_SIZE);
  }, [currentPage, filteredTickets]);

  const totalTableWidth = useMemo(
    () => 44 + orderedColumns.reduce((total, column) => total + columnWidths[column.key], 0),
    [columnWidths, orderedColumns],
  );

  const firstVisibleTicket = filteredTickets.length === 0 ? 0 : (currentPage - 1) * TICKET_PAGE_SIZE + 1;
  const lastVisibleTicket = filteredTickets.length === 0 ? 0 : Math.min(currentPage * TICKET_PAGE_SIZE, filteredTickets.length);

  const handleColumnDrop = (targetKey: TicketColumnKey) => {
    const draggedKey = draggingColumnRef.current;
    if (!draggedKey) return;

    setColumnOrder((current) => reorderTicketColumns(current, draggedKey, targetKey));
    draggingColumnRef.current = null;
  };

  const handleResizeStart = (event: React.MouseEvent<HTMLButtonElement>, key: TicketColumnKey) => {
    event.preventDefault();
    event.stopPropagation();

    resizeStateRef.current = {
      key,
      startX: event.clientX,
      startWidth: columnWidths[key],
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(0,0,0,0.08)] px-4 py-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tickets, status, agents, or subjects"
            className="h-9 border-black/10 bg-white pl-9 text-xs text-[#111827] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#D9CCFF]"
          />
        </div>

        <div className="text-[11px] text-[#667085]">
          {filteredTickets.length} tickets · Drag headers to reorder · Drag column edges to resize
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="table-fixed text-xs text-[#344054]" style={{ minWidth: totalTableWidth }}>
          <thead>
            <tr>
              <th className="sticky top-0 z-10 w-11 border-b border-[rgba(0,0,0,0.08)] bg-[#F9FAFB] px-3 py-3 text-left" />
              {orderedColumns.map((column) => (
                <th
                  key={column.key}
                  style={{ width: columnWidths[column.key], minWidth: column.minWidth }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleColumnDrop(column.key)}
                  className="group sticky top-0 z-10 border-b border-[rgba(0,0,0,0.08)] bg-[#F9FAFB] px-3 py-3 text-left align-middle"
                >
                  <div
                    draggable
                    onDragStart={() => {
                      draggingColumnRef.current = column.key;
                    }}
                    onDragEnd={() => {
                      draggingColumnRef.current = null;
                    }}
                    className="flex cursor-grab items-center gap-2 pr-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085] active:cursor-grabbing"
                  >
                    <span className="truncate">{column.label}</span>
                    <GripVertical className="h-3.5 w-3.5 flex-shrink-0 text-[#98A2B3]" />
                  </div>
                  <button
                    type="button"
                    aria-label={`Resize ${column.label}`}
                    onMouseDown={(event) => handleResizeStart(event, column.key)}
                    className="absolute inset-y-0 right-0 w-2 cursor-col-resize bg-transparent transition-colors hover:bg-[#D9CCFF]/60 focus-visible:outline-none"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedTickets.length > 0 ? (
              paginatedTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => onOpenTicket(ticket)}
                  className="cursor-pointer border-b border-[rgba(0,0,0,0.08)] bg-white transition-colors hover:bg-[#FCFCFD]"
                >
                  <td className="w-11 px-3 py-3 align-middle text-[#98A2B3]">
                    <ChevronRight className="h-4 w-4" />
                  </td>
                  {orderedColumns.map((column) => (
                    <td
                      key={column.key}
                      style={{ width: columnWidths[column.key], minWidth: column.minWidth }}
                      className="px-3 py-3 align-middle"
                    >
                      <div className="min-w-0">{column.renderCell(ticket)}</div>
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={orderedColumns.length + 1} className="px-4 py-12 text-center text-sm text-[#98A2B3]">
                  No tickets match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(0,0,0,0.08)] px-4 py-3 text-xs text-[#667085]">
        <div>
          Showing {firstVisibleTicket}-{lastVisibleTicket} of {filteredTickets.length} tickets
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-8 rounded-lg px-3 text-xs"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="min-w-[84px] text-center text-[#475467]">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            className="h-8 rounded-lg px-3 text-xs"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
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
  const [openTickets, setOpenTickets] = useState<CustomerTicket[]>([]);
  const [moreMenuPosition, setMoreMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const moreMenuButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setActiveTab(notesOnly ? "Notes" : initialTab);
  }, [initialTab, notesOnly]);

  useEffect(() => {
    if (addNoteTrigger === 0) return;

    setActiveTab("Notes");
    setIsComposerOpen(true);
  }, [addNoteTrigger]);

  useEffect(() => {
    if (!showMoreTabs) return;

    const updateMoreMenuPosition = () => {
      const rect = moreMenuButtonRef.current?.getBoundingClientRect();
      if (!rect) return;

      setMoreMenuPosition({
        left: rect.left,
        top: rect.bottom + 4,
      });
    };

    updateMoreMenuPosition();
    window.addEventListener("resize", updateMoreMenuPosition);
    window.addEventListener("scroll", updateMoreMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMoreMenuPosition);
      window.removeEventListener("scroll", updateMoreMenuPosition, true);
    };
  }, [showMoreTabs]);

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

  const activeTicket = openTickets.find((ticket) => ticket.id === activeTab) ?? null;

  const handleOpenTicket = (ticket: CustomerTicket) => {
    setOpenTickets((current) => (current.some((openTicket) => openTicket.id === ticket.id) ? current : [...current, ticket]));
    setActiveTab(ticket.id);
  };

  const handleCloseTicketTab = (ticketId: string) => {
    setOpenTickets((current) => {
      const nextTickets = current.filter((ticket) => ticket.id !== ticketId);

      setActiveTab((currentTab) => {
        if (currentTab !== ticketId) return currentTab;
        return nextTickets[nextTickets.length - 1]?.id ?? "Tickets";
      });

      return nextTickets;
    });
  };

  return (
    <div className="flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden">
      {!notesOnly && (
        <>
          <div className="shrink-0 border-b border-[rgba(0,0,0,0.1)] px-1">
            <div className="overflow-x-auto overflow-y-hidden">
              <div className="flex min-w-max items-center">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "relative whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-colors",
                    activeTab === tab
                      ? "text-[#6E00FD] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-t after:bg-[#6E00FD]"
                      : "text-[#6B7280] hover:text-[#333]",
                  )}
                >
                  {tab}
                </button>
              ))}
              <div>
                <button
                  ref={moreMenuButtonRef}
                  type="button"
                  onClick={() => {
                    if (!showMoreTabs) {
                      const rect = moreMenuButtonRef.current?.getBoundingClientRect();
                      if (rect) {
                        setMoreMenuPosition({
                          left: rect.left,
                          top: rect.bottom + 4,
                        });
                      }
                    }
                    setShowMoreTabs((value) => !value);
                  }}
                  className="flex items-center gap-0.5 whitespace-nowrap px-3 py-2.5 text-xs font-medium text-[#6B7280] hover:text-[#333]"
                >
                  5 More
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              {openTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setActiveTab(ticket.id)}
                  className={cn(
                    "relative ml-1 flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-colors",
                    activeTab === ticket.id
                      ? "text-[#6E00FD] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-t after:bg-[#6E00FD]"
                      : "text-[#6B7280] hover:text-[#333]",
                  )}
                >
                  <Ticket className="h-4 w-4 flex-shrink-0 text-[#111827]" />
                  <span className="max-w-[180px] truncate">{ticket.id}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCloseTicketTab(ticket.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        handleCloseTicketTab(ticket.id);
                      }
                    }}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#CBD5E1] text-[#F8FAFC] transition-colors hover:bg-[#94A3B8]"
                    aria-label={`Close ${ticket.id}`}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </button>
              ))}
              </div>
            </div>
          </div>

          {showMoreTabs && moreMenuPosition ? (
            <div
              className="fixed z-20 w-36 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white py-1 shadow-lg"
              style={{ left: moreMenuPosition.left, top: moreMenuPosition.top }}
            >
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
          ) : null}
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
            <div className="flex shrink-0 items-center justify-between border-b border-[rgba(0,0,0,0.08)] px-4 py-2.5">
              <span className="text-xs font-semibold text-[#333]">Latest Notes</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-[#6B7280] transition-colors hover:text-[#333]"
                  aria-label="Export notes"
                >
                  <FileDown className="h-4 w-4" />
                </button>
                <button type="button" className="text-[#6B7280] transition-colors hover:text-[#333]" aria-label="View notes">
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
        <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden p-4">
          <div className="min-h-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full min-h-0 w-full">
              <OverviewDashboard />
            </ScrollArea>
          </div>
        </div>
      )}

      {activeTab === "Details" && (
        <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden">
          <CustomerInfoPanel className="h-full" />
        </div>
      )}

      {activeTab === "Tickets" && <TicketsDataGrid onOpenTicket={handleOpenTicket} />}

      {activeTicket && <TicketRecordView ticket={activeTicket} />}

      {activeTab !== "Notes" && activeTab !== "Overview" && activeTab !== "Details" && activeTab !== "Tickets" && !activeTicket && (
        <div className="flex flex-1 items-center justify-center text-xs text-[#9CA3AF]">
          No {activeTab.toLowerCase()} to display
        </div>
      )}
    </div>
  );
}
