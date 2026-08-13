import Link from 'next/link'

import { POLICY_META_BY_SLUG } from '@/app/_shared/terms/_data/policy.constant'
import Logo from '@/public/images/logo.svg'

export function LandingFooter() {
  return (
    <footer className="hidden bg-bg-alternative font-pretendard md:block md:h-60">
      <div className="mx-auto flex w-full max-w-[414px] flex-col justify-center gap-4 px-6 py-10 md:h-full md:w-[1280px] md:max-w-none md:px-0 md:py-0">
        <div className="flex flex-col gap-2">
          <Logo aria-label="Pallang" className="h-7 w-[75px] opacity-50" />
          <p className="text-[16px] leading-[1.4] font-normal tracking-[-0.02em] text-[#595959]">
            온라인 교환독서 서비스
          </p>
        </div>

        <p className="text-[16px] leading-[1.4] font-normal tracking-[-0.02em] text-[#595959]">
          문의 :{' '}
          <a href="mailto:palling.book@gmail.com" className="cursor-pointer">
            palling.book@gmail.com
          </a>
        </p>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[16px] leading-[1.4] font-normal tracking-[-0.02em] text-[#595959] md:flex-nowrap">
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
