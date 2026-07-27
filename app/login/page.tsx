import { KAKAO_LOGIN_PATH } from '@/app/_global/_data/auth.constant'

export default function LoginPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-title-20sb text-text-primary">팔랑</h1>
        <p className="text-body-14rg text-text-secondary">흔적을 넘기면, 다른 생각이 팔랑</p>
      </div>
      {/* API route가 카카오 authorize로 302 하므로 full navigation(<a>)이 필요하다. */}
      <a
        href={KAKAO_LOGIN_PATH}
        className="w-full max-w-78 rounded-full bg-[#FEE500] py-3 text-center text-body-14sb text-[#191600]"
      >
        카카오로 시작하기
      </a>
    </div>
  )
}
