import { LandingFaqSection } from './_components/LandingFaqSection/LandingFaqSection'
import { LandingFinalCtaSection } from './_components/LandingFinalCtaSection/LandingFinalCtaSection'
import { LandingFooter } from './_components/LandingFooter/LandingFooter'
import { LandingHeroSection } from './_components/LandingHeroSection/LandingHeroSection'
import { LandingHowItWorksSection } from './_components/LandingHowItWorksSection/LandingHowItWorksSection'
import { LandingProblemSection } from './_components/LandingProblemSection/LandingProblemSection'
import { LandingProgressSection } from './_components/LandingProgressSection/LandingProgressSection'
import { LandingTeamReadingSection } from './_components/LandingTeamReadingSection/LandingTeamReadingSection'

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-bg-default text-text-primary">
      <LandingHeroSection />
      <LandingProblemSection />
      <LandingTeamReadingSection />
      <LandingHowItWorksSection />
      <LandingProgressSection />
      <LandingFaqSection />
      <LandingFinalCtaSection />
      <LandingFooter />
    </main>
  )
}
