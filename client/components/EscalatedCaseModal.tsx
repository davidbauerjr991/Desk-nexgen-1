import { createPortal } from "react-dom";
import { useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ConversationPanel from "@/components/ConversationPanel";
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
  onTransfer,
  onClose,
}: {
  caseData: EscalatedCaseModalData;
  onTakeover: () => void;
  onTransfer: () => void;
  onClose: () => void;
}) {
  const [copilotQuery, setCopilotQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [copilotPhase, setCopilotPhase] = useState<"idle" | "thinking" | "done">("idle");
  const [copilotReasoningVisible, setCopilotReasoningVisible] = useState(0);
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);
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
              <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none", priorityStyles[caseData.priority] ?? "border-border bg-[#F9FAFB] text-[#344054]")}>
                {caseData.priority}
              </span>
              <span className="rounded border border-[#E53935] bg-[#FDEAEA] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#C71D1A]">
                escalated
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FEE2E2]">
                <AlertTriangle className="h-3 w-3 text-[#E53935]" />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#E53935]">
                Escalated — Immediate Action Required
              </p>
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
          <div className="flex flex-col w-[420px] shrink-0 border-r border-border">
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3">
              {/* Attempted Resolution */}
              <div className="rounded-xl border border-[#C8BFF0] bg-white overflow-hidden">
                <div className="px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5C46B8]">Attempted Resolution</p>
                </div>
                <div className="px-4 pb-4 space-y-3">
                  {caseData.customerContext && (
                    <div className="flex items-start gap-2.5 rounded-lg bg-[#EEF0FF] px-3 py-2.5">
                      <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5C46B8]" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5C46B8] mb-0.5">Customer Context</p>
                        <p className="text-[12px] text-[#344054] leading-relaxed">{caseData.customerContext}</p>
                      </div>
                    </div>
                  )}
                  <ul className="space-y-2">
                    {caseData.aiOverview.actions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[#344054] leading-relaxed">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#5C46B8]" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {copilotPhase !== "idle" && (
                <CopilotResponseCard
                  query={submittedQuery}
                  phase={copilotPhase}
                  reasoningVisible={copilotReasoningVisible}
                  isOpen={isCopilotOpen}
                  onToggle={() => setIsCopilotOpen((v) => !v)}
                />
              )}

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

              {showQuickActions && (
                <div className="rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] p-3 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3] mb-2">Quick Actions</p>
                  {QUICK_ACTION_OPTIONS.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => { setShowQuickActions(false); onClose(); }}
                      className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-white px-3 py-2 text-left text-[12px] text-[#344054] hover:bg-[#F2F0FA] hover:border-[#C8BFF0] hover:text-[#5C46B8] transition-colors"
                    >
                      <Check className="h-3 w-3 shrink-0 text-[#6E56CF]" />
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column: live conversation */}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex-1 min-h-0 overflow-y-auto">
              {(() => {
                const channel = (caseData.channel === "sms" ? "sms" : "chat") as "chat" | "sms";
                const conversation = caseData.customerRecordId
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
                  />
                );
              })()}
            </div>
          </div>

        </div>

        {/* ── Full-width footer ── */}
        <div className="shrink-0 border-t border-border bg-[#F9FAFB] px-5 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onTransfer}
              className="rounded-lg border border-border bg-white px-3.5 py-1.5 text-[12px] font-medium text-[#344054] hover:bg-[#F2F4F7] transition-colors"
            >
              Transfer
            </button>
            <button
              type="button"
              onClick={() => setShowQuickActions((v) => !v)}
              className={cn(
                "rounded-lg border px-3.5 py-1.5 text-[12px] font-medium transition-colors",
                showQuickActions
                  ? "border-[#6E56CF] bg-[#F2F0FA] text-[#5C46B8]"
                  : "border-border bg-white text-[#344054] hover:bg-[#F2F4F7]",
              )}
            >
              Quick Action
            </button>
          </div>
          <button
            type="button"
            onClick={onTakeover}
            className="rounded-lg bg-[#E53935] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#C71D1A] transition-colors"
          >
            Takeover
          </button>
        </div>

      </div>
    </div>,
    document.body,
  );
}
