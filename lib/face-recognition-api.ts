"use client"

import { FaceDetectionInput } from './face-recognition';
import { ApiResponse } from '@/types/api';

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
 * Test connection to the Face Recognition API
 * @returns Promise with connection status
 */
export async function testApiConnection(): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_URL}/test-connection`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: data.message || 'Connection successful',
    };
  } catch (error) {
    console.error('Error testing API connection:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to connect to Face Recognition API',
    };
  }
}

/**
 * Detect faces in an image
 * @param imageBase64 - Base64 encoded image
 * @returns Promise with detected faces information
 */
export async function detectFaces(imageBase64: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_URL}/detect-faces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageBase64 }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: data.success,
      data: data.faces,
      message: data.message,
    };
  } catch (error) {
    console.error('Error detecting faces:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

/**
 * Register a student with face data
 * @param studentData - Student information
 * @param imageBase64 - Base64 encoded image of student's face
 * @returns Promise with registration result
 */
export async function registerStudent(studentData: any, imageBase64: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_URL}/register-face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentData,
        image: imageBase64,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: data.success,
      data,
      message: data.message,
    };
  } catch (error) {
    console.error('Error registering student:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

/**
 * Take attendance for a session
 * @param sessionData - Session information
 * @param imageBase64 - Base64 encoded image with student faces
 * @returns Promise with attendance result
 */
export async function takeAttendance(sessionData: any, imageBase64: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_URL}/take-attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionData,
        image: imageBase64,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: data.success,
      data: data.attendance,
      message: data.message,
    };
  } catch (error) {
    console.error('Error taking attendance:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

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