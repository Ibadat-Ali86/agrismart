import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./en.json";
import ur from "./ur.json";

export const SUPPORTED_LANGS = ["en", "ur"] as const;
export type AppLang = (typeof SUPPORTED_LANGS)[number];
export const RTL_LANGS: AppLang[] = ["ur"];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ur: { translation: ur } },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "agrismart.lang",
      caches: ["localStorage"],
    },
    returnObjects: true,
  });

export function applyLangToDocument(lang: string) {
  const normalized = (SUPPORTED_LANGS as readonly string[]).includes(lang) ? lang : "en";
  const isRtl = RTL_LANGS.includes(normalized as AppLang);
  document.documentElement.lang = normalized;
  document.documentElement.dir = isRtl ? "rtl" : "ltr";
  document.documentElement.classList.toggle("rtl", isRtl);
  document.documentElement.classList.toggle("font-urdu", isRtl);
}

applyLangToDocument(i18n.language || "en");
i18n.on("languageChanged", applyLangToDocument);

export default i18n;
