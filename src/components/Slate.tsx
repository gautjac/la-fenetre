import { yearLabel, type Lang } from "../windows";

// The film-slate title card: PLACE · YEAR, in elegant tracked serif.
export function Slate({
  place,
  year,
  title,
  lang = "fr",
  align = "center",
}: {
  place: string;
  year: number;
  title?: string;
  lang?: Lang;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      <div className="slate tracking-slate text-brass text-xs sm:text-sm uppercase">
        <span className="text-bone">{place}</span>
        <span className="mx-2 text-brass/60">·</span>
        <span className="text-bone/80">{yearLabel(year, lang)}</span>
      </div>
      {title && (
        <div className="slate mt-2 text-bone/70 italic text-lg sm:text-xl tracking-wide">
          {title}
        </div>
      )}
    </div>
  );
}
