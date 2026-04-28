import { createPortal } from "react-dom";
import { useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ConversationPanel, { type ConversationMessage } from "@/components/ConversationPanel";
import { createConversationState, getCustomerRecord } from "@/lib/customer-database";
import { getEscalationStart } from "@/lib/escalation-timers";

// ─── Escalation live timer ────────────────────────────────────────────────────
function EscalationTimer({ customerId }: { customerId?: string }) {
  const startRef = useRef(customerId ? getEscalationStart(customerId) : Date.now());
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - startRef.current) / 1000));
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const chip = elapsed >= 60
    ? "border-[#E32926] text-[#E32926]"
    : elapsed >= 30
    ? "border-[#FFB800] text-[#FFB800]"
    : "border-[#98A2B3] text-[#98A2B3]";
  return <span className={`rounded border bg-white px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums ${chip}`}>{mm}:{ss}</span>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type EscalatedCaseModalData = {
  id: string;
  name: string;
  customerId: string;
  customerRecordId?: string;
  channel: string;
  priority: string;
  botType: string;
  waitTime: string;
  preview: string;
  customerContext?: string;
  aiOverview: { actions: string[] };
  status: string;
  /** Timestamp (ms) when the escalation first appeared — keeps the modal timer in sync with the toast. */
  escalatedAt?: number;
  /** When true the modal auto-fires the approve sequence immediately on open */
  autoApprove?: boolean;
};

// ─── Priority styles ──────────────────────────────────────────────────────────

const priorityStyles: Record<string, string> = {
  Critical: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
  High:     "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
  Medium:   "border-[#BFDBFE] bg-[#EBF4FD] text-[#166CCA]",
  Low:      "border-[#24943E] bg-[#EFFBF1] text-[#208337]",
};

// ─── Copilot constants ────────────────────────────────────────────────────────

const COPILOT_REASONING_STEPS = [
  "Reviewing case history and prior customer interactions...",
  "Analyzing attempted resolutions and their outcomes...",
  "Cross-referencing similar resolved cases in the knowledge base...",
  "Synthesizing recommended next steps and action items...",
];

const QUICK_ACTION_OPTIONS = [
  "Notify data protection officer",
  "Suspend account access temporarily",
  "Escalate to security team",
  "Send breach notification to customer",
];

const POTENTIAL_NEXT_STEPS = [
  "Back up port forwarding rules to customer account before reset",
  "Initiate factory reset and confirm each step with Jordan",
  "Apply firmware update from 4.0.8 to stable release 4.1.2",
  "Restore saved port forwarding configuration post-reset",
  "Run connection diagnostics to confirm stability",
];

// ─── Agent roster & transfer popover ─────────────────────────────────────────

type AgentAvailability = "Available" | "In a Call" | "Away" | "Offline";

interface Agent {
  id: string;
  name: string;
  initials: string;
  availability: AgentAvailability;
  skills: string[];
  activeCount: number;
}

const agentRoster: Agent[] = [
  { id: "agent-1", name: "Jeff Comstock",  initials: "JC", availability: "Available",  skills: ["Billing", "Account Management", "Escalations"],     activeCount: 2 },
  { id: "agent-2", name: "Priya Mehra",    initials: "PM", availability: "Available",  skills: ["Technical Support", "API Integration", "Security"],   activeCount: 1 },
  { id: "agent-3", name: "Sam Torres",     initials: "ST", availability: "Available",  skills: ["Compliance", "Data Exports", "Contract Renewals"],    activeCount: 3 },
  { id: "agent-4", name: "Kenji Watanabe", initials: "KW", availability: "In a Call", skills: ["Payments", "Fraud", "Wire Transfers"],                 activeCount: 4 },
  { id: "agent-5", name: "Amara Osei",     initials: "AO", availability: "Available",  skills: ["Enterprise Accounts", "Licensing", "Escalations"],    activeCount: 2 },
  { id: "agent-6", name: "Lena Fischer",   initials: "LF", availability: "Away",       skills: ["Billing", "Refunds", "Account Management"],           activeCount: 1 },
  { id: "agent-7", name: "Marcus Webb",    initials: "MW", availability: "Available",  skills: ["Security", "Identity Management", "SSO"],              activeCount: 2 },
  { id: "agent-8", name: "Chloe Nguyen",   initials: "CN", availability: "Offline",    skills: ["Technical Support", "Logistics", "Customs"],          activeCount: 0 },
];

const supervisorRoster: Agent[] = [
  { id: "sup-1", name: "Rachel Kim",    initials: "RK", availability: "Available",  skills: ["Escalations", "Enterprise Accounts", "Compliance"], activeCount: 3 },
  { id: "sup-2", name: "David Okafor",  initials: "DO", availability: "Available",  skills: ["Fraud", "Risk Management", "Wire Transfers"],        activeCount: 2 },
  { id: "sup-3", name: "Sandra Howell", initials: "SH", availability: "In a Call", skills: ["Billing", "Licensing", "Contract Renewals"],         activeCount: 4 },
  { id: "sup-4", name: "Tom Ellison",   initials: "TE", availability: "Away",       skills: ["Security", "Identity Management", "Escalations"],    activeCount: 1 },
];

const availabilityOrder: Record<AgentAvailability, number> = { Available: 0, "In a Call": 1, Away: 2, Offline: 3 };
const availabilityDot: Record<AgentAvailability, string> = {
  Available: "bg-[#208337]", "In a Call": "bg-[#FFB800]", Away: "bg-[#D0D5DD]", Offline: "bg-[#98A2B3]",
};

function scoreAgent(agent: Agent, priority: string, preview: string): number {
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

function getSmartPopoverPosition(triggerRect: DOMRect, popoverWidth: number, estimatedHeight: number, gap = 6, margin = 8) {
  const spaceBelow = window.innerHeight - triggerRect.bottom - gap - margin;
  const spaceAbove = triggerRect.top - gap - margin;
  const openBelow = spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove;
  const left = Math.max(margin, Math.min(triggerRect.left, window.innerWidth - popoverWidth - margin));
  if (openBelow) return { left, top: triggerRect.bottom + gap, maxHeight: Math.max(160, spaceBelow), transform: "none" as const };
  return { left, top: triggerRect.top - gap, maxHeight: Math.max(160, spaceAbove), transform: "translateY(-100%)" as const };
}

type TransferTab = "Agents" | "Supervisors";

function TransferPopover({ priority, preview, triggerRect, onClose, onAssign }: {
  priority: string;
  preview: string;
  triggerRect: DOMRect;
  onClose: () => void;
  onAssign: (agent: Agent) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [assigned, setAssigned] = useState<string | null>(null);
  const [tab, setTab] = useState<TransferTab>("Agents");

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
  const sortedSupervisors = [...supervisorRoster].sort(
    (a, b) => availabilityOrder[a.availability] - availabilityOrder[b.availability],
  );
  const roster = tab === "Agents" ? sortedAgents : sortedSupervisors;

  const handleAssign = (agent: Agent) => {
    setAssigned(agent.id);
    setTimeout(() => { onAssign(agent); onClose(); }, 800);
  };

  const POPOVER_WIDTH = 300;
  const { left, top, maxHeight, transform } = getSmartPopoverPosition(triggerRect, POPOVER_WIDTH, 370);

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[200] rounded-xl border border-border bg-white shadow-[0_8px_24px_rgba(16,24,40,0.12)] overflow-hidden"
      style={{ left, top, width: POPOVER_WIDTH, transform }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-semibold text-[#333333]">Transfer to</p>
        <button type="button" onClick={onClose} className="text-[#98A2B3] hover:text-[#475467] transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex border-b border-border">
        {(["Agents", "Supervisors"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "relative flex-1 py-2.5 text-[12px] font-medium transition-colors",
              tab === t ? "text-[#166CCA]" : "text-[#667085] hover:text-[#344054]",
            )}
          >
            {t}
            {tab === t && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#166CCA]" />}
          </button>
        ))}
      </div>
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
                isAssigned ? "bg-[#EBF4FD]" : "hover:bg-[#F9FAFB]",
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
                  {isAssigned && <span className="text-[10px] font-semibold text-[#166CCA]">Transferred</span>}
                </div>
                <p className="text-[10px] text-[#98A2B3] truncate">{agent.skills.join(" · ")}</p>
              </div>
              <span className="shrink-0 text-[10px] text-[#667085]">{agent.activeCount} active</span>
            </button>
          );
        })}
      </div>
      <div className="px-4 py-2.5 border-t border-border bg-[#F9FAFB]">
        <p className="text-[10px] text-[#98A2B3]">Sorted by availability · best skill match</p>
      </div>
    </div>,
    document.body,
  );
}

