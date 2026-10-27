'use client'

import { Capacitor } from '@capacitor/core'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import BellIcon from '@/app/_global/_components/Icon/assets/bell.svg'
import SearchIcon from '@/app/_global/_components/Icon/assets/search.svg'
import { TabScreenLayout } from '@/app/_global/_components/TabScreenLayout/TabScreenLayout'
import { useAuth } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { notificationQueries } from '@/app/_global/_queries/notification.queries'
import { GRID_BACKGROUND_CLASS_NAME } from '@/app/_global/_styles/background.constant'
import { consumeAppInstallPrompt } from '@/app/_shared/onboarding/_services/appInstallPrompt.service'
import { shouldShowHomeCoachMark } from '@/app/_shared/onboarding/_services/homeCoachMark.service'
import Logo from '@/public/images/logo.svg'

import { useOnboardingGate } from '../../_hooks/useOnboardingGate'
import { AppInstallDialog } from '../AppInstallDialog/AppInstallDialog'
import { HomeCoachMarkOverlay } from '../HomeCoachMarkOverlay/HomeCoachMarkOverlay'
import { HomeSection } from '../HomeSection/HomeSection'

const BOOK_SEARCH_PATH = '/book/search/my-books'
const NOTIFICATIONS_PATH = '/notifications'
const HOME_ICON_BUTTON_CLASS_NAME =
  'press flex size-[42px] shrink-0 items-center justify-center rounded-[100px] bg-[rgba(0,0,0,0.08)] text-icon-primary backdrop-blur-[4px] transition-[background-color,scale] duration-instant ease-standard'

export function HomePageView() {
  useOnboardingGate()

  const router = useRouter()
  const runWithLogin = useLoginGate()
  const { isAuthenticated } = useAuth()
  const hasUnreadQuery = useQuery({
    ...notificationQueries.hasUnread(),
    enabled: isAuthenticated,
  })
  const [showCoachMark, setShowCoachMark] = useState(false)
  const [showAppInstallDialog, setShowAppInstallDialog] = useState(false)

  useEffect(() => {
    router.prefetch(BOOK_SEARCH_PATH)
    router.prefetch(NOTIFICATIONS_PATH)
  }, [router])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const shouldShowCoachMark = shouldShowHomeCoachMark()
      setShowCoachMark(shouldShowCoachMark)
      if (!shouldShowCoachMark && consumeAppInstallPrompt() && !Capacitor.isNativePlatform()) {
        setShowAppInstallDialog(true)
      }
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [])

  const handleSearchClick = () => {
    runWithLogin(() => {
      router.push(BOOK_SEARCH_PATH)
    })
  }

  const handleNotificationsClick = () => {
    router.push(NOTIFICATIONS_PATH)
  }

  return (
    <>
      <TabScreenLayout
        aria-label="홈"
        activeTab="home"
        className={`overflow-y-auto bg-bg-default ${GRID_BACKGROUND_CLASS_NAME}`}
      >
        <div className="px-4 pt-4">
          <header className="flex items-center">
            <Logo aria-label="Pallang" className="h-7 w-18.75" />
          </header>
        </div>

        <HomeSection
          searchAction={
            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <button
                  type="button"
                  aria-label="알림함"
                  className={`relative ${HOME_ICON_BUTTON_CLASS_NAME}`}
                  onClick={handleNotificationsClick}
                >
                  <BellIcon aria-hidden="true" className="size-6" />
                  {hasUnreadQuery.data?.data?.hasUnread && (
                    <span
                      aria-label="새 알림"
                      className="absolute left-8 top-0.5 size-2 rounded-full bg-icon-accent"
                    />
                  )}
                </button>
              )}
              <button
                type="button"
                aria-label="검색"
                className={HOME_ICON_BUTTON_CLASS_NAME}
                onClick={handleSearchClick}
              >
                <SearchIcon aria-hidden="true" className="size-6" />
              </button>
            </div>
          }
        />
      </TabScreenLayout>
      {showCoachMark && (
        <HomeCoachMarkOverlay
          onFinish={() => {
            setShowCoachMark(false)
            if (!Capacitor.isNativePlatform()) setShowAppInstallDialog(true)
          }}
        />
      )}
      <AppInstallDialog
        open={showAppInstallDialog}
        onClose={() => {
          setShowAppInstallDialog(false)
        }}
      />
    </>
  )
}
