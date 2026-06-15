import type { Context } from "@netlify/functions";
import { composeWindow, type Lang } from "./lib/window.ts";
import { ndjsonStream, jsonError } from "./lib/stream.ts";

interface Body {
  hint?: string;
  avoid?: string[];
  lang?: Lang;
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return jsonError("POST only", 405);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const lang: Lang = body.lang === "en" ? "en" : "fr";
  const avoid = Array.isArray(body.avoid) ? body.avoid.slice(0, 12).map(String) : [];

  // Opus can take 25–55s; stream NDJSON keepalives, final line carries {result}.
  return ndjsonStream(() =>
    composeWindow({ hint: body.hint, avoid, lang }),
  );
};
