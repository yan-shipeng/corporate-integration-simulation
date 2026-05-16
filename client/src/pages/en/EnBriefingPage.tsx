/**
 * ENGLISH BRIEFING PAGE
 * 5-slide mission briefing shown before entering /en/game
 * Mirrors BriefingPage.tsx but in English
 */
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ChevronLeft,
  SkipForward,
  Rocket,
  Users,
  Target,
  Lightbulb,
  Lock,
  TrendingUp,
} from "lucide-react";

interface EnBriefingPageProps {
  playerName: string;
  onEnterGame: () => void;
  onSkip: () => void;
}

const TOTAL_SLIDES = 5;

// ── Slide 1: Mission Background ───────────────────────────────────────────────
function Slide1() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
          <Rocket className="w-5 h-5 text-emerald-400" />
        </div>
        <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase">Mission Background</span>
      </div>
      <h2 className="text-3xl sm:text-4xl font-bold leading-tight text-white">
        You are deployed <em className="text-emerald-400 not-italic">overseas</em><br />
        to lead a <em className="text-emerald-400 not-italic">corporate integration</em>.
      </h2>
      <p className="text-white/60 text-base leading-relaxed">
        A US/European multinational has just acquired an overseas subsidiary. HQ has appointed you as the{" "}
        <strong className="text-white">Integration Lead</strong>, tasked with implementing a new governance model
        and driving synergy across the local entity.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
        {[
          { icon: "🏭", label: "Overseas Subsidiary", desc: "Recently acquired — significant cultural gap" },
          { icon: "🤝", label: "12 Key Stakeholders", desc: "Each with their own agenda and hidden ties" },
          { icon: "⏱️", label: "60 Resource Units", desc: "Your total budget of time and effort" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-1"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="font-semibold text-sm text-white">{item.label}</span>
            <span className="text-xs text-white/50">{item.desc}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-white/50 border-l-2 border-emerald-500/40 pl-4 italic">
        Your goal: before resources run out, earn the genuine commitment of as many stakeholders as possible.
      </p>
    </div>
  );
}

// ── Slide 2: Game Rules ───────────────────────────────────────────────────────
function Slide2() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-emerald-400" />
        </div>
        <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase">Game Rules</span>
      </div>
      <h2 className="text-3xl sm:text-4xl font-bold leading-tight text-white">
        Each round,<br />
        <span className="text-emerald-400">choose an action and a target.</span>
      </h2>
      <p className="text-white/60 text-base leading-relaxed">
        The game runs in rounds. Each round you select an <strong className="text-white">action type</strong> and
        one or more <strong className="text-white">target stakeholders</strong>, spend the corresponding resources,
        and observe the outcome.
      </p>
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
        {[
          { n: "①", title: "Choose an Action", desc: "Each action costs different resources and has different effects." },
          { n: "②", title: "Choose Target Stakeholders", desc: "All 12 have different stances — targeting the wrong person can backfire." },
          { n: "③", title: "Observe the Outcome", desc: "Actions affect your credibility, resistance level, and stakeholder conversion status." },
          { n: "④", title: "Resources Depleted — Game Over", desc: "Once all 60 resource units are spent, the system tallies your final score." },
        ].map(({ n, title, desc }) => (
          <div key={n} className="flex items-start gap-3">
            <span className="text-emerald-400 font-bold text-lg w-6 shrink-0">{n}</span>
            <div>
              <span className="font-semibold text-white text-sm">{title}</span>
              <p className="text-sm text-white/50 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Conversion stage diagram */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <p className="text-xs font-semibold text-emerald-400 mb-3 uppercase tracking-widest">Stakeholder Conversion Path</p>
        <div className="flex items-center gap-1 flex-wrap justify-between">
          {[
            { label: "Unaware", glyph: "○", color: "text-white/40", bg: "bg-white/5 border-white/10" },
            { label: "Aware", glyph: "◔", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" },
            { label: "Interested", glyph: "◑", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30" },
            { label: "Participated", glyph: "◕", color: "text-lime-400", bg: "bg-lime-400/10 border-lime-400/30" },
            { label: "Converted", glyph: "●", color: "text-emerald-400", bg: "bg-emerald-400/15 border-emerald-400/40" },
          ].map((s, i, arr) => (
            <>
              <div
                key={s.label}
                className={`flex flex-col items-center gap-1 rounded-lg border px-2.5 py-2 min-w-[56px] ${s.bg}`}
              >
                <span className={`text-xl font-bold leading-none ${s.color}`}>{s.glyph}</span>
                <span className={`text-[10px] font-semibold ${s.color}`}>{s.label}</span>
              </div>
              {i < arr.length - 1 && (
                <span key={`arrow-${i}`} className="text-white/30 text-sm shrink-0">→</span>
              )}
            </>
          ))}
        </div>
        <p className="text-[11px] text-white/40 mt-3 leading-relaxed">
          Each stakeholder starts at "Unaware." Actions push them forward stage by stage; wrong actions or excessive resistance can also cause regression. Your score depends on final conversion rate and organisational health.
        </p>
      </div>
    </div>
  );
}

// ── Slide 3: Action Types ─────────────────────────────────────────────────────
function Slide3() {
  const groups = [
    {
      label: "💬 Communicate",
      color: "border-cyan-500/30 bg-cyan-500/5",
      actions: [
        { name: "One-on-One Interview", cost: "2 resources", type: "Communicate", desc: "Deep private conversation that fully unlocks the target's action preferences and hidden network ties (social gatherings can partially reveal hidden ties too). You can interview one or two people per round, but interviewing two simultaneously gives each less focused attention. Over-interviewing the same person triggers resentment. Has a cooldown." },
        { name: "Broadcast Email", cost: "1 resource", type: "Communicate", desc: "Broadcast tool that reaches all unconverted stakeholders at once, but persuasive depth decreases with each stage. Repeated use causes email fatigue — effectiveness drops sharply after several sends." },
        { name: "Publish Progress Report", cost: "2 resources", type: "Communicate", desc: "Lets fence-sitters see that change is moving forward. Solid results amplify the effect; publishing without real results will irritate pragmatists and damage credibility." },
        { name: "Social Gathering", cost: "3 resources", type: "Communicate", desc: "Dinner, drinks — build trust in informal settings. Up to four people per gathering; has a cooldown. Highly effective for those already at the Interested stage. Bonus effect when participants have formal ties; even stronger when converted colleagues attend (word-of-mouth spreads to their network). Overuse reduces effectiveness and credibility." },
      ],
      note: "💡 Unlock hidden ties: One-on-One Interview (full reveal) or Social Gathering (incidental reveal)",
    },
    {
      label: "🌱 Demonstrate",
      color: "border-emerald-500/30 bg-emerald-500/5",
      actions: [
        { name: "Lead by Example", cost: "2 resources", type: "Demonstrate", desc: "Build credibility through action before pushing others. Signal is strongest early in the change; gradually diminishes as more people convert, but always helps maintain credibility. Repeating without mixing in other actions degrades the signal to performative — effect is discounted." },
        { name: "Share Success Stories", cost: "1 resource", type: "Demonstrate", desc: "Use real cases to inspire targets and reinforce belief in change feasibility. Forcing stories before any conversion results exist triggers active resistance. Repeated use of similar stories causes story fatigue — effectiveness decreases." },
        { name: "Small-Scale Pilot", cost: "3 resources", type: "Demonstrate", desc: "Turns abstract change requirements into tangible, visible results. Most persuasive for evidence-driven stakeholders; strong diffusion effect. Requires selecting participants." },
      ],
    },
    {
      label: "🎓 Empower",
      color: "border-green-500/30 bg-green-500/5",
      actions: [
        { name: "External Training", cost: "3 resources", type: "Empower", desc: "Bring in external consultants or academics for professional training. Strong novelty effect early in the change; diminishes later as staff have formed prior opinions. Requires selecting participants." },
        { name: "Internal Training", cost: "2 resources", type: "Empower", desc: "Internal mentors lead hands-on skills training. Less effective early when staff aren't yet ready; highly effective later for those who already have the will. Requires selecting participants." },
      ],
    },
    {
      label: "🏛 Institutionalize",
      color: "border-amber-500/30 bg-amber-500/5",
      actions: [
        { name: "Secure HQ Endorsement", cost: "2 resources", type: "Institutionalize", desc: "Boost your legitimacy through public HQ support. First endorsement has the strongest signal; repeated requests gradually exhaust political capital with the CEO — diminishing returns." },
        { name: "Publicly Recognize Exemplars", cost: "2 resources", type: "Institutionalize", desc: "Publicly commend individuals with tangible results to amplify the demonstration effect. Target must already be at Participated stage or higher; premature recognition triggers organisation-wide skepticism." },
        { name: "Announce KPIs & Deadlines", cost: "2 resources", type: "Institutionalize", desc: "Creates urgency, but also organisational pressure. If your credibility is not yet established and real results are lacking, pushing KPIs will be seen as reckless and trigger backlash." },
        { name: "Adjust Incentives & Consequences", cost: "5 resources", type: "Institutionalize", desc: "Use institutional change to move everyone. Limited signal for those without any will yet; most effective for those at the Interested stage; can push Participated stakeholders over the final threshold. Requires very high political capital, but significantly raises organisational resistance." },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
          <Target className="w-5 h-5 text-emerald-400" />
        </div>
        <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase">Action Types</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-white">
        13 actions,<br />
        <span className="text-emerald-400">4 categories — choose by context.</span>
      </h2>
      <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-1">
        {groups.map((g) => (
          <div key={g.label} className={`rounded-xl border p-3 ${g.color}`}>
            <div className="text-xs font-semibold mb-2 text-white/80">{g.label}</div>
            <div className="space-y-2">
              {g.actions.map((a) => (
                <div key={a.name} className="flex flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="font-semibold text-xs text-white">{a.name}</span>
                    <span className="text-[10px] text-white/40 bg-white/10 rounded px-1 shrink-0">{a.type} · {a.cost}</span>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed">{a.desc}</p>
                </div>
              ))}
            </div>
            {g.note && (
              <div className="mt-2 px-2 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-400 leading-relaxed">
                {g.note}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Slide 4: Key Tips ─────────────────────────────────────────────────────────
function Slide4() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <Lightbulb className="w-5 h-5 text-amber-400" />
        </div>
        <span className="text-xs font-semibold tracking-widest text-amber-400 uppercase">Key Tips</span>
      </div>
      <h2 className="text-3xl sm:text-4xl font-bold leading-tight text-white">
        Some truths<br />
        <span className="text-amber-400">must be actively discovered.</span>
      </h2>

      {/* Discovery mechanic */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-amber-300 text-sm">Resistors are hidden</span>
        </div>
        <p className="text-sm text-white/60 leading-relaxed">
          Some stakeholders appear neutral on the surface but secretly resist the change.
          You need to conduct a <strong className="text-white">One-on-One Interview or Social Gathering</strong> to
          uncover their true stance. Until discovered, you cannot use the "Confront" action on them.
        </p>
        <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-500/10 rounded-lg px-3 py-2">
          🔍 Undiscovered resistors will not show a resistance marker in the social network map.
        </div>
      </div>

      {/* Strategy visibility tip */}
      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-cyan-300 text-sm">Your strategy is visible to peers</span>
        </div>
        <p className="text-sm text-white/60 leading-relaxed">
          <strong className="text-white">Institutionalize actions</strong> (endorsements, KPIs, incentives) are fast but costly,
          with strong negative effects on some stakeholders.{" "}
          <strong className="text-white">Communicate actions</strong> (interviews, gatherings, emails) build foundations but take time.
          After the game, your <strong className="text-white">strategy bias</strong> (Aggressive / Cautious / Balanced) is publicly
          displayed on the leaderboard.
        </p>
        <div className="flex items-center gap-2 text-xs text-cyan-400/80 bg-cyan-500/10 rounded-lg px-3 py-2">
          📊 The leaderboard shows each player's strategy bias — great for comparing different paths in class debrief.
        </div>
      </div>

      {/* Scoring formula */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-sm text-white">Scoring Formula</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-sm font-mono">
          <span className="bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-1 text-emerald-400">Conversion Rate</span>
          <span className="text-white/40">×</span>
          <span className="bg-green-500/10 border border-green-500/30 rounded px-2 py-1 text-green-400">Health Index</span>
          <span className="text-white/40">×</span>
          <span className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white/60">100</span>
        </div>
        <p className="text-xs text-white/40 leading-relaxed">
          <strong className="text-white/70">Conversion Rate</strong> = stakeholders converted / 12.{" "}
          <strong className="text-white/70">Health Index</strong> = composite of credibility and resistance.
          More conversions + healthier organisation = higher score.
        </p>
      </div>
    </div>
  );
}

// ── Slide 5: Launch ───────────────────────────────────────────────────────────
function Slide5({ playerName }: { playerName: string }) {
  return (
    <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto text-center">
      <div className="text-6xl mb-2">🚀</div>
      <h2 className="text-3xl sm:text-4xl font-bold leading-tight text-white">
        Go,{" "}
        <span className="text-emerald-400">{playerName || "Integration Lead"}</span>.
      </h2>
      <p className="text-white/60 text-base leading-relaxed max-w-md">
        You now know the mission and the rules. Enter the simulation, make your decisions within 60 resource units,
        and see how many stakeholders you can genuinely convert.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mt-2">
        {[
          { emoji: "🔍", text: "Interview or gather — learn who's who" },
          { emoji: "🤝", text: "Build alliances, expand influence" },
          { emoji: "🎯", text: "Act precisely, convert efficiently" },
        ].map((tip) => (
          <div
            key={tip.text}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/50"
          >
            <span className="text-base mr-1">{tip.emoji}</span>
            {tip.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function EnBriefingPage({ playerName, onEnterGame, onSkip }: EnBriefingPageProps) {
  const [slide, setSlide] = useState(1);

  const goNext = useCallback(() => {
    if (slide < TOTAL_SLIDES) setSlide((s) => s + 1);
    else onEnterGame();
  }, [slide, onEnterGame]);

  const goPrev = useCallback(() => {
    if (slide > 1) setSlide((s) => s - 1);
  }, [slide]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  const isLast = slide === TOTAL_SLIDES;

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0f0d] text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/3 shrink-0">
        <div className="text-sm text-white/50">
          Mission Briefing · <span className="text-emerald-400 font-medium">{playerName}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i + 1)}
                className={`h-2 rounded-full transition-all ${
                  i + 1 === slide
                    ? "bg-emerald-400 w-4"
                    : i + 1 < slide
                    ? "bg-emerald-400/50 w-2"
                    : "bg-white/20 w-2"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <span className="text-xs text-white/40 tabular-nums">
            {slide} / {TOTAL_SLIDES}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-white/40 hover:text-white text-xs"
            onClick={onSkip}
          >
            <SkipForward className="w-3.5 h-3.5" />
            Skip Briefing
          </Button>
        </div>
      </div>

      {/* Slide content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
        <div key={slide} className="animate-in fade-in slide-in-from-right-4 duration-300">
          {slide === 1 && <Slide1 />}
          {slide === 2 && <Slide2 />}
          {slide === 3 && <Slide3 />}
          {slide === 4 && <Slide4 />}
          {slide === 5 && <Slide5 playerName={playerName} />}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-t border-white/10 bg-white/3 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-white/40 hover:text-white"
          onClick={goPrev}
          disabled={slide === 1}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <Button
          size="sm"
          className={`gap-1.5 ${
            isLast
              ? "bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6"
              : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
          }`}
          onClick={goNext}
        >
          {isLast ? (
            <>
              <Rocket className="w-4 h-4" />
              Start Simulation
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
