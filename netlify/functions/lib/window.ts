import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-8";

export type Lang = "fr" | "en";

function client(): Anthropic {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error("Server missing CLAUDE_API_KEY");
  return new Anthropic({ apiKey, baseURL: "https://api.anthropic.com" });
}

// ---------------------------------------------------------------------------
// The shape of one window. This must stay in lockstep with src/windows.ts.
// ---------------------------------------------------------------------------

/** The procedural soundscape layers the Web Audio engine knows how to build. */
export type SoundLayerKind =
  | "murmur" // café / crowd babble — band-passed brown noise, slow swells
  | "rain" // steady rain — high-passed white noise
  | "wind" // wind — low band-passed noise, long swells
  | "fire" // crackling hearth — low rumble + sparse crackle bursts
  | "water" // stream / fountain — mid band-passed noise, gentle
  | "waves" // sea — very slow swelling low noise
  | "room" // quiet interior air — low pink-noise bed
  | "drone" // sustained tonal pad — stacked detuned sines
  | "bells" // distant bell / temple gong — sine partials, sparse strikes
  | "birds" // sparse high chirps — short sine blips
  | "market" // outdoor bustle — brighter murmur with sparser accents
  | "night" // crickets / insects — high shimmering pulses
  | "clock"; // a slow tick — sparse low click

export interface SoundLayer {
  kind: SoundLayerKind;
  /** 0..1 — relative level of this layer in the mix. */
  gain: number;
  /** 40..1200 — centre/cutoff frequency hint in Hz. */
  freq?: number;
}

export interface Soundscape {
  /** the layered beds + accents that make this place's air. */
  layers: SoundLayer[];
  /** root note (Hz) for any tonal drone/pad, ~55–220. */
  droneHz?: number;
}

export interface WindowSpec {
  /** Place name as a slate, e.g. "Lisbonne". */
  place: string;
  /** Year, e.g. 1923. */
  year: number;
  /** Evocative two-to-five-word subtitle, e.g. "un café l'après-midi". */
  title: string;
  /** English scene prompt for Fal. */
  imagePrompt: string;
  /** The procedural ambience recipe. */
  soundscape: Soundscape;
  /** "Une chose à remarquer" — one specific invitation to notice. */
  noticing: string;
  /** One sentence of real, true context about this place/time. */
  context: string;
  /** Three hex colours sampled from the scene's mood (for UI tinting). */
  palette: [string, string, string];
}

// ---------------------------------------------------------------------------
// Generating a fresh window with Opus.
// ---------------------------------------------------------------------------

const VOICE_FR = `Tu es la conservatrice de La Fenêtre, une application qui ouvre, chaque jour, une « fenêtre » de trois minutes sur un lieu et une époque précis. Ton travail : composer une scène immersive et vraie. Tu écris en français québécois, sobre et sensoriel — jamais touristique, jamais cliché. Le contexte historique doit être exact et vérifiable ; n'invente pas de faits. La « chose à remarquer » est UNE invitation précise et concrète à porter attention (une qualité de lumière, un son lointain, un geste, une odeur suggérée), formulée à la deuxième personne, douce. Le sous-titre est court et évocateur (2 à 5 mots, minuscules). Le prompt d'image est en ANGLAIS, descriptif et concret, sans personnes qui posent. Choisis l'ambiance sonore parmi les couches disponibles seulement.`;

const VOICE_EN = `You are the curator of La Fenêtre, an app that opens a three-minute "window" onto one specific place and era each day. Your job: compose an immersive, true scene. Restrained, sensory prose. The historical context must be accurate and verifiable; invent no facts. The "thing to notice" is ONE precise, concrete invitation to pay attention (a quality of light, a distant sound, a gesture, a suggested smell), in the second person, gentle. The subtitle is short and evocative (2–5 lowercase words). The image prompt is in ENGLISH, descriptive and concrete, no one posing. Choose the soundscape only from the available layers.`;

const LAYER_ENUM: SoundLayerKind[] = [
  "murmur",
  "rain",
  "wind",
  "fire",
  "water",
  "waves",
  "room",
  "drone",
  "bells",
  "birds",
  "market",
  "night",
  "clock",
];

