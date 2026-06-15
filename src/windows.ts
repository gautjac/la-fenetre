// La Fenêtre — the window model + the curated seed list.
// These ~20 hand-written windows make the app rich before any AI call.
// The shape mirrors netlify/functions/lib/window.ts exactly.

export type Lang = "fr" | "en";

/**
 * Text that may be bilingual. The curated seed atlas stores both languages as
 * `{ fr, en }`; AI-composed windows arrive already in the requested language as
 * a plain `string`. `resolveText` collapses either shape to the active language.
 */
export type LocalizedText = string | { fr: string; en: string };

export function resolveText(value: LocalizedText, lang: Lang): string {
  if (typeof value === "string") return value;
  return value[lang] ?? value.fr ?? value.en ?? "";
}

export type SoundLayerKind =
  | "murmur"
  | "rain"
  | "wind"
  | "fire"
  | "water"
  | "waves"
  | "room"
  | "drone"
  | "bells"
  | "birds"
  | "market"
  | "night"
  | "clock";

export interface SoundLayer {
  kind: SoundLayerKind;
  gain: number;
  freq?: number;
}

export interface Soundscape {
  layers: SoundLayer[];
  droneHz?: number;
}

export interface WindowSpec {
  place: string;
  year: number;
  title: string;
  imagePrompt: string;
  soundscape: Soundscape;
  noticing: LocalizedText;
  context: LocalizedText;
  palette: [string, string, string];
}

/** Format the year as a slate label, localized: 1923, AN 1000 / YEAR 1000, 410 AV. J.-C. / 410 BCE */
export function yearLabel(year: number, lang: Lang = "fr"): string {
  if (year < 0) return lang === "en" ? `${Math.abs(year)} BCE` : `${Math.abs(year)} AV. J.-C.`;
  if (year < 1000) return lang === "en" ? `YEAR ${year}` : `AN ${year}`;
  return String(year);
}

/** A stable id for a window (place + year), for Dexie de-duplication. */
export function windowId(w: { place: string; year: number }): string {
  return `${w.place.toLowerCase().replace(/\s+/g, "-")}-${w.year}`;
}

// ---------------------------------------------------------------------------
// The seed atlas — twenty evocative windows, hand-tuned.
// ---------------------------------------------------------------------------

