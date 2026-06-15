import { useEffect, useRef, useState } from "react";
import type { Lang } from "../windows";
import { makeT } from "../i18n";

// A gentle breathing cue + stay timer. The dot expands/contracts on a slow
// cycle; a thin ring fills over the chosen stay length. When time is up it
// invites a soft close — but never forces it.
export function BreathTimer({
  minutes,
  lang,
  reduced,
  onComplete,
}: {
  minutes: number;
  lang: Lang;
  reduced: boolean;
  onComplete: () => void;
}) {
  const t = makeT(lang);
  const totalMs = Math.max(0.5, minutes) * 60_000;
  const [progress, setProgress] = useState(0); // 0..1
  const [phase, setPhase] = useState<"in" | "out">("in");
  const startRef = useRef<number>(Date.now());
  const doneRef = useRef(false);

  useEffect(() => {
    startRef.current = Date.now();
    doneRef.current = false;
    let raf = 0;
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const p = Math.min(1, elapsed / totalMs);
      setProgress(p);
      // 8s breath cycle, in for 4s out for 4s
      setPhase(Math.floor((elapsed / 4000) % 2) === 0 ? "in" : "out");
      if (p >= 1 && !doneRef.current) {
        doneRef.current = true;
        onComplete();
      }
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalMs]);

  const R = 26;
  const C = 2 * Math.PI * R;

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div className="relative h-[68px] w-[68px] grid place-items-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 68 68" aria-hidden>
          <circle cx="34" cy="34" r={R} fill="none" stroke="rgba(200,162,90,0.15)" strokeWidth="1.5" />
          <circle
            cx="34"
            cy="34"
            r={R}
            fill="none"
            stroke="rgba(200,162,90,0.7)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            style={{ transition: "stroke-dashoffset 0.3s linear" }}
          />
        </svg>
        <div
          className="breath-dot h-3 w-3"
          style={{ ["--breath" as string]: reduced ? "0s" : "8s" }}
        />
      </div>
      {!reduced && (
        <div className="text-[11px] uppercase tracking-[0.3em] text-bone/40 h-3">
          {phase === "in" ? t("breatheIn") : t("breatheOut")}
        </div>
      )}
    </div>
  );
}
