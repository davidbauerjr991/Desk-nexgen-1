import { useMemo, useState } from "react";
import { ArrowUpRight, Clock3, GripVertical, Ticket } from "lucide-react";
import { Responsive, WidthProvider, type ResponsiveLayouts } from "react-grid-layout/legacy";

import { CustomerOverviewCard } from "@/components/CustomerInfoPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getRandomizedCustomerInteractionTimeline } from "@/lib/customer-database";
import { cn } from "@/lib/utils";

const ResponsiveGridLayout = WidthProvider(Responsive);

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
    { i: "overview", x: 0, y: 0, w: 1, h: 5, minW: 1, maxW: 2, minH: 5 },
    { i: "timeline", x: 1, y: 0, w: 1, h: 5, minW: 1, maxW: 2, minH: 5 },
    { i: "tickets", x: 0, y: 5, w: 2, h: 5, minW: 1, maxW: 2, minH: 5 },
  ],
  md: [
    { i: "overview", x: 0, y: 0, w: 1, h: 5, minW: 1, maxW: 2, minH: 5 },
    { i: "timeline", x: 1, y: 0, w: 1, h: 5, minW: 1, maxW: 2, minH: 5 },
    { i: "tickets", x: 0, y: 5, w: 2, h: 5, minW: 1, maxW: 2, minH: 5 },
  ],
  sm: [
    { i: "overview", x: 0, y: 0, w: 1, h: 5, minW: 1, maxW: 1, minH: 5 },
    { i: "timeline", x: 0, y: 5, w: 1, h: 5, minW: 1, maxW: 1, minH: 5 },
    { i: "tickets", x: 0, y: 10, w: 1, h: 5, minW: 1, maxW: 1, minH: 5 },
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

function OverviewCard({ customerId }: { customerId: string }) {
  return (
    <DashboardCard title="Overview" subtitle="Customer profile snapshot">
      <ScrollArea className="h-full w-full">
        <div className="p-3">
          <CustomerOverviewCard customerId={customerId} />
        </div>
      </ScrollArea>
    </DashboardCard>
  );
}

function TimelineCard({ customerId }: { customerId: string }) {
  const timelineItems = useMemo(() => getRandomizedCustomerInteractionTimeline(customerId), [customerId]);

  return (
    <DashboardCard title="Interaction timeline" subtitle="Latest events across channels" icon={<Clock3 className="h-4 w-4" />}>
      <ScrollArea className="h-full w-full">
        <div className="space-y-4 p-4">
          {timelineItems.map((item, index) => (
            <div key={item.id} className="relative flex gap-3 pl-6">
              {index < timelineItems.length - 1 ? (
                <span className="absolute left-[7px] top-6 h-[calc(100%+8px)] w-px bg-black/10" />
              ) : null}
              <span
                className={cn(
                  "absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm",
                  item.tone === "critical" && "bg-[#F04438]",
                  item.tone === "warning" && "bg-[#F59E0B]",
                  item.tone === "info" && "bg-[#006DAD]",
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
              className="rounded-xl border border-black/[0.06] bg-[#FCFCFD] px-4 py-3 transition-colors hover:border-[#B8D7F0] hover:bg-[#EEF6FC]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#006DAD]">{ticket.id}</span>
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

export default function OverviewDashboard({ customerId }: { customerId: string }) {
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(defaultLayouts);

  const cards = useMemo(
    () => ({
      overview: <OverviewCard customerId={customerId} />,
      timeline: <TimelineCard customerId={customerId} />,
      tickets: <TicketsCard />,
    }),
    [customerId],
  );

  const orderedItems = useMemo(() => ["overview", "timeline", "tickets"], []);

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
        isResizable
        resizeHandles={["e", "w", "s", "se", "sw"]}
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