export const SEED_WINDOWS: WindowSpec[] = [
  {
    place: "Lisbonne",
    year: 1923,
    title: "un café l'après-midi",
    imagePrompt:
      "interior of an old Lisbon café in 1923, marble-topped tables, brass and dark wood, tall windows letting in soft afternoon Atlantic light, a half-finished glass of red wine, cigarette smoke hanging, azulejo tiles, worn mosaic floor, empty chairs, late autumn",
    soundscape: {
      layers: [
        { kind: "murmur", gain: 0.5, freq: 360 },
        { kind: "room", gain: 0.35, freq: 120 },
        { kind: "clock", gain: 0.18 },
      ],
      droneHz: 98,
    },
    noticing: {
      fr: "Remarque la fumée de cigarette qui monte droit, puis hésite dans un courant d'air que tu ne sens pas.",
      en: "Notice the cigarette smoke rising straight up, then wavering in a draught you can't feel.",
    },
    context: {
      fr: "En 1923, Lisbonne vivait de ses cafés littéraires, où poètes et employés de bureau refaisaient le monde devant un verre de vinho tinto.",
      en: "In 1923, Lisbon lived through its literary cafés, where poets and office clerks remade the world over a glass of vinho tinto.",
    },
    palette: ["#1c1610", "#5a3d28", "#c8954a"],
  },
  {
    place: "Kyoto",
    year: 1000,
    title: "un jardin Heian",
    imagePrompt:
      "a Heian-era garden in Kyoto around the year 1000, a still pond, raked white gravel, moss, a single maple turning red, wooden veranda of an aristocrat's residence, paper screens, low mist, grey overcast dawn light, no people",
    soundscape: {
      layers: [
        { kind: "water", gain: 0.32, freq: 520 },
        { kind: "birds", gain: 0.28, freq: 2200 },
        { kind: "wind", gain: 0.25, freq: 220 },
      ],
      droneHz: 110,
    },
    noticing: {
      fr: "Écoute l'eau : une seule goutte tombe d'une feuille dans l'étang, et le silence revient plus profond.",
      en: "Listen to the water: a single drop falls from a leaf into the pond, and the silence returns deeper.",
    },
    context: {
      fr: "Vers l'an 1000, la cour Heian de Kyoto raffinait la poésie et la contemplation des saisons ; Murasaki Shikibu y écrivait « Le Dit du Genji ».",
      en: "Around the year 1000, Kyoto's Heian court refined poetry and the contemplation of the seasons; Murasaki Shikibu was writing 'The Tale of Genji' there.",
    },
    palette: ["#1a1f1a", "#3c4a3a", "#9aa886"],
  },
  {
    place: "Montréal",
    year: 1947,
    title: "rue Sainte-Catherine, le soir",
    imagePrompt:
      "Rue Sainte-Catherine in Montreal in 1947 at night, wet pavement reflecting neon and incandescent marquee lights, a streetcar passing, men in fedoras and overcoats, snow beginning, steam from a grate, brick department stores, warm shop windows, film noir mood",
    soundscape: {
      layers: [
        { kind: "murmur", gain: 0.32, freq: 300 },
        { kind: "room", gain: 0.3, freq: 90 },
        { kind: "clock", gain: 0.14 },
      ],
      droneHz: 73,
    },
    noticing: {
      fr: "Regarde la chaussée mouillée : les néons s'y dédoublent, et chaque pas d'un passant brouille un reflet.",
      en: "Watch the wet pavement: the neon signs double in it, and every passer-by's step blurs a reflection.",
    },
    context: {
      fr: "En 1947, la rue Sainte-Catherine était l'artère commerciale du Montréal d'après-guerre, ses tramways et ses grands magasins illuminés jusqu'à tard.",
      en: "In 1947, Rue Sainte-Catherine was the commercial spine of post-war Montréal, its streetcars and department stores lit up late into the night.",
    },
    palette: ["#0e1014", "#2a3340", "#d98a3a"],
  },
  {
    place: "Venise",
    year: 1730,
    title: "l'aube sur le canal",
    imagePrompt:
      "a narrow Venetian canal at dawn in 1730, still green water, a moored gondola, peeling ochre and rose plaster, laundry lines, a small bridge, fog lifting, the first warm sun on upper windows, no crowds, baroque calm",
    soundscape: {
      layers: [
        { kind: "water", gain: 0.4, freq: 280 },
        { kind: "waves", gain: 0.22, freq: 90 },
        { kind: "bells", gain: 0.2 },
      ],
      droneHz: 87,
    },
    noticing: {
      fr: "Attends la cloche : quelque part, une église sonne l'heure, et l'eau du canal en garde un léger tremblement.",
      en: "Wait for the bell: somewhere a church strikes the hour, and the canal water holds a faint tremor of it.",
    },
    context: {
      fr: "Venise en 1730 était au sommet de son carnaval et de sa musique ; Vivaldi y dirigeait encore l'orchestre de la Pietà.",
      en: "Venice in 1730 was at the height of its carnival and its music; Vivaldi still directed the orchestra of the Pietà there.",
    },
    palette: ["#16191c", "#3b4a4a", "#c9a05a"],
  },
  {
    place: "Marrakech",
    year: 1962,
    title: "le souk à midi",
    imagePrompt:
      "a covered souk in Marrakech at noon in 1962, shafts of dusty light falling through slatted reed roofing onto stalls of spices, copperware, dyed wool, narrow passage, a man pouring mint tea, warm ochre and saffron tones, busy but timeless",
    soundscape: {
      layers: [
        { kind: "market", gain: 0.5, freq: 480 },
        { kind: "room", gain: 0.28, freq: 130 },
        { kind: "bells", gain: 0.14 },
      ],
      droneHz: 116,
    },
    noticing: {
      fr: "Suis un rai de lumière poussiéreuse qui descend du toit de roseaux jusqu'à un tas de safran.",
      en: "Follow a shaft of dusty light as it falls from the reed roof onto a heap of saffron.",
    },
    context: {
      fr: "Au début des années 1960, le Maroc venait d'accéder à l'indépendance, et les souks de Marrakech bourdonnaient du commerce des épices et de la laine.",
      en: "In the early 1960s, Morocco had just gained independence, and the souks of Marrakech hummed with the trade in spices and wool.",
    },
    palette: ["#1d160e", "#6b4420", "#e0a93a"],
  },
  {
    place: "Saint-Pétersbourg",
    year: 1899,
    title: "la neige tombe lentement",
    imagePrompt:
      "a grand snowy boulevard in Saint Petersburg in 1899 at dusk, gas lamps glowing amber, a horse-drawn sleigh, falling snow, pastel imperial facades, frosted breath, deep blue twilight, quiet, no crowds",
    soundscape: {
      layers: [
        { kind: "wind", gain: 0.4, freq: 180 },
        { kind: "room", gain: 0.26, freq: 80 },
        { kind: "clock", gain: 0.12 },
      ],
      droneHz: 65,
    },
    noticing: {
      fr: "Regarde un flocon précis se détacher du ciel sombre et descendre, sans jamais se presser, jusqu'au halo d'un réverbère.",
      en: "Watch one particular snowflake detach from the dark sky and drift down, never hurrying, into the halo of a street lamp.",
    },
    context: {
      fr: "En 1899, Saint-Pétersbourg, capitale impériale, vivait ses derniers hivers fastueux avant le siècle des révolutions.",
      en: "In 1899, Saint Petersburg, the imperial capital, was living its last lavish winters before the century of revolutions.",
    },
    palette: ["#0d1016", "#2b3550", "#cdb87a"],
  },
  {
    place: "Kyoto",
    year: 1955,
    title: "la pluie sur les tuiles",
    imagePrompt:
      "a quiet Kyoto back street in 1955 during steady rain, wet grey roof tiles, wooden machiya townhouses, a paper umbrella leaning by a door, puddles, lantern light coming on, soft early evening, no one in sight",
    soundscape: {
      layers: [
        { kind: "rain", gain: 0.55, freq: 1400 },
        { kind: "water", gain: 0.3, freq: 360 },
        { kind: "room", gain: 0.22, freq: 100 },
      ],
      droneHz: 92,
    },
    noticing: {
      fr: "Distingue les deux pluies : celle, fine, qui frappe les tuiles, et celle, plus grave, qui tombe en gouttes lourdes du bord du toit.",
      en: "Tell the two rains apart: the fine one tapping the tiles, and the deeper one falling in heavy drops from the roof's edge.",
    },
    context: {
      fr: "Dans le Kyoto d'après-guerre, les ruelles de maisons de bois (machiya) gardaient un calme que la modernisation n'avait pas encore atteint.",
      en: "In post-war Kyoto, the back streets of wooden machiya townhouses kept a calm that modernization had not yet reached.",
    },
    palette: ["#14161a", "#33424a", "#a7b0a0"],
  },
  {
    place: "Paris",
    year: 1925,
    title: "un toit, au petit matin",
    imagePrompt:
      "a view across Paris rooftops at dawn in 1925, zinc roofs and chimney pots in soft grey-blue, a sea of mansards, the first sun catching distant domes, pigeons, a thin morning haze, an open garret window, calm",
    soundscape: {
      layers: [
        { kind: "birds", gain: 0.3, freq: 1800 },
        { kind: "wind", gain: 0.26, freq: 240 },
        { kind: "bells", gain: 0.22 },
      ],
      droneHz: 98,
    },
    noticing: {
      fr: "Cherche le premier rayon de soleil : il touche un dôme lointain bien avant d'atteindre les toits de zinc devant toi.",
      en: "Look for the first ray of sun: it touches a distant dome long before it reaches the zinc rooftops in front of you.",
    },
    context: {
      fr: "Le Paris de 1925, en pleines Années folles, s'éveillait sous une mer de toits de zinc, entre ateliers d'artistes et cafés qui ne dormaient jamais.",
      en: "The Paris of 1925, deep in the Roaring Twenties, woke beneath a sea of zinc rooftops, among artists' studios and cafés that never slept.",
    },
    palette: ["#161820", "#3a4356", "#d6b36a"],
  },
  {
    place: "Hanoï",
    year: 1936,
    title: "l'heure du thé à la véranda",
    imagePrompt:
      "a colonial-era veranda in Hanoi in 1936, late afternoon, lazy ceiling fan, rattan chairs, a pot of green tea, lush courtyard with frangipani, warm humid golden light, shutters half closed, slow tropical calm",
    soundscape: {
      layers: [
        { kind: "birds", gain: 0.32, freq: 2400 },
        { kind: "room", gain: 0.3, freq: 110 },
        { kind: "water", gain: 0.18, freq: 600 },
      ],
      droneHz: 104,
    },
    noticing: {
      fr: "Sens la chaleur épaisse de l'air : même le ventilateur au plafond semble tourner plus lentement qu'ailleurs.",
      en: "Feel the thick heat of the air: even the ceiling fan seems to turn more slowly than it would anywhere else.",
    },
    context: {
      fr: "Dans le Hanoï des années 1930, sous l'Indochine française, les villas à véranda mêlaient l'architecture coloniale aux jardins tropicaux.",
      en: "In the Hanoi of the 1930s, under French Indochina, veranda villas blended colonial architecture with tropical gardens.",
    },
    palette: ["#1a1810", "#5a4d28", "#d8b04a"],
  },
  {
    place: "Reykjavik",
    year: 1972,
    title: "le vent du nord",
    imagePrompt:
      "the edge of Reykjavik in 1972 on a grey windy day, low colourful corrugated-iron houses, black volcanic earth, the cold North Atlantic beyond, scudding clouds, flat silver light, a single gull, raw and open",
    soundscape: {
      layers: [
        { kind: "wind", gain: 0.6, freq: 160 },
        { kind: "waves", gain: 0.35, freq: 80 },
        { kind: "birds", gain: 0.16, freq: 2600 },
      ],
      droneHz: 55,
    },
    noticing: {
      fr: "Laisse le vent te porter un instant : il arrive en longues vagues, monte, retombe, puis revient un peu plus fort.",
      en: "Let the wind carry you a moment: it arrives in long waves, rises, falls away, then returns a little stronger.",
    },
    context: {
      fr: "En 1972, la petite Reykjavik fut au centre du monde le temps du duel d'échecs Fischer-Spassky, en pleine guerre froide.",
      en: "In 1972, little Reykjavik became the centre of the world for the Fischer–Spassky chess duel, at the height of the Cold War.",
    },
    palette: ["#11151a", "#2e3b44", "#b6bcc0"],
  },
  {
    place: "Le Caire",
    year: 1910,
    title: "la terrasse au crépuscule",
    imagePrompt:
      "a rooftop terrace in Cairo in 1910 at dusk, the Nile and minarets in the distance, warm dust haze, low cushioned seating, a brass lantern just lit, the call to prayer carrying across the city, palm silhouettes, deep amber and violet sky",
    soundscape: {
      layers: [
        { kind: "murmur", gain: 0.26, freq: 320 },
        { kind: "wind", gain: 0.24, freq: 200 },
        { kind: "bells", gain: 0.2 },
      ],
      droneHz: 82,
    },
    noticing: {
      fr: "Au loin, l'appel à la prière s'élève d'un minaret, puis un autre lui répond, légèrement décalé.",
      en: "Far off, the call to prayer rises from one minaret, then another answers it, slightly out of step.",
    },
    context: {
      fr: "Le Caire de 1910, sous administration britannique, était une capitale cosmopolite où l'on prenait le frais sur les terrasses au coucher du soleil.",
      en: "The Cairo of 1910, under British administration, was a cosmopolitan capital where people took the cool air on the rooftops at sunset.",
    },
    palette: ["#181208", "#5e3f1e", "#e09a3a"],
  },
  {
    place: "Vienne",
    year: 1901,
    title: "un café littéraire",
    imagePrompt:
      "a grand Viennese coffee house in 1901, marble tables, bentwood Thonet chairs, newspapers on wooden rods, crystal chandeliers, a waiter in a tailcoat, a slice of torte and a small coffee, warm lamplight, winter outside the tall windows",
    soundscape: {
      layers: [
        { kind: "murmur", gain: 0.46, freq: 380 },
        { kind: "room", gain: 0.32, freq: 110 },
        { kind: "clock", gain: 0.16 },
      ],
      droneHz: 110,
    },
    noticing: {
      fr: "Écoute le froissement régulier d'un journal qu'on tourne, page après page, à la table d'à côté.",
      en: "Listen to the steady rustle of a newspaper being turned, page after page, at the next table.",
    },
    context: {
      fr: "Vers 1901, les cafés viennois étaient le salon de toute une intelligentsia ; on y restait des heures pour le prix d'un seul café.",
      en: "Around 1901, Viennese coffee houses were the salon of an entire intelligentsia; one could linger for hours on the price of a single coffee.",
    },
    palette: ["#191510", "#4a382a", "#caa05a"],
  },
  {
    place: "Bahia",
    year: 1958,
    title: "la mer, à l'ombre",
    imagePrompt:
      "a fishing beach in Bahia, Brazil in 1958, wooden jangada rafts pulled up on warm sand, palm shade, turquoise sea, drying nets, a hammock between two trunks, bright midday light softened by leaves, lazy heat",
    soundscape: {
      layers: [
        { kind: "waves", gain: 0.5, freq: 90 },
        { kind: "birds", gain: 0.24, freq: 2200 },
        { kind: "wind", gain: 0.2, freq: 240 },
      ],
      droneHz: 73,
    },
    noticing: {
      fr: "Compte le rythme des vagues : trois petites, puis une plus longue qui s'étire sur le sable avant de se retirer.",
      en: "Count the rhythm of the waves: three small ones, then a longer one that stretches up the sand before drawing back.",
    },
    context: {
      fr: "À la fin des années 1950, les plages de Bahia vivaient encore au rythme des jangadas, ces radeaux de pêche menés à la voile.",
      en: "In the late 1950s, the beaches of Bahia still lived to the rhythm of the jangadas, those sailing fishing rafts.",
    },
    palette: ["#10171a", "#2a5258", "#e6c47a"],
  },
  {
    place: "Édimbourg",
    year: 1889,
    title: "le brouillard, le soir",
    imagePrompt:
      "an Edinburgh close at night in 1889, dense fog, a single gas lamp glowing, wet cobblestones, tall dark tenements, a sliver of warm window light high up, the silhouette of the castle rock beyond, gothic and quiet",
    soundscape: {
      layers: [
        { kind: "wind", gain: 0.34, freq: 170 },
        { kind: "room", gain: 0.3, freq: 85 },
        { kind: "bells", gain: 0.18 },
      ],
      droneHz: 62,
    },
    noticing: {
      fr: "Fixe le halo du réverbère : le brouillard y bouge en lents tourbillons, comme s'il respirait.",
      en: "Fix your eyes on the lamp's halo: the fog moves through it in slow eddies, as if it were breathing.",
    },
    context: {
      fr: "L'Édimbourg victorien de 1889, enfumé au charbon, inspirait directement les ruelles brumeuses des romans de Stevenson et de Conan Doyle.",
      en: "The coal-smoked Victorian Edinburgh of 1889 directly inspired the foggy closes of Stevenson's and Conan Doyle's novels.",
    },
    palette: ["#0f1114", "#2a3038", "#c9a960"],
  },
  {
    place: "Samarcande",
    year: 1405,
    title: "la place, au couchant",
    imagePrompt:
      "the great square of Samarkand in 1405 at sunset, towering turquoise-tiled madrasa portals, glazed mosaics catching the last gold light, dust raised by departing caravans, a few empty stalls, long shadows, the Silk Road at its height",
    soundscape: {
      layers: [
        { kind: "wind", gain: 0.4, freq: 190 },
        { kind: "market", gain: 0.24, freq: 460 },
        { kind: "bells", gain: 0.14 },
      ],
      droneHz: 87,
    },
    noticing: {
      fr: "Regarde les mosaïques turquoise : au couchant, elles ne reflètent plus la lumière mais semblent la garder à l'intérieur.",
      en: "Look at the turquoise mosaics: at sunset they no longer reflect the light but seem to hold it inside.",
    },
    context: {
      fr: "En 1405, Samarcande était la capitale resplendissante de Tamerlan, carrefour des caravanes de la route de la soie.",
      en: "In 1405, Samarkand was the resplendent capital of Tamerlane, a crossroads for the caravans of the Silk Road.",
    },
    palette: ["#15171c", "#2c4a5a", "#d8b052"],
  },
  {
    place: "La Havane",
    year: 1951,
    title: "le balcon, après l'averse",
    imagePrompt:
      "a Havana balcony in 1951 just after a tropical rain shower, wet wrought-iron railing, pastel peeling facades across the street steaming in the sun, a wicker chair, dripping plants, vivid afternoon light returning, puddles on the colonial street below",
    soundscape: {
      layers: [
        { kind: "water", gain: 0.34, freq: 420 },
        { kind: "murmur", gain: 0.3, freq: 340 },
        { kind: "birds", gain: 0.2, freq: 2100 },
      ],
      droneHz: 98,
    },
    noticing: {
      fr: "Vois la vapeur monter de la chaussée chaude maintenant que le soleil revient sur les pavés mouillés.",
      en: "See the steam rising from the warm street now that the sun is back on the wet cobblestones.",
    },
    context: {
      fr: "La Havane de 1951 était une ville de musique et de jeu, dans les dernières années avant la révolution cubaine.",
      en: "The Havana of 1951 was a city of music and gambling, in the last years before the Cuban Revolution.",
    },
    palette: ["#161812", "#3e4a30", "#e0b85a"],
  },
  {
    place: "Bruges",
    year: 1480,
    title: "l'atelier d'un peintre",
    imagePrompt:
      "a Flemish painter's workshop in Bruges around 1480, cool north light from a leaded window, an oak easel, ground pigments in small dishes, a half-finished panel, fur-trimmed cloak on a hook, worn floorboards, quiet Northern Renaissance interior",
    soundscape: {
      layers: [
        { kind: "room", gain: 0.4, freq: 120 },
        { kind: "fire", gain: 0.3, freq: 90 },
        { kind: "bells", gain: 0.18 },
      ],
      droneHz: 104,
    },
    noticing: {
      fr: "Observe la lumière du nord : froide et constante, elle ne projette presque pas d'ombre — c'est pour ça que le peintre l'a choisie.",
      en: "Watch the north light: cool and constant, it casts almost no shadow — which is exactly why the painter chose it.",
    },
    context: {
      fr: "Vers 1480, Bruges était l'un des centres de la peinture flamande ; ses maîtres venaient de perfectionner la peinture à l'huile.",
      en: "Around 1480, Bruges was one of the centres of Flemish painting; its masters had just perfected painting in oils.",
    },
    palette: ["#15140f", "#403424", "#c2a262"],
  },
  {
    place: "San Francisco",
    year: 1967,
    title: "la brume du matin",
    imagePrompt:
      "a San Francisco hill street in 1967 early morning, fog rolling between pastel Victorian houses, a parked cable car, dewy sidewalks, the bay barely visible below, soft diffuse silver light, quiet before the city wakes",
    soundscape: {
      layers: [
        { kind: "wind", gain: 0.3, freq: 200 },
        { kind: "waves", gain: 0.22, freq: 90 },
        { kind: "birds", gain: 0.2, freq: 2000 },
      ],
      droneHz: 73,
    },
    noticing: {
      fr: "Suis la brume qui descend la pente entre les maisons : elle avance plus vite que tu ne l'aurais cru.",
      en: "Follow the fog sliding down the hill between the houses: it moves faster than you'd have guessed.",
    },
    context: {
      fr: "En 1967, San Francisco vivait son « Summer of Love » ; ses collines victoriennes s'éveillaient chaque matin dans la brume du Pacifique.",
      en: "In 1967, San Francisco was living its 'Summer of Love'; its Victorian hills woke each morning in the fog off the Pacific.",
    },
    palette: ["#14161a", "#33414a", "#cdbcba"],
  },
  {
    place: "Jaipur",
    year: 1948,
    title: "la cour, à l'aube",
    imagePrompt:
      "a pink-stuccoed palace courtyard in Jaipur in 1948 at dawn, scalloped arches, a still reflecting pool, peacocks, soft rose and gold first light, a vendor setting up marigolds, cool morning calm before the heat",
    soundscape: {
      layers: [
        { kind: "birds", gain: 0.34, freq: 2400 },
        { kind: "water", gain: 0.26, freq: 500 },
        { kind: "room", gain: 0.22, freq: 120 },
      ],
      droneHz: 116,
    },
    noticing: {
      fr: "Écoute le cri d'un paon traverser la cour : long, rauque, puis le silence rose de l'aube reprend.",
      en: "Listen to a peacock's cry cross the courtyard: long, hoarse, then the rose-coloured silence of dawn returns.",
    },
    context: {
      fr: "En 1948, Jaipur, la « ville rose » du Rajasthan, intégrait la toute jeune Union indienne tout en gardant ses palais et ses cours d'eau.",
      en: "In 1948, Jaipur, the 'pink city' of Rajasthan, was joining the newborn Indian Union while keeping its palaces and water courts.",
    },
    palette: ["#1a1410", "#5e3a30", "#e0a060"],
  },
  {
    place: "Trondheim",
    year: 1814,
    title: "le quai, sous la lune",
    imagePrompt:
      "the wooden wharves of Trondheim, Norway in 1814 on a clear cold night, colourful warehouse buildings reflected in still black fjord water, a moored sailing ship, moonlight, frost on the planks, a single lantern, utterly quiet",
    soundscape: {
      layers: [
        { kind: "water", gain: 0.32, freq: 240 },
        { kind: "waves", gain: 0.26, freq: 70 },
        { kind: "wind", gain: 0.22, freq: 150 },
      ],
      droneHz: 58,
    },
    noticing: {
      fr: "Regarde le reflet du navire sur l'eau noire : il tremble à peine, puis s'immobilise quand le clapot se calme.",
      en: "Watch the ship's reflection on the black water: it barely trembles, then goes still as the ripple settles.",
    },
    context: {
      fr: "En 1814, la Norvège se dotait de sa première constitution ; Trondheim, vieux port de bois, vivait encore du commerce maritime du fjord.",
      en: "In 1814, Norway gave itself its first constitution; Trondheim, an old timber port, still lived on the maritime trade of the fjord.",
    },
    palette: ["#0d1014", "#23323e", "#c9ba72"],
  },
];

/** Pick the seed window for "today" deterministically, plus a shuffle helper. */
export function seedForDay(date = new Date()): WindowSpec {
  const epochDay = Math.floor(date.getTime() / 86_400_000);
  return SEED_WINDOWS[epochDay % SEED_WINDOWS.length];
}

export function randomSeed(exclude?: string): WindowSpec {
  const pool = exclude
    ? SEED_WINDOWS.filter((w) => windowId(w) !== exclude)
    : SEED_WINDOWS;
  return pool[Math.floor(Math.random() * pool.length)];
}
