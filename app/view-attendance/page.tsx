"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Filter, Search, Calendar, User } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

export default function ViewAttendancePage() {
  const [activeTab, setActiveTab] = useState("sessions")

  // Mock data for attendance sessions
  const sessions = [
    {
      id: "S001",
      name: "Morning Lecture",
      course: "CS101 - Introduction to Programming",
      date: "2023-04-02",
      time: "09:00 - 10:30",
      present: 42,
      absent: 8,
      total: 50,
    },
    {
      id: "S002",
      name: "Lab Session",
      course: "CS201 - Data Structures",
      date: "2023-04-01",
      time: "14:00 - 16:00",
      present: 38,
      absent: 12,
      total: 50,
    },
    {
      id: "S003",
      name: "Tutorial",
      course: "CS301 - Database Management",
      date: "2023-03-31",
      time: "11:00 - 12:30",
      present: 45,
      absent: 5,
      total: 50,
    },
    {
      id: "S004",
      name: "Project Discussion",
      course: "CS401 - Computer Networks",
      date: "2023-03-30",
      time: "15:30 - 17:00",
      present: 40,
      absent: 10,
      total: 50,
    },
    {
      id: "S005",
      name: "Guest Lecture",
      course: "CS501 - Artificial Intelligence",
      date: "2023-03-29",
      time: "10:00 - 11:30",
      present: 48,
      absent: 2,
      total: 50,
    },
  ]

  // Mock data for student attendance
  const students = [
    { id: "BPIT2023001", name: "Rahul Sharma", department: "CSE", batch: "2020-2024", attendance: 92 },
    { id: "BPIT2023002", name: "Priya Patel", department: "IT", batch: "2020-2024", attendance: 88 },
    { id: "BPIT2023003", name: "Amit Kumar", department: "ECE", batch: "2021-2025", attendance: 95 },
    { id: "BPIT2023004", name: "Sneha Gupta", department: "CSE", batch: "2021-2025", attendance: 78 },
    { id: "BPIT2023005", name: "Vikram Singh", department: "ME", batch: "2022-2026", attendance: 85 },
    { id: "BPIT2023006", name: "Neha Verma", department: "EEE", batch: "2022-2026", attendance: 90 },
    { id: "BPIT2023007", name: "Raj Malhotra", department: "CSE", batch: "2023-2027", attendance: 82 },
    { id: "BPIT2023008", name: "Ananya Desai", department: "IT", batch: "2023-2027", attendance: 94 },
  ]

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-3xl font-bold mb-4 md:mb-0">Attendance Records</h1>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Tabs defaultValue="sessions" className="space-y-6" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Students
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filter Sessions</CardTitle>
                <CardDescription>Search and filter attendance sessions by various criteria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course-filter">Course</Label>
                    <Select>
                      <SelectTrigger id="course-filter">
                        <SelectValue placeholder="All Courses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        <SelectItem value="cs101">CS101 - Introduction to Programming</SelectItem>
                        <SelectItem value="cs201">CS201 - Data Structures</SelectItem>
                        <SelectItem value="cs301">CS301 - Database Management</SelectItem>
                        <SelectItem value="cs401">CS401 - Computer Networks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date-from">From Date</Label>
                    <Input id="date-from" type="date" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date-to">To Date</Label>
                    <Input id="date-to" type="date" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session-search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input id="session-search" placeholder="Search sessions..." className="pl-8" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Sessions</CardTitle>
                <CardDescription>View all attendance sessions and their details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Session
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Course
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Date & Time
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Attendance
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sessions.map((session) => (
                        <tr key={session.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{session.name}</div>
                            <div className="text-sm text-gray-500">ID: {session.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.course}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{session.date}</div>
                            <div className="text-sm text-gray-500">{session.time}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-emerald-600 h-2.5 rounded-full"
                                  style={{ width: `${(session.present / session.total) * 100}%` }}
                                ></div>
                              </div>
                              <span className="ml-2 text-sm text-gray-500">
                                {session.present}/{session.total}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button variant="link" className="text-emerald-600 hover:text-emerald-700">
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filter Students</CardTitle>
                <CardDescription>Search and filter students by various criteria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department-filter">Department</Label>
                    <Select>
                      <SelectTrigger id="department-filter">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="cse">Computer Science Engineering</SelectItem>
                        <SelectItem value="it">Information Technology</SelectItem>
                        <SelectItem value="ece">Electronics & Communication</SelectItem>
                        <SelectItem value="eee">Electrical Engineering</SelectItem>
                        <SelectItem value="me">Mechanical Engineering</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="batch-filter">Batch</Label>
                    <Select>
                      <SelectTrigger id="batch-filter">
                        <SelectValue placeholder="All Batches" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Batches</SelectItem>
                        <SelectItem value="2020-2024">2020-2024</SelectItem>
                        <SelectItem value="2021-2025">2021-2025</SelectItem>
                        <SelectItem value="2022-2026">2022-2026</SelectItem>
                        <SelectItem value="2023-2027">2023-2027</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attendance-filter">Attendance</Label>
                    <Select>
                      <SelectTrigger id="attendance-filter">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="above-90">Above 90%</SelectItem>
                        <SelectItem value="75-90">75% - 90%</SelectItem>
                        <SelectItem value="below-75">Below 75% (Shortage)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student-search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input id="student-search" placeholder="Search by name or ID..." className="pl-8" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Attendance</CardTitle>
                <CardDescription>View attendance records for all students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Student
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Department
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Batch
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Attendance %
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">ID: {student.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.department}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.batch}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className={`h-2.5 rounded-full ${
                                    student.attendance >= 90
                                      ? "bg-emerald-600"
                                      : student.attendance >= 75
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                  }`}
                                  style={{ width: `${student.attendance}%` }}
                                ></div>
                              </div>
                              <span className="ml-2 text-sm text-gray-500">{student.attendance}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button variant="link" className="text-emerald-600 hover:text-emerald-700">
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

