import type { Settings } from "../db";
import type { Lang } from "../windows";
import { makeT } from "../i18n";

export function SettingsPanel({
  settings,
  onChange,
  onClose,
}: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
}) {
  const t = makeT(settings.lang);

  return (
    <div className="fixed inset-0 z-40 bg-screen-deep/96 backdrop-blur-sm grid place-items-center px-6">
      <div className="max-w-sm w-full animate-fadeUp">
        <div className="flex items-center justify-between mb-8">
          <h2 className="slate tracking-slate text-brass text-sm uppercase">{t("settings")}</h2>
          <button onClick={onClose} className="text-bone/50 hover:text-bone text-sm">
            {t("back")} →
          </button>
        </div>

        <div className="space-y-7">
          <Toggle
            label={t("settingAutoplay")}
            note={t("settingAutoplayNote")}
            value={settings.autoplaySound}
            onChange={(v) => onChange({ autoplaySound: v })}
          />
          <Toggle
            label={t("settingReduced")}
            value={settings.reducedMotion === true}
            onChange={(v) => onChange({ reducedMotion: v })}
          />

          <div>
            <div className="text-bone/80 text-sm mb-3">
              {t("settingStay")}{" "}
              <span className="text-brass">
                {settings.stayMinutes} {t("minutes")}
              </span>
            </div>
            <div className="flex gap-2">
              {[2, 3, 5].map((m) => (
                <button
                  key={m}
                  onClick={() => onChange({ stayMinutes: m })}
                  className={`flex-1 py-2 rounded-md border text-sm transition-colors ${
                    settings.stayMinutes === m
                      ? "border-brass/50 bg-brass/15 text-brass-bright"
                      : "border-screen-line text-bone/50 hover:text-bone/80"
                  }`}
                >
                  {m} {t("minutes")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-bone/80 text-sm mb-3">{t("settingLang")}</div>
            <div className="flex gap-2">
              {(["fr", "en"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => onChange({ lang: l })}
                  className={`flex-1 py-2 rounded-md border text-sm uppercase tracking-wider transition-colors ${
                    settings.lang === l
                      ? "border-brass/50 bg-brass/15 text-brass-bright"
                      : "border-screen-line text-bone/50 hover:text-bone/80"
                  }`}
                >
                  {l === "fr" ? "Français" : "English"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  note,
  value,
  onChange,
}: {
  label: string;
  note?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button onClick={() => onChange(!value)} className="flex items-center justify-between w-full text-left group">
      <span className="text-bone/80 text-sm">
        {label}
        {note && <span className="text-bone/35 ml-1.5 text-xs">{note}</span>}
      </span>
      <span
        className={`relative inline-block w-11 h-6 rounded-full transition-colors shrink-0 ${
          value ? "bg-brass/60" : "bg-screen-line"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-bone transition-transform ${
            value ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
