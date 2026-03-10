import { useState } from "react";
import {
  Bot,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Send,
  Paperclip,
  MoreVertical,
  PhoneCall,
  Mail,
  Clock,
  X,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileText,
  BookOpen,
  MessageCircle,
  MessageSquare,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useLayoutContext } from "@/components/Layout";
import NotesPanel, { NOTES_PANEL_MENU_ITEMS } from "@/components/NotesPanel";
import RecentInteractionsPanel from "@/components/RecentInteractionsPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ChannelType = "chat" | "sms" | "whatsapp" | "email";

type ConversationMessage = {
  id: number;
  role: "customer" | "agent";
  content: string;
  time: string;
  sentiment?: "frustrated";
};

const conversationsByChannel: Record<
  ChannelType,
  {
    label: string;
    timelineLabel: string;
    draft: string;
    messages: ConversationMessage[];
  }
> = {
  chat: {
    label: "Chat",
    timelineLabel: "Web chat · Today, 10:24 AM",
    draft:
      "I can see the upgrade failure in your live chat session. I’m clearing the billing mismatch now so you can retry without leaving this window.",
    messages: [
      {
        id: 1,
        role: "customer",
        content:
          "Hi, I'm on the pricing page and the upgrade button keeps failing after I submit my card details.",
        time: "10:24 AM",
      },
      {
        id: 2,
        role: "agent",
        content:
          "Thanks for flagging it. I’m reviewing the failed checkout event from your session now.",
        time: "10:25 AM",
      },
      {
        id: 3,
        role: "customer",
        content:
          "It says the payment details don't match, but everything is copied directly from my profile.",
        time: "10:26 AM",
        sentiment: "frustrated",
      },
    ],
  },
  sms: {
    label: "SMS",
    timelineLabel: "SMS · Today, 10:24 AM",
    draft:
      "I see the transaction block. It appears our security system flagged it due to a recent mismatch in billing zip codes. Let me clear that flag for you.",
    messages: [
      {
        id: 1,
        role: "customer",
        content:
          "Hi, I'm trying to upgrade my subscription to the Pro tier, but my credit card keeps getting declined even though I know I have sufficient funds.",
        time: "10:24 AM",
        sentiment: "frustrated",
      },
      {
        id: 2,
        role: "agent",
        content:
          "Hello Alex! I'm sorry to hear you're experiencing issues upgrading your account. I can certainly help you look into this right away.",
        time: "10:25 AM",
      },
      {
        id: 3,
        role: "customer",
        content:
          "Thank you. It's the Visa ending in 4092. I just tried it again 5 minutes ago and got the same error.",
        time: "10:26 AM",
      },
    ],
  },
  whatsapp: {
    label: "WhatsApp",
    timelineLabel: "WhatsApp · Today, 10:24 AM",
    draft:
      "Thanks for sending that over on WhatsApp. I’ve cleared the payment security flag, so please try the upgrade once more and let me know what you see.",
    messages: [
      {
        id: 1,
        role: "customer",
        content:
          "Hey team, my upgrade still isn't going through. I tried again from my phone and it failed immediately.",
        time: "10:24 AM",
      },
      {
        id: 2,
        role: "agent",
        content:
          "I’ve got your account open now. Give me a moment to review the latest payment attempt.",
        time: "10:25 AM",
      },
      {
        id: 3,
        role: "customer",
        content:
          "Appreciate it — I need the Pro features enabled before my meeting starts.",
        time: "10:27 AM",
        sentiment: "frustrated",
      },
    ],
  },
  email: {
    label: "Email",
    timelineLabel: "Email thread · Today, 10:24 AM",
    draft:
      "Hi Alex — I found the billing mismatch that caused the failed upgrade attempts. I’ve removed the security hold, so please try again when convenient and reply if you still see an error.",
    messages: [
      {
        id: 1,
        role: "customer",
        content:
          "Subject: Upgrade payment failing\n\nHi team, I’m trying to move to the Pro plan and the payment form keeps rejecting my card even though the card is valid.",
        time: "10:24 AM",
      },
      {
        id: 2,
        role: "agent",
        content:
          "Hi Alex, thanks for the details. I’m checking the payment logs and fraud rules tied to your most recent attempt now.",
        time: "10:25 AM",
      },
      {
        id: 3,
        role: "customer",
        content:
          "Thanks. I retried just before sending this and got the same billing mismatch message.",
        time: "10:28 AM",
        sentiment: "frustrated",
      },
    ],
  },
};

