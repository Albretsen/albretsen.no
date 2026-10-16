"""Generates maximally different design briefs for the brand exploration agents.

Each brief picks one value per dimension. Values are dealt out evenly (every
option gets used before any is reused), then a hill-climb swaps values between
briefs to minimise how many dimensions any two briefs share. Seed hues are
spread evenly around the OKLCH wheel and shuffled.

Usage: python3 scripts/design-briefs.py [count] > briefs.json
"""
import itertools, json, random, secrets, sys

N = int(sys.argv[1]) if len(sys.argv) > 1 else 30
rng = random.Random(secrets.randbits(64))

DIMS = {
  "personality": [
    "quiet confidence: says little, every word earns its place",
    "playful precision: clearly having fun, never sloppy",
    "brutal honesty: raw, unpolished on purpose, nothing hidden",
    "editorial gravitas: reads like a respected publication",
    "hacker cool: understated, insider, rewards the curious",
    "luxury restraint: expensive through absence",
    "optimistic builder: bright, forward-looking, energetic",
    "scientific calm: measured, evidence-first, precise",
    "rebellious indie: anti-corporate, self-made, a little cheeky",
    "warm and human: generous, approachable, clearly a person",
    "cinematic ambition: big, dramatic, a sense of scale",
    "nordic understatement: plain, honest, light, unhurried",
    "maximalist energy: loud, dense, joyful overload with control",
    "minimal futurist: tomorrow's interface, today",
    "the quiet operator: competent, unflashy, obviously effective",
  ],
  "visual_world": [
    "Swiss International Style (grid, Akzidenz-era rigour)",
    "1990s personal homepages, rebuilt with impeccable taste",
    "Japanese corporate web minimalism (sparse, tiny type, lots of air)",
    "Dutch graphic design (Experimental Jetset, Studio Dumbar, Wim Crouwel)",
    "New Wave typography (Wolfgang Weingart, April Greiman)",
    "Brutalist web (Businessweek 2015, Balenciaga-era web brutalism)",
    "the code editor as an environment (panes, gutters, syntax colour)",
    "terminal and TUI aesthetics (box-drawing, ANSI colour)",
    "generative art and creative coding (Processing, Shadertoy, Vera Molnár)",
    "academic paper / LaTeX / Tufte (margins, sidenotes, small caps)",
    "long-form magazine editorial (big serif headlines, drop caps)",
    "data journalism (The Pudding, NYT Upshot, FT graphics)",
    "Scandinavian light (midnight sun, polar blue hour, long shadows)",
    "early Macintosh and System 7 UI (1-bit, Chicago, windows)",
    "Y2K futurism (chrome, blobs, iMac translucency) with restraint",
    "video game menus and HUDs",
    "music festival and concert poster typography",
    "Op Art (Bridget Riley, Victor Vasarely) and optical rhythm",
    "film title sequences (Saul Bass, Kyle Cooper)",
    "contemporary AI lab aesthetics (calm, literary, warm neutrals)",
    "exhibition and museum graphics (wall text, large captions)",
    "internet-native maximalism (Are.na, Cosmos, collage)",
  ],
  "layout": [
    "classic split: identity left, live feed right",
    "the name fills the entire first viewport",
    "full-bleed live feed as the background, identity overlaid",
    "a single narrow centered column, like a letter",
    "asymmetric grid with the grid lines visible",
    "horizontal scrolling sections",
    "sticky hero that the products section slides over",
    "everything fits in one viewport on desktop, no scrolling needed",
    "type used as image: overlapping, cropped, collaged",
    "fixed sidebar index with scrolling content",
    "a document page with wide margins and marginalia",
  ],
  "colour": [
    "near-black with one electric accent",
    "paper white and ink with a single spot colour",
    "duotone: exactly two colours, no greys",
    "a fully saturated background colour owns the page",
    "dark, built from many shades of a single hue",
    "pastel, high-key, airy",
    "greys only, with colour appearing solely through live events",
    "colour driven by the live feed (each product has a hue)",
    "inverts between light and dark as you scroll",
    "warm, earthy neutrals with one cool accent",
    "high-contrast black, white and one primary",
  ],
  "typography": [
    "one grotesk used at extreme size contrasts",
    "editorial serif with monospaced details",
    "monospace only, everywhere",
    "a variable font animated by the live feed",
    "condensed display capitals",
    "rounded, humanist, friendly sans",
    "pixel or bitmap type, used seriously",
    "ultra-wide extended display face",
    "classical book typography (old-style figures, small caps)",
    "three families that clash on purpose, held together by a strict grid",
    "a single serif family, all weights, no sans at all",
  ],
  "motion": [
    "completely still except the feed itself",
    "micro-interactions only (hover, focus, press)",
    "kinetic typography",
    "scroll-driven animation with CSS scroll timelines",
    "generative ambient canvas behind the content",
    "spring physics and inertia",
    "teletype: text arrives character by character",
    "slow cinematic fades and reveals",
    "reacts to the cursor",
    "controlled glitch and digital artefacts",
  ],
  "feed": [
    "a classic monospace log, newest on top",
    "a ticker tape marquee",
    "dots appearing on a world map or globe",
    "each event becomes a particle in a constellation",
    "one event at a time, shown huge",
    "a timeline strip where events land as marks",
    "a stack of cards",
    "chat bubbles, as if the products were talking",
    "a heat grid of product × minute",
    "a musical score / piano roll",
    "events orbit around the name",
    "tail -f in a terminal window",
  ],
  "sound": [
    "no sound on the page; describe a sonic logo in BRAND.md",
    "subtle UI sounds synthesised with Web Audio (opt-in)",
    "sonify the feed: each product plays its own note (opt-in)",
    "an ambient generative soundscape driven by activity (opt-in)",
    "a sonic logo that plays when sound is switched on",
    "soft keyboard clicks as text types in (opt-in)",
  ],
  "mark": [
    "a pure wordmark, custom-spaced",
    "a monogram built from the letter A",
    "an abstract symbol",
    "an ASCII / text-character mark",
    "a generative mark that is slightly different every visit",
    "a single dot or punctuation mark as the logo",
    "a mark derived from the shape of the live data",
    "a pixel mark designed favicon-first",
  ],
  "voice": [
    "dry understatement",
    "warm and witty",
    "terse engineer",
    "confident and declarative",
    "playful and curious",
    "poetic and minimal",
    "Norwegian plainness, with a Norwegian word or two",
    "numbers first, adjectives never",
  ],
  "wildcard": [
    "all text is lowercase",
    "one font size for everything except the name",
    "no borders, rules or lines anywhere",
    "the word Albretsen must be the largest thing on the page",
    "everything aligns to a monospace character grid",
    "no images and no SVG: only type and CSS",
    "include exactly one interaction that genuinely surprises",
    "the page must also look great when printed",
    "hide one tasteful easter egg",
    "after 30 seconds idle the hero becomes a screensaver",
    "show the products as a timeline from 2016 to today",
    "the light/dark toggle is itself a design moment",
    "all motion is pure CSS",
    "the cursor is part of the design",
    "design the favicon and the browser tab title as carefully as the hero",
    "the hero must read clearly at 320 px wide first, then scale up",
  ],
}

