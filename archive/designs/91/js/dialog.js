// Living Town: what everyone says when you zoom in on them.
//
// Pure data and a picker. No three.js, no DOM, so it runs in node for the tests.
//
//   import { pick, activityOf } from './dialog.js';
//   const recent = new Set();                       // keep one per page, shared by everyone
//   const said = pick('henri', { hour: 16.4, activity: 'bench', nearby: ['odile'], recent });
//   // -> { id: 'henri', text: 'Seven down, "dusk", four letters.',
//   //      reply: { id: 'odile', text: 'Soir, darling. It is always soir.' }, ref: false }
//
// Lines are mostly ordinary, wholesome town life. About one pick in eight (REF_RATE) may be a
// "ref": a warm mention of Asgeir or of his products. Product facts come from _shared/content.js
// only (MCP Emails: email for AI agents, 17 tools, about 100 providers, the post office open all
// night; Fun Libs: the fill-in-the-blanks word game, 113,000+ installs, built at 17, no
// marketing, the arcade; Toolrails: one MCP URL that gives an agent every tool, 4 connectors, tool
// search, injection guard, being built, the workshop; Harbor: a private knowledge base shared by
// people and AI, paused, the library with its reading lamp left on). No figures beyond those.
//
// Each line is [when, activity, text]. `when` and `activity` are space-separated lists; an empty
// string means "any". Phases: dawn morning midday afternoon golden sunset blue night late.
// Activities: see activityOf() below.
//
// Asgeir ('asgeir') is a townsperson of his own, separate from the builder. His day is in cast.js:
// café, post office, desk, the bench, a walk, the workshop window, kiosk, railing, a bench, home.

export const PHASES = ['dawn', 'morning', 'midday', 'afternoon', 'golden', 'sunset', 'blue', 'night', 'late'];

// Hour boundaries, chosen so the evening phases line up with the sky in time.js
// (golden hour ends about 19:37, sunset about 20:00, blue hour about 20:42).
const PHASE_STARTS = [[0, 'late'], [5, 'dawn'], [7, 'morning'], [11.5, 'midday'], [14.5, 'afternoon'],
  [18, 'golden'], [19.5, 'sunset'], [20.1, 'blue'], [20.9, 'night']];

/** The dialog phase for an hour of the day (0..24, wraps). */
export function phaseOf(hour) {
  const h = (((+hour || 0) % 24) + 24) % 24;
  let p = 'late';
  for (const [start, name] of PHASE_STARTS) if (h >= start) p = name;
  return p;
}

/**
 * The dialog activity for a schedule entry from cast.js, e.g. activityOf(person.act, person.state).
 * Returns one of: running cycling dogwalk stroll playing serving setup break watering bench cafe
 * rose railing dancing kiosk stretching fountain post arcade workshop phone wander home goinghome.
 */
export function activityOf(act, state) {
  if (!act) return undefined;
  if (state === 'travel' && act.act === 'home') return 'goinghome';
  switch (act.act) {
    case 'home': return 'home';
    case 'inside': return 'workshop';
    case 'follow': return 'stroll';
    case 'patrol': return act.mode === 'setup' ? 'setup' : 'serving';
    case 'wander': return act.prop === 'phone' && (act.pause || [])[0] === 'phone' ? 'phone' : 'wander';
    case 'loop': return { jog: 'running', ride: 'cycling', dog: 'dogwalk', stroll: 'stroll', fountain: 'playing' }[act.loop] || 'wander';
    case 'spot': {
      const s = String(act.spot || '');
      const head = s.split(':')[0];
      return {
        bench: 'bench', chair: 'cafe', drinks: 'rose', rail: 'railing', dance: 'dancing', plants: 'watering',
        kiosk: 'kiosk', stretch: 'stretching', fountainedge: 'fountain', postbox: 'post', arcade: 'arcade',
        workshop: 'workshop', column: 'phone', cafedoor: 'break',
      }[head] || 'wander';
    }
    default: return undefined;
  }
}

// Visitors share banks by kind.
export const ALIASES = { x1: 'visitor', x2: 'visitor', x5: 'visitor', x3: 'neighbour', x4: 'runner', x6: 'kid', jogger: 'ines', waiter: 'marcel', dog: 'biscuit' };
export const resolveId = (id) => ALIASES[id] || id;

