import { useCallback, useEffect, useRef, useState } from "react";
import { SCENARIO_CHANNEL } from "@/lib/scenario-channel";
import type { AppMsg, CaseKey, CaseStatus, ControllerMsg } from "@/lib/scenario-channel";

// ─── Case metadata ─────────────────────────────────────────────────────────────

type CaseConfig = {
  key: CaseKey;
  initials: string;
  name: string;
  customerId: string;
  issue: string;
  bot: string;
  triggerLabel: string;
  defaultDelay: number;
};

const CASES: CaseConfig[] = [
  {
    key: "jordan",
    initials: "JD",
    name: "Jordan Davis",
    customerId: "CST-11621",
    issue: "Router dropping all connections — port forwarding config at risk during factory reset",
    bot: "Aria",
    triggerLabel: "Fires on app ready",
    defaultDelay: 5,
  },
  {
    key: "sofia",
    initials: "SM",
    name: "Sofia Martinez",
    customerId: "CST-12045",
    issue: "Proactive fraud alert — 2 unauthorized transactions totaling $2,159",
    bot: "Jacob",
    triggerLabel: "Fires after Jordan resolves",
    defaultDelay: 8,
  },
  {
    key: "marcus",
    initials: "MW",
    name: "Marcus Webb",
    customerId: "CST-13317",
    issue: "Order shipped to wrong address — request for Human Agent",
    bot: "Emily",
    triggerLabel: "Fires after Sofia resolves",
    defaultDelay: 0,
  },
  {
    key: "terry",
    initials: "TW",
    name: "Terry Williams",
    customerId: "CST-14201",
    issue: "Inbound callback request — VP of Ops at Nexus Freight evaluating TMS replacement for 200-person team",
    bot: "Aria",
    triggerLabel: "Fires after Marcus resolves",
    defaultDelay: 0,
  },
];

const BOT_COLORS: Record<string, { bg: string; text: string }> = {
  Aria:  { bg: "bg-blue-100",   text: "text-blue-700"   },
  Jacob: { bg: "bg-green-100",  text: "text-green-700"  },
  Emily: { bg: "bg-purple-100", text: "text-purple-700" },
  Sales: { bg: "bg-amber-100",  text: "text-amber-700"  },
};

// ─── Small components ──────────────────────────────────────────────────────────

