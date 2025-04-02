import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Get the formData from the request
    const formData = await req.formData();
    
    // Extract student details for logging
    const studentId = formData.get("studentId") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    
    // Log the registration request
    console.log("Received registration request:", { studentId, firstName, lastName });
    
    // Forward the request to the Python backend
    const pythonApiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:5000';
    const pythonResponse = await fetch(`${pythonApiUrl}/api/register`, {
      method: 'POST',
      body: formData,
    });
    
    // Get the response from Python backend
    const data = await pythonResponse.json();
    
    // Return the response
    return NextResponse.json(data, { status: pythonResponse.status });
    
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to register student" },
      { status: 500 }
    );
  }
} 