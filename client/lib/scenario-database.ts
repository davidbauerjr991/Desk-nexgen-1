/**
 * scenario-database.ts
 *
 * Centralised per-scenario data for the Desk Next Gen prototype.
 * Each customer scenario (Jordan, Sofia, Marcus, Terry, Elena) has its own
 * entry here — escalation notification payloads, simulated customer replies,
 * suggestion variants, forced suggestion variants, opportunity panel content,
 * and any other scenario-specific strings or config.
 *
 * Components read from this file instead of hardcoding scenario data inline.
 */

import type { InlineSuggestion } from "./conversation-types";

// ─── Types ──────────────────────────────────────────────────────────────────

export type CustomerReplyMatch = {
  /** Keywords the agent message must include (OR logic — any match). */
  agentKeywords: string[];
  /** Keywords the agent message must NOT include (AND logic — all excluded). */
  agentExclude?: string[];
  /** Keywords the latest customer message must include (AND logic). */
  customerContextIncludes?: string[];
  /** Keywords the latest customer message must NOT include. */
  customerContextExcludes?: string[];
  /** The reply the customer sends, or a rich reply with star rating / AI action. */
  reply: string | {
    content: string;
    starRating?: number;
    aiAction?: { label: string; description: string; actionId: string };
  };
};

export type SuggestionVariantMatch = {
  /** Customer name to match (exact). If omitted, matches any customer. */
  customerName?: string;
  /** Keywords the customer message must include (OR logic — any match). */
  keywords: string[];
  /** Suggestion variants to return. */
  variants: InlineSuggestion[];
};

export type EscalationPayload = {
  id: string;
  customerRecordId: string;
  channel: "chat" | "voice";
  initials: string;
  name: string;
  customerId: string;
  label: string;
  lastUpdated: string;
  time: string;
  preview: string;
  statusLabel: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  priorityClassName: string;
  badgeColor: string;
  /** "MessageCircle" | "Phone" — resolved to Lucide icon in the component. */
  iconName: "MessageCircle" | "Phone";
};

export type ForcedSuggestionConfig = {
  /** Default forced reply text. */
  defaultReply: string;
  /** Suggestion variant cards. */
  variants: InlineSuggestion[];
};

export type OpportunityPanelData = {
  title: string;
  description: string;
  bundleName: string;
  bundlePrice: string;
  bundleDiscount: string;
  bundleItems: string[];
  coachingNote: string;
  /** Internal note text when "Add to Order" is clicked. `{date}` is replaced at runtime. */
  internalNoteTemplate: string;
  processingLabel: string;
  successLabel: string;
};

export type ScenarioConfig = {
  /** Escalation notification payload. */
  escalation: EscalationPayload;
  /** Ordered customer reply matchers — first match wins. */
  customerReplies: CustomerReplyMatch[];
  /** Catch-all customer reply when no matcher hits. */
  customerReplyFallback: string;
  /** Suggestion variant matchers (checked by getInlineSuggestionVariants). */
  suggestionVariants: SuggestionVariantMatch[];
  /** Forced suggestion shown after tasks complete / on takeover. */
  forcedSuggestion?: ForcedSuggestionConfig;
  /** Task IDs that must all complete before "all tasks done" flag is set. */
  completionTaskIds?: string[];
  /** Recommended action text shown in customer info panel. */
  recommendedAction?: string;
  /** Opportunity / cross-sell panel data. */
  opportunity?: OpportunityPanelData;
  /** Terry-specific: hardcoded account number for call launch. */
  accountNumber?: string;
  /** Terry-specific: transcript lines for the sales demo call. */
  transcriptLines?: Array<{ speaker: "customer" | "agent"; text: string; elapsed: number }>;
};

// ─── Scenario Configs ───────────────────────────────────────────────────────

const jordan: ScenarioConfig = {
  escalation: {
    id: "escalation-static-11",
    customerRecordId: "jordan",
    channel: "chat",
    initials: "JD",
    name: "Jordan Davis",
    customerId: "CST-11621",
    label: "Aria",
    lastUpdated: "11m",
    time: "11m",
    preview: "Router dropping all connections — port forwarding config blocking factory reset",
    statusLabel: "Escalated",
    priority: "Critical",
    priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
    badgeColor: "#E32926",
    iconName: "MessageCircle",
  },
  customerReplies: [],
  customerReplyFallback: "Thanks for the update. That helps. What should I do next on my side?",
  suggestionVariants: [],
};

