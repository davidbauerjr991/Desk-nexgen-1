import { useMemo, useState } from "react";
import { ArrowUpRight, Bot, Clock3, GripVertical, Sparkles, Ticket } from "lucide-react";
import { Responsive, WidthProvider, type ResponsiveLayouts } from "react-grid-layout/legacy";

import { CustomerOverviewCard } from "@/components/CustomerInfoPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const ResponsiveGridLayout = WidthProvider(Responsive);

const overviewSummaryBullets = [
  "Billing mismatch and zip-code verification triggered the latest payment block during the upgrade attempt.",
  "Customer shows strong product intent and remains engaged across SMS, chat, and email despite repeated failures.",
  "Best next action is to confirm the hold is cleared, guide a fresh retry, and monitor for one more payment event.",
];

const overviewTimeline = [
  {
    id: 1,
    title: "Upgrade retry blocked",
    timestamp: "Today · 10:26 AM",
    detail: "Card was declined again after billing verification failed on the Pro upgrade flow.",
    tone: "critical",
  },
  {
    id: 2,
    title: "Agent responded on SMS",
    timestamp: "Today · 10:25 AM",
    detail: "Agent acknowledged the issue and started reviewing payment security flags.",
    tone: "info",
  },
  {
    id: 3,
    title: "Customer opened live chat",
    timestamp: "Today · 10:24 AM",
    detail: "Customer reported the checkout failure from the pricing page and requested immediate help.",
    tone: "default",
  },
  {
    id: 4,
    title: "Security rule triggered",
    timestamp: "Today · 10:23 AM",
    detail: "Fraud rule flagged a mismatch between billing zip and stored payment profile details.",
    tone: "warning",
  },
];

const recentTickets = [
  {
    id: "TCK-2091",
    title: "Pro plan upgrade blocked by billing mismatch",
    status: "Open",
    priority: "High",
    updatedAt: "2 min ago",
  },
  {
    id: "TCK-1984",
    title: "Payment profile review requested",
    status: "Pending",
    priority: "Medium",
    updatedAt: "Yesterday",
  },
  {
    id: "TCK-1877",
    title: "Subscription renewal confirmation",
    status: "Resolved",
    priority: "Low",
    updatedAt: "Mar 6",
  },
  {
    id: "TCK-1812",
    title: "Two-factor code delivery issue",
    status: "Resolved",
    priority: "Medium",
    updatedAt: "Mar 1",
  },
  {
    id: "TCK-1759",
    title: "Invoice address correction",
    status: "Closed",
    priority: "Low",
    updatedAt: "Feb 21",
  },
];

const defaultLayouts: ResponsiveLayouts = {
  lg: [
    { i: "summary", x: 0, y: 0, w: 2, h: 6 },
    { i: "overview", x: 0, y: 6, w: 1, h: 5 },
    { i: "timeline", x: 1, y: 6, w: 1, h: 5 },
    { i: "tickets", x: 0, y: 11, w: 2, h: 5 },
  ],
  md: [
    { i: "summary", x: 0, y: 0, w: 2, h: 6 },
    { i: "overview", x: 0, y: 6, w: 1, h: 5 },
    { i: "timeline", x: 1, y: 6, w: 1, h: 5 },
    { i: "tickets", x: 0, y: 11, w: 2, h: 5 },
  ],
  sm: [
    { i: "summary", x: 0, y: 0, w: 1, h: 6 },
    { i: "overview", x: 0, y: 6, w: 1, h: 5 },
    { i: "timeline", x: 0, y: 11, w: 1, h: 5 },
    { i: "tickets", x: 0, y: 16, w: 1, h: 5 },
  ],
};

