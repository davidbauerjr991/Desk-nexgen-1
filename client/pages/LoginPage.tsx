import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const LOAD_STEPS = [
  { id: "auth",  label: "Authenticating Agent",  delay: 400  },
  { id: "sync",  label: "Synching Applications", delay: 1200 },
  { id: "queue", label: "Loading Queue",          delay: 2200 },
];

const LAUNCH_DELAY = 3400;

type StepState = "idle" | "loading" | "done";
type PhoneOption = "softphone" | "phone-number";

function AppLogo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path
        d="M23.7188 5.89062C23.8757 5.89077 24.0015 6.01655 24 6.17188C23.8494 15.8941 15.9182 23.7747 6.13379 23.9238C5.97839 23.9255 5.85077 23.7999 5.85059 23.6445V19.3848C5.85059 19.2325 5.97502 19.1097 6.12891 19.1064C13.2448 18.9606 19.0048 13.236 19.1523 6.16602C19.1556 6.01217 19.2788 5.88872 19.4326 5.88867L23.7188 5.89062ZM12.2559 0.0771484C13.8714 0.0772122 15.1804 1.37836 15.1807 2.98242C15.1807 4.58668 13.8716 5.88861 12.2559 5.88867C10.6401 5.88867 9.33008 4.58672 9.33008 2.98242C9.33031 1.37832 10.6402 0.0771484 12.2559 0.0771484ZM2.92578 0.0761719C4.5412 0.0763851 5.85033 1.3775 5.85059 2.98145C5.85059 4.58561 4.54135 5.88748 2.92578 5.8877C1.31003 5.8877 0 4.58574 0 2.98145C0.000253194 1.37736 1.31018 0.0761719 2.92578 0.0761719Z"
        fill="#2196F3"
      />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"idle" | "loading">("idle");
  const [stepStates, setStepStates] = useState<Record<string, StepState>>({
    auth:  "idle",
    sync:  "idle",
    queue: "idle",
  });
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("agentDarkMode") === "true",
  );
  const [phoneOption, setPhoneOption] = useState<PhoneOption>("softphone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [savePrefs, setSavePrefs] = useState(false);

  // Apply / remove dark class on <html> and persist preference as the toggle changes
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("agentDarkMode", String(darkMode));
  }, [darkMode]);

  const handleLaunch = () => {
    if (phase === "loading") return;
    setPhase("loading");

    LOAD_STEPS.forEach(({ id, delay }) => {
      setTimeout(() => {
        setStepStates((prev) => ({ ...prev, [id]: "loading" }));
      }, id === "auth" ? 0 : delay - 250);

      setTimeout(() => {
        setStepStates((prev) => ({ ...prev, [id]: "done" }));
      }, delay);
    });

    setTimeout(() => {
      navigate("/control-panel");
    }, LAUNCH_DELAY);
  };

  const formatPhoneInput = (value: string) => {
    // Keep only digits, max 10
    return value.replace(/\D/g, "").slice(0, 10);
  };

  const lastLogin = (() => {
    const d = new Date();
    return d.toLocaleString("en-US", {
      weekday: "short",
      month:   "short",
      day:     "numeric",
      hour:    "numeric",
      minute:  "2-digit",
    });
  })();

  return (
    <div className={cn(
      "flex h-screen w-screen items-center justify-center transition-colors duration-300",
      darkMode ? "bg-[#0F172A]" : "bg-[#F2F4F7]",
    )}>
      <div
        className={cn(
          "w-[380px] rounded-2xl border shadow-[0_8px_40px_rgba(0,0,0,0.12)] transition-all duration-500",
          darkMode
            ? "border-white/[0.08] bg-[#1E293B]"
            : "border-black/[0.08] bg-white",
          phase === "loading" ? "pb-6" : "pb-5",
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
          <AppLogo />
          <span className={cn("text-[17px] font-semibold", darkMode ? "text-white" : "text-[#101828]")}>
            Agent Workspace
          </span>
        </div>

        {/* Welcome card */}
        <div className={cn(
          "mx-5 mb-4 rounded-xl px-4 py-3.5",
          darkMode ? "bg-[#0F172A]" : "bg-[#F9FAFB]",
        )}>
          <p className={cn("text-[15px] font-bold", darkMode ? "text-white" : "text-[#101828]")}>
            Welcome Back, Jeff
          </p>

          {/* Last login */}
          <p className={cn("mt-0.5 flex items-center gap-1.5 text-[12px]", darkMode ? "text-[#94A3B8]" : "text-[#667085]")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            Last login {lastLogin}
          </p>

          {/* Divider */}
          <div className={cn("my-3 border-t", darkMode ? "border-white/[0.08]" : "border-[#E4E7EC]")} />

          {/* Dark Mode toggle */}
          <div className="flex items-center justify-between">
            <span className={cn("text-[13px] font-medium", darkMode ? "text-[#CBD5E1]" : "text-[#344054]")}>
              Dark Mode
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={darkMode}
              onClick={() => setDarkMode((v) => !v)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
                darkMode ? "bg-[#006DAD]" : "bg-[#D0D5DD]",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
                  darkMode ? "translate-x-4" : "translate-x-0",
                )}
              />
            </button>
          </div>

          {/* Divider */}
          <div className={cn("my-3 border-t", darkMode ? "border-white/[0.08]" : "border-[#E4E7EC]")} />

          {/* Phone option radios */}
          <p className={cn("mb-2 text-[12px] font-semibold uppercase tracking-wide", darkMode ? "text-[#64748B]" : "text-[#98A2B3]")}>
            Phone Setup
          </p>
          <div className="space-y-2">
            {(["softphone", "phone-number"] as PhoneOption[]).map((opt) => {
              const label = opt === "softphone" ? "Integrated Soft Phone" : "Phone Number";
              const checked = phoneOption === opt;
              return (
                <label key={opt} className="flex cursor-pointer items-center gap-2.5">
                  <span
                    onClick={() => setPhoneOption(opt)}
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150",
                      checked
                        ? "border-[#006DAD] bg-[#006DAD]"
                        : darkMode ? "border-[#475569] bg-transparent" : "border-[#D0D5DD] bg-white",
                    )}
                  >
                    {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <span
                    onClick={() => setPhoneOption(opt)}
                    className={cn("text-[13px]", darkMode ? "text-[#CBD5E1]" : "text-[#344054]")}
                  >
                    {label}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Phone number input — slides in when phone-number is selected */}
          <div className={cn(
            "overflow-hidden transition-all duration-300 ease-out",
            phoneOption === "phone-number" ? "max-h-[60px] opacity-100 mt-2.5" : "max-h-0 opacity-0 mt-0",
          )}>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="10-digit phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(formatPhoneInput(e.target.value))}
              maxLength={10}
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-[13px] outline-none transition-colors",
                "placeholder:text-[#98A2B3]",
                darkMode
                  ? "border-[#334155] bg-[#1E293B] text-white focus:border-[#006DAD]"
                  : "border-[#D0D5DD] bg-white text-[#101828] focus:border-[#006DAD]",
              )}
            />
          </div>
        </div>

        {/* Launch button */}
        <div className="mx-5">
          <button
            type="button"
            onClick={handleLaunch}
            disabled={phase === "loading"}
            className={cn(
              "w-full rounded-xl py-2.5 text-[14px] font-semibold transition-all duration-200",
              phase === "loading"
                ? cn("cursor-default border bg-transparent",
                    darkMode ? "border-[#334155] text-[#475569]" : "border-[#E4E7EC] text-[#98A2B3]")
                : "bg-[#006DAD] text-white shadow-[0_1px_3px_rgba(0,109,173,0.20)] hover:bg-[#005d94] active:bg-[#004e7e]",
            )}
          >
            Launch Agent Workspace
          </button>
        </div>

        {/* Save preferences checkbox */}
        <div className="mx-5 mt-3">
          <label className="flex cursor-pointer items-center gap-2">
            <span
              onClick={() => setSavePrefs((v) => !v)}
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors duration-150",
                savePrefs
                  ? "border-[#006DAD] bg-[#006DAD]"
                  : darkMode ? "border-[#475569] bg-transparent" : "border-[#D0D5DD] bg-white",
              )}
            >
              {savePrefs && (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            <span className={cn("text-[13px]", darkMode ? "text-[#94A3B8]" : "text-[#667085]")}>
              Save preferences
            </span>
          </label>
        </div>

        {/* Loading steps */}
        <div className={cn(
          "overflow-hidden transition-all duration-500 ease-out",
          phase === "loading" ? "max-h-[200px] opacity-100 mt-4" : "max-h-0 opacity-0 mt-0",
        )}>
          <div className="mx-5 border-l-2 border-[#006DAD] pl-4">
            <p className={cn("mb-2.5 text-[12px] font-bold", darkMode ? "text-white" : "text-[#101828]")}>
              Compiling Experience
            </p>
            <ul className="space-y-2">
              {LOAD_STEPS.map(({ id, label }) => {
                const state = stepStates[id];
                return (
                  <li key={id} className="flex items-center gap-2.5">
                    {state === "done" ? (
                      <CheckCircle2 className="shrink-0 text-[#17B26A]" style={{ width: 18, height: 18 }} />
                    ) : state === "loading" ? (
                      <Loader2 className="shrink-0 animate-spin text-[#006DAD]" style={{ width: 18, height: 18 }} />
                    ) : (
                      <span className={cn("h-[18px] w-[18px] shrink-0 rounded-full border-2", darkMode ? "border-[#334155]" : "border-[#E4E7EC]")} />
                    )}
                    <span className={cn(
                      "text-[13px] transition-colors duration-200",
                      state === "idle"
                        ? darkMode ? "text-[#475569]" : "text-[#98A2B3]"
                        : darkMode ? "text-[#CBD5E1]" : "text-[#344054]",
                    )}>
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