const sofia: ScenarioConfig = {
  escalation: {
    id: "escalation-static-sofia",
    customerRecordId: "sofia",
    channel: "chat",
    initials: "SM",
    name: "Sofia Martinez",
    customerId: "CST-12045",
    label: "Jacob",
    lastUpdated: "8m",
    time: "8m",
    preview: "Proactive fraud alert — 2 unauthorized transactions totaling $2,159 detected",
    statusLabel: "Escalated",
    priority: "Critical",
    priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
    badgeColor: "#E32926",
    iconName: "MessageCircle",
  },
  customerReplies: [
    // Fraud/takeover handoff — Jeff introducing himself after Sofia's case
    {
      agentKeywords: ["monitoring", "been following", "been watching", "stepped in"],
      agentExclude: [],
      customerContextIncludes: [],
      reply: "Thank you so much! I really appreciate it. I'm just relieved this is being taken care of — I was honestly so scared earlier.",
    },
  ],
  customerReplyFallback: "Thanks for the update. That helps. What should I do next on my side?",
  suggestionVariants: [
    {
      keywords: ["fraud", "unauthorized", "scared", "rent", "temporary credit", "fraudulent", "robbed", "outrageous"],
      variants: [
        {
          summary: "Lead with presence — let {firstName} know you've been here the whole time and she's safe.",
          suggestedReply: "Hi {firstName}, this is Jeff. I've been with you through this entire conversation. You have absolutely nothing to apologize for — your account is safe. We've got you.",
        },
        {
          summary: "Validate her anger, confirm you saw everything, and make her feel protected.",
          suggestedReply: "{firstName}, I'm Jeff. I've been following every step of this conversation and I want you to know — your anger is completely justified. Your account is secured, those charges are flagged, and I'm personally making sure this gets resolved.",
        },
        {
          summary: "Reassure {firstName} that she's not alone and that everything is already being handled.",
          suggestedReply: "Hi {firstName}, my name is Jeff. I've been right here watching this unfold and I want to be clear: none of this is your fault. Your money is protected, the charges are frozen, and I'm not going anywhere until you feel completely taken care of.",
        },
        {
          summary: "Open with empathy and immediately address the rent concern — her most urgent worry.",
          suggestedReply: "{firstName}, this is Jeff — I've been with you since Jacob first flagged the issue. I know rent is due tomorrow and I want to put your mind at ease: the $2,159 credit is already on your account. Your rent payment will go through. You're safe.",
        },
        {
          summary: "Introduce yourself warmly and make it personal — 11 years of loyalty matters.",
          suggestedReply: "Hi {firstName}, I'm Jeff. After 11 years as a customer, you deserve better than this, and I'm sorry it happened. I've been monitoring this conversation from the start and I'm stepping in personally to make sure everything is made right.",
        },
        {
          summary: "Keep it short and human — let {firstName} know she's heard and protected.",
          suggestedReply: "{firstName}, this is Jeff. I've been here the whole time. What happened to your account is serious and we're treating it that way. You're protected and I'm here for whatever you need.",
        },
        {
          summary: "Acknowledge the handoff, confirm no details are lost, and give {firstName} confidence.",
          suggestedReply: "Hi {firstName}, I'm Jeff — I've been following your conversation with Jacob and you won't need to repeat a single thing. The fraudulent charges are frozen, your account is protected, and I'm personally overseeing the rest of this. We've got you.",
        },
        {
          summary: "Lead with action — confirm what's already done and what happens next.",
          suggestedReply: "{firstName}, my name is Jeff and I've been with you since the beginning of this conversation. Here's where we stand: both fraudulent charges are flagged, a $2,159 provisional credit is on your account, and a replacement card is being issued. You're in good hands.",
        },
        {
          summary: "Close with warmth and a direct line of support.",
          suggestedReply: "Hi {firstName}, this is Jeff. I want you to know I've seen everything in this conversation and I'm taking personal responsibility for your case. Your account is safe, your money is protected, and I'll be your direct contact from here on out.",
        },
      ],
    },
    // Also match "sorry" + "upset" combo (Sofia-specific)
    {
      keywords: ["sorry"],
      variants: [
        {
          summary: "Lead with presence — let {firstName} know you've been here the whole time and she's safe.",
          suggestedReply: "Hi {firstName}, this is Jeff. I've been with you through this entire conversation. You have absolutely nothing to apologize for — your account is safe. We've got you.",
        },
        {
          summary: "Validate her anger, confirm you saw everything, and make her feel protected.",
          suggestedReply: "{firstName}, I'm Jeff. I've been following every step of this conversation and I want you to know — your anger is completely justified. Your account is secured, those charges are flagged, and I'm personally making sure this gets resolved.",
        },
        {
          summary: "Reassure {firstName} that she's not alone and that everything is already being handled.",
          suggestedReply: "Hi {firstName}, my name is Jeff. I've been right here watching this unfold and I want to be clear: none of this is your fault. Your money is protected, the charges are frozen, and I'm not going anywhere until you feel completely taken care of.",
        },
      ],
    },
  ],
};

