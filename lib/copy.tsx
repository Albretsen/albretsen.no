import type { ReactNode } from 'react'

export type NavCopy = { services: string; projects: string; contact: string }

export type HeroIndex = { n: string; t: string; d: string; to: string }

export type HeroCopy = {
  metaLoc: string
  metaEst: string
  metaStatus: string
  headline: ReactNode[]
  byline: string
  ctaPrimary: string
  ctaSecondary: string
  indexLabel: string
  index: HeroIndex[]
}

export type ServiceItem = { n: string; icon: string; title: string; body: string }

export type ServicesCopy = {
  n: string; label: string; title: string; tag: string
  items: ServiceItem[]
}

export type ClientRow = { logo: string; name: string; kind: string; meta: string }

export type ClientsCopy = {
  n: string; label: string; title: string; tag: string
  note: string; rows: ClientRow[]
}

export type ProjectLink = { k: string; href: string; text: string }

export type ProjectRow = {
  n: string; kind: string; title: string; titleEm: string
  previewKind?: string; previewLang?: string
  image?: string; imageAlt?: string; imageCaption?: string; imageFit?: string
  body: string; tags: string[]; role: string; links: ProjectLink[]
}

export type ProjectsCopy = {
  n: string; label: string; title: string; tag: string
  rows: ProjectRow[]
}

export type Channel = { k: string; href: string | null; v: string }

export type FormCopy = {
  title: string; name: string; namePh: string
  email: string; emailPh: string; message: string; messagePh: string
  send: string; sending: string; sent: string; note: string
}

export type ContactCopy = {
  n: string; label: string; title: string; tag: string
  profileName: string; profileRole: string
  lead: string; mailState: string; mailHover: string; mailCopied: string
  channelsTitle: string; channels: Channel[]
  form: FormCopy
}

export type FooterLine = { kind: 'mail' | 'url'; text: string; href?: string }

export type FooterCopy = {
  mark: string; markSuffix: string; tagline: string
  colA: { k: string; lines: string[] }
  colB: { k: string; lines: FooterLine[] }
  colC: { k: string }
  fineLeft: string; fineRight: string
}

export type SiteCopy = {
  htmlLang: string
  nav: NavCopy
  themeToggleLabel: string
  hero: HeroCopy
  services: ServicesCopy
  clients: ClientsCopy
  projects: ProjectsCopy
  contact: ContactCopy
  footer: FooterCopy
}

