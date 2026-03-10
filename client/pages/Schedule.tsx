import { CalendarDays } from "lucide-react";
import Placeholder from "./Placeholder";

export default function Schedule() {
  return (
    <Placeholder
      title="Schedule"
      description="Review shifts, breaks, and upcoming commitments in a dedicated scheduling view."
      icon={CalendarDays}
    />
  );
}