export const DIALOG = {
  ines: {
    name: 'Inès',
    voice: 'Brisk and sunny. Counts everything, talks in short bursts, the town\'s first riser.',
    lines: [
      ['', '', 'Good day so far. Score: excellent.'],
      ['dawn', 'home', 'Alarm. Shoes. Out. Good morning, me.'],
      ['dawn', 'running', 'First one out. The gulls are still yawning.'],
      ['dawn', 'running', 'Lap one. The bakery smells like a hug.'],
      ['dawn morning', 'running', 'Left, right, sea. Left, right, sea.'],
      ['', 'running', 'The tide and I keep the same pace.'],
      ['', 'stretching', 'Stretch, breathe, look at that water. Done.'],
      ['morning', 'running', 'Lucie rang her bell at me. I rang back. With my voice.'],
      ['morning', 'cafe', 'Pain au chocolat. I earned at least half of it.'],
      ['morning midday', 'cafe', 'Marcel saved me the sunny chair. Again!'],
      ['midday', 'cafe', 'Lunch in the sun. Ten out of ten.'],
      ['midday', 'cafe', 'Salad, then tarte. That is called balance.'],
      ['morning midday', 'cafe', 'Marcel says I run so he does not have to.'],
      ['', 'phone', 'Texting Lucie. Dancing tonight? "Obviously," she says.'],
      ['morning midday', 'wander phone', 'Small errand, big detour. The sea way.'],
      ['afternoon', '', 'Little nap, then laps. A perfect plan.'],
      ['golden', 'running', 'Evening laps. The light does half the work.'],
      ['golden afternoon', 'running', 'Racing my shadow. It is a very long shadow.'],
      ['golden sunset', 'railing', 'Three, two, one... there it goes.'],
      ['', 'railing', 'I stop running for exactly this.'],
      ['sunset', 'railing', 'Sixty seconds of pink. I counted.'],
      ['blue night', 'rose', 'Rosé after laps. Science says yes. Probably.'],
      ['night', 'rose', 'Lamps on, glass up, feet resting. Perfect order.'],
      ['', 'dancing', 'Lucie leads, I follow. Then we swap.'],
      ['', 'rose', 'One glass. Maybe one and a little bit.'],
      ['blue night', 'rose', 'Santé to whoever switches on the lamps.'],
      ['', 'dancing', 'I run all morning so I can dance all night.'],
      ['night', 'dancing', 'My feet know this song before I do.'],
      ['night', 'goinghome home', 'Home, shower, bed. Laps again at six.'],
      ['late', 'home', '(Inès is asleep, shoes lined up by the door.)'],
    ],
    refs: [
      ['dawn morning', 'running', 'The post office light was on at six. It always is.'],
      ['morning midday', '', 'Asgeir waved from Marcel\'s. Coffee in one hand, as always.'],
      ['', 'stretching cafe', 'Fun Libs on my break. I wrote "a glorious pelican".'],
    ],
  },

  marcel: {
    name: 'Marcel',
    voice: 'A theatrical, warm host. French flourishes, speaks in orders and little bravos.',
    lines: [
      ['', '', 'In my café nobody is in a hurry. It is the rule.'],
      ['dawn morning', 'setup', 'Chairs out. Cloths smooth. The sea, as ordered.'],
      ['', 'setup', 'Every table gets a little vase. Even table nine.'],
      ['dawn morning', 'setup', 'Good morning, table one. You look rested.'],
      ['morning', 'serving', 'Un grand crème for Inès, as always.'],
      ['morning', 'serving', 'The croissants are very flaky today. Bravo, us.'],
      ['', 'serving', 'Voilà. With a view, at no extra charge.'],
      ['', 'serving', 'Careful, careful... not a drop. Magnifique.'],
      ['midday', 'serving', 'Citron pressé for the young monsieur.'],
      ['midday afternoon', 'serving', 'Table four wants the sea view. They all do.'],
      ['afternoon', 'break', 'Five minutes with my coffee. Then the world again.'],
      ['', 'break', 'Listen. Cups clinking. My favourite music.'],
      ['afternoon', 'break', 'The quiet hour. Even the cups are resting.'],
      ['afternoon', 'break', 'From here I see every table. All happy. Bon.'],
      ['golden', 'serving', 'Rosé, rosé, rosé, and one very brave pastis.'],
      ['golden sunset', 'serving', 'Everyone faces the sea now. I serve lovely backs.'],
      ['blue', 'serving', 'The lamps are on. Now the café looks its best.'],
      ['night', 'serving', 'A candle on every table. Like little moons.'],
      ['night late', 'setup', 'Chairs up. Bonne nuit, chairs.'],
      ['night late', 'setup', 'Last cloth folded. Another good day at the café.'],
      ['late', 'home goinghome', 'Upstairs, slippers. Tomorrow, the same, but better.'],
    ],
    refs: [
      ['', 'serving break', 'The post office never closes now. The agents write such nice letters.'],
      ['morning midday', 'serving', 'Asgeir? Black coffee, window seat, says takk. A perfect guest.'],
      ['night', 'serving setup', 'The workshop orders one espresso and stays till midnight.'],
      ['afternoon midday', '', 'Léo made Fun Libs say "croissant of destiny". Bravo.'],
    ],
  },

  henri: {
    name: 'Henri',
    voice: 'Slow, courtly and precise. A gentle dry wit; measures life in lemons and years.',
    lines: [
      ['', '', 'Patience, a good hat, and a view of the sea.'],
      ['morning', 'watering', 'Good morning, little lemons. Drink up.'],
      ['', 'watering', 'Water at the roots, never the leaves. My father said so.'],
      ['afternoon', 'watering', 'This one has a new lemon. Look at him.'],
      ['morning', 'stroll', 'Forty years, and the sea still finds new blues.'],
      ['', 'stroll', 'We walk slowly. We see more.'],
      ['', 'bench', 'A good bench is a good friend. This one is very good.'],
      ['morning', 'bench', 'The paper says sunshine. I agree with the paper.'],
      ['midday', 'cafe', 'Marcel, the usual. Yes, the small one. Merci.'],
      ['midday', 'cafe', 'Odile ordered the tarte. I will have a bite of hers.'],
      ['midday', 'cafe', 'Marcel pours like a violinist. Very serious.'],
      ['midday', 'bench', 'Noon. Even the shadows are having a rest.'],
      ['morning afternoon', 'watering', 'One can per tree. They know when I am late.'],
      ['morning', 'stroll', 'Bonjour, lamp posts. Bonjour, palm trees.'],
      ['afternoon golden', 'stroll', 'Arm in arm. The only way to walk a promenade.'],
      ['afternoon', 'bench', 'Twelve across: "harbour bird", four letters. Gull.'],
      ['golden', '', 'Golden hour. Odile looks twenty again.'],
      ['golden sunset', 'bench stroll', 'Here comes the theatre. Front row, as usual.'],
      ['blue', '', 'One by one, the windows. Like a slow piano.'],
      ['blue night', 'cafe rose', 'To forty-one years, and to the forty-second.'],
      ['blue night', 'cafe rose', 'Candles on the tables. Forty-one years, still courting.'],
      ['night', 'cafe rose', 'One more small glass. Then the stairs, slowly.'],
      ['sunset blue', 'bench', 'Hush. This part is the overture.'],
      ['night', 'goinghome home', 'Home. A cup of tea and the crossword, finished.'],
      ['late', 'home', '(Henri is asleep. The lemons keep watch.)'],
    ],
    refs: [
      ['morning afternoon', 'watering bench', 'Asgeir asked how to water lemons. A serious young man.'],
      ['golden sunset blue night late', 'stroll bench', 'The library is resting. They left one lamp on. Very civil.'],
      ['afternoon', 'bench', 'Odile tried that word game. She chose "magnificent" every time.'],
    ],
  },

  odile: {
    name: 'Odile',
    voice: 'Chatty and fond. Knows everyone kindly, notices everything, loves an exclamation mark.',
    lines: [
      ['', '', 'Everyone on this promenade is somebody\'s favourite.'],
      ['morning', 'stroll', 'Good morning, Marcel! Good morning, gulls!'],
      ['morning', 'stroll', 'Henri, your hat. There. Handsome.'],
      ['morning', 'bench', 'Lucie went by twice. Two baguettes, I think!'],
      ['', 'bench', 'Biscuit has a new collar. Red! Very smart.'],
      ['', 'bench', 'I know every window in this town by its curtains.'],
      ['midday', 'cafe', 'A slice of the tarte, and a second fork for Henri.'],
      ['', 'cafe', 'Marcel remembers everyone\'s order. Like a little poem.'],
      ['midday', 'cafe', 'Marcel, you spoil us. Do keep doing it.'],
      ['morning midday afternoon golden', 'cafe', 'A table in the sun and Henri across it. Lovely.'],
      ['midday', 'bench', 'Noon already! The morning simply flew by.'],
      ['afternoon golden', 'stroll', 'Arm, Henri. There. Now we are a parade.'],
      ['golden', 'stroll', 'Bonsoir, Lucie! What a lovely basket!'],
      ['afternoon', 'bench', 'Soir! Four letters! I told you, Henri.'],
      ['afternoon', '', 'The lemon trees look very proud today.'],
      ['golden', '', 'Look at the light on the plaster. Like apricots.'],
      ['golden sunset', 'bench', 'Every evening, a new painting. Free of charge!'],
      ['blue', '', 'There, the Lefèvres are home. Their lamp is pink.'],
      ['blue night', 'cafe rose', 'Half a glass. Well, half and a little half.'],
      ['night', '', 'Camille and Théo, dancing! Like us at the harbour ball.'],
      ['night', 'goinghome home', 'Bonne nuit, everyone! Bonne nuit, Biscuit!'],
      ['late dawn', 'home', '(Odile is asleep, smiling at something.)'],
    ],
    refs: [
      ['', 'bench stroll', 'The post office is open all night now. For the robots!'],
      ['', '', 'That nice Asgeir always stops to say hei. Such manners.'],
      ['golden sunset blue night', '', 'The workshop light is on. He hums while he works, you know.'],
      ['afternoon midday', '', 'Léo wrote me a Fun Libs story. I was "dazzling"!'],
    ],
  },

  yusuf: {
    name: 'Yusuf',
    voice: 'Easygoing and deadpan. Narrates Biscuit\'s wishes; Biscuit is clearly the boss.',
    lines: [
      ['', '', 'Biscuit and I agree on most things. Mostly snacks.'],
      ['dawn morning', 'dogwalk', 'Biscuit has chosen the scenic route. Good choice.'],
      ['', 'dogwalk', 'He stops at every lamp post. Reading the news.'],
      ['', 'dogwalk', 'Biscuit says hello. He says it with his whole tail.'],
      ['morning', 'dogwalk', 'Biscuit loves Lucie\'s bell. Ding, and his ears go up.'],
      ['morning', 'dogwalk', 'Henri gives him a crumb. Henri is his favourite.'],
      ['midday', 'bench', 'Half the sandwich for me, half for the boss.'],
      ['', 'bench', 'Biscuit is watching a pigeon. Very professionally.'],
      ['midday', 'bench', 'Biscuit has decided the crust is his. It is his.'],
      ['sunset', 'railing', 'Biscuit watches the sun. I watch Biscuit. Good evening.'],
      ['', 'railing', 'Every evening he sits like this. A very dignified dog.'],
      ['blue night', 'phone', 'Yes, Mum. Biscuit says goodnight too.'],
      ['blue', 'phone', 'Showing my sister the lamps on video. She says wow.'],
      ['afternoon', '', 'Afternoon nap. Both of us. Same sunbeam.'],
      ['golden', 'dogwalk', 'Evening round. The long one. His idea.'],
      ['', 'railing', 'Biscuit, sit. Watch the sun. Good boy.'],
      ['golden sunset', 'railing', 'He likes sunsets. Or the gulls. Both, I think.'],
      ['', 'phone', 'Yes, Mum, I see it too. Yes, he is eating well.'],
      ['night blue', 'dogwalk', 'The lantern and the lamps. Biscuit approves of both.'],
      ['night', '', 'Last sniff of the fountain, then home.'],
      ['late', 'home', '(Biscuit snores. Yusuf pretends it is the sea.)'],
    ],
    refs: [
      ['', 'dogwalk', 'Biscuit sits by the post office. He likes the hum.'],
      ['morning midday', '', 'Asgeir saves Biscuit the corner of his croissant.'],
      ['', 'bench phone', 'Fun Libs asked me for an animal. I said Biscuit. Obviously.'],
    ],
  },

  biscuit: {
    name: 'Biscuit',
    voice: 'A terrier of strong, cheerful opinions. Stage directions only.',
    lines: [
      ['', '', '(Biscuit sniffs a lemon tree. Approves.)'],
      ['', '', '(Biscuit wags at everyone. Everyone.)'],
      ['', 'railing', '(Biscuit sits very upright, facing the sea.)'],
      ['', '', '(A small, polite woof.)'],
      ['morning afternoon', '', '(Biscuit carries a stick bigger than he is.)'],
      ['dawn morning', '', '(Biscuit greets the baguette respectfully.)'],
      ['blue night', '', '(Biscuit walks proudly beside the lantern.)'],
      ['golden sunset', '', '(Biscuit sits on Yusuf\'s foot. Warm spot.)'],
      ['midday', '', '(Biscuit pretends not to want the sandwich. Badly.)'],
      ['late', '', '(Biscuit is asleep, paws twitching. Chasing gulls, gently.)'],
    ],
    refs: [
      ['', '', '(Biscuit waits by the post office, as if expecting a letter.)'],
    ],
  },

  lucie: {
    name: 'Lucie',
    voice: 'Quick and bright, bike-bell energy. Loves small indulgences. Says "obviously".',
    lines: [
      ['', '', 'Bell, basket, sunshine. Everything a person needs.'],
      ['dawn morning', 'cycling', 'Baguette in the basket. Day officially begun.'],
      ['morning', 'cycling', 'Ding ding! Bonjour, Henri!'],
      ['', 'cycling', 'Downhill, no hands. Just kidding. Both hands.'],
      ['morning', 'cycling', 'The bakery gave me the end piece. The best piece.'],
      ['morning', 'kiosk', 'Kiosk coffee, kiosk bench, kiosk view. Perfect.'],
      ['morning midday', 'kiosk', 'Small coffee, big view. Ideal ratio.'],
      ['', 'kiosk', 'The kiosk knows my order. I am basically famous.'],
      ['midday', 'cycling', 'Flowers in the basket. The bike looks very proud.'],
      ['afternoon', 'cafe', 'Marcel drew a little heart in the foam. Obviously.'],
      ['midday afternoon', 'cafe', 'Coffee number two. Croissant number... we will not count.'],
      ['midday morning', 'cycling', 'Errands: bread, stamps, flowers, more bread.'],
      ['afternoon midday', 'cafe', 'Second coffee. Our little secret.'],
      ['afternoon', 'cycling', 'Wind at my back. The whole town is cheering.'],
      ['golden', 'rose', 'Rosé, obviously. Pink sky, pink glass.'],
      ['', 'rose', 'Santé! To bicycles and baskets.'],
      ['sunset', 'rose', 'Pink sky, pink glass, pink cheeks. Matching!'],
      ['', 'rose', 'One glass, then the railing, then dancing. Obviously.'],
      ['night', 'railing', 'The stars come out one by one. Like the windows.'],
      ['sunset blue', 'railing', 'The last pink bit. There. Lovely.'],
      ['', 'railing', 'I could watch this every night. I do!'],
      ['night', 'dancing', 'I said I would not dance. I was very wrong.'],
      ['', 'dancing', 'One more! This is my song. They are all my song.'],
      ['night', 'goinghome home', 'Bike to bed. Bell off. Bonne nuit.'],
      ['late', 'home', '(Lucie is asleep. The bike leans by the door, also asleep.)'],
    ],
    refs: [
      ['night blue', '', 'I posted a card at midnight once. The post office never closes!'],
      ['morning', 'cycling kiosk', 'Passed Asgeir on the hill. He was thinking with his whole face.'],
      ['afternoon golden', '', 'The arcade has Fun Libs. I wrote "magnificent baguette".'],
    ],
  },

  leo: {
    name: 'Léo',
    voice: 'Nine and three quarters. Big questions, grand plans, numbers, pure wonder.',
    lines: [
      ['', '', 'Did you know gulls can float? I know everything about gulls.'],
      ['morning', 'home', 'Is it holidays still? Yes! Still holidays!'],
      ['', 'fountain', 'I counted the coins. Then I lost count. Lots!'],
      ['', 'playing', 'Ten laps of the fountain! Okay, eight. Okay, ten!'],
      ['', 'playing', 'I am the fastest in the whole town. After Inès.'],
      ['', 'fountain', 'There is a fish in there. Maybe. I named him Paul.'],
      ['morning midday', 'playing', 'Lap eleven! I think. Maybe nine. Fast, anyway!'],
      ['morning midday', 'fountain', 'If I wish on a coin, do I get a dog like Biscuit?'],
      ['midday', 'cafe', 'Mum says one sugar. I say one sugar per sip.'],
      ['afternoon', 'dancing', 'This is my robot move. And this is my other robot move.'],
      ['golden', 'railing', 'The sun is getting sleepy. Me too. A tiny bit.'],
      ['golden', 'stroll', 'Mum, look! My shadow is a giant!'],
      ['sunset', 'stroll', 'Can Biscuit come to our house for a sleepover?'],
      ['midday', 'cafe', 'Citron pressé, please. With extra pressé.'],
      ['', 'cafe', 'Can I have the sugar? For science.'],
      ['afternoon', '', 'When I grow up I will light the lamps. Or fly planes.'],
      ['afternoon', 'dancing', 'Practising my moves for tonight. Watch!'],
      ['golden', 'railing', 'Bye, sun! See you tomorrow!'],
      ['', 'railing', 'The sun goes in the sea and the sea stays warm. Clever.'],
      ['golden sunset', 'stroll', 'Five more minutes? Four? Three and a half?'],
      ['sunset blue', '', 'I am not sleepy. I am a tiny bit sleepy.'],
      ['blue night', 'home goinghome', 'Fine. Bed. But I am dreaming about the fountain.'],
      ['night late', 'home', '(Léo is asleep, one sock on, smiling.)'],
    ],
    refs: [
      ['morning midday afternoon', '', 'I played Fun Libs. The dragon ate a "fluffy" sandwich!'],
      ['', '', 'The post office does email for robots. Robots get post!'],
      ['afternoon golden', '', 'Asgeir showed me how the lamps know it is dark. Magic. Code!'],
    ],
  },

  camille: {
    name: 'Camille',
    voice: 'Warm and gently wry. Collects small moments, and talks to Léo a lot.',
    lines: [
      ['', '', 'Small town, big sky. I would not swap it.'],
      ['night', 'dancing', 'One more song. Then one more.'],
      ['morning', 'wander phone', 'Léo! Not in the fountain! Well. Only your hands.'],
      ['morning', '', 'Coffee, sunshine, one quiet minute. Bliss.'],
      ['midday', 'cafe', 'A salade niçoise and nowhere to be.'],
      ['', 'cafe', 'Léo ordered for all of us. Very confident.'],
      ['afternoon', 'wander', 'The hollyhocks are taller than Léo now.'],
      ['afternoon', '', 'I walk this promenade every day. Every day, new.'],
      ['midday', 'wander', 'Léo found a shell. It is now the family treasure.'],
      ['morning midday', 'wander phone', 'Three errands done. Time for one small ice cream.'],
      ['golden', 'railing', 'Léo waves at the sun every evening. It never forgets him.'],
      ['golden', 'railing', 'I should go in. Five more minutes. Like Léo.'],
      ['golden sunset', 'wander', 'Léo, the bath is waiting. So is the duck.'],
      ['sunset', 'rose', 'Léo asleep, sky pink, glass cold. Bliss.'],
      ['sunset blue', 'rose', 'Théo and me, and a whole sunset to ourselves.'],
      ['golden', 'railing', 'Golden. Everything is golden. Even Théo.'],
      ['golden sunset', 'wander stroll', 'Come on, Léo. Bath, story, bed. In that order.'],
      ['blue', 'rose', 'He is asleep. Santé to quiet houses.'],
      ['', 'rose', 'Théo chose the rosé. He chose well.'],
      ['night', 'dancing', 'Théo, you promised. Oh, you are already dancing.'],
      ['', 'dancing', 'Under the string lights, everyone dances well.'],
      ['night late', 'goinghome home', 'Home. Léo\'s night light is on. Sweet thing.'],
      ['late', 'home', '(Camille is asleep, a book open on her chest.)'],
    ],
    refs: [
      ['afternoon', 'wander', 'The new arcade! Léo talks about Fun Libs all week.'],
      ['golden sunset blue night late', '', 'The library is resting. I like that they kept the lamp on.'],
      ['morning midday', '', 'Asgeir helped Léo fly his kite. Very patient.'],
    ],
  },

  theo: {
    name: 'Théo',
    voice: 'Playful and mock-serious. A connoisseur of bread, a professional at doing nothing.',
    lines: [
      ['', '', 'Today I achieved a perfect stroll. Tomorrow, another.'],
      ['blue', 'rose', 'The lamps are on, the glass is pink. I am content.'],
      ['morning', 'wander', 'The baguette is still warm. It may not make it home.'],
      ['', 'wander', 'Two baguettes. One for home, one for the walk.'],
      ['morning', 'phone', 'Yes, working. From the promenade. Very productive view.'],
      ['', 'phone', 'Meeting moved. I will celebrate with a croissant.'],
      ['midday', 'cafe', 'Lunch on the terrace. Officially a working lunch.'],
      ['afternoon', '', 'Afternoon plan: nothing. Going perfectly.'],
      ['midday', 'cafe', 'Léo is ordering for me. I am getting a citron pressé.'],
      ['afternoon golden', 'wander', 'Strolling. Like walking, but on purpose.'],
      ['golden sunset', 'railing', 'Camille says I say "wow" too much. Wow.'],
      ['sunset', 'rose', 'A toast to the sun. It worked very hard today.'],
      ['night', 'dancing', 'Camille is a wonderful dancer. I am a wonderful enthusiast.'],
      ['golden', 'wander', 'Rosé or pastis? Rosé. It is always rosé.'],
      ['golden sunset', 'railing', 'Camille! Come and see this! Quick!'],
      ['', 'railing', 'I have seen a hundred of these. Still wow.'],
      ['blue', 'rose', 'To us. And to sleeping children.'],
      ['', 'rose', 'I chose the rosé. I am told I chose well.'],
      ['night', 'dancing', 'I never promised. I am dancing anyway.'],
      ['', 'dancing', 'This is my one move. I do it with feeling.'],
      ['night late', 'goinghome home', 'That was a good one. They are all good ones.'],
      ['late', 'home', '(Théo is asleep, still smiling about the baguette.)'],
    ],
    refs: [
      ['midday', 'cafe', 'They say the post office does email for robots now. Clever.'],
      ['morning', 'wander', 'Asgeir and I talk bread. He is very serious about rye.'],
      ['', 'phone', 'Toolrails: one link, every tool. Like a good bakery.'],
    ],
  },

  builder: {
    name: 'The builder',
    voice: 'Few words, steady and kind. Thinks in commits, lamps and screws. Hums.',
    lines: [
      ['', '', 'Small steps. Tidy work. A good cup of coffee.'],
      ['morning', 'post', 'Checking the post. The agents never sleep.'],
      ['morning', '', 'Coffee. Bench. Then the workbench.'],
      ['', 'workshop', 'One screw at a time.'],
      ['', 'workshop', 'The lathe hums. I hum back.'],
      ['midday', 'workshop', 'Lunch at the workbench. Crumbs in the vice.'],
      ['midday', 'cafe', 'Marcel knows. One espresso, no questions.'],
      ['midday', 'cafe', 'Coffee break. The vice can hold the thought.'],
      ['morning', 'post', 'A parcel for the workshop. Bolts, I hope. I love bolts.'],
      ['golden', 'arcade', 'The marquee bulbs, chasing each other. Good wiring.'],
      ['golden', 'arcade', 'Kids at the arcade, laughing at their own stories.'],
      ['golden', 'workshop', 'Door open. I can smell the sea and hear the café.'],
      ['sunset', 'railing', 'Watching the sun land. Nice and gentle.'],
      ['afternoon', 'workshop', 'Sawdust in a sunbeam. Good afternoon.'],
      ['golden sunset', 'railing', 'Down tools. The sun has right of way.'],
      ['', 'railing', 'Same rail every evening. It fits my elbows.'],
      ['blue', 'workshop', 'Lamps on outside. Lamp on in here. Even.'],
      ['night', 'workshop', 'The town goes quiet. The ideas get louder.'],
      ['night', '', 'Music from the terrace. Good to work to.'],
      ['late', 'workshop', 'One more commit. A small, tidy one.'],
      ['late', 'workshop', 'Last light in town. I will switch it off. Soon.'],
      ['late', 'goinghome home', 'Shipped. Home. The stars are out.'],
    ],
    refs: [
      ['', 'workshop cafe', 'Toolrails: one MCP URL that gives an agent every tool.'],
      ['', 'workshop cafe', 'Four connectors so far. Tool search and an injection guard.'],
      ['morning', 'post', 'MCP Emails: seventeen tools, about a hundred providers.'],
      ['', 'arcade', 'People share Fun Libs stories. No marketing. They just do.'],
      ['', '', 'Asgeir dropped by. Good questions. Then he let me get on.'],
    ],
  },

  asgeir: {
    name: 'Asgeir',
    voice: 'Understated, curious and a bit dry. Friendly, never boastful. The odd Norwegian word.',
    lines: [
      ['dawn', '', 'Early. The sea is doing its quiet thing.'],
      ['', '', 'Five minutes outside. Best meeting of the day.'],
      ['morning midday afternoon', '', 'Hei. Lovely day for it, whatever it is.'],
      ['morning', '', 'Good light for thinking. And for croissants.'],
      ['morning midday', 'bench', 'Odile knows everyone. Now she knows me too.'],
      ['midday', '', 'Noon. The town smells of bread and sea.'],
      ['', 'home', 'At the desk, window open. The gulls supervise.'],
      ['', 'stroll', 'One lap of the promenade, then back to the desk.'],
      ['', 'post', 'Letters in, letters out. The post office hums along.'],
      ['morning', 'cafe', 'God morgen, Marcel. Just a coffee. And maybe that.'],
      ['morning', 'cafe', 'Window seat. I like watching the town wake up.'],
      ['morning', 'wander', 'The bakery queue. Everyone says hei back now.'],
      ['', 'kiosk', 'Kiosk coffee. Lucie was right about this.'],
      ['afternoon', 'workshop', 'Through the window: sawdust, a radio, a happy builder.'],
      ['', 'workshop', 'I knock twice. He waves me in with a screwdriver.'],
      ['midday', 'cafe', 'Lunch outside. Up north we never waste a sunny day.'],
      ['midday afternoon', 'bench', 'I came out for five minutes. That was a while ago.'],
      ['afternoon', '', 'Henri says the lemons like Tuesdays. I believe him.'],
      ['afternoon', 'wander', 'Walking helps me think. The promenade is the right length.'],
      ['golden', '', 'This light. I keep meaning to get used to it.'],
      ['golden', 'wander', 'Golden hour on the promenade. Everyone walks slower.'],
      ['blue night', 'bench', 'From this bench you can watch every lamp come on.'],
      ['night', 'bench', 'Music from the terrace. Somewhere Henri is tapping his foot.'],
      ['night', '', 'Camille and Théo are dancing again. Good for them.'],
      ['golden sunset', 'railing', 'The sky is showing off. I will allow it.'],
      ['', 'railing', 'Takk for i dag, sun.'],
      ['blue', '', 'The windows are coming on. I know whose is whose now.'],
      ['night', '', 'Nydelig. That is all.'],
      ['night', 'goinghome', 'God natt, Marcel. Same table tomorrow.'],
      ['late', '', 'Quiet street, one lit workshop. Good company.'],
    ],
    refs: [
      ['', 'post', 'The post office never closes. I find that very calming.'],
      ['', 'post wander', 'MCP Emails is email for AI agents. They write politely.'],
      ['', 'arcade', 'Fun Libs. Made it at seventeen. People still fill in the blanks.'],
      ['', 'workshop', 'Toolrails is coming along. The builder hums when it goes well.'],
      ['golden sunset blue night late', '', 'Harbor is resting for now. I left the reading lamp on.'],
      ['', 'cafe bench', 'Albretsen AS is mostly a desk, a coffee and this view.'],
    ],
  },

  visitor: {
    name: 'A visitor',
    voice: 'Polite and delighted, happily a little lost.',
    lines: [
      ['', 'wander', 'Just passing through. Slowly, on purpose.'],
      ['morning', '', 'Bonjour! Is the bakery that way? It smells that way.'],
      ['', '', 'Have you tried the kiosk coffee? Wonderful.'],
      ['', '', 'I come down every day for this view.'],
      ['morning midday', 'bench', 'Is it always this calm? How lovely.'],
      ['', 'wander', 'I asked for directions. I got directions and a fig.'],
      ['golden', '', 'Lovely evening for it.'],
      ['golden sunset', 'railing phone', 'Taking a picture of the sunset. Again.'],
      ['', 'wander', 'Somebody waved at me. I waved back. Lovely town.'],
      ['night blue', 'dancing', 'On holiday, I dance. Badly and happily.'],
      ['night', '', 'The string lights! I could stay all summer.'],
      ['midday', '', 'I ordered a coffee and got a story about lemons. Wonderful.'],
      ['afternoon', '', 'I came for a day. I have stayed a week.'],
      ['sunset', 'railing', 'Everyone goes quiet at the same moment. Lovely.'],
      ['blue', '', 'The lamps come on one by one. Like a welcome.'],
    ],
    refs: [
      ['', '', 'A post office open all night! For agents, apparently.'],
      ['afternoon golden', '', 'The arcade has a word game. I wrote "splendid" twice.'],
    ],
  },

  neighbour: {
    name: 'A neighbour',
    voice: 'An old friend of Henri\'s from up by the church. Content, unhurried.',
    lines: [
      ['', 'bench', 'Henri has the good bench. He earned it.'],
      ['morning', 'bench', 'The paper says sunshine. I came down to check.'],
      ['golden sunset', 'bench', 'Same sunset, different every time.'],
      ['', '', 'The church bell and the café cups. My two clocks.'],
      ['', 'bench', 'I knew this bench when it was green.'],
      ['midday', 'wander', 'Down for the bread, staying for the sun.'],
      ['midday afternoon', '', 'Henri waves with his newspaper. I wave with mine.'],
      ['blue', 'bench', 'The lamps are on. One more look, then home.'],
    ],
    refs: [
      ['golden sunset blue night late', '', 'The library lamp is still on. I like that.'],
    ],
  },

  runner: {
    name: 'A runner',
    voice: 'Cheerful and out of breath.',
    lines: [
      ['dawn morning', 'running', 'Morning! Lovely morning! Still running!'],
      ['golden', 'running', 'Inès is faster. I get more of the view.'],
      ['', 'railing', 'Made it for the sunset.'],
      ['dawn morning', '', 'Two laps, then pancakes.'],
      ['dawn morning', 'running', 'Good morning, gulls! Good morning, bakery!'],
      ['golden', 'running', 'Last lap! Then the railing!'],
      ['sunset', 'railing', 'Legs tired, heart full. Look at that.'],
    ],
    refs: [],
  },

  kid: {
    name: 'A kid',
    voice: 'Léo\'s best friend. Always half a lap behind him.',
    lines: [
      ['', 'playing', 'Léo! Wait for me!'],
      ['', '', 'Has anyone seen Léo? He has our ball.'],
      ['', '', 'We are building a sandcastle bigger than the café.'],
      ['', '', 'Léo says the fountain fish is called Paul.'],
      ['', '', 'We counted the boats. Seven! Léo says eight.'],
      ['morning midday', 'playing', 'Catch me! No, wait, I am catching you!'],
    ],
    refs: [],
  },
};

