"use client"

import { FaceDetectionInput } from './face-recognition';

// API endpoint URL
const API_URL = process.env.NEXT_PUBLIC_FACE_API_URL || 'http://localhost:8000';

/**
 * Convert image to base64
 */
export async function convertToBase64(input: FaceDetectionInput): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // If input is already a canvas
      if (input instanceof HTMLCanvasElement) {
        const dataUrl = input.toDataURL('image/jpeg', 0.9);
        resolve(dataUrl);
        return;
      }
      
      // If input is an image or video, draw to temp canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Set canvas dimensions
      if (input instanceof HTMLVideoElement) {
        canvas.width = input.videoWidth;
        canvas.height = input.videoHeight;
        context.drawImage(input, 0, 0, canvas.width, canvas.height);
      } else if (input instanceof HTMLImageElement) {
        canvas.width = input.width;
        canvas.height = input.height;
        context.drawImage(input, 0, 0, canvas.width, canvas.height);
      } else {
        reject(new Error('Unsupported input type'));
        return;
      }
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      resolve(dataUrl);
    } catch (error) {
      console.error('Error converting to base64:', error);
      reject(error);
    }
  });
}

/**
 * Detect faces in an image using the Python API
 */
export async function detectFaces(input: FaceDetectionInput) {
  try {
    console.log('Detecting faces via Python API...');
    
    // Convert input to base64
    const base64Image = await convertToBase64(input);
    
    // Send to API
    const response = await fetch(`${API_URL}/api/detect-faces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to detect faces');
    }
    
    const data = await response.json();
    console.log('Face detection response:', data);
    
    if (!data.success) {
      throw new Error(data.message || 'Face detection failed');
    }
    
    return data.faces;
  } catch (error) {
    console.error('Error in API face detection:', error);
    return [];
  }
}

/**
 * Register a student with their face using the Python API
 */
export async function registerStudentWithFace(studentData: any, faceImage: FaceDetectionInput) {
  try {
    console.log('Registering student via Python API...');
    
    // Convert face image to base64
    const base64Image = await convertToBase64(faceImage);
    
    // Send to API
    const response = await fetch(`${API_URL}/api/register-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentData,
        image: base64Image,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to register student');
    }
    
    const data = await response.json();
    console.log('Student registration response:', data);
    
    if (!data.success) {
      throw new Error(data.message || 'Student registration failed');
    }
    
    return data;
  } catch (error) {
    console.error('Error in API student registration:', error);
    throw error;
  }
}

/**
 * Take attendance using the Python API
 */
export async function takeAttendance(sessionData: any, image: FaceDetectionInput) {
  try {
    console.log('Taking attendance via Python API...');
    
    // Convert image to base64
    const base64Image = await convertToBase64(image);
    
    // Send to API
    const response = await fetch(`${API_URL}/api/take-attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionData,
        image: base64Image,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to take attendance');
    }
    
    const data = await response.json();
    console.log('Attendance response:', data);
    
    if (!data.success) {
      throw new Error(data.message || 'Attendance taking failed');
    }
    
    return {
      recognizedStudents: data.recognizedStudents || []
    };
  } catch (error) {
    console.error('Error in API attendance:', error);
    throw error;
  }
} 