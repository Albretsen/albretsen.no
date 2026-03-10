const projects = [
  {
    title: 'Fun Libs',
    description: 'A mobile word game where players fill in blanks to create absurd stories.',
    link: 'https://play.google.com/store/apps/details?id=com.asgalb.FunLibs&hl=en',
    image: '/images/fun-libs.png',
    tags: ['React Native', 'TypeScript', 'Supabase', '10k+ users'],
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

export default function App() {
  return (
    <div className="site-shell">
      <header className="hero" id="top">
        <div className="hero__backdrop" />
        <div className="container hero__content">
          <div className="hero__profile">
            <img src="/images/profile.jpg" alt="Asgeir Albretsen" />
          </div>
          <div className="hero__copy">
            <p className="eyebrow">Developer • Builder • Experimenter</p>
            <h1>Asgeir Albretsen</h1>
            <p className="lead">
              I build practical software, ship products, and like systems that are fast,
              understandable, and useful.
            </p>
            <div className="hero__actions">
              <a className="button button--primary" href="#projects">See projects</a>
              <a className="button button--ghost" href="#contact">Get in touch</a>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="section section--muted" id="about">
          <div className="container section__grid">
            <div>
              <p className="section-label">About</p>
              <h2>Personal landing page, not corporate theater.</h2>
            </div>
            <div className="stack">
              <p>
                This site is a compact overview of what I do: software development,
                product work, and the occasional side experiment.
              </p>
              <p>
                I care about clean systems, direct communication, and shipping things that
                actually work.
              </p>
            </div>
          </div>
        </section>

        <section className="section" id="projects">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="section-label">Projects</p>
                <h2>Selected work</h2>
              </div>
            </div>

            <div className="card-grid">
              {projects.map((project) => (
                <article className="card" key={project.title}>
                  <img className="card__image" src={project.image} alt={project.title} />
                  <div className="card__body">
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <ul className="tag-list">
                      {project.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                    <a href={project.link} target="_blank" rel="noreferrer">
                      View project
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--muted" id="experiments">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="section-label">Experiments</p>
                <h2>Smaller things worth showing</h2>
              </div>
            </div>

            <div className="card-grid card-grid--single">
              {experiments.map((experiment) => (
                <article className="card" key={experiment.title}>
                  <img className="card__image" src={experiment.image} alt={experiment.title} />
                  <div className="card__body">
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

        <section className="section" id="contact">
          <div className="container contact-grid">
            <div>
              <p className="section-label">Contact</p>
              <h2>Want to talk?</h2>
              <p>
                Reach out if you want to build something, discuss an idea, or just point me
                at an interesting problem.
              </p>
            </div>

            <div className="contact-card">
              <a href="mailto:asgeir@albretsen.no">asgeir@albretsen.no</a>
              <a href="https://github.com/albretsen" target="_blank" rel="noreferrer">
                github.com/albretsen
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
