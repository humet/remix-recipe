import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { isDemoRequest } from '@/lib/demo/is-demo'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'Remix - Recipe Remixer',
  description: 'Remix any recipe with AI - make it healthier, tastier, or perfectly suited to your kitchen',
  generator: 'v0.app',
  other: {
    'apple-mobile-web-app-title': 'Remix',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#6366f1',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const demo = await isDemoRequest()

  return (
    <html lang="en" className="bg-background">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="gradient-bg" aria-hidden="true" />
        <Providers demo={demo}>{children}</Providers>
      </body>
    </html>
  )
}
