import type { ConversationMessage, SharedConversationData } from "@/components/ConversationPanel";

export type CustomerChannel = "chat" | "sms" | "whatsapp" | "email" | "voice";
export type CustomerQueueIcon = "phone" | "clipboardList" | "messageSquare";
export type CustomerOverviewTimelineTone = "critical" | "warning" | "info" | "default";

export type CustomerOverviewTimelineItem = {
  id: string;
  title: string;
  timestamp: string;
  detail: string;
  tone: CustomerOverviewTimelineTone;
  sortOrder: number;
};

type SeedConversationChannel = Exclude<CustomerChannel, "voice">;

export type CustomerProfile = {
  department: string;
  tenureYears: number;
  totalAUM: string;
  financialReadiness: number; // 0–100
  financialAdvisor: string;
  advisorTitle: string;
  tags: string[];
};

export type CustomerSeedRecord = {
  id: string;
  initials: string;
  name: string;
  customerId: string;
  lastUpdated: string;
  profile: CustomerProfile;
  conversationTopics: string[];
  overview: {
    contactNumber: string;
    assignedAgent: string;
    pronoun: "she" | "he" | "they";
    lastContactTime: string;
    address: string;
  };
  interactionTimeline: CustomerOverviewTimelineItem[];
  queue: {
    time: string;
    preview: string;
    priority: string;
    priorityClassName: string;
    badgeColor: string;
    icon: CustomerQueueIcon;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  conversations: Record<
    SeedConversationChannel,
    {
      label: string;
      timelineLabel: string;
      draft: string;
      messages: ConversationMessage[];
    }
  >;
};

export const customerDatabase: CustomerSeedRecord[] = [
  {
    id: "alex",
    initials: "AK",
    name: "Alex Kowalski",
    customerId: "CST-10482",
    lastUpdated: "02/23/26 | 04:22 PM",
    profile: {
      department: "Business Banking",
      tenureYears: 5,
      totalAUM: "$1,240,800.00",
      financialReadiness: 78,
      financialAdvisor: "Jordan Doe",
      advisorTitle: "Business Banking Advisor",
      tags: ["Premier", "IVR Auth"],
    },
    conversationTopics: [
      "Dispute a fraudulent Costco charge",
      "Clear the billing zip mismatch flag",
      "Retry Pro upgrade after security clearance",
    ],
    overview: {
      contactNumber: "(415) 555-4092",
      assignedAgent: "Jordan Doe",
      pronoun: "he",
      lastContactTime: "Today, 10:26 AM",
      address: "245 Market St, Apt 8C, San Francisco, CA 94105",
    },
    interactionTimeline: [
      {
        id: "alex-risk-flag",
        title: "Security rule triggered",
        timestamp: "Today · 10:23 AM",
        detail: "Fraud screening flagged a billing zip mismatch against the saved payment profile during the Pro upgrade flow.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "alex-chat-open",
        title: "Customer opened live chat",
        timestamp: "Today · 10:24 AM",
        detail: "Alex reported a blocked Pro upgrade from the pricing page and asked for immediate help before an upcoming meeting.",
        tone: "default",
        sortOrder: 2,
      },
      {
        id: "alex-sms-agent",
        title: "Agent responded on SMS",
        timestamp: "Today · 10:25 AM",
        detail: "Jordan acknowledged the failed payment attempts and started reviewing the account security flags.",
        tone: "info",
        sortOrder: 3,
      },
      {
        id: "alex-retry-failed",
        title: "Upgrade retry blocked",
        timestamp: "Today · 10:26 AM",
        detail: "A follow-up checkout attempt was declined again after billing verification failed on the Pro upgrade request.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "alex-whatsapp-followup",
        title: "Customer requested mobile follow-up",
        timestamp: "Today · 10:27 AM",
        detail: "Alex switched to WhatsApp and asked for a faster path to enable Pro features before a client call.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "alex-email-log",
        title: "Billing logs attached to case",
        timestamp: "Today · 10:28 AM",
        detail: "The failed transaction details were attached to the customer record so support could clear the payment hold.",
        tone: "default",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "Now",
      preview: "Need help resolving a blocked upgrade.",
      priority: "Critical",
      priorityClassName: "border-[#FECACA] bg-[#FEF2F2] text-[#B42318]",
      badgeColor: "bg-[#F04438]",
      icon: "phone",
      isActive: true,
      createdAt: "2026-03-11T08:30:00",
      updatedAt: "2026-03-11T10:24:00",
    },
    conversations: {
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
    },
  },
  {
    id: "sarah",
    initials: "SM",
    name: "Sarah Miller",
    customerId: "CST-10591",
    lastUpdated: "02/24/26 | 09:18 AM",
    profile: {
      department: "Personal Investing",
      tenureYears: 6,
      totalAUM: "$892,150.00",
      financialReadiness: 84,
      financialAdvisor: "Priya Shah",
      advisorTitle: "Wealth Management Advisor",
      tags: ["Premier", "IVR Auth", "Voice Biometrics"],
    },
    conversationTopics: [
      "Review portfolio rebalancing options",
      "Discuss tax-loss harvesting strategy",
      "Schedule quarterly advisor review",
    ],
    overview: {
      contactNumber: "(206) 555-0184",
      assignedAgent: "Priya Shah",
      pronoun: "she",
      lastContactTime: "Today, 9:23 AM",
      address: "881 Pine St, Seattle, WA 98101",
    },
    interactionTimeline: [
      {
        id: "sarah-delay-posted",
        title: "Inbound delay recorded",
        timestamp: "Today · 9:16 AM",
        detail: "Operations posted a late-arriving inbound segment that put Sarah’s Seattle connection at risk.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "sarah-chat-open",
        title: "Customer requested rebooking help",
        timestamp: "Today · 9:18 AM",
        detail: "Sarah opened support after missing her connection and asked for a same-day replacement flight.",
        tone: "default",
        sortOrder: 2,
      },
      {
        id: "sarah-agent-review",
        title: "Agent reviewed standby options",
        timestamp: "Today · 9:19 AM",
        detail: "Priya began checking confirmed-seat and standby inventory for flights that would still arrive before the event.",
        tone: "info",
        sortOrder: 3,
      },
      {
        id: "sarah-bag-transfer",
        title: "Bag transfer constraint added",
        timestamp: "Today · 9:22 AM",
        detail: "The case was updated to prioritize itineraries that could transfer Sarah’s checked bag without manual reclaim.",
        tone: "default",
        sortOrder: 4,
      },
      {
        id: "sarah-waiver-check",
        title: "Fee waiver requested",
        timestamp: "Today · 9:23 AM",
        detail: "Support requested a change-fee waiver because the missed connection followed an airline-caused delay.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "sarah-final-seat-hold",
        title: "Replacement seat held",
        timestamp: "Today · 9:24 AM",
        detail: "A same-day Seattle seat was temporarily held while pricing and bag transfer eligibility were confirmed.",
        tone: "critical",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "2m ago",
      preview: "Missed flight and needs a same-day rebooking.",
      priority: "High",
      priorityClassName: "border-[#F79009] bg-[#FFFAEB] text-[#B54708]",
      badgeColor: "bg-[#F79009]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-03-11T09:02:00",
      updatedAt: "2026-03-11T10:22:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:18 AM",
        draft:
          "I can see the missed segment and the available replacement options. I’m holding the earliest same-day route now while I confirm the fare difference.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Hi, my first flight was delayed and I missed the connection. The kiosk is telling me to call support to get rebooked.",
            time: "9:18 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’m sorry you were caught in that connection delay. I’m checking the available replacement flights now.",
            time: "9:19 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thank you. I need to get to Seattle today because I’m speaking at an event tonight.",
            time: "9:20 AM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:18 AM",
        draft:
          "I found a same-day replacement flight leaving this afternoon. I’m checking whether I can waive the change fee because the missed connection was delay-related.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "My connection was missed after your delay and I still do not have a new seat. Can you help over text?",
            time: "9:18 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Yes — I’ve pulled up your reservation and I’m reviewing the same-day options now.",
            time: "9:19 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "I just need to make sure I arrive before 6 PM, even if I have to connect one more time.",
            time: "9:21 AM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:18 AM",
        draft:
          "I’m seeing two same-day flights with open seats. I’ll confirm which one gets you in earliest and message you the boarding details here.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Hello, I’m at the gate and the agents are overwhelmed. Can you help me switch to the next available flight?",
            time: "9:18 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Absolutely. I’m checking the real-time standby and confirmed-seat options for you now.",
            time: "9:19 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Please prioritize the option with checked bag transfer if possible.",
            time: "9:22 AM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:18 AM",
        draft:
          "Hi Sarah — I found two same-day rebooking options and I’m verifying whether the change can be processed without additional cost because the missed segment followed an airline delay.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Missed connection due to delay\n\nHi support, my incoming flight landed late and I missed the Seattle connection. The app still shows my original itinerary and I need a replacement today.",
            time: "9:18 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Sarah, thanks for the details. I’m reviewing the disrupted itinerary and the replacement inventory now.",
            time: "9:19 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks. Please let me know if there is anything I need to approve quickly from my side.",
            time: "9:23 AM",
          },
        ],
      },
    },
  },
  {
    id: "emily",
    initials: "EC",
    name: "Emily Chen",
    customerId: "CST-10814",
    lastUpdated: "02/25/26 | 11:47 AM",
    profile: {
      department: "Retail Banking",
      tenureYears: 3,
      totalAUM: "$345,600.00",
      financialReadiness: 71,
      financialAdvisor: "Marcus Lee",
      advisorTitle: "Retail Banking Advisor",
      tags: ["IVR Auth"],
    },
    conversationTopics: [
      "Resolve ATM deposit discrepancy",
      "Request fee waiver for overdraft",
      "Update contact information on file",
    ],
    overview: {
      contactNumber: "(646) 555-0117",
      assignedAgent: "Marcus Lee",
      pronoun: "she",
      lastContactTime: "Today, 11:51 AM",
      address: "117 Orchard St, New York, NY 10002",
    },
    interactionTimeline: [
      {
        id: "emily-campaign-live",
        title: "Launch-week campaign activated",
        timestamp: "Today · 11:45 AM",
        detail: "The promotion banner went live for Emily’s segment with item-level eligibility rules applied at checkout.",
        tone: "info",
        sortOrder: 1,
      },
      {
        id: "emily-customer-report",
        title: "Customer reported invalid promo code",
        timestamp: "Today · 11:47 AM",
        detail: "Emily reported that the advertised discount code was failing even though her cart matched the campaign email.",
        tone: "default",
        sortOrder: 2,
      },
      {
        id: "emily-agent-audit",
        title: "Agent audited promotion rules",
        timestamp: "Today · 11:48 AM",
        detail: "Marcus started reviewing the banner campaign, cart restrictions, and checkout validation logs.",
        tone: "info",
        sortOrder: 3,
      },
      {
        id: "emily-validation-failure",
        title: "Checkout validation mismatch found",
        timestamp: "Today · 11:49 AM",
        detail: "One item in the cart was incorrectly excluded by a promotion rule, causing the entire discount to fail.",
        tone: "warning",
        sortOrder: 4,
      },
      {
        id: "emily-cart-preserved",
        title: "Cart preservation requested",
        timestamp: "Today · 11:50 AM",
        detail: "The customer record was updated to keep Emily’s configured cart intact while the promotion issue was corrected.",
        tone: "default",
        sortOrder: 5,
      },
      {
        id: "emily-code-reissue",
        title: "Corrected promo path prepared",
        timestamp: "Today · 11:51 AM",
        detail: "Support prepared a corrected validation path so Emily could retry checkout without rebuilding the order.",
        tone: "critical",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "5m ago",
      preview: "Discount code is failing during checkout.",
      priority: "Medium",
      priorityClassName: "border-[#B8D7F0] bg-[#EEF6FC] text-[#006DAD]",
      badgeColor: "bg-[#006DAD]",
      icon: "clipboardList",
      isActive: false,
      createdAt: "2026-03-11T08:55:00",
      updatedAt: "2026-03-11T10:19:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 11:47 AM",
        draft:
          "I found the promotion rule that is blocking your discount code. I’m testing a corrected checkout session now so you can try it again immediately.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Hi, the launch-week discount code keeps failing at checkout even though the banner says it is still valid.",
            time: "11:47 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Thanks for reporting that. I’m reviewing the promotion setup and the checkout logs now.",
            time: "11:48 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "It says the code does not apply to my cart, but I only have the items listed in the campaign email.",
            time: "11:49 AM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 11:47 AM",
        draft:
          "I can see the promo validation failing on one item in your cart. I’m removing the bad restriction so you can retry the code in a moment.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Can someone help? My discount code keeps getting rejected and checkout is about to expire.",
            time: "11:47 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Yes — I’m checking the promotion rules now so we can get your order through.",
            time: "11:48 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "I tried it on desktop and mobile and got the same invalid-code message both times.",
            time: "11:49 AM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 11:47 AM",
        draft:
          "Thanks for sending the cart screenshot. I can see the promo rule mismatch and I’m correcting it now so you can retry without rebuilding the cart.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I sent a screenshot — the code is shown in the banner but the cart keeps rejecting it.",
            time: "11:47 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Got it. I’m comparing the banner campaign and the checkout restrictions now.",
            time: "11:48 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Please keep this cart intact if possible. It took me a while to configure everything.",
            time: "11:50 AM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 11:47 AM",
        draft:
          "Hi Emily — I found the promotion mismatch causing the code to fail. I’m updating the rule set and will let you know as soon as it is safe to retry checkout.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Discount code not applying\n\nHello, I received a promo email this morning, but the code listed there is not applying during checkout for the advertised items.",
            time: "11:47 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Emily, thanks for sending the details. I’m reviewing the campaign configuration and item eligibility now.",
            time: "11:48 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thank you. Please let me know if there is a corrected code I should use instead.",
            time: "11:51 AM",
          },
        ],
      },
    },
  },
  {
    id: "david",
    initials: "DB",
    name: "David Brown",
    customerId: "CST-10363",
    lastUpdated: "02/26/26 | 03:06 PM",
    profile: {
      department: "Business Banking",
      tenureYears: 11,
      totalAUM: "$3,187,900.00",
      financialReadiness: 88,
      financialAdvisor: "Alex Bogush",
      advisorTitle: "High Net Worth Advisor",
      tags: ["Premier", "IVR Auth", "Voice Biometrics"],
    },
    conversationTopics: [
      "Review commercial line of credit terms",
      "Discuss business expansion financing",
      "Escalate to a senior relationship manager",
    ],
    overview: {
      contactNumber: "(312) 555-0146",
      assignedAgent: "Alex Bogush",
      pronoun: "he",
      lastContactTime: "Today, 3:10 PM",
      address: "410 W Lake St, Chicago, IL 60606",
    },
    interactionTimeline: [
      {
        id: "david-plan-change",
        title: "Plan change initiated",
        timestamp: "Today · 3:05 PM",
        detail: "David started a subscription update that created two closely timed authorization attempts on the same card.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "david-duplicate-hold",
        title: "Duplicate authorization detected",
        timestamp: "Today · 3:06 PM",
        detail: "Billing systems flagged a second pending hold while the first authorization was still unresolved.",
        tone: "warning",
        sortOrder: 2,
      },
      {
        id: "david-agent-audit",
        title: "Agent reviewed payment audit trail",
        timestamp: "Today · 3:07 PM",
        detail: "Alex began checking the subscription ledger and card authorization history to confirm whether a duplicate capture occurred.",
        tone: "info",
        sortOrder: 3,
      },
      {
        id: "david-customer-risk",
        title: "Customer paused retry",
        timestamp: "Today · 3:08 PM",
        detail: "David held off on another submission because he needed the new plan active without creating a second billable charge.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "david-reversal-request",
        title: "Reversal request submitted",
        timestamp: "Today · 3:09 PM",
        detail: "Support initiated reversal handling for the extra authorization hold before advising the customer to retry.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "david-screenshot-offer",
        title: "Customer offered banking proof",
        timestamp: "Today · 3:10 PM",
        detail: "David offered to send a screenshot from his banking app to help confirm the duplicate pending charge.",
        tone: "default",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "24m ago",
      preview: "Subscription change and duplicate-charge concern.",
      priority: "Low",
      priorityClassName: "border-[#B7E6DD] bg-[#EAF8F4] text-[#369D3F]",
      badgeColor: "bg-[#369D3F]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-03-11T07:40:00",
      updatedAt: "2026-03-11T10:00:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 3:06 PM",
        draft:
          "I found the duplicate authorization and I’m clearing it now. Once it drops, I’ll help you retry the subscription change without risking a second charge.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I’m trying to switch plans, but I think the system tried to charge me twice and now I’m afraid to submit again.",
            time: "3:06 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I understand the concern. I’m reviewing the payment authorizations and the subscription audit trail now.",
            time: "3:07 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks. I do need the new plan active today, but I do not want two charges pending on the card.",
            time: "3:08 PM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 3:06 PM",
        draft:
          "I can confirm one of the attempts is still only an authorization hold. I’m clearing the duplicate and then I’ll tell you the safest time to retry.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Can you verify whether I got charged twice? I was trying to switch my subscription and the second attempt looked stuck.",
            time: "3:06 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Yes — I’m checking the payment statuses and the subscription update attempts now.",
            time: "3:07 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Okay, thank you. I can retry once you confirm the extra hold is gone.",
            time: "3:08 PM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 3:06 PM",
        draft:
          "I’ve isolated the duplicate authorization and I’m escalating the reversal. I’ll stay with you here and let you know when it is safe to complete the plan change.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Hi, I changed plans from my phone and now I’m seeing two pending charges in my banking app.",
            time: "3:06 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Thanks for the heads-up. I’m reviewing both payment attempts and the subscription events now.",
            time: "3:07 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Please let me know whether I should retry here or wait until the extra pending charge disappears.",
            time: "3:09 PM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 3:06 PM",
        draft:
          "Hi David — I confirmed that one of the two charges is still a temporary authorization rather than a completed capture. I’m clearing the duplicate attempt and will reply once it is safe to retry the subscription change.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Possible duplicate charge after plan change\n\nHello, I was updating my subscription and now I’m seeing two pending card charges. I need the new plan active today but I don’t want to be billed twice.",
            time: "3:06 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi David, thanks for reporting it. I’m reviewing the payment captures and authorization holds tied to your account now.",
            time: "3:07 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks. If you need a screenshot from my banking app, I can send that over.",
            time: "3:10 PM",
          },
        ],
      },
    },
  },
  {
    id: "priya",
    initials: "PN",
    name: "Priya Nair",
    customerId: "CST-11024",
    lastUpdated: "02/27/26 | 08:41 AM",
    profile: {
      department: "Personal Investing",
      tenureYears: 4,
      totalAUM: "$628,400.00",
      financialReadiness: 91,
      financialAdvisor: "Jordan Doe",
      advisorTitle: "Wealth Management Advisor",
      tags: ["Premier", "Voice Biometrics"],
    },
    conversationTopics: [
      "Discuss Roth IRA conversion strategy",
      "Review beneficiary designations",
      "Schedule annual financial plan review",
    ],
    overview: {
      contactNumber: "(512) 555-0172",
      assignedAgent: "Jordan Doe",
      pronoun: "she",
      lastContactTime: "Today, 8:44 AM",
      address: "1812 Nueces St, Austin, TX 78701",
    },
    interactionTimeline: [
      {
        id: "priya-lockout-detected",
        title: "Repeated login failures detected",
        timestamp: "Today · 8:39 AM",
        detail: "Security systems detected repeated failed login attempts before Priya’s account was temporarily locked.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "priya-customer-chat",
        title: "Customer requested access recovery",
        timestamp: "Today · 8:40 AM",
        detail: "Priya opened a support thread because she could not access her dashboard ahead of the morning reporting cutoff.",
        tone: "default",
        sortOrder: 2,
      },
      {
        id: "priya-identity-check",
        title: "Identity verification started",
        timestamp: "Today · 8:41 AM",
        detail: "Jordan started identity verification and reviewed recent device history before clearing the lockout.",
        tone: "info",
        sortOrder: 3,
      },
      {
        id: "priya-device-risk",
        title: "New-device sign-in flagged",
        timestamp: "Today · 8:42 AM",
        detail: "The login attempt was tied to a new laptop, which triggered a manual review requirement before access could be restored.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "priya-reset-link",
        title: "Password reset link prepared",
        timestamp: "Today · 8:43 AM",
        detail: "Support prepared a fresh password reset path with extended validity so Priya could complete recovery without starting over.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "priya-session-restore",
        title: "Session restoration pending",
        timestamp: "Today · 8:44 AM",
        detail: "The case was updated to restore dashboard access as soon as Priya completed the verification prompt.",
        tone: "default",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "1m ago",
      preview: "Locked out after failed sign-in attempts.",
      priority: "Critical",
      priorityClassName: "border-[#FECACA] bg-[#FEF2F2] text-[#B42318]",
      badgeColor: "bg-[#F04438]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-03-11T08:15:00",
      updatedAt: "2026-03-11T08:44:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 8:40 AM",
        draft:
          "I can see the temporary account lock on your profile. I’m validating the sign-in attempt now so I can safely restore access.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Hi, I’m locked out of my account and I need to pull this morning’s report before my team meeting starts.",
            time: "8:40 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’m reviewing the security lock now and I’ll walk you through the fastest path to regain access.",
            time: "8:41 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thank you. I tried resetting it twice, but I still get kicked back to the lock screen.",
            time: "8:42 AM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 8:40 AM",
        draft:
          "I found the lockout trigger and I’m clearing it after one quick identity check. I’ll text the reset instructions as soon as it’s ready.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Can you help me unlock my account? I keep getting blocked after I enter my password.",
            time: "8:40 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Yes — I’m looking at the sign-in history now and I’ll confirm the safest next step.",
            time: "8:41 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "I’m on a new laptop today, so that may be why it suddenly flagged me.",
            time: "8:43 AM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 8:40 AM",
        draft:
          "Thanks for confirming the new device. I’m clearing the review hold now so you can finish the reset from that laptop.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Hey, I’m fully locked out and support in the portal won’t load because I can’t get past sign-in.",
            time: "8:40 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’ve got your account open. I’m checking whether the lock was triggered by a password issue or a device flag.",
            time: "8:41 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Please keep this moving fast if possible — the dashboard is how I brief leadership every morning.",
            time: "8:44 AM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 8:40 AM",
        draft:
          "Hi Priya — I confirmed that the temporary lock was triggered by a new-device check rather than a permanent credential problem. I’m preparing a fresh recovery link now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Urgent account lockout\n\nHello, I’m unable to access my account this morning and need help restoring access as soon as possible.",
            time: "8:40 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Priya, thanks for contacting us. I’m checking the sign-in security events attached to your profile now.",
            time: "8:41 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks. If you need me to verify the new device or location, I can do that immediately.",
            time: "8:44 AM",
          },
        ],
      },
    },
  },
  {
    id: "miguel",
    initials: "MS",
    name: "Miguel Santos",
    customerId: "CST-11137",
    lastUpdated: "02/27/26 | 12:12 PM",
    profile: {
      department: "Retail Banking",
      tenureYears: 2,
      totalAUM: "$187,300.00",
      financialReadiness: 63,
      financialAdvisor: "Marcus Lee",
      advisorTitle: "Retail Banking Advisor",
      tags: ["IVR Auth"],
    },
    conversationTopics: [
      "Dispute a fraudulent Costco charge",
      "Escalate to a supervisor",
      "Document the information around it",
    ],
    overview: {
      contactNumber: "(305) 555-0143",
      assignedAgent: "Marcus Lee",
      pronoun: "he",
      lastContactTime: "Today, 12:14 PM",
      address: "922 Biscayne Blvd, Miami, FL 33132",
    },
    interactionTimeline: [
      {
        id: "miguel-refund-opened",
        title: "Refund case opened",
        timestamp: "Today · 12:09 PM",
        detail: "Miguel opened a billing case after seeing a completed charge for an order that was canceled minutes later.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "miguel-ledger-check",
        title: "Payment ledger review started",
        timestamp: "Today · 12:10 PM",
        detail: "Marcus began tracing the order cancellation event against the refund queue and settlement timeline.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "miguel-bank-delay",
        title: "Settlement delay identified",
        timestamp: "Today · 12:11 PM",
        detail: "The refund could not post immediately because the original charge had already moved into settlement.",
        tone: "warning",
        sortOrder: 3,
      },
      {
        id: "miguel-escalation",
        title: "Finance escalation submitted",
        timestamp: "Today · 12:12 PM",
        detail: "Support escalated the refund request to finance so the reversal could be prioritized before end-of-day batch processing.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "miguel-receipt-note",
        title: "Receipt evidence attached",
        timestamp: "Today · 12:13 PM",
        detail: "The customer attached the cancellation receipt and the posted card charge to help confirm the discrepancy.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "miguel-followup-window",
        title: "Refund window communicated",
        timestamp: "Today · 12:14 PM",
        detail: "The case was updated with an expected refund window and a promise of proactive follow-up once the reversal was accepted.",
        tone: "default",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "3m ago",
      preview: "Canceled order still posted a completed charge.",
      priority: "High",
      priorityClassName: "border-[#F79009] bg-[#FFFAEB] text-[#B54708]",
      badgeColor: "bg-[#006DAD]",
      icon: "clipboardList",
      isActive: false,
      createdAt: "2026-03-11T11:55:00",
      updatedAt: "2026-03-11T12:14:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 12:10 PM",
        draft:
          "I confirmed the cancellation on your order and I’m escalating the posted charge now so the refund can move faster.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Hi, I canceled the order almost immediately, but the charge still went through on my card.",
            time: "12:10 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’m reviewing the order and payment timeline now so I can confirm whether the refund has already been queued.",
            time: "12:11 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "I need help quickly because it was a large charge and I cannot leave it hanging for several days.",
            time: "12:12 PM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 12:10 PM",
        draft:
          "I can see the cancellation and the posted payment. I’m pushing the refund request to finance so you do not have to wait on the normal queue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "The order was canceled, but my bank still shows the full charge. Can someone fix this?",
            time: "12:10 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Yes — I’m checking whether it is still pending or whether it has already settled.",
            time: "12:11 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "It looks completed on my side, not just pending.",
            time: "12:13 PM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 12:10 PM",
        draft:
          "Thanks for sending the receipt. I matched it to the canceled order and I’m moving the refund through manual review now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I sent screenshots from my bank app and the canceled order email. Please tell me what else you need.",
            time: "12:10 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "That helps a lot. I’m cross-checking both records against the refund queue right now.",
            time: "12:11 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "If there’s a way to speed it up, I’d really appreciate it.",
            time: "12:14 PM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 12:10 PM",
        draft:
          "Hi Miguel — I verified that the order was canceled, but the charge had already entered settlement. I’ve escalated the refund so it can be reversed as quickly as possible.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Charge posted after cancellation\n\nHello, I canceled my order, but the payment still completed on my credit card. Please advise on next steps.",
            time: "12:10 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Miguel, I’m reviewing the payment settlement status and the cancellation record now.",
            time: "12:11 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thank you. Please let me know if you need the cancellation confirmation forwarded again.",
            time: "12:14 PM",
          },
        ],
      },
    },
  },
  {
    id: "olivia",
    initials: "OR",
    name: "Olivia Reed",
    customerId: "CST-11192",
    lastUpdated: "02/27/26 | 01:26 PM",
    profile: {
      department: "Personal Investing",
      tenureYears: 7,
      totalAUM: "$1,956,700.00",
      financialReadiness: 95,
      financialAdvisor: "Priya Shah",
      advisorTitle: "Wealth Management Advisor",
      tags: ["Premier", "IVR Auth", "Voice Biometrics"],
    },
    conversationTopics: [
      "Review estate planning options",
      "Transfer assets to trust account",
      "Confirm power of attorney documentation",
    ],
    overview: {
      contactNumber: "(617) 555-0198",
      assignedAgent: "Priya Shah",
      pronoun: "she",
      lastContactTime: "Today, 1:28 PM",
      address: "41 Charles St, Boston, MA 02114",
    },
    interactionTimeline: [
      {
        id: "olivia-shipping-alert",
        title: "Shipment exception posted",
        timestamp: "Today · 1:23 PM",
        detail: "Carrier tracking showed a delivery exception after Olivia’s package reached the local hub.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "olivia-address-check",
        title: "Address verification started",
        timestamp: "Today · 1:24 PM",
        detail: "Support reviewed the final delivery address after the carrier marked the package as undeliverable.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "olivia-customer-request",
        title: "Customer requested reroute",
        timestamp: "Today · 1:25 PM",
        detail: "Olivia asked for the package to be rerouted before an event later this week.",
        tone: "default",
        sortOrder: 3,
      },
      {
        id: "olivia-carrier-hold",
        title: "Carrier hold placed",
        timestamp: "Today · 1:26 PM",
        detail: "A temporary hold was placed with the carrier to avoid the package being returned to sender.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "olivia-alt-destination",
        title: "Alternate destination reviewed",
        timestamp: "Today · 1:27 PM",
        detail: "Support reviewed nearby pickup and workplace delivery options to speed up final handoff.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "olivia-followup-scheduled",
        title: "Carrier follow-up scheduled",
        timestamp: "Today · 1:28 PM",
        detail: "The case was updated with a follow-up window once the carrier confirmed whether rerouting would be accepted.",
        tone: "default",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "7m ago",
      preview: "Delivery exception needs an address reroute.",
      priority: "Medium",
      priorityClassName: "border-[#B8D7F0] bg-[#EEF6FC] text-[#006DAD]",
      badgeColor: "bg-[#F79009]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-03-11T13:05:00",
      updatedAt: "2026-03-11T13:28:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 1:24 PM",
        draft:
          "I can see the carrier exception on the shipment. I’m placing a hold now so we can reroute it before it gets returned.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "My package says delivery exception and I need it before Friday. Can someone reroute it?",
            time: "1:24 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’m pulling up the carrier event history now and I’ll check what reroute options are available.",
            time: "1:25 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Please stop it from being sent back. I can even pick it up if that’s faster.",
            time: "1:26 PM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 1:24 PM",
        draft:
          "I’ve put a hold on the return path and I’m checking whether the package can be rerouted or held for pickup.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Tracking says my package couldn’t be delivered. Can you help me redirect it?",
            time: "1:24 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Yes — I’m contacting the carrier tools now to see whether we can intercept it.",
            time: "1:25 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "A pickup hold would work if home delivery isn’t possible anymore.",
            time: "1:27 PM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 1:24 PM",
        draft:
          "Thanks for confirming the alternate address. I’m validating that reroute request with the carrier now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I can send a different delivery address if that helps. The current one may be what caused the problem.",
            time: "1:24 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "That may help. I’m checking whether the carrier still allows edits after the local hub scan.",
            time: "1:25 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks — I just really need to keep it from getting bounced back.",
            time: "1:28 PM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 1:24 PM",
        draft:
          "Hi Olivia — I confirmed the shipment exception and placed a carrier hold to keep the package from being returned. I’m now checking reroute and pickup options for you.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Delivery exception on package\n\nHello, my shipment is showing a delivery exception and I need help rerouting it before it gets sent back.",
            time: "1:24 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Olivia, I’m reviewing the carrier details and the address validation results now.",
            time: "1:25 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thank you. Please let me know whether pickup would be the faster option.",
            time: "1:28 PM",
          },
        ],
      },
    },
  },
  {
    id: "jamal",
    initials: "JC",
    name: "Jamal Carter",
    customerId: "CST-11244",
    lastUpdated: "02/27/26 | 02:03 PM",
    profile: {
      department: "Business Banking",
      tenureYears: 9,
      totalAUM: "$2,741,500.00",
      financialReadiness: 82,
      financialAdvisor: "Alex Bogush",
      advisorTitle: "High Net Worth Advisor",
      tags: ["Premier", "Voice Biometrics"],
    },
    conversationTopics: [
      "Resolve wire transfer delay",
      "Set up international payment alerts",
      "Review business credit card limits",
    ],
    overview: {
      contactNumber: "(404) 555-0121",
      assignedAgent: "Alex Bogush",
      pronoun: "he",
      lastContactTime: "Today, 2:05 PM",
      address: "290 Peachtree St NW, Atlanta, GA 30303",
    },
    interactionTimeline: [
      {
        id: "jamal-device-sync",
        title: "Device sync failure logged",
        timestamp: "Today · 2:00 PM",
        detail: "A mobile sync failure prevented Jamal’s latest project changes from appearing on desktop.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "jamal-customer-reachout",
        title: "Customer reported missing updates",
        timestamp: "Today · 2:01 PM",
        detail: "Jamal opened support because edits made on mobile were not visible in the shared workspace.",
        tone: "default",
        sortOrder: 2,
      },
      {
        id: "jamal-conflict-check",
        title: "Conflict review started",
        timestamp: "Today · 2:02 PM",
        detail: "Support started comparing device versions and offline conflict markers across Jamal’s account.",
        tone: "info",
        sortOrder: 3,
      },
      {
        id: "jamal-publish-block",
        title: "Pending publish blocked sync",
        timestamp: "Today · 2:03 PM",
        detail: "A stale publish job was blocking the newest workspace state from syncing to other devices.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "jamal-restore-path",
        title: "Recovery path prepared",
        timestamp: "Today · 2:04 PM",
        detail: "Support prepared a recovery path that would preserve Jamal’s unsynced changes while clearing the blocked publish job.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "jamal-sync-validation",
        title: "Cross-device validation pending",
        timestamp: "Today · 2:05 PM",
        detail: "The case was updated to verify that the desktop workspace refreshed correctly once the queue blockage was removed.",
        tone: "default",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "9m ago",
      preview: "Changes saved on mobile are missing on desktop.",
      priority: "High",
      priorityClassName: "border-[#F79009] bg-[#FFFAEB] text-[#B54708]",
      badgeColor: "bg-[#369D3F]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-03-11T13:40:00",
      updatedAt: "2026-03-11T14:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 2:01 PM",
        draft:
          "I found the blocked sync job on your account. I’m preserving your recent edits now and then I’ll force the devices back into sync.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I made edits from my phone this morning, but they’re not showing up on desktop and I’m worried they disappeared.",
            time: "2:01 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’m checking the sync queue and the version history now so we can confirm those edits are still intact.",
            time: "2:02 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Please don’t overwrite anything — some of those updates were for a client review this afternoon.",
            time: "2:03 PM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 2:01 PM",
        draft:
          "I can see the stuck sync job and I’m protecting your latest version before I clear it.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "My mobile updates aren’t appearing on desktop. Can someone check whether sync is broken?",
            time: "2:01 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Yes — I’m tracing the device sync history now.",
            time: "2:02 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "I just need to know the edits are safe before I refresh anything.",
            time: "2:04 PM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 2:01 PM",
        draft:
          "Thanks for sending the screenshots of both devices. I can see the version mismatch and I’m correcting it now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I’ve sent screenshots from phone and desktop — the mobile version has changes that the desktop one does not.",
            time: "2:01 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’m comparing those versions now and I’ll make sure the newest edits win before anything refreshes.",
            time: "2:02 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Perfect. I mostly need confidence that my client notes aren’t gone.",
            time: "2:05 PM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 2:01 PM",
        draft:
          "Hi Jamal — I located the stalled sync job that is preventing your latest mobile edits from appearing on desktop. I’m preserving those updates before restarting the sync process.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Mobile changes not appearing on desktop\n\nHello, edits I made on my phone today are not showing up on the desktop app. Please help me avoid losing them.",
            time: "2:01 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Jamal, I’m reviewing the sync queue and version history tied to your workspace now.",
            time: "2:02 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks. Please let me know whether I should avoid making any new edits until you confirm it’s stable.",
            time: "2:05 PM",
          },
        ],
      },
    },
  },
  {
    id: "hannah",
    initials: "HB",
    name: "Hannah Brooks",
    customerId: "CST-11307",
    lastUpdated: "02/27/26 | 02:47 PM",
    profile: {
      department: "Retail Banking",
      tenureYears: 5,
      totalAUM: "$512,200.00",
      financialReadiness: 76,
      financialAdvisor: "Jordan Doe",
      advisorTitle: "Retail Banking Advisor",
      tags: ["IVR Auth"],
    },
    conversationTopics: [
      "Dispute incorrect mortgage payment posting",
      "Request escrow account analysis",
      "Update insurance information on loan",
    ],
    overview: {
      contactNumber: "(720) 555-0115",
      assignedAgent: "Jordan Doe",
      pronoun: "she",
      lastContactTime: "Today, 2:49 PM",
      address: "1980 Wazee St, Denver, CO 80202",
    },
    interactionTimeline: [
      {
        id: "hannah-billing-cycle",
        title: "Invoice cycle generated",
        timestamp: "Today · 2:44 PM",
        detail: "Hannah’s renewal invoice generated with a line item that did not match the quoted annual rate.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "hannah-customer-dispute",
        title: "Customer disputed renewal total",
        timestamp: "Today · 2:45 PM",
        detail: "Hannah contacted support because the renewal total was higher than the approved quote on file.",
        tone: "default",
        sortOrder: 2,
      },
      {
        id: "hannah-contract-review",
        title: "Contract review started",
        timestamp: "Today · 2:46 PM",
        detail: "Support began reviewing the signed renewal quote against the invoiced line items and seat counts.",
        tone: "info",
        sortOrder: 3,
      },
      {
        id: "hannah-seat-audit",
        title: "Seat overage mismatch found",
        timestamp: "Today · 2:47 PM",
        detail: "A stale seat overage setting incorrectly carried into the renewal invoice and inflated the billed amount.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "hannah-credit-hold",
        title: "Payment hold prevented",
        timestamp: "Today · 2:48 PM",
        detail: "The invoice was prevented from auto-charging while the billing discrepancy was under review.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "hannah-corrected-total",
        title: "Corrected invoice path prepared",
        timestamp: "Today · 2:49 PM",
        detail: "Support prepared a corrected invoice total that aligned with the quoted annual renewal amount.",
        tone: "default",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "11m ago",
      preview: "Renewal invoice total doesn’t match the quoted rate.",
      priority: "Critical",
      priorityClassName: "border-[#FECACA] bg-[#FEF2F2] text-[#B42318]",
      badgeColor: "bg-[#F04438]",
      icon: "clipboardList",
      isActive: false,
      createdAt: "2026-03-11T14:25:00",
      updatedAt: "2026-03-11T14:49:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 2:45 PM",
        draft:
          "I found the invoice mismatch and I’ve stopped the payment from auto-processing while I correct the renewal total.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Our renewal invoice looks higher than the quote we approved. Can someone review this before it charges?",
            time: "2:45 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’m comparing the invoice lines to your signed renewal quote now.",
            time: "2:46 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Please pause anything automatic until we know where the extra amount came from.",
            time: "2:47 PM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 2:45 PM",
        draft:
          "I’ve frozen the invoice while I validate the seat count and quote terms. I’ll confirm the corrected total shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "The renewal total is wrong and I need to stop it before finance processes it.",
            time: "2:45 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Understood — I’m reviewing the quote and invoice setup right now.",
            time: "2:46 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "It looks like extra seats were added, but we never approved that.",
            time: "2:48 PM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 2:45 PM",
        draft:
          "Thanks for sending the quote screenshot. I confirmed the invoice pulled the wrong seat count and I’m correcting it now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I just sent the quote and invoice screenshots. The totals definitely don’t match.",
            time: "2:45 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I can already see the discrepancy. I’m verifying which line item created the overage.",
            time: "2:46 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Great, thank you. We just need the corrected amount before procurement signs off.",
            time: "2:49 PM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 2:45 PM",
        draft:
          "Hi Hannah — I confirmed that the renewal invoice pulled an incorrect seat overage setting. I’ve stopped the payment workflow and I’m issuing a corrected total now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Renewal invoice mismatch\n\nHello, the annual renewal invoice we received today does not match our approved quote. Please review before payment is collected.",
            time: "2:45 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Hannah, I’m reviewing the invoice lines and contract details attached to your renewal now.",
            time: "2:46 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks. Please confirm once the corrected invoice is ready so I can forward it internally.",
            time: "2:49 PM",
          },
        ],
      },
    },
  },
  {
    id: "noah",
    initials: "NP",
    name: "Noah Patel",
    customerId: "CST-11368",
    lastUpdated: "02/27/26 | 04:11 PM",
    profile: {
      department: "Personal Investing",
      tenureYears: 12,
      totalAUM: "$5,830,100.00",
      financialReadiness: 97,
      financialAdvisor: "Marcus Lee",
      advisorTitle: "Private Wealth Advisor",
      tags: ["Premier", "IVR Auth", "Voice Biometrics"],
    },
    conversationTopics: [
      "Review private equity fund allocation",
      "Discuss charitable giving strategy",
      "Coordinate with tax advisor on year-end planning",
    ],
    overview: {
      contactNumber: "(213) 555-0179",
      assignedAgent: "Marcus Lee",
      pronoun: "he",
      lastContactTime: "Today, 4:13 PM",
      address: "775 S Grand Ave, Los Angeles, CA 90017",
    },
    interactionTimeline: [
      {
        id: "noah-export-job",
        title: "Export job failed",
        timestamp: "Today · 4:08 PM",
        detail: "Noah’s scheduled analytics export failed after timing out on a large report bundle.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "noah-customer-outreach",
        title: "Customer requested urgent file delivery",
        timestamp: "Today · 4:09 PM",
        detail: "Noah contacted support because he needed the report export for an external stakeholder meeting the same day.",
        tone: "default",
        sortOrder: 2,
      },
      {
        id: "noah-queue-review",
        title: "Background queue reviewed",
        timestamp: "Today · 4:10 PM",
        detail: "Support reviewed the export queue and identified a timeout on one oversized report segment.",
        tone: "info",
        sortOrder: 3,
      },
      {
        id: "noah-manual-rerun",
        title: "Manual rerun queued",
        timestamp: "Today · 4:11 PM",
        detail: "A manual rerun was queued with a narrower data range so the export could complete before the meeting deadline.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "noah-download-link",
        title: "Secure download path prepared",
        timestamp: "Today · 4:12 PM",
        detail: "Support prepared a secure download link to deliver the rerun export as soon as the file generated.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "noah-followup-note",
        title: "Meeting deadline noted",
        timestamp: "Today · 4:13 PM",
        detail: "The case was tagged with Noah’s meeting deadline to keep the rerun at the top of the queue.",
        tone: "default",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "14m ago",
      preview: "Analytics export failed before a stakeholder meeting.",
      priority: "High",
      priorityClassName: "border-[#F79009] bg-[#FFFAEB] text-[#B54708]",
      badgeColor: "bg-[#006DAD]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-03-11T15:45:00",
      updatedAt: "2026-03-11T16:13:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 4:09 PM",
        draft:
          "I found the export timeout and I’ve started a manual rerun with a safer range so we can get you the file before your meeting.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "My analytics export failed and I need the file before I present to stakeholders later today.",
            time: "4:09 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’m checking the export queue now and I’ll see whether I can rerun it faster for you.",
            time: "4:10 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Please do — the meeting is soon and I can’t walk in without those numbers.",
            time: "4:11 PM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 4:09 PM",
        draft:
          "I can see the timed-out export job and I’m rerunning it now. I’ll text you the secure download link as soon as it finishes.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Can you help with a failed export? I need the report today.",
            time: "4:09 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Yes — I’m checking the export log and queue status now.",
            time: "4:10 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "If it helps, I only need the current quarter, not the full year.",
            time: "4:12 PM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 4:09 PM",
        draft:
          "Thanks for clarifying the timeframe. I’m rerunning the export with that smaller range to get it back faster.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I can narrow the report if needed. I mainly need the quarter-over-quarter numbers right away.",
            time: "4:09 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "That helps. I’m adjusting the rerun parameters now to reduce the file size and finish sooner.",
            time: "4:10 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Perfect. Send the link here if that’s the quickest path once it’s ready.",
            time: "4:13 PM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 4:09 PM",
        draft:
          "Hi Noah — I confirmed that your export failed because one large report segment timed out. I’ve started a manual rerun with a narrower range so we can get you the file before your meeting.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Export failed before meeting\n\nHello, my scheduled export failed and I need the report file today for an external meeting. Please help me recover it quickly.",
            time: "4:09 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Noah, I’m reviewing the export queue and timeout logs for your report now.",
            time: "4:10 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks. If a smaller report can finish sooner, I’m happy to use that version.",
            time: "4:13 PM",
          },
        ],
      },
    },
  },
  {
    id: "lauren",
    initials: "LK",
    name: "Lauren Kim",
    customerId: "CST-11412",
    lastUpdated: "02/27/26 | 04:39 PM",
    profile: {
      department: "Business Banking",
      tenureYears: 8,
      totalAUM: "$4,504,340.00",
      financialReadiness: 92,
      financialAdvisor: "Priya Shah",
      advisorTitle: "High Net Worth Advisor",
      tags: ["Premier", "IVR Auth", "Voice Biometrics"],
    },
    conversationTopics: [
      "Review business succession planning",
      "Set up employee benefits account",
      "Discuss SBA loan refinancing options",
    ],
    overview: {
      contactNumber: "(503) 555-0132",
      assignedAgent: "Priya Shah",
      pronoun: "she",
      lastContactTime: "Today, 4:41 PM",
      address: "622 NW Everett St, Portland, OR 97209",
    },
    interactionTimeline: [
      {
        id: "lauren-seat-add",
        title: "Seat expansion started",
        timestamp: "Today · 4:36 PM",
        detail: "Lauren attempted to add seats for a new team rollout and hit an admin-permission restriction during checkout.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "lauren-admin-check",
        title: "Permission review started",
        timestamp: "Today · 4:37 PM",
        detail: "Support reviewed the workspace roles after the seat expansion failed under Lauren’s current admin scope.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "lauren-customer-urgency",
        title: "Customer needs rollout today",
        timestamp: "Today · 4:38 PM",
        detail: "Lauren contacted support because new hires needed access before the end of the business day.",
        tone: "default",
        sortOrder: 3,
      },
      {
        id: "lauren-escalated-role",
        title: "Temporary role elevation requested",
        timestamp: "Today · 4:39 PM",
        detail: "A temporary role elevation request was submitted so Lauren could complete the seat purchase without waiting for another admin.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "lauren-seat-quote",
        title: "Updated seat quote prepared",
        timestamp: "Today · 4:40 PM",
        detail: "Support prepared an updated seat quote so the order could be approved immediately once access was restored.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "lauren-completion-path",
        title: "Completion path documented",
        timestamp: "Today · 4:41 PM",
        detail: "The case was updated with the exact steps Lauren would need to complete once the admin permission was fixed.",
        tone: "default",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "18m ago",
      preview: "Seat expansion blocked by admin permissions.",
      priority: "Low",
      priorityClassName: "border-[#B7E6DD] bg-[#EAF8F4] text-[#369D3F]",
      badgeColor: "bg-[#369D3F]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-03-11T16:20:00",
      updatedAt: "2026-03-11T16:41:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 4:37 PM",
        draft:
          "I found the permission block on your admin role. I’m escalating a temporary elevation now so you can finish adding the seats today.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I’m trying to add seats for new hires, but the admin tools keep blocking me at the final step.",
            time: "4:37 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’m checking your workspace role and the seat-purchase permissions now.",
            time: "4:38 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "I need to finish this today because onboarding starts tomorrow morning.",
            time: "4:39 PM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 4:37 PM",
        draft:
          "I can see the permission mismatch and I’m requesting a temporary role fix so you can add the seats today.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Can you help me add seats? The system says I don’t have the right admin access.",
            time: "4:37 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Yes — I’m reviewing the workspace admin settings now.",
            time: "4:38 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks. If I need another approver, I can pull them in fast.",
            time: "4:40 PM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 4:37 PM",
        draft:
          "Thanks for the screenshot. I confirmed the role gate and I’m pushing a faster approval path for the seat add.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I sent the screen where it blocks me. It looks like a permissions issue, not a billing problem.",
            time: "4:37 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I agree. I’m tracing the admin role settings and purchase policy now.",
            time: "4:38 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Great — I just need the quickest route to get those seats live.",
            time: "4:41 PM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 4:37 PM",
        draft:
          "Hi Lauren — I confirmed that the seat expansion is blocked by an admin-permission setting rather than a billing failure. I’ve escalated a temporary access fix so you can complete the purchase today.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Unable to add seats\n\nHello, I’m trying to purchase additional seats for new team members, but the admin settings are blocking me at checkout.",
            time: "4:37 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Lauren, I’m reviewing the role permissions and seat-purchase policy attached to your workspace now.",
            time: "4:38 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thank you. Please let me know whether I should involve our main account owner to speed approval.",
            time: "4:41 PM",
          },
        ],
      },
    },
  },
  {
    id: "ethan",
    initials: "EZ",
    name: "Ethan Zhang",
    customerId: "CST-11458",
    lastUpdated: "02/27/26 | 05:07 PM",
    profile: {
      department: "Business Banking",
      tenureYears: 6,
      totalAUM: "$2,098,600.00",
      financialReadiness: 85,
      financialAdvisor: "Alex Bogush",
      advisorTitle: "High Net Worth Advisor",
      tags: ["Premier", "IVR Auth"],
    },
    conversationTopics: [
      "Review commercial real estate loan status",
      "Discuss interest rate lock options",
      "Escalate underwriting timeline concern",
    ],
    overview: {
      contactNumber: "(646) 555-0163",
      assignedAgent: "Alex Bogush",
      pronoun: "he",
      lastContactTime: "Today, 5:09 PM",
      address: "515 Madison Ave, New York, NY 10022",
    },
    interactionTimeline: [
      {
        id: "ethan-api-rate-limit",
        title: "Rate limit spike detected",
        timestamp: "Today · 5:04 PM",
        detail: "Ethan’s API integration began returning rate-limit errors after a sudden spike in scheduled requests.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "ethan-integration-ticket",
        title: "Customer reported failed sync jobs",
        timestamp: "Today · 5:05 PM",
        detail: "Ethan contacted support because downstream sync jobs stopped updating once the API errors began.",
        tone: "default",
        sortOrder: 2,
      },
      {
        id: "ethan-throttle-review",
        title: "Throttle policy reviewed",
        timestamp: "Today · 5:06 PM",
        detail: "Support reviewed Ethan’s request pattern and identified a burst window exceeding the account’s allowed threshold.",
        tone: "info",
        sortOrder: 3,
      },
      {
        id: "ethan-priority-window",
        title: "Temporary priority window requested",
        timestamp: "Today · 5:07 PM",
        detail: "A temporary throughput increase was requested so Ethan could clear the sync backlog without manual retries.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "ethan-backoff-plan",
        title: "Backoff guidance prepared",
        timestamp: "Today · 5:08 PM",
        detail: "Support prepared recommended retry spacing so the integration could remain stable after the backlog cleared.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "ethan-recovery-check",
        title: "Recovery monitoring added",
        timestamp: "Today · 5:09 PM",
        detail: "The case was updated with monitoring to confirm the sync backlog drained once the priority window opened.",
        tone: "default",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "22m ago",
      preview: "API sync jobs stalled after rate-limit errors.",
      priority: "Medium",
      priorityClassName: "border-[#B8D7F0] bg-[#EEF6FC] text-[#006DAD]",
      badgeColor: "bg-[#F79009]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-03-11T16:52:00",
      updatedAt: "2026-03-11T17:09:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 5:05 PM",
        draft:
          "I found the burst pattern that triggered the rate limit. I’m requesting a temporary throughput increase and I’ll share the retry guidance once the backlog starts clearing.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Our integration started throwing rate-limit errors and now none of the sync jobs are catching up.",
            time: "5:05 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’m reviewing the request burst and current queue backlog now.",
            time: "5:06 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "If we can’t clear this today, several downstream systems will be stale by tomorrow morning.",
            time: "5:07 PM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 5:05 PM",
        draft:
          "I can see the rate-limit spike and I’m requesting a temporary increase while I also prepare the safer retry spacing for your integration.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Can you check our API rate limit? Sync jobs are failing across the board.",
            time: "5:05 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Yes — I’m checking the request pattern and the failure window now.",
            time: "5:06 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "We had a large scheduled burst this afternoon, so that may be the trigger.",
            time: "5:08 PM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 5:05 PM",
        draft:
          "Thanks for confirming the burst timing. I’m opening a temporary priority window now and I’ll monitor the backlog here with you.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I’ve sent the error screenshots and request counts. It looks like we hit the cap hard.",
            time: "5:05 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "That matches what I’m seeing. I’m escalating a throughput exception now.",
            time: "5:06 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Great — please keep me posted as soon as the queue starts moving again.",
            time: "5:09 PM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 5:05 PM",
        draft:
          "Hi Ethan — I confirmed that the sync failures line up with a request burst that exceeded the current API threshold. I’ve requested a temporary increase and I’m preparing guidance to prevent repeat throttling.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: API rate limits breaking sync\n\nHello, our API integration began failing this afternoon with rate-limit errors, and now our sync jobs are backed up. Please advise.",
            time: "5:05 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Ethan, I’m reviewing the rate-limit events and queued retries tied to your integration now.",
            time: "5:06 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks. We can adjust the retry cadence if needed once the backlog is cleared.",
            time: "5:09 PM",
          },
        ],
      },
    },
  },
];

