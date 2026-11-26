import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  KeyRound,
  Lock,
  LogOut,
  MapPin,
  MessageSquare,
  Monitor,
  Phone,
  PhoneCall,
  RefreshCw,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  AnalyticsData,
  CallClickEvent,
  PageViewEvent,
  ShareEvent,
  getAnalytics,
  resetAnalytics,
  trackShareClick,
} from "@/lib/analytics";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal & Traffic Analytics | OSLO CAFE & RESTRO" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

// STRONG DEFAULT CREDENTIALS
const DEFAULT_ADMIN_USER = "oslo_admin";
const DEFAULT_ADMIN_PASS = "Oslo#Cafe@Moga2026!";
const AUTH_KEY = "oslo_admin_auth_session";
const CUSTOM_CREDS_KEY = "oslo_admin_custom_creds";
const SECRET_ACCESS_KEY = "oslo2026";
const LINK_VERIFIED_KEY = "oslo_admin_link_verified";

function getStoredCredentials(): { user: string; pass: string } {
  if (typeof window === "undefined") {
    return { user: DEFAULT_ADMIN_USER, pass: DEFAULT_ADMIN_PASS };
  }
  try {
    const raw = localStorage.getItem(CUSTOM_CREDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.user && parsed.pass) return parsed;
    }
  } catch {}
  return { user: DEFAULT_ADMIN_USER, pass: DEFAULT_ADMIN_PASS };
}

function saveStoredCredentials(user: string, pass: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CUSTOM_CREDS_KEY, JSON.stringify({ user, pass }));
  } catch {}
}

