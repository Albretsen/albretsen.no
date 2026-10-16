"""Round 3 briefs, weighted toward what Asgeir loves aesthetically.

Same method as the earlier generators (deal every option before reusing any,
then hill-climb to minimise shared dimensions), but the pools are drawn from
his taste: LA, Miami, Marbella, sunsets and sunrises, dramatic Norwegian
nature, Norwegian small-town life, Paris, California, sunshine, South of
France architecture and Wes Anderson. Each brief mixes two of those worlds
so no two directions land on the same postcard.

The ten open briefs of round 3 come from design-briefs-v2.py.

Usage: python3 scripts/design-briefs-v3.py [count] [first-id] > briefs.json
"""
import itertools, json, random, secrets, sys

N = int(sys.argv[1]) if len(sys.argv) > 1 else 20
FIRST = int(sys.argv[2]) if len(sys.argv) > 2 else 61
rng = random.Random(secrets.randbits(64))

WORLDS = [
  "Los Angeles: palm silhouettes, hazy pastel dusk, mid-century modern, long boulevards of light",
  "Miami: Art Deco pastels, sun-bleached facades, flamingo pink and mint, crisp white light",
  "Marbella: whitewashed walls, bougainvillea, terraces over the sea, relaxed luxury",
  "sunsets and sunrises: the slow gradient of a sky turning, sun on the horizon, long warm shadows",
  "dramatic nature: sheer cliffs, mountains, Norwegian fjords and peaks, scale and silence",
  "Norwegian small-town life: wooden houses, falu red and ochre, a quiet harbourless main street, a bakery at 7am, snow or late summer",
  "Paris: zinc rooftops, Haussmann facades, café terraces, golden stone, effortless elegance",
  "California: coastal highway light, golden hills, ranch modernism, surf-town calm",
  "sunshine: bright, warm, optimistic daylight that makes everything glow",
  "South of France architecture: stone villages, terracotta roofs, shutters, arches, lavender and olive",
  "Wes Anderson: rigorous symmetry, pastel palettes, centred framing, miniature-set precision, deadpan charm",
]

DIMS = {
  "world": WORLDS,
  "light": [
    "golden hour, low and warm", "sunrise over a fjord, cold blue turning gold", "Mediterranean noon, hard white light and deep shadows",
    "LA haze at dusk, peach and mauve", "Miami morning, pastel and clean", "blue hour, the minutes after sunset",
    "soft Nordic overcast, silver and calm", "late-summer evening that never quite gets dark", "low winter sun across snow",
    "afterglow, the sky still burning after the sun has gone",
  ],
  "art_direction": [
    "film photography, graded like Kodak Portra or Ektar",
    "architectural photography: stucco, arches, shutters, symmetry",
    "sweeping landscape and aerial photography",
    "symmetrical pastel set design, built in 3D like a miniature",
    "vintage travel-poster illustration, reinterpreted",
    "gouache and watercolour painting",
    "layered paper-cut landscapes with real depth",
    "a sunlit 3D room where light moves through the day",
    "false-colour and infrared photo grading",
    "postcards, stamps, tickets and travel ephemera",
    "hand-painted signage and ceramic tile",
    "matte-painting composites of real photographs",
  ],
  "hero_concept": [
    "a full-bleed landscape with the name set into the scene",
    "a window looking out, where the light passes through a whole day",
    "a postcard you can flip over",
    "a sun you can drag up and down the sky",
    "a perfectly symmetrical facade, products behind the windows",
    "one horizon that scrolls from sunrise to sunset",
    "a view through an arch or open shutters",
    "a slow descent over cliffs into a small town",
    "a hotel reception desk, precise and pastel, with keys for each product",
    "a terrace table in the sun with the products laid out on it",
    "a coastal drive where the timeline is the road",
    "a single beautiful photograph with one surprising interactive detail",
    "a travel-magazine opening spread",
    "a miniature diorama you can turn",
  ],
  "palette": [
    "Riviera: ochre, terracotta, sea blue, lavender",
    "Miami deco: flamingo pink, mint, sky blue, white",
    "LA dusk: peach, mauve, smog blue, palm black",
    "fjord: granite, glacier blue, snow, moss",
    "Paris: zinc grey, cream, café red, brass",
    "Anderson pastel: pink, mustard, powder blue, burgundy",
    "sunrise: peach, gold, pale blue",
    "small-town Norway: white clapboard, falu red, ochre, slate",
    "California: sand, poppy orange, sage, sky",
    "golden hour: one warm amber family from cream to burnt umber",
  ],
  "typography": [
    "an elegant high-contrast serif with a clean grotesk",
    "hotel and signage lettering, spaced capitals",
    "Art Deco display with a quiet text face",
    "a Parisian didone with italic accents",
    "a Californian rounded sans, sunny and soft",
    "Scandinavian geometric sans, light weights",
    "a classic book serif, generous and literary",
    "a condensed poster face with a humanist sans",
  ],
  "motion": [
    "the sun moves, everything else is still",
    "slow cinematic parallax through layers",
    "a day passing as you scroll",
    "gentle drifting, like heat haze or sea breeze",
    "precise, symmetrical, deadpan transitions",
    "cross-dissolves between photographs",
    "a single camera move, slow and unbroken",
  ],
  "personality": [
    "quiet confidence", "warm and human", "luxury restraint", "optimistic builder", "nordic understatement",
    "serene and spacious", "playful precision", "cinematic ambition", "effortless elegance", "sun-drunk optimism",
  ],
  "delight": [
    "the sky matches the real time of day in Norway",
    "drag the sun", "a postcard flip", "a tasteful custom cursor", "opt-in ambient sound (wind, sea, a town square)",
    "rich hover states that reveal hidden detail", "a hidden easter egg", "a theme switch from day to night",
  ],
}

