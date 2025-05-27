import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AudioPlayer from "@/components/AudioPlayer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Asgeir Albretsen - Software Developer",
  description: "Personal website of Asgeir Albretsen, a software developer based in Norway.",
  keywords: ["software developer", "web development", "react", "typescript", "norway"],
  authors: [{ name: "Asgeir Albretsen" }],
  creator: "Asgeir Albretsen",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://albretsen.no",
    title: "Asgeir Albretsen - Software Developer",
    description: "Personal website of Asgeir Albretsen, a software developer based in Norway.",
    siteName: "albretsen.no",
  },
  twitter: {
    card: "summary_large_image",
    title: "Asgeir Albretsen - Software Developer",
    description: "Personal website of Asgeir Albretsen, a software developer based in Norway.",
    creator: "@asgeiralbretsen",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        <AudioPlayer />
        {children}
      </body>
    </html>
  );
}
