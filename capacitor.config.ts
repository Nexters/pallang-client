import type { CapacitorConfig } from '@capacitor/cli'

// 배포 전 실제 값으로 교체할 것
const APP_ID = 'kr.pallang.app'
const PROD_SERVER_URL = 'https://pallang.example.com'

// dev 라이브리로드: CAP_SERVER_URL=http://<LAN_IP>:3000 pnpm cap:ios
const serverUrl = process.env['CAP_SERVER_URL'] ?? PROD_SERVER_URL

const config: CapacitorConfig = {
  appId: APP_ID,
  appName: 'pallang',
  // 원격 로드라도 존재해야 함 → 기존 public을 최소 fallback으로 사용
  webDir: 'public',
  server: {
    url: serverUrl,
    androidScheme: 'https',
    // http(LAN) 로드일 때만 cleartext 허용
    cleartext: serverUrl.startsWith('http://'),
    allowNavigation: [],
  },
}

export default config
