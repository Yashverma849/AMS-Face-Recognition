# BPIT Attendance System

A face recognition-based attendance system for Bhagwan Parshuram Institute of Technology.

## Features

- User authentication with Supabase
- Student registration with face encoding
- Automated attendance using face recognition
- Dashboard for attendance statistics
- Secure data storage in Supabase
- Hybrid face recognition (browser-based or API-based)

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Face Recognition (Browser)**: TensorFlow.js, BlazeFace
- **Face Recognition (API)**: Python, OpenCV, face_recognition
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **API Backend**: FastAPI

## Deployment Architecture

The system uses a hybrid approach for face recognition:

1. **Browser-based detection**: Using TensorFlow.js models that run directly in the browser
2. **API-based detection**: Using a Python FastAPI backend with OpenCV for more accurate detection

This dual approach ensures the system works even when the Python API is not available, providing redundancy and flexibility.

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+ (for API server)
- Supabase account

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL in `database_schema.sql` in the Supabase SQL editor
3. Create two storage buckets: `student-images` and `attendance-images`
4. Set up authentication providers (Email, Google OAuth)
5. Get your Supabase URL and keys from the Settings → API section

### Environment Setup

1. Copy `.env.example` to `.env.local` and fill in your details:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_FACE_API_URL=http://localhost:8000
```

### Installation

1. **Frontend**:
   ```bash
   npm install
   npm run dev
   ```

2. **API Backend**:
   ```bash
   cd api
   
   # Option 1: Using pip directly
   pip install -r requirements.txt
   
   # Option 2: Using virtual environment (recommended)
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Start the server
   python -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```

3. **Quick Start Script**:
   Use the provided script to start both frontend and backend:
   ```bash
   # On Windows
   start_app.bat
   
   # On macOS/Linux
   ./start_app.sh
   ```

## Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add these environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_FACE_API_URL` (pointer to your Python API)

### API Backend (Render)

1. Sign up for a Render.com account
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure as:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Environment Variables:
     - Set `PYTHON_VERSION` to `3.10.0`
5. Deploy the `api` directory

## Testing

You can test the face recognition API independently using the provided test page:

```
https://your-deployed-site.vercel.app/test.html
```

This test page allows you to:
1. Check connection to the API
2. Capture images from your camera
3. Test face detection directly with the API

## Security Notes

- **NEVER** commit environment files (.env) with real credentials
- **NEVER** use the service role key in frontend code
- Ensure proper authentication for all API endpoints

## License

[MIT License](LICENSE)

## Contributors

- [Yash Verma](https://github.com/Yashverma849)

## Deployment Instructions

This project consists of two parts:
1. **Next.js Frontend**: Automatically deployed to Vercel
2. **Python Backend API**: Must be deployed separately

### Frontend Deployment

The frontend is configured to deploy automatically to Vercel and excludes the Python API code.

### Python API Deployment

The Python API requires:
- Python 3.8+ with build tools
- OpenCV and face_recognition libraries

**Option 1: Run API on a server (recommended)**
1. Set up a server with Python and required dependencies
2. Clone the repository
3. Install dependencies: `cd api && pip install -r requirements.txt`
4. Run the server: `python -m uvicorn main:app --host 0.0.0.0 --port 8000`
5. Set the environment variable `NEXT_PUBLIC_FACE_API_URL` to your API URL in Vercel

**Option 2: Use a serverless Python provider**
- Deploy to a service like AWS Lambda, Google Cloud Functions, or Render that supports Python APIs

## Local Development

To run the application locally:
1. Start the Python API: 
   ```
   cd api
   pip install -r requirements.txt
   python -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```

2. In a separate terminal, start the Next.js frontend:
   ```
   npm install
   npm run dev
   ```

Alternatively, use the provided start script:
```
start_app.bat
```

## Important Notes

- Vercel cannot build Python packages with binary dependencies
- For production, deploy the API on a separate service and update the API URL 