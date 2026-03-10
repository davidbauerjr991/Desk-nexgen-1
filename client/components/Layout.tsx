import React, { useMemo, useState } from "react";
import {
  Bell,
  ChevronDown,
  CircleHelp,
  Settings,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: React.ReactNode;
}

type AgentStatus = "Available" | "Busy" | "Away" | "Offline";

const statusOptions: Array<{
  label: AgentStatus;
  dotClassName: string;
}> = [
  { label: "Available", dotClassName: "bg-[#2CC84D]" },
  { label: "Busy", dotClassName: "bg-[#F04438]" },
  { label: "Away", dotClassName: "bg-[#F59E0B]" },
  { label: "Offline", dotClassName: "bg-[#A3A3A3]" },
];

const NiceLogoIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0"
    aria-hidden="true"
  >
    <path
      d="M23.7188 5.81445C23.8757 5.8146 24.0015 5.94038 24 6.0957C23.8494 15.8179 15.9182 23.6985 6.13379 23.8477C5.97839 23.8493 5.85077 23.7237 5.85059 23.5684V19.3086C5.85059 19.1563 5.97502 19.0335 6.12891 19.0303C13.2448 18.8844 19.0048 13.1599 19.1523 6.08984C19.1556 5.93599 19.2788 5.81255 19.4326 5.8125L23.7188 5.81445ZM12.2559 0.000976562C13.8714 0.00104033 15.1804 1.30219 15.1807 2.90625C15.1807 4.51051 13.8716 5.81244 12.2559 5.8125C10.6401 5.8125 9.33008 4.51055 9.33008 2.90625C9.33031 1.30215 10.6402 0.000976562 12.2559 0.000976562ZM2.92578 0C4.5412 0.000213196 5.85033 1.30132 5.85059 2.90527C5.85059 4.50944 4.54135 5.81131 2.92578 5.81152C1.31003 5.81152 0 4.50957 0 2.90527C0.000253194 1.30119 1.31018 0 2.92578 0Z"
      fill="#6E00FD"
    />
  </svg>
);

function HeaderIconButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex h-7 w-7 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white/70 hover:text-[#333333]"
    >
      {children}
    </button>
  );
}

export default function Layout({ children }: LayoutProps) {
  const [status, setStatus] = useState<AgentStatus>("Available");

  const activeStatus = useMemo(
    () => statusOptions.find((option) => option.label === status) ?? statusOptions[0],
    [status],
  );

  return (
    <div className="flex h-screen w-full flex-col bg-[#F8F8F9]">
      <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-black/10 px-4">
        <div className="flex min-w-0 items-center gap-4">
          <NiceLogoIcon />
          <span className="truncate text-base font-semibold leading-7 tracking-[-0.02em] text-[#333333]">
            Agent Workspace Premium
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <HeaderIconButton>
            <div className="relative">
              <Bell className="h-4 w-4 stroke-[1.8]" />
              <span className="absolute -right-0.5 top-0 h-1.5 w-1.5 rounded-full bg-[#6E00FD]" />
            </div>
          </HeaderIconButton>

          <HeaderIconButton>
            <CircleHelp className="h-4 w-4 stroke-[1.8]" />
          </HeaderIconButton>

          <HeaderIconButton>
            <Settings className="h-4 w-4 stroke-[1.8]" />
          </HeaderIconButton>

          <div className="mx-1 hidden h-6 w-px bg-black/12 sm:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-8 items-center gap-2 rounded-lg px-3 text-[#333333] transition-colors hover:bg-[#F3ECFF] focus:outline-none"
              >
                <span className={`h-3 w-3 rounded-full ${activeStatus.dotClassName}`} />
                <span className="hidden text-[15px] font-semibold leading-none tracking-[-0.02em] text-[#4F189F] sm:inline">
                  {activeStatus.label}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-[#666666]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-[180px] rounded-2xl border border-black/10 bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
            >
              <div className="space-y-1">
                {statusOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.label}
                    onClick={() => setStatus(option.label)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-normal text-[#333333] focus:bg-[#F8F8F9]"
                  >
                    <span className={`h-3 w-3 rounded-full ${option.dotClassName}`} />
                    <span>{option.label}</span>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="mx-1 hidden h-6 w-px bg-black/12 sm:block" />

          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-[#8A2BFF] to-[#6E00FD] text-[11px] font-bold text-white shadow-[0_3px_8px_rgba(110,0,253,0.28)] transition-transform hover:scale-[1.02]"
            aria-label="Agent profile"
          >
            JD
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 px-4 pb-4 pt-0">
        <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-black/[0.16] bg-white">
          {children}
        </div>
      </div>
    </div>
  );
}
