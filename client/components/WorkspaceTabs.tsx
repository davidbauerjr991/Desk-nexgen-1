import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type WorkspaceTab = {
  label: string;
  to: string;
};

const PINNED_SECONDARY_TAB_STORAGE_KEY = "workspace-pinned-secondary-tab";

const primaryTabs: WorkspaceTab[] = [
  { label: "Activity", to: "/activity" },
  { label: "Desk", to: "/desk" },
  { label: "Schedule", to: "/schedule" },
];

const secondaryTabs: WorkspaceTab[] = [
  { label: "Settings", to: "/settings" },
  { label: "Directory", to: "/salesforce" },
  { label: "Service Now", to: "/service-now" },
  { label: "WEM", to: "/wem" },
];

const allTabs = [...primaryTabs, ...secondaryTabs];

function getStoredPinnedSecondaryTab() {
  if (typeof window === "undefined") {
    return secondaryTabs[0].to;
  }

  const storedTab = window.localStorage.getItem(PINNED_SECONDARY_TAB_STORAGE_KEY);
  return secondaryTabs.some((tab) => tab.to === storedTab) ? storedTab : secondaryTabs[0].to;
}

export default function WorkspaceTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pinnedSecondaryTabPath, setPinnedSecondaryTabPath] = useState(getStoredPinnedSecondaryTab);

  useEffect(() => {
    if (secondaryTabs.some((tab) => tab.to === location.pathname) && location.pathname !== pinnedSecondaryTabPath) {
      setPinnedSecondaryTabPath(location.pathname);
    }
  }, [location.pathname, pinnedSecondaryTabPath]);

  useEffect(() => {
    window.localStorage.setItem(PINNED_SECONDARY_TAB_STORAGE_KEY, pinnedSecondaryTabPath);
  }, [pinnedSecondaryTabPath]);

  const pinnedSecondaryTab = useMemo(
    () => secondaryTabs.find((tab) => tab.to === pinnedSecondaryTabPath) ?? secondaryTabs[0],
    [pinnedSecondaryTabPath],
  );

  const visibleTabs = useMemo(() => [...primaryTabs, pinnedSecondaryTab], [pinnedSecondaryTab]);
  const moreTabs = useMemo(
    () => secondaryTabs.filter((tab) => tab.to !== pinnedSecondaryTab.to),
    [pinnedSecondaryTab],
  );

  const activeTab = allTabs.find((tab) => tab.to === location.pathname) ?? visibleTabs[0];

  const handleSecondaryTabClick = (tab: WorkspaceTab) => {
    setPinnedSecondaryTabPath(tab.to);
    navigate(tab.to);
  };

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
          className="w-48 rounded-xl border border-black/10 bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] sm:hidden"
        >
          {visibleTabs.map((tab) => {
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

          <DropdownMenuSeparator className="my-1 bg-black/10" />

          {moreTabs.map((tab) => {
            const isActive = tab.to === activeTab.to;

            return (
              <DropdownMenuItem
                key={tab.to}
                onClick={() => handleSecondaryTabClick(tab)}
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
        {visibleTabs.map((tab) => (
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium text-[#6B7280] transition-colors hover:bg-[#F3ECFF] hover:text-[#6E00FD]"
              aria-label="Open more workspace tabs"
            >
              <span>More</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-48 rounded-xl border border-black/10 bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
          >
            {moreTabs.map((tab) => {
              const isActive = tab.to === activeTab.to;

              return (
                <DropdownMenuItem
                  key={tab.to}
                  onClick={() => handleSecondaryTabClick(tab)}
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
      </nav>
    </>
  );
}
