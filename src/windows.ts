// La Fenêtre — the window model + the curated seed list.
// These ~20 hand-written windows make the app rich before any AI call.
// The shape mirrors netlify/functions/lib/window.ts exactly.

export type Lang = "fr" | "en";

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
  noticing: string;
  context: string;
  palette: [string, string, string];
}

/** Format the year as a slate label: 1923, an 1000, 410 av. J.-C. */
export function yearLabel(year: number): string {
  if (year < 0) return `${Math.abs(year)} AV. J.-C.`;
  if (year < 1000) return `AN ${year}`;
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
    noticing:
      "Remarque la fumée de cigarette qui monte droit, puis hésite dans un courant d'air que tu ne sens pas.",
    context:
      "En 1923, Lisbonne vivait de ses cafés littéraires, où poètes et employés de bureau refaisaient le monde devant un verre de vinho tinto.",
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
    noticing:
      "Écoute l'eau : une seule goutte tombe d'une feuille dans l'étang, et le silence revient plus profond.",
    context:
      "Vers l'an 1000, la cour Heian de Kyoto raffinait la poésie et la contemplation des saisons ; Murasaki Shikibu y écrivait « Le Dit du Genji ».",
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
    noticing:
      "Regarde la chaussée mouillée : les néons s'y dédoublent, et chaque pas d'un passant brouille un reflet.",
    context:
      "En 1947, la rue Sainte-Catherine était l'artère commerciale du Montréal d'après-guerre, ses tramways et ses grands magasins illuminés jusqu'à tard.",
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
    noticing:
      "Attends la cloche : quelque part, une église sonne l'heure, et l'eau du canal en garde un léger tremblement.",
    context:
      "Venise en 1730 était au sommet de son carnaval et de sa musique ; Vivaldi y dirigeait encore l'orchestre de la Pietà.",
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
    noticing:
      "Suis un rai de lumière poussiéreuse qui descend du toit de roseaux jusqu'à un tas de safran.",
    context:
      "Au début des années 1960, le Maroc venait d'accéder à l'indépendance, et les souks de Marrakech bourdonnaient du commerce des épices et de la laine.",
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
    noticing:
      "Regarde un flocon précis se détacher du ciel sombre et descendre, sans jamais se presser, jusqu'au halo d'un réverbère.",
    context:
      "En 1899, Saint-Pétersbourg, capitale impériale, vivait ses derniers hivers fastueux avant le siècle des révolutions.",
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
    noticing:
      "Distingue les deux pluies : celle, fine, qui frappe les tuiles, et celle, plus grave, qui tombe en gouttes lourdes du bord du toit.",
    context:
      "Dans le Kyoto d'après-guerre, les ruelles de maisons de bois (machiya) gardaient un calme que la modernisation n'avait pas encore atteint.",
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
    noticing:
      "Cherche le premier rayon de soleil : il touche un dôme lointain bien avant d'atteindre les toits de zinc devant toi.",
    context:
      "Le Paris de 1925, en pleines Années folles, s'éveillait sous une mer de toits de zinc, entre ateliers d'artistes et cafés qui ne dormaient jamais.",
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
    noticing:
      "Sens la chaleur épaisse de l'air : même le ventilateur au plafond semble tourner plus lentement qu'ailleurs.",
    context:
      "Dans le Hanoï des années 1930, sous l'Indochine française, les villas à véranda mêlaient l'architecture coloniale aux jardins tropicaux.",
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
    noticing:
      "Laisse le vent te porter un instant : il arrive en longues vagues, monte, retombe, puis revient un peu plus fort.",
    context:
      "En 1972, la petite Reykjavik fut au centre du monde le temps du duel d'échecs Fischer-Spassky, en pleine guerre froide.",
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
    noticing:
      "Au loin, l'appel à la prière s'élève d'un minaret, puis un autre lui répond, légèrement décalé.",
    context:
      "Le Caire de 1910, sous administration britannique, était une capitale cosmopolite où l'on prenait le frais sur les terrasses au coucher du soleil.",
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
    noticing:
      "Écoute le froissement régulier d'un journal qu'on tourne, page après page, à la table d'à côté.",
    context:
      "Vers 1901, les cafés viennois étaient le salon de toute une intelligentsia ; on y restait des heures pour le prix d'un seul café.",
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
    noticing:
      "Compte le rythme des vagues : trois petites, puis une plus longue qui s'étire sur le sable avant de se retirer.",
    context:
      "À la fin des années 1950, les plages de Bahia vivaient encore au rythme des jangadas, ces radeaux de pêche menés à la voile.",
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
    noticing:
      "Fixe le halo du réverbère : le brouillard y bouge en lents tourbillons, comme s'il respirait.",
    context:
      "L'Édimbourg victorien de 1889, enfumé au charbon, inspirait directement les ruelles brumeuses des romans de Stevenson et de Conan Doyle.",
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
    noticing:
      "Regarde les mosaïques turquoise : au couchant, elles ne reflètent plus la lumière mais semblent la garder à l'intérieur.",
    context:
      "En 1405, Samarcande était la capitale resplendissante de Tamerlan, carrefour des caravanes de la route de la soie.",
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
    noticing:
      "Vois la vapeur monter de la chaussée chaude maintenant que le soleil revient sur les pavés mouillés.",
    context:
      "La Havane de 1951 était une ville de musique et de jeu, dans les dernières années avant la révolution cubaine.",
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
    noticing:
      "Observe la lumière du nord : froide et constante, elle ne projette presque pas d'ombre — c'est pour ça que le peintre l'a choisie.",
    context:
      "Vers 1480, Bruges était l'un des centres de la peinture flamande ; ses maîtres venaient de perfectionner la peinture à l'huile.",
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
    noticing:
      "Suis la brume qui descend la pente entre les maisons : elle avance plus vite que tu ne l'aurais cru.",
    context:
      "En 1967, San Francisco vivait son « Summer of Love » ; ses collines victoriennes s'éveillaient chaque matin dans la brume du Pacifique.",
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
    noticing:
      "Écoute le cri d'un paon traverser la cour : long, rauque, puis le silence rose de l'aube reprend.",
    context:
      "En 1948, Jaipur, la « ville rose » du Rajasthan, intégrait la toute jeune Union indienne tout en gardant ses palais et ses cours d'eau.",
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
    noticing:
      "Regarde le reflet du navire sur l'eau noire : il tremble à peine, puis s'immobilise quand le clapot se calme.",
    context:
      "En 1814, la Norvège se dotait de sa première constitution ; Trondheim, vieux port de bois, vivait encore du commerce maritime du fjord.",
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
