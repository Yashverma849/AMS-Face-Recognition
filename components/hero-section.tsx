import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Bhagwan Parshuram Institute of Technology</h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-emerald-700 mb-6">Attendance Management System</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
          Streamline attendance tracking with our advanced face recognition system. Designed specifically for BPIT to
          manage multiple batches, semesters, and student data efficiently.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Login
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

