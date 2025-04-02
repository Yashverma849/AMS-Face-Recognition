"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import DashboardLayout from "@/components/dashboard-layout"
import { Users, UserPlus, Camera, BarChart3, Clock } from "lucide-react"
import { withAuth } from "@/lib/auth"
import { User } from '@supabase/supabase-js'

interface DashboardPageProps {
  user: User;
}

function DashboardPage({ user }: DashboardPageProps) {
  // Mock data for dashboard stats
  const stats = [
    {
      title: "Total Students",
      value: "1,248",
      description: "Across all batches",
      icon: <Users className="h-8 w-8 text-emerald-600" />,
      change: "+12% from last month",
    },
    {
      title: "Today's Attendance",
      value: "87%",
      description: "Average across all classes",
      icon: <Clock className="h-8 w-8 text-emerald-600" />,
      change: "+3% from yesterday",
    },
    {
      title: "Recent Registrations",
      value: "24",
      description: "New students this week",
      icon: <UserPlus className="h-8 w-8 text-emerald-600" />,
      change: "+8 from last week",
    },
    {
      title: "Attendance Sessions",
      value: "156",
      description: "Total sessions this month",
      icon: <Camera className="h-8 w-8 text-emerald-600" />,
      change: "+32 from last month",
    },
  ]

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div>
            <span className="text-sm text-gray-500 mr-2">Welcome,</span>
            <span className="font-medium">{user.email}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                <p className="text-xs text-emerald-600 mt-2">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
              <CardDescription>Attendance trends for the past 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-md border border-dashed border-gray-200">
                <p className="text-gray-500">Attendance chart will be displayed here</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks you can perform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/register-student">
                <Button className="w-full flex items-center justify-start gap-2">
                  <UserPlus className="h-4 w-4" />
                  Register New Student
                </Button>
              </Link>
              <Link href="/take-attendance">
                <Button className="w-full flex items-center justify-start gap-2">
                  <Camera className="h-4 w-4" />
                  Take Attendance
                </Button>
              </Link>
              <Link href="/view-attendance">
                <Button className="w-full flex items-center justify-start gap-2">
                  <BarChart3 className="h-4 w-4" />
                  View Reports
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default withAuth(DashboardPage);

