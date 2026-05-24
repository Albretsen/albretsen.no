import ShowcaseCard from './components/ShowcaseCard'
import DashboardPage from './dashboard/DashboardPage'

const projects = [
  {
    title: 'Fun Libs',
    description:
      'A full-stack mobile app I built and shipped, with 10,000+ users and real product iteration behind it.',
    detail:
      'Fun Libs started as a simple idea, but the useful part is the execution: shipping a consumer app, making the loop work on mobile, and keeping the product stable enough for real users instead of treating it like a throwaway side project.',
    bullets: [
      'Built and deployed the app with React Native, TypeScript, Expo, and Supabase.',
      'Designed the backend structure, authentication flow, and the data model behind the core gameplay loop.',
      'Reached 10,000+ users organically and kept iterating based on how people actually used it.',
      'Handled the product as an end-to-end system: app updates, backend changes, release flow, and day-to-day improvements.',
    ],
    primaryLink: {
      href: 'https://play.google.com/store/apps/details?id=com.asgalb.FunLibs&hl=en',
      label: 'View on Google Play',
    },
    images: ['/images/fun-libs.png'],
    tags: ['React Native', 'TypeScript', 'Expo', 'Supabase', '10k+ users'],
    meta: ['Full-stack product', 'Mobile app', 'Shipped and maintained'],
  },
]

const sideProjects = [
  {
    title: 'AI talk with Unimicro',
    description:
      'Presented a practical fintech AI agent case built around real accounting workflows.',
    detail:
      'The point of the talk was not futuristic AI hype. It was showing how an agent becomes useful when it can operate inside real systems, use structured tools, and help with work that already matters to businesses.',
    bullets: [
      'Explained how tool-based AI workflows fit into accounting systems instead of sitting beside them as a demo.',
      'Focused on practical constraints: reliability, structured actions, and business-facing usefulness.',
      'Used a real product context rather than a generic AI presentation.',
    ],
    images: ['/images/bedpress_1.jpeg', '/images/bedpress_3.jpeg', '/images/bedpress_2.jpeg'],
    tags: ['Fintech', 'AI agent', 'Unimicro', 'Presentation'],
    meta: ['Media City Bergen', '5 March 2026', 'Student presentation'],
    primaryLink: {
      href: 'https://www.linkedin.com/posts/node-aiki_forrige-uke-var-vi-s%C3%A5-heldige-%C3%A5-f%C3%A5-bes%C3%B8ke-activity-7436718421142208512-pcw5?utm_source=share&utm_medium=member_desktop&rcm=ACoAADR9u9oBIzwfVAqkaJiVTcVIIVCcu4_jgL8',
      label: 'See post from the event',
    },
  },
]

const showSideProjects = true

const principles = [
  'I like software that is easy to understand and hard to break.',
  'I care about direct communication, clean systems, and useful outcomes.',
  'I prefer systems that stay understandable even after they become real work.',
]

const experience = [
  {
    company: 'Unimicro',
    role: 'Software Developer',
    period: '2024 — Present',
    summary: 'Building software used in real business workflows, across AI, backend systems, and mobile products.',
  },
  {
    company: 'BI Norwegian Business School',
    role: 'IT Consultant',
    period: '2023 — 2024',
    summary: 'Built and maintained internal software for academic and administrative needs.',
  },
  {
    company: 'Chess.com',
    role: 'Software Developer',
    period: '2019 — 2022',
    summary: 'Worked on mobile product improvements for a platform operating at large scale.',
  },
]

const links = [
  {
    label: 'Email',
    value: 'asgeir@albretsen.no',
    href: 'mailto:asgeir@albretsen.no',
  },
  {
    label: 'LinkedIn',
    value: 'linkedin.com/in/asgeir-albretsen',
    href: 'https://www.linkedin.com/in/asgeir-albretsen/',
  },
]

const heroFacts = [
  'Based in Bergen',
  'Fintech + backend systems',
  'Practical AI and mobile products',
]

