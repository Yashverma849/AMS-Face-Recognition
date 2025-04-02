"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut, User } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config"
import { useAuth } from "@/lib/auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const isLoggedIn = !!user || (pathname !== "/" && pathname !== "/login" && pathname !== "/signup")
  
  // For user name display
  const [displayName, setDisplayName] = useState<string>("")
  const [initials, setInitials] = useState<string>("")
  
  // Set display name when user changes
  useEffect(() => {
    if (user) {
      // Try to get name from user metadata
      const userName = user.user_metadata?.full_name || user.user_metadata?.name || "";
      
      // Fallback to email if no name exists
      const fallbackName = user.email ? user.email.split('@')[0] : "";
      
      // Set the display name
      const nameToDisplay = userName || fallbackName;
      setDisplayName(nameToDisplay);
      
      // Set initials for avatar
      if (userName) {
        // If we have a full name, use first letters of first and last name
        const nameParts = userName.split(' ');
        if (nameParts.length > 1) {
          setInitials(`${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase());
        } else {
          setInitials(nameParts[0].substring(0, 2).toUpperCase());
        }
      } else if (fallbackName) {
        // Use first 2 chars of email username
        setInitials(fallbackName.substring(0, 2).toUpperCase());
      } else {
        // Default fallback
        setInitials("U");
      }
      
      console.log("🔍 [NAVBAR] User logged in:", nameToDisplay);
    } else {
      setDisplayName("");
      setInitials("");
    }
  }, [user]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogout = async () => {
    try {
      const supabase = createClientComponentClient({
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_ANON_KEY,
      })
      
      console.log("🔍 [NAVBAR] Logging out user:", displayName);
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Force clear any session state
      window.localStorage.removeItem('supabase.auth.token')
      
      // Add a small delay before redirecting
      setTimeout(() => {
        // Navigate to home page with replace to prevent back button returning to protected page
        router.replace('/')
      }, 100)
    } catch (error) {
      console.error('❌ [NAVBAR] Error logging out:', error)
      // Try to redirect to homepage even if there's an error
      router.replace('/')
    }
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
              
              {displayName && (
                <div className="flex items-center ml-4 mr-2">
                  <Avatar className="h-8 w-8 bg-emerald-100 text-emerald-800">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {displayName}
                  </span>
                </div>
              )}
              
              <Button variant="outline" className="ml-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
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
                {displayName && (
                  <div className="flex items-center py-2 border-b border-gray-100 mb-2">
                    <Avatar className="h-8 w-8 bg-emerald-100 text-emerald-800">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {displayName}
                    </span>
                  </div>
                )}
                
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
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
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

