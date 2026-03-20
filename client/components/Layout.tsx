import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRightLeft,
  Bell,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  FilePlus2,
  FileText,
  GripHorizontal,
  MessageSquare,
  Mic,
  Monitor,
  Pause,
  User,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CopilotPopunder, { CopilotContent, type CopilotDragActivation } from "@/components/CopilotPopunder";
import ConversationPanel, { type ConversationStatus, type SharedConversationData } from "@/components/ConversationPanel";
import DeskDataTable from "@/components/DeskDataTable";
import AddPanelContent from "@/components/AddPanelContent";
import NotesPanel from "@/components/NotesPanel";
import { type RecentInteractionItem } from "@/components/RecentInteractionsPanel";
import { cn } from "@/lib/utils";
import {
  createConversationState,
  customerDatabase,
  defaultCustomerId,
  type CustomerChannel,
  type CustomerQueueIcon,
} from "@/lib/customer-database";
import { toast } from "sonner";

interface LayoutProps {
  children: React.ReactNode;
}

type RightPanelView = "info" | "desk" | "interactions" | null;
type DeskCanvasView = "desk" | "copilot" | "notes" | "add" | "customer";
type FloatingPanelId = "conversation" | "customerInfo" | "deskCanvas" | "call" | "notes" | "addNew";
type CombinedInteractionPanelTab = "conversation" | "customerInfo" | "canvas";
type DeskPanelSelection = {
  initialTab?: string;
  ticketId?: string;
} | null;

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
  activeConversationChannel: CustomerChannel;
  selectedAssignment: QueuePreviewItem;
  deskPanelSelection: DeskPanelSelection;
  recentInteractions: RecentInteractionItem[];
  conversationState: SharedConversationData;
  toggleInfo: () => void;
  toggleDesk: () => void;
  openDeskPanel: (selection?: Exclude<DeskPanelSelection, null>) => void;
  toggleInteractions: () => void;
  toggleConversationPanel: () => void;
  openConversationPanel: () => void;
  openConversationPopunder: (anchorRect?: DOMRect | null) => void;
  closeConversationPopunder: () => void;
  setActiveConversationChannel: (channel: CustomerChannel) => void;
  setConversationState: (conversation: SharedConversationData) => void;
  closeRightPanel: () => void;
  selectAssignment: (assignmentId: QueuePreviewItem["id"]) => void;
  undockDeskPanel: (view: DeskCanvasView, event: React.MouseEvent<HTMLElement>) => void;
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
  { id: "desktop", name: "Desktop", description: "" },
  { id: "wem", name: "WEM", description: "" },
  { id: "schedule", name: "Schedule", description: "" },
  { id: "settings", name: "Settings", description: "" },
  { id: "reporting", name: "Reporting", description: "" },
];

const conversationStatusOptions: Array<{ value: ConversationStatus; label: string }> = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "pending", label: "Pending" },
];

function getConversationStatusChipClasses(status: ConversationStatus) {
  if (status === "open") {
    return "border-[#98D38D] bg-[#EAF8E6] text-[#2F7D32] hover:bg-[#E2F3DC]";
  }

  if (status === "pending") {
    return "border-[#E8C46A] bg-[#FFF3CD] text-[#9A6700] hover:bg-[#FDECB8]";
  }

  return "border-[#D0D5DD] bg-white text-[#667085] hover:bg-[#F9FAFB]";
}

const defaultConversationState: SharedConversationData = createConversationState(defaultCustomerId, "sms");

function getConversationStateKey(customerId: string, channel: CustomerChannel) {
  return `${customerId}:${channel}`;
}

type QueueSortOption = "created-desc" | "created-asc" | "updated-desc" | "updated-asc";

