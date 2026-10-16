"""Round 2 briefs: asset-led brand directions with far more freedom in the hero.

Same method as design-briefs.py: deal every option before reusing any, then
hill-climb so no two briefs share more than a minimum of dimensions. Each
brief drives two agents: an art director who makes the assets, and a
builder who makes the site from them.

Usage: python3 scripts/design-briefs-v2.py [count] [first-id] > briefs.json
"""
import itertools, json, random, secrets, sys

N = int(sys.argv[1]) if len(sys.argv) > 1 else 30
FIRST = int(sys.argv[2]) if len(sys.argv) > 2 else 31
rng = random.Random(secrets.randbits(64))

DIMS = {
  "hero_concept": [
    "an interactive 3D object you can grab, spin and throw",
    "a desktop operating system you can click around in",
    "an infinite canvas you pan and zoom, products laid out as places",
    "a small playable game that is also the introduction",
    "a full-bleed photograph with the type set into the scene",
    "a scroll-driven story told in chapters",
    "a deck of cards that deals itself out",
    "a physics playground: logos and letters fall and can be flung",
    "a magazine cover you can open",
    "a cinematic intro sequence that resolves into the page",
    "a 3D room or diorama with the products as objects in it",
    "a shader landscape that reacts to the cursor",
    "a shelf of product icons like a beautifully art-directed app store",
    "a giant interactive globe of activity",
    "a gallery wall of framed works, lit like a museum",
    "a conversation: the site talks to you",
    "a boot sequence that becomes the homepage",
    "a river of time from 2016 to today",
    "a moodboard collage you can rearrange",
    "one beautiful 3D render and almost nothing else",
    "a sticker sheet you can peel stickers off",
    "a character-select screen where the products are the characters",
    "a star chart: products as constellations",
    "a split screen: the 17-year-old's first app versus today",
    "a product-drop launch page for a company, not a product",
    "a living terrarium / ecosystem where each product is a creature",
    "a camera you look through: a viewfinder, focus and exposure",
    "a stack of glass panes with depth and refraction",
    "a giant interactive wordmark built from many small parts",
    "a newspaper front page from the future",
  ],
  "art_direction": [
    "glossy 3D renders made in code (soft plastic, studio lighting)",
    "isometric illustration",
    "editorial photography, art-directed and graded",
    "public-domain space imagery (NASA, ESA)",
    "public-domain botanical and natural-history illustration",
    "pixel art sprites and tiles",
    "hand-drawn line illustration in SVG",
    "generative abstract art",
    "glass and refraction with real depth",
    "paper cut-out collage",
    "neo-brutalist stickers, badges and labels",
    "retro-futurist airbrush gradients",
    "low-poly 3D",
    "voxel art",
    "soft clay characters and mascots",
    "duotone halftone photography",
    "dithered and ASCII renderings of real images",
    "liquid chrome and iridescent 3D",
    "a bespoke icon system as the main imagery",
    "grainy gradient illustration",
    "data-as-art: charts and diagrams drawn beautifully",
    "warm, storybook-style illustration",
    "cel-shaded, animation-studio style",
    "museum-archive scans (public-domain paintings, prints, maps)",
  ],
  "sources": [
    "generate procedurally with code (Python, Node, canvas or shaders)",
    "hand-author SVG",
    "CC0 3D models (Poly Haven, Kenney, Quaternius)",
    "freely licensed photography (Unsplash licence, Wikimedia Commons CC0/PD, NASA)",
    "open-access museum collections (The Met, Smithsonian, Rijksmuseum, NGA)",
    "public-domain illustration archives (Biodiversity Heritage Library, Old Book Illustrations)",
    "CC0 textures and HDRIs (Poly Haven, ambientCG)",
    "3D built from primitives in three.js, then rendered to stills and kept live",
  ],
  "centerpiece_tech": [
    "three.js scene you can interact with",
    "OGL or raw WebGL shader",
    "CSS 3D transforms only",
    "2D physics engine (matter.js or hand-rolled)",
    "particle system",
    "image-sequence scrubbing from pre-rendered frames",
    "photography-led, no 3D at all",
    "SVG animation and morphing",
    "canvas 2D generative drawing",
    "DOM-based interaction (drag, flip, stack) with spring physics",
  ],
  "motion_toolkit": [
    "GSAP with ScrollTrigger",
    "Motion (motion.dev)",
    "the View Transitions API",
    "Lenis smooth scroll plus CSS scroll-driven animations",
    "Radix-style primitives (accordion, dialog, hover card, tabs, tooltip) with standout animations",
    "hand-rolled spring physics",
    "Rive or Lottie animations",
    "Web Animations API",
  ],
  "personality": [
    "quiet confidence", "playful precision", "brutal honesty", "editorial gravitas", "hacker cool",
    "luxury restraint", "optimistic builder", "scientific calm", "rebellious indie", "warm and human",
    "cinematic ambition", "nordic understatement", "maximalist energy", "minimal futurist", "the quiet operator",
    "mischievous genius", "serene and spacious", "loud and proud",
  ],
  "palette": [
    "near-black with one electric accent", "paper and ink with a spot colour", "duotone", "a saturated colour owns the page",
    "many shades of one hue", "pastel and airy", "greys with colour only from imagery", "full spectrum, used with discipline",
    "warm earth tones", "black, white and one primary", "night-time blues and sodium orange", "candy colours",
    "cream, forest green and brass", "infrared: magenta, orange, deep violet",
  ],
  "delight": [
    "a custom cursor that belongs to the brand",
    "drag to rearrange anything",
    "rich hover states that reveal hidden detail",
    "opt-in sound design",
    "a hidden easter egg",
    "keyboard shortcuts with a visible cheat sheet",
    "tilt and parallax from pointer or device orientation",
    "magnetic buttons and links",
    "text that scrambles or decodes into place",
    "a theme switch that is a show in itself",
    "a loading moment worth waiting for",
    "something reacts to the time of day in Norway",
  ],
}

