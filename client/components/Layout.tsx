import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRightLeft,
  ArrowUpDown,
  Bell,
  Bot,
  ChevronDown,
  ClipboardList,
  FilePlus2,
  FileText,
  GripHorizontal,
  MessageSquare,
  Mic,
  Pause,
  Phone,
  PhoneOff,
  Plus,
  Search,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CopilotPopunder, { CopilotContent, type CopilotDragActivation } from "@/components/CopilotPopunder";
import ConversationPanel, { type SharedConversationData } from "@/components/ConversationPanel";
import NotesPanel from "@/components/NotesPanel";
import WorkspaceTabs from "@/components/WorkspaceTabs";
import { type RecentInteractionItem } from "@/components/RecentInteractionsPanel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LayoutProps {
  children: React.ReactNode;
}

type RightPanelView = "info" | "desk" | "interactions" | null;

interface LayoutContextValue {
  activeRightPanel: RightPanelView;
  isRightPanelOpen: boolean;
  isInfoOpen: boolean;
  isDeskOpen: boolean;
  isInteractionsOpen: boolean;
  isAddNewOpen: boolean;
  isAgentInCall: boolean;
  isAgentAvailable: boolean;
  isConversationPanelOpen: boolean;
  isConversationPopunderOpen: boolean;
  selectedAssignment: QueuePreviewItem;
  recentInteractions: RecentInteractionItem[];
  conversationState: SharedConversationData;
  toggleInfo: () => void;
  toggleDesk: () => void;
  toggleInteractions: () => void;
  toggleConversationPanel: () => void;
  openConversationPanel: () => void;
  openConversationPopunder: (anchorRect?: DOMRect | null) => void;
  closeConversationPopunder: () => void;
  setConversationState: (conversation: SharedConversationData) => void;
  closeRightPanel: () => void;
  selectAssignment: (assignmentId: QueuePreviewItem["id"]) => void;
  toggleCallPopunder: (anchorRect?: DOMRect | null) => void;
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
type WorkspaceOption = {
  id: string;
  name: string;
  description: string;
};

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

const initialWorkspaceOptions: WorkspaceOption[] = [
  { id: "default", name: "Default Workspace", description: "Primary support workspace" },
  { id: "billing", name: "Billing Operations", description: "Payments, invoices, and account reviews" },
  { id: "vip", name: "VIP Accounts", description: "Priority service for strategic customers" },
  { id: "escalations", name: "Escalation Desk", description: "High-priority and manager-reviewed cases" },
];

const defaultConversationState: SharedConversationData = {
  customerName: "Alex Kowalski",
  label: "SMS",
  timelineLabel: "SMS · Today, 10:24 AM",
  draft:
    "I see the transaction block. It appears our security system flagged it due to a recent mismatch in billing zip codes. Let me clear that flag for you.",
  messages: [
    {
      id: 1,
      role: "customer",
      content:
        "Hi, I'm trying to upgrade my subscription to the Pro tier, but my credit card keeps getting declined even though I know I have sufficient funds.",
      time: "10:24 AM",
      sentiment: "frustrated",
    },
    {
      id: 2,
      role: "agent",
      content:
        "Hello Alex! I'm sorry to hear you're experiencing issues upgrading your account. I can certainly help you look into this right away.",
      time: "10:25 AM",
    },
    {
      id: 3,
      role: "customer",
      content:
        "Thank you. It's the Visa ending in 4092. I just tried it again 5 minutes ago and got the same error.",
      time: "10:26 AM",
    },
  ],
};

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

type QueueSortOption = "created-desc" | "created-asc" | "updated-desc" | "updated-asc";

type QueuePreviewItem = {
  id: string;
  initials: string;
  name: string;
  time: string;
  preview: string;
  sentiment: string;
  sentimentClassName: string;
  badgeColor: string;
  icon: typeof Phone;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const queuePreviewItems: QueuePreviewItem[] = [
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
    createdAt: "2026-03-11T08:30:00",
    updatedAt: "2026-03-11T10:24:00",
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
    createdAt: "2026-03-11T09:02:00",
    updatedAt: "2026-03-11T10:22:00",
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
    createdAt: "2026-03-11T08:55:00",
    updatedAt: "2026-03-11T10:19:00",
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
    createdAt: "2026-03-11T07:40:00",
    updatedAt: "2026-03-11T10:00:00",
  },
];

type CallPopunderPosition = {
  x: number;
  y: number;
};

type CallPopunderSize = {
  width: number;
  height: number;
};

type ConversationPopunderPosition = {
  x: number;
  y: number;
};

type ConversationPopunderSize = {
  width: number;
  height: number;
};

type CallPopunderMode = "setup" | "connecting" | "controls" | "disposition";

const CALL_POPUNDER_WIDTH = 272;
const CALL_POPUNDER_MARGIN = 16;
const CALL_POPUNDER_GAP = 12;
const CONVERSATION_POPOUNDER_MARGIN = 16;
const CONVERSATION_POPOUNDER_GAP = 12;
const DOCKED_CONVERSATION_MIN_WIDTH = 320;
const DOCKED_CONVERSATION_DEFAULT_WIDTH = 420;
const DOCKED_CONVERSATION_MAX_WIDTH = 560;
const DOCKED_CONVERSATION_GAP = 16;
const DOCKED_CONVERSATION_CONTENT_DELAY_MS = 300;
const MIN_MAIN_WORKSPACE_WIDTH = 500;
const CALL_DISPOSITION_OPTIONS = ["Resolved", "Escalated", "Follow-up needed"] as const;

function getDockedConversationMaxWidth(hasDesktopRightPanel: boolean) {
  if (typeof window === "undefined") {
    return DOCKED_CONVERSATION_MAX_WIDTH;
  }

  const rightPanelWidth = hasDesktopRightPanel && window.innerWidth >= 1024 ? 380 : 0;

  return Math.max(
    DOCKED_CONVERSATION_MIN_WIDTH,
    Math.min(
      DOCKED_CONVERSATION_MAX_WIDTH,
      window.innerWidth - 56 - rightPanelWidth - MIN_MAIN_WORKSPACE_WIDTH - DOCKED_CONVERSATION_GAP - 16,
    ),
  );
}

function getDockedCopilotMaxWidth({
  hasDesktopRightPanel,
  isConversationPanelOpen,
  dockedConversationWidth,
}: {
  hasDesktopRightPanel: boolean;
  isConversationPanelOpen: boolean;
  dockedConversationWidth: number;
}) {
  if (typeof window === "undefined") {
    return 320;
  }

  const rightPanelWidth = hasDesktopRightPanel && window.innerWidth >= 1024 ? 380 : 0;
  const conversationWidth = isConversationPanelOpen && window.innerWidth >= 800
    ? dockedConversationWidth + DOCKED_CONVERSATION_GAP
    : 0;

  return Math.max(
    320,
    window.innerWidth - 56 - conversationWidth - rightPanelWidth - MIN_MAIN_WORKSPACE_WIDTH - 16,
  );
}
const assignmentCallDetails = {
  alex: { customerId: "CST-10482" },
  sarah: { customerId: "CST-10591" },
  emily: { customerId: "CST-10814" },
  david: { customerId: "CST-10363" },
} as const;

function formatRecentInteractionTimestamp(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  const hours = date.getHours();
  const hours12 = hours % 12 || 12;
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const meridiem = hours >= 12 ? "PM" : "AM";

  return `${month}/${day}/${year} ${hours12}:${minutes} ${meridiem}`;
}

function getDispositionStatusColor(disposition: (typeof CALL_DISPOSITION_OPTIONS)[number]) {
  if (disposition === "Resolved") return "bg-[#2CB770]";
  if (disposition === "Escalated") return "bg-[#D0021B]";
  return "bg-[#F59E0B]";
}

function CallAIGuidanceCard() {
  return (
    <div className="rounded-xl border border-[#D9CCFF] bg-[#FCFAFF] p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6E00FD]">
        <Sparkles className="h-3.5 w-3.5" />
        AI Guidance
      </div>
      <p className="mt-2 text-xs leading-5 text-[#333333]">
        Acknowledge the prior assistant handoff, confirm the beverage package upgrade request, and keep the customer from repeating details.
      </p>
      <ul className="mt-2 space-y-1 text-xs leading-5 text-[#6B7280]">
        <li>• Pronunciation: Kowalski (“Koah-wall-skee”)</li>
        <li>• Confirm whether the customer needs the upgrade completed today.</li>
        <li>• Reference the failed chat attempt before moving into troubleshooting.</li>
      </ul>
    </div>
  );
}

function CallControlsPopunder({
  position,
  size,
  mode,
  onPositionChange,
  onSizeChange,
  onClose,
  onLaunchCall,
  onEndCall,
  onSelectDisposition,
}: {
  position: CallPopunderPosition;
  size: CallPopunderSize;
  mode: CallPopunderMode;
  onPositionChange: (position: CallPopunderPosition) => void;
  onSizeChange: (size: CallPopunderSize) => void;
  onClose: () => void;
  onLaunchCall: () => void;
  onEndCall: () => void;
  onSelectDisposition: (disposition: (typeof CALL_DISPOSITION_OPTIONS)[number]) => void;
}) {
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: 360, height: 520 });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(true);
  const [audioLevels, setAudioLevels] = useState({ mic: 42, speaker: 58 });

  useEffect(() => {
    if (mode !== "setup") {
      setIsTestingAudio(false);
      return;
    }

    if (!isTestingAudio) return;

    const intervalId = window.setInterval(() => {
      setAudioLevels({
        mic: 20 + Math.round(Math.random() * 70),
        speaker: 25 + Math.round(Math.random() * 65),
      });
    }, 350);

    return () => window.clearInterval(intervalId);
  }, [isTestingAudio, mode]);

  useEffect(() => {
    setIsTranscriptExpanded(mode === "controls");
  }, [mode]);

  useEffect(() => {
    if (mode !== "controls" || !isTranscriptExpanded) return;

    const frameId = window.requestAnimationFrame(() => {
      transcriptScrollRef.current?.scrollTo({
        top: transcriptScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isTranscriptExpanded, mode]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const width = mode === "controls" ? size.width : CALL_POPUNDER_WIDTH;
    const height = mode === "setup" ? 320 : mode === "connecting" ? 296 : mode === "controls" ? size.height : 284;
    const nextPosition = {
      x: Math.min(
        Math.max(CALL_POPUNDER_MARGIN, position.x),
        window.innerWidth - width - CALL_POPUNDER_MARGIN,
      ),
      y: Math.min(
        Math.max(CALL_POPUNDER_MARGIN, position.y),
        window.innerHeight - height - CALL_POPUNDER_MARGIN,
      ),
    };

    if (nextPosition.x !== position.x || nextPosition.y !== position.y) {
      onPositionChange(nextPosition);
    }
  }, [mode, onPositionChange, position.x, position.y, size.height, size.width]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const width = mode === "controls" ? size.width : CALL_POPUNDER_WIDTH;
    const height = mode === "setup" ? 320 : mode === "connecting" ? 296 : mode === "controls" ? size.height : 284;

      if (isDraggingRef.current) {
        const nextX = event.clientX - dragOffsetRef.current.x;
        const nextY = event.clientY - dragOffsetRef.current.y;

        onPositionChange({
          x: Math.min(
            Math.max(CALL_POPUNDER_MARGIN, nextX),
            window.innerWidth - width - CALL_POPUNDER_MARGIN,
          ),
          y: Math.min(
            Math.max(CALL_POPUNDER_MARGIN, nextY),
            window.innerHeight - height - CALL_POPUNDER_MARGIN,
          ),
        });
        return;
      }

      if (!isResizingRef.current || mode !== "controls") return;

      const deltaX = event.clientX - resizeStartRef.current.mouseX;
      const deltaY = event.clientY - resizeStartRef.current.mouseY;

      onSizeChange({
        width: Math.min(
          Math.max(320, resizeStartRef.current.width + deltaX),
          window.innerWidth - position.x - CALL_POPUNDER_MARGIN,
        ),
        height: Math.min(
          Math.max(360, resizeStartRef.current.height + deltaY),
          window.innerHeight - position.y - CALL_POPUNDER_MARGIN,
        ),
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isResizingRef.current = false;
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [mode, onPositionChange, onSizeChange, position.x, position.y, size.height, size.width]);

  return (
    <div
      className="fixed z-[70] flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
      style={{
        left: position.x,
        top: position.y,
        width: mode === "controls" ? size.width : CALL_POPUNDER_WIDTH,
        height: mode === "controls" ? size.height : undefined,
      }}
    >
      <div
        className={cn(
          "flex cursor-grab items-center border-b border-black/10 bg-[#F8F8F9] px-3 py-2 active:cursor-grabbing",
          mode === "setup" ? "justify-between" : mode === "connecting" ? "justify-between" : "justify-start",
        )}
        onMouseDown={(event) => {
          const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
          if (!bounds) return;

          isDraggingRef.current = true;
          dragOffsetRef.current = {
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-[#333333]">
          <GripHorizontal className="h-4 w-4 text-[#7A7A7A]" />
          {mode === "setup"
            ? "Start Call"
            : mode === "connecting"
              ? "Connecting Call"
              : mode === "controls"
                ? "Active Call"
                : "Disposition"}
        </div>
        {(mode === "setup" || mode === "connecting") && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333]"
            aria-label="Close call controls"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className={cn("space-y-2 p-3", mode === "controls" && "flex min-h-0 flex-1 flex-col")}>
        {mode === "setup" ? (
          <>
            <div className="space-y-1">
              <label htmlFor="call-account-number" className="text-xs font-medium text-[#333333]">
                Account Number
              </label>
              <Input
                id="call-account-number"
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value)}
                placeholder="Enter account number"
                className="h-9 border-black/10 text-sm"
              />
            </div>

            <div className="space-y-2 rounded-xl border border-black/10 bg-[#F8F8F9] p-3">
              <div className="flex items-center justify-between gap-3 text-sm text-[#333333]">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-[#7A7A7A]" />
                  <span>Microphone volume</span>
                </div>
                <span className="text-xs text-[#7A7A7A]">{audioLevels.mic}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/10">
                <div className="h-full rounded-full bg-[#6E00FD] transition-[width] duration-300" style={{ width: `${audioLevels.mic}%` }} />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1 text-sm text-[#333333]">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-[#7A7A7A]" />
                  <span>Speaker volume</span>
                </div>
                <span className="text-xs text-[#7A7A7A]">{audioLevels.speaker}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/10">
                <div className="h-full rounded-full bg-[#6E00FD] transition-[width] duration-300" style={{ width: `${audioLevels.speaker}%` }} />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTestingAudio((current) => !current)}
                className="mt-1 w-full justify-center border-black/10 text-[#333333]"
              >
                {isTestingAudio ? "Stop Test" : "Test Audio"}
              </Button>
            </div>

            <Button
              type="button"
              onClick={onLaunchCall}
              disabled={!accountNumber.trim()}
              className="w-full bg-[#16A34A] text-white hover:bg-[#15803D]"
            >
              Launch Call
            </Button>
          </>
        ) : mode === "connecting" ? (
          <>
            <div className="rounded-xl border border-black/10 bg-[#F8F8F9] px-3 py-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#F3ECFF] text-[#6E00FD] animate-pulse">
                <Phone className="h-5 w-5" />
              </div>
              <div className="mt-3 text-sm font-semibold text-[#333333]">Connecting your call…</div>
              <p className="mt-1 text-xs leading-5 text-[#6B7280]">
                We’re reaching the customer now. AI guidance is ready and the transcript will appear once the call is live.
              </p>
            </div>

            <CallAIGuidanceCard />
          </>
        ) : mode === "controls" ? (
          <>
            <div className="flex flex-shrink-0 items-stretch gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-auto flex-1 flex-col gap-1 border-black/10 px-2 py-2 text-[11px] text-[#333333]"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Transfer
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-auto flex-1 flex-col gap-1 border-black/10 px-2 py-2 text-[11px] text-[#333333]"
              >
                <Pause className="h-4 w-4" />
                Hold
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onEndCall}
                className="h-auto flex-1 flex-col gap-1 border-[#F04438]/20 px-2 py-2 text-[11px] text-[#F04438] hover:bg-[#FFF5F5] hover:text-[#F04438]"
              >
                <PhoneOff className="h-4 w-4" />
                End Call
              </Button>
            </div>

            <div ref={transcriptScrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              <CallAIGuidanceCard />

              <div className="rounded-xl border border-black/10 bg-white">
                <button
                  type="button"
                  onClick={() => setIsTranscriptExpanded((current) => !current)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-[#333333]"
                >
                  <span>Transcript</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-[#7A7A7A] transition-transform",
                      isTranscriptExpanded && "rotate-180",
                    )}
                  />
                </button>

                {isTranscriptExpanded && (
                  <div className="border-t border-black/10 px-3 py-3 text-xs leading-5 text-[#333333]">
                    <div className="rounded-lg border border-[#D7E7D4] bg-[#F4FAF2] px-3 py-2.5 text-[13px] leading-6 text-[#355E3B]">
                      <p>Your call is connected. Please greet the customer and confirm the requested beverage package upgrade.</p>
                      <p className="mt-2">
                        Suggested opening: “Hello Mr. Kowalski, I see you were chatting with our team about upgrading your beverage package, and I can take it from here.”
                      </p>
                    </div>
                    <p className="mt-3">Agent: Hello Mr. Kowalski, I see you were chatting with our team about upgrading your beverage package, and I can take it from here.</p>
                    <p className="mt-2 text-[#7A7A7A]">
                      Customer: thanks - I just need to switch from Premium to Extended but they said I am not allowed to
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs leading-5 text-[#7A7A7A]">
              Select a disposition to complete the call.
            </p>
            {CALL_DISPOSITION_OPTIONS.map((option) => (
              <Button
                key={option}
                type="button"
                variant="outline"
                onClick={() => onSelectDisposition(option)}
                className="w-full justify-start border-black/10 text-[#333333]"
              >
                {option}
              </Button>
            ))}
          </>
        )}
      </div>

      {mode === "controls" && (
        <button
          type="button"
          aria-label="Resize call controls"
          className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize"
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            isResizingRef.current = true;
            resizeStartRef.current = {
              mouseX: event.clientX,
              mouseY: event.clientY,
              width: size.width,
              height: size.height,
            };
            document.body.style.userSelect = "none";
          }}
        >
          <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-sm border-b-2 border-r-2 border-[#A1A1AA]" />
        </button>
      )}
    </div>
  );
}

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

function AddNewPopoverContent({
  position,
  size,
  onPositionChange,
  onSizeChange,
  onClose,
}: {
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  onPositionChange: (position: { x: number; y: number }) => void;
  onSizeChange: (size: { width: number; height: number }) => void;
  onClose: () => void;
}) {
  const [selectedType, setSelectedType] = useState<AddNewType>("customer");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: 360, height: 720 });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);

  const fields = addNewFieldConfig[selectedType];
  const isSaveDisabled = fields.some((field) => !(formValues[field.key] ?? "").trim());

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const margin = 16;

      if (isDraggingRef.current) {
        const nextX = event.clientX - dragOffsetRef.current.x;
        const nextY = event.clientY - dragOffsetRef.current.y;

        onPositionChange({
          x: Math.min(Math.max(margin, nextX), window.innerWidth - size.width - margin),
          y: Math.min(Math.max(margin, nextY), window.innerHeight - size.height - margin),
        });
        return;
      }

      if (!isResizingRef.current) return;

      const deltaX = event.clientX - resizeStartRef.current.mouseX;
      const deltaY = event.clientY - resizeStartRef.current.mouseY;

      onSizeChange({
        width: Math.min(
          Math.max(320, resizeStartRef.current.width + deltaX),
          window.innerWidth - position.x - margin,
        ),
        height: Math.min(
          Math.max(420, resizeStartRef.current.height + deltaY),
          window.innerHeight - position.y - margin,
        ),
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isResizingRef.current = false;
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [onPositionChange, onSizeChange, position.x, position.y, size.height, size.width]);

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
    <div
      className="fixed z-[70] flex min-h-[420px] min-w-[320px] flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        maxWidth: "calc(100vw - 2rem)",
        maxHeight: "calc(100vh - 2rem)",
      }}
    >
      <div
        className="flex cursor-grab items-center justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
        onMouseDown={(event) => {
          isDraggingRef.current = true;
          dragOffsetRef.current = {
            x: event.clientX - position.x,
            y: event.clientY - position.y,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <div className="flex items-center gap-3">
          <GripHorizontal className="h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
          <h3 className="text-sm font-semibold tracking-tight text-[#333333]">Add New</h3>
        </div>
        <button
          type="button"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={onClose}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333]"
          aria-label="Close Add New popunder"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">
              Item Type
            </label>
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as AddNewType)}>
              <SelectTrigger className="h-9 rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333333] focus:ring-1 focus:ring-[#6E00FD]/30 focus:ring-offset-0 focus:border-[#6E00FD]">
                <SelectValue placeholder="Select item type" />
              </SelectTrigger>
              <SelectContent className="z-[80] rounded border border-[#E5E7EB] bg-white">
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
      </div>

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

      <button
        type="button"
        aria-label="Resize Add New popunder"
        className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          isResizingRef.current = true;
          resizeStartRef.current = {
            mouseX: event.clientX,
            mouseY: event.clientY,
            width: size.width,
            height: size.height,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-sm border-b-2 border-r-2 border-[#A1A1AA]" />
      </button>
    </div>
  );
}

function DockedConversationPanel({
  isOpen,
  width,
  conversation,
  hasDesktopRightPanel,
  onWidthChange,
  onClose,
  onUndockStart,
}: {
  isOpen: boolean;
  width: number;
  conversation: SharedConversationData;
  hasDesktopRightPanel: boolean;
  onWidthChange: (width: number) => void;
  onClose: () => void;
  onUndockStart: (event: React.MouseEvent<HTMLElement>) => void;
}) {
  const resizeStartRef = useRef({ mouseX: 0, width });
  const isResizingRef = useRef(false);
  const contentInitializedRef = useRef(false);
  const [isContentVisible, setIsContentVisible] = useState(isOpen);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingRef.current) return;

      const deltaX = event.clientX - resizeStartRef.current.mouseX;
      const maxWidth = getDockedConversationMaxWidth(hasDesktopRightPanel);

      onWidthChange(
        Math.min(
          maxWidth,
          Math.max(DOCKED_CONVERSATION_MIN_WIDTH, resizeStartRef.current.width + deltaX),
        ),
      );
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [hasDesktopRightPanel, onWidthChange]);

  useEffect(() => {
    if (!contentInitializedRef.current) {
      contentInitializedRef.current = true;
      return;
    }

    if (!isOpen) {
      setIsContentVisible(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsContentVisible(true);
    }, DOCKED_CONVERSATION_CONTENT_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "relative hidden min-h-0 overflow-visible transition-[width,margin,opacity,transform] duration-300 ease-out min-[800px]:block",
        isOpen ? "min-[800px]:translate-x-0 min-[800px]:opacity-100" : "pointer-events-none min-[800px]:-translate-x-4 min-[800px]:opacity-0",
      )}
      style={{
        width: isOpen ? width : 0,
        marginRight: isOpen ? DOCKED_CONVERSATION_GAP : 0,
      }}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-black/[0.16] bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        {isContentVisible && (
          <>
            <div
              className="flex cursor-grab items-start justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
              onMouseDown={onUndockStart}
            >
              <div className="flex items-start gap-3">
                <GripHorizontal className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold tracking-tight text-[#333333]">Conversation</h3>
                  <p className="truncate text-xs text-[#7A7A7A]">
                    {conversation.customerName} · {conversation.label}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close conversation panel"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={onClose}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ConversationPanel
              conversation={conversation}
              draftKey={`docked-${conversation.label}-${conversation.customerName}`}
            />
          </>
        )}
      </div>

      {isOpen && isContentVisible && (
        <button
          type="button"
          aria-label="Resize docked conversation panel"
          className="absolute inset-y-0 -right-2 z-10 hidden w-4 cursor-col-resize items-center justify-center min-[800px]:flex"
          onMouseDown={(event) => {
            event.preventDefault();
            isResizingRef.current = true;
            resizeStartRef.current = {
              mouseX: event.clientX,
              width,
            };
            document.body.style.userSelect = "none";
          }}
        >
          <span className="relative h-16 w-2 rounded-full border border-black/10 bg-white shadow-sm">
            <span className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-black/15" />
          </span>
        </button>
      )}
    </div>
  );
}

function DockedCopilotPanel({
  width,
  maxWidth,
  onClose,
  onWidthChange,
  onUndockStart,
}: {
  width: number;
  maxWidth: number;
  onClose: () => void;
  onWidthChange: (width: number) => void;
  onUndockStart: (event: React.MouseEvent<HTMLElement>) => void;
}) {
  const resizeStartRef = useRef({ mouseX: 0, width });
  const isResizingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingRef.current) return;

      const deltaX = event.clientX - resizeStartRef.current.mouseX;

      onWidthChange(
        Math.min(
          Math.max(320, resizeStartRef.current.width - deltaX),
          maxWidth,
        ),
      );
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [maxWidth, onWidthChange]);

  return (
    <div
      className="relative ml-4 flex h-full min-h-0 min-w-[320px] flex-shrink-0 flex-col overflow-hidden rounded-lg border border-black/[0.16] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
      style={{
        width,
        maxWidth: "calc(100vw - 2rem)",
      }}
    >
      <button
        type="button"
        aria-label="Resize docked NexAgent Copilot panel"
        className="absolute inset-y-0 -left-2 z-10 hidden w-4 cursor-col-resize items-center justify-center min-[800px]:flex"
        onMouseDown={(event) => {
          event.preventDefault();
          isResizingRef.current = true;
          resizeStartRef.current = {
            mouseX: event.clientX,
            width,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <span className="relative h-16 w-2 rounded-full border border-black/10 bg-white shadow-sm">
          <span className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-black/15" />
        </span>
      </button>

      <div
        className="flex cursor-grab items-start justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
        onMouseDown={onUndockStart}
      >
        <div className="flex items-start gap-3">
          <GripHorizontal className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-[#333333]">NiCE Copilot</h3>
            <p className="text-xs text-[#7A7A7A]">Drag to undock or use the header toggle to hide the panel</p>
          </div>
        </div>
        <button
          type="button"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={onClose}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333]"
          aria-label="Close docked NiCE Copilot"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <CopilotContent />
    </div>
  );
}

function ConversationPopunder({
  position,
  size,
  conversation,
  onPositionChange,
  onSizeChange,
  onClose,
  onDock,
  dragActivation = null,
}: {
  position: ConversationPopunderPosition;
  size: ConversationPopunderSize;
  conversation: SharedConversationData;
  onPositionChange: (position: ConversationPopunderPosition) => void;
  onSizeChange: (size: ConversationPopunderSize) => void;
  onClose: () => void;
  onDock?: () => void;
  dragActivation?: CopilotDragActivation | null;
}) {
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: size.width, height: size.height });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);

  useEffect(() => {
    if (!dragActivation) return;

    isDraggingRef.current = true;
    dragOffsetRef.current = dragActivation.offset;
    document.body.style.userSelect = "none";
  }, [dragActivation]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDraggingRef.current) {
        const nextX = event.clientX - dragOffsetRef.current.x;
        const nextY = event.clientY - dragOffsetRef.current.y;

        onPositionChange({
          x: Math.min(
            Math.max(CONVERSATION_POPOUNDER_MARGIN, nextX),
            window.innerWidth - size.width - CONVERSATION_POPOUNDER_MARGIN,
          ),
          y: Math.min(
            Math.max(CONVERSATION_POPOUNDER_MARGIN, nextY),
            window.innerHeight - size.height - CONVERSATION_POPOUNDER_MARGIN,
          ),
        });
        return;
      }

      if (!isResizingRef.current) return;

      const deltaX = event.clientX - resizeStartRef.current.mouseX;
      const deltaY = event.clientY - resizeStartRef.current.mouseY;

      onSizeChange({
        width: Math.min(
          Math.max(360, resizeStartRef.current.width + deltaX),
          window.innerWidth - position.x - CONVERSATION_POPOUNDER_MARGIN,
        ),
        height: Math.min(
          Math.max(420, resizeStartRef.current.height + deltaY),
          window.innerHeight - position.y - CONVERSATION_POPOUNDER_MARGIN,
        ),
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isResizingRef.current = false;
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [onPositionChange, onSizeChange, position.x, position.y, size.height, size.width]);

  return (
    <div
      className="fixed z-[70] flex min-h-[420px] min-w-[360px] flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        maxWidth: "calc(100vw - 2rem)",
        maxHeight: "calc(100vh - 2rem)",
      }}
    >
      <div
        className="flex cursor-grab items-center justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
        onMouseDown={(event) => {
          isDraggingRef.current = true;
          dragOffsetRef.current = {
            x: event.clientX - position.x,
            y: event.clientY - position.y,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <div className="flex items-center gap-3">
          <GripHorizontal className="h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-[#333333]">Conversation</h3>
            <p className="text-xs text-[#7A7A7A]">{conversation.customerName} · {conversation.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onDock ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={onDock}
              className="h-7 rounded-lg border-black/10 px-2.5 text-[11px] text-[#333333] hover:bg-white"
            >
              Dock Panel
            </Button>
          ) : null}
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={onClose}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333]"
            aria-label="Close conversation popunder"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ConversationPanel conversation={conversation} draftKey={`popunder-${conversation.label}-${conversation.customerName}`} />

      <button
        type="button"
        aria-label="Resize conversation popunder"
        className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          isResizingRef.current = true;
          resizeStartRef.current = {
            mouseX: event.clientX,
            mouseY: event.clientY,
            width: size.width,
            height: size.height,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-sm border-b-2 border-r-2 border-[#A1A1AA]" />
      </button>
    </div>
  );
}

function NotesPopoverContent({
  position,
  size,
  onPositionChange,
  onSizeChange,
  onClose,
}: {
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  onPositionChange: (position: { x: number; y: number }) => void;
  onSizeChange: (size: { width: number; height: number }) => void;
  onClose: () => void;
}) {
  const [addNoteTrigger, setAddNoteTrigger] = useState(0);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: size.width, height: size.height });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const margin = 16;

      if (isDraggingRef.current) {
        const nextX = event.clientX - dragOffsetRef.current.x;
        const nextY = event.clientY - dragOffsetRef.current.y;

        onPositionChange({
          x: Math.min(Math.max(margin, nextX), window.innerWidth - size.width - margin),
          y: Math.min(Math.max(margin, nextY), window.innerHeight - size.height - margin),
        });
        return;
      }

      if (!isResizingRef.current) return;

      const deltaX = event.clientX - resizeStartRef.current.mouseX;
      const deltaY = event.clientY - resizeStartRef.current.mouseY;

      onSizeChange({
        width: Math.min(
          Math.max(360, resizeStartRef.current.width + deltaX),
          window.innerWidth - position.x - margin,
        ),
        height: Math.min(
          Math.max(420, resizeStartRef.current.height + deltaY),
          window.innerHeight - position.y - margin,
        ),
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isResizingRef.current = false;
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [onPositionChange, onSizeChange, position.x, position.y, size.height, size.width]);

  return (
    <div
      className="fixed z-[70] flex min-h-[420px] min-w-[360px] flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        maxWidth: "calc(100vw - 2rem)",
        maxHeight: "calc(100vh - 2rem)",
      }}
    >
      <div
        className="flex cursor-grab items-center justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
        onMouseDown={(event) => {
          isDraggingRef.current = true;
          dragOffsetRef.current = {
            x: event.clientX - position.x,
            y: event.clientY - position.y,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <div className="flex items-center gap-3">
          <GripHorizontal className="h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
          <h3 className="text-sm font-semibold tracking-tight text-[#333333]">Notes</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={() => setAddNoteTrigger((current) => current + 1)}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333]"
            aria-label="Add note"
          >
            <FilePlus2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={onClose}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333]"
            aria-label="Close notes popunder"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <NotesPanel notesOnly addNoteTrigger={addNoteTrigger} />

      <button
        type="button"
        aria-label="Resize notes popunder"
        className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          isResizingRef.current = true;
          resizeStartRef.current = {
            mouseX: event.clientX,
            mouseY: event.clientY,
            width: size.width,
            height: size.height,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-sm border-b-2 border-r-2 border-[#A1A1AA]" />
      </button>
    </div>
  );
}

function HeaderIconButton({
  children,
  onClick,
  ariaLabel,
  ariaExpanded,
  ariaControls,
  isActive = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  isActive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
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

function QueueOverlayList({
  items,
  onSelectAssignment,
}: {
  items: QueuePreviewItem[];
  onSelectAssignment: (assignmentId: QueuePreviewItem["id"]) => void;
}) {
  return (
    <div className="min-h-full overflow-hidden bg-white">
      {items.map((item) => {
        const ItemIcon = item.icon;

        return (
          <div
            key={item.id}
            onClick={() => onSelectAssignment(item.id)}
            className={`group relative flex cursor-pointer gap-3 border-b border-black/[0.08] px-4 py-3.5 transition-colors last:border-b-0 ${
              item.isActive ? "bg-[#F3ECFF]" : "bg-white hover:bg-[#FCFAFF]"
            }`}
          >
            {item.isActive && <span className="absolute inset-y-0 left-0 w-1 bg-[#6E00FD]" />}

            <div className="relative mt-0.5 h-11 w-11 flex-shrink-0 self-start">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-[16px] font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-colors ${
                  item.isActive
                    ? "bg-[#6E00FD] text-white"
                    : "border border-black/15 bg-white text-[#6E00FD] group-hover:border-[#6E00FD]/20 group-hover:bg-[#F3ECFF]"
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
                  <div className="truncate text-[14px] font-semibold leading-5 text-[#333333] transition-colors group-hover:text-[#6E00FD]">
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

function ConversationToggleIcon({ isOpen, className }: { isOpen: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="3" width="16" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.5 4.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {isOpen ? (
        <path d="M9 7L6 10L9 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 7L9 10L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function LeftQueueRail() {
  const [isOpen, setIsOpen] = useState(false);
  const [sortOption, setSortOption] = useState<QueueSortOption>("updated-desc");
  const closeTimeoutRef = useRef<number | null>(null);
  const {
    selectedAssignment,
    selectAssignment,
    isConversationPanelOpen,
    toggleConversationPanel,
    openConversationPanel,
    openConversationPopunder,
    closeConversationPopunder,
  } = useLayoutContext();

  const sortedQueuePreviewItems = useMemo(() => {
    const items = [...queuePreviewItems];

    items.sort((a, b) => {
      const createdDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      const updatedDiff = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();

      if (sortOption === "created-asc") return createdDiff;
      if (sortOption === "created-desc") return -createdDiff;
      if (sortOption === "updated-asc") return updatedDiff;
      return -updatedDiff;
    });

    return items.map((item) => ({
      ...item,
      isActive: item.id === selectedAssignment.id,
    }));
  }, [selectedAssignment.id, sortOption]);

  const railQueuePreviewItems = useMemo(
    () =>
      queuePreviewItems.map((item) => ({
        ...item,
        isActive: item.id === selectedAssignment.id,
      })),
    [selectedAssignment.id],
  );

  const openAssignmentsPopover = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    setIsOpen(true);
  };

  const closeAssignmentsPopover = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
      closeTimeoutRef.current = null;
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 top-12 z-30 block">
      <div className="relative flex h-full">
        <aside className="flex h-full w-[56px] shrink-0 flex-col items-center bg-[#F8F8F9] py-3">
          <div className="flex flex-col items-center gap-2.5 pt-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={isConversationPanelOpen ? "Hide conversation" : "Show conversation"}
                  aria-pressed={isConversationPanelOpen}
                  onClick={() => {
                    if (isConversationPanelOpen) {
                      closeConversationPopunder();
                      toggleConversationPanel();
                      return;
                    }

                    openConversationPanel();
                  }}
                  onMouseEnter={(event) => {
                    if (!isConversationPanelOpen) {
                      openConversationPopunder(event.currentTarget.getBoundingClientRect());
                    }
                  }}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-[#4B4B4B] shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-colors hover:border-[#D9CCFF] hover:text-[#6E00FD]",
                    isConversationPanelOpen && "border-[#D9CCFF] bg-[#F3ECFF] text-[#6E00FD]",
                  )}
                >
                  <ConversationToggleIcon isOpen={isConversationPanelOpen} className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              {isConversationPanelOpen && (
                <TooltipContent side="right" className="border-black/10 bg-white text-[#333333]">
                  hide conversation
                </TooltipContent>
              )}
            </Tooltip>

            <div className="relative" onMouseEnter={openAssignmentsPopover} onMouseLeave={closeAssignmentsPopover}>
              <div className="flex flex-col items-center gap-2.5">
                {railQueuePreviewItems.map((item) => {
                  const ItemIcon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="relative flex h-12 w-12 items-center justify-center rounded-xl transition-transform hover:scale-[1.03]"
                      aria-label={`${item.name} queue item`}
                      onClick={() => selectAssignment(item.id)}
                    >
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-xl text-[16px] font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.06)] ${
                          item.isActive
                            ? "bg-[#6E00FD] text-white"
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

              <div
                className={`absolute left-full top-0 z-50 ml-3 transition-all duration-200 ease-in-out ${
                  isOpen
                    ? "pointer-events-auto translate-x-0 opacity-100"
                    : "pointer-events-none -translate-x-2 opacity-0"
                }`}
              >
                <div className="flex max-h-[calc(100vh-96px)] w-[320px] flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
                  <div className="flex shrink-0 items-center justify-between border-b border-black/[0.08] px-4 py-4">
                    <h3 className="text-sm font-semibold tracking-tight text-[#333333]">Assignments</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Sort assignments"
                          className="h-8 w-8 rounded-full border border-black/10 bg-white text-[#7A7A7A] hover:bg-[#F3ECFF] hover:text-[#6E00FD]"
                        >
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        sideOffset={8}
                        className="w-56 rounded-xl border border-black/10 bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
                      >
                        <DropdownMenuItem
                          onClick={() => setSortOption("created-asc")}
                          className="rounded-lg px-3 py-2 text-sm text-[#333333] focus:bg-[#F8F8F9]"
                        >
                          Create date ascending
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSortOption("created-desc")}
                          className="rounded-lg px-3 py-2 text-sm text-[#333333] focus:bg-[#F8F8F9]"
                        >
                          Create date descending
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSortOption("updated-asc")}
                          className="rounded-lg px-3 py-2 text-sm text-[#333333] focus:bg-[#F8F8F9]"
                        >
                          Last updated ascending
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSortOption("updated-desc")}
                          className="rounded-lg px-3 py-2 text-sm text-[#333333] focus:bg-[#F8F8F9]"
                        >
                          Last updated descending
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <QueueOverlayList items={sortedQueuePreviewItems} onSelectAssignment={selectAssignment} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
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
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<AgentStatus>("Available");
  const [activeRightPanel, setActiveRightPanel] = useState<RightPanelView>(null);
  const [isNotesPopoverOpen, setIsNotesPopoverOpen] = useState(false);
  const [isAddNewPopoverOpen, setIsAddNewPopoverOpen] = useState(false);
  const [isCopilotPopoverOpen, setIsCopilotPopoverOpen] = useState(true);
  const [isHeaderSearchOpen, setIsHeaderSearchOpen] = useState(false);
  const [notesPopunderPosition, setNotesPopunderPosition] = useState(() => ({ x: 0, y: 0 }));
  const [notesPopunderSize, setNotesPopunderSize] = useState(() => ({
    width: 420,
    height: typeof window === "undefined" ? 720 : Math.max(420, window.innerHeight - 80),
  }));
  const [addNewPopunderPosition, setAddNewPopunderPosition] = useState(() => ({ x: 0, y: 0 }));
  const [addNewPopunderSize, setAddNewPopunderSize] = useState(() => ({
    width: 360,
    height: typeof window === "undefined" ? 720 : Math.max(420, window.innerHeight - 80),
  }));
  const [copilotPopunderPosition, setCopilotPopunderPosition] = useState(() => ({ x: 0, y: 0 }));
  const [copilotPopunderSize, setCopilotPopunderSize] = useState(() => ({
    width: 360,
    height: typeof window === "undefined" ? 720 : Math.max(420, window.innerHeight - 80),
  }));
  const [isCopilotDocked, setIsCopilotDocked] = useState(true);
  const [copilotDragActivation, setCopilotDragActivation] = useState<CopilotDragActivation | null>(null);
  const [statusStartedAt, setStatusStartedAt] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [workspaceOptions, setWorkspaceOptions] = useState(initialWorkspaceOptions);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<WorkspaceOption["id"]>(initialWorkspaceOptions[0].id);
  const [isConversationPanelOpen, setIsConversationPanelOpen] = useState(true);
  const [conversationState, setConversationState] = useState<SharedConversationData>(defaultConversationState);
  const [dockedConversationWidth, setDockedConversationWidth] = useState(DOCKED_CONVERSATION_DEFAULT_WIDTH);
  const [isConversationPopunderOpen, setIsConversationPopunderOpen] = useState(false);
  const [conversationDragActivation, setConversationDragActivation] = useState<CopilotDragActivation | null>(null);
  const [conversationPopunderSize, setConversationPopunderSize] = useState<ConversationPopunderSize>({ width: 420, height: 720 });
  const [conversationPopunderPosition, setConversationPopunderPosition] = useState<ConversationPopunderPosition>(() => ({
    x: 84,
    y: 72,
  }));
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<QueuePreviewItem["id"]>(
    () => queuePreviewItems.find((item) => item.isActive)?.id ?? queuePreviewItems[0].id,
  );
  const [recentInteractions, setRecentInteractions] = useState<RecentInteractionItem[]>([]);
  const [isCallPopunderOpen, setIsCallPopunderOpen] = useState(false);
  const [callPopunderMode, setCallPopunderMode] = useState<CallPopunderMode>("setup");
  const [callPopunderSize, setCallPopunderSize] = useState<CallPopunderSize>({ width: 360, height: 520 });
  const [callPopunderPosition, setCallPopunderPosition] = useState<CallPopunderPosition>(() => {
    if (typeof window === "undefined") {
      return { x: 24, y: 24 };
    }

    return {
      x: Math.max(window.innerWidth - (CALL_POPUNDER_WIDTH + 24), CALL_POPUNDER_MARGIN),
      y: CALL_POPUNDER_MARGIN,
    };
  });
  const previousAgentStatusRef = useRef<Exclude<AgentStatus, "In a Call">>("Available");
  const callConnectTimeoutRef = useRef<number | null>(null);
  const headerSearchInputRef = useRef<HTMLInputElement>(null);
  const notesButtonRef = useRef<HTMLDivElement | null>(null);
  const addNewButtonRef = useRef<HTMLDivElement | null>(null);
  const copilotButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setElapsedSeconds(0);

    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - statusStartedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [statusStartedAt]);

  useEffect(() => {
    return () => {
      if (callConnectTimeoutRef.current !== null) {
        window.clearTimeout(callConnectTimeoutRef.current);
      }
    };
  }, []);

  const activeStatus = useMemo(
    () => statusOptions.find((option) => option.label === status) ?? statusOptions[0],
    [status],
  );
  const selectedAssignment = useMemo(
    () => queuePreviewItems.find((item) => item.id === selectedAssignmentId) ?? queuePreviewItems[0],
    [selectedAssignmentId],
  );
  const isActivityRoute = location.pathname === "/activity";
  const activeWorkspace = useMemo(
    () => workspaceOptions.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaceOptions[0],
    [activeWorkspaceId, workspaceOptions],
  );
  const selectedAssignmentCallDetail =
    assignmentCallDetails[selectedAssignment.id as keyof typeof assignmentCallDetails] ?? assignmentCallDetails.alex;

  const getAnchoredCallPopunderPosition = (anchorRect?: DOMRect | null) => {
    if (typeof window === "undefined") {
      return { x: 24, y: 24 };
    }

    if (!anchorRect) {
      return {
        x: Math.max(window.innerWidth - (CALL_POPUNDER_WIDTH + 24), CALL_POPUNDER_MARGIN),
        y: CALL_POPUNDER_MARGIN,
      };
    }

    return {
      x: Math.min(
        Math.max(CALL_POPUNDER_MARGIN, anchorRect.right - CALL_POPUNDER_WIDTH),
        window.innerWidth - CALL_POPUNDER_WIDTH - CALL_POPUNDER_MARGIN,
      ),
      y: Math.max(CALL_POPUNDER_MARGIN, anchorRect.bottom + CALL_POPUNDER_GAP),
    };
  };

  const getAnchoredNotesPopunderPosition = () => {
    if (typeof window === "undefined") {
      return { x: 16, y: 64 };
    }

    const margin = 16;
    const gap = 10;
    const popunderWidth = Math.min(notesPopunderSize.width, window.innerWidth - margin * 2);
    const buttonBounds = notesButtonRef.current?.getBoundingClientRect();

    return {
      x: Math.max(window.innerWidth - popunderWidth - margin, margin),
      y: Math.max(margin, (buttonBounds?.bottom ?? 48) + gap),
    };
  };

  const getAnchoredAddNewPopunderPosition = () => {
    if (typeof window === "undefined") {
      return { x: 16, y: 64 };
    }

    const margin = 16;
    const gap = 10;
    const popunderWidth = Math.min(addNewPopunderSize.width, window.innerWidth - margin * 2);
    const buttonBounds = addNewButtonRef.current?.getBoundingClientRect();

    return {
      x: Math.max(window.innerWidth - popunderWidth - margin, margin),
      y: Math.max(margin, (buttonBounds?.bottom ?? 48) + gap),
    };
  };

  const getAnchoredCopilotPopunderPosition = () => {
    if (typeof window === "undefined") {
      return { x: 16, y: 64 };
    }

    const margin = 16;
    const gap = 10;
    const popunderWidth = Math.min(copilotPopunderSize.width, window.innerWidth - margin * 2);
    const buttonBounds = copilotButtonRef.current?.getBoundingClientRect();

    return {
      x: Math.max(window.innerWidth - popunderWidth - margin, margin),
      y: Math.max(margin, (buttonBounds?.bottom ?? 48) + gap),
    };
  };

  const getAnchoredConversationPopunderPosition = (anchorRect?: DOMRect | null) => {
    if (typeof window === "undefined") {
      return { x: 84, y: 72 };
    }

    const width = Math.min(conversationPopunderSize.width, window.innerWidth - CONVERSATION_POPOUNDER_MARGIN * 2);
    const height = Math.min(conversationPopunderSize.height, window.innerHeight - CONVERSATION_POPOUNDER_MARGIN * 2);

    if (!anchorRect) {
      return {
        x: CONVERSATION_POPOUNDER_MARGIN + 56 + CONVERSATION_POPOUNDER_GAP,
        y: 72,
      };
    }

    return {
      x: Math.min(
        Math.max(CONVERSATION_POPOUNDER_MARGIN, anchorRect.right + CONVERSATION_POPOUNDER_GAP),
        window.innerWidth - width - CONVERSATION_POPOUNDER_MARGIN,
      ),
      y: Math.min(
        Math.max(CONVERSATION_POPOUNDER_MARGIN, anchorRect.top),
        window.innerHeight - height - CONVERSATION_POPOUNDER_MARGIN,
      ),
    };
  };

  useEffect(() => {
    if (isHeaderSearchOpen) {
      headerSearchInputRef.current?.focus();
    }
  }, [isHeaderSearchOpen]);

  useEffect(() => {
    if (!copilotDragActivation) return;

    const clearDragActivation = () => {
      setCopilotDragActivation(null);
    };

    window.addEventListener("mouseup", clearDragActivation);

    return () => window.removeEventListener("mouseup", clearDragActivation);
  }, [copilotDragActivation]);

  useEffect(() => {
    const syncDockedConversationWidth = () => {
      const maxWidth = getDockedConversationMaxWidth(activeRightPanel !== null);
      setDockedConversationWidth((current) => Math.min(current, maxWidth));
    };

    syncDockedConversationWidth();
    window.addEventListener("resize", syncDockedConversationWidth);

    return () => window.removeEventListener("resize", syncDockedConversationWidth);
  }, [activeRightPanel]);

  useEffect(() => {
    const syncDockedCopilotWidth = () => {
      const maxWidth = getDockedCopilotMaxWidth({
        hasDesktopRightPanel: activeRightPanel !== null,
        isConversationPanelOpen,
        dockedConversationWidth,
      });
      setCopilotPopunderSize((current) => ({
        ...current,
        width: Math.min(current.width, maxWidth),
      }));
    };

    syncDockedCopilotWidth();
    window.addEventListener("resize", syncDockedCopilotWidth);

    return () => window.removeEventListener("resize", syncDockedCopilotWidth);
  }, [activeRightPanel, dockedConversationWidth, isConversationPanelOpen]);

  const handleCreateWorkspace = () => {
    const nextWorkspaceNumber = workspaceOptions.filter((workspace) => workspace.id.startsWith("custom-")).length + 1;
    const newWorkspace: WorkspaceOption = {
      id: `custom-${Date.now()}`,
      name: `New Workspace ${nextWorkspaceNumber}`,
      description: "Custom workspace created from scratch",
    };

    setWorkspaceOptions((current) => [...current, newWorkspace]);
    setActiveWorkspaceId(newWorkspace.id);
    toast.success(`${newWorkspace.name} created`, {
      description: "You can now tailor this workspace for a new team or workflow.",
    });
  };

  const toggleConversationPanel = () => {
    setIsConversationPanelOpen((current) => {
      const next = !current;
      if (next) {
        setIsConversationPopunderOpen(false);
      }
      return next;
    });
  };

  const openConversationPanel = () => {
    setIsConversationPanelOpen(true);
    setIsConversationPopunderOpen(false);
    setConversationDragActivation(null);
  };

  const openConversationPopunder = (anchorRect?: DOMRect | null) => {
    if (isConversationPanelOpen) return;

    if (!isConversationPopunderOpen) {
      setConversationPopunderPosition(getAnchoredConversationPopunderPosition(anchorRect));
    }
    setConversationDragActivation(null);
    setIsConversationPopunderOpen(true);
  };

  const closeConversationPopunder = () => {
    setConversationDragActivation(null);
    setIsConversationPopunderOpen(false);
  };

  const layoutContextValue = useMemo(
    () => ({
      activeRightPanel,
      isRightPanelOpen: activeRightPanel !== null,
      isInfoOpen: activeRightPanel === "info",
      isDeskOpen: activeRightPanel === "desk",
      isInteractionsOpen: activeRightPanel === "interactions",
      isAddNewOpen: isAddNewPopoverOpen,
      isAgentInCall: status === "In a Call",
      isAgentAvailable: status === "Available",
      isConversationPanelOpen,
      isConversationPopunderOpen,
      selectedAssignment,
      recentInteractions,
      conversationState,
      toggleInfo: () => {
        setActiveRightPanel((current) =>
          current === "info" ? null : "info",
        );
      },
      toggleDesk: () => {
        setActiveRightPanel((current) =>
          current === "desk" ? null : "desk",
        );
      },
      toggleInteractions: () => {
        setActiveRightPanel((current) =>
          current === "interactions" ? null : "interactions",
        );
      },
      toggleConversationPanel,
      openConversationPanel,
      openConversationPopunder,
      closeConversationPopunder,
      setConversationState,
      closeRightPanel: () => setActiveRightPanel(null),
      selectAssignment: (assignmentId) => {
        setSelectedAssignmentId(assignmentId);
        navigate("/activity");
      },
      toggleCallPopunder: (anchorRect) => {
        if (status !== "In a Call" && isCallPopunderOpen) {
          if (callConnectTimeoutRef.current !== null) {
            window.clearTimeout(callConnectTimeoutRef.current);
            callConnectTimeoutRef.current = null;
          }
          setIsCallPopunderOpen(false);
          setCallPopunderMode("setup");
          return;
        }

        setCallPopunderMode(status === "In a Call" ? "controls" : "setup");
        setCallPopunderPosition(getAnchoredCallPopunderPosition(anchorRect));
        setIsCallPopunderOpen(true);
      },
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
    [
      activeRightPanel,
      conversationState,
      isAddNewPopoverOpen,
      isCallPopunderOpen,
      isConversationPanelOpen,
      isConversationPopunderOpen,
      navigate,
      openConversationPanel,
      recentInteractions,
      selectedAssignment,
      status,
      toggleConversationPanel,
    ],
  );

  return (
    <LayoutContext.Provider value={layoutContextValue}>
      <div className="flex h-screen w-full flex-col bg-[#F8F8F9]">
      <header className="flex min-h-[60px] shrink-0 items-center gap-2 px-4 py-2 lg:gap-4">
        <div className="flex flex-none items-center lg:min-w-0 lg:flex-1 lg:gap-3">
          <NiceLogoIcon />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Select workspace"
                className="hidden min-w-0 items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white/70 focus:outline-none lg:flex"
              >
                <span className="min-w-0">
                  <span className="block truncate text-base font-semibold leading-5 tracking-[-0.02em] text-[#333333]">
                    Agent Workspace
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-medium leading-4 text-[#7A7A7A]">
                    {activeWorkspace.name}
                  </span>
                </span>
                <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-[#666666]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={10}
              className="w-[300px] rounded-2xl border border-black/10 bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
            >
              <DropdownMenuLabel className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7A7A7A]">
                Workspaces
              </DropdownMenuLabel>
              <div className="space-y-1">
                {workspaceOptions.map((workspace) => {
                  const isActiveWorkspace = workspace.id === activeWorkspace.id;

                  return (
                    <DropdownMenuItem
                      key={workspace.id}
                      onClick={() => setActiveWorkspaceId(workspace.id)}
                      className="rounded-xl px-3 py-3 focus:bg-[#F8F8F9]"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          className={cn(
                            "mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full",
                            isActiveWorkspace ? "bg-[#6E00FD]" : "bg-black/10",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-[#333333]">{workspace.name}</div>
                          <div className="mt-0.5 text-xs leading-5 text-[#6B7280]">{workspace.description}</div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </div>
              <DropdownMenuSeparator className="my-2 bg-black/10" />
              <DropdownMenuItem
                onClick={handleCreateWorkspace}
                className="rounded-xl px-3 py-3 text-sm font-semibold text-[#6E00FD] focus:bg-[#F3ECFF]"
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Create new workspace</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          className={cn(
            "flex min-w-0 flex-1 justify-start pl-2 lg:flex-none lg:justify-center lg:px-2",
            isHeaderSearchOpen && "hidden",
          )}
        >
          <WorkspaceTabs />
        </div>

        <div className="relative flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-1.5">
          <div
            className={cn(
              "flex items-center gap-1.5",
              isHeaderSearchOpen && "mx-auto min-w-0 flex-1 justify-center",
            )}
          >
            <div
              id="header-search-input"
              className={cn(
                "overflow-hidden transition-all duration-200 ease-out",
                isHeaderSearchOpen
                  ? "w-full max-w-[640px] opacity-100"
                  : "pointer-events-none w-0 opacity-0",
              )}
            >
              <Input
                ref={headerSearchInputRef}
                type="search"
                placeholder="Search workspace"
                aria-label="Search workspace"
                tabIndex={isHeaderSearchOpen ? 0 : -1}
                className="h-9 w-full rounded-full border-black/10 bg-white px-4 text-sm text-[#333333] placeholder:text-[#7A7A7A] focus-visible:border-[#C9B8FF] focus-visible:ring-0 focus-visible:shadow-[inset_0_0_0_1px_#D9CCFF]"
              />
            </div>
          </div>

          {!isHeaderSearchOpen && (
            <>
              <HeaderIconButton>
                <div className="relative">
                  <Bell className="h-4 w-4 stroke-[1.8]" />
                  <span className="absolute -right-0.5 top-0 h-1.5 w-1.5 rounded-full bg-[#6E00FD]" />
                </div>
              </HeaderIconButton>

              <div ref={notesButtonRef}>
                <HeaderIconButton
                  ariaLabel={isNotesPopoverOpen ? "Hide notes popunder" : "Show notes popunder"}
                  ariaExpanded={isNotesPopoverOpen}
                  onClick={() => {
                    if (isNotesPopoverOpen) {
                      setIsNotesPopoverOpen(false);
                      return;
                    }

                    setNotesPopunderPosition(getAnchoredNotesPopunderPosition());
                    setIsNotesPopoverOpen(true);
                  }}
                  isActive={isNotesPopoverOpen}
                >
                  <FileText className="h-4 w-4 stroke-[1.8]" />
                </HeaderIconButton>
              </div>

              <div ref={addNewButtonRef}>
                <HeaderIconButton
                  ariaLabel={isAddNewPopoverOpen ? "Hide add new popover" : "Show add new popover"}
                  ariaExpanded={isAddNewPopoverOpen}
                  onClick={() => {
                    if (isAddNewPopoverOpen) {
                      setIsAddNewPopoverOpen(false);
                      return;
                    }

                    setAddNewPopunderPosition(getAnchoredAddNewPopunderPosition());
                    setIsAddNewPopoverOpen(true);
                  }}
                  isActive={isAddNewPopoverOpen}
                >
                  <Plus className="h-4 w-4 stroke-[1.8]" />
                </HeaderIconButton>
              </div>
            </>
          )}

          {!isHeaderSearchOpen && (
            <div ref={copilotButtonRef}>
              <HeaderIconButton
                ariaLabel={isCopilotPopoverOpen ? "Hide NexAgent Copilot" : "Show NexAgent Copilot"}
                ariaExpanded={isCopilotPopoverOpen}
                onClick={() => {
                  if (isCopilotPopoverOpen) {
                    setIsCopilotPopoverOpen(false);
                    return;
                  }

                  if (isCopilotDocked) {
                    setIsCopilotPopoverOpen(true);
                    return;
                  }

                  setCopilotPopunderPosition(getAnchoredCopilotPopunderPosition());
                  setIsCopilotPopoverOpen(true);
                }}
                isActive={isCopilotPopoverOpen}
              >
                <Bot className="h-4 w-4 stroke-[1.8]" />
              </HeaderIconButton>
            </div>
          )}

          <HeaderIconButton
            ariaLabel={isHeaderSearchOpen ? "Collapse header search" : "Expand header search"}
            ariaExpanded={isHeaderSearchOpen}
            ariaControls="header-search-input"
            onClick={() => setIsHeaderSearchOpen((current) => !current)}
            isActive={isHeaderSearchOpen}
          >
            <Search className="h-4 w-4 stroke-[1.8]" />
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
        <DockedConversationPanel
          isOpen={isConversationPanelOpen}
          width={dockedConversationWidth}
          conversation={conversationState}
          hasDesktopRightPanel={activeRightPanel !== null}
          onWidthChange={setDockedConversationWidth}
          onClose={() => setIsConversationPanelOpen(false)}
          onUndockStart={(event) => {
            if (typeof window === "undefined") return;

            event.preventDefault();

            const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
            if (!bounds) return;

            const margin = CONVERSATION_POPOUNDER_MARGIN;
            const nextPosition = {
              x: Math.min(
                Math.max(margin, bounds.left),
                window.innerWidth - conversationPopunderSize.width - margin,
              ),
              y: Math.min(
                Math.max(margin, bounds.top),
                window.innerHeight - conversationPopunderSize.height - margin,
              ),
            };

            setConversationPopunderPosition(nextPosition);
            setIsConversationPanelOpen(false);
            setIsConversationPopunderOpen(true);
            setConversationDragActivation({
              id: Date.now(),
              offset: {
                x: event.clientX - nextPosition.x,
                y: event.clientY - nextPosition.y,
              },
            });
          }}
        />
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col overflow-hidden min-[800px]:min-w-[500px]",
            isActivityRoute ? "bg-transparent" : "rounded-lg border border-black/[0.16] bg-white",
          )}
        >
          {children}
        </div>
        {isCopilotPopoverOpen && isCopilotDocked && (
          <DockedCopilotPanel
            width={copilotPopunderSize.width}
            maxWidth={getDockedCopilotMaxWidth({
              hasDesktopRightPanel: activeRightPanel !== null,
              isConversationPanelOpen,
              dockedConversationWidth,
            })}
            onClose={() => setIsCopilotPopoverOpen(false)}
            onWidthChange={(width) => setCopilotPopunderSize((current) => ({ ...current, width }))}
            onUndockStart={(event) => {
              if (typeof window === "undefined") return;

              event.preventDefault();

              const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
              if (!bounds) return;

              const margin = 16;
              const nextPosition = {
                x: Math.min(Math.max(margin, bounds.left), window.innerWidth - copilotPopunderSize.width - margin),
                y: Math.min(Math.max(margin, bounds.top), window.innerHeight - copilotPopunderSize.height - margin),
              };

              setCopilotPopunderPosition(nextPosition);
              setIsCopilotDocked(false);
              setIsCopilotPopoverOpen(true);
              setCopilotDragActivation({
                id: Date.now(),
                offset: {
                  x: event.clientX - nextPosition.x,
                  y: event.clientY - nextPosition.y,
                },
              });
            }}
          />
        )}
      </div>

      {isConversationPopunderOpen && !isConversationPanelOpen && (
        <ConversationPopunder
          position={conversationPopunderPosition}
          size={conversationPopunderSize}
          conversation={conversationState}
          onPositionChange={setConversationPopunderPosition}
          onSizeChange={setConversationPopunderSize}
          onClose={closeConversationPopunder}
          onDock={openConversationPanel}
          dragActivation={conversationDragActivation}
        />
      )}

      {isCallPopunderOpen && (
        <CallControlsPopunder
          position={callPopunderPosition}
          size={callPopunderSize}
          mode={callPopunderMode}
          onPositionChange={setCallPopunderPosition}
          onSizeChange={setCallPopunderSize}
          onClose={() => {
            if (callConnectTimeoutRef.current !== null) {
              window.clearTimeout(callConnectTimeoutRef.current);
              callConnectTimeoutRef.current = null;
            }
            setIsCallPopunderOpen(false);
            setCallPopunderMode(status === "In a Call" ? "controls" : "setup");
          }}
          onLaunchCall={() => {
            if (callConnectTimeoutRef.current !== null) {
              window.clearTimeout(callConnectTimeoutRef.current);
            }

            setCallPopunderMode("connecting");
            callConnectTimeoutRef.current = window.setTimeout(() => {
              layoutContextValue.startCallStatus();
              setCallPopunderMode("controls");
              setCopilotPopunderPosition(getAnchoredCopilotPopunderPosition());
              setIsCopilotPopoverOpen(true);
              callConnectTimeoutRef.current = null;
            }, 2000);
          }}
          onEndCall={() => setCallPopunderMode("disposition")}
          onSelectDisposition={(disposition) => {
            setRecentInteractions((current) => [
              {
                id: Date.now(),
                direction: "outbound",
                type: "voice",
                createdAt: formatRecentInteractionTimestamp(new Date()),
                status: disposition,
                customerName: selectedAssignment.name,
                customerId: selectedAssignmentCallDetail.customerId,
                channel: "Outbound Voice - Agent Workspace",
                statusColor: getDispositionStatusColor(disposition),
              },
              ...current,
            ]);
            layoutContextValue.endCallStatus();
            if (callConnectTimeoutRef.current !== null) {
              window.clearTimeout(callConnectTimeoutRef.current);
              callConnectTimeoutRef.current = null;
            }
            setIsCallPopunderOpen(false);
            setCallPopunderMode("setup");
          }}
        />
      )}

      {isNotesPopoverOpen && (
        <NotesPopoverContent
          position={notesPopunderPosition}
          size={notesPopunderSize}
          onPositionChange={setNotesPopunderPosition}
          onSizeChange={setNotesPopunderSize}
          onClose={() => setIsNotesPopoverOpen(false)}
        />
      )}

      {isAddNewPopoverOpen && (
        <AddNewPopoverContent
          position={addNewPopunderPosition}
          size={addNewPopunderSize}
          onPositionChange={setAddNewPopunderPosition}
          onSizeChange={setAddNewPopunderSize}
          onClose={() => setIsAddNewPopoverOpen(false)}
        />
      )}

      {isCopilotPopoverOpen && !isCopilotDocked && (
        <CopilotPopunder
          position={copilotPopunderPosition}
          size={copilotPopunderSize}
          onPositionChange={setCopilotPopunderPosition}
          onSizeChange={setCopilotPopunderSize}
          onClose={() => setIsCopilotPopoverOpen(false)}
          onDock={() => {
            setIsCopilotDocked(true);
            setIsCopilotPopoverOpen(true);
          }}
          dragActivation={copilotDragActivation}
        />
      )}
    </div>
    </LayoutContext.Provider>
  );
}