const insights = {
  sentiment: "Frustrated",
  sentimentScore: 35, // out of 100
  intent: "Subscription Upgrade / Payment Failure",
  churnRisk: "Medium",
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 3.25C7.163 3.25 3.25 7.119 3.25 11.882C3.25 13.549 3.734 15.149 4.638 16.529L3.75 20.75L8.097 19.9C9.406 20.647 10.898 21.042 12.421 21.042C17.258 21.042 21.171 17.172 21.171 12.41C21.171 7.647 16.837 3.25 12 3.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.428 8.867C9.206 8.373 8.97 8.362 8.761 8.354C8.59 8.347 8.394 8.347 8.198 8.347C8.002 8.347 7.683 8.421 7.413 8.715C7.143 9.009 6.389 9.703 6.389 11.117C6.389 12.531 7.438 13.897 7.585 14.093C7.732 14.289 9.634 17.287 12.611 18.437C15.086 19.392 15.589 19.203 16.123 19.154C16.657 19.105 17.839 18.485 18.084 17.815C18.329 17.144 18.329 16.566 18.255 16.444C18.182 16.321 17.986 16.248 17.692 16.101C17.397 15.954 15.957 15.235 15.687 15.137C15.417 15.039 15.22 14.99 15.024 15.284C14.828 15.578 14.27 16.248 14.098 16.444C13.926 16.64 13.754 16.665 13.459 16.518C13.165 16.37 12.218 16.061 11.095 15.059C10.221 14.28 9.632 13.319 9.46 13.025C9.289 12.731 9.442 12.571 9.589 12.424C9.722 12.292 9.883 12.081 10.03 11.91C10.177 11.738 10.226 11.615 10.324 11.419C10.422 11.223 10.373 11.052 10.299 10.905C10.226 10.758 9.679 9.312 9.428 8.867Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChannelToggleButton({
  channel,
  activeChannel,
  onClick,
}: {
  channel: ChannelType;
  activeChannel: ChannelType;
  onClick: () => void;
}) {
  const isActive = activeChannel === channel;
  const commonClassName = cn(
    "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
    isActive
      ? "border-[#D9CCFF] bg-[#F3ECFF] text-[#6E00FD]"
      : "border-black/10 bg-white text-[#7A7A7A] hover:border-[#D9CCFF] hover:text-[#6E00FD]",
  );

  if (channel === "chat") {
    return (
      <button type="button" onClick={onClick} className={commonClassName} aria-label="Show chat conversation" aria-pressed={isActive}>
        <MessageCircle className="h-4 w-4 stroke-[1.8]" />
      </button>
    );
  }

  if (channel === "sms") {
    return (
      <button type="button" onClick={onClick} className={commonClassName} aria-label="Show SMS conversation" aria-pressed={isActive}>
        <MessageSquare className="h-4 w-4 stroke-[1.8]" />
      </button>
    );
  }

  if (channel === "whatsapp") {
    return (
      <button type="button" onClick={onClick} className={commonClassName} aria-label="Show WhatsApp conversation" aria-pressed={isActive}>
        <WhatsAppIcon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button type="button" onClick={onClick} className={commonClassName} aria-label="Show email conversation" aria-pressed={isActive}>
      <Mail className="h-4 w-4 stroke-[1.8]" />
    </button>
  );
}

export default function Index() {
  const {
    isInteractionsOpen,
    isRightPanelOpen,
    closeRightPanel,
  } = useLayoutContext();
  const [activeChannel, setActiveChannel] = useState<ChannelType>("sms");
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);
  const [mobileDetailsTab, setMobileDetailsTab] = useState("Details");
  const activeConversation = conversationsByChannel[activeChannel];

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Main Interaction Area */}
      <div className="flex min-w-0 flex-1 flex-col bg-card">
        
        {/* Customer Context Banner */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card/50">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 ring-2 ring-background">
              <AvatarImage src="https://i.pravatar.cc/150?u=a04258114e29026702d" />
              <AvatarFallback>AK</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold tracking-tight">Alex Kowalski</h2>
                <div className="flex items-center gap-1.5">
                  <ChannelToggleButton
                    channel="chat"
                    activeChannel={activeChannel}
                    onClick={() => setActiveChannel("chat")}
                  />
                  <ChannelToggleButton
                    channel="sms"
                    activeChannel={activeChannel}
                    onClick={() => setActiveChannel("sms")}
                  />
                  <ChannelToggleButton
                    channel="whatsapp"
                    activeChannel={activeChannel}
                    onClick={() => setActiveChannel("whatsapp")}
                  />
                  <ChannelToggleButton
                    channel="email"
                    activeChannel={activeChannel}
                    onClick={() => setActiveChannel("email")}
                  />
                </div>
              </div>
              <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> alex.k@example.com</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Customer since 2021</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <PhoneCall className="w-4 h-4 mr-2" /> Call
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="min-[800px]:hidden">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="min-[800px]:hidden w-44 rounded-xl border border-black/10 bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
              >
                {NOTES_PANEL_MENU_ITEMS.map((item) => (
                  <DropdownMenuItem
                    key={item}
                    onSelect={() => {
                      setMobileDetailsTab(item);
                      setIsMobileDetailsOpen(true);
                    }}
                    className="rounded-lg px-3 py-2 text-sm text-[#333333] focus:bg-[#F8F8F9]"
                  >
                    {item}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content row: Conversation + Customer Data panels */}
        <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* Conversation column */}
          <div className="flex w-[420px] flex-shrink-0 flex-col border-r border-border">
            {/* Chat Transcript */}
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center">
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">{activeConversation.timelineLabel}</span>
                </div>

                {activeConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[85%]",
                      msg.role === "agent" ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className="flex items-end gap-2 mb-1">
                      {msg.role === "customer" && (
                        <span className="text-xs font-medium text-muted-foreground ml-1">Alex</span>
                      )}
                      {msg.role === "agent" && (
                        <span className="text-xs font-medium text-muted-foreground mr-1">You</span>
                      )}
                    </div>
                    <div
                      className={cn(
                        "px-4 py-3 rounded-2xl text-sm shadow-sm",
                        msg.role === "agent"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground border border-border/50 rounded-bl-sm"
                      )}
                    >
                      {msg.content}
                    </div>
                    {msg.sentiment === "frustrated" && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-orange-500 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Frustrated sentiment detected
                      </div>
                    )}
                  </div>
                ))}

                {/* AI Real-time context indicator */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse delay-75"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse delay-150"></span>
                  </div>
                  <span>
                    NexAgent AI is analyzing the {activeConversation.label.toLowerCase()} conversation...
                  </span>
                </div>
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-background border-t border-border">
              <div className="flex gap-3 items-end relative">
                <div className="absolute right-14 top-2 text-xs text-muted-foreground flex items-center gap-1 bg-background/80 backdrop-blur px-2 py-0.5 rounded-md border border-border">
                  <Sparkles className="w-3 h-3 text-primary" /> AI writing enabled
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 mb-1 h-10 w-10 text-muted-foreground hover:text-foreground">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <div className="flex-1 relative">
                  <Textarea
                    key={activeChannel}
                    placeholder="Type your message..."
                    className="min-h-[60px] max-h-32 resize-none pr-12 pb-3 pt-3 rounded-xl focus-visible:ring-1"
                    defaultValue={activeConversation.draft}
                  />
                </div>
                <Button className="shrink-0 mb-1 h-10 w-10 rounded-xl" size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Customer Data tabs */}
          <div className="hidden flex-1 min-w-0 overflow-hidden min-[800px]:flex">
            <div className="flex-1 min-w-0 overflow-hidden">
              <NotesPanel />
            </div>
          </div>

        </div>
      </div>

      {isMobileDetailsOpen && (
        <div className="absolute inset-0 z-40 min-[800px]:hidden">
          <button
            type="button"
            aria-label="Close customer details overlay"
            onClick={() => setIsMobileDetailsOpen(false)}
            className="absolute inset-0 bg-black/20"
          />
          <div className="absolute inset-x-4 top-4 bottom-4 flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-[#333333]">Customer Details</h3>
                <p className="text-xs text-[#7A7A7A]">{mobileDetailsTab}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileDetailsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <NotesPanel initialTab={mobileDetailsTab} />
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label="Close right panel"
        onClick={closeRightPanel}
        className={cn(
          "absolute inset-0 z-20 bg-black/20 transition-opacity duration-300 lg:hidden",
          isRightPanelOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* AI Copilot Panel */}
      <div
        className={cn(
          "absolute inset-y-0 right-0 z-30 overflow-hidden bg-white shadow-[-16px_0_32px_rgba(0,0,0,0.12)] transition-[width,opacity,transform,border-color] duration-300 ease-out lg:relative lg:inset-y-auto lg:right-auto lg:flex lg:w-[380px] lg:flex-shrink-0 lg:bg-muted/20 lg:shadow-none lg:transition-[max-width,opacity,border-color]",
          isRightPanelOpen
            ? "w-full max-w-[380px] translate-x-0 border-l border-border opacity-100 lg:max-w-[380px]"
            : "w-full max-w-[380px] translate-x-full border-l-0 opacity-0 pointer-events-none lg:max-w-0 lg:translate-x-0",
        )}
        aria-hidden={!isRightPanelOpen}
      >
        <div
          className={cn(
            "flex h-full min-w-full flex-col transition-transform duration-300 ease-out lg:min-w-[380px] lg:transition-opacity",
            isRightPanelOpen ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0 lg:translate-x-0",
          )}
        >
          {isInteractionsOpen ? (
            <RecentInteractionsPanel />
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-border bg-background/50 px-5 py-4">
                <Bot className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold tracking-tight">NexAgent Copilot</h3>
              </div>

              <ScrollArea className="flex-1 p-5">
                <div className="space-y-6">
            
            {/* Live Context Card */}
            <Card className="border-border shadow-sm bg-background">
              <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Live Interaction Context
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Detected Intent</div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    {insights.intent}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Sentiment</div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 font-medium">
                        {insights.sentiment}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Churn Risk</div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-orange-600">
                      <AlertTriangle className="w-4 h-4" /> Medium
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Suggested Response */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">Suggested Response</h4>
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 relative group transition-colors hover:bg-primary/10">
                <p className="text-sm text-foreground/90 leading-relaxed">
                  "I see the transaction block. It appears our security system flagged it due to a recent mismatch in billing zip codes. I've just cleared that flag for you. You should be able to process the upgrade now."
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <Button size="sm" variant="secondary" className="h-7 text-xs font-medium bg-background shadow-sm border border-border hover:bg-accent">
                    Apply to chat
                  </Button>
                </div>
              </div>
            </div>

            {/* Next Best Actions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-foreground">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-semibold">Next Best Actions</h4>
              </div>
              <div className="space-y-2">
                <button className="w-full text-left p-3 rounded-lg border border-border bg-background hover:border-primary/50 transition-colors flex items-start gap-3 group">
                  <div className="p-1.5 rounded-md bg-green-100 text-green-700 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium group-hover:text-primary transition-colors">Clear Security Flag</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Removes the hold on card ending in 4092</div>
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-lg border border-border bg-background hover:border-primary/50 transition-colors flex items-start gap-3 group">
                  <div className="p-1.5 rounded-md bg-blue-100 text-blue-700 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium group-hover:text-primary transition-colors">Send Payment Link</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Generate a secure one-time payment link</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Knowledge Base Articles */}
            <div className="space-y-3 pt-2 border-t border-border">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Relevant Articles</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-primary hover:underline flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate">Troubleshooting failed payments</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-primary hover:underline flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate">Manual clearance of security flags</span>
                  </a>
                </li>
              </ul>
            </div>

                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