const marcus: ScenarioConfig = {
  escalation: {
    id: "escalation-static-marcus",
    customerRecordId: "marcus",
    channel: "chat",
    initials: "MW",
    name: "Marcus Webb",
    customerId: "CST-13317",
    label: "Emily",
    lastUpdated: "6m",
    time: "6m",
    preview: "Order shipped to wrong address - request for Human Agent",
    statusLabel: "Escalated",
    priority: "Critical",
    priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
    badgeColor: "#E32926",
    iconName: "MessageCircle",
  },
  customerReplies: [
    {
      agentKeywords: ["refund", "processed", "reship", "overnight", "intercept", "redirect", "new order", "on its way", "replacement"],
      agentExclude: [],
      customerContextIncludes: [],
      reply: {
        content: "Thank you so much! I really appreciate it.",
        starRating: 5,
        aiAction: {
          label: "Resolve & Close Case",
          description: "Customer gave a 5-star rating. Auto-resolve, dismiss, and unassign this case.",
          actionId: "auto-resolve-dismiss",
        },
      },
    },
  ],
  customerReplyFallback: "Thanks for the update. That helps. What should I do next on my side?",
  suggestionVariants: [],
};

// Extra condition for Marcus: agent message must also include one of these
// (checked at component level for the second AND group)
export const MARCUS_REPLY_CONTEXT_KEYWORDS = [
  "wb-88214", "order", "austin", "sweater", "marcus", "saturday",
];

const terry: ScenarioConfig = {
  escalation: {
    id: "escalation-static-terry",
    customerRecordId: "terry",
    channel: "voice",
    initials: "TW",
    name: "Terry Williams",
    customerId: "CST-14201",
    label: "Aria",
    lastUpdated: "0m",
    time: "0m",
    preview: "Inbound callback — VP of Ops at Nexus Freight evaluating TMS replacement",
    statusLabel: "lead",
    priority: "High",
    priorityClassName: "border-[#F79009] bg-[#FEF0C7] text-[#B54708]",
    badgeColor: "#F79009",
    iconName: "Phone",
  },
  accountNumber: "NF-408-0174",
  transcriptLines: [
    { speaker: "customer", text: "Hello? This is Terry Williams.", elapsed: 1 },
    { speaker: "agent",    text: "Hi Terry, this is Jeff from NovaTech — thanks for reaching out, I saw you were just on our pricing page. Perfect timing. What's driving the search right now?", elapsed: 5 },
    { speaker: "customer", text: "Yeah, we've been on a legacy TMS for about six years. It's falling apart and our warehouse integrations are a nightmare. We're under pressure to have something new in place before Q4.", elapsed: 9 },
    { speaker: "agent",    text: "Got it — Q4 is tight but doable. Has budget been approved yet, or are you still in the evaluation phase?", elapsed: 24 },
    { speaker: "customer", text: "Budget's approved. We set aside around $400K annually for this. I just need to make sure the product can handle the complexity of our routing logic before I bring it to our CTO.", elapsed: 33 },
    { speaker: "agent",    text: "That's great — and honestly, for routing logic at your scale, what I'd recommend is a technical deep-dive with one of our solutions engineers rather than a standard demo. They can get into the specifics of your warehouse setup. Does that sound useful?", elapsed: 43 },
    { speaker: "customer", text: "That's exactly what I'd want, yeah. Can we do that this week?", elapsed: 49 },
    { speaker: "agent",    text: "Absolutely — I'll get that set up. Can I confirm your email so the solutions engineer can send over a prep doc beforehand?", elapsed: 59 },
    { speaker: "customer", text: "Sure, it's t.williams@nexusfreight.com.", elapsed: 65 },
    { speaker: "agent",    text: "Perfect. I'll have someone reach out by end of day to confirm the time. Thanks Terry — this is going to be a great fit.", elapsed: 74 },
    { speaker: "customer", text: "Thanks, looking forward to next steps.", elapsed: 81 },
  ],
  customerReplies: [],
  customerReplyFallback: "Thanks for the update. That helps. What should I do next on my side?",
  suggestionVariants: [],
};

