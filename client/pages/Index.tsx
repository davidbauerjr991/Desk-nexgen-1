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
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileText,
  BookOpen
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useLayoutContext } from "@/components/Layout";

const messages = [
  {
    id: 1,
    role: "customer",
    content: "Hi, I'm trying to upgrade my subscription to the Pro tier, but my credit card keeps getting declined even though I know I have sufficient funds.",
    time: "10:24 AM",
    sentiment: "frustrated"
  },
  {
    id: 2,
    role: "agent",
    content: "Hello Alex! I'm sorry to hear you're experiencing issues upgrading your account. I can certainly help you look into this right away.",
    time: "10:25 AM",
  },
  {
    id: 3,
    role: "customer",
    content: "Thank you. It's the Visa ending in 4092. I just tried it again 5 minutes ago and got the same error.",
    time: "10:26 AM",
  }
];

const insights = {
  sentiment: "Frustrated",
  sentimentScore: 35, // out of 100
  intent: "Subscription Upgrade / Payment Failure",
  churnRisk: "Medium",
};

export default function Index() {
  const { isCopilotOpen, toggleCopilot } = useLayoutContext();

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Main Interaction Area */}
      <div
        className={cn(
          "flex-1 flex min-w-0 flex-col bg-card",
          isCopilotOpen && "lg:border-r lg:border-border",
        )}
      >
        
        {/* Customer Context Banner */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card/50">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 ring-2 ring-background">
              <AvatarImage src="https://i.pravatar.cc/150?u=a04258114e29026702d" />
              <AvatarFallback>AK</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight">Alex Kowalski</h2>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Pro User</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> alex.k@example.com</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Customer since 2021</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <PhoneCall className="w-4 h-4 mr-2" /> Call
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Chat Transcript */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">Today, 10:24 AM</span>
            </div>
            
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex flex-col max-w-[80%]",
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
              NexAgent AI is analyzing the conversation...
            </div>
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 bg-background border-t border-border">
          <div className="max-w-3xl mx-auto flex gap-3 items-end relative">
            <div className="absolute right-14 top-2 text-xs text-muted-foreground flex items-center gap-1 bg-background/80 backdrop-blur px-2 py-0.5 rounded-md border border-border">
              <Sparkles className="w-3 h-3 text-primary" /> AI writing enabled
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 mb-1 h-10 w-10 text-muted-foreground hover:text-foreground">
              <Paperclip className="w-5 h-5" />
            </Button>
            <div className="flex-1 relative">
              <Textarea 
                placeholder="Type your message..." 
                className="min-h-[60px] max-h-32 resize-none pr-12 pb-3 pt-3 rounded-xl focus-visible:ring-1"
                defaultValue="I see the transaction block. It appears our security system flagged it due to a recent mismatch in billing zip codes. Let me clear that flag for you."
              />
            </div>
            <Button className="shrink-0 mb-1 h-10 w-10 rounded-xl" size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-label="Close NexAgent Copilot"
        onClick={toggleCopilot}
        className={cn(
          "absolute inset-0 z-20 bg-black/20 transition-opacity duration-300 lg:hidden",
          isCopilotOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* AI Copilot Panel */}
      <div
        className={cn(
          "absolute inset-y-0 right-0 z-30 overflow-hidden bg-white shadow-[-16px_0_32px_rgba(0,0,0,0.12)] transition-[width,opacity,transform,border-color] duration-300 ease-out lg:relative lg:inset-y-auto lg:right-auto lg:flex lg:flex-shrink-0 lg:bg-muted/20 lg:shadow-none lg:transition-[width,opacity,border-color]",
          isCopilotOpen
            ? "w-full max-w-[380px] translate-x-0 border-l border-border opacity-100 lg:w-[380px] lg:max-w-[380px]"
            : "w-full max-w-[380px] translate-x-full border-l-0 opacity-0 pointer-events-none lg:w-0 lg:max-w-0 lg:translate-x-0",
        )}
        aria-hidden={!isCopilotOpen}
      >
        <div
          className={cn(
            "flex h-full min-w-full flex-col transition-transform duration-300 ease-out lg:min-w-[380px] lg:transition-opacity",
            isCopilotOpen ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0 lg:translate-x-0",
          )}
        >
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
        </div>
      </div>

    </div>
  );
}
