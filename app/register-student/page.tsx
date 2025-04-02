"use client"

import { useState, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Upload, Check } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import DashboardLayout from "@/components/dashboard-layout"
import WebcamCapture from "@/components/webcam-capture"
import { registerStudent } from "@/lib/face-recognition"
import { useRouter } from "next/navigation"

export default function RegisterStudentPage() {
  const router = useRouter();
  const [showCamera, setShowCamera] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceImage, setFaceImage] = useState<File | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    studentId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    batch: "",
    semester: "",
    department: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCapture = () => {
    setShowCamera(true);
  };

  const handlePhotoCapture = (imageData: string | File) => {
    // imageData will be a File object since we set returnAsFile to true in WebcamCapture
    if (imageData instanceof File) {
      setFaceImage(imageData);
      setPhotoTaken(true);
      setShowCamera(false);
    }
  };

  const handleCameraCancel = () => {
    setShowCamera(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (!faceImage) {
        throw new Error("Please capture a face image before registering");
      }
      
      // Call the API to register the student with face data
      const response = await registerStudent({
        ...formData,
        faceImage
      });
      
      if (!response.success) {
        throw new Error(response.message || "Failed to register student");
      }
      
      // Registration successful
      setRegistrationComplete(true);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPhotoTaken(false);
    setRegistrationComplete(false);
    setFaceImage(null);
    setFormData({
      studentId: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      batch: "",
      semester: "",
      department: ""
    });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Register New Student</h1>

        {registrationComplete ? (
          <Card>
            <CardContent className="pt-6">
              <Alert className="bg-emerald-50 border-emerald-200">
                <Check className="h-4 w-4 text-emerald-600" />
                <AlertTitle className="text-emerald-800">Registration Successful</AlertTitle>
                <AlertDescription className="text-emerald-700">
                  The student has been successfully registered in the system with facial recognition data.
                </AlertDescription>
              </Alert>

              <div className="mt-6 flex justify-end space-x-4">
                <Button variant="outline" onClick={handleReset}>
                  Register Another Student
                </Button>
                <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
              <CardDescription>
                Enter the student details and capture their facial data for attendance recognition
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-6 bg-red-50 border-red-200">
                  <AlertTitle className="text-red-800">Registration Error</AlertTitle>
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID</Label>
                      <Input 
                        id="studentId" 
                        placeholder="e.g., BPIT2023001" 
                        value={formData.studentId}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="student@example.com" 
                        value={formData.email}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        type="tel" 
                        placeholder="+91 98765 43210" 
                        value={formData.phone}
                        onChange={handleInputChange}
                        required 
                      />
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

                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select onValueChange={(value) => handleSelectChange("department", value)}>
                        <SelectTrigger id="department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cse">Computer Science Engineering</SelectItem>
                          <SelectItem value="it">Information Technology</SelectItem>
                          <SelectItem value="ece">Electronics & Communication</SelectItem>
                          <SelectItem value="eee">Electrical Engineering</SelectItem>
                          <SelectItem value="me">Mechanical Engineering</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Facial Recognition Data</Label>
                      
                      {showCamera ? (
                        <div className="border-2 border-dashed rounded-lg p-4">
                          <WebcamCapture
                            onCapture={handlePhotoCapture}
                            onCancel={handleCameraCancel}
                            captureButtonText="Take Photo"
                            returnAsFile={true}
                            fileName={`${formData.studentId || 'student'}_face.jpg`}
                          />
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-4 h-64 flex flex-col items-center justify-center">
                          {photoTaken ? (
                            <div className="text-center">
                              <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <Check className="h-12 w-12 text-emerald-600" />
                              </div>
                              <p className="text-emerald-600 font-medium">Photo captured successfully</p>
                              <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowCamera(true)}>
                                Retake Photo
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Camera className="h-12 w-12 text-gray-400 mb-4" />
                              <p className="text-gray-500 text-center mb-4">Capture student's face for recognition</p>
                              <div className="flex space-x-4">
                                <Button variant="outline" className="flex items-center gap-2" onClick={handleCapture}>
                                  <Camera className="h-4 w-4" />
                                  Capture Photo
                                </Button>
                                <Button variant="outline" className="flex items-center gap-2">
                                  <Upload className="h-4 w-4" />
                                  Upload Photo
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-2">
                        The facial data will be securely stored and used only for attendance purposes.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <textarea
                        id="notes"
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        placeholder="Any additional information about the student"
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!photoTaken || isLoading}>
                    {isLoading ? "Registering..." : "Register Student"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

