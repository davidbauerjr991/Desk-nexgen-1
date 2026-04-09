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
import { cn } from "@/lib/utils";
import { useLayoutContext } from "@/components/Layout";
import NotesPanel, { NOTES_PANEL_MENU_ITEMS } from "@/components/NotesPanel";
import RecentInteractionsPanel from "@/components/RecentInteractionsPanel";
import ConversationPanel from "@/components/ConversationPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CONVERSATION_CONTENT_DELAY_MS = 300;
const RIGHT_PANEL_CONTENT_DELAY_MS = 300;

function DeskPanel({
  addNoteTrigger,
  customerId,
  selection,
}: {
  addNoteTrigger: number;
  customerId: string;
  selection: { initialTab?: string; ticketId?: string } | null;
}) {
  return (
    <NotesPanel
      notesOnly
      addNoteTrigger={addNoteTrigger}
      customerId={customerId}
      initialTab={selection?.initialTab}
      initialTicketId={selection?.ticketId}
    />
  );
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
    deskPanelSelection,
    recentInteractions,
    toggleInteractions,
    toggleCallPopunder,
    isConversationPanelOpen,
    conversationState,
    setConversationState,
    activeConversationChannel,
    activeConversationTabs,
    setActiveConversationChannel,
    openDeskPanel,
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
                    onClick={(event) => toggleCallPopunder(event.currentTarget.getBoundingClientRect(), selectedAssignment.customerRecordId)}
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
                openChannels={activeConversationTabs}
                activeChannel={activeConversationChannel}
                customerId={selectedAssignment.customerRecordId}
                draftKey={`mobile-${activeConversationChannel}`}
                onConversationChange={setConversationState}
                onSelectChannel={setActiveConversationChannel}
                onOpenDeskPanel={openDeskPanel}
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
              <NotesPanel customerId={selectedAssignment.customerRecordId} />
            </div>
          </div>

          <button
            type="button"
            aria-label="Close right panel"
            onClick={closeRightPanel}
            className={cn(
              "absolute inset-0 z-20 bg-white/50 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
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
                    <DeskPanel addNoteTrigger={addNoteTrigger} customerId={selectedAssignment.customerRecordId} selection={deskPanelSelection} />
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
            className="absolute inset-0 bg-white/50 backdrop-blur-[2px] animate-in fade-in-0 duration-200"
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
              <NotesPanel key={selectedAssignment.customerRecordId} initialTab={mobileDetailsTab} customerId={selectedAssignment.customerRecordId} />
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