const highlights = [
  {
    title: 'AI agent workflows at Unimicro',
    eyebrow: 'Selected work',
    summary:
      'Built LLM-powered workflows around real accounting operations instead of isolated chat demos.',
    points: [
      'Worked on the Micro assistant and tool-based flows connected to core accounting systems.',
      'Used Semantic Kernel and OpenAI APIs for structured execution rather than free-form prompting alone.',
      'Designed around actions that need to be reliable, inspectable, and useful in business contexts.',
      'Helped improve internal tooling and output reliability as the product matured.',
    ],
    tags: ['Semantic Kernel', 'OpenAI APIs', 'Tool-based execution', 'Accounting systems'],
  },
  {
    title: '.NET backend systems',
    eyebrow: 'Technical depth',
    summary:
      'Backend work focused on services that need to hold up under real usage, not just pass a happy-path demo.',
    points: [
      'Built backend services with ASP.NET Core, EF Core, and SQL Server.',
      'Worked on API design, internal service logic, and data access patterns for production systems.',
      'Contributed to architecture, code reviews, and reliability-focused engineering decisions.',
      'Implemented security-related requirements as part of ISO 27001 work.',
    ],
    tags: ['ASP.NET Core', 'EF Core', 'SQL Server', 'ISO 27001'],
  },
  {
    title: 'Mobile products with real users',
    eyebrow: 'Product signal',
    summary:
      'Shipped mobile software where adoption and iteration mattered more than portfolio aesthetics.',
    points: [
      'Built React Native apps used by 10,000+ businesses at work and 10,000+ users in Fun Libs.',
      'Worked across product behavior, release flow, and practical implementation details.',
      'Care about product loops, not just screens: what users do, where they get stuck, and what makes them come back.',
    ],
    tags: ['React Native', 'TypeScript', 'Expo', 'Product iteration'],
  },
]

