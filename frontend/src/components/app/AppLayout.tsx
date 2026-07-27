import { Link, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Home, Sprout, Leaf, CloudSun, ShoppingCart, Camera, User, Settings, LogOut, Menu, X, BarChart2, Bot, Store, Bell, HelpCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CommodityMarquee } from "@/components/site/CommodityMarquee";

export function AppLayout() {
  const loc = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const tabs = [
    { to: "/app", label: t("nav.home"), icon: Home, exact: true },
    { to: "/app/farms", label: t("app.myFarms"), icon: Sprout, exact: false },
    { to: "/app/crops", label: t("app.crops"), icon: Leaf, exact: false },
    { to: "/app/market", label: t("app.marketplace"), icon: ShoppingCart, exact: false },
    { to: "/app/profile", label: t("app.profile"), icon: User, exact: false },
  ];
  const sidebarLinks: { to: string; label: string; icon: typeof Home; exact?: boolean }[] = [
    { to: "/app", label: t("app.dashboard"), icon: Home, exact: true },
    { to: "/app/analytics", label: t("app.analytics"), icon: BarChart2 },
    { to: "/app/farms", label: t("app.myFarms"), icon: Sprout },
    { to: "/app/crops", label: t("app.crops"), icon: Leaf },
    { to: "/app/weather", label: t("app.weather"), icon: CloudSun },
    { to: "/app/ai-assistant", label: "AI Assistant", icon: Bot },
    { to: "/app/market", label: t("app.marketplace"), icon: Store },
    { to: "/app/scan", label: t("app.diseaseScan"), icon: Camera },
    { to: "/app/orders", label: t("app.orders"), icon: ShoppingCart },
    { to: "/app/profile", label: t("app.profile"), icon: User },
    { to: "/app/settings", label: t("app.settings"), icon: Settings },
    { to: "/app/help", label: t("app.help"), icon: HelpCircle },
  ];
  const { data: unreadData } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: api.notifications.unreadCount,
    refetchInterval: 60_000,
  });
  const unreadCount = unreadData?.count ?? 0;
  const displayName = user?.name?.trim() || "Farmer";
  const firstName = displayName.split(/\s+/)[0];
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const locationLabel = [user?.district, user?.state].filter(Boolean).join(", ") || user?.email || "AgriSmart member";

  useEffect(() => {
    const stream = new EventSource(api.notifications.streamUrl());
    stream.onmessage = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    };
    return () => stream.close();
  }, [queryClient]);

  const notificationBadge = unreadCount > 0 ? (
    <span className="absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  ) : null;

  return (
    <div className="min-h-screen bg-muted/40">
      {/* DESKTOP shell — sidebar + content (lg+) */}
      <div className="hidden lg:flex lg:min-h-screen">
        <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-border bg-background">
          <div className="flex h-16 items-center border-b border-border px-5">
            <Logo />
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {sidebarLinks.map((l) => {
              const active = l.exact ? loc.pathname === l.to : loc.pathname.startsWith(l.to);
              const Icon = l.icon;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-5" />
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border p-3">
            <Link
              to="/app/profile"
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
            >
              <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-primary-foreground">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{locationLabel}</p>
              </div>
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
            <h1 className="font-display text-lg font-bold">{t("app.welcomeBack", { name: firstName })}</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link to="/app/notifications" className="relative grid size-10 place-items-center rounded-lg hover:bg-muted">
                <Bell className="size-5" />
                {notificationBadge}
              </Link>
            </div>
          </header>
          <CommodityMarquee />
          <main className="mx-auto w-full max-w-5xl flex-1 px-2 py-4 sm:px-6 sm:py-6" key={loc.pathname}>
            <Outlet />
          </main>
        </div>
      </div>

      {/* MOBILE/TABLET shell — phone-frame style (below lg) */}
      <div className="lg:hidden">
        <div className="mx-auto min-h-screen max-w-md bg-background pb-24 shadow-soft sm:my-6 sm:min-h-0 sm:rounded-3xl">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:rounded-t-3xl">
            <button className="grid size-10 place-items-center rounded-lg text-foreground hover:bg-muted">
              <Menu className="size-5" />
            </button>
            <Logo />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link to="/app/notifications" className="relative grid size-10 place-items-center rounded-lg hover:bg-muted">
                <Bell className="size-5" />
                {notificationBadge}
              </Link>
              <Link to="/app/profile" className="size-10 overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary-dark text-center text-sm font-bold leading-10 text-primary-foreground">
                {initials}
              </Link>
            </div>
          </header>
          <CommodityMarquee />
          <div key={loc.pathname}>
            <Outlet />
          </div>
          <nav className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-md -translate-x-1/2 items-center justify-around border-t border-border bg-background/95 px-2 py-2 backdrop-blur sm:bottom-6 sm:rounded-b-3xl lg:hidden">
            {tabs.map((t) => {
              const active = t.exact ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className="flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-xs"
                >
                  <Icon className={`size-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={active ? "font-semibold text-primary" : "text-muted-foreground"}>{t.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
