import { useEffect, useMemo, useRef, useState } from "react";
import {
  MoreVertical,
  PhoneCall,
  Info,
  FileText,
  History,
  Mail,
  Clock,
  X,
  FilePlus2,
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
import { createConversationState, type CustomerChannel } from "@/lib/customer-database";
import { useLayoutContext } from "@/components/Layout";
import { toast } from "sonner";
import NotesPanel, { NOTES_PANEL_MENU_ITEMS } from "@/components/NotesPanel";
import RecentInteractionsPanel from "@/components/RecentInteractionsPanel";
import ConversationPanel from "@/components/ConversationPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ChannelType = CustomerChannel;
type AddNewType = "customer" | "account" | "ticket" | "work-item";

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

const CONVERSATION_CONTENT_DELAY_MS = 300;
const RIGHT_PANEL_CONTENT_DELAY_MS = 300;
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
      ? "border-[#B8D7F0] bg-[#E6F3FA] text-[#006DAD]"
      : "border-black/10 bg-white text-[#7A7A7A] hover:border-[#B8D7F0] hover:text-[#006DAD]",
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
              <SelectTrigger className="h-9 rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333333] focus:ring-1 focus:ring-[#006DAD]/30 focus:ring-offset-0 focus:border-[#006DAD]">
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
                    className="min-h-[96px] rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333333] placeholder:text-transparent focus-visible:border-[#006DAD] focus-visible:ring-1 focus-visible:ring-[#006DAD]/30"
                  />
                ) : (
                  <Input
                    value={formValues[field.key] ?? ""}
                    onChange={(event) =>
                      setFormValues((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="h-9 rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333333] placeholder:text-transparent focus-visible:border-[#006DAD] focus-visible:ring-1 focus-visible:ring-[#006DAD]/30"
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
          className="rounded-xl bg-[#006DAD] hover:bg-[#5B00D1] disabled:bg-[#B8D7F0] disabled:text-white"
          onClick={handleSave}
          disabled={isSaveDisabled}
        >
          Save
        </Button>
      </div>
    </>
  );
}

function DeskPanel({ addNoteTrigger }: { addNoteTrigger: number }) {
  return <NotesPanel notesOnly addNoteTrigger={addNoteTrigger} />;
}

export default function Index() {
  const {
    isDeskOpen,
    isInteractionsOpen,
    isRightPanelOpen,
    closeRightPanel,
    isAgentAvailable,
    isAgentInCall,
    selectedAssignment,
    recentInteractions,
    toggleInteractions,
    toggleCallPopunder,
    isConversationPanelOpen,
    toggleConversationPanel,
    openConversationPanel,
    conversationState,
    setConversationState,
  } = useLayoutContext();
  const [activeChannel, setActiveChannel] = useState<ChannelType>("sms");
  const [isConversationContentVisible, setIsConversationContentVisible] = useState(true);
  const [isRightPanelContentVisible, setIsRightPanelContentVisible] = useState(isRightPanelOpen);
  const [addNoteTrigger, setAddNoteTrigger] = useState(0);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);
  const [mobileDetailsTab, setMobileDetailsTab] = useState("Overview");
  const conversationPanelInitializedRef = useRef(false);
  const activeConversation = useMemo(
    () => createConversationState(selectedAssignment.id, activeChannel),
    [activeChannel, selectedAssignment.id],
  );

  useEffect(() => {
    if (!conversationPanelInitializedRef.current) {
      conversationPanelInitializedRef.current = true;
      return;
    }

    if (!isConversationPanelOpen) {
      setIsConversationContentVisible(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsConversationContentVisible(true);
    }, CONVERSATION_CONTENT_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isConversationPanelOpen]);

  useEffect(() => {
    if (!isRightPanelOpen) {
      setIsRightPanelContentVisible(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsRightPanelContentVisible(true);
    }, RIGHT_PANEL_CONTENT_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isRightPanelOpen]);

  useEffect(() => {
    setConversationState(activeConversation);
  }, [activeConversation, selectedAssignment.name, setConversationState]);

  const handleChannelSelection = (channel: ChannelType) => {
    if (channel === activeChannel) {
      toggleConversationPanel();
      return;
    }

    setActiveChannel(channel);
    openConversationPanel();
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Main Interaction Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-black/[0.16] bg-card">
        
        {/* Customer Context Banner */}
        <div className="flex items-start justify-between gap-3 border-b border-border bg-card/50 px-6 py-4">
          <div className="flex min-w-0 flex-1 items-start">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold tracking-tight">{selectedAssignment.name}</h2>
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
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full border-black/10 px-3"
                    onClick={(event) => toggleCallPopunder(event.currentTarget.getBoundingClientRect())}
                    disabled={isAgentInCall || !isAgentAvailable}
                  >
                    <PhoneCall className="mr-2 h-4 w-4" /> Call
                  </Button>
                </div>
              </div>
              <div className="mt-1 flex flex-col gap-2 text-sm text-muted-foreground min-[800px]:flex-row min-[800px]:items-center min-[800px]:gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="break-words leading-tight">{selectedAssignment.customerId}</span>
                  <span className="flex items-start gap-1.5 leading-tight">
                    <Clock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span>Last updated {selectedAssignment.lastUpdated}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
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

        {/* Content row: conversation on mobile, notes in the main container */}
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          {/* Conversation column on mobile */}
          <div
            aria-hidden={!isConversationPanelOpen}
            className={cn(
              "flex w-full min-w-0 flex-col overflow-hidden transition-[max-width,opacity,transform,border-color] duration-300 ease-out min-[800px]:hidden",
              isConversationPanelOpen
                ? "max-w-full translate-x-0 opacity-100"
                : "pointer-events-none max-w-0 -translate-x-4 opacity-0",
            )}
          >
            {isConversationContentVisible && (
              <ConversationPanel
                conversation={conversationState}
                draftKey={`mobile-${activeChannel}`}
                onConversationChange={setConversationState}
              />
            )}
          </div>

          {/* Customer Data tabs */}
          <div
            className={cn(
              "min-h-0 flex-1 min-w-0 flex-col overflow-hidden min-[800px]:min-w-[500px]",
              isConversationPanelOpen ? "hidden min-[800px]:flex" : "flex",
            )}
          >
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <NotesPanel />
            </div>
          </div>

          <button
            type="button"
            aria-label="Close right panel"
            onClick={closeRightPanel}
            className={cn(
              "absolute inset-0 z-20 bg-black/20 transition-opacity duration-300 lg:hidden",
              isRightPanelOpen ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          />

          <div
            className={cn(
              "absolute inset-y-0 right-0 z-30 overflow-hidden bg-white shadow-[-16px_0_32px_rgba(0,0,0,0.12)] transition-[width,opacity,transform,border-color] duration-300 ease-out lg:relative lg:inset-y-auto lg:right-auto lg:flex lg:w-[380px] lg:flex-shrink-0 lg:bg-muted/20 lg:shadow-none lg:transition-[max-width,opacity,border-color]",
              isRightPanelOpen
                ? "w-full max-w-[380px] translate-x-0 border-l border-border opacity-100 lg:max-w-[380px]"
                : "w-full max-w-[380px] translate-x-full border-l-0 opacity-0 pointer-events-none lg:max-w-0 lg:translate-x-0",
            )}
            aria-hidden={!isRightPanelOpen}
          >
            <div className="relative flex h-full min-w-full flex-col lg:min-w-[380px]">
              {isRightPanelContentVisible && (
                <>
                  {isDeskOpen && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Add note"
                      onClick={() => setAddNoteTrigger((current) => current + 1)}
                      className="absolute right-12 top-3 z-10 h-8 w-8 rounded-full border border-black/10 bg-white/95 text-[#7A7A7A] shadow-sm backdrop-blur hover:bg-white hover:text-[#333333]"
                    >
                      <FilePlus2 className="h-4 w-4" />
                    </Button>
                  )}
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
                    <RecentInteractionsPanel injectedInteractions={recentInteractions} />
                  ) : isDeskOpen ? (
                    <DeskPanel addNoteTrigger={addNoteTrigger} />
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

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


    </div>
  );
}
