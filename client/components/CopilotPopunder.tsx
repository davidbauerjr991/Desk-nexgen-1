import { useEffect, useRef } from "react";
import {
  AlertTriangle,
  BookOpen,
  Bot,
  CheckCircle2,
  FileText,
  GripHorizontal,
  Lightbulb,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const insights = {
  sentiment: "Frustrated",
  intent: "Subscription Upgrade / Payment Failure",
  churnRisk: "Medium",
};

const customerContextFields = [
  { label: "Account Number", value: "QAE12393" },
  { label: "Phone Number", value: "(614) 788-0980" },
  { label: "First Name", value: "James" },
  { label: "Last Name", value: "Hasselhoffenbrau" },
  { label: "Empty Field", value: "--" },
  { label: "Long Field", value: "https://www.thisisalongemailaddress.com" },
  { label: "Email Address", value: "email@email.com" },
  { label: "Twitter", value: "@jphoffbrewer" },
];

export interface CopilotDragActivation {
  id: number;
  offset: {
    x: number;
    y: number;
  };
}

interface CopilotPopunderProps {
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  onPositionChange: (position: { x: number; y: number }) => void;
  onSizeChange: (size: { width: number; height: number }) => void;
  onClose: () => void;
  onDock?: () => void;
  dragActivation?: CopilotDragActivation | null;
}

export function CopilotContent() {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const frameId = window.requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  return (
    <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
      <div className="space-y-6 pb-1">
        <Card className="border-border bg-background shadow-sm">
          <Accordion type="single" collapsible defaultValue="live-interaction-context">
            <AccordionItem value="live-interaction-context" className="border-b-0">
              <AccordionTrigger className="px-4 py-4 text-left hover:no-underline">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Live Interaction Context
                  </div>
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#369D3F] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#369D3F]" />
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <CardContent className="space-y-4 p-0">
                  <div>
                    <div className="text-[11px] font-medium tracking-[0.01em] text-[#667085]">Detected Intent</div>
                    <div className="text-[14px] font-normal leading-[1.25] text-[#1D2939]">{insights.intent}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[11px] font-medium tracking-[0.01em] text-[#667085]">Sentiment</div>
                      <Badge variant="outline" className="border-[#FEDF89] bg-[#FFFAEB] font-medium text-[#B54708]">
                        {insights.sentiment}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium tracking-[0.01em] text-[#667085]">Churn Risk</div>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-[#B54708]">
                        <AlertTriangle className="h-4 w-4" />
                        {insights.churnRisk}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 border-t border-border pt-4">
                    {customerContextFields.map((field) => (
                      <div key={field.label}>
                        <div className="text-[11px] font-medium tracking-[0.01em] text-[#667085]">
                          {field.label}
                        </div>
                        <div className="break-all text-[14px] font-normal leading-[1.25] text-[#1D2939]">{field.value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Suggested Response</h4>
          </div>
          <div className="group rounded-xl border border-primary/20 bg-primary/5 p-4 transition-colors hover:bg-primary/10">
            <p className="text-sm leading-relaxed text-foreground/90">
              "I see the transaction block. It appears our security system flagged it due to a recent mismatch in billing zip codes.
              I&apos;ve just cleared that flag for you. You should be able to process the upgrade now."
            </p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                  <ThumbsUp className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                  <ThumbsDown className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 border border-border bg-background text-xs font-medium shadow-sm hover:bg-accent"
              >
                Apply to chat
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-foreground">
            <Lightbulb className="h-4 w-4 text-[#F79009]" />
            <h4 className="text-sm font-semibold">Next Best Actions</h4>
          </div>
          <div className="space-y-2">
            <button className="group flex w-full items-start gap-3 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-primary/50">
              <div className="mt-0.5 rounded-md bg-[#EAF8F4] p-1.5 text-[#369D3F]">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium transition-colors group-hover:text-primary">Clear Security Flag</div>
                <div className="mt-0.5 text-xs text-muted-foreground">Removes the hold on card ending in 4092</div>
              </div>
            </button>
            <button className="group flex w-full items-start gap-3 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-primary/50">
              <div className="mt-0.5 rounded-md bg-[#EEF6FC] p-1.5 text-[#006DAD]">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium transition-colors group-hover:text-primary">Send Payment Link</div>
                <div className="mt-0.5 text-xs text-muted-foreground">Generate a secure one-time payment link</div>
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-3 border-t border-border pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Relevant Articles</h4>
          <ul className="space-y-2">
            <li>
              <button type="button" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <BookOpen className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                <span className="truncate">Troubleshooting failed payments</span>
              </button>
            </li>
            <li>
              <button type="button" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <BookOpen className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                <span className="truncate">Manual clearance of security flags</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function CopilotPopunder({
  position,
  size,
  onPositionChange,
  onSizeChange,
  onClose,
  onDock,
  dragActivation = null,
}: CopilotPopunderProps) {
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: 360, height: 720 });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);

  useEffect(() => {
    if (!dragActivation) return;

    isDraggingRef.current = true;
    dragOffsetRef.current = dragActivation.offset;
    document.body.style.userSelect = "none";
  }, [dragActivation]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const margin = 16;

      if (isDraggingRef.current) {
        const nextX = event.clientX - dragOffsetRef.current.x;
        const nextY = event.clientY - dragOffsetRef.current.y;

        onPositionChange({
          x: Math.min(Math.max(margin, nextX), window.innerWidth - size.width - margin),
          y: Math.min(Math.max(margin, nextY), window.innerHeight - size.height - margin),
        });
        return;
      }

      if (!isResizingRef.current) return;

      const deltaX = event.clientX - resizeStartRef.current.mouseX;
      const deltaY = event.clientY - resizeStartRef.current.mouseY;

      onSizeChange({
        width: Math.min(
          Math.max(320, resizeStartRef.current.width + deltaX),
          window.innerWidth - position.x - margin,
        ),
        height: Math.min(
          Math.max(420, resizeStartRef.current.height + deltaY),
          window.innerHeight - position.y - margin,
        ),
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isResizingRef.current = false;
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [onPositionChange, onSizeChange, position.x, position.y, size.height, size.width]);

  return (
    <div
      className="fixed z-[70] flex min-h-[420px] min-w-[320px] flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        maxWidth: "calc(100vw - 2rem)",
        maxHeight: "calc(100vh - 2rem)",
      }}
    >
      <div
        className="flex cursor-grab items-start justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
        onMouseDown={(event) => {
          isDraggingRef.current = true;
          dragOffsetRef.current = {
            x: event.clientX - position.x,
            y: event.clientY - position.y,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <div className="flex items-start gap-3">
          <GripHorizontal className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-[#333333]">NiCE Copilot</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onDock ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={onDock}
              className="h-7 rounded-lg border-black/10 px-2.5 text-[11px] text-[#333333] hover:bg-white"
            >
              Dock panel
            </Button>
          ) : null}
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={onClose}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333]"
            aria-label="Close NiCE Copilot"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <CopilotContent />

      <button
        type="button"
        aria-label="Resize NiCE Copilot"
        className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          isResizingRef.current = true;
          resizeStartRef.current = {
            mouseX: event.clientX,
            mouseY: event.clientY,
            width: size.width,
            height: size.height,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-sm border-b-2 border-r-2 border-[#A1A1AA]" />
      </button>
    </div>
  );
}
