import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import i18n, { applyLangToDocument, type AppLang } from "@/i18n";

export type ThemeMode = "light" | "dark" | "system";
export type Units = "metric" | "imperial";

type SettingsState = {
  lang: AppLang;
  units: Units;
  theme: ThemeMode;
  notifications: boolean;
  voice: boolean;
  offline: boolean;
};

const STORAGE_KEY = "agrismart.settings";

const DEFAULTS: SettingsState = {
  lang: "en",
  units: "metric",
  theme: "system",
  notifications: false,
  voice: false,
  offline: false,
};

function loadInitial(): SettingsState {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<SettingsState>) : {};
    const langFromI18n = (localStorage.getItem("agrismart.lang") || i18n.language || "en").slice(0, 2);
    const themeFromLegacy = localStorage.getItem("theme");
    return {
      ...DEFAULTS,
      ...parsed,
      lang: (parsed.lang || (langFromI18n === "ur" ? "ur" : "en")) as AppLang,
      theme: (parsed.theme || (themeFromLegacy as ThemeMode) || DEFAULTS.theme),
    };
  } catch {
    return DEFAULTS;
  }
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  root.classList.toggle("dark", resolved === "dark");
  localStorage.setItem("theme", theme);
}

type SettingsContextValue = SettingsState & {
  setLang: (l: AppLang) => void;
  setUnits: (u: Units) => void;
  setTheme: (t: ThemeMode) => void;
  setNotifications: (on: boolean) => Promise<void>;
  setVoice: (on: boolean) => void;
  setOffline: (on: boolean) => void;
  formatWeight: (kg: number) => string;
  formatArea: (hectares: number) => string;
  formatTemp: (celsius: number) => string;
  currency: (amount: number) => string;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SettingsState>(() => DEFAULTS);
  const { t } = useTranslation();

  // hydrate on mount (avoid SSR mismatch — frontend is pure SPA but keep safe)
  useEffect(() => {
    const initial = loadInitial();
    setState(initial);
    void i18n.changeLanguage(initial.lang);
    applyLangToDocument(initial.lang);
    applyTheme(initial.theme);
  }, []);

  // persist on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  // follow system theme when on "system"
  useEffect(() => {
    if (state.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [state.theme]);

  const setLang = useCallback((lang: AppLang) => {
    setState((s) => ({ ...s, lang }));
    void i18n.changeLanguage(lang);
    localStorage.setItem("agrismart.lang", lang);
  }, []);

  const setUnits = useCallback((units: Units) => setState((s) => ({ ...s, units })), []);

  const setTheme = useCallback((theme: ThemeMode) => {
    setState((s) => ({ ...s, theme }));
    applyTheme(theme);
  }, []);

  const setNotifications = useCallback(
    async (on: boolean) => {
      if (!("Notification" in window)) {
        toast.error(t("settings.permissionDenied"));
        return;
      }
      if (on) {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          toast.error(t("settings.permissionDenied"));
          setState((s) => ({ ...s, notifications: false }));
          return;
        }
        toast.success(t("settings.permissionGranted"));
      }
      setState((s) => ({ ...s, notifications: on }));
    },
    [t],
  );

  const setVoice = useCallback(
    (on: boolean) => {
      const supported =
        typeof window !== "undefined" &&
        ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) &&
        "speechSynthesis" in window;
      if (on && !supported) {
        toast.error(t("settings.voiceUnsupported"));
        return;
      }
      setState((s) => ({ ...s, voice: on }));
    },
    [t],
  );

  const setOffline = useCallback(
    (on: boolean) => {
      setState((s) => ({ ...s, offline: on }));
      try {
        localStorage.setItem("agrismart.offline", on ? "1" : "0");
      } catch {}
      toast.success(on ? t("settings.offlineEnabled") : t("settings.offlineDisabled"));
    },
    [t],
  );

  const value = useMemo<SettingsContextValue>(() => {
    const KG_PER_LB = 2.2046226218;
    const HA_PER_AC = 2.4710538147;
    return {
      ...state,
      setLang,
      setUnits,
      setTheme,
      setNotifications,
      setVoice,
      setOffline,
      formatWeight: (kg: number) =>
        state.units === "metric"
          ? `${kg.toLocaleString(state.lang === "ur" ? "ur-PK" : "en-PK", { maximumFractionDigits: 1 })} kg`
          : `${(kg * KG_PER_LB).toLocaleString("en", { maximumFractionDigits: 1 })} lb`,
      formatArea: (ha: number) =>
        state.units === "metric"
          ? `${ha.toLocaleString("en", { maximumFractionDigits: 2 })} ha`
          : `${(ha * HA_PER_AC).toLocaleString("en", { maximumFractionDigits: 2 })} ac`,
      formatTemp: (c: number) =>
        state.units === "metric"
          ? `${Math.round(c)}°C`
          : `${Math.round(c * 1.8 + 32)}°F`,
      currency: (amount: number) =>
        new Intl.NumberFormat(state.lang === "ur" ? "ur-PK" : "en-PK", {
          style: "currency",
          currency: "PKR",
          maximumFractionDigits: 0,
        }).format(amount),
    };
  }, [state, setLang, setUnits, setTheme, setNotifications, setVoice, setOffline]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
