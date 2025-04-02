import { UserPlus, Camera, BarChart3, Users, Calendar, BookOpen, Shield, Clock } from "lucide-react"

export default function FeaturesSection() {
  const features = [
    {
      icon: <UserPlus className="h-10 w-10 text-emerald-600" />,
      title: "Easy Student Registration",
      description: "Register students with their facial data quickly and securely",
    },
    {
      icon: <Camera className="h-10 w-10 text-emerald-600" />,
      title: "Face Recognition",
      description: "Take attendance automatically using advanced facial recognition technology",
    },
    {
      icon: <BarChart3 className="h-10 w-10 text-emerald-600" />,
      title: "Comprehensive Reports",
      description: "Generate and view detailed attendance reports for any time period",
    },
    {
      icon: <Users className="h-10 w-10 text-emerald-600" />,
      title: "Batch Management",
      description: "Organize students by batches for better management",
    },
    {
      icon: <Calendar className="h-10 w-10 text-emerald-600" />,
      title: "Semester Tracking",
      description: "Track attendance across different semesters seamlessly",
    },
    {
      icon: <BookOpen className="h-10 w-10 text-emerald-600" />,
      title: "Course Integration",
      description: "Link attendance with specific courses and subjects",
    },
    {
      icon: <Shield className="h-10 w-10 text-emerald-600" />,
      title: "Secure Data",
      description: "All student data and facial information is securely stored and encrypted",
    },
    {
      icon: <Clock className="h-10 w-10 text-emerald-600" />,
      title: "Real-time Updates",
      description: "Attendance records are updated in real-time for immediate access",
    },
  ]

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-50 p-6 rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

