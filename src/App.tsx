import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  type Lang,
  type WindowSpec,
  seedForDay,
  randomSeed,
  windowId,
} from "./windows";
import {
  db,
  getSettings,
  saveSettings,
  recordVisit,
  toggleFavourite,
  recentPlaces,
  type Settings,
  DEFAULT_SETTINGS,
} from "./db";
import { makeT } from "./i18n";
import { Soundscaper } from "./audio";
import { composeWindow, fetchStill } from "./api";
import { Onboarding } from "./components/Onboarding";
import { WindowView } from "./components/WindowView";
import { Gallery } from "./components/Gallery";
import { SettingsPanel } from "./components/SettingsPanel";
import { Slate } from "./components/Slate";

type Screen = "gate" | "window";
type Overlay = "none" | "gallery" | "settings" | "invent";

const ONBOARD_KEY = "la-fenetre-onboarded";

export default function App() {
  // ── persisted settings ──
  const settingsRow = useLiveQuery(() => getSettings(), []);
  const settings: Settings = settingsRow ?? DEFAULT_SETTINGS;
  const lang = settings.lang;
  const t = makeT(lang);

  const systemReduced = useRef(
    typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  ).current;
  const reduced = settings.reducedMotion ?? systemReduced ?? false;

  // ── app state ──
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem(ONBOARD_KEY) === "1");
  const [screen, setScreen] = useState<Screen>("gate");
  const [overlay, setOverlay] = useState<Overlay>("none");

  const [spec, setSpec] = useState<WindowSpec>(() => seedForDay());
  const [specSource, setSpecSource] = useState<"seed" | "ai">("seed");
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imageLoading, setImageLoading] = useState(false);

  const [composing, setComposing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState("");

  const [soundOn, setSoundOn] = useState(false);
  const [volume, setVolume] = useState(0.7);

  const scaper = useRef<Soundscaper | null>(null);
  if (!scaper.current) scaper.current = new Soundscaper();

  // the id of the window currently on screen — used to discard stale image loads
  const activeId = useRef<string>(windowId(spec));

  // reduced-motion class on the root
  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduced);
  }, [reduced]);

  // keep the document language in sync with the chosen language
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // is the current window a favourite?
  const favRow = useLiveQuery(() => db.visited.get(windowId(spec)), [spec.place, spec.year]);
  const isFavourite = favRow?.favourite ?? false;

  // ── develop the still for a spec (Fal) ──
  const develop = useCallback(
    async (s: WindowSpec, source: "seed" | "ai", existing?: string) => {
      const id = windowId(s);
      if (existing) {
        setImageUrl(existing);
        return;
      }
      setImageUrl(undefined);
      setImageLoading(true);
      try {
        const url = await fetchStill(s.imagePrompt, lang);
        // discard if the user has since moved to a different window
        if (activeId.current !== id) return;
        setImageUrl(url);
        void recordVisit(s, source, url);
      } catch {
        // offline / Fal down: keep the palette gradient, no hard failure
        if (activeId.current === id) setImageUrl(undefined);
      } finally {
        if (activeId.current === id) setImageLoading(false);
      }
    },
    [lang],
  );

  // ── enter: the gate → window transition (requires a user gesture) ──
  const enter = useCallback(
    async (target: WindowSpec, source: "seed" | "ai", existingImage?: string) => {
      setError(null);
      activeId.current = windowId(target);
      setSpec(target);
      setSpecSource(source);
      setScreen("window");
      void recordVisit(target, source, existingImage);

      // sound is gated to this gesture
      try {
        await scaper.current!.start(target.soundscape);
        scaper.current!.setVolume(volume);
        setSoundOn(true);
      } catch {
        setSoundOn(false);
      }

      void develop(target, source, existingImage);
    },
    [develop, volume],
  );

  // ── compose a fresh AI window, then enter it ──
  const inventAndEnter = useCallback(async () => {
    setComposing(true);
    setError(null);
    try {
      const avoid = await recentPlaces(8);
      const fresh = await composeWindow({ hint: hint.trim() || undefined, avoid, lang });
      setHint("");
      setOverlay("none");
      await enter(fresh, "ai");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setComposing(false);
    }
  }, [hint, lang, enter]);

  // ── swap to another seed window (already inside) ──
  const anotherSeed = useCallback(async () => {
    const next = randomSeed(windowId(spec));
    activeId.current = windowId(next);
    setSpec(next);
    setSpecSource("seed");
    setError(null);
    void recordVisit(next, "seed");
    if (soundOn) scaper.current!.swap(next.soundscape);
    void develop(next, "seed");
  }, [spec, soundOn, develop]);

  // ── sound + volume controls ──
  const toggleSound = useCallback(async () => {
    if (soundOn) {
      scaper.current!.stop();
      setSoundOn(false);
    } else {
      await scaper.current!.start(spec.soundscape);
      scaper.current!.setVolume(volume);
      setSoundOn(true);
    }
  }, [soundOn, spec, volume]);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    scaper.current!.setVolume(v);
  }, []);

  // ── close the window (soft) ──
  const closeWindow = useCallback(() => {
    scaper.current!.stop();
    setSoundOn(false);
    setScreen("gate");
    setError(null);
  }, []);

  // tear down audio on unmount
  useEffect(() => {
    const s = scaper.current;
    return () => {
      void s?.dispose();
    };
  }, []);

  const patchSettings = useCallback((patch: Partial<Settings>) => {
    void saveSettings(patch);
  }, []);

  const finishOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARD_KEY, "1");
    setOnboarded(true);
  }, []);

  const todaysSeed = useMemo(() => seedForDay(), []);

  // ─────────────────────────────────────────────────────────────────────────
  if (!onboarded) {
    return <Onboarding lang={lang} onDone={finishOnboarding} />;
  }

  return (
    <div className="min-h-full flex flex-col">
      {/* top bar */}
      <header className="flex items-center justify-between px-5 py-4 sm:px-7">
        <button
          onClick={closeWindow}
          className="slate tracking-[0.3em] text-brass text-xs sm:text-sm uppercase hover:text-brass-bright transition-colors"
        >
          {t("appName")}
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setOverlay("gallery")}
            className="text-bone/50 hover:text-bone text-xs tracking-wide transition-colors"
          >
            {t("visited")}
          </button>
          <button
            onClick={() => setOverlay("settings")}
            className="text-bone/50 hover:text-bone transition-colors"
            aria-label={t("settings")}
          >
            <GearIcon />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {screen === "gate" ? (
          <Gate
            spec={todaysSeed}
            lang={lang}
            reduced={reduced}
            composing={composing}
            error={error}
            onEnter={() => void enter(todaysSeed, "seed")}
            onInvent={() => setOverlay("invent")}
          />
        ) : (
          <>
            <WindowView
              spec={spec}
              imageUrl={imageUrl}
              imageLoading={imageLoading}
              lang={lang}
              reduced={reduced}
              stayMinutes={settings.stayMinutes}
              soundOn={soundOn}
              volume={volume}
              isFavourite={isFavourite}
              onToggleSound={() => void toggleSound()}
              onVolume={changeVolume}
              onToggleFavourite={() => void toggleFavourite(windowId(spec))}
              onClose={closeWindow}
            />
            <div className="flex items-center justify-center gap-4 pb-10">
              <button
                onClick={() => void anotherSeed()}
                className="text-bone/50 hover:text-bone text-sm tracking-wide transition-colors"
              >
                {t("newWindow")}
              </button>
              <span className="text-bone/20">·</span>
              <button
                onClick={() => setOverlay("invent")}
                className="text-brass/70 hover:text-brass-bright text-sm tracking-wide transition-colors"
              >
                {t("inventWindow")}
              </button>
            </div>
          </>
        )}
      </main>

      {/* overlays */}
      {overlay === "gallery" && (
        <Gallery
          lang={lang}
          onClose={() => setOverlay("none")}
          onOpen={(w, img) => {
            setOverlay("none");
            void enter(w, w.year === spec.year && w.place === spec.place ? specSource : "seed", img);
          }}
        />
      )}
      {overlay === "settings" && (
        <SettingsPanel settings={settings} onChange={patchSettings} onClose={() => setOverlay("none")} />
      )}
      {overlay === "invent" && (
        <InventDialog
          lang={lang}
          hint={hint}
          composing={composing}
          error={error}
          onHint={setHint}
          onSubmit={() => void inventAndEnter()}
          onClose={() => {
            if (!composing) {
              setOverlay("none");
              setError(null);
            }
          }}
        />
      )}
    </div>
  );
}

