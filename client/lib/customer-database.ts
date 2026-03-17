import type { ConversationMessage, SharedConversationData } from "@/components/ConversationPanel";

export type CustomerChannel = "chat" | "sms" | "whatsapp" | "email";
export type CustomerQueueIcon = "phone" | "clipboardList" | "messageSquare";

export type CustomerSeedRecord = {
  id: string;
  initials: string;
  name: string;
  customerId: string;
  lastUpdated: string;
  queue: {
    time: string;
    preview: string;
    sentiment: string;
    sentimentClassName: string;
    badgeColor: string;
    icon: CustomerQueueIcon;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  conversations: Record<
    CustomerChannel,
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
    queue: {
      time: "Now",
      preview: "Need help resolving a blocked upgrade.",
      sentiment: "Positive",
      sentimentClassName: "border-[#73A76F] text-[#4E8A51]",
      badgeColor: "bg-[#CC2D2D]",
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
    queue: {
      time: "2m ago",
      preview: "Missed flight and needs a same-day rebooking.",
      sentiment: "Neutral",
      sentimentClassName: "border-black/20 text-[#333333]",
      badgeColor: "bg-[#2E9B34]",
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
    queue: {
      time: "5m ago",
      preview: "Discount code is failing during checkout.",
      sentiment: "Negative",
      sentimentClassName: "border-[#A14C49] text-[#87413C]",
      badgeColor: "bg-[#45C9CF]",
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
    queue: {
      time: "24m ago",
      preview: "Subscription change and duplicate-charge concern.",
      sentiment: "Positive",
      sentimentClassName: "border-[#73A76F] text-[#4E8A51]",
      badgeColor: "bg-[#8BC34A]",
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
];

export const defaultCustomerId = customerDatabase.find((customer) => customer.queue.isActive)?.id ?? customerDatabase[0]?.id ?? "alex";

export function getCustomerRecord(customerId: string) {
  return customerDatabase.find((customer) => customer.id === customerId) ?? customerDatabase[0];
}

export function getChannelFromConversationLabel(label: string): CustomerChannel {
  if (label.toLowerCase() === "chat") return "chat";
  if (label.toLowerCase() === "sms") return "sms";
  if (label.toLowerCase() === "whatsapp") return "whatsapp";
  return "email";
}

export function createConversationState(customerId: string, channel: CustomerChannel): SharedConversationData {
  const customer = getCustomerRecord(customerId);
  const conversation = customer.conversations[channel];

  return {
    customerName: customer.name,
    label: conversation.label,
    timelineLabel: conversation.timelineLabel,
    draft: conversation.draft,
    messages: conversation.messages.map((message) => ({ ...message })),
    isCustomerTyping: false,
  };
}

export function getRandomCustomerSeed() {
  return customerDatabase[Math.floor(Math.random() * customerDatabase.length)] ?? customerDatabase[0];
}
