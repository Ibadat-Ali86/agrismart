import { Link, NavLink } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const nav = [
    { to: "/", label: t("nav.home") },
    { to: "/features", label: t("nav.features") },
    { to: "/how-it-works", label: t("nav.howItWorks") },
    { to: "/marketplace", label: t("nav.marketplace") },
    { to: "/guides", label: t("nav.guides") },
    { to: "/pricing", label: t("nav.pricing") },
    { to: "/about", label: t("nav.about") },
    { to: "/contact", label: t("nav.contact") },
  ];
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-7 lg:flex">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary [&.active]:text-primary [&.active]:font-semibold"
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <ThemeToggle />
          {isAuthenticated ? (
            <Link to="/app">
              <Button className="bg-primary hover:bg-primary-dark text-primary-foreground font-semibold shadow-soft">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button className="bg-primary hover:bg-primary-dark text-primary-foreground font-semibold shadow-soft">
                {t("nav.login")}
              </Button>
            </Link>
          )}
          <button
            className="rounded-md p-2 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-border bg-background lg:hidden">
          <div className="container mx-auto flex flex-col px-4 py-3">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted [&.active]:bg-accent [&.active]:text-primary"
              >
                {n.label}
              </NavLink>
            ))}
            <div className="mt-2 border-t border-border pt-3">
              <LanguageSwitcher />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