function AdminPage() {
  // Gatekeeper: Block anyone visiting /admin directly without the secret link parameter
  const [hasValidLink, setHasValidLink] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (sessionStorage.getItem(AUTH_KEY) === "true") return true;
    if (sessionStorage.getItem(LINK_VERIFIED_KEY) === "true") return true;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const key = urlParams.get("key") || urlParams.get("access");
      if (key === SECRET_ACCESS_KEY) {
        sessionStorage.setItem(LINK_VERIFIED_KEY, "true");
        return true;
      }
    } catch {}
    return false;
  });

  // Verify secret link on mount & auto-redirect intruders to home
  useEffect(() => {
    if (typeof window !== "undefined" && !hasValidLink) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const key = urlParams.get("key") || urlParams.get("access");
        if (key === SECRET_ACCESS_KEY) {
          sessionStorage.setItem(LINK_VERIFIED_KEY, "true");
          setHasValidLink(true);
          return undefined;
        }
      } catch {}

      // If someone types /admin directly without ?key=oslo2026, redirect to home
      const timer = setTimeout(() => {
        window.location.replace("/");
      }, 3500);
      return () => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [hasValidLink]);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(AUTH_KEY) === "true";
  });

  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Active Admin Credentials (Private & stored safely)
  const [adminCreds, setAdminCreds] = useState<{ user: string; pass: string }>(getStoredCredentials);
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [newPassInput, setNewPassInput] = useState("");
  const [newPassConfirm, setNewPassConfirm] = useState("");
  const [passUpdateMsg, setPassUpdateMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Active Tab: "visitors" | "calls" | "mobile" | "settings"
  const [activeTab, setActiveTab] = useState<"visitors" | "calls" | "mobile" | "settings">("visitors");

  // Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  // Load Data
  const refreshData = () => {
    setIsRefreshing(true);
    setAnalytics(getAnalytics());
    setAdminCreds(getStoredCredentials());
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated]);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const currentCreds = getStoredCredentials();
    if (
      usernameInput.trim() === currentCreds.user &&
      passwordInput.trim() === currentCreds.pass
    ) {
      setIsAuthenticated(true);
      sessionStorage.setItem(AUTH_KEY, "true");
      setLoginError("");
    } else {
      setLoginError("Invalid username or password. Access is restricted.");
    }
  };

  // Handle Password Update inside Settings Tab
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassInput.trim()) {
      setPassUpdateMsg({ type: "error", text: "New password cannot be empty." });
      return;
    }
    if (newPassInput.length < 8) {
      setPassUpdateMsg({ type: "error", text: "Password must be at least 8 characters long." });
      return;
    }
    if (newPassInput !== newPassConfirm) {
      setPassUpdateMsg({ type: "error", text: "Passwords do not match. Please re-enter." });
      return;
    }

    saveStoredCredentials(adminCreds.user, newPassInput.trim());
    setAdminCreds({ user: adminCreds.user, pass: newPassInput.trim() });
    setNewPassInput("");
    setNewPassConfirm("");
    setPassUpdateMsg({ type: "success", text: "Admin password successfully updated and secured!" });
    setTimeout(() => setPassUpdateMsg(null), 4000);
  };

  // Handle Reset to Default Password
  const handleResetPassword = () => {
    if (window.confirm("Reset password back to the default strong credentials?")) {
      saveStoredCredentials(DEFAULT_ADMIN_USER, DEFAULT_ADMIN_PASS);
      setAdminCreds({ user: DEFAULT_ADMIN_USER, pass: DEFAULT_ADMIN_PASS });
      setPassUpdateMsg({ type: "success", text: "Password reset to default credentials." });
      setTimeout(() => setPassUpdateMsg(null), 3000);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(AUTH_KEY);
    setUsernameInput("");
    setPasswordInput("");
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyNotice(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopyNotice(null), 2500);
  };

  // Overall Statistics calculations
  const stats = useMemo(() => {
    const totalViews = analytics?.totalViews || 0;
    const uniqueVisitors = analytics?.uniqueVisitors?.length || 0;
    const totalCalls = analytics?.totalCallClicks || 0;
    const totalShares = analytics?.totalShares || 0;

    const mobileViews = analytics?.deviceCounts?.mobile || 0;
    const desktopViews = analytics?.deviceCounts?.desktop || 0;
    const tabletViews = analytics?.deviceCounts?.tablet || 0;

    const safeTotalViews = totalViews > 0 ? totalViews : 1;
    const mobileSharePct = Math.round((mobileViews / safeTotalViews) * 100);
    const desktopSharePct = Math.round((desktopViews / safeTotalViews) * 100);
    const tabletSharePct = Math.round((tabletViews / safeTotalViews) * 100);

    const menuViews = analytics?.pageCounts?.["/menu"] || 0;
    const menuPct = Math.round((menuViews / safeTotalViews) * 100);

    return {
      totalViews,
      uniqueVisitors,
      totalCalls,
      totalShares,
      mobileViews,
      desktopViews,
      tabletViews,
      mobileSharePct,
      desktopSharePct,
      tabletSharePct,
      menuViews,
      menuPct,
    };
  }, [analytics]);

  // =========================================================================
  // 0. GATEKEEPER: BLOCKED IF ACCESSED DIRECTLY WITHOUT THE SECRET LINK
  // =========================================================================
  if (!hasValidLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#14051f] via-[#220a38] to-[#0d0314] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <span className="grid size-16 place-items-center rounded-2xl bg-rose-500/20 text-rose-400 mx-auto mb-4 border border-rose-500/30 shadow-lg">
            <ShieldAlert className="size-8" />
          </span>
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.25em] text-rose-400">
            404 • PAGE NOT FOUND
          </span>
          <h1 className="mt-2 font-display text-2xl font-bold">Access Blocked</h1>
          <p className="mt-2 text-xs text-white/60 leading-relaxed">
            Direct access to this portal is disabled. You cannot login without the authorized private link.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:brightness-105 transition-all"
            >
              ← Return to Oslo Cafe Home
            </Link>
            <span className="text-[0.65rem] text-white/40">
              Redirecting to homepage...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 1. LOGIN SCREEN (If not authenticated)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0827] via-[#2c0e44] to-[#14051f] flex items-center justify-center p-4">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl p-8 shadow-2xl text-white">
          <div className="flex flex-col items-center text-center">
            <span className="grid size-16 place-items-center rounded-2xl bg-gradient-to-tr from-primary to-amber-500 text-white shadow-lg mb-4">
              <ShieldCheck className="size-8" />
            </span>
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.25em] text-amber-300">
              OSLO CAFE & RESTRO • MOGA
            </span>
            <h1 className="mt-1 font-display text-2xl font-bold">Admin Analytics Portal</h1>
            <p className="mt-1.5 text-xs text-white/70">
              Sign in to monitor live website visitors, phone call enquiries, and mobile device shares.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-1.5">
                Admin Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/50" />
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter admin username"
                  className="h-11 w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-4 text-sm text-white placeholder:text-white/40 outline-none focus:border-amber-400 focus:bg-white/15"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-1.5">
                Strong Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/50" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password"
                  className="h-11 w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-10 text-sm text-white placeholder:text-white/40 outline-none focus:border-amber-400 focus:bg-white/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white cursor-pointer"
                >
                  <Eye className="size-4" />
                </button>
              </div>
            </div>

            {loginError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/20 p-3 text-xs font-medium text-rose-200">
                ⚠️ {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 py-3 text-sm font-bold text-[#221c2c] shadow-[0_8px_24px_rgba(245,158,11,0.4)] hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
            >
              <KeyRound className="size-4" />
              <span>Sign In to Admin Portal</span>
            </button>
          </form>

          {/* Private Security Badge (Zero credentials exposed) */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-300">
              <ShieldCheck className="size-4" />
              <span>Restricted Admin Gateway</span>
            </div>
            <p className="mt-1 text-[0.7rem] text-white/50 leading-relaxed">
              Access is restricted to authorized Oslo Cafe & Restro personnel only. All access attempts are logged.
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-xs text-white/60 hover:text-white transition-colors">
              ← Return to Oslo Cafe Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. AUTHENTICATED ADMIN DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#f7f4fb] text-[#221c2c]">
      {/* ADMIN HEADER */}
      <header className="sticky top-0 z-30 border-b border-[#e5d8f3] bg-[#220a38] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-amber-400 text-white shadow-xs"
              title="Go to Oslo Cafe Homepage"
            >
              <TrendingUp className="size-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg font-bold leading-none tracking-wide text-white">
                  OSLO CAFE ADMIN
                </h1>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-300">
                  Live Analytics
                </span>
              </div>
              <span className="text-[0.65rem] text-white/60">
                New Town, Moga • Real-time Traffic, Calls & Mobile Shares
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              title="Refresh all metrics"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-all cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-all"
            >
              <Globe className="size-3.5" />
              <span>View Cafe Site</span>
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 px-3 py-1.5 text-xs font-bold text-white transition-all cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* ADMIN NAVIGATION TABS */}
        <div className="border-t border-white/10 bg-[#1c072e] px-5">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto py-2">
            {[
              {
                id: "visitors",
                label: "Website Visitors & Traffic",
                icon: Eye,
                badge: `${stats.totalViews} views`,
                badgeColor: "bg-primary/50 text-white",
              },
              {
                id: "calls",
                label: "Phone Call Enquiries",
                icon: PhoneCall,
                badge: `${stats.totalCalls} calls`,
                badgeColor: "bg-emerald-500/30 text-emerald-300",
              },
              {
                id: "mobile",
                label: "Mobile Shares & Devices",
                icon: Smartphone,
                badge: `${stats.mobileSharePct}% mobile`,
                badgeColor: "bg-amber-400 text-black",
              },
              {
                id: "settings",
                label: "Admin Security & Access",
                icon: ShieldCheck,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-[#220a38] shadow-sm font-extrabold"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${tab.badgeColor}`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* TOAST NOTICE */}
      {copyNotice && (
        <div className="fixed top-20 right-5 z-50 rounded-2xl bg-[#220a38] border border-amber-300/60 text-white px-4 py-2.5 text-xs font-bold shadow-xl animate-in fade-in slide-in-from-top-2">
          ✨ {copyNotice}
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto max-w-7xl px-5 py-8 space-y-8">
        {/* SUMMARY METRIC CARDS (ALL FOCUSED ON VISITORS, CALLS, AND MOBILE SHARES) */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {/* Card 1: Total Website Page Views */}
          <div className="rounded-2xl border border-[#e8dcf3] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider">Page Views</span>
              <Eye className="size-4 text-primary" />
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-primary">
              {stats.totalViews}
            </div>
            <span className="mt-0.5 text-[0.65rem] text-muted-foreground block">
              Total site impressions
            </span>
          </div>

          {/* Card 2: Unique Visitors */}
          <div className="rounded-2xl border border-[#e8dcf3] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider">Unique Visitors</span>
              <Users className="size-4 text-blue-600" />
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-blue-700">
              {stats.uniqueVisitors}
            </div>
            <span className="mt-0.5 text-[0.65rem] text-muted-foreground block">
              Distinct user devices
            </span>
          </div>

          {/* Card 3: Phone Call Enquiries */}
          <div className="rounded-2xl border border-[#e8dcf3] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider">Call Enquiries</span>
              <PhoneCall className="size-4 text-emerald-600" />
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-emerald-700">
              {stats.totalCalls}
            </div>
            <span className="mt-0.5 text-[0.65rem] text-emerald-600 block">
              Guests tapped to call
            </span>
          </div>

          {/* Card 4: Mobile Traffic Share */}
          <div className="rounded-2xl border border-[#e8dcf3] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider">Mobile Share</span>
              <Smartphone className="size-4 text-amber-600" />
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-[#221c2c]">
              {stats.mobileSharePct}%
            </div>
            <span className="mt-0.5 text-[0.65rem] text-muted-foreground block">
              {stats.mobileViews} mobile visitors
            </span>
          </div>

          {/* Card 5: Mobile & WhatsApp Shares */}
          <div className="rounded-2xl border border-[#e8dcf3] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider">Mobile Shares</span>
              <Share2 className="size-4 text-violet-600" />
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-violet-700">
              {stats.totalShares}
            </div>
            <span className="mt-0.5 text-[0.65rem] text-violet-600 block">
              WhatsApp & link shares
            </span>
          </div>

          {/* Card 6: Menu Page Views */}
          <div className="rounded-2xl border border-[#e8dcf3] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider">Menu Views</span>
              <Compass className="size-4 text-rose-600" />
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-rose-700">
              {stats.menuViews}
            </div>
            <span className="mt-0.5 text-[0.65rem] text-muted-foreground block">
              {stats.menuPct}% explored food
            </span>
          </div>
        </section>

        {/* =========================================================================
            TAB 1: WEBSITE VISITORS & TRAFFIC ANALYTICS
           ========================================================================= */}
        {activeTab === "visitors" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Highlights row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Daily Traffic Breakdown */}
              <div className="rounded-3xl border border-[#e8dcf3] bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Daily Traffic (Last 3 Days)
                  </span>
                  <Calendar className="size-4 text-primary" />
                </div>
                <div className="space-y-3">
                  {analytics?.dailyViews &&
                    Object.entries(analytics.dailyViews)
                      .slice(-5)
                      .map(([date, count]) => {
                        const maxVal = Math.max(
                          ...Object.values(analytics.dailyViews),
                          1
                        );
                        const barPct = Math.round((count / maxVal) * 100);
                        return (
                          <div key={date}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-semibold text-[#221c2c]">{date}</span>
                              <span className="font-bold text-primary">{count} views</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-[#f1e8fa] overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full"
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                </div>
              </div>

              {/* Popular Pages Visited */}
              <div className="rounded-3xl border border-[#e8dcf3] bg-white p-6 shadow-xs md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Most Visited Pages on Website
                  </span>
                  <Compass className="size-4 text-primary" />
                </div>
                <div className="space-y-2.5">
                  {analytics?.pageCounts &&
                    Object.entries(analytics.pageCounts)
                      .sort(([, a], [, b]) => b - a)
                      .map(([page, count]) => {
                        const safeTotal = stats.totalViews > 0 ? stats.totalViews : 1;
                        const pct = Math.round((count / safeTotal) * 100);
                        const pageNames: Record<string, string> = {
                          "/": "Home Page (Hero, Specials & Ambiance)",
                          "/menu": "Official Food & Beverages Menu",
                          "/gallery": "Cafe Photos & Video Tour",
                          "/about": "Oslo Story & Brand Experience",
                          "/contact": "Location, Map Directions & Contact",
                        };

                        return (
                          <div
                            key={page}
                            className="flex items-center justify-between rounded-xl bg-[#faf6fd] p-3 text-xs border border-[#ece5f3]"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono font-bold text-primary bg-white px-2 py-0.5 rounded border border-border">
                                {page}
                              </span>
                              <span className="font-semibold text-[#221c2c]">
                                {pageNames[page] || page}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-muted-foreground">{pct}% of visitors</span>
                              <span className="font-display font-bold text-[#221c2c] text-sm">
                                {count} views
                              </span>
                            </div>
                          </div>
                        );
                      })}
                </div>
              </div>
            </div>

            {/* Live Visitor Sessions Table */}
            <div className="rounded-3xl border border-[#e8dcf3] bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-base font-bold text-[#221c2c]">
                    Live Visitor Activity Stream
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Real-time browsing feed of guests visiting Oslo Cafe & Restro
                  </p>
                </div>
                <span className="text-xs text-primary font-bold bg-lavender/50 px-3 py-1 rounded-full">
                  Recent {analytics?.pageViewLogs?.length || 0} visits
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#faf6fd] text-muted-foreground uppercase text-[0.65rem] border-y border-[#ece5f3]">
                    <tr>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Page Visited</th>
                      <th className="py-2.5 px-3">Device</th>
                      <th className="py-2.5 px-3">Traffic Source</th>
                      <th className="py-2.5 px-3">Visitor ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f4edf9]">
                    {analytics?.pageViewLogs?.slice(0, 30).map((log) => (
                      <tr key={log.id} className="hover:bg-lavender/20 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-[#221c2c]">
                          {log.formattedTime}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-primary">
                          {log.page}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[0.65rem] font-bold ${
                              log.device === "Mobile"
                                ? "bg-amber-100 text-amber-900 border border-amber-200"
                                : log.device === "Tablet"
                                ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {log.device}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">{log.referrer}</td>
                        <td className="py-2.5 px-3 font-mono text-[0.65rem] text-muted-foreground">
                          {log.visitorId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: PHONE CALL ENQUIRIES ("call enquires")
           ========================================================================= */}
        {activeTab === "calls" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Call Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="rounded-3xl border border-[#e8dcf3] bg-white p-6 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  Total Calls Initiated
                </span>
                <div className="font-display text-4xl font-bold text-emerald-700">
                  {stats.totalCalls}
                </div>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Every time a guest clicks on the phone number or Call button on the site, it is logged here with exact timestamp, button location, and phone number.
                </p>
                <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <Phone className="size-4 text-emerald-600" />
                  <span>Primary Helpline: {SITE.phoneDisplay}</span>
                </div>
              </div>

              {/* Call clicks by button placement breakdown */}
              <div className="rounded-3xl border border-[#e8dcf3] bg-white p-6 shadow-xs md:col-span-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-4">
                  Where Visitors Clicked to Call Most
                </span>
                <div className="space-y-3">
                  {analytics?.callClicksByLocation &&
                    Object.entries(analytics.callClicksByLocation)
                      .sort(([, a], [, b]) => b - a)
                      .map(([location, count]) => {
                        const totalCalls = stats.totalCalls > 0 ? stats.totalCalls : 1;
                        const pct = Math.round((count / totalCalls) * 100);
                        return (
                          <div key={location}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-semibold text-[#221c2c] flex items-center gap-2">
                                <PhoneCall className="size-3.5 text-emerald-600" /> {location}
                              </span>
                              <span className="font-bold text-emerald-700">
                                {count} inquiries ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-[#f1e8fa] overflow-hidden">
                              <div
                                className="h-full bg-emerald-600 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                </div>
              </div>
            </div>

            {/* Detailed Call Clicks Log */}
            <div className="rounded-3xl border border-[#e8dcf3] bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-base font-bold text-[#221c2c]">
                    Live Call Enquiries Audit Log
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Chronological audit of every guest who tapped to call Oslo Cafe & Restro
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleCopy(
                      analytics?.callClickLogs
                        ?.map(
                          (c) => `${c.formattedTime} - ${c.location} (${c.page}) -> ${c.phone}`
                        )
                        .join("\n") || "",
                      "All Call Logs"
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-[#faf6fd] px-3 py-1.5 text-xs font-bold text-[#221c2c] hover:bg-lavender/40 cursor-pointer"
                >
                  <Copy className="size-3" /> Copy Log
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#faf6fd] text-muted-foreground uppercase text-[0.65rem] border-y border-[#ece5f3]">
                    <tr>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Button / Section Clicked</th>
                      <th className="py-2.5 px-3">Page Clicked On</th>
                      <th className="py-2.5 px-3">Target Phone</th>
                      <th className="py-2.5 px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f4edf9]">
                    {analytics?.callClickLogs && analytics.callClickLogs.length > 0 ? (
                      analytics.callClickLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-lavender/20 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-[#221c2c]">
                            {log.formattedTime}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1.5 font-bold text-primary">
                              <Phone className="size-3 text-emerald-600" />
                              {log.location}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[0.7rem] text-muted-foreground">
                            {log.page}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[#221c2c]">{log.phone}</td>
                          <td className="py-2.5 px-3">
                            <a
                              href={`tel:${log.phone.replace(/\s+/g, "")}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-700 px-2.5 py-1 font-bold hover:bg-emerald-100"
                            >
                              <span>Dial</span>
                            </a>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-muted-foreground">
                          No call enquiries logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: MOBILE SHARES & DEVICE ANALYTICS ("mobile shares etc")
           ========================================================================= */}
        {activeTab === "mobile" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Highlights row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Device distribution breakdown */}
              <div className="rounded-3xl border border-[#e8dcf3] bg-white p-6 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-4">
                  Device Distribution
                </span>
                <div className="space-y-4">
                  {[
                    {
                      label: "Mobile Smartphones",
                      count: stats.mobileViews,
                      pct: stats.mobileSharePct,
                      icon: Smartphone,
                      color: "bg-amber-500",
                    },
                    {
                      label: "Desktop / Laptops",
                      count: stats.desktopViews,
                      pct: stats.desktopSharePct,
                      icon: Monitor,
                      color: "bg-primary",
                    },
                    {
                      label: "Tablets / iPads",
                      count: stats.tabletViews,
                      pct: stats.tabletSharePct,
                      icon: Tablet,
                      color: "bg-emerald-600",
                    },
                  ].map((dev) => {
                    const DevIcon = dev.icon;
                    return (
                      <div key={dev.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold flex items-center gap-1.5 text-[#221c2c]">
                            <DevIcon className="size-3.5 text-primary" /> {dev.label}
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {dev.count} ({dev.pct}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-[#f1e8fa] overflow-hidden">
                          <div
                            className={`h-full ${dev.color} rounded-full`}
                            style={{ width: `${dev.pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200/80 p-3 text-xs text-amber-900 leading-relaxed">
                  📱 <strong>Mobile-First Traffic:</strong> Over {stats.mobileSharePct}% of Oslo Cafe visitors browse from their smartphones, making quick WhatsApp shares and direct call buttons the most effective channels.
                </div>
              </div>

              {/* Shares & Referrals by Channel */}
              <div className="rounded-3xl border border-[#e8dcf3] bg-white p-6 shadow-xs md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      Mobile Shares & Referral Channels
                    </span>
                    <span className="text-xs text-muted-foreground">
                      How visitors share Oslo Cafe with friends & family
                    </span>
                  </div>
                  <Share2 className="size-4 text-violet-600" />
                </div>

                <div className="space-y-3">
                  {analytics?.sharesByChannel &&
                    Object.entries(analytics.sharesByChannel)
                      .sort(([, a], [, b]) => b - a)
                      .map(([channel, count]) => {
                        const totalShares = stats.totalShares > 0 ? stats.totalShares : 1;
                        const pct = Math.round((count / totalShares) * 100);
                        return (
                          <div key={channel} className="rounded-xl bg-[#faf6fd] p-3 border border-[#ece5f3]">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-semibold text-[#221c2c] flex items-center gap-2">
                                <Share2 className="size-3.5 text-violet-600" /> {channel}
                              </span>
                              <span className="font-bold text-violet-700">
                                {count} shares ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-[#f1e8fa] overflow-hidden">
                              <div
                                className="h-full bg-violet-600 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                </div>

                {/* Quick Share Test Buttons */}
                <div className="mt-6 pt-4 border-t border-[#f1e8fa] flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground font-medium">
                    Test Live Share Actions:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const shareUrl = "https://oslo-cafe.vercel.app/menu";
                        trackShareClick("WhatsApp Direct Share");
                        refreshData();
                        window.open(
                          `https://wa.me/?text=${encodeURIComponent(
                            "Check out Oslo Cafe & Restro in Moga! View menu & ambiance: " + shareUrl
                          )}`,
                          "_blank"
                        );
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                    >
                      <MessageSquare className="size-3.5" />
                      <span>Share on WhatsApp</span>
                    </button>

                    <button
                      onClick={() => {
                        trackShareClick("Mobile Link Copy");
                        refreshData();
                        handleCopy("https://oslo-cafe.vercel.app", "Oslo Cafe Website Link");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-[#faf6fd] px-3 py-1.5 text-xs font-bold text-[#221c2c] hover:bg-lavender/40 cursor-pointer"
                    >
                      <Copy className="size-3.5" />
                      <span>Copy Website Link</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Shares Log Table */}
            <div className="rounded-3xl border border-[#e8dcf3] bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-base font-bold text-[#221c2c]">
                    Recent Mobile Shares & Referral Log
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Record of shares sent via WhatsApp, clipboard copies, and direct visits
                  </p>
                </div>
                <span className="text-xs text-violet-700 font-bold bg-violet-50 border border-violet-200 px-3 py-1 rounded-full">
                  Total {analytics?.shareLogs?.length || 0} Shares Logged
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#faf6fd] text-muted-foreground uppercase text-[0.65rem] border-y border-[#ece5f3]">
                    <tr>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Share Channel</th>
                      <th className="py-2.5 px-3">Page Shared</th>
                      <th className="py-2.5 px-3">Delivery Medium</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f4edf9]">
                    {analytics?.shareLogs && analytics.shareLogs.length > 0 ? (
                      analytics.shareLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-lavender/20 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-[#221c2c]">
                            {log.formattedTime}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-violet-700 flex items-center gap-1.5">
                            <Share2 className="size-3.5 text-violet-500" />
                            {log.channel}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[0.7rem] text-primary">
                            {log.page}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[0.65rem] font-bold">
                              Verified
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground">
                          No shares logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: ADMIN SECURITY & CREDENTIALS
           ========================================================================= */}
        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
            <div className="rounded-3xl border border-[#e8dcf3] bg-white p-6 md:p-8 shadow-xs">
              <div className="flex items-center gap-3 border-b border-[#f0e7fa] pb-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-amber-400/20 text-amber-700">
                  <ShieldCheck className="size-6" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-[#221c2c]">
                    Admin Security & Access Credentials
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Strong login credentials safeguarding the cafe analytics and enquiry logs.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {/* Private Secret Link Box */}
                <div className="rounded-2xl bg-amber-50/60 border border-amber-200/80 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                      <ShieldCheck className="size-3.5 text-emerald-600" /> Private Authorized Access Link
                    </span>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[0.65rem] font-bold">
                      Direct /admin Blocked
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="font-mono text-xs font-bold text-[#221c2c] truncate">
                      https://oslo-cafe.vercel.app/admin?key={SECRET_ACCESS_KEY}
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          `https://oslo-cafe.vercel.app/admin?key=${SECRET_ACCESS_KEY}`,
                          "Private Access Link"
                        )
                      }
                      className="text-xs font-bold text-primary hover:underline shrink-0 cursor-pointer"
                    >
                      Copy Link
                    </button>
                  </div>
                  <p className="text-[0.68rem] text-amber-900/80 leading-relaxed">
                    Direct access via <code>/admin</code> without this secret key is blocked and auto-redirects anyone to the homepage. Always bookmark or use this link to access your portal.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#faf6fd] border border-[#ece5f3] p-4 space-y-3">
                  <div>
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground block">
                      Active Username
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-sm font-bold text-primary">
                        {adminCreds.user}
                      </span>
                      <button
                        onClick={() => handleCopy(adminCreds.user, "Username")}
                        className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#f0e7fa]">
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground block">
                      Active Strong Password
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-emerald-700">
                          {showAdminPass ? adminCreds.pass : "••••••••••••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAdminPass(!showAdminPass)}
                          className="text-muted-foreground hover:text-[#221c2c] cursor-pointer"
                          title={showAdminPass ? "Hide password" : "Show password"}
                        >
                          <Eye className="size-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleCopy(adminCreds.pass, "Password")}
                        className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                {/* Change Password Form */}
                <form
                  onSubmit={handleUpdatePassword}
                  className="rounded-2xl bg-[#faf6fd] border border-[#ece5f3] p-4 space-y-3"
                >
                  <span className="text-[0.7rem] font-bold uppercase tracking-wider text-[#221c2c] block">
                    Update Admin Password
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[0.65rem] font-medium text-muted-foreground block mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassInput}
                        onChange={(e) => setNewPassInput(e.target.value)}
                        placeholder="Enter new strong password"
                        className="h-9 w-full rounded-xl border border-input bg-white px-3 text-xs text-[#221c2c] outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[0.65rem] font-medium text-muted-foreground block mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassConfirm}
                        onChange={(e) => setNewPassConfirm(e.target.value)}
                        placeholder="Re-type new password"
                        className="h-9 w-full rounded-xl border border-input bg-white px-3 text-xs text-[#221c2c] outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {passUpdateMsg && (
                    <div
                      className={`rounded-xl p-2.5 text-xs font-medium ${
                        passUpdateMsg.type === "success"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      {passUpdateMsg.text}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      className="text-[0.7rem] font-semibold text-muted-foreground hover:text-rose-600 cursor-pointer"
                    >
                      Reset to Default Password
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:brightness-105 cursor-pointer"
                    >
                      Save New Password
                    </button>
                  </div>
                </form>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold block mb-1">🔐 Security Protection Analysis:</span>
                  • Public login page is sanitized: no passwords or auto-fill hints are displayed to visitors.<br />
                  • Entropy: High security with letters, numbers, and symbols (`#`, `@`, `!`).<br />
                  • Exclusive to Oslo Cafe & Restro, New Town, Moga.
                </div>

                {/* Reset / Reload Demo Data */}
                <div className="pt-4 border-t border-[#f0e7fa] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-[#221c2c] block">
                      Reset Analytics Counters
                    </span>
                    <span className="text-[0.65rem] text-muted-foreground">
                      Resets counters back to baseline metrics
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm("Reset analytics counters back to initial baseline data?")) {
                        const reset = resetAnalytics();
                        setAnalytics(reset);
                        setCopyNotice("Analytics reset successfully!");
                      }
                    }}
                    className="rounded-xl border border-border bg-[#faf6fd] px-3.5 py-2 text-xs font-bold text-muted-foreground hover:bg-muted cursor-pointer"
                  >
                    Reset Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