function StatusBadge({ status, countdown }: { status: CaseStatus; countdown: number | null }) {
  const map: Record<CaseStatus, { ring: string; dot: string; label: string }> = {
    idle:     { ring: "border-gray-200 bg-gray-50 text-gray-400",     dot: "bg-gray-300",               label: "Idle"     },
    queued:   { ring: "border-blue-200 bg-blue-50 text-blue-600",     dot: "bg-blue-500 animate-pulse",  label: "Queued"   },
    active:   { ring: "border-green-200 bg-green-50 text-green-700",  dot: "bg-green-500 animate-pulse", label: "Active"   },
    resolved: { ring: "border-gray-200 bg-gray-50 text-gray-400",     dot: "bg-gray-300",               label: "Resolved" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${s.ring}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.dot}`} />
      {s.label}{status === "queued" && countdown !== null ? ` · ${countdown}s` : ""}
    </span>
  );
}

function Toggle({ checked, onChange, disabled }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#166CCA] ${
        checked ? "bg-[#166CCA]" : "bg-gray-200"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-4" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function DelayStepper({ value, onChange, disabled }: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center gap-1 ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value <= 0}
        className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 text-sm leading-none select-none"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        max={120}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!isNaN(n) && n >= 0 && n <= 120) onChange(n);
        }}
        className="w-12 rounded border border-gray-200 bg-white py-0.5 text-center text-[13px] font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#166CCA]"
      />
      <span className="text-[12px] text-gray-400">s</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(120, value + 1))}
        disabled={value >= 120}
        className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 text-sm leading-none select-none"
      >
        +
      </button>
    </div>
  );
}

// ─── Case card ─────────────────────────────────────────────────────────────────

function CaseCard({
  config,
  status,
  countdown,
  delay,
  connected,
  autoRunning,        // global auto is ON and this case is being managed by it
  onChangeDelay,
  onTrigger,
  onCancel,
}: {
  config: CaseConfig;
  status: CaseStatus;
  countdown: number | null;
  delay: number;
  connected: boolean;
  autoRunning: boolean;  // disables Trigger Now
  onChangeDelay: (v: number) => void;
  onTrigger: () => void;
  onCancel: () => void;
}) {
  const isTerminal = status === "active" || status === "resolved";
  const isQueued = status === "queued";
  const progressPct =
    isQueued && countdown !== null && delay > 0
      ? Math.min(100, ((delay - countdown) / delay) * 100)
      : 0;

  const bot = BOT_COLORS[config.bot] ?? { bg: "bg-gray-100", text: "text-gray-600" };

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm overflow-hidden transition-opacity ${
        isTerminal ? "opacity-60" : "opacity-100"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C5DEF5] text-[13px] font-bold text-[#1260B0]">
            {config.initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[14px] font-semibold text-gray-900 leading-snug">{config.name}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${bot.bg} ${bot.text}`}>
                {config.bot}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">{config.customerId}</p>
          </div>
        </div>
        <StatusBadge status={status} countdown={countdown} />
      </div>

      {/* Issue */}
      <p className="px-5 pb-3 text-[12px] leading-relaxed text-gray-500">{config.issue}</p>

      {/* Countdown progress bar */}
      {isQueued && delay > 0 && (
        <div className="mx-5 mb-3 h-1 rounded-full bg-blue-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#166CCA] transition-all duration-1000 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Controls */}
      <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between gap-3">
        {/* Left: delay stepper — always visible */}
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-gray-400 select-none">Delay</span>
          <DelayStepper
            value={delay}
            onChange={onChangeDelay}
            disabled={isTerminal || isQueued}
          />
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {isQueued && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          {!isTerminal && (
            <button
              type="button"
              onClick={onTrigger}
              disabled={!connected || isQueued || autoRunning}
              className="rounded-lg bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Trigger Now
            </button>
          )}
        </div>
      </div>

      {/* Footer: trigger condition */}
      <p className="px-5 pb-3 text-[11px] text-gray-400">{config.triggerLabel}</p>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ScenarioControllerPage() {
  // Set tab title for this standalone window
  useEffect(() => {
    const prev = document.title;
    document.title = "Agent Scenario Controller";
    return () => { document.title = prev; };
  }, []);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const connectedRef = useRef(false);
  const [connected, setConnected] = useState(false);

  const [caseStatuses, setCaseStatuses] = useState<Record<CaseKey, CaseStatus>>({
    jordan: "idle",
    sofia: "idle",
    marcus: "idle",
    terry: "idle",
  });

  // Single global auto toggle — replaces per-case toggles
  const [globalAuto, setGlobalAuto] = useState(false);
  const globalAutoRef = useRef(false);
  useEffect(() => { globalAutoRef.current = globalAuto; }, [globalAuto]);

  const [delays, setDelays] = useState<Record<CaseKey, number>>({
    jordan: CASES[0].defaultDelay,
    sofia:  CASES[1].defaultDelay,
    marcus: CASES[2].defaultDelay,
    terry:  CASES[3].defaultDelay,
  });
  const delaysRef = useRef(delays);
  useEffect(() => { delaysRef.current = delays; }, [delays]);

  const [countdowns, setCountdowns] = useState<Record<CaseKey, number | null>>({
    jordan: null,
    sofia:  null,
    marcus: null,
    terry:  null,
  });

  const intervalsRef = useRef<Partial<Record<CaseKey, ReturnType<typeof setInterval>>>>({});

  const clearCaseInterval = useCallback((key: CaseKey) => {
    const id = intervalsRef.current[key];
    if (id !== undefined) {
      clearInterval(id);
      delete intervalsRef.current[key];
    }
  }, []);

  /** Fire a case immediately — sends TRIGGER to main app, updates local status. */
  const triggerCase = useCallback((key: CaseKey) => {
    clearCaseInterval(key);
    setCountdowns((p) => ({ ...p, [key]: null }));
    channelRef.current?.postMessage({ type: "TRIGGER", case: key } satisfies ControllerMsg);
    setCaseStatuses((p) => ({ ...p, [key]: "active" }));
  }, [clearCaseInterval]);

  /** Start a countdown for a case; fires triggerCase when it reaches 0. */
  const startCountdown = useCallback((key: CaseKey, delaySec: number) => {
    clearCaseInterval(key);
    if (delaySec <= 0) {
      triggerCase(key);
      return;
    }
    setCaseStatuses((p) => ({ ...p, [key]: "queued" }));
    setCountdowns((p) => ({ ...p, [key]: delaySec }));
    const id = setInterval(() => {
      setCountdowns((prev) => {
        const next = (prev[key] ?? 1) - 1;
        if (next <= 0) {
          clearInterval(id);
          delete intervalsRef.current[key];
          setTimeout(() => triggerCase(key), 0);
          return { ...prev, [key]: 0 };
        }
        return { ...prev, [key]: next };
      });
    }, 1_000);
    intervalsRef.current[key] = id;
  }, [clearCaseInterval, triggerCase]);

  const cancelCountdown = useCallback((key: CaseKey) => {
    clearCaseInterval(key);
    setCountdowns((p) => ({ ...p, [key]: null }));
    setCaseStatuses((p) => ({ ...p, [key]: "idle" }));
  }, [clearCaseInterval]);

  /** Cancel all active countdowns and reset queued cases to idle. */
  const cancelAllCountdowns = useCallback(() => {
    (["jordan", "sofia", "marcus", "terry"] as CaseKey[]).forEach((key) => {
      clearCaseInterval(key);
    });
    setCountdowns({ jordan: null, sofia: null, marcus: null, terry: null });
    setCaseStatuses((prev) => {
      const next = { ...prev };
      (["jordan", "sofia", "marcus", "terry"] as CaseKey[]).forEach((key) => {
        if (next[key] === "queued") next[key] = "idle";
      });
      return next;
    });
  }, [clearCaseInterval]);

  // ── BroadcastChannel setup ──────────────────────────────────────────────────
  useEffect(() => {
    const ch = new BroadcastChannel(SCENARIO_CHANNEL);
    channelRef.current = ch;

    const sendHello = () => ch.postMessage({ type: "HELLO" } satisfies ControllerMsg);
    sendHello();

    const retryId = setInterval(() => {
      if (!connectedRef.current) sendHello();
    }, 2_000);

    ch.onmessage = (e: MessageEvent<AppMsg>) => {
      const msg = e.data;
      if (msg.type === "APP_READY") {
        connectedRef.current = true;
        setConnected(true);
        if (msg.statuses) {
          setCaseStatuses((prev) => ({ ...prev, ...msg.statuses }));
        }
      }
      if (msg.type === "CASE_STATUS") {
        setCaseStatuses((prev) => ({ ...prev, [msg.case]: msg.status }));
      }
    };

    return () => {
      clearInterval(retryId);
      ch.postMessage({ type: "BYE" } satisfies ControllerMsg);
      ch.close();
      channelRef.current = null;
      connectedRef.current = false;
      Object.values(intervalsRef.current).forEach((id) => { if (id) clearInterval(id); });
      intervalsRef.current = {};
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Global auto toggle handler ──────────────────────────────────────────────
  const handleGlobalAutoToggle = useCallback((enabled: boolean) => {
    setGlobalAuto(enabled);
    if (!enabled) {
      // Cancel all running countdowns when auto is switched off
      cancelAllCountdowns();
      return;
    }
    // Auto switched ON — start countdown for the first eligible idle case
    setCaseStatuses((statuses) => {
      if (statuses.jordan === "idle" && connectedRef.current) {
        setTimeout(() => startCountdown("jordan", delaysRef.current.jordan), 0);
      } else if (statuses.sofia === "idle" && statuses.jordan === "resolved" && connectedRef.current) {
        setTimeout(() => startCountdown("sofia", delaysRef.current.sofia), 0);
      } else if (statuses.marcus === "idle" && statuses.sofia === "resolved" && connectedRef.current) {
        setTimeout(() => startCountdown("marcus", delaysRef.current.marcus), 0);
      } else if (statuses.terry === "idle" && statuses.marcus === "resolved" && connectedRef.current) {
        setTimeout(() => startCountdown("terry", delaysRef.current.terry), 0);
      }
      return statuses;
    });
  }, [cancelAllCountdowns, startCountdown]);

  // ── Auto-trigger chain (only when globalAuto is ON) ─────────────────────────

  // Jordan: start once connected when auto is on
  const jordanStartedRef = useRef(false);
  useEffect(() => {
    if (!connected || jordanStartedRef.current) return;
    if (caseStatuses.jordan !== "idle") { jordanStartedRef.current = true; return; }
    jordanStartedRef.current = true;
    if (globalAutoRef.current) {
      startCountdown("jordan", delaysRef.current.jordan);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  // Sofia: start when Jordan resolves and auto is on
  const sofiaStartedRef = useRef(false);
  useEffect(() => {
    if (caseStatuses.jordan !== "resolved" || sofiaStartedRef.current) return;
    if (caseStatuses.sofia !== "idle") { sofiaStartedRef.current = true; return; }
    sofiaStartedRef.current = true;
    if (globalAutoRef.current) {
      startCountdown("sofia", delaysRef.current.sofia);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseStatuses.jordan]);

  // Marcus: start when Sofia resolves and auto is on
  const marcusStartedRef = useRef(false);
  useEffect(() => {
    if (caseStatuses.sofia !== "resolved" || marcusStartedRef.current) return;
    if (caseStatuses.marcus !== "idle") { marcusStartedRef.current = true; return; }
    marcusStartedRef.current = true;
    if (globalAutoRef.current) {
      startCountdown("marcus", delaysRef.current.marcus);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseStatuses.sofia]);

  // Terry: start when Marcus resolves and auto is on
  const terryStartedRef = useRef(false);
  useEffect(() => {
    if (caseStatuses.marcus !== "resolved" || terryStartedRef.current) return;
    if (caseStatuses.terry !== "idle") { terryStartedRef.current = true; return; }
    terryStartedRef.current = true;
    if (globalAutoRef.current) {
      startCountdown("terry", delaysRef.current.terry);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseStatuses.marcus]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-[15px] font-bold text-gray-900 leading-tight">Scenario Controller</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">Desk-nexgen · Demo orchestration</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5">
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
            <span className="text-[12px] font-medium text-gray-600">
              {connected ? "Connected" : "Waiting for app…"}
            </span>
          </div>
        </div>
      </header>

      {/* Global auto control bar */}
      <div className="mx-auto max-w-xl px-6 pt-5">
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
          <div>
            <p className="text-[13px] font-semibold text-gray-800">Auto-run sequence</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Fires each case automatically using the delays set below.
              {globalAuto && " Trigger Now is disabled while auto is running."}
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 ml-4">
            <span className="text-[12px] font-medium text-gray-500 select-none">
              {globalAuto ? "On" : "Off"}
            </span>
            <Toggle checked={globalAuto} onChange={handleGlobalAutoToggle} />
          </div>
        </div>
      </div>

      {/* Case cards */}
      <main className="mx-auto max-w-xl px-6 py-4 space-y-4">
        {CASES.map((config) => (
          <CaseCard
            key={config.key}
            config={config}
            status={caseStatuses[config.key]}
            countdown={countdowns[config.key]}
            delay={delays[config.key]}
            connected={connected}
            autoRunning={globalAuto}
            onChangeDelay={(v) => setDelays((p) => ({ ...p, [config.key]: v }))}
            onTrigger={() => triggerCase(config.key)}
            onCancel={() => cancelCountdown(config.key)}
          />
        ))}

        <p className="text-center text-[11px] text-gray-400 pb-4">
          Trigger Now bypasses the timer and fires the case immediately.
        </p>
      </main>
    </div>
  );
}
