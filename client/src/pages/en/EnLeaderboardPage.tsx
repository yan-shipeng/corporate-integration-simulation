import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Home, ArrowLeft, CheckCircle2, XCircle, TrendingUp, Users, Star } from "lucide-react";

const EN_PLAYER_NAME_KEY = "en-outbound-player-name";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-400 font-black text-lg">🥇</span>;
  if (rank === 2) return <span className="text-slate-300 font-black text-lg">🥈</span>;
  if (rank === 3) return <span className="text-amber-600 font-black text-lg">🥉</span>;
  return <span className="text-white/40 font-mono text-sm w-6 text-center">{rank}</span>;
}

function strategyBias(aggressive: number, conservative: number) {
  if (aggressive > conservative * 1.5) return { label: "Aggressive", color: "text-red-400" };
  if (conservative > aggressive * 1.5) return { label: "Cautious", color: "text-blue-400" };
  return { label: "Balanced", color: "text-emerald-400" };
}

export default function EnLeaderboardPage() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [, navigate] = useLocation();
  const myName = localStorage.getItem(EN_PLAYER_NAME_KEY) ?? "";

  const { data: rows = [], isLoading } = trpc.enLeaderboard.list.useQuery({ limit: 100 });
  const { data: stats } = trpc.enLeaderboard.stats.useQuery();

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id]
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h1 className="font-bold text-lg">Leaderboard</h1>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
            Integration Challenge
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length === 2 && (
            <Link href={`/en/compare/${selectedIds[0]}/${selectedIds[1]}`}>
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Compare Selected
              </Button>
            </Link>
          )}
          <Link href="/en">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white gap-1.5">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats */}
        {stats && stats.count > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Games", value: stats.count, icon: Users },
              { label: "Avg. Score", value: Math.round(stats.avgTotal), icon: Star },
              { label: "Avg. Efficiency", value: Math.round(stats.avgEfficiency * 10) / 10, icon: TrendingUp },
              { label: "Avg. Health", value: Math.round(stats.avgHealth * 10) / 10, icon: CheckCircle2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 text-white/40 text-xs mb-2">
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </div>
                <div className="text-2xl font-bold text-emerald-400">{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Selection hint */}
        {selectedIds.length > 0 && (
          <div className="mb-4 text-sm text-white/50 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {selectedIds.length === 1 ? "Select one more to compare" : "2 sessions selected — click Compare"}
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-20 text-white/30">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No completed games yet.</p>
            <Link href="/en">
              <Button className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold">Play Now</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map(row => {
              const isMe = row.playerName === myName;
              const isSelected = selectedIds.includes(row.id);
              const bias = strategyBias(row.aggressiveIndex ?? 0, row.conservativeIndex ?? 0);
              return (
                <div
                  key={row.id}
                  onClick={() => toggleSelect(row.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-emerald-500/10 border-emerald-500/50"
                      : isMe
                      ? "bg-white/8 border-white/20"
                      : "bg-white/3 border-white/8 hover:bg-white/6"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 flex justify-center flex-shrink-0">
                    <RankBadge rank={row.rank} />
                  </div>

                  {/* Name + status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold truncate ${isMe ? "text-emerald-400" : "text-white"}`}>
                        {row.playerName ?? "Anonymous"}
                      </span>
                      {isMe && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">You</Badge>}
                      {row.status === "win"
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                      <span className={`text-xs hidden sm:inline ${bias.color}`}>{bias.label}</span>
                    </div>
                    <div className="text-xs text-white/30 mt-0.5">
                      {row.convertedCount ?? 0}/10 converted · {row.totalRounds ?? 0} rounds · {new Date(row.startedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-black text-emerald-400">{Math.round(row.totalScore ?? 0)}</div>
                    <div className="text-xs text-white/30">pts</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="border-t border-white/5 px-6 py-4 text-center text-xs text-white/20">
        Copyright © Prof. Shipeng Yan
      </footer>
    </div>
  );
}