export const defaultCustomerId = customerDatabase.find((customer) => customer.queue.isActive)?.id ?? customerDatabase[0]?.id ?? "alex";

export function getCustomerRecord(customerId: string) {
  return customerDatabase.find((customer) => customer.id === customerId) ?? customerDatabase[0];
}

export function getRandomizedCustomerInteractionTimeline(customerId: string, count = 4) {
  const customer = getCustomerRecord(customerId);
  const shuffled = [...customer.interactionTimeline]
    .map((item) => ({ item, random: Math.random() }))
    .sort((left, right) => left.random - right.random)
    .map(({ item }) => item);

  return shuffled
    .slice(0, Math.min(count, shuffled.length))
    .sort((left, right) => right.sortOrder - left.sortOrder);
}

export function getChannelFromConversationLabel(label: string): CustomerChannel {
  if (label.toLowerCase() === "chat") return "chat";
  if (label.toLowerCase() === "sms") return "sms";
  if (label.toLowerCase() === "whatsapp") return "whatsapp";
  if (label.toLowerCase() === "voice") return "voice";
  return "email";
}

export function createConversationState(customerId: string, channel: CustomerChannel): SharedConversationData {
  const customer = getCustomerRecord(customerId);

  if (channel === "voice") {
    return {
      customerName: customer.name,
      label: "Voice",
      timelineLabel: "Voice call · Live guidance",
      status: "open",
      draft: "",
      messages: [],
      isCustomerTyping: false,
    };
  }

  const conversation = customer.conversations[channel];

  return {
    customerName: customer.name,
    label: conversation.label,
    timelineLabel: conversation.timelineLabel,
    status: "open",
    draft: "",
    messages: conversation.messages.map((message) => ({ ...message })),
    isCustomerTyping: false,
  };
}

export function getRandomCustomerSeed() {
  return customerDatabase[Math.floor(Math.random() * customerDatabase.length)] ?? customerDatabase[0];
}
