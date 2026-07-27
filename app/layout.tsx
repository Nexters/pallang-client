import './globals.css'
import 'galmuri/dist/galmuri.css'

import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { AuthProvider } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { QueryProvider } from '@/app/_global/_providers/QueryProvider/QueryProvider'

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
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-dvh bg-bg-surface">
        <QueryProvider>
          <AuthProvider>
            <main className="mx-auto flex h-dvh w-full max-w-132.5 flex-col overflow-hidden bg-bg-dark">
              {children}
            </main>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
