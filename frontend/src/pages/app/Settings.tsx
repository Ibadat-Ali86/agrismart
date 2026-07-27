import { AppHeaderBack } from "@/components/app/AppHeaderBack";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LogOut, User, ShieldCheck, HelpCircle, Globe, Ruler, Bell, Mic, WifiOff, Sun, Moon, Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ThemeMode, Units } from "@/contexts/SettingsContext";
import type { AppLang } from "@/i18n";

export default function Settings() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const nav = useNavigate();
  const {
    lang, setLang,
    units, setUnits,
    theme, setTheme,
    notifications, setNotifications,
    voice, setVoice,
    offline, setOffline,
  } = useSettings();

  const themes: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
    { value: "light", label: t("settings.theme.light"), Icon: Sun },
    { value: "dark", label: t("settings.theme.dark"), Icon: Moon },
    { value: "system", label: t("settings.theme.system"), Icon: Monitor },
  ];

  return (
    <div>
      <AppHeaderBack title={t("settings.title")} />
      <div className="space-y-3 p-4">
        {/* Appearance / Theme */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <header className="mb-3 flex items-center gap-3">
            <Sun className="size-5 text-primary" />
            <div className="flex-1">
              <p className="font-semibold">{t("settings.appearance")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.appearanceDesc")}</p>
            </div>
          </header>
          <div className="grid grid-cols-3 gap-2">
            {themes.map(({ value, label, Icon }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition ${
                    active ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                  aria-pressed={active}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Language */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <header className="mb-3 flex items-center gap-3">
            <Globe className="size-5 text-primary" />
            <div className="flex-1">
              <p className="font-semibold">{t("settings.language")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.languageDesc")}</p>
            </div>
          </header>
          <div className="grid grid-cols-2 gap-2">
            {(["en", "ur"] as AppLang[]).map((l) => {
              const active = lang === l;
              return (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`rounded-xl border p-3 text-sm font-semibold transition ${
                    active ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                  aria-pressed={active}
                >
                  {l === "en" ? "English" : "اردو"}
                </button>
              );
            })}
          </div>
        </section>

        {/* Units */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <header className="mb-3 flex items-center gap-3">
            <Ruler className="size-5 text-primary" />
            <div className="flex-1">
              <p className="font-semibold">{t("settings.units")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.unitsDesc")}</p>
            </div>
          </header>
          <div className="grid grid-cols-2 gap-2">
            {(["metric", "imperial"] as Units[]).map((u) => {
              const active = units === u;
              return (
                <button
                  key={u}
                  onClick={() => setUnits(u)}
                  className={`rounded-xl border p-3 text-sm font-semibold transition ${
                    active ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                  aria-pressed={active}
                >
                  {t(`settings.${u}`)}
                </button>
              );
            })}
          </div>
        </section>

        {/* Notifications */}
        <SettingRow
          icon={Bell}
          title={t("settings.notifications")}
          desc={t("settings.notificationsDesc")}
          checked={notifications}
          onChange={(v) => void setNotifications(v)}
        />

        {/* Voice */}
        <SettingRow
          icon={Mic}
          title={t("settings.voice")}
          desc={t("settings.voiceDesc")}
          checked={voice}
          onChange={setVoice}
        />

        {/* Offline */}
        <SettingRow
          icon={WifiOff}
          title={t("settings.offline")}
          desc={t("settings.offlineDesc")}
          checked={offline}
          onChange={setOffline}
        />

        {/* Links */}
        {[
          { to: "/app/profile", icon: User, label: t("settings.profile") },
          { to: "/app/help", icon: HelpCircle, label: t("nav.help") },
          { to: "/privacy", icon: ShieldCheck, label: t("settings.privacy") },
        ].map((i) => (
          <Link
            key={i.to}
            to={i.to}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
          >
            <i.icon className="size-5 text-primary" />
            <span className="font-medium">{i.label}</span>
          </Link>
        ))}

        <Button
          variant="outline"
          onClick={async () => {
            await logout();
            nav("/login");
          }}
          className="w-full text-destructive"
        >
          <LogOut className="size-4" /> {t("common.signOut")}
        </Button>
      </div>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  desc,
  checked,
  onChange,
}: {
  icon: typeof Bell;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Icon className="size-5 text-primary" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </div>
  );
}