// Two-person exchanges: [speaker, replier, when, activity, line, reply, ref?].
// The speaker is the one you clicked; the reply comes from someone nearby.
const X = [
  ['marcel', 'henri', 'midday', 'serving', 'Un café, Henri. Small, strong, as always.', 'You know me too well, Marcel.'],
  ['henri', 'marcel', 'midday', 'cafe', 'Un café, Marcel. Small. Strong.', 'Already on its way, Henri.'],
  ['henri', 'odile', 'afternoon', 'bench', 'Seven down, "dusk", four letters.', 'Soir, darling. It is always soir.'],
  ['odile', 'henri', 'morning', 'stroll', 'Henri, your hat.', 'Merci, ma chérie. Where would I be.'],
  ['odile', 'henri', 'golden sunset', 'bench', 'Every evening, like a theatre.', 'And we always get the best seats.'],
  ['odile', 'ines', 'dawn morning', '', 'Inès! Running again!', 'Two laps, Odile! Then a croissant!'],
  ['camille', 'leo', 'golden sunset', '', 'Five more minutes, then bath.', 'Five big minutes or five small ones?'],
  ['leo', 'camille', 'midday', 'cafe', 'Can I have a citron pressé?', 'With a straw and a please, yes.'],
  ['theo', 'camille', 'golden sunset', 'railing', 'Camille! Come and see this!', 'I am right here, Théo. It is beautiful.'],
  ['camille', 'theo', 'night', 'dancing', 'Théo, you promised.', 'I never promised. But here I am.'],
  ['theo', 'camille', 'blue night', 'rose', 'To us. And to sleeping children.', 'To us. Clink.'],
  ['lucie', 'henri', 'morning', 'cycling', 'Ding ding! Bonjour, Henri!', 'Bonjour, Lucie! Bonjour, baguette!'],
  ['yusuf', 'odile', 'morning', 'dogwalk', 'Biscuit wants to say good morning.', 'Good morning, Biscuit! What a gentleman.'],
  ['yusuf', 'biscuit', '', 'railing', 'Biscuit, sit. Watch the sun.', '(Biscuit sits. Biscuit watches.)'],
  ['yusuf', 'lucie', '', 'dogwalk', 'Biscuit loves your bell, Lucie.', 'Ding! For Biscuit, two dings.'],
  ['ines', 'marcel', 'morning', 'cafe', 'Croissant first, emails later.', 'The croissant agrees, mademoiselle.'],
  ['marcel', 'ines', 'morning', 'serving', 'Grand crème, Inès?', 'You read my mind, Marcel.'],
  ['marcel', 'builder', 'night', 'serving setup', 'Still working? I will leave the lamp on.', 'Merci, Marcel. One more commit.'],
  ['visitor', 'marcel', 'blue night', '', 'Is the café still open?', 'For you, always. Come, sit.'],
  ['lucie', 'ines', '', 'dancing', 'Inès! This one is our song!', 'They are all our song!'],
  ['henri', 'odile', 'midday', 'cafe', 'The tarte, Odile?', 'Half for you, half for me. As always.'],
  ['camille', 'theo', 'sunset blue', 'rose', 'Santé, mon cœur.', 'Santé. To quiet houses.'],
  ['builder', 'marcel', 'midday', 'cafe', 'One espresso, Marcel.', 'Already poured, mon ami.'],
  ['leo', 'kid', 'morning midday afternoon', 'playing', 'Race you round the fountain!', 'Wait for me! Okay, go!'],
  ['kid', 'leo', '', 'playing', 'Léo! Wait for me!', 'I am waiting! Very fast waiting!'],
  ['marcel', 'asgeir', 'morning', 'serving', 'The window seat, monsieur?', 'Takk, Marcel. You remembered.'],
  // Asgeir and the town.
  ['asgeir', 'marcel', 'morning', 'cafe', 'God morgen, Marcel.', 'Bonjour, Asgeir! Black, window seat?'],
  ['asgeir', 'henri', 'morning afternoon', '', 'How are the lemons today, Henri?', 'Thriving. Like everyone on this promenade.'],
  ['asgeir', 'leo', '', '', 'Ten laps, Léo?', 'Eleven! Do you want to race?'],
  ['leo', 'asgeir', 'afternoon golden', '', 'Asgeir, how do the lamps know it is dark?', 'They watch the sun. Same as us.'],
  ['odile', 'asgeir', '', '', 'Asgeir! You look well. Have you eaten?', 'Twice, Odile. Marcel insisted.'],
  ['henri', 'asgeir', 'morning midday', 'bench', 'Young man, the bench is free.', 'Takk, Henri. I have sat at a desk all morning. I will stand.'],
  ['theo', 'asgeir', 'morning', 'wander', 'Asgeir, this baguette. Feel it. Still warm.', 'That is a very good baguette, Théo.'],
  ['lucie', 'asgeir', 'morning', '', 'Morning, Asgeir! Coffee at the kiosk?', 'Always. You were right about it.'],
  ['ines', 'asgeir', 'dawn morning', 'running', 'Morning, Asgeir! One lap with me?', 'Tomorrow. I say that every day.'],
  ['asgeir', 'yusuf', '', '', 'Hei, Biscuit. Hei, Yusuf.', 'He says hei back. With the tail.'],
  ['builder', 'asgeir', '', 'workshop', 'Want to see what I did today?', 'Always. Show me the small bits too.'],
  ['asgeir', 'builder', 'golden sunset', 'railing', 'Ten minutes off?', 'Ten minutes. The sunset does not wait.'],
  ['builder', 'asgeir', 'golden sunset', 'railing', 'Evening, Asgeir. Good one tonight.', 'You say that every night. You are always right.'],
  ['asgeir', 'henri', 'morning midday', 'bench', 'Henri, Odile. How is the crossword going?', 'One word left. You can have it.'],
  // Rarer exchanges about the products.
  ['asgeir', 'builder', 'blue night late', '', 'Lamp still on?', 'Always. Toolrails is coming along.', true],
  ['theo', 'marcel', 'midday', 'cafe', 'Is it true the post office does email for robots?', 'Oui. Open all night. Very polite robots.', true],
  ['leo', 'asgeir', '', '', 'Did you really make Fun Libs?', 'At seventeen. You fill in the funny bits.', true],
  ['odile', 'henri', 'sunset blue night', 'bench', 'The library is closed, but the lamp is on.', 'Resting, not gone. Like us after lunch.', true],
];

