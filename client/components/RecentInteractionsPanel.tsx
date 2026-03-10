import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Bot,
  ChevronDown,
  Mail,
  MoreVertical,
  MessageSquare,
  Phone,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const interactions = [
  {
    id: 1,
    direction: "inbound",
    type: "sms",
    createdAt: "03/09/26 6:36 PM",
    status: "Pending",
    customerName: "Alex Kowalski",
    customerId: "CST-10482",
    channel: "CXoneSMS_1-833-457-8421",
    statusColor: "bg-[#1991D2]",
  },
  {
    id: 2,
    direction: "outbound",
    type: "sms",
    createdAt: "03/02/26 4:32 PM",
    status: "Resolved",
    customerName: "Alex Kowalski",
    customerId: "CST-10482",
    channel: "CXoneSMS_1-833-457-8421",
    statusColor: "bg-[#2CB770]",
  },
  {
    id: 3,
    direction: "outbound",
    type: "sms",
    createdAt: "02/19/26 4:57 PM",
    status: "Resolved",
    customerName: "Alex Kowalski",
    customerId: "CST-10482",
    channel: "CXoneSMS_1-833-457-8421",
    statusColor: "bg-[#2CB770]",
  },
  {
    id: 4,
    direction: "outbound",
    type: "voice",
    createdAt: "02/04/26 9:12 AM",
    status: "Resolved",
    customerName: "Alex Kowalski",
    customerId: "CST-10482",
    channel: "Inbound Voice - Mortgage Queue",
    statusColor: "bg-[#2CB770]",
  },
  {
    id: 5,
    direction: "inbound",
    type: "ai-agent",
    createdAt: "01/30/26 11:03 AM",
    status: "Closed",
    customerName: "Alex Kowalski",
    customerId: "CST-10482",
    channel: "AI Agent - Billing Triage",
    statusColor: "bg-[#D0021B]",
  },
  {
    id: 6,
    direction: "outbound",
    type: "email",
    createdAt: "01/27/26 7:18 PM",
    status: "Closed",
    customerName: "Alex Kowalski",
    customerId: "CST-10482",
    channel: "CXi SME Email",
    statusColor: "bg-[#D0021B]",
  },
  {
    id: 7,
    direction: "outbound",
    type: "email",
    createdAt: "01/21/26 1:57 PM",
    status: "Closed",
    customerName: "Alex Kowalski",
    customerId: "CST-10482",
    channel: "CXi SME Email",
    statusColor: "bg-[#D0021B]",
  },
  {
    id: 8,
    direction: "outbound",
    type: "email",
    createdAt: "01/21/26 12:51 PM",
    status: "Closed",
    customerName: "Alex Kowalski",
    customerId: "CST-10482",
    channel: "CXi SME Email",
    statusColor: "bg-[#D0021B]",
  },
  {
    id: 9,
    direction: "inbound",
    type: "sms",
    createdAt: "01/20/26 5:13 PM",
    status: "Closed",
    customerName: "Alex Kowalski",
    customerId: "CST-10482",
    channel: "CXoneSMS_1-833-457-8421",
    statusColor: "bg-[#D0021B]",
  },
] as const;

const FILTER_CHIPS = [
  { label: "All", value: "all" },
  { label: "SMS", value: "sms" },
  { label: "Email", value: "email" },
  { label: "Voice", value: "voice" },
  { label: "AI Agent", value: "ai-agent" },
] as const;

function InteractionTypeIcon({
  type,
  direction,
}: {
  type: (typeof interactions)[number]["type"];
  direction: (typeof interactions)[number]["direction"];
}) {
  const isEmail = type === "email";
  const isVoice = type === "voice";
  const isAiAgent = type === "ai-agent";
  const colorClass = isEmail
    ? "text-[#E83E8C]"
    : isVoice
      ? "text-[#2563EB]"
      : isAiAgent
        ? "text-[#6E00FD]"
        : "text-[#61A60E]";
  const DirectionIcon = direction === "inbound" ? ArrowDown : ArrowUp;
  const BaseIcon = isEmail ? Mail : isVoice ? Phone : isAiAgent ? Bot : MessageSquare;

  return (
    <div className={cn("flex items-center gap-1", colorClass)}>
      <DirectionIcon className="h-3.5 w-3.5 stroke-[2]" />
      <BaseIcon className="h-4 w-4 stroke-[2]" />
    </div>
  );
}