const elena: ScenarioConfig = {
  escalation: {
    id: "escalation-static-elena",
    customerRecordId: "elena",
    channel: "chat",
    initials: "EV",
    name: "Elena Vasquez",
    customerId: "CST-14402",
    label: "Aria",
    lastUpdated: "4m",
    time: "4m",
    preview: "Missing memory card from Luminos Pro 4K camera kit — customer requesting human agent",
    statusLabel: "Escalated",
    priority: "High",
    priorityClassName: "border-[#F59E0B] bg-[#FFF8E1] text-[#B45309]",
    badgeColor: "#F59E0B",
    iconName: "MessageCircle",
  },
  completionTaskIds: ["ship-replacement", "goodwill-credit", "qa-report"],
  recommendedAction: "Ship the overnight replacement to Elena's address, apply a $25 goodwill credit to her account, and file a QA report flagging the packing discrepancy to the warehouse team.",
  opportunity: {
    title: "Opportunity",
    description: "Elena just bought a $1,849 camera kit — her first purchase. Based on her profile and similar customer data, she's a strong match for the Start Strong photography bundle.",
    bundleName: "Start Strong Bundle",
    bundlePrice: "$189",
    bundleDiscount: "20% off",
    bundleItems: [
      "128GB ProSpeed memory card (upgrade)",
      "Vela camera bag with padded compartments",
      "Spare LP-E6NH battery",
    ],
    coachingNote: "Coaching note: Elena's confidence took a hit — lead with resolution satisfaction before suggesting the bundle. Frame it as protecting her investment, not an upsell.",
    internalNoteTemplate: "Start Strong Bundle ($151.20 after loyalty discount) added to Elena's order #EV-44071 — 128GB ProSpeed card, Vela camera bag, spare LP-E6NH battery. Free express shipping applied. — {date}",
    processingLabel: "Adding bundle to order…",
    successLabel: "Bundle added to order — shipping express",
  },
  forcedSuggestion: {
    defaultReply: "Hi Elena — I'm Jeff. Genuinely sorry about this. Your replacement card ships today, arrives tomorrow by noon. I've added a $25 credit to your account.",
    variants: [
      { summary: "Lead with empathy — confirm the fix and the credit upfront.", suggestedReply: "Hi Elena — I'm Jeff. Genuinely sorry about this. Your replacement card ships today, arrives tomorrow by noon. I've added a $25 credit to your account." },
      { summary: "Apologize warmly and confirm both resolution actions in one go.", suggestedReply: "Elena, hi — Jeff here. I owe you an apology. The replacement 64GB card is already on its way and will be with you by noon tomorrow. I've also put a $25 credit on your account for the trouble." },
      { summary: "Keep it brief and action-focused — show it's already handled.", suggestedReply: "Hi Elena, I'm Jeff. I've got good news — your replacement memory card ships today, arriving by noon tomorrow, and there's a $25 credit on your account. Sorry for the mix-up." },
    ],
  },
  customerReplies: [
    // Step 1: Agent sends resolution message (replacement + credit) → customer relieved
    {
      agentKeywords: ["replacement", "ships today", "on its way"],
      customerContextExcludes: ["hassle"],
      reply: "That's great, thank you. I was worried this would be a hassle.",
    },
    // Step 2: Agent sends cross-sell pitch → customer interested
    {
      agentKeywords: ["mirrorless", "new owners", "storage", "spare battery", "bundle", "put together"],
      agentExclude: ["$151", "loyalty discount"],
      customerContextIncludes: ["hassle"],
      reply: "I was actually looking at camera bags last night. How much is the bundle?",
    },
    // Step 3: Agent sends pricing → customer wants to add it
    {
      agentKeywords: ["$151", "loyalty discount", "express shipping", "happy shooting"],
      agentExclude: ["added", "on its way"],
      customerContextExcludes: ["add that to my order"],
      reply: "Sounds great! Please add that to my order!",
    },
    // Step 4: Agent confirms bundle added/shipped → customer delighted (5-star)
    {
      agentKeywords: ["added", "on its way", "enjoy every shot", "happy shooting"],
      customerContextIncludes: ["add that to my order"],
      reply: {
        content: "This turned into a much better experience than I expected. Thank you, Jeff.",
        starRating: 5,
        aiAction: {
          label: "Resolve & Close Case",
          description: "Customer gave a 5-star rating. Auto-resolve, dismiss, and unassign this case.",
          actionId: "auto-resolve-dismiss",
        },
      },
    },
  ],
  customerReplyFallback: "Thank you — I appreciate you looking into this for me.",
  suggestionVariants: [
    // Initial handoff: customer wants the card + human agent
    {
      customerName: "Elena Vasquez",
      keywords: ["not confident", "actual person", "handled properly", "card sent"],
      variants: [
        {
          summary: "Lead with empathy — confirm the fix and the credit upfront.",
          suggestedReply: "Hi {firstName} — I'm Jeff. Genuinely sorry about this. Your replacement card ships today, arrives tomorrow by noon. I've added a $25 credit to your account.",
        },
        {
          summary: "Apologize warmly and confirm both resolution actions in one go.",
          suggestedReply: "{firstName}, hi — Jeff here. I owe you an apology. The replacement 64GB card is already on its way and will be with you by noon tomorrow. I've also put a $25 credit on your account for the trouble.",
        },
        {
          summary: "Keep it brief and action-focused — show it's already handled.",
          suggestedReply: "Hi {firstName}, I'm Jeff. I've got good news — your replacement memory card ships today, arriving by noon tomorrow, and there's a $25 credit on your account. Sorry for the mix-up.",
        },
      ],
    },
    // Step 2: After customer says "that's great" / "hassle"
    {
      customerName: "Elena Vasquez",
      keywords: ["hassle", "that's great", "worried"],
      variants: [
        {
          summary: "Transition naturally to the bundle — ask about her camera experience.",
          suggestedReply: "Is this your first mirrorless camera? A lot of new owners find they need more storage and a spare battery faster than they expect — I'd love to share something we put together.",
        },
        {
          summary: "Bridge from resolution to accessories — frame it as protecting her investment.",
          suggestedReply: "Glad we could sort that out quickly. By the way — since you've got the Luminos Pro, a lot of first-time owners grab extra storage and a spare battery early on. We actually have a bundle that might interest you.",
        },
        {
          summary: "Keep it conversational — mention what other new camera owners typically need.",
          suggestedReply: "Happy to hear that. Quick question — is this your first serious camera? Most new Luminos Pro owners end up wanting a bigger memory card and a backup battery within the first month. We have something that might save you a trip.",
        },
      ],
    },
    // Step 3: After customer asks about bundle / camera bags / price
    {
      customerName: "Elena Vasquez",
      keywords: ["bundle", "how much", "camera bag"],
      variants: [
        {
          summary: "Give the price with the loyalty discount and close warmly.",
          suggestedReply: "$151.20 with your loyalty discount — free express shipping. You're all set. Enjoy every shot.",
        },
        {
          summary: "Present the bundle value and wrap up on a positive note.",
          suggestedReply: "Great timing — the Start Strong bundle is $151.20 after your loyalty discount, and shipping is on us. You're going to love the extra storage. Enjoy the camera!",
        },
        {
          summary: "Confirm the discount, mention free shipping, and close with enthusiasm.",
          suggestedReply: "It's $151.20 with your loyalty discount applied, and we'll ship it express at no charge. That covers the 128GB card, camera bag, and spare battery. Happy shooting, Elena!",
        },
      ],
    },
    // Step 4: After customer says "add that to my order"
    {
      customerName: "Elena Vasquez",
      keywords: ["add that to my order", "sounds great"],
      variants: [
        {
          summary: "Confirm the bundle is added and shipped — close with warmth.",
          suggestedReply: "Done! The Start Strong bundle has been added to your order and is shipping express — no extra charge. Enjoy every shot, Elena!",
        },
        {
          summary: "Confirm order and wrap up on a personal note.",
          suggestedReply: "It's added and on its way! You'll get a tracking email shortly. I'm glad we could turn this around for you, Elena. Happy shooting!",
        },
        {
          summary: "Keep it short — confirm and close warmly.",
          suggestedReply: "All set — the bundle's been added and ships today with free express delivery. Enjoy the new gear, Elena!",
        },
      ],
    },
  ],
};

