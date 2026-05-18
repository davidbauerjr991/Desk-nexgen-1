// ─── Trend Detection Database ─────────────────────────────────────────────────
// Centralised data for the Trend Detection carousel on the Home tab.
// Each trend includes a short summary for the carousel slide and rich detail
// content (HTML string) rendered inside the modal when the agent clicks it.

export interface TrendItem {
  id: string;
  /** Short (1–2 sentence) summary shown in the carousel slide. */
  summary: string;
  /** Title shown at the top of the detail modal. */
  modalTitle: string;
  /** Severity badge displayed next to the modal title. */
  severity: "critical" | "high" | "moderate" | "info";
  /** Rich detail content — rendered as raw HTML inside the modal body. */
  modalBody: string;
  /** Timestamp string shown in the modal header. */
  updatedAt: string;
}

// ── Reusable SVG outage map ──────────────────────────────────────────────────
// A simplified SVG showing the affected Minneapolis–Saint Paul metro area
// with a radial impact zone overlay.

const OUTAGE_MAP_SVG = `
<svg viewBox="0 0 520 340" xmlns="http://www.w3.org/2000/svg" class="w-full rounded-lg border border-[#E4E7EC] bg-[#F8FAFC]">
  <!-- Grid lines -->
  <line x1="0" y1="85" x2="520" y2="85" stroke="#E4E7EC" stroke-width="0.5"/>
  <line x1="0" y1="170" x2="520" y2="170" stroke="#E4E7EC" stroke-width="0.5"/>
  <line x1="0" y1="255" x2="520" y2="255" stroke="#E4E7EC" stroke-width="0.5"/>
  <line x1="130" y1="0" x2="130" y2="340" stroke="#E4E7EC" stroke-width="0.5"/>
  <line x1="260" y1="0" x2="260" y2="340" stroke="#E4E7EC" stroke-width="0.5"/>
  <line x1="390" y1="0" x2="390" y2="340" stroke="#E4E7EC" stroke-width="0.5"/>

  <!-- Major roads / highways simplified -->
  <path d="M0,155 Q130,160 260,145 Q390,130 520,140" stroke="#CBD5E1" stroke-width="2" fill="none"/>
  <path d="M0,200 Q130,195 260,180 Q350,170 520,190" stroke="#CBD5E1" stroke-width="2" fill="none"/>
  <path d="M250,0 Q258,85 265,170 Q268,255 270,340" stroke="#CBD5E1" stroke-width="2" fill="none"/>
  <path d="M180,0 Q195,85 210,170 Q220,255 230,340" stroke="#CBD5E1" stroke-width="1.5" fill="none"/>

  <!-- Mississippi River -->
  <path d="M200,0 Q210,50 225,100 Q240,150 235,200 Q228,250 220,300 Q215,320 210,340" stroke="#93C5FD" stroke-width="4" fill="none" opacity="0.6"/>

  <!-- Impact zones (radial) -->
  <circle cx="260" cy="165" r="120" fill="#EF4444" opacity="0.08" stroke="#EF4444" stroke-width="1" stroke-dasharray="4,3"/>
  <circle cx="260" cy="165" r="80" fill="#EF4444" opacity="0.12" stroke="#EF4444" stroke-width="1" stroke-dasharray="4,3"/>
  <circle cx="260" cy="165" r="40" fill="#EF4444" opacity="0.18"/>

  <!-- MSP Airport marker -->
  <circle cx="310" cy="205" r="8" fill="#1260B0" stroke="white" stroke-width="2"/>
  <text x="325" y="210" font-size="11" font-weight="600" fill="#1260B0" font-family="system-ui">MSP Airport</text>

  <!-- Minneapolis marker -->
  <circle cx="240" cy="140" r="6" fill="#DC2626" stroke="white" stroke-width="2"/>
  <text x="200" y="130" font-size="10" font-weight="600" fill="#DC2626" font-family="system-ui">Minneapolis</text>

  <!-- Saint Paul marker -->
  <circle cx="310" cy="150" r="6" fill="#DC2626" stroke="white" stroke-width="2"/>
  <text x="322" y="147" font-size="10" font-weight="600" fill="#DC2626" font-family="system-ui">Saint Paul</text>

  <!-- Bloomington marker -->
  <circle cx="245" cy="210" r="4" fill="#F59E0B" stroke="white" stroke-width="1.5"/>
  <text x="210" y="230" font-size="9" fill="#92400E" font-family="system-ui">Bloomington</text>

  <!-- Eagan marker -->
  <circle cx="300" cy="235" r="4" fill="#F59E0B" stroke="white" stroke-width="1.5"/>
  <text x="310" y="240" font-size="9" fill="#92400E" font-family="system-ui">Eagan</text>

  <!-- Richfield marker -->
  <circle cx="250" cy="185" r="4" fill="#F59E0B" stroke="white" stroke-width="1.5"/>
  <text x="210" y="195" font-size="9" fill="#92400E" font-family="system-ui">Richfield</text>

  <!-- Legend -->
  <rect x="12" y="280" width="180" height="50" rx="6" fill="white" stroke="#E4E7EC"/>
  <circle cx="28" cy="296" r="5" fill="#EF4444" opacity="0.5"/>
  <text x="38" y="300" font-size="9" fill="#344054" font-family="system-ui">Severe impact zone</text>
  <circle cx="28" cy="314" r="5" fill="#F59E0B" opacity="0.5"/>
  <text x="38" y="318" font-size="9" fill="#344054" font-family="system-ui">Moderate disruption</text>
</svg>`;

