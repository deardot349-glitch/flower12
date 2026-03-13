import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'FlowerGoUa — Платформа для квіткових магазинів',
  description: 'Створіть онлайн-магазин для вашого квіткового бізнесу за 5 хвилин. Без програмістів.',
  keywords: 'квітковий магазин, флорист, онлайн магазин квітів, FlowerGoUa',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
