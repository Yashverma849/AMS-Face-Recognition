"use client"

import { useState, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Check, UserCheck, UserX } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import DashboardLayout from "@/components/dashboard-layout"
import WebcamCapture from "@/components/webcam-capture"
import { processAttendance } from "@/lib/face-recognition"
import { useRouter } from "next/navigation"

// Type for the student attendance record
interface Student {
  student_id: string;
  name: string;
  status: "present" | "absent";
  confidence: number;
}

// Type for the attendance result
interface AttendanceResult {
  sessionId: string;
  date: string;
  timestamp: string;
  stats: {
    present: number;
    absent: number;
    total: number;
    percentagePresent: number;
  };
  students: Student[];
}

export default function TakeAttendancePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<File | null>(null);

  // Session form data
  const [sessionData, setSessionData] = useState({
    sessionName: "",
    course: "",
    batch: "",
    semester: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    location: ""
  });

  // Attendance results
  const [attendanceResults, setAttendanceResults] = useState<AttendanceResult | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSessionData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setSessionData(prev => ({ ...prev, [name]: value }));
  };

  const handleStartScan = () => {
    setShowCamera(true);
  };

  const handlePhotoCapture = (imageData: string | File) => {
    if (imageData instanceof File) {
      setCapturedImage(imageData);
      setShowCamera(false);
      processAttendanceWithImage(imageData);
    }
  };

  const handleCameraCancel = () => {
    setShowCamera(false);
  };

  const processAttendanceWithImage = async (image: File) => {
    setIsScanning(true);
    setScanProgress(0);
    setError(null);

    // Progress simulation
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        const newProgress = prev + 5;
        return newProgress <= 95 ? newProgress : 95;
      });
    }, 200);

    try {
      // Create a unique session ID
      const sessionId = `session_${Date.now()}`;

      // Call the API to process attendance
      const response = await processAttendance({
        sessionId,
        courseName: sessionData.course,
        date: sessionData.date,
        capturedImage: image
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to process attendance");
      }

      // Set the final progress and mark as complete
      setScanProgress(100);
      setScanComplete(true);
      setAttendanceResults(response.data);
      
    } catch (err) {
      console.error("Attendance processing error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      clearInterval(progressInterval);
      setIsScanning(false);
    }
  };

  const handleSaveAttendance = () => {
    // In a real app, this would save the attendance data to a database if not already done
    setStep(3);
  };

  const handleReset = () => {
    setStep(1);
    setScanComplete(false);
    setScanProgress(0);
    setCapturedImage(null);
    setAttendanceResults(null);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Take Attendance</h1>

        {step === 3 ? (
          <Card>
            <CardContent className="pt-6">
              <Alert className="bg-emerald-50 border-emerald-200">
                <Check className="h-4 w-4 text-emerald-600" />
                <AlertTitle className="text-emerald-800">Attendance Recorded Successfully</AlertTitle>
                <AlertDescription className="text-emerald-700">
                  The attendance has been successfully recorded for this session.
                </AlertDescription>
              </Alert>

              <div className="mt-6 flex justify-end space-x-4">
                <Button variant="outline" onClick={handleReset}>
                  Take Another Attendance
                </Button>
                <Button onClick={() => router.push("/view-attendance")}>View Attendance Records</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Face Recognition Attendance</CardTitle>
              <CardDescription>Set up the session details and scan students' faces to mark attendance</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-6 bg-red-50 border-red-200">
                  <AlertTitle className="text-red-800">Processing Error</AlertTitle>
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="sessionName">Session Name</Label>
                        <Input 
                          id="sessionName" 
                          placeholder="e.g., Morning Lecture" 
                          value={sessionData.sessionName}
                          onChange={handleInputChange}
                          required 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="course">Course</Label>
                        <Select onValueChange={(value) => handleSelectChange("course", value)}>
                          <SelectTrigger id="course">
                            <SelectValue placeholder="Select course" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cs101">CS101 - Introduction to Programming</SelectItem>
                            <SelectItem value="cs201">CS201 - Data Structures</SelectItem>
                            <SelectItem value="cs301">CS301 - Database Management</SelectItem>
                            <SelectItem value="cs401">CS401 - Computer Networks</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="batch">Batch</Label>
                          <Select onValueChange={(value) => handleSelectChange("batch", value)}>
                            <SelectTrigger id="batch">
                              <SelectValue placeholder="Select batch" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2020-2024">2020-2024</SelectItem>
                              <SelectItem value="2021-2025">2021-2025</SelectItem>
                              <SelectItem value="2022-2026">2022-2026</SelectItem>
                              <SelectItem value="2023-2027">2023-2027</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="semester">Semester</Label>
                          <Select onValueChange={(value) => handleSelectChange("semester", value)}>
                            <SelectTrigger id="semester">
                              <SelectValue placeholder="Select semester" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Semester 1</SelectItem>
                              <SelectItem value="2">Semester 2</SelectItem>
                              <SelectItem value="3">Semester 3</SelectItem>
                              <SelectItem value="4">Semester 4</SelectItem>
                              <SelectItem value="5">Semester 5</SelectItem>
                              <SelectItem value="6">Semester 6</SelectItem>
                              <SelectItem value="7">Semester 7</SelectItem>
                              <SelectItem value="8">Semester 8</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input 
                          id="date" 
                          type="date" 
                          value={sessionData.date}
                          onChange={handleInputChange}
                          required 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startTime">Start Time</Label>
                          <Input 
                            id="startTime" 
                            type="time" 
                            value={sessionData.startTime}
                            onChange={handleInputChange}
                            required 
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="endTime">End Time</Label>
                          <Input 
                            id="endTime" 
                            type="time" 
                            value={sessionData.endTime}
                            onChange={handleInputChange}
                            required 
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input 
                          id="location" 
                          placeholder="e.g., Room 301" 
                          value={sessionData.location}
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => setStep(2)}>Next: Scan Students</Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="border-2 border-dashed rounded-lg p-6">
                    {showCamera ? (
                      <div className="py-4">
                        <WebcamCapture
                          onCapture={handlePhotoCapture}
                          onCancel={handleCameraCancel}
                          captureButtonText="Capture Class"
                          returnAsFile={true}
                          fileName={`attendance_${sessionData.date}.jpg`}
                          width={640}
                          height={480}
                        />
                      </div>
                    ) : !isScanning && !scanComplete ? (
                      <div className="text-center py-8">
                        <Camera className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Ready to Scan</h3>
                        <p className="text-gray-500 mb-6">
                          Position the camera to capture all students in the classroom. The system will automatically
                          recognize faces and mark attendance.
                        </p>
                        <Button size="lg" onClick={handleStartScan}>
                          Start Scanning
                        </Button>
                      </div>
                    ) : isScanning ? (
                      <div className="text-center py-8">
                        <div className="w-full h-48 bg-gray-800 rounded-md mb-6 flex items-center justify-center">
                          <Camera className="h-16 w-16 text-white animate-pulse" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Scanning in Progress</h3>
                        <p className="text-gray-500 mb-4">
                          Please wait while the system scans and recognizes all students...
                        </p>
                        <Progress value={scanProgress} className="h-2 mb-2" />
                        <p className="text-sm text-gray-500">{scanProgress}% complete</p>
                      </div>
                    ) : (
                      scanComplete && attendanceResults && (
                        <div className="py-4">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold">Scan Results</h3>
                            <div className="flex items-center space-x-6">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                                <span className="text-sm">Present: {attendanceResults.stats.present}</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                                <span className="text-sm">Absent: {attendanceResults.stats.absent}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-sm font-medium">Total: {attendanceResults.stats.total}</span>
                              </div>
                            </div>
                          </div>

                          <div className="border rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    Student ID
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    Name
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    Status
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    Confidence
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {attendanceResults.students.map((student, idx) => (
                                  <tr key={idx}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {student.student_id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          student.status === "present"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {student.status === "present" ? (
                                          <UserCheck className="h-4 w-4 mr-1" />
                                        ) : (
                                          <UserX className="h-4 w-4 mr-1" />
                                        )}
                                        {student.status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {student.status === "present"
                                        ? `${(student.confidence * 100).toFixed(1)}%`
                                        : "-"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="mt-6 flex justify-end">
                            <Button onClick={handleSaveAttendance}>Save Attendance</Button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