SOURCES = [
  "freely licensed photography (Unsplash licence, Wikimedia Commons CC0/PD)",
  "Poly Haven HDRIs and photographed landscapes (CC0)",
  "public-domain paintings from open-access museums (e.g. Impressionist coasts and towns at The Met, NGA, Nasjonalmuseet where CC0)",
  "public-domain vintage travel posters (Library of Congress, Wikimedia PD)",
  "3D scenes built in three.js from primitives, rendered to stills and kept live",
  "procedural generation in code (skies, gradients, grain, paper, tiles)",
  "hand-authored SVG illustration",
  "NASA Earth imagery (public domain)",
]

INSPIRATION = [
  "https://www.aesop.com", "https://www.soho-house.com", "https://www.chateaumarmont.com", "https://www.thebalazs.com",
  "https://www.design-hotels.com", "https://www.kinfolk.com", "https://www.cerealmag.com", "https://www.apartamentomagazine.com",
  "https://www.snohetta.com", "https://www.visitnorway.com", "https://www.juvet.com", "https://www.airbnb.com/luxury",
  "https://www.slimaarons.com", "https://accidentallywesanderson.com", "https://www.instagram.com/accidentallywesanderson",
  "https://www.loewe.com", "https://www.jacquemus.com", "https://www.sezane.com", "https://www.hoteldelavillevenice.com",
  "https://www.godly.website", "https://www.siteinspire.com", "https://www.awwwards.com/websites/sites_of_the_day/",
  "https://www.cosmos.so", "https://www.are.na/explore", "https://unsplash.com/t/travel", "https://polyhaven.com/hdris/outdoor",
  "https://www.metmuseum.org/art/collection", "https://www.loc.gov/pictures/collection/travel/", "https://www.nasjonalmuseet.no/en/collection/",
  "https://www.apple.com/macbook-air/", "https://linear.app", "https://www.teenage.engineering/products",
  "https://stripe.com/sessions", "https://www.cursor.com", "https://www.raycast.com", "https://www.rauno.me",
]
INSPIRATION.remove("https://www.teenage.engineering/products")  # keep the no-industrial rule easy to follow

KEYS = list(DIMS)

def deal(values, n):
    out = []
    while len(out) < n:
        block = values[:]; rng.shuffle(block); out += block
    return out[:n]

cols = {k: deal(DIMS[k], N) for k in KEYS}
second_world = deal(WORLDS, N)

def overlap(i, j):
    return sum(cols[k][i] == cols[k][j] for k in KEYS)

def cost():
    pairs = [overlap(i, j) for i, j in itertools.combinations(range(N), 2)]
    return max(pairs), sum(p * p for p in pairs)

best = cost()
for _ in range(30000):
    k = rng.choice(KEYS); i, j = rng.sample(range(N), 2)
    cols[k][i], cols[k][j] = cols[k][j], cols[k][i]
    c = cost()
    if c <= best: best = c
    else: cols[k][i], cols[k][j] = cols[k][j], cols[k][i]

# Second world: different from the first, and no world pair repeated across briefs.
used = set()
for i in range(N):
    options = [w for w in WORLDS if w != cols["world"][i] and frozenset((w, cols["world"][i])) not in used]
    second_world[i] = rng.choice(options)
    used.add(frozenset((second_world[i], cols["world"][i])))

insp, used_pairs = [], set()
for _ in range(N):
    for _attempt in range(500):
        pick = rng.sample(INSPIRATION, 4)
        pairs = {frozenset(p) for p in itertools.combinations(pick, 2)}
        if not pairs & used_pairs: used_pairs |= pairs; break
    insp.append(pick)

briefs = []
for i in range(N):
    b = {"id": f"{FIRST + i:02d}", "kind": "taste"}
    b.update({k: cols[k][i] for k in KEYS})
    b["worlds"] = [cols["world"][i], second_world[i]]
    del b["world"]
    b["sources"] = rng.sample(SOURCES, 2)
    b["inspiration"] = insp[i]
    b["salt"] = secrets.token_hex(3)
    briefs.append(b)

print(json.dumps(briefs, ensure_ascii=False))
print(f"max shared dimensions between any two briefs: {best[0]} of {len(KEYS)}", file=sys.stderr)