function LandingPage() {
  return (
    <div className="site-shell">
      <header className="hero" id="top">
        <div className="hero__ambient hero__ambient--one" aria-hidden="true" />
        <div className="hero__ambient hero__ambient--two" aria-hidden="true" />

        <div className="container hero__shell">
          <nav className="topbar" aria-label="Primary">
            <a className="topbar__brand" href="#top">
              Asgeir Albretsen
            </a>

            <div className="topbar__links">
              <a href="#about">About</a>
              <a href="#projects">Projects</a>
              <a href="#highlights">Highlights</a>
              <a href="/dashboard">Dashboard</a>
              <a href="#contact">Contact</a>
            </div>
          </nav>

          <div className="hero__stage">
            <div className="hero__left reveal reveal--1">
              <p className="eyebrow">Developer landing page</p>
              <h1>
                I build software that feels
                <span> sharp, useful, and real.</span>
              </h1>
              <p className="lead">
                I’m Asgeir, a software developer working across fintech, backend
                systems, practical AI, and mobile products.
              </p>
              <p className="hero__supporting">
                I care most about systems that do something real: business workflows,
                product loops, and tools people actually end up relying on.
              </p>

              <div className="hero__actions">
                <a className="button button--primary" href="#projects">
                  View work
                </a>
                <a className="button button--ghost" href="#highlights">
                  Technical highlights
                </a>
                <a className="button button--ghost" href="#contact">
                  Contact me
                </a>
              </div>

              <ul className="hero__facts" aria-label="Quick facts about Asgeir">
                {heroFacts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </div>

            <div className="hero__right reveal reveal--2">
              <div className="hero-card hero-card--intro">
                <div className="hero-card__label">Now</div>
                <strong>Software Developer at Unimicro</strong>
                <p>Building fintech products, backend services, and practical AI workflows.</p>
              </div>

              <div className="hero-card hero-card--profile">
                <div className="hero-card__imageWrap">
                  <img src="/images/profile.jpg" alt="Asgeir Albretsen" />
                </div>
                <div className="hero-card__meta">
                  <span>Asgeir Albretsen</span>
                  <strong>Software developer</strong>
                </div>
              </div>

              <div className="hero-card hero-card--small">
                <div className="hero-card__label">Selected signal</div>
                <strong>Built products with real adoption</strong>
                <p>10k+ Fun Libs users, React Native apps used by 10k+ businesses, and AI work in live accounting workflows.</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="section" id="about">
          <div className="container split-section">
            <div className="section-heading-block reveal reveal--1">
              <p className="section-label">About</p>
              <h2>Clear, direct, and built for real use.</h2>
            </div>

            <div className="about-panel reveal reveal--2">
              <p>
                I like building things that are understandable, useful, and solid enough
                to survive contact with reality.
              </p>
              <ul className="principles-list">
                {principles.map((principle) => (
                  <li key={principle}>{principle}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="section section--muted" id="experience">
          <div className="container split-section split-section--top">
            <div className="section-heading-block reveal reveal--1">
              <p className="section-label">Experience</p>
              <h2>Places that shaped how I work.</h2>
            </div>

            <div className="timeline reveal reveal--2">
              {experience.map((item) => (
                <article className="timeline__item" key={`${item.company}-${item.period}`}>
                  <p className="timeline__period">{item.period}</p>
                  <div>
                    <h3>
                      {item.role} <span>{item.company}</span>
                    </h3>
                    <p>{item.summary}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="projects">
          <div className="container split-section split-section--top">
            <div className="section-heading-block reveal reveal--1">
              <p className="section-label">Projects</p>
              <h2>Proof, not just positioning.</h2>
            </div>

            <div className="project-stack reveal reveal--2">
              {projects.map((project) => (
                <ShowcaseCard item={project} eyebrow="Featured project" key={project.title} />
              ))}
            </div>
          </div>
        </section>

        <section className="section section--muted" id="highlights">
          <div className="container split-section split-section--top">
            <div className="section-heading-block reveal reveal--1">
              <p className="section-label">Selected work / Technical highlights</p>
              <h2>The part with more depth.</h2>
            </div>

            <div className="highlight-grid reveal reveal--2">
              {highlights.map((item) => (
                <article className="highlight-card" key={item.title}>
                  <p className="card__eyebrow">{item.eyebrow}</p>
                  <h3>{item.title}</h3>
                  <p className="highlight-card__summary">{item.summary}</p>

                  <ul className="highlight-points">
                    {item.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>

                  <ul className="tag-list">
                    {item.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {showSideProjects ? (
          <section className="section" id="side-projects">
            <div className="container split-section split-section--top">
              <div className="section-heading-block reveal reveal--1">
                <p className="section-label">Side work</p>
                <h2>Useful things beyond the main timeline.</h2>
              </div>

              <div className="project-stack reveal reveal--2">
                {sideProjects.map((item) => (
                  <ShowcaseCard item={item} eyebrow="Talk / side work" key={item.title} />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="section section--muted" id="contact">
          <div className="container split-section">
            <div className="section-heading-block reveal reveal--1">
              <p className="section-label">Contact</p>
              <h2>If you’ve got something good to build, send it over.</h2>
            </div>

            <div className="contact-panel reveal reveal--2">
              <p>
                Best for collaborations, product work, backend systems, fintech, or AI
                features that need to be useful outside a demo environment.
              </p>

              <div className="contact-list">
                {links.map((link) => {
                  const isExternal = link.href.startsWith('http')

                  return (
                    <a
                      href={link.href}
                      key={link.label}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noreferrer' : undefined}
                    >
                      <span>{link.label}</span>
                      <strong>{link.value}</strong>
                    </a>
                  )
                })}
              </div>

              <a className="dashboard-inline-link" href="/dashboard">
                Personal dashboard (live system overview) →
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default function App() {
  if (window.location.pathname === '/dashboard') {
    return <DashboardPage />
  }

  return <LandingPage />
}