export const EXCHANGES = X.map(([a, b, when, act, line, reply, ref]) => ({ a, b, when, act, line, reply, ref: !!ref }));

export const REF_RATE = 1 / 8;      // share of picks that may be about Asgeir or his products
export const EXCHANGE_RATE = 0.45;  // when someone suitable is nearby, how often they answer
const RECENT_MAX = 80;

const has = (list, v) => !list || list.split(' ').includes(v);
const fits = (when, act, phase, activity) => has(when, phase) && (act ? act.split(' ').includes(activity) : true);

function weighted(items, weight, rand) {
  let total = 0;
  for (const it of items) total += weight(it);
  let r = rand() * total;
  for (const it of items) { r -= weight(it); if (r < 0) return it; }
  return items[items.length - 1];
}

function remember(recent, key) {
  if (!recent) return;
  recent.delete(key); recent.add(key);
  while (recent.size > RECENT_MAX) recent.delete(recent.values().next().value);
}

// Candidate lines in falling order of fit: right time and activity (or none named), timeless and
// general, then right time with another activity (so nobody on a bench talks about their coffee
// while a general line would do).
// A ref is rare and only said where it fits: the first two tiers, never a line for another activity
// (Henri at a café table at noon used to get his evening bench line about the library lamp).
// The last resort names this phase outright before it falls back to a timeless line for elsewhere.
function candidates(rows, phase, activity, ref = false) {
  const tiers = [
    rows.filter(([w, a]) => fits(w, a, phase, activity)),
    rows.filter(([w, a]) => !w && !a),
    ...(ref ? [] : [rows.filter(([w]) => w && has(w, phase)), rows.filter(([w]) => !w)]),
  ];
  return tiers.find((t) => t.length) || [];
}