// ── Trend items ──────────────────────────────────────────────────────────────

export const trendItems: TrendItem[] = [
  {
    id: "winter-snow-storm",
    summary:
      "A major winter snow storm across the Minneapolis–Saint Paul metro area is affecting 84,000+ stranded passengers at MSP. Ground operations are severely limited — expect extended delays on all outbound flights.",
    modalTitle: "Winter Snow Storm — Minneapolis–Saint Paul Metro",
    severity: "critical",
    updatedAt: "Today · 6:45 AM CST",
    modalBody: `
      <div class="space-y-4">
        <div class="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3">
          <p class="text-[12px] font-semibold text-[#991B1B] mb-1">Critical Weather Alert</p>
          <p class="text-[12px] text-[#7F1D1D] leading-relaxed">A major winter snow storm has blanketed the Twin Cities metro area since approximately 02:30 CST, with 14+ inches of accumulation and sustained 45 mph winds. MSP Airport ground operations are severely limited with reduced terminal capacity.</p>
        </div>
        ${OUTAGE_MAP_SVG}
        <div class="space-y-2">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-[#667085]">Key Facts</p>
          <ul class="space-y-1.5 text-[12px] text-[#344054] leading-relaxed">
            <li class="flex items-start gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#DC2626]"></span>14+ inches of snow with sustained 45 mph winds; NWS blizzard warning in effect until 18:00 CST</li>
            <li class="flex items-start gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#DC2626]"></span>MSP Airport visibility below minimums — ground stops in effect, Terminals 1 & 2 at reduced capacity</li>
            <li class="flex items-start gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F59E0B]"></span>De-icing operations suspended since 04:00; runway 30L/12R cleared, 30R/12L still closed</li>
            <li class="flex items-start gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F59E0B]"></span>Hotel availability within 15 miles of MSP is at 2% — most properties fully booked</li>
            <li class="flex items-start gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3B82F6]"></span>Voyager operations center has activated Level 3 (mass disruption) response protocol</li>
          </ul>
        </div>
      </div>`,
  },
  {
    id: "flight-cancellation-surge",
    summary:
      "142 Voyager flights departing MSP have been canceled today — a 340% increase from the same day last week. Rebooking queue depth has tripled in the last 2 hours. Agents should prioritize connecting itineraries and medically urgent travelers.",
    modalTitle: "Flight Cancellation Surge — MSP Hub",
    severity: "critical",
    updatedAt: "Today · 7:15 AM CST",
    modalBody: `
      <div class="space-y-4">
        <div class="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3">
          <p class="text-[12px] font-semibold text-[#991B1B] mb-1">Operations Alert</p>
          <p class="text-[12px] text-[#7F1D1D] leading-relaxed">The winter snow storm has triggered a cascading failure across MSP operations. 142 of 187 scheduled Voyager departures are canceled. Downstream hubs (ORD, DFW, ATL) are also reporting delays on MSP-origin routes.</p>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div class="rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-3 text-center">
            <p class="text-[20px] font-bold text-[#DC2626]">142</p>
            <p class="text-[10px] text-[#667085] mt-0.5">Flights Canceled</p>
          </div>
          <div class="rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-3 text-center">
            <p class="text-[20px] font-bold text-[#F59E0B]">23</p>
            <p class="text-[10px] text-[#667085] mt-0.5">Delayed 2+ hrs</p>
          </div>
          <div class="rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-3 text-center">
            <p class="text-[20px] font-bold text-[#111827]">84K</p>
            <p class="text-[10px] text-[#667085] mt-0.5">Pax Affected</p>
          </div>
        </div>
        <div class="space-y-2">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-[#667085]">Agent Guidance</p>
          <ul class="space-y-1.5 text-[12px] text-[#344054] leading-relaxed">
            <li class="flex items-start gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#DC2626]"></span>Prioritize travelers with medical needs, unaccompanied minors, and visa-sensitive passengers</li>
            <li class="flex items-start gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F59E0B]"></span>Connecting itineraries through ORD and DFW have the best alternate availability — route there first</li>
            <li class="flex items-start gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3B82F6]"></span>Voyager has authorized automatic rebooking for Diamond and Platinum members — confirm before proceeding for others</li>
            <li class="flex items-start gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3B82F6]"></span>Next expected departure window: tomorrow 10:00 AM CST (pending de-icing ops resumption)</li>
          </ul>
        </div>
      </div>`,
  },
  {
    id: "hotel-accommodation-crisis",
    summary:
      "Airport-area hotel availability has dropped to 2%. Voyager partner hotels are fully booked within a 15-mile radius of MSP. Agents should offer hotel vouchers for properties in Bloomington and Eagan before they fill completely.",
    modalTitle: "Hotel Availability Crisis — MSP Area",
    severity: "high",
    updatedAt: "Today · 8:30 AM CST",
    modalBody: `
      <div class="space-y-4">
        <div class="rounded-lg border border-[#FEF3C7] bg-[#FFFBEB] p-3">
          <p class="text-[12px] font-semibold text-[#92400E] mb-1">Accommodation Alert</p>
          <p class="text-[12px] text-[#78350F] leading-relaxed">With 84,000+ travelers stranded, hotel capacity near MSP has been almost entirely consumed. Voyager's partner hotel block is exhausted. Agents must be proactive in securing remaining rooms.</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-3">
            <p class="text-[11px] font-semibold text-[#344054] mb-2">Partner Hotel Status</p>
            <div class="space-y-1.5">
              <div class="flex justify-between text-[11px]"><span class="text-[#667085]">Hilton MSP</span><span class="font-semibold text-[#DC2626]">FULL</span></div>
              <div class="flex justify-between text-[11px]"><span class="text-[#667085]">Marriott Airport</span><span class="font-semibold text-[#DC2626]">FULL</span></div>
              <div class="flex justify-between text-[11px]"><span class="text-[#667085]">Hyatt Bloomington</span><span class="font-semibold text-[#F59E0B]">3 rooms</span></div>
              <div class="flex justify-between text-[11px]"><span class="text-[#667085]">Embassy Eagan</span><span class="font-semibold text-[#F59E0B]">7 rooms</span></div>
              <div class="flex justify-between text-[11px]"><span class="text-[#667085]">Holiday Inn Richfield</span><span class="font-semibold text-[#16A34A]">12 rooms</span></div>
            </div>
          </div>
          <div class="rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-3">
            <p class="text-[11px] font-semibold text-[#344054] mb-2">Voucher Authorization</p>
            <div class="space-y-1.5 text-[11px] text-[#344054] leading-relaxed">
              <p><span class="font-semibold">Diamond/Platinum:</span> Auto-approved up to $250/night</p>
              <p><span class="font-semibold">Gold/Silver:</span> Approved up to $180/night</p>
              <p><span class="font-semibold">Standard:</span> Requires supervisor approval above $120/night</p>
              <p class="text-[#667085] mt-2">Families with children under 5 and medically vulnerable travelers are pre-approved at the Diamond rate regardless of tier.</p>
            </div>
          </div>
        </div>
        <div class="space-y-2">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-[#667085]">Recommendations</p>
          <ul class="space-y-1.5 text-[12px] text-[#344054] leading-relaxed">
            <li class="flex items-start gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F59E0B]"></span>Issue vouchers immediately — do not wait for customer to ask. Remaining rooms will fill within hours</li>
            <li class="flex items-start gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3B82F6]"></span>For sold-out areas, suggest extended-stay properties in Maple Grove and Plymouth (25 min from MSP)</li>
            <li class="flex items-start gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3B82F6]"></span>Coordinate with ground transport for shuttle service to off-airport hotels</li>
          </ul>
        </div>
      </div>`,
  },
  {
    id: "customer-sentiment-shift",
    summary:
      "Negative sentiment in inbound messages has spiked to 73% (up from a baseline of 22%). Travelers stranded 8+ hours are showing the highest frustration. Lead with empathy and offer proactive compensation before customers request it.",
    modalTitle: "Customer Sentiment Alert — Snow Storm Impact",
    severity: "high",
    updatedAt: "Today · 9:00 AM CST",
    modalBody: `
      <div class="space-y-4">
        <div class="rounded-lg border border-[#FEF3C7] bg-[#FFFBEB] p-3">
          <p class="text-[12px] font-semibold text-[#92400E] mb-1">Sentiment Analysis</p>
          <p class="text-[12px] text-[#78350F] leading-relaxed">Real-time NLP analysis of inbound customer messages shows a dramatic shift toward negative sentiment, correlating with hours stranded. Proactive outreach and compensation authorization has been expanded.</p>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div class="rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-3 text-center">
            <p class="text-[20px] font-bold text-[#DC2626]">73%</p>
            <p class="text-[10px] text-[#667085] mt-0.5">Negative Sentiment</p>
          </div>
          <div class="rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-3 text-center">
            <p class="text-[20px] font-bold text-[#F59E0B]">18%</p>
            <p class="text-[10px] text-[#667085] mt-0.5">Neutral</p>
          </div>
          <div class="rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-3 text-center">
            <p class="text-[20px] font-bold text-[#16A34A]">9%</p>
            <p class="text-[10px] text-[#667085] mt-0.5">Positive</p>
          </div>
        </div>
        <div class="rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-3">
          <p class="text-[11px] font-semibold text-[#344054] mb-2">Frustration Drivers (by mention frequency)</p>
          <div class="space-y-2">
            <div><div class="flex justify-between text-[11px] mb-0.5"><span class="text-[#667085]">Wait time / no updates</span><span class="font-semibold text-[#344054]">41%</span></div><div class="h-1.5 w-full rounded-full bg-[#E4E7EC]"><div class="h-1.5 rounded-full bg-[#DC2626]" style="width:41%"></div></div></div>
            <div><div class="flex justify-between text-[11px] mb-0.5"><span class="text-[#667085]">No hotel / accommodation</span><span class="font-semibold text-[#344054]">28%</span></div><div class="h-1.5 w-full rounded-full bg-[#E4E7EC]"><div class="h-1.5 rounded-full bg-[#F59E0B]" style="width:28%"></div></div></div>
            <div><div class="flex justify-between text-[11px] mb-0.5"><span class="text-[#667085]">Missed connections</span><span class="font-semibold text-[#344054]">18%</span></div><div class="h-1.5 w-full rounded-full bg-[#E4E7EC]"><div class="h-1.5 rounded-full bg-[#3B82F6]" style="width:18%"></div></div></div>
            <div><div class="flex justify-between text-[11px] mb-0.5"><span class="text-[#667085]">Baggage separated</span><span class="font-semibold text-[#344054]">13%</span></div><div class="h-1.5 w-full rounded-full bg-[#E4E7EC]"><div class="h-1.5 rounded-full bg-[#8B5CF6]" style="width:13%"></div></div></div>
          </div>
        </div>
        <div class="space-y-2">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-[#667085]">Agent Guidance</p>
          <ul class="space-y-1.5 text-[12px] text-[#344054] leading-relaxed">
            <li class="flex items-start gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#DC2626]"></span>Lead every interaction with acknowledgment of the disruption — do not wait for the customer to explain</li>
            <li class="flex items-start gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F59E0B]"></span>Proactively offer meal vouchers for anyone stranded 4+ hours, hotel vouchers for 8+ hours</li>
            <li class="flex items-start gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3B82F6]"></span>Goodwill credits of $25–$50 are pre-authorized for all impacted travelers — use discretion</li>
          </ul>
        </div>
      </div>`,
  },
  {
    id: "baggage-separation-wave",
    summary:
      "Baggage separation incidents have increased 580% since 04:00 CST. Snow storm rebookings are routing passengers through alternate hubs but checked luggage is not following. Initiate proactive baggage traces for all rebooked passengers.",
    modalTitle: "Baggage Separation Wave — Rerouted Passengers",
    severity: "moderate",
    updatedAt: "Today · 9:30 AM CST",
    modalBody: `
      <div class="space-y-4">
        <div class="rounded-lg border border-[#DBEAFE] bg-[#EFF6FF] p-3">
          <p class="text-[12px] font-semibold text-[#1E40AF] mb-1">Baggage Operations Alert</p>
          <p class="text-[12px] text-[#1E3A8A] leading-relaxed">When passengers are rerouted through alternate hubs, interlined and checked baggage often remains on the original routing. The snow storm has created a massive backlog of separated bags at MSP and downstream hubs.</p>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div class="rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-3 text-center">
            <p class="text-[20px] font-bold text-[#DC2626]">347</p>
            <p class="text-[10px] text-[#667085] mt-0.5">Bags Separated</p>
          </div>
          <div class="rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-3 text-center">
            <p class="text-[20px] font-bold text-[#F59E0B]">89</p>
            <p class="text-[10px] text-[#667085] mt-0.5">Traces Active</p>
          </div>
          <div class="rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-3 text-center">
            <p class="text-[20px] font-bold text-[#16A34A]">42</p>
            <p class="text-[10px] text-[#667085] mt-0.5">Reunited Today</p>
          </div>
        </div>
        <div class="space-y-2">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-[#667085]">Hotspot Airports</p>
          <div class="rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-3">
            <div class="space-y-1.5">
              <div class="flex justify-between text-[11px]"><span class="text-[#667085]">MSP — bags still on ground</span><span class="font-semibold text-[#DC2626]">168 bags</span></div>
              <div class="flex justify-between text-[11px]"><span class="text-[#667085]">ORD — interline backlog</span><span class="font-semibold text-[#F59E0B]">74 bags</span></div>
              <div class="flex justify-between text-[11px]"><span class="text-[#667085]">DTW — rerouted overflow</span><span class="font-semibold text-[#F59E0B]">52 bags</span></div>
              <div class="flex justify-between text-[11px]"><span class="text-[#667085]">DFW — delayed transfers</span><span class="font-semibold text-[#3B82F6]">31 bags</span></div>
              <div class="flex justify-between text-[11px]"><span class="text-[#667085]">JFK — international connections</span><span class="font-semibold text-[#3B82F6]">22 bags</span></div>
            </div>
          </div>
        </div>
        <div class="space-y-2">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-[#667085]">Agent Guidance</p>
          <ul class="space-y-1.5 text-[12px] text-[#344054] leading-relaxed">
            <li class="flex items-start gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#DC2626]"></span>For any rebooked passenger — proactively ask about checked bags and initiate a trace if the routing changed</li>
            <li class="flex items-start gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#DC2626]"></span>Bags containing medication: flag as PRIORITY in the trace system and escalate to baggage ops lead</li>
            <li class="flex items-start gap-2"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3B82F6]"></span>Estimated bag reunion for MSP-stranded bags: 24–48 hours once operations resume</li>
          </ul>
        </div>
      </div>`,
  },
];
