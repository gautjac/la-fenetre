import Dexie, { type Table } from "dexie";
import type { WindowSpec } from "./windows";
import { windowId } from "./windows";

// A window the user has opened. We keep the full spec so favourites and the
// "déjà visité" gallery render offline, with the (optional) generated image URL.
export interface VisitedWindow extends WindowSpec {
  id: string; // windowId(place, year)
  visitedAt: number;
  favourite: boolean;
  imageUrl?: string;
  source: "seed" | "ai";
}

export interface Settings {
  id: "settings";
  autoplaySound: boolean; // honoured only after first user gesture
  reducedMotion: boolean | null; // null = follow system
  lang: "fr" | "en";
  stayMinutes: number; // length of the breathing stay
}

class FenetreDB extends Dexie {
  visited!: Table<VisitedWindow, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super("la-fenetre");
    this.version(1).stores({
      visited: "id, visitedAt, favourite, source",
      settings: "id",
    });
  }
}

export const db = new FenetreDB();

export const DEFAULT_SETTINGS: Settings = {
  id: "settings",
  autoplaySound: false,
  reducedMotion: null,
  lang: "fr",
  stayMinutes: 3,
};

export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get("settings");
  return s ?? DEFAULT_SETTINGS;
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ ...current, ...patch, id: "settings" });
}

export async function recordVisit(
  spec: WindowSpec,
  source: "seed" | "ai",
  imageUrl?: string,
): Promise<void> {
  const id = windowId(spec);
  const existing = await db.visited.get(id);
  await db.visited.put({
    ...spec,
    id,
    source,
    visitedAt: Date.now(),
    favourite: existing?.favourite ?? false,
    imageUrl: imageUrl ?? existing?.imageUrl,
  });
}

export async function toggleFavourite(id: string): Promise<void> {
  const w = await db.visited.get(id);
  if (w) await db.visited.update(id, { favourite: !w.favourite });
}

/** Recently visited place names, for the AI to avoid repeating. */
export async function recentPlaces(limit = 8): Promise<string[]> {
  const rows = await db.visited.orderBy("visitedAt").reverse().limit(limit).toArray();
  return rows.map((r) => `${r.place} ${r.year}`);
}
