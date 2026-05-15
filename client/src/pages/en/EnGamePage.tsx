/**
 * ENGLISH GAME PAGE — /en/game
 * Mirrors GamePage.tsx but uses:
 *  - game-engine-en.html (English engine)
 *  - trpc.enGame.* procedures (independent DB tables)
 *  - English UI strings throughout
 */
import React, { useState, useRef, useCallback, useEffect } from "react";
import confetti from "canvas-confetti";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trophy, RotateCcw, UserRound, Loader2, Home } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import gameEngineEnHtml from "../../game-engine-en.html?raw";

const EN_PLAYER_NAME_KEY = "en-outbound-player-name";
const EN_SESSION_ID_KEY = "en-outbound-session-id";
const EN_GAME_RESULT_KEY = "en-outbound-game-result";
const EN_FROZEN_SESSION_KEY = "en-outbound-frozen-session";

// ─── CSV export helper ────────────────────────────────────────────────────────
function escapeCsv(val: unknown): string {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
function downloadCsv(rows: unknown[][], filename: string) {
  const csv = rows.map(r => r.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Inject playerName + autoStart into the engine HTML
function buildEngineSrcdoc(playerName: string): string {
  const escaped = playerName.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/</g, '\\u003c');
  const injection = `<script>try{Object.defineProperty(location,'search',{configurable:true,get:function(){return '?autoStart=1&playerName=${escaped}';}});}catch(e){}<\/script>`;
  const headIdx = gameEngineEnHtml.indexOf('<head>');
  if (headIdx !== -1) {
    return gameEngineEnHtml.slice(0, headIdx + 6) + injection + gameEngineEnHtml.slice(headIdx + 6);
  }
  return injection + gameEngineEnHtml;
}

interface TurnData {
  round: number;
  actionId: string;
  actionLabel: string;
  actionType?: string;
  targets: string[];
  prediction: string;
  story?: string;
  deltas: { cred: number; pressure: number; converted: number };
  movers?: string[] | Array<{ id: string; name: string; before: number; after: number }>;
  credAfter: number;
  pressureAfter: number;
  weeksUsed?: number;
  weeksLeft: number;
  turnScore?: number;
  milestones?: string[];
  convertedAfter?: number;
}

interface GameResult {
  endingType: string;
  won: boolean;
  convertedCount: number;
  totalPeople: number;
  resourcesLeft: number;
  finalCred: number;
  finalPressure: number;
  totalRounds: number;
  baseScore: number;
  conversionScore: number;
  healthScore: number;
  totalScore: number;
  history: TurnData[];
  aggressiveIndex?: number;
  conservativeIndex?: number;
}

interface ConversionData {
  count: number;
  names: string[];
}

// ─── Confetti burst ───────────────────────────────────────────────────────────
function fireConversionConfetti(count: number) {
  if (count <= 0) return;
  const colors = ["#4ade80", "#22d3ee", "#facc15", "#f472b6", "#a78bfa"];
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.3 + Math.random() * 0.4, y: 0.55 },
        colors,
        startVelocity: 45,
        gravity: 1.2,
        ticks: 200,
        scalar: 0.9,
        zIndex: 9999,
      });
    }, i * 320);
  }
}

// ─── Action type config (English engine type values) ─────────────────────────
const ACTION_TYPE_CONFIG: Record<string, { icon: string; hex: string; bg: string }> = {
  "Demonstrate": { icon: "🎯", hex: "#22d3ee", bg: "from-cyan-950/80 to-slate-950/90" },
  "Dialogue":    { icon: "💬", hex: "#60a5fa", bg: "from-blue-950/80 to-slate-950/90" },
  "Empower":     { icon: "⚡",  hex: "#fde047", bg: "from-yellow-950/80 to-slate-950/90" },
  "Structure":   { icon: "🏛",  hex: "#34d399", bg: "from-emerald-950/80 to-slate-950/90" },
  // also handle Chinese keys in case engine still sends them
  "示范": { icon: "🎯", hex: "#22d3ee", bg: "from-cyan-950/80 to-slate-950/90" },
  "沟通": { icon: "💬", hex: "#60a5fa", bg: "from-blue-950/80 to-slate-950/90" },
  "赋能": { icon: "⚡",  hex: "#fde047", bg: "from-yellow-950/80 to-slate-950/90" },
  "制度": { icon: "🏛",  hex: "#34d399", bg: "from-emerald-950/80 to-slate-950/90" },
};
const DEFAULT_CFG = { icon: "💡", hex: "#94a3b8", bg: "from-slate-900/80 to-slate-950/90" };

