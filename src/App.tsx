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

const principles = [
  'Practical software over product theater.',
  'Clean systems, direct communication, and fast iteration.',
  'Projects that feel intentional on both the technical and user side.',
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
            <p className="eyebrow">Software developer • Builder • Systems-minded</p>
            <h1>Asgeir Albretsen</h1>
            <p className="lead">
              I build practical software, product ideas, and small experiments that are
              fast to understand and worth using.
            </p>
            <p className="hero__supporting">
              This is a focused overview of the work, taste, and direction behind what I
              build.
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

        <section className="section" id="projects">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="section-label">Projects</p>
                <h2>Selected work</h2>
              </div>
              <p className="section-intro">
                A small set of things that show the kind of product and technical work I
                care about.
              </p>
            </div>

            <div className="card-grid">
              {projects.map((project) => (
                <article className="card" key={project.title}>
                  <img className="card__image" src={project.image} alt={project.title} />
                  <div className="card__body">
                    <p className="card__eyebrow">Featured project</p>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <p className="card__detail">{project.detail}</p>
                    <ul className="tag-list">
                      {project.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                    <a href={project.link} target="_blank" rel="noreferrer">
                      View project ↗
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

        <section className="section" id="contact">
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
