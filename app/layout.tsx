import type { Metadata } from 'next'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-instrument-serif',
})

export const metadata: Metadata = {
  title: 'Albretsen AS · Programvare fra Bergen',
  description: 'Albretsen AS er et lite programvarestudio i Bergen. Konsulentarbeid, egne produkter og praktisk AI.',
  openGraph: {
    title: 'Albretsen AS · Programvare fra Bergen',
    description: 'Albretsen AS er et lite programvarestudio i Bergen. Konsulentarbeid, egne produkter og praktisk AI.',
    locale: 'nb_NO',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="nb"
      data-theme="light"
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <head>
        {/* Apply saved theme before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('alb-theme');if(t)document.documentElement.setAttribute('data-theme',t);var l=localStorage.getItem('alb-lang');if(l==='en')document.documentElement.setAttribute('lang','en');}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
