import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Mail, MessageSquare, Phone, Search, SlidersHorizontal, X } from "lucide-react";

import { useLayoutContext } from "@/components/layout-context";
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
  agent: string;
  aum: number; // parsed numeric AUM for filtering
};

type DeskAccountRow = {
  id: string;
  accountNumber: string;
  type: string;
  holderName: string;
  balance: string;
  balanceNum: number; // parsed numeric balance for filtering
  status: "Active" | "Inactive" | "Frozen" | "Pending";
  lastUpdated: string;
};

type DeskTab = "Customers" | "Accounts" | "Tickets";

type FilterKey = "paymentBalance" | "agent" | "agentTeam";
type ActiveFilters = Record<FilterKey, string[]>;

const EMPTY_FILTERS: ActiveFilters = { paymentBalance: [], agent: [], agentTeam: [] };

// ─── Balance helpers ──────────────────────────────────────────────────────────

function parseBalance(str: string): number {
  return parseFloat(str.replace(/[$,]/g, "")) || 0;
}

// Buckets for customer AUM
const CUSTOMER_BALANCE_BUCKETS = [
  { label: "Under $500K",  test: (n: number) => n < 500_000 },
  { label: "$500K – $1M",  test: (n: number) => n >= 500_000 && n < 1_000_000 },
  { label: "Over $1M",     test: (n: number) => n >= 1_000_000 },
];

// Buckets for account balance
const ACCOUNT_BALANCE_BUCKETS = [
  { label: "Under $10K",   test: (n: number) => n < 10_000 },
  { label: "$10K – $50K",  test: (n: number) => n >= 10_000 && n < 50_000 },
  { label: "$50K – $100K", test: (n: number) => n >= 50_000 && n < 100_000 },
  { label: "Over $100K",   test: (n: number) => n >= 100_000 },
];

function getBalanceBucket(n: number, buckets: typeof CUSTOMER_BALANCE_BUCKETS) {
  return buckets.find((b) => b.test(n))?.label ?? null;
}

// ─── Seed Accounts ────────────────────────────────────────────────────────────

