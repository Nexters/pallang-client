import './globals.css'

import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'

import { IllustrationPreload } from '@/app/_global/_components/IllustrationPreload/IllustrationPreload'

/* Galmuri11 Regular 하나만 로드한다 — 레포에서 Galmuri를 그리는 길은 `font-galmuri` 유틸
   (globals.css의 --font-galmuri 토큰)뿐이고 Bold·Condensed 사용처는 없다(2026-08 grep).
   woff2는 galmuri 패키지 v2.40.3(SIL OFL — 같은 폴더의 LICENSE 동봉)에서 복사했다.
   - display 'swap': 기존 galmuri.css의 font-display: swap과 동일 — 마스킹·장식용 픽셀 폰트라
     로드 전 폴백 노출이 내용을 해치지 않는다.
   - preload false: 지금 이 폰트를 그리는 화면이 없다(스포일러 마스킹이 blur로 바뀌며 사용처가
     사라짐 — baa418b). @font-face는 그리는 텍스트가 생길 때만 파일을 받으므로 지금 비용은 0인데,
     preload를 켜면 안 그리는 493KB를 매 방문 강제 다운로드하게 된다. 사용처가 다시 생기는
     PR에서 true로 올릴 것. */
const galmuri = localFont({
  src: './_global/_styles/fonts/Galmuri11.woff2',
  weight: '400',
  display: 'swap',
  preload: false,
  variable: '--font-galmuri11',
})

const googleAnalyticsMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const shouldEnableGoogleAnalytics =
  process.env.VERCEL_ENV === 'production' && Boolean(googleAnalyticsMeasurementId)

const siteUrl = 'https://www.pallang.co.kr'
const siteTitle = '팔랑'
const siteDescription = '흔적을 넘기면, 다른 생각이 팔랑'
const ogImage = {
  url: '/images/meta_og.png',
  width: 1200,
  height: 630,
  alt: siteTitle,
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  manifest: '/favicon/manifest.json',
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: '/',
    siteName: siteTitle,
    images: [ogImage],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [ogImage],
  },
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
  const googleAnalytics =
    shouldEnableGoogleAnalytics && googleAnalyticsMeasurementId ? (
      <GoogleAnalytics measurementId={googleAnalyticsMeasurementId} />
    ) : null

  return (
    <html lang="ko" className={`${galmuri.variable} h-full antialiased`}>
      <body className="min-h-dvh">
        <IllustrationPreload />
        {children}
      </body>
      {googleAnalytics}
    </html>
  )
}

function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  )
}
