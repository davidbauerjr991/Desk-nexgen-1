import { useMemo, useState } from "react";
import { ChevronDown, Mail, MessageSquare, Phone, Search } from "lucide-react";

import { useLayoutContext } from "@/components/Layout";
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

type DeskCustomerRow = {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  lastUpdated: string;
};

export default function DeskDataTable() {
  const {
    selectedAssignment,
    selectAssignment,
    toggleCallPopunder,
    openCustomerConversation,
    isAgentAvailable,
    isAgentInCall,
  } = useLayoutContext();
  const [searchQuery, setSearchQuery] = useState("");

  const rows = useMemo<DeskCustomerRow[]>(
    () =>
      customerDatabase.map((customer) => {
        const [firstName = customer.name, ...lastNameParts] = customer.name.split(" ");
        const lastName = lastNameParts.join(" ");

        return {
          id: customer.id,
          customerId: customer.customerId,
          firstName,
          lastName,
          lastUpdated: customer.lastUpdated,
        };
      }),
    [],
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return rows;
    }

    return rows.filter((row) => {
      const searchableText = [row.customerId, row.firstName, row.lastName, `${row.firstName} ${row.lastName}`, row.lastUpdated]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [rows, searchQuery]);

  const handleOpenChannel = (customerId: string, channel: Extract<CustomerChannel, "sms" | "email">) => {
    openCustomerConversation(customerId, channel);
  };

  const handleStartCall = (customerId: string, anchorRect?: DOMRect | null) => {
    toggleCallPopunder(anchorRect, customerId);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F8F8F9]">
      <div className="border-b border-black/10 bg-white px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#111827]">Customers</h2>
          <p className="mt-1 text-sm text-[#667085]">{rows.length} records</p>
        </div>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search customers"
            aria-label="Search customers"
            className="h-10 rounded-full border-black/10 bg-[#F8F8F9] pl-9 text-sm text-[#111827] placeholder:text-[#98A2B3]"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ScrollArea className="h-full min-h-0">
          <div className="space-y-3 p-4">
            {filteredRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-8 text-center text-sm text-[#667085]">
                No customers match your search.
              </div>
            ) : (
              filteredRows.map((row) => {
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
                        onClick={() => selectAssignment(row.id)}
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
                            onClick={(event) => handleStartCall(row.id, event.currentTarget.getBoundingClientRect())}
                            disabled={!isAgentAvailable || isAgentInCall}
                            className="rounded-xl px-3 py-2 text-sm text-[#111827]"
                          >
                            <Phone className="mr-2 h-4 w-4" />
                            Call
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenChannel(row.id, "email")}
                            className="rounded-xl px-3 py-2 text-sm text-[#111827]"
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Email
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenChannel(row.id, "sms")}
                            className="rounded-xl px-3 py-2 text-sm text-[#111827]"
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            SMS
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
