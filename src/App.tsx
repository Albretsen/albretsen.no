const projects = [
  {
    title: 'Fun Libs',
    description:
      'A mobile word game built to make story creation fast, social, and a little ridiculous.',
    detail:
      'Built as a lightweight consumer app with a simple loop: join in, fill the blanks, and get a result worth sharing.',
    link: 'https://play.google.com/store/apps/details?id=com.asgalb.FunLibs&hl=en',
    image: '/images/fun-libs.png',
    tags: ['React Native', 'TypeScript', 'Supabase', '10k+ users'],
    meta: ['Consumer app', 'Mobile-first', 'Live product'],
  },
]

const experiments = [
  {
    title: "You can't teach drive",
    description: 'A small experiment mixing visuals, audio, and attitude.',
    image: '/images/cant-teach-drive.png',
    audio: '/audio/cant-teach-drive.mp3',
  },
]

const showExperiments = false

const principles = [
  'I like software that is easy to understand and hard to break.',
  'I care about direct communication, clean systems, and useful outcomes.',
  'The goal is not to make something look clever. The goal is to make it good.',
]

const experience = [
  {
    company: 'Unimicro',
    role: 'Software Developer',
    period: '2024 — Present',
    summary: 'Working on software that has to hold up in real use, not just in demos.',
  },
  {
    company: 'BI Norwegian Business School',
    role: 'IT Consulting',
    period: '2023 — 2024',
    summary: 'Worked close to internal systems and day-to-day operational needs.',
  },
  {
    company: 'Chess.com',
    role: 'App Developer',
    period: '2019 — 2022',
    summary: 'Worked on mobile app development and product-facing improvements at scale.',
  },
]

const links = [
  {
    label: 'Email',
    value: 'asgeir@albretsen.no',
    href: 'mailto:asgeir@albretsen.no',
  },
  {
    label: 'GitHub',
    value: 'github.com/albretsen',
    href: 'https://github.com/albretsen',
  },
  {
    label: 'LinkedIn',
    value: 'linkedin.com/in/asgeir-albretsen',
    href: 'https://www.linkedin.com/in/asgeir-albretsen/',
  },
]

const heroFacts = [
  'Based in Bergen',
  'Software developer',
  'Builds practical products',
]

export default function App() {
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
                I’m Asgeir — a software developer who likes clean systems, practical
                products, and sites that say what they mean.
              </p>

              <div className="hero__actions">
                <a className="button button--primary" href="#projects">
                  View work
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
                <p>
                  Building software in a real production setting, with actual users and
                  actual constraints.
                </p>
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
                <strong>Fun Libs reached 10k+ users</strong>
                <p>A small product with real traction, not just a mockup in a repo.</p>
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
              <h2>Not here to sound like a startup deck.</h2>
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
              <h2>Work worth opening.</h2>
            </div>

            <div className="project-stack reveal reveal--2">
              {projects.map((project) => (
                <article className="project-panel" key={project.title}>
                  <div className="project-panel__visual">
                    <img src={project.image} alt={project.title} />
                  </div>

                  <div className="project-panel__content">
                    <div className="project-panel__header">
                      <p className="card__eyebrow">Featured project</p>
                      <h3>{project.title}</h3>
                      <p className="project-panel__lead">{project.description}</p>
                    </div>

                    <p className="project-panel__detail">{project.detail}</p>

                    <div className="project-meta" aria-label="Project summary">
                      {project.meta.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>

                    <ul className="tag-list">
                      {project.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>

                    <a href={project.link} target="_blank" rel="noreferrer">
                      Open project ↗
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {showExperiments ? (
          <section className="section section--muted" id="experiments">
            <div className="container">
              <div className="project-stack">
                {experiments.map((experiment) => (
                  <article className="project-panel" key={experiment.title}>
                    <div className="project-panel__visual">
                      <img src={experiment.image} alt={experiment.title} />
                    </div>
                    <div className="project-panel__content">
                      <p className="card__eyebrow">Experiment</p>
                      <h3>{experiment.title}</h3>
                      <p>{experiment.description}</p>
                      <audio controls preload="none" src={experiment.audio}>
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </article>
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
                Best for collaborations, interesting product ideas, or work that needs a
                developer who cares about the details.
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
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
