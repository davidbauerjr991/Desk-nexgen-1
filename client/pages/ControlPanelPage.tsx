import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CalendarCheck,
  Check,
  CheckCircle,
  ChevronDown,
  Clock,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { useLayoutContext, type QueueAssignmentStatus, type AcceptIssueData, type ResolvedAssignment } from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import DeskDataTable from "@/components/DeskDataTable";
import { getCustomerRecord, createConversationState } from "@/lib/customer-database";
import ConversationPanel from "@/components/ConversationPanel";

type DeskPageTab = "queue" | "customers" | "tickets" | "accounts" | "contact-history";
type IssueTab = "open" | "pending" | "resolved" | "escalated";

const DESK_PAGE_TABS: Array<{ id: DeskPageTab; label: string }> = [
  { id: "queue",           label: "Queue"            },
  { id: "customers",       label: "Customers"       },
  { id: "tickets",         label: "Tickets"         },
  { id: "accounts",        label: "Accounts"        },
  { id: "contact-history", label: "Contact History" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Channel = "chat" | "sms" | "email" | "voice" | "whatsapp";
type Priority = "Critical" | "High" | "Medium" | "Low";

interface AiOverview {
  actions: string[];
  whyNeeded: string;
  nextSteps: string[];
}

interface StaticAssignment {
  id: string;
  name: string;
  customerId: string;
  customerRecordId?: string;
  company: string;
  channel: Channel;
  priority: Priority;
  status: QueueAssignmentStatus;
  preview: string;
  waitTime: string;
  aiOverview: AiOverview;
}

// ─── Lookups ──────────────────────────────────────────────────────────────────

const priorityStyles: Record<Priority, string> = {
  Critical: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
  High:     "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
  Medium:   "border-[#C8BFF0] bg-[#F2F0FA] text-[#6E56CF]",
  Low:      "border-[#24943E] bg-[#EFFBF1] text-[#208337]",
};

const priorityRank: Record<Priority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M12 3.25C7.163 3.25 3.25 7.119 3.25 11.882C3.25 13.549 3.734 15.149 4.638 16.529L3.75 20.75L8.097 19.9C9.406 20.647 10.898 21.042 12.421 21.042C17.258 21.042 21.171 17.172 21.171 12.41C21.171 7.647 16.837 3.25 12 3.25Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.428 8.867C9.206 8.373 8.97 8.362 8.761 8.354C8.59 8.347 8.394 8.347 8.198 8.347C8.002 8.347 7.683 8.421 7.413 8.715C7.143 9.009 6.389 9.703 6.389 11.117C6.389 12.531 7.438 13.897 7.585 14.093C7.732 14.289 9.634 17.287 12.611 18.437C15.086 19.392 15.589 19.203 16.123 19.154C16.657 19.105 17.839 18.485 18.084 17.815C18.329 17.144 18.329 16.566 18.255 16.444C18.182 16.321 17.986 16.248 17.692 16.101C17.397 15.954 15.957 15.235 15.687 15.137C15.417 15.039 15.22 14.99 15.024 15.284C14.828 15.578 14.27 16.248 14.098 16.444C13.926 16.64 13.754 16.665 13.459 16.518C13.165 16.37 12.218 16.061 11.095 15.059C10.221 14.28 9.632 13.319 9.46 13.025C9.289 12.731 9.442 12.571 9.589 12.424C9.722 12.292 9.883 12.081 10.03 11.91C10.177 11.738 10.226 11.615 10.324 11.419C10.422 11.223 10.373 11.052 10.299 10.905C10.226 10.758 9.679 9.312 9.428 8.867Z" fill="currentColor" />
    </svg>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const channelIconMap: Record<Channel, any> = {
  chat:     MessageCircle,
  sms:      MessageSquare,
  email:    Mail,
  voice:    Phone,
  whatsapp: WhatsAppIcon,
};

const companyByCustomerId: Record<string, string> = {
  alex:      "Apex Financial Group",
  sarah:     "Summit Healthcare Inc.",
  priya:     "Priya Sharma (Personal)",
  david:     "BlueLine Logistics",
  priyaNair: "Coastal Realty Partners",
  olivia:    "Meridian Tech Solutions",
  noah:      "Noah Patel (Personal)",
  ethan:     "Westfield Capital",
};

// AI overview content keyed by customer record id (live assignments)
const liveAiOverview: Record<string, AiOverview> = {
  noah: {
    actions: [
      "Reviewed the full SMS thread and extracted the core data-export failure from Noah's messages.",
      "Cross-referenced Noah's account permissions and recent failed export job logs.",
      "Confirmed the issue is tied to a quarterly report generation timeout — not a permissions error.",
      "Prepared a step-by-step remediation draft and flagged the relevant knowledge base article.",
    ],
    whyNeeded:
      "The export failure requires a manual queue reset that the AI cannot trigger autonomously. A human agent is needed to confirm the correct reporting period, initiate the fix, and validate the output before sending it to Noah.",
    nextSteps: [
      "Confirm the correct reporting period with Noah",
      "Initiate a manual queue reset for the failed export job",
      "Validate the export output before delivering it",
      "Send the completed report and close the case",
    ],
  },
  olivia: {
    actions: [
      "Reviewed the full chat thread and identified a billing discrepancy tied to a mid-cycle plan upgrade.",
      "Checked Olivia's subscription history and confirmed the pro-rated charge was applied incorrectly.",
      "Assessed tone — Olivia is frustrated after two prior contacts on the same issue.",
      "Drafted an apology response and prepared a credit memo for agent review.",
    ],
    whyNeeded:
      "Olivia has contacted support twice for the same billing issue without resolution. She is showing clear frustration signals. A human agent is needed to acknowledge the repeated failure, issue the correct credit, and personally confirm the account is now accurate.",
    nextSteps: [
      "Acknowledge the repeated billing failure and apologise",
      "Issue the correct credit and confirm the amount with Olivia",
      "Verify the account balance is now accurate",
      "Confirm resolution and close the case with a personal note",
    ],
  },
  ethan: {
    actions: [
      "Reviewed the SMS thread and identified a wire transfer flagged incorrectly by the fraud filter.",
      "Cross-referenced Ethan's transaction history and confirmed the transfer destination is a known payee.",
      "Checked compliance flags and found no active holds — the block appears to be a false positive.",
      "Prepared a suggested resolution path and escalation note for the payments team.",
    ],
    whyNeeded:
      "Releasing a flagged wire transfer requires agent-level authorisation that cannot be granted autonomously. A human agent must verify Ethan's identity, confirm the payee details, and manually clear the hold in the payments system.",
    nextSteps: [
      "Verify Ethan's identity against account security requirements",
      "Confirm the transfer destination as a known and approved payee",
      "Manually clear the fraud hold in the payments system",
      "Confirm the transfer has been released and notify Ethan",
    ],
  },
};

// ─── Static assignments (16) ──────────────────────────────────────────────────

export const staticAssignments: StaticAssignment[] = [
  {
    id: "static-1",
    name: "Maria Chen",
    customerId: "CST-10482",
    customerRecordId: "emily",
    company: "Apex Financial Group",
    channel: "chat",
    priority: "High",
    status: "open",
    preview: "Payment processing failure on recurring transactions",
    waitTime: "4m",
    aiOverview: {
      actions: [
        "Reviewed the full chat thread and identified a recurring payment failure tied to an expired card token.",
        "Cross-referenced Maria's billing profile and confirmed the card on file expired two billing cycles ago.",
        "Checked if the failure triggered any automated retry logic — no retries were attempted due to hard decline.",
        "Prepared a card-update prompt and drafted a payment link for agent delivery.",
      ],
      whyNeeded:
        "Maria's recurring transactions will continue to fail until the card token is replaced. A human agent is needed to verify her identity, confirm the new card details, and manually trigger the missed payment to bring the account current.",
      nextSteps: [
        "Verify Maria's identity before making billing changes",
        "Confirm and update the new card details on the account",
        "Manually trigger the missed recurring payment",
        "Confirm the account is current and future transactions are enabled",
      ],
    },
  },
  {
    id: "static-2",
    name: "James Whitfield",
    customerId: "CST-10591",
    customerRecordId: "david",
    company: "Summit Healthcare Inc.",
    channel: "voice",
    priority: "Critical",
    status: "open",
    preview: "Enterprise license renewal dispute — pricing discrepancy",
    waitTime: "19m",
    aiOverview: {
      actions: [
        "Reviewed James's enterprise contract and identified a tier pricing change applied at last renewal.",
        "Cross-referenced the original quote with the invoiced amount — a $4,200 discrepancy was found.",
        "Checked account notes and confirmed a verbal pricing commitment was made by the previous account manager.",
        "Flagged the case for revenue operations review and prepared a dispute summary for the agent.",
      ],
      whyNeeded:
        "This dispute involves a contractual pricing commitment that requires management approval to honour. A human agent must review the account history, engage the commercial team, and negotiate a resolution before Summit Healthcare escalates further.",
      nextSteps: [
        "Review the original quote and the disputed invoice side-by-side",
        "Confirm the verbal pricing commitment with the previous account manager",
        "Engage the commercial team for management approval on any correction",
        "Negotiate a resolution with James and document the outcome",
      ],
    },
  },
  {
    id: "static-3",
    name: "Priya Sharma",
    customerId: "CST-10814",
    customerRecordId: "priya",
    company: "Priya Sharma (Personal)",
    channel: "email",
    priority: "High",
    status: "open",
    preview: "Account security alert — unauthorized login detected",
    waitTime: "1h 48m",
    aiOverview: {
      actions: [
        "Reviewed the security alert and confirmed an unrecognised login from a foreign IP address.",
        "Checked session history — the suspicious session accessed personal details but no transactions were made.",
        "Initiated a temporary account lock and triggered a password reset notification to Priya's verified email.",
        "Prepared an incident summary and recommended MFA enablement steps for the agent to walk Priya through.",
      ],
      whyNeeded:
        "Although the account has been locked, Priya needs a human agent to confirm her identity, review whether any data was accessed, and guide her through securing the account. Trust and reassurance are critical in this interaction.",
      nextSteps: [
        "Verify Priya's identity before discussing any account details",
        "Review the suspicious session and confirm what data was accessed",
        "Walk Priya through the password reset and account recovery steps",
        "Enable MFA and confirm the account is fully secured",
      ],
    },
  },
  {
    id: "static-4",
    name: "Robert Okafor",
    customerId: "CST-10363",
    customerRecordId: "jamal",
    company: "BlueLine Logistics",
    channel: "sms",
    priority: "Medium",
    status: "open",
    preview: "API integration errors after platform migration",
    waitTime: "2m",
    aiOverview: {
      actions: [
        "Reviewed Robert's SMS thread and identified API authentication errors starting immediately post-migration.",
        "Checked the developer portal — BlueLine's API keys were not re-issued after the platform version upgrade.",
        "Confirmed the error pattern matches a known breaking change introduced in API v3.1.",
        "Prepared a migration guide and new key generation steps for the agent to share.",
      ],
      whyNeeded:
        "Issuing new API credentials and verifying the integration is restored requires coordination with the developer team. A human agent is needed to walk Robert through the key rotation and confirm the endpoint configuration is updated correctly.",
      nextSteps: [
        "Issue new API credentials from the developer portal",
        "Share the migration guide and v3.1 breaking-change notes with Robert",
        "Walk Robert through updating the endpoint configuration",
        "Verify the integration is restored and confirm with the developer team",
      ],
    },
  },
  {
    id: "static-5",
    name: "Lisa Montenegro",
    customerId: "CST-11024",
    customerRecordId: "lauren",
    company: "Coastal Realty Partners",
    channel: "email",
    priority: "Medium",
    status: "pending",
    preview: "Bulk data export request — compliance deadline",
    waitTime: "49m",
    aiOverview: {
      actions: [
        "Reviewed Lisa's email thread and confirmed a GDPR-mandated data export was requested 18 days ago.",
        "Checked the data export queue — the request stalled due to a missing data-owner approval in the system.",
        "Identified the responsible internal team and flagged the overdue approval to compliance ops.",
        "Prepared an export status summary and escalation note for the agent.",
      ],
      whyNeeded:
        "Lisa's compliance deadline is imminent and the export request is overdue. A human agent must coordinate with the data team, force-approve the stalled request, and confirm delivery to Lisa with a compliance-safe confirmation email.",
      nextSteps: [
        "Coordinate with the data team to unblock the stalled approval",
        "Force-approve the export request in the compliance system",
        "Confirm delivery of the export to Lisa within the deadline",
        "Send a compliance-safe confirmation email and close the case",
      ],
    },
  },
  {
    id: "static-6",
    name: "Kevin Tran",
    customerId: "CST-11130",
    customerRecordId: "miguel",
    company: "Orion Pharma Group",
    channel: "voice",
    priority: "Critical",
    status: "escalated",
    preview: "Billing system discrepancy causing double invoices",
    waitTime: "7m",
    aiOverview: {
      actions: [
        "Reviewed Kevin's billing history and confirmed duplicate invoices were generated for three consecutive months.",
        "Identified a billing system sync error introduced during last quarter's ERP migration as the root cause.",
        "Calculated the total overbilling: $12,600 across three invoices — all currently marked as overdue.",
        "Prepared a credit memo draft and flagged the case to the billing engineering team.",
      ],
      whyNeeded:
        "Kevin has already escalated this case once without resolution. A human agent must personally confirm the overbilling amount, issue the credits, and ensure the ERP sync is corrected to prevent future duplicates. Orion Pharma is a key account.",
      nextSteps: [
        "Confirm the total overbilling amount across all three invoices",
        "Issue the credit memos and update the account balance",
        "Escalate the ERP sync error to billing engineering for a permanent fix",
        "Personally confirm with Kevin that the credits have been applied",
      ],
    },
  },
  {
    id: "static-7",
    name: "Angela Russo",
    customerId: "CST-11247",
    customerRecordId: "hannah",
    company: "Clearwater Consulting",
    channel: "chat",
    priority: "Low",
    status: "pending",
    preview: "Request to update payment method on file",
    waitTime: "1h 12m",
    aiOverview: {
      actions: [
        "Reviewed Angela's chat and confirmed she is requesting a payment method update for her corporate account.",
        "Verified Angela's identity meets the account's security threshold for payment detail changes.",
        "Confirmed no active transactions are pending that would be affected by the card change.",
        "Prepared a secure payment update link and draft confirmation message for the agent.",
      ],
      whyNeeded:
        "Payment method updates on corporate accounts require agent verification and manual confirmation in the billing system. A human agent must validate Angela's authorisation level before making changes to the account on file.",
      nextSteps: [
        "Verify Angela's authorisation level for corporate account changes",
        "Confirm no active transactions will be affected by the card change",
        "Send the secure payment update link and assist Angela through the process",
        "Confirm the new payment method is active and send a confirmation",
      ],
    },
  },
  {
    id: "static-8",
    name: "Marcus Bell",
    customerId: "CST-11389",
    customerRecordId: "alex",
    company: "Vertex Systems",
    channel: "email",
    priority: "High",
    status: "open",
    preview: "SSO configuration broken after directory sync",
    waitTime: "33m",
    aiOverview: [
      "Reviewed Marcus's email thread and confirmed SSO broke immediately after an Azure AD directory sync.",
      "Checked Vertex's SSO configuration — the entity ID and assertion consumer URL are now mismatched.",
      "Confirmed the sync overwrote a custom attribute mapping that was set manually in the original configuration.",
      "Prepared a step-by-step re-configuration guide and flagged the issue to the identity team.",
    ].reduce((acc, action, i, arr) => {
      if (i === arr.length - 1) return acc;
      return acc;
    }, {
      actions: [
        "Reviewed Marcus's email thread and confirmed SSO broke immediately after an Azure AD directory sync.",
        "Checked Vertex's SSO configuration — the entity ID and assertion consumer URL are now mismatched.",
        "Confirmed the sync overwrote a custom attribute mapping that was set manually.",
        "Prepared a re-configuration guide and flagged the issue to the identity team.",
      ],
      whyNeeded:
        "Restoring SSO requires manual changes to both the identity provider settings and the application configuration. A human agent must coordinate with Vertex's IT admin and validate the corrected configuration before re-enabling access.",
      nextSteps: [
        "Coordinate with Vertex's IT admin to access the identity provider settings",
        "Apply the corrected entity ID and assertion consumer URL configuration",
        "Restore the custom attribute mapping that was overwritten by the sync",
        "Test SSO end-to-end and confirm access is restored for Vertex users",
      ],
    }),
  },
  {
    id: "static-9",
    name: "Sandra Yip",
    customerId: "CST-11412",
    customerRecordId: "sarah",
    company: "Harbor Bridge Capital",
    channel: "sms",
    priority: "Medium",
    status: "open",
    preview: "Unable to access quarterly reports in portal",
    waitTime: "15m",
    aiOverview: {
      actions: [
        "Reviewed Sandra's SMS thread and confirmed she cannot access the Q1 and Q2 report documents in the portal.",
        "Checked her account permissions — the reports portal role was inadvertently removed during a user audit.",
        "Confirmed the reports are available and the issue is entirely permission-based, not a data problem.",
        "Prepared a permission restoration request and flagged it to the admin team.",
      ],
      whyNeeded:
        "Restoring portal access requires an admin-level permission change. A human agent must confirm Sandra's role entitlements, apply the correction, and verify she can access the required reports before closing the case.",
      nextSteps: [
        "Confirm Sandra's correct role entitlements for the reports portal",
        "Apply the permission restoration in the admin panel",
        "Verify Sandra can access the Q1 and Q2 report documents",
        "Close the case and confirm with Sandra that access is restored",
      ],
    },
  },
  {
    id: "static-10",
    name: "Derek Owens",
    customerId: "CST-11508",
    customerRecordId: "emily",
    company: "Stonewall Manufacturing",
    channel: "voice",
    priority: "High",
    status: "open",
    preview: "Contract renewal terms need urgent clarification",
    waitTime: "2h 3m",
    aiOverview: {
      actions: [
        "Reviewed Derek's account and identified his annual contract expires in 11 days with no renewal initiated.",
        "Cross-referenced the contract terms — a 30-day notice clause means renewal is technically overdue.",
        "Identified two pricing options available under the current commercial framework.",
        "Prepared a contract summary and renewal options brief for the agent.",
      ],
      whyNeeded:
        "Contract renewal negotiations require human judgement on pricing flexibility and relationship management. A human agent must engage Derek, clarify the terms, and secure a signed renewal before the contract lapses to avoid a service disruption.",
      nextSteps: [
        "Contact Derek urgently given the 11-day renewal window",
        "Review the available pricing options under the current framework",
        "Clarify contract terms and address any questions Derek has",
        "Secure a signed renewal before the contract lapses",
      ],
    },
  },
  {
    id: "static-11",
    name: "Fatima Al-Rashid",
    customerId: "CST-11621",
    customerRecordId: "david",
    company: "Crescent Media Group",
    channel: "chat",
    priority: "Critical",
    status: "escalated",
    preview: "Data breach concern — suspicious export activity flagged",
    waitTime: "11m",
    aiOverview: {
      actions: [
        "Reviewed the security alert and confirmed an abnormal bulk data export was initiated from Fatima's account.",
        "Cross-referenced login timestamps — the export was triggered 40 minutes after an unrecognised session began.",
        "Suspended the export job and flagged the session for security team investigation.",
        "Prepared an incident report and escalation summary for the agent and security team.",
      ],
      whyNeeded:
        "This is a potential data breach requiring immediate human intervention. A security agent must assess the scope of the export, notify the data protection officer, and engage Fatima to determine whether account credentials have been compromised.",
      nextSteps: [
        "Assess the full scope of the abnormal data export",
        "Notify the data protection officer immediately",
        "Engage Fatima to determine if credentials have been compromised",
        "Initiate full incident response protocol and document findings",
      ],
    },
  },
  {
    id: "static-12",
    name: "Tom Hargrove",
    customerId: "CST-11734",
    customerRecordId: "priya",
    company: "GreenLeaf Retail",
    channel: "email",
    priority: "Low",
    status: "resolved",
    preview: "Follow-up on last month's refund — confirmation needed",
    waitTime: "3h 20m",
    aiOverview: {
      actions: [
        "Reviewed Tom's email and confirmed he is following up on a refund issued 22 days ago.",
        "Checked the refund status — the credit was processed but the bank return is still pending clearance.",
        "Confirmed the refund amount of $340 is within the expected processing window for Tom's bank.",
        "Prepared a refund status update and estimated clearance timeline for the agent to share.",
      ],
      whyNeeded:
        "Although the refund was processed correctly, Tom needs a human agent to communicate the status clearly and provide a confirmed timeline. A personal follow-up will prevent further escalation and close the loop on this case.",
      nextSteps: [
        "Confirm the refund of $340 was processed correctly",
        "Provide Tom with the estimated bank clearance timeline",
        "Send a personal follow-up message with the status details",
        "Close the case once Tom confirms receipt",
      ],
    },
  },
  {
    id: "static-13",
    name: "Nadia Petrov",
    customerId: "CST-11856",
    customerRecordId: "jamal",
    company: "Eurozone Trade Ltd.",
    channel: "sms",
    priority: "Medium",
    status: "pending",
    preview: "International wire transfer delay beyond SLA window",
    waitTime: "58m",
    aiOverview: {
      actions: [
        "Reviewed Nadia's SMS thread and confirmed her international wire transfer is 3 days past the SLA window.",
        "Checked with the correspondent bank — the transfer is held pending SWIFT compliance screening.",
        "Identified a flag on the beneficiary country code that triggered an automated compliance hold.",
        "Prepared a compliance hold explanation and escalation path for the agent.",
      ],
      whyNeeded:
        "Releasing a compliance-held wire transfer requires a human agent to liaise with the compliance team, review the beneficiary details, and submit a manual clearance request. Nadia needs a clear status update and a firm release timeline.",
      nextSteps: [
        "Liaise with the compliance team regarding the SWIFT hold",
        "Review and confirm the beneficiary country code and details",
        "Submit a manual clearance request on Nadia's behalf",
        "Provide Nadia with a firm release timeline and status update",
      ],
    },
  },
  {
    id: "static-14",
    name: "Carlos Mendez",
    customerId: "CST-11972",
    customerRecordId: "lauren",
    company: "SouthStar Energy",
    channel: "voice",
    priority: "High",
    status: "open",
    preview: "Service outage impacting production pipeline monitoring",
    waitTime: "26m",
    aiOverview: {
      actions: [
        "Reviewed Carlos's call notes and confirmed a real-time data feed outage affecting pipeline monitoring dashboards.",
        "Checked system status — the outage is caused by a broken WebSocket connection in the v4.2 API gateway.",
        "Confirmed the engineering team is aware and a fix is in progress, estimated resolution in 2 hours.",
        "Prepared an outage briefing and interim monitoring workaround for the agent to share.",
      ],
      whyNeeded:
        "Carlos's production monitoring is offline and the situation carries operational risk. A human agent must confirm the incident timeline, provide SouthStar Energy with a reliable ETA, and arrange direct engineering contact if the outage extends beyond the estimate.",
      nextSteps: [
        "Confirm the current incident timeline and engineering ETA with the team",
        "Share the interim monitoring workaround with Carlos immediately",
        "Provide SouthStar Energy a reliable restoration ETA",
        "Arrange direct engineering contact if the outage extends beyond 2 hours",
      ],
    },
  },
  {
    id: "static-15",
    name: "Ingrid Holmberg",
    customerId: "CST-12045",
    customerRecordId: "miguel",
    company: "Nordic Freight Solutions",
    channel: "email",
    priority: "Medium",
    status: "open",
    preview: "Customs documentation error on recent shipment",
    waitTime: "44m",
    aiOverview: {
      actions: [
        "Reviewed Ingrid's email and identified an HS code classification error on a recent shipment declaration.",
        "Cross-referenced the declared goods with the correct tariff schedule — the error affects duty calculations.",
        "Confirmed the shipment is currently held at customs pending a corrected declaration.",
        "Prepared a corrected HS code recommendation and amendment filing instructions for the agent.",
      ],
      whyNeeded:
        "Amending a customs declaration requires a human agent to coordinate with the freight broker and submit a formal correction. Ingrid needs clear guidance on the amendment process and confirmation the shipment will be released without penalty.",
      nextSteps: [
        "Coordinate with the freight broker on the corrected HS code",
        "Submit the amended customs declaration to the relevant authority",
        "Confirm the shipment has been cleared for release",
        "Guide Ingrid through the amendment process and confirm no penalty",
      ],
    },
  },
  {
    id: "static-16",
    name: "Darius Knox",
    customerId: "CST-12187",
    customerRecordId: "darius",
    company: "Pinnacle Wealth Advisors",
    channel: "chat",
    priority: "Critical",
    status: "open",
    preview: "I just realized I sent money to the wrong account — I need this fixed right away",
    waitTime: "3m",
    aiOverview: {
      actions: [
        "Reviewed Darius's chat and confirmed a $47,500 transfer was sent to an incorrect beneficiary account.",
        "Checked the transfer status — the transaction completed 8 minutes ago and has not yet been settled.",
        "Identified the receiving institution and initiated a recall request through the payments network.",
        "Flagged the case as a priority incident and prepared a reversal brief for the agent.",
      ],
      whyNeeded:
        "Reversing a completed transfer requires immediate human action and direct contact with the receiving bank. A human agent must authorise the recall, coordinate with the payments team, and keep Darius informed at every step until the funds are confirmed returned.",
      nextSteps: [
        "Authorise the transfer recall in the payments system immediately",
        "Contact the receiving institution to request the reversal",
        "Coordinate with the payments team to track the recall status",
        "Keep Darius informed at every step until funds are confirmed returned",
      ],
    },
  },
  {
    id: "static-17",
    name: "Yuki Tanaka",
    customerId: "CST-12301",
    customerRecordId: "emily",
    company: "Tanaka Innovations",
    channel: "chat",
    priority: "High",
    status: "open",
    preview: "Virtual agent unable to process my subscription upgrade",
    waitTime: "6m",
    aiOverview: {
      actions: [
        "Reviewed chat transcript — virtual agent failed to locate Yuki's account during the upgrade flow.",
        "Confirmed the account lookup is failing due to a mismatched email domain after a recent corporate rebrand.",
        "Identified the correct account record and confirmed the upgrade tier requested is available.",
        "Prepared a manual upgrade path for the agent to apply directly.",
      ],
      whyNeeded: "The account lookup failure is blocking the automated upgrade path. A human agent must apply the upgrade manually and update the email domain on the account to prevent recurrence.",
      nextSteps: [
        "Locate Yuki's account using the legacy email domain",
        "Apply the requested subscription upgrade manually",
        "Update the email domain on the account to the new one",
        "Confirm the upgrade is active and send Yuki a confirmation",
      ],
    },
  },
  {
    id: "static-18",
    name: "Amara Osei",
    customerId: "CST-12415",
    customerRecordId: "sarah",
    company: "Osei Capital Partners",
    channel: "sms",
    priority: "Medium",
    status: "open",
    preview: "Bot keeps looping on my account verification — need a human",
    waitTime: "11m",
    aiOverview: {
      actions: [
        "Reviewed the SMS thread — virtual agent verification loop triggered by an expired security question on file.",
        "Checked Amara's account — the security question was set 4 years ago and the answer hash no longer matches.",
        "Confirmed identity can be verified through an alternate KYC method available to agents.",
        "Prepared the alternate verification steps for the human agent to proceed.",
      ],
      whyNeeded: "The automated verification loop cannot be broken without resetting the security question. A human agent must verify Amara's identity through alternate means and reset the security credential.",
      nextSteps: [
        "Use the alternate KYC method to verify Amara's identity",
        "Reset the expired security question on the account",
        "Confirm the virtual agent verification flow works after the reset",
        "Close the case and confirm with Amara that access is restored",
      ],
    },
  },
  {
    id: "static-19",
    name: "Patrick O'Brien",
    customerId: "CST-12528",
    customerRecordId: "miguel",
    company: "O'Brien & Associates",
    channel: "chat",
    priority: "Low",
    status: "open",
    preview: "AI suggested the wrong product — need correct recommendation",
    waitTime: "22m",
    aiOverview: {
      actions: [
        "Reviewed chat transcript — virtual agent recommended an entry-level plan despite Patrick's enterprise usage profile.",
        "Checked account usage metrics — Patrick's current consumption exceeds the recommended plan by 340%.",
        "Identified the correct enterprise plan and confirmed it includes all features Patrick requires.",
        "Prepared a side-by-side plan comparison and upgrade notes for the agent.",
      ],
      whyNeeded: "Overriding an AI recommendation and manually switching a customer's plan requires agent authorization. A human agent must walk Patrick through the correct option and apply the change with his consent.",
      nextSteps: [
        "Present Patrick with the correct enterprise plan recommendation",
        "Confirm the plan includes all features Patrick currently uses",
        "Apply the plan change with Patrick's explicit consent",
        "Confirm the change is active and billing is updated accordingly",
      ],
    },
  },
  {
    id: "static-20",
    name: "Chloe Beaumont",
    customerId: "CST-12639",
    customerRecordId: "lauren",
    company: "Beaumont Legal Group",
    channel: "sms",
    priority: "High",
    status: "open",
    preview: "Virtual agent closed my case without resolving it",
    waitTime: "8m",
    aiOverview: {
      actions: [
        "Reviewed case history — virtual agent auto-closed the case after a 24-hour inactivity window during a public holiday.",
        "Confirmed the original issue (document upload failure) was never resolved at time of closure.",
        "Reopened the case and reviewed the document upload pipeline for any ongoing errors.",
        "Identified a file size limit misconfiguration affecting Chloe's account tier.",
      ],
      whyNeeded: "The auto-closure was a system error compounded by a misconfiguration. A human agent must acknowledge the error, resolve the document upload issue, and ensure Chloe's case is fully closed to her satisfaction.",
      nextSteps: [
        "Apologize for the premature case closure and acknowledge the error",
        "Fix the file size limit configuration on Chloe's account",
        "Assist Chloe in completing the document upload successfully",
        "Confirm the case is resolved and close it with Chloe's confirmation",
      ],
    },
  },
  {
    id: "static-21",
    name: "Rajiv Menon",
    customerId: "CST-12750",
    customerRecordId: "jamal",
    company: "Menon Tech Solutions",
    channel: "chat",
    priority: "Critical",
    status: "open",
    preview: "AI provided incorrect compliance guidance — urgent correction needed",
    waitTime: "2m",
    aiOverview: {
      actions: [
        "Reviewed chat transcript — virtual agent cited an outdated compliance regulation that was revised in Q3.",
        "Cross-referenced the correct current regulation and confirmed the guidance given was materially incorrect.",
        "Identified that Rajiv may have already acted on the incorrect guidance in a live filing.",
        "Prepared a corrected compliance summary and flagged the case as urgent.",
      ],
      whyNeeded: "Incorrect compliance guidance may have triggered an erroneous regulatory filing. A human agent with compliance expertise must correct the record, contact the relevant regulatory body if required, and document the incident.",
      nextSteps: [
        "Immediately correct the compliance guidance provided to Rajiv",
        "Determine if any action was taken based on the incorrect guidance",
        "Contact the regulatory body if a filing correction is needed",
        "Document the AI error and escalate to the compliance quality team",
      ],
    },
  },
  {
    id: "static-22",
    name: "Sophie Hartmann",
    customerId: "CST-12863",
    customerRecordId: "hannah",
    company: "Hartmann Logistics GmbH",
    channel: "sms",
    priority: "Medium",
    status: "open",
    preview: "Bot couldn't understand my shipment tracking query",
    waitTime: "17m",
    aiOverview: {
      actions: [
        "Reviewed SMS thread — virtual agent could not parse Sophie's tracking reference format from the partner carrier.",
        "Checked the tracking number against the partner carrier API — shipment is located and en route.",
        "Confirmed the virtual agent's carrier lookup table is missing the partner carrier's prefix.",
        "Prepared tracking details and expected delivery window for the agent to share.",
      ],
      whyNeeded: "The virtual agent's carrier table gap cannot be fixed in this session. A human agent must provide Sophie with the tracking information directly and log the gap for the product team to address.",
      nextSteps: [
        "Share the shipment tracking details and ETA with Sophie directly",
        "Confirm the delivery address and any special handling instructions",
        "Log the carrier lookup gap for the product team to fix",
        "Close the case once Sophie confirms the information is satisfactory",
      ],
    },
  },
  {
    id: "static-23",
    name: "Terrence Vance",
    customerId: "CST-12974",
    customerRecordId: "alex",
    company: "Vance Capital Management",
    channel: "chat",
    priority: "High",
    status: "open",
    preview: "Virtual agent gave wrong account balance — discrepancy of $18,000",
    waitTime: "5m",
    aiOverview: {
      actions: [
        "Reviewed chat transcript — virtual agent pulled balance from a cached snapshot 3 days out of date.",
        "Confirmed current live balance with the core banking system — $18,200 discrepancy vs. what was displayed.",
        "Identified a cache invalidation failure tied to a weekend batch job that did not complete.",
        "Prepared the correct balance and a brief explanation of the technical cause for the agent.",
      ],
      whyNeeded: "Providing incorrect financial information is a critical trust issue. A human agent must personally confirm the correct balance, explain the discrepancy clearly, and ensure Terrence has not made any decisions based on the incorrect figure.",
      nextSteps: [
        "Confirm the correct current balance with Terrence directly",
        "Explain the cache discrepancy clearly and reassure him",
        "Check if Terrence made any financial decisions based on the wrong balance",
        "Escalate the batch job failure to the engineering team for immediate fix",
      ],
    },
  },
  {
    id: "static-24",
    name: "Isabella Moreno",
    customerId: "CST-13085",
    customerRecordId: "priya",
    company: "Moreno & Partners Law",
    channel: "sms",
    priority: "Low",
    status: "open",
    preview: "Need to speak to a human — AI not helpful for my situation",
    waitTime: "31m",
    aiOverview: {
      actions: [
        "Reviewed SMS thread — virtual agent attempted standard triage but Isabella's issue involves a bespoke contract arrangement not in the knowledge base.",
        "Confirmed Isabella's account has a custom SLA agreement that requires manual handling.",
        "Checked account notes — a previous agent flagged this account for human-only contact preference.",
        "Prepared account context and custom SLA details for the human agent.",
      ],
      whyNeeded: "Isabella's account has a custom arrangement that falls outside automated handling. A human agent must review the bespoke contract terms and respond accordingly, respecting the account's human-contact preference.",
      nextSteps: [
        "Review Isabella's custom SLA agreement before engaging",
        "Address her issue within the terms of the bespoke contract",
        "Confirm the resolution aligns with her custom arrangement",
        "Note the interaction and update the account preference flag if needed",
      ],
    },
  },
  {
    id: "static-25",
    name: "David Park",
    customerId: "CST-13196",
    customerRecordId: "david",
    company: "Park Digital Agency",
    channel: "chat",
    priority: "Medium",
    status: "open",
    preview: "Virtual agent escalated my password reset — token not arriving",
    waitTime: "14m",
    aiOverview: {
      actions: [
        "Reviewed chat thread — virtual agent triggered a password reset but the token email has not arrived after 20 minutes.",
        "Checked the email delivery log — the message was soft-bounced by David's corporate spam gateway.",
        "Confirmed the reset token is valid and can be re-sent to an alternate verified contact method.",
        "Prepared an alternate delivery path for the agent to use.",
      ],
      whyNeeded: "The bounced token requires agent intervention to resend via an alternate method and confirm receipt. The agent must also whitelist the domain with the customer's IT team to prevent recurrence.",
      nextSteps: [
        "Resend the reset token to David's verified mobile number",
        "Confirm David receives and successfully uses the token",
        "Advise David's IT team to whitelist the sending domain",
        "Verify login is restored and close the case",
      ],
    },
  },
  {
    id: "static-26",
    name: "Aaliya Nasser",
    customerId: "CST-13307",
    customerRecordId: "sarah",
    company: "Nasser Trading Co.",
    channel: "sms",
    priority: "High",
    status: "open",
    preview: "Bot approved a transaction it should have flagged for review",
    waitTime: "9m",
    aiOverview: {
      actions: [
        "Reviewed the transaction — a $22,000 cross-border payment was auto-approved despite exceeding the manual review threshold.",
        "Checked the review threshold settings — a configuration change last week inadvertently raised the limit.",
        "Confirmed the payment has not yet been settled and is still within the recall window.",
        "Flagged the configuration error to compliance and prepared a recall brief for the agent.",
      ],
      whyNeeded: "This transaction requires immediate human review before it settles. A human agent must assess whether the payment should proceed or be recalled, and coordinate the configuration fix with the compliance team.",
      nextSteps: [
        "Review the $22,000 cross-border payment details immediately",
        "Determine whether to proceed or initiate a recall before settlement",
        "Coordinate the threshold configuration fix with the compliance team",
        "Document the incident and notify the relevant oversight team",
      ],
    },
  },
  {
    id: "static-27",
    name: "Finn Johansson",
    customerId: "CST-13418",
    customerRecordId: "miguel",
    company: "Johansson Nordic AB",
    channel: "chat",
    priority: "Low",
    status: "open",
    preview: "AI couldn't answer questions about my new plan features",
    waitTime: "27m",
    aiOverview: {
      actions: [
        "Reviewed chat transcript — Finn's questions relate to features released in the last product update, which are not yet in the virtual agent's knowledge base.",
        "Confirmed the features Finn is asking about are live and available on his plan tier.",
        "Located the correct feature documentation and usage guides.",
        "Prepared a feature summary and setup instructions for the agent to share.",
      ],
      whyNeeded: "The knowledge base gap means the virtual agent cannot answer Finn's questions accurately. A human agent must walk Finn through the new features and submit a knowledge base update request.",
      nextSteps: [
        "Walk Finn through the new features available on his plan",
        "Share the relevant documentation and setup guides",
        "Submit a request to update the virtual agent knowledge base",
        "Confirm Finn is satisfied and the features are working correctly",
      ],
    },
  },
  {
    id: "static-28",
    name: "Grace Kim",
    customerId: "CST-13529",
    customerRecordId: "emily",
    company: "Kim & Associates CPA",
    channel: "sms",
    priority: "Critical",
    status: "open",
    preview: "Urgent: Virtual agent locked my account during tax filing season",
    waitTime: "1m",
    aiOverview: {
      actions: [
        "Reviewed the account lock — virtual agent applied a precautionary lock after detecting an unusual login pattern during peak hours.",
        "Confirmed the login was Grace herself accessing the system from a new device during a client meeting.",
        "Verified Grace's identity meets all unlock criteria.",
        "Prepared an immediate unlock path for the agent and a device whitelist update.",
      ],
      whyNeeded: "The account lock is preventing Grace from accessing critical client data during an active tax filing. Immediate human intervention is required to unlock the account, whitelist the new device, and confirm full access is restored.",
      nextSteps: [
        "Unlock Grace's account immediately",
        "Whitelist Grace's new device on the account",
        "Confirm full access to all client data is restored",
        "Review the lock trigger logic to prevent false positives during peak usage",
      ],
    },
  },
  {
    id: "static-29",
    name: "Liam Foster",
    customerId: "CST-13640",
    customerRecordId: "alex",
    company: "Foster Engineering Ltd.",
    channel: "chat",
    priority: "Medium",
    status: "open",
    preview: "Bot couldn't process my bulk invoice submission",
    waitTime: "19m",
    aiOverview: {
      actions: [
        "Reviewed chat thread — virtual agent returned a validation error on Liam's bulk invoice file.",
        "Checked the file — the CSV contains a non-standard delimiter introduced by Liam's accounting software export.",
        "Confirmed the bulk submission portal accepts pipe-delimited format as an alternative.",
        "Prepared a conversion guide and a corrected file template for the agent to share.",
      ],
      whyNeeded: "The formatting issue requires a human agent to guide Liam through the file correction and manually trigger the submission once the corrected file is uploaded, as bulk retries require agent authorisation.",
      nextSteps: [
        "Share the pipe-delimited template and conversion guide with Liam",
        "Assist Liam in re-exporting the file in the correct format",
        "Trigger the bulk submission manually once the file is corrected",
        "Confirm all invoices are processed and the submission is complete",
      ],
    },
  },
  {
    id: "static-30",
    name: "Nadia Volkov",
    customerId: "CST-13751",
    customerRecordId: "hannah",
    company: "Volkov Asset Management",
    channel: "sms",
    priority: "High",
    status: "open",
    preview: "AI couldn't verify my identity — account changes are urgent",
    waitTime: "13m",
    aiOverview: {
      actions: [
        "Reviewed SMS thread — virtual agent identity check failed because Nadia's registered phone number changed after a SIM migration.",
        "Confirmed Nadia's identity can be verified through secondary KYC documentation.",
        "Identified the urgent account change she needs: updating the primary contact number and nominee details.",
        "Prepared the alternate verification flow and account update checklist for the agent.",
      ],
      whyNeeded: "Identity verification failure is blocking time-sensitive account updates. A human agent must complete alternate KYC verification and process the nominee and contact updates within the compliance window.",
      nextSteps: [
        "Complete alternate KYC verification using secondary documentation",
        "Update the primary contact number to Nadia's new SIM",
        "Process the nominee detail changes within the compliance window",
        "Confirm all changes are saved and send Nadia a confirmation",
      ],
    },
  },
  {
    id: "static-31",
    name: "Ethan Blake",
    customerId: "CST-13862",
    customerRecordId: "jamal",
    company: "Blake & Co. Investments",
    channel: "chat",
    priority: "Low",
    status: "open",
    preview: "Virtual agent sent me in circles — need someone to actually help",
    waitTime: "38m",
    aiOverview: {
      actions: [
        "Reviewed the chat transcript — Ethan's question about fee waivers triggered a loop between two virtual agent intents.",
        "Confirmed the loop is caused by a conflicting FAQ entry in the knowledge base.",
        "Identified that Ethan's account qualifies for a fee waiver under the loyalty program.",
        "Prepared a direct resolution path and the fee waiver application steps for the agent.",
      ],
      whyNeeded: "The virtual agent loop has frustrated Ethan and the resolution requires a human agent to apply the fee waiver directly and submit a knowledge base fix to resolve the conflicting intent.",
      nextSteps: [
        "Apologize for the circular experience and confirm a resolution is available",
        "Apply the fee waiver to Ethan's account under the loyalty program",
        "Submit a knowledge base fix for the conflicting FAQ entries",
        "Confirm the waiver is applied and close the case",
      ],
    },
  },
  {
    id: "static-32",
    name: "Mei Lin",
    customerId: "CST-13973",
    customerRecordId: "lauren",
    company: "Lin Pharmaceuticals",
    channel: "sms",
    priority: "High",
    status: "open",
    preview: "Automated agent gave incorrect dosage calculation guidance",
    waitTime: "4m",
    aiOverview: {
      actions: [
        "Reviewed SMS thread — virtual agent provided a calculation example using an outdated formula from an archived knowledge article.",
        "Confirmed the correct formula is documented in the current regulatory guidance.",
        "Identified the archived article is still indexed and accessible to the virtual agent — it should be retired.",
        "Prepared the correct guidance and flagged the article for immediate retirement.",
      ],
      whyNeeded: "Incorrect dosage guidance is a critical patient safety risk. A human agent must immediately correct the information provided and escalate the knowledge base error to the content and compliance teams.",
      nextSteps: [
        "Immediately correct the dosage calculation guidance provided to Mei",
        "Confirm Mei has the correct current formula and documentation",
        "Escalate the archived article for immediate retirement",
        "Notify the compliance and content teams of the knowledge base error",
      ],
    },
  },
  {
    id: "static-33",
    name: "Oliver Svensson",
    customerId: "CST-14084",
    customerRecordId: "david",
    company: "Svensson Group AB",
    channel: "chat",
    priority: "Medium",
    status: "open",
    preview: "Bot failed to book my appointment — double booking risk",
    waitTime: "21m",
    aiOverview: {
      actions: [
        "Reviewed chat transcript — virtual agent attempted to book a call-back slot but the calendar API returned a timeout error.",
        "Checked the calendar system — the timeout was caused by a sync delay during a maintenance window.",
        "Confirmed Oliver's preferred slot is still available.",
        "Prepared the booking details and a direct calendar link for the agent to complete manually.",
      ],
      whyNeeded: "The booking timeout left Oliver without a confirmed appointment, creating a double-booking risk if he retries independently. A human agent must complete the booking manually and confirm it directly with Oliver.",
      nextSteps: [
        "Confirm Oliver's preferred appointment slot is still available",
        "Book the appointment manually through the calendar system",
        "Send Oliver a confirmed appointment notification with details",
        "Monitor the calendar sync and confirm no double-booking occurred",
      ],
    },
  },
  {
    id: "static-34",
    name: "Priscilla Nakamura",
    customerId: "CST-14195",
    customerRecordId: "priya",
    company: "Nakamura Wealth Group",
    channel: "sms",
    priority: "Critical",
    status: "open",
    preview: "AI triggered an account freeze I didn't authorize",
    waitTime: "2m",
    aiOverview: {
      actions: [
        "Reviewed the account freeze — virtual agent misinterpreted an ambiguous customer message as a freeze request.",
        "Confirmed Priscilla did not authorize the freeze and is currently locked out of her investment account.",
        "Checked account activity — no suspicious transactions were detected that would justify the freeze.",
        "Prepared an immediate unfreeze authorization and incident log for the agent.",
      ],
      whyNeeded: "An unauthorized account freeze is blocking Priscilla's access to her investments. Immediate human intervention is required to reverse the freeze, restore full access, and file an incident report for the AI misinterpretation.",
      nextSteps: [
        "Immediately reverse the unauthorized account freeze",
        "Confirm Priscilla has full access to her investment account",
        "File an incident report for the AI misinterpretation",
        "Review and update the freeze intent logic to prevent recurrence",
      ],
    },
  },
  {
    id: "static-35",
    name: "Hugo Fernandez",
    customerId: "CST-14306",
    customerRecordId: "alex",
    company: "Fernandez Import-Export",
    channel: "chat",
    priority: "Low",
    status: "open",
    preview: "Virtual agent can't locate my order history from last year",
    waitTime: "44m",
    aiOverview: {
      actions: [
        "Reviewed chat thread — virtual agent query returned no results because Hugo's historic orders are in an archived data store not indexed by the current search.",
        "Located Hugo's order history in the legacy archive system.",
        "Confirmed the orders Hugo is looking for are present and intact.",
        "Prepared an export of the relevant order records for the agent to share.",
      ],
      whyNeeded: "Accessing archived data requires an agent with legacy system access. A human agent must retrieve the records, share them with Hugo, and submit a request to include legacy data in the search index.",
      nextSteps: [
        "Retrieve Hugo's order history from the legacy archive",
        "Share the relevant records with Hugo in a usable format",
        "Submit a request to include legacy data in the main search index",
        "Confirm Hugo has all the records he needs and close the case",
      ],
    },
  },
  {
    id: "static-36",
    name: "Thandi Mokoena",
    customerId: "CST-14417",
    customerRecordId: "sarah",
    company: "Mokoena Mining Corp",
    channel: "sms",
    priority: "High",
    status: "open",
    preview: "Bot can't process my VAT exemption certificate",
    waitTime: "16m",
    aiOverview: {
      actions: [
        "Reviewed SMS thread — virtual agent rejected Thandi's VAT exemption certificate due to an unrecognised issuing authority code.",
        "Confirmed the certificate is valid and issued by the correct authority for Thandi's jurisdiction.",
        "Identified that the authority code was added to the approved list only last month and the virtual agent's database hasn't been updated.",
        "Prepared a manual VAT exemption override path and the correct account update for the agent.",
      ],
      whyNeeded: "The outdated authority code database is blocking a valid exemption. A human agent must apply the VAT exemption manually and escalate the database update to the product team.",
      nextSteps: [
        "Manually verify and apply the VAT exemption on Thandi's account",
        "Confirm the exemption is reflected on future invoices",
        "Escalate the authority code database update to the product team",
        "Close the case and confirm with Thandi that billing is corrected",
      ],
    },
  },
  {
    id: "static-37",
    name: "Jerome Dupont",
    customerId: "CST-14528",
    customerRecordId: "miguel",
    company: "Dupont Financial Services",
    channel: "chat",
    priority: "Medium",
    status: "open",
    preview: "AI couldn't process my multi-currency transfer request",
    waitTime: "25m",
    aiOverview: {
      actions: [
        "Reviewed chat transcript — virtual agent declined the multi-currency transfer due to an unsupported currency pair in the automated flow.",
        "Confirmed the currency pair (EUR to SAR) is supported by the underlying payments network but not yet exposed in the virtual agent workflow.",
        "Checked Jerome's account — he has the required permissions for the transfer.",
        "Prepared the manual transfer initiation steps for the agent.",
      ],
      whyNeeded: "The currency pair gap in the virtual agent requires a human agent to initiate the transfer manually through the back-office payments system. Jerome needs the transfer completed today within the FX window.",
      nextSteps: [
        "Confirm the EUR to SAR transfer details with Jerome",
        "Initiate the transfer manually through the back-office system",
        "Confirm the FX rate applied and get Jerome's approval before executing",
        "Monitor the transfer and confirm completion with Jerome",
      ],
    },
  },
  {
    id: "static-38",
    name: "Vera Sokolova",
    customerId: "CST-14639",
    customerRecordId: "hannah",
    company: "Sokolova Group Holdings",
    channel: "sms",
    priority: "Low",
    status: "open",
    preview: "Virtual agent closed my chat before I finished explaining",
    waitTime: "52m",
    aiOverview: {
      actions: [
        "Reviewed SMS thread — virtual agent auto-closed the session after a 5-minute inactivity timeout while Vera was gathering documents.",
        "Confirmed Vera's underlying request (updating beneficiary details) was not started before the session closed.",
        "Checked account — no changes were made; the account is in the same state as before the session.",
        "Prepared the beneficiary update workflow for the agent to complete with Vera.",
      ],
      whyNeeded: "The premature session close frustrated Vera and she needs a human agent to complete the beneficiary update she originally requested. The agent should also review the inactivity timeout setting for this account type.",
      nextSteps: [
        "Acknowledge the session timeout issue and apologize to Vera",
        "Complete the beneficiary detail update Vera originally requested",
        "Confirm the update is saved and reflected correctly",
        "Review the inactivity timeout for this account type and escalate if too short",
      ],
    },
  },
  {
    id: "static-39",
    name: "Nathan Kowalski",
    customerId: "CST-14750",
    customerRecordId: "alex",
    company: "Kowalski Industrial",
    channel: "chat",
    priority: "High",
    status: "open",
    preview: "AI gave conflicting answers about my warranty claim eligibility",
    waitTime: "10m",
    aiOverview: {
      actions: [
        "Reviewed chat transcript — virtual agent gave two conflicting eligibility answers across separate sessions due to a knowledge base versioning conflict.",
        "Identified the conflict: one article reflects the old 12-month warranty policy; another reflects the new 24-month policy effective last quarter.",
        "Confirmed Nathan's purchase date qualifies under the new 24-month policy.",
        "Prepared a clear eligibility confirmation and claim initiation steps for the agent.",
      ],
      whyNeeded: "The conflicting guidance has created uncertainty and potential distrust. A human agent must confirm the correct policy, initiate the warranty claim on Nathan's behalf, and flag the knowledge base conflict for resolution.",
      nextSteps: [
        "Confirm Nathan is eligible under the 24-month warranty policy",
        "Initiate the warranty claim on Nathan's behalf",
        "Flag the conflicting knowledge base articles for immediate resolution",
        "Keep Nathan informed of the claim progress and expected timeline",
      ],
    },
  },
  {
    id: "static-40",
    name: "Aisha Kamara",
    customerId: "CST-14861",
    customerRecordId: "sarah",
    company: "Kamara Ventures",
    channel: "sms",
    priority: "Critical",
    status: "open",
    preview: "Bot sent my sensitive documents to the wrong recipient",
    waitTime: "1m",
    aiOverview: {
      actions: [
        "Reviewed the incident — virtual agent sent a document package to an incorrect email address due to a cached recipient from a previous session.",
        "Confirmed the documents contain personally identifiable financial information.",
        "Identified the incorrect recipient and initiated a recall request to the email provider.",
        "Flagged as a data incident and prepared an urgent notification for the DPO.",
      ],
      whyNeeded: "This is an active data breach incident. A human agent must coordinate with the DPO, initiate the formal incident response process, and notify Aisha of the breach in accordance with data protection obligations.",
      nextSteps: [
        "Notify the Data Protection Officer immediately",
        "Initiate the formal data incident response protocol",
        "Inform Aisha of the incident and the steps being taken",
        "Pursue the document recall and document all actions taken",
      ],
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Per-customer AI overview for the 3 live assignments keyed by customerRecordId
function getLiveAiOverview(customerRecordId: string, name: string, preview: string, channel: string): AiOverview {
  if (liveAiOverview[customerRecordId]) return liveAiOverview[customerRecordId];
  const firstName = name.split(" ")[0];
  return {
    actions: [
      `Reviewed the full ${channel} thread and extracted the core issue from ${firstName}'s messages.`,
      `Checked account history and cross-referenced any recent interactions flagged on the account.`,
      `Assessed conversation tone and confirmed standard escalation path was appropriate.`,
      `Prepared a suggested response draft and identified relevant knowledge base articles.`,
    ],
    whyNeeded: `The issue ${firstName} raised requires judgment and account-level context that the AI cannot act on autonomously. A human agent is needed to review the details, confirm the right course of action, and deliver a personalised resolution that closes the loop.`,
    nextSteps: [
      `Review the customer's ticket and the latest thread activity`,
      `Check account history and any flagged interactions`,
      `Identify the most appropriate resolution path`,
      `Respond with a clear next step and keep the customer informed`,
    ],
  };
}

type PriorityFilter = "all" | "Critical" | "High" | "Medium" | "Low";

const priorityFilterOptions: { value: PriorityFilter; label: string }[] = [
  { value: "all",      label: "All Priorities" },
  { value: "Critical", label: "Critical" },
  { value: "High",     label: "High" },
  { value: "Medium",   label: "Medium" },
  { value: "Low",      label: "Low" },
];

type ChannelFilter = "all" | "chat" | "email" | "sms" | "whatsapp";

const channelFilterOptions: { value: ChannelFilter; label: string }[] = [
  { value: "all",      label: "All Channels" },
  { value: "chat",     label: "Chat"         },
  { value: "email",    label: "Email"        },
  { value: "sms",      label: "SMS"          },
  { value: "whatsapp", label: "WhatsApp"     },
];

// Module-level store so the accepted-task map survives component remounts
// (ControlCenterPage unmounts on every navigate("/activity") call).
const acceptedStaticsStore = new Map<string, string>(); // staticId → assignmentId

// ─── Connected applications (static) ─────────────────────────────────────────

const connectedApps = [
  { name: "Salesforce",      latency: "42ms",  uptime: "99.9%", status: "healthy" },
  { name: "ADP Workforce",   latency: "88ms",  uptime: "99.7%", status: "healthy" },
  { name: "Outlook 365",     latency: "31ms",  uptime: "100%",  status: "healthy" },
  { name: "MS Teams",        latency: "29ms",  uptime: "100%",  status: "healthy" },
  { name: "Zendesk",         latency: "340ms", uptime: "97.2%", status: "degraded" },
  { name: "Jira Cloud",      latency: "67ms",  uptime: "99.8%", status: "healthy" },
  { name: "Knowledge Base",  latency: "12ms",  uptime: "100%",  status: "healthy" },
  { name: "Desktop CTI",     latency: "8ms",   uptime: "100%",  status: "healthy" },
];

const appIconLetters: Record<string, string> = {
  Salesforce: "S", "ADP Workforce": "A", "Outlook 365": "O",
  "MS Teams": "T", Zendesk: "Z", "Jira Cloud": "J",
  "Knowledge Base": "K", "Desktop CTI": "D",
};

// ─── Agent roster ─────────────────────────────────────────────────────────────

type AgentAvailability = "Available" | "In a Call" | "Away" | "Offline";

interface Agent {
  id: string;
  name: string;
  initials: string;
  availability: AgentAvailability;
  skills: string[];
  activeCount: number; // current assignment count
}

const agentRoster: Agent[] = [
  {
    id: "agent-1",
    name: "Jeff Comstock",
    initials: "JC",
    availability: "Available",
    skills: ["Billing", "Account Management", "Escalations"],
    activeCount: 2,
  },
  {
    id: "agent-2",
    name: "Priya Mehra",
    initials: "PM",
    availability: "Available",
    skills: ["Technical Support", "API Integration", "Security"],
    activeCount: 1,
  },
  {
    id: "agent-3",
    name: "Sam Torres",
    initials: "ST",
    availability: "Available",
    skills: ["Compliance", "Data Exports", "Contract Renewals"],
    activeCount: 3,
  },
  {
    id: "agent-4",
    name: "Kenji Watanabe",
    initials: "KW",
    availability: "In a Call",
    skills: ["Payments", "Fraud", "Wire Transfers"],
    activeCount: 4,
  },
  {
    id: "agent-5",
    name: "Amara Osei",
    initials: "AO",
    availability: "Available",
    skills: ["Enterprise Accounts", "Licensing", "Escalations"],
    activeCount: 2,
  },
  {
    id: "agent-6",
    name: "Lena Fischer",
    initials: "LF",
    availability: "Away",
    skills: ["Billing", "Refunds", "Account Management"],
    activeCount: 1,
  },
  {
    id: "agent-7",
    name: "Marcus Webb",
    initials: "MW",
    availability: "Available",
    skills: ["Security", "Identity Management", "SSO"],
    activeCount: 2,
  },
  {
    id: "agent-8",
    name: "Chloe Nguyen",
    initials: "CN",
    availability: "Offline",
    skills: ["Technical Support", "Logistics", "Customs"],
    activeCount: 0,
  },
];

const supervisorRoster: Agent[] = [
  {
    id: "sup-1",
    name: "Rachel Kim",
    initials: "RK",
    availability: "Available",
    skills: ["Escalations", "Enterprise Accounts", "Compliance"],
    activeCount: 3,
  },
  {
    id: "sup-2",
    name: "David Okafor",
    initials: "DO",
    availability: "Available",
    skills: ["Fraud", "Risk Management", "Wire Transfers"],
    activeCount: 2,
  },
  {
    id: "sup-3",
    name: "Sandra Howell",
    initials: "SH",
    availability: "In a Call",
    skills: ["Billing", "Licensing", "Contract Renewals"],
    activeCount: 4,
  },
  {
    id: "sup-4",
    name: "Tom Ellison",
    initials: "TE",
    availability: "Away",
    skills: ["Security", "Identity Management", "Escalations"],
    activeCount: 1,
  },
];

const availabilityOrder: Record<AgentAvailability, number> = {
  Available: 0,
  "In a Call": 1,
  Away: 2,
  Offline: 3,
};

const availabilityDot: Record<AgentAvailability, string> = {
  Available:  "bg-[#208337]",
  "In a Call": "bg-[#FFB800]",
  Away:       "bg-[#D0D5DD]",
  Offline:    "bg-[#98A2B3]",
};

// Score an agent against an issue's channel/priority to surface best matches
function scoreAgent(agent: Agent, priority: Priority, preview: string): number {
  const text = preview.toLowerCase();
  let score = 0;
  for (const skill of agent.skills) {
    if (text.includes(skill.toLowerCase().split(" ")[0])) score += 2;
  }
  if (priority === "Critical" || priority === "High") {
    if (agent.skills.some((s) => s.toLowerCase().includes("escalation"))) score += 3;
  }
  score -= agent.activeCount * 0.5;
  return score;
}

// ─── Smart popover positioning ───────────────────────────────────────────────
function getSmartPopoverPosition(
  triggerRect: DOMRect,
  popoverWidth: number,
  estimatedHeight: number,
  gap = 6,
  margin = 8,
) {
  const spaceBelow = window.innerHeight - triggerRect.bottom - gap - margin;
  const spaceAbove = triggerRect.top - gap - margin;
  const openBelow = spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove;
  const left = Math.max(margin, Math.min(triggerRect.left, window.innerWidth - popoverWidth - margin));
  if (openBelow) {
    return { left, top: triggerRect.bottom + gap, maxHeight: Math.max(160, spaceBelow), transform: "none" as const };
  }
  return { left, top: triggerRect.top - gap, maxHeight: Math.max(160, spaceAbove), transform: "translateY(-100%)" as const };
}

// ─── Transfer popover ─────────────────────────────────────────────────────────

type TransferTab = "Agents" | "Supervisors";

function RejectPopover({
  priority,
  preview,
  triggerRect,
  onClose,
  onAssign,
}: {
  priority: Priority;
  preview: string;
  triggerRect: DOMRect;
  onClose: () => void;
  onAssign: (agent: Agent) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [assigned, setAssigned] = useState<string | null>(null);
  const [tab, setTab] = useState<TransferTab>("Agents");

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const sortedAgents = [...agentRoster].sort((a, b) => {
    const avail = availabilityOrder[a.availability] - availabilityOrder[b.availability];
    if (avail !== 0) return avail;
    return scoreAgent(b, priority, preview) - scoreAgent(a, priority, preview);
  });

  const sortedSupervisors = [...supervisorRoster].sort((a, b) =>
    availabilityOrder[a.availability] - availabilityOrder[b.availability],
  );

  const roster = tab === "Agents" ? sortedAgents : sortedSupervisors;

  const handleAssign = (agent: Agent) => {
    setAssigned(agent.id);
    setTimeout(() => { onAssign(agent); onClose(); }, 800);
  };

  const POPOVER_WIDTH = 300;
  const ESTIMATED_HEIGHT = 370;
  const { left, top, maxHeight, transform } = getSmartPopoverPosition(triggerRect, POPOVER_WIDTH, ESTIMATED_HEIGHT);

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[9999] rounded-xl border border-border bg-white shadow-[0_8px_24px_rgba(16,24,40,0.12)] overflow-hidden"
      style={{ left, top, width: POPOVER_WIDTH, transform }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-semibold text-[#333333]">Transfer to</p>
        <button type="button" onClick={onClose} className="text-[#98A2B3] hover:text-[#475467] transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(["Agents", "Supervisors"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "relative flex-1 py-2.5 text-[12px] font-medium transition-colors",
              tab === t ? "text-[#6E56CF]" : "text-[#667085] hover:text-[#344054]",
            )}
          >
            {t}
            {tab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#6E56CF]" />
            )}
          </button>
        ))}
      </div>

      {/* Roster list */}
      <div className="overflow-y-auto divide-y divide-border" style={{ maxHeight: Math.min(224, maxHeight - 120) }}>
        {roster.map((agent) => {
          const isAssigned = assigned === agent.id;
          const isDisabled = agent.availability === "Offline" || (assigned !== null && !isAssigned);
          return (
            <button
              key={agent.id}
              type="button"
              disabled={isDisabled}
              onClick={() => handleAssign(agent)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                isAssigned ? "bg-[#F2F0FA]" : "hover:bg-[#F9FAFB]",
                isDisabled && "opacity-40 cursor-not-allowed",
              )}
            >
              <div className="relative shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F4F7] text-[11px] font-bold text-[#475467]">
                  {agent.initials}
                </div>
                <span className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white", availabilityDot[agent.availability])} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-semibold text-[#1D2939] truncate">{agent.name}</p>
                  {isAssigned && <span className="text-[10px] font-semibold text-[#6E56CF]">Transferred</span>}
                </div>
                <p className="text-[10px] text-[#98A2B3] truncate">{agent.skills.join(" · ")}</p>
              </div>
              <span className="shrink-0 text-[10px] text-[#667085]">{agent.activeCount} active</span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border bg-[#F9FAFB]">
        <p className="text-[10px] text-[#98A2B3]">Sorted by availability</p>
      </div>
    </div>,
    document.body,
  );
}

// ─── Row component ────────────────────────────────────────────────────────────

function IssueRow({
  id,
  name,
  customerId,
  customerRecordId,
  company,
  channel,
  priority,
  status,
  preview,
  waitTime,
  aiOverview,
  isLive,
  isAccepted,
  isClosed,
  isParkedFromToast,
  liveAssignmentId,
  onAccept,
  onReject,
  onReopen,
  onMonitor,
  isMonitored = false,
}: {
  id: string;
  name: string;
  customerId: string;
  customerRecordId?: string;
  company: string;
  channel: Channel;
  priority: Priority;
  status: QueueAssignmentStatus;
  preview: string;
  waitTime: string;
  aiOverview: AiOverview;
  isLive: boolean;
  isAccepted: boolean;
  isClosed: boolean;
  isParkedFromToast: boolean;
  liveAssignmentId: string | null;
  onAccept: () => void;
  onReject: () => void;
  onReopen: () => void;
  onMonitor: () => void;
  isMonitored?: boolean;
}) {
  const { selectAssignment } = useLayoutContext();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectTriggerRect, setRejectTriggerRect] = useState<DOMRect | null>(null);
  const rejectButtonRef = useRef<HTMLButtonElement>(null);
  const isInProgress = isAccepted && !isClosed;
  const [performActionsState, setPerformActionsState] = useState<"idle" | "running" | "done">("idle");
  const [performActionsCompletedCount, setPerformActionsCompletedCount] = useState(0);
  const performActionsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isCustomerProfileOpen, setIsCustomerProfileOpen] = useState(true);
  const [isAttemptedResolutionOpen, setIsAttemptedResolutionOpen] = useState(true);
  const customerRecord = customerRecordId ? getCustomerRecord(customerRecordId) : null;
  useEffect(() => () => { if (performActionsTimerRef.current) clearTimeout(performActionsTimerRef.current); }, []);

  return (
    <div className={cn("group/row border-b border-border last:border-b-0 relative", isMonitored && "bg-[#F2F0FA] dark:bg-[#1B1040]")}>
      {isMonitored && <div className="absolute left-0 inset-y-0 w-[3px] bg-[#6E56CF] rounded-r-full" />}
      {/* Header row — accordion toggle + hover-reveal action buttons */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIsOpen((v) => !v); } }}
        className={cn("w-full text-left flex items-center gap-3 px-5 py-4 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6E56CF]/30", isMonitored ? "hover:bg-[#E8E3F8] dark:hover:bg-[#231550]" : "hover:bg-[#F9FAFB]")}
      >
        {(isLive || (isAccepted && !isClosed)) && !isParkedFromToast && (
          <div className="shrink-0 relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#208337] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#208337]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-[#1D2939]">{name}</span>
            <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none", priorityStyles[priority])}>
              {priority}
            </span>
            <span className={cn(
              "rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none",
              status === "open"      && "border-[#B9E0B4] bg-[#F0FAF0] text-[#1E7B1E] dark:border-[#1E4A1E] dark:bg-[#0A2010] dark:text-[#4CAF50]",
              status === "pending"   && "border-[#D0D5DD] bg-[#F9FAFB] text-[#667085] dark:border-[#2A3448] dark:bg-[#151F30] dark:text-[#8898AB]",
              status === "resolved"  && "border-[#C8BFF0] bg-[#F2F0FA] text-[#6E56CF] dark:border-[#2D1F5E] dark:bg-[#1C1A2E] dark:text-[#C8BFF0]",
              status === "escalated" && "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A] dark:border-[#6B1A1A] dark:bg-[#2E0D0D] dark:text-[#F87171]",
            )}>
              {status}
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-[#475467] leading-[1.4] truncate">{preview}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#98A2B3]">
            <span>{company}</span>
            <span>•</span>
            <span>⏱ Wait: {waitTime}</span>
            <span>•</span>
            <span>{customerId}</span>
          </div>
        </div>

        {/* Action buttons — "In Progress" always visible; others revealed on hover or when open */}
        <div
          className={cn(
            "flex shrink-0 items-center gap-1.5 transition-opacity duration-150",
            isInProgress
              ? "opacity-100"
              : isOpen
                ? "opacity-100"
                : "opacity-0 pointer-events-none group-hover/row:opacity-100 group-hover/row:pointer-events-auto",
          )}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {showReject && rejectTriggerRect && (
            <RejectPopover
              priority={priority}
              preview={preview}
              triggerRect={rejectTriggerRect}
              onClose={() => setShowReject(false)}
              onAssign={() => { setShowReject(false); onReject(); }}
            />
          )}
          {isInProgress ? (
            <button
              type="button"
              onClick={() => {
                if (liveAssignmentId) {
                  selectAssignment(liveAssignmentId);
                  navigate("/activity");
                }
              }}
              className="rounded-md border border-[#C8BFF0] bg-[#F2F0FA] px-3 py-1 text-[11px] font-semibold text-[#6E56CF] hover:bg-[#DAEEFA] transition-colors"
            >
              In Progress
            </button>
          ) : !isAccepted && status === "open" ? (
            <>
              <button
                type="button"
                onClick={() => onMonitor()}
                className="rounded-md border border-border bg-white px-3 py-1 text-[11px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
              >
                Monitor
              </button>
              <button
                type="button"
                onClick={() => onAccept()}
                className="rounded-md bg-[#6E56CF] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#5C46B8] transition-colors"
              >
                Takeover
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onMonitor()}
                className="rounded-md border border-border bg-white px-3 py-1 text-[11px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
              >
                Monitor
              </button>
              <button
                type="button"
                onClick={() => onReopen()}
                className="rounded-md bg-[#6E56CF] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#5C46B8] transition-colors"
              >
                Takeover
              </button>
            </>
          )}
        </div>

        <ChevronDown className={cn(
          "h-4 w-4 shrink-0 text-[#98A2B3] transition-transform duration-200",
          isOpen && "rotate-180",
        )} />
      </div>

      {/* Accordion body */}
      <div className={cn(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none",
      )}>
        <div className="overflow-hidden">
          <div className="px-5 pb-4 pt-2 space-y-3">
            {/* Customer Profile — collapsible */}
            <div className="rounded-xl border border-[#C8BFF0] bg-[#F2F0FA] dark:border-[#1B3A52] dark:bg-[#0F2233] overflow-hidden">
              <button
                type="button"
                onClick={() => setIsCustomerProfileOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5C46B8] dark:text-[#5C46B8]">
                  Customer Profile
                </p>
                <ChevronDown className={cn("h-3.5 w-3.5 text-[#5C46B8] transition-transform duration-200 dark:text-[#5C46B8]", isCustomerProfileOpen && "rotate-180")} />
              </button>
              <div className={cn("grid transition-all duration-200 ease-out", isCustomerProfileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 space-y-3">
                    {customerRecord ? (
                      <>
                        {/* Identity row */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D5E8F3] text-[13px] font-bold text-[#5C46B8] dark:bg-[#1B3A52] dark:text-[#4BADD6]">
                              {name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-[#111827] dark:text-white leading-tight">{name}</p>
                              <p className="text-[11px] text-[#667085] dark:text-[#4E7D96] leading-snug">
                                {customerRecord.profile.department} · {customerRecord.profile.tenureYears} yr{customerRecord.profile.tenureYears !== 1 ? "s" : ""} tenure
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] text-[#98A2B3] dark:text-[#5C46B8]">Balance</p>
                            <p className="text-[13px] font-semibold text-[#111827] dark:text-white">{customerRecord.profile.totalAUM}</p>
                          </div>
                        </div>
                        {/* Stats row */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-white/60 border border-[#C8BFF0]/60 p-2.5 dark:bg-[#0C1A26] dark:border-[#1B3A52]">
                            <p className="mb-1 text-[10px] text-[#667085] dark:text-[#4E7D96]">Fraud Risk Score</p>
                            <p className={cn("text-[15px] font-bold leading-none mb-1.5", customerRecord.profile.fraudRiskScore >= 70 ? "text-[#E32926]" : customerRecord.profile.fraudRiskScore >= 40 ? "text-[#A37A00]" : "text-[#208337]")}>
                              {customerRecord.profile.fraudRiskScore} <span className="text-[11px] font-normal text-[#98A2B3]">/ 100</span>
                            </p>
                            <div className="h-1.5 rounded-full bg-[#E4E7EC] dark:bg-[#1B3A52] overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all", customerRecord.profile.fraudRiskScore >= 70 ? "bg-[#E32926]" : customerRecord.profile.fraudRiskScore >= 40 ? "bg-[#A37A00]" : "bg-[#208337]")}
                                style={{ width: `${customerRecord.profile.fraudRiskScore}%` }}
                              />
                            </div>
                          </div>
                          <div className="rounded-lg bg-white/60 border border-[#C8BFF0]/60 p-2.5 dark:bg-[#0C1A26] dark:border-[#1B3A52]">
                            <p className="mb-1 text-[10px] text-[#667085] dark:text-[#4E7D96]">Prior Disputes</p>
                            <p className="text-[15px] font-bold leading-none text-[#111827] dark:text-white">{customerRecord.profile.priorDisputeCount === 0 ? "None" : customerRecord.profile.priorDisputeCount}</p>
                            <p className={cn("mt-1 text-[10px]", customerRecord.profile.cardBlocked ? "text-[#E32926] font-medium" : "text-[#667085] dark:text-[#4E7D96]")}>
                              Card: {customerRecord.profile.cardBlocked ? "BLOCKED" : "NOT blocked"}
                            </p>
                          </div>
                        </div>
                        {/* Tags */}
                        {customerRecord.profile.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {customerRecord.profile.tags.map((tag) => (
                              <span
                                key={tag}
                                className={cn(
                                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                                  tag === "Premier" ? "bg-[#F2F0FA] text-[#5C46B8] border border-[#C8BFF0] dark:bg-[#1B3A52] dark:text-[#4BADD6]" :
                                  tag.includes("IVR") ? "bg-[#EFFBF1] text-[#208337] border border-[#24943E] dark:bg-[#0A1F0D] dark:text-[#208337]" :
                                  "bg-[#F4F3FF] text-[#5925DC] border border-[#D9D6FE] dark:bg-[#1A1040] dark:text-[#7A5AF8]",
                                )}
                              >
                                {tag}{(tag.includes("Auth") || tag.includes("Biometrics")) ? " ✓" : ""}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      /* Fallback for static assignments without a DB record */
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D5E8F3] text-[13px] font-bold text-[#5C46B8]">
                            {name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-[#111827] leading-tight">{name}</p>
                            <p className="text-[11px] text-[#667085] leading-snug">{company}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-[#98A2B3]">Customer ID</p>
                          <p className="text-[12px] font-medium text-[#475467]">{customerId}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Attempted Resolution — collapsible */}
            <div className="rounded-xl border border-[#C8BFF0] bg-[#F2F0FA] dark:border-[#1B3A52] dark:bg-[#0F2233] overflow-hidden">
              <button
                type="button"
                onClick={() => setIsAttemptedResolutionOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5C46B8] dark:text-[#5C46B8]">
                  Attempted Resolution
                </p>
                <ChevronDown className={cn("h-3.5 w-3.5 text-[#5C46B8] transition-transform duration-200 dark:text-[#5C46B8]", isAttemptedResolutionOpen && "rotate-180")} />
              </button>
              <div className={cn("grid transition-all duration-200 ease-out", isAttemptedResolutionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                  <div className="px-4 pb-4">
                    <ul className="space-y-2">
                      {aiOverview.actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-[#344054] dark:text-[#4E7D96] leading-relaxed">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#5C46B8] dark:bg-[#244D68]" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Resolved Row component ───────────────────────────────────────────────────

function formatResolvedTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function ResolvedIssueRow({ item, onTransfer, onOpen }: {
  item: ResolvedAssignment;
  onTransfer: (rect: DOMRect) => void;
  onOpen: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectTriggerRect, setRejectTriggerRect] = useState<DOMRect | null>(null);
  const rejectButtonRef = useRef<HTMLButtonElement>(null);
  const [isCustomerProfileOpen, setIsCustomerProfileOpen] = useState(true);
  const [isAttemptedResolutionOpen, setIsAttemptedResolutionOpen] = useState(true);
  const priorityKey = item.priority as Priority;
  const aiOverview = getLiveAiOverview(item.customerRecordId, item.name, item.preview, item.channel);
  const customerRecord = item.customerRecordId ? getCustomerRecord(item.customerRecordId) : null;

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full text-left flex items-start gap-3 px-5 py-4 hover:bg-[#F9FAFB] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-[#1D2939]">{item.name}</span>
            <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none", priorityStyles[priorityKey] ?? priorityStyles.Medium)}>
              {item.priority}
            </span>
            <span className="rounded border border-[#B9E0B4] bg-[#F0FAF0] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#1E7B1E]">
              resolved
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-[#475467] leading-[1.4] truncate">{item.preview}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#98A2B3]">
            <span className="capitalize">{item.channel}</span>
            <span>•</span>
            <span>Resolved at {formatResolvedTime(item.resolvedAt)}</span>
          </div>
        </div>
        <ChevronDown className={cn(
          "mt-1 h-4 w-4 shrink-0 text-[#98A2B3] transition-transform duration-200",
          isOpen && "rotate-180",
        )} />
      </button>

      {/* Accordion body */}
      <div className={cn(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none",
      )}>
        <div className="overflow-hidden">
          <div className="px-5 pb-4 pt-2 space-y-3">
            {/* Customer Profile — collapsible */}
            <div className="rounded-xl border border-[#C8BFF0] bg-[#F2F0FA] dark:border-[#1B3A52] dark:bg-[#0F2233] overflow-hidden">
              <button
                type="button"
                onClick={() => setIsCustomerProfileOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5C46B8] dark:text-[#5C46B8]">Customer Profile</p>
                <ChevronDown className={cn("h-3.5 w-3.5 text-[#5C46B8] transition-transform duration-200 dark:text-[#5C46B8]", isCustomerProfileOpen && "rotate-180")} />
              </button>
              <div className={cn("grid transition-all duration-200 ease-out", isCustomerProfileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 space-y-3">
                    {customerRecord ? (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D5E8F3] text-[13px] font-bold text-[#5C46B8] dark:bg-[#1B3A52] dark:text-[#4BADD6]">
                              {name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-[#111827] dark:text-white leading-tight">{name}</p>
                              <p className="text-[11px] text-[#667085] dark:text-[#4E7D96] leading-snug">
                                {customerRecord.profile.department} · {customerRecord.profile.tenureYears} yr{customerRecord.profile.tenureYears !== 1 ? "s" : ""} tenure
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] text-[#98A2B3] dark:text-[#5C46B8]">Balance</p>
                            <p className="text-[13px] font-semibold text-[#111827] dark:text-white">{customerRecord.profile.totalAUM}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-white/60 border border-[#C8BFF0]/60 p-2.5 dark:bg-[#0C1A26] dark:border-[#1B3A52]">
                            <p className="mb-1 text-[10px] text-[#667085] dark:text-[#4E7D96]">Fraud Risk Score</p>
                            <p className={cn("text-[15px] font-bold leading-none mb-1.5", customerRecord.profile.fraudRiskScore >= 70 ? "text-[#E32926]" : customerRecord.profile.fraudRiskScore >= 40 ? "text-[#A37A00]" : "text-[#208337]")}>
                              {customerRecord.profile.fraudRiskScore} <span className="text-[11px] font-normal text-[#98A2B3]">/ 100</span>
                            </p>
                            <div className="h-1.5 rounded-full bg-[#E4E7EC] dark:bg-[#1B3A52] overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all", customerRecord.profile.fraudRiskScore >= 70 ? "bg-[#E32926]" : customerRecord.profile.fraudRiskScore >= 40 ? "bg-[#A37A00]" : "bg-[#208337]")}
                                style={{ width: `${customerRecord.profile.fraudRiskScore}%` }}
                              />
                            </div>
                          </div>
                          <div className="rounded-lg bg-white/60 border border-[#C8BFF0]/60 p-2.5 dark:bg-[#0C1A26] dark:border-[#1B3A52]">
                            <p className="mb-1 text-[10px] text-[#667085] dark:text-[#4E7D96]">Prior Disputes</p>
                            <p className="text-[15px] font-bold leading-none text-[#111827] dark:text-white">{customerRecord.profile.priorDisputeCount === 0 ? "None" : customerRecord.profile.priorDisputeCount}</p>
                            <p className={cn("mt-1 text-[10px]", customerRecord.profile.cardBlocked ? "text-[#E32926] font-medium" : "text-[#667085] dark:text-[#4E7D96]")}>
                              Card: {customerRecord.profile.cardBlocked ? "BLOCKED" : "NOT blocked"}
                            </p>
                          </div>
                        </div>
                        {customerRecord.profile.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {customerRecord.profile.tags.map((tag) => (
                              <span
                                key={tag}
                                className={cn(
                                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                                  tag === "Premier" ? "bg-[#F2F0FA] text-[#5C46B8] border border-[#C8BFF0]" :
                                  tag.includes("IVR") ? "bg-[#EFFBF1] text-[#208337] border border-[#24943E]" :
                                  "bg-[#F4F3FF] text-[#5925DC] border border-[#D9D6FE]",
                                )}
                              >
                                {tag}{(tag.includes("Auth") || tag.includes("Biometrics")) ? " ✓" : ""}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D5E8F3] text-[13px] font-bold text-[#5C46B8]">
                            {item.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-[#111827] leading-tight">{item.name}</p>
                            <p className="text-[11px] text-[#667085] leading-snug capitalize">{item.channel}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-[#98A2B3]">Resolved</p>
                          <p className="text-[12px] font-medium text-[#475467]">{formatResolvedTime(item.resolvedAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Attempted Resolution — collapsible */}
            <div className="rounded-xl border border-[#C8BFF0] bg-[#F2F0FA] dark:border-[#1B3A52] dark:bg-[#0F2233] overflow-hidden">
              <button
                type="button"
                onClick={() => setIsAttemptedResolutionOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5C46B8] dark:text-[#5C46B8]">Attempted Resolution</p>
                <ChevronDown className={cn("h-3.5 w-3.5 text-[#5C46B8] transition-transform duration-200 dark:text-[#5C46B8]", isAttemptedResolutionOpen && "rotate-180")} />
              </button>
              <div className={cn("grid transition-all duration-200 ease-out", isAttemptedResolutionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                  <div className="px-4 pb-4">
                    <ul className="space-y-2">
                      {aiOverview.actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-[#344054] dark:text-[#4E7D96] leading-relaxed">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#5C46B8] dark:bg-[#244D68]" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Transfer / Open actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              {showReject && rejectTriggerRect && (
                <RejectPopover
                  priority={priorityKey}
                  preview={item.preview}
                  triggerRect={rejectTriggerRect}
                  onClose={() => setShowReject(false)}
                  onAssign={() => { setShowReject(false); }}
                />
              )}
              <button
                ref={rejectButtonRef}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = rejectButtonRef.current?.getBoundingClientRect();
                  if (rect) { setRejectTriggerRect(rect); setShowReject((v) => !v); }
                }}
                className="rounded-md border border-border bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
              >
                Monitor
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onOpen(); }}
                className="rounded-md bg-[#6E56CF] px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-[#5C46B8] transition-colors"
              >
                Takeover
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_AGENT_NAME = "Jeff Comstock";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ControlCenterPage() {
  const { resolvedAssignments, assignmentStatusesById, acceptIssue, visibleAssignments, setAssignmentStatus, selectAssignment, openCopilot } = useLayoutContext();
  const navigate = useNavigate();
  const [activePageTab, setActivePageTab] = useState<DeskPageTab>("queue");
  const [issueTab, setIssueTab] = useState<IssueTab>("open");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [isChannelFilterOpen, setIsChannelFilterOpen] = useState(false);
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  // Trigger re-renders when acceptedStaticsStore changes (the store itself lives at module scope
  // so it survives remounts when the agent navigates away and back).
  const [, forceUpdate] = useState(0);
  const [monitoredCase, setMonitoredCase] = useState<RowData | null>(null);

  const rejectIssue = (id: string) => setRejectedIds((prev) => new Set([...prev, id]));

  const handleAcceptStatic = (a: StaticAssignment, statusOverride?: QueueAssignmentStatus) => {
    const data: AcceptIssueData = {
      id: a.id,
      name: a.name,
      customerId: a.customerId,
      customerRecordId: a.customerRecordId,
      channel: a.channel,
      priority: a.priority,
      preview: a.preview,
      status: statusOverride ?? a.status,
      waitTime: a.waitTime,
      isOutbound: true,
      onCreated: (assignmentId) => {
        acceptedStaticsStore.set(a.id, assignmentId);
        forceUpdate((v) => v + 1);
      },
    };
    acceptIssue(data);
  };

  type RowData = StaticAssignment & {
    isLive: boolean;
    isAccepted: boolean;
    isClosed: boolean;
    isParkedFromToast: boolean;
    liveAssignmentId: string | null;
    onAccept: () => void;
    onReject: () => void;
    onReopen: () => void;
    onMonitor: () => void;
  };

  // Static tasks — status syncs with the live assignment when accepted.
  // isClosed = the task was accepted but the assignment has since been removed from the left rail.
  // Voice-channel tasks are excluded from the static list — they only appear when
  // an agent explicitly accepts a voice transfer from the assignments panel.
  const staticNormalised: RowData[] = staticAssignments.filter((a) => a.channel !== "voice").map((a) => {
    const assignmentId = acceptedStaticsStore.get(a.id);
    const liveStatus = assignmentId ? (assignmentStatusesById[assignmentId] as QueueAssignmentStatus | undefined) : undefined;
    const isAccepted = acceptedStaticsStore.has(a.id);
    const isClosed = isAccepted && !!assignmentId && !visibleAssignments.some((v) => v.id === assignmentId);
    const row: RowData = {
      ...a,
      status: liveStatus ?? a.status,
      isLive: false,
      isAccepted,
      isClosed,
      isParkedFromToast: false,
      liveAssignmentId: assignmentId ?? null,
      onAccept: () => handleAcceptStatic(a),
      onReject: () => rejectIssue(a.id),
      onReopen: () => handleAcceptStatic(a, liveStatus ?? a.status),
      onMonitor: () => setMonitoredCase(row),
    };
    return row;
  });

  // Live assignments currently open in the left rail. Exclude dynamically-created
  // assignments (from acceptIssue → "issue-" prefix, or openCustomerConversation →
  // contains a millisecond timestamp) to avoid duplicating static-task entries.
  const acceptedAssignmentIds = new Set(acceptedStaticsStore.values());
  const validPriorities = new Set<string>(["Critical", "High", "Medium", "Low"]);
  const liveNormalised: RowData[] = visibleAssignments
    .filter((a) => !acceptedAssignmentIds.has(a.id) && !/\d{10,}/.test(a.id))
    .map((a) => {
      const liveStatus = (assignmentStatusesById[a.id] as QueueAssignmentStatus | undefined) ?? "open";
      const isParkedFromToast = liveStatus === "parked";
      // Parked items are held out of the left rail but belong in the Open queue tab.
      // Show them as unaccepted "open" rows so the agent can Accept them later.
      const displayStatus = isParkedFromToast ? "open" : liveStatus;
      const priority = (validPriorities.has(a.priority) ? a.priority : "Medium") as Priority;
      return {
        id: a.id,
        name: a.name,
        customerId: a.customerId,
        customerRecordId: a.customerRecordId,
        company: companyByCustomerId[a.customerRecordId] ?? a.name,
        channel: a.channel as Channel,
        priority,
        status: displayStatus as QueueAssignmentStatus,
        preview: a.preview,
        waitTime: a.time,
        aiOverview: getLiveAiOverview(a.customerRecordId, a.name, a.preview, a.channel),
        isLive: true,
        isAccepted: !isParkedFromToast,
        isClosed: false,
        isParkedFromToast,
        liveAssignmentId: a.id,
        onAccept: isParkedFromToast
          ? () => { setAssignmentStatus(a.id, "open"); selectAssignment(a.id); navigate("/activity"); }
          : () => {},
        onReject: () => {},
        onReopen: () => {},
        onMonitor: () => {},
      };
    });

  const baseRows = [...liveNormalised, ...staticNormalised]
    .filter((a) => !rejectedIds.has(a.id))
    .filter((a) => a.channel !== "email")
    .filter((a) => priorityFilter === "all" || a.priority === priorityFilter)
    .filter((a) => channelFilter === "all" || a.channel === channelFilter);

  const allRows = baseRows
    .filter((a) => a.status === issueTab)
    .sort((a, b) => (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99));

  const filteredResolvedAssignments = resolvedAssignments.filter(
    (r) => r.channel !== "email" &&
            (priorityFilter === "all" || r.priority === priorityFilter) &&
            (channelFilter === "all" || r.channel === channelFilter),
  );

  // Number of items parked from a toast — used for the red Queue tab badge
  const parkedCount = liveNormalised.filter((a) => a.isParkedFromToast).length;

  // Per-tab counts for badges
  const tabCounts: Record<IssueTab, number> = {
    open: baseRows.filter((a) => a.status === "open").length,
    pending: baseRows.filter((a) => a.status === "pending").length,
    resolved: baseRows.filter((a) => a.status === "resolved").length + filteredResolvedAssignments.length,
    escalated: baseRows.filter((a) => a.status === "escalated").length,
  };
  const totalTasks = tabCounts.open + tabCounts.pending + tabCounts.resolved + tabCounts.escalated;

  return (
    <div className="flex h-full flex-col">
      {/* ── Queue tab ─────────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="flex gap-5 h-full">

          {/* ── Left sidebar: My Day / Schedule / Performance / Messages ── */}
          <div className="hidden flex w-[280px] shrink-0 flex-col gap-3 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

            {/* AI Day Summary card */}
            {(() => {
              const criticalCount  = baseRows.filter((a) => a.priority === "Critical").length;
              const highCount      = baseRows.filter((a) => a.priority === "High").length;
              const openCount      = tabCounts.open;
              const resolvedCount  = tabCounts.resolved;
              const pendingCount   = tabCounts.pending;

              const urgencyPhrase =
                criticalCount > 0
                  ? `You have ${criticalCount} critical case${criticalCount > 1 ? "s" : ""} that need${criticalCount === 1 ? "s" : ""} immediate attention`
                  : highCount > 0
                  ? `You have ${highCount} high-priority case${highCount > 1 ? "s" : ""} to address early`
                  : `Your queue is manageable today`;

              const progressPhrase =
                resolvedCount > 0
                  ? `You've already resolved ${resolvedCount} case${resolvedCount > 1 ? "s" : ""}, which is a strong start.`
                  : `No cases have been resolved yet — focus on closing out your open items first.`;

              const pipelinePhrase =
                openCount + pendingCount > 0
                  ? `With ${openCount} open and ${pendingCount} pending, prioritise clearing blockers before your 09:00 callback.`
                  : `Your pipeline is clear — a good opportunity to get ahead on documentation and follow-ups.`;

              const summary = `${urgencyPhrase}. ${progressPhrase} ${pipelinePhrase} Keep an eye on handle time and aim to wrap responses within SLA windows.`;

              return (
                <div className="rounded-xl border border-[#C8BFF0]/60 bg-[#F5F3FF] dark:bg-[#18143A] dark:border-[#3D2F7A]/60 shadow-sm p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6E56CF] shadow-sm">
                      <Clock className="h-3.5 w-3.5 text-white stroke-[1.75]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#4C3898] dark:text-[#C8BFF0] leading-none">My Day</p>
                      <p className="text-[10px] text-[#7C5CBF] dark:text-[#8B78D0] mt-0.5">Your day at a glance</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCopilot()}
                      className="shrink-0 flex items-center gap-1 rounded-full border border-[#6E56CF]/30 bg-[#6E56CF]/10 hover:bg-[#6E56CF]/20 px-2 py-0.5 text-[10px] font-semibold text-[#6E56CF] dark:text-[#C8BFF0] transition-colors"
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      AI Help
                    </button>
                  </div>
                  <p className="text-[12px] leading-[1.65] text-[#4C3898] dark:text-[#B4A8E8]">
                    {summary}
                  </p>
                </div>
              );
            })()}

            {/* Schedule card */}
            <div className="rounded-xl border border-border bg-white dark:bg-[#0F1629] shadow-sm p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] dark:bg-[#1C2A3A]">
                  <CalendarCheck className="h-3.5 w-3.5 text-[#6E56CF]" />
                </div>
                <span className="text-[13px] font-semibold text-[#333333] dark:text-[#E2E8F0]">Schedule</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#667085] dark:text-[#8898AB]">Total Events</span>
                  <span className="text-[12px] font-semibold text-[#333333] dark:text-[#E2E8F0]">6</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#667085] dark:text-[#8898AB]">Callbacks</span>
                  <span className="text-[12px] font-semibold text-[#E32926]">3</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[11px] text-[#98A2B3] dark:text-[#64748B] mb-0.5">Next up:</p>
                <p className="text-[12px] font-semibold text-[#333333] dark:text-[#E2E8F0]">Customer Callback</p>
                <p className="text-[11px] text-[#667085] dark:text-[#8898AB]">09:00 AM</p>
              </div>
            </div>

            {/* Performance card */}
            <div className="rounded-xl border border-border bg-white dark:bg-[#0F1629] shadow-sm p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ECFDF5] dark:bg-[#0A2318]">
                  <TrendingUp className="h-3.5 w-3.5 text-[#208337]" />
                </div>
                <span className="text-[13px] font-semibold text-[#333333] dark:text-[#E2E8F0]">Performance</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#667085] dark:text-[#8898AB]">Cases Resolved</span>
                  <span className="text-[12px] font-semibold text-[#333333] dark:text-[#E2E8F0]">
                    {tabCounts.resolved}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#667085] dark:text-[#8898AB]">CSAT Score</span>
                  <span className="text-[12px] font-semibold text-[#208337]">4.8</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[11px] text-[#98A2B3] dark:text-[#64748B] mb-0.5">Handle Time:</p>
                <p className="text-[12px] font-semibold text-[#333333] dark:text-[#E2E8F0]">8m 32s</p>
                <p className="text-[11px] font-medium text-[#208337]">↑ 15% improvement</p>
              </div>
            </div>

            {/* Messages card */}
            <div className="rounded-xl border border-border bg-white dark:bg-[#0F1629] shadow-sm p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F5F3FF] dark:bg-[#1C2036]">
                  <MessageCircle className="h-3.5 w-3.5 text-[#6E56CF]" />
                </div>
                <span className="text-[13px] font-semibold text-[#333333] dark:text-[#E2E8F0]">Messages</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#667085] dark:text-[#8898AB]">Unread</span>
                  <span className="text-[12px] font-semibold text-[#333333] dark:text-[#E2E8F0]">3</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[11px] text-[#98A2B3] dark:text-[#64748B] mb-0.5">Latest from:</p>
                <p className="text-[12px] font-semibold text-[#333333] dark:text-[#E2E8F0]">Emma Larsen</p>
                <p className="text-[11px] text-[#667085] dark:text-[#8898AB] truncate">CSAT scores look great this week</p>
              </div>
            </div>

          </div>

          {/* Tasks card */}
          <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
            {/* Header: title + tabs + filters */}
            <div className="shrink-0 px-5 pt-4 pb-0">
              <div className="flex items-center justify-between gap-3 mb-3">
                {/* Status tabs */}
                <div className="inline-flex items-center rounded-xl bg-[#F2F4F7] dark:bg-[#0D1525] p-1 gap-0.5 shrink-0">
                  {(["escalated", "open", "pending", "resolved"] as const).map((tab) => {
                    const tabLabels: Record<typeof tab, string> = {
                      escalated: "Escalated",
                      open: "Active Virtual Agents",
                      pending: "Pending",
                      resolved: "Resolved",
                    };
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setIssueTab(tab)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all duration-150 whitespace-nowrap",
                          issueTab === tab
                            ? "bg-white dark:bg-[#1C2A3A] text-[#101828] dark:text-[#E2E8F0] shadow-sm"
                            : "text-[#667085] dark:text-[#8898AB] hover:text-[#333333] dark:hover:text-[#CBD5E1]",
                        )}
                      >
                        {tabLabels[tab]}
                        <span className={cn(
                          "inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[10px] font-semibold transition-colors",
                          issueTab === tab
                            ? "bg-[#6E56CF] text-white"
                            : "bg-[#E4E7EC] dark:bg-[#2A3448] text-[#667085] dark:text-[#94A3B8]",
                        )}>
                          {tabCounts[tab]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 ml-auto">
                  {/* Channel filter */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setIsChannelFilterOpen((v) => !v); setIsFilterOpen(false); }}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors",
                        channelFilter !== "all"
                          ? "border-[#6E56CF]/40 bg-[#F2F0FA] text-[#6E56CF] hover:bg-[#EAE7F8]"
                          : "border-border bg-white text-[#333333] hover:bg-[#F9FAFB]",
                      )}
                    >
                      {channelFilterOptions.find((o) => o.value === channelFilter)?.label ?? "All Channels"}
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-150", isChannelFilterOpen && "rotate-180", channelFilter !== "all" ? "text-[#6E56CF]" : "text-[#7A7A7A]")} />
                    </button>
                    {isChannelFilterOpen && (
                      <div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-lg border border-border bg-white shadow-lg py-1">
                        {channelFilterOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => { setChannelFilter(option.value); setIsChannelFilterOpen(false); }}
                            className={cn(
                              "w-full text-left px-3 py-2 text-[12px] hover:bg-[#F9FAFB] transition-colors",
                              channelFilter === option.value ? "font-semibold text-[#6E56CF]" : "text-[#333333]",
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Priority filter */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setIsFilterOpen((v) => !v); setIsChannelFilterOpen(false); }}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors",
                        priorityFilter !== "all"
                          ? "border-[#6E56CF]/40 bg-[#F2F0FA] text-[#6E56CF] hover:bg-[#EAE7F8]"
                          : "border-border bg-white text-[#333333] hover:bg-[#F9FAFB]",
                      )}
                    >
                      {priorityFilterOptions.find((o) => o.value === priorityFilter)?.label ?? "All Priorities"}
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-150", isFilterOpen && "rotate-180", priorityFilter !== "all" ? "text-[#6E56CF]" : "text-[#7A7A7A]")} />
                    </button>
                    {isFilterOpen && (
                      <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border border-border bg-white shadow-lg py-1">
                        {priorityFilterOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => { setPriorityFilter(option.value); setIsFilterOpen(false); }}
                            className={cn(
                              "w-full text-left px-3 py-2 text-[12px] hover:bg-[#F9FAFB] transition-colors",
                              priorityFilter === option.value ? "font-semibold text-[#6E56CF]" : "text-[#333333]",
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {issueTab === "resolved" ? (
                allRows.length === 0 && filteredResolvedAssignments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle className="h-8 w-8 text-[#D0D5DD] mb-3" />
                    <p className="text-sm font-medium text-[#7A7A7A]">No resolved tasks</p>
                    <p className="text-xs text-[#B0B7C3] mt-1">Cases you resolve today will appear here.</p>
                  </div>
                ) : (
                  <>
                    {filteredResolvedAssignments.map((item) => (
                      <ResolvedIssueRow
                        key={item.id}
                        item={item}
                        onTransfer={() => {}}
                        onOpen={() => acceptIssue({
                          id: item.id,
                          name: item.name,
                          customerId: item.customerRecordId,
                          channel: item.channel,
                          priority: item.priority,
                          preview: item.preview,
                          status: "open",
                          waitTime: "",
                          isOutbound: true,
                        })}
                      />
                    ))}
                    {allRows.map((a) => (
                      <IssueRow key={a.id} {...a} isMonitored={monitoredCase?.id === a.id} />
                    ))}
                  </>
                )
              ) : (
                allRows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle className="h-8 w-8 text-[#D0D5DD] mb-3" />
                    <p className="text-sm font-medium text-[#7A7A7A] capitalize">No {issueTab} tasks</p>
                    <p className="text-xs text-[#B0B7C3] mt-1">No tasks match the selected filter.</p>
                  </div>
                ) : (
                  allRows.map((a) => (
                    <IssueRow key={a.id} {...a} isMonitored={monitoredCase?.id === a.id} />
                  ))
                )
              )}
            </div>
          </div>

          {/* Monitor panel — slides in from the right */}
          {monitoredCase && (
            <div className="w-[480px] flex-shrink-0 h-full flex flex-col border-l border-border bg-white rounded-lg overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E0DBF5] text-[12px] font-bold text-[#5C46B8]">
                    {monitoredCase.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#111827]">{monitoredCase.name}</p>
                    <p className="text-[11px] text-[#667085]">Customer ID {monitoredCase.customerId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF3] px-2.5 py-1 text-[11px] font-medium text-[#027A48]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#12B76A] animate-pulse" />
                    Monitoring
                  </span>
                  <button
                    type="button"
                    onClick={() => setMonitoredCase(null)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[#98A2B3] hover:bg-[#F2F4F7] hover:text-[#344054] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>

              {/* Conversation feed — real data from customer database */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {(() => {
                  const channel = (monitoredCase.channel === "sms" ? "sms" : "chat") as "chat" | "sms";
                  const conversation = monitoredCase.customerRecordId
                    ? createConversationState(monitoredCase.customerRecordId, channel)
                    : { customerName: monitoredCase.name, label: "Chat", timelineLabel: "", status: "open" as const, draft: "", messages: [{ id: 1, role: "customer" as const, content: monitoredCase.preview, time: monitoredCase.waitTime || "now" }], isCustomerTyping: false };
                  return (
                    <ConversationPanel
                      key={monitoredCase.id}
                      conversation={conversation}
                      activeChannel={channel}
                      openChannels={[channel]}
                      customerId={monitoredCase.customerRecordId}
                      showAiPanel={false}
                      hideTranscript={false}
                      isPendingAcceptance={false}
                      onSelectChannel={() => {}}
                      onConversationChange={() => {}}
                    />
                  );
                })()}
              </div>

              {/* Takeover footer */}
              <div className="shrink-0 border-t border-border px-5 py-3 flex items-center justify-between gap-3 bg-white">
                <p className="text-[12px] text-[#667085]">You are monitoring this conversation</p>
                <button
                  type="button"
                  onClick={() => { handleAcceptStatic(monitoredCase as any); setMonitoredCase(null); }}
                  className="rounded-lg bg-[#6E56CF] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#5C46B8] transition-colors"
                >
                  Takeover
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
      {/* Other tabs hidden but code preserved for future use
      {activePageTab === "customers" && (
        <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
          <DeskDataTable defaultTab="Customers" hideTabs />
        </div>
      )}
      {activePageTab === "tickets" && (
        <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
          <DeskDataTable defaultTab="Tickets" hideTabs />
        </div>
      )}
      {activePageTab === "accounts" && (
        <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
          <DeskDataTable defaultTab="Accounts" hideTabs />
        </div>
      )}
      {activePageTab === "contact-history" && (
        <div className="min-h-0 flex-1 overflow-hidden flex flex-col items-center justify-center gap-3 text-center p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F2F4F7]">
            <Phone className="h-6 w-6 text-[#98A2B3]" />
          </div>
          <p className="text-[14px] font-semibold text-[#344054]">Contact History</p>
          <p className="text-[13px] text-[#98A2B3] max-w-xs">A full log of all customer contact interactions will appear here. Coming soon.</p>
        </div>
      )}
      */}

    </div>
  );
}
