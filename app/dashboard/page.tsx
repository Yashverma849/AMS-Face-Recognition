"use client"

import React, { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UserPlus, Users, Clock, PlusCircle } from 'lucide-react'
import DashboardLayout from '@/components/dashboard-layout'

interface DashboardPageProps {
  user: User
}

interface AttendanceSession {
  id: string
  session_name: string
  timestamp: string
  student_count: number
}

interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  created_at: string
}

function DashboardPage({ user }: DashboardPageProps) {
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()
        
        // Fetch recent attendance sessions
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('session_id, session_name, timestamp, student_id')
          .order('timestamp', { ascending: false })
          .limit(100)
        
        if (attendanceError) {
          console.warn("Attendance fetch warning:", attendanceError)
          // Continue execution, don't throw
        }
        
        // Group by session and count students
        const sessionMap = new Map<string, AttendanceSession>()
        if (attendanceData && attendanceData.length > 0) {
          attendanceData.forEach((record: {
            session_id: string;
            session_name: string;
            timestamp: string;
            student_id: string;
          }) => {
            if (!sessionMap.has(record.session_id)) {
              sessionMap.set(record.session_id, {
                id: record.session_id,
                session_name: record.session_name,
                timestamp: record.timestamp,
                student_count: 0
              })
            }
            
            const session = sessionMap.get(record.session_id)!
            session.student_count++
          })
        }
        
        // Convert to array and sort by timestamp
        const recentSessions = Array.from(sessionMap.values())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5)
        
        setSessions(recentSessions)
        
        // Fetch recent students
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('id, first_name, last_name, email, created_at')
          .order('created_at', { ascending: false })
          .limit(5)
        
        if (studentsError) {
          console.warn("Students fetch warning:", studentsError)
          // Continue execution, don't throw
        }
        
        setStudents(studentsData || [])
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('Something went wrong while loading the dashboard')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Students Registered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-md font-medium truncate">{user.email}</div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance Sessions</CardTitle>
              <CardDescription>Latest attendance records from the system</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 text-center py-4">{error}</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="mx-auto h-12 w-12 mb-2 text-gray-400" />
                  <h3 className="text-lg font-medium mb-1">No attendance sessions yet</h3>
                  <p className="mb-4">Take attendance to see records here</p>
                  <Button asChild>
                    <Link href="/take-attendance">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Take Attendance
                    </Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Students</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{session.session_name}</TableCell>
                        <TableCell>
                          {new Date(session.timestamp).toLocaleDateString()} {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell>{session.student_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/view-attendance">View All Sessions</Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recently Registered Students</CardTitle>
              <CardDescription>Latest student registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 text-center py-4">{error}</div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="mx-auto h-12 w-12 mb-2 text-gray-400" />
                  <h3 className="text-lg font-medium mb-1">No students registered yet</h3>
                  <p className="mb-4">Register students to see them here</p>
                  <Button asChild>
                    <Link href="/register-student">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Register Student
                    </Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.first_name} {student.last_name}</TableCell>
                        <TableCell>{student.id}</TableCell>
                        <TableCell className="truncate max-w-[200px]">{student.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/register-student">Register New Student</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="flex gap-4 mt-8">
          <Button asChild size="lg" className="flex-1">
            <Link href="/register-student">
              <UserPlus className="mr-2 h-5 w-5" />
              Register Student
            </Link>
          </Button>
          <Button asChild size="lg" className="flex-1">
            <Link href="/take-attendance">
              <Users className="mr-2 h-5 w-5" />
              Take Attendance
            </Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default withAuth(DashboardPage)

