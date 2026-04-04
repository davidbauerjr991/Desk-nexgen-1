import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  X,
} from "lucide-react";
import { useLayoutContext, type QueueAssignmentStatus, type AcceptIssueData, type ResolvedAssignment } from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Channel = "chat" | "sms" | "email" | "voice";
type Priority = "Critical" | "High" | "Medium" | "Low";

interface AiOverview {
  actions: string[];
  whyNeeded: string;
}

interface StaticAssignment {
  id: string;
  name: string;
  customerId: string;
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
  Critical: "border-[#FECACA] bg-[#FEF2F2] text-[#B42318]",
  High:     "border-[#F79009] bg-[#FFFAEB] text-[#B54708]",
  Medium:   "border-[#B8D7F0] bg-[#EEF6FC] text-[#006DAD]",
  Low:      "border-[#B7E6DD] bg-[#EAF8F4] text-[#369D3F]",
};

const priorityRank: Record<Priority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const channelIconMap = {
  chat:  MessageCircle,
  sms:   MessageSquare,
  email: Mail,
  voice: Phone,
} as const;

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
  },
};

// ─── Static assignments (16) ──────────────────────────────────────────────────

const staticAssignments: StaticAssignment[] = [
  {
    id: "static-1",
    name: "Maria Chen",
    customerId: "CST-10482",
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
    },
  },
  {
    id: "static-2",
    name: "James Whitfield",
    customerId: "CST-10591",
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
    },
  },
  {
    id: "static-3",
    name: "Priya Sharma",
    customerId: "CST-10814",
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
    },
  },
  {
    id: "static-4",
    name: "Robert Okafor",
    customerId: "CST-10363",
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
    },
  },
  {
    id: "static-5",
    name: "Lisa Montenegro",
    customerId: "CST-11024",
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
    },
  },
  {
    id: "static-6",
    name: "Kevin Tran",
    customerId: "CST-11130",
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
    },
  },
  {
    id: "static-7",
    name: "Angela Russo",
    customerId: "CST-11247",
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
    },
  },
  {
    id: "static-8",
    name: "Marcus Bell",
    customerId: "CST-11389",
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
    }),
  },
  {
    id: "static-9",
    name: "Sandra Yip",
    customerId: "CST-11412",
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
    },
  },
  {
    id: "static-10",
    name: "Derek Owens",
    customerId: "CST-11508",
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
    },
  },
  {
    id: "static-11",
    name: "Fatima Al-Rashid",
    customerId: "CST-11621",
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
    },
  },
  {
    id: "static-12",
    name: "Tom Hargrove",
    customerId: "CST-11734",
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
    },
  },
  {
    id: "static-13",
    name: "Nadia Petrov",
    customerId: "CST-11856",
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
    },
  },
  {
    id: "static-14",
    name: "Carlos Mendez",
    customerId: "CST-11972",
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
    },
  },
  {
    id: "static-15",
    name: "Ingrid Holmberg",
    customerId: "CST-12045",
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
    },
  },
  {
    id: "static-16",
    name: "Darius Knox",
    customerId: "CST-12187",
    company: "Pinnacle Wealth Advisors",
    channel: "chat",
    priority: "Critical",
    status: "open",
    preview: "Client funds transferred to wrong account — urgent reversal",
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

type IssueTab = "open" | "pending" | "resolved" | "escalated";

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
    name: "Jordan Doe",
    initials: "JD",
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

const availabilityOrder: Record<AgentAvailability, number> = {
  Available: 0,
  "In a Call": 1,
  Away: 2,
  Offline: 3,
};

const availabilityDot: Record<AgentAvailability, string> = {
  Available:  "bg-[#12B76A]",
  "In a Call": "bg-[#F79009]",
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

// ─── Reject popover ───────────────────────────────────────────────────────────

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

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const sorted = [...agentRoster].sort((a, b) => {
    const avail = availabilityOrder[a.availability] - availabilityOrder[b.availability];
    if (avail !== 0) return avail;
    return scoreAgent(b, priority, preview) - scoreAgent(a, priority, preview);
  });

  const handleAssign = (agent: Agent) => {
    setAssigned(agent.id);
    setTimeout(() => { onAssign(agent); onClose(); }, 800);
  };

  const POPOVER_WIDTH = 288; // w-72
  const GAP = 8;
  const left = Math.max(8, Math.min(triggerRect.right - POPOVER_WIDTH, window.innerWidth - POPOVER_WIDTH - 8));
  const top = triggerRect.top - GAP;

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[9999] w-72 rounded-xl border border-border bg-white shadow-[0_8px_24px_rgba(16,24,40,0.12)] overflow-hidden"
      style={{ left, top, transform: "translateY(-100%)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-semibold text-[#333333]">Assign to Agent</p>
        <button type="button" onClick={onClose} className="text-[#98A2B3] hover:text-[#475467] transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Agent list */}
      <div className="max-h-64 overflow-y-auto divide-y divide-border">
        {sorted.map((agent) => {
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
                isAssigned ? "bg-[#EEF6FC]" : "hover:bg-[#F9FAFB]",
                isDisabled && "opacity-40 cursor-not-allowed",
              )}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F4F7] text-[11px] font-bold text-[#475467]">
                  {agent.initials}
                </div>
                <span className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white", availabilityDot[agent.availability])} />
              </div>

              {/* Name + skills */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-semibold text-[#1D2939] truncate">{agent.name}</p>
                  {isAssigned && (
                    <span className="text-[10px] font-semibold text-[#006DAD]">Assigned</span>
                  )}
                </div>
                <p className="text-[10px] text-[#98A2B3] truncate">{agent.skills.join(" · ")}</p>
              </div>

              {/* Load badge */}
              <span className="shrink-0 text-[10px] text-[#667085]">{agent.activeCount} active</span>
            </button>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="px-4 py-2.5 border-t border-border bg-[#F9FAFB]">
        <p className="text-[10px] text-[#98A2B3]">Sorted by availability and skill match</p>
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
  liveAssignmentId,
  onAccept,
  onReject,
  onReopen,
}: {
  id: string;
  name: string;
  customerId: string;
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
  liveAssignmentId: string | null;
  onAccept: () => void;
  onReject: () => void;
  onReopen: () => void;
}) {
  const { selectAssignment } = useLayoutContext();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectTriggerRect, setRejectTriggerRect] = useState<DOMRect | null>(null);
  const rejectButtonRef = useRef<HTMLButtonElement>(null);
  const isInProgress = isAccepted && !isClosed;

  return (
    <div className="group/row border-b border-border last:border-b-0">
      {/* Header row — accordion toggle + hover-reveal action buttons */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIsOpen((v) => !v); } }}
        className="w-full text-left flex items-center gap-3 px-5 py-4 hover:bg-[#F9FAFB] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#006DAD]/30"
      >
        {(isLive || (isAccepted && !isClosed)) && (
          <div className="shrink-0 relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#12B76A] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#12B76A]" />
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
              status === "open"      && "border-[#B9E0B4] bg-[#F0FAF0] text-[#1E7B1E]",
              status === "pending"   && "border-[#D0D5DD] bg-[#F9FAFB] text-[#667085]",
              status === "resolved"  && "border-[#B8D7F0] bg-[#EEF6FC] text-[#006DAD]",
              status === "escalated" && "border-[#FECACA] bg-[#FEF2F2] text-[#B42318]",
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
              className="rounded-md border border-[#B8D7F0] bg-[#EEF6FC] px-3 py-1 text-[11px] font-semibold text-[#006DAD] hover:bg-[#DAEEFA] transition-colors"
            >
              In Progress
            </button>
          ) : !isAccepted && status === "open" ? (
            <>
              <button
                ref={rejectButtonRef}
                type="button"
                onClick={() => {
                  setRejectTriggerRect(rejectButtonRef.current?.getBoundingClientRect() ?? null);
                  setShowReject((v) => !v);
                }}
                className="rounded-md border border-border bg-white px-3 py-1 text-[11px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => onAccept()}
                className="rounded-md bg-[#006DAD] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#005d94] transition-colors"
              >
                Accept
              </button>
            </>
          ) : (
            <>
              <button
                ref={rejectButtonRef}
                type="button"
                onClick={() => {
                  setRejectTriggerRect(rejectButtonRef.current?.getBoundingClientRect() ?? null);
                  setShowReject((v) => !v);
                }}
                className="rounded-md border border-border bg-white px-3 py-1 text-[11px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
              >
                Transfer
              </button>
              <button
                type="button"
                onClick={() => onReopen()}
                className="rounded-md bg-[#006DAD] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#005d94] transition-colors"
              >
                Open
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
          <div className="px-5 pb-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              {/* Overview */}
              <div className="rounded-lg border border-[#B8D7F0] bg-[#EEF6FC] p-3.5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#006DAD]">
                  Overview
                </p>
                <ul className="space-y-1.5">
                  {aiOverview.actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11.5px] text-[#344054] leading-relaxed">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#006DAD]" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Steps / Outcome */}
              <div className="rounded-lg border border-[#F79009]/40 bg-[#FFFAEB] p-3.5">
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#B54708]">
                  <AlertTriangle className="h-3 w-3" />
                  {status === "resolved" ? "Outcome" : "Next Steps"}
                </p>
                <p className="text-[11.5px] text-[#344054] leading-relaxed">{aiOverview.whyNeeded}</p>
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
  const priorityKey = item.priority as Priority;
  const aiOverview = getLiveAiOverview(item.customerRecordId, item.name, item.preview, item.channel);

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
          <div className="px-5 pb-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              {/* Overview */}
              <div className="rounded-lg border border-[#B8D7F0] bg-[#EEF6FC] p-3.5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#006DAD]">Overview</p>
                <ul className="space-y-1.5">
                  {aiOverview.actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11.5px] text-[#344054] leading-relaxed">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#006DAD]" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Outcome */}
              <div className="flex flex-col rounded-lg border border-[#F79009]/40 bg-[#FFFAEB] p-3.5">
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#B54708]">
                  <AlertTriangle className="h-3 w-3" />
                  Outcome
                </p>
                <p className="flex-1 text-[11.5px] text-[#344054] leading-relaxed">{aiOverview.whyNeeded}</p>
                <div className="mt-3 flex items-center justify-end gap-2">
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
                    Transfer
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onOpen(); }}
                    className="rounded-md bg-[#006DAD] px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-[#005d94] transition-colors"
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_AGENT_NAME = "John Doe";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ControlCenterPage() {
  const { resolvedAssignments, assignmentStatusesById, acceptIssue, visibleAssignments } = useLayoutContext();
  const navigate = useNavigate();
  const [issueTab, setIssueTab] = useState<IssueTab>("open");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  // Trigger re-renders when acceptedStaticsStore changes (the store itself lives at module scope
  // so it survives remounts when the agent navigates away and back).
  const [, forceUpdate] = useState(0);

  const rejectIssue = (id: string) => setRejectedIds((prev) => new Set([...prev, id]));

  const handleAcceptStatic = (a: StaticAssignment, statusOverride?: QueueAssignmentStatus) => {
    const data: AcceptIssueData = {
      id: a.id,
      name: a.name,
      customerId: a.customerId,
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
    liveAssignmentId: string | null;
    onAccept: () => void;
    onReject: () => void;
    onReopen: () => void;
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
    return {
      ...a,
      status: liveStatus ?? a.status,
      isLive: false,
      isAccepted,
      isClosed,
      liveAssignmentId: assignmentId ?? null,
      onAccept: () => handleAcceptStatic(a),
      onReject: () => rejectIssue(a.id),
      onReopen: () => handleAcceptStatic(a, liveStatus ?? a.status),
    };
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
      const priority = (validPriorities.has(a.priority) ? a.priority : "Medium") as Priority;
      return {
        id: a.id,
        name: a.name,
        customerId: a.customerId,
        company: companyByCustomerId[a.customerRecordId] ?? a.name,
        channel: a.channel as Channel,
        priority,
        status: liveStatus,
        preview: a.preview,
        waitTime: a.time,
        aiOverview: getLiveAiOverview(a.customerRecordId, a.name, a.preview, a.channel),
        isLive: true,
        isAccepted: true,
        isClosed: false,
        liveAssignmentId: a.id,
        onAccept: () => {},
        onReject: () => {},
        onReopen: () => {},
      };
    });

  const allRows = [...liveNormalised, ...staticNormalised]
    .filter((a) => !rejectedIds.has(a.id))
    .filter((a) => a.status === issueTab)
    .filter((a) => priorityFilter === "all" || a.priority === priorityFilter)
    .sort((a, b) => (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99));

  const filteredResolvedAssignments = resolvedAssignments.filter(
    (r) => priorityFilter === "all" || r.priority === priorityFilter,
  );

  const resolvedTabCount = allRows.length + (issueTab === "resolved" ? filteredResolvedAssignments.length : 0);
  const tabCount = issueTab === "resolved" ? resolvedTabCount : allRows.length;

  const agentFirstName = CURRENT_AGENT_NAME.split(" ")[0] ?? CURRENT_AGENT_NAME;

  // Live clock — ticks every second
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(id);
  }, []);

  // Simulated last-login: fixed at ~8 h before the page first mounted
  const lastLogin = useMemo(() => {
    const d = new Date();
    d.setHours(d.getHours() - 8, d.getMinutes() - 14, 0, 0);
    return d;
  }, []);

  const formatDateTime = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  return (
    <div className="flex h-full flex-col">
      {/* Welcome header */}
      <div className="shrink-0 border-b border-border bg-background/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-[#333333]">
              Welcome back, {agentFirstName}
            </h1>
            <p className="mt-0.5 text-xs text-[#7A7A7A]">
              {formatDateTime(now)}
              <span className="mx-1.5 text-[#D0D5DD]">·</span>
              Last login: {formatDateTime(lastLogin)}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden p-6">
        <div className="flex gap-5 h-full">

          {/* Tasks card */}
          <div className="flex flex-col flex-1 min-w-0 h-full rounded-xl border border-border bg-white shadow-sm overflow-hidden">
            {/* Header: title + tabs */}
            <div className="shrink-0 px-5 pt-4 pb-0 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-[14px] font-semibold text-[#333333]">Tasks</h2>
                  <p className="text-xs text-[#7A7A7A] mt-0.5">
                    {tabCount} task{tabCount !== 1 ? "s" : ""}
                  </p>
                </div>
                {/* Priority filter */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen((v) => !v)}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-[12px] font-medium text-[#333333] hover:bg-[#F9FAFB] transition-colors"
                  >
                    {priorityFilterOptions.find((o) => o.value === priorityFilter)?.label ?? "All Priorities"}
                    <ChevronDown className={cn("h-3.5 w-3.5 text-[#7A7A7A] transition-transform duration-150", isFilterOpen && "rotate-180")} />
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
                            priorityFilter === option.value ? "font-semibold text-[#006DAD]" : "text-[#333333]",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Status tabs */}
              <div className="flex gap-0">
                {(["open", "pending", "resolved", "escalated"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setIssueTab(tab)}
                    className={cn(
                      "relative px-4 py-2 text-[13px] font-medium capitalize transition-colors",
                      issueTab === tab
                        ? "text-[#006DAD]"
                        : "text-[#7A7A7A] hover:text-[#333333]",
                    )}
                  >
                    {tab}
                    {issueTab === tab && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#006DAD]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {issueTab === "resolved" ? (
                allRows.length === 0 && filteredResolvedAssignments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle className="h-8 w-8 text-[#D0D5DD] mb-3" />
                    <p className="text-sm font-medium text-[#7A7A7A]">No resolved tasks</p>
                    <p className="text-xs text-[#B0B7C3] mt-1">Assignments you resolve today will appear here.</p>
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
                      <IssueRow key={a.id} {...a} />
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
                    <IssueRow key={a.id} {...a} />
                  ))
                )
              )}
            </div>
          </div>

          {/* Connected Applications card */}
          <div className="flex flex-col w-[320px] shrink-0 h-full rounded-xl border border-border bg-white shadow-sm overflow-hidden">
            <div className="shrink-0 px-5 py-4 border-b border-border">
              <h2 className="text-[14px] font-semibold text-[#333333]">Connected Applications</h2>
              <p className="text-xs text-[#7A7A7A] mt-0.5">System health overview</p>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {connectedApps.map((app) => (
                <div key={app.name} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-[#F2F4F7] text-[11px] font-bold text-[#475467]">
                    {appIconLetters[app.name] ?? app.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#1D2939]">{app.name}</p>
                    <p className="text-[11px] text-[#98A2B3] mt-0.5">{app.latency} • {app.uptime} uptime</p>
                  </div>
                  <div className={cn(
                    "shrink-0 h-2.5 w-2.5 rounded-full",
                    app.status === "healthy" ? "bg-[#12B76A]" : "bg-[#F79009]",
                  )} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