// ─── Public API ─────────────────────────────────────────────────────────────

export const SCENARIO_CONFIGS: Record<string, ScenarioConfig> = {
  jordan,
  sofia,
  marcus,
  terry,
  elena,
};

/** Convenience: get a scenario config by customerRecordId. */
export function getScenarioConfig(customerRecordId: string): ScenarioConfig | undefined {
  return SCENARIO_CONFIGS[customerRecordId];
}

/**
 * Match a simulated customer reply for a given scenario.
 * Returns the first matching reply, or the scenario fallback, or the global fallback.
 */
export function matchCustomerReply(
  customerRecordId: string,
  agentMessage: string,
  latestCustomerContext: string,
): string | { content: string; starRating?: number; aiAction?: { label: string; description: string; actionId: string } } | null {
  const config = SCENARIO_CONFIGS[customerRecordId];
  if (!config) return null;

  const normalizedAgent = agentMessage.toLowerCase();
  const normalizedContext = latestCustomerContext.toLowerCase();

  for (const match of config.customerReplies) {
    // Check agent keywords (OR — any match)
    const agentHit = match.agentKeywords.length === 0 ||
      match.agentKeywords.some((kw) => normalizedAgent.includes(kw));
    if (!agentHit) continue;

    // Check agent excludes (AND — all must be absent)
    if (match.agentExclude?.some((kw) => normalizedAgent.includes(kw))) continue;

    // Check customer context includes (AND — all must be present)
    if (match.customerContextIncludes?.length &&
      !match.customerContextIncludes.every((kw) => normalizedContext.includes(kw))) continue;

    // Check customer context excludes (AND — all must be absent)
    if (match.customerContextExcludes?.some((kw) => normalizedContext.includes(kw))) continue;

    return match.reply;
  }

  return config.customerReplyFallback;
}

