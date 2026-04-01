import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Bot,
  GripHorizontal,
  Send,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

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

const DEFAULT_TOPICS = [
  "Dispute a fraudulent Costco charge",
  "Escalate to a supervisor",
  "Document the information around it",
];

export function CopilotContent() {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [topics, setTopics] = useState<{ label: string; checked: boolean }[]>(() =>
    DEFAULT_TOPICS.map((label) => ({ label, checked: false }))
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const frameId = window.requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    setChatInput("");
  };

  const toggleTopic = (index: number) => {
    setTopics((prev) => prev.map((t, i) => i === index ? { ...t, checked: !t.checked } : t));
  };

  const deleteTopic = (index: number) => {
    setTopics((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      {/* Scrollable content */}
      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-6 pb-1">

          {/* Conversation Topics */}
          {topics.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conversation Topics</h4>
              <div className="space-y-2">
                {topics.map((topic, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTopic(i)}
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        topic.checked
                          ? "border-[#006DAD] bg-[#006DAD]"
                          : "border-[#D0D5DD] bg-white hover:border-[#006DAD]"
                      }`}
                      aria-label={topic.checked ? "Uncheck topic" : "Check topic"}
                    >
                      {topic.checked && (
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <span className={`flex-1 text-sm ${topic.checked ? "text-muted-foreground line-through" : "text-[#1D2939]"}`}>
                      {topic.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteTopic(i)}
                      className="shrink-0 text-[#D0D5DD] transition-colors hover:text-[#F04438]"
                      aria-label="Remove topic"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
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

      {/* Chat input footer */}
      <div className="shrink-0 border-t border-border bg-background px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-[#F8F8F9] px-3 py-2 focus-within:border-[#006DAD]/40 focus-within:bg-white transition-colors">
          <Bot className="h-4 w-4 shrink-0 text-[#7A7A7A]" />
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask Copilot anything…"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#333333] placeholder:text-[#AAAAAA] focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!chatInput.trim()}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#006DAD] text-white transition-colors hover:bg-[#0A5E92] disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
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
