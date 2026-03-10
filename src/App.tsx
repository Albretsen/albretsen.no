const projects = [
  {
    title: 'Fun Libs',
    description:
      'A mobile word game built to make story creation fast, social, and a little ridiculous.',
    detail:
      'Designed as a lightweight consumer app with a simple loop: join in, fill the blanks, and get a funny result worth sharing.',
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
  'Practical software over product theater.',
  'Clean systems, direct communication, and fast iteration.',
  'Projects that feel intentional on both the technical and user side.',
]

const experience = [
  {
    company: 'Unimicro',
    role: 'Software Developer',
    period: '2024 — Present',
    summary: 'Building software in a production environment with real users, constraints, and team context.',
  },
  {
    company: 'BI Norwegian Business School',
    role: 'IT Consulting',
    period: '2023 — 2024',
    summary: 'Worked close to internal systems and operations, with a bias toward reliability and usefulness.',
  },
  {
    company: 'Chess.com',
    role: 'App Developer',
    period: '2019 — 2022',
    summary: 'Worked on mobile app development and app store-facing product work at consumer scale.',
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

const heroStats = [
  { value: '3', label: 'selected roles shown' },
  { value: '10k+', label: 'users on Fun Libs' },
  { value: 'Bergen', label: 'base of operations' },
]

export default function App() {
  return (
    <div className="site-shell">
      <header className="hero" id="top">
        <div className="hero__backdrop" />
        <div className="hero__grid" />

        <div className="container">
          <nav className="topbar" aria-label="Primary">
            <a className="topbar__brand" href="#top">
              <span className="topbar__dot" aria-hidden="true" />
              Asgeir Albretsen
            </a>

            <div className="topbar__links">
              <a href="#experience">Experience</a>
              <a href="#projects">Projects</a>
              <a href="#contact">Contact</a>
            </div>
          </nav>

          <div className="hero__content">
            <div className="hero__profileWrap">
              <div className="hero__profile">
                <img src="/images/profile.jpg" alt="Asgeir Albretsen" />
              </div>
            </div>

            <div className="hero__copy">
              <p className="eyebrow">Software developer • Builder • Systems-minded</p>
              <h1>Clean software. Clear thinking. Real products.</h1>
              <p className="lead">
                I build practical software, product ideas, and small experiments that are
                fast to understand and worth using.
              </p>
              <p className="hero__supporting">
                Developer based in Bergen, working across product thinking,
                implementation, and the details that make software feel solid.
              </p>

              <div className="hero__actions">
                <a className="button button--primary" href="#projects">
                  See projects
                </a>
                <a className="button button--ghost" href="#contact">
                  Get in touch
                </a>
              </div>

              <ul className="hero__highlights" aria-label="Approach highlights">
                <li>Useful software</li>
                <li>Direct communication</li>
                <li>Clean execution</li>
              </ul>
            </div>
          </div>

          <div className="hero__stats" aria-label="Quick facts">
            {heroStats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
        </div>
      </header>

      <main>
        <section className="section section--muted" id="about">
          <div className="container section__grid">
            <div>
              <p className="section-label">About</p>
              <h2>Built to be clear, credible, and not overexplained.</h2>
            </div>

            <div className="stack">
              <p>
                I like products that feel sharp, understandable, and grounded in real use
                instead of vague hype.
              </p>
              <ul className="principles-list">
                {principles.map((principle) => (
                  <li key={principle}>{principle}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="section" id="experience">
          <div className="container">
            <div className="section-heading section-heading--stacked-mobile">
              <div>
                <p className="section-label">Experience</p>
                <h2>Work that adds useful context</h2>
              </div>
              <p className="section-intro">
                A quick snapshot of roles that shaped how I think about product quality,
                implementation, and shipping real software.
              </p>
            </div>

            <div className="timeline">
              {experience.map((item) => (
                <article className="timeline__item" key={`${item.company}-${item.period}`}>
                  <p className="timeline__period">{item.period}</p>
                  <div>
                    <h3>
                      {item.role} <span>@ {item.company}</span>
                    </h3>
                    <p>{item.summary}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--muted" id="projects">
          <div className="container">
            <div className="section-heading section-heading--stacked-mobile">
              <div>
                <p className="section-label">Projects</p>
                <h2>Selected work</h2>
              </div>
              <p className="section-intro">
                A small set of things that show the kind of product and technical work I
                care about.
              </p>
            </div>

            <div className="project-showcase">
              {projects.map((project) => (
                <article className="project-spotlight" key={project.title}>
                  <div className="project-spotlight__media">
                    <img className="card__image" src={project.image} alt={project.title} />
                  </div>

                  <div className="project-spotlight__content">
                    <p className="card__eyebrow">Featured project</p>
                    <h3>{project.title}</h3>
                    <p className="project-spotlight__lead">{project.description}</p>
                    <p>{project.detail}</p>

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

                    <div className="project-spotlight__actions">
                      <a href={project.link} target="_blank" rel="noreferrer">
                        View project ↗
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {showExperiments ? (
          <section className="section" id="experiments">
            <div className="container">
              <div className="section-heading section-heading--stacked-mobile">
                <div>
                  <p className="section-label">Experiments</p>
                  <h2>Smaller things worth showing</h2>
                </div>
                <p className="section-intro">
                  Not everything needs to be a big product to say something useful.
                </p>
              </div>

              <div className="card-grid card-grid--single">
                {experiments.map((experiment) => (
                  <article className="card" key={experiment.title}>
                    <img className="card__image" src={experiment.image} alt={experiment.title} />
                    <div className="card__body">
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
          <div className="container contact-grid">
            <div>
              <p className="section-label">Contact</p>
              <h2>Want to build something useful?</h2>
              <p>
                Reach out if you want to collaborate, discuss an idea, or point me at an
                interesting problem.
              </p>
            </div>

            <div className="contact-card">
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
        </section>
      </main>
    </div>
  )
}
