import type { AthChartCopy } from '@/components/AthChart'

/** Rich content blocks, for posts that need more than a run of paragraphs. */
export type Block =
  | { k: 'lead'; t: string }
  | { k: 'p'; t: string }
  | { k: 'h2'; t: string }
  | { k: 'pull'; t: string }
  | { k: 'chart' }
  | { k: 'list'; items: string[] }
  | { k: 'table'; head: string[]; rows: string[][]; caption: string }
  | { k: 'note'; t: string }

/** A translated version of a post: everything a reader sees, in one language. */
export type Translation = {
  label: string
  title: string
  excerpt: string
  dateLabel: string
  tags: string[]
  blocks: Block[]
  chart: AthChartCopy
}

const PRESETS: AthChartCopy['presets'] = [
  { label: '1871', year: 'first' },
  { label: '1928', year: 1928 },
  { label: '1950', year: 1950 },
  { label: '1980', year: 1980 },
  { label: '2000', year: 2000 },
  { label: '2016', year: 2016 },
]

export const CHART_EN: AthChartCopy = {
  eyebrow: 'Interactive',
  title: 'S&P Composite, 1871–2026',
  hint: 'Move the start year. The axes refit to whatever is left. Watch how little the shape changes.',
  startLabel: 'Start year',
  presets: PRESETS,
  seriesLabel: 'Measure',
  series: { nominal: 'Nominal', real: 'Inflation-adjusted', tr: 'Total return' },
  seriesNote: {
    nominal: 'The index level as quoted in the headlines.',
    real: 'The same price in August-2026 dollars.',
    tr: 'Dividends reinvested and inflation removed. January 1871 = 100.',
  },
  scaleLabel: 'Axis',
  scale: { lin: 'Linear', log: 'Logarithmic' },
  scaleNote: {
    lin: 'Equal point moves take equal space, so growth late in the series looks explosive.',
    log: 'Equal percentage moves take equal space. The curve turns into a steady slope.',
  },
  recordsLegend: 'Months that closed higher than every other month in view',
  stats: { window: 'Window', growth: 'Growth', annual: 'Annualised', records: 'Months at a new high' },
  windowUnit: 'years',
  tooltipRecord: 'Record',
  source:
    'Source: Robert J. Shiller’s long-run US stock market dataset, monthly observations, January 1871 – August 2026. Prices are monthly averages of daily closes.',
  a11y:
    'Line chart of the S&P Composite from the selected start year to 2026, with the months that set new highs marked.',
}

