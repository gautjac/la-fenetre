// La Fenêtre — the still painter. One generated frame per window via Fal
// (flux/schnell), letterboxed and grainy on the client. We return the hosted
// URL; the client loads it directly. The Fal call pattern is copied verbatim
// from le-cadre / planche (Authorization: Key <FAL_API_KEY>, fal.run sync).

export type FalImageSize =
  | "landscape_16_9"
  | "landscape_4_3"
  | "square_hd"
  | "portrait_4_3";

/**
 * Generate a single cinematic still for a window and return its hosted URL.
 * `scenePrompt` is the scene description (English, internal); we wrap it in a
 * consistent film-still grammar so every frame reads like one projection.
 */
export async function paintWindow(
  scenePrompt: string,
  imageSize: FalImageSize = "landscape_16_9",
): Promise<string> {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) throw new Error("Server missing FAL_API_KEY");

  const prompt = `cinematic film still, ${scenePrompt}. Atmospheric, immersive, photographed on 35mm film, naturalistic period-accurate lighting, fine film grain, soft shadows, muted filmic color grade, shallow depth of field, a sense of quiet presence, no people posing for camera, no text, no watermark, no border, no caption.`;

  const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: imageSize,
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: true,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Fal error ${res.status}: ${t.slice(0, 240)}`);
  }

  const data = (await res.json()) as { images?: { url: string }[] };
  const url = data.images?.[0]?.url;
  if (!url) throw new Error("Fal returned no image");
  return url;
}
