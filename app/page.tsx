
import { IntroSection } from "../components/meusComponetes/Introsection";
import { AboutSection } from "@/components/meusComponetes/Aboutsection";
import { FeaturesSection } from "@/components/meusComponetes/Functionsection";
import {CommunitySection} from "@/components/meusComponetes/Comunitysection";

export default function Home() {
  return (
    <main className="min-h-screen">
      <IntroSection />
      <AboutSection/>
      <FeaturesSection/>
      <CommunitySection/>
    </main>
  )
}
