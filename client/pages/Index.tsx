import { useEffect, useRef, useState } from "react";
import {
  MoreVertical,
  PhoneCall,
  Info,
  FileText,
  History,
  Clock,
  X,
  FilePlus2,
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
import ConversationPanel from "@/components/ConversationPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AddNewType = "customer" | "account" | "ticket" | "work-item";

const CONVERSATION_CONTENT_DELAY_MS = 300;
const RIGHT_PANEL_CONTENT_DELAY_MS = 300;

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
    conversationState,
    setConversationState,
    activeConversationChannel,
  } = useLayoutContext();
  const [isConversationContentVisible, setIsConversationContentVisible] = useState(true);
  const [isRightPanelContentVisible, setIsRightPanelContentVisible] = useState(isRightPanelOpen);
  const [addNoteTrigger, setAddNoteTrigger] = useState(0);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);
  const [mobileDetailsTab, setMobileDetailsTab] = useState("Overview");
  const conversationPanelInitializedRef = useRef(false);

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
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full border-black/10 px-3 min-[800px]:hidden"
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
                draftKey={`mobile-${activeConversationChannel}`}
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
              <NotesPanel customerId={selectedAssignment.id} />
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
              <NotesPanel initialTab={mobileDetailsTab} customerId={selectedAssignment.id} />
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
