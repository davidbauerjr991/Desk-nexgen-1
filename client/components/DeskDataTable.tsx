import { useMemo, useState } from "react";
import { ChevronDown, Mail, MessageSquare, Phone, Search } from "lucide-react";

import { useLayoutContext } from "@/components/Layout";
import { getCustomerTickets } from "@/components/NotesPanel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type CustomerChannel, customerDatabase } from "@/lib/customer-database";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type DeskCustomerRow = {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  lastUpdated: string;
};

type DeskAccountRow = {
  id: string;
  accountNumber: string;
  type: string;
  holderName: string;
  balance: string;
  status: "Active" | "Inactive" | "Frozen" | "Pending";
  lastUpdated: string;
};

type DeskTab = "Customers" | "Accounts" | "Tickets";

// ─── Seed Accounts ────────────────────────────────────────────────────────────

const accountsDatabase: DeskAccountRow[] = [
  { id: "acc-001", accountNumber: "ACC-48201", type: "Checking",    holderName: "Alex Kowalski",  balance: "$12,450.00",  status: "Active",   lastUpdated: "02/23/26" },
  { id: "acc-002", accountNumber: "ACC-48202", type: "Savings",     holderName: "Alex Kowalski",  balance: "$34,720.50",  status: "Active",   lastUpdated: "02/23/26" },
  { id: "acc-003", accountNumber: "ACC-48310", type: "Investment",  holderName: "Sarah Miller",   balance: "$98,100.00",  status: "Active",   lastUpdated: "02/24/26" },
  { id: "acc-004", accountNumber: "ACC-48311", type: "Checking",    holderName: "Sarah Miller",   balance: "$5,230.75",   status: "Active",   lastUpdated: "02/24/26" },
  { id: "acc-005", accountNumber: "ACC-48420", type: "Business",    holderName: "Emily Chen",     balance: "$210,000.00", status: "Active",   lastUpdated: "02/25/26" },
  { id: "acc-006", accountNumber: "ACC-48530", type: "Checking",    holderName: "David Brown",    balance: "$8,900.20",   status: "Active",   lastUpdated: "02/26/26" },
  { id: "acc-007", accountNumber: "ACC-48531", type: "Business",    holderName: "David Brown",    balance: "$54,300.00",  status: "Frozen",   lastUpdated: "02/26/26" },
  { id: "acc-008", accountNumber: "ACC-48640", type: "Savings",     holderName: "Priya Nair",     balance: "$19,875.00",  status: "Active",   lastUpdated: "02/27/26" },
  { id: "acc-009", accountNumber: "ACC-48750", type: "Checking",    holderName: "Miguel Santos",  balance: "$3,410.60",   status: "Active",   lastUpdated: "02/28/26" },
  { id: "acc-010", accountNumber: "ACC-48751", type: "Investment",  holderName: "Miguel Santos",  balance: "$45,000.00",  status: "Inactive", lastUpdated: "02/28/26" },
  { id: "acc-011", accountNumber: "ACC-48860", type: "Trust",       holderName: "Olivia Reed",    balance: "$320,000.00", status: "Active",   lastUpdated: "03/01/26" },
  { id: "acc-012", accountNumber: "ACC-48970", type: "Checking",    holderName: "Jamal Carter",   balance: "$7,100.00",   status: "Active",   lastUpdated: "03/02/26" },
  { id: "acc-013", accountNumber: "ACC-49080", type: "Savings",     holderName: "Hannah Brooks",  balance: "$22,500.00",  status: "Active",   lastUpdated: "03/03/26" },
  { id: "acc-014", accountNumber: "ACC-49081", type: "Savings",     holderName: "Hannah Brooks",  balance: "$11,200.00",  status: "Pending",  lastUpdated: "03/03/26" },
  { id: "acc-015", accountNumber: "ACC-49190", type: "Mortgage",    holderName: "Noah Patel",     balance: "$285,000.00", status: "Active",   lastUpdated: "03/04/26" },
  { id: "acc-016", accountNumber: "ACC-49300", type: "Investment",  holderName: "Lauren Kim",     balance: "$130,450.00", status: "Active",   lastUpdated: "03/05/26" },
  { id: "acc-017", accountNumber: "ACC-49410", type: "Business",    holderName: "Ethan Zhang",    balance: "$76,200.00",  status: "Active",   lastUpdated: "03/06/26" },
  { id: "acc-018", accountNumber: "ACC-49411", type: "Checking",    holderName: "Ethan Zhang",    balance: "$4,850.00",   status: "Active",   lastUpdated: "03/06/26" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CLASSES: Record<DeskAccountRow["status"], string> = {
  Active:   "bg-[#ECFDF3] text-[#027A48]",
  Inactive: "bg-[#F2F4F7] text-[#667085]",
  Frozen:   "bg-[#EFF8FF] text-[#175CD3]",
  Pending:  "bg-[#FFFAEB] text-[#B54708]",
};

const TICKET_PRIORITY_CLASSES: Record<string, string> = {
  Urgent: "bg-[#FEF3F2] text-[#B42318]",
  High:   "bg-[#FFF4ED] text-[#B93815]",
  Medium: "bg-[#FFFAEB] text-[#B54708]",
  Low:    "bg-[#F2F4F7] text-[#667085]",
};

const TICKET_STATUS_CLASSES: Record<string, string> = {
  "Open":                "bg-[#ECFDF3] text-[#027A48]",
  "In Progress":         "bg-[#EFF8FF] text-[#175CD3]",
  "Escalated":           "bg-[#FEF3F2] text-[#B42318]",
  "Needing Attention":   "bg-[#FFF4ED] text-[#B93815]",
  "Pending Customer":    "bg-[#FFFAEB] text-[#B54708]",
  "On-Hold":             "bg-[#F2F4F7] text-[#667085]",
  "Closed":              "bg-[#F2F4F7] text-[#667085]",
  "Cancelled":           "bg-[#F2F4F7] text-[#667085]",
  "Duplicate":           "bg-[#F2F4F7] text-[#667085]",
  "De-Escalated":        "bg-[#ECFDF3] text-[#027A48]",
  "Training Rescheduled":"bg-[#F9F5FF] text-[#6941C6]",
};

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function DeskTabBar({ active, onChange }: { active: DeskTab; onChange: (t: DeskTab) => void }) {
  const tabs: DeskTab[] = ["Customers", "Accounts", "Tickets"];
  return (
    <div className="flex border-b border-black/10 bg-white">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "relative px-5 py-3 text-[13px] font-medium transition-colors",
            active === tab ? "text-[#006DAD]" : "text-[#7A7A7A] hover:text-[#333333]",
          )}
        >
          {tab}
          {active === tab && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#006DAD]" />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DeskDataTable({
  onSelectCustomer,
}: {
  onSelectCustomer?: (customerRecordId: string) => void;
}) {
  const {
    selectedAssignment,
    toggleCallPopunder,
    openCustomerConversation,
    isAgentAvailable,
    isAgentInCall,
  } = useLayoutContext();

  const [activeTab, setActiveTab] = useState<DeskTab>("Customers");
  const [searchQuery, setSearchQuery] = useState("");

  // Reset search when switching tabs
  const handleTabChange = (tab: DeskTab) => {
    setActiveTab(tab);
    setSearchQuery("");
  };

  // ── Customers ──
  const customerRows = useMemo<DeskCustomerRow[]>(
    () =>
      customerDatabase.map((customer) => {
        const [firstName = customer.name, ...lastNameParts] = customer.name.split(" ");
        return {
          id: customer.id,
          customerId: customer.customerId,
          firstName,
          lastName: lastNameParts.join(" "),
          lastUpdated: customer.lastUpdated,
        };
      }),
    [],
  );

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customerRows;
    return customerRows.filter((r) =>
      [r.customerId, r.firstName, r.lastName, `${r.firstName} ${r.lastName}`]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [customerRows, searchQuery]);

  // ── Accounts ──
  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return accountsDatabase;
    return accountsDatabase.filter((a) =>
      [a.accountNumber, a.type, a.holderName, a.status]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [searchQuery]);

  // ── Tickets ──
  const allTickets = useMemo(() => getCustomerTickets(), []);
  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allTickets;
    return allTickets.filter((t) =>
      [t.id, t.subject, t.type, t.priority, t.status, t.agent]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [allTickets, searchQuery]);

  const handleOpenChannel = (id: string, channel: Extract<CustomerChannel, "sms" | "email">) =>
    openCustomerConversation(id, channel);

  const handleStartCall = (id: string, anchorRect?: DOMRect | null) =>
    toggleCallPopunder(anchorRect, id);

  const recordCount =
    activeTab === "Customers"
      ? customerRows.length
      : activeTab === "Accounts"
        ? accountsDatabase.length
        : allTickets.length;

  const placeholder =
    activeTab === "Customers"
      ? "Search customers"
      : activeTab === "Accounts"
        ? "Search accounts"
        : "Search tickets";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F8F8F9]">
      {/* Header */}
      <div className="border-b border-black/10 bg-white px-6 pt-5 pb-0">
        <div className="pb-4">
          <h2 className="text-lg font-semibold tracking-tight text-[#111827]">{activeTab}</h2>
          <p className="mt-1 text-sm text-[#667085]">{recordCount} records</p>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
              className="h-10 rounded-full border-black/10 bg-[#F8F8F9] pl-9 text-sm text-[#111827] placeholder:text-[#98A2B3]"
            />
          </div>
        </div>
        <DeskTabBar active={activeTab} onChange={handleTabChange} />
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1">
        <ScrollArea className="h-full min-h-0">
          <div className="space-y-3 p-4">

            {/* ── Customers tab ── */}
            {activeTab === "Customers" && (
              filteredCustomers.length === 0 ? (
                <EmptyState message="No customers match your search." />
              ) : (
                filteredCustomers.map((row) => {
                  const isSelected = selectedAssignment.customerRecordId === row.id;
                  return (
                    <div
                      key={row.id}
                      className={cn(
                        "min-w-0 rounded-2xl border bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition-all",
                        isSelected
                          ? "border-[#006DAD] shadow-[0_10px_28px_rgba(0,109,173,0.14)]"
                          : "border-black/10 hover:-translate-y-0.5 hover:border-black/15 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => onSelectCustomer?.(row.id)}
                          className="flex min-w-0 flex-1 flex-col items-start rounded-xl text-left outline-none transition-colors hover:text-[#006DAD] focus-visible:ring-2 focus-visible:ring-[#006DAD]/25"
                        >
                          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#667085]">
                            {row.customerId}
                          </span>
                          <span className="mt-1 break-words text-sm font-semibold text-[#111827]">
                            {row.firstName} {row.lastName}
                          </span>
                          <span className="mt-2 text-xs text-[#667085]">
                            Updated {row.lastUpdated}
                          </span>
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-9 shrink-0 rounded-full border-black/10 bg-white px-3 text-[#333333] hover:bg-[#F8F8F9]"
                            >
                              Contact <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-44 rounded-2xl border border-black/10 bg-white p-1 shadow-[0_18px_50px_rgba(15,23,42,0.14)]"
                          >
                            <DropdownMenuItem
                              onClick={(e) => handleStartCall(row.id, e.currentTarget.getBoundingClientRect())}
                              disabled={!isAgentAvailable || isAgentInCall}
                              className="rounded-xl px-3 py-2 text-sm text-[#111827]"
                            >
                              <Phone className="mr-2 h-4 w-4" /> Call
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenChannel(row.id, "email")}
                              className="rounded-xl px-3 py-2 text-sm text-[#111827]"
                            >
                              <Mail className="mr-2 h-4 w-4" /> Email
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenChannel(row.id, "sms")}
                              className="rounded-xl px-3 py-2 text-sm text-[#111827]"
                            >
                              <MessageSquare className="mr-2 h-4 w-4" /> SMS
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })
              )
            )}

            {/* ── Accounts tab ── */}
            {activeTab === "Accounts" && (
              filteredAccounts.length === 0 ? (
                <EmptyState message="No accounts match your search." />
              ) : (
                filteredAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="min-w-0 rounded-2xl border border-black/10 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:border-black/15 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#667085]">
                            {acc.accountNumber}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              STATUS_CLASSES[acc.status],
                            )}
                          >
                            {acc.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-[#111827]">
                          {acc.holderName}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-xs text-[#667085]">{acc.type}</span>
                          <span className="text-xs font-semibold text-[#333333]">{acc.balance}</span>
                        </div>
                        <span className="mt-1.5 block text-xs text-[#98A2B3]">
                          Updated {acc.lastUpdated}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}

            {/* ── Tickets tab ── */}
            {activeTab === "Tickets" && (
              filteredTickets.length === 0 ? (
                <EmptyState message="No tickets match your search." />
              ) : (
                filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="min-w-0 rounded-2xl border border-black/10 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:border-black/15 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#667085]">
                            {ticket.id}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              TICKET_PRIORITY_CLASSES[ticket.priority] ?? "bg-[#F2F4F7] text-[#667085]",
                            )}
                          >
                            {ticket.priority}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              TICKET_STATUS_CLASSES[ticket.status] ?? "bg-[#F2F4F7] text-[#667085]",
                            )}
                          >
                            {ticket.status}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm font-semibold leading-snug text-[#111827]">
                          {ticket.subject}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-[#667085]">
                          <span>{ticket.type}</span>
                          <span className="text-[#D0D5DD]">·</span>
                          <span>{ticket.agent}</span>
                          <span className="text-[#D0D5DD]">·</span>
                          <span>{ticket.agentTeam}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}

          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-8 text-center text-sm text-[#667085]">
      {message}
    </div>
  );
}
