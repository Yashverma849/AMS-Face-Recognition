import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">BPIT Attendance System</h3>
            <p className="text-gray-300">
              Bhagwan Parshuram Institute of Technology
              <br />
              Sector 17, Rohini, Delhi-110089
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-300 hover:text-white">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-gray-300 hover:text-white">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-white">
                  Help & Support
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-300">
              <li>Email: info@bpitattendance.edu</li>
              <li>Phone: +91 11 2702 1992</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} BPIT Attendance System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

