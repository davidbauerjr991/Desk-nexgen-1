import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, AudioLines, Check, ChevronLeft, ChevronRight, Plus, Send, SlidersHorizontal, Sparkles, X } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { conversationChannelOptions } from "@/components/ConversationChannelToggleGroup";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { getRelevantCustomerTicket } from "@/components/NotesPanel";
import type { CustomerChannel } from "@/lib/customer-database";
import { cn } from "@/lib/utils";

export type ConversationMessage = {
  id: number;
  role: "customer" | "agent";
  content: string;
  time: string;
  channel?: CustomerChannel;
  sentiment?: "frustrated";
};

export type ConversationStatus = "open" | "closed" | "pending";

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
  initialTab: string;
  ticketId?: string;
};

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

  return {
    assignmentReason,
    customerIssue,
    priorHelp,
    remainingNeed,
  };
}

export default function ConversationPanel({
  conversation,
  openChannels,
  activeChannel,
  draftKey,
  className,
  customerId,
  onConversationChange,
  onSelectChannel,
  onOpenDeskPanel,
}: ConversationPanelProps) {
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
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
  const [isSuggestionEditorOpen, setIsSuggestionEditorOpen] = useState(false);
  const [isSuggestionAdded, setIsSuggestionAdded] = useState(false);
  const latestMessage = conversation.messages[conversation.messages.length - 1];
  const latestCustomerMessage = [...conversation.messages].reverse().find((message) => message.role === "customer") ?? null;
  const latestMessageIsCustomer = latestMessage?.role === "customer";
  const suggestionVariants = latestCustomerMessage
    ? getInlineSuggestionVariants(conversation, latestCustomerMessage)
    : [];
  const generatedInlineSuggestion = latestCustomerMessage
    ? getSuggestionVariant(suggestionVariants, suggestionRefreshKey)
    : null;
  const inlineSuggestion = editedInlineSuggestion ?? generatedInlineSuggestion;
  const conversationOverview = getConversationOverview(conversation);
  const shouldShowSuggestion =
    latestMessageIsCustomer &&
    latestCustomerMessage !== null &&
    inlineSuggestion !== null &&
    !conversation.isCustomerTyping;
  const suggestionActions = useMemo(() => {
    if (!inlineSuggestion || !latestCustomerMessage || !customerId || !onOpenDeskPanel) {
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

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [draft]);

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

  const handleUseSuggestion = () => {
    if (!inlineSuggestion || isSuggestionAdded) return;

    setDraft(inlineSuggestion.suggestedReply);
    setIsSuggestionAdded(true);
    onConversationChange?.({
      ...conversation,
      draft: inlineSuggestion.suggestedReply,
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
    <div className={cn("relative flex min-h-0 flex-1 flex-col", className)}>
      {openChannels.length > 0 && (
        <div className="shrink-0 border-b border-[rgba(0,0,0,0.1)] px-1">
          <div className="overflow-x-auto overflow-y-hidden">
            <div className="flex min-w-max items-center">
              {openChannels.map((channel) => (
                <button
                  key={channel}
                  type="button"
                  onClick={() => onSelectChannel(channel)}
                  className={cn(
                    "relative whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-colors",
                    activeChannel === channel
                      ? "text-[#006DAD] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-t after:bg-[#006DAD]"
                      : "text-[#6B7280] hover:text-[#333]",
                  )}
                >
                  {getConversationChannelLabel(channel)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full p-6">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="text-center">
              <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {conversation.timelineLabel}
              </span>
            </div>

            {conversation.messages.map((message) => (
              <div key={message.id} className="space-y-3">
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

                {shouldShowSuggestion && latestCustomerMessage?.id === message.id && inlineSuggestion && (
                  <div className="w-full max-w-[770px] rounded-2xl border border-[#B7E6DD] bg-[#EAF8F4] px-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                    <Accordion
                      type="single"
                      collapsible
                      value={suggestionAccordionValue}
                      onValueChange={(value) => setSuggestionAccordionValue(value)}
                    >
                      <AccordionItem value="ai-suggestion" className="border-b-0">
                        <AccordionTrigger className="py-4 text-left hover:no-underline">
                          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#369D3F]">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>AI Suggestion</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4">
                          <p className="text-sm leading-6 text-[#25403B]">{inlineSuggestion.suggestedReply}</p>
                          {suggestionActions.length > 0 ? (
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              {suggestionActions.map((action) => (
                                <Button
                                  key={action.id}
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-full border-[#B7E6DD] bg-white/80 px-3 text-[#369D3F] hover:bg-white"
                                  onClick={() => handleOpenSuggestionAction(action)}
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          ) : null}
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
                          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
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
                              <Button type="button" size="sm" variant="outline" className="h-9 rounded-lg border-black/10 bg-white px-4 text-[#333333] hover:bg-[#F8F8F9]" onClick={handleOpenSuggestionEditor}>
                                Edit
                              </Button>
                            </div>
                            <div className="ml-auto flex items-center gap-2 self-end">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                aria-label="Show previous AI suggestion"
                                className="h-8 w-8 rounded-full border-black/10 bg-white text-[#7A7A7A] hover:bg-white/70 hover:text-[#333333]"
                                onClick={() => handleCycleSuggestion(-1)}
                                disabled={suggestionVariants.length <= 1}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                aria-label="Show next AI suggestion"
                                className="h-8 w-8 rounded-full border-black/10 bg-white text-[#7A7A7A] hover:bg-white/70 hover:text-[#333333]"
                                onClick={() => handleCycleSuggestion(1)}
                                disabled={suggestionVariants.length <= 1}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
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
          </div>
        </ScrollArea>

        {newMessagesCount > 0 && (
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

      <div className="shrink-0 border-t border-border bg-background p-4">
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
            className="min-h-0 resize-none overflow-hidden border-0 bg-transparent px-0 py-0 text-[15px] shadow-none placeholder:text-[#8A8A8A] focus:outline-none focus-visible:outline-none focus-visible:ring-0"
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
    </div>
  );
}
