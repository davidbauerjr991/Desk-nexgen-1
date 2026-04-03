export type CustomerNote = {
  id: number;
  customerId: string;
  agentName: string;
  agentId: string;
  createdAt: string;
  body: string;
};

// Module-level mutable store — acts as an in-memory database that persists
// for the lifetime of the session and is keyed by customerRecordId.
const notesStore: Record<string, CustomerNote[]> = {
  alex: [
    {
      id: 1001,
      customerId: "alex",
      agentName: "Patrick Johnson",
      agentId: "AGT-11247",
      createdAt: "03/18/2024 10:05:22 AM",
      body: "Alex called in asking about his investment portfolio performance. Explained YTD returns and upcoming rebalancing schedule. Seemed satisfied.",
    },
    {
      id: 1002,
      customerId: "alex",
      agentName: "Alex Bogush",
      agentId: "AGT-11803",
      createdAt: "03/20/2024 02:30:44 PM",
      body: "Risk flag raised on account — unusual login from new device. Verified identity via security questions. Flagged for follow-up security review.",
    },
    {
      id: 1003,
      customerId: "alex",
      agentName: "John Smith",
      agentId: "AGT-10482",
      createdAt: "03/22/2024 09:14:07 AM",
      body: "Customer requested a higher credit limit on his premium card. Submitted the request — approval pending risk team review.",
    },
  ],
  sarah: [
    {
      id: 2001,
      customerId: "sarah",
      agentName: "Alex Bogush",
      agentId: "AGT-11803",
      createdAt: "03/15/2024 11:22:00 AM",
      body: "Sarah reported a baggage delay from her flight last week. Opened compensation case and issued a travel credit as goodwill gesture.",
    },
    {
      id: 2002,
      customerId: "sarah",
      agentName: "Patrick Johnson",
      agentId: "AGT-11247",
      createdAt: "03/19/2024 03:45:18 PM",
      body: "Followed up on the baggage delay case. Compensation approved and posted to account. Sarah confirmed receipt and expressed satisfaction.",
    },
    {
      id: 2003,
      customerId: "sarah",
      agentName: "John Smith",
      agentId: "AGT-10482",
      createdAt: "03/22/2024 08:50:33 AM",
      body: "Sarah called to ask about upgrading her membership tier. Explained benefits of Gold vs Platinum. She wants to think it over and will call back.",
    },
  ],
  emily: [
    {
      id: 3001,
      customerId: "emily",
      agentName: "John Smith",
      agentId: "AGT-10482",
      createdAt: "03/10/2024 02:00:00 PM",
      body: "Emily's promotional campaign launched with a validation error — discount codes were not applying at checkout. Escalated to the tech team immediately.",
    },
    {
      id: 3002,
      customerId: "emily",
      agentName: "Alex Bogush",
      agentId: "AGT-11803",
      createdAt: "03/14/2024 10:30:55 AM",
      body: "Validation issue resolved. New codes issued and tested successfully. Emily confirmed the campaign is now live and running correctly.",
    },
  ],
  david: [
    {
      id: 4001,
      customerId: "david",
      agentName: "Patrick Johnson",
      agentId: "AGT-11247",
      createdAt: "03/12/2024 09:00:00 AM",
      body: "David requested a plan change from Business to Enterprise. Duplicate hold detected on the account — need to clear before processing.",
    },
    {
      id: 4002,
      customerId: "david",
      agentName: "John Smith",
      agentId: "AGT-10482",
      createdAt: "03/16/2024 04:15:20 PM",
      body: "Duplicate hold resolved. Plan change processed successfully. David will be billed at the new Enterprise rate from next billing cycle.",
    },
    {
      id: 4003,
      customerId: "david",
      agentName: "Alex Bogush",
      agentId: "AGT-11803",
      createdAt: "03/21/2024 11:08:44 AM",
      body: "David flagged as a potential churn risk — unhappy with recent price increases. Offered a 3-month loyalty discount to retain. He accepted.",
    },
  ],
  priya: [
    {
      id: 5001,
      customerId: "priya",
      agentName: "Alex Bogush",
      agentId: "AGT-11803",
      createdAt: "03/17/2024 08:45:00 AM",
      body: "Account locked out after 5 failed login attempts. Ran identity verification successfully. Reset link sent to registered email.",
    },
    {
      id: 5002,
      customerId: "priya",
      agentName: "Patrick Johnson",
      agentId: "AGT-11247",
      createdAt: "03/19/2024 01:20:10 PM",
      body: "Priya confirmed she regained access. Device risk flag still showing — recommended she review authorized devices in security settings.",
    },
  ],
  miguel: [
    {
      id: 6001,
      customerId: "miguel",
      agentName: "John Smith",
      agentId: "AGT-10482",
      createdAt: "03/11/2024 03:00:00 PM",
      body: "Miguel requested a refund for a duplicate charge from last month. Verified transaction history and confirmed the duplicate. Refund initiated.",
    },
    {
      id: 6002,
      customerId: "miguel",
      agentName: "Alex Bogush",
      agentId: "AGT-11803",
      createdAt: "03/20/2024 10:55:30 AM",
      body: "Refund of $142.50 posted to Miguel's account. He also asked about auto-pay setup — walked him through the process. All set.",
    },
  ],
  olivia: [
    {
      id: 7001,
      customerId: "olivia",
      agentName: "Patrick Johnson",
      agentId: "AGT-11247",
      createdAt: "03/13/2024 02:10:00 PM",
      body: "Olivia inquired about transferring her account to a joint account with her partner. Explained documentation requirements. She will gather docs and call back.",
    },
  ],
  jamal: [
    {
      id: 8001,
      customerId: "jamal",
      agentName: "John Smith",
      agentId: "AGT-10482",
      createdAt: "03/08/2024 11:00:00 AM",
      body: "Jamal called about an unauthorized transaction on his debit card. Card frozen immediately. Fraud claim opened — case number FCL-2024-0308.",
    },
    {
      id: 8002,
      customerId: "jamal",
      agentName: "Alex Bogush",
      agentId: "AGT-11803",
      createdAt: "03/13/2024 09:30:00 AM",
      body: "Fraud investigation concluded — transaction confirmed as unauthorized. Full refund issued and new card dispatched. ETA 3-5 business days.",
    },
    {
      id: 8003,
      customerId: "jamal",
      agentName: "Patrick Johnson",
      agentId: "AGT-11247",
      createdAt: "03/18/2024 04:00:00 PM",
      body: "Jamal confirmed receipt of the new card and that refund posted correctly. Case closed. Reminded him to set up transaction alerts.",
    },
  ],
  hannah: [
    {
      id: 9001,
      customerId: "hannah",
      agentName: "Alex Bogush",
      agentId: "AGT-11803",
      createdAt: "03/14/2024 01:45:00 PM",
      body: "Hannah asked about options for consolidating her two savings accounts. Explained the process and highlighted potential interest rate benefits.",
    },
    {
      id: 9002,
      customerId: "hannah",
      agentName: "John Smith",
      agentId: "AGT-10482",
      createdAt: "03/21/2024 10:00:00 AM",
      body: "Hannah confirmed she wants to proceed with account consolidation. Submitted the request — processing time 2 business days.",
    },
  ],
  noah: [
    {
      id: 10001,
      customerId: "noah",
      agentName: "Patrick Johnson",
      agentId: "AGT-11247",
      createdAt: "03/09/2024 09:20:00 AM",
      body: "Noah reported an issue with his mortgage portal — couldn't upload documents. Transferred to the mortgage tech support team.",
    },
    {
      id: 10002,
      customerId: "noah",
      agentName: "Alex Bogush",
      agentId: "AGT-11803",
      createdAt: "03/15/2024 03:30:00 PM",
      body: "Portal issue resolved. Noah successfully uploaded all required documents. Mortgage application now in underwriting review.",
    },
    {
      id: 10003,
      customerId: "noah",
      agentName: "John Smith",
      agentId: "AGT-10482",
      createdAt: "03/22/2024 08:05:00 AM",
      body: "Noah is frustrated with the slow underwriting process — called to escalate. Raised priority flag and set up a callback with a senior advisor for tomorrow.",
    },
  ],
  lauren: [
    {
      id: 11001,
      customerId: "lauren",
      agentName: "John Smith",
      agentId: "AGT-10482",
      createdAt: "03/16/2024 02:00:00 PM",
      body: "Lauren contacted us about setting up automatic investment contributions. Helped configure monthly recurring transfer to her investment account.",
    },
  ],
  ethan: [
    {
      id: 12001,
      customerId: "ethan",
      agentName: "Alex Bogush",
      agentId: "AGT-11803",
      createdAt: "03/11/2024 10:45:00 AM",
      body: "Ethan called about a failed international wire transfer. Transaction rejected due to missing IBAN. Helped him correct the details and resubmit.",
    },
    {
      id: 12002,
      customerId: "ethan",
      agentName: "Patrick Johnson",
      agentId: "AGT-11247",
      createdAt: "03/19/2024 11:30:00 AM",
      body: "Wire transfer successfully processed. Ethan confirmed funds arrived. He also asked about international transfer fee waivers for Premium members — sent a summary by email.",
    },
  ],
};

/** Return a copy of the notes array for a given customer (newest first). */
export function getNotesForCustomer(customerId: string): CustomerNote[] {
  return [...(notesStore[customerId] ?? [])].reverse();
}

/** Prepend a new note for a customer and return it. */
export function addNoteForCustomer(
  customerId: string,
  note: Omit<CustomerNote, "id" | "customerId">,
): CustomerNote {
  const newNote: CustomerNote = {
    ...note,
    id: Date.now(),
    customerId,
  };
  if (!notesStore[customerId]) {
    notesStore[customerId] = [];
  }
  notesStore[customerId].push(newNote);
  return newNote;
}
