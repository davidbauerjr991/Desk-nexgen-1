import type { SharedConversationData } from "@/components/ConversationPanel";

/**
 * Module-level store for queue state that needs to survive navigation.
 * Layout can write to this; ControlPanelPage drains it on render.
 */
export const pendingQueueRejections = new Set<string>();

/**
 * Case IDs that have been resolved via the modal on any page (e.g. from Layout's toast modal).
 * Layout writes to this; ControlPanelPage drains it on render to update bulkResolvedIds.
 */
export const pendingResolvedIds = new Set<string>();

/**
 * Tracks which static assignments have been accepted (staticId → assignmentId).
 * Survives ControlPanelPage remounts (it unmounts on every navigate("/activity")).
 * Written by Layout.tsx when taking over via toast; read/written by ControlPanelPage.
 */
export const acceptedStaticsStore = new Map<string, string>();

/**
 * Pending handoff conversations keyed by assignmentId (or customerRecordId as fallback).
 *
 * When an agent clicks "Takeover" on a supervised case the correct conversation
 * (prior bot messages stamped with author, plus the handoff message) needs to
 * replace whatever is currently shown — regardless of React state timing.
 *
 * The takeover flow writes here BEFORE calling acceptIssue / navigate.
 * Layout.tsx reads this in acceptIssue and in setConversationStateForAssignment,
 * then clears the entry so it is only applied once.
 */
export const pendingHandoffConversations = new Map<string, SharedConversationData>();
