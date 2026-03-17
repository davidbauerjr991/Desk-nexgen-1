import { AlertTriangle, AudioLines, Plus, Send, SlidersHorizontal, Sparkles } from "lucide-react";

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

export default function ConversationPanel({ conversation, draftKey, className }: ConversationPanelProps) {
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <ScrollArea className="flex-1 p-6">
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

      <div className="border-t border-border bg-background p-4">
        <div className="rounded-2xl border border-black/10 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <Textarea
            key={draftKey}
            placeholder="Type your live response..."
            className="min-h-[54px] resize-none border-0 bg-transparent px-0 py-0 text-[15px] shadow-none placeholder:text-[#8A8A8A] focus-visible:ring-0"
            defaultValue={conversation.draft}
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
                className="w-[320px] rounded-[8px] border border-black/10 bg-white p-0 shadow-[0_20px_50px_rgba(0,0,0,0.16)]"
              >
                <div className="p-4">
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
                <div className="p-4">
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
              <div className="hidden items-center gap-1 rounded-full border border-[#D8CCE9] bg-[#F7F1FD] px-2.5 py-1 text-xs font-medium text-[#6D4ACF] sm:flex">
                <Sparkles className="h-3.5 w-3.5" />
                AI writing enabled
              </div>
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
              <Button className="h-8 w-8 rounded-full bg-[#111827] text-white hover:bg-[#1F2937]" size="icon" aria-label="Send message">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
