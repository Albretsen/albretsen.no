import ParticleBackground from './ParticleBackground'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <ParticleBackground />
        <div className="absolute inset-0 bg-black/30" /> {/* Subtle overlay for better text readability */}
      </div>
      
      <div className="container mx-auto px-4 py-16 text-center relative z-10">
        <div className="mb-8 flex justify-center">
        <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white/20 shadow-xl relative">
  <img
    src="/images/profile.jpg"
    alt="Asgeir Albretsen"
    className="absolute top-[15%] left-[13%] scale-200 object-cover"
  />
</div>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 leading-tight">
          Asgeir Albretsen
        </h1>
        <p className="text-xl md:text-2xl text-white mb-8">
          Software Developer
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="#projects"
            className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            View Projects
          </a>
          <a
            href="#contact"
            className="px-6 py-3 border border-white text-white rounded-full hover:bg-white/10 transition-colors"
          >
            Contact Me
          </a>
        </div>
      </div>
    </section>
  )
} 