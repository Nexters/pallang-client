import Link from 'next/link'

import { POLICY_META_BY_SLUG } from '@/app/_shared/terms/_data/policy.constant'
import Logo from '@/public/images/logo.svg'

export function LandingFooter() {
  return (
    <footer className="h-60 bg-bg-alternative font-pretendard">
      <div className="mx-auto flex h-full w-[1280px] flex-col justify-center gap-4">
        <div className="flex flex-col gap-2">
          <Logo aria-label="Pallang" className="h-7 w-[75px] opacity-50" />
          <p className="text-[16px] leading-[1.4] font-normal tracking-[-0.02em] text-[#595959]">
            온라인 교환독서 서비스
          </p>
        </div>

        <p className="text-[16px] leading-[1.4] font-normal tracking-[-0.02em] text-[#595959]">
          문의 : palling.book@gmail.com
        </p>

        <div className="flex gap-6 text-[16px] leading-[1.4] font-normal tracking-[-0.02em] text-[#595959]">
          <Link href={POLICY_META_BY_SLUG.service.path} className="press">
            이용약관
          </Link>
          <Link href={POLICY_META_BY_SLUG.privacy.path} className="press">
            개인정보처리방침
          </Link>
          <span>© 2026 Palang. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}
