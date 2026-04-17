/**
 * Module-level store for queue state that needs to survive navigation.
 * Layout can write to this; ControlPanelPage drains it on render.
 */
export const pendingQueueRejections = new Set<string>();

/**
 * Tracks which static assignments have been accepted (staticId → assignmentId).
 * Survives ControlPanelPage remounts (it unmounts on every navigate("/activity")).
 * Written by Layout.tsx when taking over via toast; read/written by ControlPanelPage.
 */
export const acceptedStaticsStore = new Map<string, string>();
