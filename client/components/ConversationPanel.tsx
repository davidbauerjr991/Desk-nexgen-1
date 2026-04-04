import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, AudioLines, Bot, Check, ChevronDown, ChevronLeft, ChevronRight, Loader2, MoreHorizontal, NotebookPen, Paperclip, Pause, Play, Plus, Send, SlidersHorizontal, Ticket, Trash2, X } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { conversationChannelOptions } from "@/components/ConversationChannelToggleGroup";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { getRelevantCustomerTicket, type CustomerTicket } from "@/components/NotesPanel";
import { VoiceAIGuidanceCard, VoiceGuidancePanel } from "@/components/VoiceGuidanceContent";
import { getCustomerRecord, type CustomerChannel } from "@/lib/customer-database";
import { cn } from "@/lib/utils";

export type ConversationMessage = {
  id: number;
  role: "customer" | "agent";
  content: string;
  time: string;
  channel?: CustomerChannel;
  sentiment?: "frustrated";
  isInternal?: boolean;
  ticket?: CustomerTicket;
};

export type ConversationStatus = "open" | "pending";

export type SharedConversationData = {
  customerName: string;
  label: string;
  timelineLabel: string;
  status: ConversationStatus;
  draft: string;
  messages: ConversationMessage[];
  isCustomerTyping?: boolean;
};

interface ConversationPanelProps {
  conversation: SharedConversationData;
  openChannels: CustomerChannel[];
  activeChannel: CustomerChannel;
  draftKey: string;
  className?: string;
  customerId?: string;
  onConversationChange?: (conversation: SharedConversationData, channel?: CustomerChannel) => void;
  onSelectChannel: (channel: CustomerChannel) => void;
  onOpenDeskPanel?: (selection?: { initialTab?: string; ticketId?: string }) => void;
  onResolveAssignment?: () => void;
  showAiPanel?: boolean;
  hideTranscript?: boolean;
}

const conversationFooterMenuItems = [
  "Add files or photos",
  "Take a screenshot",
  "Add to project",
] as const;

const conversationFooterSecondaryMenuItems = [
  "Web search",
  "Connect Supervisor",
  "Add connectors",
] as const;

