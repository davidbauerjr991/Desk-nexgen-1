import { useMemo } from "react";
import { Mail, MessageSquare, Phone } from "lucide-react";

import { useLayoutContext } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type CustomerChannel, customerDatabase } from "@/lib/customer-database";
import { cn } from "@/lib/utils";

type DeskCustomerRow = {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  group: string;
  phone: string;
  email: string;
  priority: string;
  priorityClassName: string;
  lastUpdated: string;
};

const customerGroups = ["Priority Care", "Billing", "Growth", "Support", "Retention"];

function getRowEmail(firstName: string, lastName: string, customerId: string) {
  const first = firstName.trim().toLowerCase();
  const last = lastName.trim().toLowerCase();
  const normalizedCustomerId = customerId.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (first && last) {
    return `${first}.${last}@${normalizedCustomerId}.demo`;
  }

  return `${normalizedCustomerId}@demo`;
}

export default function DeskDataTable() {
  const {
    selectedAssignment,
    selectAssignment,
    toggleCallPopunder,
    openConversationPanel,
    setActiveConversationChannel,
    isAgentAvailable,
    isAgentInCall,
  } = useLayoutContext();

  const rows = useMemo<DeskCustomerRow[]>(() => customerDatabase.map((customer, index) => {
    const [firstName = customer.name, ...lastNameParts] = customer.name.split(" ");
    const lastName = lastNameParts.join(" ");

    return {
      id: customer.id,
      customerId: customer.customerId,
      firstName,
      lastName,
      group: customerGroups[index % customerGroups.length],
      phone: customer.overview.contactNumber,
      email: getRowEmail(firstName, lastName, customer.customerId),
      priority: customer.queue.priority,
      priorityClassName: customer.queue.priorityClassName,
      lastUpdated: customer.lastUpdated,
    };
  }), []);

  const handleOpenChannel = (customerId: string, channel: Extract<CustomerChannel, "sms" | "email">) => {
    selectAssignment(customerId);
    setActiveConversationChannel(channel);
    openConversationPanel();
  };

  const handleStartCall = (customerId: string, anchorRect?: DOMRect | null) => {
    selectAssignment(customerId);
    toggleCallPopunder(anchorRect);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F8F8F9]">
      <div className="border-b border-black/10 bg-white px-6 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#111827]">Customers</h2>
            <p className="mt-1 text-sm text-[#667085]">
              A simpler view of customer records with quick contact actions.
            </p>
          </div>
          <div className="rounded-full border border-black/10 bg-[#F8F8F9] px-3 py-1 text-xs font-medium text-[#475467]">
            {rows.length} records
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto">
        <div className="min-w-[1080px]">
          <div className="grid grid-cols-[160px_260px_160px_220px_280px] items-center gap-4 border-b border-black/10 bg-[#FCFCFD] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#667085]">
            <span>Customer ID</span>
            <span>Name</span>
            <span>Group</span>
            <span>Contact</span>
            <span className="text-right">Actions</span>
          </div>

          <ScrollArea className="h-full min-h-0">
            <div className="space-y-3 p-4">
          {rows.map((row) => {
            const isSelected = selectedAssignment.id === row.id;

            return (
              <div
                key={row.id}
                className={cn(
                  "rounded-2xl border bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition-all",
                  isSelected
                    ? "border-[#006DAD] shadow-[0_10px_28px_rgba(0,109,173,0.14)]"
                    : "border-black/10 hover:-translate-y-0.5 hover:border-black/15 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]",
                )}
              >
                <div className="grid grid-cols-[160px_260px_160px_220px_280px] items-center gap-4">
                  <button
                    type="button"
                    onClick={() => selectAssignment(row.id)}
                    className="flex min-w-0 flex-col items-start rounded-xl text-left outline-none transition-colors hover:text-[#006DAD] focus-visible:ring-2 focus-visible:ring-[#006DAD]/25"
                  >
                    <span className="whitespace-nowrap text-sm font-semibold text-[#111827]">{row.customerId}</span>
                    <span className="mt-1 text-xs text-[#667085]">Updated {row.lastUpdated}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectAssignment(row.id)}
                    className="flex min-w-0 flex-col items-start rounded-xl text-left outline-none transition-colors hover:text-[#006DAD] focus-visible:ring-2 focus-visible:ring-[#006DAD]/25"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="whitespace-nowrap text-base font-semibold text-[#111827]">
                        {row.firstName} {row.lastName}
                      </span>
                      <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", row.priorityClassName)}>
                        {row.priority}
                      </span>
                    </div>
                    <span className="mt-1 text-sm text-[#667085]">Primary contact on file</span>
                  </button>

                  <div className="flex items-center">
                    <span className="inline-flex rounded-full border border-[#D0D5DD] bg-[#F8F8F9] px-3 py-1 text-xs font-medium text-[#344054]">
                      {row.group}
                    </span>
                  </div>

                  <div className="min-w-0 space-y-1 text-sm text-[#475467]">
                    <p className="whitespace-nowrap font-medium text-[#344054]">{row.phone}</p>
                    <p className="whitespace-nowrap text-[#667085]">{row.email}</p>
                  </div>

                  <div className="flex flex-nowrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(event) => handleStartCall(row.id, event.currentTarget.getBoundingClientRect())}
                      disabled={!isAgentAvailable || isAgentInCall}
                      className="h-9 rounded-full border-black/10 bg-white px-3 text-[#333333] hover:bg-[#F8F8F9]"
                    >
                      <Phone className="mr-2 h-4 w-4" /> Call
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenChannel(row.id, "sms")}
                      className="h-9 rounded-full border-black/10 bg-white px-3 text-[#333333] hover:bg-[#F8F8F9]"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" /> SMS
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenChannel(row.id, "email")}
                      className="h-9 rounded-full border-black/10 bg-white px-3 text-[#333333] hover:bg-[#F8F8F9]"
                    >
                      <Mail className="mr-2 h-4 w-4" /> Email
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