INSPIRATION = [
  "https://www.awwwards.com/websites/sites_of_the_day/", "https://tympanus.net/codrops/demos/", "https://threejs.org/examples/",
  "https://community.spline.design", "https://rive.app/community", "https://lottiefiles.com/featured", "https://www.unicorn.studio",
  "https://www.shadertoy.com", "https://www.radix-ui.com/primitives", "https://motion.dev/examples", "https://gsap.com/showcase/",
  "https://polyhaven.com", "https://kenney.nl/assets", "https://www.are.na/explore", "https://godly.website", "https://www.siteinspire.com",
  "https://www.cosmos.so", "https://hoverstat.es", "https://www.lapa.ninja", "https://land-book.com", "https://www.framer.com/gallery",
  "https://www.figma.com/community", "https://dribbble.com/shots/popular", "https://www.behance.net/galleries/interaction",
  "https://bruno-simon.com", "https://lusion.co", "https://activetheory.net", "https://www.igloo.inc", "https://linear.app",
  "https://vercel.com/home", "https://stripe.com", "https://www.apple.com/macbook-pro/", "https://www.teenage.engineering",
  "https://www.metmuseum.org/art/collection", "https://images.nasa.gov", "https://www.biodiversitylibrary.org",
  "https://unsplash.com", "https://commons.wikimedia.org", "https://ambientcg.com", "https://quaternius.com",
  "https://www.cssdesignawards.com", "https://www.fwa.com", "https://emilkowal.ski", "https://rauno.me", "https://paco.me",
  "https://ui.aceternity.com", "https://magicui.design", "https://animations.dev", "https://codepen.io/trending",
]
# Teenage Engineering is in the pool for its product photography and sound only; the hard rule against
# industrial/mechanical metaphors still applies.
INSPIRATION.remove("https://www.teenage.engineering")

SPARKS = ["velocity", "silence", "signal", "density", "orbit", "grain", "pulse", "clarity", "gravity", "echo",
  "threshold", "bloom", "lattice", "drift", "contrast", "horizon", "rhythm", "spark", "depth", "tension",
  "flow", "edge", "glow", "scale", "fracture", "breath", "aperture", "vector", "chorus", "dawn", "weightless",
  "electric", "molten", "crystal", "tide-free", "nocturne", "sunlit", "prism", "playground", "atlas"]

KEYS = list(DIMS)

def deal(values, n):
    out = []
    while len(out) < n:
        block = values[:]; rng.shuffle(block); out += block
    return out[:n]

# 'sources' gets two values per brief: deal twice, keep distinct pairs.
cols = {k: deal(DIMS[k], N) for k in KEYS}
second_source = deal(DIMS["sources"], N)

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

for i in range(N):  # make the second source differ from the first
    while second_source[i] == cols["sources"][i]:
        second_source[i] = rng.choice(DIMS["sources"])

hues = [round(i * 360 / N) for i in range(N)]; rng.shuffle(hues)

insp, used_pairs = [], set()
for _ in range(N):
    for _attempt in range(500):
        pick = rng.sample(INSPIRATION, 4)
        pairs = {frozenset(p) for p in itertools.combinations(pick, 2)}
        if not pairs & used_pairs: used_pairs |= pairs; break
    insp.append(pick)

briefs = []
for i in range(N):
    b = {"id": f"{FIRST + i:02d}"}
    b.update({k: cols[k][i] for k in KEYS})
    b["sources"] = [cols["sources"][i], second_source[i]]
    b["seed_hue"] = hues[i]
    b["inspiration"] = insp[i]
    b["sparks"] = rng.sample(SPARKS, 3)
    b["salt"] = secrets.token_hex(3)
    briefs.append(b)

print(json.dumps(briefs, ensure_ascii=False))
print(f"max shared dimensions between any two briefs: {best[0]} of {len(KEYS)}", file=sys.stderr)
