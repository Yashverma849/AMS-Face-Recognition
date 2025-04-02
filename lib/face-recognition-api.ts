"use client"

import { FaceDetectionInput } from './face-recognition';

// API client for the Python face recognition backend

export const API_URL = process.env.NEXT_PUBLIC_FACE_API_URL || 'http://localhost:8000';

/**
 * Convert a base64 image to a blob for API upload
 */
export const base64ToBlob = (base64: string, type = 'image/jpeg'): Blob => {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([ab], { type });
};

/**
 * Detect faces in the provided image
 */
export const detectFaces = async (imageData: string): Promise<any> => {
  try {
    console.log("🔍 Detecting faces with API at:", API_URL);
    
    const formData = new FormData();
    const blob = base64ToBlob(imageData);
    formData.append('image', blob, 'image.jpg');
    
    const response = await fetch(`${API_URL}/detect-faces`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error detecting faces:', error);
    throw error;
  }
};

/**
 * Register a new student face
 */
export const registerFace = async (imageData: string, studentId: string, name: string): Promise<any> => {
  try {
    console.log(`🔍 Registering face for student ${studentId} with API at:`, API_URL);
    
    const formData = new FormData();
    const blob = base64ToBlob(imageData);
    formData.append('image', blob, 'image.jpg');
    formData.append('student_id', studentId);
    formData.append('name', name);
    
    const response = await fetch(`${API_URL}/register-face`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error registering face:', error);
    throw error;
  }
};

/**
 * Recognize faces in the provided image
 */
export const recognizeFaces = async (imageData: string): Promise<any> => {
  try {
    console.log("🔍 Recognizing faces with API at:", API_URL);
    
    const formData = new FormData();
    const blob = base64ToBlob(imageData);
    formData.append('image', blob, 'image.jpg');
    
    const response = await fetch(`${API_URL}/recognize-faces`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error recognizing faces:', error);
    throw error;
  }
};

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