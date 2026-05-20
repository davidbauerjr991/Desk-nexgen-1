/**
 * GlobeView.tsx
 *
 * A futuristic 3D wireframe globe that displays customer queue items
 * as interactive, color-coded bubbles at geographic positions.
 * Replaces the card grid view in the ControlPanelPage queue tab.
 *
 * Built with React Three Fiber + drei. Self-contained for easy rollback.
 */

import { useRef, useState, useMemo, useCallback, useEffect, createContext, useContext } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Stars } from "@react-three/drei";
import * as THREE from "three";
// (lucide icons removed — toggle is now in agent status dropdown)
import { TakeoverButton } from "@/pages/control-panel/TakeoverButton";
import { useLayoutContext } from "@/components/layout-context";
import type { AssignmentChannel } from "@/components/layout-context";

// ─── Theme Context ─────────────────────────────────────────────────────────

interface GlobeTheme {
  dark: boolean;
  // 3D scene
  wireColor: string;
  wireOpacity: number;
  gridOpacity: number;
  dotColor: string;
  dotOpacity: number;
  glowOpacity: number;
  scanOpacity: number;
  // Overlay cards
  cardBg: string;
  cardBorder: string;
  cardText: string;
  cardTextSecondary: string;
  cardTextTertiary: string;
  cardDivider: string;
  legendBg: string;
  legendBorder: string;
  legendText: string;
  legendLabel: string;
  badgeBg: string;
  countColor: string;
  aiBoxBg: string;
  aiBoxBorder: string;
  aiLabel: string;
}

const DARK_THEME: GlobeTheme = {
  dark: true,
  wireColor: "#0ea5e9",
  wireOpacity: 0.06,
  gridOpacity: 0.08,
  dotColor: "#0ea5e9",
  dotOpacity: 0.35,
  glowOpacity: 0.03,
  scanOpacity: 0.15,
  cardBg: "rgba(15, 23, 42, 0.92)",
  cardBorder: "rgba(255,255,255,0.1)",
  cardText: "#ffffff",
  cardTextSecondary: "#cbd5e1",
  cardTextTertiary: "#94a3b8",
  cardDivider: "rgba(255,255,255,0.1)",
  legendBg: "rgba(15, 23, 42, 0.80)",
  legendBorder: "rgba(255,255,255,0.1)",
  legendText: "#cbd5e1",
  legendLabel: "#94a3b8",
  badgeBg: "rgba(15, 23, 42, 0.80)",
  countColor: "#22d3ee",
  aiBoxBg: "rgba(6, 182, 212, 0.05)",
  aiBoxBorder: "rgba(6, 182, 212, 0.2)",
  aiLabel: "#22d3ee",
};

const LIGHT_THEME: GlobeTheme = {
  dark: false,
  wireColor: "#166CCA",
  wireOpacity: 0.10,
  gridOpacity: 0.12,
  dotColor: "#166CCA",
  dotOpacity: 0.25,
  glowOpacity: 0.04,
  scanOpacity: 0.12,
  cardBg: "rgba(255, 255, 255, 0.95)",
  cardBorder: "rgba(0,0,0,0.12)",
  cardText: "#1e293b",
  cardTextSecondary: "#475569",
  cardTextTertiary: "#64748b",
  cardDivider: "rgba(0,0,0,0.08)",
  legendBg: "rgba(255, 255, 255, 0.90)",
  legendBorder: "rgba(0,0,0,0.12)",
  legendText: "#334155",
  legendLabel: "#64748b",
  badgeBg: "rgba(255, 255, 255, 0.90)",
  countColor: "#166CCA",
  aiBoxBg: "rgba(22, 108, 202, 0.06)",
  aiBoxBorder: "rgba(22, 108, 202, 0.2)",
  aiLabel: "#166CCA",
};

const GlobeThemeContext = createContext<GlobeTheme>(LIGHT_THEME);
function useGlobeTheme() { return useContext(GlobeThemeContext); }

// ─── Types ──────────────────────────────────────────────────────────────────

