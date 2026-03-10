import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Send,
  Paperclip,
  MoreVertical,
  PhoneCall,
  FileText,
  History,
  Mail,
  Clock,
  X,
  CheckCircle2,
  ArrowRightLeft,
  Pause,
  PhoneOff,
  GripHorizontal,
  AlertTriangle,
  Mic,
  Volume2,
  ChevronDown,
  MessageCircle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useLayoutContext } from "@/components/Layout";
import { toast } from "sonner";
import NotesPanel, { NOTES_PANEL_MENU_ITEMS } from "@/components/NotesPanel";
import RecentInteractionsPanel from "@/components/RecentInteractionsPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ChannelType = "chat" | "sms" | "whatsapp" | "email";
type AddNewType = "customer" | "account" | "ticket" | "work-item";

type ConversationMessage = {
  id: number;
  role: "customer" | "agent";
  content: string;
  time: string;
  sentiment?: "frustrated";
};

const conversationsByChannel: Record<
  ChannelType,
  {
    label: string;
    timelineLabel: string;
    draft: string;
    messages: ConversationMessage[];
  }
> = {
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
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 3.25C7.163 3.25 3.25 7.119 3.25 11.882C3.25 13.549 3.734 15.149 4.638 16.529L3.75 20.75L8.097 19.9C9.406 20.647 10.898 21.042 12.421 21.042C17.258 21.042 21.171 17.172 21.171 12.41C21.171 7.647 16.837 3.25 12 3.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.428 8.867C9.206 8.373 8.97 8.362 8.761 8.354C8.59 8.347 8.394 8.347 8.198 8.347C8.002 8.347 7.683 8.421 7.413 8.715C7.143 9.009 6.389 9.703 6.389 11.117C6.389 12.531 7.438 13.897 7.585 14.093C7.732 14.289 9.634 17.287 12.611 18.437C15.086 19.392 15.589 19.203 16.123 19.154C16.657 19.105 17.839 18.485 18.084 17.815C18.329 17.144 18.329 16.566 18.255 16.444C18.182 16.321 17.986 16.248 17.692 16.101C17.397 15.954 15.957 15.235 15.687 15.137C15.417 15.039 15.22 14.99 15.024 15.284C14.828 15.578 14.27 16.248 14.098 16.444C13.926 16.64 13.754 16.665 13.459 16.518C13.165 16.37 12.218 16.061 11.095 15.059C10.221 14.28 9.632 13.319 9.46 13.025C9.289 12.731 9.442 12.571 9.589 12.424C9.722 12.292 9.883 12.081 10.03 11.91C10.177 11.738 10.226 11.615 10.324 11.419C10.422 11.223 10.373 11.052 10.299 10.905C10.226 10.758 9.679 9.312 9.428 8.867Z"
        fill="currentColor"
      />
    </svg>
  );
}

type CallPopunderPosition = {
  x: number;
  y: number;
};

type CallPopunderMode = "setup" | "controls" | "disposition";

const CALL_POPUNDER_WIDTH = 272;
const CALL_POPUNDER_MARGIN = 16;
const CALL_POPUNDER_GAP = 12;
const CALL_DISPOSITION_OPTIONS = ["Resolved", "Escalated", "Follow-up needed"] as const;

