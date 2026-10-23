# How the albretsen.no design was made

Over several days, about 250 AI agents and one person with taste produced the design of [albretsen.no](https://albretsen.no). The method was simple: manufacture variety with scripts, supply taste through human feedback, and narrow the search one round at a time.

## 1. Decide what the site is before deciding how it looks

The work started with research and a spec. 32 agents gathered ideas for the site, I approved or rejected them, and the spec (`SITE.md`) was cut down until it was plain: a hero, products, a blog and a tech stack page. The rejections mattered as much as the approvals. "Too much uniqueness, hard to understand" set the limits every design later had to stay inside.

## 2. Put the randomness in a script, because a model won't produce it on its own

Ask a model for 30 different designs and it drifts back to the same safe ideas. So the briefs came from small Python generators (`scripts/design-briefs*.py`):

- **Many dimensions.** Each brief got a value for personality, visual world, layout, colour rule, typography, motion, sound, logo approach, voice, one wildcard constraint, a seed hue and a set of inspiration sites.
- **Even dealing.** Every option was used once before any option repeated.
- **Spread enforced.** A hill-climb swapped values between briefs until no two briefs shared more than one dimension.
- **Fixed, not random.** Hues were spaced evenly around the colour wheel, and inspiration sites were picked so no two agents got the same pair.

## 3. Keep every designer isolated

Each agent worked in its own git worktree, which held only a shared framework: the facts about the company, a realistic live event feed, the real product logos and a contract for what to deliver. Agents never saw each other's work, so each direction stayed its own instead of averaging toward the others.

## 4. Round 1: 30 designs built on type alone

The results were beautiful but flat. My verdict was that they felt like a piece of paper, not a real website. That became the next brief.

## 5. Round 2: 60 agents, assets first, then the site

- **Two agents per design.** An art director made a complete asset kit, and a separate builder made the site from it.
  - The kit held: a logo, hero imagery, product visuals around the real logos, a 3D or interactive piece, a motion study, and a contact sheet with every licence listed.
  - Splitting the work meant the imagery was designed as one coherent world before any layout existed.
- **Agents could see their own work.** A headless Chrome screenshot script let every agent look at its page and fix it at least twice.
- **My shortlist sharpened the brief.** Six favourites showed what worked: real imagery, light, paper. My comments named what didn't: "not my brand", "too crowded".

## 6. Round 3: aimed at my taste

- **20 of the 30 briefs were weighted to my taste:** LA, Miami, Marbella, sunsets and sunrises, dramatic Norwegian nature, Norwegian small-town life, Paris, California, sunshine, South of France architecture and Wes Anderson.
  - Each brief blended two of these worlds, and no pair repeated.
- **10 briefs stayed open,** to keep room for surprise.
- **Every agent read my feedback word for word,** plus the lesson drawn from it: the aesthetic is atmosphere, not costume, and the subject is still a software company.
- **This is where it converged.** I shortlisted four designs, and we picked the winner using measurements (page weight, JavaScript size, layout shift) and how well each fit the brand.

## 7. Refine the winner by hand

The winning design, *Afterglow Diorama*, was refined using my concrete corrections:

- keep the purple fixed;
- stop the slider jumping while you drag it;
- replace the boring divider;
- drop the cringe lines;
- make the MCP setup work for every client, not just Claude;
- make the "AS" bigger.

Every fix was checked in the browser, the build enforced a performance budget, and the result went live.

## The principle underneath

Variety had to be manufactured, with scripts, randomness and isolation. Taste had to be supplied, by me. The agents did the volume and the craft, and my reactions, used word for word as the brief between rounds, did the steering.

Each round cut the search space without collapsing it: 30 random designs, then 60 asset-led ones, then 20 aimed at my taste, then 4, then 1.

All 90 designs are kept in the repo under `archive/designs/`, with a gallery for browsing them.
