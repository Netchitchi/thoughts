
import { IntroSection } from "../components/meusComponetes/Introsection";
import { AboutSection } from "@/components/meusComponetes/Aboutsection";
import { FeaturesSection } from "@/components/meusComponetes/Functionsection";
import {CommunitySection} from "@/components/meusComponetes/Comunitysection";
import { Navbar } from "@/components/meusComponetes/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <IntroSection />
      <AboutSection/>
      <FeaturesSection/>
      <CommunitySection/>
      
    </main>
  )
}
