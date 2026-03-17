import { useEffect, useRef, useState } from "react";
import { AlertTriangle, AudioLines, Plus, Send, SlidersHorizontal } from "lucide-react";

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

export type SharedConversationData = {
  customerName: string;
  label: string;
  timelineLabel: string;
  draft: string;
  messages: ConversationMessage[];
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

  const handleJumpToLatest = () => {
    shouldStickToBottomRef.current = true;
    setNewMessagesCount(0);
    scrollToBottom("smooth");
  };

  const handleSend = () => {
    const nextDraft = draft.trim();
    if (!nextDraft) return;

    const nextConversation: SharedConversationData = {
      ...conversation,
      draft: "",
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
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full p-6">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="text-center">
              <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {conversation.timelineLabel}
              </span>
            </div>

            {conversation.messages.map((message) => (
              <div
                key={message.id}
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
            ))}

            <div className="flex items-center gap-2 pt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/40"></span>
                <span className="delay-75 h-1.5 w-1.5 animate-pulse rounded-full bg-primary/60"></span>
                <span className="delay-150 h-1.5 w-1.5 animate-pulse rounded-full bg-primary"></span>
              </div>
              <span>NexAgent AI is analyzing the {conversation.label.toLowerCase()} conversation...</span>
            </div>
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
