import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, toggleFavourite, type VisitedWindow } from "../db";
import type { Lang, WindowSpec } from "../windows";
import { yearLabel } from "../windows";
import { makeT } from "../i18n";

// The "déjà visitées" / "gardées" drawer. Tapping a card reopens that window.
export function Gallery({
  lang,
  onOpen,
  onClose,
}: {
  lang: Lang;
  onOpen: (w: WindowSpec, imageUrl?: string) => void;
  onClose: () => void;
}) {
  const t = makeT(lang);
  const [tab, setTab] = useState<"visited" | "favourites">("visited");

  const rows = useLiveQuery(async () => {
    const all = await db.visited.orderBy("visitedAt").reverse().toArray();
    return tab === "favourites" ? all.filter((r) => r.favourite) : all;
  }, [tab]);

  return (
    <div className="fixed inset-0 z-40 bg-screen-deep/96 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-3xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="text-bone/50 hover:text-bone text-sm transition-colors">
            ← {t("back")}
          </button>
          <div className="flex gap-1 rounded-full border border-screen-line p-1">
            <Tab active={tab === "visited"} onClick={() => setTab("visited")}>
              {t("visited")}
            </Tab>
            <Tab active={tab === "favourites"} onClick={() => setTab("favourites")}>
              {t("favourites")}
            </Tab>
          </div>
        </div>

        {rows && rows.length === 0 && (
          <p className="text-bone/40 text-center py-20 italic">
            {tab === "favourites" ? t("noFavourites") : t("noVisited")}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rows?.map((w) => (
            <Card key={w.id} w={w} lang={lang} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs tracking-wide transition-colors ${
        active ? "bg-brass/15 text-brass-bright" : "text-bone/50 hover:text-bone/80"
      }`}
    >
      {children}
    </button>
  );
}

function Card({
  w,
  lang,
  onOpen,
}: {
  w: VisitedWindow;
  lang: Lang;
  onOpen: (w: WindowSpec, imageUrl?: string) => void;
}) {
  const t = makeT(lang);
  return (
    <div className="group rounded-lg overflow-hidden border border-screen-line bg-screen-panel">
      <button
        onClick={() => onOpen(w, w.imageUrl)}
        className="block w-full text-left"
        aria-label={`${w.place} ${yearLabel(w.year, lang)}`}
      >
        <div
          className="aspect-video bg-screen-deep relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${w.palette[0]}, ${w.palette[1]})` }}
        >
          {w.imageUrl && (
            <img
              src={w.imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
              style={{ filter: "saturate(0.85) contrast(1.04)" }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="slate tracking-[0.25em] text-xs uppercase text-bone">
              {w.place} <span className="text-brass/70">· {yearLabel(w.year, lang)}</span>
            </div>
            <div className="slate italic text-bone/70 text-sm">{w.title}</div>
          </div>
        </div>
      </button>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[10px] uppercase tracking-wider text-bone/35">
          {w.source === "ai" ? t("ai") : t("seed")}
        </span>
        <button
          onClick={() => toggleFavourite(w.id)}
          className={`text-xs transition-colors ${w.favourite ? "text-brass-bright" : "text-bone/35 hover:text-bone/70"}`}
        >
          {w.favourite ? "★ " + t("favourited") : "☆ " + t("favourite")}
        </button>
      </div>
    </div>
  );
}
