import { TabScreenLayout } from '@/app/_global/_components/TabScreenLayout/TabScreenLayout'
import { GRID_BACKGROUND_CLASS_NAME } from '@/app/_global/_styles/background.constant'

export default function MeetingPage() {
  return (
    <TabScreenLayout
      activeTab="meeting"
      aria-label="모임"
      className={`flex items-center justify-center overflow-y-auto bg-bg-default ${GRID_BACKGROUND_CLASS_NAME}`}
    >
      <p className="text-title-20sb text-text-primary">준비중입니다</p>
    </TabScreenLayout>
  )
}
