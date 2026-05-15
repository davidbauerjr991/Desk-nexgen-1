// Control Panel static data and configuration

import type { Channel, Priority, AiOverview } from "@/lib/static-assignments";

// Re-export from the single source of truth
export { CURRENT_AGENT_NAME } from "@/lib/agent-roster";

export const priorityStyles: Record<Priority, string> = {
  Critical: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
  High: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
  Medium: "border-[#BFDBFE] bg-[#EBF4FD] text-[#166CCA]",
  Low: "border-[#24943E] bg-[#EFFBF1] text-[#208337]",
};

export const priorityRank: Record<Priority, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const channelIconMap: Record<Channel, any> = {
  chat: "MessageCircle",
  sms: "MessageSquare",
  email: "Mail",
  voice: "Phone",
  whatsapp: "WhatsAppIcon",
};

export const companyByCustomerId: Record<string, string> = {
  alex: "Voyager Business Travel",
  sarah: "Voyager Family Plans",
  priya: "Solo Traveler",
  david: "Voyager Corporate Group",
  priyaNair: "International Transit",
  olivia: "Voyager Family Vacation",
  noah: "Business Travel — TechVentures Inc.",
  ethan: "VIP Gold Member — Voyager Loyalty",
};

// Customer context per live customerRecordId
export const liveCustomerContext: Record<string, string> = {
  noah: "Solo business traveler. Flight VY-2103 MSP→SFO canceled. Has a critical client pitch tomorrow at 9am Pacific. Rebooked twice already — both alternatives also canceled. Sentiment: Stressed but composed — needs a definitive solution, not more options that fall through.",
  olivia: "Family of 4 including 2 children (ages 3 and 7). Connecting flight VY-1847 MSP→MIA canceled. Resort check-in deadline is tomorrow noon. Running low on children's supplies. Sentiment: Anxious and exhausted — needs hotel accommodation tonight and confirmed rebooking.",
  ethan: "VIP Gold loyalty member. Three consecutive flights canceled (VY-3301, VY-3455, VY-3612). Has been at MSP for 11 hours. Demanding executive escalation. Sentiment: Furious — loyalty status not being honored, expects priority resolution immediately.",
};

export const liveAiOverview: Record<string, AiOverview> = {
  noah: {
    actions: [
      "Reviewed Noah's rebooking history — VY-2103 and two subsequent alternatives (VY-2288, VY-2401) all canceled due to MSP ground stop.",
      "Scanned available inventory across all partner carriers for MSP→SFO routes within next 18 hours.",
      "Identified one remaining option: VY-4022 departing MSP at 06:15 tomorrow via DEN, arriving SFO 10:48 — tight but feasible for his 9am meeting if he takes ground transport.",
      "Prepared rebooking authorization and hotel voucher for overnight stay at MSP Marriott.",
    ],
    whyNeeded:
      "Noah has been rebooked twice already and both flights were canceled. A third rebooking on a tight connection requires human judgment to assess feasibility and authorize the overnight accommodation voucher — exceeding the automated approval threshold.",
    nextSteps: [
      "Confirm the VY-4022 via DEN routing works for Noah's 9am commitment",
      "Issue the hotel voucher for MSP Marriott and confirm check-in",
      "Lock the seat on VY-4022 before inventory clears",
      "Provide Noah with a direct contact number in case of further disruption",
    ],
  },
  olivia: {
    actions: [
      "Reviewed Olivia's booking — family of 4 on VY-1847 MSP→MIA, canceled due to winter storm ground stop at MSP.",
      "Checked hotel availability near MSP for tonight — confirmed 1 family room at MSP Hilton Garden Inn with crib and rollaway bed.",
      "Searched rebooking options — earliest confirmed MSP→MIA seat availability is VY-1920 departing 11:40 tomorrow, arriving MIA 16:55.",
      "Prepared family accommodation package: hotel voucher, meal vouchers for 4, and children's comfort kit request to Guest Services.",
    ],
    whyNeeded:
      "Olivia is traveling with two young children and is running low on supplies. The resort check-in deadline is tomorrow noon, which the earliest available flight will miss. A human agent is needed to coordinate the hotel stay, authorize the family voucher package, and contact the resort about a late check-in exception.",
    nextSteps: [
      "Confirm the MSP Hilton Garden Inn booking and arrange shuttle transport from terminal",
      "Issue meal vouchers and request children's comfort kits from Guest Services",
      "Rebook on VY-1920 and contact the resort to negotiate a late check-in",
      "Provide Olivia with a direct support line for any overnight needs with the children",
    ],
  },
  ethan: {
    actions: [
      "Reviewed Ethan's itinerary — three consecutive cancellations (VY-3301, VY-3455, VY-3612) over the past 11 hours at MSP.",
      "Verified Ethan's VIP Gold loyalty status — entitled to priority rebooking, lounge access, and complimentary accommodation during irregular operations.",
      "Searched priority inventory — identified VY-5010 departing MSP at 07:00 tomorrow with first-class availability, arriving destination at 10:15.",
      "Flagged account for executive escalation review and prepared a compensation package: 15,000 bonus miles, first-class upgrade, and VIP lounge immediate access.",
    ],
    whyNeeded:
      "Ethan is a VIP Gold member who has endured three cancellations and 11 hours at the airport without receiving the priority treatment his loyalty tier guarantees. A human agent is needed to personally acknowledge the service failure, authorize the compensation package, and ensure the next rebooking is locked and guaranteed.",
    nextSteps: [
      "Personally acknowledge the service failure and apologize for the loyalty tier not being honored",
      "Confirm the VY-5010 first-class rebooking and lock the seat immediately",
      "Issue the compensation package: 15,000 bonus miles, lounge access, and hotel voucher",
      "Provide Ethan with a direct executive support line and confirm no further cancellations on VY-5010",
    ],
  },
};

