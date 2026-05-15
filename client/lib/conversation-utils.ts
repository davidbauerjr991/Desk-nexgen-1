import { conversationChannelOptions } from "@/components/ConversationChannelToggleGroup";
import { getCustomerAssignmentEntry } from "@/lib/customer-assignment-tasks";
import type { CustomerChannel } from "@/lib/customer-database";
import { COPILOT_TASK_MATCHERS } from "./conversation-constants";
import type { AgentTask, ConversationMessage, InlineSuggestion, SharedConversationData } from "./conversation-types";
import type { CustomerTicket } from "./ticket-data";
import { matchSuggestionVariants } from "./scenario-database";

export function formatConversationTimestamp(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getConversationChannelLabel(channel: CustomerChannel) {
  return conversationChannelOptions.find((option) => option.channel === channel)?.label ?? channel;
}

export function formatConversationMessageTimestamp(time: string) {
  return `Today, ${time.replace(/\s/g, "")}`;
}

export function isScrolledToBottom(viewport: HTMLDivElement) {
  return viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= 24;
}

export function matchCopilotInput(input: string): AgentTask | null {
  const lower = input.toLowerCase();
  for (const { keywords, task } of COPILOT_TASK_MATCHERS) {
    if (keywords.some((k) => lower.includes(k))) return task;
  }
  return null;
}

export function getSuggestedAgentTasks(conversation: SharedConversationData, latestCustomerMessage: ConversationMessage | null): AgentTask[] {
  // Always use per-customer entry if available
  const entryEarly = latestCustomerMessage ? null : getCustomerAssignmentEntry(conversation.customerName);
  if (entryEarly) return entryEarly.suggestedActions;

  // If no customer message yet, return universal fallback tasks
  if (!latestCustomerMessage) {
    return [
      { id: "update-itinerary", label: "Update Itinerary Record" },
      { id: "rebook-flight", label: "Rebook on Next Available Flight" },
    ];
  }

  // Prefer per-customer database entry for unique, context-specific suggested actions.
  const entry = getCustomerAssignmentEntry(conversation.customerName);
  if (entry) return entry.suggestedActions;

  // Fallback: keyword-based generic tasks.
  const allContent = conversation.messages.map((m) => m.content).join(" ").toLowerCase();
  const matched: AgentTask[] = [];

  if (["flight", "cancel", "delay", "rebook", "connection", "missed", "stranded", "grounded", "diverted"].some((k) => allContent.includes(k))) {
    matched.push({ id: "rebook-flight", label: "Rebook on Next Available Flight" });
  }

  if (["route", "alternative", "connection", "itinerary", "path", "options", "fastest", "quickest"].some((k) => allContent.includes(k))) {
    matched.push({ id: "map-route", label: "Map Quickest Route" });
  }

  if (["voucher", "compensation", "inconvenience", "sorry", "frustrated", "hours", "waiting", "stuck"].some((k) => allContent.includes(k))) {
    matched.push({ id: "issue-voucher", label: "Issue Travel Voucher" });
  }

  if (["hotel", "accommodation", "sleep", "overnight", "stay", "stranded", "nowhere"].some((k) => allContent.includes(k))) {
    matched.push({ id: "issue-hotel", label: "Issue Hotel Voucher" });
  }

  if (["bag", "baggage", "luggage", "suitcase", "lost", "missing", "delayed bag"].some((k) => allContent.includes(k))) {
    matched.push({ id: "trace-baggage", label: "Initiate Baggage Trace" });
  }

  // Only show "Close & Resolve Case" when the customer responds with positive/resolution sentiment
  const latestContent = latestCustomerMessage.content.toLowerCase();
  const isPositiveReview = ["thank you", "thanks", "that's great", "that was helpful", "resolved", "satisfied", "happy", "all set", "appreciate", "perfect", "wonderful", "great help", "problem solved", "sorted"].some((k) => latestContent.includes(k));

  // Ensure at least enough tasks to pick from — add universal fallbacks if needed
  const allTravelTasks: AgentTask[] = [
    { id: "rebook-flight", label: "Rebook on Next Available Flight" },
    { id: "map-route", label: "Map Quickest Route" },
    { id: "issue-voucher", label: "Issue Travel Voucher" },
    { id: "issue-hotel", label: "Issue Hotel Voucher" },
    { id: "update-itinerary", label: "Update Itinerary Record" },
    { id: "trace-baggage", label: "Initiate Baggage Trace" },
  ];
  for (const fallback of allTravelTasks) {
    if (!matched.some((t) => t.id === fallback.id)) {
      matched.push(fallback);
    }
  }

  // Deterministic shuffle seeded by customer name so the selection is stable per case
  const seed = conversation.customerName.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const shuffled = matched.slice().sort((a, b) => {
    const ha = ((seed * 31 + a.id.charCodeAt(0)) % 1000) - ((seed * 31 + b.id.charCodeAt(0)) % 1000);
    return ha;
  });

  // Cap at 3 tasks; if positive review, replace the last slot with Close & Resolve
  const picked = shuffled.slice(0, isPositiveReview ? 2 : 3);
  if (isPositiveReview) {
    picked.push({ id: "close-case", label: "Close & Resolve Case" });
  }

  return picked;
}

export function getSuggestionVariant<T>(variants: T[], refreshKey: number) {
  return variants[((refreshKey % variants.length) + variants.length) % variants.length];
}

export function applySuggestionEdit(
  suggestion: InlineSuggestion,
  instruction: string,
  conversation: SharedConversationData,
): InlineSuggestion {
  const normalizedInstruction = instruction.trim().toLowerCase();
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;
  const updateClauses: string[] = [];
  const replyClauses: string[] = [];

  if (normalizedInstruction.includes("voucher") || normalizedInstruction.includes("compensation") || normalizedInstruction.includes("goodwill")) {
    updateClauses.push("include a travel voucher or compensation offer for the disruption");
    replyClauses.push("I'm also issuing a travel voucher to cover meals and essentials while we get this sorted out.");
  }

  if (normalizedInstruction.includes("hotel") || normalizedInstruction.includes("accommodation") || normalizedInstruction.includes("overnight")) {
    updateClauses.push("arrange overnight hotel accommodation near the airport");
    replyClauses.push("I'll also arrange a hotel near the airport so you have somewhere comfortable to stay tonight.");
  }

  if (normalizedInstruction.includes("booking") || normalizedInstruction.includes("confirmation") || normalizedInstruction.includes("itinerary")) {
    updateClauses.push(`confirm the updated booking details and send ${customerFirstName} the revised itinerary`);
    replyClauses.push("I'll send you the updated itinerary with all the revised booking details as soon as everything is confirmed.");
  }

  if (normalizedInstruction.includes("bag") || normalizedInstruction.includes("luggage") || normalizedInstruction.includes("baggage")) {
    updateClauses.push("initiate a baggage trace and provide a tracking reference");
    replyClauses.push("I'm also starting a trace on your luggage and I'll send you tracking updates as soon as we have a location.");
  }

  if (updateClauses.length === 0) {
    updateClauses.push(`incorporate this agent request: ${instruction.trim()}`);
    replyClauses.push(`I'm also taking this additional step into account: ${instruction.trim()}.`);
  }

  return {
    summary: `${suggestion.summary} Update it to ${updateClauses.join(", ")}.`,
    suggestedReply: `${suggestion.suggestedReply} ${replyClauses.join(" ")}`.trim(),
  };
}

export function getInlineSuggestionVariants(
  conversation: SharedConversationData,
  customerMessage: ConversationMessage,
): InlineSuggestion[] {
  const normalizedMessage = customerMessage.content.toLowerCase();
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;

  // ── Scenario-specific suggestion variants (from scenario-database.ts) ──
  // Covers Elena (all 4 steps) and Sofia (fraud/handoff) variants.
  const customerRecordId = conversation.customerName === "Elena Vasquez" ? "elena"
    : conversation.customerName === "Marcus Webb" ? "marcus"
    : conversation.customerName === "Sofia Martinez" ? "sofia"
    : conversation.customerName === "Terry Williams" ? "terry"
    : conversation.customerName === "Jordan Davis" ? "jordan"
    : null;

  if (customerRecordId) {
    const scenarioVariants = matchSuggestionVariants(
      customerRecordId,
      conversation.customerName,
      customerMessage.content,
    );
    if (scenarioVariants) return scenarioVariants;
  }

  // ── Storm / travel disruption keyword-matched suggestions ──────────────

  if (normalizedMessage.includes("cancel") || normalizedMessage.includes("grounded") || normalizedMessage.includes("can't fly") || normalizedMessage.includes("not flying")) {
    return [
      {
        summary: `Acknowledge the cancellation, introduce yourself, and confirm you're already looking at rebooking options for ${customerFirstName}.`,
        suggestedReply: `Hi ${customerFirstName}, I'm Sarah and I'm here to help. I can see your flight was cancelled due to the storm — I'm already pulling up the best rebooking options for you.`,
      },
      {
        summary: `Lead with empathy for the cancellation, confirm you have the itinerary details, and set expectations for a quick rebooking.`,
        suggestedReply: `I'm so sorry about the cancellation, ${customerFirstName}. I have your itinerary in front of me and I'm working on getting you rebooked on the fastest available route right now.`,
      },
      {
        summary: `Reassure ${customerFirstName} that you're taking ownership of the rebooking and will have options within moments.`,
        suggestedReply: `I understand how frustrating this is. I'm taking ownership of your rebooking right now and I'll have the best available options for you in just a moment.`,
      },
      {
        summary: `Confirm the cancellation, explain you're checking alternate routes, and reassure the traveler they won't need to wait in the airport queue.`,
        suggestedReply: `I can confirm your flight was impacted by the storm. You don't need to wait in the airport rebooking queue — I'm checking alternate routes for you right now and I'll have options shortly.`,
      },
      {
        summary: `Introduce yourself warmly, acknowledge the disruption, and commit to finding the fastest path to the traveler's destination.`,
        suggestedReply: `Hi ${customerFirstName}, this is Sarah with Voyager support. I know this storm has thrown everything off — let me find the fastest way to get you where you need to be.`,
      },
      {
        summary: `Show empathy for the disruption, confirm you have full visibility into the storm impact, and promise a personalized rebooking plan.`,
        suggestedReply: `I completely understand — this storm has affected thousands of travelers and I want to make sure you're taken care of. I'm building a personalized rebooking plan for you right now.`,
      },
      {
        summary: `Acknowledge the stress of a cancellation, confirm you're already working on alternatives, and invite the traveler to share any preferences.`,
        suggestedReply: `I'm really sorry you're dealing with this. I'm already looking at alternative flights and connections — do you have any preferences on timing or routing I should factor in?`,
      },
      {
        summary: `Lead with a warm introduction, validate the frustration, and reassure the traveler you'll handle everything from here.`,
        suggestedReply: `Hey ${customerFirstName}, I'm Sarah — I'm going to take care of this for you. I can see the storm impact on your itinerary and I'm already working on getting you rebooked.`,
      },
      {
        summary: `Confirm the cancellation details, reassure the traveler that rebooking is your top priority, and set a short time expectation.`,
        suggestedReply: `I've confirmed the cancellation on your flight. Rebooking you is my top priority — I'll have the best available options ready for you within the next few minutes.`,
      },
    ];
  }

  if (normalizedMessage.includes("bag") || normalizedMessage.includes("luggage") || normalizedMessage.includes("suitcase") || normalizedMessage.includes("lost")) {
    return [
      {
        summary: `Acknowledge the missing baggage, confirm you're starting a trace, and reassure ${customerFirstName} you'll keep them updated.`,
        suggestedReply: `I'm sorry about your baggage, ${customerFirstName}. I'm initiating a trace right now and I'll keep you updated via SMS as soon as we have a location. Let's get this sorted.`,
      },
      {
        summary: `Show empathy for the baggage situation, confirm you have the routing details, and explain the trace process.`,
        suggestedReply: `I understand how stressful it is to be without your luggage, especially during all this disruption. I have your routing details and I'm starting the baggage trace immediately.`,
      },
      {
        summary: `Lead with reassurance, confirm that baggage delays are common during storm disruptions, and explain what happens next.`,
        suggestedReply: `With the storm causing widespread rerouting, baggage delays are unfortunately common right now. I'm starting a trace on your bags and I'll also issue a voucher for any essentials you need in the meantime.`,
      },
      {
        summary: `Introduce yourself, acknowledge the missing bags, and commit to resolving it quickly.`,
        suggestedReply: `Hi ${customerFirstName}, I'm Sarah. I can see your bags didn't make it to your current location — I'm on it. I'll start the trace now and have an update for you shortly.`,
      },
      {
        summary: `Confirm the baggage issue and proactively offer a voucher for essentials while the trace is underway.`,
        suggestedReply: `I'm tracking down your luggage right now. While we wait for the trace results, I'd like to issue you a voucher for essentials — I know being without your bags is the last thing you need.`,
      },
      {
        summary: `Reassure the traveler that most storm-delayed bags are recovered quickly, and explain the next steps.`,
        suggestedReply: `Good news is that most bags delayed by weather disruptions are located within 24 hours. I've started the trace and I'll send you tracking updates by SMS as soon as we have a location.`,
      },
      {
        summary: `Acknowledge the frustration, take ownership, and set clear expectations for the trace timeline.`,
        suggestedReply: `I completely understand the frustration. I'm taking ownership of this — the baggage trace is underway and I'll personally follow up with you once we have a confirmed location.`,
      },
      {
        summary: `Validate the concern, confirm the trace is starting, and let the traveler know about compensation options.`,
        suggestedReply: `I'm sorry this happened. The trace is starting now and I'll also make sure you're covered for any immediate expenses while your bags are in transit.`,
      },
      {
        summary: `Lead with empathy, confirm the trace process, and offer to arrange delivery once the bags are located.`,
        suggestedReply: `I know this is really inconvenient. I'm putting the trace through now, and once we locate your bags I'll arrange delivery directly to wherever you're staying.`,
      },
    ];
  }

  if (normalizedMessage.includes("hotel") || normalizedMessage.includes("sleep") || normalizedMessage.includes("overnight") || normalizedMessage.includes("stay") || normalizedMessage.includes("accommodation")) {
    return [
      {
        summary: `Confirm you're arranging overnight accommodation and reassure ${customerFirstName} you'll handle the logistics.`,
        suggestedReply: `I'm checking availability at our partner hotels near the airport right now, ${customerFirstName}. I'll have a room confirmed for you shortly — you shouldn't have to worry about finding a place to stay.`,
      },
      {
        summary: `Acknowledge the need for accommodation, confirm you're issuing a hotel voucher, and explain what's included.`,
        suggestedReply: `Absolutely — let me get you set up with a hotel voucher right away. I'm checking our partner properties near the airport and I'll send you the confirmation with check-in details.`,
      },
      {
        summary: `Lead with empathy for the overnight situation, confirm you're arranging a hotel, and offer meal vouchers as well.`,
        suggestedReply: `I know being stuck overnight is exhausting. I'm arranging a hotel near the airport for you now, and I'll also include a meal voucher to cover dinner and breakfast.`,
      },
      {
        summary: `Reassure the traveler that accommodation is covered, and explain you're finding the best available option.`,
        suggestedReply: `Don't worry about accommodation — that's on us. I'm finding the best available hotel near the airport and I'll have everything confirmed for you in just a moment.`,
      },
      {
        summary: `Confirm the hotel arrangement, mention shuttle or transport options, and set expectations for confirmation.`,
        suggestedReply: `I'm booking a room for you now at one of our partner hotels with airport shuttle service. You'll receive the confirmation and check-in details by email within a few minutes.`,
      },
      {
        summary: `Show understanding for the overnight disruption, confirm you're handling everything, and offer a warm tone.`,
        suggestedReply: `I'm really sorry you're dealing with an overnight delay. Let me take care of the hotel — I'll find somewhere comfortable and send you all the details so you can get some rest.`,
      },
      {
        summary: `Acknowledge the accommodation request, confirm availability check, and proactively include transport.`,
        suggestedReply: `Great question — let me sort that out for you right now. I'm checking partner hotels near the airport and I'll include ground transport details so you can get there easily.`,
      },
      {
        summary: `Lead with reassurance, confirm the hotel voucher process, and set a short timeline for confirmation.`,
        suggestedReply: `You're absolutely covered for overnight accommodation. I'm issuing a hotel voucher now and you should have the booking confirmation within the next few minutes.`,
      },
      {
        summary: `Validate the traveler's concern about where to stay, take ownership, and commit to a quick resolution.`,
        suggestedReply: `I completely understand — let me handle this for you. I'm securing a hotel room right now and I'll make sure you have everything you need for tonight.`,
      },
    ];
  }

  if (normalizedMessage.includes("urgent") || normalizedMessage.includes("meeting") || normalizedMessage.includes("business") || normalizedMessage.includes("critical") || normalizedMessage.includes("important") || normalizedMessage.includes("deadline")) {
    return [
      {
        summary: `Acknowledge the time-sensitive nature, confirm you're prioritizing the fastest route, and reassure the traveler.`,
        suggestedReply: `I understand this is time-critical, ${customerFirstName}. I'm prioritizing the absolute fastest route to get you there — whether that's the next flight out or an alternative connection. I'll have options for you in just a moment.`,
      },
      {
        summary: `Lead with urgency, confirm you're checking all transport options, and commit to meeting the traveler's timeline.`,
        suggestedReply: `I know you have a tight deadline. I'm checking every available option right now — flights, alternate hubs, even ground transport — to find the fastest way to get you there on time.`,
      },
      {
        summary: `Validate the urgency, confirm immediate action, and set expectations for a fast turnaround.`,
        suggestedReply: `I'm treating this as top priority. Let me map out the quickest possible route for you — I'll have the best options ready within the next few minutes.`,
      },
      {
        summary: `Show empathy for the pressure, confirm you're working on it, and give confidence that you'll find a solution.`,
        suggestedReply: `I completely understand the pressure — missing a critical commitment is the last thing you need. I'm on it right now and I'm going to find the fastest way to get you where you need to be.`,
      },
      {
        summary: `Acknowledge the deadline, confirm you're pulling all available routes, and invite the traveler to share preferences.`,
        suggestedReply: `Given your deadline, I'm pulling every available route right now. Are you flexible on connections, or would you prefer a direct flight even if it departs a bit later?`,
      },
      {
        summary: `Lead with confidence, confirm the urgency is understood, and set a short response window.`,
        suggestedReply: `Understood — I'm on this right now. I'll have the fastest available option identified for you within the next couple of minutes. We'll get you there.`,
      },
      {
        summary: `Validate the time constraint, confirm you're escalating to priority rebooking, and reassure the traveler.`,
        suggestedReply: `I hear you — this needs to happen fast. I'm escalating your rebooking to priority status right now so we can get you on the earliest possible departure.`,
      },
      {
        summary: `Acknowledge the critical timing, skip formalities, and go straight to action.`,
        suggestedReply: `Let's get you moving. I'm checking the next available departures right now and I'll come back with the fastest option — no time to waste.`,
      },
      {
        summary: `Show understanding of the business impact, confirm you're exploring all options including alternate airports.`,
        suggestedReply: `I understand there's a lot riding on this. I'm looking at all options including alternate airports and connecting routes to find the absolute fastest path to your destination.`,
      },
    ];
  }

  if (normalizedMessage.includes("thank") || normalizedMessage.includes("worked") || normalizedMessage.includes("great") || normalizedMessage.includes("appreciate") || normalizedMessage.includes("perfect")) {
    return [
      {
        summary: `Acknowledge the thanks, confirm everything is set, and wish the traveler well.`,
        suggestedReply: `You're very welcome, ${customerFirstName}! I'm glad we got everything sorted. Your updated itinerary is all set — have a safe trip and don't hesitate to reach out if anything changes.`,
      },
      {
        summary: `Respond warmly, confirm the rebooking is complete, and offer to help with anything else.`,
        suggestedReply: `Happy to help! Your new itinerary is confirmed and you should have everything you need. Is there anything else I can assist with before I close this out?`,
      },
      {
        summary: `Close the conversation on a positive note, confirm the details are in the app, and wish them well.`,
        suggestedReply: `I'm glad we could get this taken care of. All the updated details are in your Voyager app. Safe travels, ${customerFirstName} — and reach out anytime if you need us!`,
      },
      {
        summary: `Acknowledge the positive response, confirm everything is in order, and offer a warm close.`,
        suggestedReply: `That's great to hear! Everything is confirmed on my end. I hope the rest of your journey goes smoothly — we're always here if you need anything.`,
      },
      {
        summary: `Respond to the thanks, summarize what was done, and end on a positive note.`,
        suggestedReply: `My pleasure — that's what I'm here for. Your rebooking and vouchers are all set. Wishing you smooth skies from here, ${customerFirstName}!`,
      },
      {
        summary: `Offer a warm close, confirm no further action is needed, and invite the traveler to come back anytime.`,
        suggestedReply: `You're all set! No further action needed on your end. It was great helping you today — have a wonderful trip and don't hesitate to reach out if anything comes up.`,
      },
      {
        summary: `Celebrate the resolution briefly, confirm the case is closed, and wish the traveler safe travels.`,
        suggestedReply: `So glad we got this resolved for you. Your case is all wrapped up and your new itinerary is ready to go. Safe travels! ✈️`,
      },
      {
        summary: `Acknowledge the positive feedback warmly and close the loop.`,
        suggestedReply: `Thank you — I'm really glad I could help. Everything is confirmed and you're good to go. Reach out anytime if you need us, ${customerFirstName}!`,
      },
      {
        summary: `Respond with warmth, confirm everything is finalized, and end the interaction positively.`,
        suggestedReply: `It was my pleasure to help! All your travel details are updated and confirmed. I hope the rest of your trip is smooth sailing — take care!`,
      },
    ];
  }

  // ── Default fallback: warm, travel/storm-appropriate introduction ──────
  return [
    {
      summary: `Introduce yourself warmly, acknowledge the disruption, and let ${customerFirstName} know you're here to help get them where they need to go.`,
      suggestedReply: `Hi ${customerFirstName}, I'm Sarah and I'm here to help. I know the storm has caused a lot of disruption — let me take a look at your itinerary and we'll get you where you need to be.`,
    },
    {
      summary: `Lead with empathy for the travel disruption, confirm you have ${customerFirstName}'s details, and commit to finding a solution.`,
      suggestedReply: `Hi ${customerFirstName}, I can see your travel has been impacted by the storm. I have your booking details in front of me and I'm already looking at the best options to get you back on track.`,
    },
    {
      summary: `Introduce yourself and take immediate ownership of the situation so ${customerFirstName} knows they're in good hands.`,
      suggestedReply: `Hey ${customerFirstName}, this is Sarah with Voyager. I'm going to take care of this for you — let me pull up your itinerary and I'll have your options ready in just a moment.`,
    },
    {
      summary: `Greet the traveler warmly, acknowledge the storm situation, and set expectations for a quick resolution.`,
      suggestedReply: `Hi there, ${customerFirstName}! I'm Sarah and I'm here to sort this out. I know the Minneapolis storm has thrown a lot of plans off — let's see what we can do to get yours back on track.`,
    },
    {
      summary: `Open with reassurance, confirm you're actively reviewing the situation, and invite the traveler to share what they need most.`,
      suggestedReply: `Hi ${customerFirstName}, I'm Sarah. I'm already reviewing your travel details and the latest storm updates. What's most important to you right now — getting rebooked, or do you need accommodation first?`,
    },
    {
      summary: `Introduce yourself, validate the disruption, and reassure the traveler you'll handle everything.`,
      suggestedReply: `Hi ${customerFirstName}, I'm Sarah and I'll be helping you today. I know this storm has been incredibly disruptive — you don't need to worry about the logistics, I'll handle everything from here.`,
    },
    {
      summary: `Greet the traveler, acknowledge the challenging situation, and offer a clear next step.`,
      suggestedReply: `Hey ${customerFirstName}, I'm Sarah. I can see your travel was affected by the winter storm. Let me review your itinerary and I'll come back with the best path forward within the next minute or two.`,
    },
    {
      summary: `Open with warmth and confidence, show you understand the scale of the disruption, and commit to personalized help.`,
      suggestedReply: `Hi ${customerFirstName}! I'm Sarah, and I know this has been a tough day for a lot of travelers. I'm here to give you my full attention and make sure we get you sorted out as quickly as possible.`,
    },
    {
      summary: `Introduce yourself and reassure the traveler that they've reached the right person to resolve their situation.`,
      suggestedReply: `Hi ${customerFirstName}, you've reached the right person. I'm Sarah and I'm going to take care of your travel situation. Let me pull everything up and we'll figure out the best next step together.`,
    },
  ];
}

export function getInlineSuggestion(
  conversation: SharedConversationData,
  customerMessage: ConversationMessage,
  refreshKey = 0,
) {
  return getSuggestionVariant(getInlineSuggestionVariants(conversation, customerMessage), refreshKey);
}

export function getSummarySnippet(content: string | undefined, maxLength = 170) {
  const normalizedContent = content?.replace(/\s+/g, " ").trim();

  if (!normalizedContent) {
    return null;
  }

  return normalizedContent.length > maxLength
    ? `${normalizedContent.slice(0, maxLength - 3)}...`
    : normalizedContent;
}

export function getRemainingSupportNeed(issueSummary: string | null, latestCustomerMessage: ConversationMessage | undefined) {
  const normalizedReply = latestCustomerMessage?.content.toLowerCase() ?? "";
  const normalizedIssue = issueSummary?.toLowerCase() ?? "";
  const evaluationText = `${normalizedReply} ${normalizedIssue}`.trim();

  if (normalizedReply.includes("where should i update") || normalizedReply.includes("old zip") || normalizedReply.includes("recently moved")) {
    return "Show the customer exactly where to update the billing details, point to the field that is wrong, and ask them to wait to retry until that profile update is complete.";
  }

  if (normalizedReply.includes("duplicate charge") || normalizedReply.includes("charged twice") || normalizedReply.includes("double charge")) {
    return "Check whether any duplicate authorization exists, explain the billing risk clearly, and then tell the customer if it is safe to retry.";
  }

  if (normalizedReply.includes("payment link") || normalizedReply.includes("secure link") || normalizedReply.includes("send it over") || normalizedReply.includes("inbox")) {
    return "Send the promised follow-up now, confirm where it was delivered, and tell the customer the exact step to take once it arrives.";
  }

  if (normalizedReply.includes("full page") || normalizedReply.includes("payment section") || normalizedReply.includes("screenshot") || normalizedReply.includes("photo")) {
    return "Specify exactly what screenshot or evidence the customer should send, confirm how to send it, and review it before asking for another retry.";
  }

  if (normalizedReply.includes("should i retry") || normalizedReply.includes("retry it now") || normalizedReply.includes("what should i do next")) {
    return "Answer the customer's question directly with one clear next action and make it explicit whether they should retry now or wait for another fix first.";
  }

  if (normalizedReply.includes("worked") || normalizedReply.includes("thank you")) {
    return "Confirm the issue is resolved, tell the customer what to watch for next, and close the loop cleanly unless another problem appears.";
  }

  if (evaluationText.includes("same error") || evaluationText.includes("still") || evaluationText.includes("retry") || evaluationText.includes("declined") || evaluationText.includes("blocked")) {
    return "Explain what is still blocking the latest attempt, describe what changed since the failed retry, and give the customer one new action instead of repeating the previous step.";
  }

  if (evaluationText.includes("billing") || evaluationText.includes("zip") || evaluationText.includes("card") || evaluationText.includes("payment")) {
    return "Verify the billing details on file, call out the exact field that needs attention, and confirm when the customer should try again.";
  }

  if (evaluationText.includes("urgent") || evaluationText.includes("today") || evaluationText.includes("meeting") || evaluationText.includes("deadline")) {
    return "Take immediate ownership of the blocker and reply with a time-sensitive resolution path the customer can act on right away.";
  }

  return "Respond directly to the customer's latest reply and turn it into one specific next action they can take now.";
}

export function getDetectedIntent(messages: SharedConversationData["messages"]): string {
  const text = messages
    .filter((m) => m.role === "customer")
    .map((m) => m.content.toLowerCase())
    .join(" ");

  if (text.match(/\b(subscription|plan|upgrade|downgrade|tier)\b/) && text.match(/\b(payment|billing|charge|fail|decline)\b/)) {
    return "Subscription Upgrade / Payment Failure";
  }
  if (text.match(/\b(cancel|cancellation|unsubscribe)\b/)) {
    return "Cancellation Request";
  }
  if (text.match(/\b(subscription|plan|upgrade|downgrade|tier)\b/)) {
    return "Subscription Upgrade / Change";
  }
  if (text.match(/\b(payment|billing|charge|invoice|refund|overpaid|overcharg)\b/)) {
    return "Billing / Payment Issue";
  }
  if (text.match(/\b(delivery|shipping|package|parcel|reroute|transit|exception)\b/)) {
    return "Delivery / Shipping Issue";
  }
  if (text.match(/\b(broken|error|bug|crash|not work|issue|problem|fail)\b/)) {
    return "Technical Issue";
  }
  return "General Inquiry";
}

export function getChurnRisk(messages: SharedConversationData["messages"]): { label: string; level: "low" | "medium" | "high" } {
  const hasFrustration = messages.some((m) => m.sentiment === "frustrated" || m.sentiment === "critical");
  const text = messages.map((m) => m.content.toLowerCase()).join(" ");
  const highRiskWords = /\b(cancel|leave|competitor|refund|lawsuit|terrible|unacceptable|never again)\b/;

  if (hasFrustration && highRiskWords.test(text)) return { label: "High", level: "high" };
  if (hasFrustration) return { label: "Medium", level: "medium" };
  return { label: "Low", level: "low" };
}

export function getConversationOverview(conversation: SharedConversationData) {
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;
  const latestCustomerMessage = [...conversation.messages].reverse().find((message) => message.role === "customer");
  const latestAgentMessage = [...conversation.messages].reverse().find((message) => message.role === "agent");
  const issueSummary = getSummarySnippet(latestCustomerMessage?.content);
  const priorHelpSummary = getSummarySnippet(latestAgentMessage?.content, 150);
  const assignmentReason = (latestCustomerMessage?.sentiment === "frustrated" || latestCustomerMessage?.sentiment === "critical")
    ? `${customerFirstName} was routed to this agent because the issue is still unresolved and the customer is showing frustration in the current ${conversation.label.toLowerCase()} thread.`
    : `${customerFirstName} was routed to this agent because the current ${conversation.label.toLowerCase()} thread still needs active ownership to move the issue forward.`;
  const customerIssue = issueSummary
    ? `${customerFirstName} is dealing with this issue: ${issueSummary}`
    : `${customerFirstName}'s current issue has not been fully captured in the thread yet.`;
  const priorHelp = priorHelpSummary
    ? `The previous agent or AI already tried to help by saying or doing this: ${priorHelpSummary}`
    : "The previous agent or AI has not yet documented a meaningful action that would unblock the issue.";
  const remainingNeed = getRemainingSupportNeed(issueSummary, latestCustomerMessage);

  const detectedIntent = getDetectedIntent(conversation.messages);
  const churnRisk = getChurnRisk(conversation.messages);
  const sentiment = latestCustomerMessage?.sentiment ?? null;

  return {
    assignmentReason,
    customerIssue,
    priorHelp,
    remainingNeed,
    detectedIntent,
    churnRisk,
    sentiment,
  };
}

export function getEmailAddress(name: string) {
  const localPart = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

  return `${localPart || "support"}@nice.com`;
}

export function getEmailThreadContent(content: string) {
  const [firstLine = "", ...remainingLines] = content.split("\n");
  const hasSubjectLine = firstLine.toLowerCase().startsWith("subject:");
  const subject = hasSubjectLine ? firstLine.slice("subject:".length).trim() : "";
  const body = (hasSubjectLine ? remainingLines : [firstLine, ...remainingLines]).join("\n").trim();

  return { subject, body };
}

export function getReplyEmailSubject(conversation: SharedConversationData) {
  const firstCustomerEmail = conversation.messages.find((message) => message.role === "customer");
  const parsedEmail = firstCustomerEmail ? getEmailThreadContent(firstCustomerEmail.content) : null;
  const baseSubject = parsedEmail?.subject || `${conversation.customerName} follow-up`;

  return /^re:/i.test(baseSubject) ? baseSubject : `Re: ${baseSubject}`;
}

export function getTicketPriorityDotClassName(priority: CustomerTicket["priority"]) {
  switch (priority) {
    case "Low":
      return "bg-[#208337]";
    case "Medium":
      return "bg-[#166CCA]";
    case "High":
      return "bg-[#FFB800]";
    default:
      return "bg-[#E32926]";
  }
}

export function getTicketStatusBadgeClasses(status: CustomerTicket["status"]) {
  switch (status) {
    case "Open":
      return "border-[#24943E] bg-[#EFFBF1] text-[#208337]";
    case "In Progress":
      return "border-[#A37A00] bg-[#FFF6E0] text-[#A37A00]";
    case "Pending Customer":
    case "On-Hold":
    case "Training Rescheduled":
      return "border-[#A37A00] bg-[#FFF6E0] text-[#A37A00]";
    case "Escalated":
    case "Needing Attention":
      return "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]";
    default:
      return "border-black/10 bg-white text-[#475467]";
  }
}
