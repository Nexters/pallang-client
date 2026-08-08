import { AuthProvider } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { QueryProvider } from '@/app/_global/_providers/QueryProvider/QueryProvider'
import { SplashProvider } from '@/app/_global/_providers/SplashProvider/SplashProvider'

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-dvh">
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
    </div>
  )
}