function formatConversationTimestamp(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getConversationChannelLabel(channel: CustomerChannel) {
  return conversationChannelOptions.find((option) => option.channel === channel)?.label ?? channel;
}

function formatConversationMessageTimestamp(time: string) {
  return `Today, ${time.replace(/\s/g, "")}`;
}

function isScrolledToBottom(viewport: HTMLDivElement) {
  return viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= 24;
}

type InlineSuggestion = {
  summary: string;
  suggestedReply: string;
};

type SuggestionAction = {
  id: string;
  label: string;
  initialTab?: string;
  ticketId?: string;
  ticket?: CustomerTicket;
};

type AgentTask = {
  id: string;
  label: string;
};

const TASK_COMPLETION_NOTES: Record<string, string> = {
  "create-ticket": "ADP ticket created",
  "update-salesforce": "Salesforce record updated",
  "send-coupon": "Discount coupon email sent",
  "escalate": "Escalated to supervisor",
  "callback": "Callback scheduled",
  "upgrade-beverage-package": "Beverage package upgraded",
  "confirm-credit-line": "Credit line confirmed",
  "set-resolved": "Assignment resolved",
};

const TASK_COMPLETION_REPLIES: Record<string, string> = {
  "create-ticket": "I've created a support ticket for you and it's been assigned to our queue. Is there anything else I can help you with in the meantime?",
  "update-salesforce": "I've updated your account record on our end. Is there anything else I can help you with?",
  "send-coupon": "I've sent a discount coupon to your email address on file. Is there anything else I can do for you?",
  "escalate": "I've escalated this to a supervisor who will be with you shortly. Is there anything else you need while you wait?",
  "callback": "I've scheduled a callback for you. You'll receive a confirmation shortly. Is there anything else I can help you with?",
  "upgrade-beverage-package": "I've processed the upgrade to your beverage package. You should receive a confirmation email shortly.",
  "confirm-credit-line": "I've confirmed your credit line details. Everything looks good on our end.",
  "set-resolved": "Thank you so much for reaching out! I'm glad we could help. Have a great day!",
};

const TASK_ACTION_TITLES: Record<string, string> = {
  "create-ticket": "Creating ADP Ticket...",
  "update-salesforce": "Creating Salesforce Record...",
  "send-coupon": "Sending Discount Coupon...",
  "escalate": "Escalating to Supervisor...",
  "callback": "Scheduling Callback...",
  "upgrade-beverage-package": "Upgrading Beverage Package...",
  "confirm-credit-line": "Confirming Credit Line...",
  "set-resolved": "Resolving Assignment...",
};

const TASK_STEPS: Record<string, string[]> = {
  "create-ticket": [
    "Searching for customer ID",
    "Pulling conversation history",
    "Creating ADP ticket record",
    "Assigning to support queue",
  ],
  "update-salesforce": [
    "Searching for customer ID",
    "Processing updating payment amount",
    "Emailing confirmation to customer",
  ],
  "send-coupon": [
    "Looking up customer email",
    "Generating discount code",
    "Sending coupon email to customer",
  ],
  "escalate": [
    "Finding available supervisor",
    "Transferring conversation notes",
    "Notifying supervisor",
  ],
  "callback": [
    "Checking agent availability",
    "Creating callback appointment",
    "Sending confirmation to customer",
  ],
  "upgrade-beverage-package": [
    "Checking current package tier",
    "Verifying upgrade eligibility",
    "Processing package change",
    "Sending confirmation to customer",
  ],
  "confirm-credit-line": [
    "Pulling account credit details",
    "Verifying authorisation status",
    "Confirming credit line terms",
  ],
  "set-resolved": [
    "Closing conversation thread",
    "Updating assignment status",
    "Removing from queue",
  ],
};

// Maps natural-language copilot requests to known task IDs.
const COPILOT_TASK_MATCHERS: Array<{ keywords: string[]; task: AgentTask }> = [
  { keywords: ["ticket", "case", "adp", "support ticket", "create ticket", "open ticket"], task: { id: "create-ticket", label: "Create ADP Ticket" } },
  { keywords: ["salesforce", "crm", "record", "account", "update salesforce"], task: { id: "update-salesforce", label: "Update Salesforce Record" } },
  { keywords: ["coupon", "discount", "voucher", "promo", "send coupon"], task: { id: "send-coupon", label: "Send Discount Coupon" } },
  { keywords: ["escalat", "supervisor", "manager", "escalate"], task: { id: "escalate", label: "Escalate to Supervisor" } },
  { keywords: ["callback", "call back", "schedule call", "schedule callback"], task: { id: "callback", label: "Schedule Callback" } },
];

function matchCopilotInput(input: string): AgentTask | null {
  const lower = input.toLowerCase();
  for (const { keywords, task } of COPILOT_TASK_MATCHERS) {
    if (keywords.some((k) => lower.includes(k))) return task;
  }
  return null;
}

function getSuggestedAgentTasks(conversation: SharedConversationData, latestCustomerMessage: ConversationMessage | null): AgentTask[] {
  if (!latestCustomerMessage) return [];

  const allContent = conversation.messages.map((m) => m.content).join(" ").toLowerCase();
  const tasks: AgentTask[] = [];

  if (["ticket", "case", "error", "retry", "blocked", "declined", "failed", "issue", "problem"].some((k) => allContent.includes(k))) {
    tasks.push({ id: "create-ticket", label: "Create ADP Ticket" });
  }

  if (["account", "billing", "payment", "record", "status", "profile", "update", "crm", "salesforce"].some((k) => allContent.includes(k))) {
    tasks.push({ id: "update-salesforce", label: "Update Salesforce Record" });
  }

  if (["discount", "coupon", "compensation", "charged twice", "double charge", "trouble", "frustrated", "inconvenience", "sorry", "billing"].some((k) => allContent.includes(k))) {
    tasks.push({ id: "send-coupon", label: "Send an email with a discount coupon" });
  }

  if (["supervisor", "escalate", "manager", "speak to someone", "call me"].some((k) => allContent.includes(k))) {
    tasks.push({ id: "escalate", label: "Escalate to supervisor" });
  }

  if (["callback", "call back", "schedule", "appointment", "call me"].some((k) => allContent.includes(k))) {
    tasks.push({ id: "callback", label: "Schedule a callback" });
  }

  const latestContent = latestCustomerMessage.content.toLowerCase();
  if (["thank you", "thanks", "that's great", "that was helpful", "resolved", "satisfied", "happy", "all set", "appreciate", "perfect", "wonderful", "great help", "problem solved", "sorted"].some((k) => latestContent.includes(k))) {
    tasks.push({ id: "set-resolved", label: "Set assignment to resolved" });
  }

  return tasks;
}

function getSuggestionVariant<T>(variants: T[], refreshKey: number) {
  return variants[((refreshKey % variants.length) + variants.length) % variants.length];
}

function applySuggestionEdit(
  suggestion: InlineSuggestion,
  instruction: string,
  conversation: SharedConversationData,
): InlineSuggestion {
  const normalizedInstruction = instruction.trim().toLowerCase();
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;
  const updateClauses: string[] = [];
  const replyClauses: string[] = [];

  if (normalizedInstruction.includes("attachment") || normalizedInstruction.includes("file") || normalizedInstruction.includes("screenshot")) {
    updateClauses.push("mention that the customer can attach a file or screenshot in this thread");
    replyClauses.push("If it helps, please attach a screenshot or file here and I’ll review it with you right away.");
  }

  if (normalizedInstruction.includes("ticket") || normalizedInstruction.includes("case")) {
    updateClauses.push("confirm that you will update the support ticket as part of the next step");
    replyClauses.push("I’ll document this in the support ticket so the latest update is captured while we continue here.");
  }

  if (normalizedInstruction.includes("account number") || normalizedInstruction.includes("account #") || normalizedInstruction.includes("account")) {
    updateClauses.push(`ask ${customerFirstName} to confirm the account number needed for verification`);
    replyClauses.push("Please share the account number tied to this request so I can verify the record before the next step.");
  }

  if (normalizedInstruction.includes("billing") || normalizedInstruction.includes("payment")) {
    updateClauses.push("include a billing verification step before the customer retries");
    replyClauses.push("I’m also going to verify the billing details tied to the latest attempt before we move forward.");
  }

  if (updateClauses.length === 0) {
    updateClauses.push(`incorporate this agent request: ${instruction.trim()}`);
    replyClauses.push(`I’m also taking this additional step into account: ${instruction.trim()}.`);
  }

  return {
    summary: `${suggestion.summary} Update it to ${updateClauses.join(", ")}.`,
    suggestedReply: `${suggestion.suggestedReply} ${replyClauses.join(" ")}`.trim(),
  };
}

function getInlineSuggestionVariants(
  conversation: SharedConversationData,
  customerMessage: ConversationMessage,
): InlineSuggestion[] {
  const normalizedMessage = customerMessage.content.toLowerCase();

  if (normalizedMessage.includes("same error") || normalizedMessage.includes("tried again") || normalizedMessage.includes("retry") || normalizedMessage.includes("retried") || normalizedMessage.includes("still")) {
    return [
      {
        summary:
          "Recommend confirming the latest account status, then offer a manual refresh so the customer can retry without leaving the conversation.",
        suggestedReply:
          "I’ve confirmed the latest account status on my side. I’m running a manual refresh now so you can retry without leaving this conversation.",
      },
      {
        summary:
          "Acknowledge that the retry failed again, confirm you are checking the latest status, and keep the customer in the same thread while you reset the flow.",
        suggestedReply:
          "Thanks for trying that again. I’m checking the latest status now, and I’ll reset the flow from my side so you can retry here without starting over.",
      },
      {
        summary:
          "Show ownership of the repeated failure, explain you are refreshing the account state, and give the customer one immediate next step.",
        suggestedReply:
          "I can see the same error is still blocking the attempt. I’m refreshing the account state now, and I’ll let you know as soon as it’s ready for one more retry.",
      },
    ];
  }

  if (normalizedMessage.includes("charged twice") || normalizedMessage.includes("double charge")) {
    return [
      {
        summary: "Reassure the customer they will not be charged twice, then guide them through a safe retry.",
        suggestedReply:
          "You will not be charged twice for the same upgrade attempt. I’ll verify the previous authorization, then I’ll let you know the safest time to retry.",
      },
      {
        summary: "Reduce anxiety about duplicate billing, confirm you are reviewing the payment authorization, and set up the next action clearly.",
        suggestedReply:
          "I understand the concern. I’m reviewing the previous authorization now to make sure there isn’t a duplicate charge, and then I’ll guide you through the next safe step.",
      },
      {
        summary: "Confirm you are checking the billing history, reassure them the original attempt is being reviewed, and avoid asking them to retry too early.",
        suggestedReply:
          "I’m checking the billing history on my side first so we do not risk a duplicate charge. Once I confirm the original attempt status, I’ll tell you whether it’s safe to retry.",
      },
    ];
  }

  if (normalizedMessage.includes("billing") || normalizedMessage.includes("zip") || normalizedMessage.includes("match")) {
    return [
      {
        summary: "Confirm the billing details on file, then guide the customer to the field most likely causing the mismatch.",
        suggestedReply:
          "I can see a billing detail mismatch on the latest attempt. Please confirm the billing zip code on the card, and I’ll stay with you while you try it again.",
      },
      {
        summary: "Point the customer to the billing field most likely causing the failure and keep the instruction focused on one correction at a time.",
        suggestedReply:
          "The latest attempt looks like it failed on a billing detail check. Please verify the billing zip code exactly as it appears with your card issuer, and I’ll stay with you for the retry.",
      },
      {
        summary: "Keep the response specific, ask for the most important billing confirmation, and reduce the chance of another mismatch.",
        suggestedReply:
          "Before we try again, please confirm the billing zip code tied to the card. That is the field most likely causing the mismatch I’m seeing on the payment check.",
      },
    ];
  }

  if (normalizedMessage.includes("today") || normalizedMessage.includes("urgent") || normalizedMessage.includes("meeting")) {
    return [
      {
        summary: "Acknowledge the urgency, confirm the next action, and keep the customer in the conversation while you resolve it.",
        suggestedReply:
          "I understand this is time-sensitive. I’m checking the blocking step now, and I’ll keep you updated here so you can complete the upgrade as quickly as possible.",
      },
      {
        summary: "Lead with urgency, explain that you are actively checking the blocker, and reassure the customer they will not need to repeat everything.",
        suggestedReply:
          "I know this is urgent. I’m reviewing the blocking step right now, and I’ll stay with you here so we can move this forward without making you repeat the process.",
      },
      {
        summary: "Recognize the deadline, confirm immediate ownership, and give the customer confidence that the next update is coming soon.",
        suggestedReply:
          "Thanks for flagging the urgency. I’m on the blocking issue now, and I’ll update you here with the next step as soon as I confirm what’s holding it up.",
      },
    ];
  }

  if (normalizedMessage.includes("worked") || normalizedMessage.includes("thank you")) {
    return [
      {
        summary: "Confirm the issue is resolved and tell the customer what to watch for next.",
        suggestedReply:
          "Glad that worked. Your upgrade should now continue normally, and I’ll stay available here in case anything else comes up.",
      },
      {
        summary: "Close the loop clearly, confirm the path forward is back on track, and keep the tone supportive.",
        suggestedReply:
          "Great, that means the issue is resolved and the upgrade flow should continue normally from here. I’ll stay available in case anything unexpected comes up.",
      },
      {
        summary: "Acknowledge the positive update and let the customer know what should happen next so the thread can wind down cleanly.",
        suggestedReply:
          "Happy to hear that worked. Everything should move forward normally now, but I’ll remain here if you need help with the next step.",
      },
    ];
  }

  return [
    {
      summary: `Recommend acknowledging ${conversation.customerName.split(" ")[0]}'s latest update and giving them one clear next step.`,
      suggestedReply: "Thanks for the update. I’m checking the latest attempt now and I’ll give you the next step in just a moment.",
    },
    {
      summary: `Recommend confirming ${conversation.customerName.split(" ")[0]}'s latest update, then setting expectations for the next follow-up in this thread.`,
      suggestedReply: "Thanks for the update. I’m reviewing the latest activity now, and I’ll follow up here with the clearest next step in just a moment.",
    },
    {
      summary: `Recommend acknowledging ${conversation.customerName.split(" ")[0]}'s message and giving them one immediate action while you continue checking the issue.`,
      suggestedReply: "I appreciate the update. I’m checking the latest attempt now and I’ll reply here with the best next step shortly.",
    },
  ];
}

function getInlineSuggestion(
  conversation: SharedConversationData,
  customerMessage: ConversationMessage,
  refreshKey = 0,
) {
  return getSuggestionVariant(getInlineSuggestionVariants(conversation, customerMessage), refreshKey);
}

function getSummarySnippet(content: string | undefined, maxLength = 170) {
  const normalizedContent = content?.replace(/\s+/g, " ").trim();

  if (!normalizedContent) {
    return null;
  }

  return normalizedContent.length > maxLength
    ? `${normalizedContent.slice(0, maxLength - 3)}...`
    : normalizedContent;
}

function getRemainingSupportNeed(issueSummary: string | null, latestCustomerMessage: ConversationMessage | undefined) {
  const normalizedReply = latestCustomerMessage?.content.toLowerCase() ?? "";
  const normalizedIssue = issueSummary?.toLowerCase() ?? "";
  const evaluationText = `${normalizedReply} ${normalizedIssue}`.trim();

  if (normalizedReply.includes("where should i update") || normalizedReply.includes("old zip") || normalizedReply.includes("recently moved")) {
    return "Show the customer exactly where to update the billing details, point to the field that is wrong, and ask them to wait to retry until that profile update is complete.";
  }

  if (normalizedReply.includes("duplicate charge") || normalizedReply.includes("charged twice") || normalizedReply.includes("double charge")) {
    return "Check whether any duplicate authorization exists, explain the billing risk clearly, and then tell the customer if it is safe to retry.";
  }

  if (normalizedReply.includes("payment link") || normalizedReply.includes("secure link") || normalizedReply.includes("send it over") || normalizedReply.includes("inbox")) {
    return "Send the promised follow-up now, confirm where it was delivered, and tell the customer the exact step to take once it arrives.";
  }

  if (normalizedReply.includes("full page") || normalizedReply.includes("payment section") || normalizedReply.includes("screenshot") || normalizedReply.includes("photo")) {
    return "Specify exactly what screenshot or evidence the customer should send, confirm how to send it, and review it before asking for another retry.";
  }

  if (normalizedReply.includes("should i retry") || normalizedReply.includes("retry it now") || normalizedReply.includes("what should i do next")) {
    return "Answer the customer's question directly with one clear next action and make it explicit whether they should retry now or wait for another fix first.";
  }

  if (normalizedReply.includes("worked") || normalizedReply.includes("thank you")) {
    return "Confirm the issue is resolved, tell the customer what to watch for next, and close the loop cleanly unless another problem appears.";
  }

  if (evaluationText.includes("same error") || evaluationText.includes("still") || evaluationText.includes("retry") || evaluationText.includes("declined") || evaluationText.includes("blocked")) {
    return "Explain what is still blocking the latest attempt, describe what changed since the failed retry, and give the customer one new action instead of repeating the previous step.";
  }

  if (evaluationText.includes("billing") || evaluationText.includes("zip") || evaluationText.includes("card") || evaluationText.includes("payment")) {
    return "Verify the billing details on file, call out the exact field that needs attention, and confirm when the customer should try again.";
  }

  if (evaluationText.includes("urgent") || evaluationText.includes("today") || evaluationText.includes("meeting") || evaluationText.includes("deadline")) {
    return "Take immediate ownership of the blocker and reply with a time-sensitive resolution path the customer can act on right away.";
  }

  return "Respond directly to the customer's latest reply and turn it into one specific next action they can take now.";
}

function getDetectedIntent(messages: SharedConversationData["messages"]): string {
  const text = messages
    .filter((m) => m.role === "customer")
    .map((m) => m.content.toLowerCase())
    .join(" ");

  if (text.match(/\b(subscription|plan|upgrade|downgrade|tier)\b/) && text.match(/\b(payment|billing|charge|fail|decline)\b/)) {
    return "Subscription Upgrade / Payment Failure";
  }
  if (text.match(/\b(cancel|cancellation|unsubscribe)\b/)) {
    return "Cancellation Request";
  }
  if (text.match(/\b(subscription|plan|upgrade|downgrade|tier)\b/)) {
    return "Subscription Upgrade / Change";
  }
  if (text.match(/\b(payment|billing|charge|invoice|refund|overpaid|overcharg)\b/)) {
    return "Billing / Payment Issue";
  }
  if (text.match(/\b(delivery|shipping|package|parcel|reroute|transit|exception)\b/)) {
    return "Delivery / Shipping Issue";
  }
  if (text.match(/\b(broken|error|bug|crash|not work|issue|problem|fail)\b/)) {
    return "Technical Issue";
  }
  return "General Inquiry";
}

function getChurnRisk(messages: SharedConversationData["messages"]): { label: string; level: "low" | "medium" | "high" } {
  const hasFrustration = messages.some((m) => m.sentiment === "frustrated");
  const text = messages.map((m) => m.content.toLowerCase()).join(" ");
  const highRiskWords = /\b(cancel|leave|competitor|refund|lawsuit|terrible|unacceptable|never again)\b/;

  if (hasFrustration && highRiskWords.test(text)) return { label: "High", level: "high" };
  if (hasFrustration) return { label: "Medium", level: "medium" };
  return { label: "Low", level: "low" };
}

function getConversationOverview(conversation: SharedConversationData) {
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;
  const latestCustomerMessage = [...conversation.messages].reverse().find((message) => message.role === "customer");
  const latestAgentMessage = [...conversation.messages].reverse().find((message) => message.role === "agent");
  const issueSummary = getSummarySnippet(latestCustomerMessage?.content);
  const priorHelpSummary = getSummarySnippet(latestAgentMessage?.content, 150);
  const assignmentReason = latestCustomerMessage?.sentiment === "frustrated"
    ? `${customerFirstName} was routed to this agent because the issue is still unresolved and the customer is showing frustration in the current ${conversation.label.toLowerCase()} thread.`
    : `${customerFirstName} was routed to this agent because the current ${conversation.label.toLowerCase()} thread still needs active ownership to move the issue forward.`;
  const customerIssue = issueSummary
    ? `${customerFirstName} is dealing with this issue: ${issueSummary}`
    : `${customerFirstName}'s current issue has not been fully captured in the thread yet.`;
  const priorHelp = priorHelpSummary
    ? `The previous agent or AI already tried to help by saying or doing this: ${priorHelpSummary}`
    : "The previous agent or AI has not yet documented a meaningful action that would unblock the issue.";
  const remainingNeed = getRemainingSupportNeed(issueSummary, latestCustomerMessage);

  const detectedIntent = getDetectedIntent(conversation.messages);
  const churnRisk = getChurnRisk(conversation.messages);
  const sentiment = latestCustomerMessage?.sentiment ?? null;

  return {
    assignmentReason,
    customerIssue,
    priorHelp,
    remainingNeed,
    detectedIntent,
    churnRisk,
    sentiment,
  };
}

function getEmailAddress(name: string) {
  const localPart = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

  return `${localPart || "support"}@nice.com`;
}

function getEmailThreadContent(content: string) {
  const [firstLine = "", ...remainingLines] = content.split("\n");
  const hasSubjectLine = firstLine.toLowerCase().startsWith("subject:");
  const subject = hasSubjectLine ? firstLine.slice("subject:".length).trim() : "";
  const body = (hasSubjectLine ? remainingLines : [firstLine, ...remainingLines]).join("\n").trim();

  return { subject, body };
}

function getReplyEmailSubject(conversation: SharedConversationData) {
  const firstCustomerEmail = conversation.messages.find((message) => message.role === "customer");
  const parsedEmail = firstCustomerEmail ? getEmailThreadContent(firstCustomerEmail.content) : null;
  const baseSubject = parsedEmail?.subject || `${conversation.customerName} follow-up`;

  return /^re:/i.test(baseSubject) ? baseSubject : `Re: ${baseSubject}`;
}

function getTicketPriorityDotClassName(priority: CustomerTicket["priority"]) {
  switch (priority) {
    case "Low":
      return "bg-[#369D3F]";
    case "Medium":
      return "bg-[#006DAD]";
    case "High":
      return "bg-[#F79009]";
    default:
      return "bg-[#F04438]";
  }
}

function getTicketStatusBadgeClasses(status: CustomerTicket["status"]) {
  switch (status) {
    case "Open":
      return "border-[#B7E6DD] bg-[#EAF8F4] text-[#369D3F]";
    case "In Progress":
      return "border-[#F4E1A1] bg-[#FFF9E8] text-[#7A5B00]";
    case "Pending Customer":
    case "On-Hold":
    case "Training Rescheduled":
      return "border-[#FEDF89] bg-[#FFFAEB] text-[#B54708]";
    case "Escalated":
    case "Needing Attention":
      return "border-[#FECDCA] bg-[#FEF3F2] text-[#B42318]";
    default:
      return "border-black/10 bg-white text-[#475467]";
  }
}

function InlineTicketRecord({
  ticket,
  isOpen,
  onToggle,
}: {
  ticket: CustomerTicket;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-[8px] border border-black/10 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col gap-2 border-b border-black/10 px-4 py-3 text-left"
      >
        <div className="flex w-full items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#B8D7F0] bg-[#EEF6FC] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#006DAD]">
              <Ticket className="h-3 w-3" />
              {ticket.id}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#475467]">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", getTicketPriorityDotClassName(ticket.priority))} />
              {ticket.priority} Priority
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium shadow-sm",
                getTicketStatusBadgeClasses(ticket.status),
              )}
            >
              {ticket.status}
            </span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-[#667085] transition-transform", !isOpen && "-rotate-90")} />
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold leading-snug text-[#111827]">{ticket.subject}</h3>
          <p className="mt-0.5 text-xs text-[#667085]">
            {ticket.type} case owned by {ticket.agent} in {ticket.agentTeam}.
          </p>
        </div>
      </button>

      {isOpen ? (
        <div className="flex flex-col gap-3 bg-[#FCFCFD] p-3">
          <div className="rounded-xl border border-black/10 bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">Ticket Details</div>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <dt className="text-[#667085]">Ticket Number</dt>
                <dd className="font-medium text-[#111827]">{ticket.id}</dd>
              </div>
              <div className="flex items-start justify-between gap-2">
                <dt className="text-[#667085]">Type</dt>
                <dd className="font-medium text-[#111827]">{ticket.type}</dd>
              </div>
              <div className="flex items-start justify-between gap-2">
                <dt className="text-[#667085]">Modified By</dt>
                <dd className="font-medium text-[#111827]">{ticket.modifiedBy}</dd>
              </div>
              <div className="flex items-start justify-between gap-2">
                <dt className="text-[#667085]">Assigned Team</dt>
                <dd className="font-medium text-[#111827]">{ticket.agentTeam}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">Summary</div>
            <p className="mt-2 text-xs leading-5 text-[#475467]">
              This ticket record was opened directly from the AI suggestion so agents can review the case without leaving the active conversation. Collapse this section any time to return to the message thread.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmailConversationView({
  conversation,
  customerId,
  draft,
  hasDraft,
  isDraftFocused,
  textareaRef,
  onDraftChange,
  onDraftFocus,
  onDraftBlur,
  onClearDraft,
  onSend,
}: {
  conversation: SharedConversationData;
  customerId?: string;
  draft: string;
  hasDraft: boolean;
  isDraftFocused: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onDraftChange: (nextDraft: string) => void;
  onDraftFocus: () => void;
  onDraftBlur: () => void;
  onClearDraft: () => void;
  onSend: () => void;
}) {
  const customerRecord = customerId ? getCustomerRecord(customerId) : null;
  const agentName = customerRecord?.overview.assignedAgent ?? "David Bauer";
  const agentEmail = getEmailAddress(agentName);
  const customerEmail = getEmailAddress(conversation.customerName);
  const firstCustomerEmail = conversation.messages.find((message) => message.role === "customer");
  const emailThread = getEmailThreadContent(firstCustomerEmail?.content ?? "");
  const replySubject = getReplyEmailSubject(conversation);
  const threadDate = conversation.timelineLabel.replace(/^Email thread\s·\s/i, "");

  return (
    <div className="mx-auto flex w-full max-w-[780px] flex-col overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
      <div className="border-b border-black/10 px-5 py-3">
        <div className="grid gap-3 text-[15px] text-[#333333]">
          <div className="flex items-center gap-3 border-b border-black/10 pb-2">
            <span className="w-16 shrink-0 text-[#7A7A7A]">From:</span>
            <span className="truncate">{agentName} ({agentEmail})</span>
          </div>
          <div className="flex items-center gap-3 border-b border-black/10 pb-2">
            <span className="w-16 shrink-0 text-[#7A7A7A]">To:</span>
            <span className="truncate">{conversation.customerName} ({customerEmail})</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-[#7A7A7A]">Subject:</span>
            <span className="truncate font-medium text-[#111827]">{replySubject}</span>
          </div>
        </div>
      </div>

      <div className="border-b border-black/10 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 text-[#444444]">
          <button type="button" className="rounded-md bg-[#F3F4F6] px-3 py-1.5 text-sm">Aptos</button>
          <button type="button" className="rounded-md bg-[#F3F4F6] px-3 py-1.5 text-sm">12</button>
          <button type="button" className="rounded-md px-2 py-1 text-sm text-[#666666] hover:bg-[#F8F8F9]">A</button>
          <button type="button" className="rounded-md px-2 py-1 text-sm text-[#666666] hover:bg-[#F8F8F9]">
            <Paperclip className="h-4 w-4" />
          </button>
          <button type="button" className="rounded-md px-2 py-1 text-sm font-semibold hover:bg-[#F8F8F9]">B</button>
          <button type="button" className="rounded-md px-2 py-1 text-sm italic hover:bg-[#F8F8F9]">I</button>
          <button type="button" className="rounded-md px-2 py-1 text-sm underline hover:bg-[#F8F8F9]">U</button>
          <button type="button" className="rounded-md px-2 py-1 text-sm hover:bg-[#F8F8F9]">•</button>
          <button type="button" className="rounded-md px-2 py-1 text-sm hover:bg-[#F8F8F9]">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <div className="ml-auto flex items-center gap-2">
            {hasDraft ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClearDraft}
                className="h-8 rounded-full border-black/10 px-3 text-[#666666]"
              >
                Clear
              </Button>
            ) : null}
            <Button type="button" size="sm" onClick={onSend} disabled={!hasDraft} className="h-8 rounded-full bg-[#111827] px-4 text-white hover:bg-[#1F2937] disabled:bg-[#D1D5DB]">
              Send
            </Button>
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <Textarea
          key={`email-${replySubject}`}
          ref={textareaRef}
          placeholder="Write your email reply..."
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onFocus={onDraftFocus}
          onBlur={onDraftBlur}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              onSend();
            }
          }}
          rows={8}
          className={cn(
            "min-h-[220px] resize-none border-0 bg-transparent px-0 py-0 text-[15px] leading-7 text-[#111827] shadow-none placeholder:text-[#8A8A8A] focus-visible:ring-0",
            isDraftFocused && "opacity-100",
          )}
        />
      </div>

      <div className="border-t border-black/10 bg-[#FCFCFD] px-5 py-4 text-[15px] leading-7 text-[#111827]">
        <div className="font-semibold text-[#111827]">From: {conversation.customerName} &lt;{customerEmail}&gt;</div>
        <div className="font-semibold text-[#111827]">Date: {threadDate}</div>
        <div className="font-semibold text-[#111827]">To: {agentName} &lt;{agentEmail}&gt;</div>
        <div className="font-semibold text-[#111827]">Subject: {emailThread.subject || replySubject.replace(/^Re:\s*/i, "")}</div>
        <div className="mt-3 whitespace-pre-wrap text-[#111827]">{emailThread.body || "No prior email content yet."}</div>
      </div>
    </div>
  );
}

export default function ConversationPanel({
  conversation,
  activeChannel,
  draftKey,
  className,
  customerId,
  onConversationChange,
  onSelectChannel,
  onOpenDeskPanel,
  onResolveAssignment,
  showAiPanel = true,
  hideTranscript = false,
}: ConversationPanelProps) {
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;
  const isVoiceChannel = activeChannel === "voice";
  const isEmailChannel = activeChannel === "email";
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const narrowOverlayRef = useRef<HTMLDivElement>(null);
  const narrowAiScrollRef = useRef<HTMLDivElement>(null);
  const wideAiScrollRef = useRef<HTMLDivElement>(null);
  const [isNarrowPanel, setIsNarrowPanel] = useState(false);
  const [narrowTab, setNarrowTab] = useState<"conversation" | "copilot">("conversation");
  const [footerHeight, setFooterHeight] = useState(0);

  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const previousMessageCountRef = useRef(conversation.messages.length);
  const shouldStickToBottomRef = useRef(true);
  const [draft, setDraft] = useState(conversation.draft);
  const [isDraftFocused, setIsDraftFocused] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [suggestionRefreshKey, setSuggestionRefreshKey] = useState(0);
  const [suggestionEditPrompt, setSuggestionEditPrompt] = useState("");
  const [editedInlineSuggestion, setEditedInlineSuggestion] = useState<InlineSuggestion | null>(null);
  const [suggestionAccordionValue, setSuggestionAccordionValue] = useState<string>("ai-suggestion");
  const [aiPanelWidth, setAiPanelWidth] = useState(550); // default width
  const aiPanelDragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  // Wide AI panel animation states — content hides before width collapses so nothing looks squished
  const [isAiContentVisible, setIsAiContentVisible] = useState(showAiPanel);
  const [isAiContentEntered, setIsAiContentEntered] = useState(showAiPanel);
  const [aiDisplayWidth, setAiDisplayWidth] = useState(showAiPanel ? 550 : 0);
  const [isSuggestionEditorOpen, setIsSuggestionEditorOpen] = useState(false);
  const [isSuggestionAdded, setIsSuggestionAdded] = useState(false);
  const [openedTicketId, setOpenedTicketId] = useState<string | null>(null);
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<number>>(new Set());
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);
  const [revealedTaskIds, setRevealedTaskIds] = useState<Set<string>>(new Set());
  const [checkedTaskIds, setCheckedTaskIds] = useState<Set<string>>(new Set());
  const [taskProgress, setTaskProgress] = useState<Record<string, { stepIndex: number; paused: boolean }>>({});
  const [hoveredProgressStep, setHoveredProgressStep] = useState<string | null>(null);
  const [postActionSuggestion, setPostActionSuggestion] = useState<string | null>(null);
  const [postActionAnimKey, setPostActionAnimKey] = useState(0);
  const [aiNewCount, setAiNewCount] = useState(0);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotThinking, setCopilotThinking] = useState(false);
  const isAiScrolledToBottomRef = useRef(true);
  const prevAiSuggestionRef = useRef<string | null>(null);
  const prevRevealedCountRef = useRef(0);
  const taskRevealTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const copilotThinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversationRef = useRef(conversation);
  conversationRef.current = conversation;
  const notedTaskIdsRef = useRef<Set<string>>(new Set());
  const latestMessage = conversation.messages[conversation.messages.length - 1];
  const latestCustomerMessage = [...conversation.messages].reverse().find((message) => message.role === "customer") ?? null;
  // Internal notes are agent-side records, not real conversation turns — ignore them
  // when deciding whether the latest turn was from the customer.
  const latestNonInternalMessage = [...conversation.messages].reverse().find((m) => !m.isInternal) ?? null;
  const latestMessageIsCustomer = latestNonInternalMessage?.role === "customer";
  const suggestionVariants = latestCustomerMessage
    ? getInlineSuggestionVariants(conversation, latestCustomerMessage)
    : [];
  const generatedInlineSuggestion = latestCustomerMessage
    ? getSuggestionVariant(suggestionVariants, suggestionRefreshKey)
    : null;
  const inlineSuggestion = editedInlineSuggestion ?? generatedInlineSuggestion;
  const conversationOverview = getConversationOverview(conversation);
  const shouldShowSuggestion =
    (latestMessageIsCustomer || !!postActionSuggestion) &&
    latestCustomerMessage !== null &&
    (inlineSuggestion !== null || !!postActionSuggestion) &&
    !conversation.isCustomerTyping;
  const suggestionActions = useMemo(() => {
    if (!inlineSuggestion || !latestCustomerMessage || !customerId) {
      return [] as SuggestionAction[];
    }

    const actionContext = `${inlineSuggestion.summary} ${inlineSuggestion.suggestedReply} ${conversationOverview.remainingNeed} ${latestCustomerMessage.content}`.toLowerCase();
    const nextActions: SuggestionAction[] = [];
    const relevantTicket = getRelevantCustomerTicket(customerId, actionContext);

    if (
      relevantTicket
      && ["ticket", "case", "billing", "payment", "retry", "declined", "charge", "blocked", "flag", "issue", "support", "upgrade"].some((keyword) => actionContext.includes(keyword))
    ) {
      nextActions.push({
        id: `ticket-${relevantTicket.id}`,
        label: "View ticket",
        initialTab: "Tickets",
        ticketId: relevantTicket.id,
        ticket: relevantTicket,
      });
    }

    if (["account", "billing", "profile", "verification", "status", "zip", "security", "refresh"].some((keyword) => actionContext.includes(keyword))) {
      nextActions.push({
        id: "review-account",
        label: "Review account",
        initialTab: "Accounts",
      });
    }

    return nextActions;
  }, [conversationOverview.remainingNeed, customerId, inlineSuggestion, latestCustomerMessage, onOpenDeskPanel]);
  const hasDraft = draft.trim().length > 0;

  useEffect(() => {
    setDraft(conversation.draft);
  }, [conversation.draft, draftKey]);

  // Track panel width to switch AI panel between inline and overlay mode.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? container.offsetWidth;
      const nextNarrow = width < 640;
      setIsNarrowPanel(nextNarrow);
      if (!nextNarrow) setNarrowTab("conversation");
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Track footer height so the overlay stops exactly where the footer begins.
  // Re-run when activeChannel changes so we pick up the footer if it wasn't rendered initially.
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) {
      setFooterHeight(0);
      return;
    }
    const observer = new ResizeObserver(() => {
      setFooterHeight(footer.offsetHeight);
    });
    observer.observe(footer);
    setFooterHeight(footer.offsetHeight);
    return () => observer.disconnect();
  }, [activeChannel]);


  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [draft]);

  // Sequence the wide AI panel open/close animation:
  // Closing — fade content out first, then collapse width so nothing gets squished.
  // Opening — expand width first, then fade content in once the panel is visible.
  useEffect(() => {
    if (isNarrowPanel) return;
    if (showAiPanel) {
      setAiDisplayWidth(aiPanelWidth);
      setIsAiContentVisible(true);
      const t = window.setTimeout(() => setIsAiContentEntered(true), 260);
      return () => window.clearTimeout(t);
    } else {
      setIsAiContentEntered(false);
      const t = window.setTimeout(() => {
        setAiDisplayWidth(0);
        setIsAiContentVisible(false);
      }, 210);
      return () => window.clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAiPanel, isNarrowPanel]);

  // Keep display width in sync when the agent drags the resize handle.
  useEffect(() => {
    if (showAiPanel && !isNarrowPanel) setAiDisplayWidth(aiPanelWidth);
  }, [aiPanelWidth, showAiPanel, isNarrowPanel]);

  // Reset agent tasks and all related state whenever the conversation changes (new customer/channel).
  useEffect(() => {
    setAgentTasks([]);
    setRevealedTaskIds(new Set());
    setCheckedTaskIds(new Set());
    setTaskProgress({});
    setExpandedNoteIds(new Set());
    taskRevealTimersRef.current.forEach(clearTimeout);
    taskRevealTimersRef.current = [];
    notedTaskIdsRef.current = new Set();
    // Cancel any pending copilot thinking animation so it doesn't fire on the new assignment.
    if (copilotThinkingTimerRef.current !== null) {
      clearTimeout(copilotThinkingTimerRef.current);
      copilotThinkingTimerRef.current = null;
    }
    setCopilotInput("");
    setCopilotThinking(false);
  }, [conversation.label, draftKey]);

  // Generate and stagger-reveal suggested agent tasks when a new customer message arrives.
  useEffect(() => {
    if (!latestCustomerMessage) return;

    const freshTasks = getSuggestedAgentTasks(conversation, latestCustomerMessage);
    if (freshTasks.length === 0) return;

    setAgentTasks((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const newTasks = freshTasks.filter((t) => !existingIds.has(t.id));
      if (newTasks.length === 0) return prev;

      // Stagger-reveal each new task with a 180ms delay between them.
      taskRevealTimersRef.current.forEach(clearTimeout);
      taskRevealTimersRef.current = [];
      newTasks.forEach((task, i) => {
        const timer = setTimeout(() => {
          setRevealedTaskIds((ids) => new Set([...ids, task.id]));
        }, 400 + i * 180);
        taskRevealTimersRef.current.push(timer);
      });

      return [...prev, ...newTasks];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestCustomerMessage?.id]);

  // Animate in voice-specific suggested tasks when the call is connected.
  useEffect(() => {
    if (!isVoiceChannel) return;

    const voiceTasks: AgentTask[] = [
      { id: "upgrade-beverage-package", label: "Upgrade beverage package" },
      { id: "confirm-credit-line", label: "Confirm credit line" },
    ];

    setAgentTasks((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const newTasks = voiceTasks.filter((t) => !existingIds.has(t.id));
      if (newTasks.length === 0) return prev;

      newTasks.forEach((task, i) => {
        const timer = setTimeout(() => {
          setRevealedTaskIds((ids) => new Set([...ids, task.id]));
        }, 500 + i * 220);
        taskRevealTimersRef.current.push(timer);
      });

      return [...prev, ...newTasks];
    });
  }, [isVoiceChannel]);

  // Advance in-progress task steps one at a time (1.8s per step) unless paused.
  // stepIndex === steps.length means all steps completed (one past the last).
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    Object.entries(taskProgress).forEach(([taskId, progress]) => {
      if (progress.paused) return;
      const steps = TASK_STEPS[taskId] ?? [];
      if (progress.stepIndex >= steps.length) return; // all done
      const timer = setTimeout(() => {
        setTaskProgress((prev) => {
          const current = prev[taskId];
          if (!current || current.paused || current.stepIndex !== progress.stepIndex) return prev;
          return { ...prev, [taskId]: { ...current, stepIndex: current.stepIndex + 1 } };
        });
      }, 1800);
      timers.push(timer);
    });
    return () => timers.forEach(clearTimeout);
  }, [taskProgress]);

  // When all steps finish, add an internal note to the conversation timeline,
  // then remove the completed task from the AI list after a brief pause.
  useEffect(() => {
    Object.entries(taskProgress).forEach(([taskId, progress]) => {
      const steps = TASK_STEPS[taskId] ?? [];
      const isAllDone = progress.stepIndex >= steps.length;
      if (!isAllDone || notedTaskIdsRef.current.has(taskId)) return;
      notedTaskIdsRef.current.add(taskId);
      const noteLabel = TASK_COMPLETION_NOTES[taskId];
      if (!noteLabel || !onConversationChange) return;
      const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      const conv = conversationRef.current;
      // Attach a ticket record to ticket-creation notes so the note can be expanded
      const noteTicket = taskId === "create-ticket"
        ? getRelevantCustomerTicket(customerId, "ticket issue error")
        : undefined;
      onConversationChange({
        ...conv,
        messages: [
          ...conv.messages,
          {
            id: Date.now(),
            role: "agent",
            content: `${noteLabel} — ${dateStr}`,
            time: formatConversationTimestamp(new Date()),
            isInternal: true,
            ticket: noteTicket ?? undefined,
          },
        ],
      });
      // Update the Suggested Response to reflect the completed action.
      const completionReply = TASK_COMPLETION_REPLIES[taskId];
      if (completionReply) setPostActionSuggestion(completionReply);
      // Remove the completed task from the AI list after a short delay so the
      // agent briefly sees the completed state before it disappears.
      setTimeout(() => {
        setAgentTasks((prev) => prev.filter((t) => t.id !== taskId));
        setCheckedTaskIds((prev) => { const next = new Set(prev); next.delete(taskId); return next; });
        setRevealedTaskIds((prev) => { const next = new Set(prev); next.delete(taskId); return next; });
        setTaskProgress((prev) => { const { [taskId]: _, ...rest } = prev; return rest; });
        if (taskId === "set-resolved") {
          onResolveAssignment?.();
        }
      }, 1200);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskProgress]);

  const handleToggleTaskCheck = (taskId: string) => {
    setCheckedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
        setTaskProgress((p) => { const { [taskId]: _, ...rest } = p; return rest; });
      } else {
        next.add(taskId);
        setTaskProgress((p) => ({ ...p, [taskId]: { stepIndex: 0, paused: false } }));
        // Always scroll to bottom when checking a task — the card is expanding and the
        // agent needs to see the in-progress steps that are about to appear below it.
        requestAnimationFrame(() => requestAnimationFrame(scrollAiPanelsToBottom));
      }
      return next;
    });
  };

  const toggleTaskPause = (taskId: string) => {
    setTaskProgress((prev) => {
      const current = prev[taskId];
      if (!current) return prev;
      return { ...prev, [taskId]: { ...current, paused: !current.paused } };
    });
  };

  // When a step advances inside an expanded task card, scroll to bottom if the agent
  // is already there so they continue to see the latest step without interrupting scrolling.
  useEffect(() => {
    if (!isAiScrolledToBottomRef.current) return;
    const id = requestAnimationFrame(scrollAiPanelsToBottom);
    return () => cancelAnimationFrame(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskProgress]);

  const scrollAiPanelsToBottom = () => {
    [narrowAiScrollRef.current, wideAiScrollRef.current].forEach((el) => {
      if (el) el.scrollTop = el.scrollHeight;
    });
    isAiScrolledToBottomRef.current = true;
    setAiNewCount(0);
  };

  const handleAiScroll = (el: HTMLDivElement) => {
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
    isAiScrolledToBottomRef.current = atBottom;
    if (atBottom) setAiNewCount(0);
  };

  const handleAiChipClick = () => {
    requestAnimationFrame(scrollAiPanelsToBottom);
  };

  const handleCopilotSubmit = () => {
    const trimmed = copilotInput.trim();
    if (!trimmed || copilotThinking) return;
    const matched = matchCopilotInput(trimmed);
    setCopilotInput("");
    setCopilotThinking(true);
    copilotThinkingTimerRef.current = setTimeout(() => {
      copilotThinkingTimerRef.current = null;
      setCopilotThinking(false);
      if (matched) {
        // Add the task if not already present
        setAgentTasks((prev) =>
          prev.some((t) => t.id === matched.id) ? prev : [...prev, matched],
        );
        requestAnimationFrame(scrollAiPanelsToBottom);
      }
    }, 900);
  };

  // On mount: scroll AI panels to bottom after the DOM has painted.
  useEffect(() => {
    const id = requestAnimationFrame(scrollAiPanelsToBottom);
    return () => cancelAnimationFrame(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When genuinely new content arrives, auto-scroll if already at bottom,
  // or increment the chip counter if the agent has scrolled up.
  useEffect(() => {
    const newSuggestion = inlineSuggestion?.suggestedReply ?? null;
    const newRevealedCount = revealedTaskIds.size;

    const hasNewContent =
      newSuggestion !== prevAiSuggestionRef.current ||
      newRevealedCount > prevRevealedCountRef.current;

    prevAiSuggestionRef.current = newSuggestion;
    prevRevealedCountRef.current = newRevealedCount;

    if (!hasNewContent) return;

    const id = requestAnimationFrame(() => {
      if (isAiScrolledToBottomRef.current) {
        scrollAiPanelsToBottom();
      } else {
        setAiNewCount((c) => c + 1);
      }
    });
    return () => cancelAnimationFrame(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inlineSuggestion?.suggestedReply, revealedTaskIds.size]);

  const getScrollViewport = () => {
    if (scrollViewportRef.current) return scrollViewportRef.current;

    const viewport = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (!(viewport instanceof HTMLDivElement)) return null;

    scrollViewportRef.current = viewport;
    return viewport;
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const viewport = getScrollViewport();
    if (!viewport) return;

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior,
    });
  };

  const queueScrollToBottomAfterLayout = () => {
    let settleFrameId = 0;
    const frameId = window.requestAnimationFrame(() => {
      scrollToBottom("auto");
      settleFrameId = window.requestAnimationFrame(() => {
        scrollToBottom("auto");
      });
    });
    const timeoutId = window.setTimeout(() => {
      scrollToBottom("auto");
    }, 320);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.cancelAnimationFrame(settleFrameId);
      window.clearTimeout(timeoutId);
    };
  };

  useEffect(() => {
    const viewport = getScrollViewport();
    if (!viewport) return;

    const handleScroll = () => {
      const atBottom = isScrolledToBottom(viewport);
      shouldStickToBottomRef.current = atBottom;

      if (atBottom) {
        setNewMessagesCount(0);
      }
    };

    handleScroll();
    viewport.addEventListener("scroll", handleScroll, { passive: true });

    const cleanupQueuedScroll = queueScrollToBottomAfterLayout();

    return () => {
      cleanupQueuedScroll();
      viewport.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    previousMessageCountRef.current = conversation.messages.length;
    shouldStickToBottomRef.current = true;
    setNewMessagesCount(0);

    return queueScrollToBottomAfterLayout();
  }, [draftKey]);

  useEffect(() => {
    const previousMessageCount = previousMessageCountRef.current;
    const nextMessageCount = conversation.messages.length;

    if (nextMessageCount <= previousMessageCount) {
      previousMessageCountRef.current = nextMessageCount;
      return;
    }

    const addedMessagesCount = nextMessageCount - previousMessageCount;

    if (shouldStickToBottomRef.current) {
      const frameId = window.requestAnimationFrame(() => {
        scrollToBottom("smooth");
      });

      setNewMessagesCount(0);
      previousMessageCountRef.current = nextMessageCount;

      return () => window.cancelAnimationFrame(frameId);
    }

    setNewMessagesCount((currentCount) => currentCount + addedMessagesCount);
    previousMessageCountRef.current = nextMessageCount;
  }, [conversation.messages]);

  useEffect(() => {
    if (!conversation.isCustomerTyping || !shouldStickToBottomRef.current) return;

    const frameId = window.requestAnimationFrame(() => {
      scrollToBottom("smooth");
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [conversation.isCustomerTyping]);

  const handleJumpToLatest = () => {
    shouldStickToBottomRef.current = true;
    setNewMessagesCount(0);
    scrollToBottom("smooth");
  };

  useEffect(() => {
    setSuggestionRefreshKey(0);
    setSuggestionEditPrompt("");
    setEditedInlineSuggestion(null);
    setSuggestionAccordionValue("ai-suggestion");
    setIsSuggestionEditorOpen(false);
    setIsSuggestionAdded(false);
    setPostActionSuggestion(null);
    setOpenedTicketId(null);
  }, [latestCustomerMessage?.id, draftKey]);

  useEffect(() => {
    if (!shouldShowSuggestion) {
      return;
    }

    if (suggestionAccordionValue !== "ai-suggestion" && !isSuggestionEditorOpen) {
      return;
    }

    shouldStickToBottomRef.current = true;
    return queueScrollToBottomAfterLayout();
  }, [isSuggestionEditorOpen, shouldShowSuggestion, suggestionAccordionValue]);

  useEffect(() => {
    if (draft.trim().length === 0) {
      setIsSuggestionAdded(false);
    }
  }, [draft]);

  const activeSuggestedReply = postActionSuggestion ?? inlineSuggestion?.suggestedReply ?? "";

  // When a post-action suggestion is set, open the accordion and trigger the entrance animation.
  useEffect(() => {
    if (!postActionSuggestion) return;
    setSuggestionAccordionValue("ai-suggestion");
    setPostActionAnimKey((k) => k + 1);
    setIsSuggestionAdded(false);
  }, [postActionSuggestion]);

  const handleUseSuggestion = () => {
    if (!activeSuggestedReply || isSuggestionAdded) return;

    setDraft(activeSuggestedReply);
    setIsSuggestionAdded(true);
    onConversationChange?.({
      ...conversation,
      draft: activeSuggestedReply,
    });
    textareaRef.current?.focus({ preventScroll: true });
  };

  const handleCycleSuggestion = (direction: -1 | 1) => {
    if (suggestionVariants.length <= 1) return;

    setSuggestionRefreshKey((currentValue) => currentValue + direction);
    setSuggestionEditPrompt("");
    setEditedInlineSuggestion(null);
    setSuggestionAccordionValue("ai-suggestion");
    setIsSuggestionEditorOpen(false);
    setIsSuggestionAdded(false);
  };

  const handleOpenSuggestionEditor = () => {
    setSuggestionAccordionValue("ai-suggestion");
    setIsSuggestionEditorOpen(true);
  };

  const handleApplySuggestionEdit = () => {
    const nextInstruction = suggestionEditPrompt.trim();
    if (!inlineSuggestion || !nextInstruction) return;

    setEditedInlineSuggestion(applySuggestionEdit(inlineSuggestion, nextInstruction, conversation));
    setSuggestionEditPrompt("");
    setIsSuggestionEditorOpen(false);
    setIsSuggestionAdded(false);
  };

  const handleOpenSuggestionAction = (action: SuggestionAction) => {
    if (action.ticketId) {
      setOpenedTicketId(action.ticketId);
    }
    onOpenDeskPanel?.({ initialTab: action.initialTab, ticketId: action.ticketId });
  };

  const handleClearDraft = () => {
    setDraft("");
    onConversationChange?.({
      ...conversation,
      draft: "",
    });
    textareaRef.current?.focus({ preventScroll: true });
  };

  const handleSend = (replyChannel: CustomerChannel = activeChannel) => {
    if (replyChannel !== activeChannel) {
      onSelectChannel(replyChannel);
    }

    const nextDraft = draft.trim();
    if (!nextDraft) return;

    const nextConversation: SharedConversationData = {
      ...conversation,
      draft: "",
      isCustomerTyping: true,
      messages: [
        ...conversation.messages,
        {
          id: conversation.messages.reduce((maxId, message) => Math.max(maxId, message.id), 0) + 1,
          role: "agent",
          content: nextDraft,
          time: formatConversationTimestamp(new Date()),
          channel: replyChannel,
        },
      ],
    };

    setDraft("");
    onConversationChange?.(nextConversation, replyChannel);
  };

  return (
    <div ref={containerRef} className={cn("relative flex min-h-0 flex-1 flex-row", className)}>
      <div className={cn("relative flex min-h-0 flex-col overflow-hidden", hideTranscript ? "w-0 pointer-events-none overflow-hidden" : "flex-1")}>

        {/* Narrow-mode tabs — shown below the header when width < 640 and AI panel is active */}
        {isNarrowPanel && showAiPanel && (
          <div className="shrink-0 flex border-b border-border bg-background">
            {(["conversation", "copilot"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setNarrowTab(tab)}
                className={cn(
                  "relative flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-medium capitalize transition-colors",
                  narrowTab === tab ? "text-[#006DAD]" : "text-[#7A7A7A] hover:text-[#333333]",
                )}
              >
                {tab}
                {tab === "copilot" && aiNewCount > 0 && (
                  <span className={cn(
                    "inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                    narrowTab === "copilot" ? "bg-[#EEF6FC] text-[#006DAD]" : "bg-[#F2F4F7] text-[#667085]",
                  )}>
                    {aiNewCount}
                  </span>
                )}
                {narrowTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#006DAD]" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Conversation view — hidden on copilot tab when narrow */}
        {(!isNarrowPanel || !showAiPanel || narrowTab === "conversation") && (
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="h-full p-6">
            <div className="mx-auto max-w-3xl space-y-6">
            <div className="text-center">
              <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {conversation.timelineLabel}
              </span>
            </div>

            {isVoiceChannel ? (
              <>
                {/* Internal notes generated by completed voice actions — shown above the transcript */}
                {conversation.messages.filter((m) => m.isInternal).map((message) => (
                  <div key={message.id} className="rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB] overflow-hidden">
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left",
                        message.ticket ? "cursor-pointer hover:bg-[#F3F4F6] transition-colors" : "cursor-default",
                      )}
                      onClick={() => {
                        if (!message.ticket) return;
                        setExpandedNoteIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(message.id)) { next.delete(message.id); } else { next.add(message.id); }
                          return next;
                        });
                      }}
                    >
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E4E7EC]">
                        <NotebookPen className="h-2.5 w-2.5 text-[#667085]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">Internal Note</span>
                          <span className="text-[10px] text-[#98A2B3]">{formatConversationMessageTimestamp(message.time)}</span>
                        </div>
                        <p className="text-[13px] leading-5 text-[#344054]">{message.content}</p>
                      </div>
                      {message.ticket && (
                        <ChevronDown className={cn("mt-0.5 h-4 w-4 shrink-0 text-[#98A2B3] transition-transform", expandedNoteIds.has(message.id) && "rotate-180")} />
                      )}
                    </button>
                    {message.ticket && (
                      <div
                        className={cn(
                          "grid transition-all duration-200 ease-out",
                          expandedNoteIds.has(message.id) ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="border-t border-dashed border-[#D0D5DD] p-2">
                            <InlineTicketRecord ticket={message.ticket} isOpen onToggle={() => {}} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <VoiceGuidancePanel />
              </>
            ) : isEmailChannel ? (
              <EmailConversationView
                conversation={conversation}
                customerId={customerId}
                draft={draft}
                hasDraft={hasDraft}
                isDraftFocused={isDraftFocused}
                textareaRef={textareaRef}
                onDraftChange={(nextDraft) => {
                  setDraft(nextDraft);
                  onConversationChange?.({
                    ...conversation,
                    draft: nextDraft,
                  }, activeChannel);
                }}
                onDraftFocus={() => setIsDraftFocused(true)}
                onDraftBlur={() => setIsDraftFocused(false)}
                onClearDraft={handleClearDraft}
                onSend={() => handleSend("email")}
              />
            ) : (
              <>
                {conversation.messages.map((message) => (
                  <div key={message.id} className="space-y-3">
                    {message.isInternal ? (
                      /* Internal note — not visible to the customer */
                      <div className="rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB] overflow-hidden">
                        <button
                          type="button"
                          className={cn(
                            "flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left",
                            message.ticket ? "cursor-pointer hover:bg-[#F3F4F6] transition-colors" : "cursor-default",
                          )}
                          onClick={() => {
                            if (!message.ticket) return;
                            setExpandedNoteIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(message.id)) { next.delete(message.id); } else { next.add(message.id); }
                              return next;
                            });
                          }}
                        >
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E4E7EC]">
                            <NotebookPen className="h-2.5 w-2.5 text-[#667085]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">Internal Note</span>
                              <span className="text-[10px] text-[#98A2B3]">{formatConversationMessageTimestamp(message.time)}</span>
                            </div>
                            <p className="text-[13px] leading-5 text-[#344054]">{message.content}</p>
                          </div>
                          {message.ticket && (
                            <ChevronDown className={cn("mt-0.5 h-4 w-4 shrink-0 text-[#98A2B3] transition-transform", expandedNoteIds.has(message.id) && "rotate-180")} />
                          )}
                        </button>
                        {message.ticket && (
                          <div
                            className={cn(
                              "grid transition-all duration-200 ease-out",
                              expandedNoteIds.has(message.id) ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                            )}
                          >
                            <div className="overflow-hidden">
                              <div className="border-t border-dashed border-[#D0D5DD] p-2">
                                <InlineTicketRecord
                                  ticket={message.ticket}
                                  isOpen
                                  onToggle={() => {}}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "flex max-w-[85%] flex-col",
                          message.role === "agent" ? "ml-auto items-end" : "mr-auto items-start",
                        )}
                      >
                        <div className="mb-1 flex items-center gap-2 px-1 text-xs text-[#475467]">
                          <span className="font-medium">{message.role === "agent" ? "You" : customerFirstName}</span>
                          <span aria-hidden="true" className="text-[#C4C4C4]">|</span>
                          <span className="font-medium">{getConversationChannelLabel(message.channel ?? activeChannel)}</span>
                        </div>
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3 text-sm shadow-sm",
                            message.role === "agent"
                              ? "rounded-br-sm bg-primary text-primary-foreground"
                              : "rounded-bl-sm border border-border/50 bg-muted text-foreground",
                          )}
                        >
                          {message.content}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 px-1 text-xs text-[#98A2B3]">
                          <span>{formatConversationMessageTimestamp(message.time)}</span>
                        </div>
                        {message.sentiment === "frustrated" && (
                          <div className="mt-1.5 flex items-center gap-1 px-1 text-xs font-medium text-[#B54708]">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Frustrated sentiment detected
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {conversation.isCustomerTyping && (
                  <div className="mr-auto flex max-w-[85%] flex-col items-start">
                    <span className="mb-1 ml-1 text-xs font-medium text-muted-foreground">{customerFirstName}</span>
                    <div className="rounded-2xl rounded-bl-sm border border-border/50 bg-muted px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#6B7280]"></span>
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#6B7280] [animation-delay:120ms]"></span>
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#6B7280] [animation-delay:240ms]"></span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {!isVoiceChannel && !isEmailChannel && newMessagesCount > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-6">
            <Button
              type="button"
              size="sm"
              onClick={handleJumpToLatest}
              className="pointer-events-auto rounded-full bg-[#111827] px-4 text-white shadow-lg hover:bg-[#1F2937]"
            >
              {newMessagesCount} new {newMessagesCount === 1 ? "message" : "messages"}
            </Button>
          </div>
        )}
      </div>
        )} {/* end conversation view conditional */}

        {/* Copilot tab content — inline when narrow and copilot tab is active */}
        {isNarrowPanel && showAiPanel && narrowTab === "copilot" && (
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="relative flex-1 min-h-0">
              <div ref={narrowAiScrollRef} onScroll={(e) => handleAiScroll(e.currentTarget)} className="h-full overflow-y-auto p-3 space-y-3">
                {isVoiceChannel && <VoiceAIGuidanceCard />}
                {shouldShowSuggestion && (inlineSuggestion || postActionSuggestion) && (
                  <div className="rounded-2xl border border-[#B7E6DD] bg-[#EAF8F4] px-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                    <Accordion type="single" collapsible value={suggestionAccordionValue} onValueChange={setSuggestionAccordionValue}>
                      <AccordionItem value="ai-suggestion" className="border-b-0">
                        <AccordionTrigger className="py-4 text-left hover:no-underline">
                          <div className="flex flex-1 items-center justify-between mr-2">
                            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#369D3F]">
                              <span>Suggested Response</span>
                            </div>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7 rounded-full border-black/10 bg-white text-[#7A7A7A] hover:bg-white/70 hover:text-[#333333]" onClick={() => handleCycleSuggestion(-1)} disabled={suggestionVariants.length <= 1}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7 rounded-full border-black/10 bg-white text-[#7A7A7A] hover:bg-white/70 hover:text-[#333333]" onClick={() => handleCycleSuggestion(1)} disabled={suggestionVariants.length <= 1}><ChevronRight className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4">
                          <p key={postActionAnimKey} className="text-sm leading-6 text-[#25403B] animate-in fade-in duration-500">{activeSuggestedReply}</p>
                          {!isVoiceChannel && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                className={cn(
                                  "h-9 rounded-lg px-4",
                                  isSuggestionAdded
                                    ? "bg-[#D9F2EA] text-[#369D3F] hover:bg-[#D9F2EA]"
                                    : "bg-[#006DAD] text-white hover:bg-[#0A5E92]",
                                )}
                                onClick={handleUseSuggestion}
                                disabled={isSuggestionAdded}
                              >
                                {isSuggestionAdded ? <Check className="mr-2 h-4 w-4" /> : null}
                                {isSuggestionAdded ? "Added" : "Use response"}
                              </Button>
                              <Button type="button" size="sm" variant="outline" className="h-9 rounded-lg border-black/10 bg-white px-4 text-[#333333] hover:bg-[#F8F8F9]" onClick={handleOpenSuggestionEditor}>Edit</Button>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
                {agentTasks.length > 0 && (
                  <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#F8F8F9]">
                    <div className="px-4 pt-3 pb-1">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#333333]">Suggested Actions</span>
                    </div>
                    <div className="px-3 pb-3 pt-1 space-y-1.5">
                      {agentTasks.map((task) => {
                        const progress = taskProgress[task.id];
                        const isChecked = checkedTaskIds.has(task.id);
                        const steps = TASK_STEPS[task.id] ?? [];
                        return (
                          <div
                            key={task.id}
                            className={cn(
                              "rounded-xl border border-black/[0.06] bg-white overflow-hidden transition-[opacity,transform] duration-300 ease-out",
                              revealedTaskIds.has(task.id)
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 translate-y-2 pointer-events-none",
                            )}
                          >
                            <div className="flex items-center gap-3 px-3 py-2.5">
                              <button
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => handleToggleTaskCheck(task.id)}
                                className={cn(
                                  "shrink-0 h-[18px] w-[18px] rounded-[5px] border-2 flex items-center justify-center transition-colors",
                                  isChecked ? "border-[#006DAD] bg-[#006DAD]" : "border-[#D0D5DD] bg-white hover:border-[#006DAD]",
                                )}
                              >
                                {isChecked && <Check className="h-2.5 w-2.5 text-white" />}
                              </button>
                              <span className={cn(
                                "flex-1 text-[13px] leading-5 text-[#111827] transition-colors",
                                isChecked && progress && progress.stepIndex >= steps.length - 1 && "line-through text-[#9CA3AF]",
                              )}>
                                {task.label}
                              </span>
                              <button
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => {
                                  setAgentTasks((prev) => prev.filter((t) => t.id !== task.id));
                                  setRevealedTaskIds((prev) => { const next = new Set(prev); next.delete(task.id); return next; });
                                  setTaskProgress((p) => { const { [task.id]: _, ...rest } = p; return rest; });
                                }}
                                className="shrink-0 text-[#AAAAAA] hover:text-[#EF4444] transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            {isChecked && progress && (
                              <div className="border-t border-black/[0.05] px-3 pb-3 pt-2.5">
                                <p className="mb-2.5 text-[12px] font-semibold text-[#111827]">
                                  {TASK_ACTION_TITLES[task.id] ?? `${task.label}...`}
                                </p>
                                <div className="space-y-2.5">
                                  {steps.map((step, stepIdx) => {
                                    const isStepCompleted = stepIdx < progress.stepIndex;
                                    const isStepInProgress = stepIdx === progress.stepIndex;
                                    const isPaused = progress.paused && isStepInProgress;
                                    const hoverKey = `${task.id}-${stepIdx}`;
                                    const isHovered = hoveredProgressStep === hoverKey;
                                    return (
                                      <div
                                        key={stepIdx}
                                        className="flex items-center gap-2.5"
                                        onMouseEnter={() => isStepInProgress && setHoveredProgressStep(hoverKey)}
                                        onMouseLeave={() => setHoveredProgressStep(null)}
                                      >
                                        <div className="shrink-0 h-6 w-6 flex items-center justify-center">
                                          {isStepCompleted ? (
                                            <div className="h-6 w-6 rounded-full bg-[#0B9A8A] flex items-center justify-center">
                                              <Check className="h-3.5 w-3.5 text-white" />
                                            </div>
                                          ) : isStepInProgress ? (
                                            (isHovered || isPaused) ? (
                                              <button
                                                type="button"
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={() => toggleTaskPause(task.id)}
                                                className="h-6 w-6 rounded-full border-2 border-[#0B9A8A] flex items-center justify-center hover:bg-[#F0FDFB] transition-colors"
                                              >
                                                {isPaused
                                                  ? <Play className="h-2.5 w-2.5 text-[#0B9A8A] fill-[#0B9A8A]" />
                                                  : <Pause className="h-2.5 w-2.5 text-[#0B9A8A] fill-[#0B9A8A]" />}
                                              </button>
                                            ) : (
                                              <div className="h-6 w-6 rounded-full border-2 border-[#E5E7EB] border-t-[#0B9A8A] animate-spin" />
                                            )
                                          ) : (
                                            <div className="h-6 w-6 rounded-full border-2 border-[#E5E7EB]" />
                                          )}
                                        </div>
                                        <span className={cn(
                                          "text-[13px] leading-5",
                                          isStepCompleted ? "text-[#6B7280]" : "text-[#111827]",
                                        )}>
                                          {step}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {aiNewCount > 0 && (
                <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center px-3">
                  <button
                    type="button"
                    onClick={handleAiChipClick}
                    className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-[#111827] px-3 py-1.5 text-[11px] font-medium text-white shadow-lg hover:bg-[#1F2937] transition-colors"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0B9A8A]" />
                    {aiNewCount} new message{aiNewCount !== 1 ? "s" : ""}
                  </button>
                </div>
              )}
            </div>
            {/* Copilot input */}
            <div className="shrink-0 border-t border-black/[0.06] p-3">
              <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                {copilotThinking ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#006DAD]" />
                ) : (
                  <Bot className="h-4 w-4 shrink-0 text-[#AAAAAA]" />
                )}
                <input
                  type="text"
                  value={copilotInput}
                  onChange={(e) => setCopilotInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCopilotSubmit(); } }}
                  placeholder={copilotThinking ? "Thinking…" : "Ask Copilot anything..."}
                  disabled={copilotThinking}
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-[#111827] placeholder:text-[#AAAAAA] focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleCopilotSubmit}
                  disabled={!copilotInput.trim() || copilotThinking}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EEF6FC] text-[#006DAD] transition-colors hover:bg-[#DAEEF9] disabled:pointer-events-none disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

      {!isVoiceChannel && !isEmailChannel && (!isNarrowPanel || !showAiPanel || narrowTab === "conversation") && (
        <div ref={footerRef} className="shrink-0 border-t border-border bg-background p-4">
          <div
            className={cn(
              "rounded-2xl bg-white px-3 py-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[border-color,box-shadow]",
              isDraftFocused ? "border border-transparent shadow-none" : "border border-black/10",
            )}
          >
            <Textarea
              key={draftKey}
              ref={textareaRef}
              placeholder="Type your live response..."
              value={draft}
              onChange={(event) => {
                const nextDraft = event.target.value;
                setDraft(nextDraft);
                onConversationChange?.({
                  ...conversation,
                  draft: nextDraft,
                }, activeChannel);
              }}
              onFocus={() => setIsDraftFocused(true)}
              onBlur={() => setIsDraftFocused(false)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              className="!min-h-0 resize-none overflow-hidden border-0 bg-transparent px-0 py-0 text-[15px] shadow-none placeholder:text-[#8A8A8A] focus:outline-none focus-visible:outline-none focus-visible:ring-0"
            />

            <div className="mt-2 flex items-center justify-between gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full border border-black/10 bg-white text-[#5B5B5B] hover:bg-[#F8F8F9] hover:text-[#333333]"
                    aria-label="Open conversation actions"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  side="top"
                  sideOffset={12}
                  className="z-[120] w-[320px] rounded-[8px] border border-black/10 bg-white p-0 shadow-[0_20px_50px_rgba(0,0,0,0.16)]"
                >
                  <div>
                    {conversationFooterMenuItems.map((item) => (
                      <DropdownMenuItem
                        key={item}
                        className="rounded-xl px-4 py-4 text-[15px] text-[#333333] focus:bg-[#F8F8F9]"
                      >
                        {item}
                      </DropdownMenuItem>
                    ))}
                  </div>
                  <DropdownMenuSeparator className="my-0 bg-black/10" />
                  <div>
                    {conversationFooterSecondaryMenuItems.map((item) => (
                      <DropdownMenuItem
                        key={item}
                        className={cn(
                          "rounded-xl px-4 py-4 text-[15px] text-[#333333] focus:bg-[#F8F8F9]",
                          item === "Web search" && "text-[#0B7C86] focus:text-[#0B7C86]",
                        )}
                      >
                        {item}
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full border border-black/10 bg-white text-[#666666] hover:bg-[#F8F8F9] hover:text-[#333333]"
                  aria-label="Conversation options"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full border border-black/10 bg-white text-[#666666] hover:bg-[#F8F8F9] hover:text-[#333333]"
                  aria-label="Voice input"
                >
                  <AudioLines className="h-4 w-4" />
                </Button>
                {hasDraft ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={handleClearDraft}
                    className="h-8 rounded-full border border-black/10 bg-white px-3 text-[#666666] hover:bg-[#F8F8F9] hover:text-[#333333]"
                    aria-label="Clear input"
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Clear
                  </Button>
                ) : null}
                <Button
                  type="button"
                  onClick={() => handleSend()}
                  className={cn(
                    "h-8 w-8 rounded-full bg-[#111827] text-white hover:bg-[#1F2937]",
                    !hasDraft && "cursor-not-allowed bg-[#D1D5DB] text-white hover:bg-[#D1D5DB]",
                  )}
                  size="icon"
                  aria-label={hasDraft ? `Send via ${getConversationChannelLabel(activeChannel)}` : "Enter a response to send"}
                  disabled={!hasDraft}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Wide inline mode — resize handle + panel */}
      {/* Drag resize handle — present during open/close transitions */}
      {!isNarrowPanel && isAiContentVisible && !hideTranscript && (
        <div
          className="relative h-full w-1 shrink-0 cursor-col-resize group z-10"
          onMouseDown={(e) => {
            e.preventDefault();
            aiPanelDragRef.current = { startX: e.clientX, startWidth: aiPanelWidth };
            const onMove = (ev: MouseEvent) => {
              if (!aiPanelDragRef.current) return;
              const delta = aiPanelDragRef.current.startX - ev.clientX;
              const next = Math.min(640, Math.max(368, aiPanelDragRef.current.startWidth + delta));
              setAiPanelWidth(next);
            };
            const onUp = () => {
              aiPanelDragRef.current = null;
              window.removeEventListener("mousemove", onMove);
              window.removeEventListener("mouseup", onUp);
            };
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
          }}
        >
          <div className="absolute inset-y-0 left-0 w-px bg-border" />
          <div className="absolute inset-y-0 left-[-1px] w-[5px] bg-transparent group-hover:bg-primary/20 transition-colors" />
        </div>
      )}
      {/* Wide AI panel — width animates open/closed, content fades separately */}
      <div
        className={cn(
          "h-full overflow-hidden transition-[width] duration-300 ease-out",
          !hideTranscript && "shrink-0",
          hideTranscript && "flex-1",
          isNarrowPanel && !hideTranscript && "pointer-events-none",
        )}
        style={hideTranscript ? undefined : { width: isNarrowPanel ? 0 : aiDisplayWidth }}
      >
        <div
          className={cn(
            "h-full flex flex-col overflow-hidden transition-[opacity] duration-[220ms] ease-in-out",
            isAiContentEntered ? "opacity-100" : "opacity-0",
          )}
          style={{ width: aiPanelWidth }}
        >
          {/* Scrollable content */}
          <div className="relative flex-1 min-h-0">
          <div ref={wideAiScrollRef} onScroll={(e) => handleAiScroll(e.currentTarget)} className="h-full overflow-y-auto p-3 space-y-3">
          {isVoiceChannel && <VoiceAIGuidanceCard />}
          {shouldShowSuggestion && (inlineSuggestion || postActionSuggestion) && (
            <div className="rounded-2xl border border-[#B7E6DD] bg-[#EAF8F4] px-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <Accordion
                type="single"
                collapsible
                value={suggestionAccordionValue}
                onValueChange={(value) => setSuggestionAccordionValue(value)}
              >
                <AccordionItem value="ai-suggestion" className="border-b-0">
                  <AccordionTrigger className="py-4 text-left hover:no-underline">
                    <div className="flex flex-1 items-center justify-between mr-2">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#369D3F]">
                        <span>Suggested Response</span>
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button type="button" size="icon" variant="outline" aria-label="Show previous AI suggestion" className="h-7 w-7 rounded-full border-black/10 bg-white text-[#7A7A7A] hover:bg-white/70 hover:text-[#333333]" onClick={() => handleCycleSuggestion(-1)} disabled={suggestionVariants.length <= 1}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                        <Button type="button" size="icon" variant="outline" aria-label="Show next AI suggestion" className="h-7 w-7 rounded-full border-black/10 bg-white text-[#7A7A7A] hover:bg-white/70 hover:text-[#333333]" onClick={() => handleCycleSuggestion(1)} disabled={suggestionVariants.length <= 1}><ChevronRight className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <p key={postActionAnimKey} className="text-sm leading-6 text-[#25403B] animate-in fade-in duration-500">{activeSuggestedReply}</p>
                    {isSuggestionEditorOpen ? (
                      <div className="mt-4 rounded-xl border border-[#B7E6DD] bg-white/70 p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#369D3F]">
                          Edit AI suggestion
                        </div>
                        <Input
                          value={suggestionEditPrompt}
                          onChange={(event) => setSuggestionEditPrompt(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleApplySuggestionEdit();
                            }
                          }}
                          placeholder="Ask AI to modify this suggestion, e.g. add an attachment or update a ticket"
                          className="mt-2 h-10 rounded-lg border-black/10 bg-white text-sm text-[#25403B] placeholder:text-[#6E817C] focus-visible:ring-[#B7E6DD]"
                        />
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 rounded-lg bg-[#369D3F] px-3 text-white hover:bg-[#2E8A36]"
                            onClick={handleApplySuggestionEdit}
                            disabled={suggestionEditPrompt.trim().length === 0}
                          >
                            Update suggestion
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg border-black/10 bg-white px-3 text-[#333333] hover:bg-[#F8F8F9]"
                            onClick={() => {
                              setSuggestionEditPrompt("");
                              setSuggestionAccordionValue("ai-suggestion");
                              setIsSuggestionEditorOpen(false);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : null}
                    {!isVoiceChannel && (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className={cn(
                            "h-9 rounded-lg px-4",
                            isSuggestionAdded
                              ? "bg-[#D9F2EA] text-[#369D3F] hover:bg-[#D9F2EA]"
                              : "bg-[#006DAD] text-white hover:bg-[#0A5E92]",
                          )}
                          onClick={handleUseSuggestion}
                          disabled={isSuggestionAdded}
                        >
                          {isSuggestionAdded ? <Check className="mr-2 h-4 w-4" /> : null}
                          {isSuggestionAdded ? "Added" : "Use response"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-9 rounded-lg border-black/10 bg-white px-4 text-[#333333] hover:bg-[#F8F8F9]"
                          onClick={handleOpenSuggestionEditor}
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* Suggested Actions — wide panel */}
          {agentTasks.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#F8F8F9]">
              <div className="px-4 pt-3 pb-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#333333]">Suggested Actions</span>
              </div>
              <div className="px-3 pb-3 pt-1 space-y-1.5">
                {agentTasks.map((task) => {
                  const progress = taskProgress[task.id];
                  const isChecked = checkedTaskIds.has(task.id);
                  const steps = TASK_STEPS[task.id] ?? [];
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "rounded-xl border border-black/[0.06] bg-white overflow-hidden transition-[opacity,transform] duration-300 ease-out",
                        revealedTaskIds.has(task.id)
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-2 pointer-events-none",
                      )}
                    >
                      {/* Task row */}
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleTaskCheck(task.id)}
                          className={cn(
                            "shrink-0 h-[18px] w-[18px] rounded-[5px] border-2 flex items-center justify-center transition-colors",
                            isChecked ? "border-[#006DAD] bg-[#006DAD]" : "border-[#D0D5DD] bg-white hover:border-[#006DAD]",
                          )}
                        >
                          {isChecked && <Check className="h-2.5 w-2.5 text-white" />}
                        </button>
                        <span className={cn(
                          "flex-1 text-[13px] leading-5 text-[#111827] transition-colors",
                          isChecked && progress && progress.stepIndex >= steps.length - 1 && "line-through text-[#9CA3AF]",
                        )}>
                          {task.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAgentTasks((prev) => prev.filter((t) => t.id !== task.id));
                            setRevealedTaskIds((prev) => { const next = new Set(prev); next.delete(task.id); return next; });
                            setTaskProgress((p) => { const { [task.id]: _, ...rest } = p; return rest; });
                          }}
                          className="shrink-0 text-[#AAAAAA] hover:text-[#EF4444] transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* In-progress steps — shown when checked */}
                      {isChecked && progress && (
                        <div className="border-t border-black/[0.05] px-3 pb-3 pt-2.5">
                          <p className="mb-2.5 text-[12px] font-semibold text-[#111827]">
                            {TASK_ACTION_TITLES[task.id] ?? `${task.label}...`}
                          </p>
                          <div className="space-y-2.5">
                            {steps.map((step, stepIdx) => {
                              const isStepCompleted = stepIdx < progress.stepIndex;
                              const isStepInProgress = stepIdx === progress.stepIndex;
                              const isPaused = progress.paused && isStepInProgress;
                              const hoverKey = `wide-${task.id}-${stepIdx}`;
                              const isHovered = hoveredProgressStep === hoverKey;
                              return (
                                <div
                                  key={stepIdx}
                                  className="flex items-center gap-2.5"
                                  onMouseEnter={() => isStepInProgress && setHoveredProgressStep(hoverKey)}
                                  onMouseLeave={() => setHoveredProgressStep(null)}
                                >
                                  <div className="shrink-0 h-6 w-6 flex items-center justify-center">
                                    {isStepCompleted ? (
                                      <div className="h-6 w-6 rounded-full bg-[#0B9A8A] flex items-center justify-center">
                                        <Check className="h-3.5 w-3.5 text-white" />
                                      </div>
                                    ) : isStepInProgress ? (
                                      (isHovered || isPaused) ? (
                                        <button
                                          type="button"
                                          onClick={() => toggleTaskPause(task.id)}
                                          className="h-6 w-6 rounded-full border-2 border-[#0B9A8A] flex items-center justify-center hover:bg-[#F0FDFB] transition-colors"
                                        >
                                          {isPaused
                                            ? <Play className="h-2.5 w-2.5 text-[#0B9A8A] fill-[#0B9A8A]" />
                                            : <Pause className="h-2.5 w-2.5 text-[#0B9A8A] fill-[#0B9A8A]" />}
                                        </button>
                                      ) : (
                                        <div className="h-6 w-6 rounded-full border-2 border-[#E5E7EB] border-t-[#0B9A8A] animate-spin" />
                                      )
                                    ) : (
                                      <div className="h-6 w-6 rounded-full border-2 border-[#E5E7EB]" />
                                    )}
                                  </div>
                                  <span className={cn(
                                    "text-[13px] leading-5",
                                    isStepCompleted ? "text-[#6B7280]" : "text-[#111827]",
                                  )}>
                                    {step}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>{/* end overflow-y-auto */}
          {/* New content chip */}
          {aiNewCount > 0 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center px-3">
              <button
                type="button"
                onClick={handleAiChipClick}
                className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-[#111827] px-3 py-1.5 text-[11px] font-medium text-white shadow-lg hover:bg-[#1F2937] transition-colors"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#0B9A8A]" />
                1 new message
              </button>
            </div>
          )}
          </div>{/* end relative wrapper */}
          {/* Copilot input footer */}
          <div className="shrink-0 border-t border-black/[0.06] p-3">
            <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              {copilotThinking ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#006DAD]" />
              ) : (
                <Bot className="h-4 w-4 shrink-0 text-[#AAAAAA]" />
              )}
              <input
                type="text"
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCopilotSubmit(); } }}
                placeholder={copilotThinking ? "Thinking…" : "Ask Copilot anything..."}
                disabled={copilotThinking}
                className="min-w-0 flex-1 bg-transparent text-[13px] text-[#111827] placeholder:text-[#AAAAAA] focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleCopilotSubmit}
                disabled={!copilotInput.trim() || copilotThinking}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EEF6FC] text-[#006DAD] transition-colors hover:bg-[#DAEEF9] disabled:pointer-events-none disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>{/* end flex-col / opacity wrapper */}
      </div>{/* end width-animating outer panel */}
    </div>
  );
}
