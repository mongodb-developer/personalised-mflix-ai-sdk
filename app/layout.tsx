import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Personalised mflix',
  description: 'Personalised movie recommendations using MongoDB sample_mflix, Gemini, VoyageAI, and MongoDB-backed AI memory.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}