type QueuePreviewItem = {
  id: string;
  initials: string;
  name: string;
  customerId: string;
  lastUpdated: string;
  time: string;
  preview: string;
  priority: string;
  priorityClassName: string;
  badgeColor: string;
  icon: typeof Phone;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const queueIconMap: Record<CustomerQueueIcon, typeof Phone> = {
  phone: Phone,
  clipboardList: ClipboardList,
  messageSquare: MessageSquare,
};

const queuePreviewItems: QueuePreviewItem[] = customerDatabase.map((customer) => ({
  id: customer.id,
  initials: customer.initials,
  name: customer.name,
  customerId: customer.customerId,
  lastUpdated: customer.lastUpdated,
  time: customer.queue.time,
  preview: customer.queue.preview,
  priority: customer.queue.priority,
  priorityClassName: customer.queue.priorityClassName,
  badgeColor: customer.queue.badgeColor,
  icon: queueIconMap[customer.queue.icon],
  isActive: customer.queue.isActive,
  createdAt: customer.queue.createdAt,
  updatedAt: customer.queue.updatedAt,
}));

const priorityRankMap: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const priorityDotClassNameMap: Record<string, string> = {
  critical: "bg-[#F04438]",
  high: "bg-[#F79009]",
  medium: "bg-[#2E90FA]",
  low: "bg-[#12B76A]",
};

const priorityIconClassNameMap: Record<string, string> = {
  critical: "text-[#F04438]",
  high: "text-[#F79009]",
  medium: "text-[#2E90FA]",
  low: "text-[#12B76A]",
};

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

type CustomerInfoPopunderPosition = {
  x: number;
  y: number;
};

type CustomerInfoPopunderSize = {
  width: number;
  height: number;
};

type DeskCanvasPopunderPosition = {
  x: number;
  y: number;
};

type DeskCanvasPopunderSize = {
  width: number;
  height: number;
};

type CallPopunderMode = "setup" | "connecting" | "controls" | "disposition";

const CALL_POPUNDER_WIDTH = 272;
const CALL_POPUNDER_MARGIN = 16;
const CALL_POPUNDER_GAP = 12;
const CONVERSATION_POPOUNDER_MARGIN = 16;
const CONVERSATION_POPOUNDER_GAP = 12;
const DOCKED_CONVERSATION_MIN_WIDTH = 360;
const DOCKED_CONVERSATION_DEFAULT_WIDTH = 425;
const DOCKED_CONVERSATION_MAX_WIDTH = 560;
const DOCKED_CONVERSATION_GAP = 16;
const DOCKED_CONVERSATION_CONTENT_DELAY_MS = 300;
const MIN_MAIN_WORKSPACE_WIDTH = 360;
const CUSTOMER_INFO_PANEL_MIN_WIDTH = 360;
const CUSTOMER_INFO_PANEL_DEFAULT_WIDTH = 425;
const CUSTOMER_INFO_PANEL_MAX_WIDTH = 560;
const CUSTOMER_INFO_PANEL_GAP = 16;
const CUSTOMER_INFO_PANEL_BREAKPOINT = 1024;
const CUSTOMER_INFO_POPOUNDER_MARGIN = 16;
const CUSTOMER_INFO_POPOUNDER_GAP = 12;
const DESK_CANVAS_POPOUNDER_MARGIN = 16;
const DESK_CANVAS_POPOUNDER_MIN_HEIGHT = 420;
const DESK_CANVAS_POPOUNDER_DESK_MIN_WIDTH = 360;
const DESK_CANVAS_POPOUNDER_COPILOT_MIN_WIDTH = 360;
const DESK_CANVAS_POPOUNDER_DESK_DEFAULT_WIDTH = 760;
const DESK_CANVAS_POPOUNDER_COPILOT_DEFAULT_WIDTH = 360;
const ASSIGNMENTS_POPOVER_Z_INDEX = 90;
const FLOATING_PANEL_BASE_Z_INDEX = 70;
const COPILOT_DOCK_BREAKPOINT = 1280;
const COMBINED_INTERACTION_PANEL_BREAKPOINT = 1024;
const COMBINED_INTERACTION_PANEL_CANVAS_BREAKPOINT = 1280;
const CALL_DISPOSITION_OPTIONS = ["Resolved", "Escalated", "Follow-up needed"] as const;

function getDeskCanvasPopunderMinWidth(view: DeskCanvasView) {
  return view === "copilot"
    ? DESK_CANVAS_POPOUNDER_COPILOT_MIN_WIDTH
    : DESK_CANVAS_POPOUNDER_DESK_MIN_WIDTH;
}

function getDeskCanvasPopunderDefaultWidth(view: DeskCanvasView) {
  return view === "copilot"
    ? DESK_CANVAS_POPOUNDER_COPILOT_DEFAULT_WIDTH
    : DESK_CANVAS_POPOUNDER_DESK_DEFAULT_WIDTH;
}

function getAvailableDockedPanelWidth({
  hasDesktopRightPanel,
  reserveMainWorkspace,
  visiblePanelCount,
  hasMainCanvas,
}: {
  hasDesktopRightPanel: boolean;
  reserveMainWorkspace: boolean;
  visiblePanelCount: number;
  hasMainCanvas: boolean;
}) {
  if (typeof window === "undefined") {
    return 0;
  }

  const rightPanelWidth = hasDesktopRightPanel && window.innerWidth >= 1024 ? 380 : 0;
  const reservedMainWorkspaceWidth = reserveMainWorkspace ? MIN_MAIN_WORKSPACE_WIDTH : 0;
  const gapCount = visiblePanelCount === 0 ? 0 : Math.max(0, visiblePanelCount - 1) + (hasMainCanvas ? 1 : 0);

  return Math.max(
    0,
    window.innerWidth - 56 - rightPanelWidth - reservedMainWorkspaceWidth - gapCount * DOCKED_CONVERSATION_GAP - 16,
  );
}

function getDockedConversationMaxWidth({
  hasDesktopRightPanel,
  customerInfoPanelWidth,
  hasCustomerInfoPanel,
  reserveMainWorkspace,
  hasMainCanvas,
}: {
  hasDesktopRightPanel: boolean;
  customerInfoPanelWidth: number;
  hasCustomerInfoPanel: boolean;
  reserveMainWorkspace: boolean;
  hasMainCanvas: boolean;
}) {
  if (typeof window === "undefined") {
    return DOCKED_CONVERSATION_MAX_WIDTH;
  }

  const availableWidth = getAvailableDockedPanelWidth({
    hasDesktopRightPanel,
    reserveMainWorkspace,
    visiblePanelCount: hasCustomerInfoPanel ? 2 : 1,
    hasMainCanvas,
  });

  return Math.max(
    DOCKED_CONVERSATION_MIN_WIDTH,
    availableWidth - (hasCustomerInfoPanel ? customerInfoPanelWidth : 0),
  );
}

function getDockedCustomerInfoMaxWidth({
  hasDesktopRightPanel,
  isConversationPanelOpen,
  dockedConversationWidth,
  reserveMainWorkspace,
  hasMainCanvas,
}: {
  hasDesktopRightPanel: boolean;
  isConversationPanelOpen: boolean;
  dockedConversationWidth: number;
  reserveMainWorkspace: boolean;
  hasMainCanvas: boolean;
}) {
  if (typeof window === "undefined") {
    return CUSTOMER_INFO_PANEL_MAX_WIDTH;
  }

  const hasDockedConversation = isConversationPanelOpen && window.innerWidth >= 800;
  const availableWidth = getAvailableDockedPanelWidth({
    hasDesktopRightPanel,
    reserveMainWorkspace,
    visiblePanelCount: hasDockedConversation ? 2 : 1,
    hasMainCanvas,
  });

  return Math.max(
    CUSTOMER_INFO_PANEL_MIN_WIDTH,
    availableWidth - (hasDockedConversation ? dockedConversationWidth : 0),
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
    315,
    window.innerWidth - 56 - conversationWidth - rightPanelWidth - MIN_MAIN_WORKSPACE_WIDTH - 16,
  );
}

function getBalancedDockedPanelWidths({
  hasDesktopRightPanel,
  reserveMainWorkspace,
  showConversation,
  showCustomerInfo,
  hasMainCanvas,
  currentConversationWidth,
  currentCustomerInfoWidth,
}: {
  hasDesktopRightPanel: boolean;
  reserveMainWorkspace: boolean;
  showConversation: boolean;
  showCustomerInfo: boolean;
  hasMainCanvas: boolean;
  currentConversationWidth?: number;
  currentCustomerInfoWidth?: number;
}) {
  if (typeof window === "undefined") {
    return {
      conversationWidth: DOCKED_CONVERSATION_DEFAULT_WIDTH,
      customerInfoWidth: CUSTOMER_INFO_PANEL_DEFAULT_WIDTH,
    };
  }

  const visiblePanelCount = (showConversation ? 1 : 0) + (showCustomerInfo ? 1 : 0);
  const availableWidth = getAvailableDockedPanelWidth({
    hasDesktopRightPanel,
    reserveMainWorkspace,
    visiblePanelCount,
    hasMainCanvas,
  });

  if (!showCustomerInfo) {
    return {
      conversationWidth: Math.max(DOCKED_CONVERSATION_MIN_WIDTH, availableWidth),
      customerInfoWidth: CUSTOMER_INFO_PANEL_DEFAULT_WIDTH,
    };
  }

  if (!showConversation) {
    return {
      conversationWidth: DOCKED_CONVERSATION_DEFAULT_WIDTH,
      customerInfoWidth: Math.max(CUSTOMER_INFO_PANEL_MIN_WIDTH, availableWidth),
    };
  }

  const fallbackCustomerInfoWidth = Math.min(
    availableWidth - DOCKED_CONVERSATION_MIN_WIDTH,
    Math.max(CUSTOMER_INFO_PANEL_MIN_WIDTH, Math.round(availableWidth * 0.25)),
  );
  const fallbackConversationWidth = Math.max(DOCKED_CONVERSATION_MIN_WIDTH, availableWidth - fallbackCustomerInfoWidth);
  const nextConversationWidth = Math.max(DOCKED_CONVERSATION_MIN_WIDTH, currentConversationWidth ?? fallbackConversationWidth);
  const nextCustomerInfoWidth = Math.max(CUSTOMER_INFO_PANEL_MIN_WIDTH, currentCustomerInfoWidth ?? fallbackCustomerInfoWidth);
  const combinedWidth = nextConversationWidth + nextCustomerInfoWidth;

  if (combinedWidth <= 0) {
    return {
      conversationWidth: fallbackConversationWidth,
      customerInfoWidth: Math.max(CUSTOMER_INFO_PANEL_MIN_WIDTH, fallbackCustomerInfoWidth),
    };
  }

  const conversationRatio = nextConversationWidth / combinedWidth;
  const maxConversationWidth = availableWidth - CUSTOMER_INFO_PANEL_MIN_WIDTH;
  const conversationWidth = Math.min(
    maxConversationWidth,
    Math.max(DOCKED_CONVERSATION_MIN_WIDTH, Math.round(availableWidth * conversationRatio)),
  );
  const customerInfoWidth = Math.max(CUSTOMER_INFO_PANEL_MIN_WIDTH, availableWidth - conversationWidth);

  return {
    conversationWidth: availableWidth - customerInfoWidth,
    customerInfoWidth,
  };
}
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
    <div className="rounded-xl border border-[#B8D7F0] bg-[#EEF6FC] p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#006DAD]">
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

function ConversationStatusDropdown({
  status,
  onStatusChange,
}: {
  status: ConversationStatus;
  onStatusChange: (status: ConversationStatus) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
            getConversationStatusChipClasses(status),
          )}
        >
          <span>{conversationStatusOptions.find((option) => option.value === status)?.label ?? "Open"}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-32 rounded-xl border border-black/10 bg-white p-1 shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
        {conversationStatusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onStatusChange(option.value)}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-medium text-[#333333] focus:bg-[#F8F8F9]",
              option.value === status && "bg-[#F8F8F9]",
            )}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CallControlsPopunder({
  position,
  size,
  mode,
  zIndex,
  onPositionChange,
  onSizeChange,
  onClose,
  onLaunchCall,
  onEndCall,
  onSelectDisposition,
  onInteractStart,
}: {
  position: CallPopunderPosition;
  size: CallPopunderSize;
  mode: CallPopunderMode;
  zIndex: number;
  onPositionChange: (position: CallPopunderPosition) => void;
  onSizeChange: (size: CallPopunderSize) => void;
  onClose: () => void;
  onLaunchCall: () => void;
  onEndCall: () => void;
  onSelectDisposition: (disposition: (typeof CALL_DISPOSITION_OPTIONS)[number]) => void;
  onInteractStart?: () => void;
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
        zIndex,
      }}
    >
      <div
        className={cn(
          "flex cursor-grab items-center border-b border-black/10 bg-[#F8F8F9] px-3 py-2 active:cursor-grabbing",
          mode === "setup" ? "justify-between" : mode === "connecting" ? "justify-between" : "justify-start",
        )}
        onMouseDown={(event) => {
          onInteractStart?.();
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
                <div className="h-full rounded-full bg-[#006DAD] transition-[width] duration-300" style={{ width: `${audioLevels.mic}%` }} />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1 text-sm text-[#333333]">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-[#7A7A7A]" />
                  <span>Speaker volume</span>
                </div>
                <span className="text-xs text-[#7A7A7A]">{audioLevels.speaker}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/10">
                <div className="h-full rounded-full bg-[#006DAD] transition-[width] duration-300" style={{ width: `${audioLevels.speaker}%` }} />
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
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#E6F3FA] text-[#006DAD] animate-pulse">
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
  zIndex,
  onPositionChange,
  onSizeChange,
  onClose,
  onInteractStart,
}: {
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  zIndex: number;
  onPositionChange: (position: { x: number; y: number }) => void;
  onSizeChange: (size: { width: number; height: number }) => void;
  onClose: () => void;
  onInteractStart?: () => void;
}) {
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: 360, height: 720 });
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
        zIndex,
      }}
    >
      <div
        className="flex cursor-grab items-center justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
        onMouseDown={(event) => {
          onInteractStart?.();
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

      <AddPanelContent />

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
  maxWidth,
  conversation,
  activeChannel,
  customerRecordId,
  onConversationChange,
  onSelectChannel,
  onOpenDeskPanel,
  onOpenCall,
  onOpenCustomerInfo,
  onConversationStatusChange,
  isCallDisabled,
  onWidthChange,
  onClose,
  onUndockStart,
  showTrailingGap,
}: {
  isOpen: boolean;
  width: number;
  maxWidth: number;
  conversation: SharedConversationData;
  activeChannel: CustomerChannel;
  customerRecordId: string;
  onConversationChange: (conversation: SharedConversationData, channel?: CustomerChannel) => void;
  onSelectChannel: (channel: CustomerChannel) => void;
  onOpenDeskPanel: (selection?: Exclude<DeskPanelSelection, null>) => void;
  onOpenCall: (anchorRect?: DOMRect | null) => void;
  onOpenCustomerInfo: (event?: React.MouseEvent<HTMLElement>) => void;
  onConversationStatusChange: (status: ConversationStatus) => void;
  isCallDisabled: boolean;
  onWidthChange: (width: number) => void;
  onClose: () => void;
  onUndockStart: (event: React.MouseEvent<HTMLElement>) => void;
  showTrailingGap: boolean;
}) {
  const resizeStartRef = useRef({ mouseX: 0, width });
  const isResizingRef = useRef(false);
  const contentInitializedRef = useRef(false);
  const [isContentVisible, setIsContentVisible] = useState(isOpen);
  const shouldStackHeaderActions = width < 800;

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingRef.current) return;

      const deltaX = event.clientX - resizeStartRef.current.mouseX;

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
  }, [maxWidth, onWidthChange]);

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
        marginRight: isOpen && showTrailingGap ? DOCKED_CONVERSATION_GAP : 0,
      }}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-black/[0.16] bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        {isContentVisible && (
          <>
            <div
              className={cn(
                "flex min-h-[68px] cursor-grab border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing",
                shouldStackHeaderActions ? "flex-col items-stretch gap-3" : "items-start justify-between gap-3",
              )}
              onMouseDown={onUndockStart}
            >
              <div className="flex items-start gap-3">
                <GripHorizontal className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold tracking-tight text-[#333333]">Conversation</h3>
                    <div className="shrink-0" onMouseDown={(event) => event.stopPropagation()}>
                      <ConversationStatusDropdown
                        status={conversation.status}
                        onStatusChange={onConversationStatusChange}
                      />
                    </div>
                  </div>
                  <p className="truncate text-xs text-[#7A7A7A]">
                    {conversation.customerName} · {conversation.label}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "flex items-center gap-2",
                  shouldStackHeaderActions ? "pl-7" : "shrink-0",
                )}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={(event) => onOpenCall(event.currentTarget.getBoundingClientRect())}
                  disabled={isCallDisabled}
                  className="h-8 rounded-full border-black/10 px-3"
                >
                  <Phone className="mr-2 h-4 w-4" /> Call
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onMouseDown={(event) => {
                    event.stopPropagation();
                    onOpenCustomerInfo(event);
                  }}
                  onClick={(event) => {
                    if (event.detail === 0) {
                      onOpenCustomerInfo();
                    }
                  }}
                  className="h-8 rounded-full border-black/10 px-3 text-[#333333]"
                >
                  Customer Information
                </Button>
              </div>
            </div>

            <ConversationPanel
              conversation={conversation}
              activeChannel={activeChannel}
              customerId={customerRecordId}
              draftKey={`docked-${conversation.label}-${conversation.customerName}`}
              onConversationChange={onConversationChange}
              onSelectChannel={onSelectChannel}
              onOpenDeskPanel={onOpenDeskPanel}
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

function CombinedInteractionPanel({
  isOpen,
  width,
  maxWidth,
  activeTab,
  conversation,
  activeChannel,
  customerRecordId,
  customerName,
  customerId,
  panelSelection,
  showConversationTab,
  showCanvasTab,
  canvasTabLabel,
  canvasContent,
  isFullWidth,
  showCloseButton = !isFullWidth,
  onConversationChange,
  onSelectChannel,
  onOpenDeskPanel,
  onTabChange,
  onWidthChange,
  onClose,
}: {
  isOpen: boolean;
  width: number;
  maxWidth: number;
  activeTab: CombinedInteractionPanelTab;
  conversation: SharedConversationData;
  activeChannel: CustomerChannel;
  customerRecordId: string;
  customerName: string;
  customerId: string;
  panelSelection: DeskPanelSelection;
  showConversationTab: boolean;
  showCanvasTab: boolean;
  canvasTabLabel: string;
  canvasContent: React.ReactNode;
  isFullWidth: boolean;
  showCloseButton?: boolean;
  onConversationChange: (conversation: SharedConversationData, channel?: CustomerChannel) => void;
  onSelectChannel: (channel: CustomerChannel) => void;
  onOpenDeskPanel: (selection?: Exclude<DeskPanelSelection, null>) => void;
  onTabChange: (tab: CombinedInteractionPanelTab) => void;
  onWidthChange: (width: number) => void;
  onClose: () => void;
}) {
  const resizeStartRef = useRef({ mouseX: 0, width });
  const isResizingRef = useRef(false);
  const visibleTabCount = [showConversationTab, true, showCanvasTab].filter(Boolean).length;
  const panelTitle = showConversationTab ? "Conversation & Customer" : `${canvasTabLabel} & Customer`;

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingRef.current) return;

      const deltaX = event.clientX - resizeStartRef.current.mouseX;

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
  }, [maxWidth, onWidthChange]);

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "relative min-h-0 overflow-visible transition-[width,margin,opacity,transform] duration-300 ease-out",
        isFullWidth && "min-w-0 flex-1",
        isOpen ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-4 opacity-0",
      )}
      style={{
        width: isFullWidth ? undefined : isOpen ? width : 0,
        marginRight: isFullWidth ? 0 : isOpen ? DOCKED_CONVERSATION_GAP : 0,
      }}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-black/[0.16] bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <Tabs
          value={activeTab}
          onValueChange={(value) => onTabChange(value as CombinedInteractionPanelTab)}
          className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="shrink-0 border-b border-border bg-background/50 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold tracking-tight text-[#333333]">{panelTitle}</h3>
                <p className="truncate text-xs text-[#7A7A7A]">
                  {customerName} · {customerId}
                </p>
              </div>
              {showCloseButton && (
                <button
                  type="button"
                  aria-label="Close combined interaction panel"
                  onClick={onClose}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <TabsList
              className={cn(
                "mt-3 grid h-auto w-full gap-1 rounded-lg bg-[#F1F3F5] p-1",
                visibleTabCount === 3 ? "grid-cols-3" : visibleTabCount === 2 ? "grid-cols-2" : "grid-cols-1",
              )}
            >
              {showConversationTab && (
                <TabsTrigger value="conversation" className="rounded-md px-3 py-2 text-xs font-semibold text-[#5B5B5B] data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm">
                  Conversation
                </TabsTrigger>
              )}
              <TabsTrigger value="customerInfo" className="rounded-md px-3 py-2 text-xs font-semibold text-[#5B5B5B] data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm">
                Customer
              </TabsTrigger>
              {showCanvasTab && (
                <TabsTrigger value="canvas" className="rounded-md px-3 py-2 text-xs font-semibold text-[#5B5B5B] data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm">
                  {canvasTabLabel}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {showConversationTab && (
            <TabsContent value="conversation" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
              <ConversationPanel
                className="min-h-0 flex-1"
                conversation={conversation}
                activeChannel={activeChannel}
                customerId={customerRecordId}
                draftKey={`combined-${conversation.label}-${conversation.customerName}`}
                onConversationChange={onConversationChange}
                onSelectChannel={onSelectChannel}
                onOpenDeskPanel={onOpenDeskPanel}
              />
            </TabsContent>
          )}
          <TabsContent value="customerInfo" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
            <NotesPanel
              initialTab={panelSelection?.initialTab ?? "Overview"}
              initialTicketId={panelSelection?.ticketId}
              customerId={customerRecordId}
            />
          </TabsContent>
          {showCanvasTab && (
            <TabsContent value="canvas" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
              {canvasContent}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {isOpen && !isFullWidth && (
        <button
          type="button"
          aria-label="Resize combined interaction panel"
          className="absolute inset-y-0 -right-2 z-10 flex w-4 cursor-col-resize items-center justify-center"
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

function DockedCustomerInfoPanel({
  isOpen,
  width,
  maxWidth,
  customerRecordId,
  customerName,
  customerId,
  panelSelection,
  onWidthChange,
  onClose,
  onUndockStart,
  showTrailingGap,
}: {
  isOpen: boolean;
  width: number;
  maxWidth: number;
  customerRecordId: string;
  customerName: string;
  customerId: string;
  panelSelection: DeskPanelSelection;
  onWidthChange: (width: number) => void;
  onClose: () => void;
  onUndockStart: (event: React.MouseEvent<HTMLElement>) => void;
  showTrailingGap: boolean;
}) {
  const resizeStartRef = useRef({ mouseX: 0, width });
  const isResizingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingRef.current) return;

      const deltaX = event.clientX - resizeStartRef.current.mouseX;

      onWidthChange(
        Math.min(
          maxWidth,
          Math.max(CUSTOMER_INFO_PANEL_MIN_WIDTH, resizeStartRef.current.width + deltaX),
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
      aria-hidden={!isOpen}
      className={cn(
        "relative hidden min-h-0 overflow-visible transition-[width,margin,opacity,transform] duration-300 ease-out min-[1024px]:block",
        isOpen
          ? "min-[1024px]:translate-x-0 min-[1024px]:opacity-100"
          : "pointer-events-none min-[1024px]:-translate-x-4 min-[1024px]:opacity-0",
      )}
      style={{
        width: isOpen ? width : 0,
        marginRight: isOpen && showTrailingGap ? CUSTOMER_INFO_PANEL_GAP : 0,
      }}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-black/[0.16] bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div
          className="flex min-h-[68px] cursor-grab items-start justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
          onMouseDown={onUndockStart}
        >
          <div className="flex items-start gap-3">
            <GripHorizontal className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold tracking-tight text-[#333333]">Customer</h3>
              <p className="truncate text-xs text-[#7A7A7A]">
                {customerName} · {customerId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={onClose}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333]"
            aria-label="Close customer information panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <NotesPanel
          initialTab={panelSelection?.initialTab ?? "Overview"}
          initialTicketId={panelSelection?.ticketId}
          customerId={customerRecordId}
        />
      </div>

      {isOpen && (
        <button
          type="button"
          aria-label="Resize docked customer information panel"
          className="absolute inset-y-0 -right-2 z-10 hidden w-4 cursor-col-resize items-center justify-center min-[1024px]:flex"
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

function CustomerInfoPopunder({
  position,
  size,
  customerRecordId,
  customerName,
  customerId,
  panelSelection,
  zIndex,
  onPositionChange,
  onSizeChange,
  onClose,
  onDock,
  dragActivation = null,
  onInteractStart,
}: {
  position: CustomerInfoPopunderPosition;
  size: CustomerInfoPopunderSize;
  customerRecordId: string;
  customerName: string;
  customerId: string;
  panelSelection: DeskPanelSelection;
  zIndex: number;
  onPositionChange: (position: CustomerInfoPopunderPosition) => void;
  onSizeChange: (size: CustomerInfoPopunderSize) => void;
  onClose: () => void;
  onDock?: () => void;
  dragActivation?: CopilotDragActivation | null;
  onInteractStart?: () => void;
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
            Math.max(CUSTOMER_INFO_POPOUNDER_MARGIN, nextX),
            window.innerWidth - size.width - CUSTOMER_INFO_POPOUNDER_MARGIN,
          ),
          y: Math.min(
            Math.max(CUSTOMER_INFO_POPOUNDER_MARGIN, nextY),
            window.innerHeight - size.height - CUSTOMER_INFO_POPOUNDER_MARGIN,
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
          window.innerWidth - position.x - CUSTOMER_INFO_POPOUNDER_MARGIN,
        ),
        height: Math.min(
          Math.max(420, resizeStartRef.current.height + deltaY),
          window.innerHeight - position.y - CUSTOMER_INFO_POPOUNDER_MARGIN,
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
        zIndex,
      }}
    >
      <div
        className="flex cursor-grab items-center justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
        onMouseDown={(event) => {
          onInteractStart?.();
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
            <h3 className="text-sm font-semibold tracking-tight text-[#333333]">Customer Information</h3>
            <p className="text-xs text-[#7A7A7A]">{customerName} · {customerId}</p>
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
            aria-label="Close customer information popunder"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <NotesPanel
        initialTab={panelSelection?.initialTab ?? "Overview"}
        initialTicketId={panelSelection?.ticketId}
        customerId={customerRecordId}
      />

      <button
        type="button"
        aria-label="Resize customer information popunder"
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
      className="relative ml-4 flex h-full min-h-0 min-w-[320px] flex-shrink-0 flex-col overflow-visible"
      style={{
        width,
        maxWidth: "calc(100vw - 2rem)",
      }}
    >
      <button
        type="button"
        aria-label="Resize docked NiCE Copilot panel"
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

      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-black/[0.16] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div
          className="flex min-h-[68px] cursor-grab items-start justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
          onMouseDown={onUndockStart}
        >
          <div className="flex items-start gap-3">
            <GripHorizontal className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-[#333333]">NiCE Copilot</h3>
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
    </div>
  );
}

function DeskCanvasPopunder({
  view,
  position,
  size,
  customerId,
  zIndex,
  onPositionChange,
  onSizeChange,
  onClose,
  onDock,
  dragActivation = null,
  onInteractStart,
}: {
  view: DeskCanvasView;
  position: DeskCanvasPopunderPosition;
  size: DeskCanvasPopunderSize;
  customerId: string;
  zIndex: number;
  onPositionChange: (position: DeskCanvasPopunderPosition) => void;
  onSizeChange: (size: DeskCanvasPopunderSize) => void;
  onClose: () => void;
  onDock?: () => void;
  dragActivation?: CopilotDragActivation | null;
  onInteractStart?: () => void;
}) {
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: size.width, height: size.height });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const minWidth = getDeskCanvasPopunderMinWidth(view);
  const panelLabel = view === "copilot"
    ? "Copilot"
    : view === "notes"
      ? "Notes"
      : view === "add"
        ? "Add"
        : view === "customer"
          ? "Customer Information"
          : "Desk";

  useEffect(() => {
    if (!dragActivation) return;

    isDraggingRef.current = true;
    dragOffsetRef.current = dragActivation.offset;
    document.body.style.userSelect = "none";
  }, [dragActivation]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (typeof window === "undefined") return;

      if (isDraggingRef.current) {
        const nextX = event.clientX - dragOffsetRef.current.x;
        const nextY = event.clientY - dragOffsetRef.current.y;

        onPositionChange({
          x: Math.min(
            Math.max(DESK_CANVAS_POPOUNDER_MARGIN, nextX),
            window.innerWidth - size.width - DESK_CANVAS_POPOUNDER_MARGIN,
          ),
          y: Math.min(
            Math.max(DESK_CANVAS_POPOUNDER_MARGIN, nextY),
            window.innerHeight - size.height - DESK_CANVAS_POPOUNDER_MARGIN,
          ),
        });
        return;
      }

      if (!isResizingRef.current) return;

      const deltaX = event.clientX - resizeStartRef.current.mouseX;
      const deltaY = event.clientY - resizeStartRef.current.mouseY;

      onSizeChange({
        width: Math.min(
          Math.max(minWidth, resizeStartRef.current.width + deltaX),
          window.innerWidth - position.x - DESK_CANVAS_POPOUNDER_MARGIN,
        ),
        height: Math.min(
          Math.max(DESK_CANVAS_POPOUNDER_MIN_HEIGHT, resizeStartRef.current.height + deltaY),
          window.innerHeight - position.y - DESK_CANVAS_POPOUNDER_MARGIN,
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
  }, [minWidth, onPositionChange, onSizeChange, position.x, position.y, size.height, size.width]);

  return (
    <div
      className="fixed z-[70] flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        minWidth,
        maxWidth: "calc(100vw - 2rem)",
        maxHeight: "calc(100vh - 2rem)",
        zIndex,
      }}
    >
      <div
        className="flex cursor-grab items-start justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
        onMouseDown={(event) => {
          onInteractStart?.();
          isDraggingRef.current = true;
          dragOffsetRef.current = {
            x: event.clientX - position.x,
            y: event.clientY - position.y,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <div className="flex items-start gap-3">
          <GripHorizontal className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-[#333333]">{panelLabel}</h3>
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
              Dock panel
            </Button>
          ) : null}
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={onClose}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333]"
            aria-label={`Close ${panelLabel} popunder`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {view === "copilot"
          ? <CopilotContent />
          : view === "notes"
            ? <NotesPanel notesOnly />
            : view === "add"
              ? <AddPanelContent />
              : view === "customer"
                ? <NotesPanel customerId={customerId} />
                : <DeskDataTable />}
      </div>

      <button
        type="button"
        aria-label={`Resize ${panelLabel} popunder`}
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

function ConversationPopunder({
  position,
  size,
  conversation,
  activeChannel,
  customerRecordId,
  zIndex,
  onPositionChange,
  onSizeChange,
  onConversationChange,
  onSelectChannel,
  onOpenDeskPanel,
  onOpenCall,
  onOpenCustomerInfo,
  onConversationStatusChange,
  isCallDisabled,
  onDock,
  dragActivation = null,
  onInteractStart,
}: {
  position: ConversationPopunderPosition;
  size: ConversationPopunderSize;
  conversation: SharedConversationData;
  activeChannel: CustomerChannel;
  customerRecordId: string;
  zIndex: number;
  onPositionChange: (position: ConversationPopunderPosition) => void;
  onSizeChange: (size: ConversationPopunderSize) => void;
  onConversationChange: (conversation: SharedConversationData, channel?: CustomerChannel) => void;
  onSelectChannel: (channel: CustomerChannel) => void;
  onOpenDeskPanel: (selection?: Exclude<DeskPanelSelection, null>) => void;
  onOpenCall: (anchorRect?: DOMRect | null) => void;
  onOpenCustomerInfo: (event?: React.MouseEvent<HTMLElement>) => void;
  onConversationStatusChange: (status: ConversationStatus) => void;
  isCallDisabled: boolean;
  onDock?: () => void;
  dragActivation?: CopilotDragActivation | null;
  onInteractStart?: () => void;
}) {
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: size.width, height: size.height });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const shouldStackHeaderActions = size.width < 800;

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
        zIndex,
      }}
    >
      <div
        className={cn(
          "flex cursor-grab border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing",
          shouldStackHeaderActions ? "flex-col items-stretch gap-3" : "items-center justify-between gap-3",
        )}
        onMouseDown={(event) => {
          onInteractStart?.();
          isDraggingRef.current = true;
          dragOffsetRef.current = {
            x: event.clientX - position.x,
            y: event.clientY - position.y,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <GripHorizontal className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold tracking-tight text-[#333333]">Conversation</h3>
                <div className="shrink-0" onMouseDown={(event) => event.stopPropagation()}>
                  <ConversationStatusDropdown
                    status={conversation.status}
                    onStatusChange={onConversationStatusChange}
                  />
                </div>
              </div>
              <p className="text-xs text-[#7A7A7A]">{conversation.customerName} · {conversation.label}</p>
            </div>
          </div>
          {shouldStackHeaderActions && onDock ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={onDock}
              className="h-7 shrink-0 rounded-lg border-black/10 px-2.5 text-[11px] text-[#333333] hover:bg-white"
            >
              Dock Panel
            </Button>
          ) : null}
        </div>
        <div
          className={cn(
            "flex items-center gap-2",
            shouldStackHeaderActions ? "pl-7" : "",
          )}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => onOpenCall(event.currentTarget.getBoundingClientRect())}
            disabled={isCallDisabled}
            className="h-8 rounded-full border-black/10 px-3"
          >
            <Phone className="mr-2 h-4 w-4" /> Call
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onMouseDown={(event) => {
              event.stopPropagation();
              onOpenCustomerInfo(event);
            }}
            onClick={(event) => {
              if (event.detail === 0) {
                onOpenCustomerInfo();
              }
            }}
            className="h-8 rounded-full border-black/10 px-3 text-[#333333]"
          >
            Customer Information
          </Button>
          {!shouldStackHeaderActions && onDock ? (
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
        </div>
      </div>

      <ConversationPanel
        conversation={conversation}
        activeChannel={activeChannel}
        customerId={customerRecordId}
        draftKey={`popunder-${conversation.label}-${conversation.customerName}`}
        onConversationChange={onConversationChange}
        onSelectChannel={onSelectChannel}
        onOpenDeskPanel={onOpenDeskPanel}
      />

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
  zIndex,
  onPositionChange,
  onSizeChange,
  onClose,
  onInteractStart,
}: {
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  zIndex: number;
  onPositionChange: (position: { x: number; y: number }) => void;
  onSizeChange: (size: { width: number; height: number }) => void;
  onClose: () => void;
  onInteractStart?: () => void;
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
        zIndex,
      }}
    >
      <div
        className="flex cursor-grab items-center justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
        onMouseDown={(event) => {
          onInteractStart?.();
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
          ? "text-[#006DAD] hover:bg-[#E6F3FA]"
          : "text-[#7A7A7A] hover:bg-white/70 hover:text-[#333333]"
      }`}
    >
      {children}
    </button>
  );
}

function QueueAssignmentCard({
  item,
  onSelectAssignment,
  className,
  style,
}: {
  item: QueuePreviewItem;
  onSelectAssignment: (assignmentId: QueuePreviewItem["id"]) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ItemIcon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onSelectAssignment(item.id)}
      className={cn(
        "group relative flex w-full items-start gap-3 overflow-hidden rounded-[8px] border border-black/[0.06] bg-white px-4 py-4 text-left shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition-all duration-300",
        item.isActive
          ? "border-[#006DAD] shadow-[0_8px_22px_rgba(0,109,173,0.14)]"
          : "hover:-translate-y-0.5 hover:border-black/10 hover:shadow-[0_10px_24px_rgba(15,23,42,0.12)]",
        className,
      )}
      style={style}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-1 rounded-l-[8px]",
          item.isActive ? "bg-[#006DAD]" : "bg-[#F59E0B]",
        )}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-[14px] font-semibold leading-5 text-[#333333]">{item.name}</span>
              <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", item.priorityClassName)}>
                {item.priority.toLowerCase()}
              </span>
            </div>
          </div>
          <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#333333]" />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-[#6B6B6B]">
          <span className="inline-flex items-center gap-1.5">
            <ItemIcon className="h-4 w-4 text-[#16A34A]" />
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {item.time}
          </span>
        </div>

        <div className="mt-2 text-[13px] leading-5 text-[#5B5B5B]">{item.preview}</div>
      </div>
    </button>
  );
}

function QueueOverlayList({
  items,
  isOpen,
  onSelectAssignment,
}: {
  items: QueuePreviewItem[];
  isOpen: boolean;
  onSelectAssignment: (assignmentId: QueuePreviewItem["id"]) => void;
}) {
  return (
    <div className="space-y-3 bg-transparent p-3">
      {items.map((item, index) => (
        <QueueAssignmentCard
          key={item.id}
          item={item}
          onSelectAssignment={onSelectAssignment}
          className={cn(isOpen ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0")}
          style={{ transitionDelay: `${index * 35}ms` }}
        />
      ))}
    </div>
  );
}

function LeftQueueRail() {
  const [isOpen, setIsOpen] = useState(true);
  const [isPriorityAssistEnabled, setIsPriorityAssistEnabled] = useState(true);
  const {
    selectedAssignment,
    selectAssignment,
  } = useLayoutContext();

  const orderedQueuePreviewItems = useMemo(() => {
    const nextItems = queuePreviewItems.map((item) => ({
      ...item,
      isActive: item.id === selectedAssignment.id,
    }));

    if (!isPriorityAssistEnabled) {
      return nextItems;
    }

    return [...nextItems].sort(
      (left, right) =>
        (priorityRankMap[left.priority.toLowerCase()] ?? Number.MAX_SAFE_INTEGER) -
        (priorityRankMap[right.priority.toLowerCase()] ?? Number.MAX_SAFE_INTEGER),
    );
  }, [isPriorityAssistEnabled, selectedAssignment.id]);

  const toggleLeftRailOpen = () => {
    setIsOpen((current) => !current);
  };

  return (
    <div
      className={cn(
        "relative z-30 block h-full shrink-0 overflow-hidden transition-[width] duration-300 ease-out",
        isOpen ? "w-[315px]" : "w-[60px]",
      )}
    >
      <div className="relative flex h-full bg-[#F8F8F9]">
        <aside
          className={cn(
            "flex h-full shrink-0 flex-col items-center overflow-hidden bg-[#F8F8F9] pb-3 pt-0 transition-[width,opacity] duration-300 ease-out",
            isOpen ? "w-0 opacity-0 pointer-events-none" : "w-[60px] opacity-100",
          )}
          aria-hidden={isOpen}
        >
          <div className="flex h-full w-full flex-col items-center gap-2.5 px-1 pt-0">
            {!isOpen && (
              <button
                type="button"
                onClick={toggleLeftRailOpen}
                aria-label="Expand assignments rail"
                aria-pressed={false}
                className="flex h-12 w-[52px] items-center justify-center rounded-xl border border-black/10 bg-white text-[#333333] shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-colors hover:border-[#006DAD]/30 hover:text-[#006DAD]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            <div
              className={cn(
                "min-h-0 w-full flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                isOpen ? "pointer-events-none opacity-0" : "opacity-100",
              )}
              aria-hidden={isOpen}
            >
              <div className="flex w-full flex-col items-center gap-2 transition-opacity duration-200 ease-out">
                {orderedQueuePreviewItems.map((item) => {
                  const ItemIcon = item.icon;
                  const priorityKey = item.priority.toLowerCase();
                  const priorityDotClassName = priorityDotClassNameMap[priorityKey] ?? "bg-[#98A2B3]";
                  const priorityIconClassName = priorityIconClassNameMap[priorityKey] ?? "text-[#98A2B3]";

                  return (
                    <HoverCard key={item.id} openDelay={120} closeDelay={80}>
                      <HoverCardTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "relative flex h-[50px] w-[52px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 text-center transition-all duration-200",
                            item.isActive
                              ? "border border-[#006DAD]/15 bg-white shadow-[0_6px_18px_rgba(0,109,173,0.12)]"
                              : "border border-transparent bg-transparent hover:border-black/5 hover:bg-white/80",
                          )}
                          aria-label={`${item.name} queue item`}
                          onClick={() => selectAssignment(item.id)}
                        >
                          <span
                            aria-hidden="true"
                            className={cn("absolute right-1.5 top-1.5 h-2 w-2 rounded-full", priorityDotClassName)}
                          />
                          <ItemIcon className={cn("h-5 w-5", priorityIconClassName)} />
                          <span
                            className={cn(
                              "text-[9px] font-semibold leading-none tabular-nums tracking-[-0.02em]",
                              item.isActive ? "text-[#006DAD]" : "text-[#667085]",
                            )}
                          >
                            {item.time}
                          </span>
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent
                        side="right"
                        align="start"
                        sideOffset={14}
                        className="w-[295px] border-none bg-transparent p-0 shadow-none"
                      >
                        <QueueAssignmentCard item={item} onSelectAssignment={selectAssignment} />
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        <div
          className={cn(
            "h-full overflow-hidden transition-[width,opacity] duration-300 ease-out",
            isOpen ? "w-[315px] opacity-100" : "w-0 opacity-0",
          )}
        >
          <div
            className={cn(
              "flex h-full w-[315px] min-w-[315px] flex-col bg-[#F8F8F9] pr-3 transition-transform duration-300 ease-out",
              isOpen ? "translate-x-0" : "-translate-x-8",
            )}
          >
            <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-[#F8F8F9]">
              <div className="shrink-0 px-4 pb-4 pt-0">
                <div className="rounded-[8px] bg-white px-3 py-3">
                  <div className="mb-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleLeftRailOpen}
                      aria-label="Collapse assignments rail"
                      aria-pressed={true}
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white text-[#333333] shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-colors hover:border-[#006DAD]/30 hover:text-[#006DAD]"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold tracking-tight text-[#333333]">Assignments</h3>
                      <p className="text-sm text-[#7A7A7A]">0/{orderedQueuePreviewItems.length} completed</p>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <label htmlFor="ai-priority-assist" className="text-sm font-medium text-[#333333]">
                        AI Priority Assist
                      </label>
                    </div>
                    <Switch
                      id="ai-priority-assist"
                      checked={isPriorityAssistEnabled}
                      onCheckedChange={setIsPriorityAssistEnabled}
                      aria-label="Toggle AI Priority Assist"
                      className="mt-0.5 data-[state=checked]:bg-[#006DAD] data-[state=unchecked]:bg-[#D0D5DD]"
                    />
                  </div>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <QueueOverlayList items={orderedQueuePreviewItems} isOpen={isOpen} onSelectAssignment={selectAssignment} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatStatusDuration(totalSeconds: number) {
  const normalizedTotalSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(normalizedTotalSeconds / 3600) % 100;
  const minutes = Math.floor((normalizedTotalSeconds % 3600) / 60);
  const seconds = normalizedTotalSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function formatConversationReplyTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function generateSimulatedCustomerReply(conversation: SharedConversationData, agentMessage: string) {
  const normalizedMessage = agentMessage.toLowerCase();
  const latestCustomerContext = [...conversation.messages]
    .reverse()
    .find((message) => message.role === "customer")
    ?.content.toLowerCase() ?? "";

  if (
    normalizedMessage.includes("screenshot") ||
    normalizedMessage.includes("screen shot") ||
    normalizedMessage.includes("photo") ||
    normalizedMessage.includes("image")
  ) {
    return "Yes — I can send a screenshot of the error. Do you want the full page or just the payment section?";
  }

  if (normalizedMessage.includes("refresh") || normalizedMessage.includes("reload")) {
    if (
      latestCustomerContext.includes("same error") ||
      latestCustomerContext.includes("billing mismatch") ||
      latestCustomerContext.includes("doesn't match")
    ) {
      return "I refreshed and tried it again, but I am still seeing the same billing mismatch message on my side.";
    }

    return "I refreshed and retried it just now, but the upgrade is still not going through.";
  }

  if (normalizedMessage.includes("retry") || normalizedMessage.includes("try again") || normalizedMessage.includes("try it again")) {
    if (normalizedMessage.includes("without leaving") || normalizedMessage.includes("stay in this conversation")) {
      return "Okay, I am retrying it now while staying in this chat. I will tell you exactly what happens.";
    }

    return "I just retried it and I am still getting blocked at the same step.";
  }

  if (normalizedMessage.includes("flag") || normalizedMessage.includes("block") || normalizedMessage.includes("cleared")) {
    return "I just tried it again and it worked this time. Thank you for getting that cleared so quickly.";
  }

  if (normalizedMessage.includes("zip") || normalizedMessage.includes("billing")) {
    return "That could be it. I recently moved, so the billing zip code may still be the old one. Where should I update it?";
  }

  if (normalizedMessage.includes("charged twice") || normalizedMessage.includes("double charge")) {
    return "That is my main concern too. I just want to make sure I will not end up with a duplicate charge if I retry it.";
  }

  if (normalizedMessage.includes("payment link") || normalizedMessage.includes("secure link")) {
    return "Yes, a payment link would be helpful. Please send it over and I will complete it right away.";
  }

  if (normalizedMessage.includes("email") || normalizedMessage.includes("inbox")) {
    return "Perfect — please send it over and I will watch for it in my inbox.";
  }

  if (normalizedMessage.includes("send") && normalizedMessage.includes("over")) {
    return "Yes, please send that over. I can review it right away once it comes through.";
  }

  if (normalizedMessage.includes("card") || normalizedMessage.includes("visa") || normalizedMessage.includes("payment")) {
    return "Understood. I have the same card ready to use again. Should I retry it now, or is there anything I should update first?";
  }

  if (normalizedMessage.includes("upgrade") || normalizedMessage.includes("subscription") || normalizedMessage.includes("pro tier")) {
    return "Okay, thanks. I mainly want to make sure the upgrade goes through today and that I do not get charged twice.";
  }

  if (normalizedMessage.includes("meeting") || normalizedMessage.includes("today") || normalizedMessage.includes("urgent")) {
    return "Thank you — I am on a bit of a deadline, so I appreciate you staying on this with me.";
  }

  return "Thanks for the update. That helps. What should I do next on my side?";
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<AgentStatus>("Available");
  const [activeRightPanel, setActiveRightPanel] = useState<RightPanelView>(null);
  const [deskPanelSelection, setDeskPanelSelection] = useState<DeskPanelSelection>(null);
  const [isNotesPopoverOpen, setIsNotesPopoverOpen] = useState(false);
  const [isAddNewPopoverOpen, setIsAddNewPopoverOpen] = useState(false);
  const [isCopilotPopoverOpen, setIsCopilotPopoverOpen] = useState(true);
  const [deskCanvasPopunderView, setDeskCanvasPopunderView] = useState<DeskCanvasView | null>(null);
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
    width: 315,
    height: typeof window === "undefined" ? 720 : Math.max(420, window.innerHeight - 80),
  }));
  const [deskCanvasPopunderPosition, setDeskCanvasPopunderPosition] = useState<DeskCanvasPopunderPosition>(() => ({ x: 0, y: 0 }));
  const [deskCanvasPopunderSize, setDeskCanvasPopunderSize] = useState<DeskCanvasPopunderSize>(() => ({
    width: DESK_CANVAS_POPOUNDER_DESK_DEFAULT_WIDTH,
    height: typeof window === "undefined" ? 720 : Math.max(DESK_CANVAS_POPOUNDER_MIN_HEIGHT, window.innerHeight - 80),
  }));
  const [isCopilotDockingAllowed, setIsCopilotDockingAllowed] = useState(
    () => typeof window === "undefined" ? true : window.innerWidth >= COPILOT_DOCK_BREAKPOINT,
  );
  const [isCopilotDocked, setIsCopilotDocked] = useState(
    () => typeof window === "undefined" ? true : window.innerWidth >= COPILOT_DOCK_BREAKPOINT,
  );
  const [isCombinedInteractionPanelEnabled, setIsCombinedInteractionPanelEnabled] = useState(
    () => typeof window === "undefined" ? false : window.innerWidth < COMBINED_INTERACTION_PANEL_BREAKPOINT,
  );
  const [isCombinedInteractionPanelCanvasEnabled, setIsCombinedInteractionPanelCanvasEnabled] = useState(
    () => typeof window === "undefined" ? false : window.innerWidth < COMBINED_INTERACTION_PANEL_CANVAS_BREAKPOINT,
  );
  const [copilotDragActivation, setCopilotDragActivation] = useState<CopilotDragActivation | null>(null);
  const [deskCanvasDragActivation, setDeskCanvasDragActivation] = useState<CopilotDragActivation | null>(null);
  const [statusStartedAt, setStatusStartedAt] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [workspaceOptions, setWorkspaceOptions] = useState(initialWorkspaceOptions);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<WorkspaceOption["id"]>(initialWorkspaceOptions[0].id);
  const [isConversationPanelOpen, setIsConversationPanelOpen] = useState(true);
  const [activeConversationChannel, setActiveConversationChannel] = useState<CustomerChannel>("sms");
  const [conversationStatesByKey, setConversationStatesByKey] = useState<Record<string, SharedConversationData>>(() => ({
    [getConversationStateKey(defaultCustomerId, "sms")]: defaultConversationState,
  }));
  const [dockedConversationWidth, setDockedConversationWidth] = useState(() =>
    getBalancedDockedPanelWidths({
      hasDesktopRightPanel: false,
      reserveMainWorkspace: false,
      showConversation: true,
      showCustomerInfo: false,
      hasMainCanvas: false,
    }).conversationWidth,
  );
  const [isConversationPopunderOpen, setIsConversationPopunderOpen] = useState(false);
  const [isCustomerInfoPanelOpen, setIsCustomerInfoPanelOpen] = useState(false);
  const [dockedCustomerInfoWidth, setDockedCustomerInfoWidth] = useState(() =>
    getBalancedDockedPanelWidths({
      hasDesktopRightPanel: false,
      reserveMainWorkspace: false,
      showConversation: true,
      showCustomerInfo: false,
      hasMainCanvas: false,
    }).customerInfoWidth,
  );
  const [isCustomerInfoPopunderOpen, setIsCustomerInfoPopunderOpen] = useState(false);
  const [isCustomerInfoPanelAllowed, setIsCustomerInfoPanelAllowed] = useState(
    () => typeof window === "undefined" ? true : window.innerWidth >= CUSTOMER_INFO_PANEL_BREAKPOINT,
  );
  const dockedConversationWidthRef = useRef(dockedConversationWidth);
  const dockedCustomerInfoWidthRef = useRef(dockedCustomerInfoWidth);
  const [combinedInteractionPanelTab, setCombinedInteractionPanelTab] = useState<CombinedInteractionPanelTab>("conversation");
  const [conversationDragActivation, setConversationDragActivation] = useState<CopilotDragActivation | null>(null);
  const [customerInfoDragActivation, setCustomerInfoDragActivation] = useState<CopilotDragActivation | null>(null);
  const wasExpandedCanvasRouteRef = useRef(false);
  const [floatingPanelOrder, setFloatingPanelOrder] = useState<FloatingPanelId[]>([
    "call",
    "notes",
    "addNew",
    "conversation",
    "customerInfo",
    "deskCanvas",
  ]);
  const [conversationPopunderSize, setConversationPopunderSize] = useState<ConversationPopunderSize>({ width: 315, height: 720 });
  const [conversationPopunderPosition, setConversationPopunderPosition] = useState<ConversationPopunderPosition>(() => ({
    x: 84,
    y: 72,
  }));
  const [customerInfoPopunderSize, setCustomerInfoPopunderSize] = useState<CustomerInfoPopunderSize>({ width: 380, height: 720 });
  const [customerInfoPopunderPosition, setCustomerInfoPopunderPosition] = useState<CustomerInfoPopunderPosition>(() => ({
    x: 420,
    y: 72,
  }));
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<QueuePreviewItem["id"]>(() => defaultCustomerId);
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
  const customerReplyTimeoutsRef = useRef<Record<string, number>>({});
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

      Object.values(customerReplyTimeoutsRef.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
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
  const activeConversationStateKey = useMemo(
    () => getConversationStateKey(selectedAssignment.id, activeConversationChannel),
    [activeConversationChannel, selectedAssignment.id],
  );
  const conversationState = useMemo(
    () =>
      conversationStatesByKey[activeConversationStateKey] ??
      createConversationState(selectedAssignment.id, activeConversationChannel),
    [activeConversationChannel, activeConversationStateKey, conversationStatesByKey, selectedAssignment.id],
  );
  const isActivityRoute = location.pathname === "/activity";
  const isExpandedCanvasRoute =
    isActivityRoute && Boolean((location.state as { hideMainCanvasPanel?: boolean } | null)?.hideMainCanvasPanel);
  const isCopilotDeskView = location.pathname === "/desk" && new URLSearchParams(location.search).get("view") === "copilot";
  const isDeskView = location.pathname === "/desk" && !isCopilotDeskView;
  const isDeskRoute = isDeskView || isCopilotDeskView;
  const isCustomerInfoCanvasVisible = isDeskRoute || isExpandedCanvasRoute;
  const isCombinedInteractionPanel = isCustomerInfoCanvasVisible && isCombinedInteractionPanelEnabled;
  const shouldCombineDockedCustomerAndDeskPanels =
    isDeskRoute &&
    !isCombinedInteractionPanel &&
    isCustomerInfoPanelOpen &&
    !isCustomerInfoPopunderOpen &&
    isCombinedInteractionPanelCanvasEnabled;
  const isCanvasMergedIntoCombinedPanel = isCombinedInteractionPanel || shouldCombineDockedCustomerAndDeskPanels;
  const isDeskCustomerInfoVisible =
    isCustomerInfoCanvasVisible &&
    isCustomerInfoPanelOpen &&
    !isCanvasMergedIntoCombinedPanel &&
    isCustomerInfoPanelAllowed &&
    !isCustomerInfoPopunderOpen;
  const isDockedConversationVisible = !isCombinedInteractionPanel && isConversationPanelOpen;
  const isMainCanvasVisible = !isExpandedCanvasRoute && !isCanvasMergedIntoCombinedPanel;
  const isDeskCustomerInfoPopunderVisible =
    isCustomerInfoCanvasVisible && isCustomerInfoPanelOpen && !isCombinedInteractionPanel && isCustomerInfoPopunderOpen;
  const shouldPreserveFloatingCustomerInfoPanel =
    isCustomerInfoCanvasVisible && isCustomerInfoPanelOpen && isCustomerInfoPopunderOpen;
  const conversationPanelMaxWidth = getDockedConversationMaxWidth({
    hasDesktopRightPanel: activeRightPanel !== null,
    customerInfoPanelWidth: isDeskCustomerInfoVisible ? dockedCustomerInfoWidth : 0,
    hasCustomerInfoPanel: isDeskCustomerInfoVisible,
    reserveMainWorkspace: isMainCanvasVisible,
    hasMainCanvas: isMainCanvasVisible,
  });
  const customerInfoPanelMaxWidth = getDockedCustomerInfoMaxWidth({
    hasDesktopRightPanel: activeRightPanel !== null,
    isConversationPanelOpen: isDockedConversationVisible,
    dockedConversationWidth,
    reserveMainWorkspace: isMainCanvasVisible,
    hasMainCanvas: isMainCanvasVisible,
  });
  const activeWorkspace = useMemo(
    () => workspaceOptions.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaceOptions[0],
    [activeWorkspaceId, workspaceOptions],
  );
  const deskCanvasTabLabel = isCopilotDeskView
    ? "Copilot"
    : new URLSearchParams(location.search).get("view") === "notes"
      ? "Notes"
      : new URLSearchParams(location.search).get("view") === "add"
        ? "Add"
        : "Desk";

  useEffect(() => {
    setConversationStatesByKey((currentStates) => {
      if (currentStates[activeConversationStateKey]) {
        return currentStates;
      }

      return {
        ...currentStates,
        [activeConversationStateKey]: createConversationState(selectedAssignment.id, activeConversationChannel),
      };
    });
  }, [activeConversationChannel, activeConversationStateKey, selectedAssignment.id]);

  const handleConversationStateChange = (nextConversation: SharedConversationData, channel?: CustomerChannel) => {
    const targetCustomerId = selectedAssignment.id;
    const targetChannel = channel ?? activeConversationChannel;
    const targetConversationStateKey = getConversationStateKey(targetCustomerId, targetChannel);

    if (customerReplyTimeoutsRef.current[targetConversationStateKey] !== undefined) {
      window.clearTimeout(customerReplyTimeoutsRef.current[targetConversationStateKey]);
      delete customerReplyTimeoutsRef.current[targetConversationStateKey];
    }

    const latestMessage = nextConversation.messages[nextConversation.messages.length - 1];
    const shouldShowTyping = latestMessage?.role === "agent";
    const persistedConversationState = {
      ...nextConversation,
      isCustomerTyping: shouldShowTyping,
    };

    setConversationStatesByKey((currentStates) => ({
      ...currentStates,
      [targetConversationStateKey]: persistedConversationState,
    }));

    if (!latestMessage || latestMessage.role !== "agent") {
      return;
    }

    customerReplyTimeoutsRef.current[targetConversationStateKey] = window.setTimeout(() => {
      setConversationStatesByKey((currentStates) => {
        const currentConversationState =
          currentStates[targetConversationStateKey] ?? createConversationState(targetCustomerId, targetChannel);
        const currentLatestMessage = currentConversationState.messages[currentConversationState.messages.length - 1];

        if (
          currentConversationState.customerName !== nextConversation.customerName ||
          currentConversationState.label !== nextConversation.label ||
          currentLatestMessage?.id !== latestMessage.id
        ) {
          return currentStates;
        }

        return {
          ...currentStates,
          [targetConversationStateKey]: {
            ...currentConversationState,
            isCustomerTyping: false,
            messages: [
              ...currentConversationState.messages,
              {
                id: currentConversationState.messages.reduce((maxId, message) => Math.max(maxId, message.id), 0) + 1,
                role: "customer",
                content: generateSimulatedCustomerReply(currentConversationState, latestMessage.content),
                time: formatConversationReplyTime(new Date()),
              },
            ],
          },
        };
      });
      delete customerReplyTimeoutsRef.current[targetConversationStateKey];
    }, 1200);
  };

  const handleConversationStatusChange = (nextStatus: ConversationStatus) => {
    handleConversationStateChange({
      ...conversationState,
      status: nextStatus,
    });
  };

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

  const getAnchoredDeskCanvasPopunderPosition = (width: number, height: number) => {
    if (typeof window === "undefined") {
      return { x: DESK_CANVAS_POPOUNDER_MARGIN, y: 72 };
    }

    return {
      x: Math.max(window.innerWidth - width - DESK_CANVAS_POPOUNDER_MARGIN, DESK_CANVAS_POPOUNDER_MARGIN),
      y: Math.min(
        Math.max(DESK_CANVAS_POPOUNDER_MARGIN, 72),
        window.innerHeight - height - DESK_CANVAS_POPOUNDER_MARGIN,
      ),
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

  const getAnchoredCustomerInfoPopunderPosition = (anchorRect?: DOMRect | null) => {
    if (typeof window === "undefined") {
      return { x: 420, y: 72 };
    }

    const width = Math.min(customerInfoPopunderSize.width, window.innerWidth - CUSTOMER_INFO_POPOUNDER_MARGIN * 2);
    const height = Math.min(customerInfoPopunderSize.height, window.innerHeight - CUSTOMER_INFO_POPOUNDER_MARGIN * 2);

    if (!anchorRect) {
      return {
        x: Math.min(
          Math.max(
            CUSTOMER_INFO_POPOUNDER_MARGIN,
            56 + (isConversationPanelOpen ? dockedConversationWidth + DOCKED_CONVERSATION_GAP : 0) + CUSTOMER_INFO_POPOUNDER_GAP,
          ),
          window.innerWidth - width - CUSTOMER_INFO_POPOUNDER_MARGIN,
        ),
        y: 72,
      };
    }

    return {
      x: Math.min(
        Math.max(CUSTOMER_INFO_POPOUNDER_MARGIN, anchorRect.left),
        window.innerWidth - width - CUSTOMER_INFO_POPOUNDER_MARGIN,
      ),
      y: Math.min(
        Math.max(CUSTOMER_INFO_POPOUNDER_MARGIN, anchorRect.top),
        window.innerHeight - height - CUSTOMER_INFO_POPOUNDER_MARGIN,
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
    if (!deskCanvasDragActivation) return;

    const clearDragActivation = () => {
      setDeskCanvasDragActivation(null);
    };

    window.addEventListener("mouseup", clearDragActivation);

    return () => window.removeEventListener("mouseup", clearDragActivation);
  }, [deskCanvasDragActivation]);

  useEffect(() => {
    if (!customerInfoDragActivation) return;

    const clearDragActivation = () => {
      setCustomerInfoDragActivation(null);
    };

    window.addEventListener("mouseup", clearDragActivation);

    return () => window.removeEventListener("mouseup", clearDragActivation);
  }, [customerInfoDragActivation]);

  useEffect(() => {
    const syncCopilotDockingAvailability = () => {
      setIsCopilotDockingAllowed(window.innerWidth >= COPILOT_DOCK_BREAKPOINT);
    };

    syncCopilotDockingAvailability();
    window.addEventListener("resize", syncCopilotDockingAvailability);

    return () => window.removeEventListener("resize", syncCopilotDockingAvailability);
  }, []);

  useEffect(() => {
    const syncCombinedInteractionPanelAvailability = () => {
      setIsCombinedInteractionPanelEnabled(window.innerWidth < COMBINED_INTERACTION_PANEL_BREAKPOINT);
    };

    syncCombinedInteractionPanelAvailability();
    window.addEventListener("resize", syncCombinedInteractionPanelAvailability);

    return () => window.removeEventListener("resize", syncCombinedInteractionPanelAvailability);
  }, []);

  useEffect(() => {
    const syncCombinedInteractionPanelCanvasAvailability = () => {
      setIsCombinedInteractionPanelCanvasEnabled(window.innerWidth < COMBINED_INTERACTION_PANEL_CANVAS_BREAKPOINT);
    };

    syncCombinedInteractionPanelCanvasAvailability();
    window.addEventListener("resize", syncCombinedInteractionPanelCanvasAvailability);

    return () => window.removeEventListener("resize", syncCombinedInteractionPanelCanvasAvailability);
  }, []);

  useEffect(() => {
    if (isCopilotDockingAllowed || typeof window === "undefined") return;

    setIsCopilotDocked(false);
    setCopilotDragActivation(null);
    setCopilotPopunderPosition(getAnchoredCopilotPopunderPosition());
  }, [isCopilotDockingAllowed]);

  useEffect(() => {
    const syncDockedConversationWidth = () => {
      setDockedConversationWidth((current) => Math.min(current, conversationPanelMaxWidth));
    };

    syncDockedConversationWidth();
    window.addEventListener("resize", syncDockedConversationWidth);

    return () => window.removeEventListener("resize", syncDockedConversationWidth);
  }, [conversationPanelMaxWidth]);

  useEffect(() => {
    dockedConversationWidthRef.current = dockedConversationWidth;
  }, [dockedConversationWidth]);

  useEffect(() => {
    dockedCustomerInfoWidthRef.current = dockedCustomerInfoWidth;
  }, [dockedCustomerInfoWidth]);

  useEffect(() => {
    if (typeof window === "undefined" || isCombinedInteractionPanel) {
      return;
    }

    const syncDefaultDockedPanelWidths = () => {
      const showConversation = isConversationPanelOpen;
      const showCustomerInfo = isDeskCustomerInfoVisible;

      if (!showConversation && !showCustomerInfo) {
        return;
      }

      const { conversationWidth, customerInfoWidth } = getBalancedDockedPanelWidths({
        hasDesktopRightPanel: activeRightPanel !== null,
        reserveMainWorkspace: isMainCanvasVisible,
        showConversation,
        showCustomerInfo,
        hasMainCanvas: isMainCanvasVisible,
        currentConversationWidth: dockedConversationWidthRef.current,
        currentCustomerInfoWidth: dockedCustomerInfoWidthRef.current,
      });

      if (showConversation) {
        setDockedConversationWidth(conversationWidth);
      }

      if (showCustomerInfo) {
        setDockedCustomerInfoWidth(customerInfoWidth);
      }
    };

    syncDefaultDockedPanelWidths();
    window.addEventListener("resize", syncDefaultDockedPanelWidths);

    return () => window.removeEventListener("resize", syncDefaultDockedPanelWidths);
  }, [
    activeRightPanel,
    isCombinedInteractionPanel,
    isConversationPanelOpen,
    isDeskCustomerInfoVisible,
    isMainCanvasVisible,
  ]);

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

  useEffect(() => {
    const syncDockedCustomerInfoWidth = () => {
      setDockedCustomerInfoWidth((current) => Math.min(current, customerInfoPanelMaxWidth));
    };

    syncDockedCustomerInfoWidth();
    window.addEventListener("resize", syncDockedCustomerInfoWidth);

    return () => window.removeEventListener("resize", syncDockedCustomerInfoWidth);
  }, [customerInfoPanelMaxWidth]);

  useEffect(() => {
    const syncCustomerInfoPanelAvailability = () => {
      setIsCustomerInfoPanelAllowed(window.innerWidth >= CUSTOMER_INFO_PANEL_BREAKPOINT);
    };

    syncCustomerInfoPanelAvailability();
    window.addEventListener("resize", syncCustomerInfoPanelAvailability);

    return () => window.removeEventListener("resize", syncCustomerInfoPanelAvailability);
  }, []);

  useEffect(() => {
    if (!isCombinedInteractionPanel || !isCustomerInfoPopunderOpen) return;

    setIsCustomerInfoPopunderOpen(false);
    setCustomerInfoDragActivation(null);
  }, [isCombinedInteractionPanel, isCustomerInfoPopunderOpen]);

  useEffect(() => {
    if (
      !isCustomerInfoCanvasVisible ||
      !isCustomerInfoPanelOpen ||
      isCustomerInfoPanelAllowed ||
      isCustomerInfoPopunderOpen ||
      isCombinedInteractionPanel
    ) {
      return;
    }

    setCustomerInfoPopunderPosition(getAnchoredCustomerInfoPopunderPosition());
    setIsCustomerInfoPopunderOpen(true);
    setCustomerInfoDragActivation(null);
  }, [
    customerInfoPopunderSize.height,
    customerInfoPopunderSize.width,
    dockedConversationWidth,
    isCombinedInteractionPanel,
    isConversationPanelOpen,
    isCustomerInfoPanelAllowed,
    isCustomerInfoPanelOpen,
    isCustomerInfoPopunderOpen,
    isCustomerInfoCanvasVisible,
  ]);

  useEffect(() => {
    if (isExpandedCanvasRoute && !wasExpandedCanvasRouteRef.current) {
      if (isDeskCustomerInfoVisible) {
        setDockedCustomerInfoWidth(customerInfoPanelMaxWidth);
      } else if (isConversationPanelOpen) {
        setDockedConversationWidth(conversationPanelMaxWidth);
      }
    }

    wasExpandedCanvasRouteRef.current = isExpandedCanvasRoute;
  }, [
    conversationPanelMaxWidth,
    customerInfoPanelMaxWidth,
    isConversationPanelOpen,
    isDeskCustomerInfoVisible,
    isExpandedCanvasRoute,
  ]);

  useEffect(() => {
    if (!isDeskRoute) return;

    setDeskCanvasDragActivation(null);
    setDeskCanvasPopunderView(null);
  }, [isDeskRoute]);

  useEffect(() => {
    if (!isCanvasMergedIntoCombinedPanel) {
      setCombinedInteractionPanelTab((current) => current === "canvas" ? "conversation" : current);
      return;
    }

    setCombinedInteractionPanelTab((current) => {
      if (isCombinedInteractionPanel) {
        return "canvas";
      }

      return current === "conversation" ? "canvas" : current;
    });
    setIsCustomerInfoPanelOpen(true);
    setIsCustomerInfoPopunderOpen(false);

    if (isCombinedInteractionPanel) {
      setIsConversationPanelOpen(true);
      setIsConversationPopunderOpen(false);
    }
  }, [isCanvasMergedIntoCombinedPanel, isCombinedInteractionPanel, location.pathname, location.search]);

  const bringFloatingPanelToFront = (panelId: FloatingPanelId) => {
    setFloatingPanelOrder((current) => [...current.filter((id) => id !== panelId), panelId]);
  };

  const getFloatingPanelZIndex = (panelId: FloatingPanelId) => {
    const index = floatingPanelOrder.indexOf(panelId);
    return FLOATING_PANEL_BASE_Z_INDEX + (index === -1 ? 0 : index);
  };

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

  const closeCombinedInteractionPanel = () => {
    setConversationDragActivation(null);
    setCustomerInfoDragActivation(null);
    setIsConversationPopunderOpen(false);
    setIsCustomerInfoPopunderOpen(false);
    setIsConversationPanelOpen(false);
    setIsCustomerInfoPanelOpen(false);
  };

  const openCombinedInteractionPanel = (tab: CombinedInteractionPanelTab) => {
    setCombinedInteractionPanelTab(tab);
    setDockedConversationWidth((current) => Math.min(conversationPanelMaxWidth, Math.max(current, 360)));
    setIsConversationPanelOpen(true);
    setIsConversationPopunderOpen(false);
    setConversationDragActivation(null);
    setIsCustomerInfoPanelOpen(true);
    setIsCustomerInfoPopunderOpen(false);
    setCustomerInfoDragActivation(null);
  };

  const closeConversationPanel = () => {
    if (isCombinedInteractionPanel) {
      closeCombinedInteractionPanel();
      return;
    }

    setIsConversationPanelOpen(false);
  };

  const openConversationPanel = () => {
    if (isCombinedInteractionPanel) {
      openCombinedInteractionPanel("conversation");
      return;
    }

    const { conversationWidth, customerInfoWidth } = getBalancedDockedPanelWidths({
      hasDesktopRightPanel: activeRightPanel !== null,
      reserveMainWorkspace: isMainCanvasVisible,
      showConversation: true,
      showCustomerInfo: isDeskCustomerInfoVisible,
      hasMainCanvas: isMainCanvasVisible,
      currentConversationWidth: dockedConversationWidth,
      currentCustomerInfoWidth: dockedCustomerInfoWidth,
    });

    setDockedConversationWidth(conversationWidth);
    if (isDeskCustomerInfoVisible) {
      setDockedCustomerInfoWidth(customerInfoWidth);
    }
    setIsConversationPanelOpen(true);
    setIsConversationPopunderOpen(false);
    setConversationDragActivation(null);
  };

  const dockConversationPanel = () => {
    if (isCombinedInteractionPanel) {
      openCombinedInteractionPanel("conversation");
      return;
    }

    const { conversationWidth } = getBalancedDockedPanelWidths({
      hasDesktopRightPanel: activeRightPanel !== null,
      reserveMainWorkspace: isMainCanvasVisible,
      showConversation: true,
      showCustomerInfo: isDeskCustomerInfoVisible,
      hasMainCanvas: isMainCanvasVisible,
      currentConversationWidth: dockedConversationWidth,
      currentCustomerInfoWidth: dockedCustomerInfoWidth,
    });

    setDockedConversationWidth(conversationWidth);
    setIsConversationPanelOpen(true);
    setIsConversationPopunderOpen(false);
    setConversationDragActivation(null);
  };

  const toggleConversationPanel = () => {
    if (isConversationPanelOpen) {
      closeConversationPanel();
      return;
    }

    openConversationPanel();
  };

  const openConversationPopunder = (anchorRect?: DOMRect | null) => {
    if (isConversationPanelOpen) return;

    bringFloatingPanelToFront("conversation");
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

  const openCustomerInfoPanel = () => {
    if (isCombinedInteractionPanel) {
      openCombinedInteractionPanel("customerInfo");
      return;
    }

    if (isDeskRoute && isCombinedInteractionPanelCanvasEnabled) {
      setCombinedInteractionPanelTab("customerInfo");
      setIsCustomerInfoPanelOpen(true);
      setIsCustomerInfoPopunderOpen(false);
      setCustomerInfoDragActivation(null);
      return;
    }

    const { conversationWidth, customerInfoWidth } = getBalancedDockedPanelWidths({
      hasDesktopRightPanel: activeRightPanel !== null,
      reserveMainWorkspace: isMainCanvasVisible,
      showConversation: isConversationPanelOpen,
      showCustomerInfo: true,
      hasMainCanvas: isMainCanvasVisible,
      currentConversationWidth: dockedConversationWidth,
      currentCustomerInfoWidth: dockedCustomerInfoWidth,
    });

    setIsCustomerInfoPanelOpen(true);
    setIsCustomerInfoPopunderOpen(false);
    setCustomerInfoDragActivation(null);
    setDockedConversationWidth(conversationWidth);
    setDockedCustomerInfoWidth(customerInfoWidth);
  };

  const openCustomerInfoPopunder = (event?: React.MouseEvent<HTMLElement>) => {
    if (isCustomerInfoPanelOpen) {
      closeCustomerInfoPanel();
      return;
    }

    if (isCombinedInteractionPanel) {
      openCombinedInteractionPanel("customerInfo");
      return;
    }

    if (isDeskRoute && isCombinedInteractionPanelCanvasEnabled) {
      setCombinedInteractionPanelTab("customerInfo");
      setIsCustomerInfoPanelOpen(true);
      setIsCustomerInfoPopunderOpen(false);
      setCustomerInfoDragActivation(null);
      return;
    }

    const anchorRect = event?.currentTarget.getBoundingClientRect();
    const nextPosition = getAnchoredCustomerInfoPopunderPosition(anchorRect);

    bringFloatingPanelToFront("customerInfo");
    setCustomerInfoPopunderPosition(nextPosition);
    setIsCustomerInfoPanelOpen(true);
    setIsCustomerInfoPopunderOpen(true);
    setCustomerInfoDragActivation(
      event
        ? {
            id: Date.now(),
            offset: {
              x: event.clientX - nextPosition.x,
              y: event.clientY - nextPosition.y,
            },
          }
        : null,
    );

    if (location.pathname !== "/desk" && !isExpandedCanvasRoute) {
      navigate("/activity", { state: { hideMainCanvasPanel: true } });
    }
  };

  const dockCustomerInfoPanel = () => {
    if (isCombinedInteractionPanel) {
      openCombinedInteractionPanel("customerInfo");
      return;
    }

    if (isDeskRoute && isCombinedInteractionPanelCanvasEnabled) {
      setCombinedInteractionPanelTab("customerInfo");
      setIsCustomerInfoPanelOpen(true);
      setIsCustomerInfoPopunderOpen(false);
      setCustomerInfoDragActivation(null);
      return;
    }

    const { customerInfoWidth } = getBalancedDockedPanelWidths({
      hasDesktopRightPanel: activeRightPanel !== null,
      reserveMainWorkspace: isMainCanvasVisible,
      showConversation: isConversationPanelOpen,
      showCustomerInfo: true,
      hasMainCanvas: isMainCanvasVisible,
      currentConversationWidth: dockedConversationWidth,
      currentCustomerInfoWidth: dockedCustomerInfoWidth,
    });

    setIsCustomerInfoPanelOpen(true);
    setIsCustomerInfoPopunderOpen(false);
    setCustomerInfoDragActivation(null);
    setDockedCustomerInfoWidth(customerInfoWidth);
  };

  const closeCustomerInfoPanel = () => {
    setDeskPanelSelection(null);

    if (isCombinedInteractionPanel) {
      closeCombinedInteractionPanel();
      return;
    }

    setCustomerInfoDragActivation(null);
    setIsCustomerInfoPopunderOpen(false);
    setIsCustomerInfoPanelOpen(false);
  };

  const closeDeskCanvasPopunder = () => {
    setDeskCanvasDragActivation(null);
    setDeskCanvasPopunderView(null);
  };

  const dockDeskCanvasPopunder = () => {
    if (!deskCanvasPopunderView) return;

    const nextRoute = deskCanvasPopunderView === "copilot"
      ? "/desk?view=copilot"
      : deskCanvasPopunderView === "notes"
        ? "/desk?view=notes"
        : deskCanvasPopunderView === "add"
          ? "/desk?view=add"
          : deskCanvasPopunderView === "customer"
            ? "/desk?view=customer"
            : "/desk";

    closeDeskCanvasPopunder();
    navigate(nextRoute);
  };

  const undockDeskPanel = (view: DeskCanvasView, event: React.MouseEvent<HTMLElement>) => {
    if (typeof window === "undefined") return;

    event.preventDefault();

    const minWidth = getDeskCanvasPopunderMinWidth(view);
    const defaultWidth = getDeskCanvasPopunderDefaultWidth(view);
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    const width = Math.min(
      Math.max(minWidth, bounds?.width ?? defaultWidth),
      window.innerWidth - DESK_CANVAS_POPOUNDER_MARGIN * 2,
    );
    const height = Math.min(
      Math.max(DESK_CANVAS_POPOUNDER_MIN_HEIGHT, bounds?.height ?? Math.max(DESK_CANVAS_POPOUNDER_MIN_HEIGHT, window.innerHeight - 80)),
      window.innerHeight - DESK_CANVAS_POPOUNDER_MARGIN * 2,
    );
    const anchoredPosition = getAnchoredDeskCanvasPopunderPosition(width, height);
    const nextPosition = bounds
      ? {
          x: Math.min(
            Math.max(DESK_CANVAS_POPOUNDER_MARGIN, bounds.left),
            window.innerWidth - width - DESK_CANVAS_POPOUNDER_MARGIN,
          ),
          y: Math.min(
            Math.max(DESK_CANVAS_POPOUNDER_MARGIN, bounds.top),
            window.innerHeight - height - DESK_CANVAS_POPOUNDER_MARGIN,
          ),
        }
      : anchoredPosition;

    bringFloatingPanelToFront("deskCanvas");
    setDeskCanvasPopunderView(view);
    setDeskCanvasPopunderSize({ width, height });
    setDeskCanvasPopunderPosition(nextPosition);
    setDeskCanvasDragActivation({
      id: Date.now(),
      offset: {
        x: event.clientX - nextPosition.x,
        y: event.clientY - nextPosition.y,
      },
    });
    navigate("/activity", { state: { hideMainCanvasPanel: true } });
  };

  const openDeskPanel = (selection?: Exclude<DeskPanelSelection, null>) => {
    setDeskPanelSelection(selection ?? null);
    setActiveRightPanel(null);
    openCustomerInfoPanel();

    if (location.pathname !== "/activity") {
      navigate("/activity", { state: { hideMainCanvasPanel: true } });
    }
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
      activeConversationChannel,
      selectedAssignment,
      deskPanelSelection,
      recentInteractions,
      conversationState,
      toggleInfo: () => {
        setDeskPanelSelection(null);
        setActiveRightPanel((current) =>
          current === "info" ? null : "info",
        );
      },
      toggleDesk: () => {
        setDeskPanelSelection(null);
        setActiveRightPanel((current) =>
          current === "desk" ? null : "desk",
        );
      },
      openDeskPanel,
      toggleInteractions: () => {
        setActiveRightPanel((current) =>
          current === "interactions" ? null : "interactions",
        );
      },
      toggleConversationPanel,
      openConversationPanel,
      openConversationPopunder,
      closeConversationPopunder,
      setActiveConversationChannel,
      setConversationState: handleConversationStateChange,
      closeRightPanel: () => {
        setDeskPanelSelection(null);
        setActiveRightPanel(null);
      },
      undockDeskPanel,
      selectAssignment: (assignmentId) => {
        setDeskPanelSelection(null);
        setSelectedAssignmentId(assignmentId);

        if (location.pathname === "/desk" || isExpandedCanvasRoute) {
          if (!isCustomerInfoPanelOpen) {
            return;
          }

          if (shouldPreserveFloatingCustomerInfoPanel || isDeskCustomerInfoPopunderVisible) {
            bringFloatingPanelToFront("customerInfo");
            return;
          }

          if (isDeskCustomerInfoVisible || isCombinedInteractionPanel) {
            return;
          }

          if (!isCustomerInfoPanelAllowed && !isCombinedInteractionPanel) {
            bringFloatingPanelToFront("customerInfo");
            setCustomerInfoPopunderPosition(getAnchoredCustomerInfoPopunderPosition());
            setIsCustomerInfoPopunderOpen(true);
          }
          return;
        }

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

        bringFloatingPanelToFront("call");
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
      activeConversationChannel,
      conversationState,
      deskPanelSelection,
      customerInfoPopunderSize.height,
      customerInfoPopunderSize.width,
      dockedConversationWidth,
      isAddNewPopoverOpen,
      isCallPopunderOpen,
      isCustomerInfoPanelAllowed,
      isConversationPanelOpen,
      isConversationPopunderOpen,
      isDeskCustomerInfoPopunderVisible,
      isDeskCustomerInfoVisible,
      isExpandedCanvasRoute,
      navigate,
      handleConversationStateChange,
      openConversationPanel,
      recentInteractions,
      location.pathname,
      openCustomerInfoPanel,
      openDeskPanel,
      shouldPreserveFloatingCustomerInfoPanel,
      deskCanvasPopunderView,
      selectedAssignment,
      status,
      toggleConversationPanel,
      undockDeskPanel,
      isCombinedInteractionPanel,
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
                className="hidden min-w-0 items-start gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white/70 focus:outline-none lg:flex"
              >
                <span className="min-w-0">
                  <span className="block truncate text-base font-semibold leading-5 tracking-[-0.02em] text-[#333333]">
                    Agent Workspace
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-medium leading-4 text-[#7A7A7A]">
                    {activeWorkspace.name}
                  </span>
                </span>
                <ChevronDown className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#666666]" />
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
                            isActiveWorkspace ? "bg-[#006DAD]" : "bg-black/10",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-[#333333]">{workspace.name}</div>
                          {workspace.description ? (
                            <div className="mt-0.5 text-xs leading-5 text-[#6B7280]">{workspace.description}</div>
                          ) : null}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </div>
              <DropdownMenuSeparator className="my-2 bg-black/10" />
              <DropdownMenuItem
                onClick={handleCreateWorkspace}
                className="rounded-xl px-3 py-3 text-sm font-semibold text-[#006DAD] focus:bg-[#E6F3FA]"
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Create new workspace</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                className="h-9 w-full rounded-full border-black/10 bg-white px-4 text-sm text-[#333333] placeholder:text-[#7A7A7A] focus-visible:border-[#C9B8FF] focus-visible:ring-0 focus-visible:shadow-[inset_0_0_0_1px_#B8D7F0]"
              />
            </div>
          </div>

          {!isHeaderSearchOpen && (
            <>
              <HeaderIconButton
                ariaLabel="Open customer information in desk panel"
                onClick={() => navigate("/desk?view=customer")}
                isActive={location.pathname === "/desk" && new URLSearchParams(location.search).get("view") === "customer"}
              >
                <User className="h-4 w-4 stroke-[1.8]" />
              </HeaderIconButton>

              <HeaderIconButton
                ariaLabel="Open Desk"
                onClick={() => navigate("/desk")}
                isActive={isDeskView}
              >
                <Monitor className="h-4 w-4 stroke-[1.8]" />
              </HeaderIconButton>

              <HeaderIconButton>
                <div className="relative">
                  <Bell className="h-4 w-4 stroke-[1.8]" />
                  <span className="absolute -right-0.5 top-0 h-1.5 w-1.5 rounded-full bg-[#006DAD]" />
                </div>
              </HeaderIconButton>

              <div ref={notesButtonRef}>
                <HeaderIconButton
                  ariaLabel="Open notes in desk panel"
                  onClick={() => {
                    setIsNotesPopoverOpen(false);
                    navigate("/desk?view=notes");
                  }}
                  isActive={location.pathname === "/desk" && new URLSearchParams(location.search).get("view") === "notes"}
                >
                  <FileText className="h-4 w-4 stroke-[1.8]" />
                </HeaderIconButton>
              </div>

              <div ref={addNewButtonRef}>
                <HeaderIconButton
                  ariaLabel="Open add in desk panel"
                  onClick={() => {
                    setIsAddNewPopoverOpen(false);
                    navigate("/desk?view=add");
                  }}
                  isActive={location.pathname === "/desk" && new URLSearchParams(location.search).get("view") === "add"}
                >
                  <Plus className="h-4 w-4 stroke-[1.8]" />
                </HeaderIconButton>
              </div>
            </>
          )}

          {!isHeaderSearchOpen && (
            <div ref={copilotButtonRef}>
              <HeaderIconButton
                ariaLabel="Open Copilot"
                onClick={() => navigate("/desk?view=copilot")}
                isActive={isCopilotDeskView}
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
                className="flex min-h-8 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-1 text-[#333333] transition-colors hover:bg-[#E6F3FA] focus:outline-none"
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

      <div className="flex min-h-0 flex-1 gap-0 pb-4 pr-4 pt-0">
        <LeftQueueRail />
        {isCombinedInteractionPanel ? (
          <CombinedInteractionPanel
            isOpen={isCanvasMergedIntoCombinedPanel ? true : isConversationPanelOpen || isCustomerInfoPanelOpen}
            width={dockedConversationWidth}
            maxWidth={conversationPanelMaxWidth}
            activeTab={combinedInteractionPanelTab}
            conversation={conversationState}
            activeChannel={activeConversationChannel}
            customerRecordId={selectedAssignment.id}
            customerName={selectedAssignment.name}
            customerId={selectedAssignment.customerId}
            panelSelection={deskPanelSelection}
            showConversationTab
            showCanvasTab={isCanvasMergedIntoCombinedPanel}
            canvasTabLabel={deskCanvasTabLabel}
            canvasContent={children}
            isFullWidth={isCanvasMergedIntoCombinedPanel}
            onConversationChange={handleConversationStateChange}
            onSelectChannel={setActiveConversationChannel}
            onOpenDeskPanel={openDeskPanel}
            onTabChange={(tab) => {
              setCombinedInteractionPanelTab(tab);
              setIsConversationPanelOpen(true);
              setIsCustomerInfoPanelOpen(true);
              setIsConversationPopunderOpen(false);
              setIsCustomerInfoPopunderOpen(false);
            }}
            onWidthChange={setDockedConversationWidth}
            onClose={closeCombinedInteractionPanel}
          />
        ) : shouldCombineDockedCustomerAndDeskPanels ? (
          <>
            <DockedConversationPanel
              isOpen={isConversationPanelOpen}
              width={dockedConversationWidth}
              maxWidth={conversationPanelMaxWidth}
              conversation={conversationState}
              activeChannel={activeConversationChannel}
              customerRecordId={selectedAssignment.id}
              onConversationChange={handleConversationStateChange}
              onSelectChannel={setActiveConversationChannel}
              onOpenDeskPanel={openDeskPanel}
              onOpenCall={layoutContextValue.toggleCallPopunder}
              onOpenCustomerInfo={openCustomerInfoPopunder}
              onConversationStatusChange={handleConversationStatusChange}
              isCallDisabled={status === "In a Call" || status !== "Available"}
              onWidthChange={setDockedConversationWidth}
              onClose={closeConversationPanel}
              showTrailingGap
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

                bringFloatingPanelToFront("conversation");
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
            <CombinedInteractionPanel
              isOpen={isCustomerInfoPanelOpen}
              width={dockedCustomerInfoWidth}
              maxWidth={customerInfoPanelMaxWidth}
              activeTab={combinedInteractionPanelTab}
              conversation={conversationState}
              activeChannel={activeConversationChannel}
              customerRecordId={selectedAssignment.id}
              customerName={selectedAssignment.name}
              customerId={selectedAssignment.customerId}
              panelSelection={deskPanelSelection}
              showConversationTab={false}
              showCanvasTab
              canvasTabLabel={deskCanvasTabLabel}
              canvasContent={children}
              isFullWidth
              showCloseButton
              onConversationChange={handleConversationStateChange}
              onSelectChannel={setActiveConversationChannel}
              onOpenDeskPanel={openDeskPanel}
              onTabChange={(tab) => {
                setCombinedInteractionPanelTab(tab === "conversation" ? "customerInfo" : tab);
                setIsCustomerInfoPanelOpen(true);
                setIsCustomerInfoPopunderOpen(false);
              }}
              onWidthChange={setDockedCustomerInfoWidth}
              onClose={closeCustomerInfoPanel}
            />
          </>
        ) : (
          <>
            <DockedConversationPanel
              isOpen={isConversationPanelOpen}
              width={dockedConversationWidth}
              maxWidth={conversationPanelMaxWidth}
              conversation={conversationState}
              activeChannel={activeConversationChannel}
              customerRecordId={selectedAssignment.id}
              onConversationChange={handleConversationStateChange}
              onSelectChannel={setActiveConversationChannel}
              onOpenDeskPanel={openDeskPanel}
              onOpenCall={layoutContextValue.toggleCallPopunder}
              onOpenCustomerInfo={openCustomerInfoPopunder}
              onConversationStatusChange={handleConversationStatusChange}
              isCallDisabled={status === "In a Call" || status !== "Available"}
              onWidthChange={setDockedConversationWidth}
              onClose={closeConversationPanel}
              showTrailingGap={isDeskCustomerInfoVisible || shouldCombineDockedCustomerAndDeskPanels || isMainCanvasVisible}
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

                bringFloatingPanelToFront("conversation");
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
            <DockedCustomerInfoPanel
              isOpen={isDeskCustomerInfoVisible}
              width={dockedCustomerInfoWidth}
              maxWidth={customerInfoPanelMaxWidth}
              customerRecordId={selectedAssignment.id}
              customerName={selectedAssignment.name}
              customerId={selectedAssignment.customerId}
              panelSelection={deskPanelSelection}
              onWidthChange={setDockedCustomerInfoWidth}
              onClose={closeCustomerInfoPanel}
              showTrailingGap={isMainCanvasVisible}
              onUndockStart={(event) => {
                if (typeof window === "undefined") return;

                event.preventDefault();

                const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
                if (!bounds) return;

                const margin = CUSTOMER_INFO_POPOUNDER_MARGIN;
                const nextPosition = {
                  x: Math.min(
                    Math.max(margin, bounds.left),
                    window.innerWidth - customerInfoPopunderSize.width - margin,
                  ),
                  y: Math.min(
                    Math.max(margin, bounds.top),
                    window.innerHeight - customerInfoPopunderSize.height - margin,
                  ),
                };

                bringFloatingPanelToFront("customerInfo");
                setCustomerInfoPopunderPosition(nextPosition);
                setIsCustomerInfoPopunderOpen(true);
                setCustomerInfoDragActivation({
                  id: Date.now(),
                  offset: {
                    x: event.clientX - nextPosition.x,
                    y: event.clientY - nextPosition.y,
                  },
                });
              }}
            />
          </>
        )}
        {!isExpandedCanvasRoute && !isCanvasMergedIntoCombinedPanel && (
          <div
            className={cn(
              "flex min-w-0 flex-1 flex-col overflow-hidden min-[800px]:min-w-[360px]",
              isActivityRoute ? "bg-transparent" : "rounded-lg border border-black/[0.16] bg-white",
            )}
          >
            {children}
          </div>
        )}
      </div>

      {isConversationPopunderOpen && !isConversationPanelOpen && (
        <ConversationPopunder
          position={conversationPopunderPosition}
          size={conversationPopunderSize}
          conversation={conversationState}
          activeChannel={activeConversationChannel}
          customerRecordId={selectedAssignment.id}
          zIndex={getFloatingPanelZIndex("conversation")}
          onPositionChange={setConversationPopunderPosition}
          onSizeChange={setConversationPopunderSize}
          onConversationChange={handleConversationStateChange}
          onSelectChannel={setActiveConversationChannel}
          onOpenDeskPanel={openDeskPanel}
          onOpenCall={layoutContextValue.toggleCallPopunder}
          onOpenCustomerInfo={openCustomerInfoPopunder}
          onConversationStatusChange={handleConversationStatusChange}
          isCallDisabled={status === "In a Call" || status !== "Available"}
          onDock={dockConversationPanel}
          dragActivation={conversationDragActivation}
          onInteractStart={() => bringFloatingPanelToFront("conversation")}
        />
      )}

      {isDeskCustomerInfoPopunderVisible && (
        <CustomerInfoPopunder
          position={customerInfoPopunderPosition}
          size={customerInfoPopunderSize}
          customerRecordId={selectedAssignment.id}
          customerName={selectedAssignment.name}
          customerId={selectedAssignment.customerId}
          panelSelection={deskPanelSelection}
          zIndex={getFloatingPanelZIndex("customerInfo")}
          onPositionChange={setCustomerInfoPopunderPosition}
          onSizeChange={setCustomerInfoPopunderSize}
          onClose={closeCustomerInfoPanel}
          onDock={isCustomerInfoPanelAllowed ? dockCustomerInfoPanel : undefined}
          dragActivation={customerInfoDragActivation}
          onInteractStart={() => bringFloatingPanelToFront("customerInfo")}
        />
      )}

      {deskCanvasPopunderView && (
        <DeskCanvasPopunder
          view={deskCanvasPopunderView}
          position={deskCanvasPopunderPosition}
          size={deskCanvasPopunderSize}
          customerId={selectedAssignment.customerId}
          zIndex={getFloatingPanelZIndex("deskCanvas")}
          onPositionChange={setDeskCanvasPopunderPosition}
          onSizeChange={setDeskCanvasPopunderSize}
          onClose={closeDeskCanvasPopunder}
          onDock={dockDeskCanvasPopunder}
          dragActivation={deskCanvasDragActivation}
          onInteractStart={() => bringFloatingPanelToFront("deskCanvas")}
        />
      )}

      {isCallPopunderOpen && (
        <CallControlsPopunder
          position={callPopunderPosition}
          size={callPopunderSize}
          mode={callPopunderMode}
          zIndex={getFloatingPanelZIndex("call")}
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
                customerId: selectedAssignment.customerId,
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
          onInteractStart={() => bringFloatingPanelToFront("call")}
        />
      )}

      {isNotesPopoverOpen && (
        <NotesPopoverContent
          position={notesPopunderPosition}
          size={notesPopunderSize}
          zIndex={getFloatingPanelZIndex("notes")}
          onPositionChange={setNotesPopunderPosition}
          onSizeChange={setNotesPopunderSize}
          onClose={() => setIsNotesPopoverOpen(false)}
          onInteractStart={() => bringFloatingPanelToFront("notes")}
        />
      )}

      {isAddNewPopoverOpen && (
        <AddNewPopoverContent
          position={addNewPopunderPosition}
          size={addNewPopunderSize}
          zIndex={getFloatingPanelZIndex("addNew")}
          onPositionChange={setAddNewPopunderPosition}
          onSizeChange={setAddNewPopunderSize}
          onClose={() => setIsAddNewPopoverOpen(false)}
          onInteractStart={() => bringFloatingPanelToFront("addNew")}
        />
      )}

    </div>
    </LayoutContext.Provider>
  );
}
