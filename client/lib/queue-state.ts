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