const accountsDatabase: DeskAccountRow[] = [
  { id: "acc-001", accountNumber: "ACC-48201", type: "Checking",    holderName: "Alex Kowalski",  balance: "$12,450.00",  balanceNum: 12450,   status: "Active",   lastUpdated: "02/23/26" },
  { id: "acc-002", accountNumber: "ACC-48202", type: "Savings",     holderName: "Alex Kowalski",  balance: "$34,720.50",  balanceNum: 34720,   status: "Active",   lastUpdated: "02/23/26" },
  { id: "acc-003", accountNumber: "ACC-48310", type: "Investment",  holderName: "Sarah Miller",   balance: "$98,100.00",  balanceNum: 98100,   status: "Active",   lastUpdated: "02/24/26" },
  { id: "acc-004", accountNumber: "ACC-48311", type: "Checking",    holderName: "Sarah Miller",   balance: "$5,230.75",   balanceNum: 5230,    status: "Active",   lastUpdated: "02/24/26" },
  { id: "acc-005", accountNumber: "ACC-48420", type: "Business",    holderName: "Emily Chen",     balance: "$210,000.00", balanceNum: 210000,  status: "Active",   lastUpdated: "02/25/26" },
  { id: "acc-006", accountNumber: "ACC-48530", type: "Checking",    holderName: "David Brown",    balance: "$8,900.20",   balanceNum: 8900,    status: "Active",   lastUpdated: "02/26/26" },
  { id: "acc-007", accountNumber: "ACC-48531", type: "Business",    holderName: "David Brown",    balance: "$54,300.00",  balanceNum: 54300,   status: "Frozen",   lastUpdated: "02/26/26" },
  { id: "acc-008", accountNumber: "ACC-48640", type: "Savings",     holderName: "Priya Nair",     balance: "$19,875.00",  balanceNum: 19875,   status: "Active",   lastUpdated: "02/27/26" },
  { id: "acc-009", accountNumber: "ACC-48750", type: "Checking",    holderName: "Miguel Santos",  balance: "$3,410.60",   balanceNum: 3410,    status: "Active",   lastUpdated: "02/28/26" },
  { id: "acc-010", accountNumber: "ACC-48751", type: "Investment",  holderName: "Miguel Santos",  balance: "$45,000.00",  balanceNum: 45000,   status: "Inactive", lastUpdated: "02/28/26" },
  { id: "acc-011", accountNumber: "ACC-48860", type: "Trust",       holderName: "Olivia Reed",    balance: "$320,000.00", balanceNum: 320000,  status: "Active",   lastUpdated: "03/01/26" },
  { id: "acc-012", accountNumber: "ACC-48970", type: "Checking",    holderName: "Jamal Carter",   balance: "$7,100.00",   balanceNum: 7100,    status: "Active",   lastUpdated: "03/02/26" },
  { id: "acc-013", accountNumber: "ACC-49080", type: "Savings",     holderName: "Hannah Brooks",  balance: "$22,500.00",  balanceNum: 22500,   status: "Active",   lastUpdated: "03/03/26" },
  { id: "acc-014", accountNumber: "ACC-49081", type: "Savings",     holderName: "Hannah Brooks",  balance: "$11,200.00",  balanceNum: 11200,   status: "Pending",  lastUpdated: "03/03/26" },
  { id: "acc-015", accountNumber: "ACC-49190", type: "Mortgage",    holderName: "Noah Patel",     balance: "$285,000.00", balanceNum: 285000,  status: "Active",   lastUpdated: "03/04/26" },
  { id: "acc-016", accountNumber: "ACC-49300", type: "Investment",  holderName: "Lauren Kim",     balance: "$130,450.00", balanceNum: 130450,  status: "Active",   lastUpdated: "03/05/26" },
  { id: "acc-017", accountNumber: "ACC-49410", type: "Business",    holderName: "Ethan Zhang",    balance: "$76,200.00",  balanceNum: 76200,   status: "Active",   lastUpdated: "03/06/26" },
  { id: "acc-018", accountNumber: "ACC-49411", type: "Checking",    holderName: "Ethan Zhang",    balance: "$4,850.00",   balanceNum: 4850,    status: "Active",   lastUpdated: "03/06/26" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CLASSES: Record<DeskAccountRow["status"], string> = {
  Active:   "bg-[#EFFBF1] text-[#208337]",
  Inactive: "bg-[#F2F4F7] text-[#667085]",
  Frozen:   "bg-[#EFF8FF] text-[#175CD3]",
  Pending:  "bg-[#FFF6E0] text-[#A37A00]",
};

const TICKET_PRIORITY_CLASSES: Record<string, string> = {
  Urgent: "bg-[#FDEAEA] text-[#C71D1A]",
  High:   "bg-[#FFF4ED] text-[#B93815]",
  Medium: "bg-[#FFF6E0] text-[#A37A00]",
  Low:    "bg-[#F2F4F7] text-[#667085]",
};

const TICKET_STATUS_CLASSES: Record<string, string> = {
  "Open":                "bg-[#EFFBF1] text-[#208337]",
  "In Progress":         "bg-[#EFF8FF] text-[#175CD3]",
  "Escalated":           "bg-[#FDEAEA] text-[#C71D1A]",
  "Needing Attention":   "bg-[#FFF4ED] text-[#B93815]",
  "Pending Customer":    "bg-[#FFF6E0] text-[#A37A00]",
  "On-Hold":             "bg-[#F2F4F7] text-[#667085]",
  "Closed":              "bg-[#F2F4F7] text-[#667085]",
  "Cancelled":           "bg-[#F2F4F7] text-[#667085]",
  "Duplicate":           "bg-[#F2F4F7] text-[#667085]",
  "De-Escalated":        "bg-[#EFFBF1] text-[#208337]",
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
            active === tab ? "text-[#6E56CF]" : "text-[#7A7A7A] hover:text-[#333333]",
          )}
        >
          {tab}
          {active === tab && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#6E56CF]" />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Filter dropdown ──────────────────────────────────────────────────────────

type FilterSection = {
  key: FilterKey;
  label: string;
  options: string[];
};

function FilterDropdown({
  sections,
  activeFilters,
  onToggle,
  onClearAll,
  onClose,
}: {
  sections: FilterSection[];
  activeFilters: ActiveFilters;
  onToggle: (key: FilterKey, value: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const totalActive = Object.values(activeFilters).reduce((s, v) => s + v.length, 0);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-border bg-white shadow-[0_8px_24px_rgba(16,24,40,0.12)] overflow-hidden"
    >
      {/* Dropdown header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-[12px] font-semibold text-[#333333]">Filters</span>
        {totalActive > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] font-medium text-[#6E56CF] hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sections */}
      <div className="max-h-72 overflow-y-auto divide-y divide-border">
        {sections.map((section) => (
          <div key={section.key} className="px-4 py-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#98A2B3]">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.options.map((opt) => {
                const checked = activeFilters[section.key].includes(opt);
                return (
                  <label
                    key={opt}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 hover:bg-[#F9FAFB]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(section.key, opt)}
                      className="h-3.5 w-3.5 rounded border-[#D0D5DD] accent-[#6E56CF]"
                    />
                    <span className="text-[12px] text-[#344054]">{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DeskDataTable({
  onSelectCustomer,
  defaultTab = "Customers",
  hideTabs = false,
}: {
  onSelectCustomer?: (customerRecordId: string) => void;
  defaultTab?: DeskTab;
  hideTabs?: boolean;
}) {
  const {
    selectedAssignment,
    toggleCallPopunder,
    openCustomerConversation,
    isAgentAvailable,
    isAgentInCall,
  } = useLayoutContext();

  const [activeTab, setActiveTab] = useState<DeskTab>(defaultTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(EMPTY_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Reset search + filters when switching tabs
  const handleTabChange = (tab: DeskTab) => {
    setActiveTab(tab);
    setSearchQuery("");
    setActiveFilters(EMPTY_FILTERS);
  };

  const toggleFilter = (key: FilterKey, value: string) => {
    setActiveFilters((prev) => {
      const current = prev[key];
      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  };

  const removeFilterChip = (key: FilterKey, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: prev[key].filter((v) => v !== value),
    }));
  };

  const clearAllFilters = () => setActiveFilters(EMPTY_FILTERS);

  // ── Base data (with agent/aum annotations) ──
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
          agent: customer.profile.financialAdvisor,
          aum: parseBalance(customer.profile.totalAUM),
        };
      }),
    [],
  );

  const allTickets = useMemo(() => getCustomerTickets(), []);

  // ── Filter sections per tab ──
  const filterSections = useMemo<FilterSection[]>(() => {
    if (activeTab === "Customers") {
      const agents = [...new Set(customerRows.map((r) => r.agent))].sort();
      return [
        {
          key: "paymentBalance",
          label: "Payment Balance (AUM)",
          options: CUSTOMER_BALANCE_BUCKETS.map((b) => b.label),
        },
        { key: "agent", label: "Agent", options: agents },
      ];
    }
    if (activeTab === "Accounts") {
      return [
        {
          key: "paymentBalance",
          label: "Payment Balance",
          options: ACCOUNT_BALANCE_BUCKETS.map((b) => b.label),
        },
      ];
    }
    // Tickets
    const agents = [...new Set(allTickets.map((t) => t.agent))].sort();
    const teams  = [...new Set(allTickets.map((t) => t.agentTeam))].sort();
    return [
      { key: "agent",     label: "Agent",      options: agents },
      { key: "agentTeam", label: "Agent Team", options: teams  },
    ];
  }, [activeTab, customerRows, allTickets]);

  // ── Filtered + searched data ──
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return customerRows.filter((r) => {
      if (q && !([r.customerId, r.firstName, r.lastName, `${r.firstName} ${r.lastName}`].join(" ").toLowerCase().includes(q))) return false;
      if (activeFilters.agent.length > 0 && !activeFilters.agent.includes(r.agent)) return false;
      if (activeFilters.paymentBalance.length > 0) {
        const bucket = getBalanceBucket(r.aum, CUSTOMER_BALANCE_BUCKETS);
        if (!bucket || !activeFilters.paymentBalance.includes(bucket)) return false;
      }
      return true;
    });
  }, [customerRows, searchQuery, activeFilters]);

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return accountsDatabase.filter((a) => {
      if (q && !([a.accountNumber, a.type, a.holderName, a.status].join(" ").toLowerCase().includes(q))) return false;
      if (activeFilters.paymentBalance.length > 0) {
        const bucket = getBalanceBucket(a.balanceNum, ACCOUNT_BALANCE_BUCKETS);
        if (!bucket || !activeFilters.paymentBalance.includes(bucket)) return false;
      }
      return true;
    });
  }, [searchQuery, activeFilters]);

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allTickets.filter((t) => {
      if (q && !([t.id, t.subject, t.type, t.priority, t.status, t.agent].join(" ").toLowerCase().includes(q))) return false;
      if (activeFilters.agent.length > 0 && !activeFilters.agent.includes(t.agent)) return false;
      if (activeFilters.agentTeam.length > 0 && !activeFilters.agentTeam.includes(t.agentTeam)) return false;
      return true;
    });
  }, [allTickets, searchQuery, activeFilters]);

  const handleOpenChannel = (id: string, channel: Extract<CustomerChannel, "sms" | "email">) =>
    openCustomerConversation(id, channel);

  const handleStartCall = (id: string, anchorRect?: DOMRect | null) =>
    toggleCallPopunder(anchorRect, id);

  const displayCount =
    activeTab === "Customers"
      ? filteredCustomers.length
      : activeTab === "Accounts"
        ? filteredAccounts.length
        : filteredTickets.length;

  const totalCount =
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

  const totalActiveFilters = Object.values(activeFilters).reduce((s, v) => s + v.length, 0);

  // Flat list of active chips: {key, value, label}
  const activeChips = (Object.entries(activeFilters) as [FilterKey, string[]][]).flatMap(
    ([key, values]) => values.map((value) => ({ key, value })),
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F8F8F9]">
      {/* Header */}
      <div className="border-b border-black/10 bg-white px-6 pt-5 pb-0">
        <div className="pb-4">

          {/* Record count row + filter button */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-[#333333]">
                {displayCount === totalCount
                  ? `${totalCount} record${totalCount !== 1 ? "s" : ""}`
                  : `${displayCount} of ${totalCount} record${totalCount !== 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsFilterOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors",
                  totalActiveFilters > 0
                    ? "border-[#6E56CF] bg-[#F2F0FA] text-[#6E56CF]"
                    : "border-border bg-white text-[#344054] hover:bg-[#F9FAFB]",
                )}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter
                {totalActiveFilters > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#6E56CF] text-[10px] font-bold text-white">
                    {totalActiveFilters}
                  </span>
                )}
              </button>
              {isFilterOpen && (
                <FilterDropdown
                  sections={filterSections}
                  activeFilters={activeFilters}
                  onToggle={toggleFilter}
                  onClearAll={clearAllFilters}
                  onClose={() => setIsFilterOpen(false)}
                />
              )}
            </div>
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {activeChips.map(({ key, value }) => (
                <span
                  key={`${key}:${value}`}
                  className="inline-flex items-center gap-1 rounded-full bg-[#F2F0FA] px-2.5 py-1 text-[11px] font-medium text-[#6E56CF]"
                >
                  {value}
                  <button
                    type="button"
                    onClick={() => removeFilterChip(key, value)}
                    className="ml-0.5 rounded-full text-[#6E56CF] opacity-70 hover:opacity-100"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search bar */}
          <div className="relative mt-3">
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
        {!hideTabs && <DeskTabBar active={activeTab} onChange={handleTabChange} />}
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
                          ? "border-[#6E56CF] shadow-[0_10px_28px_rgba(0,109,173,0.14)]"
                          : "border-black/10 hover:-translate-y-0.5 hover:border-black/15 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => onSelectCustomer?.(row.id)}
                          className="flex min-w-0 flex-1 flex-col items-start rounded-xl text-left outline-none transition-colors hover:text-[#6E56CF] focus-visible:ring-2 focus-visible:ring-[#6E56CF]/25"
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
