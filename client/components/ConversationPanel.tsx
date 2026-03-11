import { AlertTriangle, Paperclip, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
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
        <div className="relative flex items-end gap-3">
          <div className="absolute right-14 top-2 flex items-center gap-1 rounded-md border border-border bg-background/80 px-2 py-0.5 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" /> AI writing enabled
          </div>
          <Button variant="ghost" size="icon" className="mb-1 h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground">
            <Paperclip className="h-5 w-5" />
          </Button>
          <div className="relative flex-1">
            <Textarea
              key={draftKey}
              placeholder="Type your message..."
              className="min-h-[60px] max-h-32 resize-none rounded-xl pb-3 pr-12 pt-3 focus-visible:ring-1"
              defaultValue={conversation.draft}
            />
          </div>
          <Button className="mb-1 h-10 w-10 shrink-0 rounded-xl" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
