import { ChevronDown } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const workspaceTabs = [
  { label: "Activity", to: "/activity" },
  { label: "Desk", to: "/desk" },
  { label: "Schedule", to: "/schedule" },
  { label: "Settings", to: "/settings" },
] as const;

export default function WorkspaceTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = workspaceTabs.find((tab) => tab.to === location.pathname) ?? workspaceTabs[0];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-9 shrink-0 items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 text-sm font-medium text-[#333333] sm:hidden"
            aria-label="Open workspace navigation"
          >
            <span>{activeTab.label}</span>
            <ChevronDown className="h-4 w-4 text-[#666666]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="w-40 rounded-xl border border-black/10 bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] sm:hidden"
        >
          {workspaceTabs.map((tab) => {
            const isActive = tab.to === activeTab.to;

            return (
              <DropdownMenuItem
                key={tab.to}
                onClick={() => navigate(tab.to)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm focus:bg-[#F3ECFF]",
                  isActive ? "bg-[#F3ECFF] text-[#6E00FD]" : "text-[#333333]",
                )}
              >
                {tab.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <nav className="hidden shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-black/10 bg-white/80 p-1 sm:flex">
        {workspaceTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#F3ECFF] text-[#6E00FD]"
                  : "text-[#6B7280] hover:bg-[#F3ECFF] hover:text-[#6E00FD]",
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