// ─── Conversion Popup ─────────────────────────────────────────────────────────
function ConversionPopup({ data, onDismiss }: { data: ConversionData; onDismiss: () => void }) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(onDismiss, 2800);
    return () => clearTimeout(t);
  }, [onDismiss]);
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { e.preventDefault(); onDismiss(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onDismiss]);
  return (
    <div
      onClick={onDismiss}
      className="absolute inset-0 z-50 flex items-center justify-center cursor-pointer"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", opacity: visible ? 1 : 0, transition: "opacity 0.25s ease" }}
    >
      <div
        style={{
          transform: visible ? "scale(1) translateY(0)" : "scale(0.85) translateY(20px)",
          transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          background: "linear-gradient(135deg, rgba(16,40,28,0.97) 0%, rgba(10,30,20,0.99) 100%)",
          border: "1px solid rgba(74,222,128,0.4)",
          boxShadow: "0 0 60px rgba(74,222,128,0.25), 0 20px 60px rgba(0,0,0,0.6)",
        }}
        className="rounded-2xl px-10 py-8 max-w-sm w-full mx-4 text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative flex items-center justify-center mb-5">
          <div style={{ background: "rgba(74,222,128,0.15)", boxShadow: "0 0 40px rgba(74,222,128,0.4)" }}
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl animate-pulse">
            ✨
          </div>
        </div>
        <div className="text-green-400 font-bold text-lg mb-1 tracking-wide">
          {data.count === 1 ? "Stakeholder Converted!" : `${data.count} Stakeholders Converted!`}
        </div>
        {data.names.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-3 mb-4">
            {data.names.map(name => (
              <span key={name} className="px-3 py-1 rounded-full text-sm font-semibold text-green-300"
                style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.35)" }}>
                ✓ {name}
              </span>
            ))}
          </div>
        )}
        <div className="text-xs text-muted-foreground/60 mt-3">Click anywhere or press any key to continue</div>
      </div>
    </div>
  );
}

