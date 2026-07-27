import { Globe } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import type { AppLang } from "@/i18n";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useSettings();
  return (
    <label className={`inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-sm font-medium hover:bg-muted ${className}`}>
      <Globe className="size-4" aria-hidden="true" />
      <span className="sr-only">Language</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as AppLang)}
        className="cursor-pointer bg-transparent outline-none"
        aria-label="Language"
      >
        <option value="en">EN</option>
        <option value="ur">اردو</option>
      </select>
    </label>
  );
}