const WINDOW_TOOL: Anthropic.Tool = {
  name: "compose_window",
  description:
    "Compose one immersive window onto a specific place and time, with a generated-image prompt and a procedural soundscape recipe.",
  input_schema: {
    type: "object",
    required: ["place", "year", "title", "imagePrompt", "soundscape", "noticing", "context", "palette"],
    properties: {
      place: { type: "string", description: "Place name as a slate, e.g. 'Lisbonne'." },
      year: { type: "integer", description: "The year, e.g. 1923. Negative for BCE." },
      title: { type: "string", description: "Short evocative lowercase subtitle, 2–5 words." },
      imagePrompt: {
        type: "string",
        description:
          "English scene description for image generation: the setting, time of day, weather, objects, mood, light. Concrete, no one posing, no text.",
      },
      soundscape: {
        type: "object",
        required: ["layers"],
        properties: {
          layers: {
            type: "array",
            minItems: 2,
            maxItems: 4,
            description: "2–4 ambience layers that build this place's air.",
            items: {
              type: "object",
              required: ["kind", "gain"],
              properties: {
                kind: { type: "string", enum: LAYER_ENUM, description: "Layer type." },
                gain: { type: "number", description: "Relative level 0..1." },
                freq: { type: "number", description: "Optional centre/cutoff Hz hint, 40..1200." },
              },
            },
          },
          droneHz: { type: "number", description: "Optional drone root frequency, 55..220 Hz." },
        },
      },
      noticing: {
        type: "string",
        description: "One precise, gentle second-person invitation to notice a specific detail.",
      },
      context: {
        type: "string",
        description: "One true, verifiable sentence about what this place/time was actually like.",
      },
      palette: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: { type: "string" },
        description: "Three hex colours (e.g. '#2a3b4c') sampled from the scene's mood.",
      },
    },
  },
};

export interface ComposeRequest {
  /** Optional user hint, e.g. "quelque part de pluvieux" or "Tokyo". Free-form. */
  hint?: string;
  /** Places to avoid repeating (recently seen). */
  avoid?: string[];
  lang: Lang;
}

export async function composeWindow(req: ComposeRequest): Promise<WindowSpec> {
  const { hint, avoid = [], lang } = req;
  const avoidLine =
    avoid.length > 0
      ? lang === "fr"
        ? `\n\nÉvite de répéter ces lieux récents : ${avoid.join(", ")}.`
        : `\n\nAvoid repeating these recent places: ${avoid.join(", ")}.`
      : "";
  const hintLine = hint?.trim()
    ? lang === "fr"
      ? `\n\nL'envie de la personne : « ${hint.trim()} ». Honore-la, mais choisis un lieu et une année précis.`
      : `\n\nThe person's wish: "${hint.trim()}". Honour it, but pick a precise place and year.`
    : "";

  const instruction =
    lang === "fr"
      ? `Compose une nouvelle fenêtre : un lieu et une année précis, évocateurs, ailleurs dans l'espace et le temps. Réponds uniquement en appelant compose_window, tous les champs textuels en français (sauf imagePrompt, en anglais).${hintLine}${avoidLine}`
      : `Compose a new window: one precise, evocative place and year, elsewhere in space and time. Respond only by calling compose_window, all text fields in English.${hintLine}${avoidLine}`;

  const res = await client().messages.create({
    model: MODEL,
    max_tokens: 1100,
    system: lang === "fr" ? VOICE_FR : VOICE_EN,
    messages: [{ role: "user", content: instruction }],
    tools: [WINDOW_TOOL],
    tool_choice: { type: "tool", name: "compose_window" },
  });

  const tool = res.content.find((b) => b.type === "tool_use");
  if (!tool || tool.type !== "tool_use") throw new Error("No window returned");
  const i = tool.input as Record<string, unknown>;

  const rawLayers = Array.isArray(i.soundscape) ? [] : ((i.soundscape as Record<string, unknown>)?.layers as unknown[]) ?? [];
  const layers: SoundLayer[] = rawLayers
    .map((l) => l as Record<string, unknown>)
    .filter((l) => LAYER_ENUM.includes(l.kind as SoundLayerKind))
    .map((l) => ({
      kind: l.kind as SoundLayerKind,
      gain: clamp(Number(l.gain ?? 0.5), 0, 1),
      freq: l.freq != null ? clamp(Number(l.freq), 30, 4000) : undefined,
    }));

  const droneRaw = (i.soundscape as Record<string, unknown>)?.droneHz;
  const palette = (i.palette as string[]) ?? [];

  return {
    place: String(i.place ?? "Quelque part"),
    year: Math.round(Number(i.year ?? 1900)),
    title: String(i.title ?? ""),
    imagePrompt: String(i.imagePrompt ?? ""),
    soundscape: {
      layers: layers.length >= 2 ? layers : [{ kind: "room", gain: 0.5 }, { kind: "wind", gain: 0.3 }],
      droneHz: droneRaw != null ? clamp(Number(droneRaw), 40, 320) : undefined,
    },
    noticing: String(i.noticing ?? ""),
    context: String(i.context ?? ""),
    palette: [
      hexOr(palette[0], "#1a1a20"),
      hexOr(palette[1], "#3a3340"),
      hexOr(palette[2], "#c8a25a"),
    ],
  };
}

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

function hexOr(v: unknown, fallback: string): string {
  const s = typeof v === "string" ? v.trim() : "";
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s : fallback;
}