/**
 * Pick something for `id` to say.
 * @param {string} id  character id from cast.js ('henri', 'builder', 'x3'...) or 'asgeir', 'biscuit'.
 * @param {object} ctx { hour, phase?, activity?, nearby?: string[], recent?: Set<string>, rand?: () => number }
 *   `recent` is updated in place, so repeated clicks walk through fresh lines.
 * @returns {{ id: string, text: string, reply: { id: string, text: string } | null, ref: boolean } | null}
 */
export function pick(id, ctx = {}) {
  const key = resolveId(id);
  const entry = DIALOG[key];
  if (!entry) return null;
  const rand = ctx.rand || Math.random;
  const recent = ctx.recent;
  const phase = ctx.phase && PHASES.includes(ctx.phase) ? ctx.phase : phaseOf(ctx.hour ?? 12);
  const activity = ctx.activity;
  const wantRef = rand() < REF_RATE;

  // A two-person exchange, if the right someone is close by.
  const near = new Map();
  for (const n of ctx.nearby || []) if (n !== id && !near.has(resolveId(n))) near.set(resolveId(n), n);
  const ex = EXCHANGES.filter((e) => e.a === key && near.has(e.b) && e.ref === wantRef
    && fits(e.when, e.act, phase, activity) && !recent?.has(e.line));
  if (ex.length && rand() < EXCHANGE_RATE) {
    const e = weighted(ex, (x) => 1 + (x.when ? 1 : 0) + (x.act ? 2 : 0), rand);
    remember(recent, e.line); remember(recent, e.reply);
    return { id, text: e.line, reply: { id: near.get(e.b), text: e.reply }, ref: e.ref };
  }

  let ref = wantRef;
  let pool = candidates(ref ? entry.refs : entry.lines, phase, activity, ref);
  if (ref && !pool.length) { ref = false; pool = candidates(entry.lines, phase, activity); }
  if (!pool.length) return null;
  let fresh = recent ? pool.filter((r) => !recent.has(r[2])) : pool;
  // the best-fitting lines are all said: something general and fresh, before anything repeats
  if (!fresh.length && recent) fresh = (ref ? entry.refs : entry.lines).filter(([w, a, t]) => !w && !a && !recent.has(t));
  if (!fresh.length) {
    // Everything here has been said: start this pool over, but not with the line just said.
    const last = [...recent].pop();
    for (const r of pool) recent.delete(r[2]);
    fresh = pool.length > 1 ? pool.filter((r) => r[2] !== last) : pool;
  }
  const row = weighted(fresh, ([w, a]) => 1 + (w ? 1 : 0) + (a ? 2 : 0), rand);
  remember(recent, row[2]);
  return { id, text: row[2], reply: null, ref };
}
