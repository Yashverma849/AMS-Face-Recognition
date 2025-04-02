import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    
    // Forward the request to the Python backend
    const pythonApiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:5000';
    let pythonUrl = `${pythonApiUrl}/api/students`;
    
    // If ID is provided, include it in the request
    if (id) {
      pythonUrl += `?id=${id}`;
    }
    
    // Send request to Python backend
    const pythonResponse = await fetch(pythonUrl);
    
    // Get the response from Python backend
    const data = await pythonResponse.json();
    
    // Return the response
    return NextResponse.json(data, { status: pythonResponse.status });
    
  } catch (error) {
    console.error("Error retrieving student data:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve student data" },
      { status: 500 }
    );
  }
} 