import Image from 'next/image'

interface Project {
  title: string
  description: string
  link: string
  technologies: string[]
  image?: string
}

const projects: Project[] = [
  {
    title: 'Fun Libs',
    description: 'A mobile game where players fill in blanks to create stories.',
    link: 'https://play.google.com/store/apps/details?id=com.asgalb.FunLibs&hl=en',
    technologies: ['React Native', 'Supabase', "TypeScript", '10k+ users'],
    image: '/images/fun-libs.png'
  }
]

export default function Projects() {
  return (
    <section id="projects" className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-12">
          <h2 className="text-4xl font-bold">Projects</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              {project.image && (
                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <h3 className="text-2xl font-semibold mb-3">{project.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.technologies.map((tech, techIndex) => (
                  <span
                    key={techIndex}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full text-sm"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                View Project →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 