function DashboardCard({
  title,
  subtitle,
  icon,
  children,
  bodyClassName,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="overview-card-handle flex cursor-grab items-start justify-between gap-3 border-b border-black/10 px-4 py-3 active:cursor-grabbing">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold tracking-tight text-[#333333]">{title}</div>
          {subtitle ? <div className="mt-0.5 text-[11px] text-[#6B7280]">{subtitle}</div> : null}
        </div>
        <div className="flex items-center gap-2 text-[#7A7A7A]">
          {icon}
          <GripVertical className="h-4 w-4 flex-shrink-0" />
        </div>
      </div>
      <div className={cn("min-h-0 flex-1 overflow-hidden", bodyClassName)}>{children}</div>
    </div>
  );
}

function OverviewSummaryCard() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#D9CCFF] bg-[linear-gradient(135deg,#FCFAFF_0%,#F7F3FF_100%)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="overview-card-handle flex cursor-grab items-start justify-between gap-3 border-b border-[#E9DFFF] px-4 py-3 active:cursor-grabbing">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E9DFFF] bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6E00FD]">
            <Sparkles className="h-3.5 w-3.5" />
            AI Auto Summary
          </div>
          <h3 className="mt-3 text-base font-semibold tracking-tight text-[#1F2937]">
            Alex is likely to convert if the billing hold is cleared in-session.
          </h3>
          <p className="mt-2 max-w-xl text-[13px] leading-5 text-[#6B7280]">
            The account shows healthy payment history and repeated intent to upgrade. Current friction is operational rather than churn-related.
          </p>
        </div>
        <GripVertical className="mt-1 h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
      </div>

      <div className="grid gap-3 px-4 py-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
          <div className="text-[10px] font-medium uppercase tracking-wide text-[#8B5CF6]">Intent</div>
          <div className="mt-1 text-[13px] font-semibold text-[#1F2937]">High to upgrade</div>
        </div>
        <div className="rounded-xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
          <div className="text-[10px] font-medium uppercase tracking-wide text-[#8B5CF6]">Risk</div>
          <div className="mt-1 text-[13px] font-semibold text-[#1F2937]">Medium friction</div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 border-t border-[#E9DFFF] bg-white/60 px-4 py-3 md:grid-cols-2 xl:grid-cols-3">
        {overviewSummaryBullets.map((item) => (
          <div
            key={item}
            className="rounded-xl border border-white bg-white px-4 py-3 text-[13px] leading-5 text-[#4B5563] shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#6E00FD]">
              <Bot className="h-3.5 w-3.5" />
              Insight
            </div>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewCard() {
  return (
    <DashboardCard title="Overview" subtitle="Customer profile snapshot">
      <ScrollArea className="h-full w-full">
        <div className="p-3">
          <CustomerOverviewCard />
        </div>
      </ScrollArea>
    </DashboardCard>
  );
}

function TimelineCard() {
  return (
    <DashboardCard title="Interaction timeline" subtitle="Latest events across channels" icon={<Clock3 className="h-4 w-4" />}>
      <ScrollArea className="h-full w-full">
        <div className="space-y-4 p-4">
          {overviewTimeline.map((item, index) => (
            <div key={item.id} className="relative flex gap-3 pl-6">
              {index < overviewTimeline.length - 1 ? (
                <span className="absolute left-[7px] top-6 h-[calc(100%+8px)] w-px bg-black/10" />
              ) : null}
              <span
                className={cn(
                  "absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm",
                  item.tone === "critical" && "bg-[#F04438]",
                  item.tone === "warning" && "bg-[#F59E0B]",
                  item.tone === "info" && "bg-[#6E00FD]",
                  item.tone === "default" && "bg-[#CBD5E1]",
                )}
              />
              <div className="min-w-0 rounded-xl bg-[#F8F8F9] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[13px] font-semibold text-[#333333]">{item.title}</div>
                  <div className="text-[11px] text-[#6B7280]">{item.timestamp}</div>
                </div>
                <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </DashboardCard>
  );
}

function TicketsCard() {
  return (
    <DashboardCard title="Last 5 tickets" subtitle="Recent customer support cases" icon={<Ticket className="h-4 w-4" />}>
      <ScrollArea className="h-full w-full">
        <div className="space-y-2 p-4">
          {recentTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-xl border border-black/[0.06] bg-[#FCFCFD] px-4 py-3 transition-colors hover:border-[#D9CCFF] hover:bg-[#FCFAFF]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6E00FD]">{ticket.id}</span>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                        ticket.status === "Open" && "border-[#FECACA] bg-[#FEF2F2] text-[#B42318]",
                        ticket.status === "Pending" && "border-[#FEDF89] bg-[#FFFAEB] text-[#B54708]",
                        ticket.status === "Resolved" && "border-[#ABEFC6] bg-[#ECFDF3] text-[#067647]",
                        ticket.status === "Closed" && "border-black/10 bg-white text-[#6B7280]",
                      )}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <div className="mt-1 text-[13px] font-medium text-[#333333]">{ticket.title}</div>
                  <div className="mt-1 text-[11px] text-[#6B7280]">Priority: {ticket.priority} · Updated {ticket.updatedAt}</div>
                </div>
                <ArrowUpRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#9CA3AF]" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </DashboardCard>
  );
}

export default function OverviewDashboard() {
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(defaultLayouts);

  const cards = useMemo(
    () => ({
      summary: <OverviewSummaryCard />,
      overview: <OverviewCard />,
      timeline: <TimelineCard />,
      tickets: <TicketsCard />,
    }),
    [],
  );

  const orderedItems = useMemo(() => ["summary", "overview", "timeline", "tickets"], []);

  return (
    <div className="pb-4">
      <ResponsiveGridLayout
        className="overview-grid-layout"
        layouts={layouts}
        breakpoints={{ lg: 960, md: 640, sm: 0 }}
        cols={{ lg: 2, md: 2, sm: 1 }}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        rowHeight={72}
        isResizable={false}
        draggableHandle=".overview-card-handle"
        compactType="vertical"
        onLayoutChange={(_, allLayouts) =>
          setLayouts((current) => ({
            ...current,
            ...allLayouts,
          }))
        }
      >
        {orderedItems.map((item) => (
          <div key={item} className="min-h-0">
            {cards[item as keyof typeof cards]}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