INSPIRATION = [
  "https://godly.website", "https://www.siteinspire.com", "https://minimal.gallery", "https://hoverstat.es",
  "https://www.awwwards.com/websites/portfolio/", "https://www.lapa.ninja", "https://land-book.com", "https://httpster.net",
  "https://fontsinuse.com", "https://www.typewolf.com", "https://www.are.na/explore", "https://www.cosmos.so",
  "https://rauno.me", "https://paco.me", "https://emilkowal.ski", "https://brianlovin.com", "https://linear.app",
  "https://vercel.com", "https://stripe.com/sessions", "https://press.stripe.com", "https://www.anthropic.com",
  "https://cursor.com", "https://www.raycast.com", "https://zed.dev", "https://ciechanow.ski", "https://bellard.org",
  "https://www.figma.com/config", "https://family.co", "https://rive.app", "https://www.readcv.com",
  "https://www.experimentaljetset.nl", "https://www.pentagram.com", "https://www.thepudding.cool",
  "https://www.nytimes.com/interactive", "https://www.oxide.computer", "https://www.warp.dev",
  "https://www.framer.com/gallery", "https://www.shadertoy.com", "https://www.siteinspire.com/websites?categories=27",
  "https://www.dezeen.com/design/graphics", "https://www.itsnicethat.com", "https://www.creativeapplications.net",
  "https://www.smashingmagazine.com", "https://tympanus.net/codrops", "https://www.cssdesignawards.com",
  "https://www.typography.com", "https://klim.co.nz", "https://www.grillitype.com", "https://www.dinamo.us",
  "https://pangrampangram.com", "https://www.colophon-foundry.org", "https://www.commercialtype.com",
]

SPARKS = ["velocity", "silence", "signal", "density", "orbit", "grain", "pulse", "clarity", "gravity", "echo",
  "threshold", "bloom", "lattice", "drift", "contrast", "horizon", "rhythm", "spark", "depth", "tension",
  "flow", "edge", "glow", "scale", "fracture", "breath", "aperture", "vector", "chorus", "dawn"]

KEYS = list(DIMS)

def deal(values, n):
    out = []
    while len(out) < n:
        block = values[:]
        rng.shuffle(block)
        out += block
    return out[:n]

cols = {k: deal(DIMS[k], N) for k in KEYS}

def overlap(i, j):
    return sum(cols[k][i] == cols[k][j] for k in KEYS)

def cost():
    pairs = [overlap(i, j) for i, j in itertools.combinations(range(N), 2)]
    return max(pairs), sum(p * p for p in pairs)

best = cost()
for _ in range(20000):  # hill-climb: swap one dimension's values between two briefs
    k = rng.choice(KEYS)
    i, j = rng.sample(range(N), 2)
    cols[k][i], cols[k][j] = cols[k][j], cols[k][i]
    c = cost()
    if c <= best:
        best = c
    else:
        cols[k][i], cols[k][j] = cols[k][j], cols[k][i]

hues = [round(i * 360 / N) for i in range(N)]
rng.shuffle(hues)

# Inspiration: 3 per brief, no two briefs share more than one site.
insp, used_pairs = [], set()
for _ in range(N):
    for _attempt in range(500):
        pick = rng.sample(INSPIRATION, 3)
        pairs = {frozenset(p) for p in itertools.combinations(pick, 2)}
        if not pairs & used_pairs:
            used_pairs |= pairs
            break
    insp.append(pick)

briefs = []
for i in range(N):
    b = {"id": f"{i + 1:02d}"}
    b.update({k: cols[k][i] for k in KEYS})
    b["seed_hue"] = hues[i]
    b["inspiration"] = insp[i]
    b["sparks"] = rng.sample(SPARKS, 2)
    b["salt"] = secrets.token_hex(3)
    briefs.append(b)

print(json.dumps(briefs, ensure_ascii=False, indent=1))
print(f"max shared dimensions between any two briefs: {best[0]} of {len(KEYS)}", file=sys.stderr)