// ── the entry gate (salle de projection, dark, one « Entrer ») ──────────────
function Gate({
  spec,
  lang,
  reduced,
  composing,
  error,
  onEnter,
  onInvent,
}: {
  spec: WindowSpec;
  lang: Lang;
  reduced: boolean;
  composing: boolean;
  error: string | null;
  onEnter: () => void;
  onInvent: () => void;
}) {
  const t = makeT(lang);
  return (
    <div className="flex-1 grid place-items-center px-5 py-8">
      <div className="w-full max-w-xl text-center animate-fadeIn">
        <div className="slate tracking-slate text-bone/40 text-[11px] uppercase mb-6">
          {t("todaysWindow")}
        </div>

        {/* a dim, closed preview frame — the curtain before the projection */}
        <div className="film-frame mb-8">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${spec.palette[0]}, ${spec.palette[1]} 60%, ${spec.palette[0]})`,
            }}
          />
          <div className="absolute inset-0 bg-screen-deep/55" />
          <div className="frame-vignette" />
          <div className="absolute inset-0 grid place-items-center">
            <Slate place={spec.place} year={spec.year} title={spec.title} lang={lang} />
          </div>
        </div>

        <button
          onClick={onEnter}
          disabled={composing}
          className="group relative px-10 py-4 rounded-full border border-brass/50 text-brass-bright tracking-[0.2em] uppercase text-sm hover:bg-brass/10 transition-all disabled:opacity-40"
        >
          <span className={reduced ? "" : "group-hover:tracking-[0.3em] transition-all"}>{t("enter")}</span>
        </button>
        <p className="text-bone/35 text-xs mt-4 italic">{t("enterHint")}</p>

        <div className="mt-8">
          <button
            onClick={onInvent}
            className="text-bone/45 hover:text-brass text-sm tracking-wide transition-colors"
          >
            {t("inventWindow")}
          </button>
        </div>

        {error && <p className="text-rose-300/70 text-sm mt-6">{error}</p>}
      </div>
    </div>
  );
}

// ── invent dialog ───────────────────────────────────────────────────────────
function InventDialog({
  lang,
  hint,
  composing,
  error,
  onHint,
  onSubmit,
  onClose,
}: {
  lang: "fr" | "en";
  hint: string;
  composing: boolean;
  error: string | null;
  onHint: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const t = makeT(lang);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-screen-deep/95 backdrop-blur-sm px-6">
      <div className="w-full max-w-md animate-fadeUp">
        <h2 className="slate text-2xl text-bone mb-2 text-center">{t("inventWindow")}</h2>
        <p className="text-bone/45 text-sm text-center mb-6">{t("enterHint")}</p>

        <input
          value={hint}
          onChange={(e) => onHint(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !composing) onSubmit();
          }}
          placeholder={t("inventPlaceholder")}
          autoFocus
          disabled={composing}
          className="w-full bg-screen-panel border border-screen-line rounded-lg px-4 py-3 text-bone placeholder:text-bone/30 outline-none focus:border-brass/50 transition-colors"
        />

        {error && <p className="text-rose-300/70 text-sm mt-3 text-center">{error}</p>}

        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={composing}
            className="px-5 py-2.5 text-bone/50 hover:text-bone text-sm transition-colors disabled:opacity-30"
          >
            {t("cancel")}
          </button>
          <button
            onClick={onSubmit}
            disabled={composing}
            className="px-7 py-2.5 rounded-full bg-brass/15 border border-brass/50 text-brass-bright hover:bg-brass/25 transition-colors text-sm tracking-wide disabled:opacity-50"
          >
            {composing ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-brass-bright animate-pulse" />
                {t("composing")}
              </span>
            ) : (
              t("invent")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" strokeLinecap="round" />
    </svg>
  );
}
