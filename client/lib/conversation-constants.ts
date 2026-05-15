import type { AgentTask } from "./conversation-types";

export const conversationFooterMenuItems = [
  "Add files or photos",
  "Take a screenshot",
  "Add to project",
] as const;

export const conversationFooterSecondaryMenuItems = [
  "Web search",
  "Connect Supervisor",
  "Add connectors",
] as const;

export const MESSAGE_TAG_DEFS = [
  {
    id: "complaint",
    label: "Complaint",
    activeClass: "bg-[#FDEAEA] text-[#C71D1A] border-[#E53935]",
    ghostClass: "bg-white text-[#98A2B3] border-[#E4E7EC] hover:bg-[#FDEAEA] hover:text-[#C71D1A] hover:border-[#E53935]",
  },
  {
    id: "help",
    label: "Help",
    activeClass: "bg-[#EEF4FF] text-[#3538CD] border-[#C7D7FD]",
    ghostClass: "bg-white text-[#98A2B3] border-[#E4E7EC] hover:bg-[#EEF4FF] hover:text-[#3538CD] hover:border-[#C7D7FD]",
  },
  {
    id: "praise",
    label: "Praise",
    activeClass: "bg-[#EFFBF1] text-[#208337] border-[#24943E]",
    ghostClass: "bg-white text-[#98A2B3] border-[#E4E7EC] hover:bg-[#EFFBF1] hover:text-[#208337] hover:border-[#24943E]",
  },
  {
    id: "share",
    label: "Share",
    activeClass: "bg-[#F9F5FF] text-[#1260B0] border-[#E9D7FE]",
    ghostClass: "bg-white text-[#98A2B3] border-[#E4E7EC] hover:bg-[#F9F5FF] hover:text-[#1260B0] hover:border-[#E9D7FE]",
  },
] as const;

export const TASK_COMPLETION_NOTES: Record<string, string> = {
  "create-ticket": "ADP ticket created",
  "update-salesforce": "Salesforce record updated",
  "send-coupon": "Discount coupon email sent",
  "escalate": "Escalated to supervisor",
  "callback": "Callback scheduled",
  "upgrade-beverage-package": "Beverage package upgraded",
  "confirm-credit-line": "Credit line confirmed",
  "set-resolved": "Case resolved",
  "ship-replacement": "Overnight replacement 64GB memory card shipped to Elena's address",
  "goodwill-credit": "$25 goodwill credit applied to Elena's account",
  "qa-report": "QA report filed — packing discrepancy flagged for order #EV-44071",
  "options-resolve": "Resolution actioned for order #WB-88214: Full refund issued — Marcus free to reorder at his convenience. Goodwill discount code CARE20 (20%) applied to account.",
  "rebook-flight": "Passenger rebooked on next available flight",
  "map-route": "Quickest route mapped and sent to traveler",
  "issue-voucher": "Travel voucher issued for meals and lounge access",
  "issue-hotel": "Hotel voucher issued for overnight accommodation",
  "trace-baggage": "Baggage trace initiated — tracking reference created",
  "update-itinerary": "Itinerary record updated with revised travel details",
  "close-case": "Case closed and resolved",
  "authorize-partner-upgrade": "Premium cabin upgrade authorized — British Airways BA-292 + BA-548",
  "rebook-partner-airline": "Alex rebooked: BA-292 MSP→LHR, BA-548 LHR→FCO — arrives Rome 09:20+1",
  "send-confirmation": "Updated itinerary and boarding passes sent to Alex's email and Voyager app",
};

