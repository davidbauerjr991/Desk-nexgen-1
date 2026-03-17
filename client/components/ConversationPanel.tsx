import { useEffect, useRef, useState } from "react";
import { AlertTriangle, AudioLines, ChevronDown, Plus, Send, SlidersHorizontal, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type ConversationMessage = {
  id: number;
  role: "customer" | "agent";
  content: string;
  time: string;
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
  draftKey: string;
  className?: string;
  onConversationChange?: (conversation: SharedConversationData) => void;
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

function isScrolledToBottom(viewport: HTMLDivElement) {
  return viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= 24;
}

function getInlineSuggestion(conversation: SharedConversationData, customerMessage: ConversationMessage) {
  const normalizedMessage = customerMessage.content.toLowerCase();

  if (normalizedMessage.includes("same error") || normalizedMessage.includes("tried again") || normalizedMessage.includes("retry") || normalizedMessage.includes("retried") || normalizedMessage.includes("still")) {
    return {
      summary:
        "Recommend confirming the latest account status, then offer a manual refresh so the customer can retry without leaving the conversation.",
      suggestedReply:
        "I’ve confirmed the latest account status on my side. I’m running a manual refresh now so you can retry without leaving this conversation.",
    };
  }

  if (normalizedMessage.includes("charged twice") || normalizedMessage.includes("double charge")) {
    return {
      summary: "Reassure the customer they will not be charged twice, then guide them through a safe retry.",
      suggestedReply:
        "You will not be charged twice for the same upgrade attempt. I’ll verify the previous authorization, then I’ll let you know the safest time to retry.",
    };
  }

  if (normalizedMessage.includes("billing") || normalizedMessage.includes("zip") || normalizedMessage.includes("match")) {
    return {
      summary: "Confirm the billing details on file, then guide the customer to the field most likely causing the mismatch.",
      suggestedReply:
        "I can see a billing detail mismatch on the latest attempt. Please confirm the billing zip code on the card, and I’ll stay with you while you try it again.",
    };
  }

  if (normalizedMessage.includes("today") || normalizedMessage.includes("urgent") || normalizedMessage.includes("meeting")) {
    return {
      summary: "Acknowledge the urgency, confirm the next action, and keep the customer in the conversation while you resolve it.",
      suggestedReply:
        "I understand this is time-sensitive. I’m checking the blocking step now, and I’ll keep you updated here so you can complete the upgrade as quickly as possible.",
    };
  }

  if (normalizedMessage.includes("worked") || normalizedMessage.includes("thank you")) {
    return {
      summary: "Confirm the issue is resolved and tell the customer what to watch for next.",
      suggestedReply:
        "Glad that worked. Your upgrade should now continue normally, and I’ll stay available here in case anything else comes up.",
    };
  }

  return {
    summary: `Recommend acknowledging ${conversation.customerName.split(" ")[0]}'s latest update and giving them one clear next step.`,
    suggestedReply: "Thanks for the update. I’m checking the latest attempt now and I’ll give you the next step in just a moment.",
  };
}

function getConversationOverview(conversation: SharedConversationData) {
  const latestCustomerMessage = [...conversation.messages].reverse().find((message) => message.role === "customer");
  const latestRelevantMessage = latestCustomerMessage ?? conversation.messages[conversation.messages.length - 1];
  const normalizedContent = latestRelevantMessage?.content.replace(/\s+/g, " ").trim();
  const latestIssue = normalizedContent && normalizedContent.length > 160
    ? `${normalizedContent.slice(0, 157)}...`
    : normalizedContent;

  const statusDescription = conversation.status === "open"
    ? "an active"
    : conversation.status === "pending"
      ? "a pending"
      : "a closed";

  return `${conversation.customerName.split(" ")[0]} is in ${statusDescription} ${conversation.label.toLowerCase()} thread. Latest issue: ${latestIssue ?? "Awaiting the next customer update."}`;
}

const statusOptions: Array<{ value: ConversationStatus; label: string }> = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "pending", label: "Pending" },
];

function getStatusChipClasses(status: ConversationStatus) {
  if (status === "open") {
    return "border-[#98D38D] bg-[#EAF8E6] text-[#2F7D32] hover:bg-[#E2F3DC]";
  }

  if (status === "pending") {
    return "border-[#E8C46A] bg-[#FFF3CD] text-[#9A6700] hover:bg-[#FDECB8]";
  }

  return "border-[#D0D5DD] bg-white text-[#667085] hover:bg-[#F9FAFB]";
}

