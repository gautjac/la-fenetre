import type { Context } from "@netlify/functions";
import { paintWindow } from "./lib/painter.ts";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

interface Body {
  imagePrompt?: string;
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const prompt = (body.imagePrompt ?? "").trim();
  if (prompt.length < 4) return json({ error: "Missing image prompt." }, 400);

  try {
    const imageUrl = await paintWindow(prompt, "landscape_16_9");
    return json({ imageUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json({ error: message }, 500);
  }
};
