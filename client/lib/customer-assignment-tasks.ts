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
  summary: string;
  nextSteps: string[];
  suggestedActions: CustomerAssignmentTask[];
};

const customerAssignmentTaskDatabase: Record<string, CustomerAssignmentEntry> = {
  // ── Live assignment customers (customer-database.ts) ──────────────────────

  "alex kowalski": {
    summary: "Alex is a low-to-moderate fraud risk (score 34) and is showing frustration after repeated failed upgrade attempts. A billing zip mismatch is blocking the transaction — clearing the security flag should resolve this quickly. Here are my suggested actions, or ask me for more assistance.",
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
    summary: "Noah is a low fraud risk customer experiencing a technical failure with a quarterly report export. Sentiment is mildly frustrated — this appears to be a timeout issue, not user error. Here are my suggested actions, or ask me for more assistance.",
    nextSteps: [
      "Create ADP Ticket to log the quarterly export timeout and request a manual queue reset",
      "Update Salesforce Record with the confirmed root cause — timeout, not a permissions error",
      "Schedule Callback to verify the report generates successfully after the queue reset",
      "Set Case to Resolved once Noah confirms the data export has completed",
    ],
    suggestedActions: [
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "callback", label: "Schedule Callback" },
      { id: "set-resolved", label: "Set Case to Resolved" },
    ],
  },

  "olivia reed": {
    summary: "Olivia is a low fraud risk customer who has contacted support twice for the same billing issue without resolution. Frustration level is high — a goodwill gesture alongside the fix is strongly recommended. Here are my suggested actions, or ask me for more assistance.",
    nextSteps: [
      "Update Salesforce Record with the corrected billing cycle and credit memo details",
      "Send Discount Coupon as goodwill for the repeated billing issue and Olivia's frustration",
      "Escalate to Supervisor if the credit cannot be issued at agent level",
      "Set Case to Resolved once Olivia confirms the billing correction",
    ],
    suggestedActions: [
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "send-coupon", label: "Send Discount Coupon" },
      { id: "escalate", label: "Escalate to Supervisor" },
      { id: "set-resolved", label: "Set Case to Resolved" },
    ],
  },

  "ethan zhang": {
    summary: "Ethan is a low fraud risk developer whose wire transfer was incorrectly blocked by a false positive on the fraud filter. Tone is professional and patient — expedite the override to keep trust. Here are my suggested actions, or ask me for more assistance.",
    nextSteps: [
      "Escalate to Payments Team to manually clear the fraud filter false positive",
      "Update Salesforce Record with the verification details and false positive finding",
      "Create ADP Ticket to log the fraud filter override for compliance records",
      "Set Case to Resolved once Ethan's wire transfer has been cleared",
    ],
    suggestedActions: [
      { id: "escalate", label: "Escalate to Supervisor" },
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "set-resolved", label: "Set Case to Resolved" },
    ],
  },

  // ── Named customers from overviewActionsByCustomerName ────────────────────

  "maria chen": {
    summary: "Maria's account was disrupted by an expired card triggering a hard decline. Fraud risk is low and sentiment is neutral — a quick payment update and a goodwill gesture should close this cleanly. Here are my suggested actions, or ask me for more assistance.",
    nextSteps: [
      "Update Salesforce Record with the new payment method once Maria updates her expired card",
      "Send Discount Coupon as goodwill for the payment disruption caused by the hard decline",
      "Set Case to Resolved after confirming the updated payment method processes successfully",
    ],
    suggestedActions: [
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "send-coupon", label: "Send Discount Coupon" },
      { id: "set-resolved", label: "Set Case to Resolved" },
    ],
  },

  "james whitfield": {
    summary: "James is disputing a $4,200 invoice discrepancy against a verbal pricing commitment. Frustration is moderate and escalating — supervisor approval to honour the original quote is the fastest path to resolution. Here are my suggested actions, or ask me for more assistance.",
    nextSteps: [
      "Escalate to Supervisor to approve honouring James's original quoted pricing commitment",
      "Update Salesforce Record with the corrected invoice amount and verbal pricing notes",
      "Set Case to Resolved once James confirms the $4,200 discrepancy has been corrected",
    ],
    suggestedActions: [
      { id: "escalate", label: "Escalate to Supervisor" },
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "set-resolved", label: "Set Case to Resolved" },
    ],
  },

  "priya sharma": {
    summary: "Priya has flagged a suspected account compromise with an unrecognised login from a foreign IP. This is a security-sensitive case — treat it as urgent and escalate immediately to protect her account. Here are my suggested actions, or ask me for more assistance.",
    nextSteps: [
      "Escalate to Security Team to investigate the unrecognised login from a foreign IP",
      "Update Salesforce Record with the incident report and MFA enablement recommendation",
      "Set Case to Resolved once Priya's account security is confirmed and MFA is active",
    ],
    suggestedActions: [
      { id: "escalate", label: "Escalate to Supervisor" },
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "set-resolved", label: "Set Case to Resolved" },
    ],
  },

  "robert okafor": {
    summary: "Robert is a developer dealing with a broken integration after an API key rotation. Fraud risk is low and tone is technical and direct — a quick engineering escalation with a callback to verify should resolve this efficiently. Here are my suggested actions, or ask me for more assistance.",
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
    summary: "Lisa's GDPR data export request is 18 days overdue — a compliance deadline has already passed. Frustration is high and this carries legal risk. Escalate to compliance ops immediately. Here are my suggested actions, or ask me for more assistance.",
    nextSteps: [
      "Escalate to Compliance Ops to unblock the stalled GDPR data export approval",
      "Create ADP Ticket to formally document the overdue 18-day GDPR export request",
      "Set Case to Resolved once the data export is confirmed as delivered to Lisa",
    ],
    suggestedActions: [
      { id: "escalate", label: "Escalate to Supervisor" },
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "set-resolved", label: "Set Case to Resolved" },
    ],
  },

  "kevin tran": {
    summary: "Kevin has been overbilled for three months due to a billing ERP sync error totalling $12,600. Frustration is significant — a credit memo and a goodwill gesture are both warranted here. Here are my suggested actions, or ask me for more assistance.",
    nextSteps: [
      "Update Salesforce Record with the corrected billing history and $12,600 credit memo",
      "Create ADP Ticket to escalate the billing ERP sync error to the engineering team",
      "Send Discount Coupon as goodwill compensation for three months of billing disruption",
      "Set Case to Resolved once the credit is confirmed on Kevin's account",
    ],
    suggestedActions: [
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "send-coupon", label: "Send Discount Coupon" },
      { id: "set-resolved", label: "Set Case to Resolved" },
    ],
  },

  "angela russo": {
    summary: "Angela needs to update her company's payment method — this is a routine request with low risk and neutral sentiment. A quick update and confirmation should close this in one interaction. Here are my suggested actions, or ask me for more assistance.",
    nextSteps: [
      "Update Salesforce Record with Angela's new corporate payment method once confirmed",
      "Create ADP Ticket to document the payment update request for the audit trail",
      "Set Case to Resolved after the new card is confirmed active on the account",
    ],
    suggestedActions: [
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "set-resolved", label: "Set Case to Resolved" },
    ],
  },

  "marcus bell": {
    summary: "Marcus is locked out due to an SSO misconfiguration following an Azure AD sync. Fraud risk is low and the issue is technical — reconfiguring the identity provider integration should restore access. Here are my suggested actions, or ask me for more assistance.",
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
    summary: "Sandra has lost access to Q1/Q2 report documents following a permission change. Fraud risk is low, tone is professional — a straightforward admin restore should resolve this quickly. Here are my suggested actions, or ask me for more assistance.",
    nextSteps: [
      "Update Salesforce Record to document the permission restoration request sent to admin",
      "Set Case to Resolved once Sandra confirms full access to the Q1/Q2 report documents",
    ],
    suggestedActions: [
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "set-resolved", label: "Set Case to Resolved" },
    ],
  },

  "derek owens": {
    summary: "Derek's subscription expires in 11 days and he hasn't yet committed to renewal. Sentiment is neutral but time-sensitive — a proactive conversation about pricing options should help retain him. Here are my suggested actions, or ask me for more assistance.",
    nextSteps: [
      "Schedule Callback to discuss renewal options and pricing before the 11-day expiry deadline",
      "Update Salesforce Record with Derek's renewal decision and chosen pricing option",
      "Set Case to Resolved once the renewal contract is signed and confirmed",
    ],
    suggestedActions: [
      { id: "callback", label: "Schedule Callback" },
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "set-resolved", label: "Set Case to Resolved" },
    ],
  },

  "jordan davis": {
    summary: "Jordan's CloudMesh Pro v3 router is dropping all connections due to a firmware version mismatch. The AI has paused mid-reset to get expert confirmation on port forwarding config backup behavior before proceeding. Here are my suggested actions, or ask me for more assistance.",
    nextSteps: [
      "Confirm port forwarding config backup behavior for CloudMesh Pro v3 firmware 4.0.8 before factory reset",
      "Guide Jordan through the factory reset and firmware update to 4.1.2",
      "Set Case to Resolved once connection is stable and custom config is restored",
    ],
    suggestedActions: [
      { id: "escalate", label: "Confirm Firmware Backup" },
      { id: "create-ticket", label: "Create Support Ticket" },
      { id: "set-resolved", label: "Set Case to Resolved" },
    ],
  },

  "tom hargrove": {
    summary: "Tom is waiting on a $340 refund that was approved but hasn't cleared his bank yet. Fraud risk is low, sentiment is patient but watching — a clear timeline update and a callback confirmation should reassure him. Here are my suggested actions, or ask me for more assistance.",
    nextSteps: [
      "Update Salesforce Record with the refund status and estimated clearance timeline for Tom's bank",
      "Schedule Callback to confirm with Tom once the $340 refund clears his account",
      "Set Case to Resolved after Tom confirms receipt of the refund",
    ],
    suggestedActions: [
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "callback", label: "Schedule Callback" },
      { id: "set-resolved", label: "Set Case to Resolved" },
    ],
  },

  "nadia petrov": {
    summary: "Nadia's international wire transfer has been held by SWIFT compliance screening for 3 days. Frustration is building — this requires escalation to compliance to clarify the hold reason and provide a firm resolution timeline. Here are my suggested actions, or ask me for more assistance.",
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
    summary: "Carlos's real-time data pipeline is down due to a WebSocket outage in the v4.2 API gateway. Impact is high — his monitoring dashboards are dark. An engineering escalation and proactive callback are the right path here. Here are my suggested actions, or ask me for more assistance.",
    nextSteps: [
      "Create ADP Ticket to log the WebSocket outage with the v4.2 API gateway engineering team",
      "Schedule Callback to notify Carlos once the fix is deployed and the data feed is live",
      "Set Case to Resolved once Carlos confirms the pipeline monitoring dashboards are restored",
    ],
    suggestedActions: [
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "callback", label: "Schedule Callback" },
      { id: "set-resolved", label: "Set Case to Resolved" },
    ],
  },

  "ingrid holmberg": {
    summary: "Ingrid's shipment is held at customs due to an incorrect HS code on the declaration. The error needs a formal amendment — coordinate with the freight broker to correct and refile before penalties apply. Here are my suggested actions, or ask me for more assistance.",
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
    summary: "Darius has a high fraud risk score (72) and urgently needs to reverse a $47,500 wire transfer sent to the wrong account 10 minutes ago. Sentiment is highly stressed — act immediately and keep him informed at every step. Here are my suggested actions, or ask me for more assistance.",
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
    summary: "Sarah missed her connection due to an airline-caused delay and needs a same-day rebooking with bag transfer. Fraud risk is low and sentiment is anxious but cooperative — confirm a replacement flight quickly to ease her stress. Here are my suggested actions, or ask me for more assistance.",
    nextSteps: [
      "Update Salesforce Record with Sarah's rebooking details and the confirmed new flight option",
      "Schedule Callback if Sarah needs confirmation of the rebooked itinerary sent to her email",
      "Set Case to Resolved once Sarah's new same-day flight is confirmed",
    ],
    suggestedActions: [
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "callback", label: "Schedule Callback" },
      { id: "set-resolved", label: "Set Case to Resolved" },
    ],
  },

  "emily chen": {
    summary: "Emily's promo code isn't applying at checkout due to an account tier mismatch. Fraud risk is low and sentiment is mildly frustrated — sending a corrected code for her tier should resolve this in one step. Here are my suggested actions, or ask me for more assistance.",
    nextSteps: [
      "Update Salesforce Record to document the promo code eligibility mismatch for Emily's account tier",
      "Send Discount Coupon with a corrected promo code that matches Emily's current account tier",
      "Set Case to Resolved once Emily confirms the discount has been applied at checkout",
    ],
    suggestedActions: [
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "send-coupon", label: "Send Discount Coupon" },
      { id: "set-resolved", label: "Set Case to Resolved" },
    ],
  },

  "david brown": {
    summary: "David was double-charged during a plan transition due to a mid-cycle proration sync error. Fraud risk is low but frustration is rising — a credit and a goodwill gesture alongside the engineering ticket will help restore confidence. Here are my suggested actions, or ask me for more assistance.",
    nextSteps: [
      "Update Salesforce Record with the corrected subscription state and duplicate charge credit memo",
      "Send Discount Coupon as goodwill compensation for the billing error during the plan transition",
      "Create ADP Ticket to log the mid-cycle proration billing sync issue for engineering review",
      "Set Case to Resolved once the duplicate charge credit is confirmed on David's account",
    ],
    suggestedActions: [
      { id: "update-salesforce", label: "Update Salesforce Record" },
      { id: "send-coupon", label: "Send Discount Coupon" },
      { id: "create-ticket", label: "Create ADP Ticket" },
      { id: "set-resolved", label: "Set Case to Resolved" },
    ],
  },
  "sofia martinez": {
    summary: "Sofia has reported 2 unauthorized transactions totaling $2,159. I've verified the charges are fraudulent and flagged her account. Here are the actions needed to resolve this case — or ask me for more assistance.",
    nextSteps: [
      "Initiate Dispute for the 2 unauthorized transactions totaling $2,159",
      "Issue Temporary Credit of $2,159 so Sofia can make her rent payment",
      "Issue Replacement Card to the address on file and block the compromised card",
    ],
    suggestedActions: [
      { id: "initiate-dispute", label: "Initiate Dispute" },
      { id: "issue-temp-credit", label: "Issue Temporary Credit" },
      { id: "issue-replacement-card", label: "Issue Replacement Card" },
    ],
  },
};

export function getCustomerAssignmentEntry(customerName: string): CustomerAssignmentEntry | null {
  return customerAssignmentTaskDatabase[customerName.toLowerCase().trim()] ?? null;
}
