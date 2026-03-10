import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Mail,
  MoreVertical,
  MessageSquare,
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
    channel: "CXoneSMS_1-833-457-8421",
    statusColor: "bg-[#1991D2]",
  },
  {
    id: 2,
    direction: "outbound",
    type: "sms",
    createdAt: "03/02/26 4:32 PM",
    status: "Resolved",
    channel: "CXoneSMS_1-833-457-8421",
    statusColor: "bg-[#2CB770]",
  },
  {
    id: 3,
    direction: "outbound",
    type: "sms",
    createdAt: "02/19/26 4:57 PM",
    status: "Resolved",
    channel: "CXoneSMS_1-833-457-8421",
    statusColor: "bg-[#2CB770]",
  },
  {
    id: 4,
    direction: "outbound",
    type: "email",
    createdAt: "01/27/26 7:18 PM",
    status: "Closed",
    channel: "CXi SME Email",
    statusColor: "bg-[#D0021B]",
  },
  {
    id: 5,
    direction: "outbound",
    type: "email",
    createdAt: "01/21/26 1:57 PM",
    status: "Closed",
    channel: "CXi SME Email",
    statusColor: "bg-[#D0021B]",
  },
  {
    id: 6,
    direction: "outbound",
    type: "email",
    createdAt: "01/21/26 12:51 PM",
    status: "Closed",
    channel: "CXi SME Email",
    statusColor: "bg-[#D0021B]",
  },
  {
    id: 7,
    direction: "inbound",
    type: "sms",
    createdAt: "01/20/26 5:13 PM",
    status: "Closed",
    channel: "CXoneSMS_1-833-457-8421",
    statusColor: "bg-[#D0021B]",
  },
] as const;

const FILTER_CHIPS = [
  { label: "All", value: "all" },
  { label: "SMS", value: "sms" },
  { label: "Email", value: "email" },
] as const;

function InteractionTypeIcon({
  type,
  direction,
}: {
  type: (typeof interactions)[number]["type"];
  direction: (typeof interactions)[number]["direction"];
}) {
  const isEmail = type === "email";
  const colorClass = isEmail ? "text-[#E83E8C]" : "text-[#61A60E]";
  const DirectionIcon = direction === "inbound" ? ArrowDown : ArrowUp;
  const BaseIcon = isEmail ? Mail : MessageSquare;

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

          <div className="mt-2 truncate text-[12px] leading-5 text-[#6B7280]">
            {interaction.channel}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecentInteractionsPanel() {
  const [activeFilter, setActiveFilter] = useState<"all" | "sms" | "email">("all");

  const filteredInteractions = useMemo(() => {
    if (activeFilter === "all") {
      return interactions;
    }

    return interactions.filter((interaction) => interaction.type === activeFilter);
  }, [activeFilter]);

  return (
    <div className="flex h-full min-w-full flex-col bg-white lg:min-w-[380px]">
      <div className="border-b border-border bg-background/50 px-5 py-4">
        <h3 className="text-sm font-semibold tracking-tight text-[#333333]">
          Recent Interactions
        </h3>

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