export const COPY: Record<string, SiteCopy> = {
  no: {
    htmlLang: 'nb',
    nav: { services: 'Tjenester', projects: 'Prosjekter', contact: 'Kontakt' },
    themeToggleLabel: 'Bytt tema',
    hero: {
      metaLoc: 'Bergen, Norge',
      metaEst: 'Etablert 2021',
      metaStatus: 'Tar inn nye prosjekter',
      headline: ['Vi bygger ', <em key="e">programvare</em>, '.'],
      byline:
        'Albretsen AS er et lite programvarestudio i Bergen. Vi gjør konsulentarbeid for selskaper som Chess.com og GlobeTech, og bygger noen egne produkter ved siden av.',
      ctaPrimary: 'Se hva vi gjør',
      ctaSecondary: 'Ta kontakt',
      indexLabel: 'Innhold',
      index: [
        { n: '01', t: 'Tjenester', d: 'Hva vi tar på oss, og hvordan', to: 'services' },
        { n: '02', t: 'Kundene våre', d: 'Et utvalg vi har bygget for', to: 'clients' },
        { n: '03', t: 'Prosjekter', d: 'Egne ting ved siden av', to: 'projects' },
        { n: '04', t: 'Kontakt', d: 'En e-post, en idé, en kaffe', to: 'contact' },
      ],
    },
    services: {
      n: '01', label: 'Tjenester',
      title: 'Hva vi gjør.',
      tag: 'Fire områder',
      items: [
        {
          n: '01 / 04', icon: 'web',
          title: 'Nettsider og applikasjoner',
          body: 'Vi bygger nettsider og webapplikasjoner som faktisk er i drift, ikke bare designet pent. Fra første skisse til lansering og videre. Moderne stack (TypeScript, React, Phoenix, Rails) og en arkitektur som tåler å bli brukt.',
        },
        {
          n: '02 / 04', icon: 'mobile',
          title: 'Mobilapper',
          body: 'Native-følelse uten å vedlikeholde to kodebaser. Vi bruker React Native og Expo for klienter som vil ha én app for iOS og Android, og leverer hele veien: App Store, Google Play, push-varsler og det som ellers må fungere.',
        },
        {
          n: '03 / 04', icon: 'custom',
          title: 'Skreddersydde systemer',
          body: 'Interne verktøy, integrasjoner, backendsystemer og API-er. Programvare som passer akkurat den arbeidsflyten du har, i stedet for å bøye virksomheten etter et standardprodukt. Bygget for å være lett å forstå og lett å endre.',
        },
        {
          n: '04 / 04', icon: 'ai',
          title: 'AI i arbeidsflyt',
          body: 'Vi setter opp AI der den faktisk gir verdi: inne i regnskap, kundedialog og dokumenthåndtering. Ikke som demo på siden. Praktisk integrasjon med LLM-er, agenter og evalueringer, med klare grenser for hva systemet får lov til å gjøre.',
        },
      ],
    },
    clients: {
      n: '02', label: 'Kundene våre',
      title: 'Folk vi har bygget for.',
      tag: 'Utvalgt',
      note: 'Vi tar på oss få oppdrag av gangen, og holder oss til kunder vi kan stå inne for. To vi har jobbet tett med det siste året.',
      rows: [
        { logo: 'chesscom', name: 'Chess.com', kind: 'Verdens største sjakkplattform', meta: 'Programvareutvikling' },
        { logo: 'globetech', name: 'GlobeTech', kind: 'Industriell teknologi, Bergen', meta: 'Skreddersøm' },
      ],
    },
    projects: {
      n: '03', label: 'Prosjekter',
      title: 'Ved siden av.',
      tag: 'Tre nylige',
      rows: [
        {
          n: '01', kind: 'Produkt',
          title: 'Harbor', titleEm: 'kunnskapsbase',
          previewKind: 'harbor', previewLang: 'no',
          body: 'En privat kunnskapsbase for mennesker og AI. Notater, dokumenter og samtaler havner samme sted, og er like enkle å spørre LLM-er om som å lese selv. Selvhostet, eller hostet for $12 i måneden.',
          tags: ['Web', 'LLM', 'Postgres'],
          role: 'Eget produkt',
          links: [{ k: 'Besøk', href: 'https://harborknowledge.com', text: 'harborknowledge.com' }],
        },
        {
          n: '02', kind: 'Mobilapp',
          title: 'Fun Libs', titleEm: '10 000+ brukere',
          image: '/images/fun-libs.png',
          imageAlt: 'Markedsføringsbilde for Fun Libs-appen',
          imageCaption: 'Fun Libs · iOS og Android',
          imageFit: 'cover',
          body: 'Et eget produkt på Google Play og App Store. Bygget i React Native med TypeScript, Expo og Supabase, hele veien fra idé til drift og et community som vokser sakte og jevnt.',
          tags: ['React Native', 'TypeScript', 'Expo', 'Supabase'],
          role: 'Eget produkt',
          links: [
            { k: 'Android', href: 'https://play.google.com/store/apps/details?id=com.asgalb.FunLibs', text: 'Google Play' },
            { k: 'iOS', href: '#', text: 'App Store' },
          ],
        },
        {
          n: '03', kind: 'Foredrag',
          title: 'AI hos Unimicro', titleEm: 'Media City Bergen',
          image: '/images/talk-unimicro.jpg',
          imageAlt: 'Asgeir holder foredrag på Media City Bergen',
          imageCaption: 'BedPres · 05.03.2026',
          imageFit: 'cover',
          body: '5. mars 2026 holdt jeg et foredrag hos Unimicro på Media City Bergen. Tema: fintech-agenter som lever inne i regnskapssystemene, ikke ved siden av. En praktisk gjennomgang av hva som faktisk fungerer når AI skal jobbe på ekte data.',
          tags: ['Fintech', 'AI', 'Foredrag'],
          role: 'Holdt av meg',
          links: [{ k: 'Hendelse', href: '#', text: 'Les mer' }],
        },
      ],
    },
    contact: {
      n: '04', label: 'Kontakt',
      title: 'La oss bygge noe.',
      tag: 'Tar inn oppdrag',
      profileName: 'Asgeir Albretsen',
      profileRole: 'Grunnlegger · Albretsen AS',
      lead: 'Best på konsulentarbeid, nye produkter, backendsystemer og AI-funksjoner som faktisk skal i drift. Skriv litt om hva du holder på med, så svarer vi i løpet av en dag eller to.',
      mailState: 'Skriv direkte',
      mailHover: 'Kopier',
      mailCopied: 'Kopiert',
      channelsTitle: 'Andre kanaler',
      channels: [
        { k: 'LinkedIn', href: 'https://linkedin.com/in/asgeir-albretsen', v: 'linkedin.com/in/asgeir-albretsen' },
        { k: 'Telefon', href: null, v: 'På forespørsel' },
        { k: 'Lokasjon', href: null, v: 'Bergen, Norge · UTC+1' },
      ],
      form: {
        title: 'Send en melding',
        name: 'Navn', namePh: 'Hva skal vi kalle deg',
        email: 'E-post', emailPh: 'navn@firma.no',
        message: 'Melding', messagePh: 'Hva er du i gang med, og hvor er du i prosessen?',
        send: 'Send melding', sending: 'Sender…',
        sent: 'Takk, vi svarer snart',
        note: 'Vi svarer normalt innen 24 timer',
      },
    },
    footer: {
      mark: 'Albretsen', markSuffix: 'AS',
      tagline: 'Programvare fra Bergen, Norge. Lite hus, små engasjementer, programmer som faktisk er i drift.',
      colA: { k: 'Selskap', lines: ['Albretsen AS · Bergen, Norge', 'Org.nr. 999 999 999'] },
      colB: {
        k: 'Kontakt', lines: [
          { kind: 'mail', text: 'asgeir@albretsen.no' },
          { kind: 'url', href: 'https://linkedin.com/in/asgeir-albretsen', text: 'LinkedIn' },
        ],
      },
      colC: { k: 'Språk' },
      fineLeft: '© 2026 Albretsen AS. Alle rettigheter forbeholdt.',
      fineRight: 'Bygget for hånd i Bergen',
    },
  },
  en: {
    htmlLang: 'en',
    nav: { services: 'Services', projects: 'Projects', contact: 'Contact' },
    themeToggleLabel: 'Toggle theme',
    hero: {
      metaLoc: 'Bergen, Norway',
      metaEst: 'Established 2021',
      metaStatus: 'Taking on new projects',
      headline: ['We build ', <em key="e">software</em>, '.'],
      byline:
        'Albretsen AS is a small software studio in Bergen. We do consulting work for companies like Chess.com and GlobeTech, and ship a handful of our own products on the side.',
      ctaPrimary: 'See what we do',
      ctaSecondary: 'Get in touch',
      indexLabel: 'Index',
      index: [
        { n: '01', t: 'Services', d: 'What we take on, and how', to: 'services' },
        { n: '02', t: 'Our clients', d: "A few we've built for", to: 'clients' },
        { n: '03', t: 'Projects', d: 'Things on the side', to: 'projects' },
        { n: '04', t: 'Contact', d: 'A note, an idea, a coffee', to: 'contact' },
      ],
    },
    services: {
      n: '01', label: 'Services',
      title: 'What we do.',
      tag: 'Four areas',
      items: [
        {
          n: '01 / 04', icon: 'web',
          title: 'Websites and applications',
          body: "We build websites and web applications that actually run, not just sit pretty. From first sketch through launch and beyond. Modern stack (TypeScript, React, Phoenix, Rails) and an architecture that holds up to being used.",
        },
        {
          n: '02 / 04', icon: 'mobile',
          title: 'Mobile apps',
          body: "Native-feeling apps without maintaining two codebases. We use React Native and Expo for clients who want one app across iOS and Android, and ship the whole thing: App Store, Google Play, push, and the rest.",
        },
        {
          n: '03 / 04', icon: 'custom',
          title: 'Custom systems',
          body: "Internal tools, integrations, backend systems and APIs. Software that fits the workflow you actually have, instead of bending the business around an off-the-shelf product. Built to be easy to read and easy to change.",
        },
        {
          n: '04 / 04', icon: 'ai',
          title: 'AI in real workflows',
          body: "We put AI where it earns its keep: inside accounting, customer dialogue and document workflows. Not as a sidecar demo. Practical integration with LLMs, agents and evals, with sharp limits on what the system is allowed to do.",
        },
      ],
    },
    clients: {
      n: '02', label: 'Clients',
      title: "People we've built for.",
      tag: 'Selected',
      note: "We take on a small number of engagements at a time, and stick with clients we can stand behind. Two we've worked closely with this past year.",
      rows: [
        { logo: 'chesscom', name: 'Chess.com', kind: "The world's largest chess platform", meta: 'Software development' },
        { logo: 'globetech', name: 'GlobeTech', kind: 'Industrial technology, Bergen', meta: 'Custom software' },
      ],
    },
    projects: {
      n: '03', label: 'Projects',
      title: 'On the side.',
      tag: 'Three recent',
      rows: [
        {
          n: '01', kind: 'Product',
          title: 'Harbor', titleEm: 'knowledge base',
          previewKind: 'harbor', previewLang: 'en',
          body: 'A private knowledge base for humans and AI. Notes, documents and conversations end up in one place, and are as easy to query with an LLM as to read yourself. Self-hosted, or hosted for $12/month.',
          tags: ['Web', 'LLM', 'Postgres'],
          role: 'Own product',
          links: [{ k: 'Visit', href: 'https://harborknowledge.com', text: 'harborknowledge.com' }],
        },
        {
          n: '02', kind: 'Mobile app',
          title: 'Fun Libs', titleEm: '10,000+ users',
          image: '/images/fun-libs.png',
          imageAlt: 'Fun Libs marketing image',
          imageCaption: 'Fun Libs · iOS and Android',
          imageFit: 'cover',
          body: 'An own product on Google Play and the App Store. Built with React Native, TypeScript, Expo and Supabase, from first idea to ongoing operation and a community that grows slowly and steadily.',
          tags: ['React Native', 'TypeScript', 'Expo', 'Supabase'],
          role: 'Own product',
          links: [
            { k: 'Android', href: 'https://play.google.com/store/apps/details?id=com.asgalb.FunLibs', text: 'Google Play' },
            { k: 'iOS', href: '#', text: 'App Store' },
          ],
        },
        {
          n: '03', kind: 'Talk',
          title: 'AI at Unimicro', titleEm: 'Media City Bergen',
          image: '/images/talk-unimicro.jpg',
          imageAlt: 'Asgeir speaking at Media City Bergen',
          imageCaption: 'BedPres · 05.03.2026',
          imageFit: 'cover',
          body: 'On 5 March 2026 I gave a talk at Unimicro at Media City Bergen. The topic: fintech agents that live inside the accounting system, not next to it. A practical walk-through of what actually works when AI has to operate on real data.',
          tags: ['Fintech', 'AI', 'Talk'],
          role: 'Given by me',
          links: [{ k: 'Event', href: '#', text: 'Read more' }],
        },
      ],
    },
    contact: {
      n: '04', label: 'Contact',
      title: "Let's build something.",
      tag: 'Taking on work',
      profileName: 'Asgeir Albretsen',
      profileRole: 'Founder · Albretsen AS',
      lead: "Best for consulting work, new products, backend systems, and AI features that have to actually ship. Write a bit about what you're working on, and we'll get back within a day or two.",
      mailState: 'Write directly',
      mailHover: 'Copy',
      mailCopied: 'Copied',
      channelsTitle: 'Other channels',
      channels: [
        { k: 'LinkedIn', href: 'https://linkedin.com/in/asgeir-albretsen', v: 'linkedin.com/in/asgeir-albretsen' },
        { k: 'Phone', href: null, v: 'On request' },
        { k: 'Location', href: null, v: 'Bergen, Norway · UTC+1' },
      ],
      form: {
        title: 'Send a message',
        name: 'Name', namePh: 'What should we call you',
        email: 'Email', emailPh: 'name@company.com',
        message: 'Message', messagePh: "What are you working on, and where are you in the process?",
        send: 'Send message', sending: 'Sending…',
        sent: "Thanks, we'll be in touch",
        note: 'We typically reply within 24 hours',
      },
    },
    footer: {
      mark: 'Albretsen', markSuffix: 'AS',
      tagline: 'Software out of Bergen, Norway. Small studio, small engagements, programs that actually run.',
      colA: { k: 'Company', lines: ['Albretsen AS · Bergen, Norway', 'Org.nr. 999 999 999'] },
      colB: {
        k: 'Contact', lines: [
          { kind: 'mail', text: 'asgeir@albretsen.no' },
          { kind: 'url', href: 'https://linkedin.com/in/asgeir-albretsen', text: 'LinkedIn' },
        ],
      },
      colC: { k: 'Language' },
      fineLeft: '© 2026 Albretsen AS. All rights reserved.',
      fineRight: 'Hand-built in Bergen',
    },
  },
}
