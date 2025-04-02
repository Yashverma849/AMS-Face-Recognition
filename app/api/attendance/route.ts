import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Get the formData from the request
    const formData = await req.formData();
    
    // Extract session details for logging
    const sessionId = formData.get("sessionId") as string;
    const courseName = formData.get("courseName") as string;
    const date = formData.get("date") as string;
    
    // Log the attendance processing request
    console.log("Processing attendance for session:", { sessionId, courseName, date });
    
    // Forward the request to the Python backend
    const pythonApiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:5000';
    const pythonResponse = await fetch(`${pythonApiUrl}/api/attendance`, {
      method: 'POST',
      body: formData,
    });
    
    // Get the response from Python backend
    const data = await pythonResponse.json();
    
    // Return the response
    return NextResponse.json(data, { status: pythonResponse.status });
    
  } catch (error) {
    console.error("Attendance processing error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process attendance" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Forward the request to the Python backend
    const pythonApiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:5000';
    const pythonResponse = await fetch(`${pythonApiUrl}/api/attendance`);
    
    // Get the response from Python backend
    const data = await pythonResponse.json();
    
    // Return the response
    return NextResponse.json(data, { status: pythonResponse.status });
    
  } catch (error) {
    console.error("Error retrieving attendance records:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve attendance records" },
      { status: 500 }
    );
  }
} 