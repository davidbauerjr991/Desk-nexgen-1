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
  Mail,
  MessageCircle,
  MessageSquare,
  Mic,
  Monitor,
  Moon,
  PanelRight,
  Pause,
  User,
  Phone,
  PhoneOff,
  Plus,
  Search,
  Sun,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CopilotPopunder, { CopilotContent, type CopilotDragActivation } from "@/components/CopilotPopunder";
import ConversationPanel, { type ConversationStatus, type SharedConversationData } from "@/components/ConversationPanel";
import DeskDataTable from "@/components/DeskDataTable";
import AddPanelContent from "@/components/AddPanelContent";
import NotesPanel from "@/components/NotesPanel";
import { conversationChannelOptions } from "@/components/ConversationChannelToggleGroup";
import { type RecentInteractionItem } from "@/components/RecentInteractionsPanel";
import { cn } from "@/lib/utils";
import {
  createConversationState,
  customerDatabase,
  defaultCustomerId,
  getCustomerRecord,
  type CustomerChannel,
  type CustomerQueueIcon,
} from "@/lib/customer-database";
import { toast } from "sonner";

interface LayoutProps {
  children: React.ReactNode;
}

type RightPanelView = "info" | "desk" | "interactions" | null;
type DeskCanvasView = "desk" | "copilot" | "notes" | "add" | "customer" | "notifications";
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
  activeConversationTabs: CustomerChannel[];
  selectedAssignment: QueuePreviewItem;
  deskPanelSelection: DeskPanelSelection;
  recentInteractions: RecentInteractionItem[];
  conversationState: SharedConversationData;
  activeCallAssignmentId: QueuePreviewItem["id"] | null;
  toggleInfo: () => void;
  toggleDesk: () => void;
  openDeskPanel: (selection?: Exclude<DeskPanelSelection, null>) => void;
  closeAppSpacePanel: () => void;
  closeFloatingAppSpacePanel: () => void;
  isAppSpacePanelInDragMode: boolean;
  toggleInteractions: () => void;
  toggleConversationPanel: () => void;
  openConversationPanel: () => void;
  openConversationPopunder: (anchorRect?: DOMRect | null) => void;
  closeConversationPopunder: () => void;
  setActiveConversationChannel: (channel: CustomerChannel) => void;
  openCustomerConversation: (customerRecordId: string, channel: AssignmentChannel) => void;
  openRecentInteractionAssignment: (interaction: RecentInteractionItem) => void;
  setConversationState: (conversation: SharedConversationData) => void;
  closeRightPanel: () => void;
  selectAssignment: (assignmentId: QueuePreviewItem["id"]) => void;
  undockDeskPanel: (view: DeskCanvasView, event: React.MouseEvent<HTMLElement>) => void;
  toggleCallPopunder: (anchorRect?: DOMRect | null, customerRecordId?: string) => void;
  openCallDisposition: (anchorRect?: DOMRect | null) => void;
  startCallStatus: () => void;
  endCallStatus: () => void;
}

type QueueAssignmentStatus = ConversationStatus | "resolved" | "escalated";

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
  routePath?: string;
};

const statusOptions: Array<{
  label: AgentStatus;
  dotClassName: string;
  textClassName: string;
}> = [
  { label: "Available", dotClassName: "bg-[#369D3F]", textClassName: "text-[#369D3F]" },
  { label: "Busy", dotClassName: "bg-[#F04438]", textClassName: "text-[#B42318]" },
  { label: "Away", dotClassName: "bg-[#F79009]", textClassName: "text-[#B54708]" },
  { label: "Offline", dotClassName: "bg-[#A3A3A3]", textClassName: "text-[#A3A3A3]" },
  { label: "In a Call", dotClassName: "bg-[#F04438]", textClassName: "text-[#B42318]" },
];

const initialWorkspaceOptions: WorkspaceOption[] = [
  { id: "desktop", name: "Desktop", description: "", routePath: "/activity" },
  { id: "wem", name: "WEM", description: "", routePath: "/wem" },
  { id: "schedule", name: "Schedule", description: "", routePath: "/schedule" },
  { id: "settings", name: "Settings", description: "", routePath: "/settings" },
  { id: "reporting", name: "Reporting", description: "", routePath: "/reporting" },
];

const conversationStatusOptions: Array<{ value: QueueAssignmentStatus; label: string }> = [
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "escalated", label: "Escalated" },
  { value: "closed", label: "Closed" },
];

function getConversationStatusChipClasses(status: QueueAssignmentStatus) {
  if (status === "open") {
    return "border-[#B7E6DD] bg-[#EAF8F4] text-[#369D3F] hover:bg-[#D9F2EA]";
  }

  if (status === "pending") {
    return "border-[#FEDF89] bg-[#FFFAEB] text-[#B54708] hover:bg-[#FEF0C7]";
  }

  if (status === "resolved") {
    return "border-[#ABEFC6] bg-[#ECFDF3] text-[#027A48] hover:bg-[#D1FADF]";
  }

  if (status === "escalated") {
    return "border-[#FECDCA] bg-[#FEF3F2] text-[#B42318] hover:bg-[#FEE4E2]";
  }

  return "border-[#D0D5DD] bg-white text-[#667085] hover:bg-[#F9FAFB]";
}

type AssignmentChannel = Extract<CustomerChannel, "chat" | "sms" | "email" | "voice">;

function getConversationStateKey(assignmentId: string) {
  return assignmentId;
}

type QueueSortOption = "created-desc" | "created-asc" | "updated-desc" | "updated-asc";

type QueuePreviewItem = {
  id: string;
  customerRecordId: string;
  channel: AssignmentChannel;
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

type GroupedQueueItem = {
  customerRecordId: string;
  name: string;
  initials: string;
  channels: QueuePreviewItem[]; // sorted: selected/most-recent first
  lastActiveChannel: QueuePreviewItem;
  isAnyActive: boolean;
  priority: string;
  priorityClassName: string;
  badgeColor: string;
};

const queueIconMap: Record<CustomerQueueIcon, typeof Phone> = {
  phone: Phone,
  clipboardList: ClipboardList,
  messageSquare: MessageSquare,
};

const launchedAssignmentIconMap: Record<AssignmentChannel, typeof Phone> = {
  chat: MessageCircle,
  sms: MessageSquare,
  email: Mail,
  voice: Phone,
};

const baseAssignmentChannelByCustomerRecordId: Partial<Record<string, AssignmentChannel>> = {
  olivia: "chat",
};

const queuePreviewItems: QueuePreviewItem[] = customerDatabase.map((customer) => {
  const assignmentChannel = baseAssignmentChannelByCustomerRecordId[customer.id] ?? "sms";

  return {
    id: customer.id,
    customerRecordId: customer.id,
    channel: assignmentChannel,
    initials: customer.initials,
    name: customer.name,
    customerId: customer.customerId,
    lastUpdated: customer.lastUpdated,
    time: customer.queue.time,
    preview: customer.queue.preview,
    priority: customer.queue.priority,
    priorityClassName: customer.queue.priorityClassName,
    badgeColor: customer.queue.badgeColor,
    icon: assignmentChannel === "sms" ? queueIconMap[customer.queue.icon] : launchedAssignmentIconMap[assignmentChannel],
    isActive: customer.queue.isActive,
    createdAt: customer.queue.createdAt,
    updatedAt: customer.queue.updatedAt,
  };
});

const queuePreviewItemsByCustomerRecordId = Object.fromEntries(
  queuePreviewItems.map((item) => [item.customerRecordId, item]),
) as Record<string, QueuePreviewItem>;

const priorityRankMap: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const visibleAssignmentNames = new Set([
  "Noah Patel",
  "Olivia Reed",
  "Ethan Zhang",
]);

const initialVisibleAssignments = queuePreviewItems.filter((item) => visibleAssignmentNames.has(item.name));
const initialVisibleAssignmentIds = initialVisibleAssignments.map((item) => item.id);
const initialSelectedAssignment = initialVisibleAssignments[0] ?? queuePreviewItemsByCustomerRecordId[defaultCustomerId] ?? queuePreviewItems[0];
const initialSelectedAssignmentId = initialSelectedAssignment.id;
const defaultConversationState: SharedConversationData = createConversationState(
  initialSelectedAssignment.customerRecordId,
  initialSelectedAssignment.channel,
);

function createFreshConversationState(customerId: string, channel: CustomerChannel): SharedConversationData {
  const conversation = createConversationState(customerId, channel);

  return {
    ...conversation,
    timelineLabel: `${conversation.label} · New conversation`,
    messages: [],
    draft: "",
    status: "open",
    isCustomerTyping: false,
  };
}

function getLaunchedAssignmentPreview(channel: AssignmentChannel) {
  if (channel === "voice") {
    return "Live call in progress.";
  }

  return `New ${channel.toUpperCase()} conversation started.`;
}

function createLaunchedAssignment(customerRecordId: string, channel: AssignmentChannel): QueuePreviewItem {
  const baseAssignment = queuePreviewItemsByCustomerRecordId[customerRecordId] ?? queuePreviewItems[0];
  const timestamp = new Date();
  const isoTimestamp = timestamp.toISOString();

  return {
    ...baseAssignment,
    id: `${customerRecordId}-${channel}-${timestamp.getTime()}`,
    customerRecordId: baseAssignment.customerRecordId,
    channel,
    icon: launchedAssignmentIconMap[channel],
    isActive: false,
    time: "Now",
    lastUpdated: formatRecentInteractionTimestamp(timestamp),
    preview: getLaunchedAssignmentPreview(channel),
    createdAt: isoTimestamp,
    updatedAt: isoTimestamp,
  };
}

function getRecentInteractionAssignmentStatus(status: string): QueueAssignmentStatus {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus === "resolved") {
    return "resolved";
  }

  if (normalizedStatus === "pending") {
    return "pending";
  }

  if (normalizedStatus === "escalated") {
    return "escalated";
  }

  if (normalizedStatus === "closed") {
    return "closed";
  }

  return "open";
}

function getAssignmentChannelFromRecentInteractionType(type: RecentInteractionItem["type"]): AssignmentChannel {
  if (type === "email") {
    return "email";
  }

  if (type === "voice") {
    return "voice";
  }

  if (type === "ai-agent") {
    return "chat";
  }

  return "sms";
}

function formatRecentInteractionAssignmentTime(createdAt: string) {
  const timeParts = createdAt.trim().split(" ");

  return timeParts.slice(-2).join(" ") || createdAt;
}

