"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const isLoggedIn = pathname !== "/" && pathname !== "/login" && pathname !== "/signup"

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl text-emerald-700">BPIT</span>
          <span className="hidden sm:inline font-semibold">Attendance System</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className={`text-sm font-medium ${pathname === "/dashboard" ? "text-emerald-700" : "text-gray-600 hover:text-emerald-700"}`}
              >
                Dashboard
              </Link>
              <Link
                href="/register-student"
                className={`text-sm font-medium ${pathname === "/register-student" ? "text-emerald-700" : "text-gray-600 hover:text-emerald-700"}`}
              >
                Register Student
              </Link>
              <Link
                href="/take-attendance"
                className={`text-sm font-medium ${pathname === "/take-attendance" ? "text-emerald-700" : "text-gray-600 hover:text-emerald-700"}`}
              >
                Take Attendance
              </Link>
              <Link
                href="/view-attendance"
                className={`text-sm font-medium ${pathname === "/view-attendance" ? "text-emerald-700" : "text-gray-600 hover:text-emerald-700"}`}
              >
                View Attendance
              </Link>
              <Button variant="outline" className="ml-4">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t py-4">
          <div className="container mx-auto px-4 flex flex-col space-y-4">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium ${pathname === "/dashboard" ? "text-emerald-700" : "text-gray-600"}`}
                  onClick={toggleMenu}
                >
                  Dashboard
                </Link>
                <Link
                  href="/register-student"
                  className={`text-sm font-medium ${pathname === "/register-student" ? "text-emerald-700" : "text-gray-600"}`}
                  onClick={toggleMenu}
                >
                  Register Student
                </Link>
                <Link
                  href="/take-attendance"
                  className={`text-sm font-medium ${pathname === "/take-attendance" ? "text-emerald-700" : "text-gray-600"}`}
                  onClick={toggleMenu}
                >
                  Take Attendance
                </Link>
                <Link
                  href="/view-attendance"
                  className={`text-sm font-medium ${pathname === "/view-attendance" ? "text-emerald-700" : "text-gray-600"}`}
                  onClick={toggleMenu}
                >
                  View Attendance
                </Link>
                <Button variant="outline" className="w-full">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={toggleMenu}>
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link href="/signup" onClick={toggleMenu}>
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

