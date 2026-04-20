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
import { createConversationState } from "@/lib/customer-database";

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
};

// ─── Priority styles ──────────────────────────────────────────────────────────

const priorityStyles: Record<string, string> = {
  Critical: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
  High:     "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
  Medium:   "border-[#C8BFF0] bg-[#F2F0FA] text-[#6E56CF]",
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
              tab === t ? "text-[#6E56CF]" : "text-[#667085] hover:text-[#344054]",
            )}
          >
            {t}
            {tab === t && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#6E56CF]" />}
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
    <div className="rounded-xl border border-[#C8BFF0] bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#6E56CF]" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5C46B8]">
            Copilot Response
          </p>
          {phase === "thinking" && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6E56CF] animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#6E56CF] animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#6E56CF] animate-bounce [animation-delay:300ms]" />
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-[#5C46B8] transition-transform duration-200",
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
                    <div className="pt-2 space-y-1.5 border-l-2 border-[#E4DAFF] ml-1 pl-3">
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
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 rounded-lg bg-[#F2F0FA] border border-[#C8BFF0] px-3 py-2.5">
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
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [superviseScrollTrigger, setSuperviseScrollTrigger] = useState(0);
  const [approveContext, setApproveContext] = useState(false);
  const [showResolvedMessage, setShowResolvedMessage] = useState(false);
  const [jordanTyping, setJordanTyping] = useState(false);
  const [localStatus, setLocalStatus] = useState(caseData.status);
  const [localPriority, setLocalPriority] = useState(caseData.priority);
  const approveTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [aiComment, setAiComment] = useState(() => {
    if (caseData.customerRecordId === "sofia") {
      return "I completely understand, Sofia, and I'm so sorry this has happened. I want to assure you we are taking this seriously. I'm initiating a dispute for both fraudulent transactions right now and will have a resolution specialist on this immediately.";
    }
    return "Hi Jordan, before proceeding with the factory reset I can back up your current port forwarding configuration to your account. Once the reset is complete, I'll restore those rules automatically so your home office setup is preserved. Shall I go ahead and save your config now?";
  });
  const [aiCommentApproved, setAiCommentApproved] = useState<"approved" | "rejected" | null>(null);
  const [secondAiComment, setSecondAiComment] = useState(
    "The dispute has been filed and you'll receive a confirmation number by email. To protect your account, I'd also like to send you a replacement card — could you confirm your current mailing address so I can get that issued for you right away?"
  );
  const [secondAiCommentApproved, setSecondAiCommentApproved] = useState<"approved" | "rejected" | null>(null);
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
      <div className="animate-modal-fade-in relative z-10 flex flex-col w-full max-w-[960px] max-h-[90vh] rounded-2xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)] overflow-hidden">

        {/* ── Full-width header ── */}
        <div className="shrink-0 border-b border-border px-5 pt-3 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-[14px] font-bold text-[#101828]">{caseData.name}</span>
              <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none transition-all duration-500", priorityStyles[localPriority] ?? "border-border bg-[#F9FAFB] text-[#344054]")}>
                {localPriority}
              </span>
              {localStatus === "resolved" ? (
                <span className="rounded border border-[#24943E] bg-[#EFFBF1] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#208337] transition-all duration-500">
                  resolved
                </span>
              ) : localStatus === "escalated" ? (
                <span className="rounded border border-[#E53935] bg-[#FDEAEA] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#C71D1A]">
                  escalated
                </span>
              ) : (
                <span className="rounded border border-[#C8BFF0] bg-[#F2F0FA] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#6E56CF] capitalize">
                  {localStatus}
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
                <div className="rounded-xl border border-[#C8BFF0] bg-[#F2F0FA] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <img
                      src={caseData.botType === "Jacob"
                        ? "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F9f1a8ec85d5f478b9a015a2b7eece268?format=webp&width=800&height=1200"
                        : "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F054057b71e64441097a4902d7dcea754?format=webp&width=800&height=1200"}
                      alt={`${caseData.botType} avatar`}
                      className="h-9 w-9 rounded-full object-cover shrink-0"
                    />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5C46B8]">{caseData.botType}</p>
                  </div>
                  <p className="text-[13px] font-medium leading-5 text-[#344054]">
                    {showResolvedMessage
                      ? `Wow! Great job, Jeff! Looks like we have another happy customer. I've updated the case to resolved!`
                      : caseData.customerContext}
                  </p>

                  {/* Confidence meter — hidden once resolved or when supervising */}
                  {!approveContext && !showResolvedMessage && !showQuickActions && (
                    <div className="mt-3 rounded-lg border border-[#C8BFF0] bg-white px-3 py-2.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">AI Confidence</span>
                        </div>
                        <span className="text-[12px] font-bold text-[#6E56CF]">94%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#E4E7EC] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#6E56CF] to-[#8B72E0] transition-all duration-700"
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
                    <button
                      type="button"
                      onClick={() => {
                        setApproveContext(true);
                        approveTimersRef.current.forEach(clearTimeout);
                        approveTimersRef.current = [];

                        // Step 1: Aria's message immediately
                        const ariaTime = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                        setInjectedMessages((prev) => [
                          ...prev,
                          { id: Date.now(), role: "agent" as const, content: "Great news — I checked with our team and confirmed that your port forwarding settings are automatically backed up in your firmware version, so they'll be fully restored after the reset. You're safe to proceed.", time: ariaTime },
                        ]);

                        // Step 2: Jordan starts typing after 1.5s
                        approveTimersRef.current.push(setTimeout(() => setJordanTyping(true), 1500));

                        // Step 3: Jordan's response after 3.5s
                        approveTimersRef.current.push(setTimeout(() => {
                          setJordanTyping(false);
                          const t1 = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                          setInjectedMessages((prev) => [
                            ...prev,
                            { id: Date.now(), role: "customer" as const, content: "That's amazing, thank you!", time: t1 },
                          ]);
                        }, 3500));

                        // Step 4: Rating bubble after 4.5s
                        approveTimersRef.current.push(setTimeout(() => {
                          const t2 = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                          setInjectedMessages((prev) => [
                            ...prev,
                            { id: Date.now(), role: "customer" as const, content: "\u2605\u2605\u2605\u2605\u2605  Case resolution rated 5 stars", time: t2 },
                          ]);
                        }, 4500));

                        // Step 5: Status → resolved, priority → Low after 5.5s
                        approveTimersRef.current.push(setTimeout(() => {
                          setLocalStatus("resolved");
                          setLocalPriority("Low");
                          setShowResolvedMessage(true);
                          onResolve();
                        }, 5500));
                      }}
                      className="mt-3 w-full rounded-lg border border-[#6E56CF] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#6E56CF] hover:bg-[#F2F0FA] transition-colors"
                    >
                      Approve
                    </button>
                  ) : !showQuickActions ? (
                    <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#EFFBF1] border border-[#24943E] px-3 py-1.5">
                      <Check className="h-3 w-3 text-[#208337]" />
                      <span className="text-[11px] font-semibold text-[#208337]">Approved — {caseData.botType} is responding to {caseData.name.split(" ")[0]}</span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Attempted Resolution accordion */}
              <div className="rounded-xl border border-[#C8BFF0] bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsAttemptedResolutionOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5C46B8]">Attempted Resolution</p>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-[#5C46B8] transition-transform duration-200", isAttemptedResolutionOpen && "rotate-180")} />
                </button>
                <div className={cn("grid transition-all duration-200 ease-out", isAttemptedResolutionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden">
                    <ul className="px-4 pb-4 space-y-2">
                      {caseData.aiOverview.actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-[#344054] leading-relaxed">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#5C46B8]" />
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
                  <div className="rounded-xl border border-[#C8BFF0] bg-white p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-[#6E56CF]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5C46B8]">Potential Next Steps</p>
                    </div>
                    <p className="text-[11px] text-[#98A2B3]">Waiting for customer to respond before preparing next AI message.</p>
                    <ul className="space-y-1.5 pt-0.5">
                      {POTENTIAL_NEXT_STEPS.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-[#344054] leading-relaxed">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#6E56CF]" />
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
              <div className="flex items-center gap-2 rounded-lg border border-[#C8BFF0] bg-white px-3 py-2">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#6E56CF]" />
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
                  className="shrink-0 text-[#6E56CF] hover:text-[#5C46B8] transition-colors"
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
              const allMessages = [...baseConversation.messages, ...injectedMessages];
              const conversation = {
                ...baseConversation,
                messages: injectedMessages.length > 0 ? allMessages : baseConversation.messages,
                isCustomerTyping: jordanTyping,
              };

              // Second AI response card (Sofia only) — shown after first is approved
              const isSofia = caseData.customerRecordId === "sofia";
              const showSecondCard = isSofia && showQuickActions && aiCommentApproved === "approved" && secondAiCommentApproved !== "approved";
              const secondAiResponseBubble = showSecondCard ? (
                <div className="px-4 py-3 flex items-start gap-2">
                  <div className="flex-1 rounded-xl border border-[#6E56CF] bg-[#F2F0FA] p-3 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-[#6E56CF]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5C46B8]">AI Next Response</p>
                    </div>
                    <textarea
                      value={secondAiComment}
                      onChange={(e) => { setSecondAiComment(e.target.value); setSecondAiCommentApproved(null); }}
                      rows={4}
                      className="w-full resize-none rounded-lg border border-[#C8BFF0] bg-white px-3 py-2.5 text-[12px] text-[#344054] leading-relaxed outline-none focus:border-[#6E56CF] focus:ring-1 focus:ring-[#6E56CF] transition-colors"
                    />
                    {secondAiCommentApproved === "rejected" ? (
                      <div className="flex items-center gap-1.5 rounded-lg bg-[#FDEAEA] px-3 py-2 text-[12px] font-medium text-[#C71D1A]">
                        <Check className="h-3 w-3" />
                        Response rejected — AI will await your instruction
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSecondAiCommentApproved("approved");
                            const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                            const newMessage = { id: Date.now(), role: "agent" as const, content: secondAiComment, time };
                            setInjectedMessages((prev) => [...prev, newMessage]);
                          }}
                          className="flex-1 rounded-lg bg-[#6E56CF] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#5C46B8] transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setSecondAiCommentApproved("rejected")}
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

              // First AI Next Response card — rendered inside the conversation scroll area via appendContent
              const aiNextResponseBubble = showQuickActions && aiCommentApproved !== "approved" ? (
                <div className="px-4 py-3 flex items-start gap-2">
                  <div className="flex-1 rounded-xl border border-[#6E56CF] bg-[#F2F0FA] p-3 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-[#6E56CF]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5C46B8]">AI Next Response</p>
                    </div>
                    <textarea
                      value={aiComment}
                      onChange={(e) => { setAiComment(e.target.value); setAiCommentApproved(null); }}
                      rows={5}
                      className="w-full resize-none rounded-lg border border-[#C8BFF0] bg-white px-3 py-2.5 text-[12px] text-[#344054] leading-relaxed outline-none focus:border-[#6E56CF] focus:ring-1 focus:ring-[#6E56CF] transition-colors"
                    />
                    {aiCommentApproved === "rejected" ? (
                      <div className="flex items-center gap-1.5 rounded-lg bg-[#FDEAEA] px-3 py-2 text-[12px] font-medium text-[#C71D1A]">
                        <Check className="h-3 w-3" />
                        Response rejected — AI will await your instruction
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAiCommentApproved("approved");
                            const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                            const newMessage = { id: Date.now(), role: "agent" as const, content: aiComment, time };
                            setInjectedMessages((prev) => [...prev, newMessage]);
                            setLastApprovedMsgCount(allMessages.length + 1);
                            // Scroll down to reveal second response card (Sofia only)
                            if (isSofia) setSuperviseScrollTrigger((n) => n + 1);
                          }}
                          className="flex-1 rounded-lg bg-[#6E56CF] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#5C46B8] transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiCommentApproved("rejected")}
                          className="flex-1 rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                  <img
                    src={caseData.botType === "Jacob"
                      ? "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F9f1a8ec85d5f478b9a015a2b7eece268?format=webp&width=800&height=1200"
                      : "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F054057b71e64441097a4902d7dcea754?format=webp&width=800&height=1200"}
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
                  agentAvatarUrl={caseData.botType === "Jacob"
                    ? "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F9f1a8ec85d5f478b9a015a2b7eece268?format=webp&width=800&height=1200"
                    : "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F054057b71e64441097a4902d7dcea754?format=webp&width=800&height=1200"}
                  appendContent={aiNextResponseBubble ?? secondAiResponseBubble}
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
                setSuperviseScrollTrigger((n) => n + 1);
              }
              return !v;
            })}
            className="flex items-center gap-2 group"
          >
            <div
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none",
                showQuickActions ? "bg-[#6E56CF]" : "bg-[#D0D5DD]",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                  showQuickActions ? "translate-x-4" : "translate-x-0",
                )}
              />
            </div>
            <span className={cn("text-[12px] font-medium", showQuickActions ? "text-[#5C46B8]" : "text-[#344054]")}>
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
