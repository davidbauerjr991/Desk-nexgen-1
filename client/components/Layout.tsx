import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  ClipboardList,
  MessageSquare,
  Monitor,
  Phone,
  Plus,
  Search,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

interface LayoutProps {
  children: React.ReactNode;
}

type RightPanelView = "desk" | "copilot" | "interactions" | null;

interface LayoutContextValue {
  activeRightPanel: RightPanelView;
  isRightPanelOpen: boolean;
  isDeskOpen: boolean;
  isCopilotOpen: boolean;
  isInteractionsOpen: boolean;
  isAgentInCall: boolean;
  isAgentAvailable: boolean;
  toggleDesk: () => void;
  toggleCopilot: () => void;
  toggleInteractions: () => void;
  closeRightPanel: () => void;
  startCallStatus: () => void;
  endCallStatus: () => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function useLayoutContext() {
  const context = useContext(LayoutContext);

  if (!context) {
    throw new Error("useLayoutContext must be used within Layout");
  }

  return context;
}

type AgentStatus = "Available" | "Busy" | "Away" | "Offline" | "In a Call";
type AddNewType = "customer" | "account" | "ticket" | "work-item";

const statusOptions: Array<{
  label: AgentStatus;
  dotClassName: string;
  textClassName: string;
}> = [
  { label: "Available", dotClassName: "bg-[#2CC84D]", textClassName: "text-[#2CC84D]" },
  { label: "Busy", dotClassName: "bg-[#F04438]", textClassName: "text-[#F04438]" },
  { label: "Away", dotClassName: "bg-[#F59E0B]", textClassName: "text-[#F59E0B]" },
  { label: "Offline", dotClassName: "bg-[#A3A3A3]", textClassName: "text-[#A3A3A3]" },
  { label: "In a Call", dotClassName: "bg-[#F04438]", textClassName: "text-[#F04438]" },
];

const addNewFieldConfig: Record<
  AddNewType,
  Array<{
    key: string;
    label: string;
    placeholder: string;
    type: "input" | "textarea";
  }>
> = {
  customer: [
    { key: "firstName", label: "First Name", placeholder: "Enter first name", type: "input" },
    { key: "lastName", label: "Last Name", placeholder: "Enter last name", type: "input" },
    { key: "email", label: "Email", placeholder: "name@example.com", type: "input" },
    { key: "phone", label: "Phone", placeholder: "(555) 123-4567", type: "input" },
    { key: "customerId", label: "Customer ID", placeholder: "CST-10482", type: "input" },
    { key: "notes", label: "Notes", placeholder: "Add customer notes", type: "textarea" },
  ],
  account: [
    { key: "accountName", label: "Account Name", placeholder: "Premier Account", type: "input" },
    { key: "accountNumber", label: "Account Number", placeholder: "ACC-20391", type: "input" },
    { key: "owner", label: "Owner", placeholder: "Alex Kowalski", type: "input" },
    { key: "status", label: "Status", placeholder: "Active", type: "input" },
    { key: "billingAddress", label: "Billing Address", placeholder: "Add billing address", type: "textarea" },
  ],
  ticket: [
    { key: "title", label: "Ticket Title", placeholder: "Payment mismatch preventing upgrade", type: "input" },
    { key: "priority", label: "Priority", placeholder: "High", type: "input" },
    { key: "category", label: "Category", placeholder: "Billing", type: "input" },
    { key: "customer", label: "Customer", placeholder: "Alex Kowalski", type: "input" },
    { key: "description", label: "Description", placeholder: "Describe the issue", type: "textarea" },
  ],
  "work-item": [
    { key: "name", label: "Work Item Name", placeholder: "Resolve billing mismatch", type: "input" },
    { key: "assignee", label: "Assignee", placeholder: "Jordan Doe", type: "input" },
    { key: "dueDate", label: "Due Date", placeholder: "03/15/26", type: "input" },
    { key: "relatedTo", label: "Related To", placeholder: "Ticket TCK-2091", type: "input" },
    { key: "details", label: "Details", placeholder: "Add work item details", type: "textarea" },
  ],
};

const queuePreviewItems = [
  {
    id: "alex",
    initials: "AK",
    name: "Alex Kowalski",
    time: "Now",
    preview: "Need help resolving a blocked upgrade.",
    sentiment: "Positive",
    sentimentClassName: "border-[#73A76F] text-[#4E8A51]",
    badgeColor: "bg-[#CC2D2D]",
    icon: Phone,
    isActive: true,
  },
  {
    id: "sarah",
    initials: "SM",
    name: "Sarah Miller",
    time: "2m ago",
    preview: "Missed flight",
    sentiment: "Neutral",
    sentimentClassName: "border-black/20 text-[#333333]",
    badgeColor: "bg-[#2E9B34]",
    icon: Phone,
    isActive: false,
  },
  {
    id: "emily",
    initials: "EC",
    name: "Emily Chen",
    time: "5m ago",
    preview: "The discount code is not working at ch...",
    sentiment: "Negative",
    sentimentClassName: "border-[#A14C49] text-[#87413C]",
    badgeColor: "bg-[#45C9CF]",
    icon: ClipboardList,
    isActive: false,
  },
  {
    id: "david",
    initials: "DB",
    name: "David Brown",
    time: "24m ago",
    preview: "Can I upgrade my subscription?",
    sentiment: "Positive",
    sentimentClassName: "border-[#73A76F] text-[#4E8A51]",
    badgeColor: "bg-[#8BC34A]",
    icon: MessageSquare,
    isActive: false,
  },
] as const;

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

function AddNewPopoverContent() {
  const [selectedType, setSelectedType] = useState<AddNewType>("customer");
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const fields = addNewFieldConfig[selectedType];
  const isSaveDisabled = fields.some((field) => !(formValues[field.key] ?? "").trim());

  const clearForm = () => {
    setFormValues({});
  };

  const handleSave = () => {
    if (isSaveDisabled) {
      return;
    }

    clearForm();
    toast.success("Customer Saved Successfully", {
      action: {
        label: "Open Record",
        onClick: () => undefined,
      },
    });
  };

  return (
    <div className="flex max-h-[min(720px,80vh)] w-[360px] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
      <div className="border-b border-border bg-background/50 px-5 py-4">
        <h3 className="text-sm font-semibold tracking-tight text-[#333333]">Add New</h3>
      </div>

      <ScrollArea className="flex-1 px-5 py-5">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">
              Item Type
            </label>
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as AddNewType)}>
              <SelectTrigger className="h-9 rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333333] focus:ring-1 focus:ring-[#6E00FD]/30 focus:ring-offset-0 focus:border-[#6E00FD]">
                <SelectValue placeholder="Select item type" />
              </SelectTrigger>
              <SelectContent className="rounded border border-[#E5E7EB] bg-white">
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="ticket">Ticket</SelectItem>
                <SelectItem value="work-item">Work Item</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <label className="block text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <Textarea
                    value={formValues[field.key] ?? ""}
                    onChange={(event) =>
                      setFormValues((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="min-h-[96px] rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333333] placeholder:text-transparent focus-visible:border-[#6E00FD] focus-visible:ring-1 focus-visible:ring-[#6E00FD]/30"
                  />
                ) : (
                  <Input
                    value={formValues[field.key] ?? ""}
                    onChange={(event) =>
                      setFormValues((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="h-9 rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333333] placeholder:text-transparent focus-visible:border-[#6E00FD] focus-visible:ring-1 focus-visible:ring-[#6E00FD]/30"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
        <Button type="button" variant="outline" className="rounded-xl" onClick={clearForm}>
          Cancel
        </Button>
        <Button
          type="button"
          className="rounded-xl bg-[#6E00FD] hover:bg-[#5B00D1] disabled:bg-[#D9CCFF] disabled:text-white"
          onClick={handleSave}
          disabled={isSaveDisabled}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

function HeaderIconButton({
  children,
  onClick,
  ariaLabel,
  isActive = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  isActive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
        isActive
          ? "text-[#6E00FD] hover:bg-[#F3ECFF]"
          : "text-[#7A7A7A] hover:bg-white/70 hover:text-[#333333]"
      }`}
    >
      {children}
    </button>
  );
}

function QueueOverlayList() {
  return (
    <div className="min-h-full overflow-hidden bg-white">
      {queuePreviewItems.map((item) => {
        const ItemIcon = item.icon;

        return (
          <div
            key={item.id}
            className={`group relative flex cursor-pointer gap-3 border-b border-black/[0.08] px-4 py-3.5 transition-colors last:border-b-0 ${
              item.isActive ? "bg-[#EFF4F8]" : "bg-white hover:bg-[#F5F8FB]"
            }`}
          >
            {item.isActive && <span className="absolute inset-y-0 left-0 w-1 bg-[#1991D2]" />}

            <div className="relative mt-0.5 h-11 w-11 flex-shrink-0 self-start">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-[16px] font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-colors ${
                  item.isActive
                    ? "bg-[#0D5E8A] text-white"
                    : "border border-black/15 bg-white text-[#0D5E8A] group-hover:border-[#0D5E8A]/20 group-hover:bg-[#EAF3F8]"
                }`}
              >
                {item.initials}
              </div>
              <span
                className={`absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${item.badgeColor}`}
              >
                <ItemIcon className="h-3 w-3 text-white" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold leading-5 text-[#333333] transition-colors group-hover:text-[#0D5E8A]">
                    {item.name}
                  </div>
                  <div className="mt-0.5 truncate text-[13px] leading-[18px] text-[#6B6B6B]">
                    {item.preview}
                  </div>
                </div>
                <span className="flex-shrink-0 pt-0.5 text-[12px] font-medium leading-[18px] text-[#6B6B6B]">
                  {item.time}
                </span>
              </div>

              <div className="mt-2">
                <span
                  className={`inline-flex rounded-full border px-3 py-0.5 text-[12px] font-medium ${item.sentimentClassName}`}
                >
                  {item.sentiment}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeftQueueRail() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 top-12 z-30 block">
      <div className="relative flex h-full">
        <aside className="flex h-full w-[56px] shrink-0 flex-col items-center bg-[#F8F8F9] py-3">
          <div className="flex flex-col items-center gap-2.5 pt-1">
            <div onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
              <div className="flex flex-col items-center gap-2.5">
                {queuePreviewItems.map((item) => {
                  const ItemIcon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="relative flex h-12 w-12 items-center justify-center rounded-xl transition-transform hover:scale-[1.03]"
                      aria-label={`${item.name} queue item`}
                    >
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-xl text-[16px] font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.06)] ${
                          item.isActive
                            ? "bg-[#0D5E8A] text-white"
                            : "border border-black/15 bg-white text-[#0D5E8A]"
                        }`}
                      >
                        {item.initials}
                      </span>
                      <span
                        className={`absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#F0F1F3] ${item.badgeColor}`}
                      >
                        <ItemIcon className="h-3 w-3 text-white" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        <div
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className={`absolute left-0 top-0 z-50 h-full transition-all duration-200 ease-in-out ${
            isOpen
              ? "pointer-events-auto translate-x-0 opacity-100"
              : "pointer-events-none -translate-x-3 opacity-0"
          }`}
        >
          <div className="h-full w-[320px] overflow-y-auto border-r border-black/[0.08] bg-white shadow-[8px_0_28px_rgba(15,23,42,0.10)]">
            <QueueOverlayList />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatStatusDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export default function Layout({ children }: LayoutProps) {
  const [status, setStatus] = useState<AgentStatus>("Available");
  const [activeRightPanel, setActiveRightPanel] = useState<RightPanelView>("desk");
  const [isAddNewPopoverOpen, setIsAddNewPopoverOpen] = useState(false);
  const [statusStartedAt, setStatusStartedAt] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const previousAgentStatusRef = useRef<Exclude<AgentStatus, "In a Call">>("Available");

  useEffect(() => {
    setElapsedSeconds(0);

    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - statusStartedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [statusStartedAt]);

  const activeStatus = useMemo(
    () => statusOptions.find((option) => option.label === status) ?? statusOptions[0],
    [status],
  );

  const layoutContextValue = useMemo(
    () => ({
      activeRightPanel,
      isRightPanelOpen: activeRightPanel !== null,
      isDeskOpen: activeRightPanel === "desk",
      isCopilotOpen: activeRightPanel === "copilot",
      isInteractionsOpen: activeRightPanel === "interactions",
      isAgentInCall: status === "In a Call",
      isAgentAvailable: status === "Available",
      toggleDesk: () => {
        setActiveRightPanel((current) =>
          current === "desk" ? null : "desk",
        );
      },
      toggleCopilot: () => {
        setActiveRightPanel((current) =>
          current === "copilot" ? null : "copilot",
        );
      },
      toggleInteractions: () => {
        setActiveRightPanel((current) =>
          current === "interactions" ? null : "interactions",
        );
      },
      closeRightPanel: () => setActiveRightPanel(null),
      startCallStatus: () => {
        if (status !== "In a Call") {
          previousAgentStatusRef.current = status;
        }
        setStatus("In a Call");
        setStatusStartedAt(Date.now());
      },
      endCallStatus: () => {
        setStatus(previousAgentStatusRef.current);
        setStatusStartedAt(Date.now());
      },
    }),
    [activeRightPanel, status],
  );

  return (
    <LayoutContext.Provider value={layoutContextValue}>
      <div className="flex h-screen w-full flex-col bg-[#F8F8F9]">
      <header className="flex h-12 shrink-0 items-center gap-4 px-4">
        <div className="flex min-w-0 items-center gap-4">
          <NiceLogoIcon />
          <span className="hidden truncate text-base font-semibold leading-7 tracking-[-0.02em] text-[#333333] min-[800px]:inline">
            Agent Workspace Premium
          </span>
        </div>

        <div className="flex min-w-0 flex-1 justify-center">
          <div className="relative w-full max-w-[420px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A7A7A]" />
            <Input
              type="search"
              placeholder="Omni-search"
              aria-label="Omni-search"
              className="h-9 rounded-full border-black/10 bg-white pl-9 pr-4 text-sm text-[#333333] placeholder:text-[#7A7A7A] focus-visible:ring-1 focus-visible:ring-[#D9CCFF] focus-visible:ring-offset-0"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <HeaderIconButton>
            <div className="relative">
              <Bell className="h-4 w-4 stroke-[1.8]" />
              <span className="absolute -right-0.5 top-0 h-1.5 w-1.5 rounded-full bg-[#6E00FD]" />
            </div>
          </HeaderIconButton>

          <Popover open={isAddNewPopoverOpen} onOpenChange={setIsAddNewPopoverOpen}>
            <PopoverTrigger asChild>
              <div>
                <HeaderIconButton
                  ariaLabel={isAddNewPopoverOpen ? "Hide add new popover" : "Show add new popover"}
                  isActive={isAddNewPopoverOpen}
                >
                  <Plus className="h-4 w-4 stroke-[1.8]" />
                </HeaderIconButton>
              </div>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={10} className="w-auto border-0 bg-transparent p-0 shadow-none">
              <AddNewPopoverContent />
            </PopoverContent>
          </Popover>

          <HeaderIconButton
            ariaLabel={layoutContextValue.isDeskOpen ? "Hide desk panel" : "Show desk panel"}
            onClick={layoutContextValue.toggleDesk}
            isActive={layoutContextValue.isDeskOpen}
          >
            <Monitor className="h-4 w-4 stroke-[1.8]" />
          </HeaderIconButton>


          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex min-h-8 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-1 text-[#333333] transition-colors hover:bg-[#F3ECFF] focus:outline-none"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold leading-none text-white shadow-[0_3px_8px_rgba(0,0,0,0.18)] ${activeStatus.dotClassName}`}
                >
                  JD
                </span>
                <span className="hidden min-w-0 flex-col items-start sm:flex">
                  <span className={`text-[15px] font-semibold leading-none tracking-[-0.02em] ${activeStatus.textClassName}`}>
                    {activeStatus.label}
                  </span>
                  <span className={`mt-1 text-[11px] font-medium leading-none ${activeStatus.textClassName}`}>
                    {formatStatusDuration(elapsedSeconds)}
                  </span>
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
                {statusOptions.filter((option) => option.label !== "In a Call").map((option) => (
                  <DropdownMenuItem
                    key={option.label}
                    onClick={() => {
                      setStatus(option.label);
                      setStatusStartedAt(Date.now());
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-normal text-[#333333] focus:bg-[#F8F8F9]"
                  >
                    <span className={`h-3 w-3 rounded-full ${option.dotClassName}`} />
                    <span>{option.label}</span>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-0 pb-4 pl-[56px] pr-4 pt-0">
        <LeftQueueRail />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-black/[0.16] bg-white">
          {children}
        </div>
      </div>
    </div>
    </LayoutContext.Provider>
  );
}
