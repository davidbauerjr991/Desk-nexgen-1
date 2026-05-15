import { CURRENT_AGENT_EMAIL_ID, CURRENT_AGENT_NAME } from "@/lib/agent-roster";
import { cn } from "@/lib/utils";

export type CustomerTicket = {
  customerId?: string;
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

export type TicketColumnKey = "priority" | "id" | "type" | "subject" | "status" | "agent" | "agentTeam" | "modifiedBy";

export type TicketColumn = {
  key: TicketColumnKey;
  label: string;
  minWidth: number;
  defaultWidth: number;
  renderCell: (ticket: CustomerTicket) => React.ReactNode;
};

const customerTickets: CustomerTicket[] = [
  {
    customerId: "storm-pax-1",
    id: "CASE-5001",
    priority: "Urgent",
    type: "Incident",
    subject: "MSP-ORD connecting flight canceled — family of 4 stranded",
    status: "Open",
    agent: CURRENT_AGENT_NAME,
    agentTeam: "Crisis Response",
    modifiedBy: CURRENT_AGENT_EMAIL_ID,
  },
  {
    customerId: "storm-pax-2",
    id: "CASE-5002",
    priority: "High",
    type: "Request",
    subject: "Rebooking request for VY-2847 — passenger missed connection",
    status: "Escalated",
    agent: "Priya Shah",
    agentTeam: "Rebooking Desk",
    modifiedBy: "PRIYA.SHAH",
  },
  {
    customerId: "storm-pax-3",
    id: "CASE-5003",
    priority: "Urgent",
    type: "Incident",
    subject: "Hotel accommodation needed — 3 unaccompanied minors at DTW",
    status: "Needing Attention",
    agent: "Elena Petrova",
    agentTeam: "Travel Safety",
    modifiedBy: "ELENA.PETROVA",
  },
  {
    customerId: "storm-pax-4",
    id: "CASE-5004",
    priority: "High",
    type: "Complaint",
    subject: "Refund dispute for VY-1192 Minneapolis cancellation",
    status: "In Progress",
    agent: "Sofia Ramirez",
    agentTeam: "Refunds & Claims",
    modifiedBy: "SOFIA.RAMIREZ",
  },
  {
    customerId: "storm-pax-5",
    id: "CASE-5005",
    priority: "High",
    type: "Problem",
    subject: "Baggage missing after emergency reroute through DEN",
    status: "Open",
    agent: "Marcus Lee",
    agentTeam: "Baggage Services",
    modifiedBy: "MARCUS.LEE",
  },
  {
    customerId: "storm-pax-6",
    id: "CASE-5006",
    priority: "Urgent",
    type: "Request",
    subject: "Wheelchair passenger needs accessible rebooking on VY-3301",
    status: "Escalated",
    agent: "Chris Nolan",
    agentTeam: "Guest Services",
    modifiedBy: "CHRIS.NOLAN",
  },
  {
    customerId: "storm-pax-7",
    id: "CASE-5007",
    priority: "Medium",
    type: "Question",
    subject: "Loyalty miles reinstatement after storm-canceled VY-4110 itinerary",
    status: "Pending Customer",
    agent: "Ava Thompson",
    agentTeam: "Loyalty Services",
    modifiedBy: "AVA.THOMPSON",
  },
  {
    customerId: "storm-pax-8",
    id: "CASE-5008",
    priority: "Low",
    type: "Task",
    subject: "Follow up on meal voucher distribution at MSP Gate C12",
    status: "On-Hold",
    agent: "Ben Carter",
    agentTeam: "Guest Services",
    modifiedBy: "BEN.CARTER",
  },
  {
    customerId: "storm-pax-9",
    id: "CASE-5009",
    priority: "Medium",
    type: "Request",
    subject: "Corporate group of 12 needs block rebooking MSP to LGA",
    status: "Training Rescheduled",
    agent: "Lina Park",
    agentTeam: "Flight Operations",
    modifiedBy: "LINA.PARK",
  },
  {
    customerId: "storm-pax-10",
    id: "CASE-5010",
    priority: "High",
    type: "Incident",
    subject: "Passenger medical supplies in checked bag — urgent retrieval needed",
    status: "Closed",
    agent: "Owen Brooks",
    agentTeam: "Baggage Services",
    modifiedBy: "OWEN.BROOKS",
  },
  {
    customerId: "storm-pax-11",
    id: "CASE-5011",
    priority: "Medium",
    type: "Problem",
    subject: "Duplicate charge on rebooking — VY-2847 and VY-2903 both billed",
    status: "Duplicate",
    agent: "Noah Kim",
    agentTeam: "Refunds & Claims",
    modifiedBy: "NOAH.KIM",
  },
  {
    customerId: "storm-pax-12",
    id: "CASE-5012",
    priority: "Urgent",
    type: "Complaint",
    subject: "VIP Gold member stranded 11 hours — demanding executive escalation",
    status: "De-Escalated",
    agent: "Mila Fischer",
    agentTeam: "Loyalty Services",
    modifiedBy: "MILA.FISCHER",
  },
];

export function getCustomerTickets(customerId?: string) {
  return customerId ? customerTickets.filter((ticket) => ticket.customerId === customerId) : customerTickets;
}

export function getCustomerTicketById(ticketId?: string, customerId?: string) {
  if (!ticketId) return null;

  return getCustomerTickets(customerId).find((ticket) => ticket.id === ticketId)
    ?? customerTickets.find((ticket) => ticket.id === ticketId)
    ?? null;
}

export function getRelevantCustomerTicket(customerId: string | undefined, issueContext: string) {
  const availableTickets = getCustomerTickets(customerId);

  if (availableTickets.length === 0) {
    return null;
  }

  const normalizedContext = issueContext.toLowerCase();
  const keywordMatchers: Array<{ keywords: string[]; ticketKeywords: string[] }> = [
    {
      keywords: ["billing", "payment", "zip", "declined", "retry", "charge", "upgrade"],
      ticketKeywords: ["billing", "payment", "upgrade", "checkout", "duplicate"],
    },
    {
      keywords: ["urgent", "today", "meeting", "deadline"],
      ticketKeywords: ["urgent", "vip", "open", "attention"],
    },
    {
      keywords: ["account", "security", "flag", "review", "verification"],
      ticketKeywords: ["account", "risk", "review", "security", "profile"],
    },
  ];

  for (const matcher of keywordMatchers) {
    if (!matcher.keywords.some((keyword) => normalizedContext.includes(keyword))) {
      continue;
    }

    const matchingTicket = availableTickets.find((ticket) => {
      const ticketText = `${ticket.subject} ${ticket.type} ${ticket.status} ${ticket.agentTeam}`.toLowerCase();
      return matcher.ticketKeywords.some((keyword) => ticketText.includes(keyword));
    });

    if (matchingTicket) {
      return matchingTicket;
    }
  }

  return availableTickets.find((ticket) => ["Open", "In Progress", "Pending Customer", "Needing Attention"].includes(ticket.status))
    ?? availableTickets[0];
}

export function formatNoteTimestamp(date: Date) {
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

export function getPriorityTone(priority: CustomerTicket["priority"]) {
  switch (priority) {
    case "Urgent":
      return "bg-[#E32926]";
    case "High":
      return "bg-[#FFB800]";
    case "Medium":
      return "bg-[#166CCA]";
    default:
      return "bg-[#208337]";
  }
}

export function getStatusBadgeClasses(status: CustomerTicket["status"]) {
  switch (status) {
    case "Open":
      return "border-[#24943E] bg-[#EFFBF1] text-[#208337]";
    case "Escalated":
    case "Needing Attention":
      return "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]";
    case "In Progress":
    case "Pending Customer":
    case "On-Hold":
    case "Training Rescheduled":
      return "border-[#A37A00] bg-[#FFF6E0] text-[#A37A00]";
    case "Closed":
    case "Cancelled":
    case "Duplicate":
      return "border-[#D0D5DD] bg-[#F9FAFB] text-[#667085]";
    case "De-Escalated":
      return "border-[#BFDBFE] bg-[#EBF4FD] text-[#166CCA]";
    default:
      return "border-[#24943E] bg-[#EFFBF1] text-[#208337]";
  }
}

// Note: TICKET_COLUMNS with renderCell is defined in TicketsDataGrid.tsx
// because it requires React/JSX. These constants are derived from it.

export const TICKET_COLUMN_DEFINITIONS: Omit<TicketColumn, 'renderCell'>[] = [
  { key: "priority", label: "Priority", minWidth: 120, defaultWidth: 140 },
  { key: "id", label: "Ticket Full Number", minWidth: 150, defaultWidth: 180 },
  { key: "type", label: "Type", minWidth: 120, defaultWidth: 140 },
  { key: "subject", label: "Subject", minWidth: 280, defaultWidth: 360 },
  { key: "status", label: "Status", minWidth: 180, defaultWidth: 190 },
  { key: "agent", label: "Agent", minWidth: 150, defaultWidth: 170 },
  { key: "agentTeam", label: "Agent Team", minWidth: 170, defaultWidth: 190 },
  { key: "modifiedBy", label: "Modified By", minWidth: 160, defaultWidth: 180 },
];

export const INITIAL_TICKET_COLUMN_ORDER: TicketColumnKey[] = [
  "priority",
  "id",
  "type",
  "subject",
  "status",
  "agent",
  "agentTeam",
  "modifiedBy",
];

export const INITIAL_TICKET_COLUMN_WIDTHS: Record<TicketColumnKey, number> = {
  priority: 140,
  id: 180,
  type: 140,
  subject: 360,
  status: 190,
  agent: 170,
  agentTeam: 190,
  modifiedBy: 180,
};

// TICKET_COLUMN_MAP will be created dynamically in TicketsDataGrid.tsx
// since it needs renderCell functions that require JSX

export function reorderTicketColumns(columnOrder: TicketColumnKey[], draggedKey: TicketColumnKey, targetKey: TicketColumnKey) {
  if (draggedKey === targetKey) return columnOrder;

  const nextOrder = [...columnOrder];
  const draggedIndex = nextOrder.indexOf(draggedKey);
  const targetIndex = nextOrder.indexOf(targetKey);

  if (draggedIndex === -1 || targetIndex === -1) return columnOrder;

  nextOrder.splice(draggedIndex, 1);
  nextOrder.splice(targetIndex, 0, draggedKey);

  return nextOrder;
}
