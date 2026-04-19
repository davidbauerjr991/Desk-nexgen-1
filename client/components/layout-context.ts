/**
 * Layout context — extracted into its own module so that Vite Fast Refresh
 * can hot-reload Layout.tsx without recreating the context object.
 *
 * All consumers should import from this file instead of from Layout.tsx.
 */
import React, { createContext, useContext } from "react";
import type { CustomerChannel } from "@/lib/customer-database";
import type { ConversationStatus, SharedConversationData } from "@/components/ConversationPanel";
import type { RecentInteractionItem } from "@/components/RecentInteractionsPanel";

// ─── Primitive types ──────────────────────────────────────────────────────────

export type RightPanelView = "info" | "desk" | "interactions" | null;
export type DeskCanvasView = "desk" | "copilot" | "notes" | "add" | "customer" | "notifications";
export type DeskPanelSelection = {
  initialTab?: string;
  ticketId?: string;
} | null;

export type AssignmentChannel = Extract<CustomerChannel, "chat" | "sms" | "email" | "voice" | "whatsapp">;

export type QueueAssignmentStatus = ConversationStatus | "resolved" | "escalated" | "parked";

export type QueuePreviewItem = {
  id: string;
  customerRecordId: string;
  channel: AssignmentChannel;
  initials: string;
  name: string;
  customerId: string;
  lastUpdated: string;
  time: string;
  preview: string;
  label?: string;
  statusLabel?: string;
  priority: string;
  priorityClassName: string;
  badgeColor: string;
  icon: React.ElementType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ResolvedAssignment = {
  id: string;
  name: string;
  preview: string;
  priority: string;
  channel: AssignmentChannel;
  resolvedAt: number;
  customerRecordId: string;
  /** The status of the case at the time it was dismissed from the rail. */
  status: QueueAssignmentStatus;
  /** The agent it was assigned to when dismissed — preserved so the queue row still shows "Assigned". */
  assignedTo: string | null;
  /**
   * The static assignment id (e.g. "static-11") that this live assignment was accepted from.
   * Used to correctly key into acceptedStaticsStore and rejectedIds, both of which use static ids.
   */
  staticId?: string;
  /**
   * Extra channels that were open alongside the primary channel when the case was dismissed.
   * Stored so they can be restored when the agent re-opens the case.
   */
  additionalChannels?: Array<{ channel: AssignmentChannel; preview: string }>;
};

export type AcceptIssueData = {
  id: string;
  name: string;
  customerId: string;
  customerRecordId?: string;
  channel: AssignmentChannel;
  priority: string;
  preview: string;
  status: QueueAssignmentStatus;
  waitTime: string;
  isOutbound?: boolean;
  onCreated?: (assignmentId: string) => void;
};

// ─── Context value ─────────────────────────────────────────────────────────────

export interface LayoutContextValue {
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
  visibleAssignments: QueuePreviewItem[];
  assignmentStatusesById: Record<string, QueueAssignmentStatus>;
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
  resolvedAssignments: ResolvedAssignment[];
  selectAssignment: (assignmentId: QueuePreviewItem["id"]) => void;
  acceptIssue: (data: AcceptIssueData) => void;
  undockDeskPanel: (view: DeskCanvasView, event: React.MouseEvent<HTMLElement>) => void;
  toggleCallPopunder: (anchorRect?: DOMRect | null, customerRecordId?: string) => void;
  openCallDisposition: (anchorRect?: DOMRect | null) => void;
  startCallStatus: () => void;
  endCallStatus: () => void;
  pendingAcceptanceIds: Set<string>;
  acceptPendingAssignment: (assignmentId: string) => void;
  rejectPendingAssignment: (assignmentId: string) => void;
  reviewPendingAssignment: (assignmentId: string) => void;
  taskSummaryIds: Set<string>;
  closeChannelKeepTask: (assignmentId: string) => void;
  activatedChannelIds: Set<string>;
  liveLastCustomerCommentByAssignmentId: Record<string, string>;
  setAssignmentStatus: (assignmentId: string, status: QueueAssignmentStatus) => void;
  openCopilot: () => void;
  openChatPopover: () => void;
  isBriefingDismissed: boolean;
  pushToIncomingNotifications: (item: QueuePreviewItem) => void;
  pendingMonitorCaseId: string | null;
  clearPendingMonitorCaseId: () => void;
  pendingTakeoverCaseId: string | null;
  clearPendingTakeoverCaseId: () => void;
}

// ─── Context + hook ───────────────────────────────────────────────────────────

export const LayoutContext = createContext<LayoutContextValue | null>(null);

export function useLayoutContext(): LayoutContextValue {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayoutContext must be used within Layout");
  }
  return context;
}
