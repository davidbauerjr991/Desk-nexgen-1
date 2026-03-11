import { useState } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerInfoPanelProps {
  className?: string;
  bordered?: boolean;
}

function OverviewField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[12px] font-semibold uppercase text-[#333333]">{label}</div>
      <div className="text-[12px] leading-5 text-[#6B7280]">{value}</div>
    </div>
  );
}

export function CustomerOverviewCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-start border-b border-black/10 px-5 py-5">
        <span className="text-sm font-semibold tracking-tight text-[#333333]">Overview</span>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-6 px-5 py-6">
        <OverviewField label="Phone #" value={<span>🇺🇸 +1 716 331 4661</span>} />
        <OverviewField label="Contact #" value="2457" />
        <OverviewField label="Email" value="Teresa.Harrington@nice.com" />
        <OverviewField label="Balance" value="$5,005.65" />
        <OverviewField label="Address" value="1 SmartReach Rd" />
        <OverviewField label="City" value="Buffalo" />
        <OverviewField label="State" value="New York" />
        <OverviewField label="Zip Code" value="14217" />
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
      className="w-full rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333] placeholder:text-transparent focus:border-[#6E00FD] focus:outline-none focus:ring-1 focus:ring-[#6E00FD]/30"
    />
  );
}

function SelectInput() {
  return (
    <div className="relative w-full">
      <select className="w-full appearance-none rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333] focus:border-[#6E00FD] focus:outline-none focus:ring-1 focus:ring-[#6E00FD]/30 pr-7">
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
}: CustomerInfoPanelProps) {
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
                  <TextInput />
                </div>
                <div>
                  <FieldLabel>Contact</FieldLabel>
                  <SelectInput />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Phone 1</FieldLabel>
                  <TextInput />
                </div>
                <div>
                  <FieldLabel>Phone 2</FieldLabel>
                  <TextInput />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <TextInput />
                </div>
                <div>
                  <FieldLabel>SLA Due Date</FieldLabel>
                  <TextInput />
                </div>
              </div>
              <div>
                <FieldLabel>Description</FieldLabel>
                <textarea
                  rows={2}
                  className="w-full resize-none rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333] focus:border-[#6E00FD] focus:outline-none focus:ring-1 focus:ring-[#6E00FD]/30"
                />
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
