import { ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function VoiceAIGuidanceCard() {
  return (
    <div className="rounded-xl border border-[#B8D7F0] bg-[#EEF6FC] p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#006DAD]">
        <Sparkles className="h-3.5 w-3.5" />
        AI Guidance
      </div>
      <p className="mt-2 text-xs leading-5 text-[#333333]">
        Acknowledge the prior assistant handoff, confirm the beverage package upgrade request, and keep the customer from repeating details.
      </p>
      <ul className="mt-2 space-y-1 text-xs leading-5 text-[#6B7280]">
        <li>• Pronunciation: Kowalski (“Koah-wall-skee”)</li>
        <li>• Confirm whether the customer needs the upgrade completed today.</li>
        <li>• Reference the failed chat attempt before moving into troubleshooting.</li>
      </ul>
    </div>
  );
}

export function VoiceGuidancePanel() {
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(true);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="rounded-2xl border border-[#B8D7F0] bg-[#F7FBFE] px-4 py-3 text-sm text-[#334155] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        Voice call is live. Review the AI guidance below while the transcript updates.
      </div>

      <VoiceAIGuidanceCard />

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
            <div className="rounded-lg border border-[#D7E7D4] bg-[#F4FAF2] px-3 py-2.5 text-[13px] leading-6 text-[#355E3B]">
              <p>Your call is connected. Please greet the customer and confirm the requested beverage package upgrade.</p>
              <p className="mt-2">
                Suggested opening: “Hello Mr. Kowalski, I see you were chatting with our team about upgrading your beverage package, and I can take it from here.”
              </p>
            </div>
            <p className="mt-3">Agent: Hello Mr. Kowalski, I see you were chatting with our team about upgrading your beverage package, and I can take it from here.</p>
            <p className="mt-2 text-[#7A7A7A]">
              Customer: thanks - I just need to switch from Premium to Extended but they said I am not allowed to
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
