import { ClipboardList, GripHorizontal } from "lucide-react";

export default function Desk() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData("text/plain", "Desk");
          event.dataTransfer.effectAllowed = "move";
        }}
        className="flex cursor-grab items-start justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
      >
        <div className="flex items-start gap-3">
          <GripHorizontal className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight text-[#333333]">Desk</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Desk</h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          Manage assigned work, case queues, and agent handoffs from a dedicated desk workspace.
        </p>
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-sm font-medium text-primary">
          You can continue prompting to build this page out next!
        </div>
      </div>
    </div>
  );
}