function createRecentInteractionAssignment(
  interaction: RecentInteractionItem,
  customerRecordId: string,
): QueuePreviewItem {
  const baseAssignment = queuePreviewItemsByCustomerRecordId[customerRecordId] ?? queuePreviewItems[0];
  const channel = getAssignmentChannelFromRecentInteractionType(interaction.type);
  const directionLabel = interaction.direction === "inbound" ? "Inbound" : "Outbound";

  return {
    ...baseAssignment,
    id: `recent-interaction-${customerRecordId}-${interaction.id}`,
    customerRecordId: baseAssignment.customerRecordId,
    channel,
    icon: launchedAssignmentIconMap[channel],
    isActive: false,
    time: formatRecentInteractionAssignmentTime(interaction.createdAt),
    lastUpdated: interaction.createdAt,
    preview: `${directionLabel} · ${interaction.channel}`,
    createdAt: interaction.createdAt,
    updatedAt: interaction.createdAt,
  };
}

const priorityDotClassNameMap: Record<string, string> = {
  critical: "bg-[#F04438]",
  high: "bg-[#F79009]",
  medium: "bg-[#006DAD]",
  low: "bg-[#369D3F]",
};

const priorityIconClassNameMap: Record<string, string> = {
  critical: "text-[#F04438]",
  high: "text-[#F79009]",
  medium: "text-[#006DAD]",
  low: "text-[#369D3F]",
};

function groupQueueItems(items: QueuePreviewItem[], selectedAssignmentId: string): GroupedQueueItem[] {
  const orderMap = new Map<string, number>();
  const groupMap = new Map<string, QueuePreviewItem[]>();

  for (const item of items) {
    if (!groupMap.has(item.customerRecordId)) {
      orderMap.set(item.customerRecordId, orderMap.size);
      groupMap.set(item.customerRecordId, []);
    }
    groupMap.get(item.customerRecordId)!.push(item);
  }

  return [...orderMap.entries()]
    .sort(([, a], [, b]) => a - b)
    .map(([customerRecordId]) => {
      const channels = groupMap.get(customerRecordId)!;
      // Stable order: first opened at top, subsequent channels below (by createdAt asc)
      const sortedChannels = [...channels].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      const isAnyActive = channels.some((c) => c.id === selectedAssignmentId || c.isActive);
      // Last active channel for the collapsed icon: selected one first, then most recently updated
      const lastActiveChannel =
        sortedChannels.find((c) => c.id === selectedAssignmentId) ??
        [...channels].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
      const highestPriority = [...channels].sort(
        (a, b) =>
          (priorityRankMap[a.priority.toLowerCase()] ?? Number.MAX_SAFE_INTEGER) -
          (priorityRankMap[b.priority.toLowerCase()] ?? Number.MAX_SAFE_INTEGER),
      )[0];

      return {
        customerRecordId,
        name: channels[0].name,
        initials: channels[0].initials,
        channels: sortedChannels,
        lastActiveChannel,
        isAnyActive,
        priority: highestPriority.priority,
        priorityClassName: highestPriority.priorityClassName,
        badgeColor: highestPriority.badgeColor,
      };
    });
}

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
const DOCKED_CONVERSATION_CONTENT_ENTER_DELAY_MS = 0;
const DOCKED_CONVERSATION_CONTENT_TRANSITION_MS = 520;
const CUSTOMER_INFO_PANEL_CONTENT_ENTER_DELAY_MS = 120;
const CUSTOMER_INFO_PANEL_CONTENT_TRANSITION_MS = 220;
const INLINE_APP_SPACE_PANEL_ENTER_DELAY_MS = 20;
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
  if (disposition === "Resolved") return "bg-[#369D3F]";
  if (disposition === "Escalated") return "bg-[#F04438]";
  return "bg-[#F79009]";
}

