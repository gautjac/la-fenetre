import { useState } from "react";
import type { Lang } from "../windows";
import { makeT } from "../i18n";

const SLIDES: Array<{ titleKey: "onboard1Title" | "onboard2Title" | "onboard3Title"; bodyKey: "onboard1Body" | "onboard2Body" | "onboard3Body" }> = [
  { titleKey: "onboard1Title", bodyKey: "onboard1Body" },
  { titleKey: "onboard2Title", bodyKey: "onboard2Body" },
  { titleKey: "onboard3Title", bodyKey: "onboard3Body" },
];

export function Onboarding({ lang, onDone }: { lang: Lang; onDone: () => void }) {
  const t = makeT(lang);
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;
  const slide = SLIDES[i];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-screen-deep/95 backdrop-blur-sm px-6">
      <div className="max-w-md w-full text-center animate-fadeIn">
        <div className="slate tracking-slate text-brass text-sm uppercase mb-1">
          {t("appName")}
        </div>
        <div className="slate italic text-bone/50 mb-10">{t("tagline")}</div>

        <div key={i} className="animate-fadeUp">
          <h2 className="slate text-3xl sm:text-4xl text-bone mb-4">{t(slide.titleKey)}</h2>
          <p className="text-bone/70 leading-relaxed text-[15px]">{t(slide.bodyKey)}</p>
        </div>

        <div className="flex items-center justify-center gap-2 mt-10 mb-8">
          {SLIDES.map((_, k) => (
            <span
              key={k}
              className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-brass" : "w-1.5 bg-bone/25"}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-4">
          {!last ? (
            <>
              <button
                onClick={onDone}
                className="text-bone/40 hover:text-bone/70 text-sm transition-colors"
              >
                {t("skip")}
              </button>
              <button
                onClick={() => setI(i + 1)}
                className="px-6 py-2.5 rounded-full border border-brass/40 text-brass hover:bg-brass/10 transition-colors text-sm tracking-wide"
              >
                →
              </button>
            </>
          ) : (
            <button
              onClick={onDone}
              className="px-7 py-3 rounded-full bg-brass/15 border border-brass/50 text-brass-bright hover:bg-brass/25 transition-colors tracking-wide"
            >
              {t("onboardStart")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
