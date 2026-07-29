import { MyPageView } from './_components/MyPageView/MyPageView'
import { mockMyUser } from './_data/myUser.constant'

export default function MyPage() {
  return <MyPageView user={mockMyUser} />
}