function ConversationStatusDropdown({
  status,
  onStatusChange,
}: {
  status: QueueAssignmentStatus;
  onStatusChange: (status: QueueAssignmentStatus) => void;
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

function getConversationOverviewSummary(conversation: SharedConversationData) {
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;
  const latestCustomerMessage = [...conversation.messages].reverse().find((message) => message.role === "customer");

  return latestCustomerMessage?.sentiment === "frustrated"
    ? `${customerFirstName} was routed to this agent because the issue is still unresolved and the customer is showing frustration in the current ${conversation.label.toLowerCase()} thread.`
    : `${customerFirstName} was routed to this agent because the current ${conversation.label.toLowerCase()} thread still needs active ownership to move the issue forward.`;
}

function ConversationHeaderSubhead({
  conversation,
  activeChannel,
}: {
  conversation: SharedConversationData;
  activeChannel: CustomerChannel;
}) {
  const channelLabel = conversationChannelOptions.find((option) => option.channel === activeChannel)?.label ?? activeChannel;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#7A7A7A]">
      <span className="font-medium text-[#5B5B5B]">{conversation.customerName}</span>
      <span aria-hidden="true">·</span>
      <span>{channelLabel}</span>
    </div>
  );
}

function CustomerContactDropdown({
  onOpenCall,
  onOpenChannel,
  isCallDisabled,
}: {
  onOpenCall: (anchorRect?: DOMRect | null) => void;
  onOpenChannel: (channel: Extract<CustomerChannel, "sms" | "email">) => void;
  isCallDisabled: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onMouseDown={(event) => event.stopPropagation()}
          className="h-8 rounded-full border-black/10 px-3 text-[#333333]"
        >
          Contact <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44 rounded-2xl border border-black/10 bg-white p-1 shadow-[0_18px_50px_rgba(15,23,42,0.14)]"
      >
        <DropdownMenuItem
          onClick={(event) => onOpenCall(event.currentTarget.getBoundingClientRect())}
          disabled={isCallDisabled}
          className="rounded-xl px-3 py-2 text-sm text-[#111827]"
        >
          <Phone className="mr-2 h-4 w-4" />
          Call
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onOpenChannel("email")}
          className="rounded-xl px-3 py-2 text-sm text-[#111827]"
        >
          <Mail className="mr-2 h-4 w-4" />
          Email
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onOpenChannel("sms")}
          className="rounded-xl px-3 py-2 text-sm text-[#111827]"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          SMS
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ConversationOverviewButton({
  conversation,
  isOpen,
  onOpenChange,
}: {
  conversation: SharedConversationData;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const overviewSummary = getConversationOverviewSummary(conversation);

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onMouseDown={(event) => event.stopPropagation()}
          className="h-8 rounded-full border-black/10 px-3 text-[#333333]"
        >
          <span>Overview</span>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        className="z-[95] w-[320px] rounded-2xl border border-[#E7D7A6] bg-[#FFF9E8] p-0 shadow-[0_16px_40px_rgba(122,91,0,0.16)]"
      >
        <div className="flex items-center justify-between border-b border-[#E7D7A6] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7A5B00]">Context overview</p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#7A5B00] transition-colors hover:bg-[#F6EDCF]"
            aria-label="Close context overview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 py-3 text-sm leading-6 text-[#6B5A1B]">
          <p>{overviewSummary}</p>
        </div>
      </PopoverContent>
    </Popover>
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
  const [accountNumber, setAccountNumber] = useState("");
  const [isTestingAudio, setIsTestingAudio] = useState(false);
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
              className="w-full bg-[#369D3F] text-white hover:bg-[#2E8A36]"
            >
              Launch Call
            </Button>
          </>
        ) : mode === "connecting" ? (
          <div className="rounded-xl border border-black/10 bg-[#F8F8F9] px-3 py-4 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#E6F3FA] text-[#006DAD] animate-pulse">
              <Phone className="h-5 w-5" />
            </div>
            <div className="mt-3 text-sm font-semibold text-[#333333]">Connecting your call…</div>
            <p className="mt-1 text-xs leading-5 text-[#6B7280]">
              We’re reaching the customer now. The transcript will appear once the call is live.
            </p>
          </div>
        ) : mode === "controls" ? (
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

function CustomerProfilePopover({ customerRecordId, customerName }: { customerRecordId: string; customerName: string }) {
  const customer = getCustomerRecord(customerRecordId);
  const profile = customer?.profile;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 rounded-md text-sm font-semibold tracking-tight text-[#333333] hover:text-[#111827] focus-visible:outline-none"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {customerName}
          <ChevronDown className="h-3.5 w-3.5 text-[#7A7A7A]" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        className="w-[360px] rounded-2xl border border-black/10 bg-white p-0 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {profile ? (
          <div className="overflow-hidden rounded-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EBF4FA] text-[#006DAD]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#111827] leading-tight">{customerName}</p>
                  <p className="text-xs text-[#7A7A7A] leading-tight mt-0.5">{profile.department} · {profile.tenureYears} yrs tenure</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7A7A7A]">Total AUM</p>
                <p className="text-sm font-bold text-[#111827] mt-0.5">{profile.totalAUM}</p>
              </div>
            </div>
            {/* Financial details */}
            <div className="border-t border-black/[0.06] px-4 py-3 space-y-2.5">
              <div>
                <p className="text-xs text-[#7A7A7A]">Financial Readiness</p>
                <p className="mt-0.5 text-base font-bold text-[#1A7A3C] leading-none">{profile.financialReadiness} <span className="text-xs font-medium text-[#7A7A7A]">/ 100</span></p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
                  <div className="h-full rounded-full bg-[#1A7A3C]" style={{ width: `${profile.financialReadiness}%` }} />
                </div>
              </div>
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-[#7A7A7A] shrink-0">Financial Advisor</p>
                <div className="text-right">
                  <p className="text-xs font-semibold text-[#111827]">{profile.financialAdvisor}</p>
                  <p className="text-[11px] text-[#7A7A7A]">{profile.advisorTitle}</p>
                </div>
              </div>
            </div>
            {/* Tags */}
            {profile.tags.length > 0 && (
              <div className="border-t border-black/[0.06] px-4 py-3 flex flex-wrap gap-1.5">
                {profile.tags.map((tag) => (
                  <span key={tag} className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    tag === "Premier"
                      ? "border-[#C9B8FF] bg-[#F5F0FF] text-[#5B21B6]"
                      : "border-[#B7E6DD] bg-[#EAF8F4] text-[#1A7A3C]",
                  )}>
                    {tag}
                    {tag !== "Premier" && <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="border-t border-black/[0.06] px-5 py-4 text-sm text-[#7A7A7A]">No profile data available.</div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function DockedConversationPanel({
  isOpen,
  conversation,
  openChannels,
  activeChannel,
  customerRecordId,
  onConversationChange,
  onSelectChannel,
  onOpenDeskPanel,
  onOpenCall,
  onOpenChannel,
  onOpenCustomerInfo,
  onConversationStatusChange,
  overviewIsOpen,
  onOverviewOpenChange,
  isCallDisabled,
  onClose,
  onUndockStart,
  showTrailingGap,
  isEqualSplit = false,
  equalSplitWidth,
}: {
  isOpen: boolean;
  conversation: SharedConversationData;
  openChannels: CustomerChannel[];
  activeChannel: CustomerChannel;
  customerRecordId: string;
  onConversationChange: (conversation: SharedConversationData, channel?: CustomerChannel) => void;
  onSelectChannel: (channel: CustomerChannel) => void;
  onOpenDeskPanel: (selection?: Exclude<DeskPanelSelection, null>) => void;
  onOpenCall: (anchorRect?: DOMRect | null) => void;
  onOpenChannel: (channel: Extract<CustomerChannel, "sms" | "email">) => void;
  onOpenCustomerInfo: (event?: React.MouseEvent<HTMLElement>) => void;
  onConversationStatusChange: (status: ConversationStatus) => void;
  overviewIsOpen: boolean;
  onOverviewOpenChange: (open: boolean) => void;
  isCallDisabled: boolean;
  onClose: () => void;
  onUndockStart: (event: React.MouseEvent<HTMLElement>) => void;
  showTrailingGap: boolean;
  isEqualSplit?: boolean;
  equalSplitWidth?: number;
}) {
  const contentInitializedRef = useRef(false);
  const [isContentVisible, setIsContentVisible] = useState(isOpen);
  const [isContentEntered, setIsContentEntered] = useState(isOpen);
  const [isAiPanelVisible, setIsAiPanelVisible] = useState(true);
  const shouldStackHeaderActions = false;

  useEffect(() => {
    if (!contentInitializedRef.current) {
      contentInitializedRef.current = true;
      return;
    }

    let timeoutId: number | undefined;
    let frameId: number | undefined;

    if (!isOpen) {
      setIsContentEntered(false);
      timeoutId = window.setTimeout(() => {
        setIsContentVisible(false);
      }, DOCKED_CONVERSATION_CONTENT_TRANSITION_MS);

      return () => {
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
        }
      };
    }

    setIsContentVisible(true);
    timeoutId = window.setTimeout(() => {
      frameId = window.requestAnimationFrame(() => {
        setIsContentEntered(true);
      });
    }, DOCKED_CONVERSATION_CONTENT_ENTER_DELAY_MS);

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [isOpen]);

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "relative hidden min-h-0 overflow-visible transition-[margin,opacity,transform] duration-500 ease-out min-[800px]:block",
        isOpen && (!isEqualSplit || equalSplitWidth === undefined) && "min-w-0 flex-1 basis-0",
        isOpen && isEqualSplit && equalSplitWidth !== undefined && "min-w-0 shrink-0",
        isOpen ? "min-[800px]:translate-x-0 min-[800px]:opacity-100" : "pointer-events-none w-0 min-[800px]:-translate-x-4 min-[800px]:opacity-0",
      )}
      style={{
        width: isOpen && isEqualSplit && equalSplitWidth !== undefined ? equalSplitWidth : undefined,
        marginRight: isOpen && showTrailingGap ? DOCKED_CONVERSATION_GAP : 0,
      }}
    >
      <div
        className={cn(
          "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-black/[0.16] bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[opacity,transform,box-shadow] duration-500 ease-out will-change-[opacity,transform]",
          isContentEntered ? "translate-x-0 scale-100 opacity-100" : "translate-x-3 scale-[0.985] opacity-0",
        )}
      >
        {isContentVisible && (
          <>
            <div
              data-conversation-panel-header
              className={cn(
                "flex min-h-[68px] border-b border-border bg-background/50 px-5 py-4",
                shouldStackHeaderActions ? "flex-col items-stretch gap-3" : "items-center justify-between gap-3",
              )}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Undock conversation panel"
                  onMouseDown={onUndockStart}
                  className="flex h-6 w-6 flex-shrink-0 cursor-grab items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333] active:cursor-grabbing"
                >
                  <GripHorizontal className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <CustomerProfilePopover customerRecordId={customerRecordId} customerName={conversation.customerName} />
                </div>
              </div>
              <div
                className={cn(
                  "flex items-center gap-2",
                  shouldStackHeaderActions ? "pl-7" : "shrink-0",
                )}
              >
                <CustomerContactDropdown
                  onOpenCall={(anchorRect) => onOpenCall(anchorRect)}
                  onOpenChannel={onOpenChannel}
                  isCallDisabled={isCallDisabled}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={() => setIsAiPanelVisible((v) => !v)}
                        aria-label={isAiPanelVisible ? "Hide AI panel" : "Show AI panel"}
                        className={cn(
                          "h-8 w-8 shrink-0 transition-colors hover:bg-transparent",
                          isAiPanelVisible ? "text-primary" : "text-[#AAAAAA] hover:text-[#333333]",
                        )}
                      >
                        <PanelRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Toggle AI tips</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <ConversationPanel
              conversation={conversation}
              openChannels={openChannels}
              activeChannel={activeChannel}
              customerId={customerRecordId}
              draftKey={`docked-${conversation.label}-${conversation.customerName}`}
              onConversationChange={onConversationChange}
              onSelectChannel={onSelectChannel}
              onOpenDeskPanel={onOpenDeskPanel}
              showAiPanel={isAiPanelVisible}
            />
          </>
        )}
      </div>

    </div>
  );
}

function CombinedInteractionPanel({
  isOpen,
  width,
  maxWidth,
  activeTab,
  conversation,
  openChannels,
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
  panelTitle,
  isEqualSplit = false,
  onConversationChange,
  onSelectChannel,
  onOpenDeskPanel,
  onTabChange,
  onClose,
}: {
  isOpen: boolean;
  width: number;
  maxWidth: number;
  activeTab: CombinedInteractionPanelTab;
  conversation: SharedConversationData;
  openChannels: CustomerChannel[];
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
  panelTitle?: string;
  isEqualSplit?: boolean;
  onConversationChange: (conversation: SharedConversationData, channel?: CustomerChannel) => void;
  onSelectChannel: (channel: CustomerChannel) => void;
  onOpenDeskPanel: (selection?: Exclude<DeskPanelSelection, null>) => void;
  onTabChange: (tab: CombinedInteractionPanelTab) => void;
  onClose: () => void;
}) {
  const visibleTabCount = [showConversationTab, true, showCanvasTab].filter(Boolean).length;
  const resolvedPanelTitle = panelTitle ?? (showConversationTab ? "Conversation & Customer" : "App Space");
  const customerTabLabel = showConversationTab ? "Customer" : "Customer Information";

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "relative min-h-0 overflow-visible transition-[width,margin,opacity,transform] duration-300 ease-out",
        (isFullWidth || isEqualSplit) && "min-w-0 flex-1 basis-0",
        isOpen ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-4 opacity-0",
      )}
      style={{
        width: isFullWidth || isEqualSplit ? undefined : isOpen ? width : 0,
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
                <h3 className="text-sm font-semibold tracking-tight text-[#333333]">{resolvedPanelTitle}</h3>
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
                {customerTabLabel}
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
                openChannels={openChannels}
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
              key={customerRecordId}
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

    </div>
  );
}

function InlineAppSpacePanel({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  const [isEntered, setIsEntered] = useState(false);

  useEffect(() => {
    let timeoutId: number | undefined;
    let frameId: number | undefined;

    if (!isOpen) {
      setIsEntered(false);
      return;
    }

    timeoutId = window.setTimeout(() => {
      frameId = window.requestAnimationFrame(() => {
        setIsEntered(true);
      });
    }, INLINE_APP_SPACE_PANEL_ENTER_DELAY_MS);

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [isOpen]);

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "min-h-0 overflow-hidden transition-[width,opacity,transform] duration-300 ease-out",
        isOpen ? "min-w-0 flex-1 basis-0 opacity-100" : "pointer-events-none w-0 opacity-0",
      )}
    >
      <div
        className={cn(
          "h-full min-h-0 w-full transition-[opacity,transform] duration-300 ease-out",
          isOpen && isEntered ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0",
        )}
      >
        {children}
      </div>
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
  onOpenCall,
  isCallDisabled,
  onClose,
  onUndockStart,
  showTrailingGap,
  isEqualSplit = false,
  equalSplitWidth,
}: {
  isOpen: boolean;
  width: number;
  maxWidth: number;
  customerRecordId: string;
  customerName: string;
  customerId: string;
  panelSelection: DeskPanelSelection;
  onWidthChange: (width: number) => void;
  onOpenCall: (anchorRect?: DOMRect | null) => void;
  isCallDisabled: boolean;
  onClose: () => void;
  onUndockStart: (event: React.MouseEvent<HTMLElement>) => void;
  showTrailingGap: boolean;
  isEqualSplit?: boolean;
  equalSplitWidth?: number;
}) {
  const resizeStartRef = useRef({ mouseX: 0, width });
  const isResizingRef = useRef(false);
  const contentInitializedRef = useRef(false);
  const [isContentVisible, setIsContentVisible] = useState(isOpen);
  const [isContentEntered, setIsContentEntered] = useState(isOpen);

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

  useEffect(() => {
    if (!contentInitializedRef.current) {
      contentInitializedRef.current = true;
      return;
    }

    let timeoutId: number | undefined;
    let frameId: number | undefined;

    if (!isOpen) {
      setIsContentEntered(false);
      timeoutId = window.setTimeout(() => {
        setIsContentVisible(false);
      }, CUSTOMER_INFO_PANEL_CONTENT_TRANSITION_MS);

      return () => {
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
        }
      };
    }

    setIsContentVisible(true);
    timeoutId = window.setTimeout(() => {
      frameId = window.requestAnimationFrame(() => {
        setIsContentEntered(true);
      });
    }, CUSTOMER_INFO_PANEL_CONTENT_ENTER_DELAY_MS);

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [isOpen]);

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "relative hidden min-h-0 overflow-visible transition-[width,margin,opacity,transform] duration-400 ease-out min-[1024px]:block",
        isEqualSplit && equalSplitWidth === undefined && "min-w-0 flex-1 basis-0",
        isEqualSplit && equalSplitWidth !== undefined && "shrink-0",
        isOpen
          ? "min-[1024px]:translate-x-0 min-[1024px]:opacity-100"
          : "pointer-events-none min-[1024px]:translate-x-4 min-[1024px]:opacity-0",
      )}
      style={{
        width: isEqualSplit ? equalSplitWidth : isOpen ? width : 0,
        marginRight: isOpen && showTrailingGap ? CUSTOMER_INFO_PANEL_GAP : 0,
      }}
    >
      <div
        className={cn(
          "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-black/[0.16] bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[opacity,transform,box-shadow] duration-200 ease-out will-change-[opacity,transform]",
          isContentEntered ? "translate-x-0 scale-100 opacity-100" : "translate-x-3 scale-[0.985] opacity-0",
        )}
      >
        {isContentVisible ? (
          <>
            <div
              className="flex min-h-[68px] cursor-grab items-center justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
              onMouseDown={onUndockStart}
            >
              <div className="flex items-center gap-3">
                <GripHorizontal className="h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold tracking-tight text-[#333333]">Customer</h3>
                  <p className="truncate text-xs text-[#7A7A7A]">
                    {customerName} · {customerId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
            </div>

            <NotesPanel
              key={customerRecordId}
              initialTab={panelSelection?.initialTab ?? "Overview"}
              initialTicketId={panelSelection?.ticketId}
              customerId={customerRecordId}
            />
          </>
        ) : null}
      </div>

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
  onOpenCall,
  isCallDisabled,
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
  onOpenCall: (anchorRect?: DOMRect | null) => void;
  isCallDisabled: boolean;
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
        key={customerRecordId}
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
          className="flex min-h-[68px] cursor-grab items-center justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
          onMouseDown={onUndockStart}
        >
          <div className="flex items-center gap-3">
            <GripHorizontal className="h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {view === "copilot"
          ? <CopilotContent />
          : view === "notes"
            ? <NotesPanel notesOnly />
            : view === "add"
              ? <AddPanelContent />
              : view === "customer"
                ? <NotesPanel key={customerId} customerId={customerId} />
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
  openChannels,
  activeChannel,
  customerRecordId,
  zIndex,
  onPositionChange,
  onSizeChange,
  onConversationChange,
  onSelectChannel,
  onOpenDeskPanel,
  onOpenCall,
  onOpenChannel,
  onOpenCustomerInfo,
  onConversationStatusChange,
  overviewIsOpen,
  onOverviewOpenChange,
  isCallDisabled,
  onDock,
  dragActivation = null,
  onInteractStart,
}: {
  position: ConversationPopunderPosition;
  size: ConversationPopunderSize;
  conversation: SharedConversationData;
  openChannels: CustomerChannel[];
  activeChannel: CustomerChannel;
  customerRecordId: string;
  zIndex: number;
  onPositionChange: (position: ConversationPopunderPosition) => void;
  onSizeChange: (size: ConversationPopunderSize) => void;
  onConversationChange: (conversation: SharedConversationData, channel?: CustomerChannel) => void;
  onSelectChannel: (channel: CustomerChannel) => void;
  onOpenDeskPanel: (selection?: Exclude<DeskPanelSelection, null>) => void;
  onOpenCall: (anchorRect?: DOMRect | null) => void;
  onOpenChannel: (channel: Extract<CustomerChannel, "sms" | "email">) => void;
  onOpenCustomerInfo: (event?: React.MouseEvent<HTMLElement>) => void;
  onConversationStatusChange: (status: ConversationStatus) => void;
  overviewIsOpen: boolean;
  onOverviewOpenChange: (open: boolean) => void;
  isCallDisabled: boolean;
  onDock?: () => void;
  dragActivation?: CopilotDragActivation | null;
  onInteractStart?: () => void;
}) {
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: size.width, height: size.height });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const [isAiPanelVisible, setIsAiPanelVisible] = useState(true);
  const shouldStackHeaderActions = size.width < 800;
  const isVeryNarrow = size.width < 640;

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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <GripHorizontal className="h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
            <div>
              <CustomerProfilePopover customerRecordId={customerRecordId} customerName={conversation.customerName} />
            </div>
          </div>
          {shouldStackHeaderActions && onDock ? (
            <div className="flex items-center gap-1.5">
              {isVeryNarrow && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={() => setIsAiPanelVisible((v) => !v)}
                        aria-label={isAiPanelVisible ? "Hide AI panel" : "Show AI panel"}
                        className={cn(
                          "h-8 w-8 shrink-0 transition-colors hover:bg-transparent",
                          isAiPanelVisible ? "text-primary" : "text-[#AAAAAA] hover:text-[#333333]",
                        )}
                      >
                        <PanelRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Toggle AI tips</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
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
            </div>
          ) : null}
        </div>
        <div
          className={cn(
            "flex items-center gap-2",
            shouldStackHeaderActions ? "pl-7" : "",
          )}
        >
          <CustomerContactDropdown
            onOpenCall={(anchorRect) => onOpenCall(anchorRect)}
            onOpenChannel={onOpenChannel}
            isCallDisabled={isCallDisabled}
          />
          {!isVeryNarrow && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={() => setIsAiPanelVisible((v) => !v)}
                    aria-label={isAiPanelVisible ? "Hide AI panel" : "Show AI panel"}
                    className={cn(
                      "h-8 w-8 shrink-0 transition-colors hover:bg-transparent",
                      isAiPanelVisible ? "text-primary" : "text-[#AAAAAA] hover:text-[#333333]",
                    )}
                  >
                    <PanelRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Toggle AI tips</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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
        openChannels={openChannels}
        activeChannel={activeChannel}
        customerId={customerRecordId}
        draftKey={`popunder-${conversation.label}-${conversation.customerName}`}
        onConversationChange={onConversationChange}
        onSelectChannel={onSelectChannel}
        onOpenDeskPanel={onOpenDeskPanel}
        showAiPanel={isAiPanelVisible}
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

function ActiveVoiceAssignmentControls({
  onOpenDisposition,
}: {
  onOpenDisposition: (anchorRect?: DOMRect | null) => void;
}) {
  return (
    <div className="mt-3 flex items-stretch gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        className="h-auto flex-1 flex-col gap-1 border-black/10 px-2 py-2 text-[11px] text-[#333333]"
      >
        <ArrowRightLeft className="h-4 w-4" />
        Transfer
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        className="h-auto flex-1 flex-col gap-1 border-black/10 px-2 py-2 text-[11px] text-[#333333]"
      >
        <Pause className="h-4 w-4" />
        Hold
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={(event) => {
          event.stopPropagation();
          onOpenDisposition(event.currentTarget.getBoundingClientRect());
        }}
        onMouseDown={(event) => event.stopPropagation()}
        className="h-auto flex-1 flex-col gap-1 border-[#F04438]/20 px-2 py-2 text-[11px] text-[#F04438] hover:bg-[#FFF5F5] hover:text-[#F04438]"
      >
        <PhoneOff className="h-4 w-4" />
        End Call
      </Button>
    </div>
  );
}

function QueueAssignmentCard({
  item,
  status,
  onStatusChange,
  onRemove,
  onSelectAssignment,
  className,
  style,
}: {
  item: QueuePreviewItem;
  status: QueueAssignmentStatus;
  onStatusChange: (status: QueueAssignmentStatus) => void;
  onRemove: () => void;
  onSelectAssignment: (assignmentId: QueuePreviewItem["id"]) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ItemIcon = item.icon;
  const canRemove = status !== "open";
  const channelLabel = conversationChannelOptions.find((option) => option.channel === item.channel)?.label ?? item.channel;
  const { activeCallAssignmentId, isAgentInCall, openCallDisposition } = useLayoutContext();
  const showActiveVoiceControls = isAgentInCall && item.id === activeCallAssignmentId;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectAssignment(item.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectAssignment(item.id);
        }
      }}
      className={cn(
        "group relative flex w-full items-start gap-3 overflow-hidden rounded-[8px] border border-black/[0.06] bg-white px-4 py-4 text-left shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006DAD]/30",
        item.isActive
          ? "border-[#006DAD] shadow-[0_8px_22px_rgba(0,109,173,0.14)]"
          : "hover:-translate-y-0.5 hover:border-black/10 hover:shadow-[0_10px_24px_rgba(15,23,42,0.12)]",
        className,
      )}
      style={style}
    >
      {item.isActive ? <span className="absolute inset-y-0 left-0 w-1 rounded-l-[8px] bg-[#006DAD]" /> : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-[14px] font-semibold leading-5 text-[#333333]">{item.name}</span>
              <span className="inline-flex items-center rounded-full bg-[#F1F3F5] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5B5B5B]">
                {channelLabel}
              </span>
              <div
                className="shrink-0"
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <ConversationStatusDropdown status={status} onStatusChange={onStatusChange} />
              </div>
            </div>
          </div>
          {canRemove ? (
            <button
              type="button"
              aria-label={`Remove ${item.name} from left rail`}
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
              onMouseDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-[#F8F8F9] hover:text-[#333333]"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-[#6B6B6B]">
          <span className="inline-flex items-center gap-1.5">
            <ItemIcon className="h-4 w-4 text-[#369D3F]" />
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {item.time}
          </span>
        </div>

        <div className="mt-2 text-[13px] leading-5 text-[#5B5B5B]">{item.preview}</div>
        {showActiveVoiceControls ? <ActiveVoiceAssignmentControls onOpenDisposition={openCallDisposition} /> : null}
      </div>
    </div>
  );
}

function GroupedQueueCard({
  group,
  queueStatuses,
  onStatusChange,
  onRemove,
  onSelectAssignment,
  className,
  style,
}: {
  group: GroupedQueueItem;
  queueStatuses: Record<string, QueueAssignmentStatus>;
  onStatusChange: (assignmentId: QueuePreviewItem["id"], status: QueueAssignmentStatus) => void;
  onRemove: (assignmentId: QueuePreviewItem["id"]) => void;
  onSelectAssignment: (assignmentId: QueuePreviewItem["id"]) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { isAgentInCall, openCallDisposition, activeCallAssignmentId } = useLayoutContext();

  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden rounded-[8px] border border-black/[0.06] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition-all duration-300",
        group.isAnyActive
          ? "border-[#006DAD] shadow-[0_8px_22px_rgba(0,109,173,0.14)]"
          : "hover:border-black/10 hover:shadow-[0_10px_24px_rgba(15,23,42,0.12)]",
        className,
      )}
      style={style}
    >
      {group.isAnyActive && <span className="absolute inset-y-0 left-0 w-1 rounded-l-[8px] bg-[#006DAD]" />}

      {/* Customer name header */}
      <div className="px-4 pb-1 pt-3">
        <span className="text-[14px] font-semibold leading-5 text-[#333333]">{group.name}</span>
      </div>

      {/* Channel rows */}
      {group.channels.map((item, index) => {
        const ItemIcon = item.icon;
        const channelLabel =
          conversationChannelOptions.find((o) => o.channel === item.channel)?.label ?? item.channel;
        const status = queueStatuses[item.id] ?? "open";
        const canRemove = status !== "open";
        const isChannelActive = item.isActive;
        const showActiveVoiceControls =
          isAgentInCall && item.id === activeCallAssignmentId;

        return (
          <div key={item.id}>
            {index > 0 && <div className="mx-4 border-t border-black/[0.06]" />}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelectAssignment(item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectAssignment(item.id);
                }
              }}
              className={cn(
                "flex w-full cursor-pointer flex-col gap-1.5 px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006DAD]/30",
                isChannelActive ? "bg-[#EEF6FC]" : "hover:bg-[#F8F8F9]",
              )}
            >
              {/* Top row: channel badge + timestamp + status + remove */}
              <div className="flex items-center gap-2">
                {/* Channel badge */}
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F1F3F5] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5B5B5B]">
                  <ItemIcon className="h-3 w-3 text-[#369D3F]" />
                  {channelLabel}
                </span>

                {/* Timestamp */}
                <span className="flex items-center gap-1 text-[11px] text-[#6B6B6B]">
                  <Clock className="h-3 w-3 shrink-0" />
                  {item.time}
                </span>

                {/* Status + remove — pushed to the right */}
                <div
                  className="ml-auto flex shrink-0 items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <ConversationStatusDropdown
                    status={status}
                    onStatusChange={(s) => onStatusChange(item.id, s)}
                  />
                  {canRemove ? (
                    <button
                      type="button"
                      aria-label={`Remove ${channelLabel} for ${group.name}`}
                      onClick={() => onRemove(item.id)}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-[#F8F8F9] hover:text-[#333333]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Bottom row: preview stretches full width */}
              <div className="line-clamp-2 text-[12px] leading-[1.4] text-[#5B5B5B]">
                {item.preview}
              </div>
              {showActiveVoiceControls ? (
                <ActiveVoiceAssignmentControls onOpenDisposition={openCallDisposition} />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QueueOverlayList({
  groups,
  queueStatuses,
  onStatusChange,
  onRemove,
  isOpen,
  onSelectAssignment,
}: {
  groups: GroupedQueueItem[];
  queueStatuses: Record<string, QueueAssignmentStatus>;
  onStatusChange: (assignmentId: QueuePreviewItem["id"], status: QueueAssignmentStatus) => void;
  onRemove: (assignmentId: QueuePreviewItem["id"]) => void;
  isOpen: boolean;
  onSelectAssignment: (assignmentId: QueuePreviewItem["id"]) => void;
}) {
  return (
    <div className="space-y-3 bg-transparent p-3">
      {groups.map((group, index) => (
        <GroupedQueueCard
          key={group.customerRecordId}
          group={group}
          queueStatuses={queueStatuses}
          onStatusChange={onStatusChange}
          onRemove={onRemove}
          onSelectAssignment={onSelectAssignment}
          className={cn(isOpen ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0")}
          style={{ transitionDelay: `${index * 35}ms` }}
        />
      ))}
    </div>
  );
}

function LeftQueueRail({
  visibleAssignments,
  queueStatuses,
  onStatusChange,
  onRemoveAssignment,
}: {
  visibleAssignments: QueuePreviewItem[];
  queueStatuses: Record<string, QueueAssignmentStatus>;
  onStatusChange: (assignmentId: QueuePreviewItem["id"], status: QueueAssignmentStatus) => void;
  onRemoveAssignment: (assignmentId: QueuePreviewItem["id"]) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [isPriorityAssistEnabled, setIsPriorityAssistEnabled] = useState(true);
  const {
    closeFloatingAppSpacePanel,
    isAppSpacePanelInDragMode,
    selectedAssignment,
    selectAssignment,
    isAgentInCall,
    activeCallAssignmentId,
  } = useLayoutContext();

  const visibleQueuePreviewItems = useMemo(() => {
    const nextItems = visibleAssignments.map((item) => ({
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
  }, [isPriorityAssistEnabled, selectedAssignment.id, visibleAssignments]);

  // Group flat items by customer so multi-channel customers share one card
  const groupedQueueItems = useMemo(
    () => groupQueueItems(visibleQueuePreviewItems, selectedAssignment.id),
    [visibleQueuePreviewItems, selectedAssignment.id],
  );

  const toggleLeftRailOpen = () => {
    setIsOpen((current) => !current);
  };

  const handleRemoveQueueItem = (assignmentId: QueuePreviewItem["id"]) => {
    onRemoveAssignment(assignmentId);
  };

  return (
    <div
      className={cn(
        "relative z-30 block h-full shrink-0 overflow-hidden transition-[width] duration-300 ease-out",
        isOpen ? "w-[347px]" : "w-[60px]",
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
                {groupedQueueItems.map((group) => {
                  // Collapsed rail shows one icon per customer using the last active channel
                  const lastChannel = group.lastActiveChannel;
                  const ItemIcon = lastChannel.icon;
                  const priorityKey = group.priority.toLowerCase();
                  const priorityDotClassName = priorityDotClassNameMap[priorityKey] ?? "bg-[#98A2B3]";
                  const priorityIconClassName = priorityIconClassNameMap[priorityKey] ?? "text-[#98A2B3]";
                  // Show channel count badge when multiple channels are open
                  const multiChannel = group.channels.length > 1;
                  // Keep card pinned open if this group has an active call so controls are always reachable
                  const hasActiveCall =
                    isAgentInCall &&
                    group.channels.some((c) => c.id === activeCallAssignmentId);

                  return (
                    <HoverCard
                      key={group.customerRecordId}
                      openDelay={120}
                      closeDelay={80}
                      open={hasActiveCall ? true : undefined}
                    >
                      <HoverCardTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "relative flex h-[50px] w-[52px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 text-center transition-all duration-200",
                            group.isAnyActive
                              ? "border border-[#006DAD]/15 bg-white shadow-[0_6px_18px_rgba(0,109,173,0.12)]"
                              : "border border-transparent bg-transparent hover:border-black/5 hover:bg-white/80",
                          )}
                          aria-label={`${group.name} queue item`}
                          onClick={() => selectAssignment(lastChannel.id)}
                        >
                          <span
                            aria-hidden="true"
                            className={cn("absolute right-1.5 top-1.5 h-2 w-2 rounded-full", priorityDotClassName)}
                          />
                          {multiChannel && (
                            <span className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#006DAD] text-[8px] font-bold text-white">
                              {group.channels.length}
                            </span>
                          )}
                          <ItemIcon className={cn("h-5 w-5", priorityIconClassName)} />
                          <span
                            className={cn(
                              "text-[9px] font-semibold leading-none tabular-nums tracking-[-0.02em]",
                              group.isAnyActive ? "text-[#006DAD]" : "text-[#667085]",
                            )}
                          >
                            {lastChannel.time}
                          </span>
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent
                        side="right"
                        align="start"
                        sideOffset={14}
                        className="w-[295px] border-none bg-transparent p-0 shadow-none"
                      >
                        <GroupedQueueCard
                          group={group}
                          queueStatuses={queueStatuses}
                          onStatusChange={onStatusChange}
                          onRemove={handleRemoveQueueItem}
                          onSelectAssignment={selectAssignment}
                        />
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
            "h-full min-h-0 overflow-hidden transition-[width,opacity] duration-300 ease-out",
            isOpen ? "w-[347px] opacity-100" : "w-0 opacity-0",
          )}
        >
          <div
            className={cn(
              "ml-4 mr-4 flex h-full min-h-0 w-[315px] min-w-[315px] flex-col bg-[#F8F8F9] transition-transform duration-300 ease-out",
              isOpen ? "translate-x-0" : "-translate-x-8",
            )}
          >
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[8px] border border-black/[0.16] bg-white">
              <div className="shrink-0 border-b border-border bg-background/50 px-4 py-4">
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        toggleLeftRailOpen();
                      }}
                      aria-label="Collapse assignments rail"
                      aria-pressed={true}
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white text-[#333333] shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-colors hover:border-[#006DAD]/30 hover:text-[#006DAD]"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="min-w-0">
                      <h3 className="text-[13px] font-semibold tracking-tight text-[#333333]">Assignments</h3>
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
                <QueueOverlayList
                  groups={groupedQueueItems}
                  queueStatuses={queueStatuses}
                  onStatusChange={onStatusChange}
                  onRemove={handleRemoveQueueItem}
                  isOpen={isOpen}
                  onSelectAssignment={selectAssignment}
                />
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [workspaceOptions, setWorkspaceOptions] = useState(initialWorkspaceOptions);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<WorkspaceOption["id"]>(initialWorkspaceOptions[0].id);
  const [assignmentItemsById, setAssignmentItemsById] = useState<Record<string, QueuePreviewItem>>(() => (
    Object.fromEntries(initialVisibleAssignments.map((item) => [item.id, item])) as Record<string, QueuePreviewItem>
  ));
  const [visibleAssignmentIds, setVisibleAssignmentIds] = useState<QueuePreviewItem["id"][]>(() => initialVisibleAssignmentIds);
  const [isConversationPanelOpen, setIsConversationPanelOpen] = useState(true);
  const [conversationStatesByKey, setConversationStatesByKey] = useState<Record<string, SharedConversationData>>(() => ({
    [getConversationStateKey(initialSelectedAssignmentId)]: defaultConversationState,
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
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<QueuePreviewItem["id"]>(() => initialSelectedAssignmentId);
  const [overviewOpenByAssignmentId, setOverviewOpenByAssignmentId] = useState<Record<string, boolean>>({});
  const [assignmentStatusesById, setAssignmentStatusesById] = useState<Record<string, QueueAssignmentStatus>>(() => (
    Object.fromEntries(queuePreviewItems.map((item) => [item.id, "open"])) as Record<string, QueueAssignmentStatus>
  ));
  const [activeCallAssignmentId, setActiveCallAssignmentId] = useState<QueuePreviewItem["id"] | null>(null);
  const [recentInteractions, setRecentInteractions] = useState<RecentInteractionItem[]>([]);
  const [pendingCallCustomerRecordId, setPendingCallCustomerRecordId] = useState(initialSelectedAssignment.customerRecordId);
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
    () =>
      assignmentItemsById[selectedAssignmentId] ??
      queuePreviewItems.find((item) => item.id === selectedAssignmentId || item.customerRecordId === selectedAssignmentId) ??
      initialSelectedAssignment,
    [assignmentItemsById, selectedAssignmentId],
  );
  const visibleAssignments = useMemo(
    () => visibleAssignmentIds.map((assignmentId) => assignmentItemsById[assignmentId]).filter(Boolean) as QueuePreviewItem[],
    [assignmentItemsById, visibleAssignmentIds],
  );
  const activeConversationChannel = selectedAssignment.channel;
  const activeConversationTabs = [selectedAssignment.channel];
  const activeConversationStateKey = useMemo(
    () => getConversationStateKey(selectedAssignment.id),
    [selectedAssignment.id],
  );
  const conversationState = useMemo(
    () =>
      conversationStatesByKey[activeConversationStateKey] ??
      createConversationState(selectedAssignment.customerRecordId, activeConversationChannel),
    [activeConversationChannel, activeConversationStateKey, conversationStatesByKey, selectedAssignment.customerRecordId],
  );
  const isActivityRoute = location.pathname === "/activity";
  const isExpandedCanvasRoute =
    isActivityRoute && ((location.state as { hideMainCanvasPanel?: boolean } | null)?.hideMainCanvasPanel ?? true);
  const activeDeskRouteView: DeskCanvasView | null = location.pathname === "/desk"
    ? ((new URLSearchParams(location.search).get("view") as DeskCanvasView | null) ?? "desk")
    : null;
  const isCopilotDeskView = activeDeskRouteView === "copilot";
  const isDeskView = activeDeskRouteView === "desk";
  const isDeskRoute = activeDeskRouteView !== null;
  const isCustomerInfoCanvasVisible = isDeskRoute || (isExpandedCanvasRoute && isCustomerInfoPanelOpen);
  const isCombinedInteractionPanel = isCustomerInfoCanvasVisible && isCombinedInteractionPanelEnabled;
  const isAppSpaceSplitLayout = !isCombinedInteractionPanel && isCustomerInfoCanvasVisible;
  const isInlineConversationSplitPanelVisible = isAppSpaceSplitLayout && !isConversationPopunderOpen;
  const isInlineAppSpacePanelVisible = isAppSpaceSplitLayout && !deskCanvasPopunderView && !isCustomerInfoPopunderOpen;
  const shouldCombineDockedCustomerAndDeskPanels =
    isDeskRoute &&
    !isCombinedInteractionPanel &&
    isCustomerInfoPanelOpen &&
    !isCustomerInfoPopunderOpen &&
    isCombinedInteractionPanelCanvasEnabled;
  const isCanvasMergedIntoCombinedPanel = isCombinedInteractionPanel || shouldCombineDockedCustomerAndDeskPanels || isAppSpaceSplitLayout;
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

  useEffect(() => {
    const matchedWorkspace = workspaceOptions.find((workspace) => {
      if (!workspace.routePath) {
        return false;
      }

      if (workspace.id === "desktop") {
        return location.pathname === "/activity" || location.pathname === "/desk";
      }

      return location.pathname === workspace.routePath;
    });

    if (matchedWorkspace && matchedWorkspace.id !== activeWorkspaceId) {
      setActiveWorkspaceId(matchedWorkspace.id);
    }
  }, [activeWorkspaceId, location.pathname, workspaceOptions]);

  const deskCanvasTabLabel = isCopilotDeskView
    ? "AI"
    : new URLSearchParams(location.search).get("view") === "notes"
      ? "Notes"
      : new URLSearchParams(location.search).get("view") === "add"
        ? "Add"
        : new URLSearchParams(location.search).get("view") === "customer"
          ? "Customer Information"
          : new URLSearchParams(location.search).get("view") === "notifications"
            ? "Notifications"
            : "Desk";

  const setActiveConversationChannel = (_channel: CustomerChannel) => {};

  useEffect(() => {
    setConversationStatesByKey((currentStates) => {
      if (currentStates[activeConversationStateKey]) {
        return currentStates;
      }

      return {
        ...currentStates,
        [activeConversationStateKey]: createConversationState(selectedAssignment.customerRecordId, activeConversationChannel),
      };
    });
  }, [activeConversationChannel, activeConversationStateKey, selectedAssignment.customerRecordId]);

  const handleConversationStateChange = (nextConversation: SharedConversationData, _channel?: CustomerChannel) => {
    const targetAssignmentId = selectedAssignment.id;
    const targetCustomerRecordId = selectedAssignment.customerRecordId;
    const targetChannel = activeConversationChannel;
    const targetConversationStateKey = getConversationStateKey(targetAssignmentId);
    const currentConversationState =
      conversationStatesByKey[targetConversationStateKey] ?? createConversationState(targetCustomerRecordId, targetChannel);
    const currentLatestMessage = currentConversationState.messages[currentConversationState.messages.length - 1];

    if (customerReplyTimeoutsRef.current[targetConversationStateKey] !== undefined) {
      window.clearTimeout(customerReplyTimeoutsRef.current[targetConversationStateKey]);
      delete customerReplyTimeoutsRef.current[targetConversationStateKey];
    }

    const latestMessage = nextConversation.messages[nextConversation.messages.length - 1];
    const shouldScheduleCustomerReply =
      latestMessage?.role === "agent"
      && !latestMessage.isInternal
      && (
        currentConversationState.messages.length !== nextConversation.messages.length
        || currentLatestMessage?.id !== latestMessage.id
        || currentLatestMessage?.role !== latestMessage.role
      );
    const persistedConversationState = {
      ...nextConversation,
      isCustomerTyping: shouldScheduleCustomerReply,
    };

    setConversationStatesByKey((currentStates) => ({
      ...currentStates,
      [targetConversationStateKey]: persistedConversationState,
    }));

    if (!latestMessage || !shouldScheduleCustomerReply) {
      return;
    }

    customerReplyTimeoutsRef.current[targetConversationStateKey] = window.setTimeout(() => {
      setConversationStatesByKey((currentStates) => {
        const currentConversationState =
          currentStates[targetConversationStateKey] ?? createConversationState(targetCustomerRecordId, targetChannel);
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

  const handleAssignmentStatusChange = (assignmentId: QueuePreviewItem["id"], status: QueueAssignmentStatus) => {
    setAssignmentStatusesById((currentStatuses) => ({
      ...currentStatuses,
      [assignmentId]: status,
    }));
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
    if (typeof window === "undefined" || isCombinedInteractionPanel || isAppSpaceSplitLayout) {
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
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [isDarkMode]);

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

  // Desk canvas popunder is intentionally NOT auto-cleared when navigating to the desk route.
  // Panels stay floating until the agent explicitly clicks "Dock panel".

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

    if (isCombinedInteractionPanel || isAppSpaceSplitLayout) {
      setIsConversationPanelOpen(true);
      setIsConversationPopunderOpen(false);
    }
  }, [isAppSpaceSplitLayout, isCanvasMergedIntoCombinedPanel, isCombinedInteractionPanel, location.pathname, location.search]);

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

    // Panel is already floating — preserve its drag state, just surface it
    if (isConversationPopunderOpen) {
      bringFloatingPanelToFront("conversation");
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

  const openCustomerConversation = (customerRecordId: string, channel: AssignmentChannel) => {
    // SMS is a single thread per customer — if one is already open, switch to it instead of opening a new one
    if (channel === "sms") {
      const existingSms = visibleAssignmentIds
        .map((id) => assignmentItemsById[id])
        .find((item) => item?.customerRecordId === customerRecordId && item?.channel === "sms");

      if (existingSms) {
        setSelectedAssignmentId(existingSms.id);
        openConversationPanel();
        return existingSms;
      }
    }

    const nextAssignment = createLaunchedAssignment(customerRecordId, channel);

    setDeskPanelSelection(null);
    setAssignmentItemsById((currentItems) => ({
      ...currentItems,
      [nextAssignment.id]: nextAssignment,
    }));
    setVisibleAssignmentIds((currentIds) => [nextAssignment.id, ...currentIds]);
    setAssignmentStatusesById((currentStatuses) => ({
      ...currentStatuses,
      [nextAssignment.id]: "open",
    }));
    setSelectedAssignmentId(nextAssignment.id);
    setConversationStatesByKey((currentStates) => ({
      ...currentStates,
      [getConversationStateKey(nextAssignment.id)]: createFreshConversationState(customerRecordId, channel),
    }));
    openConversationPanel();

    return nextAssignment;
  };

  const openRecentInteractionAssignment = (interaction: RecentInteractionItem) => {
    const matchedCustomer = customerDatabase.find((customer) => customer.customerId === interaction.customerId);
    const customerRecordId = matchedCustomer?.id ?? selectedAssignment.customerRecordId;
    const nextAssignment = createRecentInteractionAssignment(interaction, customerRecordId);
    const nextStatus = getRecentInteractionAssignmentStatus(interaction.status);
    const conversationStateKey = getConversationStateKey(nextAssignment.id);

    setDeskPanelSelection(null);
    setAssignmentItemsById((currentItems) => ({
      ...currentItems,
      [nextAssignment.id]: nextAssignment,
    }));
    setVisibleAssignmentIds((currentIds) => [nextAssignment.id, ...currentIds.filter((currentId) => currentId !== nextAssignment.id)]);
    setAssignmentStatusesById((currentStatuses) => ({
      ...currentStatuses,
      [nextAssignment.id]: nextStatus,
    }));
    setSelectedAssignmentId(nextAssignment.id);
    setPendingCallCustomerRecordId(customerRecordId);
    setConversationStatesByKey((currentStates) => {
      if (currentStates[conversationStateKey]) {
        return currentStates;
      }

      return {
        ...currentStates,
        [conversationStateKey]: createConversationState(customerRecordId, nextAssignment.channel),
      };
    });
    openConversationPanel();
  };

  const openCallDisposition = (anchorRect?: DOMRect | null) => {
    bringFloatingPanelToFront("call");
    setCallPopunderMode("disposition");
    setCallPopunderPosition(getAnchoredCallPopunderPosition(anchorRect));
    setIsCallPopunderOpen(true);
  };

  const handleRemoveVisibleAssignment = (assignmentId: QueuePreviewItem["id"]) => {
    const removedAssignment = assignmentItemsById[assignmentId];
    const conversationStateKey = getConversationStateKey(assignmentId);

    if (customerReplyTimeoutsRef.current[conversationStateKey] !== undefined) {
      window.clearTimeout(customerReplyTimeoutsRef.current[conversationStateKey]);
      delete customerReplyTimeoutsRef.current[conversationStateKey];
    }

    setVisibleAssignmentIds((currentIds) => {
      const nextIds = currentIds.filter((currentId) => currentId !== assignmentId);

      if (selectedAssignmentId === assignmentId) {
        setSelectedAssignmentId(nextIds[0] ?? removedAssignment?.customerRecordId ?? initialSelectedAssignmentId);
      }

      return nextIds;
    });
    setAssignmentItemsById((currentItems) => {
      const nextItems = { ...currentItems };
      delete nextItems[assignmentId];
      return nextItems;
    });
    setConversationStatesByKey((currentStates) => {
      const nextStates = { ...currentStates };
      delete nextStates[conversationStateKey];
      return nextStates;
    });
    setOverviewOpenByAssignmentId((currentOverviewState) => {
      const nextOverviewState = { ...currentOverviewState };
      delete nextOverviewState[assignmentId];
      return nextOverviewState;
    });
    setAssignmentStatusesById((currentStatuses) => {
      const nextStatuses = { ...currentStatuses };
      delete nextStatuses[assignmentId];
      return nextStatuses;
    });

    if (activeCallAssignmentId === assignmentId) {
      setActiveCallAssignmentId(null);
    }
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
      if (!isCustomerInfoPopunderOpen) {
        setIsCustomerInfoPopunderOpen(false);
        setCustomerInfoDragActivation(null);
      }
      return;
    }

    // Panel is already floating — preserve its drag state, just surface it
    if (isCustomerInfoPopunderOpen) {
      bringFloatingPanelToFront("customerInfo");
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
    if (isDeskRoute && activeDeskRouteView === "customer") {
      closeAppSpacePanel();
      return;
    }

    if (isCombinedInteractionPanel) {
      openCombinedInteractionPanel("customerInfo");
      return;
    }

    if (!isCustomerInfoPanelAllowed) {
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
      return;
    }

    setDeskPanelSelection({ initialTab: "Overview" });
    setIsCustomerInfoPanelOpen(false);
    setIsCustomerInfoPopunderOpen(false);
    setCustomerInfoDragActivation(null);
    navigate("/desk?view=customer");
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

  const clearDeskCanvasPopunderState = () => {
    setDeskCanvasDragActivation(null);
    setDeskCanvasPopunderView(null);
  };

  const closeDeskCanvasPopunder = () => {
    setDeskPanelSelection(null);
    clearDeskCanvasPopunderState();
    setIsCustomerInfoPanelOpen(false);
    setIsCustomerInfoPopunderOpen(false);
    setCustomerInfoDragActivation(null);
    navigate("/activity", { state: { hideMainCanvasPanel: true } });
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
            : deskCanvasPopunderView === "notifications"
              ? "/desk?view=notifications"
              : "/desk";

    clearDeskCanvasPopunderState();
    navigate(nextRoute);
  };

  const undockDeskPanel = (view: DeskCanvasView, event: React.MouseEvent<HTMLElement>) => {
    if (typeof window === "undefined") return;

    event.preventDefault();

    const minWidth = getDeskCanvasPopunderMinWidth(view);
    const defaultWidth = getDeskCanvasPopunderDefaultWidth(view);
    const bounds = event.currentTarget.closest("[data-desk-panel-header]")?.getBoundingClientRect()
      ?? event.currentTarget.parentElement?.getBoundingClientRect();
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

  const closeFloatingAppSpacePanel = () => {
    setDeskPanelSelection(null);
    clearDeskCanvasPopunderState();
    setIsCustomerInfoPanelOpen(false);
    setIsCustomerInfoPopunderOpen(false);
    setCustomerInfoDragActivation(null);
    navigate("/activity", { state: { hideMainCanvasPanel: true } });
  };

  const closeAppSpacePanel = () => {
    closeFloatingAppSpacePanel();
  };

  const openDeskPanel = (selection?: Exclude<DeskPanelSelection, null>) => {
    setDeskPanelSelection(selection ?? null);

    // If the customer info panel is already open as a docked panel, just update
    // the selection — NotesPanel's useEffect will open the ticket tab reactively.
    if (isDeskCustomerInfoVisible) {
      return;
    }

    setActiveRightPanel(null);
    // Only close customerInfo if it isn't already floating
    if (!isCustomerInfoPopunderOpen) {
      setIsCustomerInfoPanelOpen(false);
      setCustomerInfoDragActivation(null);
    }

    navigate("/desk?view=customer");
  };

  const openHeaderAppPanel = (view: DeskCanvasView) => {
    setActiveRightPanel(null);
    setIsNotesPopoverOpen(false);
    setIsAddNewPopoverOpen(false);
    // Only open conversation panel in docked mode if it isn't already floating
    if (!isConversationPopunderOpen) {
      setIsConversationPanelOpen(true);
    }
    // Only reset customer info if it isn't already floating
    if (!isCustomerInfoPopunderOpen) {
      setIsCustomerInfoPanelOpen(false);
    }

    if (view === "customer") {
      setDeskPanelSelection({ initialTab: "Overview" });
    } else {
      setDeskPanelSelection(null);
    }

    // If the panel is already docked, update the route to switch content but keep it docked
    if (isDeskRoute) {
      const nextRoute = view === "copilot"
        ? "/desk?view=copilot"
        : view === "notes"
          ? "/desk?view=notes"
          : view === "add"
            ? "/desk?view=add"
            : view === "customer"
              ? "/desk?view=customer"
              : view === "notifications"
                ? "/desk?view=notifications"
                : "/desk";
      navigate(nextRoute);
      return;
    }

    // If a popunder is already visible just switch view
    if (deskCanvasPopunderView !== null) {
      bringFloatingPanelToFront("deskCanvas");
      setDeskCanvasPopunderView(view);
      return;
    }

    // Open a fresh popunder anchored to the top-right
    const defaultWidth = 360;
    const defaultHeight = typeof window !== "undefined"
      ? Math.min(
          Math.max(DESK_CANVAS_POPOUNDER_MIN_HEIGHT, window.innerHeight - 80),
          window.innerHeight - DESK_CANVAS_POPOUNDER_MARGIN * 2,
        )
      : 720;
    const width = typeof window !== "undefined"
      ? Math.min(defaultWidth, window.innerWidth - DESK_CANVAS_POPOUNDER_MARGIN * 2)
      : defaultWidth;
    const position = getAnchoredDeskCanvasPopunderPosition(width, defaultHeight);

    bringFloatingPanelToFront("deskCanvas");
    setDeskCanvasPopunderView(view);
    setDeskCanvasPopunderSize({ width, height: defaultHeight });
    setDeskCanvasPopunderPosition(position);
    setDeskCanvasDragActivation(null);
    navigate("/activity", { state: { hideMainCanvasPanel: true } });
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
      activeConversationTabs,
      selectedAssignment,
      deskPanelSelection,
      recentInteractions,
      conversationState,
      activeCallAssignmentId,
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
      closeAppSpacePanel,
      closeFloatingAppSpacePanel,
      isAppSpacePanelInDragMode: deskCanvasPopunderView !== null,
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
      openCustomerConversation,
      openRecentInteractionAssignment,
      setConversationState: handleConversationStateChange,
      closeRightPanel: () => {
        setDeskPanelSelection(null);
        setActiveRightPanel(null);
      },
      undockDeskPanel,
      selectAssignment: (assignmentId) => {
        setDeskPanelSelection(null);
        setSelectedAssignmentId(assignmentId);

        const nextAssignment = assignmentItemsById[assignmentId]
          ?? queuePreviewItems.find((item) => item.id === assignmentId || item.customerRecordId === assignmentId);

        if (nextAssignment) {
          setPendingCallCustomerRecordId(nextAssignment.customerRecordId);
        }

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
      toggleCallPopunder: (anchorRect, customerRecordId = selectedAssignment.customerRecordId) => {
        if (status !== "In a Call" && isCallPopunderOpen) {
          if (callConnectTimeoutRef.current !== null) {
            window.clearTimeout(callConnectTimeoutRef.current);
            callConnectTimeoutRef.current = null;
          }
          setIsCallPopunderOpen(false);
          setCallPopunderMode("setup");
          return;
        }

        setPendingCallCustomerRecordId(customerRecordId);
        bringFloatingPanelToFront("call");
        setCallPopunderMode(status === "In a Call" ? "controls" : "setup");
        setCallPopunderPosition(getAnchoredCallPopunderPosition(anchorRect));
        setIsCallPopunderOpen(true);
      },
      openCallDisposition,
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
      activeConversationTabs,
      conversationState,
      deskPanelSelection,
      customerInfoPopunderSize.height,
      customerInfoPopunderSize.width,
      activeCallAssignmentId,
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
      openCallDisposition,
      openConversationPanel,
      openCustomerConversation,
      openRecentInteractionAssignment,
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
      setActiveConversationChannel,
      isCombinedInteractionPanel,
    ],
  );

  return (
    <LayoutContext.Provider value={layoutContextValue}>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-[#F8F8F9]">
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
                      onClick={() => {
                        setActiveWorkspaceId(workspace.id);

                        if (workspace.routePath && location.pathname !== workspace.routePath) {
                          navigate(workspace.routePath);
                        }
                      }}
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
              <div className="flex items-center justify-between rounded-xl px-3 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#333333]">
                  {isDarkMode ? <Moon className="h-4 w-4 text-[#006DAD]" /> : <Sun className="h-4 w-4 text-[#006DAD]" />}
                  <span>Dark Mode</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isDarkMode}
                  onClick={(e) => { e.preventDefault(); setIsDarkMode((v) => !v); }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isDarkMode ? "bg-[#006DAD]" : "bg-[#D1D5DB]"}`}
                >
                  <span className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${isDarkMode ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
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
                ariaLabel="Open customer information"
                onClick={() => openHeaderAppPanel("customer")}
                isActive={
                  deskCanvasPopunderView === "customer"
                  || activeDeskRouteView === "customer"
                }
              >
                <User className="h-4 w-4 stroke-[1.8]" />
              </HeaderIconButton>

              <HeaderIconButton
                ariaLabel="Open Desk"
                onClick={() => openHeaderAppPanel("desk")}
                isActive={deskCanvasPopunderView === "desk" || isDeskView}
              >
                <Monitor className="h-4 w-4 stroke-[1.8]" />
              </HeaderIconButton>

              <HeaderIconButton
                ariaLabel="Open notifications"
                onClick={() => openHeaderAppPanel("notifications")}
                isActive={deskCanvasPopunderView === "notifications" || activeDeskRouteView === "notifications"}
              >
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
                    openHeaderAppPanel("notes");
                  }}
                  isActive={deskCanvasPopunderView === "notes" || activeDeskRouteView === "notes"}
                >
                  <FileText className="h-4 w-4 stroke-[1.8]" />
                </HeaderIconButton>
              </div>

              <div ref={addNewButtonRef}>
                <HeaderIconButton
                  ariaLabel="Open add in desk panel"
                  onClick={() => {
                    setIsAddNewPopoverOpen(false);
                    openHeaderAppPanel("add");
                  }}
                  isActive={deskCanvasPopunderView === "add" || activeDeskRouteView === "add"}
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
                onClick={() => openHeaderAppPanel("copilot")}
                isActive={deskCanvasPopunderView === "copilot" || isCopilotDeskView}
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

      <div className="flex min-h-0 flex-1 overflow-hidden gap-0 pb-4 pr-4 pt-0">
        <LeftQueueRail
          visibleAssignments={visibleAssignments}
          queueStatuses={assignmentStatusesById}
          onStatusChange={handleAssignmentStatusChange}
          onRemoveAssignment={handleRemoveVisibleAssignment}
        />
        {isCombinedInteractionPanel ? (
          <CombinedInteractionPanel
            isOpen={isCanvasMergedIntoCombinedPanel ? true : isConversationPanelOpen || isCustomerInfoPanelOpen}
            width={dockedConversationWidth}
            maxWidth={conversationPanelMaxWidth}
            activeTab={combinedInteractionPanelTab}
            conversation={conversationState}
            openChannels={activeConversationTabs}
            activeChannel={activeConversationChannel}
            customerRecordId={selectedAssignment.customerRecordId}
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
            onClose={closeCombinedInteractionPanel}
          />
        ) : isAppSpaceSplitLayout ? (
          <div className="flex min-w-0 flex-1 items-stretch gap-4">
            {isInlineConversationSplitPanelVisible ? (
              <DockedConversationPanel
                isOpen
                conversation={conversationState}
                openChannels={activeConversationTabs}
                activeChannel={activeConversationChannel}
                customerRecordId={selectedAssignment.customerRecordId}
                onConversationChange={handleConversationStateChange}
                onSelectChannel={setActiveConversationChannel}
                onOpenDeskPanel={openDeskPanel}
                onOpenCall={layoutContextValue.toggleCallPopunder}
                onOpenChannel={(channel) => openCustomerConversation(selectedAssignment.customerRecordId, channel)}
                onOpenCustomerInfo={openCustomerInfoPopunder}
                onConversationStatusChange={handleConversationStatusChange}
                overviewIsOpen={overviewOpenByAssignmentId[selectedAssignment.id] ?? true}
                onOverviewOpenChange={(open) => {
                  setOverviewOpenByAssignmentId((currentState) => ({
                    ...currentState,
                    [selectedAssignment.id]: open,
                  }));
                }}
                isCallDisabled={status === "In a Call" || status !== "Available"}
                onClose={closeConversationPanel}
                showTrailingGap={false}
                isEqualSplit
                onUndockStart={(event) => {
                  if (typeof window === "undefined") return;

                  event.preventDefault();

                  const bounds = event.currentTarget.closest("[data-conversation-panel-header]")?.getBoundingClientRect()
                    ?? event.currentTarget.parentElement?.getBoundingClientRect();
                  if (!bounds) return;

                  const undockWidth = 750;
                  const margin = CONVERSATION_POPOUNDER_MARGIN;
                  const nextPosition = {
                    x: Math.min(
                      Math.max(margin, bounds.left),
                      window.innerWidth - undockWidth - margin,
                    ),
                    y: Math.min(
                      Math.max(margin, bounds.top),
                      window.innerHeight - conversationPopunderSize.height - margin,
                    ),
                  };

                  bringFloatingPanelToFront("conversation");
                  setConversationPopunderSize({ width: undockWidth, height: conversationPopunderSize.height });
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
            ) : null}
            <InlineAppSpacePanel isOpen={isInlineAppSpacePanelVisible && isDeskRoute}>
              <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-lg border border-black/[0.16] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                {children}
              </div>
            </InlineAppSpacePanel>
            {isInlineAppSpacePanelVisible && !isDeskRoute ? (
              <DockedCustomerInfoPanel
                isOpen
                width={dockedCustomerInfoWidth}
                maxWidth={customerInfoPanelMaxWidth}
                customerRecordId={selectedAssignment.customerRecordId}
                customerName={selectedAssignment.name}
                customerId={selectedAssignment.customerId}
                panelSelection={deskPanelSelection}
                onWidthChange={setDockedCustomerInfoWidth}
                onOpenCall={layoutContextValue.toggleCallPopunder}
                isCallDisabled={status === "In a Call" || status !== "Available"}
                onClose={closeCustomerInfoPanel}
                showTrailingGap={false}
                isEqualSplit
                onUndockStart={(event) => {
                  if (typeof window === "undefined") return;

                  event.preventDefault();

                  const bounds = event.currentTarget.closest("[data-conversation-panel-header]")?.getBoundingClientRect()
                  ?? event.currentTarget.parentElement?.getBoundingClientRect();
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
            ) : null}
          </div>
        ) : (
          <>
            <DockedConversationPanel
              isOpen={isConversationPanelOpen}
              conversation={conversationState}
              openChannels={activeConversationTabs}
              activeChannel={activeConversationChannel}
              customerRecordId={selectedAssignment.customerRecordId}
              onConversationChange={handleConversationStateChange}
              onSelectChannel={setActiveConversationChannel}
              onOpenDeskPanel={openDeskPanel}
              onOpenCall={layoutContextValue.toggleCallPopunder}
              onOpenChannel={(channel) => openCustomerConversation(selectedAssignment.customerRecordId, channel)}
              onOpenCustomerInfo={openCustomerInfoPopunder}
              onConversationStatusChange={handleConversationStatusChange}
              overviewIsOpen={overviewOpenByAssignmentId[selectedAssignment.id] ?? true}
              onOverviewOpenChange={(open) => {
                setOverviewOpenByAssignmentId((currentState) => ({
                  ...currentState,
                  [selectedAssignment.id]: open,
                }));
              }}
              isCallDisabled={status === "In a Call" || status !== "Available"}
              onClose={closeConversationPanel}
              showTrailingGap={isDeskCustomerInfoVisible || shouldCombineDockedCustomerAndDeskPanels || isMainCanvasVisible}
              onUndockStart={(event) => {
                if (typeof window === "undefined") return;

                event.preventDefault();

                const bounds = event.currentTarget.closest("[data-conversation-panel-header]")?.getBoundingClientRect()
                  ?? event.currentTarget.parentElement?.getBoundingClientRect();
                if (!bounds) return;

                const undockWidth = 750;
                const margin = CONVERSATION_POPOUNDER_MARGIN;
                const nextPosition = {
                  x: Math.min(
                    Math.max(margin, bounds.left),
                    window.innerWidth - undockWidth - margin,
                  ),
                  y: Math.min(
                    Math.max(margin, bounds.top),
                    window.innerHeight - conversationPopunderSize.height - margin,
                  ),
                };

                bringFloatingPanelToFront("conversation");
                setConversationPopunderSize({ width: undockWidth, height: conversationPopunderSize.height });
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
              customerRecordId={selectedAssignment.customerRecordId}
              customerName={selectedAssignment.name}
              customerId={selectedAssignment.customerId}
              panelSelection={deskPanelSelection}
              onWidthChange={setDockedCustomerInfoWidth}
              onOpenCall={layoutContextValue.toggleCallPopunder}
              isCallDisabled={status === "In a Call" || status !== "Available"}
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
          openChannels={activeConversationTabs}
          activeChannel={activeConversationChannel}
          customerRecordId={selectedAssignment.customerRecordId}
          zIndex={getFloatingPanelZIndex("conversation")}
          onPositionChange={setConversationPopunderPosition}
          onSizeChange={setConversationPopunderSize}
          onConversationChange={handleConversationStateChange}
          onSelectChannel={setActiveConversationChannel}
          onOpenDeskPanel={openDeskPanel}
          onOpenCall={layoutContextValue.toggleCallPopunder}
          onOpenChannel={(channel) => openCustomerConversation(selectedAssignment.customerRecordId, channel)}
          onOpenCustomerInfo={openCustomerInfoPopunder}
          onConversationStatusChange={handleConversationStatusChange}
          overviewIsOpen={overviewOpenByAssignmentId[selectedAssignment.id] ?? true}
          onOverviewOpenChange={(open) => {
            setOverviewOpenByAssignmentId((currentState) => ({
              ...currentState,
              [selectedAssignment.id]: open,
            }));
          }}
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
          customerRecordId={selectedAssignment.customerRecordId}
          customerName={selectedAssignment.name}
          customerId={selectedAssignment.customerId}
          panelSelection={deskPanelSelection}
          zIndex={getFloatingPanelZIndex("customerInfo")}
          onPositionChange={setCustomerInfoPopunderPosition}
          onSizeChange={setCustomerInfoPopunderSize}
          onOpenCall={layoutContextValue.toggleCallPopunder}
          isCallDisabled={status === "In a Call" || status !== "Available"}
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
          customerId={selectedAssignment.customerRecordId}
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
              const nextVoiceAssignment = openCustomerConversation(pendingCallCustomerRecordId, "voice");
              setActiveCallAssignmentId(nextVoiceAssignment.id);
              setIsCallPopunderOpen(false);
              setCallPopunderMode("controls");
              setCopilotPopunderPosition(getAnchoredCopilotPopunderPosition());
              setIsCopilotPopoverOpen(true);
              callConnectTimeoutRef.current = null;
            }, 2000);
          }}
          onEndCall={() => openCallDisposition()}
          onSelectDisposition={(disposition) => {
            const dispositionTimestamp = new Date();
            const formattedDispositionTimestamp = formatRecentInteractionTimestamp(dispositionTimestamp);
            setRecentInteractions((current) => [
              {
                id: Date.now(),
                direction: "outbound",
                type: "voice",
                createdAt: formattedDispositionTimestamp,
                status: disposition,
                customerName: selectedAssignment.name,
                customerId: selectedAssignment.customerId,
                channel: "Outbound Voice - Agent Workspace",
                statusColor: getDispositionStatusColor(disposition),
              },
              ...current,
            ]);
            if (activeCallAssignmentId) {
              setAssignmentStatusesById((currentStatuses) => ({
                ...currentStatuses,
                [activeCallAssignmentId]: getRecentInteractionAssignmentStatus(disposition),
              }));
              setAssignmentItemsById((currentItems) => {
                const activeCallAssignment = currentItems[activeCallAssignmentId];

                if (!activeCallAssignment) {
                  return currentItems;
                }

                return {
                  ...currentItems,
                  [activeCallAssignmentId]: {
                    ...activeCallAssignment,
                    preview: `Call ended · ${disposition}.`,
                    lastUpdated: formattedDispositionTimestamp,
                    updatedAt: dispositionTimestamp.toISOString(),
                  },
                };
              });
            }
            setActiveCallAssignmentId(null);
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