interface GlobeRow {
  id: string;
  name: string;
  customerId: string;
  customerRecordId?: string;
  company: string;
  botType: string;
  channel: string;
  priority: string;
  status: string;
  preview: string;
  waitTime: string;
  customerContext: string;
  onMonitor: () => void;
  onTakeoverAccept: (handoff: any) => void;
}

// ─── Coordinate Lookup ──────────────────────────────────────────────────────

/** [latitude, longitude] for known customer locations. */
const CUSTOMER_COORDS: Record<string, [number, number]> = {
  // Scenario characters
  alex_sanderson: [44.98, -93.27],    // Minneapolis, MN
  richard:        [44.98, -93.27],    // Minneapolis, MN
  jordan:         [30.27, -97.74],    // Austin, TX
  sofia:          [25.76, -80.19],    // Miami, FL
  marcus:         [41.88, -87.63],    // Chicago, IL
  terry:          [32.78, -96.80],    // Dallas, TX
  elena:          [34.05, -118.24],   // Los Angeles, CA
  // Static queue customers — spread globally
  alex:           [40.71, -74.01],    // New York, NY
  sarah:          [37.77, -122.42],   // San Francisco, CA
  emily:          [47.61, -122.33],   // Seattle, WA
  david:          [33.45, -112.07],   // Phoenix, AZ
  priya:          [42.36, -71.06],    // Boston, MA
  miguel:         [29.76, -95.37],    // Houston, TX
  olivia:         [39.74, -104.99],   // Denver, CO
  jamal:          [33.75, -84.39],    // Atlanta, GA
  hannah:         [35.23, -80.84],    // Charlotte, NC
  noah:           [36.16, -86.78],    // Nashville, TN
  lauren:         [38.91, -77.04],    // Washington, DC
  ethan:          [42.33, -83.05],    // Detroit, MI
  darius:         [39.96, -75.17],    // Philadelphia, PA
  // International spread
  maria_chen:       [22.40, 114.11],  // Hong Kong
  james_whitfield:  [51.51, -0.13],   // London
  priya_sharma:     [19.08, 72.88],   // Mumbai
  robert_okafor:    [6.52, 3.38],     // Lagos
  lisa_montenegro:  [-23.55, -46.64], // São Paulo
  kevin_tran:       [10.82, 106.63],  // Ho Chi Minh City
  angela_russo:     [41.90, 12.50],   // Rome
  sandra_yip:       [1.35, 103.82],   // Singapore
  derek_owens:      [43.65, -79.38],  // Toronto
  tom_hargrove:     [35.69, 139.69],  // Tokyo
  nadia_petrov:     [55.76, 37.62],   // Moscow
  carlos_mendez:    [19.43, -99.13],  // Mexico City
  ingrid_holmberg:  [59.33, 18.07],   // Stockholm
  yuki_tanaka:      [34.69, 135.50],  // Osaka
  amara_osei:       [5.60, -0.19],    // Accra
  patrick_obrien:   [53.35, -6.26],   // Dublin
  chloe_beaumont:   [48.86, 2.35],    // Paris
  rajiv_menon:      [12.97, 77.59],   // Bangalore
  sophie_hartmann:  [52.52, 13.41],   // Berlin
  terrence_vance:   [45.50, -73.57],  // Montreal
  isabella_moreno:  [-34.60, -58.38], // Buenos Aires
  david_park:       [37.57, 126.98],  // Seoul
  aaliya_nasser:    [25.20, 55.27],   // Dubai
  finn_johansson:   [60.17, 24.94],   // Helsinki
  grace_kim:        [37.57, 126.98],  // Seoul
  hugo_fernandez:   [40.42, -3.70],   // Madrid
  thandi_mokoena:   [-26.20, 28.04],  // Johannesburg
  jerome_dupont:    [45.76, 4.84],    // Lyon
  vera_sokolova:    [59.93, 30.32],   // St Petersburg
  aisha_kamara:     [8.48, -13.23],   // Freetown
  // Voyager-specific static customers
  lily_chen:          [41.88, -87.63],  // stuck at ORD (Chicago)
  amara_okafor:       [34.05, -118.24], // LAX (Los Angeles)
  priya_sharma_patel: [42.36, -71.06],  // heading to BOS (Boston)
  fatima_al_rashidi:  [44.98, -93.27],  // MSP (Minneapolis)
  brendan_osullivan:  [42.21, -83.35],  // DTW (Detroit)
  chen_wei:           [37.62, -122.38], // SFO area
  sarah_collins:      [47.45, -122.31], // SEA (Seattle)
};

