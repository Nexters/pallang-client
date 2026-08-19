import { MyOpinionListView } from '@/app/_shared/user/_components/MyOpinionListView/MyOpinionListView'

// 확정 시안에서 마이페이지 진입점이 빠졌다. 서재 > 책 상세의 의견 탭이 대신하지만
// 그 화면이 아직 없어 라우트는 남겨둔다. 대체가 끝나면 함께 정리한다.
export default function MyTracesPage() {
  return <MyOpinionListView />
}
