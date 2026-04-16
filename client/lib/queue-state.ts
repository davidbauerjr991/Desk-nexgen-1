/**
 * Module-level store for queue state that needs to survive navigation.
 * Layout can write to this; ControlPanelPage drains it on render.
 */
export const pendingQueueRejections = new Set<string>();