// ─── Utilities ──────────────────────────────────────────────────────────────

const GLOBE_RADIUS = 2;

function latLngToPosition(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/** Fibonacci sphere fallback for customers without known coordinates. */
function fibonacciPosition(index: number, total: number, radius: number): THREE.Vector3 {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (index / (total - 1)) * 2;
  const radiusAtY = Math.sqrt(1 - y * y);
  const theta = goldenAngle * index;
  return new THREE.Vector3(
    Math.cos(theta) * radiusAtY * radius,
    y * radius,
    Math.sin(theta) * radiusAtY * radius,
  );
}

const STATUS_COLORS: Record<string, string> = {
  open:      "#3b82f6",
  pending:   "#f59e0b",
  escalated: "#ef4444",
  resolved:  "#22c55e",
  parked:    "#8b5cf6",
};

const PRIORITY_GLOW: Record<string, number> = {
  Critical: 1.8,
  High: 1.4,
  Medium: 1.0,
  Low: 0.6,
};

function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? "#6b7280";
}

// ─── Globe Wireframe ────────────────────────────────────────────────────────

function GlobeWireframe() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const theme = useGlobeTheme();

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.02;
    if (glowRef.current) glowRef.current.rotation.y += delta * 0.02;
  });

  // Build latitude / longitude grid lines
  const gridLines = useMemo(() => {
    const points: THREE.Vector3[][] = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      const ring: THREE.Vector3[] = [];
      for (let lng = 0; lng <= 360; lng += 4) {
        ring.push(latLngToPosition(lat, lng, GLOBE_RADIUS * 1.001));
      }
      points.push(ring);
    }
    for (let lng = 0; lng < 360; lng += 30) {
      const meridian: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 4) {
        meridian.push(latLngToPosition(lat, lng, GLOBE_RADIUS * 1.001));
      }
      points.push(meridian);
    }
    return points;
  }, []);

  const dotPositions = useMemo(() => {
    const positions: number[] = [];
    for (let i = 0; i < 3000; i++) {
      const pos = fibonacciPosition(i, 3000, GLOBE_RADIUS * 1.002);
      positions.push(pos.x, pos.y, pos.z);
    }
    return new Float32Array(positions);
  }, []);

  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[GLOBE_RADIUS, 4]} />
        <meshBasicMaterial color={theme.wireColor} wireframe transparent opacity={theme.wireOpacity} />
      </mesh>

      {gridLines.map((pts, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={pts.length}
              array={new Float32Array(pts.flatMap((p) => [p.x, p.y, p.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={theme.wireColor} transparent opacity={theme.gridOpacity} />
        </line>
      ))}

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={3000} array={dotPositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color={theme.dotColor} size={0.008} transparent opacity={theme.dotOpacity} sizeAttenuation />
      </points>

      <mesh ref={glowRef}>
        <sphereGeometry args={[GLOBE_RADIUS * 1.04, 48, 48]} />
        <meshBasicMaterial color={theme.wireColor} transparent opacity={theme.glowOpacity} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

// ─── Scan Ring ──────────────────────────────────────────────────────────────

/** Animated horizontal ring that sweeps up the globe like a radar scan. */
function ScanRing() {
  const ref = useRef<THREE.Mesh>(null);
  const theme = useGlobeTheme();
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime();
      ref.current.position.y = Math.sin(t * 0.4) * GLOBE_RADIUS;
      const y = ref.current.position.y;
      const r = Math.sqrt(Math.max(0, GLOBE_RADIUS * GLOBE_RADIUS - y * y));
      ref.current.scale.set(r / GLOBE_RADIUS, r / GLOBE_RADIUS, 1);
    }
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[GLOBE_RADIUS - 0.005, GLOBE_RADIUS + 0.005, 128]} />
      <meshBasicMaterial color={theme.wireColor} transparent opacity={theme.scanOpacity} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── Customer Marker ────────────────────────────────────────────────────────

function CustomerMarker({
  row,
  position,
  isHovered,
  isSelected,
  onHover,
  onClick,
}: {
  row: GlobeRow;
  position: THREE.Vector3;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const color = getStatusColor(row.status);
  const glowIntensity = PRIORITY_GLOW[row.priority] ?? 1.0;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Pulse animation
    if (pulseRef.current) {
      const scale = 1 + Math.sin(t * 2 + position.x * 3) * 0.3;
      pulseRef.current.scale.setScalar(scale);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.3 * (1 - (scale - 1) / 0.3);
    }
    // Hover scale
    if (meshRef.current) {
      const target = isHovered || isSelected ? 1.6 : 1.0;
      meshRef.current.scale.lerp(
        new THREE.Vector3(target, target, target),
        0.15,
      );
    }
  });

  const markerSize = row.priority === "Critical" ? 0.06 : row.priority === "High" ? 0.05 : 0.04;

  return (
    <group position={position}>
      {/* Core sphere */}
      <mesh
        ref={meshRef}
        onPointerEnter={(e) => { e.stopPropagation(); onHover(row.id); }}
        onPointerLeave={() => onHover(null)}
        onClick={(e) => { e.stopPropagation(); onClick(row.id); }}
      >
        <sphereGeometry args={[markerSize, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Outer glow ring */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[markerSize * 2, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3 * glowIntensity}
        />
      </mesh>

      {/* Vertical beam */}
      {(isHovered || isSelected) && (
        <mesh position={[0, markerSize * 3, 0]}>
          <cylinderGeometry args={[0.002, 0.002, markerSize * 6, 4]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} />
        </mesh>
      )}

      {/* Label */}
      <Html
        position={[0, markerSize * 2.5 + 0.04, 0]}
        center
        zIndexRange={[1, 0]}
        style={{
          pointerEvents: "none",
          opacity: isHovered || isSelected ? 1 : 0.7,
          transition: "opacity 0.2s",
        }}
      >
        <div
          className="whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wide"
          style={{
            background: `${color}22`,
            color,
            border: `1px solid ${color}44`,
            backdropFilter: "blur(4px)",
          }}
        >
          {row.name.split(" ")[0]}
        </div>
      </Html>
    </group>
  );
}

// ─── Hover Tooltip ──────────────────────────────────────────────────────────

function HoverTooltip({ row, position }: { row: GlobeRow; position: THREE.Vector3 }) {
  const color = getStatusColor(row.status);
  const theme = useGlobeTheme();
  return (
    <Html position={position} center zIndexRange={[10, 5]} style={{ pointerEvents: "none" }}>
      <div
        className="w-[260px] rounded-xl border p-3 shadow-2xl backdrop-blur-md"
        style={{
          background: theme.cardBg,
          borderColor: `${color}40`,
          transform: "translateY(-80px)",
        }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-semibold" style={{ color: theme.cardText }}>{row.name}</span>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}
          >
            {row.status}
          </span>
        </div>
        <p className="mb-2 text-[11px] leading-relaxed" style={{ color: theme.cardTextSecondary }}>{row.preview}</p>
        <div className="flex items-center gap-2 text-[10px]" style={{ color: theme.cardTextTertiary }}>
          <span>{row.botType}</span>
          <span>·</span>
          <span>{row.channel}</span>
          <span>·</span>
          <span>{row.waitTime}</span>
        </div>
      </div>
    </Html>
  );
}

// ─── Detail Card (click overlay) ────────────────────────────────────────────

function DetailCard({
  row,
  position,
  onClose,
}: {
  row: GlobeRow;
  position: THREE.Vector3;
  onClose: () => void;
}) {
  const color = getStatusColor(row.status);
  const theme = useGlobeTheme();
  const { pushTransferredToast } = useLayoutContext();

  return (
    <Html position={position} center zIndexRange={[100, 50]} style={{ zIndex: 100 }}>
      <div
        className="w-[340px] animate-in fade-in slide-in-from-bottom-2 rounded-2xl border shadow-2xl backdrop-blur-lg"
        style={{
          background: theme.cardBg,
          borderColor: `${color}30`,
          transform: "translateY(-120px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${theme.cardDivider}` }}>
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ background: color }}
            >
              {row.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: theme.cardText }}>{row.name}</p>
              <p className="text-[10px]" style={{ color: theme.cardTextTertiary }}>{row.customerId} · {row.company}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-full transition-colors"
            style={{ color: theme.cardTextTertiary }}
          >
            ✕
          </button>
        </div>

        {/* Status + Priority */}
        <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: `1px solid ${theme.cardDivider}` }}>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}
          >
            {row.status}
          </span>
          <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider" style={{ background: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: theme.cardTextSecondary }}>
            {row.priority}
          </span>
          <span className="ml-auto text-[10px]" style={{ color: theme.cardTextTertiary }}>
            {row.botType} · {row.channel} · {row.waitTime}
          </span>
        </div>

        {/* Customer Context */}
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${theme.cardDivider}` }}>
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-widest" style={{ color: theme.aiLabel }}>
            Customer Context
          </p>
          <p className="text-[11px] leading-relaxed" style={{ color: theme.cardTextSecondary }}>
            {row.customerContext
              ? row.customerContext.length > 200
                ? row.customerContext.slice(0, 200) + "…"
                : row.customerContext
              : row.preview}
          </p>
        </div>

        {/* AI Overview */}
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${theme.cardDivider}` }}>
          <div className="rounded-lg border p-2.5" style={{ background: theme.aiBoxBg, borderColor: theme.aiBoxBorder }}>
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-widest" style={{ color: theme.aiLabel }}>
              AI Agent Summary
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: theme.cardTextSecondary }}>{row.preview}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            onClick={() => { row.onMonitor(); onClose(); }}
            className="flex-1 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-all"
            style={{
              borderColor: theme.dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
              background: theme.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
              color: theme.cardText,
            }}
          >
            Review
          </button>
          <TakeoverButton
            botType={row.botType}
            customerName={row.name}
            customerRecordId={row.customerRecordId ?? ""}
            channel={row.channel}
            onTakeover={(handoffConversation) => {
              pushTransferredToast({
                id: row.id,
                name: row.name,
                customerId: row.customerId,
                customerRecordId: row.customerRecordId ?? "",
                channel: row.channel as AssignmentChannel,
                label: row.botType,
                priority: row.priority,
                preview: row.preview,
              });
              row.onTakeoverAccept(handoffConversation);
              onClose();
            }}
            className="flex-1 rounded-lg bg-cyan-500 px-3 py-2 text-center text-[12px] font-semibold text-white transition-all hover:bg-cyan-400"
          />
        </div>
      </div>
    </Html>
  );
}

