import { ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function VoiceAIGuidanceCard() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="rounded-xl border border-[#BFDBFE] bg-[#EBF4FD] p-3">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#166CCA]"
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Guidance</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <>
          <p className="mt-2 text-xs leading-5 text-[#333333]">
            Acknowledge the prior assistant handoff, confirm the beverage package upgrade request, and keep the customer from repeating details.
          </p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-[#6B7280]">
            <li>• Pronunciation: Kowalski ("Koah-wall-skee")</li>
            <li>• Confirm whether the customer needs the upgrade completed today.</li>
            <li>• Reference the failed chat attempt before moving into troubleshooting.</li>
          </ul>
        </>
      )}
    </div>
  );
}

export function VoiceGuidancePanel() {
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(true);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="rounded-xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <button
          type="button"
          onClick={() => setIsTranscriptExpanded((current) => !current)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-[#333333]"
        >
          <span>Transcript</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-[#7A7A7A] transition-transform",
              isTranscriptExpanded && "rotate-180",
            )}
          />
        </button>

        {isTranscriptExpanded ? (
          <div className="border-t border-black/10 px-4 py-4 text-xs leading-5 text-[#333333]">
            <p>Agent: Hello Mr. Kowalski, I see you were chatting with our team about upgrading your beverage package, and I can take it from here.</p>
            <p className="mt-2 text-[#7A7A7A]">
              Customer: thanks - I just need to switch from Premium to Extended but they said I am not allowed to
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
