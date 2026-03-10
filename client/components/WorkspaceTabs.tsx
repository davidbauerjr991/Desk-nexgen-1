import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const workspaceTabs = [
  { label: "Activity", to: "/activity" },
  { label: "Desk", to: "/desk" },
  { label: "Schedule", to: "/schedule" },
  { label: "Settings", to: "/settings" },
] as const;

export default function WorkspaceTabs() {
  return (
    <nav className="flex items-center gap-1 rounded-full border border-black/10 bg-white/80 p-1">
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
  );
}