// ─── Globe Scene ────────────────────────────────────────────────────────────

/** Keeps the Three.js scene background in sync with the globe theme. */
function SceneBackground() {
  const { scene, gl } = useThree();
  const theme = useGlobeTheme();

  useEffect(() => {
    if (theme.dark) {
      scene.background = new THREE.Color("#0f172a");
      gl.setClearColor("#0f172a", 1);
    } else {
      scene.background = new THREE.Color("#e8eff8");
      gl.setClearColor("#e8eff8", 1);
    }
  }, [theme.dark, scene, gl]);

  return null;
}

function GlobeScene({ rows }: { rows: GlobeRow[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);
  const theme = useGlobeTheme();

  const markers = useMemo(() => {
    let unknownIdx = 0;
    const unknownTotal = rows.filter(
      (r) => !CUSTOMER_COORDS[r.customerRecordId ?? ""],
    ).length;

    return rows.map((row) => {
      const coords = CUSTOMER_COORDS[row.customerRecordId ?? ""];
      let position: THREE.Vector3;
      if (coords) {
        position = latLngToPosition(coords[0], coords[1], GLOBE_RADIUS * 1.02);
      } else {
        position = fibonacciPosition(unknownIdx++, Math.max(unknownTotal, 20), GLOBE_RADIUS * 1.02);
      }
      return { row, position };
    });
  }, [rows]);

  const hoveredMarker = markers.find((m) => m.row.id === hoveredId);
  const selectedMarker = markers.find((m) => m.row.id === selectedId);

  const handleBackgroundClick = useCallback(() => {
    setSelectedId(null);
  }, []);

  return (
    <>
      <SceneBackground />
      <ambientLight intensity={theme.dark ? 0.4 : 0.8} />
      <pointLight position={[10, 10, 10]} intensity={theme.dark ? 0.3 : 0.5} />

      {/* Stars only in dark mode */}
      {theme.dark && (
        <Stars radius={80} depth={60} count={2500} factor={4} saturation={0} fade speed={0.5} />
      )}

      <mesh visible={false} onClick={handleBackgroundClick}>
        <sphereGeometry args={[50, 8, 8]} />
        <meshBasicMaterial side={THREE.BackSide} />
      </mesh>

      <GlobeWireframe />
      <ScanRing />

      {markers.map(({ row, position }) => (
        <CustomerMarker
          key={row.id}
          row={row}
          position={position}
          isHovered={hoveredId === row.id}
          isSelected={selectedId === row.id}
          onHover={setHoveredId}
          onClick={setSelectedId}
        />
      ))}

      {hoveredId && !selectedId && hoveredMarker && (
        <HoverTooltip row={hoveredMarker.row} position={hoveredMarker.position} />
      )}

      {selectedId && selectedMarker && (
        <DetailCard
          row={selectedMarker.row}
          position={selectedMarker.position}
          onClose={() => setSelectedId(null)}
        />
      )}

      <OrbitControls
        ref={controlsRef}
        enableZoom
        enablePan={false}
        minDistance={2.8}
        maxDistance={6}
        dampingFactor={0.05}
        enableDamping
      />
    </>
  );
}

// ─── Connection Arcs ────────────────────────────────────────────────────────

// (Reserved for future: animated arcs between related customers)

// ─── Main Export ────────────────────────────────────────────────────────────

/** Hook that syncs with the app-wide dark mode toggle (driven by `dark` class on <html>). */
function useAppDarkMode(): boolean {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    // Observe class changes on <html> to catch Layout.tsx toggling dark mode
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function GlobeView({ rows }: { rows: GlobeRow[] }) {
  const isDark = useAppDarkMode();
  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  const canvasBg = isDark
    ? "linear-gradient(180deg, #0a0e1a 0%, #0f172a 50%, #0a0e1a 100%)"
    : "linear-gradient(180deg, #e8eff8 0%, #f1f5fb 50%, #e8eff8 100%)";

  return (
    <GlobeThemeContext.Provider value={theme}>
      <div className="relative h-full w-full" style={{ minHeight: 500 }}>
        {/* Legend */}
        <div
          className="absolute left-4 top-4 z-10 flex flex-col gap-1 rounded-xl border px-3 py-2.5 backdrop-blur-md"
          style={{ background: theme.legendBg, borderColor: theme.legendBorder }}
        >
          <p className="mb-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: theme.legendLabel }}>
            Status
          </p>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: color, boxShadow: `0 0 6px ${color}` }}
              />
              <span className="text-[10px] capitalize" style={{ color: theme.legendText }}>{status}</span>
            </div>
          ))}
        </div>

        {/* Count badge */}
        <div
          className="absolute right-4 top-4 z-10 rounded-xl border px-3 py-2 backdrop-blur-md"
          style={{ background: theme.badgeBg, borderColor: theme.legendBorder }}
        >
          <p className="text-[10px]" style={{ color: theme.legendLabel }}>
            <span className="text-[16px] font-bold" style={{ color: theme.countColor }}>{rows.length}</span>{" "}
            active cases
          </p>
        </div>

        <Canvas
          camera={{ position: [0, 0.5, 6], fov: 45 }}
          style={{ background: canvasBg }}
          gl={{ antialias: true, alpha: false }}
        >
          <GlobeScene rows={rows} />
        </Canvas>
      </div>
    </GlobeThemeContext.Provider>
  );
}
