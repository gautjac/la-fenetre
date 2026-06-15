import type { Lang, WindowSpec } from "./windows";

/**
 * Compose a fresh window with Opus. The engine streams NDJSON: keepalive
 * heartbeats (bare newlines) hold the connection open during the ~25–55s call,
 * then a final JSON line carries { result } or { error }. We read to end of
 * stream and parse the last non-empty line.
 */
export async function composeWindow(opts: {
  hint?: string;
  avoid?: string[];
  lang: Lang;
}): Promise<WindowSpec> {
  const en = opts.lang === "en";
  const res = await fetch("/api/fenetre", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });

  const raw = await res.text();
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const last = lines[lines.length - 1] ?? "";

  let parsed: { result?: WindowSpec; error?: string } | null = null;
  try {
    parsed = last ? JSON.parse(last) : null;
  } catch {
    parsed = null;
  }

  const invalid = en ? "Invalid response from the server." : "Réponse invalide du serveur.";
  if (!res.ok) {
    const fallback = en ? `Error ${res.status}` : `Erreur ${res.status}`;
    throw new Error(parsed?.error || fallback);
  }
  if (!parsed) throw new Error(invalid);
  if (parsed.error) throw new Error(parsed.error);
  if (parsed.result) return parsed.result;
  throw new Error(invalid);
}

/** Generate the still for a window via Fal. Returns the hosted image URL. */
export async function fetchStill(imagePrompt: string, lang: Lang): Promise<string> {
  const en = lang === "en";
  const res = await fetch("/api/still", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imagePrompt }),
  });
  const data = (await res.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
  if (!res.ok || !data.imageUrl) {
    throw new Error(data.error || (en ? "Could not develop the frame." : "Impossible de développer l'image."));
  }
  return data.imageUrl;
}
