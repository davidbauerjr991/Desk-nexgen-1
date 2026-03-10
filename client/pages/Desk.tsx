import { ClipboardList } from "lucide-react";
import Placeholder from "./Placeholder";

export default function Desk() {
  return (
    <Placeholder
      title="Desk"
      description="Manage assigned work, case queues, and agent handoffs from a dedicated desk workspace."
      icon={ClipboardList}
    />
  );
}
