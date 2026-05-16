import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Zap, Trophy, Users, Globe } from "lucide-react";
import EnBriefingPage from "./EnBriefingPage";

const EN_PLAYER_NAME_KEY = "en-outbound-player-name";

type Step = "landing" | "briefing";

export default function EnHome() {
  const [step, setStep] = useState<Step>("landing");
  const [playerName, setPlayerName] = useState(() => localStorage.getItem(EN_PLAYER_NAME_KEY) ?? "");
  const [inputName, setInputName] = useState(playerName);

  const stats = trpc.enLeaderboard.stats.useQuery();

  const handleStart = () => {
    const name = inputName.trim();
    if (!name) return;
    localStorage.setItem(EN_PLAYER_NAME_KEY, name);
    setPlayerName(name);
    setStep("briefing");
  };

  const handleEnterGame = () => {
    window.location.href = `/en/game?player=${encodeURIComponent(playerName)}`;
  };

  const handleSkip = () => {
    window.location.href = `/en/game?player=${encodeURIComponent(playerName)}`;
  };

  // Show briefing step
  if (step === "briefing") {
    return (
      <EnBriefingPage
        playerName={playerName}
        onEnterGame={handleEnterGame}
        onSkip={handleSkip}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Globe className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 font-medium">Strategy Implementation Simulation</span>
          <span>·</span>
          <span>Multiplayer Edition</span>
        </div>
        <Link href="/en/leaderboard">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white gap-2">
            <Trophy className="w-4 h-4" />
            Leaderboard
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* Badge */}
        <Badge className="mb-8 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs px-4 py-1.5 rounded-full">
          <Zap className="w-3 h-3 mr-1.5" />
          Strategy Implementation · Multiplayer Edition
        </Badge>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
          <span className="text-white">Corporate</span>{" "}
          <span className="text-emerald-400">Integration</span>
          <br />
          <span className="text-white">Management</span>
        </h1>

        <p className="text-white/50 text-lg max-w-xl mb-12 leading-relaxed">
          You are the Integration Lead sent by HQ to oversee an overseas acquisition.
          Within <strong className="text-white/80">60 resource units</strong>, convert all{" "}
          <strong className="text-white/80">12 key stakeholders</strong> to drive successful organizational change —
          and compare your strategy with peers on the leaderboard.
        </p>

        {/* Stats */}
        {stats.data && stats.data.count > 0 && (
          <div className="flex gap-8 mb-12 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-400">{stats.data.count}</div>
              <div className="text-xs text-white/40 mt-1">Games Played</div>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <div className="text-2xl font-bold text-emerald-400">{Math.round(stats.data.avgTotal)}</div>
              <div className="text-xs text-white/40 mt-1">Avg. Score</div>
            </div>
          </div>
        )}

        {/* Name input + Start */}
        <div className="w-full max-w-sm space-y-3">
          <Input
            value={inputName}
            onChange={e => setInputName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleStart()}
            placeholder="Enter your name to begin..."
            className="bg-white/5 border-white/20 text-white placeholder:text-white/30 text-center h-12 text-base focus:border-emerald-500"
          />
          <Button
            onClick={handleStart}
            disabled={!inputName.trim()}
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base transition-all"
          >
            Start Game →
          </Button>
        </div>

        {/* Links */}
        <div className="mt-8 flex gap-6 text-sm text-white/40">
          <Link href="/en/leaderboard" className="hover:text-white/70 transition-colors flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            View Rankings
          </Link>
          <Link href="/" className="hover:text-white/70 transition-colors">
            中文版 →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-4 text-center text-xs text-white/20">
        Copyright © Prof. Shipeng Yan
      </footer>
    </div>
  );
}