// ─── CopilotResponseCard ──────────────────────────────────────────────────────

function CopilotResponseCard({
  query,
  phase,
  reasoningVisible,
  isOpen,
  onToggle,
}: {
  query: string;
  phase: "thinking" | "done";
  reasoningVisible: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[#BFDBFE] bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#166CCA]" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">
            Copilot Response
          </p>
          {phase === "thinking" && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:300ms]" />
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 space-y-3">
            <p className="text-[11px] text-[#98A2B3] italic">"{query}"</p>

            {reasoningVisible > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setIsReasoningOpen((v) => !v)}
                  className="flex items-center gap-1 text-[11px] text-[#98A2B3] hover:text-[#667085] transition-colors"
                >
                  <span>{phase === "thinking" ? "Thinking…" : "Thought process"}</span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform duration-200",
                      isReasoningOpen && "rotate-180",
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-200 ease-out",
                    isReasoningOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="pt-2 space-y-1.5 border-l-2 border-[#C5DEF5] ml-1 pl-3">
                      {COPILOT_REASONING_STEPS.slice(0, reasoningVisible).map((step, i) => (
                        <div
                          key={i}
                          className="text-[11px] text-[#98A2B3] animate-in fade-in slide-in-from-bottom-1 duration-300"
                        >
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {phase === "done" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 rounded-lg bg-[#EBF4FD] border border-[#BFDBFE] px-3 py-2.5">
                <p className="text-[12px] text-[#344054] leading-relaxed">
                  Based on the case analysis, the customer's issue appears to stem from an account configuration mismatch. The previous resolution attempts addressed symptoms but not the root cause. I recommend verifying the account settings directly, issuing a service credit for the disruption, and scheduling a follow-up within 48 hours to confirm resolution.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EscalatedCaseModal ───────────────────────────────────────────────────────

export function EscalatedCaseModal({
  caseData,
  onTakeover,
  onSupervise,
  onTransfer,
  onResolve,
  onClose,
}: {
  caseData: EscalatedCaseModalData;
  onTakeover: (conversation: import("@/components/ConversationPanel").SharedConversationData, status: string, priority: string) => void;
  onSupervise: () => void;
  onTransfer: () => void;
  onResolve: () => void;
  onClose: () => void;
}) {
  const [copilotQuery, setCopilotQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [copilotPhase, setCopilotPhase] = useState<"idle" | "thinking" | "done">("idle");
  const [copilotReasoningVisible, setCopilotReasoningVisible] = useState(0);
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [isAttemptedResolutionOpen, setIsAttemptedResolutionOpen] = useState(true);
  const [isCustomerProfileOpen, setIsCustomerProfileOpen] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [superviseScrollTrigger, setSuperviseScrollTrigger] = useState(0);
  const [approveContext, setApproveContext] = useState(false);
  const [showResolvedMessage, setShowResolvedMessage] = useState(false);
  const [jordanTyping, setJordanTyping] = useState(false);

  // Avatar URLs — component-level so all JSX (both columns) can reference them
  const jacobAvatar = "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F9f1a8ec85d5f478b9a015a2b7eece268?format=webp&width=800&height=1200";
  const ariaAvatar = "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F054057b71e64441097a4902d7dcea754?format=webp&width=800&height=1200";
  const emilyAvatar = `${import.meta.env.BASE_URL}emily-avatar.jpg`;
  const botAvatar = caseData.botType === "Jacob" ? jacobAvatar : caseData.botType === "Emily" ? emilyAvatar : ariaAvatar;
  const [localStatus, setLocalStatus] = useState(caseData.status);
  const [localPriority, setLocalPriority] = useState(caseData.priority);
  const approveTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Load scripted responses from the customer database so content is data-driven.
  // Falls back to empty strings if no escalationResponses are defined for this customer.
  const dbResponses = getCustomerRecord(caseData.customerRecordId)?.escalationResponses ?? [];
  const [aiComment, setAiComment] = useState(dbResponses[0] ?? "");
  const [aiCommentApproved, setAiCommentApproved] = useState<"approved" | "rejected" | null>(null);
  const [aiCommentRegenerating, setAiCommentRegenerating] = useState(false);
  const [secondAiComment, setSecondAiComment] = useState(dbResponses[1] ?? "");
  const [secondAiCommentApproved, setSecondAiCommentApproved] = useState<"approved" | "rejected" | null>(null);
  const [secondAiCommentRegenerating, setSecondAiCommentRegenerating] = useState(false);
  const [thirdAiComment, setThirdAiComment] = useState(dbResponses[2] ?? "");
  const [thirdAiCommentApproved, setThirdAiCommentApproved] = useState<"approved" | "rejected" | null>(null);
  const [thirdAiCommentRegenerating, setThirdAiCommentRegenerating] = useState(false);
  const [sofiaAddressInjected, setSofiaAddressInjected] = useState(false);
  // Gate: only show the second AI card after Sofia has replied to the first approved message
  const [sofiaFirstReplyVisible, setSofiaFirstReplyVisible] = useState(false);
  // Thinking placeholders — true while AI is "composing" the next response after customer replies
  const [secondCardReady, setSecondCardReady] = useState(false);
  const [thirdCardReady, setThirdCardReady] = useState(false);
  // Third card two-phase split: actions approved → thinking → bot comment
  const [thirdActionsApproved, setThirdActionsApproved] = useState(false);
  const [thirdBotCommentReady, setThirdBotCommentReady] = useState(false);
  const [sofiaTyping, setSofiaTyping] = useState(false);
  // Temporary credit state — pre-checked and open by default
  const [creditChecked, setCreditChecked] = useState(true);
  const [creditExpanded, setCreditExpanded] = useState(true);
  const [creditAmount, setCreditAmount] = useState("2,159.00");
  const [creditConfirmed, setCreditConfirmed] = useState(false);

  // Replacement card shipping speed — pre-checked, Standard pre-selected, open by default
  type ShippingSpeed = "3-5 days" | "overnight" | "one week";
  const SHIPPING_OPTIONS: { label: string; value: ShippingSpeed; badge: string }[] = [
    { label: "Standard (3–5 business days)", value: "3-5 days", badge: "Free" },
    { label: "Overnight delivery", value: "overnight", badge: "Expedited" },
    { label: "Economy (up to 1 week)", value: "one week", badge: "Economy" },
  ];
  const [shippingChecked, setShippingChecked] = useState(true);
  const [shippingExpanded, setShippingExpanded] = useState(true);
  const [selectedShipping, setSelectedShipping] = useState<ShippingSpeed | null>("3-5 days");
  const [shippingConfirmed, setShippingConfirmed] = useState(false);
  // Dispute checkbox state (Sofia only)
  const DISPUTE_STEPS = [
    "Verifying account and transaction details",
    "Filing dispute for $2,159 in unauthorized charges",
    "Issuing provisional credit to account",
    "Sending dispute confirmation to Sofia",
  ];
  const [disputeChecked, setDisputeChecked] = useState(true); // pre-checked by default
  const [disputeExpanded, setDisputeExpanded] = useState(true); // preview open by default
  const [disputeRunning, setDisputeRunning] = useState(false); // only true after Approve
  const [disputePaused, setDisputePaused] = useState(false);
  const [disputeStepIndex, setDisputeStepIndex] = useState(0);
  const [disputeComplete, setDisputeComplete] = useState(false);
  const disputeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const disputeStepIndexRef = useRef(0); // mirrors disputeStepIndex for use in closures
  const [injectedMessages, setInjectedMessages] = useState<ConversationMessage[]>([]);
  const [lastApprovedMsgCount, setLastApprovedMsgCount] = useState<number | null>(null);
  const [transferTriggerRect, setTransferTriggerRect] = useState<DOMRect | null>(null);
  const transferBtnRef = useRef<HTMLButtonElement>(null);
  const copilotTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function handleCopilotSubmit() {
    if (!copilotQuery.trim()) return;
    copilotTimersRef.current.forEach(clearTimeout);
    copilotTimersRef.current = [];
    setSubmittedQuery(copilotQuery);
    setCopilotQuery("");
    setCopilotPhase("thinking");
    setCopilotReasoningVisible(0);
    setIsCopilotOpen(true);
    COPILOT_REASONING_STEPS.forEach((_, i) => {
      const t = setTimeout(() => setCopilotReasoningVisible(i + 1), 1000 + i * 600);
      copilotTimersRef.current.push(t);
    });
    const done = setTimeout(
      () => setCopilotPhase("done"),
      1000 + COPILOT_REASONING_STEPS.length * 600 + 600,
    );
    copilotTimersRef.current.push(done);
  }

  useEffect(() => () => { copilotTimersRef.current.forEach(clearTimeout); }, []);
  useEffect(() => () => { approveTimersRef.current.forEach(clearTimeout); }, []);
  useEffect(() => () => { disputeTimersRef.current.forEach(clearTimeout); }, []);

  // Shared approve logic — called by the Approve button in the modal AND by autoApprove on mount
  function triggerApprove() {
    setApproveContext(true);
    approveTimersRef.current.forEach(clearTimeout);
    approveTimersRef.current = [];
    const ariaTime = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setInjectedMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "agent" as const, author: caseData.botType, content: dbResponses[0] ?? "", time: ariaTime },
    ]);
    approveTimersRef.current.push(setTimeout(() => setJordanTyping(true), 1500));
    approveTimersRef.current.push(setTimeout(() => {
      setJordanTyping(false);
      const t1 = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      setInjectedMessages((prev) => [...prev, { id: Date.now(), role: "customer" as const, content: "That's amazing, thank you!", time: t1 }]);
    }, 3500));
    approveTimersRef.current.push(setTimeout(() => {
      const t2 = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      setInjectedMessages((prev) => [...prev, { id: Date.now(), role: "customer" as const, content: "\u2605\u2605\u2605\u2605\u2605  Case resolution rated 5 stars", time: t2 }]);
    }, 4500));
    approveTimersRef.current.push(setTimeout(() => {
      setLocalStatus("resolved");
      setLocalPriority("Low");
      setShowResolvedMessage(true);
      onResolve();
    }, 5500));
  }

  // Auto-approve on open when triggered from the toast
  useEffect(() => {
    if (caseData.autoApprove && caseData.customerRecordId === "jordan") {
      triggerApprove();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-backdrop-fade-in bg-white/80 backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="animate-modal-fade-in relative z-10 flex flex-col w-[90vw] max-w-[1280px] max-h-[90vh] rounded-2xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)] overflow-hidden">

        {/* ── Full-width header ── */}
        <div className="shrink-0 border-b border-border px-5 pt-3 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-[14px] font-bold text-[#101828]">{caseData.name}</span>
              {localStatus === "resolved" ? (
                <span className="rounded border border-[#24943E] bg-[#EFFBF1] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#208337] transition-all duration-500">
                  resolved
                </span>
              ) : localStatus === "escalated" ? (
                <>
                  <span className="rounded border border-[#E53935] bg-[#FDEAEA] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#C71D1A]">
                    escalated
                  </span>
                  <EscalationTimer customerId={caseData.customerRecordId} />
                </>
              ) : (
                <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none transition-all duration-500", priorityStyles[localPriority] ?? "border-border bg-[#F9FAFB] text-[#344054]")}>
                  {localPriority}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {localStatus === "resolved" ? (
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#208337] transition-all duration-500">
                  Case Resolved
                </p>
              ) : localStatus === "escalated" ? (
                <>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FEE2E2]">
                    <AlertTriangle className="h-3 w-3 text-[#E53935]" />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#E53935]">
                    Escalated — Immediate Action Required
                  </p>
                </>
              ) : (
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#667085]">
                  Reviewing
                </p>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#98A2B3] hover:bg-[#F2F4F7] hover:text-[#344054] transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-0.5 text-[12px] text-[#475467] leading-snug">{caseData.preview}</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#98A2B3]">
            <span>{caseData.botType}</span>
            <span>·</span>
            <span className="capitalize">{caseData.channel}</span>
            <span>·</span>
            <span>⏱ {caseData.waitTime}</span>
            <span>·</span>
            <span>{caseData.customerId}</span>
          </div>
        </div>

        {/* ── Two-column body ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left column: AI analysis */}
          <div className="flex flex-col w-[380px] shrink-0 border-r border-border overflow-hidden">
            {/* Scrollable body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
              {/* Human Assist Request */}
              {caseData.customerContext && (
                <div className="rounded-xl border border-[#BFDBFE] bg-[#EBF4FD] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <img
                      src={botAvatar}
                      alt={`${caseData.botType} avatar`}
                      className="h-9 w-9 rounded-full object-cover shrink-0"
                    />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">{caseData.botType}</p>
                  </div>
                  <p className="text-[13px] font-medium leading-5 text-[#344054]">
                    {showResolvedMessage
                      ? `Wow! Great job, Jeff! Looks like we have another happy customer. I've updated the case to resolved!`
                      : caseData.customerContext}
                  </p>

                  {/* Confidence meter — hidden once resolved or when supervising */}
                  {!approveContext && !showResolvedMessage && !showQuickActions && (
                    <div className="mt-3 rounded-lg border border-[#BFDBFE] bg-white px-3 py-2.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">AI Confidence</span>
                        </div>
                        <span className="text-[12px] font-bold text-[#166CCA]">94%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#E4E7EC] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#166CCA] to-[#4B96DA] transition-all duration-700"
                          style={{ width: "94%" }}
                        />
                      </div>
                      <p className="text-[10px] text-[#98A2B3] leading-relaxed">
                        Based on 3 similar resolved cases and firmware documentation match.
                      </p>
                    </div>
                  )}

                  {showResolvedMessage ? (
                    /* Post-resolution: status dropdown locked to resolved */
                    <div className="mt-3">
                      <div className="flex items-center justify-between rounded-lg border border-[#24943E] bg-[#EFFBF1] px-3 py-2">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#208337]">Case Status</span>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-[#208337]" />
                          <span className="text-[12px] font-semibold text-[#208337]">Resolved</span>
                          <ChevronDown className="h-3.5 w-3.5 text-[#208337]" />
                        </div>
                      </div>
                    </div>
                  ) : !approveContext && !showQuickActions ? (
                    caseData.customerRecordId === "marcus" ? (
                      // Marcus/Emily card — "Take Over" triggers the same action as the footer Takeover button
                      <button
                        type="button"
                        onClick={() => {
                          const channel = (caseData.channel === "sms" ? "sms" : "chat") as "chat" | "sms";
                          const base = caseData.customerRecordId
                            ? createConversationState(caseData.customerRecordId, channel)
                            : { customerName: caseData.name, label: "Chat", timelineLabel: "", status: "open" as const, draft: "", messages: [], isCustomerTyping: false };
                          const fullConversation = injectedMessages.length > 0
                            ? { ...base, messages: [...base.messages, ...injectedMessages] }
                            : base;
                          onTakeover(fullConversation, localStatus, localPriority);
                        }}
                        className="mt-3 w-full rounded-lg bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
                      >
                        Take Over
                      </button>
                    ) : (
                    <button
                      type="button"
                      onClick={triggerApprove}
                      className="mt-3 w-full rounded-lg border border-[#166CCA] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#166CCA] hover:bg-[#EBF4FD] transition-colors"
                    >
                      Approve
                    </button>
                    )
                  ) : !showQuickActions ? (
                    <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#EFFBF1] border border-[#24943E] px-3 py-1.5">
                      <Check className="h-3 w-3 text-[#208337]" />
                      <span className="text-[11px] font-semibold text-[#208337]">Approved — {caseData.botType} is responding to {caseData.name.split(" ")[0]}</span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Customer Profile Card */}
              {(() => {
                const rec = caseData.customerRecordId ? getCustomerRecord(caseData.customerRecordId) : null;
                if (!rec) return null;
                const initials = caseData.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                const profile = rec.profile;
                return (
                  <div className="rounded-xl border border-[#BFDBFE] bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setIsCustomerProfileOpen((v) => !v)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Customer Profile</p>
                      <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200", isCustomerProfileOpen && "rotate-180")} />
                    </button>
                    <div className={cn("grid transition-all duration-200 ease-out", isCustomerProfileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                      <div className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-3">
                          {/* Identity */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C5DEF5] text-[13px] font-bold text-[#1260B0]">
                                {initials}
                              </div>
                              <div>
                                <p className="text-[13px] font-semibold text-[#111827] leading-tight">{caseData.name}</p>
                                <p className="text-[11px] text-[#667085] leading-snug">{profile.department} · {profile.tenureYears} yr{profile.tenureYears !== 1 ? "s" : ""} tenure</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] text-[#98A2B3]">Balance</p>
                              <p className="text-[13px] font-semibold text-[#111827]">{profile.totalAUM}</p>
                            </div>
                          </div>
                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] p-2.5">
                              <p className="mb-1 text-[10px] text-[#667085]">Fraud Risk Score</p>
                              <p className={cn("text-[15px] font-bold leading-none mb-1.5", profile.fraudRiskScore >= 70 ? "text-[#E32926]" : profile.fraudRiskScore >= 40 ? "text-[#A37A00]" : "text-[#208337]")}>
                                {profile.fraudRiskScore} <span className="text-[11px] font-normal text-[#98A2B3]">/ 100</span>
                              </p>
                              <div className="h-1.5 rounded-full bg-[#E4E7EC] overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full", profile.fraudRiskScore >= 70 ? "bg-[#E32926]" : profile.fraudRiskScore >= 40 ? "bg-[#A37A00]" : "bg-[#208337]")}
                                  style={{ width: `${profile.fraudRiskScore}%` }}
                                />
                              </div>
                            </div>
                            <div className="rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] p-2.5">
                              <p className="mb-1 text-[10px] text-[#667085]">Prior Disputes</p>
                              <p className="text-[15px] font-bold leading-none text-[#111827]">{profile.priorDisputeCount === 0 ? "None" : profile.priorDisputeCount}</p>
                              <p className={cn("mt-1 text-[10px]", profile.cardBlocked ? "text-[#E32926] font-medium" : "text-[#667085]")}>
                                Card: {profile.cardBlocked ? "BLOCKED" : "NOT blocked"}
                              </p>
                            </div>
                          </div>
                          {/* Tags */}
                          {profile.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {profile.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={cn(
                                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border",
                                    tag === "Premier" ? "bg-[#EBF4FD] text-[#1260B0] border-[#BFDBFE]" :
                                    tag.includes("IVR") ? "bg-[#EFFBF1] text-[#208337] border-[#24943E]" :
                                    "bg-[#EBF4FD] text-[#166CCA] border-[#BFDBFE]",
                                  )}
                                >
                                  {tag}{(tag.includes("Auth") || tag.includes("Biometrics")) ? " ✓" : ""}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Attempted Resolution accordion */}
              <div className="rounded-xl border border-[#BFDBFE] bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsAttemptedResolutionOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Case Overview</p>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200", isAttemptedResolutionOpen && "rotate-180")} />
                </button>
                <div className={cn("grid transition-all duration-200 ease-out", isAttemptedResolutionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden">
                    <ul className="px-4 pb-4 space-y-2">
                      {caseData.aiOverview.actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-[#344054] leading-relaxed">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1260B0]" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Copilot response card */}
              {copilotPhase !== "idle" && (
                <CopilotResponseCard
                  query={submittedQuery}
                  phase={copilotPhase}
                  reasoningVisible={copilotReasoningVisible}
                  isOpen={isCopilotOpen}
                  onToggle={() => setIsCopilotOpen((v) => !v)}
                />
              )}

              {/* Potential Next Steps — shown in left column after AI response is approved */}
              {showQuickActions && aiCommentApproved === "approved" && (() => {
                const channel = (caseData.channel === "sms" ? "sms" : "chat") as "chat" | "sms";
                const baseConv = caseData.customerRecordId
                  ? createConversationState(caseData.customerRecordId, channel)
                  : { messages: [] as ConversationMessage[] };
                const allMessages = [...baseConv.messages, ...injectedMessages];
                const customerRespondedAfterApproval =
                  lastApprovedMsgCount !== null &&
                  allMessages.some((m, idx) => m.role === "customer" && idx >= lastApprovedMsgCount);
                if (customerRespondedAfterApproval) return null;
                return (
                  <div className="rounded-xl border border-[#BFDBFE] bg-white p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-[#166CCA]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Potential Next Steps</p>
                    </div>
                    <p className="text-[11px] text-[#98A2B3]">Waiting for customer to respond before preparing next AI message.</p>
                    <ul className="space-y-1.5 pt-0.5">
                      {POTENTIAL_NEXT_STEPS.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-[#344054] leading-relaxed">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#166CCA]" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </div>

            {/* Ask Copilot — pinned to bottom */}
            <div className="shrink-0 border-t border-[#E4E7EC] px-4 py-3">
              <div className="flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-white px-3 py-2">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#166CCA]" />
                <input
                  type="text"
                  value={copilotQuery}
                  onChange={(e) => setCopilotQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCopilotSubmit(); }}
                  placeholder="Ask Copilot about this Case"
                  className="min-w-0 flex-1 bg-transparent text-[12px] text-[#344054] placeholder:text-[#98A2B3] outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopilotSubmit}
                  className="shrink-0 text-[#166CCA] hover:text-[#1260B0] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Right column: live conversation */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            {(() => {
              const channel = (caseData.channel === "sms" ? "sms" : "chat") as "chat" | "sms";
              const baseConversation = caseData.customerRecordId
                ? createConversationState(caseData.customerRecordId, channel)
                : {
                    customerName: caseData.name,
                    label: "Chat",
                    timelineLabel: "",
                    status: "open" as const,
                    draft: "",
                    messages: [{ id: 1, role: "customer" as const, content: caseData.preview, time: caseData.waitTime || "now" }],
                    isCustomerTyping: false,
                  };
              const isSofia = caseData.customerRecordId === "sofia";
              const allMessages = [...baseConversation.messages, ...injectedMessages];
              const conversation = {
                ...baseConversation,
                messages: injectedMessages.length > 0 ? allMessages : baseConversation.messages,
                isCustomerTyping: isSofia ? sofiaTyping : jordanTyping,
              };

              // Second AI response card (Sofia only) — shown after first is approved
              const showSecondCard = isSofia && showQuickActions && aiCommentApproved === "approved" && secondCardReady && secondAiCommentApproved !== "approved";
              const showThirdCard = isSofia && showQuickActions && thirdCardReady && thirdAiCommentApproved !== "approved";
              // "Thinking" placeholder — shown after Sofia provides her address, before Issue Temp Credit card appears
              const showThinkingThird = isSofia && showQuickActions && sofiaAddressInjected && !thirdCardReady && aiCommentApproved === "approved" && thirdAiCommentApproved !== "approved";

              // ── Third card Phase 1: Action Authorization (credit + shipping) ────────
              const showThinkingBetweenActions = isSofia && showQuickActions && thirdActionsApproved && !thirdBotCommentReady && thirdAiCommentApproved !== "approved";
              const thirdActionAuthBubble = showThirdCard && !thirdActionsApproved ? (
                <div className="px-4 py-3 flex items-start gap-2">
                  <div className="flex-1 rounded-xl border border-[#166CCA] bg-[#EBF4FD] p-3 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-[#166CCA]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Action Authorization</p>
                    </div>
                    {/* Summary */}
                    <p className="text-[12px] text-[#344054] leading-relaxed px-1">
                      Sofia has confirmed her mailing address. Review the actions below to issue her temporary credit and a replacement card, then approve to proceed.
                    </p>

                    {/* Temporary credit */}
                    <div className="rounded-xl border border-black/[0.06] bg-white overflow-hidden">
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <button
                          type="button"
                          disabled={creditConfirmed}
                          onClick={() => {
                            if (creditConfirmed) return;
                            const next = !creditChecked;
                            setCreditChecked(next);
                            setCreditExpanded(next);
                          }}
                          className={cn(
                            "shrink-0 h-[18px] w-[18px] rounded-[5px] border-2 flex items-center justify-center transition-colors",
                            creditChecked ? "border-[#166CCA] bg-[#166CCA]" : "border-[#D0D5DD] bg-white hover:border-[#166CCA]",
                            creditConfirmed && "opacity-60 cursor-not-allowed",
                          )}
                        >
                          {creditChecked && <Check className="h-2.5 w-2.5 text-white" />}
                        </button>
                        <span className={cn(
                          "flex-1 text-[13px] leading-5 text-[#111827] transition-colors",
                          creditConfirmed && "line-through text-[#9CA3AF]",
                        )}>
                          Issue Temporary Credit to Account
                        </span>
                        {creditChecked && !creditConfirmed && (
                          <button
                            type="button"
                            onClick={() => setCreditExpanded((v) => !v)}
                            className="shrink-0 text-[#98A2B3] hover:text-[#166CCA] transition-colors"
                          >
                            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", creditExpanded && "rotate-180")} />
                          </button>
                        )}
                      </div>
                      {creditChecked && creditExpanded && (
                        <div className="border-t border-black/[0.05] px-3 pb-3 pt-2.5 space-y-2.5">
                          <p className="text-[12px] font-semibold text-[#111827]">Credit amount</p>
                          <div className={cn(
                            "flex items-center gap-2 rounded-lg border bg-white px-3 py-2 transition-colors",
                            creditConfirmed ? "border-[#E4E7EC] opacity-60" : "border-[#BFDBFE] focus-within:border-[#166CCA] focus-within:ring-1 focus-within:ring-[#166CCA]",
                          )}>
                            <span className="text-[13px] font-semibold text-[#344054]">$</span>
                            <input
                              type="text"
                              value={creditAmount}
                              readOnly={creditConfirmed}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.,]/g, "");
                                setCreditAmount(val);
                              }}
                              className="flex-1 bg-transparent text-[13px] font-semibold text-[#344054] outline-none placeholder:text-[#98A2B3]"
                              placeholder="0.00"
                            />
                            <span className="text-[11px] text-[#98A2B3] shrink-0">USD</span>
                          </div>
                          <p className="text-[10px] text-[#98A2B3] leading-relaxed">
                            Provisional credit will be applied immediately and held pending dispute resolution.
                          </p>
                          {creditConfirmed && (
                            <div className="flex items-center gap-1.5 rounded-lg bg-[#EFFBF1] border border-[#24943E] px-3 py-2">
                              <Check className="h-3.5 w-3.5 text-[#208337]" />
                              <span className="text-[11px] font-semibold text-[#208337]">
                                Temporary credit of ${creditAmount} applied to Sofia's account
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Replacement card shipping speed */}
                    <div className="rounded-xl border border-black/[0.06] bg-white overflow-hidden">
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <button
                          type="button"
                          disabled={shippingConfirmed}
                          onClick={() => {
                            if (shippingConfirmed) return;
                            const next = !shippingChecked;
                            setShippingChecked(next);
                            setShippingExpanded(next);
                          }}
                          className={cn(
                            "shrink-0 h-[18px] w-[18px] rounded-[5px] border-2 flex items-center justify-center transition-colors",
                            shippingChecked ? "border-[#166CCA] bg-[#166CCA]" : "border-[#D0D5DD] bg-white hover:border-[#166CCA]",
                            shippingConfirmed && "opacity-60 cursor-not-allowed",
                          )}
                        >
                          {shippingChecked && <Check className="h-2.5 w-2.5 text-white" />}
                        </button>
                        <span className={cn(
                          "flex-1 text-[13px] leading-5 text-[#111827] transition-colors",
                          shippingConfirmed && "line-through text-[#9CA3AF]",
                        )}>
                          Select Replacement Card Shipping Speed
                        </span>
                        {shippingChecked && !shippingConfirmed && (
                          <button
                            type="button"
                            onClick={() => setShippingExpanded((v) => !v)}
                            className="shrink-0 text-[#98A2B3] hover:text-[#166CCA] transition-colors"
                          >
                            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", shippingExpanded && "rotate-180")} />
                          </button>
                        )}
                      </div>
                      {shippingChecked && shippingExpanded && (
                        <div className="border-t border-black/[0.05] px-3 pb-3 pt-2.5 space-y-2">
                          <p className="text-[12px] font-semibold text-[#111827] mb-2">Shipping method</p>
                          {SHIPPING_OPTIONS.map((opt) => {
                            const isSelected = selectedShipping === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  if (shippingConfirmed) return;
                                  setSelectedShipping(opt.value);
                                  const deliveryText =
                                    opt.value === "overnight"
                                      ? "overnight — you'll have it tomorrow"
                                      : opt.value === "one week"
                                      ? "within up to one week"
                                      : "within 3–5 business days";
                                  setThirdAiComment(
                                    `Thank you, Sofia. I've applied a temporary credit of $2,159 to your account, your balance will be restored while we complete our investigation. You'll be able to make your rent payment without any issue. We've also permanently blocked your current card and are issuing a new one to your address on file — it will arrive ${deliveryText}. Is there anything else I can help you with?`
                                  );
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors",
                                  isSelected ? "border-[#166CCA] bg-[#EBF4FD]" : "border-[#E4E7EC] bg-white hover:border-[#166CCA] hover:bg-[#F9FAFB]",
                                  shippingConfirmed && "opacity-60 cursor-default",
                                )}
                              >
                                <span className={cn("text-[12px]", isSelected ? "font-semibold text-[#1260B0]" : "text-[#344054]")}>
                                  {opt.label}
                                </span>
                                <span className={cn(
                                  "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                                  isSelected ? "bg-[#166CCA] border-[#166CCA] text-white" : "bg-[#F2F4F7] border-[#E4E7EC] text-[#667085]",
                                )}>
                                  {opt.badge}
                                </span>
                              </button>
                            );
                          })}
                          {shippingConfirmed && (
                            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#EFFBF1] border border-[#24943E] px-3 py-2">
                              <Check className="h-3.5 w-3.5 text-[#208337]" />
                              <span className="text-[11px] font-semibold text-[#208337]">
                                Shipping confirmed —{" "}
                                {selectedShipping === "overnight" ? "Overnight delivery" : selectedShipping === "one week" ? "Economy (up to 1 week)" : "Standard 3–5 business days"}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Phase 1 Approve/Reject */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          // Fire internal notes for checked actions
                          if (creditChecked && !creditConfirmed) {
                            setCreditConfirmed(true);
                            const creditNote = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                            setInjectedMessages((prev) => [...prev, { id: Date.now() + 1, role: "agent" as const, content: `Temporary credit of $${creditAmount} applied to Sofia's account — held pending dispute resolution`, time: creditNote, isInternal: true }]);
                          }
                          if (shippingChecked && !shippingConfirmed) {
                            setShippingConfirmed(true);
                            const shipNote = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                            const deliveryLabel = selectedShipping === "overnight" ? "Overnight delivery" : selectedShipping === "one week" ? "Economy — up to 1 week" : "Standard 3–5 business days";
                            setInjectedMessages((prev) => [...prev, { id: Date.now() + 2, role: "agent" as const, content: `Replacement card issued to 847 Westmont Avenue, Apt 2C, Chicago, IL 60614 · ${deliveryLabel}`, time: shipNote, isInternal: true }]);
                          }
                          setThirdActionsApproved(true);
                          setSuperviseScrollTrigger((n) => n + 1);
                          // Brief thinking pause then reveal bot comment card
                          approveTimersRef.current.push(setTimeout(() => {
                            setThirdBotCommentReady(true);
                            setSuperviseScrollTrigger((n) => n + 1);
                          }, 2200));
                        }}
                        className="flex-1 rounded-lg bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Reset actions back to defaults
                          setShippingChecked(true);
                          setShippingExpanded(true);
                          setSelectedShipping("3-5 days");
                          setShippingConfirmed(false);
                          setCreditChecked(true);
                          setCreditExpanded(true);
                          setCreditAmount("2,159.00");
                          setCreditConfirmed(false);
                          setThirdActionsApproved(false);
                          setThirdBotCommentReady(false);
                        }}
                        className="flex-1 rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                  <img src={jacobAvatar} alt="Jacob avatar" className="shrink-0 mt-0.5 h-7 w-7 rounded-full object-cover" />
                </div>
              ) : undefined;

              // ── Third card Phase 2: Bot Comment (after actions approved) ─────────
              const thirdBotCommentBubble = showThirdCard && thirdBotCommentReady && thirdAiCommentApproved !== "approved" ? (
                <div className="px-4 py-3 flex items-start gap-2">
                  <div className="flex-1 rounded-xl border border-[#166CCA] bg-[#EBF4FD] p-3 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-[#166CCA]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">AI Next Response</p>
                    </div>
                    <textarea
                      value={thirdAiComment}
                      onChange={(e) => { setThirdAiComment(e.target.value); setThirdAiCommentApproved(null); }}
                      rows={4}
                      className="w-full resize-none rounded-lg border border-[#BFDBFE] bg-white px-3 py-2.5 text-[12px] text-[#344054] leading-relaxed outline-none focus:border-[#166CCA] focus:ring-1 focus:ring-[#166CCA] transition-colors"
                    />
                    {thirdAiCommentRegenerating ? (
                      <div className="flex items-center gap-2 rounded-lg bg-[#EBF4FD] border border-[#BFDBFE] px-3 py-2">
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-[#BFDBFE] border-t-[#166CCA] animate-spin shrink-0" />
                        <span className="text-[12px] text-[#1260B0] font-medium">Regenerating response…</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setThirdAiCommentApproved("approved");
                            const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                            setInjectedMessages((prev) => [...prev, { id: Date.now(), role: "agent" as const, author: caseData.botType, content: thirdAiComment, time }]);
                            setSuperviseScrollTrigger((n) => n + 1);
                            // Sofia's final reply — typing indicator then message
                            approveTimersRef.current.push(setTimeout(() => {
                              setSofiaTyping(true);
                              setSuperviseScrollTrigger((n) => n + 1);
                              approveTimersRef.current.push(setTimeout(() => {
                                setSofiaTyping(false);
                                const sofiaTime = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                                setInjectedMessages((prev) => [...prev, {
                                  id: Date.now(), role: "customer" as const,
                                  content: "thank you. I'm sorry I got so upset. I was just really scared.",
                                  time: sofiaTime,
                                }]);
                                setSuperviseScrollTrigger((n) => n + 1);
                              }, 2500));
                            }, 3000));
                          }}
                          className="flex-1 rounded-lg bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setThirdAiCommentRegenerating(true);
                            approveTimersRef.current.push(setTimeout(() => {
                              setThirdAiComment(dbResponses[2] ?? "");
                              setThirdAiCommentApproved(null);
                              setThirdAiCommentRegenerating(false);
                            }, 1800));
                          }}
                          className="flex-1 rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                  <img src={jacobAvatar} alt="Jacob avatar" className="shrink-0 mt-0.5 h-7 w-7 rounded-full object-cover" />
                </div>
              ) : undefined;

              const secondAiResponseBubble = showSecondCard ? (
                <div className="px-4 py-3 flex items-start gap-2">
                  <div className="flex-1 rounded-xl border border-[#166CCA] bg-[#EBF4FD] p-3 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-[#166CCA]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">AI Next Response</p>
                    </div>
                    <textarea
                      value={secondAiComment}
                      onChange={(e) => { setSecondAiComment(e.target.value); setSecondAiCommentApproved(null); }}
                      rows={4}
                      className="w-full resize-none rounded-lg border border-[#BFDBFE] bg-white px-3 py-2.5 text-[12px] text-[#344054] leading-relaxed outline-none focus:border-[#166CCA] focus:ring-1 focus:ring-[#166CCA] transition-colors"
                    />
                    {secondAiCommentRegenerating ? (
                      <div className="flex items-center gap-2 rounded-lg bg-[#EBF4FD] border border-[#BFDBFE] px-3 py-2">
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-[#BFDBFE] border-t-[#166CCA] animate-spin shrink-0" />
                        <span className="text-[12px] text-[#1260B0] font-medium">Regenerating response…</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSecondAiCommentApproved("approved");
                            const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                            const newMessage = { id: Date.now(), role: "agent" as const, author: caseData.botType, content: secondAiComment, time };
                            setInjectedMessages((prev) => [...prev, newMessage]);
                            setSuperviseScrollTrigger((n) => n + 1);
                            // Sofia replies with her mailing address — typing indicator then reply
                            if (!sofiaAddressInjected) {
                              setSofiaAddressInjected(true);
                              approveTimersRef.current.push(setTimeout(() => {
                                setSofiaTyping(true);
                                setSuperviseScrollTrigger((n) => n + 1);
                                approveTimersRef.current.push(setTimeout(() => {
                                  setSofiaTyping(false);
                                  const sofiaTime = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                                  setInjectedMessages((prev) => [
                                    ...prev,
                                    {
                                      id: Date.now(),
                                      role: "customer" as const,
                                      content: "Of course. It's 847 Westmont Avenue, Apartment 2C, Chicago, IL 60614.",
                                      time: sofiaTime,
                                      sentiment: "frustrated" as const,
                                    },
                                  ]);
                                  setSuperviseScrollTrigger((n) => n + 1);
                                  // Show thinking placeholder then reveal third card
                                  approveTimersRef.current.push(setTimeout(() => {
                                    setThirdCardReady(true);
                                    setSuperviseScrollTrigger((n) => n + 1);
                                  }, 2200));
                                }, 2500));
                              }, 2500));
                            }
                          }}
                          className="flex-1 rounded-lg bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSecondAiCommentRegenerating(true);
                            approveTimersRef.current.push(setTimeout(() => {
                              setSecondAiComment(dbResponses[1] ?? "");
                              setSecondAiCommentApproved(null);
                              setSecondAiCommentRegenerating(false);
                            }, 1800));
                          }}
                          className="flex-1 rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F9f1a8ec85d5f478b9a015a2b7eece268?format=webp&width=800&height=1200"
                    alt="Jacob avatar"
                    className="shrink-0 mt-0.5 h-7 w-7 rounded-full object-cover"
                  />
                </div>
              ) : undefined;

              // Thinking placeholder — shown while AI is composing after customer replies
              const thinkingBubble = (
                <div className="px-4 py-3 flex items-start gap-2">
                  <div className="flex-1 rounded-xl border border-[#166CCA] bg-[#EBF4FD] p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="h-3 w-3 text-[#166CCA]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">AI Next Response</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-1 py-1">
                      <span className="text-[12px] text-[#9CA3AF] italic">Composing response</span>
                      <span className="flex gap-[3px] items-center ml-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#9CA3AF] animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#9CA3AF] animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#9CA3AF] animate-bounce [animation-delay:300ms]" />
                      </span>
                    </div>
                  </div>
                  <img
                    src={botAvatar}
                    alt="AI avatar"
                    className="shrink-0 mt-0.5 h-7 w-7 rounded-full object-cover"
                  />
                </div>
              );

              // ── Sofia: Dispute Authorization Card ─────────────────────────────────
              // Shows the summary + dispute steps. Agent approves to run the animation.
              // Bot comment card appears separately after dispute completes.
              const sofiaDisputeAuthCard = showQuickActions && isSofia && !disputeComplete ? (
                <div className="px-4 py-3 flex items-start gap-2">
                  <div className="flex-1 rounded-xl border border-[#166CCA] bg-[#EBF4FD] p-3 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-[#166CCA]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Dispute Authorization</p>
                    </div>
                    {/* Summary context */}
                    <p className="text-[12px] text-[#344054] leading-relaxed px-1">
                      Sofia is indicating she did not make these charges and would like to initiate a dispute. Please review the steps below and approve to proceed.
                    </p>

                    {/* Initiate Dispute checkbox — pre-checked */}
                    {true && (
                      <div className="rounded-xl border border-black/[0.06] bg-white overflow-hidden">
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          {/* Checkbox — uncheck to opt out */}
                          <button
                            type="button"
                            disabled={disputeRunning || disputeComplete}
                            onClick={() => {
                              if (disputeRunning || disputeComplete) return;
                              const next = !disputeChecked;
                              setDisputeChecked(next);
                              setDisputeExpanded(next);
                            }}
                            className={cn(
                              "shrink-0 h-[18px] w-[18px] rounded-[5px] border-2 flex items-center justify-center transition-colors",
                              disputeChecked ? "border-[#166CCA] bg-[#166CCA]" : "border-[#D0D5DD] bg-white hover:border-[#166CCA]",
                              (disputeRunning || disputeComplete) && "opacity-60 cursor-not-allowed",
                            )}
                          >
                            {disputeChecked && <Check className="h-2.5 w-2.5 text-white" />}
                          </button>
                          <span className={cn(
                            "flex-1 text-[13px] leading-5 text-[#111827] transition-colors",
                            disputeComplete && "line-through text-[#9CA3AF]",
                          )}>
                            Initiate Dispute
                          </span>
                          {/* Expand/collapse toggle — only when checked and not running */}
                          {disputeChecked && !disputeRunning && !disputeComplete && (
                            <button
                              type="button"
                              onClick={() => setDisputeExpanded((v) => !v)}
                              className="shrink-0 text-[#98A2B3] hover:text-[#166CCA] transition-colors"
                            >
                              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", disputeExpanded && "rotate-180")} />
                            </button>
                          )}
                        </div>
                        {/* Steps panel — preview when not running, animated when running */}
                        {disputeChecked && disputeExpanded && (
                          <div className="border-t border-black/[0.05] px-3 pb-3 pt-2.5">
                            <div className="flex items-center justify-between mb-2.5">
                              <p className="text-[12px] font-semibold text-[#111827]">
                                {disputeRunning
                                  ? disputePaused ? "Dispute paused" : "Filing Dispute..."
                                  : "Steps that will run on Approve"}
                              </p>
                              {/* Pause / Resume button — only shown while running and not complete */}
                              {disputeRunning && !disputeComplete && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!disputePaused) {
                                      // Pause: clear remaining timers
                                      disputeTimersRef.current.forEach(clearTimeout);
                                      disputeTimersRef.current = [];
                                      setDisputePaused(true);
                                    } else {
                                      // Resume: restart from current step
                                      setDisputePaused(false);
                                      const runStep = (disputeTimersRef as any).runStep;
                                      if (runStep) runStep(disputeStepIndexRef.current);
                                    }
                                  }}
                                  className="flex items-center gap-1 text-[11px] font-semibold text-[#166CCA] hover:text-[#1260B0] transition-colors"
                                >
                                  {disputePaused ? (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                      Resume
                                    </>
                                  ) : (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                                      Pause
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                            <div className="space-y-2.5">
                              {DISPUTE_STEPS.map((step, stepIdx) => {
                                const isComplete = disputeRunning && stepIdx < disputeStepIndex;
                                const isInProgress = disputeRunning && !disputePaused && stepIdx === disputeStepIndex;
                                const isPausedHere = disputeRunning && disputePaused && stepIdx === disputeStepIndex;
                                return (
                                  <div key={stepIdx} className="flex items-center gap-2.5">
                                    <div className="shrink-0 h-6 w-6 flex items-center justify-center">
                                      {isComplete ? (
                                        <div className="h-6 w-6 rounded-full bg-[#0B9A8A] flex items-center justify-center">
                                          <Check className="h-3.5 w-3.5 text-white" />
                                        </div>
                                      ) : isInProgress ? (
                                        <div className="h-6 w-6 rounded-full border-2 border-[#E5E7EB] border-t-[#0B9A8A] animate-spin" />
                                      ) : isPausedHere ? (
                                        <div className="h-6 w-6 rounded-full border-2 border-[#FFB800] bg-[#FFF6E0] flex items-center justify-center">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="#A37A00"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                                        </div>
                                      ) : (
                                        <div className={cn(
                                          "h-6 w-6 rounded-full border-2 flex items-center justify-center",
                                          disputeRunning ? "border-[#E5E7EB]" : "border-[#BFDBFE]",
                                        )}>
                                          {!disputeRunning && <span className="text-[10px] font-semibold text-[#166CCA]">{stepIdx + 1}</span>}
                                        </div>
                                      )}
                                    </div>
                                    <span className={cn(
                                      "text-[12px]",
                                      isComplete ? "text-[#6B7280] line-through"
                                        : (isInProgress || isPausedHere) ? "text-[#111827] font-medium"
                                        : disputeRunning ? "text-[#9CA3AF]"
                                        : "text-[#344054]",
                                    )}>
                                      {step}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            {disputeComplete && (
                              <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#EFFBF1] border border-[#24943E] px-3 py-2">
                                <Check className="h-3.5 w-3.5 text-[#208337]" />
                                <span className="text-[11px] font-semibold text-[#208337]">Dispute successfully initiated — reference #FRD-2159-SM</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Approve / Reject — hidden while dispute is running */}
                    {!disputeRunning && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            // Card 1 approve: only kick off the dispute animation, do NOT inject message yet
                            setSuperviseScrollTrigger((n) => n + 1);
                            if (disputeChecked) {
                              setDisputeRunning(true);
                              setDisputePaused(false);
                              disputeStepIndexRef.current = 0;
                              disputeTimersRef.current.forEach(clearTimeout);
                              disputeTimersRef.current = [];
                              const runStep = (fromStep: number) => {
                                for (let i = fromStep; i < DISPUTE_STEPS.length; i++) {
                                  const delay = (i - fromStep) * 1200 + 800;
                                  const t = setTimeout(() => {
                                    disputeStepIndexRef.current = i + 1;
                                    setDisputeStepIndex(i + 1);
                                  }, delay);
                                  disputeTimersRef.current.push(t);
                                }
                                const doneDelay = (DISPUTE_STEPS.length - fromStep) * 1200 + 800;
                                const done = setTimeout(() => {
                                  setDisputeComplete(true);
                                  const noteTime = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                                  setInjectedMessages((prev) => [...prev, { id: Date.now(), role: "agent" as const, content: `Dispute filed — reference #FRD-2159-SM · $2,159 in unauthorized charges submitted for review`, time: noteTime, isInternal: true }]);
                                  setSuperviseScrollTrigger((n) => n + 1);
                                }, doneDelay);
                                disputeTimersRef.current.push(done);
                              };
                              (disputeTimersRef as any).runStep = runStep;
                              runStep(0);
                            } else {
                              // No dispute — go straight to bot comment card
                              setDisputeComplete(true);
                            }
                          }}
                          className="flex-1 rounded-lg bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            disputeTimersRef.current.forEach(clearTimeout);
                            disputeTimersRef.current = [];
                            setDisputeChecked(true);
                            setDisputeExpanded(true);
                            setDisputeRunning(false);
                            setDisputePaused(false);
                            setDisputeStepIndex(0);
                            disputeStepIndexRef.current = 0;
                            setDisputeComplete(false);
                          }}
                          className="flex-1 rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                  <img
                    src={jacobAvatar}
                    alt="Jacob avatar"
                    className="shrink-0 mt-0.5 h-7 w-7 rounded-full object-cover"
                  />
                </div>
              ) : undefined;

              // ── Sofia: Bot Comment Card ──────────────────────────────────────────────
              // Appears after dispute animation completes. Agent reviews/edits Jacob's message then approves.
              // Approve injects the message and starts Sofia's reply sequence.
              const sofiaBotCommentCard = showQuickActions && isSofia && disputeComplete && aiCommentApproved !== "approved" ? (
                <div className="px-4 py-3 flex items-start gap-2">
                  <div className="flex-1 rounded-xl border border-[#166CCA] bg-[#EBF4FD] p-3 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-[#166CCA]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">AI Next Response</p>
                    </div>
                    <textarea
                      value={aiComment}
                      onChange={(e) => { setAiComment(e.target.value); setAiCommentApproved(null); }}
                      rows={5}
                      className="w-full resize-none rounded-lg border border-[#BFDBFE] bg-white px-3 py-2.5 text-[12px] text-[#344054] leading-relaxed outline-none focus:border-[#166CCA] focus:ring-1 focus:ring-[#166CCA] transition-colors"
                    />
                    {aiCommentRegenerating ? (
                      <div className="flex items-center gap-2 rounded-lg bg-[#EBF4FD] border border-[#BFDBFE] px-3 py-2">
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-[#BFDBFE] border-t-[#166CCA] animate-spin shrink-0" />
                        <span className="text-[12px] text-[#1260B0] font-medium">Regenerating response…</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            // Bot comment approved — inject bot's message then start Sofia reply sequence
                            setAiCommentApproved("approved");
                            const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                            setInjectedMessages((prev) => [...prev, { id: Date.now(), role: "agent" as const, author: caseData.botType, content: aiComment, time }]);
                            setLastApprovedMsgCount(allMessages.length + 1);
                            setSuperviseScrollTrigger((n) => n + 1);
                            // Start Sofia reply chain
                            approveTimersRef.current.push(setTimeout(() => {
                              setSofiaTyping(true);
                              setSuperviseScrollTrigger((n) => n + 1);
                              approveTimersRef.current.push(setTimeout(() => {
                                setSofiaTyping(false);
                                const sofiaTme = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                                setInjectedMessages((prev) => [...prev, {
                                  id: Date.now(), role: "customer" as const,
                                  content: "Okay, thank you. I appreciate you taking this seriously. I just need this resolved today — my rent is due tomorrow and I can't afford to be short. Please keep me updated.",
                                  time: sofiaTme, sentiment: "frustrated" as const,
                                }]);
                                setSofiaFirstReplyVisible(true);
                                setSuperviseScrollTrigger((n) => n + 1);
                                // Sofia proactively provides her mailing address
                                approveTimersRef.current.push(setTimeout(() => {
                                  setSofiaTyping(true);
                                  setSuperviseScrollTrigger((n) => n + 1);
                                  approveTimersRef.current.push(setTimeout(() => {
                                    setSofiaTyping(false);
                                    const addrTime = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                                    setInjectedMessages((prev) => [...prev, {
                                      id: Date.now(), role: "customer" as const,
                                      content: "Also — if you need my mailing address for the replacement card, it's 847 Westmont Avenue, Apartment 2C, Chicago, IL 60614.",
                                      time: addrTime, sentiment: "frustrated" as const,
                                    }]);
                                    setSofiaAddressInjected(true);
                                    setSuperviseScrollTrigger((n) => n + 1);
                                    approveTimersRef.current.push(setTimeout(() => {
                                      setThirdCardReady(true);
                                      setSuperviseScrollTrigger((n) => n + 1);
                                    }, 2200));
                                  }, 2000));
                                }, 2000));
                              }, 2500));
                            }, 2000));
                          }}
                          className="flex-1 rounded-lg bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAiCommentRegenerating(true);
                            approveTimersRef.current.push(setTimeout(() => {
                              setAiComment(dbResponses[0] ?? "");
                              setAiCommentApproved(null);
                              setAiCommentRegenerating(false);
                            }, 1800));
                          }}
                          className="flex-1 rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                  <img src={jacobAvatar} alt="Jacob avatar" className="shrink-0 mt-0.5 h-7 w-7 rounded-full object-cover" />
                </div>
              ) : undefined;

              // ── Jordan / non-Sofia: Regular editable card ─────────────────────────
              const aiNextResponseBubble = showQuickActions && !isSofia && aiCommentApproved !== "approved" ? (
                <div className="px-4 py-3 flex items-start gap-2">
                  <div className="flex-1 rounded-xl border border-[#166CCA] bg-[#EBF4FD] p-3 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-[#166CCA]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">AI Next Response</p>
                    </div>
                    <textarea
                      value={aiComment}
                      onChange={(e) => { setAiComment(e.target.value); setAiCommentApproved(null); }}
                      rows={5}
                      className="w-full resize-none rounded-lg border border-[#BFDBFE] bg-white px-3 py-2.5 text-[12px] text-[#344054] leading-relaxed outline-none focus:border-[#166CCA] focus:ring-1 focus:ring-[#166CCA] transition-colors"
                    />
                    {aiCommentRegenerating ? (
                      <div className="flex items-center gap-2 rounded-lg bg-[#EBF4FD] border border-[#BFDBFE] px-3 py-2">
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-[#BFDBFE] border-t-[#166CCA] animate-spin shrink-0" />
                        <span className="text-[12px] text-[#1260B0] font-medium">Regenerating response…</span>
                      </div>
                    ) : aiCommentApproved === "approved" ? null : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAiCommentApproved("approved");
                            const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                            setInjectedMessages((prev) => [...prev, { id: Date.now(), role: "agent" as const, author: caseData.botType, content: aiComment, time }]);
                            setLastApprovedMsgCount(allMessages.length + 1);
                          }}
                          className="flex-1 rounded-lg bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAiCommentRegenerating(true);
                            approveTimersRef.current.push(setTimeout(() => {
                              setAiComment(dbResponses[0] ?? "");
                              setAiCommentApproved(null);
                              setAiCommentRegenerating(false);
                            }, 1800));
                          }}
                          className="flex-1 rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                  <img
                    src={botAvatar}
                    alt={`${caseData.botType ?? "AI"} avatar`}
                    className="shrink-0 mt-0.5 h-7 w-7 rounded-full object-cover"
                  />
                </div>
              ) : undefined;

              return (
                <ConversationPanel
                  key={caseData.id}
                  draftKey={`escalated-modal-${caseData.id}`}
                  conversation={conversation}
                  activeChannel={channel}
                  openChannels={[channel]}
                  customerId={caseData.customerRecordId}
                  showAiPanel={false}
                  hideTranscript={false}
                  hideInput={true}
                  isPendingAcceptance={false}
                  onSelectChannel={() => {}}
                  onConversationChange={() => {}}
                  agentAvatarUrl={botAvatar}
                  appendContent={
                    sofiaDisputeAuthCard ??
                    sofiaBotCommentCard ??
                    (showThinkingThird ? thinkingBubble : thirdActionAuthBubble) ??
                    (showThinkingBetweenActions ? thinkingBubble : thirdBotCommentBubble) ??
                    aiNextResponseBubble
                  }
                  scrollToBottomTrigger={superviseScrollTrigger}
                />
              );
            })()}
          </div>

        </div>

        {/* ── Full-width footer ── */}
        <div className="shrink-0 border-t border-border bg-[#F9FAFB] px-5 py-3 flex items-center justify-between gap-2">
          {/* Supervise switch */}
          <button
            type="button"
            role="switch"
            aria-checked={showQuickActions}
            onClick={() => setShowQuickActions((v) => {
              if (!v) {
                setAiCommentApproved(null);
                setSofiaFirstReplyVisible(false);
                setSofiaAddressInjected(false);
                setSecondCardReady(false);
                setThirdCardReady(false);
                setSofiaTyping(false);
                setSuperviseScrollTrigger((n) => n + 1);
              }
              return !v;
            })}
            className="flex items-center gap-2 group"
          >
            <div
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none",
                showQuickActions ? "bg-[#166CCA]" : "bg-[#D0D5DD]",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                  showQuickActions ? "translate-x-4" : "translate-x-0",
                )}
              />
            </div>
            <span className={cn("text-[12px] font-medium", showQuickActions ? "text-[#1260B0]" : "text-[#344054]")}>
              Supervise
            </span>
          </button>

          {/* Right-side actions */}
          <div className="flex items-center gap-2">
            <button
              ref={transferBtnRef}
              type="button"
              onClick={() => {
                const rect = transferBtnRef.current?.getBoundingClientRect();
                if (rect) setTransferTriggerRect(rect);
              }}
              className="rounded-lg border border-border bg-white px-3.5 py-1.5 text-[12px] font-medium text-[#344054] hover:bg-[#F2F4F7] transition-colors"
            >
              Transfer
            </button>
            <button
              type="button"
              onClick={() => {
                const channel = (caseData.channel === "sms" ? "sms" : "chat") as "chat" | "sms";
                const base = caseData.customerRecordId
                  ? createConversationState(caseData.customerRecordId, channel)
                  : { customerName: caseData.name, label: "Chat", timelineLabel: "", status: "open" as const, draft: "", messages: [], isCustomerTyping: false };
                const fullConversation = injectedMessages.length > 0
                  ? { ...base, messages: [...base.messages, ...injectedMessages] }
                  : base;
                onTakeover(fullConversation, localStatus, localPriority);
              }}
              className="rounded-lg bg-[#E53935] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#C71D1A] transition-colors"
            >
              Takeover
            </button>
          </div>
        </div>

      </div>

      {transferTriggerRect && (
        <TransferPopover
          priority={caseData.priority}
          preview={caseData.preview}
          triggerRect={transferTriggerRect}
          onClose={() => setTransferTriggerRect(null)}
          onAssign={() => {
            setTransferTriggerRect(null);
            onTransfer();
          }}
        />
      )}
    </div>,
    document.body,
  );
}