export const TASK_COMPLETION_REPLIES: Record<string, string> = {
  "create-ticket": "I've created a support ticket for you and it's been assigned to our queue. Is there anything else I can help you with in the meantime?",
  "update-salesforce": "I've updated your account record on our end. Is there anything else I can help you with?",
  "send-coupon": "I've sent a discount coupon to your email address on file. Is there anything else I can do for you?",
  "escalate": "I've escalated this to a supervisor who will be with you shortly. Is there anything else you need while you wait?",
  "callback": "I've scheduled a callback for you. You'll receive a confirmation shortly. Is there anything else I can help you with?",
  "upgrade-beverage-package": "I've processed the upgrade to your beverage package. You should receive a confirmation email shortly.",
  "confirm-credit-line": "I've confirmed your credit line details. Everything looks good on our end.",
  "set-resolved": "Thank you so much for reaching out! I'm glad we could help. Have a great day!",
  "ship-replacement": "Elena, I've arranged an overnight replacement for your 64GB memory card — it's on the way to the address on file. You should receive tracking details shortly.",
  "goodwill-credit": "I've also applied a $25 credit to your account as a gesture of goodwill for the inconvenience. It will reflect on your next statement.",
  "qa-report": "I've flagged the packing discrepancy with our warehouse team so we can prevent this from happening again.",
  "options-resolve": "I've processed the resolution for Marcus's order. The refund has been issued and a goodwill discount has been applied. Is there anything else you'd like to do before wrapping up?",
  "rebook-flight": "I've rebooked you on the next available flight. You'll receive your updated boarding pass and confirmation shortly. Is there anything else I can help with?",
  "map-route": "I've mapped the quickest route to your destination and sent the details to your contact on file. Would you like me to arrange anything else for the journey?",
  "issue-voucher": "I've issued a travel voucher for meals and lounge access — it's been sent to your email. Is there anything else you need while you wait?",
  "issue-hotel": "I've issued a hotel voucher for overnight accommodation near the airport. Check-in details have been sent to your email. Is there anything else I can help with?",
  "trace-baggage": "I've initiated a baggage trace and created a tracking reference. You'll receive updates via SMS as your luggage is located and rerouted. Is there anything else?",
  "update-itinerary": "I've updated your itinerary with all the revised travel details. You can view the changes in your Voyager app. Anything else I can do?",
  "close-case": "This case has been resolved and closed. Thank you for your patience during the disruption — we hope the rest of your trip goes smoothly!",
  "authorize-partner-upgrade": "Alex, great news — I've authorized the premium cabin upgrade on British Airways. You're confirmed on BA-292 departing at 11:45 with a connecting flight to Rome.",
  "rebook-partner-airline": "Your new itinerary is locked in: BA-292 MSP→LHR departing 11:45, connecting to BA-548 LHR→FCO arriving 09:20 tomorrow morning. You'll be in Rome with time to spare.",
  "send-confirmation": "I've sent your updated boarding passes and full itinerary to your email and the Voyager app. Is there anything else I can help with before you head to the gate?",
};

export const TASK_ACTION_TITLES: Record<string, string> = {
  "create-ticket": "Creating ADP Ticket...",
  "update-salesforce": "Creating Salesforce Record...",
  "send-coupon": "Sending Discount Coupon...",
  "escalate": "Escalating to Supervisor...",
  "callback": "Scheduling Callback...",
  "upgrade-beverage-package": "Upgrading Beverage Package...",
  "confirm-credit-line": "Confirming Credit Line...",
  "set-resolved": "Resolving Case...",
  "ship-replacement": "Shipping Replacement Card...",
  "goodwill-credit": "Applying Goodwill Credit...",
  "qa-report": "Filing QA Report...",
  "initiate-dispute": "Initiating Dispute...",
  "issue-temp-credit": "Applying Temporary Credit...",
  "issue-replacement-card": "Issuing Replacement Card...",
  "options-resolve": "Resolving...",
  "rebook-flight": "Rebooking Flight...",
  "map-route": "Mapping Quickest Route...",
  "issue-voucher": "Issuing Travel Voucher...",
  "issue-hotel": "Issuing Hotel Voucher...",
  "trace-baggage": "Initiating Baggage Trace...",
  "update-itinerary": "Updating Itinerary...",
  "close-case": "Closing Case...",
  "authorize-partner-upgrade": "Authorizing Premium Upgrade...",
  "rebook-partner-airline": "Rebooking on British Airways...",
  "send-confirmation": "Sending Confirmation...",
};