// ─── Turn Overlay ─────────────────────────────────────────────────────────────
function TurnOverlay({ turn, onDismiss }: { turn: TurnData; onDismiss: () => void }) {
  const isFinal = turn.weeksLeft === 0;
  const finalHex = "#ef4444";
  const cfg = isFinal
    ? { icon: "🔥", hex: finalHex, bg: "from-red-950/90 to-slate-950/95" }
    : (ACTION_TYPE_CONFIG[turn.actionType ?? ""] ?? DEFAULT_CFG);
  const targets: string[] = Array.isArray(turn.targets) ? turn.targets : [];
  const weeksUsed = turn.weeksUsed ?? null;
  const c = cfg.hex;

  useEffect(() => {
    const t = setTimeout(onDismiss, isFinal ? 3000 : 2400);
    return () => clearTimeout(t);
  }, [onDismiss, isFinal]);

  useEffect(() => {
    const handler = () => onDismiss();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onDismiss]);

  return (
    <div className="absolute inset-0 z-50 overflow-hidden cursor-pointer" style={{ background: "#000" }} onClick={onDismiss}>
      <div className={`absolute inset-0 bg-gradient-to-br ${cfg.bg}`} style={{ animation: "bgReveal 0.15s ease-out both" }} />
      {isFinal && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ boxShadow: `inset 0 0 80px ${finalHex}55, inset 0 0 160px ${finalHex}22`, animation: "finalPulse 0.8s ease-in-out 0.1s infinite alternate" }} />
      )}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(118deg, transparent 42%, ${c}18 42%, ${c}28 50%, transparent 50%)`, animation: "slashReveal 0.25s ease-out 0.05s both" }} />
      <div className="absolute top-0 left-0 right-0"
        style={{ height: isFinal ? "3px" : "4px", background: `linear-gradient(90deg, ${c}, ${c}88, transparent)`, animation: "stripeIn 0.2s ease-out both" }} />
      <div className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, transparent, ${c}66, ${c})`, animation: "stripeIn 0.2s ease-out 0.05s both" }} />
      <div className="absolute top-5 left-5 flex items-center gap-2" style={{ animation: "slideRight 0.2s ease-out 0.1s both" }}>
        <div className="w-1 h-6 rounded-full" style={{ background: c }} />
        <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: `${c}cc` }}>ROUND {turn.round}</span>
      </div>
      {isFinal ? (
        <div className="absolute top-4 right-5 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase"
          style={{ background: `${finalHex}22`, border: `1px solid ${finalHex}66`, color: finalHex, animation: "finalBadge 0.3s cubic-bezier(0.34,1.56,0.64,1) 0.12s both" }}>
          ⚠️ FINAL ACTION
        </div>
      ) : (
        <div className="absolute top-5 right-5 text-[10px] tracking-wider" style={{ color: `${c}44`, animation: "fadeIn 0.3s ease-out 0.3s both" }}>
          PRESS ANY KEY TO SKIP
        </div>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8">
        <div className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: `${c}99`, animation: "fadeUp 0.18s ease-out 0.1s both" }}>
          {isFinal ? "LAST CHANCE" : (turn.actionType ?? "")}
        </div>
        <div className="text-center font-black leading-none"
          style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", color: "#fff", textShadow: `0 0 40px ${c}80, 0 0 80px ${c}40`, animation: "heroReveal 0.22s cubic-bezier(0.22,1,0.36,1) 0.08s both", letterSpacing: "-0.02em" }}>
          {turn.actionLabel}
        </div>
        <div className="h-px w-32" style={{ background: `linear-gradient(90deg, transparent, ${c}, transparent)`, animation: "lineExpand 0.25s ease-out 0.18s both" }} />
        {targets.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2" style={{ animation: "fadeUp 0.2s ease-out 0.22s both" }}>
            {targets.map((t, i) => (
              <span key={i} className="text-sm font-semibold px-3 py-1 rounded-full"
                style={{ background: `${c}18`, border: `1px solid ${c}44`, color: `${c}ee` }}>
                {t}
              </span>
            ))}
          </div>
        )}
        {weeksUsed !== null && (
          <div className="text-xs font-medium" style={{ color: isFinal ? `${finalHex}88` : "#fbbf2499", animation: "fadeUp 0.2s ease-out 0.26s both" }}>
            ⏱ {weeksUsed} weeks used
          </div>
        )}
      </div>
      <div className="absolute bottom-6 left-6 text-7xl select-none pointer-events-none" style={{ opacity: 0.12, animation: "fadeIn 0.3s ease-out 0.05s both", filter: "blur(1px)" }}>
        {cfg.icon}
      </div>
      <style>{`
        @keyframes bgReveal    { from { opacity:0 } to { opacity:1 } }
        @keyframes slashReveal { from { opacity:0; transform:translateX(-20px) } to { opacity:1; transform:translateX(0) } }
        @keyframes stripeIn    { from { transform:scaleX(0); transform-origin:left } to { transform:scaleX(1); transform-origin:left } }
        @keyframes slideRight  { from { opacity:0; transform:translateX(-16px) } to { opacity:1; transform:translateX(0) } }
        @keyframes fadeIn      { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeUp      { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes heroReveal  { from { opacity:0; transform:scale(0.88) translateY(8px) } to { opacity:1; transform:scale(1) translateY(0) } }
        @keyframes lineExpand  { from { transform:scaleX(0) } to { transform:scaleX(1) } }
        @keyframes finalPulse  { from { opacity:0.6 } to { opacity:1 } }
        @keyframes finalBadge  { from { opacity:0; transform:scale(0.7) translateX(8px) } to { opacity:1; transform:scale(1) translateX(0) } }
      `}</style>
    </div>
  );
}

