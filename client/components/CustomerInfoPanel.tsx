import { useState } from "react";
import { ChevronUp } from "lucide-react";
import { getCustomerRecord } from "@/lib/customer-database";
import { cn } from "@/lib/utils";

interface CustomerInfoPanelProps {
  className?: string;
  bordered?: boolean;
  customerId?: string;
}

function CustomerDetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] py-3 last:border-b-0">
      <span className="pt-0.5 text-sm leading-6 text-[#667085]">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-medium leading-6 text-[#101828]">{value}</span>
    </div>
  );
}

export function CustomerOverviewCard({ customerId, customerName }: { customerId: string; customerName?: string }) {
  const customer = getCustomerRecord(customerId);
  const rows = [
    { label: "Contact number", value: customer.overview.contactNumber },
    { label: "Customer name", value: customerName ?? customer.name },
    { label: "Assigned agent", value: customer.overview.assignedAgent },
    { label: "Pronoun", value: customer.overview.pronoun },
    { label: "Last contact time", value: customer.overview.lastContactTime },
    { label: "Address", value: customer.overview.address },
  ];

  return (
    <div className="p-4">
      <div>
        {rows.map((row) => (
          <CustomerDetailRow key={row.label} label={row.label} value={row.value} />
        ))}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF] mb-1">
      {children}
    </span>
  );
}

function TextInput({ placeholder }: { placeholder?: string }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      className="w-full rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333] placeholder:text-transparent focus:border-[#6E56CF] focus:outline-none focus:ring-1 focus:ring-[#6E56CF]/30"
    />
  );
}

function SelectInput() {
  return (
    <div className="relative w-full">
      <select className="w-full appearance-none rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333] focus:border-[#6E56CF] focus:outline-none focus:ring-1 focus:ring-[#6E56CF]/30 pr-7">
        <option value=""></option>
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  isOpen,
  onToggle,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between py-3"
    >
      <span className="text-sm font-semibold text-[#333]">{title}</span>
      <ChevronUp
        className={cn(
          "h-4 w-4 text-[#6B7280] transition-transform duration-200",
          !isOpen && "rotate-180",
        )}
      />
    </button>
  );
}

export default function CustomerInfoPanel({
  className,
  bordered = false,
  customerId,
}: CustomerInfoPanelProps) {
  const customer = customerId ? getCustomerRecord(customerId) : null;
  const [isGeneralOpen, setIsGeneralOpen] = useState(true);
  const [isScopeOpen, setIsScopeOpen] = useState(true);

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-y-auto",
        bordered && "border-r border-[rgba(0,0,0,0.1)]",
        className,
      )}
    >
      <div className="flex-1 px-4 py-1">
        {/* General Information */}
        <div className="border-b border-[rgba(0,0,0,0.08)]">
          <SectionHeader
            title="General Information"
            isOpen={isGeneralOpen}
            onToggle={() => setIsGeneralOpen((v) => !v)}
          />
          {isGeneralOpen && (
            <div className="pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Account</FieldLabel>
                  <TextInput placeholder={customer?.customerId ?? ""} />
                </div>
                <div>
                  <FieldLabel>Contact</FieldLabel>
                  <TextInput placeholder={customer?.name ?? ""} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <TextInput placeholder={customer?.overview.contactNumber ?? ""} />
                </div>
                <div>
                  <FieldLabel>Last Contact</FieldLabel>
                  <TextInput placeholder={customer?.overview.lastContactTime ?? ""} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Pronoun</FieldLabel>
                  <TextInput placeholder={customer?.overview.pronoun ?? ""} />
                </div>
                <div>
                  <FieldLabel>Assigned Agent</FieldLabel>
                  <TextInput placeholder={customer?.overview.assignedAgent ?? ""} />
                </div>
              </div>
              <div>
                <FieldLabel>Address</FieldLabel>
                <TextInput placeholder={customer?.overview.address?.toString() ?? ""} />
              </div>
            </div>
          )}
        </div>

        {/* Scope */}
        <div>
          <SectionHeader
            title="Scope"
            isOpen={isScopeOpen}
            onToggle={() => setIsScopeOpen((v) => !v)}
          />
          {isScopeOpen && (
            <div className="pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Subject</FieldLabel>
                  <TextInput />
                </div>
                <div>
                  <FieldLabel>Type</FieldLabel>
                  <SelectInput />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <SelectInput />
                </div>
                <div>
                  <FieldLabel>Priority</FieldLabel>
                  <SelectInput />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Agent</FieldLabel>
                  <SelectInput />
                </div>
                <div>
                  <FieldLabel>Agent Team</FieldLabel>
                  <SelectInput />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