export const EN_BLOCKS: Block[] = [
  {
    k: 'lead',
    t: 'Every few weeks a headline announces that the S&P 500 has closed at an all-time high, and somebody decides to wait. Wait for a dip, wait for the froth to come off, wait for a level that feels less like the top. The instinct sounds reasonable. It just rests on a mistaken picture of what a record is.',
  },
  { k: 'h2', t: 'A record is the normal state of a rising line' },
  {
    k: 'p',
    t: 'Start from the economy rather than the chart. A stock index is a claim on the earnings of a few hundred companies. Those companies retain part of what they earn and reinvest it. The population they sell to grows. Output per hour worked grows. And on top of all of that, central banks deliberately aim for prices to rise by about two percent a year, forever — which means the same real earnings are counted in more dollars with every year that passes.',
  },
  {
    k: 'p',
    t: 'Put those together and the index has an upward drift built in. Not a guarantee about any given year; a drift. And here is the part that gets skipped: a line that drifts upward spends most of its life at the highest point it has ever reached. It has to. The only way for a rising line not to be at a record is for it to be climbing back out of a fall — and the falls are the interruption, not the baseline.',
  },
  { k: 'pull', t: 'Records are not the exception in a growing market. Drawdowns are.' },
  {
    k: 'p',
    t: 'Nominal US GDP sets a record in most quarters. Nobody writes about it, because everyone understands that a growing economy producing a record amount of output is an ordinary Tuesday. The index is exactly the same fact, measured to more decimal places and delivered with more adrenaline.',
  },
  { k: 'h2', t: 'Every window looks the same' },
  {
    k: 'p',
    t: 'The chart below is the S&P Composite from 1871 to today, measured monthly. Drag the start year and the view refits to whatever is left. Shave off the first century. Then the next fifty years. Then start it the year you were born.',
  },
  { k: 'chart' },
  {
    k: 'p',
    t: 'The shape survives every cut. Whichever decade you start from, you get the same picture: a line that climbs to the right, appears to climb faster the further out it goes, and is dotted with the months where it stood higher than it ever had. The dots are not rare events. They are most of what the line does.',
  },
  {
    k: 'p',
    t: 'The share of months at a new high actually rises as the window shortens: 18 % of all months since 1871, 31 % since 1950, roughly half over the past ten years. Partly that is because a short window has a lower bar to clear. Mostly it is because the further you are from the last crash, the more of the sample sits above everything that came before.',
  },
  { k: 'h2', t: 'The acceleration is an illusion, and that is the whole point' },
  {
    k: 'p',
    t: 'Now switch the chart to a logarithmic axis. The curve straightens into something close to a line.',
  },
  {
    k: 'p',
    t: 'That is the tell. On an ordinary, linear axis, equal percentage gains draw bigger and bigger steps, because 10 % of 5,000 is a hundred times the points that 10 % of 50 was. The “faster and faster” rise is not the market accelerating. It is the same rate of growth, drawn against a bigger number. On a logarithmic axis, where equal percentage moves take equal vertical space, the acceleration disappears and a steady slope shows up in its place.',
  },
  {
    k: 'pull',
    t: 'Nothing is speeding up. The percentage is constant and the base is enormous — that is what compounding looks like on the wrong axis.',
  },
  {
    k: 'p',
    t: 'Which is why a record number, on its own, tells you nothing about whether the market is expensive. The level is the accumulated product of every prior year of growth. It has to be the largest number in the series; that is the only thing a compounding series can produce. Standing at 7,000 rather than 700 says something about how long compounding has been running, not about what you are paying for a dollar of earnings. Read a record as information and you have mistaken the arithmetic of compounding for news.',
  },
  { k: 'h2', t: 'To care about a record is to make a forecast' },
  {
    k: 'p',
    t: 'Here is the part worth being precise about. An all-time high is a fact about the past and nothing else: today’s price is above every previous price. That sentence contains no information about tomorrow — unless you add an assumption that the level a series has reached tells you something about where it goes next.',
  },
  {
    k: 'p',
    t: 'That assumption is a forecast, and it is a very specific one: past prices predict future returns. Anyone who sells or waits because of a record is making that forecast — usually without noticing that they have made one.',
  },
  {
    k: 'p',
    t: 'It is a testable claim, so test it. Using the same 1871–2026 monthly series, split every month into two piles: the ones that set a record and the ones that did not. Then look at what the following twelve months delivered, in real total return.',
  },
  {
    k: 'table',
    head: ['Twelve months after …', 'Median real total return', 'Ended lower'],
    rows: [
      ['A month that set a record', '+9.4 %', '30.0 %'],
      ['Any other month', '+8.7 %', '30.5 %'],
    ],
    caption:
      '1,856 overlapping twelve-month windows, January 1871 – August 2025. 327 of the starting months set a record; 1,529 did not.',
  },
  {
    k: 'p',
    t: 'There is no penalty. If anything the record months came out marginally ahead, and lost money slightly less often. The historic data does get consulted here — and it says the opposite of what the person invoking it believes.',
  },
  { k: 'h2', t: 'What a record actually tells you' },
  {
    k: 'p',
    t: 'It tells you one thing, and it points backwards: nothing bad has happened lately. Records arrive in clusters, because they can only occur when the market is not climbing back out of something. Long stretches without one are not calm — they are the aftermath. The S&P went 299 months, from September 1929 to September 1954, without a new nominal high. Twenty-five years. That drought is the thing that deserves respect, and you will notice it is not a record that causes it.',
  },
  { k: 'h2', t: 'The honest caveats' },
  { k: 'p', t: 'Three of them, so this does not read as a sales pitch.' },
  {
    k: 'list',
    items: [
      'Much of the record-setting is inflation. Switch the chart to inflation-adjusted: the same series sets a record in only about a tenth of its months, and the real price is up roughly 64× since 1871, against 1,700× nominal. Nominal records are partly just the money shrinking.',
      '“Records are normal” is not the same as “valuation does not matter.” What you pay relative to earnings has historically mattered a great deal for long-run returns. It just is not measured by the index level. Price-to-earnings is a ratio; the record is a number. They are not the same instrument.',
      'None of this says the next twelve months will be good. It says the record itself is not the reason to think they will not be. The real risk lives in your time horizon, in whether you can sit through a 50 % drawdown without selling, and in what you pay in fees — not in the headline.',
    ],
  },
  { k: 'h2', t: 'So' },
  {
    k: 'p',
    t: 'A record high is what a growing economy looks like when you plot it. It shows up every few weeks, it has shown up in every historical window you can cut, and it has never been a signal in the data. Treating it as one means quietly betting that past prices forecast future prices — a bet the past itself declines to support.',
  },
  { k: 'p', t: 'There are good reasons to be careful with money. This is not one of them.' },
  {
    k: 'note',
    t: 'Not investment advice. This is a piece about how a chart behaves, written by a software developer, not a licensed adviser. Every figure in the text is computed from the dataset sitting under the chart.',
  },
]