// ─── Simple Result Page (English) ─────────────────────────────────────────────
function EnResultPage({ result, playerName, isSaved, onRestart }: {
  result: GameResult;
  playerName: string;
  isSaved?: boolean;
  onRestart: () => void;
}) {
  const won = result.won;
  const score = Math.round(Number(result.totalScore) || 0);
  const converted = Number(result.convertedCount) || 0;
  const total = Number(result.totalPeople) || 10;
  const rounds = Number(result.totalRounds) || 0;
  const cred = Number(result.finalCred) || 0;
  const pressure = Number(result.finalPressure) || 0;
  const resources = Number(result.resourcesLeft) || 0;

  // Build trend from history
  const trendData = (result.history ?? []).map((h, idx) => ({
    round: h.round ?? (idx + 1),
    cred: h.credAfter ?? null,
    pressure: h.pressureAfter ?? null,
    converted: (result.history ?? []).slice(0, idx + 1).reduce((acc, x) => acc + ((x.deltas?.converted ?? 0)), 0),
  }));

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">{won ? "🏆" : "💪"}</div>
          <h1 className="text-4xl font-black mb-2">
            {won ? "Integration Successful!" : "Change Stalled"}
          </h1>
          <p className="text-white/50 text-lg">{playerName}</p>
          {isSaved && (
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              ✓ Saved to Leaderboard
            </div>
          )}
        </div>

        {/* Score */}
        <div className="bg-white/5 rounded-2xl p-8 text-center mb-6 border border-white/10">
          <div className="text-7xl font-black text-emerald-400 mb-2">{score}</div>
          <div className="text-white/40 text-sm">Total Score</div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { label: "Converted", value: `${converted}/${total}`, color: "text-emerald-400" },
              { label: "Rounds", value: rounds, color: "text-blue-400" },
              { label: "Resources Left", value: resources, color: "text-yellow-400" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-white/40 text-xs mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: "Final Credibility", value: cred, max: 100, color: "#22d3ee" },
            { label: "Final Resistance", value: pressure, max: 100, color: "#f87171" },
          ].map(({ label, value, max, color }) => (
            <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-xs text-white/40 mb-2">{label}</div>
              <div className="text-2xl font-bold" style={{ color }}>{value}</div>
              <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Trend chart */}
        {trendData.length > 0 && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
            <div className="text-xs text-white/40 mb-3">Progress Over Rounds</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="round" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="cred" stroke="#22d3ee" dot={false} strokeWidth={2} name="Credibility" />
                <Line type="monotone" dataKey="pressure" stroke="#f87171" dot={false} strokeWidth={2} name="Resistance" />
                <Line type="monotone" dataKey="converted" stroke="#4ade80" dot={false} strokeWidth={2} name="Converted" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={onRestart} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-12">
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
          <Link href="/en/leaderboard">
            <Button variant="outline" className="h-12 gap-2 bg-white/5 border-white/20 text-white hover:bg-white/10">
              <Trophy className="w-4 h-4" />
              Leaderboard
            </Button>
          </Link>
          <Link href="/en">
            <Button variant="ghost" className="h-12 gap-2 text-white/60 hover:text-white">
              <Home className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Normalise mover for DB save ──────────────────────────────────────────────
function normaliseMoverForSave(m: unknown): { id: string; name: string; before: number; after: number } {
  if (typeof m === "string") {
    // "Name: Status → Status" or "Name：Status → Status"
    const match = m.match(/^(.+?)[:：](.+?) → (.+)$/);
    if (match) {
      const statusLabels = ["Unaware", "Aware", "Interested", "Committed", "Converted",
        "未动", "意识觉醒", "初步理解", "主动参与", "已转化"];
      const [, name, beforeLabel, afterLabel] = match;
      return {
        id: name.trim(),
        name: name.trim(),
        before: statusLabels.indexOf(beforeLabel.trim()),
        after: statusLabels.indexOf(afterLabel.trim()),
      };
    }
    return { id: m, name: m, before: 0, after: 0 };
  }
  if (m && typeof m === "object") {
    const obj = m as { id?: string; name?: string; before?: number; after?: number };
    return { id: obj.id ?? obj.name ?? "", name: obj.name ?? "", before: obj.before ?? 0, after: obj.after ?? 0 };
  }
  return { id: "", name: "", before: 0, after: 0 };
}

// ─── Main EnGamePage component ────────────────────────────────────────────────
export default function EnGamePage() {
  const playerName = localStorage.getItem(EN_PLAYER_NAME_KEY) ?? "";
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [gameResult, setGameResultState] = useState<GameResult | null>(() => {
    try { const s = localStorage.getItem(EN_GAME_RESULT_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const setGameResult = useCallback((r: GameResult | null) => {
    setGameResultState(r);
    try { if (r != null) localStorage.setItem(EN_GAME_RESULT_KEY, JSON.stringify(r)); else localStorage.removeItem(EN_GAME_RESULT_KEY); } catch { /* ignore */ }
  }, []);

  const [frozenSessionId, setFrozenSessionIdState] = useState<number | null>(() => {
    try { const s = localStorage.getItem(EN_FROZEN_SESSION_KEY); return s ? Number(s) : null; } catch { return null; }
  });
  const setFrozenSessionId = useCallback((id: number | null) => {
    setFrozenSessionIdState(id);
    try { if (id != null) localStorage.setItem(EN_FROZEN_SESSION_KEY, String(id)); else localStorage.removeItem(EN_FROZEN_SESSION_KEY); } catch { /* ignore */ }
  }, []);

  const [iframeKey, setIframeKey] = useState(0);
  const [gameReady, setGameReady] = useState(false);
  const [gameEnding, setGameEnding] = useState(false);
  const [gameSaved, setGameSaved] = useState(false);
  const [turnOverlay, setTurnOverlay] = useState<TurnData | null>(null);
  const [conversionPopup, setConversionPopup] = useState<ConversionData | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const [sessionId, setSessionIdState] = useState<number | null>(() => {
    try { const s = localStorage.getItem(EN_SESSION_ID_KEY); return s ? Number(s) : null; } catch { return null; }
  });
  const setSessionId = useCallback((id: number | null) => {
    setSessionIdState(id);
    try { if (id != null) localStorage.setItem(EN_SESSION_ID_KEY, String(id)); else localStorage.removeItem(EN_SESSION_ID_KEY); } catch { /* ignore */ }
  }, []);

  const startSession = trpc.enGame.startSession.useMutation();
  const saveTurnMutation = trpc.enGame.saveTurn.useMutation();
  const endSession = trpc.enGame.endSession.useMutation();
  const utils = trpc.useUtils();

  const sessionIdRef = useRef<number | null>(sessionId);
  const endSessionRef = useRef(endSession.mutateAsync);
  const saveTurnRef = useRef(saveTurnMutation.mutateAsync);
  const utilsRef = useRef(utils);
  useEffect(() => { endSessionRef.current = endSession.mutateAsync; });
  useEffect(() => { saveTurnRef.current = saveTurnMutation.mutateAsync; });
  useEffect(() => { utilsRef.current = utils; });

  const gameReadyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendOverlayDismissed = useCallback(() => {
    try { iframeRef.current?.contentWindow?.postMessage({ type: "OVERLAY_DISMISSED" }, "*"); } catch (_) { /* safe */ }
  }, []);

  const dismissConversionPopup = useCallback(() => {
    setConversionPopup(null);
    sendOverlayDismissed();
  }, [sendOverlayDismissed]);

  const dismissTurnOverlay = useCallback(() => {
    const pending = turnOverlay;
    setTurnOverlay(null);
    if (pending && pending.deltas.converted > 0) {
      const names: string[] = [];
      if (pending.movers) {
        for (const m of pending.movers) {
          if (typeof m === "object" && m !== null && "after" in m && "before" in m) {
            const mo = m as { id: string; name: string; before: number; after: number };
            if (mo.after === 4 && mo.before < 4) names.push(mo.name);
          }
        }
      }
      fireConversionConfetti(pending.deltas.converted);
      setConversionPopup({ count: pending.deltas.converted, names });
    } else {
      sendOverlayDismissed();
    }
  }, [turnOverlay, sendOverlayDismissed]);

  const handleIframeLoad = useCallback(() => {
    if (!iframeRef.current || !playerName) return;
    const win = iframeRef.current.contentWindow;
    if (!win) return;
    win.postMessage({ type: "SET_PLAYER", name: playerName }, "*");
    setTimeout(() => { try { win.postMessage({ type: "SKIP_INTRO" }, "*"); } catch (_) {} }, 80);
    if (gameReadyTimeoutRef.current) clearTimeout(gameReadyTimeoutRef.current);
    gameReadyTimeoutRef.current = setTimeout(() => setGameReady(true), 2000);
  }, [playerName]);

  const handleStartGame = useCallback(async (name?: string) => {
    const activeName = name ?? playerName;
    if (!activeName) return;
    setGameResult(null);
    setFrozenSessionId(null);
    setGameReady(false);
    try {
      const session = await startSession.mutateAsync({ playerName: activeName });
      const newId = session.sessionId;
      setSessionId(newId);
      sessionIdRef.current = newId;
      setIframeKey(k => k + 1);
      await new Promise(r => setTimeout(r, 50));
    } catch {
      toast.error("Failed to create game session. Please try again.");
    }
  }, [playerName, startSession, setSessionId]);

  const handleMessage = useCallback(async (event: MessageEvent) => {
    if (!event.data?.type) return;
    if (event.data.type === "GAME_READY") {
      if (gameReadyTimeoutRef.current) { clearTimeout(gameReadyTimeoutRef.current); gameReadyTimeoutRef.current = null; }
      setGameReady(true);
      return;
    }
    const sid = sessionIdRef.current;
    if (event.data.type === "GAME_TURN" && sid !== null) {
      const turn = event.data.turn as TurnData;
      setTurnOverlay(turn);
      try {
        await saveTurnRef.current({
          sessionId: sid,
          round: turn.round,
          actionId: turn.actionId,
          actionLabel: turn.actionLabel,
          targets: turn.targets,
          prediction: turn.prediction,
          credibilityAfter: turn.credAfter,
          pressureAfter: turn.pressureAfter,
          resourcesAfter: turn.weeksLeft,
          outcome: turn.deltas.converted > 0 ? "success" : "partial",
          actionType: turn.actionType,
          story: turn.story,
          deltaConverted: turn.deltas.converted,
          weeksUsed: turn.weeksUsed,
          turnScore: turn.turnScore,
          milestones: turn.milestones,
          movers: (turn.movers ?? []).map(normaliseMoverForSave),
        });
        setLastSavedAt(new Date());
      } catch { /* non-blocking */ }
    }
    if (event.data.type === "GAME_ENDED") {
      const result = event.data.result as GameResult;
      setGameEnding(true);
      const currentSid = sessionIdRef.current;
      setFrozenSessionId(currentSid);
      if (currentSid !== null) {
        try {
          await endSessionRef.current({
            sessionId: currentSid,
            status: result.won ? "win" : "fail",
            resourcesLeft: Number(result.resourcesLeft) || 0,
            finalCredibility: Number(result.finalCred) || 0,
            finalPressure: Number(result.finalPressure) || 0,
            convertedCount: Number(result.convertedCount) || 0,
            totalRounds: Number(result.totalRounds) || 0,
            totalScore: Number(result.totalScore) || 0,
            baseScore: Number(result.baseScore) || 0,
            healthScore: Number(result.healthScore) || 0,
            aggressiveIndex: Number(result.aggressiveIndex) || 0,
            conservativeIndex: Number(result.conservativeIndex) || 0,
          });
          await utilsRef.current.enLeaderboard.list.invalidate();
          toast.success(`🎮 Game Over! Score: ${Math.round(Number(result.totalScore) || 0)} — saved to leaderboard`);
          setGameSaved(true);
        } catch (err) {
          console.error("[enEndSession] failed:", err);
          toast.error("Failed to save game record. Please screenshot and contact admin.");
        }
      }
      setGameEnding(false);
      setGameResult(result);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // Auto-start when playerName is available and no active session
  useEffect(() => {
    if (playerName && sessionId === null && !gameResult) {
      handleStartGame(playerName);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!playerName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 bg-[#0a0f0d] text-white">
        <p className="text-white/50">Please enter your name on the home page first.</p>
        <Link href="/en">
          <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold">Go to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen relative">
      {/* Toolbar */}
      {!gameResult && !gameEnding && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <UserRound className="w-3.5 h-3.5 text-emerald-400" />
              {playerName}
            </span>
            {sessionId !== null && (
              <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400/30">
                Game in Progress
              </Badge>
            )}
            {sessionId !== null && (
              <span className="text-xs text-muted-foreground">
                {lastSavedAt ? "✓ Auto-saved" : "• Auto-saves each round"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {sessionId === null ? (
              <Button size="sm" className="gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                onClick={() => handleStartGame()} disabled={startSession.isPending}>
                {startSession.isPending ? "Creating..." : "🚀 Start Game"}
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 bg-card">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restart
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Restart Game?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will end your current game. Your turn records have been auto-saved.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      onClick={() => handleStartGame()}>
                      Confirm Restart
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Link href="/en/leaderboard">
              <Button size="sm" variant="ghost" className="gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                Rankings
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Transition overlay */}
      {gameEnding && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#0a0f0d]">
          <div className="w-10 h-10 rounded-full border-4 border-emerald-400/20 border-t-emerald-400 animate-spin" />
          <p className="text-sm text-white/40">Calculating results…</p>
        </div>
      )}

      {/* Result page */}
      {gameResult ? (
        <div className="flex-1 overflow-hidden">
          <EnResultPage
            result={gameResult}
            playerName={playerName}
            isSaved={gameSaved}
            onRestart={() => {
              setGameResult(null);
              setFrozenSessionId(null);
              setSessionId(null);
              sessionIdRef.current = null;
              setGameSaved(false);
              localStorage.removeItem(EN_GAME_RESULT_KEY);
              localStorage.removeItem(EN_FROZEN_SESSION_KEY);
              handleStartGame();
            }}
          />
        </div>
      ) : sessionId !== null ? (
        /* Game iframe */
        <div className="flex-1 relative">
          <div
            className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 transition-opacity duration-500"
            style={{ background: "#0a0f0d", opacity: gameReady ? 0 : 1, pointerEvents: gameReady ? "none" : "auto" }}
          >
            <div className="w-10 h-10 rounded-full border-4 border-emerald-400/20 border-t-emerald-400 animate-spin" />
            <p className="text-sm text-white/40">Loading game…</p>
          </div>
          <iframe
            key={iframeKey}
            ref={iframeRef}
            srcDoc={buildEngineSrcdoc(playerName ?? "")}
            className="w-full h-full border-none"
            onLoad={handleIframeLoad}
            title="Corporate Integration Management"
            sandbox="allow-scripts allow-forms allow-popups allow-downloads allow-same-origin"
          />
          {turnOverlay && <TurnOverlay turn={turnOverlay} onDismiss={dismissTurnOverlay} />}
          {conversionPopup && !turnOverlay && <ConversionPopup data={conversionPopup} onDismiss={dismissConversionPopup} />}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 bg-[#0a0f0d]">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold mb-2 text-white">Ready, {playerName}?</h2>
            <p className="text-white/50 mb-6">Click Start Game to begin. Your score will be saved to the leaderboard automatically.</p>
            <Button size="lg" className="gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
              onClick={() => handleStartGame()} disabled={startSession.isPending}>
              {startSession.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</> : "🚀 Start Game"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
