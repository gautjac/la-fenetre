import { useEffect, useRef, useState } from "react";
import type { Lang, WindowSpec } from "../windows";
import { yearLabel, resolveText } from "../windows";
import { makeT } from "../i18n";
import { Slate } from "./Slate";
import { BreathTimer } from "./BreathTimer";

// The open window: the letterboxed frame is the hero. The user has already
// "entered" (sound is live). The noticing line is revealed after a beat; the
// context sits quiet below; a breathing timer marks the stay.
export function WindowView({
  spec,
  imageUrl,
  imageLoading,
  lang,
  reduced,
  stayMinutes,
  soundOn,
  volume,
  isFavourite,
  onToggleSound,
  onVolume,
  onToggleFavourite,
  onClose,
}: {
  spec: WindowSpec;
  imageUrl?: string;
  imageLoading: boolean;
  lang: Lang;
  reduced: boolean;
  stayMinutes: number;
  soundOn: boolean;
  volume: number;
  isFavourite: boolean;
  onToggleSound: () => void;
  onVolume: (v: number) => void;
  onToggleFavourite: () => void;
  onClose: () => void;
}) {
  const t = makeT(lang);
  const [showNoticing, setShowNoticing] = useState(false);
  const [stayDone, setStayDone] = useState(false);
  const noticingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // reveal the noticing line ~6s after the frame is up (or instantly if reduced)
  useEffect(() => {
    setShowNoticing(false);
    setStayDone(false);
    if (noticingTimer.current) clearTimeout(noticingTimer.current);
    noticingTimer.current = setTimeout(() => setShowNoticing(true), reduced ? 400 : 6000);
    return () => {
      if (noticingTimer.current) clearTimeout(noticingTimer.current);
    };
  }, [spec, reduced]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 animate-fadeIn">
      {/* ── the frame ── */}
      <div className={`film-frame grain ${reduced ? "" : "projector"}`}>
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${spec.palette[0]}, ${spec.palette[1]} 60%, ${spec.palette[0]})` }}
        />
        {imageUrl && (
          <img
            src={imageUrl}
            alt={`${spec.place}, ${yearLabel(spec.year, lang)}`}
            className={reduced ? "" : "ken-burns"}
          />
        )}
        <div className="frame-vignette" />

        {/* developing shimmer */}
        {imageLoading && !imageUrl && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-bone/50 text-xs uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-brass animate-pulse" />
              {t("developing")}
            </div>
          </div>
        )}

        {/* the slate, lower-left like a film burn-in */}
        <div className="absolute left-5 bottom-4 sm:left-7 sm:bottom-6">
          <Slate place={spec.place} year={spec.year} title={spec.title} lang={lang} align="left" />
        </div>
      </div>

      {/* ── chrome under the frame ── */}
      <div className="mt-5 flex items-center justify-between gap-4">
        <SoundControl
          lang={lang}
          on={soundOn}
          volume={volume}
          onToggle={onToggleSound}
          onVolume={onVolume}
        />

        <BreathTimer
          minutes={stayMinutes}
          lang={lang}
          reduced={reduced}
          onComplete={() => setStayDone(true)}
        />

        <button
          onClick={onToggleFavourite}
          className={`text-sm tracking-wide transition-colors shrink-0 ${
            isFavourite ? "text-brass-bright" : "text-bone/40 hover:text-bone/80"
          }`}
          aria-pressed={isFavourite}
        >
          {isFavourite ? "★" : "☆"}
          <span className="hidden sm:inline ml-1.5">
            {isFavourite ? t("favourited") : t("favourite")}
          </span>
        </button>
      </div>

      {/* ── the noticing ── */}
      <div className="mt-10 min-h-[120px]">
        {showNoticing && (
          <div className="animate-fadeUp text-center max-w-xl mx-auto">
            <div className="slate tracking-slate text-brass/80 text-[11px] uppercase mb-3">
              {t("noticing")}
            </div>
            <p className="slate text-bone text-xl sm:text-2xl leading-relaxed italic">
              {resolveText(spec.noticing, lang)}
            </p>
          </div>
        )}
      </div>

      {/* ── the context ── */}
      <div className="mt-8 max-w-lg mx-auto text-center">
        <hr className="rule mb-5" />
        <div className="slate tracking-slate text-bone/40 text-[10px] uppercase mb-2">
          {t("context")}
        </div>
        <p className="text-bone/65 text-sm leading-relaxed">{resolveText(spec.context, lang)}</p>
      </div>

      {/* ── close ── */}
      <div className="mt-12 mb-4 text-center">
        {stayDone && (
          <p className="text-bone/40 text-xs italic mb-4 animate-fadeIn">{t("stayDone")}</p>
        )}
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-full border border-screen-line text-bone/50 hover:text-bone hover:border-brass/40 transition-colors text-sm tracking-wide"
        >
          {t("close")}
        </button>
      </div>
    </div>
  );
}

function SoundControl({
  lang,
  on,
  volume,
  onToggle,
  onVolume,
}: {
  lang: Lang;
  on: boolean;
  volume: number;
  onToggle: () => void;
  onVolume: (v: number) => void;
}) {
  const t = makeT(lang);
  return (
    <div className="flex items-center gap-3 shrink-0">
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 text-sm transition-colors ${
          on ? "text-brass-bright" : "text-bone/40 hover:text-bone/80"
        }`}
        aria-pressed={on}
      >
        <SpeakerIcon on={on} />
        <span className="hidden sm:inline tracking-wide">{t("soundOn")}</span>
      </button>
      {on && (
        <input
          type="range"
          min={0}
          max={1}
          step={0.02}
          value={volume}
          onChange={(e) => onVolume(Number(e.target.value))}
          aria-label={t("volume")}
          className="w-16 sm:w-20 accent-brass h-1"
        />
      )}
    </div>
  );
}

function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinejoin="round" />
      {on ? (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" strokeLinecap="round" />
          <path d="M18 6a8 8 0 0 1 0 12" strokeLinecap="round" />
        </>
      ) : (
        <path d="M16 9l5 6M21 9l-5 6" strokeLinecap="round" />
      )}
    </svg>
  );
}