function ChannelToggleButton({
  channel,
  activeChannel,
  onClick,
}: {
  channel: ChannelType;
  activeChannel: ChannelType | null;
  onClick: () => void;
}) {
  const isActive = activeChannel === channel;
  const commonClassName = cn(
    "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
    isActive
      ? "border-[#D9CCFF] bg-[#F3ECFF] text-[#6E00FD]"
      : "border-black/10 bg-white text-[#7A7A7A] hover:border-[#D9CCFF] hover:text-[#6E00FD]",
  );

  if (channel === "chat") {
    return (
      <button type="button" onClick={onClick} className={commonClassName} aria-label="Show chat conversation" aria-pressed={isActive}>
        <MessageCircle className="h-4 w-4 stroke-[1.8]" />
      </button>
    );
  }

  if (channel === "sms") {
    return (
      <button type="button" onClick={onClick} className={commonClassName} aria-label="Show SMS conversation" aria-pressed={isActive}>
        <MessageSquare className="h-4 w-4 stroke-[1.8]" />
      </button>
    );
  }

  if (channel === "whatsapp") {
    return (
      <button type="button" onClick={onClick} className={commonClassName} aria-label="Show WhatsApp conversation" aria-pressed={isActive}>
        <WhatsAppIcon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button type="button" onClick={onClick} className={commonClassName} aria-label="Show email conversation" aria-pressed={isActive}>
      <Mail className="h-4 w-4 stroke-[1.8]" />
    </button>
  );
}

function CallControlsPopunder({
  position,
  mode,
  onPositionChange,
  onClose,
  onLaunchCall,
  onEndCall,
  onSelectDisposition,
}: {
  position: CallPopunderPosition;
  mode: CallPopunderMode;
  onPositionChange: (position: CallPopunderPosition) => void;
  onClose: () => void;
  onLaunchCall: () => void;
  onEndCall: () => void;
  onSelectDisposition: (disposition: (typeof CALL_DISPOSITION_OPTIONS)[number]) => void;
}) {
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(true);
  const [audioLevels, setAudioLevels] = useState({ mic: 42, speaker: 58 });

  useEffect(() => {
    if (mode !== "setup") {
      setIsTestingAudio(false);
      return;
    }

    if (!isTestingAudio) return;

    const intervalId = window.setInterval(() => {
      setAudioLevels({
        mic: 20 + Math.round(Math.random() * 70),
        speaker: 25 + Math.round(Math.random() * 65),
      });
    }, 350);

    return () => window.clearInterval(intervalId);
  }, [isTestingAudio, mode]);

  useEffect(() => {
    setIsTranscriptExpanded(mode === "controls");
  }, [mode]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const height =
        mode === "setup"
          ? 320
          : mode === "controls"
            ? isTranscriptExpanded
              ? 332
              : 228
            : 284;
      const nextX = event.clientX - dragOffsetRef.current.x;
      const nextY = event.clientY - dragOffsetRef.current.y;

      onPositionChange({
        x: Math.min(
          Math.max(CALL_POPUNDER_MARGIN, nextX),
          window.innerWidth - CALL_POPUNDER_WIDTH - CALL_POPUNDER_MARGIN,
        ),
        y: Math.min(
          Math.max(CALL_POPUNDER_MARGIN, nextY),
          window.innerHeight - height - CALL_POPUNDER_MARGIN,
        ),
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [isTranscriptExpanded, mode, onPositionChange]);

  return (
    <div
      className="fixed z-[70] w-[272px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
      style={{ left: position.x, top: position.y }}
    >
      <div
        className={cn(
          "flex cursor-grab items-center border-b border-black/10 bg-[#F8F8F9] px-3 py-2 active:cursor-grabbing",
          mode === "setup" ? "justify-between" : "justify-start",
        )}
        onMouseDown={(event) => {
          const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
          if (!bounds) return;

          isDraggingRef.current = true;
          dragOffsetRef.current = {
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-[#333333]">
          <GripHorizontal className="h-4 w-4 text-[#7A7A7A]" />
          {mode === "setup" ? "Start Call" : mode === "controls" ? "Active Call" : "Disposition"}
        </div>
        {mode === "setup" && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333]"
            aria-label="Close call controls"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-2 p-3">
        {mode === "setup" ? (
          <>
            <div className="space-y-1">
              <label htmlFor="call-account-number" className="text-xs font-medium text-[#333333]">
                Account Number
              </label>
              <Input
                id="call-account-number"
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value)}
                placeholder="Enter account number"
                className="h-9 border-black/10 text-sm"
              />
            </div>

            <div className="space-y-2 rounded-xl border border-black/10 bg-[#F8F8F9] p-3">
              <div className="flex items-center justify-between gap-3 text-sm text-[#333333]">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-[#7A7A7A]" />
                  <span>Microphone volume</span>
                </div>
                <span className="text-xs text-[#7A7A7A]">{audioLevels.mic}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/10">
                <div className="h-full rounded-full bg-[#6E00FD] transition-[width] duration-300" style={{ width: `${audioLevels.mic}%` }} />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1 text-sm text-[#333333]">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-[#7A7A7A]" />
                  <span>Speaker volume</span>
                </div>
                <span className="text-xs text-[#7A7A7A]">{audioLevels.speaker}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/10">
                <div className="h-full rounded-full bg-[#6E00FD] transition-[width] duration-300" style={{ width: `${audioLevels.speaker}%` }} />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTestingAudio((current) => !current)}
                className="mt-1 w-full justify-center border-black/10 text-[#333333]"
              >
                {isTestingAudio ? "Stop Test" : "Test Audio"}
              </Button>
            </div>

            <Button
              type="button"
              onClick={onLaunchCall}
              disabled={!accountNumber.trim()}
              className="w-full bg-[#16A34A] text-white hover:bg-[#15803D]"
            >
              Launch Call
            </Button>
          </>
        ) : mode === "controls" ? (
          <>
            <div className="flex items-stretch gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-auto flex-1 flex-col gap-1 border-black/10 px-2 py-2 text-[11px] text-[#333333]"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Transfer
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-auto flex-1 flex-col gap-1 border-black/10 px-2 py-2 text-[11px] text-[#333333]"
              >
                <Pause className="h-4 w-4" />
                Hold
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onEndCall}
                className="h-auto flex-1 flex-col gap-1 border-[#F04438]/20 px-2 py-2 text-[11px] text-[#F04438] hover:bg-[#FFF5F5] hover:text-[#F04438]"
              >
                <PhoneOff className="h-4 w-4" />
                End Call
              </Button>
            </div>

            <div className="rounded-xl border border-black/10 bg-white">
              <button
                type="button"
                onClick={() => setIsTranscriptExpanded((current) => !current)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-[#333333]"
              >
                <span>Transcript</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-[#7A7A7A] transition-transform",
                    isTranscriptExpanded && "rotate-180",
                  )}
                />
              </button>

              {isTranscriptExpanded && (
                <div className="border-t border-black/10 px-3 py-2 text-xs leading-5 text-[#333333]">
                  <p>Agent: Thank you for calling. I have your account open now.</p>
                  <p className="mt-2 text-[#7A7A7A]">
                    Customer: I need help getting my subscription upgraded today.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="text-xs leading-5 text-[#7A7A7A]">
              Select a disposition to complete the call.
            </p>
            {CALL_DISPOSITION_OPTIONS.map((option) => (
              <Button
                key={option}
                type="button"
                variant="outline"
                onClick={() => onSelectDisposition(option)}
                className="w-full justify-start border-black/10 text-[#333333]"
              >
                {option}
              </Button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

const addNewFieldConfig: Record<
  AddNewType,
  Array<{
    key: string;
    label: string;
    placeholder: string;
    type: "input" | "textarea";
  }>
> = {
  customer: [
    { key: "firstName", label: "First Name", placeholder: "Enter first name", type: "input" },
    { key: "lastName", label: "Last Name", placeholder: "Enter last name", type: "input" },
    { key: "email", label: "Email", placeholder: "name@example.com", type: "input" },
    { key: "phone", label: "Phone", placeholder: "(555) 123-4567", type: "input" },
    { key: "customerId", label: "Customer ID", placeholder: "CST-10482", type: "input" },
    { key: "notes", label: "Notes", placeholder: "Add customer notes", type: "textarea" },
  ],
  account: [
    { key: "accountName", label: "Account Name", placeholder: "Premier Account", type: "input" },
    { key: "accountNumber", label: "Account Number", placeholder: "ACC-20391", type: "input" },
    { key: "owner", label: "Owner", placeholder: "Alex Kowalski", type: "input" },
    { key: "status", label: "Status", placeholder: "Active", type: "input" },
    { key: "billingAddress", label: "Billing Address", placeholder: "Add billing address", type: "textarea" },
  ],
  ticket: [
    { key: "title", label: "Ticket Title", placeholder: "Payment mismatch preventing upgrade", type: "input" },
    { key: "priority", label: "Priority", placeholder: "High", type: "input" },
    { key: "category", label: "Category", placeholder: "Billing", type: "input" },
    { key: "customer", label: "Customer", placeholder: "Alex Kowalski", type: "input" },
    { key: "description", label: "Description", placeholder: "Describe the issue", type: "textarea" },
  ],
  "work-item": [
    { key: "name", label: "Work Item Name", placeholder: "Resolve billing mismatch", type: "input" },
    { key: "assignee", label: "Assignee", placeholder: "Jordan Doe", type: "input" },
    { key: "dueDate", label: "Due Date", placeholder: "03/15/26", type: "input" },
    { key: "relatedTo", label: "Related To", placeholder: "Ticket TCK-2091", type: "input" },
    { key: "details", label: "Details", placeholder: "Add work item details", type: "textarea" },
  ],
};

function AddNewPanel() {
  const [selectedType, setSelectedType] = useState<AddNewType>("customer");
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const fields = addNewFieldConfig[selectedType];
  const isSaveDisabled = fields.some((field) => !(formValues[field.key] ?? "").trim());

  const clearForm = () => {
    setFormValues({});
  };

  const handleSave = () => {
    if (isSaveDisabled) {
      return;
    }

    clearForm();
    toast.success("Customer Saved Successfully", {
      action: {
        label: "Open Record",
        onClick: () => undefined,
      },
    });
  };

  return (
    <>
      <div className="border-b border-border bg-background/50 px-5 py-4">
        <h3 className="text-sm font-semibold tracking-tight text-[#333333]">Add New</h3>
      </div>

      <ScrollArea className="flex-1 px-5 py-5">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">
              Item Type
            </label>
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as AddNewType)}>
              <SelectTrigger className="h-9 rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333333] focus:ring-1 focus:ring-[#6E00FD]/30 focus:ring-offset-0 focus:border-[#6E00FD]">
                <SelectValue placeholder="Select item type" />
              </SelectTrigger>
              <SelectContent className="rounded border border-[#E5E7EB] bg-white">
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="ticket">Ticket</SelectItem>
                <SelectItem value="work-item">Work Item</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <label className="block text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <Textarea
                    value={formValues[field.key] ?? ""}
                    onChange={(event) =>
                      setFormValues((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="min-h-[96px] rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333333] placeholder:text-transparent focus-visible:border-[#6E00FD] focus-visible:ring-1 focus-visible:ring-[#6E00FD]/30"
                  />
                ) : (
                  <Input
                    value={formValues[field.key] ?? ""}
                    onChange={(event) =>
                      setFormValues((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="h-9 rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333333] placeholder:text-transparent focus-visible:border-[#6E00FD] focus-visible:ring-1 focus-visible:ring-[#6E00FD]/30"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
        <Button type="button" variant="outline" className="rounded-xl" onClick={clearForm}>
          Cancel
        </Button>
        <Button
          type="button"
          className="rounded-xl bg-[#6E00FD] hover:bg-[#5B00D1] disabled:bg-[#D9CCFF] disabled:text-white"
          onClick={handleSave}
          disabled={isSaveDisabled}
        >
          Save
        </Button>
      </div>
    </>
  );
}

function DeskPanel() {
  return <NotesPanel notesOnly />;
}

export default function Index() {
  const {
    isDeskOpen,
    isInteractionsOpen,
    isAddNewOpen,
    isRightPanelOpen,
    closeRightPanel,
    isAgentAvailable,
    toggleDesk,
    toggleInteractions,
    startCallStatus,
    endCallStatus,
  } = useLayoutContext();
  const [activeChannel, setActiveChannel] = useState<ChannelType>("sms");
  const [isConversationPanelOpen, setIsConversationPanelOpen] = useState(true);
  const [isConversationPanelTransitioning, setIsConversationPanelTransitioning] = useState(false);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);
  const [mobileDetailsTab, setMobileDetailsTab] = useState("Details");
  const [isCallPopunderOpen, setIsCallPopunderOpen] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callPopunderMode, setCallPopunderMode] = useState<CallPopunderMode>("setup");
  const callButtonRef = useRef<HTMLButtonElement | null>(null);
  const conversationPanelInitializedRef = useRef(false);
  const [callPopunderPosition, setCallPopunderPosition] = useState<CallPopunderPosition>(() => {
    if (typeof window === "undefined") {
      return { x: 24, y: 24 };
    }

    return {
      x: Math.max(window.innerWidth - (CALL_POPUNDER_WIDTH + 24), CALL_POPUNDER_MARGIN),
      y: CALL_POPUNDER_MARGIN,
    };
  });
  const activeConversation = conversationsByChannel[activeChannel];

  const getAnchoredCallPopunderPosition = (): CallPopunderPosition => {
    if (typeof window === "undefined") {
      return { x: 24, y: 24 };
    }

    const buttonBounds = callButtonRef.current?.getBoundingClientRect();
    if (!buttonBounds) {
      return {
        x: Math.max(window.innerWidth - (CALL_POPUNDER_WIDTH + 24), CALL_POPUNDER_MARGIN),
        y: CALL_POPUNDER_MARGIN,
      };
    }

    return {
      x: Math.min(
        Math.max(CALL_POPUNDER_MARGIN, buttonBounds.right - CALL_POPUNDER_WIDTH),
        window.innerWidth - CALL_POPUNDER_WIDTH - CALL_POPUNDER_MARGIN,
      ),
      y: Math.max(CALL_POPUNDER_MARGIN, buttonBounds.bottom + CALL_POPUNDER_GAP),
    };
  };

  const openCallPopunder = () => {
    if (!isCallActive && isCallPopunderOpen) {
      closeCallPopunder();
      return;
    }

    setCallPopunderMode(isCallActive ? "controls" : "setup");
    setCallPopunderPosition(getAnchoredCallPopunderPosition());
    setIsCallPopunderOpen(true);
  };

  const closeCallPopunder = () => {
    setIsCallPopunderOpen(false);
    setCallPopunderMode(isCallActive ? "controls" : "setup");
  };

  useEffect(() => {
    if (!conversationPanelInitializedRef.current) {
      conversationPanelInitializedRef.current = true;
      return;
    }

    setIsConversationPanelTransitioning(true);
    const timeoutId = window.setTimeout(() => {
      setIsConversationPanelTransitioning(false);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [isConversationPanelOpen]);

  const handleChannelSelection = (channel: ChannelType) => {
    if (channel === activeChannel) {
      setIsConversationPanelOpen((current) => !current);
      return;
    }

    setActiveChannel(channel);
    setIsConversationPanelOpen(true);
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Main Interaction Area */}
      <div className="flex min-w-0 flex-1 flex-col bg-card">
        
        {/* Customer Context Banner */}
        <div className="flex items-start justify-between gap-3 border-b border-border bg-card/50 px-6 py-4">
          <div className="flex min-w-0 flex-1 items-start">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold tracking-tight">Alex Kowalski</h2>
                <div className="flex flex-wrap items-center gap-1.5">
                  <ChannelToggleButton
                    channel="chat"
                    activeChannel={isConversationPanelOpen ? activeChannel : null}
                    onClick={() => handleChannelSelection("chat")}
                  />
                  <ChannelToggleButton
                    channel="sms"
                    activeChannel={isConversationPanelOpen ? activeChannel : null}
                    onClick={() => handleChannelSelection("sms")}
                  />
                  <ChannelToggleButton
                    channel="whatsapp"
                    activeChannel={isConversationPanelOpen ? activeChannel : null}
                    onClick={() => handleChannelSelection("whatsapp")}
                  />
                  <ChannelToggleButton
                    channel="email"
                    activeChannel={isConversationPanelOpen ? activeChannel : null}
                    onClick={() => handleChannelSelection("email")}
                  />
                  <Button
                    ref={callButtonRef}
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full border-black/10 px-3"
                    onClick={openCallPopunder}
                    disabled={isCallActive || !isAgentAvailable}
                  >
                    <PhoneCall className="mr-2 h-4 w-4" /> Call
                  </Button>
                </div>
              </div>
              <div className="mt-1 flex flex-col gap-2 text-sm text-muted-foreground min-[800px]:flex-row min-[800px]:items-center min-[800px]:gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex min-w-0 items-start gap-1.5 leading-tight">
                    <Mail className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span className="break-words">alex.k@example.com</span>
                  </span>
                  <span className="flex items-start gap-1.5 leading-tight">
                    <Clock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span>Customer since 2021</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={isDeskOpen ? "Hide notes panel" : "Show notes panel"}
              aria-pressed={isDeskOpen}
              onClick={toggleDesk}
              className={cn(
                "hidden h-8 w-8 items-center justify-center rounded-full border transition-colors sm:flex",
                isDeskOpen
                  ? "border-[#D9CCFF] bg-[#F3ECFF] text-[#6E00FD]"
                  : "border-black/10 bg-white text-[#7A7A7A] hover:border-[#D9CCFF] hover:text-[#6E00FD]",
              )}
            >
              <FileText className="h-4 w-4 stroke-[1.8]" />
            </button>
            <button
              type="button"
              aria-label={isInteractionsOpen ? "Hide recent interactions" : "Show recent interactions"}
              aria-pressed={isInteractionsOpen}
              onClick={toggleInteractions}
              className={cn(
                "hidden h-8 w-8 items-center justify-center rounded-full border transition-colors sm:flex",
                isInteractionsOpen
                  ? "border-[#D9CCFF] bg-[#F3ECFF] text-[#6E00FD]"
                  : "border-black/10 bg-white text-[#7A7A7A] hover:border-[#D9CCFF] hover:text-[#6E00FD]",
              )}
            >
              <History className="h-4 w-4 stroke-[1.8]" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="min-[800px]:hidden">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="min-[800px]:hidden w-44 rounded-xl border border-black/10 bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
              >
                {NOTES_PANEL_MENU_ITEMS.map((item) => (
                  <DropdownMenuItem
                    key={item}
                    onSelect={() => {
                      setMobileDetailsTab(item);
                      setIsMobileDetailsOpen(true);
                    }}
                    className="rounded-lg px-3 py-2 text-sm text-[#333333] focus:bg-[#F8F8F9]"
                  >
                    {item}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content row: Conversation + Customer Data panels */}
        <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* Conversation column */}
          <div
            aria-hidden={!isConversationPanelOpen}
            className={cn(
              "flex w-full min-w-0 flex-col overflow-hidden transition-[max-width,opacity,transform,border-color] duration-300 ease-out",
              isConversationPanelOpen
                ? "max-w-full translate-x-0 opacity-100 min-[800px]:w-[420px] min-[800px]:max-w-[420px] min-[800px]:flex-shrink-0 min-[800px]:border-r min-[800px]:border-border"
                : "pointer-events-none max-w-0 -translate-x-4 opacity-0 min-[800px]:border-r min-[800px]:border-transparent",
            )}
          >
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col transition-opacity duration-150",
                isConversationPanelTransitioning && "pointer-events-none opacity-0",
              )}
            >
              {/* Chat Transcript */}
              <ScrollArea className="flex-1 p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center">
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">{activeConversation.timelineLabel}</span>
                </div>

                {activeConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[85%]",
                      msg.role === "agent" ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className="flex items-end gap-2 mb-1">
                      {msg.role === "customer" && (
                        <span className="text-xs font-medium text-muted-foreground ml-1">Alex</span>
                      )}
                      {msg.role === "agent" && (
                        <span className="text-xs font-medium text-muted-foreground mr-1">You</span>
                      )}
                    </div>
                    <div
                      className={cn(
                        "px-4 py-3 rounded-2xl text-sm shadow-sm",
                        msg.role === "agent"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground border border-border/50 rounded-bl-sm"
                      )}
                    >
                      {msg.content}
                    </div>
                    {msg.sentiment === "frustrated" && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-orange-500 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Frustrated sentiment detected
                      </div>
                    )}
                  </div>
                ))}

                {/* AI Real-time context indicator */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse delay-75"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse delay-150"></span>
                  </div>
                  <span>
                    NexAgent AI is analyzing the {activeConversation.label.toLowerCase()} conversation...
                  </span>
                </div>
              </div>
            </ScrollArea>

              {/* Input Area */}
              <div className="p-4 bg-background border-t border-border">
                <div className="flex gap-3 items-end relative">
                  <div className="absolute right-14 top-2 text-xs text-muted-foreground flex items-center gap-1 bg-background/80 backdrop-blur px-2 py-0.5 rounded-md border border-border">
                    <Sparkles className="w-3 h-3 text-primary" /> AI writing enabled
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 mb-1 h-10 w-10 text-muted-foreground hover:text-foreground">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <Textarea
                      key={activeChannel}
                      placeholder="Type your message..."
                      className="min-h-[60px] max-h-32 resize-none pr-12 pb-3 pt-3 rounded-xl focus-visible:ring-1"
                      defaultValue={activeConversation.draft}
                    />
                  </div>
                  <Button className="shrink-0 mb-1 h-10 w-10 rounded-xl" size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Data tabs */}
          <div
            className={cn(
              "flex-1 min-w-0 overflow-hidden",
              isConversationPanelOpen ? "hidden min-[800px]:block" : "block",
            )}
          >
            <div className="flex-1 min-w-0 overflow-hidden">
              <NotesPanel />
            </div>
          </div>

        </div>
      </div>

      {isCallPopunderOpen && (
        <CallControlsPopunder
          position={callPopunderPosition}
          mode={callPopunderMode}
          onPositionChange={setCallPopunderPosition}
          onClose={closeCallPopunder}
          onLaunchCall={() => {
            setIsCallActive(true);
            startCallStatus();
            setCallPopunderMode("controls");
          }}
          onEndCall={() => setCallPopunderMode("disposition")}
          onSelectDisposition={() => {
            setIsCallActive(false);
            endCallStatus();
            setIsCallPopunderOpen(false);
            setCallPopunderMode("setup");
          }}
        />
      )}

      {isMobileDetailsOpen && (
        <div className="absolute inset-0 z-40 animate-in fade-in-0 duration-200 min-[800px]:hidden">
          <button
            type="button"
            aria-label="Close customer details overlay"
            onClick={() => setIsMobileDetailsOpen(false)}
            className="absolute inset-0 bg-black/20 animate-in fade-in-0 duration-200"
          />
          <div className="absolute inset-x-4 top-4 bottom-4 flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-[#333333]">Customer Details</h3>
                <p className="text-xs text-[#7A7A7A]">{mobileDetailsTab}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileDetailsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <NotesPanel initialTab={mobileDetailsTab} />
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label="Close right panel"
        onClick={closeRightPanel}
        className={cn(
          "absolute inset-0 z-20 bg-black/20 transition-opacity duration-300 lg:hidden",
          isRightPanelOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* AI Copilot Panel */}
      <div
        className={cn(
          "absolute inset-y-0 right-0 z-30 overflow-hidden bg-white shadow-[-16px_0_32px_rgba(0,0,0,0.12)] transition-[width,opacity,transform,border-color] duration-300 ease-out lg:relative lg:inset-y-auto lg:right-auto lg:flex lg:w-[380px] lg:flex-shrink-0 lg:bg-muted/20 lg:shadow-none lg:transition-[max-width,opacity,border-color]",
          isRightPanelOpen
            ? "w-full max-w-[380px] translate-x-0 border-l border-border opacity-100 lg:max-w-[380px]"
            : "w-full max-w-[380px] translate-x-full border-l-0 opacity-0 pointer-events-none lg:max-w-0 lg:translate-x-0",
        )}
        aria-hidden={!isRightPanelOpen}
      >
        <div
          className={cn(
            "relative flex h-full min-w-full flex-col transition-transform duration-300 ease-out lg:min-w-[380px] lg:transition-opacity",
            isRightPanelOpen ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0 lg:translate-x-0",
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close right panel"
            onClick={closeRightPanel}
            className="absolute right-3 top-3 z-10 h-8 w-8 rounded-full border border-black/10 bg-white/95 text-[#7A7A7A] shadow-sm backdrop-blur hover:bg-white hover:text-[#333333]"
          >
            <X className="h-4 w-4" />
          </Button>

          {isInteractionsOpen ? (
            <RecentInteractionsPanel />
          ) : isAddNewOpen ? (
            <AddNewPanel />
          ) : isDeskOpen ? (
            <DeskPanel />
          ) : null}
        </div>
      </div>

    </div>
  );
}
