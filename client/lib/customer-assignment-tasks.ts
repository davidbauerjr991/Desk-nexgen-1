// Per-customer next steps and suggested actions database.
// Keys are lowercase full customer names, matching the pattern used in overviewActionsByCustomerName.
// nextSteps appear in the Assignment Overview summary panel.
// suggestedActions appear as checkboxes in the Conversation Panel AI section.
// The two lists are intentionally aligned so agents see consistent guidance in both places.

export type CustomerAssignmentTask = {
  id: string;
  label: string;
};

export type CustomerAssignmentEntry = {
  nextSteps: string[];
  suggestedActions: CustomerAssignmentTask[];
};

const customerAssignmentTaskDatabase: Record<string, CustomerAssignmentEntry> = {
  // ── Live assignment customers (customer-database.ts) ──────────────────────

  "alex kowalski": {
    nextSteps: [
      "Update Salesforce Record with the gateway hold details and Visa ending in 4092",
      "Create ADP Ticket to escalate the recurring payment error to the engineering team",
      "Schedule Callback to confirm with Alex once the payment block has been lifted",
    ],
    suggestedActions: [
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "callback", label: "Schedule Callback" },
    ],
  },

  "noah patel": {
    nextSteps: [
      "Create ADP Ticket to log the quarterly export timeout and request a manual queue reset",
      "Update Salesforce Record with the confirmed root cause — timeout, not a permissions error",
      "Schedule Callback to verify the report generates successfully after the queue reset",
      "Set Assignment to Resolved once Noah confirms the data export has completed",
    ],
    suggestedActions: [
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "callback", label: "Schedule Callback" },
      { id: "set-resolved", label: "Set Assignment to Resolved" },
    ],
  },

  "olivia reed": {
    nextSteps: [
      "Update Salesforce Record with the corrected billing cycle and credit memo details",
      "Send Discount Coupon as goodwill for the repeated billing issue and Olivia's frustration",
      "Escalate to Supervisor if the credit cannot be issued at agent level",
      "Set Assignment to Resolved once Olivia confirms the billing correction",
    ],
    suggestedActions: [
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "send-coupon", label: "Send Discount Coupon" },
      { id: "escalate", label: "Escalate to Supervisor" },
      { id: "set-resolved", label: "Set Assignment to Resolved" },
    ],
  },

  "ethan zhang": {
    nextSteps: [
      "Escalate to Payments Team to manually clear the fraud filter false positive",
      "Update Salesforce Record with the verification details and false positive finding",
      "Create ADP Ticket to log the fraud filter override for compliance records",
      "Set Assignment to Resolved once Ethan's wire transfer has been cleared",
    ],
    suggestedActions: [
      { id: "escalate", label: "Escalate to Supervisor" },
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "set-resolved", label: "Set Assignment to Resolved" },
    ],
  },

  // ── Named customers from overviewActionsByCustomerName ────────────────────

  "maria chen": {
    nextSteps: [
      "Update Salesforce Record with the new payment method once Maria updates her expired card",
      "Send Discount Coupon as goodwill for the payment disruption caused by the hard decline",
      "Set Assignment to Resolved after confirming the updated payment method processes successfully",
    ],
    suggestedActions: [
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "send-coupon", label: "Send Discount Coupon" },
      { id: "set-resolved", label: "Set Assignment to Resolved" },
    ],
  },

  "james whitfield": {
    nextSteps: [
      "Escalate to Supervisor to approve honouring James's original quoted pricing commitment",
      "Update Salesforce Record with the corrected invoice amount and verbal pricing notes",
      "Set Assignment to Resolved once James confirms the $4,200 discrepancy has been corrected",
    ],
    suggestedActions: [
      { id: "escalate", label: "Escalate to Supervisor" },
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "set-resolved", label: "Set Assignment to Resolved" },
    ],
  },

  "priya sharma": {
    nextSteps: [
      "Escalate to Security Team to investigate the unrecognised login from a foreign IP",
      "Update Salesforce Record with the incident report and MFA enablement recommendation",
      "Set Assignment to Resolved once Priya's account security is confirmed and MFA is active",
    ],
    suggestedActions: [
      { id: "escalate", label: "Escalate to Supervisor" },
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "set-resolved", label: "Set Assignment to Resolved" },
    ],
  },

  "robert okafor": {
    nextSteps: [
      "Create ADP Ticket to log the API key migration issue with the engineering team",
      "Update Salesforce Record with the new API keys and migration resolution status",
      "Schedule Callback to verify Robert's API integration is working after the key rotation",
    ],
    suggestedActions: [
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "callback", label: "Schedule Callback" },
    ],
  },

  "lisa montenegro": {
    nextSteps: [
      "Escalate to Compliance Ops to unblock the stalled GDPR data export approval",
      "Create ADP Ticket to formally document the overdue 18-day GDPR export request",
      "Set Assignment to Resolved once the data export is confirmed as delivered to Lisa",
    ],
    suggestedActions: [
      { id: "escalate", label: "Escalate to Supervisor" },
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "set-resolved", label: "Set Assignment to Resolved" },
    ],
  },

  "kevin tran": {
    nextSteps: [
      "Update Salesforce Record with the corrected billing history and $12,600 credit memo",
      "Create ADP Ticket to escalate the billing ERP sync error to the engineering team",
      "Send Discount Coupon as goodwill compensation for three months of billing disruption",
      "Set Assignment to Resolved once the credit is confirmed on Kevin's account",
    ],
    suggestedActions: [
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "send-coupon", label: "Send Discount Coupon" },
      { id: "set-resolved", label: "Set Assignment to Resolved" },
    ],
  },

  "angela russo": {
    nextSteps: [
      "Update Salesforce Record with Angela's new corporate payment method once confirmed",
      "Create ADP Ticket to document the payment update request for the audit trail",
      "Set Assignment to Resolved after the new card is confirmed active on the account",
    ],
    suggestedActions: [
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "set-resolved", label: "Set Assignment to Resolved" },
    ],
  },

  "marcus bell": {
    nextSteps: [
      "Create ADP Ticket to log the SSO misconfiguration with the identity team for remediation",
      "Update Salesforce Record with the re-configuration steps applied and Azure AD sync status",
      "Schedule Callback to verify Marcus's SSO login is working after the fix is deployed",
    ],
    suggestedActions: [
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "callback", label: "Schedule Callback" },
    ],
  },

  "sandra yip": {
    nextSteps: [
      "Update Salesforce Record to document the permission restoration request sent to admin",
      "Set Assignment to Resolved once Sandra confirms full access to the Q1/Q2 report documents",
    ],
    suggestedActions: [
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "set-resolved", label: "Set Assignment to Resolved" },
    ],
  },

  "derek owens": {
    nextSteps: [
      "Schedule Callback to discuss renewal options and pricing before the 11-day expiry deadline",
      "Update Salesforce Record with Derek's renewal decision and chosen pricing option",
      "Set Assignment to Resolved once the renewal contract is signed and confirmed",
    ],
    suggestedActions: [
      { id: "callback", label: "Schedule Callback" },
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "set-resolved", label: "Set Assignment to Resolved" },
    ],
  },

  "fatima al-rashid": {
    nextSteps: [
      "Escalate to Security Team immediately to investigate the compromised session and bulk export",
      "Create ADP Ticket to formally document the security incident and the suspended export job",
      "Set Assignment to Resolved once the investigation is complete and the account is secured",
    ],
    suggestedActions: [
      { id: "escalate", label: "Escalate to Supervisor" },
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "set-resolved", label: "Set Assignment to Resolved" },
    ],
  },

  "tom hargrove": {
    nextSteps: [
      "Update Salesforce Record with the refund status and estimated clearance timeline for Tom's bank",
      "Schedule Callback to confirm with Tom once the $340 refund clears his account",
      "Set Assignment to Resolved after Tom confirms receipt of the refund",
    ],
    suggestedActions: [
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "callback", label: "Schedule Callback" },
      { id: "set-resolved", label: "Set Assignment to Resolved" },
    ],
  },

  "nadia petrov": {
    nextSteps: [
      "Escalate to Compliance Team to investigate the SWIFT screening hold on Nadia's wire transfer",
      "Create ADP Ticket to document the compliance hold and expected resolution timeline",
      "Update Salesforce Record with the hold details, escalation path, and current status",
    ],
    suggestedActions: [
      { id: "escalate", label: "Escalate to Supervisor" },
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "update-salesforce", label: "Update Salesforce Record" },
    ],
  },

  "carlos mendez": {
    nextSteps: [
      "Create ADP Ticket to log the WebSocket outage with the v4.2 API gateway engineering team",
      "Schedule Callback to notify Carlos once the fix is deployed and the data feed is live",
      "Set Assignment to Resolved once Carlos confirms the pipeline monitoring dashboards are restored",
    ],
    suggestedActions: [
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "callback", label: "Schedule Callback" },
      { id: "set-resolved", label: "Set Assignment to Resolved" },
    ],
  },

  "ingrid holmberg": {
    nextSteps: [
      "Escalate to Trade Compliance Team to file the corrected HS code declaration for the shipment",
      "Create ADP Ticket to log the customs hold and the amendment filing request",
      "Update Salesforce Record with the corrected HS code and amendment submission status",
    ],
    suggestedActions: [
      { id: "escalate", label: "Escalate to Supervisor" },
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "update-salesforce", label: "Update Salesforce Record" },
    ],
  },

  "darius knox": {
    nextSteps: [
      "Escalate to Supervisor to authorise the recall request through the payments network immediately",
      "Create ADP Ticket to document the $47,500 erroneous transfer as a priority incident",
      "Update Salesforce Record with the recall status and incorrect beneficiary account details",
      "Schedule Callback to confirm whether the recall was accepted by the receiving institution",
    ],
    suggestedActions: [
      { id: "escalate", label: "Escalate to Supervisor" },
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "callback", label: "Schedule Callback" },
    ],
  },

  "sarah miller": {
    nextSteps: [
      "Update Salesforce Record with Sarah's rebooking details and the confirmed new flight option",
      "Schedule Callback if Sarah needs confirmation of the rebooked itinerary sent to her email",
      "Set Assignment to Resolved once Sarah's new same-day flight is confirmed",
    ],
    suggestedActions: [
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "callback", label: "Schedule Callback" },
      { id: "set-resolved", label: "Set Assignment to Resolved" },
    ],
  },

  "emily chen": {
    nextSteps: [
      "Update Salesforce Record to document the promo code eligibility mismatch for Emily's account tier",
      "Send Discount Coupon with a corrected promo code that matches Emily's current account tier",
      "Set Assignment to Resolved once Emily confirms the discount has been applied at checkout",
    ],
    suggestedActions: [
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "send-coupon", label: "Send Discount Coupon" },
      { id: "set-resolved", label: "Set Assignment to Resolved" },
    ],
  },

  "david brown": {
    nextSteps: [
      "Update Salesforce Record with the corrected subscription state and duplicate charge credit memo",
      "Send Discount Coupon as goodwill compensation for the billing error during the plan transition",
      "Create ADP Ticket to log the mid-cycle proration billing sync issue for engineering review",
      "Set Assignment to Resolved once the duplicate charge credit is confirmed on David's account",
    ],
    suggestedActions: [
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "send-coupon", label: "Send Discount Coupon" },
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "set-resolved", label: "Set Assignment to Resolved" },
    ],
  },
};

export function getCustomerAssignmentEntry(customerName: string): CustomerAssignmentEntry | null {
  return customerAssignmentTaskDatabase[customerName.toLowerCase().trim()] ?? null;
}
