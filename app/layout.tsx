import './globals.css'
import 'galmuri/dist/galmuri.css'

import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { AuthProvider } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { QueryProvider } from '@/app/_global/_providers/QueryProvider/QueryProvider'
import { SplashProvider } from '@/app/_global/_providers/SplashProvider/SplashProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: '팔랑',
  description: '흔적을 넘기면, 다른 생각이 팔랑',
  manifest: '/favicon/manifest.json',
  icons: {
    icon: [
      { url: '/favicon/favicon.ico', sizes: 'any' },
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/favicon/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-dvh">
        <QueryProvider>
          <AuthProvider>
            <main className="relative mx-auto flex h-dvh w-full max-w-132.5 flex-col overflow-hidden bg-bg-dark">
              <SplashProvider>{children}</SplashProvider>
            </main>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