export const TASK_STEPS: Record<string, string[]> = {
  "create-ticket": [
    "Searching for customer ID",
    "Pulling conversation history",
    "Creating ADP ticket record",
    "Assigning to support queue",
  ],
  "update-salesforce": [
    "Searching for customer ID",
    "Processing updating payment amount",
    "Emailing confirmation to customer",
  ],
  "send-coupon": [
    "Looking up customer email",
    "Generating discount code",
    "Sending coupon email to customer",
  ],
  "escalate": [
    "Finding available supervisor",
    "Transferring conversation notes",
    "Notifying supervisor",
  ],
  "callback": [
    "Checking agent availability",
    "Creating callback appointment",
    "Sending confirmation to customer",
  ],
  "upgrade-beverage-package": [
    "Checking current package tier",
    "Verifying upgrade eligibility",
    "Processing package change",
    "Sending confirmation to customer",
  ],
  "confirm-credit-line": [
    "Pulling account credit details",
    "Verifying authorisation status",
    "Confirming credit line terms",
  ],
  "set-resolved": [
    "Closing conversation thread",
    "Updating case status",
    "Removing from queue",
  ],
  "ship-replacement": [
    "Locating order #EV-44071",
    "Generating overnight shipment label",
    "Scheduling pickup for 64GB memory card",
    "Sending tracking confirmation to Elena",
  ],
  "goodwill-credit": [
    "Pulling Elena's account record",
    "Applying $25 credit to account",
    "Logging goodwill gesture in CRM",
  ],
  "qa-report": [
    "Retrieving warehouse packing log",
    "Flagging discrepancy on order #EV-44071",
    "Submitting QA report to warehouse team",
  ],
  "initiate-dispute": [
    "Verifying account and transaction details",
    "Filing dispute for $2,159 in unauthorized charges",
    "Issuing provisional credit to account",
    "Sending dispute confirmation to customer",
  ],
  "issue-temp-credit": [
    "Verifying account balance",
    "Applying provisional credit of $2,159",
    "Logging credit memo to case record",
    "Notifying customer via email",
  ],
  "issue-replacement-card": [
    "Permanently blocking compromised card",
    "Generating replacement card number",
    "Scheduling delivery to address on file",
    "Sending tracking confirmation to customer",
  ],
  "options-resolve": [
    "Confirming resolution with carrier",
    "Applying goodwill discount code (20% off)",
    "Updating default shipping address to Austin",
    "Sending confirmation to Marcus",
  ],
  "rebook-flight": [
    "Searching available flights to destination",
    "Checking seat availability and cabin class",
    "Transferring booking to new flight",
    "Sending updated boarding pass to traveler",
  ],
  "map-route": [
    "Pulling real-time flight and ground transport data",
    "Evaluating alternate hub connections",
    "Calculating fastest route to final destination",
    "Sending route options to traveler",
  ],
  "issue-voucher": [
    "Verifying traveler eligibility",
    "Generating travel voucher code",
    "Applying voucher to traveler's account",
    "Sending voucher confirmation via email",
  ],
  "issue-hotel": [
    "Checking partner hotel availability near airport",
    "Reserving room and confirming rate",
    "Generating hotel voucher with check-in details",
    "Sending accommodation confirmation to traveler",
  ],
  "trace-baggage": [
    "Pulling baggage tag and routing records",
    "Initiating trace across connected carriers",
    "Creating baggage tracking reference",
    "Sending trace updates to traveler via SMS",
  ],
  "update-itinerary": [
    "Pulling current itinerary record",
    "Applying flight, hotel, and voucher changes",
    "Syncing updated itinerary to traveler's app",
    "Logging all changes to case record",
  ],
  "close-case": [
    "Verifying all actions are complete",
    "Updating case status to resolved",
    "Removing from active queue",
  ],
  "authorize-partner-upgrade": [
    "Verifying Alex's Platinum tier and upgrade eligibility",
    "Calculating fare differential for BA premium cabin",
    "Submitting authorization request to partner desk",
    "Confirming premium upgrade on BA-292 + BA-548",
  ],
  "rebook-partner-airline": [
    "Releasing VY-4450 MSP→LHR seat hold",
    "Booking BA-292 MSP→LHR departing 11:45",
    "Booking BA-548 LHR→FCO arriving 09:20+1",
    "Confirming seat assignments on both segments",
  ],
  "send-confirmation": [
    "Generating updated itinerary document",
    "Attaching new boarding passes for BA-292 and BA-548",
    "Sending confirmation to Alex's email",
    "Syncing itinerary to Voyager app",
  ],
};

// Maps natural-language copilot requests to known task IDs.
export const COPILOT_TASK_MATCHERS: Array<{ keywords: string[]; task: AgentTask }> = [
  { keywords: ["rebook", "flight", "next flight", "rebook flight", "alternative flight"], task: { id: "rebook-flight", label: "Rebook on Next Available Flight" } },
  { keywords: ["route", "quickest", "fastest", "alternative route", "map route", "connection"], task: { id: "map-route", label: "Map Quickest Route" } },
  { keywords: ["voucher", "travel voucher", "compensation", "goodwill", "issue voucher"], task: { id: "issue-voucher", label: "Issue Travel Voucher" } },
  { keywords: ["hotel", "accommodation", "hotel voucher", "overnight", "lodging"], task: { id: "issue-hotel", label: "Issue Hotel Voucher" } },
  { keywords: ["baggage", "luggage", "bag", "trace", "lost bag", "missing luggage"], task: { id: "trace-baggage", label: "Initiate Baggage Trace" } },
  { keywords: ["itinerary", "update itinerary", "record", "ticket", "update ticket"], task: { id: "update-itinerary", label: "Update Itinerary Record" } },
  { keywords: ["escalat", "supervisor", "manager", "escalate"], task: { id: "escalate", label: "Escalate to Supervisor" } },
  { keywords: ["callback", "call back", "schedule call", "schedule callback"], task: { id: "callback", label: "Schedule Callback" } },
];
