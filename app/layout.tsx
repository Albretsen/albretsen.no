import type { Metadata } from 'next'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const instrumentSerif = Instrument_Serif({ weight: '400', style: ['normal', 'italic'], subsets: ['latin'], variable: '--font-instrument-serif' })

export const metadata: Metadata = {
  metadataBase: new URL('https://albretsen.no'),
  title: { default: 'Asgeir Albretsen', template: '%s · Asgeir Albretsen' },
  description: 'Products, writing, and notes on money, software, and the internet.',
  openGraph: { type: 'website', locale: 'en_US', title: 'Asgeir Albretsen', description: 'Products, writing, and notes on money, software, and the internet.' },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}><body>{children}</body></html>
}