function InteractionRow({
  interaction,
}: {
  interaction: (typeof interactions)[number];
}) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-white px-3 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors hover:border-[#D9CCFF] hover:bg-[#FCFAFF]">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#F8F8F9]">
          <InteractionTypeIcon
            type={interaction.type}
            direction={interaction.direction}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[12px] font-semibold leading-5 text-[#333333]">
                {interaction.createdAt}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[12px] text-[#4B5563]">
                <span
                  className={cn(
                    "h-2.5 w-2.5 flex-shrink-0 rounded-full",
                    interaction.statusColor,
                  )}
                />
                <span className="font-medium text-[#333333]">
                  {interaction.status}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="-mr-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[#9CA3AF] transition-colors hover:bg-[#F3ECFF] hover:text-[#6E00FD]"
              aria-label="Interaction options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2 text-[12px] leading-5 text-[#6B7280]">
            <span className="truncate font-medium text-[#333333]">{interaction.customerName}</span>
            <span className="flex-shrink-0 text-[#C0C4CC]">•</span>
            <span className="flex-shrink-0 text-[#6B7280]">{interaction.customerId}</span>
          </div>
          <div className="mt-1 truncate text-[12px] leading-5 text-[#6B7280]">
            {interaction.channel}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecentInteractionsPanel() {
  const [activeFilter, setActiveFilter] = useState<"all" | "sms" | "email" | "voice" | "ai-agent">("all");
  const [selectedScope, setSelectedScope] = useState<"Alex Kowalski" | "All Recent Interactions">("Alex Kowalski");
  const [isScopeMenuOpen, setIsScopeMenuOpen] = useState(false);

  const filteredInteractions = useMemo(() => {
    if (activeFilter === "all") {
      return interactions;
    }

    return interactions.filter((interaction) => interaction.type === activeFilter);
  }, [activeFilter]);

  return (
    <div className="flex h-full min-w-full flex-col bg-white lg:min-w-[380px]">
      <div className="border-b border-border bg-background/50 px-5 py-4">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsScopeMenuOpen((current) => !current)}
            className="group text-left"
          >
            <div className="flex items-center gap-1 text-sm font-semibold tracking-tight text-[#333333]">
              <span>Recent Interactions</span>
              <ChevronDown className={cn("h-4 w-4 text-[#7A7A7A] transition-transform", isScopeMenuOpen && "rotate-180")} />
            </div>
            <div className="mt-0.5 text-xs text-[#6B7280] transition-colors group-hover:text-[#333333]">
              {selectedScope}
            </div>
          </button>

          {isScopeMenuOpen && (
            <div className="absolute left-0 top-full z-10 mt-2 w-52 rounded-xl border border-black/10 bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
              {(["Alex Kowalski", "All Recent Interactions"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setSelectedScope(option);
                    setIsScopeMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    selectedScope === option
                      ? "bg-[#F3ECFF] text-[#6E00FD]"
                      : "text-[#333333] hover:bg-[#F8F8F9]",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {FILTER_CHIPS.map((chip) => {
            const isActive = activeFilter === chip.value;

            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setActiveFilter(chip.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "border-[#D9CCFF] bg-[#F3ECFF] text-[#6E00FD]"
                    : "border-black/10 bg-white text-[#6B7280] hover:border-[#D9CCFF] hover:text-[#6E00FD]",
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-3 pb-2">
          {filteredInteractions.map((interaction) => (
            <InteractionRow key={interaction.id} interaction={interaction} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
