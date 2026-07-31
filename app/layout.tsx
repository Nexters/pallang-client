import './globals.css'
import 'galmuri/dist/galmuri.css'

import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { AuthProvider } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
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
  maximumScale: 1,
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
            {/* Android back/스와이프는 앱에서 하나만 받아 화면 스택 순서대로 넘긴다 */}
            <HardwareBackProvider>
              <main className="relative mx-auto flex h-dvh w-full max-w-132.5 flex-col overflow-hidden bg-bg-dark pt-(--safe-top)">
                {/* 게이트가 로그인 상태를 읽어야 해서 AuthProvider 안쪽에 둔다 */}
                <LoginGateProvider>
                  <SplashProvider>{children}</SplashProvider>
                </LoginGateProvider>
              </main>
            </HardwareBackProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