export const priorityFilterOptions: { value: Priority; label: string }[] = [
  { value: "Critical", label: "Critical" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

export type ChannelFilterValue = "chat" | "email" | "sms" | "whatsapp" | "voice";

export const channelFilterOptions: { value: ChannelFilterValue; label: string }[] = [
  { value: "chat", label: "Chat" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "voice", label: "Voice" },
];

export const ISSUE_GROUPS: { label: string; keywords: string[] }[] = [
  { label: "Login & Authentication", keywords: ["login", "password", "auth", "sign in", "access", "locked out"] },
  { label: "Payment & Billing", keywords: ["payment", "charge", "billing", "invoice", "refund", "transfer", "transaction", "wire", "funds"] },
  { label: "System & Technical", keywords: ["system", "error", "outage", "down", "crash", "bug", "technical", "ai ", "virtual agent", "incorrect", "compliance"] },
  { label: "Account Management", keywords: ["account", "profile", "settings", "update", "plan", "subscription"] },
  { label: "Security & Fraud", keywords: ["security", "breach", "fraud", "suspicious", "unauthori", "data", "export"] },
  { label: "Service & Support", keywords: ["delay", "sla", "service", "support", "escalat", "complaint"] },
];

export const connectedApps = [
  { name: "Salesforce", latency: "42ms", uptime: "99.9%", status: "healthy" },
  { name: "ADP Workforce", latency: "88ms", uptime: "99.7%", status: "healthy" },
  { name: "Outlook 365", latency: "31ms", uptime: "100%", status: "healthy" },
  { name: "MS Teams", latency: "29ms", uptime: "100%", status: "healthy" },
  { name: "Zendesk", latency: "340ms", uptime: "97.2%", status: "degraded" },
  { name: "Jira Cloud", latency: "67ms", uptime: "99.8%", status: "healthy" },
  { name: "Knowledge Base", latency: "12ms", uptime: "100%", status: "healthy" },
  { name: "Desktop CTI", latency: "8ms", uptime: "100%", status: "healthy" },
];

export const appIconLetters: Record<string, string> = {
  Salesforce: "S",
  "ADP Workforce": "A",
  "Outlook 365": "O",
  "MS Teams": "T",
  Zendesk: "Z",
  "Jira Cloud": "J",
  "Knowledge Base": "K",
  "Desktop CTI": "D",
};

export const COPILOT_REASONING_STEPS = [
  "Reviewing case history and prior customer interactions...",
  "Analyzing attempted resolutions and their outcomes...",
  "Cross-referencing similar resolved cases in the knowledge base...",
  "Synthesizing recommended next steps and action items...",
];

export const CARD_COPILOT_STEPS = [
  "Reviewing case history and prior customer interactions...",
  "Analyzing attempted resolutions and their outcomes...",
  "Cross-referencing similar resolved cases in the knowledge base...",
  "Synthesizing recommended next steps and action items...",
];

export const BULK_AI_RESPONSES: Record<string, string> = {
  "Login & Authentication": "We're aware of an issue affecting login access and are actively working to resolve it. Our engineering team expects a fix within the next 30 minutes. We apologize for the inconvenience and appreciate your patience.",
  "Payment & Billing": "We've identified an issue affecting payment processing. Our team is investigating urgently to restore normal service. We'll ensure no incorrect charges are applied and will notify you once resolved.",
  "System & Technical": "We're currently experiencing a technical issue that may be impacting your experience. Our engineering team is aware and actively working on a resolution. We appreciate your patience.",
  "Account Management": "We're aware of an issue affecting account management features and are working to resolve it quickly. Your account data is safe. We'll notify you once full functionality is restored.",
  "Security & Fraud": "Our security team has been alerted and is investigating immediately. As a precaution, please review your recent account activity and contact us directly if you notice anything suspicious.",
  "Service & Support": "We sincerely apologize for the delay. We're aware this doesn't meet our standards and are prioritising your case. A dedicated agent will be in touch shortly.",
};
