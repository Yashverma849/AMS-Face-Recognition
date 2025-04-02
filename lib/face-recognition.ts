// This file contains functions to communicate with the Python face recognition backend

// Types for student registration
export interface StudentRegistrationData {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  batch: string;
  semester: string;
  department: string;
  faceImage: File;
}

// Types for attendance session
export interface AttendanceSessionData {
  sessionId: string;
  courseName: string;
  date: string;
  capturedImage: File;
}

// Function to register a new student with face data
export async function registerStudent(data: StudentRegistrationData) {
  try {
    const formData = new FormData();
    
    // Add all student data to the form
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    // Call our API endpoint which will relay to Python backend
    const response = await fetch('/api/register', {
      method: 'POST',
      body: formData,
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error registering student:', error);
    throw error;
  }
}

// Function to process attendance using face recognition
export async function processAttendance(data: AttendanceSessionData) {
  try {
    const formData = new FormData();
    
    // Add all session data to the form
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    // Call our API endpoint which will relay to Python backend
    const response = await fetch('/api/attendance', {
      method: 'POST',
      body: formData,
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error processing attendance:', error);
    throw error;
  }
}

// Function to get all attendance records
export async function getAttendanceRecords() {
  try {
    const response = await fetch('/api/attendance');
    return await response.json();
  } catch (error) {
    console.error('Error getting attendance records:', error);
    throw error;
  }
}

// Function to get student information (single or all)
export async function getStudents(studentId?: string) {
  try {
    const url = studentId ? `/api/students?id=${studentId}` : '/api/students';
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('Error getting students:', error);
    throw error;
  }
} 