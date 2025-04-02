import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import HeroSection from "@/components/hero-section"
import FeaturesSection from "@/components/features-section"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  )
}

