import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const NiceLogoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 text-[#6E00FD]">
    <path
      d="M23.7188 5.81445C23.8757 5.8146 24.0015 5.94038 24 6.0957C23.8494 15.8179 15.9182 23.6985 6.13379 23.8477C5.97839 23.8493 5.85077 23.7237 5.85059 23.5684V19.3086C5.85059 19.1563 5.97502 19.0335 6.12891 19.0303C13.2448 18.8844 19.0048 13.1599 19.1523 6.08984C19.1556 5.93599 19.2788 5.81255 19.4326 5.8125L23.7188 5.81445ZM12.2559 0.000976562C13.8714 0.00104033 15.1804 1.30219 15.1807 2.90625C15.1807 4.51051 13.8716 5.81244 12.2559 5.8125C10.6401 5.8125 9.33008 4.51055 9.33008 2.90625C9.33031 1.30215 10.6402 0.000976562 12.2559 0.000976562ZM2.92578 0C4.5412 0.000213196 5.85033 1.30132 5.85059 2.90527C5.85059 4.50944 4.54135 5.81131 2.92578 5.81152C1.31003 5.81152 0 4.50957 0 2.90527C0.000253194 1.30119 1.31018 0 2.92578 0Z"
      fill="#6E00FD"
    />
  </svg>
);

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen w-full bg-[#F8F8F9]">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4">
            <NiceLogoIcon />
            <span
              className="text-[#333] font-semibold text-base leading-7 tracking-[-0.02em] whitespace-nowrap"
              style={{ fontFamily: "'Noto Sans', -apple-system, Roboto, Helvetica, sans-serif" }}
            >
              Agent Workspace Premium
            </span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0 px-4 pb-4">
        {/* Copilot Panel - the main white content panel */}
        <div className="flex flex-col flex-1 rounded-lg border border-black/[0.16] bg-white overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
