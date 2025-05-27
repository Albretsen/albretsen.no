'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Experiment {
  title: string
  description: string
  link: string
  technologies: string[]
  image?: string
  imagePosition?: number // 0-100 representing vertical position
}

const experiments: Experiment[] = [
  /*{
    title: "Can't Teach Drive",
    description: "You can teach a man to code, but you can't teach drive.",
    link: "https://www.youtube.com/shorts/Q_lQHRQDmCQ",
    technologies: ["Suno", "AI", "Music"],
    image: "/images/cant-teach-drive.png",
    imagePosition: 30
  },
  {
    title: "Porsche Cayman Time Attack",
    description: "A video edit of me winning a time attack race at Rudskogen.",
    link: "https://www.youtube.com/watch?v=H30Ppr1t8Og",
    technologies: ["Racing", "Porsche"],
    image: "/images/porsche.jpg",
    imagePosition: 35
  },
  {
    title: "Ferrari F8 Tributo @ Rudskogen",
    description: "Me driving the 720hp Ferrari F8 Tributo at Rudskogen.",
    link: "https://www.youtube.com/watch?v=8Eu3qLBJXes",
    technologies: ["Racing", "Ferrari"],
    image: "/images/ferrari.jpg",
    imagePosition: 42
  }*/
]

export default function Experiments() {
  const [isVisible, setIsVisible] = useState(false)

  if (experiments.length === 0 && !isVisible) {
    return null
  }

  return (
    <section id="experiments" className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-4xl font-bold">Experiments</h2>
        </div>
        
        {isVisible && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {experiments.length > 0 ? (
              experiments.map((experiment, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  {experiment.image && (
                    <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={experiment.image}
                        alt={experiment.title}
                        fill
                        className="object-cover"
                        style={{ objectPosition: `center ${experiment.imagePosition}%` }}
                      />
                    </div>
                  )}
                  <h3 className="text-2xl font-semibold mb-3">{experiment.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {experiment.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {experiment.technologies.map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-full text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  <a
                    href={experiment.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                  >
                    View Experiment →
                  </a>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-600 dark:text-gray-300">
                No experiments yet. Check back soon!
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
} 