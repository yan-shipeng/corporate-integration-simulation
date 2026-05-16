import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import GamePage from "./pages/GamePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ComparePage from "./pages/ComparePage";
import GameTestPage from "./pages/GameTestPage";
import EnHome from "./pages/en/EnHome";
import EnGamePage from "./pages/en/EnGamePage";
import EnLeaderboardPage from "./pages/en/EnLeaderboardPage";

const ROUTE_TITLES: Record<string, string> = {
  "/":              "中国企业出海整合模拟",
  "/game":          "游戏进行中 — 出海整合模拟",
  "/leaderboard":   "排行榜 — 出海整合模拟",
  "/game-test":     "游戏测试 — 出海整合模拟",
  "/en":            "Corporate Integration Management",
  "/en/game":       "Playing — Corporate Integration Management",
  "/en/leaderboard":"Leaderboard — Strategy Simulation",
};

function getTitle(location: string): string {
  if (ROUTE_TITLES[location]) return ROUTE_TITLES[location];
  // Handle dynamic routes like /compare/:idA/:idB
  if (location.startsWith("/compare")) return "策略对比 — 出海整合模拟";
  if (location.startsWith("/en/compare")) return "Compare Strategies — Strategy Simulation";
  return "Corporate Integration Management · Strategy Simulation";
}

function Router() {
  const [location] = useLocation();
  const isGameRoute = location === "/game" || location === "/game-test" || location === "/en/game";

  useEffect(() => {
    document.title = getTitle(location);
  }, [location]);
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className={isGameRoute ? "flex-1 flex flex-col h-screen" : "flex-1"}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/game" component={GamePage} />
          <Route path="/leaderboard" component={LeaderboardPage} />
          <Route path="/compare/:idA/:idB" component={ComparePage} />
          <Route path="/compare" component={LeaderboardPage} />
          <Route path="/game-test" component={GameTestPage} />
          <Route path="/en" component={EnHome} />
          <Route path="/en/game" component={EnGamePage} />
          <Route path="/en/leaderboard" component={EnLeaderboardPage} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isGameRoute && (
        <footer className="py-3 text-center">
          <p className="text-[11px] text-muted-foreground/50 tracking-wide select-none">
            Copyright &copy; Prof. Shipeng Yan
          </p>
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