export default function ConversationPanel({ conversation, draftKey, className, onConversationChange }: ConversationPanelProps) {
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const previousMessageCountRef = useRef(conversation.messages.length);
  const shouldStickToBottomRef = useRef(true);
  const [draft, setDraft] = useState(conversation.draft);
  const [isDraftFocused, setIsDraftFocused] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [dismissedSuggestionMessageId, setDismissedSuggestionMessageId] = useState<number | null>(null);
  const [isContextExpanded, setIsContextExpanded] = useState(true);

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

    const frameId = window.requestAnimationFrame(() => {
      scrollToBottom("auto");
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      viewport.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    previousMessageCountRef.current = conversation.messages.length;
    shouldStickToBottomRef.current = true;
    setNewMessagesCount(0);

    const frameId = window.requestAnimationFrame(() => {
      scrollToBottom("auto");
    });

    return () => window.cancelAnimationFrame(frameId);
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

  const latestMessage = conversation.messages[conversation.messages.length - 1];
  const latestCustomerMessage = latestMessage?.role === "customer" ? latestMessage : null;
  const inlineSuggestion = latestCustomerMessage ? getInlineSuggestion(conversation, latestCustomerMessage) : null;
  const conversationOverview = getConversationOverview(conversation);
  const lastActivityAt = conversation.timelineLabel.includes("·")
    ? conversation.timelineLabel.split("·").slice(1).join("·").trim()
    : conversation.timelineLabel;
  const shouldShowSuggestion =
    latestCustomerMessage !== null &&
    inlineSuggestion !== null &&
    !conversation.isCustomerTyping &&
    dismissedSuggestionMessageId !== latestCustomerMessage.id;

  useEffect(() => {
    setDismissedSuggestionMessageId(null);
  }, [latestCustomerMessage?.id, draftKey]);

  const handleUseSuggestion = () => {
    if (!inlineSuggestion) return;

    setDraft(inlineSuggestion.suggestedReply);
    setDismissedSuggestionMessageId(latestCustomerMessage?.id ?? null);
    onConversationChange?.({
      ...conversation,
      draft: inlineSuggestion.suggestedReply,
    });
    textareaRef.current?.focus();
  };

  const handleDismissSuggestion = () => {
    setDismissedSuggestionMessageId(latestCustomerMessage?.id ?? null);
  };

  const handleConversationStatusChange = (status: ConversationStatus) => {
    onConversationChange?.({
      ...conversation,
      status,
    });
  };

  const handleSend = () => {
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
        },
      ],
    };

    setDraft("");
    onConversationChange?.(nextConversation);
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="shrink-0 border-b border-[#E7D7A6] bg-[#FFF9E8]">
        <div className="mx-auto flex max-w-3xl flex-col px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex flex-wrap items-center gap-2 text-xs font-medium text-[#8C6A00]">
              <span>{conversation.label.toUpperCase()}</span>
              <span className="text-[#C9A74A]">•</span>
              <span>{lastActivityAt}</span>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                      getStatusChipClasses(conversation.status),
                    )}
                  >
                    <span>{statusOptions.find((option) => option.value === conversation.status)?.label ?? "Open"}</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32 rounded-xl border border-black/10 bg-white p-1 shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
                  {statusOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleConversationStatusChange(option.value)}
                      className={cn(
                        "rounded-lg px-3 py-2 text-xs font-medium text-[#333333] focus:bg-[#F8F8F9]",
                        option.value === conversation.status && "bg-[#F8F8F9]",
                      )}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                type="button"
                onClick={() => setIsContextExpanded((current) => !current)}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-[#8C6A00] transition-colors hover:bg-[#F6E7B8]"
                aria-label={isContextExpanded ? "Collapse AI overview" : "Expand AI overview"}
              >
                <span>AI Overview</span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isContextExpanded && "rotate-180")} />
              </button>
            </div>
          </div>
          {isContextExpanded && (
            <div className="mt-3 border-t border-[#E7D7A6] pt-3 text-sm leading-6 text-[#6B5A1B]">
              {conversationOverview}
            </div>
          )}
        </div>
      </div>

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
                  <div className="mb-1 flex items-end gap-2">
                    {message.role === "customer" && (
                      <span className="ml-1 text-xs font-medium text-muted-foreground">{customerFirstName}</span>
                    )}
                    {message.role === "agent" && (
                      <span className="mr-1 text-xs font-medium text-muted-foreground">You</span>
                    )}
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
                  {message.sentiment === "frustrated" && (
                    <div className="mt-1.5 flex items-center gap-1 text-xs font-medium text-orange-500">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Frustrated sentiment detected
                    </div>
                  )}
                </div>

                {shouldShowSuggestion && latestCustomerMessage?.id === message.id && inlineSuggestion && (
                  <div className="w-full max-w-[770px] rounded-2xl border border-[#B7E6DD] bg-[#EAF8F4] p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2D6A5F]">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>AI Suggestion</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#25403B]">{inlineSuggestion.summary}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button type="button" size="sm" className="h-9 rounded-lg bg-[#006DAD] px-4 text-white hover:bg-[#0A5E92]" onClick={handleUseSuggestion}>
                        Use response
                      </Button>
                      <Button type="button" size="sm" variant="outline" className="h-9 rounded-lg border-black/10 bg-white px-4 text-[#333333] hover:bg-[#F8F8F9]" onClick={handleDismissSuggestion}>
                        Dismiss
                      </Button>
                    </div>
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
            onChange={(event) => setDraft(event.target.value)}
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
              <Button className="h-8 w-8 rounded-full bg-[#111827] text-white hover:bg-[#1F2937]" size="icon" aria-label="Send message" onClick={handleSend}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
