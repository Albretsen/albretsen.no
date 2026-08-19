import { EN_BLOCKS, NB_BLOCKS, CHART_EN, CHART_NB, type Translation } from '@/lib/ath-post'

export type BlogPost = { slug: string; title: string; date: string; dateLabel: string; tags: string[]; excerpt: string; body: string[]; highlighted?: boolean; translations?: Translation[] }

export const posts: BlogPost[] = [
  {
    slug: 'stop-caring-about-all-time-highs', title: 'Stop caring about all-time highs', date: '2026-08-19', dateLabel: 'August 19, 2026', tags: ['Markets', 'Investing', 'Data'], highlighted: true,
    excerpt: 'In a growing economy a record is not a warning. It is what a rising line does on the way up — over and over, for as long as it rises.',
    // The rendered article comes from `translations`; `body` is the plain-text fallback
    // that the RSS feed and any future plain renderer can rely on.
    body: EN_BLOCKS.flatMap(block => (block.k === 'lead' || block.k === 'p' ? [block.t] : [])),
    translations: [
      { label: 'EN', dateLabel: 'August 19, 2026', tags: ['Markets', 'Investing', 'Data'], title: 'Stop caring about all-time highs', excerpt: 'In a growing economy a record is not a warning. It is what a rising line does on the way up — over and over, for as long as it rises.', blocks: EN_BLOCKS, chart: CHART_EN },
      { label: 'NO', dateLabel: '19. august 2026', tags: ['Marked', 'Investering', 'Data'], title: 'Slutt å bry deg om all-time high', excerpt: 'I en økonomi i vekst er en rekord ingen advarsel. Det er det en stigende kurve gjør på vei opp — igjen og igjen, så lenge den stiger.', blocks: NB_BLOCKS, chart: CHART_NB },
    ],
  },
  {
    slug: 'why-i-built-mcp-emails', title: 'Why I built MCP Emails', date: '2026-07-28', dateLabel: 'July 28, 2026', tags: ['MCP', 'AI', 'Products'], highlighted: true,
    excerpt: 'I got bored of writing emails to customers. MCP Emails is my attempt at making email a smaller part of my day without making support feel impersonal.',
    body: [
      'I got bored of writing emails to customers.',
      'Not because I dislike customers. Most of the time, the emails are reasonable: someone needs help getting started, something does not work as expected, a question comes up before they buy, or a customer wants to know whether a feature is planned.',
      'The problem was the shape of the work. An email arrives, I stop what I am doing, open the right product, find the context, write a reply, and then try to remember what I was working on before. Repeat that enough times and email starts taking up more of the day than it deserves.',
      'For a small product, this is easy to accept at first. You are grateful that people are using it. Every email feels important. It probably is important. But being responsive does not mean every reply needs to be written from scratch inside an inbox.',
      'I wanted a way to make customer email a smaller part of my day without making it feel impersonal. That is why I built MCP Emails.',
      'There are plenty of tools for email. There are help desks, shared inboxes, CRMs, AI writing assistants, automations, templates, and rules for almost any workflow. I did not want to set up a new support operation. I wanted less ceremony around a simple task: read an email, understand the context, send a good answer.',
      'The information I needed was usually somewhere else. A customer would ask about a subscription, an account, a feature, or a payment. The answer depended on product data, past conversations, internal notes, or what had changed recently. The inbox was only the start of the job. The actual work was switching between tools.',
      'You can put templates in a help desk. You can ask an AI tool to rewrite a draft. Neither solves the part where you still have to gather the information and decide what is true before you hit send. MCP Emails is built around that gap.',
      'MCP stands for Model Context Protocol. In practical terms, it is a way for an AI assistant to work with tools and data you choose to expose. For email, that matters because a useful answer is rarely just well-written. It has to be correct.',
      'If someone asks whether they can change their plan, the answer should reflect the current product. If they ask about an invoice, it should be based on their actual account. If they report a bug, the reply should include enough detail to move the conversation forward. The goal is not to hand your inbox over to a model and hope for the best. The goal is to make the right context available when you need it.',
      'That might mean finding a previous thread, checking a customer record, looking up an order, or pulling a relevant internal note before drafting a response. I still decide what gets sent. The difference is that getting to a useful draft should take minutes, not a string of tabs and searches.',
      '"AI support" often means a chatbot that tries to stop people from reaching a human. That can be useful in the right place, but it is not what I wanted to build. I wanted a better tool for the person who is already responsible for the reply.',
      'Customer emails are also one of the best sources of product information I have. They tell me where onboarding is unclear. They show me which words people use to describe the product. They expose the assumptions I made while building it. Sometimes a short email points directly at the next feature worth shipping.',
      'I do not want to remove that signal. I want to remove the busywork around it. A good support reply is often short. It might be a direct answer, a link, an apology, or a note that something has been fixed. Writing that answer should not require rebuilding the entire customer story in my head every time.',
      'MCP Emails started from a selfish requirement: I wanted to spend less time in email. If I have a limited number of focused hours in a day, I would rather use them to improve the product, fix an issue properly, or make something easier for every future customer.',
      'The standard is not full automation. The standard is a faster path to a response I would be comfortable sending under my own name. That means keeping the user in control, making sources and context visible, treating a draft as a draft, and being careful about permissions. An email tool only works if you trust it with a sensitive part of your business.',
      'Big companies can afford elaborate systems and dedicated support teams. Most small internet businesses cannot, and often do not need to. A founder might handle sales, support, product, marketing, bookkeeping, and a dozen other things in the same week. The tools should respect that reality.',
      'There is no grand theory behind it. I think email can be less annoying. I think better context makes replies better. And I think founders should be able to stay helpful without turning support into a full-time job.',
    ],
  },
  {
    slug: 'fun-libs-113000-installs', title: 'Fun Libs: 113,000 installs later', date: '2026-07-28', dateLabel: 'July 28, 2026', tags: ['Mobile', 'Indie', 'Products'], highlighted: true,
    excerpt: 'Fun Libs was the first thing I made that strangers actually used. I did not market it. I put it in the Play Store and it kept growing.',
    body: [
      'Fun Libs was the first thing I made that strangers actually used.',
      'Not friends being polite. Not someone I sent a link to. People I had never met found it in the Play Store, installed it, and kept using it.',
      'It has now passed 113,000 installs. I did not market it. There was no launch plan, no paid acquisition, no content calendar, and no clever growth loop. I put it out, it found a small place in search, and it kept growing.',
      'The app is deliberately simple. It is a Mad Libs-style game: fill in a few words, get a ridiculous story back. The idea is easy to explain, which is part of why I liked it. It did not need a deck or a long onboarding flow. You either understand it immediately or you do not.',
      'At the time, I was mostly trying to make something complete. Earlier projects were exercises: a page, a prototype, a feature I could show someone. Fun Libs had to stand on its own. Someone could find it on a random Tuesday, with no context from me, and decide in a few seconds whether it was worth keeping.',
      'When you build for yourself, you can fill gaps with your own knowledge. You know what the button does because you put it there. You know what the app is supposed to be because you remember the idea behind it. Real users do not have that advantage. If something is unclear, they leave. Usually without telling you why.',
      'The first installs made that concrete. I started looking at the app less as a thing I had made and more as a thing other people had to live with. Tiny details mattered more than I expected: wording, the order of screens, whether an interaction felt immediate, and whether there was anything worth coming back for once the novelty wore off.',
      'Most of that work was unglamorous. It was looking at something and admitting that it was slightly annoying.',
      'The organic growth also changed how I think about distribution. "Build it and they will come" is bad advice in general. Plenty of good things disappear because nobody sees them. But if a product has a clear purpose and sits where people are already looking for it, it can travel further than you expect.',
      'The Play Store is a real marketplace. People arrive with intent. They search for a category, compare a few options, and make a quick decision. Fun Libs benefited from being understandable in that environment. It is not trying to teach a new behaviour or explain a complicated business model. It offers a familiar kind of entertainment quickly.',
      'That did not make growth automatic. It gave me a reason to care about the unsexy basics: a clear name, honest screenshots, a description that says what the app is, and an experience that does not waste people’s time.',
      'Fun Libs makes money through ads and in-app purchases. It is not life-changing money. It is meaningful because it came from something I made, published, and maintained.',
      'There is a lot of noise around software businesses. Everything gets framed as a rocket ship, an exit, or a failure. I find that tiring. A project does not need to be enormous to be worth owning. A modest product with real users, some revenue, and low ongoing complexity is a good thing. It can teach you how customers behave. It can pay for itself. It can make the next project easier to start.',
      'Fun Libs did not grow because I had an audience. It grew because people found it useful or enjoyable enough to install. The end user does not care about your stack, your build-in-public thread, or your founder story. They care whether the thing works and whether it gives them what they came for.',
      'There are plenty of things I would do differently if I started it today. I would make some decisions faster. I would be more deliberate about what I measure and why. I would probably spend less time polishing details that only I could see. But I do not think the main lesson is "be more sophisticated."',
      'The main lesson is to finish things. Fun Libs was not the perfect idea. It was not a carefully validated opportunity. It was a small app I could build, release, and improve. Releasing it gave reality a chance to weigh in. That is where the interesting part started.',
      'Before users, every product idea exists in a protected environment. You can tell yourself it has potential forever. You can keep improving the plan. You can avoid the uncomfortable possibility that nobody wants it. Once it is public, you get a clearer answer. Sometimes the answer is silence. Sometimes it is a trickle of people you cannot explain. Occasionally, the trickle keeps going.',
      '113,000 installs is a number I am proud of, but it is not the only reason Fun Libs matters to me. It was the first project that made the internet feel less abstract. There are people somewhere opening something I built, filling in a few words, and laughing at the result. I do not know most of them. I never will. That is the point.',
    ],
  },
  {
    slug: 'personal-finance-should-be-boring', title: 'Personal finance should be boring', date: '2026-07-28', dateLabel: 'July 28, 2026', tags: ['Personal finance', 'Money'],
    excerpt: 'The interesting part is what a stable financial system lets you do with the rest of your time.',
    body: [
      'I like money. I like knowing where it goes, seeing a project make its first revenue, and watching an amount that used to feel hypothetical become real.',
      'That does not mean I want my personal finances to be entertaining.',
      'There is already enough entertainment around money. Every app wants another check-in. Every market move becomes a story. Someone is always making a strong case for a stock, a trade, a new rule, or a way to optimise the last 0.4% of a decision. It can feel productive because there is always something to read and something to adjust.',
      'Most of it is just attention being spent.',
      'I would rather have a system that does its job quietly. Income arrives. The important transfers happen. Bills are paid. Savings and investments continue without requiring a meeting with myself every Tuesday night. Boring is a feature.',
      'The first useful money decision is often a small one: decide what should happen on payday before the money reaches the account you use every day. It is much easier to save an amount automatically than to rely on a future version of yourself to decline every tempting purchase for the rest of the month. That future version of me has better things to do.',
      'This is not a case for never looking at your finances. I check mine. I want to understand the numbers and I think avoiding them is expensive in its own way. But there is a difference between paying attention and constantly intervening. A dashboard can be useful. Opening it ten times a day is not.',
      'The same goes for investing. If I need a complex explanation for every position I own, I have probably made the job too difficult. Complexity has a way of making people feel sophisticated while hiding the actual question: what am I trying to achieve, and what is the simplest reasonable path there?',
      'The answer will vary from person to person. Taxes vary. Risk tolerance varies. Time horizons vary. Life has a habit of changing the plan as well. I am not interested in prescribing one portfolio to everyone. I am interested in keeping the process understandable enough that it survives ordinary life.',
      'A financial setup should leave room for a bad month, an unexpected invoice, and a decision you did not plan for. If the whole thing only works when every input is perfect, it is not robust. It is a spreadsheet fantasy.',
      'That is why I think of personal finance as infrastructure. Good infrastructure is almost invisible. You notice it when it breaks; otherwise, it gives you freedom to focus elsewhere.',
      'For me, that elsewhere is building things. Side projects are more fun than rearranging a budget category. Fun Libs making money for the first time was more interesting than any discussion of whether coffee is a sensible expense. MCP Emails exists partly because I wanted less of my day to disappear into writing customer emails. A project that earns, saves time, or teaches me something useful has a direct effect on the options I have later.',
      'That does not make every project an investment. Most are not. Some will make nothing. Some will take longer than expected. Some will be good ideas that I execute badly. The financial basics should be sturdy enough that I can take sensible shots at work I care about without every experiment becoming an emergency.',
      'I think people occasionally confuse being careful with being joyless. They are different things. Being deliberate with money gives me more room to spend on the things I actually value. It lets me say yes to a trip, pay for a tool that saves time, or work on something with uncertain upside.',
      'The goal is not to make every purchase feel like a moral test. The goal is to make fewer decisions under pressure.',
      'There is a version of personal finance that treats every decision as a competition. Find the best card. Chase the highest rate. Move money across five accounts. Recalculate the plan whenever the news changes. Some people enjoy that. Fair enough.',
      'I do not want money management to become another job with no finish line. I want the important choices to be made deliberately, documented clearly, and revisited when something meaningful changes. The rest should run in the background.',
      'That is my definition of boring: a system reliable enough that I do not have to think about it constantly. It leaves more attention for the work, people, and projects that make life interesting.',
    ],
  },
]

export const getPost = (slug: string) => posts.find(post => post.slug === slug)
export const getHighlightedPosts = () => posts.filter(post => post.highlighted)