export const CHART_NB: AthChartCopy = {
  eyebrow: 'Interaktivt',
  title: 'S&P Composite, 1871–2026',
  hint: 'Flytt startåret. Aksene tilpasser seg det som er igjen. Legg merke til hvor lite formen endrer seg.',
  startLabel: 'Startår',
  presets: PRESETS,
  seriesLabel: 'Måling',
  series: { nominal: 'Nominelt', real: 'Inflasjonsjustert', tr: 'Totalavkastning' },
  seriesNote: {
    nominal: 'Indeksnivået slik det står i overskriftene.',
    real: 'Den samme kursen målt i dollar fra august 2026.',
    tr: 'Utbytte reinvestert og inflasjon fjernet. Januar 1871 = 100.',
  },
  scaleLabel: 'Akse',
  scale: { lin: 'Lineær', log: 'Logaritmisk' },
  scaleNote: {
    lin: 'Like store poengbevegelser tar like mye plass, så vekst sent i serien ser eksplosiv ut.',
    log: 'Like store prosentbevegelser tar like mye plass. Kurven blir til en jevn helning.',
  },
  recordsLegend: 'Måneder som endte høyere enn alle andre måneder i utsnittet',
  stats: { window: 'Utsnitt', growth: 'Vekst', annual: 'Årlig', records: 'Måneder på ny topp' },
  windowUnit: 'år',
  tooltipRecord: 'Rekord',
  source:
    'Kilde: Robert J. Shillers lange datasett for det amerikanske aksjemarkedet, månedlige observasjoner, januar 1871 – august 2026. Kursene er månedsgjennomsnitt av daglige sluttkurser.',
  a11y:
    'Linjediagram over S&P Composite fra valgt startår til 2026, med månedene som satte ny toppnotering markert.',
}

