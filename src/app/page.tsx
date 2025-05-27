import Hero from '@/components/Hero'
import Projects from '@/components/Projects'
import Experiments from '@/components/Experiments'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Projects />
      <Experiments />
      <Contact />
      <Footer />
    </main>
  )
}