/**
 * Match inline suggestion variants for a scenario.
 * Returns the first matching variant set with {firstName} placeholders resolved.
 */
export function matchSuggestionVariants(
  customerRecordId: string,
  customerName: string,
  customerMessage: string,
): InlineSuggestion[] | null {
  const config = SCENARIO_CONFIGS[customerRecordId];
  if (!config) return null;

  const normalizedMessage = customerMessage.toLowerCase();
  const firstName = customerName.split(" ")[0] ?? customerName;

  for (const match of config.suggestionVariants) {
    if (match.customerName && match.customerName !== customerName) continue;

    // Special case: Sofia "sorry" + "upset" combo
    if (match.keywords.length === 1 && match.keywords[0] === "sorry") {
      if (normalizedMessage.includes("sorry") && normalizedMessage.includes("upset")) {
        return resolveFirstNamePlaceholders(match.variants, firstName);
      }
      continue;
    }

    const hit = match.keywords.some((kw) => normalizedMessage.includes(kw));
    if (!hit) continue;

    return resolveFirstNamePlaceholders(match.variants, firstName);
  }

  return null;
}

function resolveFirstNamePlaceholders(variants: InlineSuggestion[], firstName: string): InlineSuggestion[] {
  return variants.map((v) => ({
    summary: v.summary.replace(/\{firstName\}/g, firstName),
    suggestedReply: v.suggestedReply.replace(/\{firstName\}/g, firstName),
  }));
}