export const NB_BLOCKS: Block[] = [
    {
      k: 'lead',
      t: 'Med noen ukers mellomrom melder en overskrift at S&P 500 har stengt på all-time high, og noen bestemmer seg for å vente. Vente på et fall, vente på at skummet legger seg, vente på et nivå som føles mindre som toppen. Instinktet høres fornuftig ut. Det bygger bare på en feil forestilling om hva en rekord er.',
    },
    { k: 'h2', t: 'En rekord er normaltilstanden til en kurve som stiger' },
    {
      k: 'p',
      t: 'Begynn med økonomien i stedet for grafen. En aksjeindeks er et krav på inntjeningen til noen hundre selskaper. Selskapene beholder en del av det de tjener og investerer det på nytt. Befolkningen de selger til vokser. Produksjonen per arbeidstime vokser. Og på toppen av alt dette styrer sentralbankene bevisst mot at prisene skal stige med rundt to prosent i året, for all framtid — som betyr at den samme reelle inntjeningen telles i flere kroner for hvert år som går.',
    },
    {
      k: 'p',
      t: 'Legger du det sammen, har indeksen en oppdrift innebygd. Ikke en garanti for et enkelt år; en drift. Og her er delen som hoppes over: en kurve som driver oppover, tilbringer mesteparten av tiden på det høyeste nivået den noen gang har vært på. Den må det. Den eneste måten en stigende kurve kan la være å stå på topp, er at den holder på å hente seg inn etter et fall — og fallene er avbruddet, ikke normalen.',
    },
    { k: 'pull', t: 'Rekorder er ikke unntaket i et marked som vokser. Fallene er det.' },
    {
      k: 'p',
      t: 'Nominelt BNP i USA setter rekord de fleste kvartaler. Ingen skriver om det, fordi alle skjønner at en økonomi i vekst som produserer rekordmye, er en helt vanlig tirsdag. Indeksen er nøyaktig det samme faktumet, bare målt med flere desimaler og servert med mer adrenalin.',
    },
    { k: 'h2', t: 'Hvert eneste utsnitt ser likt ut' },
    {
      k: 'p',
      t: 'Grafen under viser S&P Composite fra 1871 til i dag, målt månedlig. Dra i startåret, så tilpasser visningen seg til det som blir igjen. Skjær vekk det første århundret. Så de neste femti årene. Så start i året du ble født.',
    },
    { k: 'chart' },
    {
      k: 'p',
      t: 'Formen overlever hvert eneste kutt. Uansett hvilket tiår du starter fra, får du det samme bildet: en kurve som klatrer mot høyre, som ser ut til å klatre raskere jo lenger ut den kommer, og som er prikket med månedene der den sto høyere enn den noen gang hadde stått. Prikkene er ikke sjeldne hendelser. De er det meste av det kurven gjør.',
    },
    {
      k: 'p',
      t: 'Andelen måneder med ny toppnotering går faktisk opp jo kortere utsnittet er: 18 % av alle måneder siden 1871, 31 % siden 1950, omtrent halvparten det siste tiåret. Delvis er det fordi et kort utsnitt har en lavere terskel å passere. Mest er det fordi jo lenger unna forrige krakk du er, desto større del av utvalget ligger over alt som kom før.',
    },
    { k: 'h2', t: 'Akselerasjonen er en illusjon, og det er hele poenget' },
    {
      k: 'p',
      t: 'Bytt nå grafen til logaritmisk akse. Kurven retter seg ut til noe som ligner en rett linje.',
    },
    {
      k: 'p',
      t: 'Der ligger forklaringen. På en vanlig, lineær akse tegner like prosentvise gevinster stadig større steg, fordi 10 % av 5 000 er hundre ganger så mange poeng som 10 % av 50. Den «raskere og raskere» stigningen er ikke markedet som akselererer. Det er den samme veksttakten, tegnet mot et større tall. På en logaritmisk akse, der like prosentvise bevegelser tar like mye plass loddrett, forsvinner akselerasjonen, og en jevn helning trer fram i stedet.',
    },
    {
      k: 'pull',
      t: 'Ingenting går fortere. Prosenten er konstant og grunnlaget er enormt — det er slik renters rente ser ut på feil akse.',
    },
    {
      k: 'p',
      t: 'Og derfor sier et rekordtall i seg selv ingenting om hvorvidt markedet er dyrt. Nivået er det akkumulerte produktet av veksten i hvert eneste år som har vært. Det må være det største tallet i serien; det er det eneste en serie med renters rente kan produsere. Å stå i 7 000 i stedet for 700 sier noe om hvor lenge renters rente har fått virke, ikke noe om hva du betaler for en krone inntjening. Leser du en rekord som informasjon, har du forvekslet regnestykket bak renters rente med en nyhet.',
    },
    { k: 'h2', t: 'Å bry seg om en rekord er å komme med en spådom' },
    {
      k: 'p',
      t: 'Her er det verdt å være presis. En all-time high er et faktum om fortiden og ingenting annet: dagens kurs er høyere enn alle tidligere kurser. Den setningen inneholder ingen informasjon om morgendagen — med mindre du legger til en antakelse om at nivået en serie har nådd, forteller deg noe om hvor den går videre.',
    },
    {
      k: 'p',
      t: 'Den antakelsen er en spådom, og en svært bestemt en: historiske kurser forutsier framtidig avkastning. Alle som selger eller venter på grunn av en rekord, spår nettopp dette — som regel uten å merke at de har spådd noe som helst.',
    },
    {
      k: 'p',
      t: 'Påstanden kan testes, så la oss teste den. Bruk den samme månedsserien fra 1871 til 2026 og del alle månedene i to hauger: de som satte rekord, og de som ikke gjorde det. Se så på hva de neste tolv månedene ga, målt i reell totalavkastning.',
    },
    {
      k: 'table',
      head: ['Tolv måneder etter …', 'Median reell totalavkastning', 'Endte lavere'],
      rows: [
        ['En måned som satte rekord', '+9,4 %', '30,0 %'],
        ['Enhver annen måned', '+8,7 %', '30,5 %'],
      ],
      caption:
        '1 856 overlappende tolvmånedersvinduer, januar 1871 – august 2025. 327 av startmånedene satte rekord, 1 529 gjorde det ikke.',
    },
    {
      k: 'p',
      t: 'Det finnes ingen straff. Om noe kom rekordmånedene marginalt best ut, og de gikk i minus litt sjeldnere. De historiske dataene blir faktisk konsultert her — og de sier det motsatte av det den som viser til dem, tror.',
    },
    { k: 'h2', t: 'Hva en rekord faktisk forteller deg' },
    {
      k: 'p',
      t: 'Den forteller deg én ting, og den peker bakover: det har ikke skjedd noe ille i det siste. Rekorder kommer i klynger, fordi de bare kan oppstå når markedet ikke holder på å hente seg inn etter noe. Lange perioder uten rekord er ikke rolige — de er etterspillet. S&P gikk 299 måneder, fra september 1929 til september 1954, uten en ny nominell topp. Tjuefem år. Det er tørkeperioden som fortjener respekt, og du legger merke til at det ikke er noen rekord som forårsaker den.',
    },
    { k: 'h2', t: 'De ærlige forbeholdene' },
    { k: 'p', t: 'Tre av dem, så dette ikke leses som en salgspitch.' },
    {
      k: 'list',
      items: [
        'Mye av rekordsettingen er inflasjon. Bytt grafen til inflasjonsjustert: den samme serien setter rekord i bare rundt en tiendedel av månedene, og realprisen er opp omtrent 64 ganger siden 1871, mot 1 700 ganger nominelt. Nominelle rekorder er delvis bare penger som blir mindre verdt.',
        '«Rekorder er normalt» er ikke det samme som «prising spiller ingen rolle». Hva du betaler i forhold til inntjeningen, har historisk hatt mye å si for avkastningen på lang sikt. Det måles bare ikke av indeksnivået. Pris delt på inntjening er et forholdstall; rekorden er et tall. Det er ikke det samme måleinstrumentet.',
        'Ingenting av dette sier at de neste tolv månedene blir gode. Det sier at rekorden i seg selv ikke er grunnen til å tro at de ikke blir det. Den virkelige risikoen ligger i tidshorisonten din, i om du klarer å sitte gjennom et fall på 50 % uten å selge, og i hva du betaler i gebyrer — ikke i overskriften.',
      ],
    },
    { k: 'h2', t: 'Altså' },
    {
      k: 'p',
      t: 'En all-time high er hvordan en økonomi i vekst ser ut når du tegner den opp. Den dukker opp med noen ukers mellomrom, den har dukket opp i hvert eneste historiske utsnitt du kan skjære ut, og den har aldri vært et signal i dataene. Å behandle den som et signal er å vedde stilltiende på at historiske kurser forutsier framtidige kurser — et veddemål historien selv nekter å støtte.',
    },
    {
      k: 'p',
      t: 'Det finnes gode grunner til å være forsiktig med penger. Dette er ikke en av dem.',
    },
    {
      k: 'note',
      t: 'Ikke investeringsråd. Dette er en tekst om hvordan en graf oppfører seg, skrevet av en programvareutvikler, ikke av en autorisert rådgiver. Alle tall i teksten er regnet ut fra datasettet som ligger under grafen.',
    },
  ]
